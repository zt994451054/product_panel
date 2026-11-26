// Replays events into the current state. Pure: no file or git access.
// Nothing here is stored; every number is recomputed from the events on each run.

export const FLOWS = {
  standard: ['requirements', 'design', 'tech', 'test_design', 'dev', 'test', 'release'],
  hotfix: ['tech', 'test_design', 'dev', 'test', 'release'],
}
export const STAGES = FLOWS.standard
export const STAGE_NAME = { requirements: '需求分析', design: '产品设计', tech: '技术方案', test_design: '测试设计', dev: '开发中', test: '测试', release: '发布' }
// These two gates always belong to a human; hard-coded on purpose so no setting can open them.
export const FIXED_HUMAN = ['test', 'release']
export const ITEM_STATUS = { draft: '草稿', confirmed: '已确认', changed: '已变更', dropped: '已移出' }
export const DEFECT_STATUS = { open: '待修复', fixing: '修复中', fixed: '已修复待复测', verifying: '待验收', closed: '已关闭', waived: '已豁免' }
// Which status a defect may move to from each status. Reopening always goes back to "open".
export const DEFECT_NEXT = { open: ['fixing', 'fixed'], fixing: ['fixed', 'open'], fixed: ['verifying', 'open'], verifying: ['closed', 'open'], closed: ['open'], waived: ['open'] }
export const DEFECT_FOUND = { self_test: '开发自测', test: '测试', prod_verify: '生产业务验证', acceptance: '生产验收' }
export const MODES = ['auto', 'review_human', 'human'] // loosest to strictest
export const DEFAULT_SETTINGS = { 'stall_days.standard': 14, 'stall_days.hotfix': 2 }
export const CONFIG_STATUS = ['todo', 'skipped', 'draft', 'confirmed', 'na']

const dayFmt = {}
/** Calendar day (YYYY-MM-DD) of an instant in the project time zone. */
export function dayIn(tz, iso) {
  const f = dayFmt[tz ?? ''] ??= new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
  return f.format(new Date(iso))
}

export function derive(events, defs = [], { now = new Date().toISOString() } = {}) {
  const voided = new Set(events.filter((e) => e.type === 'void').map((e) => e.target))
  const tz = events.find((e) => e.type === 'project_init' && !voided.has(e.id))?.timezone
  const day = (iso) => dayIn(tz, iso)
  const dayDiff = (a, b) => Math.round((Date.parse(day(b)) - Date.parse(day(a))) / 86400000)
  const hours = (a, b) => (Date.parse(b) - Date.parse(a)) / 3600000
  const later = (a, b) => (Date.parse(a) > Date.parse(b) ? a : b), earlier = (a, b) => (Date.parse(a) < Date.parse(b) ? a : b)

  const project = { info: null, members: new Map(), settings: { ...DEFAULT_SETTINGS }, settingHistory: [], config: new Map(), modules: new Map(), deploys: [], conflicts: [] }
  const versions = new Map(), signoffs = []
  // Ledger numbers (requirement items, defects) are unique across the whole project, whatever version they sit in.
  const ledger = new Map()

  const newVersion = (e) => ({
    id: e.version, create: e, attrs: { ...e }, flow: e.flow,
    stages: Object.fromEntries(FLOWS[e.flow].map((s) => [s, { intervals: [], signoff: null, everDone: false, untracked: false, rollbacks: 0 }])),
    open: null, holds: [], abandoned: null, blocks: [], progress: null, replans: [], rollbacks: [], checks: [], requests: [], downstream: [], items: new Map(), defects: new Map(), conflicts: [], duplicates: [], log: [],
  })
  const paused = (v) => v.holds.length > 0 && !v.holds.at(-1).to
  const nextStage = (v) => FLOWS[v.flow].find((s) => !v.stages[s].signoff && !v.stages[s].untracked) ?? null

  for (const e of events) {
    if (e.type === 'void') { versions.get(e.scope)?.log.push({ e }); continue }
    // Voiding a version creation also retires everything that was written against it.
    if (voided.has(e.id) || (e.create && voided.has(e.create))) { versions.get(e.scope)?.log.push({ e, voided: true }); continue }

    if (e.scope === 'project') {
      const bad = (why) => project.conflicts.push({ e, why })
      switch (e.type) {
        case 'project_init': if (project.info) bad('项目已经初始化过，这条重复的初始化没有生效'); else project.info = { ...e }; break
        case 'project_update': if (project.info) Object.assign(project.info, e.set); else bad('项目还没有初始化'); break
        case 'member_add': if (project.members.has(e.member.id)) bad(`成员标识 ${e.member.id} 已存在，这条没有生效`); else project.members.set(e.member.id, { ...e.member, active: true, joined: day(e.at), familiarAt: e.member.familiar ? e.at : null }); break
        case 'member_update': { const m = project.members.get(e.member); if (m) Object.assign(m, e.set, e.set.familiar ? { familiarAt: e.at } : {}); else bad(`成员 ${e.member} 不存在`); break }
        case 'member_deactivate': { const m = project.members.get(e.member); if (m) m.active = false; else bad(`成员 ${e.member} 不存在`); break }
        case 'setting_set': {
          const stage = e.key.startsWith('gate.') ? e.key.slice(5) : null
          if (stage && FIXED_HUMAN.includes(stage)) bad(`「${STAGE_NAME[stage]}」的签收固定由人完成，这次修改没有生效`)
          else { project.settings[e.key] = e.value; project.settingHistory.push(e) }
          break
        }
        case 'config_set': project.config.set(e.item, e); break
        case 'module_set': project.modules.set(e.module, e); break
        case 'deploy': project.deploys.push(e); break
      }
      continue
    }

    let v = versions.get(e.scope)
    const bad = (why) => { (v ?? project).conflicts.push({ e, why }); v?.log.push({ e, conflict: why }) }
    if (e.type === 'version_create') {
      if (v) { bad(`版本号 ${e.version} 已经被占用（${day(v.create.at)} 创建，目标「${v.create.goal}」）。这条在 ${e.src?.branch ?? '另一处'} 创建的「${e.goal}」没有生效，需要换一个版本号`); continue }
      if (!FLOWS[e.flow]) { project.conflicts.push({ e, why: `不认识的流程类型 ${e.flow}` }); continue }
      v = newVersion(e); versions.set(e.scope, v); v.log.push({ e }); continue
    }
    if (!v) { bad(`${e.scope} 还没有创建，这条没有生效`); continue }
    // Every version event names the creation it was written against. After a version-number clash, the events of the
    // losing side must not act on the winner's version.
    if (e.create && e.create !== v.create.id) { bad(`这条记录属于另一个撞了号的 ${e.scope}（在 ${e.src?.branch ?? '另一处'} 上），没有生效。那个版本换号后要重新记录`); continue }
    // Two people working offline can record the same step twice. The later copy changes nothing and is not a contradiction.
    const dup = (why) => { v.duplicates.push({ e, why }); v.log.push({ e, duplicate: why }) }
    if (e.type === 'stage_enter' && (v.open === e.stage || v.stages[e.stage]?.signoff)) { dup(`「${STAGE_NAME[e.stage]}」${v.open === e.stage ? '已经在进行中' : '已经签收'}，这条重复的进入阶段没有再算一次`); continue }
    if (['gate_check', 'signoff_request', 'stage_complete'].includes(e.type) && v.open !== e.stage && v.stages[e.stage]?.signoff) { dup(`「${STAGE_NAME[e.stage]}」已经签收，这条晚到的记录没有再算一次`); continue }
    const isStage = ['stage_enter', 'stage_complete', 'stage_rollback', 'gate_check', 'signoff_request', 'onboard'].includes(e.type)
    if (isStage && v.abandoned) { bad('版本已放弃，不能再推进阶段'); continue }
    if (isStage && paused(v)) { bad('版本挂起中，恢复后才能推进阶段'); continue }
    if (v.stages.release.signoff && ['hold', 'abandon', 'replan', 'onboard', 'stage_rollback', 'item_add', 'item_status', 'defect_open', 'defect_status', 'defect_waive'].includes(e.type)) { bad('版本已经发布，不能再挂起、放弃、改期、回退，也不能再改它的需求条目和缺陷。线上有问题按生产缺陷处理，要修就开热修复版本'); continue }
    const flow = FLOWS[v.flow]

    switch (e.type) {
      case 'version_update': Object.assign(v.attrs, e.set); break
      case 'replan': v.replans.push(e); v.attrs.planned_release = e.to; break
      case 'onboard': {
        if (!flow.includes(e.stage)) { bad(`这个流程没有「${STAGE_NAME[e.stage] ?? e.stage}」阶段`); continue }
        if (flow.some((s) => v.stages[s].intervals.length || v.stages[s].untracked)) { bad('只能在版本刚创建、还没进入任何阶段时声明起点'); continue }
        for (const s of flow) { if (s === e.stage) break; v.stages[s].untracked = true }
        break
      }
      case 'stage_enter': {
        if (v.open) { bad(`「${STAGE_NAME[v.open]}」还在进行中，不能同时进入「${STAGE_NAME[e.stage] ?? e.stage}」`); continue }
        const next = nextStage(v)
        if (e.stage !== next) { bad(next ? `按流程下一个阶段是「${STAGE_NAME[next]}」，不能直接进入「${STAGE_NAME[e.stage] ?? e.stage}」` : '所有阶段都已签收，版本已发布'); continue }
        v.stages[e.stage].intervals.push({ from: e.at, to: null }); v.open = e.stage; break
      }
      case 'gate_check': if (e.stage !== v.open) { bad(`「${STAGE_NAME[e.stage] ?? e.stage}」不在进行中，这次门控核对没有生效`); continue } v.checks.push(e); break
      case 'signoff_request': if (e.stage !== v.open) { bad(`「${STAGE_NAME[e.stage] ?? e.stage}」不在进行中，这次签收请求没有生效`); continue } v.requests.push(e); break
      case 'stage_complete': {
        if (e.stage !== v.open) { bad(`「${STAGE_NAME[e.stage] ?? e.stage}」不在进行中，这次签收没有生效`); continue }
        const st = v.stages[e.stage], iv = st.intervals.at(-1)
        const req = v.requests.findLast((r) => r.stage === e.stage && Date.parse(r.at) >= Date.parse(iv.from))
        iv.to = e.at; st.signoff = e; st.everDone = true; v.open = null
        signoffs.push({ e, version: v.id, waitHours: req ? hours(req.at, e.at) : null })
        break
      }
      case 'stage_rollback': {
        const fi = flow.indexOf(e.from), ti = flow.indexOf(e.to)
        const atFrom = v.open === e.from || (!v.open && !!v.stages[e.from]?.signoff && nextStage(v) === flow[fi + 1])
        if (!atFrom) { bad(`当前不在「${STAGE_NAME[e.from] ?? e.from}」，这次回退没有生效`); continue }
        if (ti < 0 || ti >= fi) { bad(`只能退回到「${STAGE_NAME[e.from]}」之前的阶段`); continue }
        if (v.stages[e.to].untracked) { bad(`「${STAGE_NAME[e.to]}」在接入面板前就完成了，没有跟踪，不能退回到它`); continue }
        if (v.open) v.stages[v.open].intervals.at(-1).to = e.at
        for (let i = ti; i <= fi; i++) v.stages[flow[i]].signoff = null
        v.stages[e.from].rollbacks += 1
        v.stages[e.to].intervals.push({ from: e.at, to: null }); v.open = e.to; v.rollbacks.push(e); break
      }
      case 'progress': v.progress = e; break
      case 'block': v.blocks.push({ e, done: null }); break
      case 'unblock': { const b = v.blocks.find((x) => x.e.id === e.target && !x.done); if (!b) { bad('要解除的阻塞不存在或已解除'); continue } b.done = e; break }
      case 'hold': if (paused(v) || v.abandoned) { bad('版本已经挂起或放弃'); continue } v.holds.push({ from: e.at, to: null, e }); break
      case 'resume': if (!paused(v)) { bad('版本没有挂起，不需要恢复'); continue } v.holds.at(-1).to = e.at; break
      case 'abandon': if (v.abandoned) { bad('版本已经放弃'); continue } if (paused(v)) v.holds.at(-1).to = e.at; v.abandoned = e; break
      case 'downstream_check': v.downstream.push(e); break
      case 'item_add': case 'defect_open': {
        const id = e.item ?? e.defect
        if (ledger.has(id)) { bad(`编号 ${id} 已经被占用（${ledger.get(id)} 里先登记的那条生效）。这条后登记的没有生效：作废它再重新登记，会拿到新编号`); continue }
        ledger.set(id, v.id)
        if (e.type === 'item_add') v.items.set(id, { id, module: e.module ?? null, name: e.name, priority: e.priority, source: e.source ?? null, status: 'draft', at: e.at, by: e.recorded_by, confirmed: null, ref: null })
        else v.defects.set(id, { id, title: e.title, severity: e.severity, foundIn: e.found_in, module: e.module ?? null, case: e.case ?? null, status: 'open', at: e.at, by: e.recorded_by, assignee: null, verifier: null, build: null, reopened: 0, closedAt: null, waiver: null })
        break
      }
      case 'item_status': {
        const it = v.items.get(e.item)
        if (!it) { bad(`需求条目 ${e.item} 不存在`); continue }
        if (it.status === 'dropped') { bad(`需求条目 ${e.item} 已经移出本版本，不能再改状态`); continue }
        // A draft that gets reworded is still a draft: nobody has confirmed it yet, and the change must not hide that.
        if (!(e.status === 'changed' && it.status === 'draft')) it.status = e.status
        it.ref = e.ref ?? it.ref
        if (e.status === 'confirmed') it.confirmed = { by: e.by, quote: e.quote, at: e.at }
        break
      }
      case 'defect_status': {
        const d = v.defects.get(e.defect)
        if (!d) { bad(`缺陷 ${e.defect} 不存在`); continue }
        if (!DEFECT_NEXT[d.status].includes(e.status)) { bad(`缺陷 ${e.defect} 现在是「${DEFECT_STATUS[d.status]}」，不能直接改为「${DEFECT_STATUS[e.status] ?? e.status}」`); continue }
        if (e.status === 'open') { d.reopened += 1; d.closedAt = null; d.waiver = null }
        if (e.status === 'closed') { d.closedAt = e.at; d.verifier = e.verifier ?? d.verifier; d.closeQuote = e.quote ?? null }
        d.status = e.status; if (e.assignee) d.assignedAt = e.at; d.assignee = e.assignee ?? d.assignee; d.build = e.build ?? d.build
        break
      }
      case 'defect_waive': {
        const d = v.defects.get(e.defect)
        if (!d) { bad(`缺陷 ${e.defect} 不存在`); continue }
        if (['closed', 'waived'].includes(d.status)) { bad(`缺陷 ${e.defect} 已经${DEFECT_STATUS[d.status]}，不需要豁免`); continue }
        d.status = 'waived'; d.waiver = { by: e.by, quote: e.quote, scope: e.scope, until: e.until ?? null, decision: e.decision ?? null, at: e.at }
        break
      }
    }
    v.log.push({ e })
  }

  /* ---------- per-version summary ---------- */
  const heldDays = (v, from, to) => v.holds.reduce((sum, h) => {
    const a = later(h.from, from), b = earlier(h.to ?? now, to)
    return sum + (Date.parse(b) > Date.parse(a) ? dayDiff(a, b) : 0)
  }, 0)
  const span = (v, iv) => Math.max(0, dayDiff(iv.from, iv.to ?? now) - heldDays(v, iv.from, iv.to ?? now))

  const out = [...versions.values()].map((v) => {
    const flow = FLOWS[v.flow], released = v.stages.release.signoff
    const started = flow.some((s) => v.stages[s].intervals.length || v.stages[s].untracked)
    const status = released ? 'released' : v.abandoned ? 'abandoned' : paused(v) ? 'paused' : started ? 'active' : 'planned'
    const stages = flow.map((s) => {
      const st = v.stages[s]
      const state = st.untracked ? 'untracked' : v.open === s ? 'open' : st.signoff ? 'done' : st.everDone || st.intervals.length ? 'reopened' : 'pending'
      const sg = st.signoff?.signoff
      return {
        key: s, name: STAGE_NAME[s], state, rollbacks: st.rollbacks,
        days: st.intervals.reduce((n, iv) => n + span(v, iv), 0),
        hours: Math.round(st.intervals.reduce((n, iv) => n + hours(iv.from, iv.to ?? now), 0)),
        intervals: st.intervals.map((iv) => ({ from: iv.from, to: iv.to ?? now, open: !iv.to })),
        signoff: sg ? { by: sg.by, mode: sg.mode, quote: sg.quote ?? null, summary: sg.summary ?? null, review: sg.review ?? null, at: st.signoff.at, event: st.signoff.id } : null,
      }
    })
    let current = null, waiting = null
    if (v.open) {
      const iv = v.stages[v.open].intervals.at(-1), d = span(v, iv), threshold = project.settings[`stall_days.${v.flow}`]
      current = { stage: v.open, name: STAGE_NAME[v.open], since: iv.from, days: d, hours: Math.round(hours(iv.from, now)), threshold, stalled: status === 'active' && d >= threshold }
      const req = v.requests.findLast((r) => r.stage === v.open && Date.parse(r.at) >= Date.parse(iv.from))
      if (req) waiting = { to: req.to, since: req.at, days: dayDiff(req.at, now), summary: req.summary }
      const check = v.checks.findLast((c) => c.stage === v.open && Date.parse(c.at) >= Date.parse(iv.from))
      if (check) current.check = { id: check.id, at: check.at, result: check.result, checks: check.checks }
    }
    const next = !v.open && status === 'active' ? nextStage(v) : null
    const firstPlan = v.replans[0]?.from ?? v.attrs.planned_release
    const effective = v.log.filter((x) => !x.conflict && !x.voided && !x.duplicate)
    const last = effective.at(-1)?.e ?? v.create
    return {
      id: v.id, flow: v.flow, kind: v.attrs.kind, goal: v.attrs.goal, branch: v.attrs.branch ?? null, base: v.attrs.base ?? null, fixes: v.attrs.fixes ?? [],
      owners: v.attrs.owners, status, created: v.create.at, planned: v.attrs.planned_release ?? null, releasedAt: released?.at ?? null,
      replans: v.replans.map((r) => ({ at: r.at, from: r.from, to: r.to, reason: r.reason, by: r.by })),
      slipDays: firstPlan && v.attrs.planned_release ? Math.round((Date.parse(v.attrs.planned_release) - Date.parse(firstPlan)) / 86400000) : 0,
      overdueDays: !released && status === 'active' && v.attrs.planned_release ? Math.max(0, Math.round((Date.parse(day(now)) - Date.parse(v.attrs.planned_release)) / 86400000)) : 0,
      stages, current, next: next && { stage: next, name: STAGE_NAME[next] }, waiting,
      blocks: v.blocks.filter((b) => !b.done).map((b) => ({ id: b.e.id, text: b.e.text, owner: b.e.owner, ref: b.e.ref ?? null, at: b.e.at, days: dayDiff(b.e.at, now) })),
      hold: paused(v) ? { since: v.holds.at(-1).from, days: dayDiff(v.holds.at(-1).from, now), reason: v.holds.at(-1).e.reason, resumeWhen: v.holds.at(-1).e.resume_when, quote: v.holds.at(-1).e.quote } : null,
      holds: v.holds.map((h) => ({ from: h.from, to: h.to ?? now })),
      abandoned: v.abandoned && { at: v.abandoned.at, reason: v.abandoned.reason },
      // A progress note belongs to the stage it was written in; once the version moves on it is no longer current.
      progress: v.progress && (!v.progress.stage || v.progress.stage === v.open) ? { text: v.progress.text, at: v.progress.at } : null,
      rollbacks: v.rollbacks.map((r) => ({ at: r.at, from: r.from, to: r.to, reason: r.reason, ref: r.ref ?? null })),
      downstream: v.downstream.map((d) => ({ target: d.target, result: d.result, evidence: d.evidence, by: d.confirmed?.by ?? null })),
      items: [...v.items.values()],
      defects: [...v.defects.values()].map((d) => ({ ...d, days: dayDiff(d.at, d.closedAt ?? now), hours: Math.round(hours(d.at, d.closedAt ?? now)) })),
      createId: v.create.id, deployedToProduction: project.deploys.some((d) => d.env === 'production' && !['rollback', 'verify'].includes(d.action) && d.versions.includes(v.id)),
      conflicts: v.conflicts.map((c) => ({ id: c.e.id, type: c.e.type, at: c.e.at, by: c.e.by, why: c.why, branch: c.e.src?.branch ?? null, here: !!c.e.src?.here })),
      duplicates: v.duplicates.map((d) => ({ id: d.e.id, type: d.e.type, at: d.e.at, why: d.why, branch: d.e.src?.branch ?? null })),
      source: { branch: last.src?.branch ?? null, at: last.at, unpushed: effective.filter((x) => x.e.src?.state === 'unpushed').length, uncommitted: effective.filter((x) => x.e.src?.state === 'uncommitted').length },
      lastEventAt: effective.reduce((m, x) => later(m, x.e.at), v.create.at),
      events: v.log.map((x) => ({ ...x.e, voided: !!x.voided, conflict: x.conflict ?? null, duplicate: x.duplicate ?? null })),
    }
  })

  // Changes another version decided to merge later (or only partly) stay visible on the version that still owes them.
  for (const v of out) v.pendingMerges = out.flatMap((o) => o.downstream.filter((d) => d.target === v.id && ['deferred', 'partial'].includes(d.result)).map((d) => ({ from: o.id, result: d.result, evidence: d.evidence })))

  /* ---------- production ---------- */
  let running = null
  for (const d of project.deploys.filter((d) => d.env === 'production')) {
    // A later look at what is actually running settles the open question on the deployment before it.
    if (d.action === 'verify') { if (running) { running.checked = d.checked; running.build ??= d.build ?? null } continue }
    running = d.action === 'rollback'
      ? { version: d.target?.version ?? null, build: d.target?.build ?? null, since: d.at, how: 'rollback', from: d.versions, ref: d.ref ?? null, note: d.note ?? null, checked: d.checked ?? null }
      : { version: d.versions.at(-1), build: d.build ?? null, since: d.at, how: d.action, checked: d.checked ?? null }
  }
  const rel = out.filter((v) => v.releasedAt).sort((a, b) => Date.parse(b.releasedAt) - Date.parse(a.releasedAt))[0]
  const deployedNotReleased = out.filter((v) => !v.releasedAt && project.deploys.some((d) => d.env === 'production' && !['rollback', 'verify'].includes(d.action) && d.versions.includes(v.id))).map((v) => v.id)

  /* ---------- project-level lists ---------- */
  const type = project.info?.product_type ?? 'new'
  const config = defs.map((d) => {
    const s = project.config.get(d.id), level = d.level[type]
    return { id: d.id, no: d.no, name: d.name, level, before: d.before[type] ?? null, status: s?.status ?? (level === 'na' ? 'na' : 'todo'), by: s?.by ?? null, at: s?.at ?? null, quote: s?.quote ?? null, note: s?.note ?? null, owner: s?.owner ?? null, due: s?.due ?? null }
  })
  const gates = STAGES.map((s) => ({ stage: s, name: STAGE_NAME[s], mode: FIXED_HUMAN.includes(s) ? 'human' : project.settings[`gate.${s}`] ?? 'human', fixed: FIXED_HUMAN.includes(s) }))

  return {
    initialized: !!project.info, tz, now,
    project: project.info && { id: project.info.project, name: project.info.name, positioning: project.info.positioning, type: project.info.product_type, timezone: project.info.timezone, created: project.info.at },
    members: [...project.members.values()],
    settings: { gates, stall: { standard: project.settings['stall_days.standard'], hotfix: project.settings['stall_days.hotfix'] }, history: project.settingHistory.map((e) => ({ at: e.at, by: e.by, key: e.key, value: e.value, from: e.from ?? null, quote: e.quote })) },
    config, l0Ready: config.filter((c) => c.level === 'L0').every((c) => c.status === 'confirmed'),
    modules: [...project.modules.values()].map((m) => ({ id: m.module, status: m.status, by: m.by, at: m.at, quote: m.quote ?? null })),
    versions: out,
    online: { running, lastReleased: rel ? { version: rel.id, at: rel.releasedAt } : null, deployedNotReleased },
    deploys: project.deploys.map(({ scope, src, ...d }) => d),
    signoffs: signoffs.map((s) => ({ id: s.e.id, at: s.e.at, version: s.version, stage: s.e.stage, by: s.e.signoff.by, mode: s.e.signoff.mode, quote: s.e.signoff.quote ?? s.e.signoff.summary ?? null, recordedBy: s.e.recorded_by, waitHours: s.waitHours })),
    projectConflicts: project.conflicts.map((c) => ({ id: c.e.id, type: c.e.type, at: c.e.at, why: c.why })),
  }
}
