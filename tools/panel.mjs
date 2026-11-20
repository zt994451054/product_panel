#!/usr/bin/env node
// Driver panel state tool. The only supported way to change panel state: every change is one new event file.
// Usage: node tools/panel.mjs <command> [--flag value ...]    (run `node tools/panel.mjs help` for the list)
// Zero dependencies: Node built-ins and the local git binary.

import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { git, isoIn, readAll, readDefs, writeEvent } from './lib/store.mjs'
import { CONFIG_STATUS, FIXED_HUMAN, FLOWS, MODES, STAGES, STAGE_NAME, dayIn, derive } from './lib/derive.mjs'

class Fail extends Error {}
const fail = (msg) => { throw new Fail(msg) }
const list = (s) => (s == null ? [] : String(s).split(',').map((x) => x.trim()).filter(Boolean))
const oneOf = (v, allowed, label) => (allowed.includes(v) ? v : fail(`${label}「${v ?? ''}」不合法。可选：${allowed.join('、')}`))
const need = (f, key, label) => (f[key] != null && f[key] !== '' ? f[key] : fail(`缺少 --${key}（${label}）`))

function parse(argv) {
  const words = [], flags = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) { words.push(a); continue }
    const key = a.slice(2), val = argv[i + 1] == null || argv[i + 1].startsWith('--') ? true : argv[++i]
    flags[key] = key in flags ? [].concat(flags[key], val) : val
  }
  return { words, flags }
}

function load(root, env) {
  const all = readAll(root), defs = readDefs(root)
  const now = env.PANEL_NOW ? new Date(env.PANEL_NOW) : new Date()
  return { root, all, defs, now, state: derive(all.events, defs, { now: now.toISOString() }) }
}

/* ---------- shared write path ---------- */
const AGENTS = ['ai', 'review-panel']
function member(c, id, label) {
  const m = c.state.members.find((x) => x.id === id)
  if (!m) fail(`${label}「${id ?? ''}」不是在册成员。在册成员：${c.state.members.map((x) => x.id).join('、') || '（还没有）'}`)
  if (!m.active) fail(`${label}「${id}」已离开项目`)
  return id
}
function versionOf(c, f) {
  const id = need(f, 'version', '版本号，所有写命令都要明确指明')
  return c.state.versions.find((v) => v.id === id) ?? fail(`版本 ${id} 不存在。已有版本：${c.state.versions.map((v) => v.id).join('、') || '（还没有）'}`)
}

/** Validate against the replay rules by trying the event out, then write it. */
function commit(c, scope, fields, f, { byMember = false, freeBy = false } = {}) {
  const by = need(f, 'by', '操作人：成员标识，AI 写 ai')
  if (!freeBy) { if (byMember || !AGENTS.includes(by)) member(c, by, '操作人') }
  const tz = c.state.tz, nowIso = isoIn(tz, c.now)
  let at = nowIso
  if (f.at) {
    at = /[zZ]|[+-]\d\d:\d\d$/.test(f.at) ? f.at : `${f.at.length === 10 ? f.at + 'T00:00:00' : f.at.length === 16 ? f.at + ':00' : f.at}${nowIso.slice(-6)}`
    if (Number.isNaN(Date.parse(at))) fail(`--at「${f.at}」不是合法的时间，例如 2026-11-19T18:20`)
    if (Date.parse(at) > c.now.getTime() + 60000) fail('发生时间不能晚于现在')
  }
  if (scope !== 'project') {
    const v = c.state.versions.find((x) => x.id === scope)
    if (v && Date.parse(at) < Date.parse(v.lastEventAt) && !f.backfill) fail(`发生时间早于 ${scope} 已有的最后一条记录（${v.lastEventAt}）。确实是补记历史的话，加 --backfill "补记原因"`)
  }
  const event = { ...fields, at, by, ...(f.backfill ? { backfill: f.backfill } : {}) }
  const trial = { ...event, id: 'trial', scope, recorded_at: nowIso, recorded_by: '-', ...(scope === 'project' ? {} : { version: scope }), src: { branch: '本次写入', state: 'uncommitted' } }
  const events = [...c.all.events, trial].sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || (a.id === 'trial' ? 1 : b.id === 'trial' ? -1 : 0))
  const after = derive(events, c.defs, { now: c.now.toISOString() })
  const hit = [...after.projectConflicts, ...after.versions.flatMap((v) => v.conflicts)].find((x) => x.id === 'trial')
  if (hit) fail(hit.why)
  const written = writeEvent(c.root, scope, event, { now: c.now, tz })
  return `已记录 ${written.type}（${written.id}）。请提交并推送，否则别人看不到。`
}

/* ---------- commands ---------- */
const commands = {
  init(c, f) {
    if (c.state.initialized) fail('项目已经初始化过')
    const tz = f.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
    try { dayIn(tz, c.now) } catch { fail(`时区「${tz}」不合法，例如 Asia/Shanghai`) }
    const project = 'prj_' + Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => (b % 36).toString(36)).join('')
    return commit(c, 'project', { type: 'project_init', project, name: need(f, 'name', '产品名'), positioning: f.positioning ?? '待确认', product_type: oneOf(f.type, ['new', 'legacy'], '产品类型 --type'), timezone: tz }, f, { freeBy: true })
  },
  'member add'(c, f) {
    const domains = list(f.domains); domains.forEach((d) => oneOf(d, ['product', 'engineering', 'testing', 'ops'], '负责域'))
    return commit(c, 'project', { type: 'member_add', member: { id: /^[a-z0-9_-]+$/.test(need(f, 'id', '成员标识')) ? f.id : fail('成员标识只能用小写字母、数字、下划线、短横线'), name: need(f, 'name', '显示名'), role: need(f, 'role', '角色'), domains } }, f, { freeBy: c.state.members.length === 0 })
  },
  'member update'(c, f) {
    const set = {}; if (f.name) set.name = f.name; if (f.role) set.role = f.role; if (f.domains) set.domains = list(f.domains)
    if (!Object.keys(set).length) fail('没有要改的内容：--name、--role、--domains 至少给一个')
    return commit(c, 'project', { type: 'member_update', member: member(c, need(f, 'id', '成员标识'), '成员'), set }, f, { byMember: true })
  },
  'member deactivate'(c, f) { return commit(c, 'project', { type: 'member_deactivate', member: member(c, need(f, 'id', '成员标识'), '成员'), reason: need(f, 'reason', '原因') }, f, { byMember: true }) },
  'settings set'(c, f) {
    const key = need(f, 'key', '设置项'), stage = key.startsWith('gate.') ? key.slice(5) : null
    let value = need(f, 'value', '新值'), from
    if (stage) {
      oneOf(stage, STAGES, '关卡')
      if (FIXED_HUMAN.includes(stage)) fail(`「${STAGE_NAME[stage]}」的签收固定由人完成，不能修改`)
      oneOf(value, MODES, '放行方式'); from = c.state.settings.gates.find((g) => g.stage === stage).mode
    } else if (['stall_days.standard', 'stall_days.hotfix'].includes(key)) {
      value = Number(value); if (!Number.isInteger(value) || value < 1) fail('停滞天数必须是正整数')
      from = c.state.settings.stall[key.slice(11)]
    } else fail(`设置项「${key}」不合法。可选：${STAGES.filter((s) => !FIXED_HUMAN.includes(s)).map((s) => 'gate.' + s).join('、')}、stall_days.standard、stall_days.hotfix`)
    return commit(c, 'project', { type: 'setting_set', key, value, from, quote: need(f, 'quote', '使用者原话') }, f, { byMember: true })
  },
  'config set'(c, f) {
    const item = c.defs.find((d) => d.id === f.item) ?? fail(`配置项「${f.item ?? ''}」不存在。可选：${c.defs.map((d) => d.id).join('、')}`)
    const status = oneOf(f.status, CONFIG_STATUS, '状态 --status')
    if (status === 'confirmed') need(f, 'quote', '使用者原话')
    if (['skipped', 'na'].includes(status)) need(f, 'note', '原因')
    const level = item.level[c.state.project?.type ?? 'new']
    if (level === 'L0' && status === 'skipped') fail('L0 项不能暂不填')
    if (f.owner) member(c, f.owner, '归属人')
    return commit(c, 'project', { type: 'config_set', item: item.id, status, ...pick(f, ['quote', 'note', 'owner', 'due']) }, f, { byMember: status === 'confirmed' })
  },
  'module set'(c, f) { return commit(c, 'project', { type: 'module_set', module: oneOf(f.module, ['i18n', 'planning', 'smoke'], '模块'), status: oneOf(f.status, ['on', 'off', 'declined'], '状态'), quote: need(f, 'quote', '使用者原话') }, f, { byMember: true }) },

  'version new'(c, f) {
    if (!c.state.initialized) fail('项目还没有初始化，先运行 init')
    if (c.state.config.find((x) => x.id === 'product_info')?.status !== 'confirmed') fail('「产品基本信息」还没有确认，确认后才能新建版本')
    const id = need(f, 'version', '版本号'); if (!/^v\d+\.\d+\.\d+$/.test(id)) fail('版本号格式应为 v1.2.3')
    if (c.state.versions.some((v) => v.id === id)) fail(`版本号 ${id} 已经被占用（已检查所有分支）。换一个版本号`)
    const flow = oneOf(f.flow ?? 'standard', Object.keys(FLOWS), '流程 --flow')
    const owners = { product: member(c, need(f, 'product', '产品负责人'), '产品负责人'), engineering: member(c, need(f, 'engineering', '研发负责人'), '研发负责人'), testing: member(c, need(f, 'testing', '测试负责人'), '测试负责人'), ...(f.ops ? { ops: member(c, f.ops, '运维负责人') } : {}) }
    if (f.planned && !/^\d{4}-\d\d-\d\d$/.test(f.planned)) fail('计划发布日格式应为 2026-11-28')
    return commit(c, id, { type: 'version_create', flow, kind: oneOf(f.kind ?? (flow === 'hotfix' ? 'patch' : 'minor'), ['major', 'minor', 'patch'], '版本大小 --kind'), goal: need(f, 'goal', '版本目标'), base: f.base ?? null, branch: f.branch ?? null, planned_release: f.planned ?? null, owners, ...(f.fixes ? { fixes: list(f.fixes) } : {}) }, f)
  },
  'version update'(c, f) {
    const v = versionOf(c, f), set = pick(f, ['goal', 'branch', 'base'])
    const owners = { ...v.owners }; let changed = false
    for (const k of ['product', 'engineering', 'testing', 'ops']) if (f[k]) { owners[k] = member(c, f[k], '负责人'); changed = true }
    if (changed) set.owners = owners
    if (!Object.keys(set).length) fail('没有要改的内容')
    return commit(c, v.id, { type: 'version_update', set, quote: need(f, 'quote', '使用者原话') }, f)
  },
  'version replan'(c, f) {
    const v = versionOf(c, f), to = need(f, 'to', '新的计划发布日'); if (!/^\d{4}-\d\d-\d\d$/.test(to)) fail('日期格式应为 2026-11-28')
    return commit(c, v.id, { type: 'replan', from: v.planned, to, reason: need(f, 'reason', '改期原因') }, f)
  },
  'version onboard'(c, f) { const v = versionOf(c, f); return commit(c, v.id, { type: 'onboard', stage: oneOf(f.stage, FLOWS[v.flow], '阶段'), note: f.note ?? null, quote: need(f, 'quote', '使用者原话') }, f, { byMember: true }) },
  'version hold'(c, f) { const v = versionOf(c, f); return commit(c, v.id, { type: 'hold', reason: need(f, 'reason', '挂起原因'), resume_when: need(f, 'resume-when', '恢复条件'), quote: need(f, 'quote', '使用者原话') }, f, { byMember: true }) },
  'version resume'(c, f) { const v = versionOf(c, f); return commit(c, v.id, { type: 'resume', quote: need(f, 'quote', '使用者原话') }, f, { byMember: true }) },
  'version abandon'(c, f) { const v = versionOf(c, f); return commit(c, v.id, { type: 'abandon', reason: need(f, 'reason', '放弃原因'), quote: need(f, 'quote', '使用者原话') }, f, { byMember: true }) },

  'stage enter'(c, f) {
    const v = versionOf(c, f), stage = oneOf(f.stage, FLOWS[v.flow], `阶段（${v.flow === 'hotfix' ? '热修复' : '常规'}流程）`)
    if (!c.state.l0Ready) fail(`必须最先完成的配置项还没确认：${c.state.config.filter((x) => x.level === 'L0' && x.status !== 'confirmed').map((x) => x.name).join('、')}`)
    const idx = STAGES.indexOf(stage)
    const blockers = c.state.config.filter((x) => x.level === 'L1' && STAGES.includes(x.before) && STAGES.indexOf(x.before) <= idx && !['confirmed', 'na'].includes(x.status))
    if (blockers.length) fail(`进入「${STAGE_NAME[stage]}」前要先完成这些配置项：${blockers.map((x) => x.name).join('、')}`)
    return commit(c, v.id, { type: 'stage_enter', stage }, f)
  },
  'stage check'(c, f) {
    const v = versionOf(c, f), stage = oneOf(f.stage, FLOWS[v.flow], '阶段')
    const checks = [].concat(f.check ?? []).map((raw, i) => {
      const [text, ok, evidence, source] = String(raw).split('|').map((x) => x.trim())
      if (!text || !['ok', 'no'].includes(ok) || !evidence) fail(`第 ${i + 1} 条 --check 格式应为 "条件|ok 或 no|依据|script 或 manual"`)
      return { id: `${stage}.${i + 1}`, text, ok: ok === 'ok', evidence, source: oneOf(source ?? 'manual', ['script', 'manual'], '核对方式') }
    })
    if (!checks.length) fail('至少要有一条 --check "条件|ok 或 no|依据|script 或 manual"')
    const result = checks.every((x) => x.ok) ? 'pass' : 'fail'
    return commit(c, v.id, { type: 'gate_check', stage, result, checks }, f) + (result === 'fail' ? `\n门控未通过：${checks.filter((x) => !x.ok).map((x) => x.text).join('；')}` : '\n门控通过。')
  },
  'stage request'(c, f) { const v = versionOf(c, f); return commit(c, v.id, { type: 'signoff_request', stage: oneOf(f.stage, FLOWS[v.flow], '阶段'), to: list(need(f, 'to', '请谁签收')).map((id) => member(c, id, '签收人')), summary: need(f, 'summary', '本阶段摘要') }, f) },
  'stage complete'(c, f) {
    const v = versionOf(c, f), stage = oneOf(f.stage, FLOWS[v.flow], '阶段')
    if (v.current?.stage !== stage) fail(`「${STAGE_NAME[stage]}」不在进行中${v.current ? `，当前是「${v.current.name}」` : ''}`)
    const check = f.check ? v.events.find((e) => e.id === f.check && e.type === 'gate_check' && !e.voided && !e.conflict) : v.current.check
    if (!check || check.stage && check.stage !== stage || Date.parse(check.at) < Date.parse(v.current.since)) fail('签收前要先做一次本阶段的门控核对（stage check），并且是这次进入阶段之后做的')
    if (check.result !== 'pass') fail('最近一次门控核对没有通过，不能签收')
    const setting = c.state.settings.gates.find((g) => g.stage === stage).mode, mode = oneOf(f.mode ?? setting, MODES, '放行方式')
    if (MODES.indexOf(mode) < MODES.indexOf(setting)) fail(`「${STAGE_NAME[stage]}」的签收设置是「${setting}」，不能用更宽松的「${mode}」`)
    const signoff = { mode }
    if (mode === 'auto') Object.assign(signoff, { by: 'review-panel', summary: need(f, 'summary', '评审结论摘要'), review: need(f, 'review', '评审记录标识') })
    else {
      const signer = member(c, need(f, 'signer', '签收人'), '签收人')
      if (!Object.values(v.owners).includes(signer)) fail(`签收人必须是 ${v.id} 登记的负责人之一`)
      if (stage === 'release' && signer !== v.owners.product) fail('发布完成的交付确认只能由产品负责人签收')
      Object.assign(signoff, { by: signer, quote: need(f, 'quote', '签收人的原话') })
      if (mode === 'review_human') signoff.review = need(f, 'review', '评审记录标识')
    }
    if (stage === 'release') {
      const others = c.state.versions.filter((x) => x.id !== v.id && ['planned', 'active', 'paused'].includes(x.status))
      const missing = others.filter((x) => !v.downstream.some((d) => d.target === x.id && d.by))
      if (missing.length) fail(`发布完成前，要逐个确认其他在途版本是否需要合入本版本的改动。还没确认的：${missing.map((x) => x.id).join('、')}（downstream-check）`)
    }
    return commit(c, v.id, { type: 'stage_complete', stage, gate_check: check.id, signoff }, f)
  },
  'stage rollback'(c, f) { const v = versionOf(c, f); return commit(c, v.id, { type: 'stage_rollback', from: oneOf(f.from, FLOWS[v.flow], '从哪个阶段'), to: oneOf(f.to, FLOWS[v.flow], '退回到哪个阶段'), reason: need(f, 'reason', '回退原因'), ...pick(f, ['ref']), quote: need(f, 'quote', '使用者原话') }, f) },
  note(c, f) { const v = versionOf(c, f); return commit(c, v.id, { type: 'progress', stage: v.current?.stage ?? null, text: need(f, 'text', '进展说明') }, f) },
  block(c, f) { const v = versionOf(c, f); return commit(c, v.id, { type: 'block', text: need(f, 'text', '被什么卡住'), owner: member(c, need(f, 'owner', '归谁处理'), '归属人'), ...pick(f, ['ref']) }, f) },
  unblock(c, f) { const v = versionOf(c, f); return commit(c, v.id, { type: 'unblock', target: need(f, 'target', '阻塞事件标识'), ...pick(f, ['note']) }, f) },
  deploy(c, f) {
    const env = need(f, 'env', '环境，如 staging、production'), action = oneOf(f.action, ['deploy', 'rollback', 'exception', 'baseline'], '动作 --action')
    const versions = list(need(f, 'versions', '涉及的版本号'))
    const e = { type: 'deploy', env, action, versions, ...pick(f, ['build', 'ref', 'note']) }
    if (action === 'rollback') e.target = { version: need(f, 'target-version', '回滚到哪个版本'), build: f['target-build'] ?? null }
    if (env === 'production') e.approved = { by: member(c, need(f, 'approved-by', '谁批准的'), '批准人'), quote: need(f, 'quote', '批准人的原话') }
    return commit(c, 'project', e, f)
  },
  'downstream-check'(c, f) {
    const v = versionOf(c, f), target = need(f, 'target', '被确认的在途版本')
    if (!c.state.versions.some((x) => x.id === target)) fail(`版本 ${target} 不存在`)
    const result = oneOf(f.result, ['merged', 'partial', 'not_needed', 'deferred'], '结论 --result')
    return commit(c, v.id, { type: 'downstream_check', target, result, evidence: need(f, 'evidence', '依据'), confirmed: { by: member(c, need(f, 'confirmed-by', '谁确认的'), '确认人'), quote: need(f, 'quote', '确认人的原话') } }, f)
  },
  'event void'(c, f) {
    const target = need(f, 'target', '要作废的事件标识'), e = c.all.events.find((x) => x.id === target) ?? fail(`事件 ${target} 不存在`)
    if (e.type === 'void') fail('作废记录本身不能再作废')
    if (c.all.events.some((x) => x.type === 'void' && x.target === target)) fail('这条事件已经作废过了')
    return commit(c, e.scope, { type: 'void', target, reason: need(f, 'reason', '作废原因') }, f)
  },

  status(c, f) { return f.json ? JSON.stringify(strip(c), null, 2) : statusText(c, f.version) },
  check(c, f) {
    if (f.branch) return branchOnly(c, f.branch)
    const issues = [
      ...c.all.problems.map((p) => `数据损坏：${p.where}。${p.why}`),
      ...c.all.unknown.map((p) => `状态目录里有不认识的文件：${p}`),
      ...c.all.deleted.map((p) => `已提交的事件文件被删除了：${p}（事件文件写入后不能删除，要撤销请用 event void）`),
      ...c.state.projectConflicts.map((x) => `项目级记录有矛盾：${x.why}`),
      ...c.state.versions.flatMap((v) => v.conflicts.map((x) => `${v.id} 有矛盾：${x.why}`)),
      ...references(c),
    ]
    if (issues.length) throw new Fail(`发现 ${issues.length} 个问题：\n` + issues.map((x) => '- ' + x).join('\n'))
    return `检查通过：${c.all.events.length} 条事件，没有发现问题。` + (c.all.gitless ? '\n（这里不是 git 仓库，只检查了当前目录。）' : '')
  },
  help() { return HELP },
}

const pick = (f, keys) => Object.fromEntries(keys.filter((k) => f[k] != null && f[k] !== true).map((k) => [k, f[k]]))
const strip = (c) => ({ ...c.state, problems: c.all.problems, gitless: c.all.gitless })

function references(c) {
  const ids = new Set(c.all.events.map((e) => e.id)), members = new Set(c.state.members.map((m) => m.id)), versions = new Set(c.state.versions.map((v) => v.id))
  const out = [], who = (id, e, label) => { if (id && !members.has(id) && !AGENTS.includes(id)) out.push(`事件 ${e.id}（${e.type}）的${label}「${id}」不是在册成员`) }
  for (const e of c.all.events) {
    if (!['project_init', 'member_add'].includes(e.type)) who(e.by, e, '操作人')
    if (e.type === 'version_create') Object.values(e.owners ?? {}).forEach((id) => who(id, e, '负责人'))
    if (e.type === 'stage_complete') who(e.signoff?.by, e, '签收人')
    if (['void', 'unblock'].includes(e.type) && !ids.has(e.target)) out.push(`事件 ${e.id}（${e.type}）指向的事件 ${e.target} 不存在`)
    if (e.type === 'downstream_check' && !versions.has(e.target)) out.push(`事件 ${e.id} 指向的版本 ${e.target} 不存在`)
  }
  return out
}

function branchOnly(c, branch) {
  const names = (ref) => (git(c.root, ['ls-tree', '-r', '--name-only', ref, '--', 'state/events', 'versions']) ?? '').split('\n').filter((p) => /state\/events\/[^/]+\.json$/.test(p))
  if (git(c.root, ['rev-parse', '--verify', '-q', branch]) == null) fail(`分支 ${branch} 不存在`)
  const refs = (git(c.root, ['for-each-ref', '--format=%(refname)', 'refs/heads', 'refs/remotes']) ?? '').split('\n').filter(Boolean)
  const full = git(c.root, ['rev-parse', '--symbolic-full-name', branch])?.trim()
  const elsewhere = new Set(refs.filter((r) => r !== full && !/\/HEAD$/.test(r)).flatMap(names))
  const only = names(branch).filter((p) => !elsewhere.has(p))
  return only.length ? `有 ${only.length} 条事件只存在于分支 ${branch} 上，删除这个分支会丢失它们：\n` + only.map((p) => '- ' + p).join('\n') : `分支 ${branch} 上的事件在其他分支都有，可以安全删除。`
}

/* ---------- status summary: the standard read entry for agents ---------- */
function statusText(c, only) {
  const s = c.state, tz = s.tz, md = (iso) => dayIn(tz, iso).slice(5), hm = (iso) => isoIn(tz, new Date(iso)).slice(11, 16)
  const nm = (id) => s.members.find((m) => m.id === id)?.name ?? id
  const lines = []
  if (c.all.problems.length) lines.push(`⚠ 有 ${c.all.problems.length} 个事件文件损坏，没有生效：`, ...c.all.problems.map((p) => `  - ${p.where}：${p.why}`))
  if (!s.initialized) { lines.push('【项目未初始化】还没有初始化记录。只能做初始化相关的工作。', '下一步：node tools/panel.mjs init --name <产品名> --type new|legacy --by <你的标识>'); return lines.join('\n') }
  lines.push(`【项目】${s.project.name}（${s.project.type === 'new' ? '新产品' : '存量产品'}）· ${s.project.positioning}`)
  const r = s.online.running
  lines.push(`线上在跑：${r ? `${r.version}${r.build ? ' ' + r.build : ''}（${md(r.since)} ${r.how === 'rollback' ? '从 ' + r.from.join('、') + ' 回滚' : '部署'}）` : '还没有生产部署记录'} · 最后发布：${s.online.lastReleased ? `${s.online.lastReleased.version}（${md(s.online.lastReleased.at)}）` : '无'}`)
  const l0 = s.config.filter((x) => x.level === 'L0' && x.status !== 'confirmed'), l1 = s.config.filter((x) => x.level === 'L1' && !['confirmed', 'na'].includes(x.status)), l2 = s.config.filter((x) => x.level === 'L2' && ['todo', 'draft'].includes(x.status))
  const CS = { todo: '未填', skipped: '暂不填', draft: '草稿待审' }
  lines.push(l0.length ? `配置：必须最先完成的还差 ${l0.map((x) => x.name).join('、')}。完成前不能推进任何阶段` : `配置：必须项已就绪${l1.length ? ` · 会卡阶段的待办 ${l1.length} 项：${l1.map((x) => `${x.name}（${CS[x.status]}${STAGE_NAME[x.before] ? '，进入' + STAGE_NAME[x.before] + '前' : ''}）`).join('、')}` : ''}${l2.length ? ` · 不阻断的 ${l2.length} 项未完成` : ''}`)
  const on = s.modules.filter((m) => m.status === 'on').map((m) => ({ i18n: '多语言', planning: '产品规划', smoke: '冒烟测试' }[m.id]))
  if (on.length) lines.push(`已启用的可选模块：${on.join('、')}`)
  if (s.projectConflicts.length) lines.push(`⚠ 项目级记录有 ${s.projectConflicts.length} 条矛盾：`, ...s.projectConflicts.map((x) => `  - ${x.why}`))
  const live = s.versions.filter((v) => ['planned', 'active', 'paused'].includes(v.status) && (!only || v.id === only)).sort((a, b) => (a.planned ?? '9') < (b.planned ?? '9') ? -1 : 1)
  lines.push('', `【未发布的版本 ${live.length} 个】${live.length > 1 ? '没有默认版本，操作时要指明版本号' : ''}`)
  const MARK = { done: '✓', open: '▶', pending: '·', reopened: '↩', untracked: '—' }, SHORT = { requirements: '需求', design: '设计', tech: '方案', test_design: '测设', dev: '开发', test: '测试', release: '发布' }
  for (const v of live) {
    const where = v.hold ? `挂起 ${v.hold.days} 天（${v.hold.reason}；恢复条件：${v.hold.resumeWhen}）` : v.current ? `${v.current.name} 第 ${v.current.days} 天${v.current.days < 1 ? `（${v.current.hours} 小时）` : ''}${v.current.stalled ? `，⚠ 已超过 ${v.current.threshold} 天停滞基准` : ''}` : v.next ? `上一阶段已签收，待进入${v.next.name}` : '规划中，还没进入阶段'
    lines.push(`${v.id} ${v.flow === 'hotfix' ? '热修复' : '常规'} | ${where} | 计划 ${v.planned ?? '未定'}${v.overdueDays ? `，已逾期 ${v.overdueDays} 天` : ''}${v.replans.length ? `（改期 ${v.replans.length} 次，延 ${v.slipDays} 天）` : ''}`)
    lines.push(`  目标：${v.goal}`, `  负责人：产品 ${nm(v.owners.product)} / 研发 ${nm(v.owners.engineering)} / 测试 ${nm(v.owners.testing)}${v.owners.ops ? ' / 运维 ' + nm(v.owners.ops) : ''}`)
    lines.push(`  进度：${v.stages.map((x) => SHORT[x.key] + MARK[x.state]).join(' ')}${v.rollbacks.length ? `（回退 ${v.rollbacks.length} 次）` : ''}`)
    if (v.current?.check) lines.push(`  门控核对：${md(v.current.check.at)} ${v.current.check.result === 'pass' ? '通过' : '未通过：' + v.current.check.checks.filter((x) => !x.ok).map((x) => x.text).join('；')}`)
    if (v.waiting) lines.push(`  等签收：已请 ${v.waiting.to.map(nm).join('、')} 签收，等了 ${v.waiting.days} 天`)
    for (const b of v.blocks) lines.push(`  阻塞 ${b.days} 天（归 ${nm(b.owner)}）：${b.text}`)
    if (s.online.deployedNotReleased.includes(v.id)) lines.push('  已部署到生产，发布完成还没签收')
    if (v.progress) lines.push(`  最新进展（${md(v.progress.at)}）：${v.progress.text}`)
    for (const x of v.conflicts) lines.push(`  ⚠ 有一条记录没有生效：${x.why}`)
    lines.push(`  数据来自 ${v.source.branch}，最后更新 ${md(v.source.at)} ${hm(v.source.at)}${v.source.uncommitted ? `，${v.source.uncommitted} 条未提交` : ''}${v.source.unpushed ? `，${v.source.unpushed} 条未推送` : ''}`)
  }
  const done = s.versions.filter((v) => v.status === 'released'), dropped = s.versions.filter((v) => v.status === 'abandoned')
  if (!only && done.length) lines.push('', `【已发布】${done.map((v) => `${v.id}（${md(v.releasedAt)}）`).join('、')}`)
  if (!only && dropped.length) lines.push(`【已放弃】${dropped.map((v) => v.id).join('、')}`)
  if (c.all.gitless) lines.push('', '（这里不是 git 仓库，只显示当前目录的状态。）')
  return lines.join('\n')
}

const HELP = `用法：node tools/panel.mjs <命令> [--参数 值 ...]

读取
  status [--version v] [--json]     状态摘要（每次对话先读这个）
  check [--branch 分支]              检查状态数据；带 --branch 时列出只存在于该分支上的事件

项目
  init --name --type new|legacy [--positioning --timezone] --by
  member add --id --name --role --domains product,engineering,testing,ops --by
  member update --id [--name --role --domains] --by
  member deactivate --id --reason --by
  settings set --key gate.<阶段>|stall_days.standard|stall_days.hotfix --value --quote --by
  config set --item --status todo|skipped|draft|confirmed|na [--quote --note --owner --due] --by
  module set --module i18n|planning|smoke --status on|off|declined --quote --by
  deploy --env --action deploy|rollback|exception|baseline --versions a,b [--build --target-version --target-build --approved-by --quote --ref --note] --by

版本（都要 --version）
  version new --flow standard|hotfix --goal --product --engineering --testing [--ops --kind --base --branch --planned --fixes] --by
  version update [--goal --branch --base --product --engineering --testing --ops] --quote --by
  version replan --to 日期 --reason --by
  version onboard --stage --quote [--note] --by
  version hold --reason --resume-when --quote --by
  version resume --quote --by
  version abandon --reason --quote --by

阶段（都要 --version --stage）
  stage enter --by
  stage check --check "条件|ok 或 no|依据|script 或 manual"（可多条）--by
  stage request --to a,b --summary --by
  stage complete --signer --quote [--mode --review --summary --check 事件标识] --by
  stage rollback --from --to --reason --quote [--ref] --by      （不用 --stage）

其他
  note --version --text --by
  block --version --text --owner [--ref] --by
  unblock --version --target 事件标识 [--note] --by
  downstream-check --version --target --result merged|partial|not_needed|deferred --evidence --confirmed-by --quote --by
  event void --target 事件标识 --reason --by

通用：--at 发生时间（默认现在）；补记早于已有记录的事件要加 --backfill "原因"；--root 指定仓库目录。
阶段键：${STAGES.map((s) => `${s} ${STAGE_NAME[s]}`).join('、')}`

/** Programmatic entry (used by the tests). Returns { code, out }. */
export function run(argv, { root, env = process.env } = {}) {
  const { words, flags } = parse(argv)
  const base = resolve(flags.root ?? root ?? git(process.cwd(), ['rev-parse', '--show-toplevel'])?.trim() ?? process.cwd())
  const name = commands[words.slice(0, 2).join(' ')] ? words.slice(0, 2).join(' ') : words[0] ?? 'help'
  try {
    if (!commands[name]) fail(`不认识的命令「${words.join(' ')}」。运行 node tools/panel.mjs help 查看全部命令`)
    return { code: 0, out: commands[name](name === 'help' ? null : load(base, env), flags) }
  } catch (e) {
    if (e instanceof Fail) return { code: 1, out: `没有执行：${e.message}` }
    throw e
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { code, out } = run(process.argv.slice(2))
  console.log(out)
  process.exit(code)
}
