// Builds the read-only cockpit: one self-contained HTML file with the derived state inlined.
// No network, no server. Everything shown is computed from the events at render time.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isoIn } from './store.mjs'
import { FLOWS, STAGE_NAME } from './derive.mjs'

const LIVE = ['planned', 'active', 'paused']

/** Prompts and FAQ come straight from the README, so there is one copy to maintain. */
function handbook(root) {
  const file = join(root, 'README.md')
  const entries = [], faq = []
  if (!existsSync(file)) return { entries, faq }
  const lines = readFileSync(file, 'utf8').split('\n')
  let group = null, inFaq = false, i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^## 常见问题/.test(line)) { inFaq = true; group = null }
    else if (/^## /.test(line) && inFaq) break
    const g = line.match(/<summary><b>(.+?)<\/b>/)
    if (g) group = g[1]
    const t = line.match(/^\*\*(.+)\*\*$/)
    if (t && group) {
      let j = i + 1
      while (j < lines.length && !lines[j].startsWith('```')) j++
      const body = []
      for (j++; j < lines.length && !lines[j].startsWith('```'); j++) body.push(lines[j])
      if (body.length) entries.push({ group, title: t[1], prompt: body.join('\n') })
      i = j
    } else if (t && inFaq) {
      const body = []
      for (i++; i < lines.length && lines[i].trim() && !/^\*\*/.test(lines[i]); i++) body.push(lines[i])
      faq.push({ q: t[1], a: body.join(' ') })
      continue
    }
    i++
  }
  return { entries, faq }
}

export function cockpitData(c) {
  const S = c.state, tz = S.tz
  const loc = (iso) => (iso ? isoIn(tz, new Date(iso)) : null) // every time on the page is in the project time zone
  const today = loc(S.now).slice(0, 10)

  const versions = S.versions.map((v) => ({
    id: v.id, flow: v.flow, kind: v.kind, goal: v.goal, branch: v.branch, base: v.base, fixes: v.fixes, owners: v.owners, status: v.status,
    created: loc(v.created), planned: v.planned, releasedAt: loc(v.releasedAt), slipDays: v.slipDays, overdueDays: v.overdueDays,
    replans: v.replans.map((r) => ({ ...r, at: loc(r.at) })),
    stages: v.stages.map((s) => ({ ...s, intervals: s.intervals.map((iv) => ({ from: loc(iv.from), to: loc(iv.to), open: iv.open })), signoff: s.signoff && { ...s.signoff, at: loc(s.signoff.at), quote: s.signoff.quote ?? s.signoff.summary } })),
    current: v.current && { stage: v.current.stage, name: v.current.name, since: loc(v.current.since), days: v.current.days, hours: v.current.hours, threshold: v.current.threshold, stalled: v.current.stalled },
    check: v.current?.check ? { at: loc(v.current.check.at), result: v.current.check.result, checks: v.current.check.checks } : null,
    between: v.next, waiting: v.waiting && { ...v.waiting, since: loc(v.waiting.since) },
    blocks: v.blocks.map((b) => ({ ...b, at: loc(b.at) })),
    hold: v.hold && { ...v.hold, since: loc(v.hold.since) }, holds: v.holds.map((h) => ({ from: loc(h.from), to: loc(h.to) })),
    progress: v.progress && { text: v.progress.text, at: loc(v.progress.at) },
    rollbacks: v.rollbacks.map((r) => ({ ...r, at: loc(r.at) })), downstream: v.downstream,
    conflicts: v.conflicts.map((x) => ({ ...x, at: loc(x.at) })),
    source: { ...v.source, at: loc(v.source.at) },
    events: v.events.map(({ scope, src, voided, conflict, ...raw }) => ({ id: raw.id, at: loc(raw.at), type: raw.type, by: raw.by, voided, conflict, branch: src?.branch ?? null, state: src?.state ?? 'plain', raw })),
  }))
  const live = versions.filter((v) => LIVE.includes(v.status))
  const deploys = S.deploys.map((d) => ({ at: loc(d.at), env: d.env, action: d.action, versions: d.versions, build: d.build ?? null, target: d.target ?? null, by: d.by, approvedBy: d.approved?.by ?? null, quote: d.approved?.quote ?? null, ref: d.ref ?? null, note: d.note ?? null, recordedBy: d.recorded_by ?? null }))
  const online = { ...S.online, running: S.online.running && { ...S.online.running, since: loc(S.online.running.since) }, lastReleased: S.online.lastReleased && { ...S.online.lastReleased, at: loc(S.online.lastReleased.at) } }

  /* ---- inbox: what is waiting for whom ---- */
  const everyone = S.members.filter((m) => m.active).map((m) => m.id)
  const inbox = []
  const add = (who, kind, version, title, why, prompt) => inbox.push({ who: [...new Set(who.filter(Boolean))], kind, version, title, why, prompt })
  for (const p of c.all.problems) add(everyone, '数据损坏', null, p.where, p.why, `状态数据里有一个文件有问题：${p.where}。帮我看看是怎么回事，告诉我怎么处理，先不要自己改。`)
  for (const x of S.projectConflicts) add(everyone, '有矛盾', null, '项目级记录有一条没有生效', x.why, `项目级记录有一条矛盾：${x.why}。帮我列出处理办法，我来决定。`)
  for (const v of versions) for (const x of v.conflicts) add([v.owners.product, x.by], '有矛盾', v.id, `${v.id} 有一条记录没有生效`, x.why, `${v.id} 有一条矛盾的记录：${x.why}。帮我列出处理办法，我来决定。`)
  const r = online.running
  if (r?.how === 'rollback') {
    const from = versions.find((v) => v.id === r.from?.[0])
    if (from && LIVE.includes(from.status)) add([from.owners.product], '线上已回滚', from.id, `生产已从 ${r.from.join('、')} 回滚${r.version ? '到 ' + r.version : '，线上现在没有版本'}`, `${r.since.slice(5, 10)}${r.note ? '，' + r.note : ''}${r.ref ? '（' + r.ref + '）' : ''}。${from.id} 还没有发布完成，要决定下一步`,
      `${from.id} 上线后${r.ref ? '因为 ' + r.ref + ' ' : ''}回滚了。帮我梳理现在有哪几种处理办法（退回开发修复、修好后重新部署、其他），各自的代价是什么，我来决定。`)
  }
  for (const v of live) {
    if (v.waiting) add(v.waiting.to, '等你签收', v.id, `${v.id}「${v.current.name}」做完了，等你签收`, `已等 ${v.waiting.days} 天。${v.waiting.summary}`, `${v.id} 的${v.current.name}我来签收。先把本阶段的摘要和门控核对结果给我看，我看完再决定。`)
    for (const b of v.blocks) add([b.owner], '阻塞中', v.id, `${v.id} 被卡住 ${b.days} 天`, b.text, `${v.id} 现在被这件事卡住：${b.text}。帮我定位原因，先把结论和证据给我看，我确认后再改。`)
    if (v.current?.stalled) add([v.owners.product], '停滞', v.id, `${v.id} 的「${v.current.name}」已持续 ${v.current.days} 天`, `超过 ${v.current.threshold} 天的停滞基准`, `${v.id} 的${v.current.name}卡了 ${v.current.days} 天。帮我列出卡住的事，分成「进入下一阶段必须完成」和「可以往后放」。`)
    if (v.overdueDays) add([v.owners.product], '已逾期', v.id, `${v.id} 已超过计划发布日 ${v.overdueDays} 天`, `计划 ${v.planned}`, `${v.id} 已经过了计划发布日。帮我评估还要多久，给一个新的发布日期建议，我确认后再改期。`)
    if (v.between) add([v.owners.product], '可以往下走', v.id, `${v.id} 上一阶段已签收，还没进入「${v.between.name}」`, '没有阶段在进行中', `${v.id} 进入${v.between.name}阶段，开始吧。`)
    if (v.status === 'planned') add([v.owners.product], '还没开始', v.id, `${v.id} 已立项，还没进入任何阶段`, v.goal, `${v.id} 开始做吧，从第一个阶段开始。`)
  }
  for (const x of S.config.filter((x) => x.status === 'draft')) add([x.owner ?? x.by], '等你确认', null, `配置项「${x.name}」的草稿待审`, `${x.note ?? ''}${x.due ? `（期限 ${x.due}）` : ''}`, `「${x.name}」的草稿我来审。把摘要和你拿不准的地方列给我。`)

  /* ---- recent human decisions, for spot checks ---- */
  const recent = [
    ...S.signoffs.map((s) => ({ at: loc(s.at), kind: '签收', who: s.by, version: s.version, what: `${s.version}「${STAGE_NAME[s.stage]}」`, quote: s.quote, mode: s.mode, recordedBy: s.recordedBy })),
    ...S.settings.history.map((h) => ({ at: loc(h.at), kind: '改设置', who: h.by, version: null, what: h.key.startsWith('gate.') ? `「${STAGE_NAME[h.key.slice(5)]}」的签收方式：${h.from} → ${h.value}` : `${h.key}：${h.from} → ${h.value}`, quote: h.quote, mode: null, recordedBy: null })),
    ...deploys.filter((d) => d.env === 'production').map((d) => ({ at: d.at, kind: d.action === 'rollback' ? '批准回滚' : '批准上线', who: d.approvedBy, version: d.versions[0], what: `${d.versions.join('、')} ${d.action === 'rollback' ? '回滚到 ' + (d.target?.version ?? '') : '部署到生产'}`, quote: d.quote, mode: null, recordedBy: d.recordedBy })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 8)

  /* ---- process metrics ---- */
  const waits = S.signoffs.filter((s) => s.waitHours != null)
  const metrics = {
    rollbacks: versions.flatMap((v) => v.rollbacks.map((x) => ({ ...x, version: v.id }))),
    replans: versions.flatMap((v) => v.replans.map((x) => ({ ...x, version: v.id }))),
    slipDays: versions.reduce((n, v) => n + v.slipDays, 0),
    bySigner: S.members.map((m) => { const w = waits.filter((s) => s.by === m.id); return { id: m.id, name: m.name, n: w.length, avgHours: w.length ? w.reduce((n, s) => n + s.waitHours, 0) / w.length : 0, maxHours: Math.max(0, ...w.map((s) => s.waitHours)) } }).filter((x) => x.n),
    avgWaitHours: waits.length ? waits.reduce((n, s) => n + s.waitHours, 0) / waits.length : null,
    prodRollbacks: deploys.filter((d) => d.env === 'production' && d.action === 'rollback').length,
    prodDeploys: deploys.filter((d) => d.env === 'production' && d.action !== 'rollback').length,
    holds: versions.filter((v) => v.hold).map((v) => ({ version: v.id, ...v.hold })),
    blocks: versions.flatMap((v) => v.blocks.map((b) => ({ ...b, version: v.id }))),
  }

  const hb = handbook(c.root)
  return {
    generatedAt: loc(S.now), today, initialized: S.initialized, gitless: c.all.gitless,
    product: S.project ?? { name: '未初始化', positioning: '' }, members: S.members,
    flows: FLOWS, stageName: STAGE_NAME, settings: { ...S.settings, history: S.settings.history.map((h) => ({ ...h, at: loc(h.at) })) },
    config: S.config.map((x) => ({ ...x, at: loc(x.at) })), modules: S.modules,
    versions, online, deploys, inbox, recent, metrics,
    problems: c.all.problems, projectConflicts: S.projectConflicts, handbook: hb.entries, faq: hb.faq,
  }
}

export function renderCockpit(c) {
  const template = readFileSync(join(import.meta.dirname, '..', 'cockpit', 'template.html'), 'utf8')
  // "<" is escaped so that no text in the data can close the script tag.
  const json = JSON.stringify(cockpitData(c)).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, '')
  return template.replace('/*__DATA__*/', () => `const DATA = ${json};`)
}
