# Python 编码规范

> **主标准**：[PEP 8](https://peps.python.org/pep-0008/)（Black 工具）+ [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
> **参考**：[Python Docstrings（PEP 257）](https://peps.python.org/pep-0257/)、[Python Exception Hierarchy](https://docs.python.org/3/library/exceptions.html)

跨语言原则见 [通用编码规范](../general.md)、[代码注释规范](../code-comments.md)、[错误与异常处理规范](../error-handling.md)、[日志规范](../logging.md)。

---

## 格式与编码实践

格式化工具：`black` + `isort`。

```python
# black + isort 强制格式化
# 缩进：4 空格；行长：88（black 默认）

# ✅ import 分三组
import os                          # 标准库
import sys

import requests                    # 第三方
from pydantic import BaseModel

from app.models import User        # 本地

# ✅ 类型注解（公共函数必须，PEP 484）
def create_user(
    user_id: str,
    email: str,
    role: UserRole = UserRole.MEMBER,
) -> User: ...

# ✅ 推导式代替简单循环
active_users = [u for u in users if u.is_active]
user_map = {u.id: u for u in users}

# ✅ with 语句管理资源
with open(path) as f:
    content = f.read()

# ✅ f-string（Python 3.6+），不用 % 或 .format()
message = f"User {user.name} created at {user.created_at}"

# ✅ 用 is/is not 比较 None
if user is None: ...
if result is not None: ...

# ✅ 布尔值直接判断
if flag: ...

# ❌ 不用 == 比较 None，不用 == 或 is 比较 True/False
if user == None: ...
if flag == True: ...
if flag is True: ...
```

---

## 命名

```python
# 模块/文件/函数/变量：snake_case
import order_service
def create_order(user_id: str) -> Order: ...
retry_count = 0

# 类：PascalCase
class OrderService: ...
class InvalidOrderError(Exception): ...

# 常量：UPPER_SNAKE_CASE（模块级）
MAX_RETRY_COUNT = 3
DEFAULT_CURRENCY = "CNY"

# 私有：单下划线前缀（约定，非强制）
def _internal_helper(self): ...
self._state: dict = {}

# 名称修饰：双下划线前缀（强制私有，较少使用）
self.__sensitive_data = {}

# 避免单字母（除标准循环变量 i/j/k 和数学符号 x/y/z）
for i, item in enumerate(items): ...    # ✅
for a in items: ...                      # ❌
```

---

## 注释

```python
def find_user(user_id: str, include_deleted: bool = False) -> Optional[User]:
    """Find a user by their unique identifier.

    Args:
        user_id: The unique identifier of the user.
        include_deleted: If True, also return soft-deleted users.
            Defaults to False.

    Returns:
        The User object if found, or None if not found.

    Raises:
        DatabaseError: If the database query fails.
        ValueError: If user_id is empty.

    Example:
        >>> user = find_user("10086")
        >>> print(user.name)
        'Zhang San'
    """
```

**Python Docstring 规则（Google Style）：**
- 第一行简要描述，不超过 79 字符
- `Args:`、`Returns:`、`Raises:` 分节说明
- 公共函数必须有 docstring

---

## 错误处理

### 异常体系

```
BaseException
├── SystemExit
├── KeyboardInterrupt
└── Exception
    ├── RuntimeError
    ├── ValueError        # 参数值不合法
    ├── TypeError         # 参数类型不匹配
    ├── IOError/OSError   # IO 操作失败
    └── 自定义业务异常（继承 Exception 或其子类）
```

```python
# ✅ 自定义异常层级
class AppError(Exception):
    """所有业务异常的基类"""
    def __init__(self, message: str, code: str = "INTERNAL"):
        super().__init__(message)
        self.code = code

class NotFoundError(AppError):
    def __init__(self, resource: str, id: str):
        super().__init__(f"{resource} {id} not found", "NOT_FOUND")

class ValidationError(AppError):
    def __init__(self, field: str, message: str):
        super().__init__(f"{field}: {message}", "INVALID_ARGUMENT")
```

### 捕获

```python
# ✅ 捕获具体异常，记录日志后选择处理方式
def find_user(user_id: str) -> User:
    try:
        return db.query(User, user_id)
    except RecordNotFoundError:
        raise UserNotFoundError(f"User {user_id} not found")
    except DatabaseError as e:
        logger.error("DB error finding user %s: %s", user_id, e)
        raise ServiceError("Failed to fetch user") from e  # from e 保留原始异常

# ❌ 禁止裸 except
try:
    process()
except:   # 捕获所有，包括 KeyboardInterrupt、SystemExit
    pass  # 吞掉了异常
```

---

## 日志

```python
# 推荐：structlog（结构化）或标准库 logging + JSON formatter
import structlog

logger = structlog.get_logger()

# ✅ 结构化日志
logger.info("order.created",
    order_id=order.id,
    user_id=order.user_id,
    amount=order.amount,
    duration_ms=elapsed_ms,
)

# ✅ 错误日志
logger.error("order.creation_failed",
    user_id=user_id,
    exc_info=True,  # 自动包含异常堆栈
)

# ❌ 禁止
print(f"order created: {order_id}")  # 不用 print
logging.error(str(e))                 # 丢失堆栈
```
