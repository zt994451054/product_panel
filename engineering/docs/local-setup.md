# 本地环境搭建 & 启动流程

本文件提供**通用启动模板**。各工程的实际命令以该工程 workspace 下的 README 为准。

开始前**必读**：
1. `engineering/README.md` 工程清单 → 确定每个工程的工程名、类型、仓库地址
2. [`local-env.md`](./local-env.md) 本地开发环境档案 → 确定本地模式（B 混合 / N/A）、端口分配、隔离前缀、dev 连接方式

---

## 前置依赖

| 工具 | 版本要求 | 安装方式 | 验证命令 |
|------|---------|---------|---------|
| Node.js | >= <!-- 如：18.x --> | https://nodejs.org | `node -v` |
| <!-- 如：pnpm --> | >= <!-- --> | `npm i -g pnpm` | `pnpm -v` |
| <!-- 如：Go --> | >= <!-- --> | https://go.dev | `go version` |
| Docker | >= 20.x | https://docker.com | `docker -v` |
| <!-- 远端连接工具 --> | — | 见 `local-env.md` §5 | `tailscale status` / `kubectl version` |

> 按本产品实际技术栈调整本表。技术栈基线见 `engineering/docs/tech-stack.md`。

---

## 工程启动通用模板（B 混合模式）

对**工程清单中每一个工程**执行以下流程（跳过不适用的步骤）：

```bash
# 1. 从 engineering/README.md 查出目标工程名和仓库地址；
#    从 local-env.md §2 查出本工程的本地端口；
#    从 local-env.md §3 查出本工程依赖哪些基础设施。
#    假设工程名为 <name>，本地端口为 <port>

# 2. Clone 到 engineering/workspace/<name>/
git clone <仓库地址> engineering/workspace/<name>
cd engineering/workspace/<name>

# 3. 安装依赖（按实际技术栈选其一）
pnpm install                # Node.js 项目
npm install                 # npm 项目
go mod tidy                 # Go 项目
pip install -r requirements.txt  # Python 项目
composer install            # PHP 项目
bundle install              # Ruby 项目

# 4. 确保 dev 基础设施可达（按 local-env.md §5 的主机名清单验证）
nc -zv dev-db.internal 3306
nc -zv dev-redis.internal 6379
# 任一不通 → 按团队内网接入方案排查（VPN / Tailscale / port-forward 等）

# 5. 配置环境变量（`.env.example` 已默认填 dev 连接串，通常只需改 ${USER}）
cp .env.example .env.local
# 按本工程的 `.env.example` 说明检查：
#   - PORT=<自己的本地端口，见 local-env.md §2>
#   - DATABASE_URL 里的 app_dev_${USER} 会由启动脚本/代码拼 $(whoami)
#   - 从同事或 1Password 拿 <团队共享密码> 等敏感字段

# 6. 首次运行：初始化自己的 schema + 数据种子（仅首次，或 reset 后）
./scripts/dev-init.sh $(whoami)     # 按 local-env.md §4.5 / §6

# 7. 执行数据库迁移（如有）
# 如：pnpm prisma migrate deploy / python manage.py migrate

# 8. 启动开发服务
# 如：pnpm dev / npm run dev / go run main.go
```

---

## 典型形态示例

### A. 前后端分离双仓（B 混合模式）

```bash
# 前端（假设工程名 web-frontend，端口 3000）
git clone <前端仓库> engineering/workspace/web-frontend
cd engineering/workspace/web-frontend
pnpm install
cp .env.example .env.local
# .env.local 里填：VITE_API_BASE_URL=http://localhost:8080  # 指本地 api-server
pnpm dev
# 访问 http://localhost:3000

# 后端（假设工程名 api-server，端口 8080）
git clone <后端仓库> engineering/workspace/api-server
cd engineering/workspace/api-server
pnpm install
tailscale status                    # 先确保 dev 可达
cp .env.example .env.local
# .env.local 里填 dev 连接串 + 自己 schema + 隔离前缀（见 local-env.md）
./scripts/dev-init.sh $(whoami)     # 首次
pnpm prisma migrate deploy
pnpm dev
# 访问 http://localhost:8080
```

### B. 单仓 monolith（全本地模式）

> 单工程产品在 `local-env.md` 里应标注 "N/A，采用全本地"，此时走本示例：

```bash
git clone <仓库> engineering/workspace/app
cd engineering/workspace/app
pnpm install
cp .env.example .env.local          # 数据库连 localhost
docker compose up -d                # 本地起 MySQL/Redis
pnpm prisma migrate dev
pnpm dev
# 访问 http://localhost:3000
```

### C. 多端 + 微服务（B 混合模式）

对清单中每个工程重复**通用模板**步骤。关键：
- 只启动**正在开发的**工程
- 其他工程的调用 URL 指向 dev 远端（见 `local-env.md` §7）
- 所有基础设施连接共享 dev，通过 §4 隔离前缀避免互相污染

---

## 常见问题

<!-- 本地启动时常见报错及解决方案，更多见 local-env.md 故障排查节

**Q: 端口已被占用**
A: 修改 .env.local 中的端口配置，或 kill 占用端口的进程；注意与 local-env.md §2 端口分配表对齐

**Q: 连不上 dev-db.internal**
A: 见 local-env.md §5，检查 Tailscale / kubectl / VPN 状态

**Q: clone 到 engineering/workspace/<name>/ 后 git status 显示大量未追踪文件**
A: 正常。engineering/workspace/ 整体已被 .gitignore 忽略，不会进入驱动面板。

**Q: 本地数据库查不到某些数据**
A: 检查 DATABASE_URL 指向的 schema 是否为自己的（app_dev_$(whoami)），非他人 schema
-->
