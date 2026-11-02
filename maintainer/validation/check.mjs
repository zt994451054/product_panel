#!/usr/bin/env node
// L1 static checks for the driver panel template.
// Usage: node maintainer/validation/check.mjs [repoRoot]
// Exit code: 0 when no check FAILs, 1 otherwise. WARN does not fail the run.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync, globSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const root = resolve(process.argv[2] ?? join(import.meta.dirname, '..', '..'))
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' })

// Fixtures intentionally contain traps (fake secrets etc.), so they are excluded from content checks.
const EXCLUDE = [/^maintainer\/validation\/fixtures\//, /^foundation\/design\/prototype\/(node_modules|dist)\//]
const tracked = git('ls-files', '-z').split('\0').filter(Boolean)
const textFiles = tracked.filter(
  (f) => /\.(md|mdc|txt|ya?ml|json|js|jsx|mjs|ts|tsx|html|css)$|^\.(cursorrules|windsurfrules|gitignore)$/.test(f) &&
    !EXCLUDE.some((re) => re.test(f)) && existsSync(join(root, f))
)
const mdFiles = textFiles.filter((f) => f.endsWith('.md'))
const read = (f) => readFileSync(join(root, f), 'utf8')

const results = []
const report = (id, title, status, details = []) => results.push({ id, title, status, details })

// Lines outside fenced code blocks, with 1-based line numbers.
function proseLines(text) {
  const out = []
  let fenced = false
  text.split('\n').forEach((line, i) => {
    if (/^\s*```/.test(line)) { fenced = !fenced; return }
    if (!fenced) out.push([i + 1, line])
  })
  return out
}

// C01 every referenced SOP number has a heading definition in AGENTS.md
{
  const agents = read('AGENTS.md')
  const defined = new Set([...agents.matchAll(/^#{2,4}\s+(SOP-\d{2}(?:\.\d+)?)\b/gm)].map((m) => m[1]))
  const missing = new Map()
  for (const f of mdFiles) {
    if (f.startsWith('maintainer/')) continue
    read(f).split('\n').forEach((line, i) => {
      for (const m of line.matchAll(/SOP-\d{2}(?:\.\d+)?/g)) {
        if (defined.has(m[0])) continue
        const locs = missing.get(m[0]) ?? []
        locs.push(`${f}:${i + 1}`)
        missing.set(m[0], locs)
      }
    })
  }
  const details = [...missing].map(([sop, locs]) => `${sop} 被引用 ${locs.length} 次但没有标题定义，例如 ${locs.slice(0, 3).join(', ')}`)
  report('C01', 'SOP 引用都有标题定义', details.length ? 'FAIL' : 'PASS', details)
}

// C02 every AI entry file points to AGENTS.md
{
  const entries = ['CLAUDE.md', '.cursorrules', '.windsurfrules']
  const details = entries.filter((f) => !existsSync(join(root, f)) || !read(f).includes('AGENTS.md')).map((f) => `${f} 未引用 AGENTS.md`)
  report('C02', 'AI 入口文件都指向 AGENTS.md', details.length ? 'FAIL' : 'PASS', details)
}

// C03 no absolute local paths
{
  const re = /(?:\/Users\/[A-Za-z]|\/home\/[a-z]|[A-Z]:\\\\[A-Za-z])/
  const details = []
  for (const f of textFiles) {
    if (f.startsWith('maintainer/')) continue
    read(f).split('\n').forEach((line, i) => { if (re.test(line)) details.push(`${f}:${i + 1}`) })
  }
  report('C03', '不含本机绝对路径', details.length ? 'FAIL' : 'PASS', details)
}

// C04 no credential-looking values
{
  const patterns = [
    /AKIA[0-9A-Z]{16}/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\bsk-[A-Za-z0-9]{20,}/,
    /\b(?:password|passwd|secret|token|api[_-]?key|access[_-]?key)\b\s*[:=]\s*['"]?([^\s'"<>{}()|`]{8,})/i,
  ]
  const placeholder = /x{3,}|\*{3,}|your|example|changeme|placeholder|dummy|fake|\$\{|<|_{3,}|\.\.\./i
  const details = []
  for (const f of textFiles) {
    read(f).split('\n').forEach((line, i) => {
      for (const p of patterns) {
        const m = line.match(p)
        if (m && !placeholder.test(m[1] ?? m[0])) details.push(`${f}:${i + 1}`)
      }
    })
  }
  // Users may write credentials anywhere in their own panel; this is only a heads-up, never a failure.
  report('C04', '疑似凭据提示（不限制）', details.length ? 'WARN' : 'PASS', details)
}

// C05 relative markdown links resolve
{
  const details = []
  for (const f of mdFiles) {
    for (const [n, line] of proseLines(read(f))) {
      if (/<!--/.test(line)) continue
      for (const m of line.matchAll(/\]\(([^)\s]+)\)/g)) {
        const target = m[1]
        if (/^(https?:|mailto:|#)/.test(target) || /[{<]/.test(target)) continue
        const path = decodeURI(target.split('#')[0])
        if (path && !existsSync(resolve(root, dirname(f), path))) details.push(`${f}:${n} → ${target}`)
      }
    }
  }
  report('C05', '相对链接都能解析', details.length ? 'FAIL' : 'PASS', details)
}

// C06 files silently swallowed by the whitelist .gitignore
{
  const allowed = [/node_modules\//, /\/dist\//, /\.DS_Store$/, /^engineering\/workspace\//, /^testing\/[^/]+\/workspace\//, /^maintainer\/validation\/runs\//]
  const ignored = git('ls-files', '--others', '--ignored', '--exclude-standard', '-z').split('\0').filter(Boolean)
    .filter((f) => !allowed.some((re) => re.test(f)))
  report('C06', '没有被白名单 .gitignore 静默忽略的文件', ignored.length ? 'FAIL' : 'PASS',
    ignored.slice(0, 30).concat(ignored.length > 30 ? [`…共 ${ignored.length} 个`] : []))
}

// C07 .gitignore rules that no longer match any path
{
  const details = []
  read('.gitignore').split('\n').forEach((raw, i) => {
    const line = raw.trim()
    if (!line || line.startsWith('#') || /^!?\/[^/]*\/?$/.test(line)) return
    // A rule is stale when the directory it lives in no longer exists (build outputs themselves may be absent).
    const pattern = line.replace(/^!/, '').replace(/^\//, '').replace(/\/$/, '')
    const parent = dirname(pattern)
    const hit = parent === '.' || globSync(parent, { cwd: root }).length > 0
    if (!hit) details.push(`.gitignore:${i + 1} ${line}`)
  })
  report('C07', '.gitignore 没有失效规则', details.length ? 'WARN' : 'PASS', details)
}

// C08 stage order in SOP-07 matches the version stage table
{
  const agents = read('AGENTS.md')
  const order = (agents.match(/\*\*阶段顺序\*\*[：:]\s*(.+)/)?.[1] ?? '').split('→').map((s) => s.trim()).filter(Boolean)
  const verReadme = 'versions/v1.0.0/README.md'
  const section = existsSync(join(root, verReadme)) ? (read(verReadme).split('## 阶段进度')[1] ?? '').split(/\n#|\n\s*\n(?!\|)/)[0] : ''
  const table = [...section.matchAll(/^\|\s*([^|\-][^|]*?)\s*\|/gm)].map((m) => m[1].trim()).filter((s) => s !== '阶段')
  const inner = order.filter((s) => !['规划中', '已发布'].includes(s))
  const details = []
  if (!order.length) details.push('AGENTS.md 未找到「阶段顺序」')
  if (inner.join('|') !== table.join('|')) details.push(`阶段顺序（去掉规划中/已发布）：${inner.join(' → ')}`, `版本阶段表：${table.join(' → ')}`)
  report('C08', '阶段顺序与版本阶段表一致', details.length ? 'FAIL' : 'PASS', details)
}

// C09 test pass rules do not conflict with the test baseline (all cases pass; only the user may waive)
{
  const details = []
  for (const f of mdFiles) {
    if (f.startsWith('maintainer/')) continue
    read(f).split('\n').forEach((line, i) => {
      // Lines that forbid "conditional pass" are the rule itself, not a violation
      const forbids = /❌|不得|禁止|没有|不能|不允许/.test(line)
      if (/条件通过/.test(line) && !forbids) details.push(`${f}:${i + 1} 出现「条件通过」`)
      const belowFull = [...line.matchAll(/[≥>]=?\s*(\d{1,3})\s*%/g)].some((m) => Number(m[1]) < 100)
      if (/通过率|执行率|用例.*(通过|执行)/.test(line) && belowFull) details.push(`${f}:${i + 1} 用例通过率/执行率允许低于 100%`)
    })
  }
  report('C09', '测试放行规则与测试底线一致', details.length ? 'FAIL' : 'PASS', details)
}

// C10 every standards file is listed in standards/README.md
{
  const index = existsSync(join(root, 'standards/README.md')) ? read('standards/README.md') : ''
  const files = tracked.filter((f) => f.startsWith('standards/') && f.endsWith('.md') && f !== 'standards/README.md')
  const details = files.filter((f) => !index.includes(f.replace(/^standards\//, ''))).map((f) => `${f} 未出现在 standards/README.md`)
  report('C10', '规范文件都在规范索引中', details.length ? 'FAIL' : 'PASS', details)
}

// Output
const icon = { PASS: '✅', WARN: '⚠️', FAIL: '❌' }
console.log(`# L1 静态检查报告\n\n- 仓库：${root}\n- 提交：${git('rev-parse', '--short', 'HEAD').trim()}\n- 时间：${new Date().toISOString()}\n`)
console.log('| 检查 | 名称 | 结果 | 问题数 |\n|---|---|---|---|')
for (const r of results) console.log(`| ${r.id} | ${r.title} | ${icon[r.status]} ${r.status} | ${r.details.length} |`)
for (const r of results.filter((r) => r.details.length)) {
  console.log(`\n## ${r.id} ${r.title}\n`)
  for (const d of r.details) console.log(`- ${d}`)
}
process.exitCode = results.some((r) => r.status === 'FAIL') ? 1 : 0
