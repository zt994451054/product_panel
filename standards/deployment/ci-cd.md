# CI/CD 流水线规范

> **主标准**：[DORA Metrics (Accelerate)](https://dora.dev/research/)（DevOps 研究与评估）
> **副标准1**：[Google SRE - Release Engineering](https://sre.google/sre-book/release-engineering/)
> **副标准2**：[Twelve-Factor App - Build/Release/Run](https://12factor.net/build-release-run)

本页是通用底线和可选做法；本项目实际做法见 [运维与发布画像](../../engineering/docs/ops-profile.md)。

---

## DORA 四项关键指标（度量参考）

DORA 研究定义了衡量 DevOps 能力的四个核心指标（分档数值随年度报告变化，以 [dora.dev](https://dora.dev/research/) 最新报告为准）：

| 指标 | 精英团队 | 高效团队 | 说明 |
|------|---------|---------|------|
| **部署频率** | 按需（每天多次）| 每天 ~ 每周一次 | 代码提交到生产的频率 |
| **变更前置时间** | < 1 小时 | 1 天 ~ 1 周 | 代码提交到生产部署的时长 |
| **变更失败率** | 0-15% | 16-30% | 部署后需要修复/回滚的比例 |
| **恢复服务时间（MTTR）** | < 1 小时 | < 1 天 | 故障发生到恢复的时长 |

**目标**：持续改进以上四项指标，而非追求"零部署失败"。

---

## 核心原则（底线）

以下原则不依赖 CI 平台。没有流水线时，把构建和部署写成可重复执行的脚本，同样适用。

1. **一次构建，多次部署**（Twelve-Factor App）：同一制品在所有环境中部署，禁止按环境重新构建
2. **快速失败**：流水线尽早发现问题，测试失败立即停止后续步骤
3. **可重复性**：相同输入始终产生相同构建结果（构建过程幂等）
4. **可追溯性**：每次部署能追溯到具体的代码提交（commit hash）、构建时间和操作人；每次发布的步骤和结果记录在 `versions/{ver}/engineering/release.md`

---

## 可选做法：分支与流水线的对应关系

哪条分支触发什么动作、部署到哪个环境，由项目决定并写入运维与发布画像。下面两种模型仅作示例，分支模型的选择见 [Git 工作流规范](../version-control/git-workflow.md)。

**示例一：主干开发（Trunk-Based）**

| 分支 | 触发 | 流水线动作 |
|------|------|-----------|
| 短期特性分支 | push | 构建 + 静态检查 + 单元测试 |
| `main` | merge | 构建 + 完整测试 + 部署非生产环境，验证后晋级生产 |

**示例二：Git Flow**

| 分支 | 触发 | 流水线动作 |
|------|------|-----------|
| `feature/*` | push | 构建 + 静态检查 + 单元测试 |
| `develop` | merge | 构建 + 完整测试 + 部署开发环境 |
| `release/*` | merge | 构建 + 完整测试 + 部署验证环境 |
| `main` / `master` | merge | 部署生产（晋级已验证的制品）|
| `hotfix/*` | merge | 走 [SOP-11](../../agents/sop/SOP-11-hotfix.md)，测试底线不放宽 |

---

## 流水线门禁

底线只有一条：**检查或测试失败就阻断后续步骤，不带着失败项往下走。** 发布放行以 [SOP-03](../../agents/sop/SOP-03-testing.md) 的测试底线为准。

典型流水线（示例，阶段按项目裁剪）：

```
代码检出
  ↓
静态分析（lint + 安全扫描）    ← 失败立即终止
  ↓
单元测试 + 覆盖率检查           ← 覆盖率低于阈值失败
  ↓
构建制品（镜像/二进制/安装包/归档）
  ↓
制品安全扫描（CVE 漏洞）        ← 高危漏洞默认阻断
  ↓
存档制品
  ↓
部署到非生产环境并验证
  ↓
晋级生产（是否需要审批由项目定义）
  ↓
发布后验证（健康检查 + 核心业务链路）  ← 失败立即回滚，具备自动化能力时可自动触发
```

### 各阶段规范

**静态分析**：
- 代码风格（ESLint / golangci-lint / black）
- 依赖漏洞扫描（npm audit / govulncheck / pip-audit）
- 代码质量（圈复杂度、重复代码检测）

**单元测试覆盖率阈值**：统一在 [测试策略规范](../testing/testing-strategy.md) 定义，本页不重复。覆盖率不能替代测试底线。

---

## 可选做法：若使用容器

以下内容只在项目用容器部署时适用。示例以 Go 为例，基础镜像版本仅作示意。

```dockerfile
# ✅ 多阶段构建：构建阶段
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download             # 缓存依赖层
COPY . .
RUN CGO_ENABLED=0 go build -o server ./cmd/server

# ✅ 最小运行镜像
FROM gcr.io/distroless/static:nonroot   # 或 alpine:3.19
WORKDIR /app
COPY --from=builder /app/server .
USER nonroot:nonroot                     # 非 root 运行
EXPOSE 8080
ENTRYPOINT ["/app/server"]
```

【推荐】生产镜像：
- 使用多阶段构建，最终镜像不含源码、编译工具
- 使用非 root 用户运行
- 基础镜像固定版本（如 `alpine:3.19`，不用 `latest`）

【推荐】镜像标签唯一、可追溯到 commit，不用 `latest` 部署。标签格式由项目定，示例：`{registry}/{service}:{版本号}-{git-short-hash}`

```
✅ registry.example.com/order-service:v1.2.3-a3f4b5c
❌ registry.example.com/order-service:latest
```

---

## 制品管理

制品可以是镜像、二进制、安装包或打包好的归档，存放位置由项目定（制品库、对象存储、构建机目录都可以）。

【必须】部署使用已构建并存档的制品，不在目标环境从源码临时构建

【必须】制品版本号唯一，禁止覆盖（immutable）

【必须】生产制品是已在非生产环境验证过的同一份制品，不在生产环境重新构建

【必须】密钥和凭证不写进产品代码和制品（包括镜像层、安装包、前端 bundle），部署时由环境注入

【推荐】发布前做依赖和制品的 CVE 漏洞扫描，CRITICAL/HIGH 级别默认阻断发布

---

## 流水线安全规范

【必须】流水线和部署脚本中的密钥/凭证不硬编码，使用 CI/CD 平台时通过平台的 Secret 管理注入

【推荐】构建和部署步骤（Jenkinsfile、GitHub Actions YAML、部署脚本等）存入版本控制

【推荐】构建环境使用临时/隔离的 Runner，防止构建环境污染

---

## 环境晋级

【必须】制品至少在一个非生产环境验证通过后才能进生产，不跳过验证

【必须】相同的制品版本在所有环境中部署，不同环境只有配置不同

有哪些环境由项目定义并写入运维与发布画像。非生产环境可以是常驻的 staging，也可以是本地或临时环境，它和生产的配置差异要记录清楚。

**可选做法：环境划分（示例）**

| 环境 | 用途 | 访问限制 |
|------|------|---------|
| dev | 本地开发 | 仅开发人员 |
| staging | 测试/验收 | 内部团队 |
| prod | 生产环境 | 外部用户 |

**可选做法：生产发布约束（由项目决定是否采用）**

- 审批：生产部署前由一名 Reviewer 审批；单人项目可由使用者本人确认。面板的阶段门禁见 [SOP-07](../../agents/sop/SOP-07-stage-gate.md)，不因此改变
- 发布窗口：安排在业务低峰期，紧急修复除外

## Related

- [部署规范](deployment.md)
- [回滚策略规范](rollback.md)
- [监控告警规范](monitoring.md)
