# 统一原型工程规范 — 设计文档

> 日期：2026-06-08
> 状态：已确认蓝图，待落档实现
> 适用：product_panel（新产品黄金母版），供后续每个新产品继承

---

## 1. 背景与目标

product_panel 是给后续新产品复用的「驱动面板」黄金母版。其原型规范目前停留在「旧模型」：每个版本各自 clone 分终端原型仓库到 gitignore 的 `workspace/`，用 `web-v{版本}` 分终端分支，每版本一份 `prototypes/README.md` 作索引。

在实战项目 team-model-0424 中已验证出一套更优的「统一原型模型」，并积累了关键经验（原型定位边界、版本增量、终端门户）。本次目标：**把这套已验证的经验提炼为「统一原型工程级规范」，沉淀进母版**，给后续新产品提供开箱即用的支撑。

## 2. 锁定决策（含理由）

| 决策 | 选择 | 理由 |
|------|------|------|
| 原型语言 | **锁定 React（Vite + React DOM）** | 范围已收窄到 Web / iOS / 安卓 / 桌面端，且原型仅作纯 UI + 2D 交互参考物；React web 在「设备外壳内忠实复刻视觉与 2D 交互」层面足够，且天然契合「AI 启动→截图→视觉差异逐项修正」的还原闭环。不考虑 TV / 大屏 / 手表 / AR 等终端 |
| 原型工程落位 | **直接 commit 进面板仓库** | 统一原型是跨版本设计参考物，需随面板版本演进；融入面板后 AI clone 面板即得，无需额外 clone 原型仓库 |
| 多终端组织 | **单 Vite + React 应用 + 路由命名空间** | `/` 门户入口，`/web/*`、`/mobile/*`、`/desktop/*` 区分终端；终端同构（都是 React web），可共享一个运行时 |
| 统一入口 | **门户入口页（Portal）** | 提供统一的原型体验入口，列出全部终端 |

> 介质统一为代码原型（React）：Figma/蓝湖在「动态数据 / 长列表 / 真实表单 / AI 还原闭环」上有保真天花板，本母版钦定代码原型为标准介质以统一打法。

## 3. 核心模型

- **一份跨版本持续维护的统一原型**，始终反映「当前期望 UI 状态」。废弃「每版本各自 clone」旧模型。
- 视觉基线仍为 `standards/design/DESIGN.md`，原型消费它，不自行发挥色彩/字体/间距。
- 版本与原型的关系：版本不再持有原型，只在版本设计文档中记录**「原型增量」**——本版本相对统一原型新增/修改了哪些页面与交互。

## 4. 落位与目录结构

落位：`foundation/design/prototype/`（cross-version 设计资产，随面板仓库提交）。废弃 `versions/{版本}/product/prototypes/`。

母版直接 ship 最小可运行 React 脚手架（不含 `node_modules`，已 gitignore），新产品 clone 面板即可 `npm install && npm run dev`：

```
foundation/design/prototype/
├── package.json          # React 18 + Vite
├── README.md             # ★ 终端导航文档（AI 原型导航主文档）
├── src/
│   ├── App.jsx           # 统一路由：/ 门户 + /web/* + /mobile/* + /desktop/*
│   ├── pages/
│   │   └── Portal.jsx    # ★ 门户入口页：列出全部终端卡片（可用 / 规划中）
│   ├── web/              # PC Web 终端原型（示例壳）
│   ├── mobile/           # 移动端原型（设备外壳内渲染，预留空壳）
│   └── desktop/          # 桌面端原型（预留空壳）
└── ...
```

**新增终端三件套**：① README 终端清单表加一行 ② `Portal.jsx` 加一张卡片 ③ `App.jsx` 注册对应路由。

## 5. 原型定位边界（最有价值的沉淀，写入 README 作硬约束）

原型是产品交付给研发的 **UI 设计参考物**，供 AI 编码工具和开发人员精准还原 UI。核心定位：

- ✅ 完整 HTML 结构 / 样式 / 视觉层
- ✅ 交互逻辑（弹窗开关、Loading 态、筛选/排序/分页、表单校验等）
- ✅ Mock 数据填充表格和列表
- ❌ **不含任何真实 API 调用（禁止 axios/fetch 请求）**
- ❌ **不含业务逻辑处理（禁止消费 AuthContext / StatusContext 等全局 Context）**
- ❌ **不含鉴权守卫（页面直接展示内容，不跳转登录）**

## 6. 文档职责重新划分

| 内容 | 归属 | 变化 |
|------|------|------|
| 终端清单 / 启动方式 / 目录结构 / 定位边界 / 「如何加终端」 | `foundation/design/prototype/README.md` | **新建**，AI 原型导航主文档 |
| 还原优先级 / 视觉对比工作流 / 三文档冲突优先级 | `foundation/design/prototype/README.md`（产品级常量，不再按版本重复） | 从旧 per-version README **上移** |
| 原型页面 ↔ 需求模块映射（版本相关） | `versions/{版本}/product/design-spec.md` 新增「原型增量」节 | **下沉**到版本设计文档 |
| 版本相对统一原型的增量（新增/改了哪些页面交互） | 同上「原型增量」节 | **补齐缺口**：team-model 的 AGENTS.md 引用了「design-spec.md 原型增量节」，但 design-spec.md 模板里其实没有该章节，本次一并补上 |
| `versions/{版本}/product/prototypes/README.md` | — | **删除**（旧模型遗留） |

### design-spec.md 新增「原型增量」节（结构）

```markdown
## 原型增量

> 本版本相对统一原型（foundation/design/prototype/）的差异。
> 原型已能直接体现的视觉结构不必在此重复；重点记录增量与映射。

### 本版本原型变更
- 新增页面/模块：……
- 已有页面交互变化：……

### 原型页面 ↔ 需求模块映射
| 原型路由 | 所属终端 | 对应需求模块 | 还原优先级 |
|---------|---------|------------|----------|
| /web/... | Web | [xx模块](./requirements.md#xx模块) | 高保真 |
```

## 7. 流程改动（AGENTS.md）

- **SOP-01** 新增「更新统一原型」示例：设计文档完成 → 读 `standards/design/DESIGN.md` → 读 design-spec.md「原型增量」→ 进 `foundation/design/prototype/` 读 README → 实现页面/组件 → 启动视觉验收。
- **SOP-01** 第 ⑤ 步「为每个已确认功能模块编写」扩充为：用户流程与页面跳转、原型未覆盖的业务规则与边界状态（原型能直接体现的视觉结构不重复描述）、版本相对统一原型的增量说明。
- **SOP-05**（前端开发前）：从「读 `prototypes/README.md` 并 clone 原型分支」改为「进 `foundation/design/prototype/`，读 README 确认目标终端路径与启动命令，`npm run dev` 启动对应终端原型；对照 design-spec.md『原型增量』」。
- **SOP-05 前端开发示例**：将「clone 原型分支、原型端口 3000 / 开发版 3001」改为「启动统一原型（Vite 默认 5173），逐页对比视觉差异」。
- **§6 落档规约**：原型相关行改为——统一高保真原型 `foundation/design/prototype/`（终端清单见 README）+ 原型入口门户（路由 `/`，`Portal.jsx`/`App.jsx`）+ 视觉规范基线 `standards/design/DESIGN.md`；版本设计文档行补充「版本原型增量说明」。
- **SOP-06 新建版本模板**清单移除 `prototypes/README.md`。
- **§7 读取顺序 / 守卫**：原型前必读 `standards/design/DESIGN.md` 的约束保留。

## 8. 必须显式处理的冲突：面板内代码豁免

面板原则是「驱动面板不产生代码文件、产品代码只在 gitignore 的 workspace clone」。原型融入面板破了这条，需在 AGENTS.md 加显式豁免：

> 唯一例外：`foundation/design/prototype/` 是面板内维护的 React 原型工程，属于**设计参考物**，不是产品代码；产品前端代码仍只在 gitignore 的 `engineering/workspace/` 中 clone。

## 9. 实施改动清单（供实现计划展开）

**新建：**
- `foundation/design/prototype/`：React 脚手架（package.json、vite 配置、src/App.jsx、src/pages/Portal.jsx、web/ 示例壳、mobile/ desktop/ 空壳）
- `foundation/design/prototype/README.md`：终端导航文档（终端清单 + 启动 + 目录 + 定位边界 + 加终端步骤 + 还原优先级 + 视觉对比工作流 + 冲突优先级）

**修改：**
- `versions/v1.0.0/product/design-spec.md`：新增「原型增量」节模板
- `AGENTS.md`：SOP-01 / SOP-05 / §6 落档规约 / SOP-06 模板清单 / 面板内代码豁免
- `standards/design/README.md`：补充「原型为 `foundation/design/prototype/` 的 React 统一原型」指引
- `.gitignore`：忽略 `foundation/design/prototype/**/node_modules`

**删除：**
- `versions/v1.0.0/product/prototypes/README.md`（旧模型遗留）
- `versions/v1.0.0/product/prototypes/`（整个旧目录）

## 10. 已替用户决策的三个小项（已确认）

1. 落位选 `foundation/design/prototype/`（与 team-model 一致）。
2. 「页面 ↔ 需求映射」下沉到 design-spec.md「原型增量」节，而非单独文件。
3. 母版直接 ship 可跑的最小 React 脚手架（含 Portal + 三个终端空壳）。
