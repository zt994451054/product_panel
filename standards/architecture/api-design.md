# API 设计规范

> **主标准**：[Google API Improvement Proposals (AIP)](https://google.aip.dev/)
> **补充标准**：[Zalando RESTful API Guidelines](https://opensource.zalando.com/restful-api-guidelines/)（AIP 未覆盖部分）
> **响应格式**：推荐统一信封结构（code 字段命名参考 [gRPC Status Codes](https://grpc.github.io/grpc/core/md_doc_statuscodes.html)）；项目也可采用 AIP 原生风格或 [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) Problem Details，见「统一响应结构」一节

---

## 核心原则（AIP-121）

资源导向设计的三个基础：

1. **资源为中心**：API 围绕资源（名词）设计，方法描述对资源的操作
2. **标准方法优先**：优先使用 Get/List/Create/Update/Delete 五种标准方法，不能表达时才使用自定义方法（AIP-136）
3. **强一致性**：同类操作在所有资源中保持相同的模式

---

## HTTP 方法（AIP-121）

【必须】按语义使用 HTTP 方法：

| 方法 | 语义 | 幂等 | 安全 | 标准方法对应 |
|------|------|------|------|------------|
| GET | 读取资源 | ✅ | ✅ | Get / List |
| POST | 创建资源 / 触发操作 | ❌ | ❌ | Create / 自定义方法 |
| PUT | 全量替换资源 | ✅ | ❌ | —（AIP 不推荐，用 PATCH 替代）|
| PATCH | 部分更新资源 | ❌ | ❌ | Update |
| DELETE | 删除资源 | ✅ | ❌ | Delete |

> **安全（Safe）**：不修改服务器状态；**幂等（Idempotent）**：多次调用结果相同

---

## 资源命名（AIP-122）

【必须】URL 路径使用**复数名词**（集合），路径段使用 `kebab-case`（小写 + 连字符）：

```
✅ GET  /v1/publishers/{publisher}/books
✅ POST /v1/publishers/{publisher}/books
✅ GET  /v1/publishers/{publisher}/books/{book}
❌ GET  /v1/getBook
❌ POST /v1/createBook
❌ GET  /v1/publisherBooks
```

【必须】路径参数表示资源标识符，查询参数表示过滤/排序/分页：

```
✅ GET /v1/publishers/{publisher}/books?filter=author="Hugo"&pageSize=20
❌ GET /v1/getBooksByAuthor?publisher=xxx&author=Hugo
```

【必须】路径段全小写，使用 `kebab-case`，不使用驼峰或下划线：

```
✅ /v1/user-profiles
✅ /v1/order-items/{orderId}
✅ /v1/payment-methods
❌ /v1/userProfiles
❌ /v1/user_profiles
```

> 路径参数的占位名（如 `{orderId}`）是文档中的变量名，按字段规范使用 lowerCamelCase；路径中的字面段才使用 `kebab-case`。

资源嵌套**不超过 2 层**，超过时提升为顶级资源：

```
✅ /v1/publishers/{publisher}/books/{book}
⚠️ /v1/publishers/{publisher}/books/{book}/chapters  改为 /v1/chapters?book=xxx
```

---

## 版本控制（AIP-185）

【必须】在 URL 路径的首段（资源路径之前）包含主版本号，格式 `/v{N}`：

```
✅ /v1/publishers
✅ /v2/publishers
❌ /publishers
❌ /api/v1/publishers
```

**版本升级规则：**

| 变更类型 | 是否升版本 |
|---------|----------|
| 新增字段 / 端点（向下兼容） | ❌ 无需升版本 |
| 修改 / 删除已有字段 | ✅ 必须升主版本 |
| 修改业务语义 | ✅ 必须升主版本 |
| 修改错误码含义 | ✅ 必须升主版本 |

---

## 统一响应结构

【推荐】采用统一信封结构，**同一项目内所有接口（成功和错误）使用同一套结构，不混用**。这是推荐方案而不是唯一选择，项目可以在以下三种风格中择一，并在项目的接口设计文档中写明：

| 风格 | 说明 |
|------|------|
| 统一信封（本节推荐方案）| 所有响应包一层 `code/message/data/requestId/timestamp`，业务状态码放在 `code` 中 |
| AIP / gRPC 原生风格 | 成功时直接返回资源，错误时用 HTTP 状态码 + 标准错误体（`code/message/details`），不包信封 |
| RFC 9457 Problem Details | 成功时直接返回资源，错误时返回 `application/problem+json`（`type/title/status/detail/instance`）|

选择非信封风格时，本页后文示例中 `data` 外层的信封字段随之省略（分页的 `nextPageToken`、长耗时操作的 Operation、`etag` 等直接作为响应体字段），其余约定不变；`DELETE` 可按 HTTP 惯例返回 204。以下以统一信封为例：

```json
{
  "code": "SUCCESS",
  "message": "操作成功",
  "data": {},
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-04-10T10:00:00+08:00"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | String | 业务状态码，成功为 `SUCCESS`，错误见下表 |
| `message` | String | 人类可读描述，成功或错误说明 |
| `data` | Any | 业务数据；无数据时为 `null` |
| `requestId` | String | 请求唯一 ID，用于日志追踪，UUID4 格式，由服务端生成并回传 |
| `timestamp` | String | 服务端响应时间，ISO 8601 格式 |

### 业务状态码（code）

`code` 使用 `UPPER_SNAKE_CASE` 字符串，命名参考 gRPC Status Codes：

| code | HTTP 状态码 | 含义 |
|------|------------|------|
| `SUCCESS` | 200 / 201 / 202 | 操作成功 |
| `INVALID_ARGUMENT` | 400 | 请求参数错误、格式不合法 |
| `UNAUTHENTICATED` | 401 | 未登录或 Token 无效 |
| `PERMISSION_DENIED` | 403 | 无权限执行此操作 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `ALREADY_EXISTS` | 409 | 资源已存在（重复创建）|
| `ABORTED` | 409 | 操作中止（如 ETag 不匹配）|
| `FAILED_PRECONDITION` | 422 | 业务前提条件不满足 |
| `RESOURCE_EXHAUSTED` | 429 | 触发限流 |
| `INTERNAL` | 500 | 服务器内部错误 |

> 采用统一信封时，DELETE 操作成功返回 200，`data` 为 `null`，不使用 204 No Content，以保持统一响应结构。

### 错误响应示例

```json
// 单个错误
{
  "code": "NOT_FOUND",
  "message": "用户 ID 10086 不存在",
  "data": null,
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-04-10T10:00:00+08:00"
}

// 多字段校验错误
{
  "code": "INVALID_ARGUMENT",
  "message": "请求参数校验失败",
  "data": {
    "errors": [
      {"field": "email", "message": "邮箱格式不正确"},
      {"field": "age",   "message": "年龄必须在 1-150 之间"}
    ]
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-04-10T10:00:00+08:00"
}
```

---

## 标准字段（AIP-148）

所有资源必须使用以下标准字段名，不得自定义等效字段：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `createTime` | String（ISO 8601）| 资源创建时间，只读 |
| `updateTime` | String（ISO 8601）| 最后更新时间，只读 |
| `deleteTime` | String（ISO 8601）| 软删除时间，只读（支持软删除时必须提供）|

时间格式统一使用 **ISO 8601**，全系统保持一致：

```json
✅ {"createTime": "2026-04-10T10:00:00+08:00"}
❌ {"created_at": 1714310400}
❌ {"createTime": "2026-04-10 10:00:00"}
```

---

## 分页（AIP-158）

【必须】所有返回集合的接口**从一开始就实现分页**，后续再加分页是破坏性变更。

**请求参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `pageSize` | int32 | 每页最大数量，可选。不传或传 0 时服务端使用合理默认值（需文档说明）；超过最大值时自动降至上限，不报错 |
| `pageToken` | string | 翻页令牌，来自上一页响应的 `nextPageToken` |

**响应结构**（业务数据放在 `data` 中）：

```json
{
  "code": "SUCCESS",
  "message": "操作成功",
  "data": {
    "books": [...],
    "nextPageToken": "eyJpZCI6MTIwfQ"
  },
  "requestId": "...",
  "timestamp": "..."
}
```

`nextPageToken` **为空字符串表示已到最后一页**，这是唯一的结束信号。

**`pageToken` 不透明性要求（AIP-158）：**
- 必须是不透明字符串，不得暴露分页实现细节
- Base64 编码明文不算足够的混淆

---

## 过滤（AIP-160）

【必须】List 接口的过滤使用**单一 `filter` 字符串参数**：

```
✅ GET /v1/books?filter=author="Hugo" AND published=true
❌ GET /v1/books?author=Hugo&published=true
```

**`filter` 支持的语法：**

| 语法 | 示例 | 含义 |
|------|------|------|
| 字段比较 | `status = "ACTIVE"` | 等于 |
| 不等于 | `status != "DELETED"` | 不等于 |
| 范围 | `createTime > "2026-01-01T00:00:00Z"` | 大于 |
| 逻辑 AND | `a AND b` | 且（注意：OR 优先级高于 AND）|
| 逻辑 OR | `a OR b OR c` | 或 |
| 否定 | `NOT a` 或 `-a` | 非 |
| 包含（集合）| `tags:fiction` | 集合中包含 |
| 通配符 | `title = "Go*"` | 以 Go 开头 |

**排序**使用独立的 `orderBy` 参数：

```
GET /v1/books?filter=status="ACTIVE"&orderBy=createTime desc,title asc
```

---

## 自定义方法（AIP-136）

当标准方法（Get/List/Create/Update/Delete）无法表达业务意图时，使用自定义方法。

**URI 格式**：`POST /v1/{资源路径}:{动词}`

```
✅ POST /v1/publishers/123/books/456:archive
✅ POST /v1/publishers/123/books:batchDelete
✅ POST /v1/users/me:generateToken
```

**命名规则（AIP-136）：**

- 动词后可跟名词，如 `:archiveBook`、`:generateReport`
- **不得**包含介词（`for`、`with`、`by` 等）：`❌ :getBookByAuthor` → 改为 List 加 filter
- **不得**使用标准方法动词（Get/List/Create/Update/Delete）
- **不得**使用 `Async` 后缀
- 有副作用或修改数据用 `POST`；纯读取用 `GET`

---

## 软删除（AIP-164）

支持"回收站"类功能时，使用软删除模式：

- `DELETE /v1/books/{book}` → 标记 `deleteTime`，资源进入已删除状态
- `POST /v1/books/{book}:undelete` → 恢复
- 资源在 `purgeTime` 后被彻底清除

**List / Get 行为：**

- `GET /v1/books/{book}`：已软删除的资源返回 `{"code": "NOT_FOUND", ...}`
- `GET /v1/books`（List）：默认不返回已软删除的资源
- 如需查询已删除资源：`GET /v1/books?showDeleted=true`

---

## 长耗时操作（AIP-151）

导出、批量处理等操作返回 `202 Accepted`，`data` 中包含 Operation 资源：

```json
// 触发操作
POST /v1/publishers/123/books:export
→ 202 Accepted
{
  "code": "SUCCESS",
  "message": "任务已创建，处理中",
  "data": {
    "operationId": "export-abc123",
    "done": false,
    "progress": 0
  },
  "requestId": "...",
  "timestamp": "..."
}

// 客户端轮询
GET /v1/operations/export-abc123
→ {"code": "SUCCESS", "data": {"operationId": "...", "done": false, "progress": 60}, ...}
→ {"code": "SUCCESS", "data": {"operationId": "...", "done": true, "result": {"downloadUrl": "..."}}, ...}
```

---

## 字段规范

【必须】请求/响应字段使用 **lowerCamelCase**（Google AIP 标准）：

```json
✅ {"userId": 123, "createTime": "2026-04-10T10:00:00+08:00"}
❌ {"user_id": 123, "create_time": "..."}
```

【必须】金额使用整数（最小货币单位），禁止浮点数：

```json
✅ {"amount": 1234}   // 12.34 元
❌ {"amount": 12.34}  // 浮点精度丢失
```

【必须】数组为空时返回 `[]`，不返回 `null`

【强制】同一主版本内禁止删除已有字段。废弃字段在文档中标注 `@deprecated`，保留期由项目约定（建议至少经过一个完整的主版本周期，并提前通知调用方）。

---

## 枚举类型（AIP-126）

【必须】枚举值使用 `UPPER_SNAKE_CASE`：

```json
✅ {"status": "ORDER_PENDING"}
❌ {"status": "order_pending"}
❌ {"status": "orderPending"}
❌ {"status": 1}
```

【必须】枚举的第一个值（零值）命名为 `{枚举名}_UNSPECIFIED`：

```
STATUS_UNSPECIFIED  // 未指定，不应在业务逻辑中出现
ACTIVE
INACTIVE
DELETED
```

**枚举 vs 字符串选型（AIP-126）：**

| 场景 | 使用 |
|------|------|
| 值集合变化频率低（≤ 每年一次）| 枚举（`UPPER_SNAKE_CASE` 字符串）|
| 值集合变化频繁 | 普通字符串，文档中说明合法值 |
| 已有行业标准表示（语言代码、MIME 类型等）| 直接用标准表示 |

【推荐】响应中新增枚举值时，客户端必须能优雅处理未知值，不应 crash。

---

## 请求幂等性（AIP-155）

【推荐】对需要保证幂等的写操作，请求体中携带 `requestId`（UUID4，36 个 ASCII 字符）：

```json
POST /v1/publishers/123/books
{
  "title": "New Book",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

> **说明**：请求体里的 `requestId` 是客户端生成的**幂等键**；响应结构里的 `requestId` 是服务端生成的**追踪 ID**，两者是不同的字段，但可以是同一个值（服务端将客户端提供的 `requestId` 回传到响应中）。

**服务端规则（AIP-155）：**
- 提供 `requestId` 时，**必须**保证幂等性
- 检测到重复请求时，返回第一次成功请求的响应
- `requestId` 应当是可选参数

---

## 资源并发控制（AIP-154）

对需要防止并发覆盖的资源，使用 `etag` 字段实现乐观锁：

```json
// GET 响应，data 中包含 etag
{
  "code": "SUCCESS",
  "data": {
    "id": "book-123",
    "title": "Hello World",
    "etag": "\"abc123\""
  },
  ...
}

// PATCH 更新时在请求体携带 etag
PATCH /v1/books/123
{
  "title": "Hello World 2nd Edition",
  "etag": "\"abc123\""
}
→ {"code": "SUCCESS", ...}      etag 匹配，更新成功
→ {"code": "ABORTED", ...}      etag 不匹配，资源已被他人修改
```

**规则（AIP-154）：**
- `etag` 字段必须命名为 `etag`，类型为字符串
- 服务端必须在资源输出时提供 `etag`，格式遵循 RFC 7232（值需包含引号，如 `"abc123"`）
- 用户传入 `etag` 匹配 → 必须放行
- 用户传入 `etag` 不匹配 → 必须返回 `{"code": "ABORTED", ...}`
- 用户未传 `etag` → 默认放行

---

## 向后兼容性（AIP-180）

**兼容性变更（同一主版本内允许）：**

| 操作 | 是否兼容 |
|------|---------|
| 新增字段 / 端点 | ✅ |
| 新增枚举值 | ⚠️ 谨慎（客户端需能处理未知值）|
| 放宽字段验证规则 | ✅ |

**破坏性变更（必须升主版本）：**

| 操作 | 原因 |
|------|------|
| 删除 / 重命名字段 | 客户端代码会 break |
| 修改字段类型 | 反序列化失败 |
| 修改字段默认值 | 改变现有行为语义 |
| 修改字段值的格式 / 算法 | 客户端可能依赖特定格式解析 |
| 新增**必填**请求字段 | 老客户端不传该字段报错 |
| 收紧字段验证规则 | 之前合法的请求变为非法 |
| 改变分页默认值导致结果截断 | 老客户端以为拿到了全量数据 |

【强制】同一主版本内**禁止**任何破坏性变更，必须先升主版本。

---

## 部分响应（AIP-157）

对字段多的资源，**可以**支持字段筛选，通过 `readMask` 参数指定只返回哪些字段：

```
GET /v1/publishers/123/books?readMask=id,title,createTime
```

响应 `data` 中只包含指定字段。`readMask` 必须可选，不传时返回全部字段，传 `*` 同效。此功能为可选实现，字段数量多时才值得引入。

---

## 安全（AIP-211）

【必须】所有接口必须进行权限校验，即使是查询接口

【必须】用户身份（userId、tenantId 等）从服务端解析 Token 获得，禁止从请求参数传入

【必须】涉及资源归属的查询必须附带归属条件，防止越权访问

---

## 限流（Zalando 补充）

【必须】所有对外 API 配置限流，触发 429 时附带响应头：

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1714310460
Retry-After: 60
```

---

## API 文档

【必须】所有 API 提供 **OpenAPI 3.0（Swagger）** 格式文档

【必须】每个端点包含：描述、请求参数说明（含 `filter` 语法示例）、响应示例、错误码列表

【必须】接口文档与实现保持一致，不允许长期存在文档与实现不符的状态。

【推荐】设计先行：先写接口设计稿，评审通过后再开发；发布后把已上线接口合入全量 OpenAPI 基线（本模板的做法见 [OpenAPI 基线](../../engineering/docs/api-docs/openapi.yaml)，版本内设计稿位于 `versions/{ver}/engineering/api-design.md`）。

【可选】通过代码注解或契约测试生成/校验 OpenAPI 文档，作为"文档与实现一致"的自动化检查手段，不取代设计稿。

## Related

- [接口签名与加解密规范](../security/auth-design.md)
- [安全基线规范](../security/security-baseline.md)
