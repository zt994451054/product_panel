# 研发工程总览

本项目所有研发工程（前端 / 后端 / 全栈 / 移动端 / 微服务等）统一在本清单登记。
代码 clone 到 `engineering/workspace/<工程名>/`（该目录已被 `.gitignore` 忽略，不纳入驱动面板）。

---

## 工程清单

| 工程名 | 类型 | 仓库地址 | 主分支 | 分支策略 | 本地路径 | 职责边界 | 详细说明 |
|-------|------|---------|--------|---------|---------|---------|---------|
| <!-- 如：web-frontend --> | <!-- 前端 / 后端 / 全栈 / 移动端 / 微服务 --> | <!-- git@... 或「待创建」--> | main | 见 `standards/engineering/standards.md` | `engineering/workspace/<工程名>/` | <!-- 一句话说明本工程负责什么 --> | <!-- 该工程仓库 README 的 URL --> |

> **一行清单 = 一个 git 仓库 = 一个 workspace 子目录**。
> 工程名建议 kebab-case（如 `web-frontend` / `api-server` / `admin` / `mobile-ios`）。
> 仓库未创建时，「仓库地址」列填「待创建」。

### 为什么本清单只做索引，不做详细

按 **C 分层归属原则**：

- **跨工程聚合内容** → 驱动面板维护（本清单 + `engineering/docs/` + `foundation/`）
- **单工程内部细节**（目录结构 / 启动方式 / 依赖版本 / 内部模块划分）→ **跟随工程走**，维护在各工程仓库自己的 README 里

「详细说明」列填写目标工程仓库 README 的 URL（或 docs/ 链接）。AI 需要了解单工程内细节时，clone 到 `engineering/workspace/<工程名>/` 后直接读其自带 README，不在驱动面板重复维护。

---

## Clone 到本地（通用）

对清单中每一个工程重复以下操作：

```bash
git clone <仓库地址> engineering/workspace/<工程名>
```

完整启动流程见 [docs/local-setup.md](./docs/local-setup.md)。

---

## 典型形态示例

> 下面四个是常见形态。实际项目按需复制清单行，数量不限。

### A. 前后端分离双仓（最常见）

| 工程名 | 类型 | 本地路径 | 职责边界 |
|-------|------|---------|---------|
| `web-frontend` | 前端 | `engineering/workspace/web-frontend/` | 浏览器侧 UI / 交互 / 渲染 |
| `api-server` | 后端 | `engineering/workspace/api-server/` | 业务逻辑 / 持久化 / 接口 |

### B. 单仓 monolith（Next.js SSR / Django 全栈 / Rails / Laravel）

| 工程名 | 类型 | 本地路径 | 职责边界 |
|-------|------|---------|---------|
| `app` | 全栈 | `engineering/workspace/app/` | 全栈渲染与业务逻辑 |

### C. 多端 + 微服务

| 工程名 | 类型 | 本地路径 | 职责边界 |
|-------|------|---------|---------|
| `web` | 前端 | `engineering/workspace/web/` | Web 端 UI |
| `mobile-ios` | 移动端 | `engineering/workspace/mobile-ios/` | iOS 原生 |
| `mobile-android` | 移动端 | `engineering/workspace/mobile-android/` | Android 原生 |
| `user-service` | 后端 / 微服务 | `engineering/workspace/user-service/` | 用户域 |
| `order-service` | 后端 / 微服务 | `engineering/workspace/order-service/` | 订单域 |

### D. 纯前端（浏览器扩展 / 静态站 / SPA 无服务端）

| 工程名 | 类型 | 本地路径 | 职责边界 |
|-------|------|---------|---------|
| `extension` | 前端 | `engineering/workspace/extension/` | Chrome 扩展 |

---

## 技术文档索引

| 文档 | 说明 |
|------|------|
| [docs/tech-stack.md](./docs/tech-stack.md) | 技术栈说明 |
| [docs/local-setup.md](./docs/local-setup.md) | 本地环境搭建 & 启动（通用模板） |
| [docs/environments.md](./docs/environments.md) | 多环境配置说明 |
| [docs/api-docs/openapi.yaml](./docs/api-docs/openapi.yaml) | 已发布正式 API 文档 |

> 技术架构基线见 `foundation/tech-arch/`。
> 研发规范见 `standards/engineering/`（前端 / 后端专项规范文件按职责分类，与本清单不冲突）。
