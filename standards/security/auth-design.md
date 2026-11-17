# 认证授权设计规范

> **主标准**：[OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
> **副标准1**：[OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749) + [OIDC](https://openid.net/specs/openid-connect-core-1_0.html)
> **副标准2**：[JWT Best Practices (RFC 8725)](https://tools.ietf.org/html/rfc8725)
> **副标准3**：[OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

> **适用范围**：本页约束产品代码和产品系统，不限制面板文档的记录内容。

---

## 认证基础原则

1. **认证与业务分离**：认证逻辑集中在认证服务，业务服务只做授权检查，不做认证
2. **最小权限**：用户和服务只拥有完成当前任务所需的最小权限
3. **深度防御**：网关层认证不能替代业务层授权检查

---

## 密码安全（OWASP 规范）

### 密码存储

【必须】密码使用强哈希算法存储，禁止可逆加密：

| 算法 | 推荐度 | 说明 |
|------|--------|------|
| **Argon2id** | ✅ 首选 | OWASP 2023 首推，抗 GPU 破解 |
| **bcrypt** | ✅ 推荐 | 成熟稳定，work factor = 12 |
| **scrypt** | ✅ 可用 | 抗 GPU，内存密集 |
| MD5 / SHA1 / SHA256（无盐）| ❌ 禁止 | 已被彩虹表/GPU 破解 |

```python
# ✅ Python - 使用 argon2
from argon2 import PasswordHasher
ph = PasswordHasher()
hashed = ph.hash(password)          # 存储
ph.verify(hashed, password)         # 验证（不匹配抛异常）

# ✅ Python - 使用 bcrypt
import bcrypt
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))
bcrypt.checkpw(password.encode(), hashed)
```

```java
// ✅ Java - Spring Security
@Bean
PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
}
```

```go
// ✅ Go - golang.org/x/crypto/bcrypt
hashed, _ := bcrypt.GenerateFromPassword([]byte(password), 12)
err := bcrypt.CompareHashAndPassword(hashed, []byte(password))
```

### 密码强度要求（OWASP 规范）

- 最小长度：**8 字符**（推荐 12+）
- 不强制混合大小写/数字/特殊字符（复杂规则导致用户使用弱规律密码）
- 检查是否在已泄露密码库中（[HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)）

---

## Token 认证（JWT / OAuth 2.0）

### JWT 设计规范（RFC 8725）

```json
// Header
{"alg": "RS256", "typ": "JWT"}

// Payload（Access Token）
{
  "iss": "https://auth.example.com",         // 颁发者
  "sub": "user:10086",                        // 主体（用户ID）
  "aud": ["api.example.com"],                 // 受众
  "exp": 1714396800,                          // 过期时间（短，15min~2h）
  "iat": 1714393200,                          // 颁发时间
  "jti": "550e8400-e29b-41d4-a716",          // 唯一ID（防重放）
  "roles": ["user"],                          // 角色
  "scope": "read:orders write:orders"         // 权限范围
}
```

**JWT 规则：**

【必须】使用非对称加密（RS256 / ES256），不使用 HS256（对称密钥泄露即全线崩溃）

【必须】Access Token 短有效期（15 分钟 ~ 2 小时），Refresh Token 长有效期（7~30 天）

【必须】验证所有字段：`iss`、`aud`、`exp`，不跳过任何验证

【必须】JWT Payload 不存储敏感信息（密码、手机号明文、身份证号）

【禁止】接受 `alg: none` 的 JWT（知名漏洞）

```python
# ✅ 验证所有必要字段
import jwt
payload = jwt.decode(
    token,
    public_key,
    algorithms=["RS256"],
    audience="api.example.com",
    issuer="https://auth.example.com",
)

# ❌ 危险：关闭验证
payload = jwt.decode(token, options={"verify_signature": False})
```

### Token 存储（前端）

| 存储位置 | XSS 风险 | CSRF 风险 | 推荐场景 |
|---------|---------|---------|---------|
| `HttpOnly Cookie` | ❌ 安全 | ⚠️ 需防护 | Web 应用（推荐）|
| `memory`（变量）| ❌ 安全 | ❌ 安全 | SPA 应用（页面刷新丢失）|
| `localStorage` | ⚠️ XSS 可读 | ❌ 安全 | 不推荐存 Access Token |

【推荐】Web 应用：Access Token 存 `HttpOnly` Cookie（防 XSS）+ CSRF Token（防 CSRF）

### Refresh Token 管理

【必须】Refresh Token 存储在服务端（如 Redis 等），支持主动撤销

【必须】Refresh Token 轮转（Rotation）：每次使用后颁发新的，旧的立即失效

【必须】检测到 Refresh Token 重用（可能的 Token 泄露），立即吊销该用户所有会话

---

## OAuth 2.0 授权流程选型

| 场景 | 推荐 Flow | 说明 |
|------|---------|------|
| Web 应用（有服务端）| **Authorization Code + PKCE** | 最安全 |
| SPA（纯前端）| **Authorization Code + PKCE** | PKCE 防止 code 截获 |
| 移动 App | **Authorization Code + PKCE** | 同上 |
| 服务间认证（无用户）| **Client Credentials** | 机器对机器 |
| 第三方代表用户操作 | **Authorization Code** | 需要用户明确授权 |

【禁止】在新系统中使用 Implicit Flow（已废弃，Token 暴露在 URL 中）

---

## 授权模型

### RBAC（基于角色的访问控制）

适合权限相对固定的系统：

```
用户 → 角色 → 权限
User  → Role  → Permission

示例：
admin → ["read:any", "write:any", "delete:any"]
editor → ["read:any", "write:own"]
viewer → ["read:any"]
```

### ABAC（基于属性的访问控制）

适合需要细粒度动态权限的系统：

```
策略：用户属性 + 资源属性 + 环境条件 → 允许/拒绝

示例：
"role=manager AND resource.department=user.department AND time.hour BETWEEN 9 AND 18"
```

### 实现要点

【必须】权限检查在**服务端**执行，前端展示控制只是 UX，不是安全控制

【必须】水平权限控制：用户只能操作自己的资源（加归属条件查询）

【必须】垂直权限控制：普通用户不能调用管理员接口

---

## 会话管理（OWASP 规范）

【必须】登录成功后**重新生成**会话 ID（防止 Session Fixation 攻击）

【必须】会话 ID 长度 ≥ 128 bits，随机生成

【必须】会话空闲超时：非活跃会话自动过期（推荐 30 分钟）

【必须】登出时服务端立即销毁会话，不只是删除前端 Cookie

---

## 暴力破解防护（OWASP 规范）

【必须】登录失败超过阈值后实施限制：

| 策略 | 说明 |
|------|------|
| 账号锁定 | 同一账号连续失败 5 次，锁定 15 分钟 |
| IP 限速 | 同一 IP 每分钟超过 20 次失败，封禁 1 小时 |
| CAPTCHA | 连续失败 3 次后展示 CAPTCHA |

【必须】登录失败时返回**通用错误信息**，不区分"账号不存在"和"密码错误"：

```json
// ✅ 通用提示
{"code": "UNAUTHENTICATED", "message": "账号或密码不正确"}

// ❌ 泄露信息
{"code": "USER_NOT_FOUND", "message": "该账号不存在"}
{"code": "WRONG_PASSWORD", "message": "密码不正确"}
```

---

## 多因素认证（MFA）

【推荐】核心功能（支付、修改密码、修改手机号）开启 MFA

| MFA 方式 | 安全级别 | 推荐度 |
|---------|---------|--------|
| TOTP（Google Authenticator）| 高 | ✅ 推荐 |
| 短信验证码 | 中（SIM 劫持风险）| ⚠️ 可接受 |
| 邮件验证码 | 中 | ⚠️ 可接受 |
| 安全密钥（FIDO2/WebAuthn）| 最高 | ✅ 高安全场景 |

## Related

- [安全基线规范](security-baseline.md)
- [API 设计规范](../architecture/api-design.md)（Token 传递规范）
