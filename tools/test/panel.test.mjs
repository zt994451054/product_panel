// Tests for the panel state tool. Run: node --test tools/test/panel.test.mjs
// Every test builds a throwaway git repository, so nothing here touches the real panel state.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { run } from '../panel.mjs'

const here = import.meta.dirname
const NOW = '2026-11-20T12:00:00+08:00'

function repo() {
  const root = mkdtempSync(join(tmpdir(), 'panel-test-'))
  mkdirSync(join(root, 'state', 'defs'), { recursive: true })
  cpSync(join(here, '..', '..', 'state', 'defs', 'config-items.json'), join(root, 'state', 'defs', 'config-items.json'))
  const g = (...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  g('init', '-q', '-b', 'main'); g('config', 'user.name', 'tester'); g('config', 'user.email', 'tester@example.invalid')
  const p = (...argv) => run(argv, { root, env: { PANEL_NOW: NOW } })
  const ok = (...argv) => { const r = p(...argv); assert.equal(r.code, 0, r.out); return r.out }
  const no = (pattern, ...argv) => { const r = p(...argv); assert.equal(r.code, 1, 'expected a refusal, got: ' + r.out); assert.match(r.out, pattern); return r.out }
  const state = () => JSON.parse(ok('status', '--json'))
  const commit = (msg) => { g('add', '-A'); g('commit', '-q', '-m', msg) }
  return { root, g, p, ok, no, state, commit }
}

/** Initialized project: three members, every blocking config item confirmed. */
function ready() {
  const r = repo()
  r.ok('init', '--name', '约见', '--type', 'new', '--timezone', 'Asia/Shanghai', '--by', 'xiaolin', '--at', '2026-08-20T09:00')
  for (const [id, name, role, d] of [['xiaolin', '小林', '产品经理', 'product'], ['azhe', '阿哲', '研发', 'engineering'], ['zhouzhou', '周周', '测试', 'testing']])
    r.ok('member', 'add', '--id', id, '--name', name, '--role', role, '--domains', d, '--by', 'xiaolin', '--at', '2026-08-20T09:10')
  for (const item of ['product_info', 'design_system', 'repos', 'tech_arch', 'local_dev', 'environments', 'ops_profile'])
    r.ok('config', 'set', '--item', item, '--status', 'confirmed', '--quote', '确认', '--by', 'xiaolin', '--at', '2026-08-20T10:00')
  return r
}
const OWNERS = ['--product', 'xiaolin', '--engineering', 'azhe', '--testing', 'zhouzhou']
const rawVersion = (r, v, at, extra = []) => r.ok('version', 'new', '--version', v, '--goal', '目标', ...OWNERS, '--by', 'xiaolin', '--at', at, ...extra)
// Creating a version also settles the "version and owners" config item, which can only be confirmed once a version exists.
const newVersion = (r, v, at, extra = []) => { const out = rawVersion(r, v, at, extra); r.ok('config', 'set', '--item', 'version_owners', '--status', 'confirmed', '--quote', '确认', '--by', 'xiaolin', '--at', '2026-08-20T10:00'); return out }
/** Register one confirmed P0 requirement item, which the requirements gate asks for. */
function feat(r, v, at) {
  const id = r.ok('item', 'add', '--version', v, '--name', '预约时段', '--priority', 'P0', '--by', 'ai', '--at', at).match(/编号：(\S+?)（/)[1]
  r.ok('item', 'confirm', '--version', v, '--item', id, '--quote', '确认', '--by', 'xiaolin', '--at', at)
  return id
}
/** Enter a stage, pass its gate, sign it off. `d` is the day in 2026-10. */
function pass(r, v, stage, d, signer = 'xiaolin') {
  const at = (h) => `2026-10-${String(d).padStart(2, '0')}T${h}:00`
  r.ok('stage', 'enter', '--version', v, '--stage', stage, '--by', 'ai', '--at', at('09'))
  if (stage === 'requirements' && !r.state().versions.find((x) => x.id === v).items.length) feat(r, v, at('10'))
  r.ok('stage', 'check', '--version', v, '--stage', stage, '--check', '条件|ok|依据|manual', '--by', 'ai', '--at', at('15'))
  r.ok('stage', 'request', '--version', v, '--stage', stage, '--to', signer, '--summary', '摘要', '--by', 'ai', '--at', at('16'))
  r.ok('stage', 'complete', '--version', v, '--stage', stage, '--signer', signer, '--quote', '可以', '--by', 'ai', '--at', at('17'))
}

test('factory state is uninitialized and refuses versions', () => {
  const r = repo()
  assert.match(r.ok('status'), /项目未初始化/)
  r.no(/还没有初始化/, 'version', 'new', '--version', 'v1.0.0', '--goal', 'x', ...OWNERS, '--by', 'xiaolin')
})

test('L0 and L1 config items gate versions and stages', () => {
  const r = repo()
  r.ok('init', '--name', 'P', '--type', 'new', '--timezone', 'Asia/Shanghai', '--by', 'xiaolin', '--at', '2026-08-20T09:00')
  for (const id of ['xiaolin', 'azhe', 'zhouzhou']) r.ok('member', 'add', '--id', id, '--name', id, '--role', 'r', '--domains', 'product', '--by', 'xiaolin', '--at', '2026-08-20T09:10')
  r.no(/产品基本信息/, 'version', 'new', '--version', 'v1.0.0', '--goal', 'x', ...OWNERS, '--by', 'xiaolin')
  r.ok('config', 'set', '--item', 'product_info', '--status', 'confirmed', '--quote', '对', '--by', 'xiaolin')
  r.no(/不能暂不填/, 'config', 'set', '--item', 'version_owners', '--status', 'skipped', '--note', 'x', '--by', 'xiaolin')
  r.no(/还没有任何版本/, 'config', 'set', '--item', 'version_owners', '--status', 'confirmed', '--quote', '对', '--by', 'xiaolin')
  rawVersion(r, 'v1.0.0', '2026-10-01T09:00')
  r.no(/不是在册成员/, 'config', 'set', '--item', 'version_owners', '--status', 'confirmed', '--quote', '对', '--by', 'ai')
  r.no(/版本与负责人/, 'stage', 'enter', '--version', 'v1.0.0', '--stage', 'requirements', '--by', 'ai')
  r.ok('config', 'set', '--item', 'version_owners', '--status', 'confirmed', '--quote', '对', '--by', 'xiaolin')
  pass(r, 'v1.0.0', 'requirements', 2)
  r.no(/设计系统/, 'stage', 'enter', '--version', 'v1.0.0', '--stage', 'design', '--by', 'ai')
})

test('standard flow: order, gate check and signer are enforced', () => {
  const r = ready(); newVersion(r, 'v1.0.0', '2026-10-01T09:00')
  r.no(/下一个阶段是「需求分析」/, 'stage', 'enter', '--version', 'v1.0.0', '--stage', 'design', '--by', 'ai')
  r.ok('stage', 'enter', '--version', 'v1.0.0', '--stage', 'requirements', '--by', 'ai', '--at', '2026-10-02T09:00')
  feat(r, 'v1.0.0', '2026-10-02T10:00')
  r.no(/门控核对/, 'stage', 'complete', '--version', 'v1.0.0', '--stage', 'requirements', '--signer', 'xiaolin', '--quote', '好', '--by', 'ai')
  assert.match(r.ok('stage', 'check', '--version', 'v1.0.0', '--stage', 'requirements', '--check', 'P0 已确认|no|还有 2 条草稿|script', '--by', 'ai', '--at', '2026-10-03T09:00'), /门控未通过/)
  r.no(/没有通过/, 'stage', 'complete', '--version', 'v1.0.0', '--stage', 'requirements', '--signer', 'xiaolin', '--quote', '好', '--by', 'ai')
  r.ok('stage', 'check', '--version', 'v1.0.0', '--stage', 'requirements', '--check', 'P0 已确认|ok|全部已确认|script', '--by', 'ai', '--at', '2026-10-04T09:00')
  r.no(/请求签收/, 'stage', 'complete', '--version', 'v1.0.0', '--stage', 'requirements', '--signer', 'xiaolin', '--quote', '好', '--by', 'ai')
  r.ok('stage', 'request', '--version', 'v1.0.0', '--stage', 'requirements', '--to', 'xiaolin', '--summary', '摘要', '--by', 'ai', '--at', '2026-10-04T10:00')
  r.no(/不是在册成员/, 'stage', 'complete', '--version', 'v1.0.0', '--stage', 'requirements', '--signer', 'nobody', '--quote', '好', '--by', 'ai')
  r.no(/缺少 --quote/, 'stage', 'complete', '--version', 'v1.0.0', '--stage', 'requirements', '--signer', 'xiaolin', '--by', 'ai')
  r.ok('stage', 'complete', '--version', 'v1.0.0', '--stage', 'requirements', '--signer', 'xiaolin', '--quote', '需求没问题', '--by', 'ai', '--at', '2026-10-05T10:00')
  const v = r.state().versions[0]
  assert.equal(v.stages[0].state, 'done'); assert.equal(v.stages[0].days, 3); assert.equal(v.current, null); assert.equal(v.next.stage, 'design')
  assert.match(r.ok('status'), /待进入产品设计/)
})

test('hotfix flow starts at tech and has five stages', () => {
  const r = ready()
  r.no(/还没有已发布的版本/, 'version', 'new', '--version', 'v1.0.1', '--flow', 'hotfix', '--fixes', 'PROD-003', '--goal', 'x', ...OWNERS, '--by', 'xiaolin')
  r.ok('deploy', '--env', 'production', '--action', 'baseline', '--versions', 'v1.0.0', '--by', 'ai', '--at', '2026-09-01T09:00')
  r.no(/热修复流程只用于/, 'version', 'new', '--version', 'v2.0.0', '--flow', 'hotfix', '--kind', 'major', '--goal', 'x', ...OWNERS, '--by', 'xiaolin')
  r.no(/补丁号/, 'version', 'new', '--version', 'v1.1.0', '--flow', 'hotfix', '--fixes', 'PROD-003', '--goal', 'x', ...OWNERS, '--by', 'xiaolin')
  r.no(/热修复流程只用于/, 'version', 'new', '--version', 'v1.0.1', '--flow', 'hotfix', '--goal', 'x', ...OWNERS, '--by', 'xiaolin')
  newVersion(r, 'v1.0.1', '2026-10-01T09:00', ['--flow', 'hotfix', '--fixes', 'PROD-003'])
  r.no(/只用于存量产品/, 'version', 'onboard', '--version', 'v1.0.1', '--stage', 'release', '--quote', '直接发', '--by', 'xiaolin')
  r.no(/阶段（热修复流程）/, 'stage', 'enter', '--version', 'v1.0.1', '--stage', 'requirements', '--by', 'ai')
  r.ok('stage', 'enter', '--version', 'v1.0.1', '--stage', 'tech', '--by', 'ai', '--at', '2026-10-01T10:00')
  const v = r.state().versions[0]
  assert.deepEqual(v.stages.map((s) => s.key), ['tech', 'test_design', 'dev', 'test', 'release']); assert.equal(v.kind, 'patch')
})

test('rollback opens the target stage and invalidates signoffs in between', () => {
  const r = ready(); newVersion(r, 'v1.0.0', '2026-10-01T09:00')
  ;['requirements', 'design', 'tech', 'test_design', 'dev'].forEach((s, i) => pass(r, 'v1.0.0', s, 2 + i))
  r.ok('stage', 'enter', '--version', 'v1.0.0', '--stage', 'test', '--by', 'ai', '--at', '2026-10-07T09:00')
  r.no(/当前不在/, 'stage', 'rollback', '--version', 'v1.0.0', '--from', 'dev', '--to', 'tech', '--reason', 'x', '--quote', 'x', '--by', 'ai')
  r.ok('stage', 'rollback', '--version', 'v1.0.0', '--from', 'test', '--to', 'dev', '--reason', '阻断缺陷', '--ref', 'BUG-002', '--quote', '退回开发', '--by', 'ai', '--at', '2026-10-09T09:00')
  let v = r.state().versions[0]
  const st = Object.fromEntries(v.stages.map((s) => [s.key, s]))
  assert.equal(v.current.stage, 'dev'); assert.equal(st.dev.signoff, null); assert.equal(st.test.state, 'reopened'); assert.equal(st.test_design.state, 'done')
  assert.equal(st.dev.intervals.length, 2); assert.equal(st.test.rollbacks, 1)
  // The old gate check no longer counts: a new one is needed before signing dev again.
  r.no(/门控核对/, 'stage', 'complete', '--version', 'v1.0.0', '--stage', 'dev', '--signer', 'azhe', '--quote', '好', '--by', 'ai', '--at', '2026-10-10T09:00')
})

test('hold pauses the clock and blocks stage events; abandon is final', () => {
  const r = ready(); newVersion(r, 'v1.0.0', '2026-10-01T09:00')
  r.ok('stage', 'enter', '--version', 'v1.0.0', '--stage', 'requirements', '--by', 'ai', '--at', '2026-10-02T09:00')
  r.no(/不是在册成员/, 'version', 'hold', '--version', 'v1.0.0', '--reason', 'x', '--resume-when', 'y', '--quote', 'z', '--by', 'ai')
  r.ok('version', 'hold', '--version', 'v1.0.0', '--reason', '先做别的', '--resume-when', '下个月', '--quote', '放一放', '--by', 'xiaolin', '--at', '2026-10-05T09:00')
  r.no(/挂起中/, 'stage', 'check', '--version', 'v1.0.0', '--stage', 'requirements', '--check', 'a|ok|b', '--by', 'ai', '--at', '2026-10-06T09:00')
  let v = r.state().versions[0]
  assert.equal(v.status, 'paused'); assert.equal(v.current.days, 3); assert.equal(v.current.stalled, false)
  r.ok('version', 'resume', '--version', 'v1.0.0', '--quote', '继续', '--by', 'xiaolin', '--at', '2026-11-18T09:00')
  v = r.state().versions[0]
  assert.equal(v.status, 'active'); assert.equal(v.current.days, 5)
  r.ok('version', 'abandon', '--version', 'v1.0.0', '--reason', '不做了', '--quote', '砍掉', '--by', 'xiaolin', '--at', '2026-11-19T09:00')
  r.no(/已放弃/, 'stage', 'check', '--version', 'v1.0.0', '--stage', 'requirements', '--check', 'a|ok|b', '--by', 'ai')
})

test('gate settings: only members may change them, test and release stay human, looser modes are refused', () => {
  const r = ready(); newVersion(r, 'v1.0.0', '2026-10-01T09:00')
  r.no(/固定由人完成/, 'settings', 'set', '--key', 'gate.release', '--value', 'auto', '--quote', 'x', '--by', 'xiaolin')
  r.no(/固定由人完成/, 'settings', 'set', '--key', 'gate.test', '--value', 'auto', '--quote', 'x', '--by', 'xiaolin')
  r.no(/不是在册成员/, 'settings', 'set', '--key', 'gate.tech', '--value', 'auto', '--quote', 'x', '--by', 'ai')
  r.ok('settings', 'set', '--key', 'gate.requirements', '--value', 'review_human', '--quote', '先评审再给我看', '--by', 'xiaolin', '--at', '2026-10-01T10:00')
  r.ok('stage', 'enter', '--version', 'v1.0.0', '--stage', 'requirements', '--by', 'ai', '--at', '2026-10-02T09:00')
  feat(r, 'v1.0.0', '2026-10-02T09:30')
  r.ok('stage', 'check', '--version', 'v1.0.0', '--stage', 'requirements', '--check', 'a|ok|b', '--by', 'ai', '--at', '2026-10-02T10:00')
  r.ok('stage', 'request', '--version', 'v1.0.0', '--stage', 'requirements', '--to', 'xiaolin', '--summary', '摘要', '--by', 'ai', '--at', '2026-10-02T10:30')
  // Review records do not exist yet, so nothing but a human sign-off is accepted, whatever the setting says.
  r.no(/目前只能人工签收/, 'stage', 'complete', '--version', 'v1.0.0', '--stage', 'requirements', '--mode', 'auto', '--summary', 's', '--review', 'RV-1', '--by', 'ai', '--at', '2026-10-02T11:00')
  r.no(/目前只能人工签收/, 'stage', 'complete', '--version', 'v1.0.0', '--stage', 'requirements', '--mode', 'review_human', '--signer', 'xiaolin', '--quote', '好', '--review', 'RV-1', '--by', 'ai', '--at', '2026-10-02T11:00')
  r.ok('stage', 'complete', '--version', 'v1.0.0', '--stage', 'requirements', '--signer', 'xiaolin', '--quote', '好', '--by', 'ai', '--at', '2026-10-02T11:00')
  assert.equal(r.state().versions[0].stages[0].signoff.mode, 'human')
})

test('release needs the product owner and a downstream check for every other open version', () => {
  const r = ready(); newVersion(r, 'v1.0.0', '2026-10-01T09:00'); newVersion(r, 'v1.1.0', '2026-10-01T09:30')
  ;['requirements', 'design', 'tech', 'test_design', 'dev', 'test'].forEach((s, i) => pass(r, 'v1.0.0', s, 2 + i))
  r.ok('stage', 'enter', '--version', 'v1.0.0', '--stage', 'release', '--by', 'ai', '--at', '2026-10-08T09:00')
  r.ok('stage', 'check', '--version', 'v1.0.0', '--stage', 'release', '--check', 'a|ok|b', '--by', 'ai', '--at', '2026-10-09T09:00')
  r.ok('stage', 'request', '--version', 'v1.0.0', '--stage', 'release', '--to', 'xiaolin', '--summary', '摘要', '--by', 'ai', '--at', '2026-10-09T09:10')
  const done = ['stage', 'complete', '--version', 'v1.0.0', '--stage', 'release', '--quote', '确认', '--by', 'ai', '--at', '2026-10-09T10:00']
  r.no(/只能由产品负责人/, ...done, '--signer', 'azhe')
  r.no(/部署到生产的记录/, ...done, '--signer', 'xiaolin')
  r.no(/环境 --env/, 'deploy', '--env', 'prod', '--action', 'deploy', '--versions', 'v1.0.0', '--by', 'azhe')
  r.no(/v9\.9\.9 不存在/, 'deploy', '--env', 'production', '--action', 'deploy', '--versions', 'v9.9.9', '--approved-by', 'xiaolin', '--quote', '上', '--by', 'azhe')
  r.ok('deploy', '--env', 'production', '--action', 'deploy', '--versions', 'v1.0.0', '--build', 'b1', '--approved-by', 'xiaolin', '--quote', '上', '--by', 'azhe', '--at', '2026-10-08T21:00')
  r.no(/v1\.1\.0/, ...done, '--signer', 'xiaolin')
  r.ok('downstream-check', '--version', 'v1.0.0', '--target', 'v1.1.0', '--result', 'deferred', '--evidence', '下周合入表结构变更', '--confirmed-by', 'azhe', '--quote', '不用合', '--by', 'ai', '--at', '2026-10-09T09:30')
  r.ok(...done, '--signer', 'xiaolin')
  const s = r.state()
  assert.equal(s.versions.find((v) => v.id === 'v1.0.0').status, 'released')
  assert.equal(s.online.lastReleased.version, 'v1.0.0'); assert.equal(s.online.running.version, 'v1.0.0')
  // A deferred merge stays visible on the version that still owes it.
  assert.equal(s.versions.find((v) => v.id === 'v1.1.0').pendingMerges[0].from, 'v1.0.0')
  assert.match(r.ok('status'), /还欠一次合入：v1\.0\.0/)
})

test('production: running version follows deploys and rollbacks, not release dates', () => {
  const r = ready()
  const dep = (at, ...a) => r.ok('deploy', '--env', 'production', '--approved-by', 'xiaolin', '--quote', '好', '--by', 'azhe', '--at', at, ...a)
  // What was already live when the product was onboarded needs no approver and no version in the panel.
  r.ok('deploy', '--env', 'production', '--action', 'baseline', '--versions', 'v0.9.0', '--build', 'b0', '--by', 'azhe', '--at', '2026-10-01T21:00')
  assert.match(r.ok('status'), /线上在跑：v0\.9\.0 b0（10-01 登记，接入面板前已在线上）/)
  assert.match(r.ok('version', 'new', '--version', 'v1.9.0', ...OWNERS, '--by', 'xiaolin', '--at', '2026-10-01T22:00'), /已记录/)
  newVersion(r, 'v1.0.0', '2026-10-02T09:00')
  r.no(/缺少 --approved-by/, 'deploy', '--env', 'production', '--action', 'deploy', '--versions', 'v1.0.0', '--by', 'azhe')
  dep('2026-10-05T21:00', '--action', 'deploy', '--versions', 'v1.0.0', '--build', 'b1')
  dep('2026-10-06T08:00', '--action', 'rollback', '--versions', 'v1.0.0', '--target-version', 'v0.9.0', '--target-build', 'b0', '--ref', 'BUG-7')
  const o = r.state().online
  assert.equal(o.running.version, 'v0.9.0'); assert.equal(o.running.how, 'rollback'); assert.equal(o.lastReleased, null)
  assert.match(r.ok('status'), /v0\.9\.0 b0（10-06 从 v1\.0\.0 回滚）/)
})

test('void removes an event from the replay; time order is protected', () => {
  const r = ready(); newVersion(r, 'v1.0.0', '2026-10-01T09:00')
  r.ok('stage', 'enter', '--version', 'v1.0.0', '--stage', 'requirements', '--by', 'ai', '--at', '2026-10-02T09:00')
  const id = r.state().versions[0].events.at(-1).id
  r.no(/补记历史/, 'note', '--version', 'v1.0.0', '--text', '早先的事', '--by', 'ai', '--at', '2026-10-01T12:00')
  r.ok('note', '--version', 'v1.0.0', '--text', '早先的事', '--by', 'ai', '--at', '2026-10-01T12:00', '--backfill', '漏记了')
  r.no(/不能晚于现在/, 'note', '--version', 'v1.0.0', '--text', 'x', '--by', 'ai', '--at', '2026-12-01T12:00')
  r.ok('event', 'void', '--target', id, '--reason', '记错版本了', '--by', 'xiaolin')
  r.no(/已经作废过/, 'event', 'void', '--target', id, '--reason', 'x', '--by', 'xiaolin')
  const v = r.state().versions[0]
  assert.equal(v.current, null); assert.equal(v.status, 'planned'); assert.equal(v.events.find((e) => e.id === id).voided, true)
})

test('a broken or hand-edited event file is isolated and reported', () => {
  const r = ready(); newVersion(r, 'v1.0.0', '2026-10-01T09:00'); r.commit('state')
  writeFileSync(join(r.root, 'state', 'events', 'broken.json'), '{ not json')
  assert.match(r.ok('status'), /1 个事件文件损坏/)
  assert.equal(r.state().versions.length, 1)
  r.no(/数据损坏/, 'check')
  rmSync(join(r.root, 'state', 'events', 'broken.json'))
  r.ok('check')
  const dir = join(r.root, 'versions', 'v1.0.0', 'state', 'events'), f = join(dir, readdirSync(dir)[0])
  writeFileSync(f, readFileSync(f, 'utf8').replace('目标', '被改过的目标'))
  r.no(/写入后被改过/, 'check')
  assert.equal(r.state().versions.length, 0)
  r.g('checkout', '-q', '--', '.'); rmSync(f)
  r.no(/被删除了/, 'check')
})

test('state is the union of all branches; the same version number cannot be taken twice', () => {
  const r = ready(); r.commit('init')
  r.g('checkout', '-q', '-b', 'feat/a'); newVersion(r, 'v1.1.0', '2026-10-01T09:00'); r.commit('v1.1.0')
  r.g('checkout', '-q', 'main'); r.g('checkout', '-q', '-b', 'feat/b'); newVersion(r, 'v1.2.0', '2026-10-02T09:00')
  const s = r.state()
  assert.deepEqual(s.versions.map((v) => v.id).sort(), ['v1.1.0', 'v1.2.0'])
  assert.equal(s.versions.find((v) => v.id === 'v1.1.0').source.branch, 'feat/a')
  assert.equal(s.versions.find((v) => v.id === 'v1.2.0').source.uncommitted, 1)
  r.no(/已经被占用（已检查本机能看到的所有分支）/, 'version', 'new', '--version', 'v1.1.0', '--goal', '撞号', ...OWNERS, '--by', 'azhe')
  r.commit('v1.2.0')
  assert.match(r.ok('check', '--branch', 'feat/a'), /有 2 条事件只存在于分支 feat\/a/)
  r.g('checkout', '-q', 'main'); r.g('merge', '-q', '--no-edit', 'feat/a', 'feat/b')
  assert.match(r.ok('check', '--branch', 'feat/a'), /可以安全删除/)
  r.ok('check')
})

test('two branches that clash anyway are flagged, not silently merged', () => {
  const r = ready(); r.commit('init')
  r.g('checkout', '-q', '-b', 'feat/a'); newVersion(r, 'v1.1.0', '2026-10-01T09:00'); r.commit('a')
  // Simulate a clone that could not see feat/a: copy the event under a new id with a different goal.
  const dir = join(r.root, 'versions', 'v1.1.0', 'state', 'events'), e = JSON.parse(readFileSync(join(dir, readdirSync(dir)[0]), 'utf8'))
  r.g('checkout', '-q', 'main'); r.g('checkout', '-q', '-b', 'feat/b'); mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, '20261003T010000Z-zzzz.json'), JSON.stringify({ ...e, id: '20261003T010000Z-zzzz', at: '2026-10-03T09:00:00+08:00', goal: '另一个目标' }))
  r.commit('b')
  const v = r.state().versions[0]
  assert.equal(v.goal, '目标'); assert.equal(v.conflicts.length, 1); assert.match(v.conflicts[0].why, /已经被占用/)
  assert.match(r.ok('status'), /有一条记录没有生效/)
  r.no(/v1\.1\.0 有矛盾/, 'check')
})

test('a machine with a slow clock cannot reorder history silently', () => {
  const r = ready(); newVersion(r, 'v1.0.0', '2026-10-01T09:00')
  r.ok('stage', 'enter', '--version', 'v1.0.0', '--stage', 'requirements', '--by', 'ai', '--at', '2026-10-02T09:00')
  // Ten minutes "before" the stage was entered, as a lagging clock would stamp it.
  const late = ['stage', 'check', '--version', 'v1.0.0', '--stage', 'requirements', '--check', 'a|ok|b', '--by', 'ai', '--at', '2026-10-02T08:50']
  r.no(/补记历史/, ...late)
  r.no(/不在进行中/, ...late, '--backfill', '时钟慢了')
  assert.equal(r.state().versions[0].current.check, undefined)
})

test('render writes a self-contained cockpit, also for an empty project, and data cannot break out of the script tag', () => {
  const dataOf = (root) => {
    const html = readFileSync(join(root, 'cockpit.html'), 'utf8')
    assert.equal(html.includes('/*__DATA__*/'), false)
    assert.equal((html.match(/<\/script>/g) ?? []).length, 1)
    return JSON.parse(html.match(/const DATA = (\{.*\});\n/)[1])
  }
  const empty = repo(); empty.ok('render')
  assert.equal(dataOf(empty.root).initialized, false)

  const r = ready(); newVersion(r, 'v1.0.0', '2026-10-01T09:00')
  r.ok('stage', 'enter', '--version', 'v1.0.0', '--stage', 'requirements', '--by', 'ai', '--at', '2026-10-02T09:00')
  r.ok('stage', 'check', '--version', 'v1.0.0', '--stage', 'requirements', '--check', 'a|ok|b', '--by', 'ai', '--at', '2026-10-03T09:00')
  r.ok('stage', 'request', '--version', 'v1.0.0', '--stage', 'requirements', '--to', 'xiaolin', '--summary', '看一下 </script><b>', '--by', 'ai', '--at', '2026-10-03T10:00')
  assert.match(r.ok('render'), /驾驶舱已生成/)
  const d = dataOf(r.root), v = d.versions[0]
  assert.equal(d.initialized, true); assert.equal(v.current.stage, 'requirements'); assert.equal(v.created.slice(0, 16), '2026-10-01T09:00')
  assert.equal(d.inbox.some((i) => i.kind === '等你签收' && i.who.includes('xiaolin')), true)
  assert.equal(d.inbox.some((i) => i.kind === '停滞'), true)
})

test('commands run back to back keep their order, and an older passing check cannot outvote a newer failing one', () => {
  const r = ready(); newVersion(r, 'v1.0.0', '2026-10-01T09:00')
  const V = ['--version', 'v1.0.0', '--stage', 'requirements', '--by', 'ai']
  // No --at: all four land in the same second, exactly as an agent following SOP-07 would run them.
  r.ok('stage', 'enter', ...V)
  const item = r.ok('item', 'add', '--version', 'v1.0.0', '--name', '预约时段', '--priority', 'P0', '--by', 'ai').match(/编号：(\S+?)（/)[1]
  r.ok('item', 'confirm', '--version', 'v1.0.0', '--item', item, '--quote', '确认', '--by', 'xiaolin')
  r.ok('stage', 'check', ...V, '--check', 'a|ok|b')
  r.ok('stage', 'check', ...V, '--check', 'a|no|缺一项')
  r.no(/没有通过/, 'stage', 'complete', ...V, '--signer', 'xiaolin', '--quote', '好')
  r.ok('stage', 'check', ...V, '--check', 'a|ok|补齐了')
  r.ok('stage', 'request', ...V, '--to', 'xiaolin', '--summary', '摘要')
  r.ok('stage', 'complete', ...V, '--signer', 'xiaolin', '--quote', '好')
  r.ok('stage', 'enter', '--version', 'v1.0.0', '--stage', 'design', '--by', 'ai')
  const v = r.state().versions[0]
  assert.equal(v.conflicts.length, 0); assert.equal(v.current.stage, 'design'); assert.equal(v.stages[0].state, 'done')
  r.ok('check')
})

test('after a version-number clash the losing side cannot write into the winning version', () => {
  const r = ready(); r.commit('init')
  r.g('checkout', '-q', '-b', 'feat/a'); newVersion(r, 'v1.1.0', '2026-10-01T09:00'); r.commit('a')
  const dir = join(r.root, 'versions', 'v1.1.0', 'state', 'events'), mine = JSON.parse(readFileSync(join(dir, readdirSync(dir)[0]), 'utf8'))
  // The other clone never saw feat/a: its own v1.1.0 and a stage event written against it.
  r.g('checkout', '-q', 'main'); r.g('checkout', '-q', '-b', 'feat/b'); mkdirSync(dir, { recursive: true })
  const theirs = { ...mine, id: '20261003T010000000Z-zzzz', at: '2026-10-03T09:00:00+08:00', goal: '另一个目标' }
  writeFileSync(join(dir, `${theirs.id}.json`), JSON.stringify(theirs))
  const enter = { id: '20261004T010000000Z-yyyy', type: 'stage_enter', version: 'v1.1.0', create: theirs.id, at: '2026-10-04T09:00:00+08:00', recorded_at: '2026-10-04T09:00:00+08:00', recorded_by: 'other', by: 'ai', stage: 'requirements' }
  writeFileSync(join(dir, `${enter.id}.json`), JSON.stringify(enter))
  r.commit('b')
  const v = r.state().versions[0]
  assert.equal(v.goal, '目标'); assert.equal(v.status, 'planned'); assert.equal(v.current, null)
  assert.equal(v.conflicts.length, 2); assert.match(v.conflicts[1].why, /撞了号/)
})

test('the operator comes from the personal profile; initialization order is guided and enforced', () => {
  const r = repo()
  r.no(/先运行 init/, 'member', 'add', '--id', 'xiaolin', '--name', '小林', '--role', '产品', '--domains', 'product', '--by', 'xiaolin')
  r.ok('init', '--name', 'P', '--type', 'new', '--timezone', 'Asia/Shanghai', '--by', 'xiaolin')
  assert.match(r.ok('status'), /下一步：登记成员/)
  for (const id of ['xiaolin', 'azhe', 'zhouzhou']) r.ok('member', 'add', '--id', id, '--name', id, '--role', 'r', '--domains', 'product', '--by', 'xiaolin')
  assert.match(r.ok('status'), /当前操作者：未识别[\s\S]*下一步：确认「产品基本信息」/)
  r.no(/不知道当前操作者/, 'config', 'set', '--item', 'product_info', '--status', 'confirmed', '--quote', '对', '--by', 'me')
  r.no(/不是在册成员/, 'whoami', '--set', 'nobody')
  assert.match(r.ok('whoami', '--set', 'xiaolin'), /当前操作者是 xiaolin/)
  assert.equal(readFileSync(join(r.root, 'profile.md'), 'utf8').startsWith('member: xiaolin\n'), true)
  r.ok('config', 'set', '--item', 'product_info', '--status', 'confirmed', '--quote', '对', '--by', 'me')
  r.no(/还没有任何版本/, 'config', 'set', '--item', 'version_owners', '--status', 'confirmed', '--quote', '对', '--by', 'me')
  assert.match(r.ok('status'), /下一步：新建第一个版本/)
  newVersion(r, 'v1.0.0', '2026-10-01T09:00')
  r.ok('config', 'set', '--item', 'version_owners', '--status', 'confirmed', '--quote', '对', '--by', 'me')
  assert.match(r.ok('status'), /当前操作者：xiaolin（xiaolin）[\s\S]*配置：必须项已就绪/)
  r.ok('module', 'set', '--module', 'smoke', '--status', 'on', '--quote', '启用', '--by', 'me')
  assert.match(r.ok('status'), /已启用的可选模块：冒烟测试/)
})

test('rolling back a first release leaves production without a version', () => {
  const r = ready(); newVersion(r, 'v1.0.0', '2026-10-02T09:00')
  const dep = (at, ...a) => r.ok('deploy', '--env', 'production', '--versions', 'v1.0.0', '--approved-by', 'xiaolin', '--quote', '好', '--by', 'azhe', '--at', at, ...a)
  dep('2026-10-05T21:00', '--action', 'deploy', '--build', 'b1')
  dep('2026-10-06T08:00', '--action', 'rollback', '--ref', 'BUG-005')
  assert.equal(r.state().online.running.version, null)
  // A release recorded after the fact needs no approver and is shown for what it is.
  r.ok('deploy', '--env', 'production', '--action', 'exception', '--versions', 'v1.0.0', '--by', 'ai', '--at', '2026-10-07T08:00')
  assert.match(r.ok('status'), /线上在跑：v1\.0\.0（10-07 例外上线，没走完门控，待补齐）/)
  r.ok('deploy', '--env', 'production', '--action', 'rollback', '--versions', 'v1.0.0', '--approved-by', 'xiaolin', '--quote', '好', '--by', 'azhe', '--at', '2026-10-08T08:00')
  assert.match(r.ok('status'), /线上在跑：没有版本（10-08 从 v1\.0\.0 回滚）/)
  r.ok('render')
})

/** Run `fn` as if this clone had never fetched `branch`: the ref is hidden while it runs. */
function offline(r, branch, fn) {
  const sha = r.g('rev-parse', branch).trim()
  r.g('update-ref', '-d', `refs/heads/${branch}`)
  try { fn() } finally { r.g('update-ref', `refs/heads/${branch}`, sha) }
}

test('the same step recorded twice from two branches is a duplicate, not a contradiction', () => {
  const r = ready(); newVersion(r, 'v1.0.0', '2026-10-01T09:00'); r.commit('init')
  r.g('checkout', '-q', '-b', 'a'); pass(r, 'v1.0.0', 'requirements', 2); r.commit('a')
  r.g('checkout', '-q', 'main'); r.g('checkout', '-q', '-b', 'b'); offline(r, 'a', () => pass(r, 'v1.0.0', 'requirements', 3)); r.commit('b')
  const v = r.state().versions[0]
  assert.equal(v.conflicts.length, 0); assert.equal(v.duplicates.length, 4); assert.equal(v.stages[0].signoff.at.slice(0, 10), '2026-10-02')
  assert.match(r.ok('check'), /检查通过/)
  r.no(/已经签收/, 'stage', 'enter', '--version', 'v1.0.0', '--stage', 'requirements', '--by', 'ai')
})

test('the side that lost a number clash is stopped, and voiding its creation clears everything written against it', () => {
  const r = ready(); r.commit('init')
  r.g('checkout', '-q', '-b', 'a'); newVersion(r, 'v1.1.0', '2026-10-01T09:00'); r.commit('a')
  r.g('checkout', '-q', 'main'); r.g('checkout', '-q', '-b', 'b')
  offline(r, 'a', () => {
    r.ok('version', 'new', '--version', 'v1.1.0', '--goal', '另一个目标', ...OWNERS, '--by', 'xiaolin', '--at', '2026-10-02T09:00')
    r.ok('config', 'set', '--item', 'version_owners', '--status', 'confirmed', '--quote', '确认', '--by', 'xiaolin', '--at', '2026-10-02T10:00')
    r.ok('stage', 'enter', '--version', 'v1.1.0', '--stage', 'requirements', '--by', 'ai', '--at', '2026-10-03T09:00')
  })
  r.commit('b')
  const lost = r.state().versions[0].conflicts.find((x) => x.type === 'version_create')
  assert.ok(lost.here); assert.equal(r.state().versions[0].conflicts.length, 2)
  r.no(/撞号了/, 'note', '--version', 'v1.1.0', '--text', '进展', '--by', 'ai')
  r.ok('event', 'void', '--target', lost.id, '--reason', '换号为 v1.2.0', '--by', 'xiaolin')
  assert.equal(r.state().versions[0].conflicts.length, 0); assert.match(r.ok('check'), /检查通过/)
  r.ok('note', '--version', 'v1.1.0', '--text', '进展', '--by', 'ai')
})

test('a released version cannot be put on hold, abandoned or replanned', () => {
  const r = ready(); newVersion(r, 'v1.0.0', '2026-10-01T09:00')
  for (const [i, s] of ['requirements', 'design', 'tech', 'test_design', 'dev', 'test'].entries()) pass(r, 'v1.0.0', s, i + 2)
  r.ok('deploy', '--env', 'production', '--action', 'deploy', '--versions', 'v1.0.0', '--approved-by', 'xiaolin', '--quote', '上', '--by', 'ai', '--at', '2026-10-09T08:00')
  pass(r, 'v1.0.0', 'release', 9)
  r.no(/已经发布/, 'version', 'hold', '--version', 'v1.0.0', '--reason', 'x', '--resume-when', 'x', '--quote', 'x', '--by', 'xiaolin')
  r.no(/已经发布/, 'version', 'abandon', '--version', 'v1.0.0', '--reason', 'x', '--quote', 'x', '--by', 'xiaolin')
  r.no(/已经发布/, 'version', 'replan', '--version', 'v1.0.0', '--to', '2026-12-01', '--reason', 'x', '--by', 'xiaolin')
  assert.equal(r.state().versions[0].status, 'released')
  newVersion(r, 'v1.1.0', '2026-10-10T09:00')
  r.no(/不属于在途版本/, 'downstream-check', '--version', 'v1.1.0', '--target', 'v1.0.0', '--result', 'not_needed', '--evidence', 'x', '--confirmed-by', 'azhe', '--quote', 'x', '--by', 'ai')
})

test('requirement items: numbers are per member, the requirements gate counts them, changes need a reference', () => {
  const r = ready(); newVersion(r, 'v1.0.0', '2026-10-01T09:00')
  const V = ['--version', 'v1.0.0']
  r.ok('stage', 'enter', ...V, '--stage', 'requirements', '--by', 'ai', '--at', '2026-10-02T09:00')
  assert.match(r.ok('stage', 'check', ...V, '--stage', 'requirements', '--check', 'a|ok|b', '--by', 'ai', '--at', '2026-10-02T09:10'), /门控未通过：需求条目已登记/)
  // No operator known: a random code. With an operator: that member's own counter.
  const anon = r.ok('item', 'add', ...V, '--name', '匿名登记', '--priority', 'P2', '--by', 'ai', '--at', '2026-10-02T09:20').match(/编号：(\S+?)（/)[1]
  assert.match(anon, /^FEAT-[a-z0-9]{4}$/)
  r.ok('whoami', '--set', 'xiaolin')
  assert.match(r.ok('item', 'add', ...V, '--name', '预约时段', '--priority', 'P0', '--module', '预约', '--by', 'ai', '--at', '2026-10-02T10:00'), /FEAT-xiaolin-001/)
  assert.match(r.ok('item', 'add', ...V, '--name', '取消预约', '--priority', 'P0', '--by', 'ai', '--at', '2026-10-02T10:01'), /FEAT-xiaolin-002/)
  r.ok('whoami', '--set', 'azhe')
  assert.match(r.ok('item', 'add', ...V, '--name', '导出', '--priority', 'P1', '--by', 'ai', '--at', '2026-10-02T10:02'), /FEAT-azhe-001/)
  r.no(/不是在册成员/, 'item', 'confirm', ...V, '--item', 'FEAT-xiaolin-001', '--quote', '好', '--by', 'ai')
  r.ok('item', 'confirm', ...V, '--item', 'FEAT-xiaolin-001', '--quote', '时段没问题', '--by', 'xiaolin', '--at', '2026-10-02T11:00')
  assert.match(r.ok('stage', 'check', ...V, '--stage', 'requirements', '--check', 'a|ok|b', '--by', 'ai', '--at', '2026-10-02T11:10'), /FEAT-xiaolin-002 取消预约/)
  r.ok('item', 'drop', ...V, '--item', 'FEAT-xiaolin-002', '--reason', '挪到下个版本', '--quote', '这版不做取消', '--by', 'xiaolin', '--at', '2026-10-02T11:20')
  r.no(/已经移出/, 'item', 'confirm', ...V, '--item', 'FEAT-xiaolin-002', '--quote', '好', '--by', 'xiaolin', '--at', '2026-10-02T11:30')
  assert.match(r.ok('stage', 'check', ...V, '--stage', 'requirements', '--check', 'a|ok|b', '--by', 'ai', '--at', '2026-10-02T11:40'), /门控通过/)
  r.no(/缺少 --ref/, 'item', 'change', ...V, '--item', 'FEAT-xiaolin-001', '--by', 'ai')
  r.ok('item', 'change', ...V, '--item', 'FEAT-xiaolin-001', '--ref', 'CHANGE-xiaolin-001', '--by', 'ai', '--at', '2026-10-02T12:00')
  const v = r.state().versions[0]
  assert.deepEqual(v.items.map((x) => x.status), ['draft', 'changed', 'dropped', 'draft'])
  assert.match(r.ok('status'), /需求条目：3 条（已变更 1，草稿 2；另有 1 条已移出）/)
  // A voided number is not handed out again.
  const last = v.events.findLast((e) => e.type === 'item_add')
  r.ok('event', 'void', '--target', last.id, '--reason', '登记错了', '--by', 'ai')
  assert.match(r.ok('item', 'add', ...V, '--name', '导出', '--priority', 'P1', '--by', 'ai'), /FEAT-azhe-002/)
})

test('defects: status order, human close, waiver, and the test gate', () => {
  const r = ready(); newVersion(r, 'v1.0.0', '2026-10-01T09:00'); r.ok('whoami', '--set', 'zhouzhou')
  for (const [i, s] of ['requirements', 'design', 'tech', 'test_design', 'dev'].entries()) pass(r, 'v1.0.0', s, i + 2)
  const V = ['--version', 'v1.0.0'], at = (h) => `2026-10-08T${h}:00`
  r.ok('stage', 'enter', ...V, '--stage', 'test', '--by', 'ai', '--at', at('09'))
  r.no(/发现阶段/, 'defect', 'open', ...V, '--title', 'x', '--severity', 'P1', '--found-in', 'prod', '--by', 'ai')
  assert.match(r.ok('defect', 'open', ...V, '--title', '关闭通知后仍收到邮件', '--severity', 'P1', '--found-in', 'test', '--case', 'TC-zhouzhou-002', '--by', 'ai', '--at', at('10')), /BUG-zhouzhou-001/)
  assert.match(r.ok('defect', 'open', ...V, '--title', '按钮错位', '--severity', 'P3', '--found-in', 'test', '--by', 'ai', '--at', at('10')), /BUG-zhouzhou-002/)
  const B1 = ['--defect', 'BUG-zhouzhou-001']
  r.no(/不能直接改为「待验收」/, 'defect', 'status', ...V, ...B1, '--to', 'verifying', '--by', 'ai')
  r.no(/才能由人验收关闭/, 'defect', 'close', ...V, ...B1, '--verifier', 'zhouzhou', '--quote', '好', '--by', 'ai')
  r.ok('defect', 'status', ...V, ...B1, '--to', 'fixing', '--assignee', 'azhe', '--by', 'ai', '--at', at('11'))
  r.ok('defect', 'status', ...V, ...B1, '--to', 'fixed', '--build', 'b12', '--by', 'ai', '--at', at('12'))
  r.no(/缺少 --note/, 'defect', 'status', ...V, ...B1, '--to', 'open', '--by', 'ai')
  r.ok('defect', 'status', ...V, ...B1, '--to', 'open', '--note', '复测仍收到邮件', '--by', 'ai', '--at', at('13'))
  r.ok('defect', 'status', ...V, ...B1, '--to', 'fixed', '--build', 'b13', '--by', 'ai', '--at', at('14'))
  r.ok('defect', 'status', ...V, ...B1, '--to', 'verifying', '--by', 'ai', '--at', at('15'))
  assert.match(r.ok('stage', 'check', ...V, '--stage', 'test', '--check', 'a|ok|b', '--by', 'ai', '--at', at('15')), /未关闭：BUG-zhouzhou-001（P1，待验收）、BUG-zhouzhou-002（P3，待修复）/)
  r.no(/不是在册成员/, 'defect', 'close', ...V, ...B1, '--verifier', 'ai', '--quote', '好', '--by', 'ai')
  r.ok('defect', 'close', ...V, ...B1, '--verifier', 'zhouzhou', '--quote', '验收通过', '--by', 'ai', '--at', at('16'))
  r.no(/不是在册成员/, 'defect', 'waive', ...V, '--defect', 'BUG-zhouzhou-002', '--scope', '仅 IE', '--quote', '先不修', '--by', 'ai')
  r.ok('defect', 'waive', ...V, '--defect', 'BUG-zhouzhou-002', '--scope', '只影响后台列表页', '--until', 'v1.1.0', '--quote', '这个先不修，下版处理', '--by', 'xiaolin', '--at', at('17'))
  assert.match(r.ok('stage', 'check', ...V, '--stage', 'test', '--check', 'a|ok|b', '--by', 'ai', '--at', at('18')), /门控通过/)
  const d = r.state().versions[0].defects
  assert.equal(d[0].status, 'closed'); assert.equal(d[0].reopened, 1); assert.equal(d[0].assignee, 'azhe'); assert.equal(d[0].build, 'b13'); assert.equal(d[1].waiver.until, 'v1.1.0')
  assert.match(r.ok('status'), /缺陷：未关闭 0 条 · 已关闭 1 · 豁免 1/)
  assert.match(r.ok('defect', 'list', ...V), /BUG-zhouzhou-001 \| P1 \| 已关闭（退回 1 次）/)
})

test('the same ledger number registered twice on two branches keeps both files and flags the later one', () => {
  const r = ready(); newVersion(r, 'v1.0.0', '2026-10-01T09:00'); r.ok('whoami', '--set', 'azhe'); r.commit('init')
  const open = (title, at) => r.ok('defect', 'open', '--version', 'v1.0.0', '--title', title, '--severity', 'P2', '--found-in', 'self_test', '--by', 'ai', ...(at ? ['--at', at] : []))
  r.g('checkout', '-q', '-b', 'a'); open('台式机上登记的', '2026-10-02T09:00'); r.commit('a')
  r.g('checkout', '-q', 'main'); r.g('checkout', '-q', '-b', 'b'); offline(r, 'a', () => open('笔记本上登记的', '2026-10-02T10:00')); r.commit('b')
  const v = r.state().versions[0]
  assert.equal(v.defects.length, 1); assert.equal(v.defects[0].title, '台式机上登记的'); assert.match(v.conflicts[0].why, /编号 BUG-azhe-001 已经被占用/)
  r.ok('event', 'void', '--target', v.conflicts[0].id, '--reason', '撞号，重新登记', '--by', 'ai')
  assert.match(open('笔记本上登记的'), /BUG-azhe-002/)
  assert.match(r.ok('check'), /检查通过/)
})
