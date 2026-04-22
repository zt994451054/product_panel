# 全量数据表结构(基线)

> 本目录记录产品**当前生效的完整数据库表结构**，是跨版本长期基线。
> 本目录**不**记录历史版本的演进轨迹（那是 `versions/{ver}/engineering/db-design.md` 的职责）。

---

## 与版本内 db-design.md 的分工

| 层级 | 文档 | 性质 | 更新时机 |
|------|------|------|---------|
| 基线 | `engineering/docs/db-schema/full-schema.md` | 全量表结构（当前生效） | 版本发布后合入（SOP-07） |
| 版本 | `versions/{ver}/engineering/db-design.md` | 本版本的增量 DDL | 技术方案阶段（SOP-02） |

**核心规则**：
- **技术方案阶段写增量**：在 `versions/{ver}/engineering/db-design.md` 写本版本新增 / 修改 / 删除的表、字段、索引
- **推进到「已发布」时合入基线**：SOP-07 强制要求把本版本增量合入 `full-schema.md`，保持基线始终反映生产现状
- **读基线**：写任何新增量前，先读 `full-schema.md` 了解现状

---

## 填充来源

### 已有产品迁移（SOP-09 阶段 3.5，首次填充）

选任一路径整理初版 `full-schema.md`：

**路径 A：从生产库导出**（推荐，最准确）
```bash
# MySQL：导出所有表结构（无数据）
mysqldump --no-data --routines --events \
  -u <user> -p <db_name> > schema.sql

# PostgreSQL：
pg_dump --schema-only <db_name> > schema.sql
```
然后把 `schema.sql` 的内容按业务模块分节整理进 `full-schema.md`。

**路径 B：合并 migration 历史**
按时间顺序把所有 migration 文件合并成一份"终态 schema"。适用于 migration 历史可追溯的项目（Prisma / Flyway / Rails ActiveRecord / Django migrations 等）。

**路径 C：从 ORM 定义生成**
```bash
# Prisma
npx prisma migrate diff --from-empty --to-schema-datamodel schema.prisma --script

# SQLAlchemy
alembic upgrade head --sql
```

### 日常版本迭代（SOP-07 发布后合入）

版本发布时，按 `versions/{ver}/engineering/db-design.md` 的变更清单，**逐项**更新 `full-schema.md` 对应模块：
- 新增表 → 新增对应节
- 修改表 → 更新字段表 / 索引 / DDL
- 删除表 → 删除对应节（可在 changelog 追加记录）

---

## 组织方式

`full-schema.md` 按**业务模块**分节（不按字母序），每节结构一致：

```markdown
## 模块：用户中心

### users
**用途**：用户主账号
**字段**：...
**索引**：...
**DDL**：...

### user_profiles
...
```

业务模块划分应与 `foundation/product-arch/overview.md` 的「模块详情」表对齐。

---

## 注意事项

- ❌ **不存敏感数据**（实际值、密码、API 密钥）。本目录只存**结构**
- ❌ **不存迁移脚本**（那是版本内 `db-design.md` 的职责）
- ✅ **ERD 可选**：简单产品可只用字段表；复杂产品建议补一份 Mermaid ERD 放在文件开头
- ✅ **存在即更新**：严禁出现"基线落后于生产"的状态。若发现落后，立即在 `CHANGES.md` 追加修复项
