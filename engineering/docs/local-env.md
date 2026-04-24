# 本地开发环境档案

> 本文件固化本产品的**本地开发模式**，供所有开发者参照，让"多电脑差异""多工程启动""新人上手"三件事可预期。
>
> **驱动面板硬性规定**：多工程 / 微服务产品须采用 **B 混合模式**（本地服务 + 共享 dev 基础设施），
> 理由与取舍见 §1。
> **单工程产品**（monolith / 纯前端 / 扩展程序）：本文件头标注 "N/A，采用全本地 docker compose 模式" 即可，其余章节可留空，启动命令直接看 `local-setup.md`。

---

## 本文件 vs 工程 README：边界

**本文件只承载跨工程产品级约定** —— 这些信息散到各工程 README 会产生 N 份副本，改动一次要改 N 处：

- §1 本地模式声明（B 混合 / 全本地）
- §2 端口分配表（工程间互相避让）
- §3 基础设施依赖矩阵（跨工程聚合 + 变更同步规约）
- §4 开发者隔离策略（产品级统一规则，所有代码按同一规则拼 schema / key / topic）
- §5 dev 主机名清单 + `.env.example` 约定（所有工程用同一套）

**单工程内启动细节留在各工程仓库 README**：

- 依赖安装命令（`pnpm install` / `go mod tidy` / `pip install -r requirements.txt`）
- 启动命令（`pnpm dev` / `go run main.go` / `python manage.py runserver`）
- 工程特有环境变量（业务配置、feature flag 开关）
- 工程内目录结构 / 单元测试如何跑

**"开箱即启"的实现（不依赖本文件）**：

- 每个工程的 `.env.example` **默认填好 dev 连接串**（主机名符合 §5、隔离前缀符合 §4）
- 每个工程的 `README.md` 写好依赖安装 + 启动命令
- 新人 clone 工程 → `cp .env.example .env.local` 改 `${USER}` → 按工程 README 启动 ✅

> 本文件不会让项目"变复杂"——它只是把**本来就得集中约定的 5 件事**写一份放在一处，
> 免得散落在 10 个工程 README 里一改改 10 处。

---

## 1. 本地模式声明

**本产品本地开发模式**：<!-- B 混合模式 | N/A（单工程，全本地） -->

### B 混合模式的工作方式

- 本地只启动**正在开发的 1-2 个服务**
- 基础设施（DB / Redis / MQ / 搜索等）→ 连**共享 dev 环境**
- 其他不开发的微服务 → 连 dev 环境对应实例
- 本地修改代码 → 本地重启服务 → 接口打到共享 dev 基础设施

### 为什么硬性 B 模式（多工程场景）

| 考量 | 全本地（不推荐） | B 混合（本方案） |
|-----|-----------------|----------------|
| 10+ 微服务启动 | MacBook 内存耗尽 | 只起 1-2 个，无压力 |
| 新人上手 | 装 Docker → 拉镜像 → 改 compose → 启动 10 分钟 | 配 .env.local 即可 |
| 基础数据一致 | 每人各自维护，易分叉 | dev 维护一份，所有人共享 |
| 断网可干活 | ✅ | ❌（网络依赖） |
| 数据安全 | ✅（本地自有） | ⚠️ dev 须脱敏 |

核心风险 —— **多人共享 dev 数据库数据互相污染** —— 通过 §4 的 per-developer 隔离策略解决。

---

## 2. 端口分配表

所有工程本地端口**固定分配**，避免多工程启动时冲突。

| 工程名 | 类型 | 本地端口 | 访问地址 |
|-------|------|---------|---------|
| <!-- web-frontend --> | Web 前端 | <!-- 3000 --> | http://localhost:<!-- 3000 --> |
| <!-- admin --> | Web 前端 | <!-- 3001 --> | http://localhost:<!-- 3001 --> |
| <!-- api-server --> | 后端 HTTP | <!-- 8080 --> | http://localhost:<!-- 8080 --> |
| <!-- user-service --> | 后端微服务 | <!-- 8081 --> | http://localhost:<!-- 8081 --> |
| <!-- order-service --> | 后端微服务 | <!-- 8082 --> | http://localhost:<!-- 8082 --> |
| <!-- ... --> | ... | ... | ... |

### 推荐分配区间（团队可按实际调整）

| 区间 | 用途 |
|------|------|
| 3000-3099 | Web 前端（React/Vue/Next.js dev server） |
| 8000-8099 | 后端 HTTP 接口 |
| 9000-9099 | gRPC / 内部通信 |
| 50000+ | 开发工具（Node inspector / 调试端口 / storybook） |

> 每个工程的端口确定后，写入该工程仓库的 `.env.example`，避免新人猜测。

---

## 3. 基础设施依赖矩阵

每个工程依赖哪些基础设施，以及本地如何接入。

> **维护规约**（必读）：
> - **引入新基础设施依赖时**（如原来不用 Kafka，本版本要引入），必须在技术方案阶段（SOP-02）同步更新本表，不能拖到发布后。
> - AI 在 SOP-05（开发类任务）读本表时，应**顺手扫 workspace 下正在开发工程的 `package.json` / `go.mod` / `requirements.txt` 等依赖文件**，
>   若发现代码使用了本表未声明的基础设施客户端（如 `mysql2` / `ioredis` / `kafkajs` / `@elastic/elasticsearch` / `aws-sdk` / ...），
>   应提示用户："检测到 <工程> 依赖了 <基础设施>，但 local-env.md §3 未声明，是否同步更新?"

| 工程名 | MySQL | Redis | Kafka/MQ | ES | OSS | 其他 |
|-------|-------|-------|----------|-----|-----|------|
| <!-- api-server --> | 🔗 dev 共享 | 🔗 dev 共享 | 🔗 dev 共享 | — | 🔗 dev 共享 | — |
| <!-- user-service --> | 🔗 dev 共享 | 🔗 dev 共享 | — | — | — | — |
| <!-- web-frontend --> | — | — | — | — | — | — |

### 图例

- 🔗 **dev 共享**：连共享 dev 实例（默认）
- 🏠 **本地 docker**：本地启动独立实例（少数需要隔离的场景）
- — **不依赖**

### 例外场景：何时在本地起而非连 dev

| 场景 | 建议 |
|-----|------|
| 破坏性 schema 变更试验（如 drop column） | 临时本地 docker，避免污染 dev |
| 需要离线工作（出差 / 断网） | 临时本地 docker 全套 |
| 敏感数据测试（生产数据脱敏副本） | 本地 docker + 本地副本 |
| 其他日常场景 | 都连 dev |

---

## 4. 开发者隔离策略（混合模式关键）

共享 dev 基础设施必须隔离，否则多人测试互相污染。**三层隔离全部必做**：

### 4.1 MySQL：per-developer schema

每个开发者在 dev MySQL 里有独立 schema：

```sql
CREATE DATABASE IF NOT EXISTS app_dev_{username}
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

本地 `.env.local`：

```
DATABASE_URL=mysql://dev_user:<密码>@dev-db.internal:3306/app_dev_{username}
```

> `{username}` 通常用 `$(whoami)` 生成（macOS / Linux）。

### 4.2 Redis：per-developer key prefix

所有 Redis key 加前缀 `{username}:`：

```
REDIS_HOST=dev-redis.internal
REDIS_KEY_PREFIX={username}:
```

代码层面：所有 `redis.get("foo")` 变成 `redis.get(prefix + "foo")`，通过 Redis client 中间件统一注入。

### 4.3 MQ（Kafka / RabbitMQ）：per-developer topic prefix

所有 topic / queue 加前缀 `{username}.`（测试消息不污染他人）：

```
MQ_BROKERS=dev-kafka.internal:9092
MQ_TOPIC_PREFIX={username}.
```

例如本地发消息到 topic `user-events`，实际写入 dev 的 `alice.user-events`，其他人订阅 `bob.user-events` 不受影响。

### 4.4 OSS：per-developer path prefix（可选）

```
OSS_PATH_PREFIX=dev/{username}/
```

上传文件 `avatar.png` 实际路径 `dev/alice/avatar.png`。

### 4.5 新开发者初始化命令

```bash
# 创建属于自己的 schema + seed 初始数据 + 清理旧前缀
./scripts/dev-init.sh $(whoami)
```

脚本位置：<!-- engineering/workspace/<某后端工程>/scripts/ 或独立 devops 仓库 -->

---

## 5. dev 基础设施主机名清单

**约定**：本产品所有 dev 基础设施通过**统一主机名**访问（不暴露公网 IP / 不直连 K8s service）。
各工程的 `.env.example` **默认填 dev 连接串**，开发者 clone 后稍微调整就能启动。

### 主机名清单

| 主机名 | 用途 | 默认端口 |
|-------|------|---------|
| <!-- dev-db.internal --> | MySQL | 3306 |
| <!-- dev-redis.internal --> | Redis | 6379 |
| <!-- dev-kafka.internal --> | Kafka broker | 9092 |
| <!-- dev-es.internal --> | Elasticsearch | 9200 |
| <!-- dev-oss.internal --> | OSS / MinIO | 9000 |
| <!-- dev-xxx-service.internal --> | 微服务内部调用 | 见 §2 端口分配 |

### .env.example 应默认填 dev 连接

每个后端工程的 `.env.example` 按以下模板准备，clone 后**开箱即用**：

```bash
# 数据库（连 dev，用自己的 schema）
DATABASE_URL=mysql://dev_user:<团队共享密码>@dev-db.internal:3306/app_dev_${USER}

# Redis（连 dev，用自己的 key prefix）
REDIS_HOST=dev-redis.internal
REDIS_PORT=6379
REDIS_KEY_PREFIX=${USER}:

# MQ（连 dev，用自己的 topic prefix）
MQ_BROKERS=dev-kafka.internal:9092
MQ_TOPIC_PREFIX=${USER}.

# 依赖的微服务（指向 dev）
USER_SERVICE_URL=http://dev-user-service.internal:8081
```

> 敏感字段（`<团队共享密码>` / 私钥等）不写死在 `.env.example`，使用占位符，
> 新人找同事拿或从 1Password / Vault 取。

### 本机接入

开发者本机需能解析并访问 `*.internal` 这些主机名。**具体接入方式由团队内网方案决定**，不在本文件规定 ——
公司可能用 VPN、Tailscale、ZeroTier、直连内网、`/etc/hosts` + port-forward 等任一种。

**引用团队内网接入文档**：<!-- 填公司内网文档 URL -->

### 可达性验证

开始开发前，先验证 dev 可达：

```bash
# 依次验证本产品依赖的基础设施
nc -zv dev-db.internal 3306
nc -zv dev-redis.internal 6379
# 或
curl -sv telnet://dev-db.internal:3306 2>&1 | head -5
```

任一项失败 → 检查本机内网接入（按团队方案排查），不可达时不应继续启动服务。

### 服务间调用

本地服务调其他服务时，URL 按以下约定:

| 场景 | URL 示例 | 位置 |
|-----|---------|------|
| 本地 A → 远端 B（B 在 dev 上） | `http://dev-user-service.internal:<端口>` | `.env.example` 默认值 |
| 本地 A → 本地 B（两个都在开发） | `http://localhost:<端口,见 §2>` | 开发者临时改 `.env.local` |
| 远端 B → 本地 A（反向，极少用） | Tailscale peer IP 或 `ngrok http <端口>` | 临时调试，不写入 env 文件 |

默认**所有 `.env.example`** 指向 dev，clone 下来就能跑；本地开发两个服务时手工覆写。

---

## 6. 本地数据种子(策略声明)

> 本节只定策略；**具体脚本命令由各后端工程 `scripts/` 目录维护**（`scripts/README.md` 描述用法），驱动面板不复制实现。

### 快照来源 / 脱敏 / 更新频率

<!-- 按本团队实际填写，例如：
- 来源：每周日自动从 staging DB 导出 + 脱敏（脚本：devops/dump-scrub.sh）
- 存储：OSS bucket `dev-snapshots/app_dev_<YYYYMMDD>.sql.gz`
- 更新频率：每周一一次（覆盖旧快照）
- 脱敏范围：真实姓名 / 手机号 / 邮箱 / 身份证 / 支付凭证
-->

### 脚本命名约定(各工程 scripts/ 下)

| 脚本 | 职责 | 必须幂等 |
|------|------|---------|
| `scripts/dev-init.sh $(whoami)` | 创建自己 schema + seed 初始数据 | ✅ |
| `scripts/seed-dev.sh $(whoami)` | 从快照重新注入数据（不动 schema 结构） | ✅ |
| `scripts/truncate-dev.sh $(whoami)` | 清空业务表数据 | ✅ |
| `scripts/reset-dev.sh $(whoami)` | drop 再重建 + 重新 seed | ✅ |

所有脚本须接收 `$1` 为 username，**幂等**（多次执行结果一致）。

### 新人上手流程

```bash
./scripts/dev-init.sh $(whoami)      # 首次：建 schema + seed
# 之后日常开发不需要重跑；想回到干净状态用 truncate 或 reset
```

---

## 故障排查

<!-- 团队按实际补充，以下为模板 -->

| 症状 | 可能原因 | 解法 |
|------|---------|------|
| 连不上 dev-db.internal | Tailscale 未启动 / VPN 未连 | `tailscale status` / 重连 VPN |
| `Unknown database 'app_dev_alice'` | schema 未创建 | 重跑 `./scripts/dev-init.sh $(whoami)` |
| Redis 拿到的数据不是自己的 | `REDIS_KEY_PREFIX` 未配置或写错 | 检查 `.env.local` |
| 本地服务收到别人的 MQ 消息 | `MQ_TOPIC_PREFIX` 未生效 | 检查消费者订阅的 topic 是否带前缀 |
| schema 塞满不想要的数据 | 积累太多测试数据 | `./scripts/reset-dev.sh $(whoami)` 重来 |

---

## 与其他文档的关系

- **本文件**：固化**模式决策 + 连接配置**
- `engineering/docs/local-setup.md`：按本文件配置后的**启动命令序列**
- `engineering/docs/environments.md`：多环境对照表（含"本地如何接入"列）
- `engineering/README.md` 工程清单：每个工程的仓库、职责、详细说明链接

**AI 在 SOP-05（开发类）任务开始时，应先读本文件，再读 `local-setup.md`**。
