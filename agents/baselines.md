# 文档优先级与基线

> 版本内文档与跨版本基线文档的关系。写技术方案、需求分析、发布合并基线、热修复时读本页。

## 文档优先级

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

## 全量基线与版本增量

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
- **hotfix（SOP-11）**：发布后同样须按本页规约合入基线；同时更新发现版本 `defects.md` 中缺陷的「修复版本」字段
- 基线之间描述冲突 → 停止，告知用户，不自行裁量

**C 分层补充**：单工程内部细节（目录结构 / 启动方式 / 依赖版本）不入驱动面板基线，
跟随工程仓库 README 走。驱动面板 `engineering/README.md` 工程清单表
通过「详细说明」列链接到工程仓库 README。

**已有产品首次迁移**：以上基线文档初次填充见 SOP-09 和 `SETUP.md` 配置卡片。
