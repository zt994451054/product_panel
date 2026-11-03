# 合并上游模板

> 基于本模板的项目（下游）把模板的新改动合并进来时读本页。前半部分是步骤和核对清单，后半部分是模板每次改动的说明和迁移方法。

---

## 步骤

1. **先读下方「模板改动记录」**，找出自上次合并以来的条目，尤其是标了「破坏性」的
2. **在独立分支上合并**：从最新的远端主线切分支，再合并上游。不在日常工作区直接合并
3. **逐个解决冲突，不整文件取一边**。不要对整个文件用 `ours` / `theirs`，那会静默丢掉另一边的改动
   - `AGENTS.md`：保留下游填写的 §1 产品信息和下游自有 SOP 索引，其余以上游为准，再补回下游自己加的规则
   - `agents/sop/`：上游的 SOP 文件以上游为准；下游改过的上游 SOP，把改动记成下游 RULE 后重新应用
   - `SETUP.md`：保留下游的配置状态（状态、记录两列），表头和卡片以上游为准
   - `standards/`：下游改过的规范保留下游版本，`standards/README.md` 中状态为「已定制」的不覆盖
   - `versions/`、`foundation/`、`engineering/docs/` 中下游已填写的内容：保留下游
4. **按「核对清单」逐项检查**
5. **在 [rules-log.md](./rules-log.md) 记一条**：合并了哪些上游改动、下游做了哪些取舍

## 核对清单

| 检查 | 怎么查 | 通过标准 |
|------|--------|---------|
| SOP 编号不重复 | `ls agents/sop/ \| cut -d- -f1-2 \| sort \| uniq -d` | 无输出 |
| 下游 SOP 在下游号段 | 看下游新增的 SOP 文件名 | 编号不小于 50 |
| SOP 索引与文件一致 | 对比 AGENTS.md §5 两张索引表与 `agents/sop/` 文件列表 | 一一对应 |
| 引用的 SOP 都存在 | `grep -rhoE "SOP-[0-9]{2}(\.[0-9]+)?" --include=*.md . \| sort -u`，逐个确认有文件 | 都有 |
| 下游自有内容没丢 | 对比合并前后的下游自有 SOP、规则、RULE 记录 | 都还在 |
| 相对链接有效 | 打开改动过的文件，检查链接目标 | 无断链 |
| 新文件没被忽略 | `git status --ignored`，对新增的顶层文件或目录运行 `git check-ignore -v <路径>` | 应入库的没有被忽略 |

保留了 `maintainer/` 目录的项目，可以直接运行 `node maintainer/validation/check.mjs` 做上面大部分检查。

---

## 模板改动记录

按时间倒序。每条写明改了什么、是否破坏性、下游怎么迁移。

### 2026-11 结构与协作（P2）

**破坏性：AGENTS.md 拆分**
- AGENTS.md 只保留入口（§0–§7 和 SOP 索引），各 SOP 移到 `agents/sop/SOP-{编号}-{英文短名}.md`
- 原 §4.1、§4.2 移到 `agents/baselines.md`，原「§4.2」的引用改为指向该文件
- **迁移**：下游自己改过的 SOP 正文，在新文件里重新应用；下游自有 SOP 改为 50 号起的编号，放进 `agents/sop/`，在 AGENTS.md §5「下游自有 SOP」表登记，全文同步改引用

**新增**
- `agents/README.md`（收录规则）、`communication.md`（表达规范）、`collaboration.md`（子 agent、外部系统写操作、无人值守、交接、分支）、`rules-log.md`（下游规则变更记录）、本文件
- AGENTS.md §5.1 表达规范核心、§5.2 协作触发条件，§7 新增协作与外部系统禁止项
- `versions/CURRENT.md`「在研 / 搁置版本」表；版本状态增加「挂起」「放弃」；新版本立项先在主线占号（SOP-06）
- `foundation/product/research/`：未立项的调研记录，从需求池条目链接
- SOP-10 不再依赖外部 rclone skill，直接按 `OSS.md` 操作

### 2026-11 上手与规范层（P1）

**破坏性：规范层目录重构**
- 去掉外部 `product_spec` skill 依赖；`standards/` 改为 10 个领域，带通用默认内容，导航见 `standards/README.md`
- 旧文件对照：

| 旧路径 | 新路径 |
|--------|--------|
| `standards/engineering/standards.md` | `standards/version-control/`（分支、提交、评审、合并） |
| `standards/engineering/frontend.md` | `standards/coding/frontend/`、`standards/coding/languages/javascript-typescript.md` |
| `standards/engineering/backend.md` | `standards/architecture/api-design.md`、`database-design.md` |
| `standards/testing/standards.md` | `standards/testing/testing-strategy.md`、`test-case-design.md` |
| `standards/operations/standards.md` | `standards/deployment/`；本项目实际做法写 `engineering/docs/ops-profile.md` |
| `standards/product/standards.md` | `standards/product/business-rules.md` |

- **迁移**：把下游旧规范中的定制内容并入对应新文件，并在 `standards/README.md` 把状态改为「已定制」

**破坏性：初始化改为配置清单**
- `SETUP.md` 改为配置状态表加卡片；AGENTS.md §0 不再检查 5 个哨兵，只读状态表，只有 L0 阻断
- **迁移**：已初始化的下游，按实际情况把状态表各项填为已确认、不适用或暂不填，「记录」列写「迁移时补记」和日期

**新增**
- SOP-09.5 只读探索与回填；`materials/` 物料区（文件不入库，只留清单）
- `engineering/docs/ops-profile.md` 运维与发布画像；`environments.md`「与生产不等价清单」
- 凭据不再限制，可以写在面板任何文档

### 2026-11 地基与测试流程（P0）

**破坏性：新增「测试设计」阶段**
- 阶段顺序变为 `规划中 → 需求分析 → 产品设计 → 技术方案 → 测试设计 → 开发中 → 测试 → 发布 → 已发布`
- **迁移**：在途版本的 `README.md` 阶段表、`versions/README.md` 进度矩阵加「测试设计」行或列；已在开发中的版本补登记测试计划和用例的状态

**新增**
- 测试底线：全部用例执行并通过才放行，只有使用者能逐条豁免，没有「条件通过」
- 原型基准与设计验收点、核心实现路径验证、阶段签收列
- `.gitignore` 白名单自检要求
