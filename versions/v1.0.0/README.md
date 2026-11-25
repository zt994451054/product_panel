# v1.0.0

> 本版本的阶段、签收、负责人、计划发布日、进展说明不写在这里：运行 `node tools/panel.mjs status --version v1.0.0` 查看，用命令修改（[agents/state.md](../../agents/state.md)）。

## 版本背景

<!-- 一句话：为什么做这个版本，业务驱动是什么 -->

## 版本目标

<!-- 本版本要解决什么问题、交付什么价值，1-3句话 -->

## 版本范围

| 功能模块 | 优先级 | 说明 | 来源 |
|---------|--------|------|------|
| <!-- 模块名 --> | P0/P1/P2 | <!-- 简述 --> | <!-- 立项 / CHANGE-{成员标识}-xxx（负责人确认：D-{成员标识}-xxx） --> |

> 版本立项后新增或扩大的范围，「来源」写对应变更和负责人确认的决策编号；被裁剪的行保留，说明写「已裁剪，见 CHANGE-{成员标识}-xxx」。

## 交接

<!-- 任务没做完就结束对话时，在这里留交接说明（格式见 agents/collaboration.md §4），接手后核对完再清空。没有就留空 -->

## 发布关键项

> 技术方案阶段完成此表（不涉及的行填「无」），这是签收「技术方案」的门控条件之一；发布时按项执行。

| 类型 | 说明 | 状态 |
|------|------|------|
| 增量 DDL | <!-- 表结构变更说明，无则填「无」 --> | ⏳ |
| 数据迁移脚本 | <!-- SQL 数据脚本说明，无则填「无」 --> | ⏳ |
| 配置变更 | <!-- 环境变量/配置文件修改项，无则填「无」 --> | ⏳ |
| 代码脚本 | <!-- 需手动执行的代码脚本，无则填「无」 --> | ⏳ |
| 服务依赖 | <!-- 依赖的其他服务版本或发布顺序，无则填「无」 --> | ⏳ |

→ 详细发布步骤见 [engineering/release.md](./engineering/release.md)

## 文档导航

| 域 | 文档 |
|----|------|
| 产品 | [需求文档](./product/requirements.md) |
| 产品 | [产品设计](./product/design-spec.md) |
| 产品 | [统一原型](../../foundation/design/prototype/README.md) |
| 研发 | [技术方案](./engineering/tech-solution.md) |
| 研发 | [接口设计](./engineering/api-design.md) |
| 研发 | [数据库设计](./engineering/db-design.md) |
| 研发 | [发布流程](./engineering/release.md) |
| 测试 | [测试计划](./testing/test-plan.md) |
| 测试 | [测试用例](./testing/test-cases.md) |
| 测试 | [缺陷记录](./testing/defects.md) |
| 测试 | [测试报告](./testing/test-report.md) |
| 测试 | [验收计划与用例](./testing/acceptance.md) |

## 变更与决策

→ 变更见 [CHANGES.md](./CHANGES.md)，使用者的决定见 [decisions.md](./decisions.md)
