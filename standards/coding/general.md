# 通用编码规范

> **主标准**：各语言的主标准写在对应语言页开头，见下方「语言页」。

本页只放跨语言原则。语言专属的格式、命名、注释、错误处理和日志写法放在语言页：

- [Java](languages/java.md)
- [Go](languages/go.md)
- [Python](languages/python.md)
- [JavaScript / TypeScript](languages/javascript-typescript.md)
- [CSS / Sass](languages/css-sass.md)

---

## 格式

**格式化由工具保证，代码 Review 不讨论格式问题。** 各语言的格式化工具见语言页。

【推荐】在 CI 或提交钩子中执行格式检查，是否作为合并门禁由项目决定。

---

## 命名

### 通用原则

1. **语义化**：名字说明「是什么」，而非「怎么做」
2. **全英文**：【强制】禁止拼音，禁止汉英混合，禁止中文命名
3. **避免无意义缩写**：`usrMgr`、`tmpVal`、`ordHdl` 这类缩写严重降低可读性
4. **一致性**：同一概念在整个系统中使用相同名称

### 禁止命名

| 禁止 | 示例 | 原因 |
|------|------|------|
| 拼音 | `yonghu`、`dingdan` | 无法被非中文母语者理解 |
| 拼音英文混合 | `DingdanService` | 比全拼音更难理解 |
| 无意义名 | `data`、`info`、`temp`、`obj`、`a` | 不说明含义 |
| 过度缩写 | `usr`、`ord`、`cfg` | 不要嫌名字长 |
| 数字后缀 | `service1`、`handler2` | 用描述性后缀替代 |

### 非代码命名

- 表、列、索引的命名见 [数据库设计规范](../architecture/database-design.md)
- URL 与 API 路径的命名见 [API 设计规范](../architecture/api-design.md)

---

## 控制流

【推荐】if-else 不超过 3 层，超过用卫语句（Guard Clauses）提前返回：

```java
// ❌ 深嵌套
if (user != null) {
    if (user.isActive()) {
        if (user.hasPermission()) {
            doWork();
        }
    }
}

// ✅ 卫语句
if (user == null) return;
if (!user.isActive()) return;
if (!user.hasPermission()) return;
doWork();
```

【推荐】复杂条件提取为有意义的布尔变量，不在条件判断中执行有副作用或复杂的逻辑：

```java
// ✅
boolean isValidOrder = order != null
    && order.getStatus() == PAID
    && order.getAmount() > 0;
if (isValidOrder) { ... }

// ❌
if (order != null && stockService.reserve(order) && (order.isPaid() || retryPayment(order))) { }
```

---

## 常量与规模

【禁止】魔法数字/魔法字符串（提取为命名常量）

```java
// ❌
if (status == 1) { }
// ✅
if (status == OrderStatus.ACTIVE) { }
```

【推荐】函数职责单一，单个函数/方法不超过 50 行（默认值，项目可覆盖）

【推荐】单个文件不超过 500 行，超过时考虑拆分职责（默认值，项目可覆盖）

## Related

- [代码注释规范](code-comments.md)
- [错误与异常处理规范](error-handling.md)
- [错误码规范](error-code.md)
- [日志规范](logging.md)
- [前端性能规范](frontend/performance.md)
- [前端用户体验实现规范](frontend/user-experience.md)
