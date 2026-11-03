# 数据安全规范

> **主标准**：[OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
> **副标准1**：[OWASP Transport Layer Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html)
> **副标准2**：[NIST SP 800-111 Guide to Storage Encryption](https://csrc.nist.gov/publications/detail/sp/800-111/final)

> **适用范围**：本页约束产品代码和产品系统，不限制面板文档的记录内容。

---

## 数据分类

所有数据按敏感程度分级处理：

| 级别 | 示例 | 存储要求 | 传输要求 |
|------|------|---------|---------|
| **公开** | 产品描述、公开文章 | 无特殊要求 | HTTP 可接受 |
| **内部** | 业务数据、内部文档 | 访问控制 | HTTPS |
| **机密** | 手机号、邮箱、地址 | 加密存储（可选）+ 脱敏展示 | HTTPS |
| **受限** | 身份证、银行卡、密码 | **必须**加密存储 | HTTPS + 传输加密 |

---

## 传输安全（TLS）

【必须】所有外部通信使用 HTTPS，TLS 版本 ≥ 1.2（**推荐 TLS 1.3**）

**TLS 1.3 优势**：握手更快（1-RTT vs 2-RTT），只支持前向保密算法，已移除弱密码套件

【必须】禁用以下不安全的 TLS 协议和密码套件：

```
禁用：SSL 2.0 / SSL 3.0 / TLS 1.0 / TLS 1.1
禁用密码套件：RC4 / DES / 3DES / MD5 / SHA1（签名）/ 无前向保密的 RSA 密钥交换
```

【必须】启用 HSTS（HTTP Strict Transport Security）：

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

【必须】证书有效期管理：在过期前 30 天更新，建议使用自动续期（Let's Encrypt / ACME 协议）

【推荐】内部服务间通信（微服务）也使用 mTLS，不依赖网络隔离作为唯一安全保证

---

## 数据加密（静态数据）

### 加密算法选型

| 用途 | 推荐算法 | 禁止算法 |
|------|---------|---------|
| 对称加密（数据加密）| **AES-256-GCM** | DES、3DES、AES-ECB |
| 非对称加密（密钥交换/签名）| **RSA-4096** 或 **ECDSA P-256** | RSA-1024、RSA-2048（新系统）|
| 哈希 | **SHA-256** / **SHA-3** | MD5、SHA-1 |
| 密码存储 | **Argon2id** / **bcrypt** | MD5、SHA1、SHA256（无盐）|
| 消息认证码 | **HMAC-SHA256** | — |

> **AES-ECB 为什么禁止**：ECB 模式对相同的明文块产生相同的密文块，可通过密文模式分析破解内容。**必须使用 GCM 或 CBC + HMAC**。

### 数据库字段加密

【必须】以下字段在数据库中必须加密存储：

```sql
-- 受限级别数据必须加密
id_card_number      -- 身份证号
bank_card_number    -- 银行卡号
password_hash       -- 密码（使用专用哈希，不用通用加密）
private_key         -- 私钥

-- 机密级别数据建议加密
phone_number        -- 手机号
email               -- 邮箱
```

**加密实现：应用层加密优于数据库层加密**（数据库层加密对 DBA 仍透明）

```python
# ✅ Python - 应用层 AES-256-GCM 加密
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import base64
import os

key = base64.b64decode(os.environ["FIELD_ENCRYPTION_KEY"])  # 环境变量存 base64，解码后为 32 bytes
aesgcm = AESGCM(key)
nonce = os.urandom(12)  # 每次加密用随机 nonce
ciphertext = aesgcm.encrypt(nonce, data.encode(), None)
stored = nonce + ciphertext  # 存储：nonce + 密文
```

---

## 密钥管理

【必须】加密密钥不能硬编码在代码或配置文件中

【必须】密钥通过以下方式注入：

| 方式 | 适用场景 |
|------|---------|
| 环境变量 | 单服务、简单场景 |
| 密钥管理服务（KMS）| 推荐，如各云厂商的 KMS、HashiCorp Vault 等 |
| 密钥派生（HKDF）| 从主密钥派生子密钥 |

【必须】密钥轮转：字段加密密钥每年轮转，Token 签名密钥每 90 天轮转

【必须】密钥备份与恢复方案：密钥丢失等同于数据永久丢失

---

## 数据库安全

【必须】数据库账号遵循最小权限原则（参考数据库设计规范）

【必须】数据库不直接对外网暴露，只允许应用服务器内网访问

【必须】数据库连接串（含密码）通过环境变量/配置中心注入，不存在代码仓库

【必须】数据库审计日志开启，记录高危操作（DROP TABLE、GRANT 等）

---

## 备份安全

【必须】备份数据同样加密存储

【必须】备份访问权限独立于生产系统权限

【必须】定期验证备份可恢复性（恢复演练）

【推荐】采用异地备份，防止单机房灾难导致数据丢失

---

## 日志安全

【必须】日志中禁止出现以下信息：

```python
# ❌ 禁止记录敏感信息
logger.info(f"User login: phone={phone}, password={password}")
logger.info(f"Token: {token}")

# ✅ 脱敏后记录
logger.info(f"User login: phone={mask_phone(phone)}")
logger.info(f"Token prefix: {token[:8]}...")
```

| 数据类型 | 脱敏规则 | 示例 |
|---------|---------|------|
| 手机号 | 保留前 3 后 4 | `138****5678` |
| 邮箱 | 保留前 3 个字符 + 域名 | `zha***@example.com` |
| 身份证 | 保留前 6 后 4 | `110101********1234` |
| 银行卡 | 只显示后 4 位 | `**** **** **** 1234` |
| 密码 | 不记录 | — |
| Token | 只记录前 8 位 | `eyJhbGci...` |

## Related

- [安全基线规范](security-baseline.md)
- [敏感数据处理规范](sensitive-data.md)
- [认证授权设计规范](auth-design.md)
