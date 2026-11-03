# JavaScript / TypeScript 编码规范

> **主标准**：[Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
> **参考**：[JSDoc](https://jsdoc.app/)

跨语言原则见 [通用编码规范](../general.md)、[代码注释规范](../code-comments.md)、[错误与异常处理规范](../error-handling.md)、[日志规范](../logging.md)。

---

## 格式与编码实践

格式化工具：`prettier` + `eslint`。

```typescript
// prettier + eslint（Airbnb 规则集）
// 缩进：2 空格；引号：单引号；分号：必须

// ✅ 优先用 const，需要重赋值才用 let，禁止 var
const MAX_RETRY = 3;
let retryCount = 0;

// ✅ 解构赋值
const { userId, email } = user;
const [first, ...rest] = items;

// ✅ 对象/数组字面量末尾逗号（trailing comma）
const config = {
  timeout: 5000,
  retries: 3,   // ← 末尾逗号，diff 更干净
};

// ✅ 箭头函数（方法除外）
const double = (n: number): number => n * 2;

// ✅ 可选链和空值合并
const name = user?.profile?.name ?? 'Anonymous';

// ✅ async/await，避免 Promise 链
async function fetchUser(id: string): Promise<User> {
  const user = await userRepo.find(id);
  if (!user) throw new NotFoundError(`User ${id}`);
  return user;
}

// ✅ 类型收窄
function process(input: string | number) {
  if (typeof input === 'string') {
    return input.toUpperCase();  // 此处 TS 知道是 string
  }
  return input * 2;
}

// ❌ 禁止 any
const data: any = fetchData();   // ❌
const data: unknown = fetchData();  // ✅ 使用 unknown 后需要类型守卫
```

### TypeScript 工程约束

【必须】`tsconfig` 开启以下严格项：

- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUncheckedIndexedAccess: true`

【必须】禁止新增裸 `any`；无法立刻确定类型时优先 `unknown` 并在使用点收窄。

【必须】接口边界（API 入参/出参、组件 Props、公共函数返回值）显式声明类型。

【必须】共享结构优先 `interface`，联合类型与映射类型用于表达状态与变体，不滥用类型断言。

【必须】禁止 `@ts-ignore` 常态化使用；确需使用时附 1 行原因注释与清理计划。

### API 类型与数据安全

【推荐】接口类型由 OpenAPI/契约生成，减少手写漂移。

【推荐】后端返回数据先做运行时校验（如 zod/schema 校验）再进入核心业务流。

【推荐】金额、时间、状态枚举在前端保留独立类型定义，避免魔法数字与魔法字符串。

---

## 命名

```typescript
// 变量/函数：camelCase
const retryCount = 0;
const getUserById = async (userId: string): Promise<User> => { ... };

// 类/接口/类型：PascalCase
class OrderService { }
interface CreateOrderRequest { }
type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED';

// 常量（模块级真常量）：UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';

// 布尔变量：is/has/can/should 前缀
const isLoading = false;
const hasPermission = true;
const canEdit = false;

// 包/模块、文件命名：kebab-case（React 组件除外）
// order-service.ts       ✅ 普通模块
// OrderCard.tsx          ✅ React 组件（PascalCase）
// OrderService.ts        ❌ 普通模块不用 PascalCase

// 私有类成员：_ 前缀（TS 有 private 但习惯保留 _）
class UserService {
  private readonly _repository: UserRepository;
}
```

---

## 注释

```typescript
/**
 * Finds a user by their unique identifier.
 *
 * @param userId - The unique identifier of the user
 * @param options - Optional configuration
 * @param options.includeDeleted - Whether to include soft-deleted users
 * @returns The user object, or null if not found
 * @throws {DatabaseError} When the database query fails
 *
 * @example
 * const user = await findUser('10086');
 * console.log(user?.name); // 'Zhang San'
 */
async function findUser(
  userId: string,
  options: { includeDeleted?: boolean } = {}
): Promise<User | null> { ... }
```

**JSDoc 规则（TypeScript 项目）：**
- 有了 TypeScript 类型，JSDoc 主要用于描述语义和业务含义
- 类型信息不用重复写（TypeScript 已有）
- `@example` 对复杂函数非常有价值

---

## 错误处理

```typescript
// ✅ async/await 必须用 try/catch 处理异常
async function findUser(userId: string): Promise<User> {
  try {
    const user = await db.findUser(userId);
    if (!user) throw new NotFoundError(`User ${userId} not found`);
    return user;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Failed to find user', { userId, error });
    throw new ServiceError('Failed to fetch user', { cause: error });
  }
}

// ✅ Promise 链必须有 .catch
fetchData()
  .then(process)
  .catch(error => logger.error('Fetch failed', error));

// ✅ 自定义错误类
class AppError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 'NOT_FOUND');
  }
}

// ❌ 禁止忽略 Promise rejection
fetchData();  // 没有 .catch，可能产生 UnhandledPromiseRejection
```

---

## 日志

```typescript
// 推荐：pino（高性能）或 winston
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'order-service' },
});

// ✅ 结构化日志
logger.info({ orderId, userId, amount }, 'Order created');

// ✅ 错误日志
logger.error({ err: error, userId }, 'Failed to create order');

// ❌ 禁止
console.log('order created: ' + orderId);
```
