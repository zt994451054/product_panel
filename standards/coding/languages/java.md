# Java 编码规范

> **主标准**：[阿里巴巴 Java 开发手册（嵩山版）](https://github.com/alibaba/p3c)
> **参考**：[Javadoc](https://www.oracle.com/technical-resources/articles/java/javadoc-tool.html)、[Java Exception Handling Best Practices](https://docs.oracle.com/javase/tutorial/essential/exceptions/)

跨语言原则见 [通用编码规范](../general.md)、[代码注释规范](../code-comments.md)、[错误与异常处理规范](../error-handling.md)、[日志规范](../logging.md)。

---

## 格式与编码实践

格式化工具：`google-java-format` 或 `Checkstyle`。

### 基础格式

```java
// 缩进：4 空格，禁止 Tab
// 行长：≤ 120 字符
// 左花括号：与代码同行（K&R 风格）
// 条件语句：即使单行也必须加花括号

// ✅ 正确
if (condition) {
    doSomething();
}

// ❌ 错误
if (condition)
    doSomething();  // 无花括号，维护风险高
```

### OOP 规约

```java
// ✅ 重写 equals 必须同时重写 hashCode
// 否则 Set/HashMap 中行为不可预期
@Override
public boolean equals(Object o) { ... }
@Override
public int hashCode() { ... }

// ✅ 静态方法通过类名调用，不通过实例调用
MathUtils.calculate(x);   // ✅
instance.calculate(x);     // ❌（对静态方法）

// ✅ 接口方法不加 public abstract（冗余）
interface UserService {
    User getUser(String id);             // ✅
    public abstract User getUser(String id);  // ❌
}

// ✅ 工具类构造方法声明为 private（防止被实例化）
public final class StringUtils {
    private StringUtils() {}
    public static boolean isEmpty(String s) { ... }
}

// ✅ equals 比较：常量/已知对象放左边（防 NPE）
"expected".equals(actual);     // ✅
actual.equals("expected");      // ❌（actual 为 null 时 NPE）
```

### 集合处理

```java
// ✅ 预期元素数量已知时指定容量，避免多次扩容
// JDK 19+：容量由 JDK 按负载因子换算
Map<String, Order> index = HashMap.newHashMap(orders.size());
// 旧版本 JDK 手动换算时注意负载因子 0.75，直接传元素个数仍可能触发一次扩容

// ✅ 遍历 Map 用 entrySet（一次遍历获取 key+value）
for (Map.Entry<String, Object> entry : map.entrySet()) {
    String key = entry.getKey();
    Object value = entry.getValue();
}
// ❌ keySet 遍历两次（一次 key，一次 get value）
for (String key : map.keySet()) {
    Object value = map.get(key);  // 多一次 hash 查找
}

// ✅ JDK 8+ 使用 Map.forEach
map.forEach((k, v) -> process(k, v));

// ❌ 禁止在 foreach 循环中对集合 add/remove
for (String item : list) {
    if (condition) {
        list.remove(item);  // ❌ ConcurrentModificationException
    }
}
// ✅ 使用 Iterator
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    if (condition) { it.remove(); }
}

// ❌ Arrays.asList 返回的列表不支持 add/remove
List<String> list = Arrays.asList("a", "b");
list.add("c");  // ❌ UnsupportedOperationException

// ✅ 需要可修改列表
List<String> list = new ArrayList<>(Arrays.asList("a", "b"));

// 集合 null 值注意
// ConcurrentHashMap：key 和 value 均不允许为 null
// HashMap：key 和 value 均允许为 null（一个 null key）
// TreeMap：key 不允许为 null
```

### 并发处理

```java
// ❌ 禁止用 Executors 创建线程池（队列/线程数量无界，可能 OOM）
ExecutorService pool = Executors.newFixedThreadPool(10);      // ❌
ExecutorService pool = Executors.newCachedThreadPool();       // ❌

// ✅ 用 ThreadPoolExecutor 明确所有参数
ExecutorService pool = new ThreadPoolExecutor(
    5,                      // corePoolSize
    20,                     // maximumPoolSize
    60L, TimeUnit.SECONDS,  // keepAliveTime
    new LinkedBlockingQueue<>(1000),  // 有界队列，防 OOM
    new ThreadFactoryBuilder().setNameFormat("order-pool-%d").build(),
    new ThreadPoolExecutor.CallerRunsPolicy()  // 拒绝策略
);

// ❌ SimpleDateFormat 线程不安全，不能作为静态变量共享
static SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");  // ❌

// ✅ JDK 8+：使用线程安全的 DateTimeFormatter
static final DateTimeFormatter FORMATTER =
    DateTimeFormatter.ofPattern("yyyy-MM-dd");  // 不可变，线程安全

// ✅ 多资源加锁保持固定顺序，防死锁
// 所有线程都按 A → B → C 顺序加锁
synchronized (lockA) {
    synchronized (lockB) {
        synchronized (lockC) { }
    }
}

// ✅ ThreadLocal 使用 static 修饰
private static final ThreadLocal<UserContext> USER_CONTEXT =
    ThreadLocal.withInitial(UserContext::new);
// 使用后必须 remove，防止内存泄漏
try {
    USER_CONTEXT.set(ctx);
    doWork();
} finally {
    USER_CONTEXT.remove();
}

// ✅ 计数/累加使用原子类（多线程场景）
AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet();
// JDK 8+：LongAdder 性能优于 AtomicLong（竞争激烈时）
LongAdder adder = new LongAdder();
adder.increment();
```

### 控制语句

```java
// ✅ switch 每个 case 必须有 break/return，末尾有 default
switch (status) {
    case PENDING:
        handlePending();
        break;
    case PAID:
        handlePaid();
        break;
    default:
        log.warn("unknown status: {}", status);
        break;
}
```

---

## 命名

【强制】标识符不以下划线或美元符号开头/结尾：`_name / name_ / $name / name$` 均不合法。

### 基础命名

```java
// 类：UpperCamelCase（POJO 后缀例外，见下方）；文件名与公开类同名
class OrderService { }
class UserRepository { }
abstract class AbstractBaseEntity { }  // 抽象类：Abstract 或 Base 开头
class OrderNotFoundException extends RuntimeException { }  // 异常类：Exception 结尾
class OrderServiceTest { }   // 测试类：被测类名 + Test

// 方法/参数/变量：lowerCamelCase
public Order createOrder(CreateOrderRequest request) { }
int retryCount = 0;
String localValue;

// 常量：UPPER_SNAKE_CASE，语义完整，不嫌名字长
static final int MAX_UPLOAD_SIZE_BYTES = 1048576;   // ✅
static final int MAX_SIZE = 1048576;                // ❌ 不够语义化

// 包名：全小写，每段单个自然语义英文单词
package com.example.order.service;   // ✅
package com.example.orderService;    // ❌ 有大写
```

### POJO 领域模型命名

| 后缀 | 含义 | 说明 |
|------|------|------|
| `xxxDO` | Data Object | 数据库表映射对象，字段与表列一一对应 |
| `xxxDTO` | Data Transfer Object | 服务间/层间数据传输对象 |
| `xxxVO` | View Object | 展示层对象，对应前端展示的数据结构 |
| `xxxBO` | Business Object | 复杂业务逻辑的中间聚合对象 |
| `xxxQuery` | 查询参数对象 | 封装列表查询的过滤条件 |

```java
// ✅ 命名示例
class OrderDO { long id; String status; ... }     // 数据库映射
class OrderDTO { String orderId; List<ItemDTO> items; }  // 服务传输
class OrderVO { String displayStatus; String formattedAmount; }  // 前端展示
class CreateOrderQuery { String userId; DateRange dateRange; }   // 查询参数

// ❌ 禁止
class OrderPOJO { }      // POJO 是总称，不能作后缀
class Order { }          // 不带后缀容易引发层间混淆（大型项目中）
```

### Service / DAO 层方法命名

```java
// Service / DAO 层统一命名规约
User getUser(String id);              // 获取单个对象：get 前缀
List<User> listUsers(UserQuery query); // 获取多个对象：list 前缀
int countUsers(UserQuery query);       // 获取统计值：count 前缀
void saveUser(UserDO user);            // 插入：save 或 insert 前缀
void insertUser(UserDO user);
void removeUser(String id);            // 删除：remove 或 delete 前缀
void deleteUser(String id);
void updateUser(UserDO user);          // 修改：update 前缀
```

### 接口与实现命名

```java
// 接口：纯净，不加 I 前缀
interface UserService { }            // ✅
interface IUserService { }           // ❌ Java 不用 I 前缀（C# 风格）

// 实现类：接口名 + Impl 后缀
class UserServiceImpl implements UserService { }  // ✅

// 形容能力的接口：形容词（-able）形式
interface Cacheable { }
class OrderSnapshot implements Cacheable { }
```

### 枚举命名

```java
// 枚举类名建议带 Enum 后缀
// 枚举成员：UPPER_SNAKE_CASE
enum OrderStatusEnum {
    PENDING,
    PAID,
    SHIPPED,
    CANCELLED,
    UNKNOWN_REASON   // UNKNOWN 可作为零值
}
```

### 布尔类型

本节只约束 POJO 属性。数据库布尔列的命名见 [数据库设计规范](../../architecture/database-design.md)。

```java
// ❌ POJO 布尔属性不加 is 前缀
// boolean isDeleted 的 getter 是 isDeleted()，部分框架会反推出属性名 deleted，导致序列化错误
boolean isDeleted;   // ❌

// ✅ 直接使用形容词
Boolean deleted;
Boolean active;
Boolean enabled;
```

---

## 注释

```java
/**
 * Represents an HTTP client with built-in retry and timeout support.
 *
 * <p>This client handles connection pooling and automatic retries with
 * exponential backoff. Not thread-safe; create one instance per thread.
 *
 * @author Team Platform
 * @since 1.0.0
 */
public class HttpClient {

    /**
     * Sends an HTTP GET request to the specified URL.
     *
     * @param url     the target URL, must not be null
     * @param headers additional request headers, may be empty but not null
     * @return the response body as a string
     * @throws IOException         if the connection fails
     * @throws TimeoutException    if the request exceeds the timeout
     * @throws NullPointerException if url or headers is null
     */
    public String get(String url, Map<String, String> headers)
            throws IOException, TimeoutException { ... }
}
```

**Javadoc 规则：**
- 所有 `public` 方法必须写 Javadoc
- `@param` 描述每个参数的含义和约束
- `@return` 描述返回值
- `@throws` 列出可能抛出的异常

---

## 错误处理

### 异常分类

```
Throwable
├── Error（JVM 级别，不应捕获）
│   ├── OutOfMemoryError
│   └── StackOverflowError
└── Exception
    ├── Checked Exception（必须声明或捕获）
    │   ├── IOException
    │   └── SQLException
    └── RuntimeException（Unchecked，不强制捕获）
        ├── NullPointerException
        ├── IllegalArgumentException
        └── 自定义业务异常（推荐继承 RuntimeException）
```

【禁止】捕获 `Error`（JVM 级别，如 `OutOfMemoryError`），应让 JVM 处理

**【推荐】业务异常继承 `RuntimeException`（Unchecked）**，原因：
- Checked 异常强制调用方处理，污染方法签名
- Spring 等框架的事务回滚默认只对 RuntimeException 生效
- 大型项目中 Checked 异常难以维护

```java
// ✅ 推荐：继承 RuntimeException，携带业务上下文
public class OrderNotFoundException extends RuntimeException {
    private final String orderId;

    public OrderNotFoundException(String orderId) {
        super(String.format("Order not found: %s", orderId));
        this.orderId = orderId;
    }
}

// ❌ 不推荐：继承 Exception（Checked）
public class OrderNotFoundException extends Exception { ... }
```

### 捕获与资源

```java
// ✅ 捕获具体异常类型，不捕获宽泛的 Exception
try {
    order = orderRepo.findById(orderId);
} catch (ResourceNotFoundException e) {
    log.warn("Order not found: {}", orderId);
    throw e;  // 继续向上传递
} catch (DataAccessException e) {
    log.error("DB error querying order {}", orderId, e);
    throw new ServiceException("Failed to fetch order", e);  // 包裹后传递
}

// ❌ 禁止吞掉异常
try {
    process();
} catch (Exception e) {
    // 什么都不做，吞掉了异常
}

// ✅ 使用 try-with-resources 自动关闭资源
// ResultSet 随 Statement 关闭，须在 try 块内读取完毕
try (Connection conn = dataSource.getConnection();
     PreparedStatement stmt = conn.prepareStatement(sql);
     ResultSet rs = stmt.executeQuery()) {
    return mapRows(rs);
}
```

---

## 日志

```java
// 推荐：SLF4J + Logback（门面 + 实现分离）
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

private static final Logger log = LoggerFactory.getLogger(OrderService.class);

// ✅ 使用占位符，不用字符串拼接
log.info("Order created: orderId={}, userId={}, amount={}", 
    orderId, userId, amount);

// ✅ MDC 注入追踪信息（在拦截器中设置）
MDC.put("traceId", request.getHeader("X-Trace-Id"));
MDC.put("userId", currentUser.getId());

// ✅ 错误日志保留堆栈
log.error("Failed to process order: orderId={}", orderId, exception);

// ❌ 禁止
System.out.println("order created");      // 不用日志框架
e.printStackTrace();                       // 输出到控制台
log.error("error: " + e.getMessage());    // 丢失堆栈 + 字符串拼接
```
