# agents/ — AI 操作面板的规则

这里放的是 AI 操作本面板的规则：每类工作的流程（SOP）、协作纪律、表达规范，以及面板规则本身的演进记录。**不是 AI 角色定义**，本面板不设多个 AI 角色。

入口是根目录的 [AGENTS.md](../AGENTS.md)：它每次对话必读，里面有 SOP 索引；本目录的文件按需读取。

## 目录

| 文件 | 什么时候读 |
|------|-----------|
| [sop/](./sop/) | 按 AGENTS.md §5 索引找到对应 SOP 后读 |
| [baselines.md](./baselines.md) | 写技术方案或需求、发布时合并基线、热修复：版本内文档与基线文档的优先级 |
| [communication.md](./communication.md) | 对使用者表达的完整写法和示例（核心 5 条已在 AGENTS.md §5.1） |
| [collaboration.md](./collaboration.md) | 派子 agent、写外部系统、无人值守、交接、面板仓库的分支与提交 |
| [rules-log.md](./rules-log.md) | 修改 AGENTS.md 或本目录后记一条；想知道某条规则为什么存在时查 |
| [upgrade.md](./upgrade.md) | 合并上游模板的新版本时 |

## 收录规则

**收**：约束 AI 怎么操作面板的内容，包括流程、协作纪律、表达规范、模板，以及面板规则自身的变更记录。

**不收**：

| 内容 | 放哪里 |
|------|--------|
| 产品知识和版本文档 | `foundation/`、`versions/` |
| 产品怎么做的规范（编码、测试、安全……） | `standards/` |
| 配置状态和配置引导 | `SETUP.md` |
| 研发、测试工程的环境和画像 | `engineering/`、`testing/` |
| 模板自身的验证工具 | `maintainer/` |

拿不准时先问：这条内容换一个产品还成立吗？是约束 AI 操作面板的吗？两个都是才放这里。

## 编号

- 编号 00 到 49 属于上游模板，50 起留给下游项目自用
- 文件名：`SOP-{编号}-{英文短名}.md`，标题写在文件第一行 `# SOP-{编号} {中文名}`
- 编号不能重复。新增 SOP 后在 AGENTS.md §5 索引登记，并在 [rules-log.md](./rules-log.md) 记一条
