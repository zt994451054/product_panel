# SETUP.md — 初始化指南

> 本文件适用于**首次使用**本驱动面板的两种场景。
> 初始化完成后，日常工作请阅读 `AGENTS.md`。
>
> ⚠️ 初始化是一次性工作，但至关重要——完成质量直接决定后续所有 AI 协作的效果。
> 建议与 AI 对话完成，AI 会逐步引导你填写每一个文件。

---

## 选择你的路径

| 你的情况 | 对应路径 |
|---------|---------|
| 全新产品，从 0 开始规划 | [路径一：新产品初始化](#路径一新产品初始化-0→1) |
| 已有产品，迁移至本架构 | [路径二：已有产品迁移](#路径二已有产品迁移) |

---

## 路径一：新产品初始化（0→1）

> 适用于：产品从 0 开始，尚无代码或正式文档

**预计完成时间：** 2-4 小时（可分多次完成）
**建议方式：** 与 AI 对话，AI 引导你逐步回答问题并帮助整理填写

---

### 阶段 1：基础配置（必须第一步完成）

**Step 0：配置对象存储**

告诉 AI 以下信息，AI 会完成所有技术配置（rclone 安装、配置生成、连通性验证、OSS.md 填写）：

```
请帮我配置对象存储，信息如下：
- 云厂商：（阿里云 OSS / 腾讯云 COS / AWS S3 / Cloudflare R2 / MinIO）
- Access Key：
- Secret Key：
- Region：（如 cn-hangzhou）
- CDN 自定义域名：（如 https://assets.example.com）
- Bucket 名称：
```

> ⚠️ CDN 自定义域名必须提前在云厂商控制台完成绑定。这是所有文件 URL 长期稳定的基础。
> 凭证信息只用于生成本机 rclone 配置，不会写入任何项目文件。

**Step 1：填写产品基本信息**

打开 `AGENTS.md §1`，填写：
- 产品名称
- 产品定位（一句话：面向谁、解决什么问题）
- 当前阶段（填「活跃开发中」）

> 如果还没想清楚产品定位，可以先写「待确认」，完成市场调研后再更新。

**Step 2：填写工程仓库地址**

告诉 AI 仓库地址，AI 帮你填写：
- 前端仓库 git 地址 + 分支策略
- 后端仓库 git 地址 + 分支策略
- 如仓库未创建，告知 AI「待创建」即可


**Step 3：确认规范层级**

打开 `standards/README.md`，确认组织级规范的访问方式已正确配置（product_spec skill 或 URL）。

---

### 阶段 2：产品底座文档（分优先级完成）

> 说明：「必须」项须在指定工作开始前完成，不允许跳过；「建议」项尽早完成；「可延后」项可随迭代逐步补充。

#### 🔴 第一批（必须，需求分析前完成）

**1. `foundation/market/market-research.md` — 市场调研**

需要填写：市场规模、行业趋势、市场机会、核心痛点、市场挑战与风险

> AI 引导问题示例：
> - 「这个产品面向哪个行业或领域？市场大概有多大？」
> - 「市场上目前存在哪些问题没有被很好地解决？」
> - 「你认为现在是做这个产品的好时机吗？为什么？」
> - 「这个市场有哪些风险或挑战需要注意？」

**2. `foundation/market/competitor-analysis.md` — 竞品分析**

需要填写：主要竞品列表、功能对比矩阵、差异化优势

> AI 引导问题示例：
> - 「目前市场上有哪些产品在解决类似问题？请列举 2-5 个」
> - 「每个竞品的主要优势和不足是什么？」
> - 「你的产品打算在哪些维度超越竞品？」
> - 「有哪些功能是竞品没有而你们计划做的？」

**3. `foundation/market/user-research.md` — 用户研究**

需要填写：用户分层、用户画像（1-3个核心画像）、核心痛点、使用场景

> AI 引导问题示例：
> - 「你们的目标用户是谁？他们的职业、年龄、技术背景大概是什么？」
> - 「这些用户目前用什么方式解决他们的问题？有什么不满意的地方？」
> - 「用户在什么场景下会用到你们的产品？能举一个具体的使用例子吗？」
> - 「有没有做过用户访谈或问卷？有什么关键发现？」

**4. `foundation/business/business-model.md` — 商业模式**

需要填写：价值主张（填空句式）、目标客户、收入来源、关键假设

> AI 引导问题示例：
> - 「用一句话描述：你们帮助___解决___通过___不同于___」
> - 「产品如何盈利？订阅制、按量付费还是其他？」
> - 「估计每个付费用户每月贡献多少收入？」
> - 「商业模式成立的关键假设是什么？哪些还未验证？」

#### 🟡 第二批（建议，尽早完成）

**5. `foundation/business/go-to-market.md` — 上市策略**

需要填写：市场切入点、冷启动策略、增长漏斗目标

**6. `foundation/product-arch/overview.md` — 产品架构初稿**

新产品启动时至少需要一份「产品愿景架构」，描述计划中的功能模块体系。
在需求分析阶段开始前完成初稿，随版本迭代持续更新。

> AI 引导问题示例：
> - 「你们的产品计划包含哪些主要功能模块？」
> - 「各模块的核心职责是什么？它们之间有什么关联？」

#### 🔴 第三批（必须，技术方案前完成）

**7. `foundation/tech-arch/overview.md` — 技术架构**

需要填写：技术栈选型（含选型理由）、系统架构、模块划分

> AI 引导问题示例：
> - 「前端打算用什么框架？（React/Vue/其他）」
> - 「后端语言和框架是什么？」
> - 「数据库用什么？有没有缓存（Redis）？」
> - 「部署方式是什么？自建服务器还是云服务？」
> - 「是否有消息队列、搜索引擎等中间件？」

#### 🔴 第四批（必须，原型设计前完成）

**8. `standards/design/DESIGN.md` — 设计系统**

需要填写：色彩系统、字体规范、间距体系、核心组件规范

> AI 引导建议：可以参考 https://github.com/VoltAgent/awesome-design-md 中的示例产品设计规范。
> 如果有设计师，由设计师主导填写；如果没有，选择一个参考品牌（如 Linear、Stripe）的风格基调。

---

### 阶段 3：配置规范体系

> 规范文件明确「产品级与组织级的差异」，如果没有特殊约定则填「无产品级特殊约定，遵循组织级规范」。

| 文件 | 最少应填写的内容 |
|------|----------------|
| `standards/engineering/standards.md` | 分支策略（feat/hotfix/release）、提交规范（feat/fix/docs等）|
| `standards/engineering/frontend.md` | 框架版本约定、组件规范 |
| `standards/engineering/backend.md` | API 设计规范、错误码规范 |
| `standards/testing/standards.md` | 测试分层策略、覆盖率目标 |
| `standards/operations/standards.md` | 环境划分、部署流程 |
| `standards/product/standards.md` | 业务逻辑约束、功能边界（产品特有规则）|

---

### 阶段 4：启动第一个版本

1. 打开 `versions/CURRENT.md`，确认版本号（默认 v1.0.0），填写各角色负责人
2. 打开 `versions/v1.0.0/README.md`，填写：
   - 版本类型（major）
   - 版本背景（用 1-2 句话描述为什么做这个版本）
3. 开始需求分析，执行 `AGENTS.md SOP-01`

---

### ✅ 路径一完成验收清单

全部勾选后，初始化才算完成，可以开始日常研发迭代：

**基础配置：**
- [ ] `AGENTS.md §1` 产品名称和定位已填写
- [ ] `engineering/frontend/README.md` 仓库地址已填写（或标注「待创建」）
- [ ] `engineering/backend/README.md` 仓库地址已填写（或标注「待创建」）

**产品底座文档：**
- [ ] `foundation/market/market-research.md` 市场调研已填写（含市场挑战和风险）
- [ ] `foundation/market/competitor-analysis.md` 竞品分析已填写
- [ ] `foundation/market/user-research.md` 用户画像已填写
- [ ] `foundation/business/business-model.md` 商业模式已填写（含关键假设）
- [ ] `foundation/product-arch/overview.md` 产品模块初稿已填写
- [ ] `foundation/tech-arch/overview.md` 技术架构已填写（技术方案前）

**规范体系：**
- [ ] `standards/design/DESIGN.md` 设计系统已定义（原型前）
- [ ] `standards/engineering/standards.md` 分支策略和提交规范已填写
- [ ] `standards/testing/standards.md` 测试分层策略已填写

**版本启动：**
- [ ] `versions/CURRENT.md` 版本号和负责人已填写
- [ ] `versions/v1.0.0/README.md` 版本背景已填写

---

## 路径二：已有产品迁移

> 适用于：产品已存在，将其纳入本驱动面板统一管理

**核心原则：**
> 1. **不删除、不覆盖已有文档** — 迁移是「整理和引用」，不是「重写」
> 2. **据实填写，不得编造** — 不确定的内容必须标注「待确认」
> 3. **循序渐进** — 允许分多次完成，重要的先做，次要的后补

---

### 阶段 0：配置对象存储（必须首先完成）

告诉 AI 以下信息，AI 会完成所有技术配置（rclone 安装、配置生成、连通性验证、OSS.md 填写）：

```
请帮我配置对象存储，信息如下：
- 云厂商：（阿里云 OSS / 腾讯云 COS / AWS S3 / Cloudflare R2 / MinIO）
- Access Key：
- Secret Key：
- Region：（如 cn-hangzhou）
- CDN 自定义域名：（如 https://assets.example.com）
- Bucket 名称：
```

> ⚠️ CDN 自定义域名必须提前在云厂商控制台完成绑定。凭证信息只用于生成本机 rclone 配置，不会写入任何项目文件。

---

### 阶段 1：全面评估当前状态（开始前必做）

> 这是迁移最重要的一步，评估越全面，后续迁移越顺畅。

**1.1 产品阶段评估**

| 你的情况 | 对应策略 |
|---------|---------|
| 未上线，正在开发中 | 使用 v1.0.0，当前阶段对应实际研发进度 |
| 已上线，有正在进行的迭代 | 根据历史版本数量设定合适的版本号（如 v2.1.0），当前阶段设为「开发中」或「测试」|
| 已上线，稳定维护中 | 将最新稳定版标记为「已发布」，新建下一版本目录开始新迭代 |

**1.2 版本号确定**

回答以下问题，AI 帮助确定版本号：
- [ ] 产品第一次正式上线是什么时候？
- [ ] 总共经历过几次较大的功能迭代发布？
- [ ] 目前是否有正在进行中的迭代？预计什么时候发布？
- [ ] 是否有重大的架构变更或产品方向调整？

**1.3 现有文档盘点**

整理现有文档的位置（用于后续逆向补充）：
- [ ] 市场调研/商业计划 → 位置：___
- [ ] 用户研究/用户画像 → 位置：___
- [ ] 产品需求文档（PRD/MRD）→ 位置：___（Confluence/飞书/Google Docs/其他）
- [ ] 技术架构文档 → 位置：___
- [ ] 设计规范/设计系统 → 位置：___（Figma/Sketch/其他）
- [ ] API 文档 → 位置：___（Swagger/Postman/其他）
- [ ] 自动化测试工程 → 位置：___（git 仓库地址）

**1.4 产品形态盘点**

- [ ] 有几个端？（Web / iOS App / Android App / 微信小程序 / 其他）
- [ ] 后端是单体服务还是微服务？服务数量？
- [ ] 是否有独立的数据服务或中台？
- [ ] 是否有独立的测试自动化工程？

---

### 阶段 2：设置当前版本（最关键的第一步）

1. **确定版本号**（与 AI 对话确认）
2. 如果当前版本不是 v1.0.0，在 `versions/` 下创建对应版本目录：
   ```bash
   cp -r versions/v1.0.0 versions/v{x}.{y}.{z}
   ```
3. 更新 `versions/CURRENT.md`：版本号、当前阶段、各角色负责人
4. 更新 `versions/README.md` 进度矩阵：新增实际版本行，并根据实际情况填写阶段状态

---

### 阶段 3：逆向补充 foundation/

> 方向是「整理已有知识」，不是「从头调研」。
> 每个文件对应的内容来源见下表。

| 文件 | 内容来源 | 处理方式 |
|------|---------|---------|
| `market-research.md` | 已有市调报告、立项文档、BP | 整理核心结论，按模板章节填入 |
| `competitor-analysis.md` | 产品团队对竞品的了解 | 按模板整理，功能对比矩阵按实际情况填写 |
| `user-research.md` | 已有用研报告、用户画像文档、运营数据 | 整理 1-3 个核心用户画像 |
| `business-model.md` | 现有商业计划、盈利模式说明 | 按商业模式画布格式整理 |
| `product-arch/overview.md` | 产品文档、功能清单、已上线功能 | **从现有功能逆向整理模块体系** |
| `tech-arch/overview.md` | 代码仓库、技术文档、架构图 | **须扫描实际技术栈据实填写** |

**逆向整理 tech-arch/overview.md 的方法：**

1. 打开工程代码仓库，查看 package.json / go.mod / requirements.txt 等依赖文件
2. 查看 README.md 和现有技术文档
3. 询问团队成员确认实际技术栈
4. 将确认的内容填入技术栈总览表
5. 不确定的部分（如性能指标、高可用方案）→ 标注「待确认」

**「待确认」标注规范：**
```markdown
<!-- 待确认：此信息来自旧文档/口头确认，需与团队核实 -->
```

---

### 阶段 4：迁移已有需求文档（PRD 导入）

> 这是迁移中最常见的工作，将原有 PRD/需求文档整理到 versions/ 结构中。

**步骤：**

1. 找到对应当前活跃迭代的原有需求文档
2. 在 `versions/{ver}/product/requirements.md` 中：
   - 在「概述」节写明本版本目标
   - 将各功能模块整理到「功能需求详情」节（每个功能一个 `###` 章节）
   - 在「功能清单总览」表填写模块列表
   - **需求状态设为「已确认」**（因为已有产品这些需求都已确认）
3. 对于已完成但未记录的需求，设「需求状态：已确认」
4. 对于不确定的细节，标注「待确认」

> ⚠️ 不要把所有历史需求都塞进当前版本。当前版本只记录「正在进行的迭代」的需求。
> 已发布的历史功能记录在 `foundation/product-arch/overview.md` 中。

---

### 阶段 5：设置工程仓库引用

更新以下文件，填入真实 git 地址：

| 文件 | 填写内容 |
|------|---------|
| `engineering/frontend/README.md` | 前端仓库地址、主分支、分支策略 |
| `engineering/backend/README.md` | 后端仓库地址、主分支、分支策略 |
| `testing/integration/README.md` | 集成测试仓库（如有）|
| `testing/e2e/README.md` | E2E 测试仓库（如有）|
| `testing/performance/README.md` | 性能测试仓库（如有）|

**多端产品（Web + App + 小程序）的处理：**

在 `versions/{ver}/product/prototypes/README.md` 中，将各端设计稿/原型的地址分别填入「产品原型仓库」表格。

**已有 API 文档的处理：**

如果已有 OpenAPI/Swagger 文档，将其内容复制到 `engineering/docs/api-docs/openapi.yaml` 作为初始正式文档。

---

### 阶段 6：填充当前版本文档（反映实际状态）

**情况 A：产品正在活跃开发中**

| 文件 | 填写内容 |
|------|---------|
| `versions/{ver}/product/requirements.md` | 当前迭代的功能需求（来自原有 PRD）|
| `versions/{ver}/product/design-spec.md` | 交互规则和全局规范（来自原有设计规范）|
| `versions/{ver}/product/prototypes/README.md` | 现有设计稿链接（Figma 等）|
| `versions/{ver}/engineering/tech-solution.md` | 已有或正在设计的技术方案 |
| `versions/{ver}/engineering/api-design.md` | 正在开发的接口设计 |
| `versions/{ver}/README.md` | 阶段进度设为实际阶段（不能全是 ⏳）|

**情况 B：产品稳定，准备开始新迭代**

1. 为当前稳定版本设置「已发布」状态（在 CURRENT.md 和进度矩阵中更新）
2. 执行 SOP-06 新建下一个版本目录
3. 从「规划中」阶段开始新迭代

---

### 阶段 7：补充规范文档（从现有实践整理）

> 目标是将团队现有的、但未成文的规范整理记录下来。

| 文件 | 来源 | 最少填写内容 |
|------|------|------------|
| `standards/design/DESIGN.md` | 现有 Figma/设计系统 | 色彩/字体/间距的实际使用值 |
| `standards/engineering/standards.md` | 现有 git 工作流 | 分支命名规范、提交规范 |
| `standards/engineering/frontend.md` | 现有前端规范 | 框架版本、组件规范 |
| `standards/engineering/backend.md` | 现有后端规范 | API 设计原则、错误码规范 |
| `standards/testing/standards.md` | 现有测试流程 | 测试分层、覆盖率要求 |
| `standards/operations/standards.md` | 现有运维流程 | 环境划分、发布流程 |

> 如某规范完全来自组织级（product_spec skill），填「无产品级特殊约定，遵循组织级规范」。

---

### ✅ 路径二完成验收清单

**版本设置：**
- [ ] `versions/CURRENT.md` 已指向正确版本号和阶段，负责人已填写
- [ ] `versions/README.md` 进度矩阵已包含当前版本行

**底座文档（允许部分「待确认」）：**
- [ ] `foundation/market/market-research.md` 已填写核心内容
- [ ] `foundation/market/competitor-analysis.md` 已填写
- [ ] `foundation/market/user-research.md` 用户画像已填写
- [ ] `foundation/business/business-model.md` 商业模式已填写
- [ ] `foundation/product-arch/overview.md` 已从现有功能逆向整理模块体系
- [ ] `foundation/tech-arch/overview.md` 已从实际技术栈填写（包含所有主要中间件）

**工程配置：**
- [ ] `engineering/frontend/README.md` 仓库地址和分支策略已填写
- [ ] `engineering/backend/README.md` 仓库地址和分支策略已填写
- [ ] 如有测试自动化工程，`testing/*/README.md` 仓库地址已填写

**当前版本文档（须有实际内容，不能全空）：**
- [ ] `versions/{ver}/product/requirements.md` 当前迭代需求已整理（非全空模板）
- [ ] `versions/{ver}/engineering/tech-solution.md` 技术方案已整理（或标注「待补充」）
- [ ] `versions/{ver}/README.md` 阶段进度已设为实际状态

**规范文档：**
- [ ] `standards/design/DESIGN.md` 已填写（或指向现有设计系统来源）
- [ ] `standards/engineering/standards.md` 分支和提交规范已填写

---

## 初始化后的日常使用

初始化完成后，每次工作：

1. 用 AI 打开项目，AI 会自动执行 `AGENTS.md §3` 状态速查
2. 描述你要做的事，AI 会找到对应 SOP 并引导执行
3. 所有文档落档遵循 `AGENTS.md §6` 落档规约

---

## 常见问题

**Q：foundation/ 文档必须全部填完才能开始工作吗？**
A：不需要。路径一中标🔴的项必须先填；tech-arch 在写技术方案前必须填；DESIGN.md 在做原型前必须填。其余可边做边补。

**Q：迁移时发现现有文档和本模板结构不一致怎么办？**
A：以本模板结构为准，将现有内容整理后填入对应位置。原有文档保留在原处，不需要删除。

**Q：如果有多个后端微服务，仓库如何配置？**
A：在 `engineering/backend/README.md` 中列出所有服务仓库，每个服务作为一个表格行。`workspace/` 目录按需 clone 对应服务。

**Q：迁移时如何确定合适的版本号？**
A：根据语义版本规则：major 表示重大架构变更，minor 表示功能迭代，patch 表示修复。通常已上线超过 1 年且有多个版本发布的产品，从 v2.x.x 或更高起始。如果不确定，与 AI 对话，描述产品历史，AI 会帮助评估。

**Q：设计稿在 Figma，DESIGN.md 要重新做一份吗？**
A：不需要完全重做。从 Figma 中提取色彩、字体、间距等 token 数值，填入 DESIGN.md 对应节。DESIGN.md 的目的是让 AI 在没有打开 Figma 时也能了解视觉规范。

**Q：已有产品的技术文档很少，tech-arch 怎么填？**
A：通过代码仓库逆向推导：查看 package.json/go.mod 等依赖文件，询问团队成员，然后据实填写。不确定的地方标「待确认」，后续补全。

**Q：迁移后 AI 能帮我做什么？**
A：初始化完成后，AI 可以：基于 foundation/ 知识回答产品背景问题、按 SOP 引导需求分析、帮助编写技术方案、跟踪变更记录、管理版本状态等。
