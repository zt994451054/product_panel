# Git 分支、版本管理规范

> **主标准**：[Semantic Versioning 2.0.0](https://semver.org/)（版本号）
> **副标准**：[GitHub Docs - About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)（分支保护）、[Conventional Commits 1.0.0](https://www.conventionalcommits.org/)（提交信息，详见 [Commit Message 规范](commit-convention.md)）

本页分四部分：版本号、分支策略（骨架，由项目填写）、分支保护（含 AI Agent 规则）、合并规范。

---

## 版本号规范

版本号遵循 SemVer 三段式：`v{主版本号}.{次版本号}.{修订号}`（`vX.Y.Z`）。面板的版本目录 `versions/vX.Y.Z` 和 git tag 使用同一写法。

| 位置 | 说明 | 升级时机 |
|------|------|---------|
| 主版本号 | 不兼容的变更，或重大架构、大规模功能变动 | v1.x.x → v2.0.0 |
| 次版本号 | 向下兼容的功能新增 | v1.2.x → v1.3.0 |
| 修订号 | 向下兼容的缺陷修复；热修复（SOP-11）升修订号 | v1.2.4 → v1.2.5 |

升级规则与 commit type 的对应关系见 [变更日志规范](../documentation/changelog.md) 和 [Commit Message 规范](commit-convention.md)。

---

## 分支策略（骨架，由项目填写）

分支模型因团队规模和发布方式差异很大，本规范不写死。项目在选定后，把结果填入 `engineering/README.md` 工程清单的「分支策略」列（一个仓库一行）；AI 开发时（SOP-05）从这里读取分支策略，按它创建分支、提交和 push。

### 可选的分支模型

| 模型 | 特点 | 适用 |
|------|------|------|
| **GitFlow** | `main` + `develop` + `feature/*` + `release/*` + `hotfix/*`，发布节奏明确 | 有明确发布周期、需要同时维护多个版本 |
| **GitHub Flow** | 只有 `main` + 短期功能分支，合并即可发布 | 持续交付、小团队 |
| **Trunk-Based** | 所有人频繁向 `main` 合并，分支存活不超过 1-2 天，用特性开关控制上线 | 持续集成成熟度高、测试自动化好（见 [合并策略规范](merge-strategy.md)） |

### 分支策略登记项

选定模型后，至少明确以下几项（填在工程清单，或其链接的工程仓库 README 中）：

```
模型：<GitFlow / GitHub Flow / Trunk-Based / 其他>
长期分支：<名称与用途，如 main>
临时分支命名：<功能分支、修复分支、热修复分支的命名规则>
受保护分支：<哪些分支开启保护，见下文「分支保护」>
合并方式：<Merge Commit / Squash / Rebase，见合并策略规范>
```

### 默认示例（示例，非强制）

以下是一个 GitFlow 风格的示例，项目未另行定义时可作为起点，按需修改：

```
main        ← 稳定主线，保护分支，禁止直接 push
develop     ← 集成分支，所有功能合入此分支
feat/*      ← 功能分支，命名：feat/{version}-{brief}
hotfix/*    ← 热修复分支，命名：hotfix/{version}-{brief}
release/*   ← 发布分支，命名：release/{version}
```

命名示例：`feat/v1.0.0-phone-verify`、`hotfix/v1.0.1-login-crash`、`release/v1.0.0`。

命名注意：

- 分支名用 `-` 连接各部分，不要同时使用 `feat/foo` 和 `feat/foo/bar`：git 的分支引用按路径存储，同名前缀的分支不能共存
- 分支与环境（开发、测试、生产）的对应关系由部署流程决定，不在本页规定

---

## Branch Protection 配置

长期分支（示例中的 `main`、`develop`、`release/*`，以所选分支模型为准）必须开启分支保护，以下为必须启用的规则：

| 规则 | 说明 |
|------|------|
| Require pull request before merging | 禁止直接 push，所有变更必须通过 PR 合并 |
| Require at least 1 human approval | 至少 1 名人工审查者批准后才能合并；单人项目可由使用者本人确认 |
| Require status checks to pass | 已配置 CI 时，CI 检查（静态分析、单测）全部通过才能合并 |
| Restrict who can push to matching branches | 仅限指定角色（通常为 Tech Lead）可绕过规则 |

**【禁止】任何 AI Agent 不得直接 push 到受保护分支。** Agent 执行任务只能在个人/功能分支上操作，通过开 PR 的方式合并，merge 必须由人工触发。

> 这条规则需要在 Agent 的系统提示（CLAUDE.md / AGENTS.md）中显式声明，否则工具链可能尝试直接 push。

---

## 合并规范

【必须】功能开发完整且充分自测后，才能提交合并申请

【必须】合并冲突时，不确定的代码段必须找对应修改人确认，禁止擅自合并冲突

【必须】涉及接口变更时，合并前接口代码须开发完整并充分自测

## Related

- [Commit Message 规范](commit-convention.md)
- [合并策略规范](merge-strategy.md)
- [Code Review 规范](code-review.md)
- [变更日志规范](../documentation/changelog.md)
