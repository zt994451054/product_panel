# 变更日志规范

> **主标准**：[Keep a Changelog 1.1.0](https://keepachangelog.com/)
> **副标准**：[Semantic Versioning 2.0.0](https://semver.org/)


## 适用范围与分工

本页约束的是**面向发布对象的变更记录**：工程仓库的 `CHANGELOG.md`，以及对外的 Release Notes。它们是可选建议，项目按需采用。

面板里有几份名字相近、用途不同的记录，互不替代：

| 记录 | 位置 | 用途 | 面向 |
|------|------|------|------|
| `CHANGES.md` | `versions/{ver}/CHANGES.md` | 版本进行中的变更留痕（SOP-04）：CHANGE-xxx、变更阶段、原因、影响范围、负责人；先记录后改文档 | 内部协作与 AI 执行 |
| 基线 changelog | `foundation/product-arch/changelog.md`、`foundation/tech-arch/changelog.md` | 产品架构、技术架构基线的变更历史 | 内部 |
| `CHANGELOG.md` / Release Notes | 工程仓库 / 发布渠道 | 每个已发布版本的变更摘要（Keep a Changelog） | 使用方、调用方、运营 |

Release Notes 不要求从 `CHANGES.md` 自动生成：`CHANGES.md` 记录的是需求、设计、方案的变动过程，发布记录关心的是使用方可见的结果，写发布记录时可以参考它，但内容和口径独立撰写。面板内的版本变更一律走 `CHANGES.md`（SOP-04），不因为有了 `CHANGELOG.md` 而省略。

---

## 为什么需要变更日志

> "变更日志是为人而写的，不是为机器。"——Keep a Changelog

- **用户**：了解升级后有哪些新功能、修复了什么 Bug、有哪些不兼容变更
- **开发者**：快速了解项目历史，追溯某个变更的上下文
- **AI Agent**：理解系统版本演进，判断当前版本的能力边界

---

## 语义化版本（Semantic Versioning）

版本号格式：`MAJOR.MINOR.PATCH`（如 `2.3.1`），统一三段式，不使用四段式。git tag 和面板版本目录写作 `vX.Y.Z`（如 `v2.3.1`）；热修复版本升 PATCH（见 SOP-11）

| 版本位 | 触发条件 | 示例 |
|--------|---------|------|
| **MAJOR**（主版本）| 不兼容的 API 变更（Breaking Change）| `1.x.x → 2.0.0` |
| **MINOR**（次版本）| 向下兼容的新功能 | `1.2.x → 1.3.0` |
| **PATCH**（修订版）| 向下兼容的 Bug 修复 | `1.2.3 → 1.2.4` |

**预发布版本：**
```
1.0.0-alpha.1    # Alpha 测试版
1.0.0-beta.2     # Beta 测试版
1.0.0-rc.1       # Release Candidate
```

---

## CHANGELOG.md 格式规范（Keep a Changelog）

```markdown
# Changelog

本文件记录所有重要的版本变更。
格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]
### Added
- 正在开发中、尚未发布的新功能

## [2.1.0] - 2026-04-13
### Added
- 新增用户头像上传功能，支持 JPG/PNG/WebP 格式
- 新增 /v1/users/{id}/avatar 接口

### Changed
- 订单列表 API 分页方式从偏移分页改为游标分页（向下兼容）

### Fixed
- 修复订单金额在高并发场景下的精度丢失问题 (#1234)
- 修复用户登出后 Token 未立即失效的问题 (#1201)

### Deprecated
- `GET /v1/orders?page=` 偏移分页参数将在 v3.0.0 中移除，请迁移到游标分页

## [2.0.0] - 2026-03-01
### Changed
- **BREAKING**：认证方式从 Session 改为 JWT，所有客户端需更新认证逻辑
- **BREAKING**：响应格式统一：`{"code":"SUCCESS","data":{}}`，旧格式不再支持

### Added
- 新增 OAuth 2.0 第三方登录（微信、Apple）

### Removed
- 移除已废弃的 `/api/v1/user/info` 接口，请使用 `/v1/users/me`

## [1.5.2] - 2026-02-15
### Fixed
- 修复部分安卓设备无法上传图片的问题

## [1.5.1] - 2026-02-10
### Security
- 修复 SSRF 漏洞，文件下载接口不再允许任意 URL

[Unreleased]: https://github.com/example-org/example-service/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/example-org/example-service/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/example-org/example-service/compare/v1.5.2...v2.0.0
```

---

## 变更类型说明（Keep a Changelog 规范）

| 类型 | 说明 | 示例 |
|------|------|------|
| **Added** | 新增功能 | 新增接口、新增字段 |
| **Changed** | 变更现有功能（向下兼容）| 调整返回字段顺序、修改默认值 |
| **Deprecated** | 即将移除的功能 | 告知用户某接口将在下个版本废弃 |
| **Removed** | 移除功能（通常是 Breaking Change，需加粗标注 **BREAKING**）| 删除废弃接口、删除字段 |
| **Fixed** | Bug 修复 | 关联 Issue 编号 |
| **Security** | 安全漏洞修复 | 必须说明漏洞类型和影响范围 |

---

## 规则

【必须】工程仓库维护 CHANGELOG 时，每次发版必须更新，先更新 `[Unreleased]` 区块，发版时将其改为版本号

【必须】Breaking Change 必须在 CHANGELOG 中**明确标注**（在 Changed / Removed 条目前加粗 **BREAKING**）并说明迁移方式

【必须】安全漏洞修复使用 `Security` 类型，说明漏洞影响（不暴露具体利用方式）

【禁止】使用 "各种修复"、"性能优化" 等模糊描述，每条变更必须具体

【推荐】Bug 修复关联 Issue 编号：`修复用户登录失败问题 (#1234)`

【推荐】在 git tag 和 GitHub/GitLab Release 中同步发布变更日志

---

## 自动化工具

基于 Conventional Commits 自动生成 CHANGELOG：

```bash
# 以 release-please / changesets / semantic-release 等工具为例（任选其一，按项目技术栈决定）：
# - 根据 commit 自动生成 CHANGELOG 和版本号
# - 自动更新 package.json 等文件的版本号
# - 自动创建 git tag 或发布 PR
```

注：旧工具 `standard-version` 已停止维护，不建议新项目采用。

**与 Conventional Commits 的关系：**

```
commit type → CHANGELOG 类型 → SemVer 升级
feat        → Added           → MINOR
fix         → Fixed           → PATCH
perf        → Changed         → PATCH
docs/style  → 不出现在 CHANGELOG
BREAKING    → Removed/Changed → MAJOR
```

---

## API 版本变更说明规范

当 API 接口发生变更时，除了 CHANGELOG.md，还需要在接口文档中标注：

```yaml
# 废弃的接口
/v1/users/info:
  get:
    deprecated: true          # OpenAPI 废弃标记
    summary: "[废弃] 获取用户信息"
    description: |
      ⚠️ 此接口已废弃，将在 v3.0.0 中移除。
      请迁移到 GET /v1/users/me
```

## Related

- [Commit Message 规范](../version-control/commit-convention.md)（与 CHANGELOG 自动化关联）
- [API 文档规范](api-doc.md)（API 接口废弃标注）
