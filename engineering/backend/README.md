# 后端工程

## 职责

<!-- 描述后端工程负责的范围：业务逻辑、数据服务、API 提供等 -->

## 仓库信息

- **Git 地址**：<!-- https://github.com/org/product-backend -->
- **主分支**：main
- **分支策略**：见 `standards/engineering/standards.md`
- **技术栈**：见 `engineering/docs/tech-stack.md`

## Clone 到本地

```bash
# clone 后端工程到 workspace 目录（已被 .gitignore 忽略，不纳入驱动面板）
git clone <仓库地址> engineering/backend/workspace
```

本地启动见 [engineering/docs/local-setup.md](../docs/local-setup.md)

## 工程目录结构

```
workspace/
├── src/
│   ├── controllers/  # 请求处理层
│   ├── services/     # 业务逻辑层
│   ├── repositories/ # 数据访问层
│   ├── models/       # 数据模型
│   ├── middleware/   # 中间件
│   └── utils/        # 工具函数
├── tests/
└── ...
```

<!-- 简要说明主要目录的用途，根据实际工程结构调整 -->

## 开发规范

- API 设计规范见 `standards/engineering/backend.md`
- 当前版本接口设计见 `versions/{ver}/engineering/api-design.md`
- 数据库设计见 `versions/{ver}/engineering/db-design.md`
