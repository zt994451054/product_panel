# L1 静态检查报告

- 仓库：<repo>
- 提交：d68781d
- 时间：2026-11-02T16:19:44.187Z

| 检查 | 名称 | 结果 | 问题数 |
|---|---|---|---|
| C01 | SOP 引用都有标题定义 | ✅ PASS | 0 |
| C02 | AI 入口文件都指向 AGENTS.md | ✅ PASS | 0 |
| C03 | 不含本机绝对路径 | ✅ PASS | 0 |
| C04 | 疑似凭据提示（不限制） | ✅ PASS | 0 |
| C05 | 相对链接都能解析 | ✅ PASS | 0 |
| C06 | 没有被白名单 .gitignore 静默忽略的文件 | ✅ PASS | 0 |
| C07 | .gitignore 没有失效规则 | ✅ PASS | 0 |
| C08 | 阶段顺序与版本阶段表一致 | ✅ PASS | 0 |
| C09 | 测试放行规则与测试底线一致 | ✅ PASS | 0 |
| C10 | 规范文件都在规范索引中 | ❌ FAIL | 1 |

## C10 规范文件都在规范索引中

- standards/design/README.md 未出现在 standards/README.md
