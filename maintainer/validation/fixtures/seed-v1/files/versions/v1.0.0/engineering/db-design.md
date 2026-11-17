# v1.0.0 数据库设计

## 增量 DDL

```sql
CREATE TABLE slot (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'open',
  UNIQUE KEY uk_date_start (date, start_time)
);

CREATE TABLE booking (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  slot_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_slot (slot_id),
  KEY idx_user (user_id)
);
```

## 回滚 DDL

```sql
DROP TABLE booking;
DROP TABLE slot;
```
