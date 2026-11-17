# Kafka 使用规范

> **主标准**：[Apache Kafka Documentation](https://kafka.apache.org/documentation/)
> **补充**：参见[消息队列设计规范](../architecture/mq-design.md)（消息类型/投递保证/模式选型）

> **说明**：本规范聚焦 Kafka **实现侧**（Topic 设计/Producer/Consumer 配置）。通用消息设计原则见消息队列设计规范。

---

## Topic / Partition 设计

### Topic 命名

【推荐】Topic 命名格式：`{业务域}.{事件名}`，全小写，点或连字符分隔：

```
✅ order.created               # 订单域，创建事件
✅ user.registered             # 用户域，注册事件
✅ payment.refund_completed    # 支付域，退款完成
❌ OrderCreated                # 无业务域前缀
❌ order-create-topic          # 带多余后缀，事件名不清晰
```

环境隔离方式由项目决定：各环境使用独立集群时，Topic 名不带环境；多环境共用一个集群时，加环境前缀（如 `prod.order.created`、`dev.user.registered`）。

### Partition 数量

分区数决定最大并发消费者数，一旦创建只能增加不能减少：

```
分区数参考公式：
  max(目标吞吐量 / 单分区吞吐量, 消费者实例数)

示例：
  目标：100MB/s，单分区写入 10MB/s → 至少 10 个分区
  消费者：20 个实例 → 至少 20 个分区（多余分区闲置）
```

**一般参考值：**
- 低流量业务（< 1MB/s）：3-6 个分区
- 中等流量（1-10MB/s）：6-12 个分区
- 高流量（> 10MB/s）：按公式计算，可能 20-100+

### 副本数（Replication Factor）

生产环境建议副本数 ≥ 3（标准高可用）；其余环境按资源决定，单节点环境只能设为 1。

---

## Producer 配置规范

```java
// Java - Kafka Producer 关键配置
Properties props = new Properties();
props.put("bootstrap.servers", "kafka1:9092,kafka2:9092,kafka3:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

// ✅ acks=all：所有副本确认才返回成功（最高可靠性）
props.put("acks", "all");

// ✅ 开启幂等，防止网络重试导致重复写入
props.put("enable.idempotence", true);

// ✅ 重试次数和间隔
props.put("retries", Integer.MAX_VALUE);        // 配合幂等使用
props.put("delivery.timeout.ms", 120000);       // 总超时 2 分钟

// ✅ 批量发送优化（提升吞吐量）
props.put("batch.size", 16384);                // 16KB 批次大小
props.put("linger.ms", 5);                     // 最多等 5ms 凑批
props.put("compression.type", "lz4");           // 压缩（推荐 lz4 或 snappy）
```

```go
// Go - sarama
config := sarama.NewConfig()
config.Producer.RequiredAcks = sarama.WaitForAll      // acks=all
config.Producer.Idempotent = true                      // 幂等
config.Producer.Return.Successes = true
config.Producer.Retry.Max = 5
config.Producer.Compression = sarama.CompressionLZ4
```

**分区路由策略：**

```java
// 有序性要求：相同 Key 的消息发送到同一分区
producer.send(new ProducerRecord<>("order.created", orderId, message));

// 无序要求：null Key，按轮询/随机分配（吞吐量更高）
producer.send(new ProducerRecord<>("order.created", null, message));
```

---

## Consumer 配置规范

```java
// Java - Consumer 关键配置
props.put("bootstrap.servers", "kafka1:9092,kafka2:9092");
props.put("group.id", "notification-service");   // 消费者组名

// ✅ 手动提交 offset（确保消息处理后才提交，防止丢失）
props.put("enable.auto.commit", "false");

// ✅ 从最早未消费的 offset 开始（新消费者组）
props.put("auto.offset.reset", "earliest");

props.put("max.poll.records", 500);              // 每次 poll 最多 500 条
props.put("session.timeout.ms", 30000);          // Consumer 心跳超时 30s
props.put("max.poll.interval.ms", 300000);       // poll 间隔超过此值触发 rebalance
```

### 手动提交 Offset（推荐）

```java
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord<String, String> record : records) {
        try {
            process(record);
        } catch (Exception e) {
            log.error("Process failed, will retry", e);
            // 处理失败时：重试、发送到死信 Topic、或跳过
        }
    }
    // ✅ 批次处理完成后手动提交
    consumer.commitSync();
}
```

```python
# Python - confluent-kafka
consumer = Consumer({'bootstrap.servers': 'kafka:9092',
                     'group.id': 'my-service',
                     'enable.auto.commit': False})
consumer.subscribe(['order.created'])

while True:
    msg = consumer.poll(1.0)
    if msg and not msg.error():
        process(msg.value())
        consumer.commit()  # 处理后手动提交
```

---

## 幂等消费（必须）

Kafka At-Least-Once 保证消息可能重复投递，**消费者必须实现幂等**：

```python
# 方案1：消息 ID 去重（Redis + 消息ID）
def consume(message):
    msg_id = message.headers.get('messageId')
    if redis.exists(f"consumed:{msg_id}"):
        return  # 已处理，跳过

    # 执行业务逻辑
    process(message)

    # 标记为已处理（TTL 24h）
    redis.setex(f"consumed:{msg_id}", 86400, "1")
```

---

## 死信 Topic（DLQ）

【必须】消费失败超过重试次数的消息转移到死信 Topic：

```
主 Topic：order.created
死信 Topic：order.created.dlq

消费失败 → 重试 3 次 → 发送到 DLQ → 告警 + 人工处理
```

```java
// 发送到死信 Topic
producer.send(new ProducerRecord<>(topic + ".dlq", record.key(), record.value()));
```

---

## 多语言客户端推荐

| 语言 | 推荐客户端 |
|------|----------|
| Go | [confluent-kafka-go](https://github.com/confluentinc/confluent-kafka-go)（性能最好）/ [sarama](https://github.com/IBM/sarama) |
| Java | [kafka-clients](https://kafka.apache.org/documentation/#api)（官方）/ Spring Kafka |
| Python | [confluent-kafka-python](https://github.com/confluentinc/confluent-kafka-python) |
| Node.js | [kafkajs](https://kafka.js.org/) |

## Related

- [消息队列设计规范](../architecture/mq-design.md)（通用消息模式）
- [高可用设计规范](../architecture/high-availability.md)（消息幂等/重试）
