# 部署说明（2024 年版）

生产环境使用 pm2 在服务器上直接运行：

1. 登录生产服务器，`git pull`
2. `npm ci --omit=dev`
3. `pm2 restart legacy-shop`
