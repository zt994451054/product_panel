# API 文档规范

> **主标准**：[OpenAPI Specification 3.0](https://spec.openapis.org/oas/v3.0.3)
> **副标准**：[Swagger Best Practices](https://swagger.io/resources/articles/best-practices-in-api-documentation/)

---

## 核心原则

1. **文档与实现一致**：文档是接口的唯一契约，不允许长期存在与实现不符的文档。生成方式二选一，见下文「文档生成方式」
2. **文档与代码同步**：接口变更必须同步更新文档；【推荐】在 CI 中检查文档是否过时
3. **面向消费者**：文档的受众是 API 调用方（前端、第三方、AI Agent），而非实现者

---

## OpenAPI 3.0 文档结构

每个 API 文档必须包含：

```yaml
openapi: "3.0.3"
info:
  title: 订单服务 API
  description: |
    订单服务提供订单的创建、查询、取消等操作。
    
    ## 认证方式
    所有接口需在 Header 中携带 `Authorization: Bearer <token>`
    
    ## 错误码说明
    见本项目的错误码定义（链接占位：{错误码文档地址}），写法参考 [错误码设计规范](../coding/error-code.md)。
  version: "1.0.0"
  contact:
    name: {负责团队名称}        # 占位，按项目实际填写
    email: api-owner@example.com  # 示例地址

servers:
  - url: https://api.example.com/v1
    description: 生产环境
  - url: https://api-staging.example.com/v1
    description: 预发布环境

paths:
  /orders:
    post:
      summary: 创建订单
      # ...

components:
  schemas:
    # 复用的数据模型
  responses:
    # 复用的响应定义
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

---

## 接口文档规范

每个接口必须包含以下信息：

```yaml
/orders/{orderId}:
  get:
    summary: 查询订单详情          # 必填：简短描述（≤ 50 字）
    description: |                 # 可选：详细说明
      根据订单 ID 查询订单详情。
      仅能查询当前登录用户的订单。
    operationId: getOrderById      # 必填：唯一操作 ID（驼峰命名）
    tags:
      - Orders                     # 必填：接口分组
    security:
      - BearerAuth: []             # 必填：认证方式
    parameters:
      - name: orderId
        in: path
        required: true
        description: 订单唯一 ID（UUID4 格式）
        schema:
          type: string
          example: "550e8400-e29b-41d4-a716-446655440000"
    responses:
      "200":
        description: 查询成功
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/OrderResponse"
            example:                # 必填：至少一个完整的响应示例
              code: "SUCCESS"
              message: "操作成功"
              data:
                orderId: "550e8400-e29b-41d4-a716-446655440000"
                status: "PAID"
                amount: 12800
      "404":
        description: 订单不存在
        content:
          application/json:
            example:
              code: "NOT_FOUND"
              message: "订单 550e8400 不存在"
              data: null
```

---

## 数据模型文档规范

```yaml
components:
  schemas:
    CreateOrderRequest:
      type: object
      required:           # 必填字段列表
        - userId
        - items
      properties:
        userId:
          type: string
          description: 下单用户 ID
          example: "user-10086"
        items:
          type: array
          description: 订单商品列表，至少包含 1 个商品
          minItems: 1
          items:
            $ref: "#/components/schemas/OrderItem"
        remark:
          type: string
          description: 订单备注，可选
          maxLength: 200
          example: "请在工作日送货"

    OrderItem:
      type: object
      required:
        - productId
        - quantity
        - price
      properties:
        productId:
          type: string
          description: 商品 ID
        quantity:
          type: integer
          description: 购买数量
          minimum: 1
          maximum: 999
        price:
          type: integer
          description: 单价（分），如 12800 表示 128.00 元
          minimum: 1
```

---

## 枚举类型文档规范

```yaml
OrderStatus:
  type: string
  description: |
    订单状态枚举值：
    - `PENDING`：待支付
    - `PAID`：已支付
    - `SHIPPED`：已发货
    - `COMPLETED`：已完成
    - `CANCELLED`：已取消
  enum:
    - PENDING
    - PAID
    - SHIPPED
    - COMPLETED
    - CANCELLED
  example: PAID
```

---

## 文档生成方式

两种方式二选一，项目在工程清单或技术方案中写明所选方式：

| 方式 | 做法 | 面板中的落档 |
|------|------|-------------|
| **design-first（面板默认）** | 技术方案阶段先写 `versions/{ver}/engineering/api-design.md`，发布后合入手工维护的基线 `engineering/docs/api-docs/openapi.yaml`（SOP-02、SOP-07） | 基线文件可以手工维护，实现与基线不一致即为缺陷 |
| **code-first** | 在代码中用注解生成 OpenAPI 文档，不手工维护生成产物 | 发布时以生成产物回填基线 `openapi.yaml`；【禁止】直接修改生成的 Swagger JSON/YAML，应修改代码注解 |

## 各语言文档生成方式（code-first 时参考）

| 语言 | 工具 | 说明 |
|------|------|------|
| Go | [swaggo/swag](https://github.com/swaggo/swag) | 注解生成 Swagger |
| Java | [SpringDoc OpenAPI](https://springdoc.org/) | Spring Boot 自动生成 |
| Python | [FastAPI](https://fastapi.tiangolo.com/)（自动）/ [drf-spectacular](https://github.com/tfranzel/drf-spectacular)（Django）| |
| Node.js | [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc) | JSDoc 注解生成 |

**Go 注解示例：**

```go
// @Summary      查询订单详情
// @Description  根据订单 ID 查询详情，仅能查询当前用户的订单
// @Tags         Orders
// @Accept       json
// @Produce      json
// @Param        orderId  path  string  true  "订单 ID"
// @Success      200  {object}  response.OrderResponse
// @Failure      404  {object}  response.ErrorResponse
// @Router       /orders/{orderId} [get]
// @Security     BearerAuth
func GetOrder(c *gin.Context) { ... }
```

**Java 注解示例：**

```java
@Operation(
    summary = "查询订单详情",
    description = "根据订单 ID 查询详情，仅能查询当前用户的订单"
)
@ApiResponse(responseCode = "200", description = "查询成功",
    content = @Content(schema = @Schema(implementation = OrderResponse.class)))
@ApiResponse(responseCode = "404", description = "订单不存在")
@GetMapping("/orders/{orderId}")
public ResponseEntity<OrderResponse> getOrder(
    @Parameter(description = "订单 ID") @PathVariable String orderId) { ... }
```

---

## 文档质量检查

【必须】每个接口必须有：
- `summary`（简短描述）
- `operationId`（唯一 ID）
- 至少一个 `200` 响应示例
- 所有错误响应的文档

【推荐】在 CI 流水线中运行 OpenAPI lint 检查（如 [Spectral](https://stoplight.io/open-source/spectral)）

【禁止】code-first 方式下直接修改生成的 Swagger JSON/YAML 文件，应修改代码注解

## Related

- [API 设计规范](../architecture/api-design.md)
- [技术文档撰写规范](tech-doc-writing.md)
