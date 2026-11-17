# 消息队列设计规范

> **主标准**：[Enterprise Integration Patterns（Hohpe & Woolf）](https://www.enterpriseintegrationpatterns.com/)——消息系统领域最权威的与厂商无关的模式集
> **副标准1**：[CloudEvents Spec](https://cloudevents.io/)（事件结构标准化）
> **副标准2**：[Kafka Documentation](https://kafka.apache.org/documentation/)（高吞吐场景实现参考）
> **副标准3**：[RabbitMQ Best Practices](https://www.rabbitmq.com/docs/best-practices)（任务队列场景实现参考）

---

## 核心原则

1. **消息即合约**：消息结构是服务间的接口契约，变更须遵循向后兼容规则
2. **消费者幂等**：消费者必须能安全地处理重复消息
3. **解耦而非依赖**：消息队列用于解耦，不应通过 MQ 实现同步请求-响应

---

## 何时使用消息队列

| 场景 | 使用 MQ | 使用直接调用（HTTP/RPC）|
|------|---------|---------------------|
| 操作可以异步执行 | ✅ | |
| 需要削峰填谷 | ✅ | |
| 多个消费者订阅同一事件 | ✅ | |
| 需要操作结果立即返回 | | ✅ |
| 需要强一致性事务 | | ✅ |
| 调用链路简单、耗时短 | | ✅ |

---

## 消息类型（Enterprise Integration Patterns）

### Command（命令消息）

告诉接收方做某件事，有且只有一个消费者处理。

```json
{
  "type": "SendVerificationEmail",
  "payload": {"userId": "10086", "email": "user@example.com"},
  "messageId": "uuid-001",
  "timestamp": "2026-04-13T10:00:00+08:00"
}
```

- 一对一：Point-to-Point Channel
- 适用：任务调度、异步处理

### Event（事件消息）

通知订阅方某件事已经发生，可以有多个消费者。

```json
{
  "type": "UserRegistered",
  "payload": {"userId": "10086", "registeredAt": "2026-04-13T10:00:00+08:00"},
  "messageId": "uuid-002",
  "source": "user-service",
  "timestamp": "2026-04-13T10:00:00+08:00"
}
```

- 一对多：Publish-Subscribe Channel
- 适用：业务事件通知、数据同步

### Document（文档消息）

传递数据内容，接收方自行决定如何处理。适合数据传输场景，如 ETL、报表生成。

---

## 消息结构规范（CloudEvents）

所有消息遵循 [CloudEvents 1.0](https://cloudevents.io/) 标准字段：

```json
{
  "specversion": "1.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "source": "/services/order-service",
  "type": "com.example.order.created",
  "time": "2026-04-13T10:00:00+08:00",
  "datacontenttype": "application/json",
  "data": {
    "orderId": "ORD-10086",
    "userId": "10086",
    "amount": 12800
  }
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `specversion` | ✅ | CloudEvents 版本，固定 `"1.0"` |
| `id` | ✅ | 消息唯一 ID（UUID4），用于幂等去重 |
| `source` | ✅ | 发送方服务路径，如 `/services/order-service` |
| `type` | ✅ | 事件类型，格式：`{组织反向域名}.{服务}.{事件名}`，全小写 |
| `time` | ✅ | 事件发生时间，ISO 8601 |
| `data` | ✅ | 业务数据，JSON 对象 |

---

## 投递保证

| 保证级别 | 含义 | 实现代价 | 适用场景 |
|---------|------|---------|---------|
| **At-Most-Once** | 最多投递一次，可能丢失 | 最低 | 日志、实时监控（丢失可接受）|
| **At-Least-Once** | 至少投递一次，可能重复 | 中等 | **大多数业务场景**（消费者实现幂等）|
| **Exactly-Once** | 恰好一次，不丢不重 | 最高 | 金融交易（实现复杂，尽量避免）|

【推荐】使用 **At-Least-Once** + **消费者幂等** 代替 Exactly-Once，在工程上更可靠。

---

## 消费者幂等性

【必须】消费者必须实现幂等，能安全处理同一条消息被投递多次的情况。

**实现方式：**

```
方法1：消息 ID 去重
  消费前查询消息 ID 是否已处理（存 Redis 或数据库）
  已处理 → 直接返回成功
  未处理 → 执行业务逻辑 → 标记为已处理

方法2：业务层幂等
  创建操作：用唯一业务 Key（如 orderId）做唯一索引，重复插入忽略
  更新操作：使用乐观锁（版本号/ETag），旧版本更新直接忽略
```

---

## 消息排序

| 需要严格有序 | 实现方案 |
|------------|---------|
| 全局有序 | 单分区/单队列（吞吐量低，慎用）|
| 按 Key 有序 | 按业务 Key 路由到同一分区（如同一用户的操作）|
| 无需有序 | 多分区并行消费，吞吐量最高 |

---

## 常用消息模式（Enterprise Integration Patterns）

### Dead Letter Queue（死信队列）

消费失败超过重试次数的消息，投递到死信队列，防止阻塞主队列。

```
主队列 → 消费失败（重试 3 次）→ 死信队列 → 人工处理 / 告警
```

【必须】所有业务队列必须配置死信队列。

### Competing Consumers（竞争消费者）

多个消费者实例同时监听同一队列，每条消息只被一个消费者处理，实现横向扩展。

```
Queue ──→ Consumer 1
       ──→ Consumer 2   （负载均衡，每条消息只投递一次）
       ──→ Consumer 3
```

### Publish-Subscribe Channel（发布订阅）

一条消息被广播给所有订阅者，每个订阅者都能收到完整副本。

```
Producer → Topic ──→ Consumer Group A（订单服务）
                  ──→ Consumer Group B（通知服务）
                  ──→ Consumer Group C（统计服务）
```

### Request-Reply（请求回复）

通过消息实现伪同步调用，发送方等待回复消息。适合跨服务的异步协调场景，但增加了复杂度，非必要不使用。

---

## 消息中间件选型指南

根据场景选择合适的消息中间件，不强制统一使用同一种：

| 场景 | 推荐中间件 | 理由 |
|------|----------|------|
| 高吞吐流处理（> 10万 QPS）| **Kafka** | 顺序读写，吞吐量极高；持久化，可回放 |
| 任务队列、灵活路由 | **RabbitMQ** | AMQP 协议，支持复杂路由规则，延迟队列 |
| 简单异步通知、轻量场景 | **Redis Streams** | 无需额外部署，适合单机或小规模 |
| 实时消息、WebSocket 推送 | **Redis Pub/Sub** | 轻量，不持久化，适合实时但可丢失的场景 |

**关键差异：**

| 维度 | Kafka | RabbitMQ | Redis Streams |
|------|-------|----------|--------------|
| 消息持久化 | ✅ 默认持久 | ✅ 可配置 | ✅ 可配置 |
| 消息回放 | ✅ 支持 | ❌ 不支持 | ✅ 支持 |
| 有序性 | 分区内有序 | 单队列有序 | 流内有序 |
| 推/拉模式 | 拉（Poll）| 推（Push）| 拉（Poll）|
| 适合吞吐量 | 极高 | 中等 | 中等 |

---

## 消息 Schema 演进

【必须】消息结构变更遵循向后兼容原则：

| 变更类型 | 兼容性 |
|---------|--------|
| 新增可选字段 | ✅ 兼容（旧消费者忽略新字段）|
| 新增必填字段 | ❌ 破坏性变更，升版本或双写 |
| 删除字段 | ❌ 破坏性变更，先废弃再删 |
| 修改字段类型 | ❌ 破坏性变更 |

**推荐**：使用 [Avro](https://avro.apache.org/) 或 [Protobuf](https://protobuf.dev/) + Schema Registry 管理消息 Schema，自动验证兼容性。

---

## 禁止事项

【禁止】在消息 `data` 中存储敏感信息（密码、完整身份证号、银行卡号），需要传递时先脱敏或传引用 ID

【禁止】单条消息超过 **1MB**，大文件通过存储系统传递，消息中只放引用地址

【禁止】在消息中实现同步请求-响应（应使用 HTTP/gRPC）

【禁止】消费者直接操作数据库后不记录幂等标记（导致重复消费产生脏数据）

## Related

- [高可用设计规范](high-availability.md)（消息队列高可用：副本、分区、消费者组）
- [数据库设计规范](database-design.md)（表结构与事务）
