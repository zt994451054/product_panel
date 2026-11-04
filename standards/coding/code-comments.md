# 代码注释规范

> **参考标准**：[Godoc](https://go.dev/doc/comment)（Go）、[Javadoc](https://www.oracle.com/technical-resources/articles/java/javadoc-tool.html)（Java）、[JSDoc](https://jsdoc.app/)（JS/TS）、[Python Docstrings（PEP 257）](https://peps.python.org/pep-0257/)

---

## 核心原则

**注释解释「为什么」，代码解释「是什么」：**

```go
// ✅ 好注释：解释 why
// 使用指数退避而非固定间隔，防止大量客户端同时重试造成惊群效应
retryInterval = baseInterval * math.Pow(2, float64(attempt))

// ❌ 坏注释：复述 what（读代码就能看出来）
// 将 baseInterval 乘以 2 的 attempt 次方
retryInterval = baseInterval * math.Pow(2, float64(attempt))
```

**注释是债务，好代码是第一位的：**
- 如果需要注释才能理解代码，先考虑能否改名或重构
- 注释会过期，代码是最新的真相

---

## 何时必须写注释

| 场景 | 示例 |
|------|------|
| 公开 API（函数/方法/类）| 所有 `public` / 导出符号 |
| 非直觉的业务规则 | "为什么用 500ms 延迟" |
| 算法/数学公式 | 复杂计算逻辑 |
| 临时/待改进的代码 | `// TODO:` 标记 |
| 已知缺陷/限制 | `// FIXME:` 标记 |
| 反直觉的实现 | "为什么不用 X 而用 Y" |

---

## 标记注释规范

| 标记 | 含义 | 格式 |
|------|------|------|
| `TODO` | 待完成的功能 | `// TODO(username): 补充分页逻辑` 或 `// TODO(#123): 补充分页逻辑` |
| `FIXME` | 已知问题需要修复 | `// FIXME: 并发场景下有竞争条件` |
| `HACK` | 临时方案，需要后续重构 | `// HACK: 绕过了 xxx 限制，v2 版本修复` |
| `NOTE` | 重要说明 | `// NOTE: 此方法非线程安全` |

---

## 文档注释格式

公开符号的文档注释格式因语言而异，见语言页的「注释」一节：[Java](languages/java.md)、[Go](languages/go.md)、[Python](languages/python.md)、[JavaScript / TypeScript](languages/javascript-typescript.md)。

---

## 禁止事项

【禁止】注释掉的死代码（直接删除，用版本控制查历史）

```go
// ❌
// user, err := db.FindUser(id)
// if err != nil { return err }
user, err := cache.GetUser(id)
```

【禁止】过时的注释（比代码更危险，会误导读者）

```python
# ❌ 注释说 3 次，代码是 5 次
# Retry 3 times on failure
for attempt in range(5):
```

【禁止】废话注释（重复代码含义的注释）

```java
// ❌ 加 1 并赋值给 count（显然的）
count = count + 1;

// ✅ 解释 why
// 预留一个额外槽位，用于哨兵节点
capacity = size + 1;
```
