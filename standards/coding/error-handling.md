# 错误与异常处理规范

> **参考标准**：[Effective Go - Errors](https://go.dev/doc/effective_go#errors)、[Google Error Handling](https://google.github.io/styleguide/go/decisions#errors)、[Java Exception Handling Best Practices](https://docs.oracle.com/javase/tutorial/essential/exceptions/)、[Python Exception Hierarchy](https://docs.python.org/3/library/exceptions.html)

---

## 核心原则

1. **不要吞掉错误**：捕获了错误必须处理（记录日志、向上传递、降级处理），禁止静默忽略
2. **快速失败（Fail Fast）**：尽早检测错误，尽早返回，不让错误在系统中传播
3. **携带上下文**：错误信息必须包含足够的上下文，让排查者知道发生了什么、在哪里发生
4. **不用异常控制流程**：异常/错误只用于表示真正的错误情况，不用于正常的业务分支

---

## 错误 vs 异常机制

不同语言使用不同机制处理错误，但原则相通：

| 语言 | 机制 | 特点 |
|------|------|------|
| Go | 多值返回 `(T, error)` | 显式，强制处理 |
| Java/Kotlin | `try/catch` 异常 | checked/unchecked 分类 |
| Python | `try/except` 异常 | 所有异常都是 unchecked |
| JavaScript/TS | `try/catch` + Promise rejection | 同步/异步需分别处理 |
| Rust | `Result<T, E>` | 类似 Go，类型安全 |

---

## 各语言写法

各语言的错误处理写法与异常体系，见语言页的「错误处理」一节：[Java](languages/java.md)、[Go](languages/go.md)、[Python](languages/python.md)、[JavaScript / TypeScript](languages/javascript-typescript.md)。

---

## 错误信息规范

| 规则 | 示例 |
|------|------|
| 描述发生了什么，不要描述做了什么 | `"order not found"` 而非 `"failed to get order"` |
| 包含关键上下文（ID、参数等）| `"order 550e8400 not found"` |
| 对用户的错误信息简洁友好 | `"订单不存在"` |
| 对日志/调试的错误信息详细 | 包含完整堆栈和上下文 |

---

## 不要这样做

【禁止】静默吞掉错误（捕获后什么都不做，包括空 `catch` 块）

【禁止】用异常控制正常业务流程（如用异常替代 if/else，或靠捕获越界异常判断数组是否为空）

【禁止】捕获过于宽泛的异常而不区分处理

【禁止】在 `finally` 块中使用 `return` 语句（会覆盖 try 中的返回值并吞掉异常）

## Related

- [错误码规范](error-code.md)
- [日志规范](logging.md)
