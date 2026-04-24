# {产品名} — AI 操作规约

> 本文件是所有 AI coding agent 的主入口，是唯一的内容维护源。
> CLAUDE.md / .cursorrules / .windsurfrules 均引用本文件，不单独维护内容。

---

## §0 初始化状态检查（每次新对话，最先执行）

> ⚠️ 本节必须在 §3 状态速查之前执行。项目未完成初始化时，禁止进入任何日常工作。

### 检查步骤

依次读取以下 5 个哨兵字段，判断项目是否已完成初始化：

| # | 检查文件 | 检查字段 | 未初始化特征 |
|---|---------|---------|------------|
| 1 | `AGENTS.md §1` + 第 1 行标题 + `README.md` 第 1 行标题 | 产品名称 | `AGENTS.md §1` 产品名称仍为 `{产品名}`，**或** `AGENTS.md` 第 1 行标题仍含 `{产品名}`，**或** `README.md` 第 1 行标题仍含 `{产品名称}`——三处任一未替换即视为未初始化 |
| 2 | `versions/CURRENT.md` | 进入时间 | 仍为 `<!-- YYYY-MM-DD -->` |
| 3 | `OSS.md` | CDN 访问域名 | 仍为注释占位符（**产品无文件上传需求时，填「不使用」即可通过此项**）|
| 4 | `foundation/market/market-research.md` | 市场概况节 | 核心内容均为 `<!-- -->` 注释，无实际数据 |
| 5 | `standards/design/DESIGN.md` | Primary Color 色值 | 仍为 `#______` 占位符 |

### 判断规则

```
任意一项未通过 → 项目未初始化 → 执行「未初始化处理流程」
全部通过       → 项目已初始化 → 正常继续执行 §3 状态速查
```

### 未初始化处理流程

1. **告知用户检查结果**，明确列出哪些项未通过，例如：
   > 「初始化检查未通过，以下关键信息尚未填写：
   > ① 产品名称仍为占位符（AGENTS.md §1）
   > ② CDN 访问域名未配置（OSS.md）
   > 在完成初始化之前，无法进行日常工作。」

2. **引导用户完成初始化**：
   - 全新产品 → 阅读 `SETUP.md` 路径一，执行 SOP-08
   - 已有产品迁移 → 阅读 `SETUP.md` 路径二，执行 SOP-09

3. **强制阻断**：除 SOP-08 和 SOP-09 外，拒绝执行任何其他 SOP 或落档操作。
   > ❌ 「当前无法执行此操作，项目初始化未完成。请先完成 SETUP.md 中的初始化步骤。」

### 示例：初始化未完成时收到日常工作指令

> 用户说：「帮我写 v1.0.0 的需求文档」
>
> AI 正确行为：
> ① 执行初始化检查 → 发现 AGENTS.md §1 产品名称仍为 `{产品名}`
> ② 拒绝执行，告知：
>    「初始化检查未通过：产品名称尚未填写（仍为占位符）。
>     请先完成项目初始化，再开始日常工作。
>     全新产品请阅读 SETUP.md → 路径一；已有产品迁移请阅读 SETUP.md → 路径二。」
>
> ❌ 错误行为：忽略检查，直接开始写需求文档

---

## §1 项目简介

**产品名称**：{产品名}
**产品定位**：{一句话：面向谁、解决什么问题}
**当前阶段**：活跃开发中

<!-- 示例（填写后删除此注释）：
产品名称: 牛马 HR
产品定位: 面向中小企业 HR 的智能排班与考勤管理工具，替代 Excel 手工操作
当前阶段: 活跃开发中
-->

---

## §2 阅读本文件的说明

本文件是本项目所有 AI coding agent 的操作唯一权威来源。

- CLAUDE.md / .cursorrules / .windsurfrules 均以本文件为准，不单独维护内容
- **每次新对话，执行顺序必须是：§0 初始化检查 → §3 状态速查 → 执行对应 SOP**
- §0 检查未通过时，禁止执行任何日常工作，必须先完成初始化
- **即使你认为已了解项目情况，每次新对话开始时仍必须重新执行 §0 和 §3，不得跳过**
- 遇到本文件未覆盖的情况，执行 §7 的不确定处理流程
- 禁止在未读本文件的情况下对项目进行任何文档落档或代码操作

---

## §3 当前项目状态速查（每次新对话必执行）

按顺序读取以下文件，建立当前状态认知后方可执行任何操作：

**Step 0（验证）** → 读取 `versions/CURRENT.md`，提取「主线开发版本」的版本号，验证 `versions/{版本号}/` 目录是否存在
- 目录存在 → 继续执行 Step 1
- 目录不存在 → 停止操作，告知用户：
  > 「CURRENT.md 指向的版本目录 versions/{版本号}/ 不存在，请修复或创建对应版本目录。」

**Step 1** → 读取 `versions/CURRENT.md`
提取：主线开发版本号、当前阶段、负责人；
同时检查热修复版本 / 待发布版本是否有活跃条目（非「—」）并在摘要中注明。

**Step 2** → 读取 `versions/{当前版本}/README.md`
提取：版本目标、各阶段状态（✅/🔄/⏳）、当前阶段进展说明

**Step 2.5（停滞检测）** → 在 Step 2 读取的阶段进度表中，找到状态为 🔄 进行中 的阶段：
- 读取该阶段的「开始时间」字段（格式 YYYY-MM-DD）
- 计算从开始时间到今日的天数差
- 若天数差 **≥ 14 天**，在状态摘要中追加停滞预警：
  > ⚠️ 「{阶段名}」阶段已持续 {N} 天（开始：{日期}），超过 14 天基准，建议确认进展是否正常。
- 若「开始时间」仍为 `-`（未填写），提示：
  > ⚠️ 「{阶段名}」阶段开始时间未记录，请补填（见 SOP-07 时间戳要求）。

**Step 3** → 读取 `versions/{当前版本}/CHANGES.md`
提取：最近变更记录、待处理事项（[ ] 未勾选的影响项）

### 示例：读取后 AI 应能输出以下状态摘要

> 【当前项目状态】
> 主线版本：v1.1.0 | 阶段：开发中（已进入 2026-04-10，持续 14 天）
> 热修复：v1.0.1（修复 BUG-003，发布中）| 生产：v1.0.0
> 负责人：产品 @张三 / 研发 @李四 / 测试 @王五
> 进度：需求 ✅ 设计 ✅ 技术方案 ✅ 开发 🔄（前端 80% / 后端 60%）测试 ⏳ 发布 ⏳
> 待处理变更：CHANGE-002 中测试用例尚未补充（@王五，截止 04-17）
> ⚠️ 「开发中」阶段已持续 14 天（开始：2026-04-10），建议确认进展是否正常。

---

## §4 规范加载顺序

产品级规范优先于组织级规范。

- 本项目 `standards/` 有明确定义的条目 → 以产品级为准
- 本项目 `standards/` 未覆盖的条目 → 通过 `product_spec` skill 加载组织级规范
- `product_spec` skill 未安装或无匹配规范 → 按行业最佳实践执行，并告知用户

skill 未安装时不自行尝试安装，告知用户后继续执行任务。

### 示例：规范冲突时的处理

> 场景：组织级规范要求分支命名为 `feature/xxx`，
>       产品级 `standards/engineering/standards.md` 定义为 `feat/xxx`
>
> 正确行为：以产品级为准，使用 `feat/xxx`
> 错误行为：两个都遵守，或询问用户选哪个

---

## §4.1 文档优先级规则

当 `versions/{ver}/engineering/` 版本内文档与 `foundation/tech-arch/` 基线文档存在描述差异时：

**版本内文档 > foundation/ 基线文档**

| 场景 | 以哪个为准 | 需要做什么 |
|------|-----------|----------|
| 版本技术方案与基线架构有差异 | 以版本内 tech-solution.md 为准 | 同步更新 foundation/tech-arch/（见 SOP-02）|
| 版本需求与产品架构全貌有差异 | 以版本内 requirements.md 为准 | 同步更新 foundation/product-arch/（见 SOP-01）|
| 两者描述一致 | 无冲突，直接使用 | — |

> **核心原则**：foundation/ 基线代表「当前最新全貌」，版本内文档代表「本版本的最新决策」。
> 版本内有变更时，基线应被及时更新，不允许长期存在矛盾状态。

---

## §4.2 全量基线 vs 版本增量

跨版本长期存在的「全量基线」与当前版本内的「版本增量」各司其职。
**写**时写增量，**读**时读基线，**发布**时合并回基线。

| 层级 | 文档 | 性质 | 何时更新 |
|------|------|------|---------|
| 基线 | `engineering/docs/api-docs/openapi.yaml` | 全量已发布接口 | 版本发布后合入（SOP-07）|
| 版本 | `versions/{ver}/engineering/api-design.md` | 本版本接口设计稿/增量 | 技术方案阶段（SOP-02）|
| 基线 | `engineering/docs/db-schema/full-schema.md` | 全量表结构 | 版本发布后合入（SOP-07）|
| 版本 | `versions/{ver}/engineering/db-design.md` | 本版本增量 DDL | 技术方案阶段（SOP-02）|
| 基线 | `foundation/product-arch/overview.md` 模块详情 | 全量已上线功能 | 版本发布后合入（SOP-07）|
| 版本 | `versions/{ver}/product/requirements.md` | 本版本需求 | 需求分析阶段（SOP-01）|
| 基线 | `engineering/docs/local-env.md` §3 基础设施依赖矩阵 | 全量基础设施依赖声明 | **技术方案阶段（SOP-02）同步**，不等发布 |
| 版本 | `versions/{ver}/engineering/tech-solution.md` 配置变更需求 | 本版本新引入的依赖 | 技术方案阶段（SOP-02）|

**核心原则**：
- **技术方案 / 需求分析阶段**：读基线（了解现状），在版本内文档写增量（本版本变更）
- **SOP-07 推进到「已发布」阶段**：把版本内增量合入对应基线，保持基线始终反映生产现状
- **基础设施依赖是例外**：引入新依赖要让开发者马上能配 `.env`，故在技术方案阶段就同步到 `local-env.md` §3，不等发布
- **hotfix（SOP-11）**：发布后同样须按本节规约合入基线；同时更新发现版本 `defects.md` 中缺陷的「修复版本」字段
- 基线之间描述冲突 → 停止，告知用户，不自行裁量

**C 分层补充**：单工程内部细节（目录结构 / 启动方式 / 依赖版本）不入驱动面板基线，
跟随工程仓库 README 走。驱动面板 `engineering/README.md` 工程清单表
通过「详细说明」列链接到工程仓库 README。

**已有产品首次迁移**：以上三个基线文档初次填充见 SOP-09 阶段 3.5「归档存量基线」。

---

## §5 标准操作流程（SOP）

### SOP-00 收到任何指令前的必做准备（不可跳过）

**触发**：收到任何与本项目相关的指令

1. 执行 §3 状态速查（读 CURRENT.md → 版本 README → CHANGES.md）
2. 判断本次指令属于哪类工作，找到对应 SOP
3. 检查 `standards/` 中与本次工作相关的产品级规范
4. 执行对应 SOP

**示例**：
> 用户说：「帮我写 v1.0.0 的技术方案」
>
> AI 正确行为：
> Step 1 → 读 CURRENT.md：当前版本 v1.0.0，阶段：技术方案设计中
> Step 2 → 本次工作属于技术方案类 → 对应 SOP-02
> Step 3 → 读 standards/engineering/standards.md + backend.md
> Step 4 → 执行 SOP-02

---

### SOP-00.5 需求池管理（Backlog）

**触发**：用户提出新需求点，或要求评审/规划需求

**需求池文件**：`foundation/product/backlog.md`

**三类操作：**

**① 新增需求（人提出，AI 整理）**

1. 在 `foundation/product/backlog.md` 的「需求池」表追加一行
2. 分配编号：REQ-{已有最大序号+1}
3. 填写：需求标题、需求描述（AI 可帮助整理措辞，但内容来自用户输入）
4. 状态默认填「待评审」，优先级和纳入版本留空

**② 评审更新（人决策，AI 记录）**

1. 已确认 / 已拒绝 / 已推迟 — 由用户告知，AI 更新状态列
2. 已拒绝 / 已推迟 → 同步将该行移入「已拒绝/已推迟需求（归档）」表，并记录原因

**③ 纳入版本（启动新版本时执行，见 SOP-01 步骤 2）**

1. 从「已确认」需求中，将选定需求的「纳入版本」填写版本号
2. 状态改为「已纳入版本」
3. 触发 SOP-01 展开详细需求文档

**完成标志**：backlog.md 已更新，状态与用户决策一致

---

### SOP-01 需求文档 / 产品设计类工作

**触发**：被要求撰写或修改需求文档、产品设计文档、原型说明

**步骤：**
1. **如是从需求池纳入新需求**（启动版本或中途补充）：
   - 读取 `foundation/product/backlog.md`，找到目标需求点（状态为「已确认」）
   - 更新 backlog.md：「纳入版本」填当前版本号，状态改为「已纳入版本」（SOP-00.5）
2. 在 `versions/{当前版本}/product/requirements.md` 下创建或补充功能模块（将 backlog 需求点展开为完整需求）
3. 如是需求变更 → 先执行 SOP-04 记录变更，再修改文档
4. 如涉及产品架构调整 → 同步更新 `foundation/product-arch/` + changelog.md
5. 更新 `versions/{当前版本}/README.md` 阶段进度（如阶段推进）

**完成标志**：文档已落档，进度已同步，变更已记录（如有）

**示例：新增需求**
> 用户说：「v1.0.0 新增消息通知功能，支持站内信和邮件两种方式」
>
> AI 正确行为：
> ① 打开 versions/v1.0.0/product/requirements.md
> ② 在「功能清单总览」表追加完整行（5列）：
>    | 消息通知 | 支持站内信和邮件两种通知方式 | P1 | 普通用户/管理员 | 草稿 |
> ③ 在「功能需求详情」区新增「消息通知」模块章节，补充业务规则和验收标准
> ④ 检查 foundation/product-arch/overview.md 是否需要同步新增「消息模块」
> ⑤ 版本进度无变化，不更新 README.md

**示例：需求变更（版本已在开发中）**
> 用户说：「v1.0.0 的注册流程要改，去掉邮箱验证，改成手机号验证」
>
> AI 正确行为：
> ① 先在 versions/v1.0.0/CHANGES.md 追加（不先改文档）：
>    ## CHANGE-001 | 2026-04-18 | 需求变更
>    变更内容：注册流程由邮箱验证改为手机号验证
>    影响范围：
>    - [ ] 产品方案 → requirements.md 注册流程章节
>    - [ ] 技术方案 → tech-solution.md 认证模块
>    - [ ] 接口设计 → api-design.md（需新增手机验证接口）
>    - [ ] 测试用例 → testing/test-cases.md 注册相关用例需更新
> ② 再修改 requirements.md 对应章节
> ③ 在 CHANGES.md 将产品方案影响项打 [x]
> ④ 其余影响项保留 [ ] 等待各域负责人处理

**示例：需求状态为「草稿」时的正确处理**
> 用户说：「帮我给注册功能写技术方案」
>
> AI 正确行为：
> ① 先读 versions/v1.0.0/product/requirements.md
> ② 检查「注册流程」模块的「需求状态」列 → 发现状态为「草稿」
> ③ 停止操作，告知用户：
>    「注册功能的需求状态为草稿，尚未确认。若现在推进技术方案，
>     一旦需求变更将导致方案废弃浪费。请先将需求确认后再推进。」
>
> ❌ 错误行为：忽略草稿状态，直接开始写技术方案

**示例：编写产品设计文档**
> 用户说：「v1.0.0 需求已确认，帮我写产品设计文档」
>
> AI 正确行为：
> ① 先读 standards/design/DESIGN.md（视觉规范基线，不可跳过）
> ② 读取 versions/v1.0.0/product/requirements.md 中已确认功能模块的验收标准
> ③ 打开 versions/v1.0.0/product/design-spec.md
> ④ 在「全局交互规范」节定义通用行为（加载/错误/空状态/操作反馈规则）
> ⑤ 为每个「已确认」功能模块编写用户流程和补充交互规则
> ⑥ 执行 SOP-07：更新 versions/v1.0.0/README.md 产品设计阶段状态改为 🔄

---

**触发**：被要求撰写或修改技术方案、接口设计、数据库设计、发布流程

**步骤：**
1. 读取 `foundation/tech-arch/overview.md` 了解技术架构基线
2. 读取 `standards/engineering/` 确认研发规范约束
3. 在 `versions/{当前版本}/engineering/` 下创建或修改对应文档
4. 如是变更导致 → 先执行 SOP-04 记录变更，再修改文档
5. 如涉及技术架构基线调整 → 同步更新 `foundation/tech-arch/` + changelog.md + decisions/ADR
   **ADR 触发判断**（符合任一条 → 必须创建 ADR；否则只更新 overview.md 即可）：
   - 技术选型类：引入新框架/语言/中间件，或替换现有选型（如 Redis Pub/Sub → Kafka）
   - 重大设计决策：影响多个服务的架构边界、数据所有权、通信协议变更
   - 不可逆或高成本变更：破坏性 API 版本、存储格式变更、不可回滚的基础设施变更
   ❌ **不需要 ADR**：接口字段调整、DB 增量 DDL、性能优化、Bug 修复类的架构小调整
6. 接口设计稿落档到 `versions/{ver}/engineering/api-design.md`（版本内设计稿）
   已发布的正式接口文档更新至 `engineering/docs/api-docs/openapi.yaml`
7. **如本版本引入新的基础设施依赖**（如原来不用 Kafka，本版本要引入）→ 同步更新 `engineering/docs/local-env.md` §3 基础设施依赖矩阵（**本项在技术方案阶段即同步，不能等到发布**，因为开发者要据此配 `.env`）
8. 更新版本进度（如阶段推进）

**完成标志**：方案文档已落档，基线已同步（如有），变更已记录（如有）

**示例：接口设计稿 vs 正式文档**
> 设计阶段 → 落档到 versions/v1.0.0/engineering/api-design.md（设计稿）
> 发布之后 → 更新 engineering/docs/api-docs/openapi.yaml（正式文档）
> 两者不可混淆

**示例：技术方案涉及架构变更**
> 用户说：「v1.1.0 要引入 Kafka 替代 Redis Pub/Sub」
>
> AI 正确行为：
> ① 先执行 SOP-04 在 CHANGES.md 记录变更
> ② 写 versions/v1.1.0/engineering/tech-solution.md
> ③ 更新 foundation/tech-arch/overview.md 技术栈说明
> ④ 新建 foundation/tech-arch/decisions/ADR-002-kafka-replace-redis-pubsub.md
> ⑤ 在 foundation/tech-arch/changelog.md 追加记录

**示例：编写数据库设计**
> 用户说：「帮我写 v1.0.0 注册功能的数据库设计」
>
> AI 正确行为：
> ① 读 versions/v1.0.0/product/requirements.md「涉及数据实体」字段
>    → 找到：users（修改）/ verification_codes（新增）
> ② 读 foundation/tech-arch/overview.md 了解数据库技术栈和命名规范
> ③ 在 versions/v1.0.0/engineering/db-design.md 填写：
>    - 变更清单（users 修改 / verification_codes 新增）
>    - 各表字段设计、索引设计、增量 DDL、回滚 DDL
> ④ 同步更新 versions/v1.0.0/README.md「发布关键项」中「增量 DDL」行：
>    | 增量 DDL | 修改 users 表新增 phone 字段，新增 verification_codes 表 | ⏳ |

**示例：技术方案定稿后完善发布关键项**
> 用户说：「技术方案已完成，补充一下发布关键项」
>
> AI 正确行为：
> ① 读取 versions/v1.0.0/engineering/tech-solution.md「配置变更需求」节
> ② 读取 versions/v1.0.0/engineering/db-design.md「变更清单」节
> ③ 打开 versions/v1.0.0/README.md「发布关键项」表，按实际情况填写：
>    | 增量 DDL | 新增 verification_codes 表，users 表新增 phone 字段 | ⏳ |
>    | 配置变更 | 新增环境变量 SMS_API_KEY（短信服务密钥）| ⏳ |
>    | 数据迁移脚本 | 无 | — |
>    | 代码脚本 | 无 | — |
> ④ 此后开发阶段如有新增变更，须同步更新此表

---

**触发**：被要求撰写测试计划、编写测试用例、记录缺陷、撰写测试报告

**步骤：**
1. 读取 `standards/testing/standards.md` 确认测试规范
2. 读取 `versions/{当前版本}/product/requirements.md` 了解验收标准
3. 在 `versions/{当前版本}/testing/` 下创建或修改对应文档
4. 用例编号格式：TC-{三位序号}；缺陷编号格式：BUG-{三位序号}
5. 新增用例时同步更新：①总览表 ②详情区 ③统计表（三处保持一致）
5.5. **编写完某功能模块的测试用例后，回填 requirements.md**（需求-用例双向追踪）：
   - 将 TC 编号注释追加到对应验收标准后：`- [ ] xxx <!-- TC-001 -->`
   - 更新该功能模块的「测试覆盖」字段，填写覆盖的 TC 编号列表
   - 所有验收标准均已关联用例后，状态从「待覆盖」改为「已覆盖」
6. **编写测试计划时**（test-plan.md），须读取 requirements.md「非功能需求」节，
   在 test-plan.md「非功能需求测试目标」表中逐条填写目标指标和测试方法（非功能需求追踪链第2步）
7. 如是变更导致的测试调整 → 在 CHANGES.md 对应变更项打 [x]

**完成标志**：文档已创建，索引已更新，变更影响项已处理（如有）

**示例：记录缺陷**
> 用户说：「发现一个 Bug：关闭邮件通知后仍然收到邮件」
>
> AI 正确行为：
> ① 在 versions/v1.0.0/testing/defects.md 的「缺陷详情」区追加（按 defects.md 模板格式）：
>
>    ### BUG-001
>    **严重级别**：P1
>    **功能模块**：消息通知
>    **发现阶段**：集成测试
>    **关联用例**：TC-{序号}
>    **当前状态**：⏳ 待修复
>    **缺陷描述**：关闭邮件通知后仍然收到邮件
>    **复现步骤**：1.设置→关闭邮件通知 2.触发订单变更 3.检查邮箱
>    **预期行为**：不发送邮件
>    **实际行为**：仍收到邮件通知
>
> ② 更新 defects.md 顶部「缺陷列表」表：新增 BUG-001 一行，验收状态填「—」
> ③ 更新 defects.md 顶部「缺陷统计」表：P1总计+1，待修复+1

**示例：从需求验收标准编写测试用例**
> 用户说：「帮我给注册功能写测试用例」
>
> AI 正确行为：
> ① 读取 versions/v1.0.0/testing/test-plan.md 确认注册功能已纳入测试范围
> ② 读取 versions/v1.0.0/product/requirements.md「注册流程」验收标准，提取所有场景：
>    - 正向：输入正确验证码 → 注册成功，跳转首页
>    - 异常：验证码错误 → 提示「验证码错误」，手机号不清空
>    - 边界：手机号已注册 → 提示「该手机号已注册」
>    - 权限：已登录用户访问注册页 → 跳转首页
> ③ 在 test-cases.md 为每条验收标准创建对应用例（TC-001～TC-004）
> ④ 同步更新 test-cases.md 顶部「用例总览」表和「用例统计」表
>
> ❌ 错误行为：不读需求直接凭经验写用例，导致用例与验收标准脱节

**示例：缺陷修复后的验收流程**
> 用户说：「BUG-001 已修复，帮我做验收」
>
> AI 正确行为：
> ① 读取 defects.md 中 BUG-001 的「修复说明」，了解修复内容和修复位置
> ② 读取关联用例（如 TC-002），按操作步骤重新执行验证
> ③ 验证通过后，在 defects.md 的 BUG-001 详情中追加验收记录：
>    #### 第1次验收
>    **验收时间**：2026-04-20
>    **验收方式**：重新执行 TC-002
>    **验收结论**：✅ 验收通过
>    **状态更新**：→ ✅ 验收通过（已关闭）
> ④ 同步更新 defects.md 缺陷列表：验收状态改为「验收通过」
> ⑤ 同步更新统计表：待验收-1，验收通过+1
> ⑥ 同步更新 test-cases.md 关联用例状态：❌ → ✅

**示例：编写测试报告**
> 用户说：「测试工作结束了，帮我写测试报告」
>
> AI 正确行为：
> ① 读取 test-cases.md 统计表，获取各优先级用例的执行数和通过数
> ② 读取 defects.md 统计表，获取缺陷总数、已关闭数和遗留数
> ③ 对照 test-plan.md「退出条件」表，逐项核查是否满足
> ④ 在 test-report.md 填写（须使用真实数据，不得估算）：
>    - 执行总结（来自 test-cases.md 数据）
>    - 缺陷分析（来自 defects.md 数据）
>    - **非功能需求验收**：读取 test-plan.md「非功能需求测试目标」表，逐条填写实测结果与目标值对照（非功能需求追踪链第3步）
>    - 退出条件核查（逐项 ✅/❌）
>    - 测试结论（通过/条件通过/不通过）
>    - 发布建议
> ⑤ 如结论为「通过」，执行 SOP-07 推进测试阶段为 ✅

---

**触发**：收到任何变更指令——需求调整、设计修改、接口变更、任何「改一下之前的方案」

**核心原则：先记录，后修改。任何情况下不得跳过 CHANGES.md 直接修改文档。**

**步骤：**
1. 在 `versions/{当前版本}/CHANGES.md` 追加新变更记录（先于修改文档）
   格式：CHANGE-{三位序号} | {日期} | {变更类型}
   必须列出所有影响范围，每项为 [ ] 未处理状态
2. 逐一修改受影响的文档
2.5. **需求变更时**：检查 `testing/test-cases.md`，将关联该需求的 ✅ 通过 用例状态**退回 ♻️ 需回归**（需求变了原测试结果可能失效，不退回等于伪装通过）
3. 每修改完一项，在 CHANGES.md 对应项打 [x]
4. 剩余 [ ] 项明确标注负责人和截止时间
5. 告知用户：已处理清单 + 待处理清单

**完成标志**：CHANGES.md 已记录，可处理影响项已打 [x]，剩余项已标注负责人

**示例：完整变更记录格式**
```
## CHANGE-001 | 2026-04-18 | 需求变更
**变更时当前阶段**：开发中
**变更内容**：注册流程由邮箱验证改为手机号验证
**变更原因**：用户反馈邮箱收件率低
**影响范围**：
- [x] 产品方案 → requirements.md 注册流程章节已更新
- [x] 技术方案 → tech-solution.md 认证模块已更新
- [ ] 测试用例 → testing/test-cases.md 注册相关用例待更新
**待处理**：@王五 请在 2026-04-20 前更新测试用例
```

**反例（错误行为）：**
> ❌ 直接打开 requirements.md 修改，没有先在 CHANGES.md 记录
> ❌ CHANGES.md 只写「需求有变更」，没有列出具体影响范围
> ❌ 只改了产品方案，没有检查技术方案和测试用例是否受影响

**示例：测试阶段收到需求变更**
> 用户说：「测试过程中发现注册需要加图形验证码」
>
> AI 正确行为：
> ① 先在 CHANGES.md 追加记录（不先改文档）：
>    ## CHANGE-003 | 2026-04-20 | 需求变更
>    变更时当前阶段：测试
>    变更内容：注册流程新增图形验证码防刷机制
>    影响范围：
>    - [ ] 产品方案 → requirements.md 注册流程章节
>    - [ ] 产品设计 → design-spec.md 注册页交互
>    - [ ] 技术方案 → tech-solution.md 认证模块
>    - [ ] 接口设计 → api-design.md（接口参数新增 captchaToken）
>    - [ ] 测试计划 → test-plan.md（测试范围扩大）
>    - [ ] 测试用例 → test-cases.md（需新增图形验证码用例）
>    - [ ] 发布关键项 → 版本 README.md（可能新增第三方验证码服务依赖）
> ② 告知用户：「测试阶段变更影响范围较大，已进行中的测试用例可能需要重新执行。
>    建议暂停当前测试，等变更实施后重新进入测试阶段。」

---

**触发**：被要求开发功能、修复 Bug、修改代码

**核心原则：工程代码不入驱动面板。workspace/ 目录已被 .gitignore 忽略，所有代码变更只通过 push 到对应仓库体现，驱动面板零代码文件。**

**步骤：**
1. 读取 `engineering/README.md` 工程清单 → 找到目标工程的「工程名」、仓库地址、分支策略
2. Clone 代码到 workspace 目录（若已存在则 git pull 更新）
   - 命令：`git clone <仓库地址> engineering/workspace/<工程名>`
3. 读取 `engineering/docs/local-env.md` 了解本地模式 / 端口分配 / 隔离策略 / dev 连接方式，
   再读 `engineering/docs/local-setup.md` 了解启动命令
4. **基础设施依赖漂移软检查**（低成本，顺手做）：扫 workspace 下正在开发工程的依赖文件
   （`package.json` / `go.mod` / `requirements.txt` / `pom.xml` 等），看 client 库
   （`mysql2` / `ioredis` / `kafkajs` / `@elastic/elasticsearch` / `aws-sdk` ...）
   是否都在 `local-env.md` §3 依赖矩阵中有对应声明。发现 drift 则提示用户同步更新 §3（走 SOP-02）。
5. 读取当前版本对应的技术方案：`versions/{当前版本}/engineering/tech-solution.md`
6. **前端开发前**须读取 `versions/{当前版本}/product/prototypes/README.md` 并 clone 对应原型分支
7. 遵循 `standards/engineering/` 规范进行开发
8. 开发完成后按分支策略创建分支、提交、push 到远端
9. 驱动面板中不产生任何代码文件变更

**完成标志**：代码已 push 到远端，驱动面板无变更

**示例：Bug 修复完成后**
> 除代码 push 外，还需更新缺陷文件：
> defects.md 中 BUG-001 状态改为：🔍 待验收

**反例：**
> ❌ 在驱动面板根目录创建 src/ 或任何代码文件
> ❌ 没有读技术方案就开始写代码
> ❌ 代码写完不 push，只留在 workspace/ 本地

**示例：前端功能开发完整流程**
> 用户说：「帮我开发 v1.0.0 注册页面的前端」
>
> AI 正确行为：
> ① 读 versions/v1.0.0/product/prototypes/README.md
>    → 获取 Web 端原型仓库地址，确认本版本已迭代 Web 端
> ② Clone 原型分支到本地：
>    git clone -b v1.0.0 <原型仓库地址> versions/v1.0.0/product/prototypes/workspace/web
> ③ 启动原型（端口 3000），作为视觉和交互参考
> ④ 读取 versions/v1.0.0/product/design-spec.md 确认补充交互规则（原型未覆盖的逻辑）
> ⑤ 读取 standards/design/DESIGN.md 确认视觉规范（色彩/字体/间距）
> ⑥ 读 engineering/README.md 工程清单，找到前端工程的工程名（假设为 `web-frontend`），Clone 到：
>    git clone <前端仓库地址> engineering/workspace/web-frontend
> ⑦ 读取 versions/v1.0.0/engineering/tech-solution.md「前端设计」节
> ⑧ 读取 versions/v1.0.0/engineering/api-design.md 确认接口规范
> ⑨ 开发完成后：启动开发版（端口 3001），与原型对比视觉差异，逐项修正
> ⑩ 修正满意后按分支策略 push，驱动面板不产生任何代码文件变更

---

**触发**：当前版本已发布，需要开始新的迭代版本

**版本号语义：**
- major（v1→v2）：产品重大转向或破坏性改动
- minor（v1.0→v1.1）：完整功能迭代（常规版本）
- patch（v1.0.0→v1.0.1）：Bug 修复、小调整

**步骤：**
1. 确认当前版本 README.md 发布阶段状态已标记为 ✅
2. 与用户确认新版本号
3. 在 `versions/` 下新建 `{新版本号}/` 目录，复制 v1.0.0/ 完整结构
4. 清空各子文档正文内容，保留模板占位结构
5. 更新 `versions/CURRENT.md`：将「主线开发版本」改为新版本号，阶段置为「规划中」；同时将「生产运行版本」更新为刚刚发布完成的上一个版本
6. 在 `versions/README.md` 进度矩阵中新增版本行
7. 若新版本已在 `versions/README.md`「版本规划（近期）」表中，将其从规划表中删除（已激活，不再是规划中）

**完成标志**：新版本目录已创建，CURRENT.md 已更新，进度矩阵已新增

**示例：v1.0.0 发布后新建 v1.1.0**
> 用户说：「v1.0.0 已正式发布，开始准备 v1.1.0」
>
> AI 正确行为：
> ① 确认 versions/v1.0.0/README.md「发布」阶段状态为 ✅
> ② 确认新版本号为 v1.1.0（功能迭代 → minor 版本）
> ③ 复制 versions/v1.0.0/ 完整目录结构到 versions/v1.1.0/
> ④ 清空以下文件正文内容（保留模板占位结构和注释）：
>    product/requirements.md / design-spec.md / prototypes/README.md
>    engineering/tech-solution.md / api-design.md / db-design.md / release.md
>    testing/test-plan.md / test-cases.md / defects.md / test-report.md
>    CHANGES.md（清空变更汇总表和变更详情，注释模板保留）
>    README.md（清空版本目标/范围/进展说明，阶段进度全部重置为 ⏳）
> ⑤ 更新 versions/CURRENT.md：版本改为 v1.1.0，阶段改为「规划中」
> ⑥ 更新 versions/README.md 进度矩阵：新增 v1.1.0 行，全部格填 ⏳

---

**触发**：某阶段工作完成，需要标记推进到下一阶段

**阶段顺序**：规划中 → 需求分析 → 产品设计 → 技术方案 → 开发中 → 测试 → 发布 → 已发布

**推进前检查（阶段门控）**：推进前须逐条核查，任一未满足则**拒绝推进**并告知用户缺少什么：

| 推进目标 | 必须满足的前置条件 |
|---------|-----------------|
| → 产品设计 | `requirements.md` 中所有 P0 功能状态为「已确认」；无未解决的 ⛔ 阻塞型待确认问题 |
| → 技术方案 | `design-spec.md` 主体内容已填写（非全空占位符）；`standards/design/DESIGN.md` 已配置 |
| → 开发中 | `tech-solution.md` + `api-design.md` + `db-design.md` 均已完成；`release.md` 发布关键项表已填写 |
| → 测试 | 功能代码已部署到 staging（用户确认）；CI 流水线通过；`test-plan.md` 进入条件核查表已勾选 |
| → 发布 | `test-report.md` 结论为「通过」或「条件通过」；所有 P0 缺陷已关闭；P1 缺陷已关闭或有明确豁免 |
| → 已发布 | `acceptance.md`「版本交付确认」已由产品负责人签收 |

> ❌ **反例**：用户说「需求写完了，可以开始技术方案了」→ AI 须先检查 requirements.md 是否所有 P0 功能都已确认，有草稿状态则拒绝推进。

**步骤（三处文件必须全部同步）：**
1. `versions/{版本}/README.md` 阶段进度表（**时间戳必填**）：
   - 完成阶段：状态改 ✅，**完成时间填今日日期**（YYYY-MM-DD）
   - 新阶段：状态改 🔄，**开始时间填今日日期**（YYYY-MM-DD）
2. `versions/CURRENT.md`：主线开发版本的当前阶段改为新阶段名称，进入时间改为今日日期
3. `versions/README.md` 进度矩阵：对应版本行该阶段格改为 ✅

**完成标志**：三处文件均已同步更新

**推进到「已发布」时的额外合并动作**（除三处状态同步外，必做）：

| 源（版本内增量） | 目标（基线） | 合并要点 |
|---------------|------------|---------|
| `versions/{ver}/engineering/api-design.md` 已上线接口 | `engineering/docs/api-docs/openapi.yaml` | 追加新接口；修改已有接口；废弃接口标 `deprecated: true` |
| `versions/{ver}/engineering/db-design.md` 增量 DDL | `engineering/docs/db-schema/full-schema.md` | 按业务模块更新表定义，ERD 同步，变更历史表追加一行 |
| `versions/{ver}/product/requirements.md` 已交付功能 | `foundation/product-arch/overview.md` 模块详情表 | 新功能追加一行（引入版本填本版本号）；功能变更更新对应行 |

**合并完成判定**：三项合并均已完成，基线文档已反映本版本交付结果。
基线不同文档之间存在冲突 → 停止并告知用户，不自行裁量。

> 合并依据见 §4.2「全量基线 vs 版本增量」。未完成合并不得将版本阶段标记为「已发布」。

**示例：技术方案完成，推进到开发阶段**
> 用户说：「v1.0.0 技术方案已完成，可以开始开发了」
>
> AI 正确行为（三处文件同步）：
> ① 更新 versions/v1.0.0/README.md 阶段进度表：
>    | 技术方案 | ✅ 完成   | 2026-04-15 | 2026-04-18 | 包含接口设计和数据库设计 |
>    | 开发中   | 🔄 进行中 | 2026-04-19 | -          |                        |
> ② 更新 versions/CURRENT.md：
>    阶段改为「开发中」，进入时间改为今日
> ③ 更新 versions/README.md 进度矩阵：
>    v1.0.0 行「技术方案」格改为 ✅，「开发」格改为 🔄

**反例：**
> ❌ 只更新了 CURRENT.md，忘记同步版本 README 和进度矩阵
> ❌ 进展说明留空，没有记录当前阶段的实际进展状态

**示例：阶段回退（测试发现严重问题，需要回到开发阶段）**
> 用户说：「测试发现 P0 缺陷 BUG-003，需要回到开发阶段修复」
>
> AI 正确行为（三处文件同步）：
> ① 更新 versions/{ver}/README.md：
>    | 测试     | ↩️ 已回退 | 2026-04-22 | 回退原因：发现 P0 缺陷 BUG-003，需重新进入开发 |
>    | 开发中   | 🔄 进行中 | 2026-04-25 | 修复 BUG-003 |
> ② 更新 versions/CURRENT.md：当前阶段改为「开发中」
> ③ 更新 versions/README.md 进度矩阵：对应版本「测试」格改回 🔄，「发布」格保持 ⏳
>
> ❌ 错误行为：仅在 defects.md 记录缺陷，不更新版本阶段状态

---

### SOP-08 新产品初始化（首次使用 — 从 0 开始）

**触发**：fork 本模板后，产品从 0 开始，首次使用本驱动面板

**步骤：**
1. 引导用户阅读并按 `SETUP.md` 路径一完成四个阶段
2. 按优先级逐步填写，通过对话方式帮助用户完成每个文件
3. 验收清单全部 ✅ 后，方可开始版本工作（执行 SOP-01）

**完成标志**：`SETUP.md` 路径一验收清单全部 ✅（17项）

**AI 引导策略：**

> AI 应以对话方式引导，通过提问收集信息，帮助用户完成文档，而不是让用户自己对着空白模板填写。

**示例：引导填写市场调研**
> 用户说：「我想开始一个新产品，从哪里开始？」
>
> AI 正确行为：
> ① 先引导完成 AGENTS.md §1 + 顶部标题同步（5分钟内）：
>    「先告诉我：1. 产品叫什么名字？2. 一句话描述：面向谁、解决什么问题？」
>    拿到答案后，AI 须一次性更新三处：
>    - AGENTS.md 第 1 行标题（`{产品名}` → 实际名）
>    - AGENTS.md §1 产品名称/定位/阶段
>    - README.md 第 1 行标题 + 「这是什么」节
> ② 填完 §1 后，引导市场调研（market-research.md）：
>    「接下来填市场调研。请告诉我：
>     1. 这个产品面向哪个行业？市场大概多大规模？
>     2. 目前用户用什么方式解决这个问题？有什么不满意的地方？
>     3. 你认为现在是好时机吗？主要因为什么？
>     4. 这个市场有哪些风险需要注意？」
> ③ 用户回答后，AI 整理填入 market-research.md
> ④ 按此方式逐步完成 competitor-analysis → user-research → business-model → DESIGN.md
> ⑤ 所有必须项完成后：「基础配置已完成，可以开始需求分析了。执行 SOP-01。」
>
> ❌ 错误行为：直接问「需求是什么」，跳过初始化步骤

**初始化标准顺序：**
```
1. AGENTS.md 全文产品名同步（§1 产品基本信息 + 第 1 行标题 + README.md 第 1 行标题与「这是什么」节）
2. foundation/market/market-research.md（市场依据）
3. foundation/market/competitor-analysis.md（竞品分析）
4. foundation/market/user-research.md（用户画像）
5. foundation/business/business-model.md（商业模式）
6. foundation/product-arch/overview.md（产品模块初稿）
7. standards/design/DESIGN.md（设计规范，原型前必须）
8. standards/engineering/standards.md（研发规范）
9. foundation/tech-arch/overview.md（技术架构，技术方案前必须）
10. engineering/*/README.md（填写仓库地址）
11. versions/CURRENT.md（确认版本和阶段）
12. 开始需求分析 → SOP-01
```

---

### SOP-09 已有产品迁移（首次使用 — 已有产品）

**触发**：已有产品，首次将其纳入本驱动面板统一管理

**核心原则：**
- 逆向补充，据实填写，不破坏现有工作
- 不确定内容必须标注「待确认」，不得编造
- 允许分多次完成，重要的先做

**步骤：**
1. 全面评估现状（产品阶段、版本号、现有文档位置、产品形态）
2. 设置 CURRENT.md（最关键的第一步）
3. 逆向补充 foundation/ 文档
4. **归档存量基线**（见 SETUP.md 路径二 阶段 3.5）
   - 🔴 必做六项：
     - 全量表结构（`engineering/docs/db-schema/full-schema.md`）
     - 全量 API 清单（`engineering/docs/api-docs/openapi.yaml`）
     - 全量功能清单（`foundation/product-arch/overview.md` 模块详情表）
     - 全量服务拓扑（`foundation/tech-arch/overview.md` 模块划分 + 架构图）
     - 全量外部集成（`foundation/product-arch/overview.md` 外部集成表）
     - 全量环境配置（`engineering/docs/environments.md`）
   - 🟢 可延后：全量角色/权限矩阵
5. 迁移已有 PRD 到 versions/{ver}/product/requirements.md
6. 更新 engineering/ 和 testing/ 工程仓库引用
7. 填充当前版本文档反映实际状态
8. 补充 standards/ 规范文档

**完成标志**：`SETUP.md` 路径二验收清单全部 ✅（24项）

**示例：确定迁移版本号**
> 用户说：「我的产品已上线两年了，版本号应该怎么设置？」
>
> AI 正确行为：
> ① 询问四个问题：
>    「请告诉我：
>     1. 产品第一次正式上线是什么时候？
>     2. 总共经历过几次较大的功能迭代？
>     3. 当前是否有正在进行的迭代？
>     4. 有没有重大的架构变更或产品方向调整？」
> ② 根据回答建议版本号：
>    - 「上线2年，大约10个功能版本，当前有活跃迭代」→ 建议 v2.1.0 或类似
>    - 「上线半年，2个版本，当前无活跃迭代」→ 建议 v1.2.0
> ③ 与用户确认后，设置 CURRENT.md 和创建版本目录

**示例：已有 PRD 的导入**
> 用户说：「我们有飞书文档里的 PRD，怎么迁移过来？」
>
> AI 正确行为：
> ① 引导用户提供 PRD 核心内容（功能模块列表 + 主要需求描述）
> ② 帮助整理到 versions/{ver}/product/requirements.md：
>    - 每个功能模块对应一个 `### 模块名` 章节
>    - 需求状态设为「已确认」（已有产品的需求一般已确认）
>    - 验收标准从 PRD 中提取或整理
> ③ 功能清单总览表填写所有模块
> ④ 告知用户：「原有 PRD 保留在飞书，这里是整理后的版本。后续需求更新以这里为准。」

**示例：逆向补充技术架构**
> 用户说：「帮我填写技术架构文档，我们用 React + Node.js + MySQL + Redis」
>
> AI 正确行为：
> ① 填写技术栈总览表
> ② 追问更多细节：
>    「还有这些需要确认：
>     1. 部署方式？（K8s / ECS / 其他）
>     2. 有消息队列吗？（Kafka/RabbitMQ/无）
>     3. CDN 和对象存储用什么？
>     4. 监控用什么工具？」
> ③ 对于不确定项（如性能基线、高可用架构）→ 标注「待确认」
> ④ 填完后提示：「tech-arch 初稿已完成，有 X 处标注了「待确认」，可在后续与团队核实后补充。」

**反例（迁移常见陷阱）：**
> ❌ 不管产品已迭代多少年，直接沿用 v1.0.0 版本号
> ❌ foundation/ 文档难填就随便估写，不标注「待确认」
> ❌ 把历史上所有版本的需求都塞进当前版本 requirements.md
>    （当前版本只填当前迭代的需求，历史功能在 product-arch/overview.md 中记录）
> ❌ 发现旧文档格式不同就删掉重写
>    （正确：旧文档原处保留，按本模板结构整理核心内容）
> ❌ 逆向补充时写「未来我们应该做的」，而不是「现在已有的」

---

### SOP-10 对象存储文件上传与 URL 落档

**触发**：需要在文档中引用截图、录屏、设计稿导出、日志附件、报告 PDF 等二进制文件

**核心原则：git 只存 URL，文件存 OSS。上传完成后只需在文档中记录 CDN URL，本地文件无需保留在驱动面板中。**

**步骤：**
0. **前置：验证 rclone remote 是否已配置**
   ```bash
   rclone listremotes
   ```
   - 输出中包含 `OSS.md` 中的 remote 名 → 继续执行步骤 1
   - 输出为空 / 不含对应 remote 名 → **停止上传，执行「未配置引导流程」（见 OSS.md §新主机配置引导）**
1. 确认 rclone skill 已安装（安装方式见下方）
2. 读取 `OSS.md` 获取：remote 名、bucket 名、CDN 域名、product-slug
3. 按命名规范重命名文件：`{YYYYMMDD}-{描述}.{ext}`
4. 查 OSS.md「文件落档对照表」确定 OSS 存放路径
5. 用 rclone skill 上传文件
6. 构造 CDN URL，嵌入对应文档，本地文件可删除

**rclone skill 安装（未安装时）：**

> 如果 rclone skill 未安装，告知用户运行以下提示词来安装：

```
Curl https://lobehub.com/skills/tbygamedev-claude-code-team-setup-rclone/skill.md, then follow the instructions to set up LobeHub Skills Marketplace and install the skill. Once installed, read the SKILL.md file in the installed directory and follow its instructions to complete the task.
```

> rclone skill 负责：rclone 安装、remote 配置、上传命令执行。
> OSS.md 负责：本项目专属的 remote 名/bucket/CDN 域名/目录结构/命名规范。

**示例：测试发现 Bug，上传截图并记录**
> AI 正确行为：
> ① 确认 rclone skill 已安装
> ② 文件重命名：`20260419-BUG001-email-notification-bug.png`
> ③ 读取 OSS.md → remote=`niuma-hr`，bucket=`niuma-assets`，CDN=`https://assets.niuma-hr.com`
> ④ 用 rclone skill 上传到 `versions/v1.0.0/testing/` 路径下
> ⑤ 在 defects.md 的 BUG-001 详情中嵌入 URL：
>    `![截图](https://assets.niuma-hr.com/niuma-hr/versions/v1.0.0/testing/20260419-BUG001-email-notification-bug.png)`
> ⑥ 本地截图文件无需保留在驱动面板目录中

**示例：初始化时配置对象存储**
> 用户说：「云厂商阿里云，AK=xxx，SK=yyy，Region=cn-hangzhou，CDN=https://assets.example.com，Bucket=my-assets」
>
> AI 正确行为：
> ① 确认 rclone skill 已安装（未安装则先引导安装）
> ② 用 rclone skill 完成 remote 配置并验证连通性
> ③ 在 OSS.md 配置信息表中填写：云厂商/Bucket/Region/CDN域名/remote名（不填 AK/SK）

---

### SOP-11 热修复版本（Hotfix）

**触发**：已发布版本发现 P0/P1 严重缺陷，需紧急修复发布，不等待下一个常规版本

**与 SOP-06（常规新建版本）的核心区别：**
- 热修复从**已发布版本**拉取，而非从主开发分支
- 跳过需求分析和产品设计阶段，直接进入技术方案
- 只修复 Bug，不新增功能，版本号为 patch（v1.0.0 → v1.0.1）
- 原版本（v1.0.0）状态保持「已发布」不变

**步骤：**
1. 确认需要热修复的发布版本号（如 v1.0.0）和缺陷编号（如 BUG-003）
2. 在 `versions/` 下新建 patch 版本目录（如 v1.0.1），复制 v1.0.0 结构
3. 清空 v1.0.1/ 下方案文档正文，保留模板占位结构
4. 在 v1.0.1/README.md 中填写版本信息，直接将「技术方案」阶段设为 🔄，**开始时间填今日**
5. **更新 `versions/CURRENT.md`**：在「热修复版本」节填写 v1.0.1 和缺陷编号（**不改动「主线开发版本」节**）
6. 在 `versions/README.md` 进度矩阵新增 v1.0.1 行，标注「热修复」
7. 直接执行 SOP-02 开始技术方案
8. **hotfix 发布后收尾**（与常规发布的 SOP-07 等价，不可跳过）：
   - 按 §4.2 合入基线（若本次修复涉及 API/DB/功能变更）
   - 更新发现版本（`v1.0.0`）的 `defects.md` 对应缺陷：「修复版本」填 `v1.0.1`，状态改为 🕐 待验收
   - **清空 `versions/CURRENT.md`「热修复版本」节**（版本填「—」），将「生产运行版本」更新为 v1.0.1

**完成标志**：热修复版本发布后，v1.0.0 和 v1.0.1 均为「已发布」状态

**示例：v1.0.0 发现 P0 Bug，发起热修复**
> 用户说：「v1.0.0 生产环境发现 P0 Bug BUG-003，需要紧急修复」
>
> AI 正确行为：
> ① 新建 versions/v1.0.1/ 目录，复制 v1.0.0 结构并清空方案内容
> ② 在 v1.0.1/README.md 填写：
>    | 版本类型 | patch |
>    | 版本背景 | 热修复 — v1.0.0 中 BUG-003（{Bug描述}）的紧急修复 |
>    阶段进度：需求 ✅ 设计 ✅ 技术方案 🔄（直接开始）
> ③ 更新 versions/CURRENT.md：版本改为 v1.0.1，阶段「技术方案」
> ④ 更新 versions/README.md 进度矩阵，新增 v1.0.1 行标注「[hotfix] BUG-003」
> ⑤ 立即执行 SOP-02 开始技术方案

**反例：**
> ❌ 在 v1.0.0 上直接修改已发布的方案文档（不允许修改已发布版本）
> ❌ 把热修复当作常规版本走完整流程（耽误修复时间）
> ❌ 跳过新建版本目录，直接修改代码不记录文档（知识断层）

---

### SOP-12 生产验收（UAT）

**触发**：发布部署完成（release.md 全部步骤执行完毕），人类驱动 AI 开始生产验收

**验收文件**：`versions/{当前版本}/testing/acceptance.md`

**步骤：**
1. **生成验收用例**（首次执行前）：
   - 读取 `test-cases.md`（P0/P1 核心用例）
   - 读取 `defects.md`（已修复的 P0/P1 缺陷）
   - 读取 `CHANGES.md`（本版本重大变更）
   - 在 `acceptance.md` 的「验收用例」区生成 AC-xxx 用例（聚焦核心链路，比测试用例更精简）
   - **等待产品负责人确认验收范围**，调整后方可开始执行
2. **配置验收物料**（首次执行前）：
   - 填写 `acceptance.md`「验收环境信息」和「验收凭证」节
3. **按轮次执行验收用例**：
   - 逐一执行 AC-xxx，填写执行状态、实际结果、工件 URL
   - 每轮结束后在「轮次执行摘要」追加一行，向人工汇报统计
4. **处理验收失败用例**：
   - P0 新 bug → 立即在 `defects.md` 新建缺陷，触发 SOP-11 hotfix，修复后重新执行失败用例
   - P1 新 bug → 由产品负责人决定是否 hotfix，决策写入「遗留问题说明」
   - P2/P3 新 bug → 记录到 `defects.md`，遗留说明中注明
5. **循环直到所有退出条件满足**（见 acceptance.md 退出条件表）
6. **产品负责人签收**：
   - 在 `acceptance.md`「版本交付确认」行签收（填姓名 + 时间）
   - 告知 AI 签收完成，AI 执行 SOP-07 将版本推进到「已发布」阶段

**完成标志**：`acceptance.md`「版本交付确认」已签收，SOP-07 已将版本标记为「已发布」

**示例：验收循环**
> AI 执行完第 1 轮后汇报：
> 「Round-1 验收完成：共 10 条用例，通过 8 条，失败 2 条（AC-003 P1、AC-007 P0）。
>  已在 defects.md 创建 BUG-005（P0）、BUG-006（P1）。
>  BUG-005 已触发 SOP-11 hotfix 流程，请确认 hotfix 方案。
>  请告知 BUG-006 是否需要本版本修复。」

---

## §6 文档落档规约


> 每次落档前先查此表，确认文件应放的位置。

| 工作类型 | 落档位置 | 备注 |
|---------|---------|------|
| 需求文档、验收标准 | `versions/{ver}/product/requirements.md` | |
| 产品设计、交互逻辑 | `versions/{ver}/product/design-spec.md` | |
| 原型链接 / 文件 | `versions/{ver}/product/prototypes/README.md` | |
| 技术方案 | `versions/{ver}/engineering/tech-solution.md` | |
| 接口设计稿（版本内） | `versions/{ver}/engineering/api-design.md` | 设计阶段 |
| 已发布正式 API 文档 | `engineering/docs/api-docs/openapi.yaml` | 发布后归档 |
| 数据库设计 | `versions/{ver}/engineering/db-design.md` | |
| 发布流程 | `versions/{ver}/engineering/release.md` | |
| 测试计划 | `versions/{ver}/testing/test-plan.md` | |
| 测试用例 | `versions/{ver}/testing/test-cases.md` | 单文件 |
| 缺陷记录 | `versions/{ver}/testing/defects.md` | 单文件 |
| 测试报告 | `versions/{ver}/testing/test-report.md` | |
| **验收计划与用例** | `versions/{ver}/testing/acceptance.md` | 发布后生产验收，SOP-12 |
| 版本内变更记录 | `versions/{ver}/CHANGES.md` | 先于文档修改写入 |
| 产品架构变更 | `foundation/product-arch/` + changelog.md | 跨版本基线 |
| 技术架构变更 | `foundation/tech-arch/` + changelog.md + decisions/ | 跨版本基线 |
| 全量表结构（基线） | `engineering/docs/db-schema/full-schema.md` | 跨版本基线，版本发布合入（SOP-07）|
| 全量 API 清单（基线） | `engineering/docs/api-docs/openapi.yaml` | 跨版本基线，版本发布合入（SOP-07）|
| 全量功能清单（基线） | `foundation/product-arch/overview.md` 模块详情 | 跨版本基线，版本发布合入（SOP-07）|
| 工程代码 | 各工程仓库（workspace/ clone，不入驱动面板）| |

---

## §7 禁止行为 & 不确定时的处理

### 禁止行为

**文档操作禁止：**
❌ 在版本目录之外创建需求 / 技术方案 / 测试类文档
❌ 在 `versions/{ver}/` 根层直接创建方案文档（所有方案文档须在 `product/` / `engineering/` / `testing/` 子目录内）
❌ 在 `foundation/` 下创建版本相关的需求或方案文档（foundation 只存跨版本长期基线知识）
❌ 收到变更指令时直接修改文档，不先在 CHANGES.md 记录
❌ 修改非当前活跃版本的方案文档（如有追溯需求，只允许在原版本 CHANGES.md 追加说明，不修改原文档正文）
❌ 删除或重命名已有文件（只允许新增或更新内容；确需删除时须用户明确指令后执行）

**需求与方案衔接禁止：**
❌ 需求状态为「草稿」时推进对应功能的技术方案或测试用例（须等需求更新为「已确认」后再推进）
❌ 在未读取 requirements.md 验收标准的情况下直接编写测试用例（用例必须来源于验收标准）
❌ 跳过 test-plan.md 测试计划直接编写测试用例（须先有测试计划明确范围，再写用例）
❌ 填写 test-report.md 时使用估算或猜测数据（须基于 test-cases.md 和 defects.md 的实际执行数据）

**代码与安全禁止：**
❌ 将工程代码纳入驱动面板（workspace/ 已被 .gitignore 忽略）
❌ 将密钥、密码、生产环境凭证、Access Token、OSS AK/SK 写入任何项目文档（OSS 凭证只存在本机 rclone 配置中）
❌ 上传文件到 OSS 后将本地文件也提交到 git（文档只记录 CDN URL，文件只存 OSS）
❌ 在未检查 rclone skill 是否安装的情况下直接执行 rclone 命令（须先确认 skill 已安装）
❌ 进行任何 UI / 前端 / 原型工作前跳过读取 `standards/design/DESIGN.md`

**流程执行禁止：**
❌ 在未执行 §3 状态速查的情况下开始任何操作
❌ 同时更新多个版本的文档（一次只操作当前活跃版本）

**初始化阶段禁止（新产品）：**
❌ `AGENTS.md §1` 未填写时，要求 AI 执行任何文档落档操作（须先完成产品基本信息）
❌ `standards/design/DESIGN.md` 未完成时，进行任何原型设计或前端开发（视觉规范必须先定义）
❌ `foundation/` 核心文档（市场调研/用户研究/商业模式）未完成时，开始 `versions/` 版本工作

**初始化阶段禁止（已有产品迁移）：**
❌ 迁移时覆盖或删除已有产品的任何文档（须先整理归档，再迁移入本结构）
❌ 逆向补充 `foundation/` 时编造不确定内容（不确定信息必须标注「待确认」）
❌ 不评估产品实际版本直接沿用 v1.0.0（须根据产品发展阶段确定合适的语义版本号）

### 不确定时的处理

| 不确定场景 | 正确行为 |
|-----------|---------|
| 不清楚需求属于哪个版本 | 询问用户确认目标版本 |
| 不确定变更影响哪些域 | 列出可能受影响的文档，请用户确认范围 |
| 不确定文档应放哪个目录 | 查 §6 落档规约，若仍不确定则询问 |
| 发现两份文档内容矛盾 | 停止操作，告知用户具体矛盾点，请求澄清 |
| 规范未覆盖当前场景 | 说明「当前场景无对应规范覆盖」，告知用户后按最佳实践执行 |
| 用户指令与本文件规约冲突 | 告知用户冲突点，请用户明确决策，不自行裁量 |
| 发现 requirements.md 中存在未解决的「⛔ 阻塞型待确认问题」 | 停止推进，列出具体阻塞问题，提示用户先解决后再继续 |
| 技术方案需引入新依赖但许可证不明确（如 GPL/AGPL 等传染性许可证）| 告知用户许可证风险，等待确认后再引入，不擅自决策 |
| 缺陷修复完成但关联测试用例执行状态仍为 ❌ | 提示将关联用例重新标记为「⏳ 待执行」，在缺陷状态置为「🔍 待验收」后重新执行验证 |

