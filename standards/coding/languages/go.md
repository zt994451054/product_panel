# Go 编码规范

> **主标准**：[Effective Go](https://go.dev/doc/effective_go) + [Google Go Style Guide](https://google.github.io/styleguide/go/)
> **参考**：[Godoc](https://go.dev/doc/comment)、[Effective Go - Errors](https://go.dev/doc/effective_go#errors)、[Google Error Handling](https://google.github.io/styleguide/go/decisions#errors)

跨语言原则见 [通用编码规范](../general.md)、[代码注释规范](../code-comments.md)、[错误与异常处理规范](../error-handling.md)、[日志规范](../logging.md)。

---

## 格式与编码实践

格式化工具：`gofmt` + `goimports`。

```go
// gofmt 强制格式化，import 用 goimports
// 缩进：Tab（工具强制）
// 行长：≤ 120 字符（推荐）

// ✅ import 分三组
import (
    "context"     // 标准库
    "fmt"

    "example.com/yourorg/internal/pkg"  // 内部包

    "github.com/gin-gonic/gin"         // 第三方
)

// ✅ 接口定义在使用方（消费者），不在实现方
// ✅ 返回值不超过 3 个，超过用结构体包裹

// ✅ 避免裸 return（多返回值函数中）
func calculate(x, y int) (result int, err error) {
    if y == 0 {
        err = errors.New("division by zero")
        return   // ❌ 裸 return，不清晰
    }
    result = x / y
    return result, nil  // ✅ 显式返回
}

// ✅ 预分配 slice/map 容量
users := make([]User, 0, expectedCount)
cache := make(map[string]User, expectedCount)

// ✅ 字符串拼接用 strings.Builder（循环场景）
var b strings.Builder
for _, s := range strs {
    b.WriteString(s)
}
result := b.String()
```

---

## 命名

```go
// 包名：小写单词，不含下划线，不复数
package httputil    // ✅
package http_util   // ❌
package utils       // ❌（太泛）

// 文件名：snake_case
// user_service.go

// 接口：单方法接口用 -er 后缀，行为即接口名
type Reader interface { Read(p []byte) (n int, err error) }
type Stringer interface { String() string }
type UserRepository interface { ... }  // 多方法接口描述职责

// 导出符号：PascalCase；非导出：camelCase
type UserService struct { }    // 导出结构体
func (s *UserService) Create() // 导出方法
var maxRetry = 3               // 非导出变量

// 错误变量：ErrXxx（导出），errXxx（非导出）
var ErrNotFound = errors.New("not found")
var ErrInvalidInput = errors.New("invalid input")

// 常量：同样按导出规则用 PascalCase / camelCase（不同于 Java 的全大写）
const MaxRetryCount = 3    // ✅ Go 风格
const MAX_RETRY_COUNT = 3  // ❌ 不是 Go 风格

// 接收者：简短，通常1-2个字母（类型首字母小写）
func (u *UserService) Create(req *CreateUserReq) (*User, error) { }
// 同一类型的所有方法接收者名称必须一致
func (u *UserService) Delete(id string) error { }  // 都用 u
```

---

## 注释

```go
// Package httputil provides HTTP utility functions.
package httputil

// Client is an HTTP client with retry and timeout support.
//
// Usage:
//
//	client := httputil.NewClient(
//	    httputil.WithTimeout(5 * time.Second),
//	    httputil.WithRetry(3),
//	)
type Client struct { ... }

// Get sends an HTTP GET request to the given URL.
// It returns the response body or an error if the request fails.
//
// The function retries up to maxRetries times with exponential backoff.
func (c *Client) Get(ctx context.Context, url string) ([]byte, error) { ... }

// ErrTimeout is returned when a request exceeds the configured timeout.
var ErrTimeout = errors.New("request timeout")
```

**Godoc 规则：**
- 注释紧贴被注释的符号，不留空行
- 第一句以符号名称开头，如 `// Client is ...`
- 示例代码用 `//\t` 缩进

---

## 错误处理

### Error

```go
// ✅ 错误作为最后一个返回值
func FindUser(id string) (*User, error) {
    user, err := db.Query("SELECT ...", id)
    if err != nil {
        // 用 %w 包裹，保留原始错误，支持 errors.Is/As
        return nil, fmt.Errorf("FindUser %s: %w", id, err)
    }
    return user, nil
}

// ✅ 立即处理错误，不跳过
user, err := FindUser(id)
if err != nil {
    if errors.Is(err, ErrNotFound) {
        return nil, ErrNotFound
    }
    log.Error("find user failed", "id", id, "error", err)
    return nil, err
}

// ✅ 定义 sentinel errors（包级别）
var (
    ErrNotFound     = errors.New("resource not found")
    ErrUnauthorized = errors.New("unauthorized")
)

// ❌ 禁止吞掉错误
user, _ := FindUser(id)  // 丢弃 error
```

### Panic vs Error

Go 没有异常机制，用 `panic` 表示**不可恢复的程序错误**（非业务错误）：

```go
// ✅ panic 的合法场景：不可恢复的初始化错误
func mustParseTemplate(text string) *template.Template {
    t, err := template.New("").Parse(text)
    if err != nil {
        panic(fmt.Sprintf("invalid template: %v", err))
    }
    return t
}

// ✅ 每个 goroutine 入口必须 recover
go func() {
    defer func() {
        if r := recover(); r != nil {
            log.Error("goroutine panicked", "recover", r,
                "stack", debug.Stack())
        }
    }()
    doWork()
}()

// ❌ 禁止在业务逻辑中用 panic 传递普通错误
func GetUser(id string) *User {
    user, err := db.Find(id)
    if err != nil {
        panic(err)  // 用 error 返回，不要 panic
    }
    return user
}
```

---

## 日志

```go
// 推荐：slog（Go 1.21+ 标准库）或 zap/zerolog
import "log/slog"

logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

// ✅ 结构化日志，字段作为 key-value 对
logger.Info("order created",
    "orderId", order.ID,
    "userId", order.UserID,
    "amount", order.Amount,
    "durationMs", elapsed.Milliseconds(),
)

// ✅ 错误日志携带完整错误信息
if err != nil {
    logger.Error("failed to create order",
        "userId", userId,
        "error", err,
    )
}

// ❌ 禁止字符串拼接
log.Printf("order created for user " + userId)  // 性能差，无结构
```
