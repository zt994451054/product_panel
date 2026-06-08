# 统一高保真原型工程

> 单一 Vite + React 应用，`/` 为终端选择门户，各终端通过路由命名空间区分。
> 本文件是 AI 进行原型导航的主文档：先读这里确认终端路径与启动方式，再动手。
> 视觉规范基线见 `standards/design/DESIGN.md`（**生成或修改任何页面前必须先读取**）。

## 原型定位（硬约束）

本原型是产品交付给研发的 **UI 设计参考物**，供 AI 编码工具和开发人员精准还原 UI。

- ✅ 完整 HTML 结构 / 样式 / 视觉层
- ✅ 交互逻辑（弹窗开关、Loading 态、筛选/排序/分页、表单校验等）
- ✅ 使用 Mock 数据填充表格和列表
- ❌ **不含任何真实 API 调用（禁止 axios/fetch 请求）**
- ❌ **不含业务逻辑处理（禁止消费 AuthContext / StatusContext 等全局 Context）**
- ❌ **不含鉴权守卫（页面直接展示内容，不跳转登录）**

## 终端清单

| 终端 | 路由前缀 | 本地直达 | 状态 |
|------|---------|---------|------|
| PC Web（桌面控制台） | `/web/` | http://localhost:5173/web/home | 可用 |
| Mobile H5（移动端） | `/mobile/` | http://localhost:5173/mobile/home | 规划中 |
| Desktop（桌面客户端） | `/desktop/` | http://localhost:5173/desktop/home | 规划中 |

> **新增 / 启用终端三件套**：① 本表加一行或改状态 ② `src/pages/Portal.jsx` 的 `terminals` 加一张卡片或把 `available` 改为 `true` ③ `src/App.jsx` 注册对应路由。

## 快速启动

```bash
cd foundation/design/prototype
npm install
npm run dev
# 打开 http://localhost:5173
# /            → 终端选择门户
# /web/home    → PC Web 原型
```

## 目录结构

```
foundation/design/prototype/
├── package.json
├── vite.config.js
├── index.html
├── README.md          # 本文件
└── src/
    ├── main.jsx       # BrowserRouter 入口
    ├── App.jsx        # 统一路由（/ 门户 + /web/* + /mobile/* + /desktop/*）
    ├── pages/
    │   └── Portal.jsx # 终端选择门户
    ├── web/           # PC Web 终端原型
    ├── mobile/        # 移动端终端原型
    └── desktop/       # 桌面端终端原型
```

## 还原优先级

| 等级 | 要求 | 适用场景 |
|------|------|---------|
| 高保真 | 与原型高度一致 | 用户核心流程页面 |
| 参考还原 | 保持视觉风格一致 | 管理后台类页面 |

> 具体页面的还原等级在版本 `design-spec.md`「原型增量」节的页面映射表中标注。

## 视觉对比工作流

> AI 前端开发完成一个页面后执行以下对比循环：

```
1. 启动统一原型（Vite 默认端口 5173）
2. 启动产品开发版
3. 对同一页面截图对比
4. 列出差异（间距偏差 / 颜色偏差 / 缺失状态 / 组件错误）
5. 逐项修正，直到视觉差异在可接受范围内
```

## 冲突优先级（从高到低）

| 优先级 | 文档 | 适用范围 |
|--------|------|---------|
| 1（最高） | 版本 `design-spec.md` 补充交互规则 / 原型增量 | 原型未覆盖的交互逻辑、边界场景、权限渲染 |
| 2 | `standards/design/DESIGN.md` | 色彩、字体、间距等视觉 Token |
| 3 | 本原型 | 页面布局、组件排布、整体视觉风格 |

> 三者通常不冲突：原型给视觉，DESIGN.md 给 Token，design-spec.md 给原型里画不清楚的逻辑。
> 真正冲突时以上表为准，并在版本 `CHANGES.md` 记录冲突与决策。

## AI 使用说明

进行前端开发或更新原型时：
1. 读本文件确认目标终端路径与启动命令
2. 启动对应终端原型作为视觉参照（端口 5173）
3. 读 `standards/design/DESIGN.md` 确认视觉规范
4. 读版本 `design-spec.md`「原型增量」节确认本版本相对原型的差异
