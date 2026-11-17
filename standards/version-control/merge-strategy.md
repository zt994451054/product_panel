# 合并策略规范

> **主标准**：[Trunk-Based Development](https://trunkbaseddevelopment.com/)
> **副标准**：[Atlassian Git Tutorials - Merging vs Rebasing](https://www.atlassian.com/git/tutorials/merging-vs-rebasing)


> 本页给出合并方式的通用做法。分支模型（GitFlow / GitHub Flow / Trunk-Based）由项目在工程清单中选定，见 [Git 分支管理规范](git-workflow.md)；下文示例用 `main` 表示主线分支、`feat/<topic>` 表示功能分支，实际名称以项目约定为准。

---

## 三种合并方式对比

| 方式 | 历史形状 | 保留提交 | 适用场景 |
|------|---------|---------|---------|
| **Merge Commit** | 非线性（保留分叉）| 完整保留 | 存活较久的分支合并到主干，或需要保留发布节点（GitFlow 的 release 分支） |
| **Squash Merge** | 线性 | 压缩为 1 个 | 功能分支中的零散提交合并到主干 |
| **Rebase** | 线性 | 重写历史 | 本地个人分支同步主干最新代码 |

---

## 各场景使用规范

### 功能分支合并到主干（推荐 Squash Merge）

```
feat/<topic> → main（GitFlow 中为 develop）：Squash Merge

原因：
- 功能分支上可能有 "fix typo"、"wip" 等临时提交，不应污染主干历史
- 压缩后的一个提交等于这个功能的完整描述
- 主干历史保持线性，易于追溯
```

```bash
# GitHub/GitLab：在 PR 界面选择 "Squash and merge"
# 命令行：
git checkout main
git merge --squash feat/<topic>
git commit -m "feat(order): 新增订单批量取消功能 (#234)"
```

### 个人分支同步主干最新代码（使用 Rebase）

```
个人分支（尚未推送）同步 main 最新代码：Rebase

原因：
- 保持提交历史线性，便于 Review
- 避免 merge commit 污染功能分支历史
```

```bash
git checkout feat/<topic>
git rebase main        # 将本地提交重新应用在 main 最新代码之上
```

已经推送过的个人分支，优先改用 `git merge main` 同步；确需 rebase 时，只允许对**只有自己使用的分支**操作，并用 `git push --force-with-lease` 推送（不要用 `--force`），且事先告知可能在该分支上协作的人。

### Release 分支合并到主干（仅 GitFlow 适用，使用 Merge Commit）

```
release/v1.2.3 → main：Merge Commit（保留合并节点）

原因：
- 保留发布时间点的历史节点
- 便于通过 git log 查看发布记录
```

---

## Rebase 使用规范

【必须】**只对本地未推送的提交使用 rebase**，已推送到远程的提交禁止 rebase（会改写历史，破坏他人的工作）；唯一例外是只有自己使用的个人分支，见上文

【必须】Rebase 有冲突时，逐一解决每个提交的冲突，而非一次性全解决

```bash
# 安全使用 rebase 的工作流
git fetch origin
git rebase origin/main      # 同步主干

# 如果有冲突
# 解决冲突...
git add <已解决冲突的文件>   # 显式添加文件，避免误提交无关文件或敏感信息
git rebase --continue       # 继续 rebase

# 放弃 rebase
git rebase --abort
```

【禁止】对以下分支执行 rebase：
- `main`（或 `master`）
- `develop`（GitFlow）
- `release/*`（GitFlow）
- 任何多人协作的公共分支

---

## 冲突解决规范

【必须】解决冲突时，不确定的代码**必须**找对应修改人确认，禁止擅自删除他人代码

【必须】解决冲突后，运行完整测试再合并

**冲突解决流程：**

```
1. 理解冲突双方的意图（自己的改动 vs 他人的改动）
2. 不确定 → 联系对方开发者确认
3. 合并双方修改（保留两者的正确部分）
4. 运行测试验证
5. 在 PR 评论说明如何解决了冲突
```

---

## 主干开发（Trunk-Based Development，可选模型）

Trunk-Based 是可选的分支模型之一，是否采用由项目在 [Git 分支管理规范](git-workflow.md) 的分支策略中选定。采用 GitFlow 等需要存活较久的分支的模型时，下文的“短分支”要求可放宽，但应尽量缩短分支存活时间并频繁同步主干。

**核心理念（来自 TBD）**：所有开发者频繁向主干（trunk/main）提交，分支生命周期不超过 1-2 天，通过特性开关（Feature Flags）控制功能上线。

**优势**：
- 减少合并冲突（分支越短，冲突越少）
- 持续集成效果最好（频繁集成到主干）
- DORA 研究表明：主干开发（或接近主干的短分支）与更高的交付绩效相关

```
主干开发（Short-lived branches）：

day 1：  feat/xxx ─── merge ──→ main
day 2：  feat/yyy ─── merge ──→ main
day 3：  feat/zzz ─── merge ──→ main

vs 长期分支（反模式）：

               feat/big-feature（2 周）
              /                            \
main ────────────────────────────── merge（冲突爆炸）
```

**短分支原则**（采用 Trunk-Based 时）：功能分支存活时间不超过 **2 天**，超过说明功能切片过大，需要拆分。

---

## 合并前检查清单

```
□ 所有 CI 检查通过（静态检查、单测、集成测试）
□ 至少 1 名 Reviewer 批准（参见 Code Review 规范）
□ 所有 Review 评论已解决（blocking 类型）
□ 与主干最新代码已同步（无冲突或冲突已解决）
□ PR 描述清晰，包含测试说明
□ 敏感信息（密钥、密码）未提交
□ 如有数据库变更，迁移脚本已准备
```

## Related

- [Git 分支管理规范](git-workflow.md)
- [Code Review 规范](code-review.md)
- [CI/CD 流水线规范](../deployment/ci-cd.md)
