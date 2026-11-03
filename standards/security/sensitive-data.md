# 敏感数据处理规范

> **主标准**：[GDPR 数据保护原则](https://gdpr.eu/data-protection-principles/)（通用数据保护条例）
> **副标准1**：[OWASP Privacy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/User_Privacy_Protection_Cheat_Sheet.html)
> **副标准2**：[中华人民共和国个人信息保护法（PIPL）](http://www.npc.gov.cn/npc/c30834/202108/a8c4e3672c74491a80b53a172bb753fe.shtml)

> **适用范围**：本页约束产品代码和产品系统，不限制面板文档的记录内容。
> 脱敏示例（11 位手机号、18 位身份证号）面向中国大陆场景，其他地区按当地号码格式和法规调整。

---

## 个人信息分类（PIPL / GDPR）

### 一般个人信息

| 数据类型 | 示例 | 处理要求 |
|---------|------|---------|
| 基本身份 | 姓名、生日、性别 | 访问控制、不随意公开 |
| 联系方式 | 手机号、邮箱、地址 | 脱敏展示、加密传输 |
| 账号信息 | 用户 ID、昵称 | 最小化收集 |
| 行为数据 | 浏览记录、购买历史 | 告知用途、可撤回 |

### 敏感个人信息（需额外保护）

| 数据类型 | 保护要求 |
|---------|---------|
| 生物识别信息（指纹、人脸）| 加密存储、不传输原始数据 |
| 身份证件号 | 加密存储、严格访问控制、最小化使用 |
| 银行账号/信用卡 | 加密存储、仅展示末 4 位 |
| 医疗健康信息 | 最严格控制，独立存储 |
| 精确位置信息 | 仅在用户授权时收集，不长期保存 |

---

## GDPR / PIPL 核心原则

### 1. 目的限制（Purpose Limitation）

【必须】收集数据只用于明确告知用户的目的，不得用于其他用途

```
❌ 收集手机号用于注册，后用于营销推送（未告知）
✅ 收集手机号用于注册 + 明确告知可能用于账号安全通知，用户同意
```

### 2. 数据最小化（Data Minimization）

【必须】只收集完成业务目的所必需的最少数据

```
❌ 注册页面要求填写：姓名、出生日期、家庭住址、紧急联系人（注册不需要这些）
✅ 注册只需：手机号或邮箱
```

### 3. 存储限制（Storage Limitation）

【必须】数据保存不超过必要期限，到期必须删除或匿名化：

| 数据类型 | 建议保留期限 |
|---------|------------|
| 用户账号信息 | 账号注销后 6 个月（申诉期）|
| 订单/交易记录 | 5 年（财务合规要求）|
| 日志数据 | 180 天 |
| 安全审计日志 | 1 年 |
| 用户行为数据 | 1 年 |

### 4. 准确性（Accuracy）

【推荐】提供机制让用户可以更正自己的个人信息

### 5. 安全性（Integrity and Confidentiality）

参见[数据安全规范](data-security.md)。

---

## 脱敏展示规则

所有含有个人信息的界面，必须对敏感字段进行脱敏展示：

| 数据类型 | 脱敏规则 | 展示示例 |
|---------|---------|---------|
| 手机号 | 保留前 3 位 + 后 4 位 | `138****5678` |
| 邮箱 | 保留名称前 3 字符 + 完整域名 | `zha***@example.com` |
| 身份证号 | 保留前 6 位 + 后 4 位 | `110101********1234` |
| 银行卡号 | 只显示后 4 位 | `**** **** **** 1234` |
| 姓名（中文）| 保留姓氏 | `张**` |
| 家庭住址 | 保留省市，隐藏详细地址 | `北京市朝阳区****` |

**多语言实现示例：**

```python
# Python 脱敏工具函数
def mask_phone(phone: str) -> str:
    if len(phone) != 11: return '***'
    return f"{phone[:3]}****{phone[7:]}"

def mask_email(email: str) -> str:
    parts = email.split('@')
    if len(parts) != 2: return '***'
    local = parts[0][:3] + '***' if len(parts[0]) > 3 else '***'
    return f"{local}@{parts[1]}"

def mask_id_card(id_card: str) -> str:
    if len(id_card) != 18: return '***'
    return f"{id_card[:6]}{'*' * 8}{id_card[14:]}"
```

```go
// Go 脱敏函数
func MaskPhone(phone string) string {
    if len(phone) != 11 {
        return "***"
    }
    return phone[:3] + "****" + phone[7:]
}

func MaskEmail(email string) string {
    parts := strings.SplitN(email, "@", 2)
    if len(parts) != 2 {
        return "***"
    }
    local := parts[0]
    if len(local) > 3 {
        local = local[:3] + "***"
    }
    return local + "@" + parts[1]
}
```

```typescript
// TypeScript 脱敏函数
function maskPhone(phone: string): string {
  if (phone.length !== 11) return '***'
  return `${phone.slice(0, 3)}****${phone.slice(7)}`
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  const masked = local.length > 3 ? `${local.slice(0, 3)}***` : '***'
  return `${masked}@${domain}`
}
```

---

## 用户权利保障（GDPR / PIPL）

系统必须支持以下用户权利的技术实现：

| 权利 | 技术要求 |
|------|---------|
| **访问权**：用户可查看自己的所有数据 | 提供"我的数据"查询导出功能 |
| **更正权**：用户可修正不准确的信息 | 提供个人信息编辑功能 |
| **删除权（被遗忘权）**：用户可申请删除数据 | 账号注销后真实删除或匿名化（不仅是软删除）|
| **携带权**：用户可导出自己的数据 | 支持 JSON/CSV 格式导出个人数据 |
| **撤回同意**：用户可撤回之前的授权 | 营销推送可随时退订，推送偏好可修改 |

---

## 隐私政策要求

【必须】上线前必须准备：

1. **隐私政策页面**：说明收集哪些数据、用途、保存期限、第三方共享情况
2. **用户授权弹窗**：首次使用或更新隐私政策时主动获取用户同意
3. **Cookie 授权**：使用 Cookie 追踪前必须获取用户同意（非功能性 Cookie）

---

## 第三方数据共享

【必须】向第三方提供用户数据前：

1. 在隐私政策中明确说明（用户知情）
2. 签订数据处理协议（DPA）
3. 最小化：只提供第三方完成服务所需的最少数据
4. 不向第三方提供精确的敏感个人信息（如精确位置、健康数据）

【必须】用户有权拒绝数据被共享给第三方用于非必要目的（如精准广告）

---

## 数据泄露响应

【必须】发生数据泄露时：

1. 立即评估影响范围（什么数据、多少用户）
2. 72 小时内上报监管机构（GDPR 要求）
3. 及时通知受影响用户（涉及高风险数据时）
4. 采取补救措施（强制重置密码、通知用户更改凭据）

## Related

- [数据安全规范](data-security.md)
- [日志规范](../coding/logging.md)（日志脱敏要求）
