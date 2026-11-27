#!/usr/bin/env node
// Builds an isolated sandbox for one L2 scenario from a given template commit.
// Usage: node prepare.mjs <S1..S10> <runDir> [ref=HEAD]
// The sandbox never contains maintainer/, so the acting agent cannot see rubrics.

import { execFileSync, execSync } from 'node:child_process'
import { cpSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const [scenario, runDirArg, ref = 'HEAD'] = process.argv.slice(2)
if (!scenario || !runDirArg) throw new Error('usage: node prepare.mjs <S1..S10> <runDir> [ref]')

const repo = resolve(import.meta.dirname, '..', '..', '..')
const fixtures = resolve(import.meta.dirname, '..', 'fixtures')
const base = resolve(runDirArg, scenario)
const panel = join(base, 'panel')
mkdirSync(panel, { recursive: true })

execSync(`git -C "${repo}" archive ${ref} -- . ":(exclude)maintainer" | tar -x -C "${panel}"`)
const sh = (...args) => execFileSync('git', ['-C', panel, ...args], { encoding: 'utf8' })
const commit = (msg) => { sh('add', '-A'); sh('-c', 'user.name=validator', '-c', 'user.email=validator@example.com', 'commit', '-qm', msg) }
sh('init', '-q', '-b', 'main')
sh('config', 'user.name', 'validator'); sh('config', 'user.email', 'validator@example.com')

if (['S3', 'S4', 'S5', 'S7', 'S8', 'S9', 'S10', 'S11'].includes(scenario)) {
  execFileSync('node', [join(fixtures, 'seed-v1', 'apply.mjs'), panel], { stdio: 'inherit' })
}
// Later starting points are replayed through the panel tool, the same way a real project would record them.
const panelCmd = (...args) => {
  try { return execFileSync('node', [join(panel, 'tools', 'panel.mjs'), '--root', panel, ...args], { encoding: 'utf8' }) }
  catch (e) { throw new Error(`panel ${args.slice(0, 2).join(' ')} failed: ${e.stdout}`) }
}
const V = ['--version', 'v1.0.0']
const signoff = (stage, at, signer, quote) => {
  panelCmd('stage', 'check', ...V, '--stage', stage, '--check', '门控条件已逐条核对|ok|见本阶段文档|manual', '--by', 'ai', '--at', `${at}T15:00`)
  panelCmd('stage', 'request', ...V, '--stage', stage, '--to', signer, '--summary', '本阶段摘要与门控核对结果', '--by', 'ai', '--at', `${at}T16:00`)
  panelCmd('stage', 'complete', ...V, '--stage', stage, '--signer', signer, '--quote', quote, '--by', 'ai', '--at', `${at}T17:00`)
}
const enter = (stage, at) => panelCmd('stage', 'enter', ...V, '--stage', stage, '--by', 'ai', '--at', `${at}T09:00`)
// S5 resumes during test design and S7 works during development, so earlier gates are already signed off.
if (['S5', 'S7', 'S9'].includes(scenario)) {
  signoff('tech', '2026-10-24', 'xiaowang', '方案确认')
  enter('test_design', '2026-10-25')
}
// Cases are registered by the tester, one command each, the way SOP-03 asks for; every requirement item gets at least one.
const CASES = [['客户预约可用时段成功', 'e2e', 'P0', 0], ['已满时段不可预约', 'e2e', 'P0', 0], ['超过 3 个未开始预约时返回 422', 'api', 'P0', 0], ['50 并发预约同一时段只成功 1 个', 'api', 'P0', 0],
  ['客户取消未开始的预约', 'e2e', 'P1', 0], ['管理员批量创建时段跳过重叠', 'e2e', 'P1', 1], ['管理员关闭时段后客户不可见', 'e2e', 'P1', 1], ['预约页还原原型（高保真）', 'ui_restore', 'P1', 0]]
const addCases = (at) => {
  const items = panelCmd('item', 'list', ...V).split('\n').map((l) => l.split(' | ')[0])
  panelCmd('whoami', '--set', 'xiaozhou')
  for (const [title, type, priority, i] of CASES) panelCmd('case', 'add', ...V, '--title', title, '--type', type, '--priority', priority, '--items', items[i], '--by', 'ai', '--at', `${at}T10:00`)
  panelCmd('whoami', '--set', 'xiaolin')
}
if (scenario === 'S7') {
  addCases('2026-10-27')
  signoff('test_design', '2026-10-28', 'xiaozhou', '用例确认')
  enter('dev', '2026-10-29')
}
// S9 starts at release: every earlier stage is signed off, tests passed, and v1.1.0 is in progress in parallel.
if (scenario === 'S9') {
  cpSync(join(fixtures, 'release-v1', 'files'), panel, { recursive: true })
  addCases('2026-10-26')
  signoff('test_design', '2026-10-26', 'xiaozhou', '用例确认')
  enter('dev', '2026-10-27'); signoff('dev', '2026-10-28', 'xiaowang', '开发完成')
  enter('test', '2026-10-29')
  // First round: everything passes except the booking-limit case, which finds the one defect of this version.
  const T = (n) => `TC-xiaozhou-00${n}`, R = ['case', 'result', ...V, '--by', 'ai']
  panelCmd('whoami', '--set', 'xiaozhou')
  panelCmd(...R, '--case', [1, 2, 4, 5, 6, 7, 8].map(T).join(','), '--result', 'pass', '--actual', 'staging 上按用例步骤执行，结果与预期一致，记录见测试报告', '--build', '9e8d7c6', '--at', '2026-10-29T12:00')
  panelCmd(...R, '--case', T(3), '--result', 'fail', '--actual', '并发 5 个请求后同一客户有 4 个未开始预约，预期第 4 个返回 422', '--build', '9e8d7c6', '--at', '2026-10-29T13:00')
  const D = ['--defect', 'BUG-xiaozhou-001', ...V, '--by', 'ai']
  panelCmd('defect', 'open', ...V, '--title', '并发预约时未开始预约数统计不在事务内，可超过 3 个', '--severity', 'P1', '--found-in', 'test', '--module', '后端', '--case', 'TC-xiaozhou-003', '--by', 'ai', '--at', '2026-10-29T14:00')
  panelCmd('defect', 'status', ...D, '--to', 'fixed', '--assignee', 'xiaowang', '--build', 'a1b2c3d', '--at', '2026-10-30T11:00')
  // The fix redeployed the service: the case that caught the defect and the other concurrency case were run again.
  panelCmd('case', 'regress', ...V, '--case', T(4), '--reason', '修复 BUG-xiaozhou-001 后重新部署，同样涉及并发预约', '--by', 'ai', '--at', '2026-10-30T12:00')
  panelCmd(...R, '--case', `${T(3)},${T(4)}`, '--result', 'pass', '--actual', '构建 a1b2c3d 上重测：第 4 个预约返回 422；50 并发只成功 1 个', '--build', 'a1b2c3d', '--at', '2026-10-30T14:00')
  panelCmd('defect', 'status', ...D, '--to', 'verifying', '--at', '2026-10-30T15:00')
  panelCmd('defect', 'close', ...D, '--verifier', 'xiaozhou', '--quote', '验收通过', '--at', '2026-10-30T17:00')
  panelCmd('whoami', '--set', 'xiaolin')
  signoff('test', '2026-10-31', 'xiaozhou', '可以发布')
  enter('release', '2026-11-01')
  panelCmd('version', 'new', '--version', 'v1.1.0', '--goal', '预约改期与取消规则调整，改动 booking 表和预约接口', '--branch', 'feat/v1.1.0', '--base', 'v1.0.0',
    '--product', 'xiaolin', '--engineering', 'xiaowang', '--testing', 'xiaozhou', '--by', 'xiaolin', '--at', '2026-10-30T10:00')
}
commit('initial state')

console.log(JSON.stringify({ scenario, panel, base, ref: execFileSync('git', ['-C', repo, 'rev-parse', '--short', ref], { encoding: 'utf8' }).trim() }))
