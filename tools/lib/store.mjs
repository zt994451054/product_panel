// Event store: reads event files from the working tree and from every local and remote branch, writes new ones.
// Zero dependencies: Node built-ins plus the local git binary.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { userInfo } from 'node:os'
import { join } from 'node:path'

const EVENT_PATH = /^(?:state\/events|versions\/([^/]+)\/state\/events)\/([^/]+)\.json$/
const COMMON = ['id', 'type', 'at', 'recorded_at', 'recorded_by', 'by']
export const PROJECT_TYPES = ['project_init', 'project_update', 'member_add', 'member_update', 'member_deactivate', 'setting_set', 'config_set', 'module_set', 'deploy', 'void']
export const VERSION_TYPES = ['version_create', 'version_update', 'replan', 'onboard', 'stage_enter', 'progress', 'block', 'unblock', 'gate_check', 'signoff_request', 'stage_complete', 'stage_rollback', 'hold', 'resume', 'abandon', 'downstream_check', 'item_add', 'item_status', 'defect_open', 'defect_status', 'defect_waive', 'void']

export function git(root, args, opts = {}) {
  try { return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], maxBuffer: 1 << 28, ...opts }) } catch { return null }
}

const eventDir = (root, scope) => scope === 'project' ? join(root, 'state', 'events') : join(root, 'versions', scope, 'state', 'events')
const relPath = (scope, id) => (scope === 'project' ? 'state/events' : `versions/${scope}/state/events`) + `/${id}.json`

function worktreeFiles(root) {
  const out = [], unknown = []
  const scan = (scope) => {
    const dir = eventDir(root, scope)
    if (!existsSync(dir)) return
    for (const f of readdirSync(dir)) {
      if (f.endsWith('.json')) out.push({ path: relPath(scope, f.slice(0, -5)), text: readFileSync(join(dir, f), 'utf8') })
      else if (f !== '.gitkeep') unknown.push(`${scope === 'project' ? 'state/events' : `versions/${scope}/state/events`}/${f}`)
    }
  }
  scan('project')
  const vdir = join(root, 'versions')
  if (existsSync(vdir)) for (const v of readdirSync(vdir, { withFileTypes: true })) if (v.isDirectory()) scan(v.name)
  return { out, unknown }
}

// One `git cat-file --batch` call for all blobs.
function readBlobs(root, shas) {
  const map = new Map()
  if (!shas.length) return map
  const buf = git(root, ['cat-file', '--batch'], { input: Buffer.from(shas.join('\n') + '\n'), encoding: 'buffer' })
  if (!buf) return map
  let i = 0
  while (i < buf.length) {
    const nl = buf.indexOf(10, i), head = buf.toString('utf8', i, nl).split(' ')
    if (head[1] !== 'blob') { i = nl + 1; continue }
    const size = +head[2]
    map.set(head[0], buf.toString('utf8', nl + 1, nl + 1 + size))
    i = nl + 1 + size + 1
  }
  return map
}

/**
 * Collect every event file visible from here: working tree, local branches, remote-tracking branches.
 * Event files never change after creation, so the union is unambiguous; a path whose content differs
 * between two places has been edited by hand and is reported instead of used.
 */
export function readAll(root, { worktreeOnly = false } = {}) {
  const problems = [], byPath = new Map()
  const put = (path, text, where) => {
    const variants = byPath.get(path) ?? byPath.set(path, new Map()).get(path)
    const refs = variants.get(text) ?? variants.set(text, []).get(text)
    refs.push(where)
  }
  const wt = worktreeFiles(root)
  for (const f of wt.out) put(f.path, f.text, 'worktree')

  const isRepo = !worktreeOnly && git(root, ['rev-parse', '--is-inside-work-tree'])?.trim() === 'true'
  let current = null, hasRemote = false, deleted = []
  if (isRepo) {
    current = git(root, ['symbolic-ref', '--short', '-q', 'HEAD'])?.trim() || null
    const refs = (git(root, ['for-each-ref', '--format=%(objectname) %(refname)', 'refs/heads', 'refs/remotes']) ?? '').split('\n').filter(Boolean)
      .map((l) => l.split(' ')).filter(([, ref]) => !/^refs\/remotes\/[^/]+\/HEAD$/.test(ref))
    hasRemote = refs.some(([, ref]) => ref.startsWith('refs/remotes/'))
    const byCommit = new Map()
    for (const [sha, ref] of refs) (byCommit.get(sha) ?? byCommit.set(sha, []).get(sha)).push(ref)
    const found = []
    for (const [commit, names] of byCommit) {
      const tree = git(root, ['ls-tree', '-r', commit, '--', 'state/events', 'versions']) ?? ''
      for (const line of tree.split('\n')) {
        const m = line.match(/^\d+ blob ([0-9a-f]+)\t(.+)$/)
        if (m && EVENT_PATH.test(m[2])) found.push({ path: m[2], sha: m[1], names })
      }
    }
    const blobs = readBlobs(root, [...new Set(found.map((f) => f.sha))])
    const unread = found.filter((f) => !blobs.has(f.sha))
    if (unread.length) problems.push({ where: '其他分支上的事件', path: null, why: `有 ${unread.length} 个事件文件没能从 git 读出来，状态可能不完整。请确认本机 git 可用后重试` })
    for (const f of found) if (blobs.has(f.sha)) for (const ref of f.names) put(f.path, blobs.get(f.sha), ref)
    // Committed on the current branch but missing from the working tree: someone deleted an event file.
    const head = git(root, ['ls-tree', '-r', '--name-only', 'HEAD', '--', 'state/events', 'versions'])
    if (head) { const here = new Set(wt.out.map((f) => f.path)); deleted = head.split('\n').filter((p) => EVENT_PATH.test(p) && !here.has(p)) }
  }

  const events = []
  for (const [path, variants] of byPath) {
    const [, version, id] = path.match(EVENT_PATH)
    const scope = version ?? 'project'
    const where = scope === 'project' ? `项目级事件 ${id}` : `${scope} 的事件 ${id}`
    if (variants.size > 1) { problems.push({ where, path, why: '这个事件文件在不同分支或本机上的内容不一样，说明写入后被改过。它没有生效' }); continue }
    const [[text, refs]] = variants
    let e
    try { e = JSON.parse(text) } catch { problems.push({ where, path, why: '文件不是合法的 JSON，这条没有生效' }); continue }
    const missing = COMMON.filter((k) => e?.[k] == null)
    if (missing.length) { problems.push({ where, path, why: `缺少必填字段 ${missing.join('、')}，这条没有生效` }); continue }
    if (e.id !== id) { problems.push({ where, path, why: '文件名和事件标识不一致，这条没有生效' }); continue }
    if (scope !== 'project' && e.version !== scope) { problems.push({ where, path, why: `事件写的版本是 ${e.version}，和所在目录不一致，这条没有生效` }); continue }
    if (!(scope === 'project' ? PROJECT_TYPES : VERSION_TYPES).includes(e.type)) { problems.push({ where, path, why: `不认识的事件类型 ${e.type}，这条没有生效` }); continue }
    if (Number.isNaN(Date.parse(e.at)) || Number.isNaN(Date.parse(e.recorded_at))) { problems.push({ where, path, why: '时间格式不对，这条没有生效' }); continue }
    const local = refs.filter((r) => r.startsWith('refs/heads/')).map((r) => r.slice(11))
    const remote = refs.filter((r) => r.startsWith('refs/remotes/')).map((r) => r.slice(13))
    const state = !isRepo ? 'plain' : !local.length && !remote.length ? 'uncommitted' : hasRemote && !remote.length ? 'unpushed' : 'pushed'
    const branch = !isRepo ? '当前目录' : local.includes(current) ? current : local[0] ?? remote[0] ?? `${current ?? '当前工作区'}（未提交）`
    events.push({ ...e, scope, src: { branch, state, here: refs.includes('worktree') } })
  }
  events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  return { events, problems, unknown: wt.unknown, deleted, gitless: !isRepo }
}

export function recorder(root) {
  return git(root, ['config', 'user.name'])?.trim() || userInfo().username
}

/** Create one event file. `fields` must not contain the common fields the script owns. */
export function writeEvent(root, scope, { type, at, by, ...rest }, { now = new Date(), tz } = {}) {
  // The id starts with the real wall clock in milliseconds: events that share the same `at` then sort in the order
  // they were written, which keeps "sign off, then enter the next stage" stable when both land in one second.
  const stamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 18) + 'Z'
  const id = `${stamp}-${[...randomBytes(4)].map((b) => (b % 36).toString(36)).join('')}`
  const event = { id, type, ...(scope === 'project' ? {} : { version: scope }), at, recorded_at: isoIn(tz, now), recorded_by: recorder(root), by, ...rest }
  const dir = eventDir(root, scope)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${id}.json`), JSON.stringify(event, null, 2) + '\n', { flag: 'wx' })
  return event
}

/** ISO 8601 with the UTC offset of an IANA time zone, e.g. 2026-11-19T18:20:00+08:00. */
export function isoIn(tz, date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'longOffset',
  }).formatToParts(date).map((p) => [p.type, p.value]))
  const off = parts.timeZoneName.replace('GMT', '') || '+00:00'
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${off}`
}

/**
 * The personal profile is a git-ignored file at the repository root. Its header says who operates this clone.
 * A worktree does not share untracked files, so the main working tree is the fallback.
 */
export function profilePaths(root) {
  const paths = [join(root, 'profile.md')]
  const common = git(root, ['rev-parse', '--path-format=absolute', '--git-common-dir'])?.trim()
  if (common && common.endsWith('.git')) { const main = join(common, '..', 'profile.md'); if (!paths.includes(main)) paths.push(main) }
  return paths
}
export function readProfile(root) {
  for (const file of profilePaths(root)) {
    if (!existsSync(file)) continue
    const member = readFileSync(file, 'utf8').split('\n').slice(0, 20).map((l) => l.match(/^member:\s*([a-z0-9_-]+)\s*$/)?.[1]).find(Boolean)
    if (member) return { member, file }
  }
  return null
}

export function readDefs(root) {
  const f = join(root, 'state', 'defs', 'config-items.json')
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')).items : []
}
