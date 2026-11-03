# 集成测试规范

> **主标准**：[Martin Fowler - Integration Testing](https://martinfowler.com/bliki/IntegrationTest.html)
> **副标准1**：[Testcontainers](https://testcontainers.com/)（真实依赖的容器化测试）
> **副标准2**：[Pact Contract Testing](https://pact.io/)（服务间契约测试）

---

## 集成测试的定义

集成测试验证**多个组件协同工作**的正确性，通常涉及真实的外部依赖（数据库、消息队列等）。

| 对比 | 单元测试 | 集成测试 |
|------|---------|---------|
| 测试对象 | 单个函数/类（隔离依赖）| 多个组件协作（真实依赖）|
| 外部依赖 | Mock | 真实（或 Testcontainers）|
| 速度 | 毫秒级 | 秒级 |
| 目的 | 验证业务逻辑 | 验证组件协作、SQL、MQ 消费等 |

---

## 数据库集成测试

### 使用 Testcontainers（推荐）

Testcontainers 在测试时自动启动真实的 Docker 容器，测试结束后自动清理：

```go
// Go - testcontainers-go
func TestUserRepository_FindById(t *testing.T) {
    ctx := context.Background()

    // 启动真实 MySQL 容器
    mysqlContainer, _ := mysql.RunContainer(ctx,
        mysql.WithDatabase("testdb"),
        mysql.WithUsername("test"),
        mysql.WithPassword("test"),
    )
    defer mysqlContainer.Terminate(ctx)

    dsn, _ := mysqlContainer.ConnectionString(ctx, "parseTime=true")
    db, _ := sql.Open("mysql", dsn)

    // 初始化表结构
    runMigrations(db)

    repo := NewUserRepository(db)
    user, err := repo.FindById("u-001")

    assert.NoError(t, err)
    assert.Equal(t, "张三", user.Name)
}
```

```java
// Java - Testcontainers + JUnit 5
@Testcontainers
class UserRepositoryTest {
    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");

    @Test
    void findById_ReturnsUser() {
        DataSource ds = createDataSource(mysql.getJdbcUrl());
        UserRepository repo = new UserRepository(ds);

        User user = repo.findById("u-001");

        assertThat(user.getName()).isEqualTo("张三");
    }
}
```

```python
# Python - testcontainers-python
from testcontainers.mysql import MySqlContainer

def test_find_user_by_id():
    with MySqlContainer("mysql:8.0") as mysql:
        engine = create_engine(mysql.get_connection_url())
        run_migrations(engine)

        repo = UserRepository(engine)
        user = repo.find_by_id("u-001")

        assert user.name == "张三"
```

### 测试数据管理

【必须】每个测试前后清理数据，保证测试隔离：

```go
// Go - 每个测试使用独立事务，测试后回滚
func TestWithTransaction(t *testing.T, db *sql.DB, fn func(tx *sql.Tx)) {
    tx, _ := db.Begin()
    defer tx.Rollback()  // 测试后自动回滚，不污染其他测试
    fn(tx)
}
```

```java
// Java - Spring @Transactional 在测试后自动回滚
@Test
@Transactional
void saveOrder_PersistsToDatabase() {
    orderRepository.save(new Order("order-1", 12800));
    Order found = orderRepository.findById("order-1").orElseThrow();
    assertThat(found.getAmount()).isEqualTo(12800);
    // 测试结束后自动回滚
}
```

---

## API 集成测试

验证 HTTP 接口的完整行为（含中间件、路由、序列化等）。下面的断言只看 HTTP 状态码和业务字段；响应包装结构按项目的 API 规范断言（见 [API 设计规范](../architecture/api-design.md)）：

```go
// Go - httptest（标准库）
func TestCreateOrder_ReturnsCreatedOrder(t *testing.T) {
    // 启动测试服务器（含真实路由、中间件）
    app := setupTestApp()
    server := httptest.NewServer(app)
    defer server.Close()

    body := `{"userId":"u-001","amount":12800}`
    resp, _ := http.Post(server.URL+"/v1/orders", "application/json",
        strings.NewReader(body))

    assert.Equal(t, http.StatusCreated, resp.StatusCode)

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    assert.NotEmpty(t, result["orderId"])
}
```

```python
# Python - FastAPI TestClient
from fastapi.testclient import TestClient

def test_create_order():
    client = TestClient(app)
    response = client.post("/v1/orders", json={
        "userId": "u-001",
        "amount": 12800
    })

    assert response.status_code == 201
    assert "orderId" in response.json()
```

```typescript
// TypeScript - supertest
import request from 'supertest'

test('POST /v1/orders creates an order', async () => {
  const response = await request(app)
    .post('/v1/orders')
    .set('Authorization', `Bearer ${testToken}`)
    .send({ userId: 'u-001', amount: 12800 })

  expect(response.status).toBe(201)
  expect(response.body.orderId).toBeDefined()
})
```

---

## 消息队列集成测试

```go
// Go - 使用真实 Kafka（Testcontainers）
func TestOrderCreatedConsumer(t *testing.T) {
    ctx := context.Background()
    kafkaContainer, _ := kafka.RunContainer(ctx)
    defer kafkaContainer.Terminate(ctx)

    broker, _ := kafkaContainer.Brokers(ctx)
    consumer := NewOrderCreatedConsumer(broker[0])

    // 发布一条消息
    publishMessage(broker[0], "order.created", OrderCreatedEvent{
        OrderId: "order-1", Amount: 12800,
    })

    // 等待消费者处理
    event := waitForEvent(consumer, 5*time.Second)

    assert.Equal(t, "order-1", event.OrderId)
    // 验证消费后的副作用（如数据库记录）
    order, _ := orderRepo.FindById("order-1")
    assert.Equal(t, "CONFIRMED", order.Status)
}
```

---

## 契约测试（Contract Testing）

适用于**微服务间 API 契约**的验证，防止消费者和提供者独立演进时出现不兼容：

```
消费者（Consumer）定义期望的 API 格式 → 生成契约文件（Pact）
           ↓
提供者（Provider）用契约文件验证自己的实现是否符合期望
```

```python
# Python - pact-python（Consumer 侧）
from pact import Consumer, Provider

pact = Consumer("OrderService").has_pact_with(Provider("UserService"))

def test_get_user_contract():
    pact.given("用户 u-001 存在").upon_receiving("查询用户信息").with_request(
        method="GET", path="/v1/users/u-001"
    ).will_respond_with(
        status=200,
        body={"userId": "u-001", "name": "张三"}
    )

    with pact:
        result = user_service_client.get_user("u-001")
        assert result["name"] == "张三"
```

---

## 集成测试最佳实践

【必须】集成测试在独立的测试数据库/队列中运行，禁止操作生产数据

【必须】测试前 Setup（初始化数据）、测试后 Teardown（清理数据）

【推荐】使用 Testcontainers 代替本地安装的依赖（保证 CI 环境一致性）

【推荐】集成测试独立运行（`go test -tags integration ./...`），不与单元测试混在一起

【禁止】集成测试连接生产环境的数据库/服务

## Related

- [测试策略总览](testing-strategy.md)
- [单元测试规范](unit-testing.md)
- [用例设计规范](test-case-design.md)
