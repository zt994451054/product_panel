# 单元测试规范

> **主标准**：[xUnit Test Patterns（Gerard Meszaros）](http://xunitpatterns.com/)
> **副标准**：[Google Testing Blog](https://testing.googleblog.com/)、各语言官方测试框架文档

---

## 单元测试的定义

单元测试验证**单个函数/方法/类**的行为，隔离所有外部依赖（数据库、网络、文件系统）。

```
✅ 单元测试：测试 calculateDiscount() 函数的折扣计算逻辑
✅ 单元测试：测试 OrderValidator.validate() 的参数校验
❌ 不是单元测试：测试需要连接数据库的 UserRepository.findById()
```

---

## AAA 模式（Arrange / Act / Assert）

每个测试用例遵循三段结构：

```python
def test_calculate_discount_for_vip_user():
    # Arrange（准备）：构造测试数据和依赖
    user = User(level="VIP", purchase_amount=1000)
    calculator = DiscountCalculator()

    # Act（执行）：调用被测函数
    discount = calculator.calculate(user)

    # Assert（断言）：验证结果
    assert discount == 0.2  # VIP 用户享受 20% 折扣
```

```go
func TestCalculateDiscount_VIPUser(t *testing.T) {
    // Arrange
    user := &User{Level: "VIP", PurchaseAmount: 1000}
    calculator := NewDiscountCalculator()

    // Act
    discount := calculator.Calculate(user)

    // Assert
    assert.Equal(t, 0.2, discount)
}
```

---

## 测试命名规范

测试名称要能清晰描述**测试场景**和**预期结果**：

| 模式 | 格式 | 示例 |
|------|------|------|
| Given-When-Then | `test_{状态}_{操作}_{预期}` | `test_vip_user_gets_20_percent_discount` |
| Should | `should_{预期行为}` | `should_throw_when_amount_is_negative` |
| 中文描述 | 直接描述 | `测试VIP用户享有20%折扣` |

```java
// ✅ 好的测试名称
@Test void calculateDiscount_WhenVIPUser_Returns20Percent()
@Test void validateOrder_WhenItemsEmpty_ThrowsValidationException()

// ❌ 差的测试名称
@Test void test1()
@Test void testCalculate()
```

---

## 测试范围：测试行为，不测试实现

```python
# ❌ 测试实现细节（脆弱，重构时容易失败）
def test_uses_percentage_formula():
    calc = DiscountCalculator()
    # 断言内部方法被调用了 —— 这是实现细节
    with patch.object(calc, '_apply_percentage') as mock:
        calc.calculate(vip_user)
        mock.assert_called_once()

# ✅ 测试行为（稳定，重构安全）
def test_vip_user_gets_20_percent_discount():
    calc = DiscountCalculator()
    discount = calc.calculate(vip_user)
    assert discount == 0.2  # 只关心结果
```

---

## Mock / Stub / Spy 使用原则

| 类型 | 用途 | 何时使用 |
|------|------|---------|
| **Stub** | 返回预设值，替换外部依赖 | 数据库、外部 API、文件读取 |
| **Mock** | 验证某个调用是否发生 | 验证事件发布、邮件发送等副作用 |
| **Spy** | 包装真实对象，监听调用 | 部分替换，保留真实行为 |

**Mock 使用原则：**
- 只 Mock 真正的外部依赖（数据库、网络、时间）
- 不 Mock 被测代码内部的实现（会导致测试脆弱）
- 优先使用 Fake（轻量的内存实现）代替复杂的 Mock

```python
# Python - unittest.mock
from unittest.mock import Mock, patch

def test_send_order_confirmation():
    # Stub：模拟邮件服务
    email_service = Mock()
    email_service.send.return_value = True

    order_service = OrderService(email_service=email_service)
    order_service.confirm_order(order_id="123")

    # Mock：验证邮件确实被发送了
    email_service.send.assert_called_once_with(
        to="user@example.com",
        template="order_confirmation"
    )
```

```go
// Go - testify/mock
type MockEmailService struct {
    mock.Mock
}
func (m *MockEmailService) Send(to, template string) error {
    args := m.Called(to, template)
    return args.Error(0)
}

func TestConfirmOrder_SendsConfirmationEmail(t *testing.T) {
    mockEmail := new(MockEmailService)
    mockEmail.On("Send", "user@example.com", "order_confirmation").Return(nil)

    svc := NewOrderService(mockEmail)
    err := svc.ConfirmOrder("123")

    assert.NoError(t, err)
    mockEmail.AssertExpectations(t)
}
```

```java
// Java - Mockito
@Test
void confirmOrder_SendsConfirmationEmail() {
    EmailService emailService = mock(EmailService.class);
    when(emailService.send(anyString(), anyString())).thenReturn(true);

    OrderService svc = new OrderService(emailService);
    svc.confirmOrder("123");

    verify(emailService).send("user@example.com", "order_confirmation");
}
```

```typescript
// TypeScript - Jest
test('confirmOrder sends confirmation email', async () => {
  const emailService = { send: jest.fn().mockResolvedValue(true) }
  const svc = new OrderService(emailService)
  await svc.confirmOrder('123')

  expect(emailService.send).toHaveBeenCalledWith(
    'user@example.com', 'order_confirmation'
  )
})
```

---

## 边界值与异常测试

【必须】每个函数除了正常路径，还要测试：

```python
# 1. 正常值
def test_calculate_discount_returns_20_for_vip(): ...

# 2. 边界值
def test_calculate_discount_with_zero_amount(): ...
def test_calculate_discount_with_max_amount(): ...

# 3. 异常情况
def test_calculate_discount_raises_for_negative_amount():
    with pytest.raises(ValueError, match="金额不能为负"):
        calculator.calculate(User(purchase_amount=-1))

# 4. 空值/nil
def test_calculate_discount_returns_zero_for_none_user():
    assert calculator.calculate(None) == 0
```

---

## Table-Driven Test（数据驱动测试）

相同逻辑的多组输入/输出，使用表格驱动：

```go
// Go - Table-Driven（官方推荐）
func TestCalculateDiscount(t *testing.T) {
    tests := []struct {
        name     string
        level    string
        expected float64
    }{
        {"VIP用户享20%折扣", "VIP", 0.2},
        {"普通用户享5%折扣", "NORMAL", 0.05},
        {"新用户享10%折扣", "NEW", 0.1},
        {"未知等级无折扣", "UNKNOWN", 0.0},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            user := &User{Level: tt.level}
            assert.Equal(t, tt.expected, calculator.Calculate(user))
        })
    }
}
```

```python
# Python - pytest.mark.parametrize
@pytest.mark.parametrize("level,expected", [
    ("VIP", 0.2),
    ("NORMAL", 0.05),
    ("NEW", 0.1),
    ("UNKNOWN", 0.0),
])
def test_calculate_discount(level, expected):
    user = User(level=level)
    assert calculator.calculate(user) == expected
```

---

## 各语言测试框架推荐

| 语言 | 推荐框架 | Mock 框架 |
|------|---------|----------|
| Go | `testing`（标准库）+ `testify` | `testify/mock` / `gomock` |
| Java | JUnit 5 + AssertJ | Mockito |
| Python | pytest | `unittest.mock`（标准库）|
| TypeScript | Jest | Jest 内置 |
| Rust | `#[test]`（标准库）| `mockall` |

---

## 禁止事项

【禁止】测试中的 `Thread.sleep()`（用条件等待替代）

【禁止】测试之间依赖执行顺序（每个测试独立）

【禁止】在测试中连接真实数据库、发真实网络请求

【禁止】没有 assert 的测试（等同于没有测试）

【禁止】注释掉或删除失败的测试来让流水线通过（必须修复；测试本身已失效时说明原因后再改）

## Related

- [测试策略总览](testing-strategy.md)
- [集成测试规范](integration-testing.md)
- [用例设计规范](test-case-design.md)（等价类、边界值等设计方法）
