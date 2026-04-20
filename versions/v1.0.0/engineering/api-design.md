# v1.0.0 接口设计稿

> 本文档为版本内接口设计稿，非正式 API 文档
> 发布后正式文档归档至 [engineering/docs/api-docs/openapi.yaml](../../../engineering/docs/api-docs/openapi.yaml)
> 需求文档见 [product/requirements.md](../product/requirements.md)
> 技术方案见 [tech-solution.md](./tech-solution.md)
>
> **本文档遵循组织级 API 设计规范（product_spec skill - API 设计规范）**

---

## 接口总览

| 接口名称 | 方法 | 路径 | 描述 | 认证 | 状态 |
|---------|------|------|------|------|------|
| <!-- 接口名 --> | POST | /v1/... | <!-- 描述 --> | 否 | 新增 |

> 状态：新增 / 修改（需查看「变更说明」节）/ 废弃（需查看「废弃接口」节）

---

## 通用约定

### Base URL

```
开发环境：http://localhost:8080
其他环境：见 engineering/docs/environments.md
```

### 认证方式

<!-- 说明认证机制，例如：
- 需认证的接口在 Authorization Header 传入：Bearer {token}
- Token 过期：服务端返回 UNAUTHENTICATED
-->

### 统一响应结构

所有接口统一使用以下结构，无例外：

```json
{
  "code": "SUCCESS",
  "message": "操作成功",
  "data": {},
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-04-18T10:00:00+08:00"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | String | 业务状态码，成功为 `SUCCESS`，错误见下表 |
| message | String | 人类可读描述 |
| data | Any | 业务数据，无数据时为 `null` |
| requestId | String | 服务端生成的请求追踪 ID，UUID4 |
| timestamp | String | 服务端响应时间，ISO 8601 |

### 业务状态码

| code | HTTP 状态码 | 含义 |
|------|------------|------|
| `SUCCESS` | 200 / 201 / 202 | 操作成功 |
| `INVALID_ARGUMENT` | 400 | 请求参数错误、格式不合法 |
| `UNAUTHENTICATED` | 401 | 未登录或 Token 无效 |
| `PERMISSION_DENIED` | 403 | 无权限 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `ALREADY_EXISTS` | 409 | 资源已存在 |
| `ABORTED` | 409 | 操作中止（如 ETag 不匹配）|
| `FAILED_PRECONDITION` | 422 | 业务前提条件不满足 |
| `RESOURCE_EXHAUSTED` | 429 | 触发限流 |
| `INTERNAL` | 500 | 服务器内部错误 |

> DELETE 操作成功返回 HTTP 200，data 为 null，不使用 204

### 请求格式

- 请求体格式：JSON，客户端须设置 `Content-Type: application/json`
- 字符编码：UTF-8
- 时间格式：ISO 8601（`2026-04-18T10:00:00+08:00`）
- **字段命名**：请求体与响应体的字段名统一使用 **lowerCamelCase**（如 `createTime`、`expireIn`）
- 空值处理：字段缺失与字段值为 null 含义相同
- **大整数处理**：ID 等超过 2^53 的整数以 string 类型返回，避免前端精度丢失
- **DELETE 响应**：成功返回 HTTP 200，data 为 null，不使用 204

### 参数校验错误

```json
HTTP 400
{
  "code": "INVALID_ARGUMENT",
  "message": "请求参数校验失败",
  "data": {
    "errors": [
      {"field": "phone", "message": "手机号格式不正确"}
    ]
  }
}
```

### 限流处理

```
HTTP 429，code: RESOURCE_EXHAUSTED
响应头：
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 0
  X-RateLimit-Reset: 1745000000
  Retry-After: 60
```

### 分页约定

<!-- 本版本有列表接口时填写，无则填「本版本无列表接口」

请求参数：
- pageSize：每页最大数量，不传时使用服务端默认值
- pageToken：翻页令牌，来自上一页响应的 nextPageToken

响应结构中 nextPageToken 为空字符串表示最后一页
无结果时返回 HTTP 200 + 空数组（`"list": []`），不返回 NOT_FOUND
-->

### 幂等性约定

需要幂等保证的写操作，在请求体中携带 `requestId`（UUID4）：

```json
{
  "title": "New Book",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

> 请求体中的 requestId 是客户端生成的幂等键；响应中的 requestId 是服务端生成的追踪 ID，两者含义不同

---

## 本版本错误码

> 新增接口须在此登记业务特定错误，通用错误码（INVALID_ARGUMENT 等）无需重复登记

| code | HTTP 状态码 | 描述 | 触发场景 |
|------|------------|------|---------|
| <!-- 如：`VERIFICATION_CODE_INVALID` --> | 400 | <!-- 验证码错误或已过期 --> | <!-- --> |

---

## 接口详情

---

### {方法} {路径}

**描述**：<!-- -->
**认证**：需要 / 不需要

**路径参数**：<!-- 无则删除此节 -->

| 参数 | 类型 | 说明 |
|------|------|------|
| <!-- id --> | string | <!-- 资源 ID --> |

**查询参数**：<!-- 无则删除此节 -->

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| <!-- pageSize --> | number | 否 | <!-- --> |

**请求体**：<!-- GET/DELETE 无请求体则删除此节 -->

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| <!-- phone --> | string | 是 | <!-- 手机号 --> | "13800138000" |

**请求示例**：
```http
POST /v1/auth/sendCode
Content-Type: application/json

{
  "phone": "13800138000"
}
```

**成功响应**（HTTP 200）：
```json
{
  "code": "SUCCESS",
  "message": "操作成功",
  "data": {
    "expireIn": 300
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-04-18T10:00:00+08:00"
}
```

**错误响应**：

| code | HTTP 状态码 | 触发场景 |
|------|------------|---------|
| `INVALID_ARGUMENT` | 400 | 参数格式不正确 |

**注意事项**：
<!-- 前后端共同关注的边界情况 -->

---

## 变更说明

<!-- 本版本修改了现有接口时填写，无则删除此节

### {接口名称} {方法} {路径}

**变更类型**：新增字段 / 修改字段 / 删除字段 / 修改行为
**向后兼容**：是 / 否

| 变更项 | 变更前 | 变更后 | 说明 |
|--------|--------|--------|------|
-->

---

## 废弃接口

<!-- 本版本废弃的接口，无则删除此节
> 废弃接口在计划下线版本前仍正常可用，建议尽快迁移至替代接口

| 方法 | 路径 | 废弃原因 | 替代接口 | 计划下线版本 |
|------|------|---------|---------|------------|
-->

---

## 说明

- 本文档为设计稿，实现过程中对接口的任何调整（路径、方法、字段、错误码、状态码等）须同步更新本文档
- 业务特定错误码须先在「本版本错误码」表中登记
- 字段命名统一使用 lowerCamelCase，见本文档「请求格式」节
- 本文档变更通过 CHANGES.md 统一追踪 → 见 [CHANGES.md](../CHANGES.md)
