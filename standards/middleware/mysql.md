# MySQL 使用规范

> **主标准**：[MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)
> **补充**：[数据库设计规范](../architecture/database-design.md)（Schema 设计、索引设计、事务隔离级别等）

> **说明**：本规范聚焦 MySQL 的**使用侧**（连接配置、查询优化、ORM 最佳实践）。Schema 设计规范请参见数据库设计规范。

---

## 连接池配置

【必须】生产环境使用连接池，禁止每次请求新建连接。

**连接池大小参考公式（来自 HikariCP 文档）：**

```
最优连接数 = 核心数 × 2 + 有效磁盘数
（普通 OLTP Web 服务参考值：8~20）
```

**各语言推荐配置：**

```java
// Java - HikariCP（Spring Boot 默认）
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000   # 等待连接超时 30s
spring.datasource.hikari.idle-timeout=600000         # 空闲连接 10 分钟后关闭
spring.datasource.hikari.max-lifetime=1800000        # 连接最大生命周期 30 分钟
spring.datasource.hikari.pool-name=OrderServicePool  # 便于监控
```

```go
// Go - database/sql
db, _ := sql.Open("mysql", dsn)
db.SetMaxOpenConns(20)         // 最大连接数
db.SetMaxIdleConns(5)          // 最大空闲连接数
db.SetConnMaxLifetime(30 * time.Minute) // 连接最大生命周期
db.SetConnMaxIdleTime(10 * time.Minute) // 空闲连接超时
```

```python
# Python - SQLAlchemy
engine = create_engine(
    DATABASE_URL,
    pool_size=10,           # 连接池大小
    max_overflow=20,        # 超出 pool_size 后最多额外创建的连接数
    pool_timeout=30,        # 等待连接超时
    pool_recycle=1800,      # 30 分钟回收连接（防止 MySQL 8h 超时断开）
    pool_pre_ping=True,     # 使用前 ping 检查连接是否有效
)
```

---

## 慢查询配置与优化

### 开启慢查询日志

```sql
-- 查看当前配置
SHOW VARIABLES LIKE 'slow_query%';
SHOW VARIABLES LIKE 'long_query_time';

-- 开启慢查询（生产建议阈值 1s）
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1;
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';
SET GLOBAL log_queries_not_using_indexes = ON;  -- 记录未使用索引的查询
```

### EXPLAIN 解读

【必须】上线前对核心 SQL 用 EXPLAIN 分析：

```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 10086 ORDER BY created_at DESC LIMIT 20;
```

关键字段含义：

| 字段 | 好的值 | 需要优化 |
|------|--------|---------|
| `type` | `const`、`ref`、`range` | `ALL`（全表扫描）|
| `key` | 显示具体索引名 | `NULL`（未使用索引）|
| `rows` | 越少越好 | 行数远大于实际结果数 |
| `Extra` | `Using index`（覆盖索引）| `Using filesort`、`Using temporary` |

```sql
-- 分析示例结果
+----+-------------+--------+-------+-------------------+---------+------+----------+
| id | select_type | table  | type  | key               | rows    | filtered | Extra |
+----+-------------+--------+-------+-------------------+---------+----------+-------+
|  1 | SIMPLE      | orders | ref   | idx_user_created  | 50      | 100.00   |       |
+----+-------------+--------+-------+-------------------+---------+----------+-------+
-- type=ref（使用索引，良好）
-- key=idx_user_created（命中了联合索引）
-- rows=50（只扫描50行）
```

### 常见 SQL 问题

```sql
-- ❌ 索引失效：WHERE 条件对字段做函数运算
WHERE YEAR(created_at) = 2026
WHERE LEFT(phone, 3) = '138'

-- ✅ 改写为范围查询，索引有效
WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01'
WHERE phone LIKE '138%'

-- ❌ 隐式类型转换（字段是 varchar，传入数字）
WHERE phone = 13800001234   -- phone 是 varchar，触发全表扫描

-- ✅ 类型匹配
WHERE phone = '13800001234'

-- ❌ 深分页（OFFSET 过大，全表扫描）
SELECT * FROM orders ORDER BY id LIMIT 100000, 20

-- ✅ 游标分页
SELECT * FROM orders WHERE id > 100000 ORDER BY id LIMIT 20
```

---

## ORM 使用规范

### 禁止 N+1 查询

```python
# ❌ N+1 问题：1 次查订单 + N 次查用户
orders = db.query(Order).all()
for order in orders:
    user = db.query(User).get(order.user_id)  # N 次查询

# ✅ 预加载（JOIN 一次搞定）
orders = db.query(Order).options(joinedload(Order.user)).all()
```

```java
// ❌ JPA N+1
List<Order> orders = orderRepository.findAll();
for (Order order : orders) {
    String userName = order.getUser().getName();  // 懒加载触发 N 次查询
}

// ✅ 使用 @EntityGraph 或 JPQL JOIN FETCH
@Query("SELECT o FROM Order o LEFT JOIN FETCH o.user WHERE o.status = :status")
List<Order> findByStatusWithUser(@Param("status") String status);
```

### 禁止在循环中执行查询

```go
// ❌
for _, id := range orderIDs {
    order, _ := db.First(&Order{}, id)  // 每次查询一条，N 次 DB 往返
    process(order)
}

// ✅ 批量查询
var orders []Order
db.Where("id IN ?", orderIDs).Find(&orders)
```

### 事务使用

```python
# Python - SQLAlchemy 事务
with db.begin():
    db.execute(update_stock_sql)
    db.execute(create_order_sql)
    # 自动提交，异常自动回滚

# ❌ 在事务内执行外部调用（网络请求）
with db.begin():
    db.execute(update_sql)
    response = requests.post(payment_api)  # 慢！持有锁期间不能做外部调用
```

---

## 读写分离

```go
// Go - 通过不同连接池区分主从
type DBPool struct {
    primary  *sql.DB  // 主库，写操作
    replicas []*sql.DB // 从库，读操作
}

func (p *DBPool) ForWrite() *sql.DB { return p.primary }
func (p *DBPool) ForRead() *sql.DB  { return p.replicas[rand.Intn(len(p.replicas))] }
```

**注意**：主从同步有延迟（通常 < 1s），写后立即读需走主库：

```python
# 写完立即读，走主库
def update_and_read(user_id, new_name):
    db_primary.execute("UPDATE users SET name = %s WHERE id = %s", (new_name, user_id))
    user = db_primary.execute("SELECT * FROM users WHERE id = %s", (user_id,)).first()
    return user  # 确保读到最新数据
```

---

## 多语言 ORM / Driver 推荐

| 语言 | 推荐 | 说明 |
|------|------|------|
| Go | [GORM](https://gorm.io/) / [sqlx](https://github.com/jmoiron/sqlx) | GORM 功能全；sqlx 轻量直接写 SQL |
| Java | Spring Data JPA / MyBatis | JPA 适合标准 CRUD；MyBatis 适合复杂 SQL |
| Python | [SQLAlchemy](https://www.sqlalchemy.org/) | 功能最全，支持 ORM 和原生 SQL |
| Node.js | [Prisma](https://www.prisma.io/) / [TypeORM](https://typeorm.io/) | Prisma 类型安全；TypeORM 功能全 |
| PHP | [Eloquent](https://laravel.com/docs/eloquent)（Laravel）| Laravel 生态 |

## Related

- [数据库设计规范](../architecture/database-design.md)（Schema 设计/索引/分库分表）
- [缓存设计规范](../architecture/cache-design.md)（读写分离/缓存策略）
