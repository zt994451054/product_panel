# Redis 使用规范

> **主标准**：[Redis Official Documentation](https://redis.io/docs/)
> **副标准**：[Redis Best Practices](https://redis.io/docs/manual/patterns/)
> **补充**：参见[缓存设计规范](../architecture/cache-design.md)（缓存模式、三大问题、淘汰策略）

---

## 安全基线

【必须】生产环境开启密码认证，密码 ≥ 16 位（含字母、数字、特殊字符）

【必须】禁用危险命令（通过 `rename-command` 重命名）：

```redis
# redis.conf
rename-command KEYS    ""      # 禁用（全量扫描，阻塞）
rename-command FLUSHDB ""      # 禁用（清空数据库）
rename-command FLUSHALL ""     # 禁用（清空所有库）
rename-command CONFIG  ""      # 生产禁用（或改为随机名）
rename-command DEBUG   ""      # 禁用
```

Redis 6+ 推荐用 ACL 限制危险命令，替代 `rename-command`。

【必须】使用 `SCAN` 替代 `KEYS *`：

```bash
# ❌ KEYS * 阻塞主线程，生产禁止
KEYS user:*

# ✅ SCAN 游标迭代，不阻塞
SCAN 0 MATCH user:* COUNT 100
```

【必须】程序必须有重连机制，断线后自动重连（指数退避）

---

## Key 设计规范

【必须】Key 格式：`<业务域>:<子域>:<标识符>`，使用冒号分隔

```
✅ user:profile:10086
✅ order:lock:550e8400
✅ rate:limit:api:create_order:138****5678
❌ 10086（无前缀）
❌ user_profile_10086（下划线）
```

【必须】Key 命名集中在常量文件中管理，禁止在业务代码中散写字符串

【必须】Key 长度建议 ≤ 128 字节，避免使用过长的 Key 消耗内存

【必须】所有 Key 必须设置 TTL，禁止永久 Key（防止内存无限增长）

**集群 Hash Tag**：当多个 Key 需要在同一分片执行 MULTI/EXEC 时，用 `{}` 包裹相同的部分：

```
order:{user:10086}:items   ─┐ 相同 hash tag，落同一分片
order:{user:10086}:count   ─┘

user:profile:10086  ─ 普通 Key，按 hash(整个 key) 分片
```

---

## 数据类型选型指南

| 场景 | 推荐类型 | 说明 |
|------|---------|------|
| 简单缓存（字符串/JSON）| `String` | 最通用，直接存储序列化值 |
| 对象字段独立更新 | `Hash` | 避免每次改一个字段就序列化整个对象 |
| 消息队列 / 最新 N 条 | `List` | LPUSH + LTRIM 实现固定长度列表 |
| 去重 / 标签集合 | `Set` | 成员唯一，支持交并差运算 |
| 排行榜 / 带权重排序 | `Sorted Set (ZSet)` | ZADD + ZRANGE 按分值排序 |
| 统计在线用户 / 签到 | `Bitmap` | 按位存储，极省内存 |
| UV 统计（去重计数）| `HyperLogLog` | 误差 < 1%，内存固定 12KB |
| 发布订阅 | `Pub/Sub` 或 `Stream` | Pub/Sub 无持久化；Stream 有持久化、消费组 |

**Hash vs String 选择：**

```python
# ✅ Hash：对象字段多且经常单独更新
redis.hset("user:10086", mapping={
    "name": "张三",
    "phone": "138****5678",
    "level": "3"
})
redis.hget("user:10086", "level")  # 只读一个字段

# ✅ String：对象字段少或总是整体读写
redis.set("user:10086", json.dumps(user))
redis.get("user:10086")
```

---

## 常用模式实现

### 分布式锁

```python
# Python - 基于 SET NX PX
import redis
import uuid

def acquire_lock(client, key, ttl_ms=5000):
    token = str(uuid.uuid4())
    # SET key token NX PX ttl_ms  ← 原子操作，NX=不存在才设置
    ok = client.set(f"lock:{key}", token, nx=True, px=ttl_ms)
    return token if ok else None

def release_lock(client, key, token):
    # Lua 脚本确保原子性：只有持有者才能释放
    script = """
    if redis.call('GET', KEYS[1]) == ARGV[1] then
        return redis.call('DEL', KEYS[1])
    else
        return 0
    end
    """
    return client.eval(script, 1, f"lock:{key}", token)
```

```go
// Go - go-redis
func acquireLock(ctx context.Context, rdb *redis.Client, key string, ttl time.Duration) (string, bool) {
    token := uuid.New().String()
    ok, _ := rdb.SetNX(ctx, "lock:"+key, token, ttl).Result()
    return token, ok
}

func releaseLock(ctx context.Context, rdb *redis.Client, key, token string) bool {
    script := redis.NewScript(`
        if redis.call("GET", KEYS[1]) == ARGV[1] then
            return redis.call("DEL", KEYS[1])
        end
        return 0
    `)
    result, _ := script.Run(ctx, rdb, []string{"lock:" + key}, token).Int()
    return result == 1
}
```

```java
// Java - Redisson（推荐）
// 不传 leaseTime 时 WatchDog 自动续期；下面传了 leaseTime=10s，到期自动释放，WatchDog 不生效
RLock lock = redisson.getLock("order:lock:" + orderId);
try {
    if (lock.tryLock(3, 10, TimeUnit.SECONDS)) {
        // 执行业务逻辑
    }
} finally {
    if (lock.isHeldByCurrentThread()) {
        lock.unlock();
    }
}
```

### 限流（滑动窗口）

```lua
-- Lua 脚本实现滑动窗口限流
-- KEYS[1]=限流key, ARGV[1]=当前时间戳ms, ARGV[2]=窗口大小ms, ARGV[3]=最大请求数

local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

-- 清除窗口外的旧数据
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
-- 当前窗口内的请求数
local count = redis.call('ZCARD', key)

if count < limit then
    redis.call('ZADD', key, now, now)
    redis.call('PEXPIRE', key, window)
    return 1  -- 允许
else
    return 0  -- 拒绝
end
```

```python
# Python 调用
script = redis.register_script(LUA_SCRIPT)
allowed = script(keys=[f"rate:{user_id}"],
                 args=[int(time.time()*1000), 60000, 100])  # 60s内100次
```

### 排行榜

```python
# 更新分数
redis.zadd("leaderboard:weekly", {user_id: score}, xx=True)  # xx=只更新已有
redis.zincrby("leaderboard:weekly", increment, user_id)       # 增量更新

# 查询 Top 10
top10 = redis.zrevrange("leaderboard:weekly", 0, 9, withscores=True)

# 查询用户排名（从0开始）
rank = redis.zrevrank("leaderboard:weekly", user_id)
```

### 消息发布订阅

**轻量通知（可丢失）用 Pub/Sub：**

```python
# 发布
redis.publish("channel:order:events", json.dumps(event))

# 订阅
pubsub = redis.pubsub()
pubsub.subscribe("channel:order:events")
for message in pubsub.listen():
    if message['type'] == 'message':
        handle(json.loads(message['data']))
```

**需要持久化和消费确认用 Stream：**

```python
# 生产者
redis.xadd("stream:order:events", {"event": json.dumps(event)})

# 消费者组
redis.xgroup_create("stream:order:events", "notification-service", id="$", mkstream=True)
messages = redis.xreadgroup("notification-service", "consumer-1",
                            {"stream:order:events": ">"}, count=10)
# 处理后确认
for stream, msgs in messages:
    for msg_id, data in msgs:
        process(data)
        redis.xack("stream:order:events", "notification-service", msg_id)
```

---

## 批量操作（Pipeline）

网络往返（RTT）是 Redis 性能瓶颈。批量操作用 Pipeline 减少 RTT：

```python
# ❌ 循环执行，每次都有网络往返
for key in keys:
    redis.get(key)   # N 次 RTT

# ✅ Pipeline，一次网络往返
pipe = redis.pipeline()
for key in keys:
    pipe.get(key)
results = pipe.execute()  # 1 次 RTT
```

```go
// Go - pipeline
pipe := rdb.Pipeline()
for _, key := range keys {
    pipe.Get(ctx, key)
}
cmds, _ := pipe.Exec(ctx)
```

---

## 集群模式选型

| 模式 | 可用性 | 水平扩展 | 适用场景 |
|------|--------|---------|---------|
| 单机 | 低 | ❌ | 开发/测试环境 |
| 主从 | 中（主宕机需手动切换）| ❌ | 小规模，读写分离 |
| Sentinel | 高（自动主从切换）| ❌ | 中等规模，高可用 |
| Cluster | 高 | ✅ | 大规模，数据分片 |

---

## 多语言客户端推荐

| 语言 | 推荐客户端 |
|------|----------|
| Go | [go-redis](https://github.com/redis/go-redis)（官方推荐）|
| Java | [Lettuce](https://lettuce.io/)（异步）/ [Redisson](https://redisson.org/)（分布式工具丰富）|
| Python | [redis-py](https://github.com/redis/redis-py)（官方）|
| Node.js | [ioredis](https://github.com/redis/ioredis)（功能全）|

## Related

- [缓存设计规范](../architecture/cache-design.md)（缓存模式/三大问题/淘汰策略）
