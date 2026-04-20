# v1.0.0 原型工程索引

> 高保真交互原型是前端开发的主要视觉和交互参考
> 补充交互规则见 [design-spec.md](../design-spec.md)
> 视觉规范见 [standards/design/DESIGN.md](../../../../standards/design/DESIGN.md)

---

## 产品原型仓库（全产品通用，跨版本复用）

| 终端 | 仓库地址 | 说明 |
|------|---------|------|
| Web | <!-- https://github.com/org/prototype-web --> | Web 端原型工程 |
| App | <!-- https://github.com/org/prototype-app --> | iOS/Android 原型工程 |
| 小程序 | <!-- https://github.com/org/prototype-miniapp --> | 微信小程序原型工程 |

> 分支命名规则：分支名 = 版本号（如 v1.0.0）

---

## 本版本迭代范围

| 终端 | 本版本是否迭代 | 参考分支 | 备注 |
|------|-------------|---------|------|
| Web | ✅ 已迭代 | v1.0.0 | |
| App | ❌ 未迭代 | - | 沿用上一版本设计 |
| 小程序 | ❌ 未迭代 | - | |

---

## Clone 与启动

```bash
# 只 clone 本版本迭代的终端
# Web 原型（本版本已迭代）
git clone -b v1.0.0 --single-branch \
  <Web仓库地址> \
  versions/v1.0.0/product/prototypes/workspace/web

# 启动原型（默认 3000 端口）
cd versions/v1.0.0/product/prototypes/workspace/web
npm install && npm run dev
```

---

## 视觉对比工作流

> AI 前端开发完成一个页面后执行以下对比循环

```
1. 启动原型：端口 3000
2. 启动产品开发版：端口 3001
3. 对同一页面截图对比
4. 列出差异（间距偏差 / 颜色偏差 / 缺失状态 / 组件错误）
5. 逐项修正，直到视觉差异在可接受范围内
```

## 还原优先级

| 等级 | 要求 | 适用场景 |
|------|------|---------|
| 高保真 | 与原型高度一致 | 用户核心流程页面 |
| 参考还原 | 保持视觉风格一致 | 管理后台类页面 |

<!-- 按具体模块填写还原等级 -->

## 注意事项

- workspace/ 目录已被 .gitignore 忽略，不纳入驱动面板
- 原型使用 mock 数据，还原时替换为真实接口
- 原型视觉与 DESIGN.md 有冲突时，以 DESIGN.md 为准
- 原型与 design-spec.md 补充规则有冲突时，以补充规则为准
- 开发前先读产品前端工程的 components 目录，优先复用已有组件
