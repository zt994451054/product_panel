# 多环境配置说明

## 环境概览

| 环境 | 域名/地址 | 用途 | 部署方式 |
|------|---------|------|---------|
| local | localhost + 连共享 dev | 本地开发（B 混合模式） | 手动启动；详见 [local-env.md](./local-env.md) |
| dev | <!-- 如：https://dev.example.internal --> | 共享开发环境；本地开发时连入 | CI 自动部署 |
| staging | <!-- 如：https://staging.example.com --> | 测试 / 验收 | CI 自动部署 |
| prod | <!-- 如：https://example.com --> | 生产环境 | 手动发布 |

> **本地 vs dev 的关系**：本地不自建基础设施（多工程场景），直接**连接 dev 的 MySQL/Redis/MQ**，通过 per-developer 隔离策略避免数据污染。详见 [local-env.md](./local-env.md) §4。

## 环境差异对照

| 配置项 | local（B 混合） | dev | staging | prod |
|--------|----------------|-----|---------|------|
| API Base URL | http://localhost:<本地端口> | <!-- --> | <!-- --> | <!-- --> |
| 数据库 | dev MySQL（自己 schema `app_dev_$(whoami)`） | dev MySQL（完整实例） | <!-- --> | <!-- --> |
| Redis | dev Redis（自己 key 前缀 `$(whoami):`） | dev Redis | <!-- --> | <!-- --> |
| MQ | dev Kafka（自己 topic 前缀 `$(whoami).`） | dev Kafka | <!-- --> | <!-- --> |
| OSS | dev OSS（自己路径前缀 `dev/$(whoami)/`） | dev OSS | <!-- --> | <!-- --> |
| 短信发送 | Mock（不实际发送） | 沙箱 | 沙箱/真实 | 真实 |
| 日志级别 | debug | info | info | warn |
| 错误详情 | 完整展示 | 完整展示 | 部分展示 | 不展示 |

## 环境变量说明

> 以下列出关键环境变量的说明（不含实际值，实际值在各环境的 .env 文件中）
> 敏感配置不可提交到 git，通过配置中心或密钥管理系统注入
> 本地值的 `$(whoami)` 由启动时 shell 替换

| 变量名 | 说明 | local 示例值 | 非本地示例值 | 是否敏感 |
|--------|------|------------|------------|---------|
| `DATABASE_URL` | 数据库连接字符串 | `mysql://dev_user:xxx@dev-db.internal:3306/app_dev_$(whoami)` | `mysql://user:xxx@prod-db:3306/app` | 是 |
| `REDIS_HOST` | Redis 主机 | `dev-redis.internal` | `prod-redis.internal` | 否 |
| `REDIS_KEY_PREFIX` | Redis key 前缀（混合模式隔离） | `$(whoami):` | `（空）` | 否 |
| `MQ_BROKERS` | MQ broker 地址 | `dev-kafka.internal:9092` | `prod-kafka:9092` | 否 |
| `MQ_TOPIC_PREFIX` | MQ topic 前缀（混合模式隔离） | `$(whoami).` | `（空）` | 否 |
| `JWT_SECRET` | JWT 签名密钥 | 随机字符串 | 随机字符串 | 是 |
| <!-- 如：SMS_API_KEY --> | <!-- 短信服务 API 密钥 --> | Mock | 真实 | 是 |

## 新增环境变量流程

1. 在 `tech-solution.md` 的「配置变更需求」节登记
2. 更新本文件环境变量说明表（**必须包含 local 示例值**）
3. 更新各工程仓库的 `.env.example` 文件
4. 若新变量涉及本地隔离（如新基础设施需要 prefix 机制），同步更新 [local-env.md](./local-env.md) §4
5. 通知相关人员在各环境配置中心更新
