# 高可用设计规范

> **主标准**：[Google SRE Book](https://sre.google/sre-book/table-of-contents/)（SLI/SLO/SLA/Error Budget/四黄金信号）
> **副标准1**：[AWS Well-Architected - Reliability Pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/)（部署架构/多AZ/备份恢复）
> **副标准2**：[Resilience4j](https://resilience4j.readme.io/)（熔断/重试/限流的实现标准和参数规范）
> **副标准3**：[Principles of Chaos Engineering](https://principlesofchaos.org/)（混沌工程）

---

## 可用性基础定义（Google SRE）

### SLI / SLO / SLA

| 术语 | 全称 | 说明 |
|------|------|------|
| **SLI** | Service Level Indicator | 可用性的度量指标，如「成功请求率」「P99 延迟」 |
| **SLO** | Service Level Objective | 对 SLI 的目标值，如「成功率 ≥ 99.9%」 |
| **SLA** | Service Level Agreement | 对外承诺的合同，违约须赔偿，通常 ≤ SLO |

**核心原则：** 先定义 SLO，再根据 SLO 设计架构。不要在没有可用性目标的情况下设计高可用。

### 可用性数字参考

| SLO | 每年允许停机 | 每月允许停机 | 典型适用场景 |
|-----|-----------|------------|------------|
| 99%（两个九）| 87.6 小时 | 7.3 小时 | 内部工具 |
| 99.9%（三个九）| 8.76 小时 | 43.8 分钟 | 大多数内部服务 |
| 99.95% | 4.38 小时 | 21.9 分钟 | 核心用户端服务 |
| 99.99%（四个九）| 52.6 分钟 | 4.4 分钟 | 支付、核心交易 |

【建议】内部服务目标 99.9%；核心用户端服务目标 99.95%~99.99%。追求五个九在大多数业务中成本极高，需谨慎决策。

### 错误预算（Error Budget）

```
错误预算 = 1 - SLO
示例：SLO = 99.9%，错误预算 = 0.1% = 每月 43.8 分钟停机时间
```

错误预算耗尽 → 停止发布新功能，专注稳定性修复，直到下个统计周期。

### 四个黄金信号（Google SRE）

【必须】核心服务必须对以下四个信号配置监控告警：

| 信号 | 说明 | 示例监控指标 |
|------|------|------------|
| **延迟（Latency）** | 请求响应时间（区分成功/失败）| P50 / P95 / P99 |
| **流量（Traffic）** | 系统负载 | RPS、QPS、每秒消息数 |
| **错误（Errors）** | 错误率 | 5xx 比率、业务错误率 |
| **饱和度（Saturation）** | 资源使用率 | CPU / 内存 / 连接池利用率 |

---

## RTO 和 RPO（AWS Well-Architected）

| 术语 | 含义 | 说明 |
|------|------|------|
| **RTO**（Recovery Time Objective）| 最大可接受停机时长 | 故障发生到服务恢复的时间上限 |
| **RPO**（Recovery Point Objective）| 最大可接受数据丢失量 | 故障发生到最近可恢复点的时间差 |

【必须】设计高可用方案前先明确 RTO 和 RPO 目标，不同目标对应不同的架构代价。

---

## 弹性设计模式（Resilience4j）

### 前提：幂等性

【必须】以下所有重试/熔断/降级模式的前提是：**操作必须是幂等的**。

非幂等操作（如扣款、发送消息）被重试时会导致重复执行。实现幂等的方式参考 API 设计规范的 `requestId` 机制。

```
✅ 幂等操作：查询、GET 请求、使用 requestId 的创建操作
❌ 非幂等操作：未加幂等控制的扣款、计数器递增、发送通知
```

---

### 熔断器（Circuit Breaker）

防止故障扩散：下游连续失败超过阈值时自动熔断，不再发送请求，让下游有机会恢复。

**状态机：**

```
Closed（正常）
  → 失败率 ≥ 阈值
Open（熔断，拒绝所有请求）
  → 冷却时间到期
Half-Open（探测，允许少量请求）
  → 成功 → Closed
  → 失败 → Open
```

**Resilience4j 参数参考：**

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `failureRateThreshold` | 50% | 失败率阈值，超过则开启熔断 |
| `slowCallRateThreshold` | 100% | 慢调用率阈值（慢调用也计入失败）|
| `slidingWindowSize` | 100 次 | 统计窗口大小 |
| `waitDurationInOpenState` | 60s | Open 状态持续时间 |
| `permittedCallsInHalfOpenState` | 10 次 | Half-Open 探测请求数 |

**多语言实现推荐：**

```java
// Java - Resilience4j（推荐）
CircuitBreakerConfig config = CircuitBreakerConfig.custom()
    .failureRateThreshold(50)
    .waitDurationInOpenState(Duration.ofSeconds(60))
    .slidingWindowSize(100)
    .build();
CircuitBreaker cb = CircuitBreaker.of("paymentService", config);

String result = cb.executeSupplier(() -> paymentService.charge(amount));
```

```go
// Go - failsafe-go
cb := circuitbreaker.Builder[string]().
    WithFailureThreshold(5, 10).          // 10次中失败5次触发
    WithDelay(60 * time.Second).           // 熔断持续60秒
    WithSuccessThreshold(3).              // 3次成功后恢复
    Build()

result, err := failsafe.Get(func() (string, error) {
    return paymentService.Charge(amount)
}, cb)
```

```python
# Python - pybreaker
cb = pybreaker.CircuitBreaker(
    fail_max=5,          # 连续失败5次触发
    reset_timeout=60,    # 60秒后进入 Half-Open
)

@cb
def charge_payment(amount):
    return payment_service.charge(amount)
```

```typescript
// Node.js - opossum
const cb = new CircuitBreaker(paymentService.charge, {
  failureThreshold: 50,   // 失败率 50% 触发
  successThreshold: 5,    // 5次成功后关闭
  timeout: 3000,          // 单次调用超时
  resetTimeout: 60000,    // 60s 后尝试恢复
})

const result = await cb.fire(amount)
```

---

### 舱壁（Bulkhead）

隔离故障：不同服务使用独立资源池，防止一个服务拖垮整体。

```
❌ 所有服务共用一个线程池 → 服务 A 慢 → 线程全被占满 → 服务 B/C 也不可用
✅ 每个服务独立线程池 → 服务 A 慢 → 只影响服务 A 的线程池
```

**实现方式选型：**

| 方式 | 隔离维度 | 适用场景 |
|------|---------|---------|
| 线程池隔离 | 每个依赖独立线程池 | 调用耗时不均、希望强隔离（Resilience4j ThreadPoolBulkhead）|
| 信号量隔离 | 限制最大并发数 | 调用快、不需要强隔离（轻量，Resilience4j SemaphoreBulkhead）|
| 连接池隔离 | 数据库/Redis 连接池按服务划分 | 多个服务共用同一数据库时 |

```java
// Java - Resilience4j Bulkhead
BulkheadConfig config = BulkheadConfig.custom()
    .maxConcurrentCalls(25)          // 最大并发数
    .maxWaitDuration(Duration.ofMillis(100))
    .build();
Bulkhead bulkhead = Bulkhead.of("paymentBulkhead", config);

String result = bulkhead.executeSupplier(() -> paymentService.charge(amount));
```

---

### 超时（Timeout）

【必须】所有网络调用必须设置超时，禁止无限等待：

| 调用类型 | 推荐超时 |
|---------|---------|
| 内部微服务调用 | 500ms ~ 2s |
| 数据库查询 | 3s ~ 10s |
| Redis 操作 | 200ms ~ 500ms |
| 外部第三方 API | 5s ~ 30s（按对方 SLA 决定）|

**级联超时原则：** 每层超时必须比上层短，防止下层请求孤儿化：

```
用户请求（30s）
  └─ API 网关（25s）
       └─ 服务 A（20s）
            └─ 服务 B（10s）
                 └─ 数据库（5s）
```

---

### 重试（Retry with Exponential Backoff + Jitter）

【必须】重试必须满足：
1. **操作幂等**（见前提章节）
2. **指数退避 + 随机抖动**，禁止固定间隔重试
3. **总重试次数不超过 3 次**

```
等待时间 = min(cap, base × 2^attempt) + random(0, base)
示例（base=1s, cap=30s）：
  第1次：~1-2s 后重试
  第2次：~2-4s 后重试
  第3次：~4-8s 后重试
```

**可重试 vs 不可重试：**

| 场景 | 可重试 |
|------|--------|
| 网络超时、连接断开 | ✅ |
| 429 Too Many Requests | ✅（等待后重试）|
| 503 Service Unavailable | ✅ |
| 500 Internal Server Error（幂等操作）| ✅ |
| 400/422 参数错误 | ❌（重试无意义）|
| 401/403 认证/权限错误 | ❌（重试无意义）|
| 非幂等的 500 错误 | ❌（可能重复执行）|

**多语言实现：**

```java
// Java - Resilience4j Retry
RetryConfig config = RetryConfig.custom()
    .maxAttempts(3)
    .waitDuration(Duration.ofMillis(500))
    .intervalFunction(IntervalFunction.ofExponentialRandomBackoff(
        Duration.ofMillis(500), 2.0, 0.5))  // 指数退避 + 50% 抖动
    .retryOnException(e -> e instanceof TimeoutException)
    .build();

Retry retry = Retry.of("paymentRetry", config);
result = retry.executeSupplier(() -> paymentService.charge(amount));
```

```go
// Go - avast/retry-go
err := retry.Do(
    func() error { return paymentService.Charge(amount) },
    retry.Attempts(3),
    retry.DelayType(retry.BackOffDelay),   // 指数退避
    retry.Delay(500 * time.Millisecond),
    retry.MaxJitter(200 * time.Millisecond), // 随机抖动
    retry.RetryIf(func(err error) bool {
        return errors.Is(err, ErrTimeout)   // 只重试超时错误
    }),
)
```

```python
# Python - tenacity
from tenacity import retry, stop_after_attempt, wait_exponential_jitter, retry_if_exception_type

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential_jitter(initial=0.5, max=30, jitter=0.5),
    retry=retry_if_exception_type(TimeoutError)
)
def charge_payment(amount):
    return payment_service.charge(amount)
```

```typescript
// Node.js - p-retry
import pRetry, { AbortError } from 'p-retry'

const result = await pRetry(
  async () => {
    const res = await paymentService.charge(amount)
    if (res.status === 400) throw new AbortError('Bad request, no retry')
    return res
  },
  {
    retries: 3,
    minTimeout: 500,
    factor: 2,           // 指数系数
    randomize: true,     // 随机抖动
  }
)
```

---

### 降级（Graceful Degradation）

当依赖不可用时，返回降级结果而非直接报错：

| 策略 | 适用场景 |
|------|---------|
| 返回默认值 | 推荐列表、配置数据 |
| 返回缓存旧值 | 可接受短暂过期的数据 |
| 功能裁剪 | 搜索失效时降级为分类浏览 |
| 静态兜底 | 促销活动页面 |

---

## 负载均衡策略

【必须】多实例部署时通过负载均衡分发流量：

| 算法 | 特点 | 适用场景 |
|------|------|---------|
| **轮询（Round Robin）** | 请求平均分发，简单 | 实例性能均等时的默认选择 |
| **最少连接（Least Connections）**| 优先分发给当前连接数最少的实例 | 请求处理时间差异大时 |
| **加权轮询（Weighted）** | 按实例权重分配流量 | 实例性能不均等（如混合机型）|
| **一致性哈希（Consistent Hashing）**| 同一客户端或资源路由到同一实例 | 需要会话亲和性、本地缓存复用 |
| **随机（Random）** | 随机选择实例 | 实例完全同质时简单有效 |

**多语言客户端侧负载均衡：**

| 场景 | 实现 |
|------|------|
| gRPC 客户端 | 内置 `round_robin` / `grpclb` |
| HTTP 客户端（Go）| `net/http` + DNS 轮询 / 自定义 Transport |
| Spring Cloud | Spring Cloud LoadBalancer |
| 服务网格 | Istio / Envoy（推荐，与语言无关）|

---

## 健康检查

【推荐】服务暴露两类健康检查，区分"进程活着"与"能处理请求"（路径名由项目约定，下表的 `/health/live`、`/health/ready` 仅为示例；使用 K8s 等平台时对应存活/就绪探针）：

| 示例端点 | 探针类型 | 检查内容 |
|------|---------|---------|
| `GET /health/live` | 存活探针（Liveness）| 进程是否活着（只检查本进程状态）|
| `GET /health/ready` | 就绪探针（Readiness）| 是否能处理请求（含依赖连通性检查）|

【推荐】无论部署在何种平台，都要让负载均衡或进程管理方有办法判断实例是否可接收流量；就绪检查只纳入关键依赖，避免因非关键依赖抖动摘除全部实例。

下例沿用 [API 设计规范](api-design.md) 推荐的统一信封结构，采用其他响应风格的项目按自身风格返回即可：

```json
// /health/ready 响应示例（统一信封风格）
{
  "code": "SUCCESS",
  "message": "服务就绪",
  "data": {
    "status": "healthy",
    "checks": {
      "database": {"status": "healthy", "latency": "5ms"},
      "redis":    {"status": "healthy", "latency": "1ms"},
      "queue":    {"status": "degraded", "message": "high latency: 200ms"}
    }
  },
  "requestId": "...",
  "timestamp": "2026-04-10T10:00:00+08:00"
}

// 服务不健康时
{
  "code": "FAILED_PRECONDITION",
  "message": "服务未就绪：数据库连接失败",
  "data": {
    "status": "unhealthy",
    "checks": {
      "database": {"status": "unhealthy", "message": "connection refused"}
    }
  },
  "requestId": "...",
  "timestamp": "..."
}
```

---

## 部署架构要求（AWS Well-Architected）

下列做法按服务的 SLO / RTO / RPO 选择，具体的部署与发布实现交给项目的运维规范（见 [CI/CD 流水线规范](../deployment/ci-cd.md)、[部署规范](../deployment/deployment.md)）：

| 选项 | 适用情形 |
|------|---------|
| 核心服务多实例部署 | 需要抵御单实例故障时（对可用性有要求的服务基本都需要；单实例部署须明确接受的停机时间）|
| 跨可用区（AZ）或跨机房部署 | SLO 要求抵御单机房/单可用区故障时 |
| 滚动发布或蓝绿部署 | 发布期间不允许中断服务时 |

采用跨 AZ 部署时的流量分配原则：
- 同 AZ 优先路由（降低延迟和跨 AZ 流量成本）
- 异常 AZ 自动从流量池摘除

---

## 限流保护

【必须】在入口层（网关、反向代理或应用中间件）对入口流量限流，防止流量洪峰压垮下游：

| 算法 | 特点 | 适用场景 |
|------|------|---------|
| **令牌桶（Token Bucket）**| 允许突发流量 | API 接口限流（推荐）|
| **漏桶（Leaky Bucket）** | 平滑输出，不允许突发 | 下游保护 |
| **滑动窗口计数器** | 精准计数 | 精确 QPS 限制 |

**多语言限流实现：**

```go
// Go - golang.org/x/time/rate（令牌桶）
limiter := rate.NewLimiter(rate.Every(time.Second/100), 10)  // 100 QPS，桶容量 10
if !limiter.Allow() {
    return errors.New("rate limit exceeded")
}
```

```java
// Java - Resilience4j RateLimiter
RateLimiterConfig config = RateLimiterConfig.custom()
    .limitForPeriod(100)                    // 每周期 100 次
    .limitRefreshPeriod(Duration.ofSeconds(1))
    .timeoutDuration(Duration.ofMillis(25)) // 等待令牌的超时
    .build();
RateLimiter rateLimiter = RateLimiter.of("api", config);
```

```python
# Python - limits
from limits import storage, strategies
memory_storage = storage.MemoryStorage()
limiter = strategies.MovingWindowRateLimiter(memory_storage)
rate = limits.parse("100 per second")
if not limiter.hit(rate, "user_id", request_path):
    raise RateLimitExceeded()
```

---

## 混沌工程（Chaos Engineering Principles）

通过主动注入故障验证系统高可用能力：

1. **定义稳态**：描述系统在正常状态下的可观测行为（如「成功率 > 99.9%」）
2. **提出假设**：假设注入故障后系统能维持稳态
3. **注入故障**：停止实例、注入延迟、模拟网络分区、耗尽资源等
4. **观察偏差**：若偏离稳态则发现了高可用隐患
5. **修复并重验**：修复问题后重新实验

**工具推荐：**

| 工具 | 场景 |
|------|------|
| [Chaos Monkey](https://github.com/Netflix/chaosmonkey) | 随机终止实例（Netflix 开源）|
| [Chaos Toolkit](https://chaostoolkit.org/) | 声明式混沌实验，多云支持 |
| [Litmus](https://litmuschaos.io/) | Kubernetes 混沌工程 |

【可选】对核心链路定期进行混沌实验，频率由项目按风险和成本决定。

## Related

- [缓存设计规范](cache-design.md)
- [CI/CD 流水线规范](../deployment/ci-cd.md)
- [监控告警规范](../deployment/monitoring.md)
- [部署规范](../deployment/deployment.md)
