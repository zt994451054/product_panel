# 性能测试规范

> **主标准**：[Google SRE - Load Testing](https://sre.google/sre-book/load-testing/)
> **副标准1**：[k6 Documentation](https://k6.io/docs/)（推荐性能测试工具）
> **副标准2**：[DORA Metrics](https://dora.dev/)（变更失败率与 MTTR 关联）

---

## 性能测试类型

| 类型 | 目标 | 场景 |
|------|------|------|
| **基准测试（Benchmark）**| 单接口基础性能数据 | 开发阶段，建立性能基线 |
| **负载测试（Load Test）**| 验证正常流量下的性能 | 上线前验证 SLO 达标 |
| **压力测试（Stress Test）**| 找到系统极限，观察降级行为 | 容量规划，找瓶颈 |
| **峰值测试（Spike Test）**| 瞬间流量激增的响应 | 秒杀、促销活动前 |
| **浸泡测试（Soak Test）**| 长时间运行的稳定性 | 内存泄漏、连接池耗尽排查 |

---

## 性能标准（SLO 驱动）

**性能测试的目标是验证 SLO，而非追求极限数字。**

在运行性能测试前，先明确性能 SLO。目标由项目在 requirements.md 的「非功能需求」中定义，再逐条写入 test-plan.md 的「非功能需求测试目标」。

下表和本页脚本里的数值都是示例默认值，可修改：

| 服务类型 | P99 延迟 | 错误率 | 吞吐量 |
|---------|---------|--------|--------|
| 核心 API（下单、支付）| < 500ms | < 0.1% | 按业务峰值 × 1.5 |
| 查询类 API | < 200ms | < 0.1% | 同上 |
| 批量处理 | < 5s | < 1% | 按数据量估算 |

---

## 推荐工具：k6

k6 是现代化的性能测试工具，JavaScript 编写测试脚本，与 CI/CD 无缝集成：

```javascript
// 基础负载测试脚本（k6）
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const errorRate = new Rate('error_rate')
const orderLatency = new Trend('order_latency')

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // 2分钟内从0爬升到100并发
    { duration: '5m', target: 100 },   // 保持100并发压测5分钟
    { duration: '2m', target: 0 },     // 2分钟内降到0
  ],
  thresholds: {
    http_req_duration: ['p(99)<500'],   // P99 < 500ms（示例默认值）
    error_rate: ['rate<0.001'],         // 错误率 < 0.1%（示例默认值）
    http_req_failed: ['rate<0.001'],
  },
}

export default function () {
  const payload = JSON.stringify({ userId: 'u-001', amount: 12800 })
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.TEST_TOKEN}`,
    },
  }

  const res = http.post('https://api.staging.example.com/v1/orders', payload, params)

  const success = check(res, {
    'status is 201': (r) => r.status === 201,
    // 业务字段按项目响应格式断言；延迟由上面的 thresholds 判定
    'has orderId': (r) => r.json('orderId') !== undefined,
  })

  errorRate.add(!success)
  orderLatency.add(res.timings.duration)

  sleep(1)
}
```

**运行：**
```bash
k6 run --vus 100 --duration 5m load-test.js
k6 run --env TEST_TOKEN=xxx load-test.js
```

---

## 各类型测试脚本示例

### 峰值测试（Spike Test）

```javascript
export const options = {
  stages: [
    { duration: '10s', target: 10 },    // 正常流量
    { duration: '1m',  target: 500 },   // 突然激增到 500（模拟秒杀）
    { duration: '10s', target: 10 },    // 回落到正常
    { duration: '3m',  target: 10 },    // 观察恢复情况
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(99)<500'],
    http_req_failed: ['rate<0.001'],
  },
}
```

### 浸泡测试（Soak Test，检测内存泄漏）

```javascript
export const options = {
  stages: [
    { duration: '5m',  target: 50 },    // 爬升
    { duration: '4h',  target: 50 },    // 保持 4 小时（观察内存变化）
    { duration: '5m',  target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(99)<500'],
  },
}
```

---

## 其他工具对比

| 工具 | 语言 | 适用场景 |
|------|------|---------|
| **k6** | JavaScript | CI 集成、现代化 API 测试（推荐）|
| **Gatling** | Scala/Java DSL | 复杂场景、详细报告、JVM 生态 |
| **Apache JMeter** | GUI/XML | 传统场景、图形化配置 |
| **wrk / hey** | 命令行 | 快速基准测试（单接口）|
| `go test -bench` | Go | Go 函数级别的微基准测试 |

---

## 性能测试流程

```
1. 定义 SLO 目标（P99 延迟、错误率、吞吐量）
         ↓
2. 确定测试场景（正常负载 / 峰值 / 浸泡）
         ↓
3. 准备测试环境（独立于生产、配置接近生产）
         ↓
4. 建立性能基线（第一次测试记录当前水平）
         ↓
5. 执行测试，收集四个黄金信号（延迟/流量/错误/饱和度）
         ↓
6. 分析结果：是否达到 SLO？瓶颈在哪里？
         ↓
7. 优化并回归测试（与基线对比）
```

---

## 微基准测试（Benchmark）

用于测量单个函数的性能，指导优化：

```go
// Go - 内置 Benchmark
func BenchmarkCalculateDiscount(b *testing.B) {
    user := &User{Level: "VIP", PurchaseAmount: 1000}
    calc := NewDiscountCalculator()

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        calc.Calculate(user)
    }
}
// 运行：go test -bench=. -benchmem ./...
// 输出：BenchmarkCalculateDiscount-8  5000000  312 ns/op  0 B/op  0 allocs/op
```

```python
# Python - pytest-benchmark
def test_calculate_discount_benchmark(benchmark):
    user = User(level="VIP", purchase_amount=1000)
    calc = DiscountCalculator()

    result = benchmark(calc.calculate, user)
    assert result == 0.2
```

---

## 性能问题排查指引

| 现象 | 可能原因 | 排查方向 |
|------|---------|---------|
| P99 高但 P50 正常 | 长尾延迟，GC/慢查询 | 查慢查询日志，分析 GC 日志 |
| 错误率在高并发时飙升 | 连接池耗尽、限流触发 | 监控连接池使用率 |
| 吞吐量到达上限平台 | CPU/带宽饱和 | 分析 CPU profiling |
| 浸泡测试后内存持续增长 | 内存泄漏 | Heap dump 分析 |

---

## 禁止事项

【禁止】默认不在生产环境运行压力测试，使用独立于生产、配置接近生产的环境；项目具备流量隔离或影子流量能力时，可在测试计划中另行说明

【禁止】压测时不设置 `thresholds`（测试结果无法自动判断是否通过）

【禁止】以"跑了多少 QPS"为目标，而非"是否达到 SLO"

## Related

- [测试策略总览](testing-strategy.md)
- [监控告警规范](../deployment/monitoring.md)（SLO 定义）
- [高可用设计规范](../architecture/high-availability.md)（SLI/SLO/SLA）
