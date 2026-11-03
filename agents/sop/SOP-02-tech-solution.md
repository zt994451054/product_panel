# SOP-02 技术方案 / 接口 / 数据库 / 发布文档

**触发**：被要求撰写或修改技术方案、接口设计、数据库设计、发布流程

**步骤：**
1. 读取 `foundation/tech-arch/overview.md` 了解技术架构基线
2. 按 AGENTS.md §4 读相关规范：`standards/architecture/`、`standards/security/`，以及本版本用到的 `standards/middleware/` 文件；发布相关内容以 `engineering/docs/ops-profile.md` 为准
3. 在 `versions/{当前版本}/engineering/` 下创建或修改对应文档
4. 如是变更导致 → 先执行 SOP-04 记录变更，再修改文档
5. 如涉及技术架构基线调整 → 同步更新 `foundation/tech-arch/` + changelog.md + decisions/ADR
   **ADR 触发判断**（符合任一条 → 必须创建 ADR；否则只更新 overview.md 即可）：
   - 技术选型类：引入新框架/语言/中间件，或替换现有选型（如 Redis Pub/Sub → Kafka）
   - 重大设计决策：影响多个服务的架构边界、数据所有权、通信协议变更
   - 不可逆或高成本变更：破坏性 API 版本、存储格式变更、不可回滚的基础设施变更
   ❌ **不需要 ADR**：接口字段调整、DB 增量 DDL、性能优化、Bug 修复类的架构小调整
6. 接口设计稿落档到 `versions/{ver}/engineering/api-design.md`（版本内设计稿）
   已发布的正式接口文档更新至 `engineering/docs/api-docs/openapi.yaml`
7. **如本版本引入新的基础设施依赖**（如原来不用 Kafka，本版本要引入）→ 同步更新 `engineering/docs/local-env.md` §3 基础设施依赖矩阵（**本项在技术方案阶段即同步，不能等到发布**，因为开发者要据此配 `.env`）
8. **核心实现路径验证**：找出本版本技术上最没把握、一旦不成立方案就要推翻的实现路径（如第三方能力、关键算法、性能瓶颈、跨系统调用），逐条实测（写最小验证代码，放在 `engineering/workspace/`，不合入主分支）或指出系统中已有的同类实现；结论和证据写入 `tech-solution.md`「核心实现路径验证」节（workspace 不入面板，证据要写明运行命令和关键输出，或已有实现的仓库路径）
   - 只验证「能不能做出来」；兼容性、性能达标等验收项属于测试阶段，**不作为进入开发的门槛**
9. 更新版本进度（如阶段推进）；技术方案完成后请使用者签收，再按 SOP-07 推进到「测试设计」

**完成标志**：方案文档已落档，核心实现路径已验证，基线已同步（如有），变更已记录（如有）

**示例：接口设计稿 vs 正式文档**
> 设计阶段 → 落档到 versions/v1.0.0/engineering/api-design.md（设计稿）
> 发布之后 → 更新 engineering/docs/api-docs/openapi.yaml（正式文档）
> 两者不可混淆

**示例：技术方案涉及架构变更**
> 用户说：「v1.1.0 要引入 Kafka 替代 Redis Pub/Sub」
>
> AI 正确行为：
> ① 先执行 SOP-04 在 CHANGES.md 记录变更
> ② 写 versions/v1.1.0/engineering/tech-solution.md
> ③ 更新 foundation/tech-arch/overview.md 技术栈说明
> ④ 新建 foundation/tech-arch/decisions/ADR-002-kafka-replace-redis-pubsub.md
> ⑤ 在 foundation/tech-arch/changelog.md 追加记录

**示例：编写数据库设计**
> 用户说：「帮我写 v1.0.0 注册功能的数据库设计」
>
> AI 正确行为：
> ① 读 versions/v1.0.0/product/requirements.md「涉及数据实体」字段
>    → 找到：users（修改）/ verification_codes（新增）
> ② 读 foundation/tech-arch/overview.md 了解数据库技术栈和命名规范
> ③ 在 versions/v1.0.0/engineering/db-design.md 填写：
>    - 变更清单（users 修改 / verification_codes 新增）
>    - 各表字段设计、索引设计、增量 DDL、回滚 DDL
> ④ 同步更新 versions/v1.0.0/README.md「发布关键项」中「增量 DDL」行：
>    | 增量 DDL | 修改 users 表新增 phone 字段，新增 verification_codes 表 | ⏳ |

**示例：技术方案定稿后完善发布关键项**
> 用户说：「技术方案已完成，补充一下发布关键项」
>
> AI 正确行为：
> ① 读取 versions/v1.0.0/engineering/tech-solution.md「配置变更需求」节
> ② 读取 versions/v1.0.0/engineering/db-design.md「变更清单」节
> ③ 打开 versions/v1.0.0/README.md「发布关键项」表，按实际情况填写：
>    | 增量 DDL | 新增 verification_codes 表，users 表新增 phone 字段 | ⏳ |
>    | 配置变更 | 新增环境变量 SMS_API_KEY（短信服务密钥）| ⏳ |
>    | 数据迁移脚本 | 无 | — |
>    | 代码脚本 | 无 | — |
> ④ 此后开发阶段如有新增变更，须同步更新此表
