# 错误码规范

> 本规范与 [API 设计规范](../architecture/api-design.md) 的「业务状态码」章节配合使用。
> API 层的 `code` 字段定义见 API 设计规范。本规范补充应用层错误码的分层设计和注册规范。
> 版本新增的业务错误码登记在 `versions/{ver}/engineering/api-design.md` 的「本版本错误码」表。

---

## 错误码体系

错误码分两层：**HTTP 语义层**（HTTP 状态码）+ **业务语义层**（`code` 字段）

```
HTTP 状态码  ──→  通信层语义（4xx/5xx）
code 字段    ──→  业务层语义（具体是什么错）
```

### 第一层：HTTP 状态码（通信语义）

参见 API 设计规范的 HTTP 状态码表，不在此重复。

### 第二层：业务状态码（code）

格式：`UPPER_SNAKE_CASE` 字符串

```
成功：  SUCCESS
错误：  {分类前缀}_{具体错误}

示例：
  INVALID_ARGUMENT         # 通用参数错误
  ORDER_NOT_FOUND          # 业务特定错误
  PAYMENT_INSUFFICIENT_BALANCE  # 支付域错误
```

---

## 错误码分类

### 通用错误码（跨域复用）

命名直接使用错误类型，不加业务前缀。通用错误码清单及其 HTTP 状态码映射见 [API 设计规范](../architecture/api-design.md) 的「业务状态码」。

### 业务错误码（各服务自定义）

格式：`{业务域大写}_{错误描述}`

```
# 订单域
ORDER_NOT_FOUND                  # 订单不存在
ORDER_ALREADY_PAID               # 订单已支付
ORDER_CANNOT_CANCEL              # 订单状态不允许取消

# 用户域
USER_NOT_FOUND                   # 用户不存在
USER_ACCOUNT_DISABLED            # 账号已禁用
USER_PHONE_ALREADY_REGISTERED    # 手机号已注册

# 支付域
PAYMENT_INSUFFICIENT_BALANCE     # 余额不足
PAYMENT_AMOUNT_LIMIT_EXCEEDED    # 超出单笔限额
```

---

## 错误码设计规则

【必须】同一错误在整个系统中使用相同的 code，不允许不同模块各自定义语义相同的 code

【必须】code 必须是自描述的，不使用数字或不可读的缩写

```
✅ ORDER_NOT_FOUND
❌ 10001
❌ ORD_NF
```

【必须】通用错误码可直接使用；业务语义需要细分时加业务域前缀，避免跨域冲突

```
✅ NOT_FOUND           (通用错误码，无需区分业务时直接使用)
✅ ORDER_NOT_FOUND     (订单域)
✅ PRODUCT_NOT_FOUND   (商品域)
❌ NOT_FOUND_ORDER     (业务域不在前缀位置)
```

【推荐】每个服务维护一个错误码注册文件，集中管理本服务所有的 code 定义

---

## 错误码注册规范

每个服务在代码中集中定义错误码常量，禁止散写字符串：

```go
// Go：errors/codes.go
package errors

const (
    // 通用错误码
    CodeSuccess           = "SUCCESS"
    CodeInvalidArgument   = "INVALID_ARGUMENT"
    CodeNotFound          = "NOT_FOUND"

    // 订单域错误码
    CodeOrderNotFound        = "ORDER_NOT_FOUND"
    CodeOrderAlreadyPaid     = "ORDER_ALREADY_PAID"
    CodeOrderCannotCancel    = "ORDER_CANNOT_CANCEL"
)
```

```java
// Java：ErrorCode.java
public final class ErrorCode {
    // 通用
    public static final String SUCCESS = "SUCCESS";
    public static final String INVALID_ARGUMENT = "INVALID_ARGUMENT";

    // 订单域
    public static final String ORDER_NOT_FOUND = "ORDER_NOT_FOUND";
    public static final String ORDER_ALREADY_PAID = "ORDER_ALREADY_PAID";
}
```

```typescript
// TypeScript：error-codes.ts
export const ErrorCode = {
  SUCCESS: 'SUCCESS',
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_ALREADY_PAID: 'ORDER_ALREADY_PAID',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];
```

---

## 错误响应与 code 对应

错误发生时的响应结构示例如下，实际结构以项目 API 规范为准：

```json
{
  "code": "ORDER_NOT_FOUND",
  "message": "订单 ORD-20260413-001 不存在",
  "data": null,
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-04-13T10:00:00+08:00"
}
```

**`message` 字段规范：**
- 面向开发者，英文或中文均可
- 必须包含关键上下文（资源 ID 等），便于排查
- 不暴露系统内部实现细节（如 SQL 错误、堆栈信息）

## Related

- [API 设计规范](../architecture/api-design.md)（业务状态码定义）
- [错误与异常处理规范](error-handling.md)
