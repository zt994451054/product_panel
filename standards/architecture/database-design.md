# 数据库设计规范

> 参考标准：[MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)、[Percona MySQL Best Practices](https://www.percona.com/resources/technical-presentations/mysql-best-practices)、[Martin Fowler - Evolutionary Database Design](https://martinfowler.com/articles/evodb.html)
>
> 本页以 MySQL/InnoDB 为例，使用其他数据库时按同等原则调整。文中的数值阈值均为参考值，项目可按自身规模调整。

---

## 命名规范

【必须】库名、表名、字段名：小写字母 + 下划线（snake_case），长度建议 ≤ 32 字符（参考值）

【必须】字段命名使用完整英文单词，同一字段在不同表中保持完全一致

```sql
✅ user_profile, order_item, created_at
❌ userProfile, orderItem, createdAt（驼峰）
❌ usr_prof, ord_itm（自造缩写）
```

【推荐】布尔类型字段命名在项目内统一一种风格，两种做法各有取舍：

```sql
-- 做法 A：is_ 前缀，语义直观，SQL 可读性好
is_deleted, is_active
-- 做法 B：不加前缀，形容词/过去分词直接表达状态
deleted, active, enabled
```

做法 A 需注意 ORM 映射到对象布尔属性时可能生成 `isIsDeleted` 之类的 getter，需配置字段映射；做法 B 无此问题。无论选哪种，同一项目内保持一致。

【必须】表名在项目内统一风格：是否带业务前缀（如 `t_` 前缀）、单复数形式，选定一种后保持一致。

【推荐】时间列使用统一后缀，项目内二选一：`created_at / updated_at` 或 `create_time / update_time`（下文必须字段示例用前者，选后者时整体替换）。

【推荐】索引命名：普通索引 `idx_{表名}_{列名}`，唯一索引 `uk_{表名}_{列名}`。

```sql
CREATE INDEX idx_order_user_id ON orders (user_id);
CREATE UNIQUE INDEX uk_users_phone ON users (phone);
```

---

## 表设计

### 必须字段

每张业务表必须包含以下字段：

```sql
id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
```

对涉及用户操作的表，还需加审计字段：

```sql
created_by  BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建人ID',
updated_by  BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '最后修改人ID',
```

### 主键策略

| 策略 | 适用场景 | 注意点 |
|------|---------|--------|
| `AUTO_INCREMENT BIGINT` | 单机/小规模（推荐默认） | 简单高效，有序，对索引友好 |
| 分布式 ID（雪花算法）| 分布式 / 分库分表场景 | 确保单调递增，对页分裂友好 |
| UUID | 跨系统同步/安全敏感（不暴露 ID 规律）| 随机写入导致索引页分裂，性能差，不推荐做主键 |

【必须】主键禁止使用 UUID 作为聚簇索引主键（严重影响插入性能）。

【必须】禁止修改/更新已存在的主键值。

### 字段约束

【必须】所有字段设置为 `NOT NULL`，有默认语义时指定 `DEFAULT`：

```sql
✅ name VARCHAR(64) NOT NULL DEFAULT '' COMMENT '用户名'
✅ status TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态 1-正常 2-禁用'
❌ name VARCHAR(64) COMMENT '用户名'   -- 允许 NULL，查询时需处理 NULL 逻辑
```

时间类型如需允许为空，使用 `DATETIME(3) NULL`，并在 COMMENT 中说明为空的语义（如「未完成时为空」）。

### 字段类型选择

| 数据类型 | 推荐 | 禁用 |
|---------|------|------|
| 状态/类型（枚举）| `TINYINT UNSIGNED` | `ENUM`（扩展困难，迁移成本高）|
| 金额 | `BIGINT`（最小货币单位）或 `DECIMAL(精度,小数位)` | `FLOAT` / `DOUBLE`（浮点误差）|
| IP 地址 | `INT UNSIGNED`（`INET_ATON`）| `VARCHAR(15)` |
| 长文本 | `TEXT`（必要时才用）| 频繁查询的字段不用 TEXT |
| 二进制 | `BLOB`（必要时才用）| 不存图片/文件到数据库 |
| 字符集 | `utf8mb4`（支持 emoji）| `utf8`（不支持 emoji，老版本残留）|

---

## 索引设计

### 索引选择原则

【必须】以下场景必须建立索引：
- WHERE、JOIN ON、ORDER BY 涉及的字段
- 外键字段
- 高频查询的过滤字段（区分度 > 20%）

【必须】以下情况不建立索引：
- 频繁更新的字段（维护成本高，影响写性能）
- 低区分度字段（如 `deleted` 字段只有 0/1）
- 数据量小的表（全表扫描比索引更快）

【推荐】单表索引总数控制在 **5 个**以内（参考值，过多索引拖慢写入）。

### 复合索引

**最左前缀原则：** 复合索引 `(a, b, c)` 可以被以下查询使用：

```sql
WHERE a = 1                     ✅ 使用前缀 a
WHERE a = 1 AND b = 2           ✅ 使用前缀 a, b
WHERE a = 1 AND b = 2 AND c = 3 ✅ 使用全部
WHERE b = 2                     ❌ 不以 a 开头，无法使用
WHERE a = 1 AND c = 3           ✅/❌ 只用到 a，c 跳过 b 失效
```

**设计规则：**
1. 区分度高的字段放前面
2. 等值查询字段放范围查询字段前面
3. ORDER BY 字段与 WHERE 字段顺序对齐

### 覆盖索引

查询字段全在索引中，无需回表（Extra: Using index）：

```sql
-- 为以下查询创建覆盖索引
SELECT name, status FROM users WHERE tenant_id = 100 ORDER BY created_at DESC;

-- 创建复合索引覆盖所有查询字段
CREATE INDEX idx_tenant_created ON users (tenant_id, created_at, name, status);
```

### 用 EXPLAIN 验证索引

【必须】上线前所有慢查询必须用 `EXPLAIN` 验证索引使用情况：

```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 100 AND status = 'PAID';
```

关注字段：
- `type`：`ALL`（全表扫描）→ 需要优化；`ref`/`range`/`const` → 良好
- `key`：实际使用的索引名
- `Extra`：`Using filesort`（需排序）、`Using temporary`（临时表）→ 需优化

---

## 事务与隔离级别

### 四种隔离级别

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 性能 |
|---------|------|-----------|------|------|
| READ UNCOMMITTED | ✅ | ✅ | ✅ | 最高 |
| **READ COMMITTED** | ❌ | ✅ | ✅ | 高 |
| **REPEATABLE READ**（MySQL 默认）| ❌ | ❌ | ❌（Gap Lock）| 中 |
| SERIALIZABLE | ❌ | ❌ | ❌ | 最低 |

【推荐】大多数场景使用 MySQL 默认的 REPEATABLE READ。

【建议】对于高并发读多写少的场景，考虑 READ COMMITTED（减少锁范围）。

### 事务使用规范

【必须】事务必须尽量短，减少锁持有时间：

```
✅ 开启事务 → 执行业务 SQL → 提交/回滚（<100ms）
❌ 开启事务 → 调用外部接口（可能耗时） → 执行 SQL → 提交（事务持有锁过久）
```

【禁止】在事务内调用外部 HTTP 接口、发送 MQ 消息等非数据库操作。

**防止死锁：**
- 多个事务操作同一组资源时，保持相同的加锁顺序
- 设置合理的锁等待超时（`innodb_lock_wait_timeout`，推荐 5-10s）
- 使用 SELECT ... FOR UPDATE 时精确控制范围，避免间隙锁过大

---

## 分库分表决策

**先不要过早分库分表。** 分表会极大增加复杂度，先做以下优化：
1. 索引优化
2. 冷热数据归档
3. 读写分离

**触发分表的信号：**

| 指标 | 参考阈值 |
|------|---------|
| 单表数据量 | > 500 万行且查询性能下降（参考值，与 [扩展性设计规范](scalability.md) 一致）|
| 单表磁盘占用 | > 10GB |
| 写入 QPS | > 数据库 TPS 70% |

**分表策略选择：**

| 策略 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| 按 ID 哈希 | 均匀分布 | 范围查询需全分片 | 用户数据、订单 |
| 按时间分表 | 范围查询友好，归档方便 | 可能冷热不均 | 日志、消息、历史记录 |
| 按业务 ID（如 tenant_id）| 业务隔离清晰 | 可能数据倾斜 | 多租户系统 |

---

## 数据变更规范

【必须】修改/删除数据前必须先执行 SELECT 确认影响范围

【必须】生产数据库变更必须有备份（变更前快照或逻辑备份）

【必须】DDL 操作在业务低峰期执行，超过 100 万行（参考值）的大表使用在线 DDL 工具（如 gh-ost、pt-online-schema-change）

【禁止】使用可视化工具（Navicat 等）直接对生产库执行 DDL

### 零停机迁移（Evolutionary Database Design）

字段/表的变更遵循**扩展-迁移-收缩**三步法，避免停机：

```
1. 扩展阶段：新增字段/表，老代码继续写老字段
2. 迁移阶段：新代码同时写新旧字段，后台任务回填历史数据
3. 收缩阶段：确认旧字段无流量后，废弃旧字段（不立即删除）
   等待至少 2 个发布周期后，再物理删除旧字段
```

【禁止】直接删除字段/重命名字段/修改字段类型（可能导致线上代码运行失败）。

---

## 连接池配置

连接池大小参考公式（来源：HikariCP 文档）：

```
连接数 = 核心数 × 2 + 有效磁盘数
（普通 Web 服务）
```

**参数参考：**

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| maximumPoolSize | CPU 核数 × 2（8~20） | 过大无益，增加争用 |
| minimumIdle | 5 | 空闲连接下限 |
| connectionTimeout | 30s | 获取连接超时 |
| idleTimeout | 10min | 空闲连接回收时间 |
| maxLifetime | 30min | 连接最大生命周期 |

## Related

- [MySQL 使用规范](../middleware/mysql.md)
- [缓存设计规范](cache-design.md)
