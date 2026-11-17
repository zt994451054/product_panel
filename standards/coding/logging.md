# 日志规范

> **主标准**：[Twelve-Factor App - XI. Logs](https://12factor.net/logs)（日志作为事件流）
> **副标准1**：[OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)（日志安全）
> **副标准2**：[OpenTelemetry Logs](https://opentelemetry.io/docs/concepts/signals/logs/)（结构化日志标准）

---

## 核心原则（Twelve-Factor App）

1. **日志是事件流**：进程只写 stdout/stderr，由基础设施收集和存储，应用不管理文件轮转
2. **结构化日志**：JSON 格式，机器可解析，支持按字段查询
3. **不记录敏感信息**：密码、Token、完整身份证/卡号等绝对不出现在日志中

---

## 日志级别

| 级别 | 使用场景 | 示例 |
|------|---------|------|
| **DEBUG** | 开发调试，生产环境通常关闭 | 函数入参、中间状态 |
| **INFO** | 关键业务流程节点，默认级别 | 用户登录、订单创建 |
| **WARN** | 非预期但可处理的情况 | 缓存未命中、重试成功 |
| **ERROR** | 错误发生，需要关注但服务仍运行 | 数据库查询失败 |
| **FATAL** | 服务无法继续运行，进程即将退出 | 初始化失败 |

**级别选择判断：**

```
发生了错误？
  → 是：用 ERROR（服务继续运行）或 FATAL（服务即将退出）
  → 否：是否是非预期情况？
       → 是：WARN
       → 否：是关键业务节点？
              → 是：INFO
              → 否：DEBUG
```

---

## 结构化日志格式

【必须】使用 JSON 格式输出，包含以下标准字段：

```json
{
  "timestamp": "2026-04-13T10:00:00.123+08:00",
  "level": "INFO",
  "service": "order-service",
  "traceId": "550e8400e29b41d4a716446655440000",
  "spanId": "a716446655440000",
  "userId": "10086",
  "message": "Order created successfully",
  "orderId": "ORD-20260413-001",
  "durationMs": 45
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `timestamp` | ✅ | ISO 8601，含时区 |
| `level` | ✅ | 日志级别 |
| `service` | ✅ | 服务名，便于多服务聚合查询 |
| `traceId` | ✅（有链路时）| 分布式追踪 ID，关联整条请求链路 |
| `message` | ✅ | 人类可读的描述 |
| 业务字段 | 按需 | 如 `userId`、`orderId`、`durationMs` 等 |

---

## 各语言写法

各语言的推荐日志库与写法，见语言页的「日志」一节：[Java](languages/java.md)、[Go](languages/go.md)、[Python](languages/python.md)、[JavaScript / TypeScript](languages/javascript-typescript.md)。

---

## 日志安全规范（OWASP）

【必须】以下信息**禁止出现在日志**中：

| 禁止记录 | 示例 |
|---------|------|
| 密码/密钥 | `password=xxx`、`api_key=xxx` |
| 完整 Token | JWT Token（只记录前几位用于关联）|
| 完整身份证号 | 应脱敏为 `180****1234` |
| 完整银行卡号 | 应脱敏为 `**** **** **** 1234` |
| 完整手机号 | 应脱敏为 `138****5678` |

```go
// ✅ 脱敏处理
logger.Info("user login",
    "phone", maskPhone(phone),  // 138****5678
    "ip", clientIP,
)

// ❌ 禁止
logger.Info("user login",
    "phone", phone,             // 完整手机号
    "password", password,       // 密码
)
```

---

## Correlation ID / Trace ID

【必须】所有日志必须携带请求追踪 ID，用于关联同一请求的所有日志：

```
请求进入网关 → 生成 traceId → 注入请求头 X-Trace-Id
  ↓
服务 A 读取 traceId → 写入日志 MDC/上下文
  ↓
服务 A 调用服务 B → 传递 traceId（通过请求头）
  ↓
服务 B 读取 traceId → 写入日志
```

这样在日志系统中按 `traceId` 过滤，能看到完整请求链路的所有日志。

`X-Trace-Id` 是自定义请求头；接入 OpenTelemetry 等标准追踪方案时，用 W3C Trace Context 的 `traceparent` 头传递。

---

## 禁止事项

【禁止】使用语言自带的标准输出语句输出业务日志（生产代码中也不保留这类调试输出）

【禁止】直接记录完整异常 message 而不记录堆栈（会丢失排查信息）

【禁止】在循环中大量打印 DEBUG 日志（性能问题）

【禁止】异步操作中丢失 traceId（需要显式传递到异步上下文）
