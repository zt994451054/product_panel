# Commit Message 规范

> **主标准**：[Conventional Commits 1.0.0](https://www.conventionalcommits.org/)
> **副标准**：[Semantic Versioning 2.0.0](https://semver.org/)（版本号与 commit type 的关联）

---

## 为什么需要规范的 Commit Message

1. **自动生成 CHANGELOG**：工具（如 `release-please`、`semantic-release`）可根据 commit 自动生成版本日志
2. **自动语义化版本**：`feat` → 次版本升，`fix` → 修订版升，`BREAKING CHANGE` → 主版本升
3. **可读的 git 历史**：`git log` 一眼看出每次提交的目的
4. **AI 友好**：AI Agent 可以通过 commit 历史理解代码演进

---

## 格式

```
<type>(<scope>): <subject>
<空行>
[body]
<空行>
[footer]
```

- **type**：必填，提交类型（见下表）
- **scope**：可选，影响范围（模块/功能）
- **subject**：必填，简短描述，≤ 50 字符，不加句号
- **body**：可选，详细说明，每行 ≤ 72 字符
- **footer**：可选，关联 Issue、Breaking Change 说明

---

## Type 类型

| type | 含义 | 触发版本升级 |
|------|------|------------|
| `feat` | 新功能 | 次版本号（1.x.0）|
| `fix` | Bug 修复 | 修订号（1.0.x）|
| `docs` | 仅文档变更 | 无 |
| `style` | 代码格式（不影响逻辑，如空格、分号）| 无 |
| `refactor` | 重构（非新增非修复）| 无 |
| `perf` | 性能优化 | 修订号（可选）|
| `test` | 增加或修改测试 | 无 |
| `chore` | 构建流程、工具配置、依赖管理 | 无 |
| `revert` | 回滚某次提交 | 无 |
| `ci` | CI/CD 配置变更 | 无 |
| `build` | 编译/打包相关 | 无 |

---

## 示例

### 简单格式（日常使用）

```
feat(user): 新增用户头像上传功能

fix(order): 修复订单金额精度丢失问题

docs(api): 补充 /v1/orders 接口的错误码说明

refactor(cache): 将缓存读写逻辑提取为独立服务

chore(deps): 升级 go.mod 中 gin 到 v1.9.1
```

### 带 Body 和 Footer

```
feat(order): 支持导出订单 CSV

用户可以在订单列表页选择时间范围并导出 CSV 文件，
单次最多导出 10000 条，超出时提示缩小范围。

Closes #1234
Refs #1198
```

### Breaking Change（触发主版本升级）

```
feat(api)!: 分页参数从 page/pageSize 改为 pageToken/pageSize

BREAKING CHANGE: GET /v1/orders 的分页方式由偏移分页改为游标分页。
之前：?page=2&pageSize=20
之后：?pageToken=eyJpZCI6MTAwfQ&pageSize=20
旧版客户端需更新分页逻辑。
```

> `!` 是 Breaking Change 的简写，等价于在 footer 写 `BREAKING CHANGE:`

---

## 规则

【必须】提交必须有 message，禁止空 message

【必须】subject 不超过 50 字符，使用祈使句（"新增" 而非 "新增了"）

【必须】type 使用小写

【必须】scope 使用小写，可以是模块名或功能名（`user`、`order`、`auth`）

【禁止】subject 末尾加句号

【推荐】body 每行不超过 72 字符，解释"为什么"而非"做了什么"

【推荐】关联的 Issue 在 footer 中注明：`Closes #123`

---

## Commit Message 与语义化版本的关系

```
feat:     → MINOR 版本升级（1.2.0 → 1.3.0）
fix:      → PATCH 版本升级（1.2.0 → 1.2.1）
BREAKING  → MAJOR 版本升级（1.2.0 → 2.0.0）
其他 type → 不触发版本升级
```

---

## 工具推荐

| 工具 | 功能 |
|------|------|
| [commitlint](https://commitlint.js.org/) | 提交前校验 commit message 格式 |
| [release-please](https://github.com/googleapis/release-please) / [changesets](https://github.com/changesets/changesets) | 根据 commit 或变更说明自动生成 CHANGELOG + 版本号（旧工具 `standard-version` 已停止维护） |
| [semantic-release](https://semantic-release.gitbook.io/) | 全自动版本发布（CI 中运行）|
| [commitizen](https://commitizen-tools.github.io/commitizen/) | 交互式生成 commit message |

**配置示例（commitlint + husky）：**

```bash
# 安装
npm install --save-dev @commitlint/cli @commitlint/config-conventional husky

# commitlint.config.js
module.exports = { extends: ['@commitlint/config-conventional'] }

# .husky/commit-msg
npx --no -- commitlint --edit "$1"
```

## Atomic Commit 原则

**一个 commit 只表达一个可解释、可回滚、可验证的语义变化，且在该节点代码可编译、测试可通过。**

"原子"不是"一行一提交"，而是按**逻辑关注点**切分：

```
✅ 正确：三个独立 commit
feat(auth): add RefreshToken domain model
feat(auth): implement token rotation logic
test(auth): add unit tests for token rotation

❌ 错误：一个混合 commit
feat(auth): implement refresh token（功能 + 测试 + 重构全混）
```

遵守原子提交的好处：
- **可回滚**：`git revert` 只撤销一个逻辑变更，不误伤无关代码
- **可定位**：`git bisect` 能精确找到引入 bug 的那个提交
- **可审查**：Reviewer 可以逐个理解每个提交的意图

---

## Agent 提交补充规范

AI Agent 参与开发时，除遵守以上所有规则外，还需满足以下要求。

### Checkpoint Commit 工作流

Agent 执行较长任务时，可在关键节点提交 checkpoint commit，防止进度丢失并保持工作可追溯。checkpoint commit 同样遵守本页的格式（否则会被 commitlint 拦截），在 body 中说明进度即可：

```
feat(auth): complete RefreshToken domain model

checkpoint: domain model only, rotation logic pending
```

**任务完成后**，用 Squash Merge 把 PR 内的零散提交收敛为符合 Atomic Commit 原则的正式提交（见 [合并策略规范](merge-strategy.md)）。

- 不推荐 `git rebase -i`：它是交互式命令，许多 Agent 环境不支持；已推送的提交也不应 rebase
- 本地尚未推送时，需要整理提交可用非交互方式：`git commit --fixup <sha>` 配合 `GIT_SEQUENCE_EDITOR=true git rebase --autosquash <base>`
- 整理目标：每个最终 commit 都有清晰语义，checkpoint 说明不残留在主线历史中

### Agent-Aware Commit Trailers

> 以下 trailer 是推荐的自定义约定，不属于 Conventional Commits 等公开标准，项目可选用。

当 commit 包含 Agent 生成的关键代码时，在 footer 中追加以下 trailer 补充决策上下文：

```
feat(auth): implement JWT refresh token rotation

<正文：变更背景与动机>

Agent-Decision: Used 7-day sliding window to balance security and UX
Agent-Limitation: Redis TTL not yet aligned with token expiry on logout
```

| Trailer | 含义 | 何时填写 |
|---------|------|---------|
| `Agent-Decision` | Agent 做出的非显而易见的关键选择及原因 | 有重要设计决策时 |
| `Agent-Limitation` | 已知局限、未处理边界、待跟进事项 | 有已知不完整之处时 |

两个字段均为可选，但存在决策或局限时**强烈建议填写**——这是 AI 辅助开发下保持代码可追溯性的最低成本方式。

Git trailer 是原生标准格式（`Key: Value`），可用标准命令查询：

```bash
git log --format='%(trailers:key=Agent-Limitation,valueonly)'
```

## Related

- [Git 分支管理规范](git-workflow.md)
- [变更日志规范](../documentation/changelog.md)
- [合并策略规范](merge-strategy.md)
