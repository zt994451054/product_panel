#!/usr/bin/env node
// Seeds a pristine panel copy into "BookEasy v1.0.0, tech solution finished" state.
// Usage: node apply.mjs <sandboxPanelDir>

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

// §0 sentinels: product name, CURRENT entry date, OSS, market research, primary color
// Replace only the title and §1 field: a global replace would also rewrite the §0 sentinel rule text itself.
patch('AGENTS.md', [['# {产品名} — AI 操作规约', '# BookEasy — AI 操作规约'], ['**产品名称**：{产品名}', '**产品名称**：BookEasy']])
patch('README.md', [['{产品名称}', 'BookEasy']])
patch('OSS.md', [['<!-- 如：https://assets.example.com -->', '不使用（本产品无文件上传需求）']])
patch('foundation/market/market-research.md', [
  ['| 全球市场规模 | <!-- 如：$XXB --> | <!-- 报告/机构名称 --> | <!-- 年份 --> |', '| 全球市场规模 | 约 $500M（在线预约 SaaS，中小团队段） | 内部估算 | 2026 |'],
])
patch('standards/design/DESIGN.md', [['Primary:       #______', 'Primary:       #2563EB']])
patch('versions/CURRENT.md', [
  ['**阶段**: 规划中', '**阶段**: 技术方案'],
  ['**进入时间**: <!-- YYYY-MM-DD -->', '**进入时间**: 2026-10-20'],
  ['- 产品: <!-- @姓名 -->', '- 产品: @小林'],
  ['- 研发: <!-- @姓名 -->', '- 研发: @小王'],
  ['- 测试: <!-- @姓名 -->', '- 测试: @小周'],
])
patch('versions/README.md', [
  [
    ['| [v1.0.0](./v1.0.0/README.md) | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | 规划中 | - |', '| [v1.0.0](./v1.0.0/README.md) | ✅ | ✅ | 🔄 | ⏳ | ⏳ | ⏳ | ⏳ | 技术方案 | - |'],
    ['| [v1.0.0](./v1.0.0/README.md) | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | 规划中 | - |', '| [v1.0.0](./v1.0.0/README.md) | ✅ | ✅ | 🔄 | ⏳ | ⏳ | ⏳ | 技术方案 | - |'],
  ],
])
patch('versions/v1.0.0/README.md', [
  [
    ['| 需求分析 | ⏳ 待开始 | - | - | | |', '| 需求分析 | ✅ 完成 | 2026-10-08 | 2026-10-13 | 两个 P0 模块已确认 | @小林 2026-10-13：需求确认 |'],
    ['| 需求分析 | ⏳ 待开始 | - | - | |', '| 需求分析 | ✅ 完成 | 2026-10-08 | 2026-10-13 | 两个 P0 模块已确认 |'],
  ],
  [
    ['| 产品设计 | ⏳ 待开始 | - | - | | |', '| 产品设计 | ✅ 完成 | 2026-10-14 | 2026-10-19 | 原型已更新 | @小林 2026-10-19：设计确认 |'],
    ['| 产品设计 | ⏳ 待开始 | - | - | |', '| 产品设计 | ✅ 完成 | 2026-10-14 | 2026-10-19 | 原型已更新 |'],
  ],
  [
    ['| 技术方案 | ⏳ 待开始 | - | - | | |', '| 技术方案 | 🔄 进行中 | 2026-10-20 | - | 方案、接口、数据库设计已写完 | |'],
    ['| 技术方案 | ⏳ 待开始 | - | - | |', '| 技术方案 | 🔄 进行中 | 2026-10-20 | - | 方案、接口、数据库设计已写完 |'],
  ],
  ['| 增量 DDL | <!-- 表结构变更说明，无则填「无」 --> | ⏳ |', '| 增量 DDL | 新增 slot、booking 两张表 | ⏳ |'],
  ['| 数据迁移脚本 | <!-- SQL 数据脚本说明，无则填「无」 --> | ⏳ |', '| 数据迁移脚本 | 无 | — |'],
  ['| 配置变更 | <!-- 环境变量/配置文件修改项，无则填「无」 --> | ⏳ |', '| 配置变更 | 新增 BOOKING_MAX_ACTIVE=3 | ⏳ |'],
  ['| 代码脚本 | <!-- 需手动执行的代码脚本，无则填「无」 --> | ⏳ |', '| 代码脚本 | 无 | — |'],
  ['| 服务依赖 | <!-- 依赖的其他服务版本或发布顺序，无则填「无」 --> | ⏳ |', '| 服务依赖 | 先发 booking-api，再发 booking-web | ⏳ |'],
])
patch('engineering/README.md', [[
  "| <!-- 如：web-frontend --> | <!-- 前端 / 后端 / 全栈 / 移动端 / 微服务 --> | <!-- git@... 或「待创建」--> | main | 见 `standards/engineering/standards.md` | `engineering/workspace/<工程名>/` | <!-- 一句话说明本工程负责什么 --> | <!-- 该工程仓库 README 的 URL --> |",
  "| booking-web | 前端 | git@git.example.com:bookeasy/booking-web.git | main | 见 `standards/engineering/standards.md` | `engineering/workspace/booking-web/` | 预约 Web 端与管理后台 | 仓库 README |\n| booking-api | 后端 | git@git.example.com:bookeasy/booking-api.git | main | 见 `standards/engineering/standards.md` | `engineering/workspace/booking-api/` | 时段与预约接口 | 仓库 README |",
]])

// Filled version documents (requirements, design, tech solution, API, DB, release)
cpSync(join(import.meta.dirname, 'files'), dir, { recursive: true })
console.log(`seeded ${dir}`)
