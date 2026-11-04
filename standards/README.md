# 规范导航

`standards/` 是本项目唯一的规范来源。这里的内容是通用默认值，可以直接沿用，也可以修改、新增或从团队已有规范导入。

**怎么用**：先按「速查」定位，再打开具体文件。用到什么读什么，不用通读。

- 项目用不到的规范（如没有 Kafka、不写 Java）留白不删，以后用到时直接生效
- 找不到对应文件时，按行业通用做法执行，告诉使用者「项目没有这条规范」，并问是否新增
- 规范可以比 AGENTS.md 的 SOP 更严，不能更松；冲突时以 AGENTS.md 为准

**状态**：默认（通用内容，未定制）｜已定制（项目改过或导入过）｜待填写（内容只能由项目提供；没有特殊约定可以留白。DESIGN.md 由配置清单第 4 项管理）。状态只在本文件维护。

---

## 速查

| 正在做 | 先看 |
|--------|------|
| 写需求、验收标准 | [需求管理](./product/requirement-management.md)、[验收标准](./product/acceptance-criteria.md)、[业务规则](./product/business-rules.md) |
| 做原型、定交互 | [DESIGN.md](./design/DESIGN.md)、[原型设计](./product/prototype-design.md)、[UI/UX](./product/ui-ux-standards.md)、`product/interaction/` 中对应终端的文件 |
| 写技术方案 | `architecture/` 中相关文件、[安全基线](./security/security-baseline.md)、`middleware/` 中用到的文件 |
| 写接口 | [API 设计](./architecture/api-design.md)、[错误码](./coding/error-code.md)、[API 文档](./documentation/api-doc.md) |
| 设计数据库 | [数据库设计](./architecture/database-design.md)、[MySQL](./middleware/mysql.md) |
| 写代码 | [通用编码](./coding/general.md)、`coding/languages/` 中用到的语言、[错误处理](./coding/error-handling.md)、[日志](./coding/logging.md)、前端加 `coding/frontend/` |
| 提交、分支、合并、评审 | `version-control/` |
| 写测试计划、用例 | [用例设计](./testing/test-case-design.md)、[测试策略](./testing/testing-strategy.md) |
| 写单元、集成、性能测试 | [单元测试](./testing/unit-testing.md)、[集成测试](./testing/integration-testing.md)、[性能测试](./testing/performance-testing.md) |
| 涉及登录、权限、敏感数据 | `security/` |
| 发布、回滚、监控、处理故障 | `deployment/`；项目实际做法见 [运维与发布画像](../engineering/docs/ops-profile.md) |
| 写文档 | `documentation/` |
| 改用户可见文案、翻译（已启用多语言模块时） | [i18n/README.md](./i18n/README.md) |

---

## 目录

### product 需求与产品设计

| 文件 | 说明 | 状态 | 主标准 |
|------|------|------|--------|
| [business-rules.md](./product/business-rules.md) | 本产品的业务约束、功能边界、业务术语 | 待填写 | — |
| [requirement-management.md](./product/requirement-management.md) | 需求收集、优先级、粒度和状态对照 | 默认 | IEEE 29148 |
| [acceptance-criteria.md](./product/acceptance-criteria.md) | 验收标准的写法（Given-When-Then）和完成定义 | 默认 | BDD / Cucumber |
| [product-review.md](./product/product-review.md) | 需求和设计评审的范围与记录 | 默认 | Agile Alliance |
| [prototype-design.md](./product/prototype-design.md) | 统一原型的还原等级、页面状态和交付 | 默认 | Nielsen Norman Group |
| [ui-ux-standards.md](./product/ui-ux-standards.md) | 布局、反馈、可访问性等通用 UI/UX 原则（视觉值以 DESIGN.md 为准） | 默认 | WCAG 2.2 |
| [interaction/desktop-web.md](./product/interaction/desktop-web.md) | 桌面端 Web 的交互规则。其他终端按此格式新增 `interaction/{终端}.md` | 默认 | — |
| [interaction/desktop-web-templates.md](./product/interaction/desktop-web-templates.md) | 桌面端 Web 的页面模板（列表、详情、表单等） | 默认 | — |

### design 视觉设计

| 文件 | 说明 | 状态 | 主标准 |
|------|------|------|--------|
| [DESIGN.md](./design/DESIGN.md) | 色彩、字体、间距、组件的实际值，原型和前端直接使用 | 待填写 | awesome-design-md 格式 |
| [README.md](./design/README.md) | DESIGN.md 的使用规则 | 默认 | — |

### i18n 多语言（可选模块）

| 文件 | 说明 | 状态 | 主标准 |
|------|------|------|--------|
| [README.md](./i18n/README.md) | 文案母版、key、插值、术语与语言范围。在 `SETUP.md`「可选模块」启用后才生效 | 待填写 | — |

### architecture 架构设计

| 文件 | 说明 | 状态 | 主标准 |
|------|------|------|--------|
| [system-architecture.md](./architecture/system-architecture.md) | 系统分层、配置和依赖原则 | 默认 | Twelve-Factor App |
| [api-design.md](./architecture/api-design.md) | REST 接口、URL 命名、分页、版本、响应结构 | 默认 | Google AIP |
| [database-design.md](./architecture/database-design.md) | 表结构、命名、索引、变更 | 默认 | 见文件 |
| [cache-design.md](./architecture/cache-design.md) | 缓存模式、一致性、淘汰、穿透击穿雪崩 | 默认 | Azure Architecture Center |
| [mq-design.md](./architecture/mq-design.md) | 消息模型、可靠投递、幂等、重试 | 默认 | Enterprise Integration Patterns |
| [microservice.md](./architecture/microservice.md) | 服务拆分、服务间通信和认证 | 默认 | Martin Fowler |
| [high-availability.md](./architecture/high-availability.md) | SLO、容错、限流、部署架构选项 | 默认 | Google SRE Book |
| [scalability.md](./architecture/scalability.md) | 水平扩展、分库分表、异步化 | 默认 | AKF Scale Cube |

### coding 编码

| 文件 | 说明 | 状态 | 主标准 |
|------|------|------|--------|
| [general.md](./coding/general.md) | 跨语言通用原则：格式、命名、控制流、魔法值 | 默认 | 见语言页 |
| [code-comments.md](./coding/code-comments.md) | 注释原则、必写场景、标记注释 | 默认 | — |
| [error-handling.md](./coding/error-handling.md) | 错误处理原则和禁止事项 | 默认 | — |
| [error-code.md](./coding/error-code.md) | 错误码分层、命名、集中注册 | 默认 | — |
| [logging.md](./coding/logging.md) | 日志级别、结构化字段、日志安全、Trace ID | 默认 | Twelve-Factor App |
| [languages/java.md](./coding/languages/java.md) | Java：格式、OOP、集合、并发、命名、Javadoc、异常、日志 | 默认 | 阿里巴巴 Java 开发手册 |
| [languages/go.md](./coding/languages/go.md) | Go：格式、命名、Godoc、error 与 panic、日志 | 默认 | Effective Go、Google Go Style |
| [languages/python.md](./coding/languages/python.md) | Python：格式、命名、Docstring、异常、日志 | 默认 | PEP 8、Google Python Style |
| [languages/javascript-typescript.md](./coding/languages/javascript-typescript.md) | JS/TS：格式、TS 工程约束、命名、JSDoc、错误处理、日志 | 默认 | Airbnb JavaScript Style |
| [languages/css-sass.md](./coding/languages/css-sass.md) | CSS/Sass：格式、嵌套约束、BEM 命名 | 默认 | BEM、Airbnb CSS |
| [frontend/performance.md](./coding/frontend/performance.md) | 前端性能预算、资源加载、渲染和交互 | 默认 | — |
| [frontend/user-experience.md](./coding/frontend/user-experience.md) | 前端实现底线：Loading、错误、表单、状态、可访问性 | 默认 | — |

其他语言按同样格式新增 `coding/languages/{语言}.md`；框架规范放 `coding/frameworks/{框架}.md`。

### middleware 中间件

| 文件 | 说明 | 状态 | 主标准 |
|------|------|------|--------|
| [mysql.md](./middleware/mysql.md) | 数据库：连接、查询优化、ORM 使用 | 默认 | MySQL Reference Manual |
| [redis.md](./middleware/redis.md) | 缓存：Key 设计、数据结构、过期、分布式锁 | 默认 | Redis Documentation |
| [kafka.md](./middleware/kafka.md) | 消息：Topic 命名、分区、消费者、可靠性 | 默认 | Apache Kafka Documentation |
| [elasticsearch.md](./middleware/elasticsearch.md) | 搜索：索引、Mapping、查询 | 默认 | Elasticsearch Reference |
| [nginx.md](./middleware/nginx.md) | 网关：反向代理、TLS、限流配置 | 默认 | Nginx Documentation |
| [object-storage.md](./middleware/object-storage.md) | 存储：S3 兼容的上传、授权、生命周期。本项目配置见 [OSS.md](../OSS.md) | 默认 | AWS S3 Documentation |

### version-control 版本控制

| 文件 | 说明 | 状态 | 主标准 |
|------|------|------|--------|
| [git-workflow.md](./version-control/git-workflow.md) | 版本号、分支策略骨架、分支保护、AI 不推受保护分支 | 默认 | SemVer |
| [commit-convention.md](./version-control/commit-convention.md) | 提交信息格式和类型 | 默认 | Conventional Commits |
| [code-review.md](./version-control/code-review.md) | 评审原则、PR 描述、评论格式 | 默认 | Google Engineering Practices |
| [merge-strategy.md](./version-control/merge-strategy.md) | 合并方式、rebase 边界、长短分支 | 默认 | Trunk-Based Development |

### testing 测试

| 文件 | 说明 | 状态 | 主标准 |
|------|------|------|--------|
| [test-case-design.md](./testing/test-case-design.md) | 用例怎么写：覆盖矩阵、四要素、唯一预期、异常和边界、还原用例 | 默认 | ISTQB Foundation |
| [testing-strategy.md](./testing/testing-strategy.md) | 测试分层、覆盖率默认值（只在此定义）、缺陷、发布门禁 | 默认 | Test Pyramid |
| [unit-testing.md](./testing/unit-testing.md) | 单元测试命名、隔离、数据驱动 | 默认 | xUnit Test Patterns |
| [integration-testing.md](./testing/integration-testing.md) | 接口和服务协作的集成测试 | 默认 | Martin Fowler |
| [performance-testing.md](./testing/performance-testing.md) | 压测类型、目标、脚本、环境 | 默认 | Google SRE |

### security 安全

这一组约束产品代码和产品系统，不限制面板文档的记录内容。

| 文件 | 说明 | 状态 | 主标准 |
|------|------|------|--------|
| [security-baseline.md](./security/security-baseline.md) | 注入、越权、依赖漏洞等安全基线 | 默认 | OWASP Top 10 |
| [auth-design.md](./security/auth-design.md) | 认证、Token、权限模型 | 默认 | OWASP Authentication |
| [data-security.md](./security/data-security.md) | 加密、密钥、传输和存储安全 | 默认 | OWASP Cryptographic Storage |
| [sensitive-data.md](./security/sensitive-data.md) | 个人数据分级、脱敏、留存 | 默认 | GDPR 数据保护原则 |

### deployment 部署与运维

这一组是通用底线和可选做法，项目实际做法写在 [运维与发布画像](../engineering/docs/ops-profile.md)。

| 文件 | 说明 | 状态 | 主标准 |
|------|------|------|--------|
| [ci-cd.md](./deployment/ci-cd.md) | 流水线阻断、制品不可变、环境晋级 | 默认 | DORA Metrics |
| [deployment.md](./deployment/deployment.md) | 部署底线、发布策略选项、生产业务验证 | 默认 | Google SRE |
| [rollback.md](./deployment/rollback.md) | 回滚方案、数据变更的向后兼容 | 默认 | Google SRE |
| [monitoring.md](./deployment/monitoring.md) | 黄金信号、SLO 告警、告警分级 | 默认 | Google SRE |
| [incident-response.md](./deployment/incident-response.md) | 先止血后根因、无责复盘 | 默认 | Google SRE |

### documentation 文档

| 文件 | 说明 | 状态 | 主标准 |
|------|------|------|--------|
| [tech-doc-writing.md](./documentation/tech-doc-writing.md) | 技术文档的类型、结构和写法 | 默认 | Diátaxis |
| [api-doc.md](./documentation/api-doc.md) | API 文档内容和生成方式 | 默认 | OpenAPI 3.0 |
| [changelog.md](./documentation/changelog.md) | 面向发布对象的变更日志（与 `versions/{ver}/CHANGES.md` 分工不同） | 默认 | Keep a Changelog |

---

## 维护

- **修改规范**：改对应文件，把上表状态改为「已定制」
- **新增规范**：按领域放进对应目录，在上表加一行
- **从团队规范库导入**：把来源放进 `materials/` 或给出路径，按 [SOP-09.5](../agents/sop/SOP-09.5-exploration.md) 逐页整理，待使用者确认后状态改为「已定制」
- **从现有工程反推**：lint 和格式化配置、commitlint、git log、CI 检查项都可以作为物料
