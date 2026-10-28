# L1 静态检查报告

- 仓库：<repo>
- 提交：d7dadf7
- 时间：2026-10-28T11:45:58.852Z

| 检查 | 名称 | 结果 | 问题数 |
|---|---|---|---|
| C01 | SOP 引用都有标题定义 | ❌ FAIL | 6 |
| C02 | AI 入口文件都指向 AGENTS.md | ✅ PASS | 0 |
| C03 | 不含本机绝对路径 | ✅ PASS | 0 |
| C04 | 不含疑似凭据 | ✅ PASS | 0 |
| C05 | 相对链接都能解析 | ✅ PASS | 0 |
| C06 | 没有被白名单 .gitignore 静默忽略的文件 | ✅ PASS | 0 |
| C07 | .gitignore 没有失效规则 | ⚠️ WARN | 2 |
| C08 | 阶段顺序与版本阶段表一致 | ✅ PASS | 0 |
| C09 | 测试放行规则与测试底线一致 | ❌ FAIL | 12 |
| C10 | 规范文件都在规范索引中 | ❌ FAIL | 1 |

## C01 SOP 引用都有标题定义

- SOP-07 被引用 20 次但没有标题定义，例如 AGENTS.md:110, AGENTS.md:171, AGENTS.md:173
- SOP-02 被引用 12 次但没有标题定义，例如 AGENTS.md:155, AGENTS.md:172, AGENTS.md:174
- SOP-04 被引用 5 次但没有标题定义，例如 AGENTS.md:298, AGENTS.md:372, AGENTS.md:395
- SOP-06 被引用 3 次但没有标题定义，例如 AGENTS.md:920, SETUP.md:457, versions/README.md:16
- SOP-05 被引用 2 次但没有标题定义，例如 engineering/docs/local-env.md:96, engineering/docs/local-env.md:314
- SOP-03 被引用 3 次但没有标题定义，例如 versions/v1.0.0/product/design-spec.md:43, versions/v1.0.0/product/requirements.md:74, versions/v1.0.0/product/requirements.md:190

## C07 .gitignore 没有失效规则

- .gitignore:32 versions/*/product/prototypes/workspace/*
- .gitignore:33 !versions/*/product/prototypes/workspace/.gitkeep

## C09 测试放行规则与测试底线一致

- AGENTS.md:510 出现「条件通过」
- AGENTS.md:672 出现「条件通过」
- versions/v1.0.0/engineering/release.md:13 出现「条件通过」
- versions/v1.0.0/testing/acceptance.md:131 出现「条件通过」
- versions/v1.0.0/testing/test-plan.md:187 用例通过率/执行率允许低于 100%
- versions/v1.0.0/testing/test-plan.md:188 用例通过率/执行率允许低于 100%
- versions/v1.0.0/testing/test-report.md:27 用例通过率/执行率允许低于 100%
- versions/v1.0.0/testing/test-report.md:28 用例通过率/执行率允许低于 100%
- versions/v1.0.0/testing/test-report.md:103 用例通过率/执行率允许低于 100%
- versions/v1.0.0/testing/test-report.md:104 用例通过率/执行率允许低于 100%
- versions/v1.0.0/testing/test-report.md:114 出现「条件通过」
- versions/v1.0.0/testing/test-report.md:121 出现「条件通过」

## C10 规范文件都在规范索引中

- standards/design/README.md 未出现在 standards/README.md
