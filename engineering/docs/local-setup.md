# 本地环境搭建 & 启动流程

本文件提供**通用启动模板**。各工程的实际命令以该工程 workspace 下的 README 为准。
开始前请先读 `engineering/README.md` 工程清单，确定每个工程的**工程名、类型、仓库地址**。

---

## 前置依赖

| 工具 | 版本要求 | 安装方式 | 验证命令 |
|------|---------|---------|---------|
| Node.js | >= <!-- 如：18.x --> | https://nodejs.org | `node -v` |
| <!-- 如：pnpm --> | >= <!-- --> | `npm i -g pnpm` | `pnpm -v` |
| <!-- 如：Go --> | >= <!-- --> | https://go.dev | `go version` |
| Docker | >= 20.x | https://docker.com | `docker -v` |

> 按本产品实际技术栈调整本表。技术栈基线见 `engineering/docs/tech-stack.md`。

---

## 工程启动通用模板

对**工程清单中每一个工程**执行以下流程（跳过不适用的步骤）：

```bash
# 1. 从 engineering/README.md 查出目标工程名和仓库地址
#    假设工程名为 <name>

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

# 4. 配置环境变量（参考 docs/environments.md）
cp .env.example .env.local  # 或 .env
# 编辑 .env.local，填入本地配置

# 5. 启动后端依赖服务（数据库 / 缓存 / MQ 等，若有）
docker compose up -d

# 6. 执行数据库迁移（若有）
# 如：pnpm prisma migrate dev / python manage.py migrate / rails db:migrate

# 7. 启动开发服务
# 如：pnpm dev / npm run dev / go run main.go / python manage.py runserver
```

---

## 典型形态示例

### A. 前后端分离双仓

```bash
# 前端（假设工程名 web-frontend，端口 3000）
git clone <前端仓库> engineering/workspace/web-frontend
cd engineering/workspace/web-frontend
pnpm install && pnpm dev
# 访问 http://localhost:3000

# 后端（假设工程名 api-server，端口 8080）
git clone <后端仓库> engineering/workspace/api-server
cd engineering/workspace/api-server
pnpm install
cp .env.example .env
docker compose up -d          # 启动 DB / Redis
pnpm prisma migrate dev
pnpm dev
# 访问 http://localhost:8080
```

### B. 单仓 monolith（Next.js SSR / Django 全栈）

```bash
git clone <仓库> engineering/workspace/app
cd engineering/workspace/app
pnpm install
cp .env.example .env.local
docker compose up -d
pnpm dev
# 访问 http://localhost:3000
```

### C. 多端 + 微服务

对清单中每个工程重复 **通用模板** 步骤。微服务建议用一个根级 `docker compose` 统一启动所有后端服务，前端独立启动。

---

## 常见问题

<!-- 本地启动时常见报错及解决方案

**Q: 端口已被占用**
A: 修改 .env.local 中的端口配置，或 kill 占用端口的进程

**Q: 数据库连接失败**
A: 确认 docker compose 已启动，检查 .env 中的数据库连接配置

**Q: clone 到 engineering/workspace/<name>/ 后 git status 显示大量未追踪文件**
A: 正常。engineering/workspace/ 整体已被 .gitignore 忽略，不会进入驱动面板。
-->
