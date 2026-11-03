# 缓存设计规范

> **主标准**：[Microsoft Azure Architecture Center - Caching Best Practices](https://learn.microsoft.com/azure/architecture/best-practices/caching)
> **副标准1**：[Redis 官方文档 - Key Eviction](https://redis.io/docs/latest/develop/reference/eviction/)（Redis 淘汰策略）
> **副标准2**：[Caffeine Wiki](https://github.com/ben-manes/caffeine/wiki)（进程内缓存 W-TinyLFU 算法）
> **副标准3**：[Martin Fowler - P of EAA](https://martinfowler.com/eaaCatalog/)（Cache-Aside 等模式溯源）

---

## 何时引入缓存

引入缓存前先确认以下场景：

| 场景 | 适合缓存 |
|------|---------|
| 读多写少、数据变化不频繁 | ✅ |
| 计算成本高、结果可复用 | ✅ |
| 数据库查询热点（同一查询频繁执行）| ✅ |
| 数据实时性要求极高（金融交易、库存扣减）| ❌ |
| 写多读少 | ❌（命中率低，收益小）|

【警告】缓存是复杂度的来源。先用数据库索引和查询优化，再考虑缓存。引入缓存前必须明确：缓存的是什么数据、命中率预期是多少、失效策略是什么。

---

## 缓存类型选型（Azure 主标准）

Azure 架构中心将缓存分为两类（Private Cache vs Shared Cache）：

| 维度 | 进程内缓存（Private Cache）| 分布式缓存（Shared Cache）|
|------|--------------------------|------------------------|
| 存储位置 | 应用进程内存 | 独立缓存服务（Redis 等）|
| 访问延迟 | 纳秒级（无网络）| 毫秒级（含网络）|
| 容量上限 | 受进程内存限制（通常 MB 级）| 可扩展（GB 级）|
| 跨实例共享 | ❌ 每个实例独立 | ✅ 所有实例共享 |
| 一致性 | 多实例时难以保证 | 统一数据源，一致性易控 |
| 适用场景 | 单实例、高频读、配置数据 | 多实例、会话、分布式锁 |

**决策规则：**
- 单实例部署 → 进程内缓存足够
- 多实例部署 + 数据需跨实例一致 → 必须用分布式缓存
- 对延迟极度敏感 + 数据量小 → 进程内缓存（L1）+ 分布式缓存（L2）双层架构

---

## 进程内缓存设计

### 适用场景

- 配置数据、字典表、枚举值（读多写极少）
- 单实例服务的热点数据
- 作为分布式缓存的 L1 层，降低 Redis 压力

### 淘汰策略选型

进程内缓存的淘汰策略决定内存满时踢掉哪些数据：

| 策略 | 算法 | 适用场景 |
|------|------|---------|
| **W-TinyLFU**（推荐）| 综合频率 + 近期访问，接近最优命中率 | 大多数场景，Caffeine 默认 |
| **LRU**（最近最少使用）| 淘汰最久未访问的 | 访问模式有明显时间局部性 |
| **LFU**（最不常用）| 淘汰访问频率最低的 | 访问分布稳定，少数热点数据 |

> **W-TinyLFU 是目前学术和工业界公认命中率最高的进程内缓存算法**（Caffeine 论文）。

### 容量设计原则

【必须】根据**内存预算**设置最大条目数，而非按条目数估算内存：

```
# 先确定内存预算（如不超过 JVM 堆的 10%）
maxMemory = jvmHeap * 10%

# 根据单条 Value 平均大小估算容量
maxSize = maxMemory / avgValueSize
```

### 多语言推荐实现

**Java（推荐 Caffeine）：**

```java
// Caffeine：W-TinyLFU + 自动加载 + 写后过期
LoadingCache<String, User> cache = Caffeine.newBuilder()
    .maximumSize(10_000)              // 最大条目数
    .expireAfterWrite(5, TimeUnit.MINUTES)  // 写后 5 分钟过期
    .refreshAfterWrite(1, TimeUnit.MINUTES) // 写后 1 分钟异步刷新
    .build(userId -> db.findUser(userId));  // 缓存未命中时自动加载
```

**Go（推荐 ristretto）：**

```go
// ristretto：基于 TinyLFU，高并发设计
cache, _ := ristretto.NewCache(&ristretto.Config{
    NumCounters: 1e7,    // 频率计数器数量（约 10 倍于 MaxCost）
    MaxCost:     1 << 30, // 最大内存 1GB（按字节计算）
    BufferItems: 64,
})
cache.Set("user:10086", user, 1)     // cost=1
cache.Get("user:10086")
```

**Python（推荐 cachetools）：**

```python
from cachetools import TTLCache, cached

# TTLCache：LRU + TTL，线程不安全，多线程需加锁
cache = TTLCache(maxsize=1000, ttl=300)  # 最多 1000 条，5 分钟过期

@cached(cache)
def get_user(user_id: int) -> User:
    return db.find_user(user_id)
```

**Node.js（推荐 lru-cache）：**

```javascript
import { LRUCache } from 'lru-cache'

const cache = new LRUCache({
  max: 500,             // 最多 500 条
  ttl: 1000 * 60 * 5,  // 5 分钟过期
  allowStale: false,    // 不返回过期值
})

cache.set('user:10086', user)
cache.get('user:10086')
```

**前端（浏览器）：**

```javascript
// 内存变量（页面生命周期内有效）
const memCache = new Map()

// sessionStorage（标签页关闭后清除，约 5MB）
sessionStorage.setItem('config', JSON.stringify(config))

// 注意：前端缓存不适合敏感数据，且无法跨标签页共享
```

### 多实例一致性问题

【必须】多实例部署时，进程内缓存面临失效广播问题：

```
实例 A 更新数据 → 清除了自己的本地缓存
但实例 B、C 的本地缓存仍是旧数据
→ 在下次过期前，读到的是脏数据
```

**处理方案：**

| 方案 | 实现 | 适用 |
|------|------|------|
| 短 TTL | 本地缓存 TTL 设置为 1-5 分钟 | 允许短暂不一致 |
| 消息广播失效 | 写操作后通过 MQ/Redis Pub-Sub 通知其他实例 | 一致性要求较高 |
| 不用本地缓存 | 所有实例直接读 Redis | 严格一致 |

---

## 分布式缓存设计（Redis）

### 读写模式

#### Cache-Aside（旁路缓存）— 大多数业务场景首选

来源：Martin Fowler P of EAA，Redis 官方推荐模式。

```
读：缓存命中 → 返回
    缓存未命中 → 读数据库 → 写入缓存 → 返回

写：先写数据库 → 再删除缓存（不更新缓存）
```

**多语言示例（核心逻辑）：**

```go
// Go
func GetUser(ctx context.Context, id string) (*User, error) {
    val, err := redis.Get(ctx, "user:"+id).Result()
    if err == nil {
        var u User
        json.Unmarshal([]byte(val), &u)
        return &u, nil
    }
    user, _ := db.FindUser(id)
    data, _ := json.Marshal(user)
    redis.Set(ctx, "user:"+id, data, 5*time.Minute)
    return user, nil
}
```

```python
# Python
def get_user(user_id: str) -> User:
    cached = redis.get(f"user:{user_id}")
    if cached:
        return User.from_json(cached)
    user = db.find_user(user_id)
    redis.setex(f"user:{user_id}", 300, user.to_json())
    return user
```

```java
// Java (Spring + Jedis)
public User getUser(String userId) {
    String cached = jedis.get("user:" + userId);
    if (cached != null) return objectMapper.readValue(cached, User.class);
    User user = userRepo.findById(userId);
    jedis.setex("user:" + userId, 300, objectMapper.writeValueAsString(user));
    return user;
}
```

```typescript
// Node.js / TypeScript
async function getUser(userId: string): Promise<User> {
  const cached = await redis.get(`user:${userId}`)
  if (cached) return JSON.parse(cached)
  const user = await db.findUser(userId)
  await redis.setex(`user:${userId}`, 300, JSON.stringify(user))
  return user
}
```

#### Write-Through（直写缓存）

写操作同步更新缓存和数据库。适合读多写少、命中率要求高的场景。

```
写：更新数据库 + 更新缓存（同步进行）
读：直接读缓存（命中率高）
```

缺点：可能缓存大量从未被读取的数据；写入延迟略高。

#### Write-Behind（异步回写）

写操作先写缓存，由后台线程批量写数据库。适合高写入场景（如计数器、实时统计）。

```
写：写缓存 → 标记为 dirty → 后台批量刷到数据库
读：读缓存
```

【注意】缓存故障时 dirty 数据有丢失风险，非特殊高写入场景不建议使用。

#### Refresh-Ahead（提前刷新）

在缓存过期前异步刷新，避免 cache miss 造成的延迟峰值。适合热点数据 + 可预测过期时间的场景。

```
读缓存 → 剩余 TTL < 阈值 → 触发异步刷新（返回当前值）
```

---

### 三大缓存问题及防护

#### 缓存穿透（Cache Penetration）

**问题：** 查询不存在的 Key，每次都穿透到数据库。

**防护：**

1. **空值缓存**：数据库查询返回空时缓存空值（短 TTL，如 60s）

```go
// Go
result, _ := db.Find(key)
if result == nil {
    redis.Set(ctx, key, "NULL_PLACEHOLDER", 60*time.Second)
    return nil
}
```

2. **布隆过滤器（Bloom Filter）**：在缓存前加过滤层，不存在的 Key 直接拒绝（适合 Key 集合固定的场景）

#### 缓存击穿（Cache Stampede）

**问题：** 单个热点 Key 过期瞬间，大量并发请求同时打到数据库。

**防护：**

1. **互斥锁**：Key 过期时只允许一个请求重建缓存，其余请求等待

```go
// Go（singleflight 包，天然防击穿）
var group singleflight.Group
val, _, _ := group.Do(cacheKey, func() (interface{}, error) {
    data := db.Query(key)
    redis.Set(ctx, cacheKey, data, ttl)
    return data, nil
})
```

```java
// Java（基于 Redisson 分布式锁）
RLock lock = redisson.getLock("lock:" + key);
try {
    if (lock.tryLock(3, 10, TimeUnit.SECONDS)) {
        // 双重检查：加锁后再查一次缓存
        String val = jedis.get(key);
        if (val != null) return val;
        String data = db.query(key);
        jedis.setex(key, ttl, data);
        return data;
    }
} finally { lock.unlock(); }
```

2. **逻辑过期**：缓存永不设 TTL，Value 中存逻辑过期时间，后台线程刷新

#### 缓存雪崩（Cache Avalanche）

**问题：** 大量 Key 在同一时刻集中过期，请求全部打到数据库。

**防护：**

1. **TTL 随机抖动（必须）：**

```python
# Python：TTL 基础值加 0~20% 随机偏移
import random
base_ttl = 300
ttl = base_ttl + random.randint(0, int(base_ttl * 0.2))
redis.setex(key, ttl, value)
```

2. **预热缓存**：系统启动/上线前主动加载热点数据

3. **多级缓存**：本地缓存（L1）兜底，Redis 不可用时不直接打到数据库

4. **熔断降级**：Redis 异常时返回默认值或降级数据，不透传到数据库

---

### Key 设计

【必须】Key 格式：`{业务域}:{子域}:{标识符}`，使用冒号分隔

```
✅ user:profile:10086
✅ order:detail:550e8400
✅ product:stock:sku-001
❌ 10086
❌ user_profile_10086
```

【必须】Key 命名集中在常量文件中管理，不在业务代码中散写字符串

---

### TTL 设计

【必须】所有 Key 必须设置 TTL，禁止永久 Key

| 数据类型 | 推荐 TTL |
|---------|---------|
| 用户 Session | 30 分钟（每次活跃操作刷新）|
| 配置 / 字典数据 | 5-30 分钟 |
| 列表查询结果 | 1-5 分钟 |
| 计算成本高的聚合数据 | 10-60 分钟 |
| 空值（防穿透）| 30-60 秒 |

【必须】同批次写入的 Key 必须加随机抖动，防止集中过期：

```
ttl = baseTTL + random(0, baseTTL × 0.2)
```

---

### 淘汰策略（Redis 官方文档）

Redis 提供 8 种常用淘汰策略，通过 `maxmemory-policy` 配置：

| 策略 | 说明 | Redis 官方建议 |
|------|------|--------------|
| `noeviction` | 内存满时返回错误，不淘汰 | ❌ 缓存场景禁用 |
| **`allkeys-lru`** | 淘汰最近最少使用的 Key | ✅ **通用默认首选**（Pareto 定律）|
| `allkeys-lfu` | 淘汰访问频率最低的 Key | 访问分布稳定、热点明确时 |
| `allkeys-random` | 随机淘汰 | 所有 Key 访问频率相近时 |
| `volatile-lru` | 仅对有 TTL 的 Key 做 LRU 淘汰 | 同实例混用缓存和持久数据时 |
| `volatile-lfu` | 仅对有 TTL 的 Key 做 LFU 淘汰 | 同上 |
| `volatile-ttl` | 优先淘汰剩余 TTL 最短的 Key | 业务能精确控制 Key 重要性时 |
| `volatile-random` | 随机淘汰有 TTL 的 Key | 同实例混用场景 |

**选型规则（来自 Redis 官方文档）：**

- 缓存专用实例 → 用 **`allkeys-lru`**（Pareto 原则，小部分数据被频繁访问，这是最常见的情况）
- 访问模式均匀 → 用 `allkeys-random`
- 同一 Redis 实例既做缓存又存持久数据 → 用 `volatile-*` 系列（但更建议拆分实例）

```bash
# redis.conf 配置示例
maxmemory 4gb
maxmemory-policy allkeys-lru
```

---

### 多语言客户端推荐

| 语言 | 推荐客户端 |
|------|----------|
| Go | [go-redis](https://github.com/redis/go-redis) |
| Java | [Lettuce](https://lettuce.io/)（异步）/ [Jedis](https://github.com/redis/jedis)（同步）/ Spring Data Redis |
| Python | [redis-py](https://github.com/redis/redis-py) |
| Node.js | [ioredis](https://github.com/redis/ioredis) |
| PHP | [Predis](https://github.com/predis/predis) |
| Rust | [redis-rs](https://github.com/redis-rs/redis-rs) |

---

## 缓存一致性（修复版）

以下是两种独立的策略，**不能混用**，根据场景选一种：

### 策略 A：先写数据库，后删缓存（推荐，大多数场景）

```
1. 写数据库（成功）
2. 删除缓存
```

**原理：** 写完数据库立刻删缓存，下次读时触发缓存重建，读到最新数据。

**风险：** 写数据库和删缓存之间的极短窗口期内，并发读请求可能读到旧缓存（概率极低）。

**适用：** 对一致性要求中等的业务，如用户资料、内容列表等。

### 策略 B：延迟双删（高一致性场景）

```
1. 先删缓存
2. 写数据库
3. 延迟 500ms 再次删缓存
```

**原理：** 第一次删缓存防止写入期间旧缓存被读；第二次延迟删缓存，清除写入期间被并发请求重建的旧缓存。

**风险：** 延迟期间（500ms）仍可能读到旧缓存；延迟时间需根据业务读写耗时调整。

**适用：** 对一致性要求高，但可接受极短暂不一致的场景（如库存展示、价格展示等）。

**一致性模型选型：**

| 模型 | 实现 | 适用场景 |
|------|------|---------|
| 最终一致 | 策略 A | 大多数业务场景 |
| 读己所写 | 写后强制失效本人缓存 | 用户自己编辑的数据 |
| 强一致 | 不使用缓存 | 金融、库存等强敏感数据 |

---

## 监控要求

【必须】为生产环境缓存配置以下监控：

| 指标 | 告警阈值 | 说明 |
|------|---------|------|
| **命中率** | < 80% 触发告警 | `keyspace_hits / (keyspace_hits + keyspace_misses)`，低命中率说明缓存设计有问题 |
| **内存使用率** | > 80% 触发告警 | 接近 maxmemory 时开始大量驱逐，影响性能 |
| **驱逐率（evicted_keys）** | > 0 持续增长时告警 | 说明内存不足，需扩容或优化 |
| **连接数** | > maxclients × 80% 告警 | 连接池耗尽风险 |
| **命令延迟（P99）** | > 5ms 告警 | Redis 命令应在毫秒级，超时说明有慢操作或网络问题 |

```bash
# Redis 查看命中率
redis-cli INFO stats | grep -E "keyspace_hits|keyspace_misses|evicted_keys"
```

---

## 禁止事项

【禁止】在缓存中存储敏感信息（密码、明文 Token、身份证号等）

【禁止】使用 `KEYS *` 命令扫描所有 Key（全扫描会阻塞 Redis 主线程）

```bash
# ❌ 禁止
KEYS user:*

# ✅ 使用 SCAN 游标迭代，每次只扫描少量 Key，不阻塞
SCAN 0 MATCH user:* COUNT 100
```

【禁止】单个缓存 Value 超过 **10KB**（建议压缩或拆分大 Value）

【禁止】Key 没有 TTL

【禁止】不加锁直接并发重建缓存（缓存击穿）

【禁止】Redis 实例使用 `noeviction` 策略（内存满时会返回错误，直接影响业务）

## Related

- [Redis 使用规范](../middleware/redis.md)
- [高可用设计规范](high-availability.md)
