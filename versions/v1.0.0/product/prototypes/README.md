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
| 桌面端 | <!-- https://github.com/org/prototype-desktop --> | 桌面端原型工程 |

> **分支命名规则**：`{终端前缀}-{版本号}`
>
> | 终端 | 前缀 | 示例 |
> |------|------|------|
> | Web | `web-` | `web-v1.0.0` |
> | App(iOS/Android) | `app-` | `app-v1.0.0` |
> | 小程序 | `miniapp-` | `miniapp-v1.0.0` |
> | 桌面端 | `desktop-` | `desktop-v1.0.0` |
>
> 每个版本的迭代终端在 `requirements.md`「本版本交互终端」表中声明，AI 根据该表决定 clone 哪些分支。

---

## 本版本迭代范围

> 详细的终端迭代声明见 [requirements.md 本版本交互终端](../requirements.md#本版本交互终端)

| 终端 | 本版本是否迭代 | 参考分支 | 备注 |
|------|-------------|---------|------|
| Web | ✅ 已迭代 | web-v1.0.0 | |
| App | ❌ 未迭代 | - | 沿用上一版本设计 |
| 小程序 | ❌ 未迭代 | - | |

---

## 原型页面-需求模块映射

> AI 进行前端开发时，通过此表定位"实现哪个需求模块 → 参考哪个原型页面"。
> AI 编写测试用例时（SOP-03），也可通过此表确认 UI 层面的覆盖范围。

| 原型页面 / 路由 | 所属终端 | 对应需求模块 | 还原优先级 |
|---------------|---------|------------|----------|
| <!-- 如：/register --> | Web | [注册模块](../requirements.md#注册模块) | 高保真 |
| <!-- 如：/login --> | Web | [登录模块](../requirements.md#登录模块) | 高保真 |

> 还原优先级见下方「还原优先级」节。未迭代的终端无需填写。

---

## Clone 与启动

```bash
# 只 clone 本版本迭代的终端（终端和分支见 requirements.md「本版本交互终端」表）
# Web 原型（本版本已迭代）
git clone -b web-v1.0.0 --single-branch \
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
- 开发前先读产品前端工程的 components 目录，优先复用已有组件

**冲突优先级（从高到低）**：

| 优先级 | 文档 | 适用范围 |
|--------|------|---------|
| 1（最高） | `design-spec.md` 补充交互规则 | 原型未覆盖的交互逻辑、边界场景、权限渲染 |
| 2 | `standards/design/DESIGN.md` | 色彩、字体、间距等视觉 Token |
| 3 | 原型 | 页面布局、组件排布、整体视觉风格 |

> 实际开发中三者通常不冲突：原型提供视觉，DESIGN.md 提供 Token，design-spec.md 提供原型里画不清楚的逻辑。
> 出现真正冲突时，以上表优先级为准，并在 CHANGES.md 记录冲突情况及决策。
