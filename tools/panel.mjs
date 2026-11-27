#!/usr/bin/env node
// Driver panel state tool. The only supported way to change panel state: every change is one new event file.
// Usage: node tools/panel.mjs <command> [--flag value ...]    (run `node tools/panel.mjs help` for the list)
// Zero dependencies: Node built-ins and the local git binary.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { git, isoIn, profilePaths, readAll, readDefs, readProfile, writeEvent } from './lib/store.mjs'
import { renderCockpit } from './lib/cockpit.mjs'
import { CHANGE_IMPACT, CHANGE_TARGETS, CHANGE_TYPE, CONFIG_STATUS, DEFECT_FOUND, DEFECT_NEXT, DEFECT_STATUS, FIXED_HUMAN, FLOWS, ITEM_STATUS, MODES, STAGES, STAGE_NAME, dayIn, derive } from './lib/derive.mjs'

class Fail extends Error {}
const fail = (msg) => { throw new Fail(msg) }
const list = (s) => (s == null ? [] : String(s).split(',').map((x) => x.trim()).filter(Boolean))
// What a member knows well. Only shapes how the agent explains things; it grants or blocks nothing.
const FAMILIAR = { product: '产品', frontend: '前端', backend: '后端', testing: '测试', ops: '运维', owner: '总负责人' }
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
  const state = derive(all.events, defs, { now: now.toISOString() }), profile = readProfile(root)
  // The operator is whoever this clone's personal profile names, as long as that is an active member.
  const me = profile && state.members.some((m) => m.id === profile.member && m.active) ? profile.member : null
  return { root, all, defs, now, state, me, profile }
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

/**
 * Next ledger number. Each member counts on their own (BUG-lin-003), so people working on different branches never
 * compete for a number. Without a known operator the number is a short random code instead.
 */
function nextId(c, prefix) {
  const taken = new Set(c.all.events.map((e) => e.item ?? e.defect ?? e.dec ?? e.chg).filter(Boolean))
  if (c.me) {
    const mine = [...taken].filter((id) => id.startsWith(`${prefix}-${c.me}-`)).map((id) => Number(id.slice(prefix.length + c.me.length + 2))).filter(Number.isInteger)
    return `${prefix}-${c.me}-${String(Math.max(0, ...mine) + 1).padStart(3, '0')}`
  }
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789'
  for (;;) {
    const id = `${prefix}-${Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => abc[b % abc.length]).join('')}`
    if (!taken.has(id)) return id
  }
}
const itemOf = (v, f) => v.items.find((x) => x.id === need(f, 'item', '需求条目编号')) ?? fail(`${v.id} 没有需求条目 ${f.item}。已有：${v.items.map((x) => x.id).join('、') || '（还没有）'}`)
const defectOf = (v, f) => v.defects.find((x) => x.id === need(f, 'defect', '缺陷编号')) ?? fail(`${v.id} 没有缺陷 ${f.defect}。已有：${v.defects.map((x) => x.id).join('、') || '（还没有）'}`)
const changeOf = (v, f) => v.changes.find((x) => x.id === need(f, 'change', '变更编号')) ?? fail(`${v.id} 没有变更 ${f.change}。已有：${v.changes.map((x) => x.id).join('、') || '（还没有）'}`)
const targetsOf = (raw, label) => { const keys = list(raw); if (!keys.length) fail(`缺少 ${label}。可选：${Object.entries(CHANGE_TARGETS).map(([k, t]) => `${k} ${t}`).join('、')}`); return keys.map((k) => oneOf(k, Object.keys(CHANGE_TARGETS), '受影响的文档')) }
const leftOf = (ch) => ch.targets.filter((t) => !t.done).map((t) => CHANGE_TARGETS[t.key])
// Handing the choice back is not a decision, however it is phrased. Compared after dropping punctuation and sentence-final particles.
const NOT_A_DECISION = ['你决定', '你定', '你来定', '你自己定', '你自己决定', '你帮我定', '你替我定', '你直接定', '你直接替我定', '你帮我决定', '你看着办', '看着办', '你自己看着办', '都行', '都可以', '随便', '随你', '听你的', '你做主', '你拿主意', '你说了算', '按规范来', '你按规范来', '按规范', '按规矩来']
// A bare yes only means something next to the suggestion it answers.
const ASSENT = ['可以', '可', '好', '好的', '行', '同意', '没问题', '确认', '嗯', '对', '是', '是的', 'ok', '通过', '就这样', '就这么办']
const bare = (q) => { let t = String(q).replace(/[\s，。！？!?,.、~～「」“”"']/g, ''); while (/[吧了啊呀哦呢嘛]$/.test(t)) t = t.slice(0, -1); return t }
const openDefects = (v) => v.defects.filter((d) => !['closed', 'waived'].includes(d.status))
/** Gate conditions the tool can verify by itself from the ledger, so nobody has to count rows. */
function autoChecks(v, stage, online) {
  const out = []
  if (stage === 'requirements') {
    const live = v.items.filter((x) => x.status !== 'dropped'), p0 = live.filter((x) => x.priority === 'P0'), draft = p0.filter((x) => x.status === 'draft')
    out.push({ text: '需求条目已登记，P0 条目全部已确认', ok: live.length > 0 && !draft.length, evidence: !live.length ? '还没有登记需求条目（item add）' : draft.length ? `还是草稿的 P0 条目：${draft.map((x) => `${x.id} ${x.name}`).join('、')}` : `共 ${live.length} 条，P0 ${p0.length} 条均已确认` })
  }
  if (['test', 'release'].includes(stage)) {
    const open = openDefects(v), waived = v.defects.filter((d) => d.status === 'waived')
    out.push({ text: '登记的缺陷全部已关闭或已豁免', ok: !open.length, evidence: open.length ? `未关闭：${open.map((d) => `${d.id}（${d.severity}，${DEFECT_STATUS[d.status]}）`).join('、')}` : `共 ${v.defects.length} 条，已关闭 ${v.defects.length - waived.length} 条，豁免 ${waived.length} 条` })
  }
  if (stage === 'release') {
    // The tool already knows whether anyone looked at what is running in production; nobody gets to vouch for it by word.
    const r = online.running, mine = r && r.how !== 'rollback' && r.version === v.id
    out.push({ text: '线上版本标识已核对', ok: !!(mine && r.checked), evidence: !mine ? `线上在跑的不是 ${v.id} 的部署` : r.checked ? `核对记录：${r.checked}` : '还没核对：拿到线上实际的版本标识后运行 deploy --env production --action verify --checked …' })
  }
  return out.map((x, i) => ({ id: `${stage}.auto${i + 1}`, ...x, source: 'script' }))
}

/** Every sentence an event quotes from a person: sign-offs, approvals, confirmations, gate conditions taken on someone's word. */
const quotesOf = (e) => [e.quote, e.signoff?.quote, e.approved?.quote, e.confirmed?.quote, ...(e.checks ?? []).map((x) => x.told?.quote)].filter(Boolean).map((q) => String(q).trim())

/** Validate against the replay rules by trying the event out, then write it. */
function commit(c, scope, fields, f, { byMember = false, freeBy = false } = {}) {
  let by = need(f, 'by', '操作人：成员标识；AI 按流程自己记录的写 ai；当前操作者写 me')
  if (by === 'me') by = c.me ?? fail('不知道当前操作者是哪位成员。先问使用者「你是哪位成员」，然后运行 whoami --set <成员标识> 记下来（只保存在本机，不入库）；使用者没回答就不执行这条命令')
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
  const owner = scope === 'project' ? null : c.state.versions.find((x) => x.id === scope)
  // This working copy holds a version creation that lost a number clash: whatever is written now would land in the
  // other team's version. The clash has to be settled first.
  const lost = fields.type !== 'void' && owner?.conflicts.find((x) => x.type === 'version_create' && x.here)
  if (lost) fail(`版本号 ${scope} 撞号了：生效的是目标为「${owner.goal}」的那个，这边创建的那个（事件 ${lost.id}）没有生效。现在写入会记到对方的版本里。先请使用者决定：这边的版本换哪个号，然后运行 event void --target ${lost.id} 作废这边的创建记录，再用新版本号重新建`)
  // One sentence answers one thing. A sentence already recorded for a different kind of decision was said about that,
  // not about this; very short answers ("同意") are too common to tell apart and are left alone.
  const gone = new Set(c.all.events.filter((e) => e.type === 'void').map((e) => e.target))
  for (const q of quotesOf(fields).filter((q) => q.length >= 10)) {
    const used = c.all.events.find((e) => e.type !== fields.type && !gone.has(e.id) && quotesOf(e).includes(q))
    if (used) fail(`「${q}」这句话已经记作另一件事的原话（${used.at.slice(0, 10)} 的 ${used.type}）。一句话只对应一件事：针对现在这件事重新问使用者，用他这次的回答；他没有回答就不记`)
  }
  const event = { ...fields, ...(owner && fields.type !== 'version_create' ? { create: owner.createId } : {}), at, by, ...(f.backfill ? { backfill: f.backfill } : {}) }
  const trial = { ...event, id: 'trial', scope, recorded_at: nowIso, recorded_by: '-', ...(scope === 'project' ? {} : { version: scope }), src: { branch: '本次写入', state: 'uncommitted' } }
  const events = [...c.all.events, trial].sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || (a.id === 'trial' ? 1 : b.id === 'trial' ? -1 : 0))
  const after = derive(events, c.defs, { now: c.now.toISOString() })
  const hit = [...after.projectConflicts, ...after.versions.flatMap((v) => [...v.conflicts, ...v.duplicates])].find((x) => x.id === 'trial')
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
    const note = f.timezone ? '' : `\n时区按本机设为 ${tz}，不对的话告诉使用者并用 --timezone 重新初始化前先作废这条。`
    return commit(c, 'project', { type: 'project_init', project, name: need(f, 'name', '产品名'), positioning: f.positioning ?? '待确认', product_type: oneOf(f.type, ['new', 'legacy'], '产品类型 --type'), timezone: tz }, f, { freeBy: true }) + note
  },
  'member add'(c, f) {
    if (!c.state.initialized) fail('项目还没有初始化，先运行 init')
    const domains = list(f.domains); domains.forEach((d) => oneOf(d, ['product', 'engineering', 'testing', 'ops'], '负责域'))
    return commit(c, 'project', { type: 'member_add', member: { id: /^[a-z0-9_-]+$/.test(need(f, 'id', '成员标识')) ? f.id : fail('成员标识只能用小写字母、数字、下划线、短横线'), name: need(f, 'name', '显示名'), role: need(f, 'role', '角色'), domains, ...(f.familiar ? { familiar: familiarOf(f) } : {}) } }, f, { freeBy: c.state.members.length === 0 })
  },
  'member update'(c, f) {
    const set = {}; if (f.name) set.name = f.name; if (f.role) set.role = f.role; if (f.domains) set.domains = list(f.domains); if (f.familiar) set.familiar = familiarOf(f)
    if (!Object.keys(set).length) fail('没有要改的内容：--name、--role、--domains、--familiar 至少给一个')
    return commit(c, 'project', { type: 'member_update', member: member(c, need(f, 'id', '成员标识'), '成员'), set, ...pick(f, ['quote']) }, f, { byMember: true })
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
    if (level === 'L0' && status === 'skipped') fail('必须最先完成的配置项不能暂不填')
    if (item.id === 'version_owners' && status === 'confirmed' && !c.state.versions.length) fail('还没有任何版本。先按 SOP-06 新建第一个版本并登记负责人（version new），再确认这一项')
    if (f.owner) member(c, f.owner, '归属人')
    return commit(c, 'project', { type: 'config_set', item: item.id, status, ...pick(f, ['quote', 'note', 'owner', 'due']) }, f, { byMember: status === 'confirmed' })
  },
  'module set'(c, f) { return commit(c, 'project', { type: 'module_set', module: oneOf(f.module, ['i18n', 'planning', 'smoke'], '模块'), status: oneOf(f.status, ['on', 'off', 'declined'], '状态'), quote: need(f, 'quote', '使用者原话') }, f, { byMember: true }) },

  'version new'(c, f) {
    if (!c.state.initialized) fail('项目还没有初始化，先运行 init')
    if (c.state.config.find((x) => x.id === 'product_info')?.status !== 'confirmed') fail('「产品基本信息」还没有确认，确认后才能新建版本')
    const id = need(f, 'version', '版本号'); if (!/^v\d+\.\d+\.\d+$/.test(id)) fail('版本号格式应为 v1.2.3')
    if (c.state.versions.some((v) => v.id === id)) fail(`版本号 ${id} 已经被占用（已检查本机能看到的所有分支）。换一个版本号`)
    const flow = oneOf(f.flow ?? 'standard', Object.keys(FLOWS), '流程 --flow')
    const owners = { product: member(c, need(f, 'product', '产品负责人'), '产品负责人'), engineering: member(c, need(f, 'engineering', '研发负责人'), '研发负责人'), testing: member(c, need(f, 'testing', '测试负责人'), '测试负责人'), ...(f.ops ? { ops: member(c, f.ops, '运维负责人') } : {}) }
    if (f.planned && !/^\d{4}-\d\d-\d\d$/.test(f.planned)) fail('计划发布日格式应为 2026-11-28')
    // The size of a version follows from its number unless stated otherwise.
    const [, minor, patch] = id.slice(1).split('.').map(Number), byNumber = patch ? 'patch' : minor ? 'minor' : 'major'
    const kind = oneOf(f.kind ?? byNumber, ['major', 'minor', 'patch'], '版本大小 --kind')
    if (flow === 'hotfix' && !c.state.versions.some((v) => v.status === 'released') && !c.state.deploys.some((d) => d.env === 'production')) fail('热修复流程只用于修已发布版本的生产缺陷，现在还没有已发布的版本，也没有生产部署记录。新功能用常规流程')
    if (flow === 'hotfix' && (kind !== 'patch' || byNumber !== 'patch' || !f.fixes)) fail('热修复流程只用于修已发布版本的生产缺陷：版本号必须是补丁号（如 v1.0.0 的热修复是 v1.0.1），并用 --fixes 写明修的生产缺陷编号。其他版本用常规流程')
    return commit(c, id, { type: 'version_create', flow, kind, goal: f.goal ?? '待确认', base: f.base ?? null, branch: f.branch ?? null, planned_release: f.planned ?? null, owners, ...(f.fixes ? { fixes: list(f.fixes) } : {}) }, f)
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
  'version onboard'(c, f) {
    const v = versionOf(c, f)
    if (c.state.project?.type !== 'legacy') fail('声明起点只用于存量产品接入：版本在纳入面板之前已经做到了某个阶段。新产品的版本要从第一个阶段开始')
    return commit(c, v.id, { type: 'onboard', stage: oneOf(f.stage, FLOWS[v.flow], '阶段'), note: f.note ?? null, quote: need(f, 'quote', '使用者原话') }, f, { byMember: true })
  },
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
      const [text, ok, evidence, source, who, quote] = String(raw).split('|').map((x) => x.trim())
      if (!text || !['ok', 'no'].includes(ok) || !evidence) fail(`第 ${i + 1} 条 --check 格式应为 "${CHECK_FORMAT}"`)
      const check = { id: `${stage}.${i + 1}`, text, ok: ok === 'ok', evidence, source: oneOf(source || 'manual', ['script', 'manual', 'told'], '核对方式') }
      // "told" is a condition nobody here verified: it only passes on a named person's own words about this very condition.
      if (check.source === 'told' && check.ok) {
        if (!who || !quote) fail(`第 ${i + 1} 条「${text}」是按口述记通过的，要写明谁说的和他针对这一条的原话："${text}|ok|依据|told|成员标识|原话"。没有人针对这一条说过，就记 no`)
        check.told = { by: member(c, who === 'me' ? c.me : who, '说这话的人'), quote }
      }
      return check
    })
    if (!checks.length) fail(`至少要有一条 --check "${CHECK_FORMAT}"`)
    const told = checks.filter((x) => x.told), same = told.find((x, i) => told.findIndex((y) => y.told.quote === x.told.quote) !== i)
    if (same) fail(`「${same.told.quote}」被用作不止一条门控条件的依据。一句话不能替多条条件作证：逐条问使用者，各记各的原话；没有逐条说过的记 no`)
    checks.unshift(...autoChecks(v, stage, c.state.online))
    const result = checks.every((x) => x.ok) ? 'pass' : 'fail'
    const onWord = told.length ? `\n其中 ${told.length} 条是按口述记的，没有核实：${told.map((x) => x.text).join('；')}。请求签收时要在摘要里单独列出。` : ''
    return commit(c, v.id, { type: 'gate_check', stage, result, checks }, f) + onWord + (result === 'fail' ? `\n门控未通过：${checks.filter((x) => !x.ok).map((x) => `${x.text}（${x.evidence}）`).join('；')}` : '\n门控通过。')
  },
  'stage request'(c, f) { const v = versionOf(c, f); return commit(c, v.id, { type: 'signoff_request', stage: oneOf(f.stage, FLOWS[v.flow], '阶段'), to: list(need(f, 'to', '请谁签收')).map((id) => member(c, id, '签收人')), summary: need(f, 'summary', '本阶段摘要') }, f) },
  'stage complete'(c, f) {
    const v = versionOf(c, f), stage = oneOf(f.stage, FLOWS[v.flow], '阶段')
    if (v.current?.stage !== stage) fail(`「${STAGE_NAME[stage]}」不在进行中${v.current ? `，当前是「${v.current.name}」` : ''}`)
    // Only the latest check since entering the stage counts; an older passing one cannot outvote a newer failing one.
    const check = v.current.check
    if (!check) fail('签收前要先做一次本阶段的门控核对（stage check），并且是这次进入阶段之后做的')
    if (check.result !== 'pass') fail('最近一次门控核对没有通过，不能签收')
    const mode = oneOf(f.mode ?? 'human', MODES, '放行方式')
    if (mode !== 'human') fail('「评审后人工签收」和「评审团自动放行」要等评审记录落地后才能用，目前只能人工签收（--mode human，或不写 --mode）')
    if (!v.waiting || Date.parse(v.waiting.since) < Date.parse(check.at)) fail('签收前要先把本阶段摘要和门控核对结果给签收人看，并记录请求签收（stage request，在最近一次门控核对之后）')
    const signoff = { mode }
    const signer = member(c, need(f, 'signer', '签收人'), '签收人')
    if (!Object.values(v.owners).includes(signer)) fail(`签收人必须是 ${v.id} 登记的负责人之一`)
    if (stage === 'release' && signer !== v.owners.product) fail('发布完成的交付确认只能由产品负责人签收')
    Object.assign(signoff, { by: signer, quote: need(f, 'quote', '签收人的原话') })
    if (stage === 'release') {
      if (!v.deployedToProduction) fail('还没有本版本部署到生产的记录。部署后先用 deploy 记录（没走完门控就上线的用 --action exception），再签收发布')
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
    const env = oneOf(f.env, ['dev', 'test', 'staging', 'production'], '环境 --env'), action = oneOf(f.action, ['deploy', 'rollback', 'exception', 'baseline', 'verify'], '动作 --action')
    const versions = list(need(f, 'versions', '涉及的版本号'))
    const unknown = action === 'baseline' ? [] : versions.filter((id) => !c.state.versions.some((v) => v.id === id))
    if (unknown.length) fail(`版本 ${unknown.join('、')} 不存在。接入前就在线上跑的版本用 --action baseline 记录`)
    const e = { type: 'deploy', env, action, versions, ...pick(f, ['build', 'ref', 'note', 'checked']) }
    // "verify" adds the missing proof to a deployment recorded earlier: what is actually running was looked at.
    if (action === 'verify') {
      if (env !== 'production') fail('核对线上版本标识只用于生产环境')
      if (!c.state.online.running) fail('还没有生产部署记录，没有可核对的')
      need(f, 'checked', '怎么核对的、线上实际读到的版本标识')
      return commit(c, 'project', e, f)
    }
    // A first release has nothing to roll back to: the target may be empty, and production then runs no version.
    if (action === 'rollback') e.target = { version: f['target-version'] ?? null, build: f['target-build'] ?? null }
    // A baseline only states what was already running when the product was onboarded; nobody approved it here.
    // An exception release is recorded after the fact, often without knowing who approved it: the approver is optional there.
    if (env === 'production' && ['deploy', 'rollback'].includes(action) || f['approved-by']) e.approved = { by: member(c, need(f, 'approved-by', '谁批准的'), '批准人'), quote: need(f, 'quote', '批准人的原话') }
    const unchecked = env === 'production' && action !== 'baseline' && !f.checked
    return commit(c, 'project', e, f) + (unchecked ? '\n线上版本标识还没核对：只知道「说是部署了」，不知道线上实际在跑哪个构建。拿到线上实际的版本标识后运行 deploy --env production --action verify --versions … --checked "怎么核对的、读到的标识"；在那之前状态里会一直提示。' : '')
  },
  'item add'(c, f) {
    const v = versionOf(c, f), id = nextId(c, 'FEAT')
    return commit(c, v.id, { type: 'item_add', item: id, module: f.module ?? null, name: need(f, 'name', '功能描述，一句话'), priority: oneOf(f.priority, ['P0', 'P1', 'P2'], '优先级 --priority'), ...(f.source ? { source: f.source } : {}) }, f) + `\n编号：${id}（草稿）。在 requirements.md 的功能清单里用这个编号。`
  },
  'item confirm'(c, f) { const v = versionOf(c, f), it = itemOf(v, f); return commit(c, v.id, { type: 'item_status', item: it.id, status: 'confirmed', quote: need(f, 'quote', '确认人的原话') }, f, { byMember: true }) },
  'item change'(c, f) {
    const v = versionOf(c, f), it = itemOf(v, f), ref = need(f, 'ref', '对应的变更编号（先用 change open 登记）')
    if (!v.changes.some((x) => x.id === ref)) fail(`${v.id} 没有登记过变更 ${ref}。先用 change open 登记这次变更，再用它给的编号。已有：${v.changes.map((x) => x.id).join('、') || '（还没有）'}`)
    return commit(c, v.id, { type: 'item_status', item: it.id, status: 'changed', ref, ...(f.note ? { note: f.note } : {}) }, f)
  },
  'item drop'(c, f) { const v = versionOf(c, f), it = itemOf(v, f); return commit(c, v.id, { type: 'item_status', item: it.id, status: 'dropped', reason: need(f, 'reason', '移出原因'), quote: need(f, 'quote', '决定人的原话') }, f, { byMember: true }) },
  'item list'(c, f) {
    const v = versionOf(c, f)
    return v.items.length ? v.items.map((x) => `${x.id} | ${x.priority} | ${ITEM_STATUS[x.status]}${x.ref ? '（' + x.ref + '）' : ''} | ${x.module ? x.module + '：' : ''}${x.name}`).join('\n') : `${v.id} 还没有登记需求条目。`
  },
  'decision add'(c, f) {
    const v = versionOf(c, f), quote = String(need(f, 'quote', '决定人的原话')).trim(), said = bare(quote)
    if (/[（(]\s*指\s*[:：]/.test(quote)) fail('原话里只放使用者说的话。「（指：……）」这类说明是你加的，填到 --refers-to（这句话指的是哪条建议）')
    if (NOT_A_DECISION.includes(said)) fail(`「${quote}」是把选择交回给你，不算决定。保持待确认：说明你的建议和理由，请使用者明确选一个；他没选就不记`)
    if ((ASSENT.includes(said.toLowerCase()) || /按(你的?|照)?(建议|推荐)|按你说的/.test(said)) && !f['refers-to']) fail(`「${quote}」单看不出同意的是什么。加 --refers-to 写明它指的是上一条消息里逐条列出的哪一条建议；上一条没有逐条列出的，不算决定，重新问`)
    if (f.replaces && !v.decisions.some((x) => x.id === f.replaces)) fail(`${v.id} 没有决定 ${f.replaces}。已有：${v.decisions.map((x) => x.id).join('、') || '（还没有）'}`)
    const id = nextId(c, 'D')
    return commit(c, v.id, { type: 'decision_add', dec: id, question: need(f, 'question', '要定的是什么事，一句话'), text: need(f, 'decision', '定成了什么，一句话'), quote, ...(f['refers-to'] ? { refers_to: f['refers-to'] } : {}), ...(f.docs ? { docs: f.docs } : {}), ...(f.replaces ? { replaces: f.replaces } : {}) }, f, { byMember: true }) + `\n编号：${id}。需要交代来龙去脉的，在 decisions.md 里用这个编号写。`
  },
  'decision list'(c, f) {
    const v = versionOf(c, f), nm = (id) => c.state.members.find((m) => m.id === id)?.name ?? id
    return v.decisions.length ? v.decisions.map((d) => `${d.id} | ${d.replacedBy ? '被 ' + d.replacedBy + ' 替代' : '有效'} | ${d.at.slice(0, 10)} ${nm(d.by)} | ${d.question} → ${d.text} | 原话「${d.quote}」${d.refersTo ? '（指：' + d.refersTo + '）' : ''}${d.docs ? ' | 影响 ' + d.docs : ''}`).join('\n') : `${v.id} 还没有登记决定。`
  },
  'change open'(c, f) {
    const v = versionOf(c, f), impact = oneOf(f['scope-impact'], Object.keys(CHANGE_IMPACT), '范围影响 --scope-impact')
    const type = oneOf(f.type, Object.keys(CHANGE_TYPE), '变更类型 --type'), affects = targetsOf(f.affects, '--affects（受影响的文档）')
    // Growing the scope is the owner's call: it needs a recorded decision before any document changes.
    if (impact === 'expand') {
      const ref = need(f, 'decision', '范围扩大要先有负责人的决定：用 decision add 记下他的原话，再把编号填在这里')
      const d = v.decisions.find((x) => x.id === ref) ?? fail(`${v.id} 没有决定 ${f.decision}。范围扩大要先取得负责人确认并用 decision add 登记`)
      if (d.replacedBy) fail(`决定 ${d.id} 已经被 ${d.replacedBy} 替代，不能作为这次扩大范围的依据`)
    } else if (f.decision && !v.decisions.some((x) => x.id === f.decision)) fail(`${v.id} 没有决定 ${f.decision}`)
    const id = nextId(c, 'CHANGE')
    return commit(c, v.id, { type: 'change_open', chg: id, change_type: type, summary: need(f, 'summary', '变更了什么，一句话'), reason: need(f, 'reason', '为什么变更'), impact, affects, ...(f.decision ? { decision: f.decision } : {}) }, f) + `\n编号：${id}。现在可以改文档了：每改完一份运行 change handle；细节在 CHANGES.md 里用这个编号写。`
  },
  'change affect'(c, f) { const v = versionOf(c, f), ch = changeOf(v, f); return commit(c, v.id, { type: 'change_affect', chg: ch.id, affects: targetsOf(f.add, '--add（新发现受影响的文档）') }, f) },
  'change handle'(c, f) {
    const v = versionOf(c, f), ch = changeOf(v, f), targets = targetsOf(f.target, '--target（改完的是哪份文档）')
    const miss = targets.filter((k) => !ch.targets.some((t) => t.key === k))
    if (miss.length) fail(`变更 ${ch.id} 的影响范围里没有 ${miss.map((k) => CHANGE_TARGETS[k]).join('、')}。确实受影响的话先运行 change affect --add ${miss.join(',')}`)
    const out = commit(c, v.id, { type: 'change_handle', chg: ch.id, targets, ...(f.note ? { note: f.note } : {}) }, f)
    const left = ch.targets.filter((t) => !t.done && !targets.includes(t.key)).map((t) => CHANGE_TARGETS[t.key])
    return out + (left.length ? `\n${ch.id} 还差：${left.join('、')}` : `\n${ch.id} 受影响的文档都处理完了。请使用者确认后运行 change close（要他的原话）。`)
  },
  'change close'(c, f) {
    const v = versionOf(c, f), ch = changeOf(v, f), left = leftOf(ch)
    if (left.length) fail(`变更 ${ch.id} 还有没处理的：${left.join('、')}。处理完再完结`)
    return commit(c, v.id, { type: 'change_close', chg: ch.id, quote: need(f, 'quote', '确认人的原话') }, f, { byMember: true })
  },
  'change list'(c, f) {
    const v = versionOf(c, f)
    return v.changes.length ? v.changes.map((x) => `${x.id} | ${CHANGE_TYPE[x.type]} | 范围${CHANGE_IMPACT[x.impact]}${x.decision ? '（' + x.decision + '）' : ''} | ${x.closed ? '已完结' : leftOf(x).length ? '处理中，还差 ' + leftOf(x).join('、') : '文档都处理完了，等使用者确认完结'} | ${x.at.slice(0, 16).replace('T', ' ')} 登记 | ${x.summary}`).join('\n') : `${v.id} 还没有登记变更。`
  },
  'defect open'(c, f) {
    const v = versionOf(c, f), id = nextId(c, 'BUG')
    const found = oneOf(f['found-in'], Object.keys(DEFECT_FOUND), '发现阶段 --found-in')
    return commit(c, v.id, { type: 'defect_open', defect: id, title: need(f, 'title', '一句话描述现象'), severity: oneOf(f.severity, ['P0', 'P1', 'P2', 'P3'], '严重程度 --severity'), found_in: found, ...(f.module ? { module: f.module } : {}), ...(f.case ? { case: f.case } : {}) }, f) + `\n编号：${id}（待修复）。在 defects.md 里用这个编号写复现步骤。`
  },
  'defect status'(c, f) {
    const v = versionOf(c, f), d = defectOf(v, f), to = oneOf(f.to, ['fixing', 'fixed', 'verifying', 'open'], '改为 --to')
    if (!DEFECT_NEXT[d.status].includes(to)) fail(`缺陷 ${d.id} 现在是「${DEFECT_STATUS[d.status]}」，不能直接改为「${DEFECT_STATUS[to]}」。可以改为：${DEFECT_NEXT[d.status].filter((x) => x !== 'closed').map((x) => DEFECT_STATUS[x]).join('、')}${DEFECT_NEXT[d.status].includes('closed') ? '，或用 defect close 关闭' : ''}`)
    if (to === 'open') need(f, 'note', '退回或重新打开的原因')
    return commit(c, v.id, { type: 'defect_status', defect: d.id, status: to, ...(f.assignee ? { assignee: member(c, f.assignee, '修复人') } : {}), ...(f.build ? { build: f.build } : {}), ...(f.note ? { note: f.note } : {}) }, f)
  },
  'defect close'(c, f) {
    const v = versionOf(c, f), d = defectOf(v, f)
    if (d.status !== 'verifying') fail(`缺陷 ${d.id} 现在是「${DEFECT_STATUS[d.status]}」。复测通过并改为「待验收」（defect status --to verifying）后，才能由人验收关闭`)
    return commit(c, v.id, { type: 'defect_status', defect: d.id, status: 'closed', verifier: member(c, need(f, 'verifier', '验收人'), '验收人'), quote: need(f, 'quote', '验收人的原话') }, f)
  },
  'defect waive'(c, f) {
    const v = versionOf(c, f), d = defectOf(v, f)
    return commit(c, v.id, { type: 'defect_waive', defect: d.id, scope: need(f, 'scope', '豁免范围：只在什么条件下可以带着它走'), quote: need(f, 'quote', '豁免人的原话'), ...(f.until ? { until: f.until } : {}), ...(f.decision ? { decision: f.decision } : {}) }, f, { byMember: true })
  },
  'defect list'(c, f) {
    const v = versionOf(c, f), nm = (id) => c.state.members.find((m) => m.id === id)?.name ?? id
    return v.defects.length ? v.defects.map((d) => `${d.id} | ${d.severity} | ${DEFECT_STATUS[d.status]}${d.reopened ? `（退回 ${d.reopened} 次）` : ''} | ${DEFECT_FOUND[d.foundIn]}发现，${d.status === 'closed' ? `用了 ${d.days} 天` : `已 ${d.days} 天`}${d.assignee ? '，修复 ' + nm(d.assignee) : ''}${d.case ? '，用例 ' + d.case : ''} | ${d.title}`).join('\n') : `${v.id} 还没有登记缺陷。`
  },
  'downstream-check'(c, f) {
    const v = versionOf(c, f), target = need(f, 'target', '被确认的在途版本')
    const t = c.state.versions.find((x) => x.id === target) ?? fail(`版本 ${target} 不存在`)
    if (t.id === v.id) fail('--target 要写另一个在途版本，不是本版本')
    if (['released', 'abandoned'].includes(t.status)) fail(`${target} 已经${t.status === 'released' ? '发布' : '放弃'}，不属于在途版本，不用确认。已发布的版本不再改动`)
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
  render(c, f) {
    const out = typeof f.out === 'string' ? (isAbsolute(f.out) ? f.out : join(c.root, f.out)) : join(c.root, 'cockpit.html')
    writeFileSync(out, renderCockpit(c))
    return `驾驶舱已生成：${out}\n用浏览器打开即可。它是生成当时的快照，状态变化后重新运行本命令。这个文件不入库。`
  },
  whoami(c, f) {
    if (typeof f.set === 'string') {
      const id = member(c, f.set, '成员')
      const file = profilePaths(c.root)[0], old = existsSync(file) ? readFileSync(file, 'utf8') : ''
      const text = /^member:.*$/m.test(old) ? old.replace(/^member:.*$/m, `member: ${id}`) : `member: ${id}\n\n# 个人档案\n\n这个文件只在本机，不入库。第一行说明这台电脑上操作面板的是哪位成员。\n${old ? '\n' + old : ''}`
      writeFileSync(file, text)
      return `已记下：当前操作者是 ${c.state.members.find((m) => m.id === id).name}（${id}）。保存在 ${file}，只在本机，不入库。`
    }
    if (c.me) return `当前操作者：${c.state.members.find((m) => m.id === c.me).name}（${c.me}），来自 ${c.profile.file}`
    return c.profile ? `个人档案里写的成员「${c.profile.member}」不是在册成员。用 whoami --set <成员标识> 改正。在册成员：${c.state.members.map((m) => m.id).join('、') || '（还没有）'}` : `还不知道当前操作者是谁。问使用者「你是哪位成员」，然后运行 whoami --set <成员标识>。在册成员：${c.state.members.map((m) => m.id).join('、') || '（还没有）'}`
  },
  help() { return HELP },
}

const CHECK_FORMAT = '条件|ok 或 no|依据|script、manual 或 told'
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

const familiarOf = (f) => list(f.familiar).map((d) => oneOf(d, Object.keys(FAMILIAR), '熟悉的领域'))
// Recorded decisions show which fields a member actually works in: sign-offs, confirmed requirements, defects fixed,
// accepted or waived, production approvals. Being the product's overall owner leaves no such trace, so it is never inferred.
const STAGE_FIELDS = { requirements: ['product'], design: ['product'], tech: ['frontend', 'backend'], dev: ['frontend', 'backend'], test_design: ['testing'], test: ['testing'], release: [] }
function familiarText(s, id) {
  const m = s.members.find((x) => x.id === id)
  if (!m.familiar?.length) return '熟悉的领域：没记（按都熟悉对待；合适的时候问一次，用 member update --familiar 记下）'
  // Only what happened after the list was last set counts, so answering "no" (re-recording the same list) stops the hint.
  const since = Date.parse(m.familiarAt), acts = new Map()
  const add = (fields, at) => { if (Date.parse(at) > since && fields.length && !fields.some((d) => m.familiar.includes(d))) { const k = fields.map((d) => FAMILIAR[d]).join('或'); acts.set(k, (acts.get(k) ?? 0) + 1) } }
  for (const g of s.signoffs) if (g.by === id) add(STAGE_FIELDS[g.stage] ?? [], g.at)
  for (const d of s.deploys) if (d.env === 'production' && d.approved?.by === id) add(['ops'], d.at)
  for (const v of s.versions) {
    for (const it of v.items) if (it.confirmed?.by === id) add(['product'], it.confirmed.at)
    for (const d of v.defects) {
      if (d.assignee === id && d.assignedAt) add(['frontend', 'backend'], d.assignedAt)
      if (d.verifier === id && d.closedAt) add(['testing'], d.closedAt)
      if (d.waiver?.by === id) add(['testing'], d.waiver.at)
    }
  }
  const text = `熟悉的领域：${m.familiar.map((d) => FAMILIAR[d]).join('、')}`
  return acts.size ? `${text}\n  提示：${m.name} 记下熟悉的领域之后，又在 ${[...acts].map(([k, n]) => `${k}（${n} 次）`).join('、')} 做过决定（签收阶段、确认需求、修复或验收缺陷、批准生产部署）。问他一次要不要把这些也记成熟悉的领域，按他的回答运行 member update --familiar（不加也照原样记一次，之后不再提）` : text
}

/* ---------- status summary: the standard read entry for agents ---------- */
function statusText(c, only) {
  const s = c.state, tz = s.tz, md = (iso) => dayIn(tz, iso).slice(5), hm = (iso) => isoIn(tz, new Date(iso)).slice(11, 16)
  const nm = (id) => s.members.find((m) => m.id === id)?.name ?? id
  const lines = []
  if (c.all.problems.length) lines.push(`⚠ 有 ${c.all.problems.length} 个事件文件损坏，没有生效：`, ...c.all.problems.map((p) => `  - ${p.where}：${p.why}`))
  if (!s.initialized) { lines.push('【项目未初始化】还没有初始化记录。只能做初始化相关的工作。', '下一步：node tools/panel.mjs init --name <产品名> --type new|legacy --by <你的标识>'); return lines.join('\n') }
  lines.push(c.me ? `当前操作者：${nm(c.me)}（${c.me}）· ${familiarText(s, c.me)}` : '当前操作者：未识别。需要人做决定时先问「你是哪位成员」，再运行 whoami --set <成员标识>')
  lines.push(`【项目】${s.project.name}（${s.project.type === 'new' ? '新产品' : '存量产品'}）· ${s.project.positioning}`)
  const r = s.online.running
  lines.push(`线上在跑：${r ? `${r.version ?? '没有版本'}${r.build ? ' ' + r.build : ''}（${md(r.since)} ${r.how === 'rollback' ? '从 ' + r.from.join('、') + ' 回滚' : r.how === 'baseline' ? '登记，接入面板前已在线上' : r.how === 'exception' ? '例外上线，没走完门控，待补齐' : '部署'}${r.how !== 'baseline' && !r.checked ? '，⚠ 线上版本标识还没核对' : ''}）` : '还没有生产部署记录'} · 最后发布：${s.online.lastReleased ? `${s.online.lastReleased.version}（${md(s.online.lastReleased.at)}）` : '无'}`)
  const l0 = s.config.filter((x) => x.level === 'L0' && x.status !== 'confirmed'), l1 = s.config.filter((x) => x.level === 'L1' && !['confirmed', 'na'].includes(x.status)), l2 = s.config.filter((x) => x.level === 'L2' && ['todo', 'draft'].includes(x.status))
  const CS = { todo: '未填', skipped: '暂不填', draft: '草稿待审' }
  if (l0.length) {
    const step = !s.members.length ? '登记成员（member add）' : l0.some((x) => x.id === 'product_info') ? '确认「产品基本信息」（config set --item product_info --status confirmed）' : !s.versions.length ? '新建第一个版本并登记负责人（version new）' : '确认「版本与负责人」（config set --item version_owners --status confirmed）'
    lines.push(`下一步：${step}。顺序是：登记成员 → 确认产品基本信息 → 新建第一个版本 → 确认版本与负责人`)
  }
  lines.push(l0.length ? `配置：必须最先完成的还差 ${l0.map((x) => x.name).join('、')}。完成前不能推进任何阶段` : `配置：必须项已就绪${l1.length ? ` · 会卡阶段的待办 ${l1.length} 项：${l1.map((x) => `${x.name}（${CS[x.status]}${STAGE_NAME[x.before] ? '，进入' + STAGE_NAME[x.before] + '前' : x.before === 'first_upload' ? '，第一次上传文件前' : ''}）`).join('、')}` : ''}${l2.length ? ` · 不阻断的 ${l2.length} 项未完成：${l2.map((x) => x.name).join('、')}` : ''}`)
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
    if (v.current?.check) lines.push(`  门控核对：${md(v.current.check.at)} ${v.current.check.result === 'pass' ? '通过' + (v.current.check.checks.some((x) => x.told) ? `（其中 ${v.current.check.checks.filter((x) => x.told).length} 条按口述，没有核实）` : '') : '未通过：' + v.current.check.checks.filter((x) => !x.ok).map((x) => x.text).join('；')}`)
    if (v.waiting) lines.push(`  等签收：已请 ${v.waiting.to.map(nm).join('、')} 签收，等了 ${v.waiting.days} 天`)
    if (v.items.length) { const n = (st) => v.items.filter((x) => x.status === st).length; lines.push(`  需求条目：${v.items.length - n('dropped')} 条（${[['confirmed', '已确认'], ['changed', '已变更'], ['draft', '草稿']].filter(([k]) => n(k)).map(([k, t]) => `${t} ${n(k)}`).join('，')}${n('dropped') ? `；另有 ${n('dropped')} 条已移出` : ''}）`) }
    if (v.defects.length) { const open = openDefects(v), w = v.defects.filter((d) => d.status === 'waived').length; lines.push(`  缺陷：未关闭 ${open.length} 条${open.length ? `（${['P0', 'P1', 'P2', 'P3'].filter((p) => open.some((d) => d.severity === p)).map((p) => `${p} ${open.filter((d) => d.severity === p).length}`).join('，')}）` : ''} · 已关闭 ${v.defects.length - open.length - w}${w ? ` · 豁免 ${w}` : ''}`) }
    if (v.changes.length) { const open = v.changes.filter((x) => !x.closed); lines.push(`  变更：${v.changes.length} 条${open.length ? `，未完结 ${open.length} 条：${open.map((x) => `${x.id}（${x.summary}）${leftOf(x).length ? '还差 ' + leftOf(x).join('、') : '文档已处理完，等使用者确认完结'}`).join('；')}` : '，全部已完结'}`) }
    if (v.decisions.length) lines.push(`  决定：有效 ${v.decisions.filter((d) => !d.replacedBy).length} 条${v.decisions.some((d) => d.replacedBy) ? `，被替代 ${v.decisions.filter((d) => d.replacedBy).length} 条` : ''}（decision list 查看，重新设计前先查）`)
    for (const b of v.blocks) lines.push(`  阻塞 ${b.days} 天（归 ${nm(b.owner)}）：${b.text}`)
    if (s.online.deployedNotReleased.includes(v.id)) lines.push('  已部署到生产，发布完成还没签收')
    for (const m of v.pendingMerges) lines.push(`  ⚠ 还欠一次合入：${m.from} 的改动${m.result === 'partial' ? '只合入了一部分' : '暂缓合入'}（${m.evidence}）`)
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
  render [--out 路径]                生成只读驾驶舱 cockpit.html（给人看的页面，不入库）

项目
  init --name --type new|legacy [--positioning --timezone] --by
  member add --id --name --role --domains product,engineering,testing,ops [--familiar product,frontend,backend,testing,ops,owner] --by
  member update --id [--name --role --domains --familiar --quote] --by
      （--familiar 是这位成员熟悉的领域，只影响怎么向他说明，不影响谁能签收；不写就按都熟悉对待）
  member deactivate --id --reason --by
  settings set --key gate.<阶段>|stall_days.standard|stall_days.hotfix --value --quote --by
  config set --item --status todo|skipped|draft|confirmed|na [--quote --note --owner --due] --by
      （confirmed 必须带 --quote 且 --by 是成员；skipped、na 必须带 --note；配置项标识见 state/defs/config-items.json）
  whoami [--set 成员标识]            查看或记下这台电脑上的当前操作者（保存在不入库的 profile.md）
  module set --module i18n|planning|smoke --status on|off|declined --quote --by
  deploy --env dev|test|staging|production --action deploy|rollback|exception|baseline|verify --versions a,b [--build --checked --target-version --target-build --approved-by --quote --ref --note] --by
      （生产环境的 deploy、rollback 必须带 --approved-by 和 --quote；exception 不知道谁批准的可以不带，baseline 不需要；回滚写 --target-version，首次上线回滚没有上一个版本时不写）
      （--checked 写怎么核对的、线上实际读到的版本标识；生产部署没带它会一直提示「还没核对」，核对后用 --action verify --checked 补上）

版本（都要 --version）
  version new --flow standard|hotfix --product --engineering --testing [--goal --ops --kind --base --branch --planned --fixes] --by
      （--goal 一句话的版本目标，使用者说不出时可以先不写，之后用 version update 补）
  version update [--goal --branch --base --product --engineering --testing --ops] --quote --by
  version replan --to 日期 --reason --by
  version onboard --stage --quote [--note] --by                （只用于存量产品接入）
  version hold --reason --resume-when --quote --by
  version resume --quote --by
  version abandon --reason --quote --by

阶段（都要 --version --stage）
  stage enter --by
  stage check --check "${CHECK_FORMAT}"（可多条）--by
      （script 命令或脚本验证的；manual 自己读了文件、看了记录核实的；told 只是听人说的、没有核实：记 ok 必须再写「|成员标识|他针对这一条的原话」，一句话只能作一条的依据）
  stage request --to a,b --summary --by
  stage complete --signer --quote --by                         （之前要有通过的 stage check 和之后的 stage request）
  stage rollback --from --to --reason --quote [--ref] --by      （不用 --stage）

需求条目、缺陷、决定、变更（都要 --version；编号由命令分配：成员标识 + 他自己的流水号，如 BUG-lin-003）
  item add --name --priority P0|P1|P2 [--module --source] --by
  item confirm --item --quote --by                             （--by 是确认的成员）
  item change --item --ref 变更编号 [--note] --by                 （变更编号要先用 change open 登记）
  item drop --item --reason --quote --by                       （移出本版本，--by 是决定的成员）
  item list
  defect open --title --severity P0|P1|P2|P3 --found-in self_test|test|prod_verify|acceptance [--module --case] --by
  defect status --defect --to fixing|fixed|verifying|open [--assignee --build --note] --by
      （fixed 已修复待复测，verifying 复测通过待人验收；open 是退回或重新打开，要写 --note）
  defect close --defect --verifier --quote --by                （人验收通过）
  defect waive --defect --scope --quote [--until --decision] --by   （--by 是豁免的成员）
  defect list
  decision add --question --decision --quote [--refers-to --docs --replaces 旧决定编号] --by   （--by 是做决定的成员）
      （--quote 只放他说的话；「按建议」「可以」这类短话必须加 --refers-to 写明指的是上一条里的哪条建议；
        「你决定」「都行」「按规范来」不算决定，命令不记；推翻旧决定用 --replaces）
  decision list
  change open --type ${Object.keys(CHANGE_TYPE).join('|')} --summary --reason --scope-impact none|expand|shrink --affects 文档,文档 [--decision 决定编号] --by
      （先登记，再改文档；范围扩大 expand 必须带 --decision。--affects 可选：${Object.keys(CHANGE_TARGETS).join('、')}）
  change affect --change --add 文档,文档 --by                   （做的过程中发现还影响别的文档）
  change handle --change --target 文档,文档 [--note] --by        （改完一份记一次）
  change close --change --quote --by                           （全部处理完，使用者确认后完结；--by 是确认的成员）
  change list

其他
  note --version --text --by
  block --version --text --owner [--ref] --by
  unblock --version --target 事件标识 [--note] --by
  downstream-check --version --target --result merged|partial|not_needed|deferred --evidence --confirmed-by --quote --by
  event void --target 事件标识 --reason --by

通用：--by 操作人。AI 按流程自己记录的（进入阶段、门控核对、请求签收、记录签收、进展、阻塞）写 ai；
      必须由人决定的（init、成员、设置、配置项确认、模块、挂起/恢复/放弃、声明起点）写做决定的成员标识，当前操作者可以写 me。
      me 只用于使用者本人做的决定或他明确要你做的事；你按流程自己判断要做的写 ai，不借使用者的名义。
      原话（--quote）必须是使用者针对这件事说的话：同一句话不能记作两件不同的事的原话。
      --at 发生时间（默认现在）；补记早于已有记录的事件要加 --backfill "原因"；--root 指定仓库目录。
阶段键：${STAGES.map((s) => `${s} ${STAGE_NAME[s]}`).join('、')}`

/** Programmatic entry (used by the tests). Returns { code, out }. */
export function run(argv, { root, env = process.env } = {}) {
  const { words, flags } = parse(argv)
  // The tool always works on the panel it is part of, wherever it is called from. Going by the caller's directory
  // would report a healthy project as uninitialized when the command is run from somewhere else.
  const base = resolve(flags.root ?? root ?? join(import.meta.dirname, '..'))
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
