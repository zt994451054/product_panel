# 监控告警规范

> **主标准**：[Google SRE - Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
> **副标准1**：[OpenTelemetry](https://opentelemetry.io/)（可观测性数据规范）
> **副标准2**：[Google SRE - Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
> **副标准3**：[Google SRE Workbook - Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)

本页是通用底线和可选做法；本项目实际做法见 [运维与发布画像](../../engineering/docs/ops-profile.md)。

---

## 可观测性三支柱（OpenTelemetry）

工具不限，下表只是示例。

| 信号 | 内容 | 工具示例 |
|------|------|---------|
| **Metrics（指标）** | 数值型时序数据（计数、直方图）| Prometheus / VictoriaMetrics |
| **Logs（日志）** | 带时间戳的文本事件 | Elasticsearch / Loki |
| **Traces（追踪）** | 跨服务请求链路 | Jaeger / Zipkin / Tempo |

【推荐】使用 OpenTelemetry SDK 统一采集三种信号，与后端解耦：

```go
// Go - OpenTelemetry 初始化
import "go.opentelemetry.io/otel"

tracer := otel.Tracer("order-service")
ctx, span := tracer.Start(ctx, "createOrder")
defer span.End()
```

```java
// Java - OpenTelemetry（自动插桩）
// Maven: io.opentelemetry.instrumentation:opentelemetry-spring-boot-starter
// 无需代码修改，自动采集 HTTP/DB/消息队列等 span
```

---

## 四个黄金信号（必须监控，来自 Google SRE）

| 信号 | 指标 | 告警阈值示例 |
|------|------|------------|
| **延迟（Latency）** | P50 / P95 / P99 响应时间 | P99 > 2s 持续 3 分钟 |
| **流量（Traffic）** | RPS（每秒请求数）| 流量骤降 50% 持续 2 分钟 |
| **错误（Errors）** | 5xx 错误率、业务失败率 | 错误率 > 1% 持续 5 分钟 |
| **饱和度（Saturation）** | CPU、内存、连接池使用率 | CPU > 85% 持续 10 分钟 |

---

## SLO 告警设计（Google SRE 推荐）

**不要用硬阈值告警，用 SLO 消耗速率告警：**

普通阈值告警（不推荐）：`错误率 > 5%`
- 问题：5% 持续 1 分钟 vs 5% 持续 1 天，告警一样但影响天差地别

SLO 消耗速率告警（推荐）：
```
告警条件：过去 1 小时的错误预算消耗速率 > 14.4x（即 1小时内消耗了完整的月度预算的 2%）
```

**多窗口 SLO 告警（示例配置，出自 [SRE Workbook](https://sre.google/workbook/alerting-on-slos/)）：**

| 窗口 | 消耗速率阈值 | 消耗月度预算 | 处理方式 |
|------|------------|---------|---------|
| 过去 1h | > 14.4x | 2% | 立即通知（page）|
| 过去 6h | > 6x | 5% | 立即通知（page）|
| 过去 3d | > 1x | 10% | 建工单，计划期内处理 |

故障的严重级别按实际用户影响判定（见下文「告警分级与响应」），消耗速率不直接等于级别。

还没有条件计算消耗速率时，至少让告警对应用户影响并带持续时间条件。

---

## 告警设计原则

### 告警三原则（Google SRE）

1. **每个告警必须可操作**：收到告警的人必须知道该做什么
2. **告警应该紧急**：告警对应真实的用户影响，不是可以等待的问题
3. **避免告警疲劳**：太多噪音告警会导致真正的问题被忽视

**常见的坏告警（应该删除或降级）：**

```
❌ CPU 使用率 > 80%（无用户影响时不需要告警）
❌ 磁盘使用率 > 70%（预测性告警，不是紧急问题）
❌ 健康检查偶发失败一次（非持续性不需要立即响应）

✅ 错误率 > 1% 持续 5 分钟（有用户影响）
✅ SLO 错误预算消耗过快（影响可用性目标）
✅ 关键业务接口完全不可用
```

---

## 告警分级与响应

级别与 [AGENTS.md](../../AGENTS.md) SOP-00.6 的生产缺陷分级和 [故障响应规范](incident-response.md) 一致。通知渠道和响应时限由项目定义，写入运维与发布画像。

| 级别 | 定义 | 是否立即打断人 |
|------|------|---------|
| P0 - 阻断 | 核心服务完全不可用，影响所有用户 | 是 |
| P1 - 严重 | 核心功能严重降级，影响大量用户 | 是 |
| P2 - 一般 | 功能部分异常，部分用户受影响 | 否 |
| P3 - 轻微 | 轻微异常，用户基本无感知 | 否 |

潜在风险、暂无用户影响的信号不算告警，放到仪表盘或定期回顾。

---

## 监控仪表盘设计

【推荐】每个核心服务有一个仪表盘，包含：

```
┌─────────────────────────────────────┐
│ 服务健康概览                          │
│  错误率  P99 延迟  QPS  实例数         │
├────────────────────────────────────-│
│ SLO 状态                             │
│  当月错误预算剩余  过去 30 天可用率     │
├─────────────────────────────────────│
│ 依赖服务状态（下游调用成功率/延迟）      │
├─────────────────────────────────────│
│ 资源使用（CPU/内存/连接池/GC）         │
└─────────────────────────────────────┘
```

**仪表盘设计原则：**
- 首屏展示最重要的 5-8 个指标（避免信息过载）
- 使用红/黄/绿状态直观区分健康状态
- 关联链路追踪（从图表点击可跳转到对应 trace）

---

## 关键业务指标监控

除技术指标外，必须监控核心业务指标（与 SLO 关联）。指标由项目按自己的核心链路填写，下表为示例：

| 业务指标 | 监控方式 | 异常阈值示例 |
|---------|---------|------------|
| {核心业务动作}成功率 | 业务埋点 → 指标 | < 99% 持续 5 分钟 |
| 消息投递延迟 | 消息队列指标 | P99 > 10s |
| 核心接口可用率 | 主动探测（Synthetic Monitoring）| < 99.9% |

---

## 可选做法：各语言指标上报示例

```go
// Go - Prometheus 客户端
import "github.com/prometheus/client_golang/prometheus"

var httpRequestDuration = prometheus.NewHistogramVec(
    prometheus.HistogramOpts{
        Name:    "http_request_duration_seconds",
        Buckets: prometheus.DefBuckets,
    },
    []string{"method", "path", "status"},
)
```

```java
// Java - Micrometer（与 Spring Boot 集成）
@Autowired MeterRegistry registry;

Timer.Sample sample = Timer.start(registry);
// ... 业务逻辑
sample.stop(registry.timer("order.create.duration",
    "status", success ? "success" : "failure"));
```

```python
# Python - prometheus_client
from prometheus_client import Histogram, Counter
REQUEST_TIME = Histogram('request_duration_seconds', 
                         'Request duration', ['method', 'endpoint'])
```

## Related

- [高可用设计规范](../architecture/high-availability.md)（SLI/SLO/SLA 定义，四黄金信号）
- [日志规范](../coding/logging.md)（结构化日志格式）
- [故障响应规范](incident-response.md)
