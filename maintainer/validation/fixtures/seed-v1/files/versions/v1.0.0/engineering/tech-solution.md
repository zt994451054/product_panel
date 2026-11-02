# v1.0.0 技术方案

> 需求见 [requirements.md](../product/requirements.md)，接口见 [api-design.md](./api-design.md)，数据库见 [db-design.md](./db-design.md)

## 方案概述

- booking-web（React）新增时段列表、预约确认、时段管理三个页面。
- booking-api（Node.js + Express）新增时段与预约接口，数据存 MySQL。

## 关键设计

| 需求点 | 实现方式 |
|------|------|
| 同一时段不超卖 | booking 表对 slot_id 建唯一索引，插入冲突返回 409 |
| 每人最多 3 个未开始预约 | 创建预约时在事务内计数，超出返回 422 |
| 已过去时段不可预约 | 接口按服务器时间校验，前端同时置灰 |
| 批量创建跳过重叠 | 按 (date, start_time) 唯一索引，INSERT IGNORE 并返回跳过数 |

## 核心实现路径验证

| 核心路径 | 为什么没把握 | 验证方式 | 结论 | 证据 |
|---------|------------|---------|------|------|
| 同一时段并发预约不超卖 | 依赖唯一索引在高并发下的行为 | 在 booking-api 上用 50 并发脚本实测 | ✅ 成立：50 个请求只有 1 个成功，其余返回 409 | engineering/workspace/booking-api/spike/concurrency.js 及运行日志 |

## 配置变更需求

| 配置项 | 说明 | 默认值 |
|------|------|------|
| BOOKING_MAX_ACTIVE | 每人最多未开始预约数 | 3 |

## 基础设施依赖

无新增（沿用现有 MySQL）。

## 方案状态

方案、接口设计、数据库设计已完成。
