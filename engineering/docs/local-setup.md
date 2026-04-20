# 本地环境搭建 & 启动流程

## 前置依赖

| 工具 | 版本要求 | 安装方式 | 验证命令 |
|------|---------|---------|---------|
| Node.js | >= <!-- 如：18.x --> | https://nodejs.org | `node -v` |
| <!-- 如：pnpm --> | >= <!-- --> | `npm i -g pnpm` | `pnpm -v` |
| <!-- 如：Go --> | >= <!-- --> | https://go.dev | `go version` |
| Docker | >= 20.x | https://docker.com | `docker -v` |

## 前端本地启动

```bash
# 1. clone 前端工程
git clone <前端仓库地址> engineering/frontend/workspace

# 2. 安装依赖
cd engineering/frontend/workspace
pnpm install   # 或 npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入本地配置（参考 docs/environments.md）

# 4. 启动开发服务
pnpm dev   # 或 npm run dev
# 访问：http://localhost:3000
```

## 后端本地启动

```bash
# 1. clone 后端工程
git clone <后端仓库地址> engineering/backend/workspace

# 2. 安装依赖
cd engineering/backend/workspace
# <!-- 依赖安装命令，如：pnpm install / go mod tidy -->

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填入本地配置（参考 docs/environments.md）

# 4. 启动依赖服务（如 MySQL、Redis）
docker compose up -d

# 5. 执行数据库迁移（如有）
# <!-- 迁移命令，如：pnpm prisma migrate dev -->

# 6. 启动服务
# <!-- 启动命令，如：pnpm dev / go run main.go -->
# 访问：http://localhost:8080
```

## 常见问题

<!-- 本地启动时常见报错及解决方案

**Q: 端口已被占用**
A: 修改 .env.local 中的端口配置，或 kill 占用端口的进程

**Q: 数据库连接失败**
A: 确认 docker compose 已启动，检查 .env 中的数据库连接配置
-->
