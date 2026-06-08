# 统一原型工程规范 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把已验证的「统一原型模型」沉淀进 product_panel 母版：在面板内 ship 一个锁定 React 的统一原型工程（含门户入口 + 路由命名空间多终端），并改写相关文档与 SOP。

**Architecture:** 在 `foundation/design/prototype/` 落一个最小可运行的 Vite + React 单应用，`/` 为 Portal 门户、各终端走 `/web/*` `/mobile/*` `/desktop/*` 路由命名空间；原型工程根 README 作为 AI 终端导航主文档并固化「原型定位边界」；版本只在 design-spec.md 记录「原型增量」；AGENTS.md 的 SOP 与落档规约改写为统一原型模型，并加「面板内原型代码豁免」。

**Tech Stack:** React 18 + Vite 5 + react-router-dom 6（零组件库耦合）；Markdown 文档。

参考规范：`docs/superpowers/specs/2026-06-08-unified-prototype-spec-design.md`

---

## File Structure

**新建（原型工程脚手架，全部在 `foundation/design/prototype/`）：**
- `package.json` — Vite + React 依赖与脚本
- `vite.config.js` — react 插件，端口 5173
- `index.html` — 挂载点
- `src/main.jsx` — BrowserRouter 入口
- `src/App.jsx` — 统一路由（Portal + 三终端命名空间）
- `src/pages/Portal.jsx` — 门户入口页（终端卡片）
- `src/web/WebHome.jsx` / `src/mobile/MobileHome.jsx` / `src/desktop/DesktopHome.jsx` — 三终端占位壳
- `README.md` — 终端导航主文档（清单/启动/目录/定位边界/加终端/还原优先级/视觉对比/冲突优先级）

**修改：**
- `.gitignore` — 原型工程仅忽略 node_modules/dist
- `versions/v1.0.0/product/design-spec.md` — 新增「原型增量」节
- `AGENTS.md` — SOP-01 / SOP-05 / SOP-06 / §6 落档规约 / 面板内代码豁免
- `standards/design/README.md` — 指向统一原型

**删除：**
- `versions/v1.0.0/product/prototypes/`（旧模型整目录）

---

## Task 1：搭建 React 统一原型脚手架

**Files:**
- Create: `foundation/design/prototype/package.json`
- Create: `foundation/design/prototype/vite.config.js`
- Create: `foundation/design/prototype/index.html`
- Create: `foundation/design/prototype/src/main.jsx`
- Create: `foundation/design/prototype/src/App.jsx`
- Create: `foundation/design/prototype/src/pages/Portal.jsx`
- Create: `foundation/design/prototype/src/web/WebHome.jsx`
- Create: `foundation/design/prototype/src/mobile/MobileHome.jsx`
- Create: `foundation/design/prototype/src/desktop/DesktopHome.jsx`

- [ ] **Step 1：创建 `package.json`**

```json
{
  "name": "product-prototype",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "统一高保真交互原型工程（UI 设计参考物）",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.2.0"
  }
}
```

- [ ] **Step 2：创建 `vite.config.js`**

```js
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
```

- [ ] **Step 3：创建 `index.html`**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>产品原型导航</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4：创建 `src/main.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
```

- [ ] **Step 5：创建 `src/App.jsx`**

```jsx
import { Navigate, Route, Routes } from 'react-router-dom';
import Portal from './pages/Portal';
import WebHome from './web/WebHome';
import MobileHome from './mobile/MobileHome';
import DesktopHome from './desktop/DesktopHome';

function NotFound() {
  return (
    <div style={{ padding: 48, fontFamily: "-apple-system, 'PingFang SC', sans-serif" }}>
      404 · 页面不存在
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* 终端选择入口 */}
      <Route path="/" element={<Portal />} />

      {/* PC Web 终端 */}
      <Route path="/web" element={<Navigate to="/web/home" replace />} />
      <Route path="/web/home" element={<WebHome />} />

      {/* 移动端 */}
      <Route path="/mobile" element={<Navigate to="/mobile/home" replace />} />
      <Route path="/mobile/home" element={<MobileHome />} />

      {/* 桌面端 */}
      <Route path="/desktop" element={<Navigate to="/desktop/home" replace />} />
      <Route path="/desktop/home" element={<DesktopHome />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
```

- [ ] **Step 6：创建 `src/pages/Portal.jsx`**

```jsx
import { useNavigate } from 'react-router-dom';

// 产品落地时改为「{产品名} 原型导航」
const PORTAL_TITLE = '产品原型导航';

const terminals = [
  { key: 'web', icon: '🖥️', name: 'PC Web', desc: '桌面端控制台\n管理后台全功能', path: '/web/home', available: true },
  { key: 'mobile', icon: '📱', name: 'Mobile H5', desc: '移动端轻应用\n核心功能访问', path: '/mobile/home', available: false },
  { key: 'desktop', icon: '💻', name: 'Desktop', desc: '桌面客户端\n离线/本地能力', path: '/desktop/home', available: false },
];

export default function Portal() {
  const navigate = useNavigate();

  return (
    <div style={{
      fontFamily: "-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif",
      background: '#f5f7fa',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: 28, fontWeight: 600, color: '#1c1f23', marginBottom: 8 }}>
          {PORTAL_TITLE}
        </div>
        <div style={{ fontSize: 15, color: '#6b7280', marginBottom: 48 }}>
          选择要访问的终端原型
        </div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {terminals.map((t) => (
            <div
              key={t.key}
              onClick={() => t.available && navigate(t.path)}
              style={{
                background: '#fff',
                border: '1px solid #edf0f5',
                borderRadius: 16,
                padding: '36px 40px',
                width: 240,
                cursor: t.available ? 'pointer' : 'default',
                opacity: t.available ? 1 : 0.45,
                transition: 'box-shadow 0.2s, transform 0.2s',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                if (!t.available) return;
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,100,250,0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>{t.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#1c1f23', marginBottom: 8 }}>
                {t.name}
              </div>
              <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {t.desc}
              </div>
              <span style={{
                display: 'inline-block',
                marginTop: 12,
                fontSize: 11,
                padding: '2px 8px',
                background: t.available ? '#e8f3ff' : '#f5f5f5',
                color: t.available ? '#0064fa' : '#9ca3af',
                borderRadius: 20,
              }}>
                {t.available ? '可用' : '规划中'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7：创建 `src/web/WebHome.jsx`**

```jsx
// PC Web 终端原型入口示例页。产品落地时在 src/web/ 下实现真实页面。
export default function WebHome() {
  return (
    <div style={{ padding: 48, fontFamily: "-apple-system, 'PingFang SC', sans-serif" }}>
      <h1 style={{ fontSize: 24, color: '#1c1f23' }}>PC Web 原型</h1>
      <p style={{ color: '#6b7280' }}>
        在 <code>src/web/</code> 下实现 PC Web 终端的高保真原型页面，并在 <code>src/App.jsx</code> 注册路由。
      </p>
    </div>
  );
}
```

- [ ] **Step 8：创建 `src/mobile/MobileHome.jsx`**

```jsx
// 移动端终端原型入口示例页。产品落地时在 src/mobile/ 下实现真实页面。
export default function MobileHome() {
  return (
    <div style={{ padding: 48, fontFamily: "-apple-system, 'PingFang SC', sans-serif" }}>
      <h1 style={{ fontSize: 24, color: '#1c1f23' }}>移动端原型</h1>
      <p style={{ color: '#6b7280' }}>
        在 <code>src/mobile/</code> 下实现移动端终端的高保真原型页面（建议在设备外壳内渲染），并在 <code>src/App.jsx</code> 注册路由。
      </p>
    </div>
  );
}
```

- [ ] **Step 9：创建 `src/desktop/DesktopHome.jsx`**

```jsx
// 桌面端终端原型入口示例页。产品落地时在 src/desktop/ 下实现真实页面。
export default function DesktopHome() {
  return (
    <div style={{ padding: 48, fontFamily: "-apple-system, 'PingFang SC', sans-serif" }}>
      <h1 style={{ fontSize: 24, color: '#1c1f23' }}>桌面端原型</h1>
      <p style={{ color: '#6b7280' }}>
        在 <code>src/desktop/</code> 下实现桌面端终端的高保真原型页面，并在 <code>src/App.jsx</code> 注册路由。
      </p>
    </div>
  );
}
```

- [ ] **Step 10：安装依赖并验证构建通过**

Run:
```bash
cd foundation/design/prototype
npm install
npm run build
```
Expected: `npm install` 成功；`npm run build` 输出 `dist/` 且无报错（末尾打印 `✓ built in ...`）。

- [ ] **Step 11：验证开发服务器可启动**

Run:
```bash
cd foundation/design/prototype
( npm run dev & echo $! > /tmp/proto_dev.pid ) ; sleep 4 ; curl -sf http://localhost:5173/ -o /dev/null && echo DEV_OK ; kill "$(cat /tmp/proto_dev.pid)"
```
Expected: 打印 `DEV_OK`（首页 200）。

- [ ] **Step 12：提交（不含 node_modules/dist，先确认 .gitignore 在 Task 3 处理；此处只 add 源码文件）**

```bash
cd /Users/zhoutong/Documents/project/product_panel/.claude/worktrees/prototype-spec
git add foundation/design/prototype/package.json foundation/design/prototype/vite.config.js \
  foundation/design/prototype/index.html foundation/design/prototype/src
git commit -m "feat(prototype): scaffold unified React prototype engineering with portal"
```

---

## Task 2：编写原型工程终端导航 README

**Files:**
- Create: `foundation/design/prototype/README.md`

- [ ] **Step 1：创建 `README.md`**

````markdown
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
````

- [ ] **Step 2：提交**

```bash
git add foundation/design/prototype/README.md
git commit -m "docs(prototype): add terminal navigation README with positioning boundary"
```

---

## Task 3：更新 .gitignore（原型源码入库，仅忽略构建产物）

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1：替换旧原型 workspace 忽略规则**

把以下旧规则块：

```
# 高保真交互原型工程不纳入驱动面板
versions/*/product/prototypes/workspace/*
!versions/*/product/prototypes/workspace/.gitkeep
```

替换为：

```
# 统一原型工程：源码纳入面板，仅忽略依赖与构建产物
foundation/design/prototype/node_modules/
foundation/design/prototype/dist/
```

- [ ] **Step 2：验证原型源码已被 git 跟踪、依赖未被跟踪**

Run:
```bash
git check-ignore foundation/design/prototype/node_modules && echo "node_modules IGNORED(ok)"
git check-ignore foundation/design/prototype/src/App.jsx ; echo "src exit=$?(expect 1 = not ignored)"
```
Expected: 打印 `node_modules IGNORED(ok)`；`src exit=1`（源码未被忽略）。

- [ ] **Step 3：提交**

```bash
git add .gitignore
git commit -m "chore(gitignore): track unified prototype source, ignore deps/build"
```

---

## Task 4：为 design-spec.md 增加「原型增量」节

**Files:**
- Modify: `versions/v1.0.0/product/design-spec.md`

- [ ] **Step 1：在「全局交互规范」节之后、`## {功能模块名}` 之前插入「原型增量」节**

将文件中这一行：

```markdown
## {功能模块名}
```

替换为（在其前面插入新节，注意保留原 `## {功能模块名}` 行）：

```markdown
## 原型增量

> 本版本相对统一原型（`foundation/design/prototype/`）的差异。
> 原型已能直接体现的视觉结构不必在此重复；重点记录增量与页面映射。

### 本版本原型变更

<!--
- 新增页面/模块：如「新增 /web/console/billing 账单页」
- 已有页面交互变化：如「/web/console/user 列表新增批量导出」
无变更则填「无，本版本不改动原型」
-->

### 原型页面 ↔ 需求模块映射

> AI 前端开发通过此表定位「实现哪个需求模块 → 参考哪个原型页面」。
> 编写测试用例（SOP-03）时也可据此确认 UI 覆盖范围。

| 原型路由 | 所属终端 | 对应需求模块 | 还原优先级 |
|---------|---------|------------|----------|
| <!-- 如：/web/register --> | Web | [注册模块](./requirements.md#注册模块) | 高保真 |
| <!-- 如：/web/login --> | Web | [登录模块](./requirements.md#登录模块) | 高保真 |

> 还原优先级见 `foundation/design/prototype/README.md`「还原优先级」。

---

## {功能模块名}
```

- [ ] **Step 2：验证插入正确**

Run:
```bash
grep -n "## 原型增量" versions/v1.0.0/product/design-spec.md
grep -n "原型页面 ↔ 需求模块映射" versions/v1.0.0/product/design-spec.md
```
Expected: 两条均有匹配行。

- [ ] **Step 3：提交**

```bash
git add versions/v1.0.0/product/design-spec.md
git commit -m "docs(design-spec): add 原型增量 section for per-version prototype delta"
```

---

## Task 5：删除旧版本原型目录

**Files:**
- Delete: `versions/v1.0.0/product/prototypes/`

- [ ] **Step 1：删除整个旧原型目录**

```bash
git rm -r versions/v1.0.0/product/prototypes
```
Expected: 删除 `prototypes/README.md` 及 `workspace/.gitkeep` 等。

- [ ] **Step 2：确认引用已无残留（应只剩本计划/spec 文档中的历史描述）**

Run:
```bash
grep -rn "product/prototypes" --include="*.md" . | grep -v "docs/superpowers/"
```
Expected: 无输出（除 docs/superpowers 下的计划与 spec）。若 AGENTS.md 仍有匹配，将在 Task 6 处理。

- [ ] **Step 3：提交**

```bash
git commit -m "chore(prototype): remove legacy per-version prototypes directory"
```

---

## Task 6：改写 AGENTS.md 为统一原型模型

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1：SOP-01 触发词「原型说明」→「原型更新」**

old:
```
**触发**：被要求撰写或修改需求文档、产品设计文档、原型说明
```
new:
```
**触发**：被要求撰写或修改需求文档、产品设计文档、原型更新
```

- [ ] **Step 2：SOP-01 第 ⑤ 步扩充，并在示例后追加「更新统一原型」示例**

old（「编写产品设计文档」示例的 ⑤⑥ 两行）:
```
> ⑤ 为每个「已确认」功能模块编写用户流程和补充交互规则
> ⑥ 执行 SOP-07：更新 versions/v1.0.0/README.md 产品设计阶段状态改为 🔄
```
new:
```
> ⑤ 为每个「已确认」功能模块编写：
> >    - 用户流程与页面跳转逻辑
> >    - 原型未覆盖的业务规则和边界状态（原型能直接体现的视觉结构不需要在此重复描述）
> >    - 版本相对统一原型的增量说明（在「原型增量」节：新增了哪些页面/模块、已有页面有哪些交互变化）
> ⑥ 执行 SOP-07：更新 versions/v1.0.0/README.md 产品设计阶段状态改为 🔄

**示例：更新统一原型（新功能上线前）**
> 用户说：「v1.0.0 设计文档已完成，帮我把新页面更新到原型里」
>
> AI 正确行为：
> ① 读 standards/design/DESIGN.md 确认视觉规范
> ② 读 versions/v1.0.0/product/design-spec.md「原型增量」节，确认需要新增或修改哪些页面
> ③ 进入 foundation/design/prototype/，读 README.md 确认目标终端路径及启动命令
> ④ 在对应终端目录实现目标页面/组件，npm run dev 启动后视觉验收通过
> ⑤ 在 versions/v1.0.0/product/design-spec.md「原型增量」节标记已完成
```

> 注：上面 `> >` 是为了在 Markdown 引用块内再缩进的子项，落地时保持与周围引用块一致的渲染即可。

- [ ] **Step 3：SOP-05 步骤 6（前端开发前）改写**

old:
```
6. **前端开发前**须读取 `versions/{当前版本}/product/prototypes/README.md` 并 clone 对应原型分支
```
new:
```
6. **前端开发前**须启动统一原型作为视觉参考：
   - 进入 `foundation/design/prototype/`，读 README.md 确认目标终端路径及启动命令，`npm run dev` 启动对应终端原型
   - 同时读取 `versions/{当前版本}/product/design-spec.md`「原型增量」节，了解本版本相对原型的差异和补充逻辑
```

- [ ] **Step 4：SOP-05「前端功能开发完整流程」示例步骤 ①–⑩ 改写**

old:
```
> ① 读 versions/v1.0.0/product/prototypes/README.md
>    → 获取 Web 端原型仓库地址，确认本版本已迭代 Web 端
> ② Clone 原型分支到本地：
>    git clone -b v1.0.0 <原型仓库地址> versions/v1.0.0/product/prototypes/workspace/web
> ③ 启动原型（端口 3000），作为视觉和交互参考
> ④ 读取 versions/v1.0.0/product/design-spec.md 确认补充交互规则（原型未覆盖的逻辑）
> ⑤ 读取 standards/design/DESIGN.md 确认视觉规范（色彩/字体/间距）
> ⑥ 读 engineering/README.md 工程清单，找到前端工程的工程名（假设为 `web-frontend`），Clone 到：
>    git clone <前端仓库地址> engineering/workspace/web-frontend
> ⑦ 读取 versions/v1.0.0/engineering/tech-solution.md「前端设计」节
> ⑧ 读取 versions/v1.0.0/engineering/api-design.md 确认接口规范
> ⑨ 开发完成后：启动开发版（端口 3001），与原型对比视觉差异，逐项修正
> ⑩ 修正满意后按分支策略 push，驱动面板不产生任何代码文件变更
```
new:
```
> ① 进入 foundation/design/prototype/，读 README.md 确认目标终端路径及启动命令，npm run dev 启动对应终端原型（端口 5173）
>    → 直接浏览对应页面，作为视觉和交互的第一参照
> ② 读取 versions/v1.0.0/product/design-spec.md「原型增量」节
>    → 确认本版本相对原型有哪些差异：新增状态、业务规则、原型未覆盖的逻辑
> ③ 读取 standards/design/DESIGN.md 确认视觉规范（色彩/字体/间距）
> ④ 读 engineering/README.md 工程清单，找到前端工程的工程名（假设为 `web-frontend`），Clone 到：
>    git clone <前端仓库地址> engineering/workspace/web-frontend
> ⑤ 读取 versions/v1.0.0/engineering/tech-solution.md「前端设计」节
> ⑥ 读取 versions/v1.0.0/engineering/api-design.md 确认接口规范
> ⑦ 开发完成后：与统一原型（端口 5173）逐页对比视觉差异，逐项修正
> ⑧ 修正满意后按分支策略 push，产品前端代码只在 engineering/workspace/ 产生，驱动面板的文档不产生变更
```

- [ ] **Step 5：在 SOP-05「反例」块后追加「面板内原型代码豁免」说明**

old:
```
**反例：**
> ❌ 在驱动面板根目录创建 src/ 或任何代码文件
> ❌ 没有读技术方案就开始写代码
> ❌ 代码写完不 push，只留在 workspace/ 本地
```
new:
```
**反例：**
> ❌ 在驱动面板根目录创建 src/ 或任何代码文件
> ❌ 没有读技术方案就开始写代码
> ❌ 代码写完不 push，只留在 workspace/ 本地

> **唯一例外（面板内原型代码豁免）**：`foundation/design/prototype/` 是面板内维护的 React 统一原型工程，属于**设计参考物**，其源码随面板提交；这不违反「面板不产生代码」原则。产品前端代码仍只在 gitignore 的 `engineering/workspace/` 中 clone，不入面板。
```

- [ ] **Step 6：SOP-06 新建版本模板清单移除 prototypes/README.md**

old:
```
>    product/requirements.md / design-spec.md / prototypes/README.md
```
new:
```
>    product/requirements.md / design-spec.md
```

- [ ] **Step 7：§6 落档规约表格更新原型相关行**

old:
```
| 产品设计、交互逻辑 | `versions/{ver}/product/design-spec.md` | |
| 原型链接 / 文件 | `versions/{ver}/product/prototypes/README.md` | |
```
new:
```
| 产品设计、交互逻辑、版本原型增量说明 | `versions/{ver}/product/design-spec.md` | 原型能直接体现的视觉结构不必重复，重点记录业务规则、边界状态、原型增量 |
| 统一高保真原型（跨版本持续维护） | `foundation/design/prototype/` | 单 Vite+React 应用，终端清单及启动方式见其 README.md；有新页面或重大交互变化时更新 |
| 原型入口门户 | `foundation/design/prototype/`（路由 `/`） | 多终端选择入口，`src/pages/Portal.jsx`；新增终端时同步更新 Portal.jsx 与 App.jsx |
| 视觉规范基线 | `standards/design/DESIGN.md` | 色彩/字体/间距/组件规则，前端开发和原型更新前必读 |
```

- [ ] **Step 8：验证所有旧引用已清除**

Run:
```bash
grep -n "prototypes/README.md\|product/prototypes\|端口 3000\|端口 3001" AGENTS.md
```
Expected: 无输出。

- [ ] **Step 9：提交**

```bash
git add AGENTS.md
git commit -m "docs(agents): rewire SOP-01/05/06 and 落档规约 to unified prototype model"
```

---

## Task 7：更新 standards/design/README.md 指向统一原型

**Files:**
- Modify: `standards/design/README.md`

- [ ] **Step 1：在「适用场景」节后补充统一原型指引**

old:
```
## 文件说明

| 文件 | 说明 |
|------|------|
| `DESIGN.md` | 产品完整设计系统（awesome-design-md 格式），包含色彩/字体/间距/组件/动效规范 |
```
new:
```
## 统一原型

高保真交互原型为面板内维护的 React 统一原型工程，位于 `foundation/design/prototype/`。
原型消费本目录 `DESIGN.md` 的视觉 Token，不自行发挥色彩/字体/间距。
终端清单、启动方式与原型定位边界见该工程的 `README.md`。

## 文件说明

| 文件 | 说明 |
|------|------|
| `DESIGN.md` | 产品完整设计系统（awesome-design-md 格式），包含色彩/字体/间距/组件/动效规范 |
```

- [ ] **Step 2：提交**

```bash
git add standards/design/README.md
git commit -m "docs(design): point design standards to unified prototype engineering"
```

---

## Task 8：总验收

- [ ] **Step 1：原型工程可构建可启动**

Run:
```bash
cd foundation/design/prototype && npm run build && echo BUILD_OK
```
Expected: `BUILD_OK`。

- [ ] **Step 2：全仓无旧模型残留引用**

Run:
```bash
cd /Users/zhoutong/Documents/project/product_panel/.claude/worktrees/prototype-spec
grep -rn "prototypes/workspace\|prototypes/README.md\|端口 3000\|端口 3001" --include="*.md" . | grep -v "docs/superpowers/"
```
Expected: 无输出。

- [ ] **Step 3：关键新文件就位**

Run:
```bash
ls foundation/design/prototype/README.md foundation/design/prototype/src/pages/Portal.jsx
grep -c "原型增量" versions/v1.0.0/product/design-spec.md
grep -c "foundation/design/prototype" AGENTS.md
```
Expected: 两文件存在；design-spec.md 命中 ≥1；AGENTS.md 命中 ≥3。

- [ ] **Step 4：查看提交历史**

Run:
```bash
git log --oneline -9
```
Expected: 含 Task 1–7 的提交。

---

## 自检结论（writing-plans self-review）

- **spec 覆盖**：脚手架(Task1)、README+定位边界(Task2)、gitignore(Task3)、原型增量(Task4)、删旧目录(Task5)、AGENTS 五处(Task6)、design README(Task7)、总验收(Task8) 与 spec §4–§9 一一对应。
- **占位符**：脚手架代码完整可运行；文档模板中的 `<!-- -->` 为有意保留的填写占位，非计划缺口。
- **类型/命名一致**：组件名 `Portal/WebHome/MobileHome/DesktopHome`、路由 `/web/home` `/mobile/home` `/desktop/home`、路径 `foundation/design/prototype/` 全计划一致。
