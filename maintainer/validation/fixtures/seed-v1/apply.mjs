#!/usr/bin/env node
// Seeds a pristine panel copy into "BookEasy v1.0.0, tech solution finished" state.
// Usage: node apply.mjs <sandboxPanelDir>

import { execFileSync } from 'node:child_process'
import { cpSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2]
if (!dir) throw new Error('usage: node apply.mjs <sandboxPanelDir>')

// `from` may be an array of [from, to] alternatives (newer template first); the first one found is applied.
const patch = (file, pairs) => {
  const path = join(dir, file)
  let text = readFileSync(path, 'utf8')
  for (const pair of pairs) {
    const [from, to] = Array.isArray(pair[0]) ? (pair.find(([f]) => text.includes(f)) ?? pair[0]) : pair
    if (!text.includes(from)) throw new Error(`${file}: pattern not found: ${from}`)
    text = text.replaceAll(from, to)
  }
  writeFileSync(path, text)
}

// Product name and filled baseline documents. Replace only the title and §1 field, not the rule text.
patch('AGENTS.md', [['# {产品名} — AI 操作规约', '# BookEasy — AI 操作规约'], ['**产品名称**：{产品名}', '**产品名称**：BookEasy']])
// README.md is the template introduction and carries no product-name placeholder, so it is left as is.
patch('OSS.md', [['<!-- 如：https://assets.example.com -->', '不使用（本产品无文件上传需求）']])
patch('foundation/market/market-research.md', [
  ['| 全球市场规模 | <!-- 如：$XXB --> | <!-- 报告/机构名称 --> | <!-- 年份 --> |', '| 全球市场规模 | 约 $500M（在线预约 SaaS，中小团队段） | 内部估算 | 2026 |'],
])
patch('standards/design/DESIGN.md', [['Primary:       #______', 'Primary:       #2563EB']])
patch('versions/v1.0.0/README.md', [
  ['| 增量 DDL | <!-- 表结构变更说明，无则填「无」 --> | ⏳ |', '| 增量 DDL | 新增 slot、booking 两张表 | ⏳ |'],
  ['| 数据迁移脚本 | <!-- SQL 数据脚本说明，无则填「无」 --> | ⏳ |', '| 数据迁移脚本 | 无 | — |'],
  ['| 配置变更 | <!-- 环境变量/配置文件修改项，无则填「无」 --> | ⏳ |', '| 配置变更 | 新增 BOOKING_MAX_ACTIVE=3 | ⏳ |'],
  ['| 代码脚本 | <!-- 需手动执行的代码脚本，无则填「无」 --> | ⏳ |', '| 代码脚本 | 无 | — |'],
  ['| 服务依赖 | <!-- 依赖的其他服务版本或发布顺序，无则填「无」 --> | ⏳ |', '| 服务依赖 | 先发 booking-api，再发 booking-web | ⏳ |'],
])
patch('engineering/README.md', [[
  "| <!-- 如：web-frontend --> | <!-- 前端 / 后端 / 全栈 / 移动端 / 微服务 --> | <!-- git@... 或「待创建」--> | main | 见 `standards/version-control/git-workflow.md` | `engineering/workspace/<工程名>/` | <!-- 一句话说明本工程负责什么 --> | <!-- 该工程仓库 README 的 URL --> |",
  "| booking-web | 前端 | git@git.example.com:bookeasy/booking-web.git | main | 见 `standards/version-control/git-workflow.md` | `engineering/workspace/booking-web/` | 预约 Web 端与管理后台 | 仓库 README |\n| booking-api | 后端 | git@git.example.com:bookeasy/booking-api.git | main | 见 `standards/version-control/git-workflow.md` | `engineering/workspace/booking-api/` | 时段与预约接口 | 仓库 README |",
]])

// State is recorded through the panel tool, never written into documents.
const panel = (...args) => {
  try { return execFileSync('node', [join(dir, 'tools', 'panel.mjs'), '--root', dir, ...args], { encoding: 'utf8' }) }
  catch (e) { throw new Error(`panel ${args.slice(0, 2).join(' ')} failed: ${e.stdout}`) }
}
panel('init', '--name', 'BookEasy', '--positioning', '让小型服务团队的客户在线自助预约时段', '--type', 'new', '--timezone', 'Asia/Shanghai', '--by', 'xiaolin', '--at', '2026-10-08T09:00')
for (const [id, name, role, domain] of [['xiaolin', '小林', '产品经理', 'product'], ['xiaowang', '小王', '研发', 'engineering'], ['xiaozhou', '小周', '测试', 'testing']])
  panel('member', 'add', '--id', id, '--name', name, '--role', role, '--domains', domain, '--by', 'xiaolin', '--at', '2026-10-08T09:10')
// The person driving this sandbox is the product owner, as their personal profile would say in a real clone.
panel('whoami', '--set', 'xiaolin')
const config = (item, status, by, day, extra) => panel('config', 'set', '--item', item, '--status', status, '--by', by, '--at', `2026-10-${day}T10:00`, ...extra)
const confirmed = (item, by, day) => config(item, 'confirmed', by, day, ['--quote', '确认'])
confirmed('product_info', 'xiaolin', '08')
confirmed('design_system', 'xiaolin', '14')
for (const item of ['repos', 'tech_arch', 'local_dev', 'environments', 'ops_profile']) confirmed(item, 'xiaowang', '20')
config('object_storage', 'na', 'xiaolin', '08', ['--note', '无文件上传需求'])
confirmed('standards', 'xiaolin', '08')
confirmed('market_research', 'xiaolin', '08')
for (const item of ['product_arch', 'competitor_analysis', 'user_research', 'business_model', 'go_to_market', 'test_projects']) config(item, 'skipped', 'xiaolin', '08', ['--note', '以后再填'])

// v1.0.0: requirements and design signed off, tech solution in progress.
const V = ['--version', 'v1.0.0']
panel('version', 'new', ...V, '--goal', '客户在线预约时段，管理员管理时段', '--kind', 'major', '--product', 'xiaolin', '--engineering', 'xiaowang', '--testing', 'xiaozhou', '--by', 'xiaolin', '--at', '2026-10-08T09:30')
confirmed('version_owners', 'xiaolin', '08')
const done = (stage, from, to, signer, quote) => {
  panel('stage', 'enter', ...V, '--stage', stage, '--by', 'ai', '--at', `2026-10-${from}T11:00`)
  panel('stage', 'check', ...V, '--stage', stage, '--check', '门控条件已逐条核对|ok|见本阶段文档|manual', '--by', 'ai', '--at', `2026-10-${to}T15:00`)
  panel('stage', 'request', ...V, '--stage', stage, '--to', signer, '--summary', '本阶段摘要与门控核对结果', '--by', 'ai', '--at', `2026-10-${to}T16:00`)
  panel('stage', 'complete', ...V, '--stage', stage, '--signer', signer, '--quote', quote, '--by', 'ai', '--at', `2026-10-${to}T17:00`)
}
done('requirements', '08', '13', 'xiaolin', '需求确认')
done('design', '14', '19', 'xiaolin', '设计确认')
panel('stage', 'enter', ...V, '--stage', 'tech', '--by', 'ai', '--at', '2026-10-20T09:00')
panel('note', ...V, '--text', '方案、接口、数据库设计已写完', '--by', 'ai', '--at', '2026-10-20T18:00')

// Filled version documents (requirements, design, tech solution, API, DB, release) and ops profile
cpSync(join(import.meta.dirname, 'files'), dir, { recursive: true })
console.log(`seeded ${dir}`)
