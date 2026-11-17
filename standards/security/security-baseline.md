# 安全基线规范

> **主标准**：[OWASP Top 10 (2021)](https://owasp.org/Top10/) + [OWASP API Security Top 10 (2023)](https://owasp.org/API-Security/)
> **补充标准**：[OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

**所有应用系统必须满足本基线要求，上线前须完成安全自查。**

> **适用范围**：本页约束产品代码和产品系统，不限制面板文档的记录内容。

---

## OWASP Top 10 开发防护指南（2021）

### A01 - 访问控制失效（最高频漏洞）

**威胁**：用户 A 能访问/修改用户 B 的数据（IDOR/越权）。

【必须】所有数据读写操作必须校验当前用户是否拥有该资源的权限：

```python
# ✅ 查询时附加归属条件
order = db.query(Order).filter(
    Order.id == order_id,
    Order.user_id == current_user.id  # 必须加归属条件
).first()

# ❌ 只用 ID 查询，不校验归属
order = db.query(Order).filter(Order.id == order_id).first()
```

```go
// ✅ Go
order, err := orderRepo.FindByIDAndUserID(orderID, currentUserID)

// ❌ 直接按 ID 查，任何登录用户都能查他人的订单
order, err := orderRepo.FindByID(orderID)
```

【必须】使用最小权限原则：每个账号、服务、数据库账号只有完成职责所需的最小权限

【必须】默认拒绝（Deny by Default）：没有明确授权的操作一律拒绝

【必须】目录遍历防护：禁止将用户输入直接拼入文件路径

---

### A02 - 加密失败

**威胁**：敏感数据在传输或存储时未加密，或使用了弱加密算法。

【必须】所有对外接口使用 HTTPS，TLS 版本 ≥ 1.2（推荐 1.3）

【必须】密码存储使用强哈希算法（**bcrypt** 或 **Argon2id**），禁止使用 MD5 / SHA1：

```python
# ✅ 使用 bcrypt（Python）
import bcrypt
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))

# ❌ 禁止
import hashlib
hashed = hashlib.md5(password).hexdigest()   # MD5 已被破解
hashed = hashlib.sha1(password).hexdigest()  # SHA1 不安全
```

```java
// ✅ Java - Spring Security BCryptPasswordEncoder
BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
String hashed = encoder.encode(rawPassword);

// ✅ 验证
boolean matches = encoder.matches(rawPassword, hashed);
```

【必须】加密密钥不硬编码在代码中，通过环境变量或密钥管理服务注入

【必须】数据库中的敏感字段（身份证、银行卡号）使用 AES-256-GCM 加密存储

---

### A03 - 注入攻击（SQL / NoSQL / LDAP / OS Command）

**威胁**：用户输入被拼入查询语句，导致攻击者可以执行任意命令。

【必须】SQL 查询**必须**使用参数化查询（Prepared Statements），禁止字符串拼接：

```java
// ✅ 参数化查询（Java）
PreparedStatement stmt = conn.prepareStatement(
    "SELECT * FROM users WHERE id = ? AND status = ?");
stmt.setString(1, userId);
stmt.setString(2, "ACTIVE");

// ❌ 字符串拼接（SQL 注入漏洞）
String sql = "SELECT * FROM users WHERE id = '" + userId + "'";
```

```python
# ✅ ORM 参数化（Python SQLAlchemy）
user = db.query(User).filter(User.id == user_id).first()

# ❌ 拼接字符串（SQL 注入漏洞）
user = db.execute(f"SELECT * FROM users WHERE id = '{user_id}'")
```

```go
// ✅ Go - 占位符
db.QueryRow("SELECT * FROM users WHERE id = $1", userID)

// ❌ 字符串格式化
db.QueryRow(fmt.Sprintf("SELECT * FROM users WHERE id = '%s'", userID))
```

【必须】OS 命令执行时使用参数数组而非字符串拼接，禁止将用户输入拼入命令

【必须】NoSQL（MongoDB/Redis）查询同样必须校验输入，防止 NoSQL 注入

---

### A04 - 不安全设计

**威胁**：架构层面缺乏安全设计，导致无法通过代码修复根本问题。

【必须】安全需求在需求分析阶段就纳入，不在开发完成后修补

【必须】实施威胁建模（Threat Modeling），识别关键资产和攻击面

【推荐】遵循安全设计原则：深度防御（Defense in Depth）、失效安全（Fail Secure）

---

### A05 - 安全配置错误

**威胁**：不必要的功能开启、默认凭证未修改、错误信息暴露实现细节。

【必须】生产环境关闭调试模式、详细错误信息、Swagger UI 等开发工具

【必须】禁止在错误响应中暴露堆栈信息、数据库结构、服务器版本：

```json
// ❌ 暴露内部信息
{"error": "com.example.dao.UserDAO.findById: NullPointerException at line 45"}

// ✅ 通用错误提示
{"code": "INTERNAL", "message": "服务器内部错误，请稍后重试", "requestId": "..."}
```

【必须】定期检查所有默认密码已修改（数据库、Redis、管理后台等）

【必须】禁用不必要的 HTTP 方法（如 TRACE）

---

### A06 - 易受攻击和过时的组件

**威胁**：依赖库存在已知高危漏洞（如 Log4Shell、Spring4Shell）。

【必须】在 CI/CD 流水线中集成依赖漏洞扫描：

| 语言 | 工具 |
|------|------|
| Java | `mvn dependency-check:check` (OWASP Dependency Check) |
| Go | `govulncheck ./...` |
| Python | `pip-audit` / `safety check` |
| Node.js | `npm audit` |

【必须】高危（Critical/High）漏洞在 72 小时内修复，中危漏洞在 2 周内修复（参考值，项目可按自身 SLA 调整）

【必须】不使用已停止维护的库版本

---

### A07 - 认证和会话管理失败

参见 [认证授权设计规范](auth-design.md) 详细规范。关键要求：

【必须】密码使用强哈希（bcrypt/Argon2id），不可逆存储

【必须】会话 ID 长度 ≥ 128 bits，登录成功后重新生成会话 ID（Session Fixation 防护）

【必须】登录失败次数限制（如 5 次锁定 15 分钟），防止暴力破解

【必须】敏感操作（修改密码、修改手机号）要求重新验证身份

---

### A08 - 软件和数据完整性失败

**威胁**：自动更新、CI/CD 流水线被污染，构建物完整性无保证。

【必须】第三方依赖来源可信（官方仓库），禁止从不明来源下载 jar/npm 包

【必须】CI/CD 流水线中验证构建制品的完整性（checksum 校验）

---

### A09 - 安全日志和监控失败

【必须】记录所有认证事件（成功/失败）、权限异常、高危操作

【必须】日志不可被篡改，集中存储

【必须】配置告警：短时间内大量登录失败、异常 IP 访问、权限越界等

---

### A10 - 服务端请求伪造（SSRF）

**威胁**：服务端向用户提供的 URL 发起请求，攻击者可探测内网。

【必须】禁止将用户输入直接作为请求 URL，必须经过白名单验证

【必须】出口流量限制：服务不能访问内网地址（10.x、172.16.x、192.168.x）

---

## OWASP API Security Top 10 补充（2023）

| 排名 | 漏洞 | 关键防护措施 |
|------|------|------------|
| API1 | **对象级别授权失效（BOLA/IDOR）** | 每次查询附加用户归属条件 |
| API2 | **认证失效** | JWT 签名验证、Token 过期检查 |
| API3 | **对象属性级别授权失效** | 响应字段按权限过滤，不返回超出权限的字段 |
| API4 | **无限制资源消耗** | 分页上限、请求频率限制 |
| API5 | **功能级别授权失效** | 管理接口与业务接口独立鉴权 |
| API6 | **敏感业务流程滥用** | 关键操作限流（如批量注册、刷单）|
| API7 | **SSRF** | 白名单限制出口 URL |
| API8 | **安全配置错误** | 生产关闭 Swagger，禁止未授权接口 |
| API9 | **资产管理不当** | 下线废弃 API，维护 API 清单 |
| API10 | **不安全的第三方 API 调用** | 验证第三方响应数据，不盲目信任 |

---

## XSS 防护

**威胁**：攻击者在页面注入恶意脚本，劫持用户会话。

【必须】前端框架（React/Vue）默认 HTML 转义，**禁止**使用 `dangerouslySetInnerHTML` / `v-html` 渲染用户输入

【必须】设置 Content-Security-Policy（CSP）响应头：

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}'; object-src 'none'
```

【必须】设置 `X-Content-Type-Options: nosniff` 防止 MIME 嗅探

---

## CSRF 防护

**威胁**：攻击者诱导用户在已登录状态下发起恶意请求。

【必须】所有状态变更请求（POST/PUT/DELETE）验证 CSRF Token 或使用 `SameSite=Strict` Cookie

【必须】API 接口校验 `Origin` / `Referer` 头，拒绝跨域非预期来源

---

## 安全响应头

所有 Web 应用响应必须包含以下安全头：

```
Strict-Transport-Security: max-age=31536000; includeSubDomains   # 强制 HTTPS
X-Content-Type-Options: nosniff
X-Frame-Options: DENY                                              # 防 Clickjacking
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

## Related

- [认证授权设计规范](auth-design.md)
- [数据安全规范](data-security.md)
- [敏感数据处理规范](sensitive-data.md)
