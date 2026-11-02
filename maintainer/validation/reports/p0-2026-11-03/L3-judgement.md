# L3 历史回放判定

被评审对象：面板根目录下的全部面板文档（不含 maintainer/）。路径均相对面板根目录。

## 判定口径

- **拦截**：有明确规则，且规则位于该情景必经的流程节点上（SOP 步骤、阶段门控、模板必填项）。
- **部分**：有相关规则，但表述含糊、不在必经节点上，或只覆盖情景的一部分。每条写明缺什么。
- **无**：面板中没有能拦住该情景的规则。每条列出查过的位置。
- 从严处理：
  - 情景分多段时，任一段未覆盖即判「部分」。
  - 只针对单一工具或单一场景的提示，不算通用规则。
  - 只作为可选手段提到的做法，不算规则。
  - 规则恰好默许该情景时，判「无」。
  - HTML 注释里的模板示例不算规则；模板正文和必填字段算。
- 摘录为原文子串，每条不超过 30 字。

## 需求与范围

| 编号 | 判定 | 依据 |
|---|---|---|
| H01 | 部分 | `AGENTS.md:584`「必须列出所有影响范围」；`AGENTS.md:1183`「豁免、签收、范围变更、新口径」；`AGENTS.md:590`「须使用者确认」；`versions/v1.0.0/CHANGES.md:24`「测试调整 / 范围裁剪」。缺：「影响范围」指受影响文档，不是版本范围的增减；CHANGES 模板没有范围扩大的类型或标记，也没有同步版本 README「版本范围」表的影响项；SOP-04 没有「范围扩大先请负责人确认」的步骤，1183 行只在 AI 已意识到要决策时才生效。 |
| H02 | 部分 | `AGENTS.md:386`「一旦不成立方案就要推翻的实现路径」；`AGENTS.md:756`「每条路径都有结论和证据」；`AGENTS.md:754`「无未解决的 ⛔ 阻塞型待确认问题」；`foundation/business/business-model.md:144`「商业模式中尚未经过充分验证的核心假设」。缺：技术方案门控能把实测提前到开发前，但需求确认时没有拦截；requirements.md 模板没有「待验证假设」节，→产品设计门控也不查；business-model 的假设表只管商业假设。 |
| H03 | 部分 | `AGENTS.md:378`「必须创建 ADR」；`foundation/tech-arch/overview.md:145`「详细决策过程见」；`versions/v1.0.0/product/requirements.md:179`「决策：{结论}」；`AGENTS.md:373`「了解技术架构基线」。缺：ADR 只管重大技术决策，产品、交互、流程决策没有集中记录（待确认问题节还写明「全部确认后删除此节」）；SOP-01、SOP-02 没有「重做设计前核对既有决策」的步骤。 |
| H04 | 部分 | `AGENTS.md:1183`「视为未决策：保持现状」；`AGENTS.md:747`「视为未签收，阶段保持 🔄」；`AGENTS.md:745`「记录签收人、日期和原话摘要」；`AGENTS.md:484`「只把使用者明确点到的用例记为通过」；`AGENTS.md:235`「由用户告知，AI 更新状态列」。缺：不把沉默当同意只明确到豁免、签收、范围变更、新口径；需求改「已确认」和一般决策不要求引用原话；防止扩大解读的规则只在测试通过场景存在。 |
| H05 | 部分 | `AGENTS.md:1096`「每次落档前先查此表」；`AGENTS.md:1179`「若仍不确定则询问」；`foundation/product/backlog.md:5`「一行一个需求点」；`versions/v1.0.0/CHANGES.md:3`「任何需求调整、设计变更、方案修改」。缺：§6 落档表没有「未立项调研」这一类，backlog 只放一行需求点，放不下调研内容；只有「不确定就询问」的兜底，没有固定落点，也没有禁止把调研写进 CHANGES。 |

## 设计与技术方案

| 编号 | 判定 | 依据 |
|---|---|---|
| H06 | 拦截 | `AGENTS.md:655`「前端开发须按原型还原」；`AGENTS.md:660`「前端页面与原型逐页对照」；`AGENTS.md:442`「界面用例须包含还原检查」；`versions/v1.0.0/testing/test-plan.md:205`「还原检查用例全部通过」；`AGENTS.md:759`「原型还原检查用例全部通过」。 |
| H07 | 拦截 | `AGENTS.md:301`「产品设计收尾时固定原型基准」；`AGENTS.md:755`「已固定原型基准」；`versions/v1.0.0/product/design-spec.md:35`「本版本开发与测试只对照这里固定的那一版」；`versions/v1.0.0/testing/test-cases.md:73`「原型路由 + 还原优先级 + 原型基准」。 |
| H08 | 拦截 | `AGENTS.md:386`「逐条实测」；`AGENTS.md:387`「不作为进入开发的门槛」；`AGENTS.md:756`「每条路径都有结论和证据」；`AGENTS.md:109`「是否收缩由使用者决定」；`versions/v1.0.0/engineering/tech-solution.md:146`「不放在这里卡开发」。 |
| H09 | 无 | 查过：SOP-05 全部步骤（`AGENTS.md:641`–664）、SOP-02、`standards/engineering/`、tech-solution.md 模板、defects.md 修复历程。`AGENTS.md:386`「指出系统中已有的同类实现」只是核心路径验证的可选方式；缺陷修复走 SOP-05，只有`AGENTS.md:654`「读取当前版本对应的技术方案」，没有检索既有机制的要求。 |
| H10 | 部分 | `AGENTS.md:756`「表每行已填写」；`versions/v1.0.0/engineering/db-design.md:97`「是否可在线执行」；`versions/v1.0.0/engineering/db-design.md:133`「确认回滚方案可行」；`versions/v1.0.0/engineering/release.md:17`「回滚方案已确认」。缺：tech-solution.md 没有「发布可行性」节；release.md 不在→测试设计门控内；发布关键项只逐项罗列，不要求交叉核对发布约束、生产结构变更和回滚；db-design 的说明不在门控内。 |

## 测试设计与执行

| 编号 | 判定 | 依据 |
|---|---|---|
| H11 | 拦截 | `AGENTS.md:740`「技术方案 → 测试设计 → 开发中」；`AGENTS.md:757`「覆盖矩阵无空行」；`AGENTS.md:644`「不写功能代码」；`AGENTS.md:1148`「或更早阶段时编写功能代码」。 |
| H12 | 拦截 | `AGENTS.md:440`「全部新特性点」；`AGENTS.md:455`「用户流程与异常分支」；`AGENTS.md:456`「对已有功能逻辑、接口、数据结构的改动点」；`AGENTS.md:757`「覆盖矩阵无空行」；`versions/v1.0.0/testing/test-cases.md:14`「来源逐项过一遍」。 |
| H13 | 拦截 | `AGENTS.md:441`「四项必填」；`versions/v1.0.0/testing/test-cases.md:86`「写可直接判定的内容」；`standards/testing/standards.md:17`「预期结果须可直接判定」；`AGENTS.md:757`「每条用例四要素完整」；`AGENTS.md:467`「独立评审」。 |
| H14 | 部分 | `AGENTS.md:758`「进入条件已逐条核对」；`versions/v1.0.0/testing/test-plan.md:186`「不得事后用执行结果反推勾选」；`versions/v1.0.0/testing/test-plan.md:140`「确保 AI 执行用例时无需额外询问」。缺：进入条件 188–193 行只有需求、部署、DDL、配置、CI、API，没有设备、账号可用、需人在场步骤；用例模板没有「需人在场」字段；→开发中门控不查凭证与环境，阻塞要到进入测试才可能暴露。 |
| H15 | 拦截 | `AGENTS.md:444`「P0 主流程用例按生产默认配置执行」；`AGENTS.md:458`「生产默认配置」；`versions/v1.0.0/testing/test-plan.md:53`「写明差异和处理方式」；`versions/v1.0.0/testing/test-cases.md:76`「P0 主流程写明使用生产默认配置」；`standards/testing/standards.md:20`「P0 主流程用例按生产默认配置执行」。附注：SOP-07 门控和退出条件都没有单列此项，见漏洞 L1。 |
| H16 | 部分 | `versions/v1.0.0/testing/test-plan.md:53`「测试环境与生产不一致的」；`engineering/docs/environments.md:14`「环境差异对照」。缺：test-plan 只登记配置项差异，不含数据（规模、存量结构）和启动、部署方式；environments.md 是长期静态表，不在任何门控内。 |
| H17 | 无 | 查过：SOP-03 A/B（`AGENTS.md:450`–478）、test-cases.md 执行记录、defects.md、`testing/docs/test-strategy.md`、acceptance.md。没有「人工干预须判定是否产品缺陷」的规则；`versions/v1.0.0/testing/test-plan.md:219`「发现环境问题及时上报」反而把这类现象引向环境问题。 |
| H18 | 拦截 | `AGENTS.md:446`「全部通过才放行」；`AGENTS.md:481`「AI 不得自行豁免」；`AGENTS.md:1149`「替使用者豁免用例或缺陷」；`AGENTS.md:759`「未通过项只能是使用者逐条豁免」；`versions/v1.0.0/testing/test-report.md:117`「结论只有两种」。 |
| H19 | 部分 | `AGENTS.md:746`「AI 自审、子 agent 评审、检查清单全部打勾」；`AGENTS.md:1150`「未经使用者签收就把阶段标为」；`versions/v1.0.0/README.md:34`「AI 自审不算签收」；`AGENTS.md:473`「用例未实际执行就保持」；`versions/v1.0.0/testing/test-cases.md:106`「通过时简述验证结果」；`versions/v1.0.0/testing/test-cases.md:108`「失败截图/录屏 CDN URL」。缺：「AI 自审标完成」已拦住；但用例层面没有规定谁有权判定通过、通过要什么证据（工件只要求失败时提供），用例的人工验收状态也不进→发布门控。 |
| H20 | 部分 | `AGENTS.md:461`「四处保持一致」；`versions/v1.0.0/testing/test-cases.md:127`「同步更新 ①用例详情执行记录」；`AGENTS.md:476`「不得估算」；`versions/v1.0.0/testing/test-report.md:145`「确认数据与来源文件一致」。缺：写报告时的核对能发现部分不一致，但面板规定的就是多处手工同步（用例四处，缺陷、报告各一份），没有「只维护一处或自动生成」。这条规则本身就是该情景的成因。 |
| H21 | 部分 | `versions/v1.0.0/testing/defects.md:118`「修复影响接口/DB/需求」；`AGENTS.md:475`「通过后才可关闭缺陷」；`AGENTS.md:577`「收到任何变更指令」。缺：缺陷关闭条件只要求重跑关联用例，没有「是否需回写用例、技术方案」的检查；defects.md 修复历程模板没有回写字段；SOP-04 靠变更指令触发，修复时的设计变动不触发；118 行只管发布时合入基线。 |
| H22 | 部分 | `versions/v1.0.0/testing/test-plan.md:40`「对已有功能逻辑、接口、数据结构和 UI 的每处改动」；`AGENTS.md:445`「列出的每项已有功能都要有回归用例」；`AGENTS.md:757`「回归测试范围」；`versions/v1.0.0/testing/test-plan.md:47`「无需回归则填」；`AGENTS.md:475`「重新执行关联用例」。缺：版本级回归有来源方法，但没有明确的「裁剪须确认」（test-plan 排除测试和「无需回归」都可由 AI 直接填写）；缺陷修复后只重跑关联用例，没有影响分析；没有防止全量扩测的方法。 |
| H23 | 部分 | `versions/v1.0.0/testing/test-plan.md:119`「准备方式」；`AGENTS.md:757`「测试数据」；`testing/docs/environments.md:37`「执行后须清理测试数据」；`engineering/docs/local-env.md:280`「reset-dev」。缺：门控只查「已填写」；退出条件和测试报告没有清理核查；test-plan 按数据类型登记，不登记具体种子和账号，也没有恢复方式字段；acceptance.md 的生产验收数据没有清理要求。 |

## 发布、生产与运维

| 编号 | 判定 | 依据 |
|---|---|---|
| H24 | 无 | 查过：release.md 发布前提、Step 1、回滚方案；db-design.md；`engineering/docs/db-schema/README.md`；SOP-07 门控。`versions/v1.0.0/engineering/release.md:15`「增量 DDL 已在 staging 环境执行并验证正常」恰好是情景中的做法；`versions/v1.0.0/engineering/release.md:17`「回滚方案已确认」只是确认，不是演练；`versions/v1.0.0/engineering/release.md:66`「表结构变更生效」是执行后才验证；`engineering/docs/db-schema/README.md:18`「写任何新增量前」只读基线文档。没有生产结构比对和发布、回滚演练。 |
| H25 | 拦截 | `versions/v1.0.0/engineering/release.md:112`「核心业务流程冒烟测试」；`versions/v1.0.0/engineering/release.md:114`「每项对应 requirements.md 中的核心验收标准」；`AGENTS.md:1066`「聚焦核心链路」；`versions/v1.0.0/testing/acceptance.md:51`「全部纳入」；`AGENTS.md:760`「由产品负责人签收」。 |
| H26 | 部分 | `versions/v1.0.0/engineering/release.md:18`「代码已合并至发布分支」；`standards/engineering/standards.md:8`「生产环境，保护分支」；`versions/v1.0.0/engineering/release.md:105`「前端资源版本号已更新」；`AGENTS.md:712`「生产运行版本」。缺：只有发布前的分支前提；上线后不核对线上版本标识（commit、tag、镜像）与面板是否一致；没有门禁外上线的例外流程。 |
| H27 | 部分 | `AGENTS.md:776`「额外合并动作」；`AGENTS.md:787`「未完成合并不得」；`AGENTS.md:1028`「hotfix 发布后收尾」。缺：只有基线合并是强制的；合并打标、清理临时资源（workspace 验证代码、临时环境、测试数据）、归档都没有清单；发布阶段本身没有收尾门控。 |
| H28 | 部分 | `foundation/product/production-bugs.md:96`「通过 CHANGES.md 传递修复需求」；`AGENTS.md:1031`「更新为 v1.0.1」；`AGENTS.md:1024`「填写 v1.0.1 和缺陷编号」；`AGENTS.md:1161`「同时更新多个版本的文档」。缺：回灌提示只在 production-bugs 的说明里，且限于「影响当前测试版本」；SOP-11 第 8 步收尾清单没有逐个在途版本确认；1161 行的禁令还会阻碍同步。 |
| H29 | 部分 | `AGENTS.md:381`「不可回滚的基础设施变更」；`AGENTS.md:385`「引入新的基础设施依赖」；`AGENTS.md:370`「被要求撰写或修改技术方案」；`engineering/docs/environments.md:43`「新增环境变量流程」。缺：这些规则只覆盖版本技术方案内的依赖和选型；部署方式、配置来源等独立的基础设施变更没有 SOP、影响分析和验证步骤；`standards/operations/standards.md` 对应节全是占位注释。 |
| H30 | 无 | 查过：`standards/operations/standards.md`（`standards/operations/standards.md:15`「描述标准发布流程」为占位）、release.md 全文、`engineering/docs/environments.md`、`testing/*/README.md` 的 CI 集成节、AGENTS.md（`AGENTS.md:758`「CI 流水线通过」是唯一相关提法）。没有「流水线只做通用动作，版本操作放发布文档」的规则。 |
| H31 | 部分 | `engineering/docs/local-setup.md:3`「通用启动模板」；`engineering/docs/tech-stack.md:40`「CI/CD」；`versions/v1.0.0/engineering/release.md:30`「发布方式」；`standards/operations/standards.md:13`「部署流程」；`SETUP.md:237`「测试分层策略已填写」。缺：启动、CI、发布方式有落点，但构建部署的长期说明只是占位，且 operations 规范不在路径一验收清单内（清单到 237 行的测试规范为止）；工具接入（AI 工具、外部系统）在 §6 落档表没有落点（只有 OSS 这一例）；没有「不得只留在本机或 AI 记忆」的规则。 |
| H32 | 无 | 查过：AGENTS.md 全部 SOP 与 §7、`standards/operations/standards.md`、release.md。没有外部写操作逐项授权、写后回读核对的规则。`OSS.md:110`「不设置 `acl` 参数」只是 rclone 的单点提醒，不是通用规则。 |

## 面板治理与协作

| 编号 | 判定 | 依据 |
|---|---|---|
| H33 | 拦截 | `AGENTS.md:1123`「未登记的根层内容会被静默忽略」；`AGENTS.md:1141`「新建根目录文件或顶层目录后不同步」；`.gitignore:3`「git check-ignore -v」。 |
| H34 | 部分 | `versions/README.md:15`「已立项或规划中、尚未激活执行的版本」；`AGENTS.md:713`「进度矩阵中新增版本行」；`AGENTS.md:709`「与用户确认新版本号」；`AGENTS.md:700`「当前版本已发布」。缺：规划表存在，但没有「在研、搁置版本必须登记在主线」的规则，也没有搁置状态；SOP-06 不要求查重占号，触发条件只支持上一版发布后串行开版，不覆盖并行版本。 |
| H35 | 无 | 查过：AGENTS.md §2、§3、§7、`standards/engineering/standards.md`（分支策略管工程仓库）、SOP-07。`AGENTS.md:301`「原型更新完成并提交后」只约束原型基准。没有多会话工作区、未提交改动堆积、正式文档不得引用未提交内容的规则。 |
| H36 | 无 | 查过：`SETUP.md`、`README.md`、AGENTS.md 中所有 SOP 的定义与引用、`.gitignore`。没有下游升级指南、SOP 编号预留规则或编号与引用的一致性检查。 |
| H37 | 部分 | `AGENTS.md:77`「操作唯一权威来源」；`AGENTS.md:3`「唯一的内容维护源」。缺：有「规则以本文件为准」，但没有要求把使用者口头定的长期约束写入面板；没有复盘环节（全面板检索不到「复盘」），也没有「以规则候选结尾」。 |
| H38 | 无 | 查过：AGENTS.md §2、§3（`AGENTS.md:118`「【当前项目状态】」只是状态摘要格式）、§7、`README.md`、SOP 示例。没有禁用内部代号、限制单次决策数量、语言一致的规范。 |
| H39 | 无 | 查过：AGENTS.md 全部 SOP、§2、§7（`AGENTS.md:1183`「在对应文档记」只说未决事项保持现状）、用例模板。没有无人值守模式、决策盘点、预授权、需人在场步骤标注。 |
| H40 | 无 | 查过：全面板检索「子 agent」，只见于独立评审和签收（`AGENTS.md:467`「另起一个未参与编写的会话 / 子 agent」、`versions/v1.0.0/testing/test-plan.md:179`「用例评审人」）。评审是单一场景，也不要求传递红线；没有子 agent 派发规范。 |
| H41 | 部分 | `AGENTS.md:748`「门控条件须在推进当时逐条核对」；`AGENTS.md:758`「功能代码已部署到 staging」；`AGENTS.md:664`「代码已 push 到远端」。缺：门控能在进入测试时发现代码未完成（且依据是「用户确认」），但没有交接规范和证据等级；§3 状态速查（`AGENTS.md:102`「提取：版本目标」）只读文档进展，不要求接手方核对代码和文档实际状态。 |
| H42 | 无 | 全面板凭据规则互相矛盾：`AGENTS.md:1154`「写入任何项目文档」（禁止）；`versions/v1.0.0/testing/acceptance.md:26`「静态凭证（直接记录」；`versions/v1.0.0/testing/acceptance.md:155`「须使用生产环境凭证」；`versions/v1.0.0/testing/test-plan.md:153`「禁止记录生产环境凭证」；`testing/docs/environments.md:17`「账号密码等敏感信息不可记录」。没有统一口径，也不符合「凭据完全不限制」（cases.md H42 所述 2026-10-28 决定）。 |
| H43 | 拦截 | `AGENTS.md:962`「git 只存 URL」；`AGENTS.md:1155`「上传文件到 OSS 后将本地文件也提交到 git」；`versions/v1.0.0/testing/test-cases.md:129`「CDN URL 填入」。附注：§0 允许 OSS 填「不使用」（`AGENTS.md:20`「产品无文件上传需求时」），此时证据没有落点，见矛盾 C7。 |

## 统计

| 判定 | 数量 | 编号 |
|---|---|---|
| 拦截 | 11 | H06 H07 H08 H11 H12 H13 H15 H18 H25 H33 H43 |
| 部分 | 21 | H01 H02 H03 H04 H05 H10 H14 H16 H19 H20 H21 H22 H23 H26 H27 H28 H29 H31 H34 H37 H41 |
| 无 | 11 | H09 H17 H24 H30 H32 H35 H36 H38 H39 H40 H42 |
| 合计 | 43 | |

## 面板规则之间的矛盾

| 编号 | 矛盾 | 位置 |
|---|---|---|
| C1 | 凭据规则互斥：总则禁止写入任何文档；验收模板要求直接记录生产专用账号的密码，并使用生产凭证；测试计划允许记录测试账号；测试环境文档禁止记录账号密码。四处都与「凭据完全不限制」的决定不符。 | `AGENTS.md:1154`「写入任何项目文档」；`versions/v1.0.0/testing/acceptance.md:26`「静态凭证（直接记录」；`versions/v1.0.0/testing/test-plan.md:151`「直接记录，执行时直接使用」；`testing/docs/environments.md:17`「账号密码等敏感信息不可记录」 |
| C2 | 生产验收发现的缺陷落点冲突：SOP-12 要求记入 defects.md 并触发 SOP-11；§7 和生产缺陷池要求生产 bug 一律进 production-bugs.md。SOP-00.6 的校验会因版本未标「已发布」把用户引回测试环境选项。SOP-11 只对已发布版本触发，而验收期版本尚未「已发布」。 | `AGENTS.md:1074`「立即在 `defects.md` 新建缺陷」；`AGENTS.md:1138`「一律记录到」；`foundation/product/production-bugs.md:94`「生产环境的 bug 记到本文件」；`AGENTS.md:264`「验证对应版本状态是否为」；`AGENTS.md:1011`「已发布版本发现 P0/P1 严重缺陷」 |
| C3 | SOP-11 内部及与 §7 冲突：步骤要求只填热修复节，示例却写主线式的版本与阶段修改；收尾要改 v1.0.0 的 defects.md，§7 禁止多版本同时更新；步骤用 BUG 编号，生产缺陷实际是 PROD 编号。 | `AGENTS.md:1024`「填写 v1.0.1 和缺陷编号」；`AGENTS.md:1044`「版本改为 v1.0.1」；`AGENTS.md:1030`「修复版本」；`AGENTS.md:1161`「同时更新多个版本的文档」；`AGENTS.md:278`「编号（PROD-{序号}）」 |
| C4 | 状态值不统一：待验收有 🕐 和 🔍 两套；「验收失败」与「验收不通过」并存；用例的「⏳ 待执行」不在状态枚举内；阶段回退的 ↩️ 不在图例内。 | `versions/v1.0.0/testing/defects.md:21`「🕐 待验收」；`standards/testing/standards.md:26`「🔍 待验收」；`AGENTS.md:1186`「⏳ 待执行」；`versions/v1.0.0/testing/test-cases.md:41`「⏳ 未执行」；`AGENTS.md:813`「↩️ 已回退」 |
| C5 | 豁免范围：测试策略写人工做「P1 豁免决策」，SOP-03 与模板写任何级别都须使用者逐条豁免。 | `testing/docs/test-strategy.md:32`「P1 豁免决策」；`versions/v1.0.0/testing/defects.md:116`「任何级别的缺陷都只能由使用者逐条豁免」 |
| C6 | 测试数据操作：环境文档禁止直接操作测试库，但测试计划写从库 seed、查询 DB 验证，SOP 示例也要核对表记录。测试在 staging 执行，隔离策略却要求写入 per-developer 的 dev schema。 | `testing/docs/environments.md:39`「所有数据操作须通过接口进行」；`versions/v1.0.0/testing/test-plan.md:122`「从 staging 数据库 seed」；`versions/v1.0.0/testing/test-plan.md:75`「查询 DB 验证字段值」；`versions/v1.0.0/testing/test-plan.md:109`「使用 staging 数据库和服务」；`versions/v1.0.0/testing/test-plan.md:130`「MySQL 测试数据写入自己的」 |
| C7 | 初始化口径：SETUP 称验收清单全勾后 §0 自动通过，但哨兵查的进入时间和 CDN 域名不在清单内；SETUP 把 OSS 放第一步，SOP-08 把产品名放第一步；§0 允许 OSS「不使用」，而 SOP-10 和各模板的工件字段默认走 OSS。 | `SETUP.md:243`「执行 §0 初始化检查将自动通过」；`AGENTS.md:19`「仍为 `<!-- YYYY-MM-DD -->`」；`AGENTS.md:20`「产品无文件上传需求时」；`SETUP.md:31`「Step 0：配置对象存储」；`AGENTS.md:841`「先引导完成 AGENTS.md §1」；`AGENTS.md:962`「git 只存 URL」 |
| C8 | SOP-05 完成标志写「驱动面板无变更」，同节示例要求更新面板内的 defects.md。 | `AGENTS.md:664`「驱动面板无变更」；`AGENTS.md:668`「状态改为：🔍 待验收」 |
| C9 | 原型与设计文档的优先级：原型 README 把 design-spec 排在原型之上；design-spec 又写视觉和交互以原型为准、与原型不一致即缺陷。 | `foundation/design/prototype/README.md:84`「版本 `design-spec.md` 补充交互规则」；`versions/v1.0.0/product/design-spec.md:120`「视觉和交互以统一原型工程」；`versions/v1.0.0/product/design-spec.md:121`「与原型不一致即为缺陷」 |

## 面板漏洞

| 编号 | 漏洞 | 位置 |
|---|---|---|
| L1 | →开发中门控和退出条件都没有单列「生产默认配置」：测试底线第 5 条只靠编写步骤和独立评审保证，执行时是否真按该配置跑，报告不核查。 | `AGENTS.md:757`「测试范围、回归测试范围、测试数据、退出条件已填写」；`versions/v1.0.0/testing/test-plan.md:199`「条件」；`versions/v1.0.0/testing/test-report.md:101`「退出条件」 |
| L2 | 门控不一致：→产品设计只查 P0 已确认，P1、P2 草稿只靠 §7 禁令；→测试设计以后不复查需求状态。部分门控列了上一阶段签收，→产品设计、→测试、→已发布没列，只靠总则。 | `AGENTS.md:754`「所有 P0 功能状态为」；`AGENTS.md:1144`「需求状态为」；`AGENTS.md:758`「功能代码已部署到 staging」 |
| L3 | 核心路径验证的证据可能无法复核：验证代码写在被忽略的 workspace，且不合入主分支，门控却以「证据」为准。 | `AGENTS.md:386`「不合入主分支」；`.gitignore:27`「engineering/workspace/*」；`versions/v1.0.0/engineering/tech-solution.md:150`「验证代码位置」 |
| L4 | 「生产运行版本」只在开新版本（SOP-06）和热修复收尾（SOP-11）时更新；SOP-07 推进到已发布不更新，发布后到开下一版之前 CURRENT.md 与线上不一致。 | `AGENTS.md:712`「更新为刚刚发布完成的上一个版本」；`AGENTS.md:771`「主线开发版本的当前阶段改为新阶段名称」；`AGENTS.md:1031`「更新为 v1.0.1」 |
| L5 | 版本模型只支持单主线串行：SOP-06 要求上一版发布完成才能开新版本，没有并行、搁置版本的路径，这是 H34 和 H28 的结构性原因。 | `AGENTS.md:700`「当前版本已发布」；`AGENTS.md:708`「发布阶段状态已标记为 ✅」 |
| L6 | SOP-05 第 0 步只覆盖「开发中」「测试且修缺陷」「测试设计或更早」，没有覆盖「发布」阶段（生产验收期）的修复。 | `AGENTS.md:642`「阶段为「开发中」」；`AGENTS.md:643`「且本次是修复缺陷」 |
