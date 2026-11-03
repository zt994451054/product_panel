# 回滚策略规范

> **主标准**：[Google SRE - Managing Incidents](https://sre.google/sre-book/managing-incidents/)
> **副标准1**：[Evolutionary Database Design (Martin Fowler)](https://martinfowler.com/articles/evodb.html)（数据库零停机变更）
> **副标准2**：[Google SRE - Handling Overload](https://sre.google/sre-book/handling-overload/)

本页是通用底线和可选做法；本项目实际做法见 [运维与发布画像](../../engineering/docs/ops-profile.md)。

---

## 核心原则

1. **部署前必须有回滚方案**：不确定如何回滚的变更不允许上线。方案写在 `versions/{ver}/engineering/release.md` 的「回滚方案」节
2. **能重新部署上一个已知良好的制品**：这是服务回滚的底线，具体手段因基础设施而异
3. **回滚时间目标（RTO）**：由项目定义，写入运维与发布画像
4. **数据回滚独立于服务回滚**：服务可以快速回滚，数据变更需要单独的策略
5. 【推荐】具备自动化能力时，发布后验证失败自动回滚，减少人为判断延迟

---

## 回滚决策标准

发生以下情况时**立即触发回滚**（指标和阈值由项目定义，数值为示例）：

| 指标 | 回滚触发条件示例 |
|------|------------|
| 错误率 | > 1%（正常 < 0.1%）且持续 5 分钟 |
| P99 延迟 | > 正常基线 300% 且持续 3 分钟 |
| 发布后验证 | 健康检查或核心业务链路验证失败 |
| 业务指标 | 核心转化率下降 > 20% |

**决策流程：**

```
部署后观察（时长由项目定义，如 15 分钟）
  ↓
指标异常？
  ├─ 是 → 立即回滚（有自动回滚能力时自动执行），同时开始排查
  └─ 否 → 继续观察到项目定义的观察期结束（如 24 小时）
```

---

## 服务回滚

### 重新部署上一个制品

最简单的回滚方式：重新部署上一个稳定版本的制品（镜像、二进制、安装包或归档）。

```bash
# 示例（Kubernetes，可选）：快速回滚到上一个版本
kubectl rollout undo deployment/order-service

# 回滚到指定版本
kubectl rollout undo deployment/order-service --to-revision=3

# 查看回滚历史
kubectl rollout history deployment/order-service
```

**关键要求**：
- 至少保留回滚所需的历史制品（不能被清理），保留数量由项目定
- 回滚与部署走同样的流水线或部署脚本（不要绕过检查）

### 可选做法：蓝绿/金丝雀回滚

使用这些部署策略时适用。

蓝绿部署：将负载均衡切回旧版本（秒级）

```
新版本出问题：负载均衡 → 绿（v2，有问题）
快速回滚：    负载均衡 → 蓝（v1，稳定）  ← 秒级完成
```

金丝雀回滚：将 v2 流量比例降至 0%

```
发现问题：v2 5% → v2 0%（停止金丝雀，所有流量回到 v1）
```

---

## 数据库变更回滚（最复杂的部分）

数据库 Schema 变更不像代码可以直接回滚，需要专门的策略。

### 扩展-收缩模式（Expand-Contract Pattern）

来源：Martin Fowler Evolutionary Database Design

```
阶段1 扩展（Expand）：
  - 新增字段/表，保留旧字段/表
  - 代码同时写新旧字段（双写）
  - 此时可随时回滚代码

阶段2 迁移（Migrate）：
  - 后台任务将旧字段数据迁移到新字段
  - 代码切换为只读新字段

阶段3 收缩（Contract）：
  - 确认旧字段无流量后，删除旧字段/表
  - 此步骤无法回滚（数据已删除）
```

**示例：重命名 `user_name` 为 `username`**

```sql
-- 阶段1：添加新列（不删除旧列）
ALTER TABLE users ADD COLUMN username VARCHAR(64);

-- 代码：写入时同时写两个字段，读取仍用 user_name

-- 阶段2：回填历史数据，确认新列数据完整后，代码切换为只读 username
UPDATE users SET username = user_name WHERE username IS NULL;

-- 阶段3（观察期过后，确认无回滚需求）：代码不再写 user_name，删除旧列
ALTER TABLE users DROP COLUMN user_name;
```

### 每次数据库变更提供回滚脚本，或写明不可逆

能回滚的变更提供回滚脚本；不可逆的变更（如收缩阶段删除字段）写明不可逆，并给出替代恢复方案（如变更前备份）。脚本和方案记录在版本的 `engineering/db-design.md` 和 `engineering/release.md`。

```sql
-- 变更脚本 V20260413_1__add_status_column.sql
ALTER TABLE orders ADD COLUMN status VARCHAR(20) DEFAULT 'PENDING';

-- 对应的回滚脚本 V20260413_1__add_status_column_rollback.sql
ALTER TABLE orders DROP COLUMN status;
```

【必须】回滚脚本或替代恢复方案在非生产环境验证过才能上生产

---

## 数据回滚（误操作/批量数据问题）

数据被错误修改/删除时的恢复策略。原则：高风险的数据变更前先留快照或备份，恢复依赖变更前快照和增量日志。

### 方案1：从备份恢复（影响大、慢）

适合数据大规模损坏，无法用代码逻辑修复时。

```
步骤：
1. 立即停止写入（或降级模式）
2. 确认最近可用备份点（RPO 评估）
3. 在临时库还原备份
4. 提取受影响的记录
5. 将恢复的数据导入生产库
6. 恢复写入
```

### 方案2：增量回滚（影响小、快）

适合特定批次或特定时间段的数据出错。

```sql
-- 示例（MySQL）：回滚某次错误的批量更新
-- 前提：有操作前的快照或 binlog

-- 从 binlog 中提取操作前的数据
-- mysqlbinlog --start-datetime="2026-04-13 10:00:00" 
--             --stop-datetime="2026-04-13 10:05:00" binlog > changes.sql

-- 或者从备份表恢复（推荐预先创建备份表）
-- 受影响的行仍在表中，用 REPLACE 覆盖；注意外键和触发器的影响
REPLACE INTO orders SELECT * FROM orders_backup_20260413 
WHERE id IN (SELECT id FROM affected_orders);
```

### 方案3：软删除/事件溯源（架构层面防护）

【推荐】对核心业务数据使用软删除而非物理删除，保留操作历史（审计日志）：

```sql
-- 软删除（deleted_at 不为空表示已删除）
UPDATE orders SET deleted_at = NOW() WHERE id = '...';

-- 恢复（清空 deleted_at）
UPDATE orders SET deleted_at = NULL WHERE id = '...' AND deleted_at IS NOT NULL;
```

---

## 回滚检查清单

生产部署后监控期间必须确认：

```
□ 健康检查端点正常响应
□ 错误率在项目定义的正常基线内
□ P99 延迟在正常范围
□ 核心业务链路实际走通（只看健康检查不算）
□ 数据库连接池正常
□ 依赖服务调用正常

发现异常时：
□ 立即通知相关负责人（有值班安排时通知值班人员）
□ 执行回滚（在项目定义的回滚时间目标内完成）
□ 记录异常现象（截图、日志）用于事后分析
□ 评估是否需要数据回滚
□ 在 versions/{ver}/engineering/release.md 记录回滚结果
```

回滚后仍需修复的问题按生产缺陷处理，见 [AGENTS.md](../../AGENTS.md) SOP-00.6；P0/P1 需要紧急修复时走 SOP-11。

## Related

- [CI/CD 流水线规范](ci-cd.md)
- [部署规范](deployment.md)
- [故障响应规范](incident-response.md)
