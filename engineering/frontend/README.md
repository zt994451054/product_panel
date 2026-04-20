# 前端工程

## 职责

<!-- 描述前端工程负责的范围：Web 端 UI、用户交互、页面渲染等 -->

## 仓库信息

- **Git 地址**：<!-- https://github.com/org/product-frontend -->
- **主分支**：main
- **分支策略**：见 `standards/engineering/standards.md`
- **技术栈**：见 `engineering/docs/tech-stack.md`

## Clone 到本地

```bash
# clone 前端工程到 workspace 目录（已被 .gitignore 忽略，不纳入驱动面板）
git clone <仓库地址> engineering/frontend/workspace
```

本地启动见 [engineering/docs/local-setup.md](../docs/local-setup.md)

## 工程目录结构

```
workspace/
├── src/
│   ├── pages/        # 页面组件
│   ├── components/   # 通用组件
│   ├── hooks/        # 自定义 hooks
│   ├── store/        # 状态管理
│   ├── api/          # 接口调用层
│   └── utils/        # 工具函数
├── public/
└── ...
```

<!-- 简要说明主要目录的用途，根据实际工程结构调整 -->

## 开发规范

- 组件规范见 `standards/engineering/frontend.md`
- 视觉规范见 `standards/design/DESIGN.md`
- 前端开发前须阅读当前版本的原型：见 `versions/{ver}/product/prototypes/README.md`
