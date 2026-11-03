#!/usr/bin/env node
// Builds an isolated sandbox for one L2 scenario from a given template commit.
// Usage: node prepare.mjs <S1..S7> <runDir> [ref=HEAD]
// The sandbox never contains maintainer/, so the acting agent cannot see rubrics.

import { execFileSync, execSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const [scenario, runDirArg, ref = 'HEAD'] = process.argv.slice(2)
if (!scenario || !runDirArg) throw new Error('usage: node prepare.mjs <S1..S7> <runDir> [ref]')

const repo = resolve(import.meta.dirname, '..', '..', '..')
const fixtures = resolve(import.meta.dirname, '..', 'fixtures')
const base = resolve(runDirArg, scenario)
const panel = join(base, 'panel')
mkdirSync(panel, { recursive: true })

execSync(`git -C "${repo}" archive ${ref} -- . ":(exclude)maintainer" | tar -x -C "${panel}"`)
const sh = (...args) => execFileSync('git', ['-C', panel, ...args], { encoding: 'utf8' })
const commit = (msg) => { sh('add', '-A'); sh('-c', 'user.name=validator', '-c', 'user.email=validator@example.com', 'commit', '-qm', msg) }
sh('init', '-q', '-b', 'main')

if (['S3', 'S4', 'S5', 'S7'].includes(scenario)) {
  execFileSync('node', [join(fixtures, 'seed-v1', 'apply.mjs'), panel], { stdio: 'inherit' })
}
if (scenario === 'S7') {
  // Standards lookup is exercised during development, so the gates are not in the way.
  const current = join(panel, 'versions', 'CURRENT.md')
  writeFileSync(current, readFileSync(current, 'utf8').replace('**阶段**: 技术方案', '**阶段**: 开发中'))
  const version = join(panel, 'versions', 'v1.0.0', 'README.md')
  writeFileSync(version, readFileSync(version, 'utf8')
    .replace(/\| 技术方案 \| 🔄 进行中 \| 2026-10-20 \| - \|([^|]*)\| \|/, '| 技术方案 | ✅ 完成 | 2026-10-20 | 2026-10-24 |$1| @小王 2026-10-24：方案确认 |')
    .replace('| 测试设计 | ⏳ 待开始 | - | - | | |', '| 测试设计 | ✅ 完成 | 2026-10-25 | 2026-10-28 | 用例评审通过 | @小周 2026-10-28：用例确认 |')
    .replace('| 开发中   | ⏳ 待开始 | - | - | | |', '| 开发中   | 🔄 进行中 | 2026-10-29 | - | | |'))
}
if (scenario === 'S2') {
  cpSync(join(fixtures, 'legacy-shop'), join(base, 'legacy-shop'), { recursive: true })
}
commit('initial state')

if (scenario === 'S6') {
  // Upstream and fork both add a new SOP-13 at the same place: the conflict that once silently dropped a fork's own SOP.
  const insertBefore = '\n---\n\n## §6 文档落档规约'
  const addSop = (title, body) => {
    const path = join(panel, 'AGENTS.md')
    const text = readFileSync(path, 'utf8')
    writeFileSync(path, text.replace(insertBefore, `\n---\n\n### ${title}\n\n${body}\n${insertBefore}`))
  }
  sh('branch', 'upstream')
  addSop('SOP-13 线上问题研判', '**触发**：线上出现问题需要判断是否走热修复。\n\n**步骤：**\n1. 读取 `foundation/product/production-bugs.md` 确认是否已有记录\n2. 收集现象、影响范围、首次出现时间\n3. 给出「热修复 / 下版本修复 / 不修复」建议，由负责人决定')
  const fork = join(panel, 'AGENTS.md')
  writeFileSync(fork, readFileSync(fork, 'utf8').replace('**触发**：用户反馈生产环境有问题，或描述了一个 bug', '**触发**：用户反馈生产环境有问题，或描述了一个 bug（先按 SOP-13 线上问题研判）'))
  commit('fork: add SOP-13 production issue triage')
  sh('checkout', '-q', 'upstream')
  addSop('SOP-13 阶段门控评审', '**触发**：阶段推进前，需要对产出做一次独立评审。\n\n**步骤：**\n1. 按阶段读取产出物\n2. 由非作者对照对应规范逐项检查\n3. 记录评审结论，未通过不得推进')
  const up = join(panel, 'AGENTS.md')
  writeFileSync(up, readFileSync(up, 'utf8').replace('**推进前检查（阶段门控）**：', '**推进前检查（阶段门控，评审方法见 SOP-13）**：'))
  commit('upstream: add SOP-13 gate review')
  sh('checkout', '-q', 'main')
}

console.log(JSON.stringify({ scenario, panel, base, ref: execFileSync('git', ['-C', repo, 'rev-parse', '--short', ref], { encoding: 'utf8' }).trim() }))
