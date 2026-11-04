#!/usr/bin/env node
// Builds an isolated sandbox for one L2 scenario from a given template commit.
// Usage: node prepare.mjs <S1..S10> <runDir> [ref=HEAD]
// The sandbox never contains maintainer/, so the acting agent cannot see rubrics.

import { execFileSync, execSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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

if (['S3', 'S4', 'S5', 'S7', 'S8', 'S9', 'S10'].includes(scenario)) {
  execFileSync('node', [join(fixtures, 'seed-v1', 'apply.mjs'), panel], { stdio: 'inherit' })
}
// S9 starts at release: every earlier stage is signed off, tests passed, and v1.1.0 is in progress in parallel.
if (scenario === 'S9') {
  cpSync(join(fixtures, 'release-v1', 'files'), panel, { recursive: true })
  const patchFile = (path, pairs) => {
    let text = readFileSync(join(panel, path), 'utf8')
    for (const [from, to] of pairs) {
      if (from instanceof RegExp ? !from.test(text) : !text.includes(from)) throw new Error(`${path}: pattern not found: ${from}`)
      text = text.replace(from, to)
    }
    writeFileSync(join(panel, path), text)
  }
  patchFile('versions/CURRENT.md', [
    ['**阶段**: 技术方案', '**阶段**: 发布'],
    ['**进入时间**: 2026-10-20', '**进入时间**: 2026-11-01'],
    ['| — | — | — | — | — | — |', '| v1.1.0 | 在研 | feat/v1.1.0 | @小林 | 2026-10-30 | 预约改期与取消规则调整，改动 booking 表和预约接口 |'],
  ])
  patchFile('versions/README.md', [
    ['| ✅ | ✅ | 🔄 | ⏳ | ⏳ | ⏳ | ⏳ | 技术方案 | - |', '| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🔄 | 发布 | - |'],
  ])
  patchFile('versions/v1.0.0/README.md', [
    [/\| 技术方案 \| 🔄 进行中 \| 2026-10-20 \| - \|([^|]*)\| \|/, '| 技术方案 | ✅ 完成 | 2026-10-20 | 2026-10-24 |$1| @小王 2026-10-24：方案确认 |'],
    ['| 测试设计 | ⏳ 待开始 | - | - | | |', '| 测试设计 | ✅ 完成 | 2026-10-25 | 2026-10-26 | 用例评审通过 | @小周 2026-10-26：用例确认 |'],
    ['| 开发中   | ⏳ 待开始 | - | - | | |', '| 开发中   | ✅ 完成 | 2026-10-27 | 2026-10-28 | 已部署 staging | @小王 2026-10-28：开发完成 |'],
    ['| 测试     | ⏳ 待开始 | - | - | | |', '| 测试     | ✅ 完成 | 2026-10-29 | 2026-10-31 | 8/8 通过，缺陷 1 个已关闭 | @小周 2026-10-31：可以发布 |'],
    ['| 发布     | ⏳ 待开始 | - | - | | |', '| 发布     | 🔄 进行中 | 2026-11-01 | - | | |'],
  ])
}
// S5 resumes during test design and S7 works during development, so earlier gates are already signed off.
if (['S5', 'S7'].includes(scenario)) {
  const stage = scenario === 'S5' ? '测试设计' : '开发中'
  const current = join(panel, 'versions', 'CURRENT.md')
  writeFileSync(current, readFileSync(current, 'utf8').replace('**阶段**: 技术方案', `**阶段**: ${stage}`))
  const version = join(panel, 'versions', 'v1.0.0', 'README.md')
  let text = readFileSync(version, 'utf8')
    .replace(/\| 技术方案 \| 🔄 进行中 \| 2026-10-20 \| - \|([^|]*)\| \|/, '| 技术方案 | ✅ 完成 | 2026-10-20 | 2026-10-24 |$1| @小王 2026-10-24：方案确认 |')
  text = scenario === 'S5'
    ? text.replace('| 测试设计 | ⏳ 待开始 | - | - | | |', '| 测试设计 | 🔄 进行中 | 2026-10-25 | - | | |')
    : text.replace('| 测试设计 | ⏳ 待开始 | - | - | | |', '| 测试设计 | ✅ 完成 | 2026-10-25 | 2026-10-28 | 用例评审通过 | @小周 2026-10-28：用例确认 |')
      .replace('| 开发中   | ⏳ 待开始 | - | - | | |', '| 开发中   | 🔄 进行中 | 2026-10-29 | - | | |')
  writeFileSync(version, text)
}
commit('initial state')

if (scenario === 'S6') {
  // Upstream and a legacy fork both add their own SOP-14: different file names, so git reports no
  // conflict on the files themselves, only on the index row. This is how a fork's SOP once got lost.
  const agents = join(panel, 'AGENTS.md')
  const sopDir = join(panel, 'agents', 'sop')
  const edit = (path, from, to) => {
    const text = readFileSync(path, 'utf8')
    if (!text.includes(from)) throw new Error(`${path}: pattern not found: ${from}`)
    writeFileSync(path, text.replace(from, to))
  }
  const addSop = (file, title, body) => {
    writeFileSync(join(sopDir, file), `# ${title}\n\n${body}\n`)
    const text = readFileSync(agents, 'utf8')
    const row = text.split('\n').find((l) => l.startsWith('| [SOP-13]'))
    const [id, ...rest] = title.split(' ')
    writeFileSync(agents, text.replace(row, `${row}\n| [${id}](./agents/sop/${file}) | ${rest.join(' ')} | ${body.match(/\*\*触发\*\*：(.*)/)[1]} |`))
  }
  sh('branch', 'upstream')
  addSop('SOP-14-production-triage.md', 'SOP-14 线上问题研判', '**触发**：线上出现问题需要判断是否走热修复。\n\n**步骤：**\n1. 读取 `foundation/product/production-bugs.md` 确认是否已有记录\n2. 收集现象、影响范围、首次出现时间\n3. 给出「热修复 / 下版本修复 / 不修复」建议，由负责人决定')
  edit(join(sopDir, 'SOP-00.6-production-bugs.md'), '**触发**：用户反馈生产环境有问题，或描述了一个 bug', '**触发**：用户反馈生产环境有问题，或描述了一个 bug（先按 SOP-14 线上问题研判）')
  commit('fork: add SOP-14 production issue triage')
  sh('checkout', '-q', 'upstream')
  addSop('SOP-14-gate-review.md', 'SOP-14 阶段门控评审', '**触发**：阶段推进前，需要对产出做一次独立评审。\n\n**步骤：**\n1. 按阶段读取产出物\n2. 由非作者对照对应规范逐项检查\n3. 记录评审结论，未通过不得推进')
  edit(join(sopDir, 'SOP-07-stage-gate.md'), '**推进前检查（阶段门控）**：', '**推进前检查（阶段门控，评审方法见 SOP-14）**：')
  commit('upstream: add SOP-14 gate review')
  sh('checkout', '-q', 'main')
}

console.log(JSON.stringify({ scenario, panel, base, ref: execFileSync('git', ['-C', repo, 'rev-parse', '--short', ref], { encoding: 'utf8' }).trim() }))
