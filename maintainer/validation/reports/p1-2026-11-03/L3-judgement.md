# L3 回放复评（P1）

被评审：面板根目录（不含 maintainer/）。路径相对面板根目录。对照 P0：maintainer/validation/reports/p0-2026-11-03/L3-judgement.md。
口径同 cases.md：拦截 / 部分 / 无；从严；摘录 ≤30 字。

## 一、用例复评

| 编号 | P0 | P1 | 变化 | 依据与缺口 |
|---|---|---|---|---|
| H16 | 部分 | 拦截 | 升 | `engineering/docs/environments.md:27`「与生产不等价清单」；`:29`「测试环境和生产不一样的地方都列在这里」；`SETUP.md:41` 第10项「L1 测试 / L1 技术方案」；`SETUP.md:153`「「与生产不等价清单」已填写」；`AGENTS.md:744`「L1 项，状态为已确认或不适用」；`AGENTS.md:752`「测试环境配置已与生产默认配置核对」。P0 缺的数据、启动方式两段，现在由清单的总括表述和 environments.md:5 的「部署方式」列覆盖，且挂在 SOP-07 →测试（存量为 →技术方案）门控上。残余缺口：test-plan.md 没有消费这张清单的节（environments.md:29 要求测试计划据此安排生产验证，test-plan.md:51–57 只管配置项），清单的挂点是 AGENTS.md:744 一句隐含条款。 |
| H31 | 部分 | 拦截 | 升 | `engineering/docs/ops-profile.md:17/23/31/35/49/53`（构建与制品、配置与凭据、发布流程、回滚、生产验证方式、工具接入）；`SETUP.md:42` 第11项「L1 测试 / L1 技术方案」；`SETUP.md:160`「模板每节有内容或写明「无」」；`AGENTS.md:1098` §6 落档行。固定落点和门控都有。残余：没有「不得只留在本机或 AI 记忆」的明文；新产品可 ⏭ 到进入测试前（SETUP.md:160），开发期信息可能仍在口头；§6 行备注（AGENTS.md:1098）未列「工具接入」。 |
| H42 | 无 | 拦截 | 升 | `AGENTS.md:1104`「可以写在面板任何文档里，AI 不拒绝、不提醒」；`SETUP.md:259`「可以，写在哪个文档都行」；`AGENTS.md:918`「写入值或只写位置都可以」；`testing/docs/environments.md:16`「可以直接写值」；`engineering/docs/ops-profile.md:27`；`OSS.md:5`「想记录在面板文档里也可以」；`standards/README.md:120`「不限制面板文档的记录内容」。P0 的四处禁令（AGENTS 总则、test-plan、acceptance、testing/docs/environments）均已删除。残余（低）：见下文 R-凭据。 |
| H13 | 拦截 | 拦截 | 不变 | `AGENTS.md:428`「四项必填」；`AGENTS.md:751`「每条用例四要素完整、预期可判定」；`versions/v1.0.0/testing/test-cases.md:91`「禁止「显示正常」」；`standards/testing/test-case-design.md:79`「显示正常」禁用写法表。P0 引用的 standards/testing/standards.md 已不存在，现改指 test-case-design.md，规则更细。 |
| H14 | 部分 | 部分 | 无实质变化 | `AGENTS.md:752`「进入条件已逐条核对」；`test-plan.md:184`「不得事后用执行结果反推勾选」；`test-plan.md:140`「无需额外询问」。进入条件 186–192 行仍只有需求、部署、DDL、配置、CI、生产配置核对、API，没有设备、账号可用、需人在场；用例模板无「需人在场」字段。SETUP.md:151 只问「测试账号怎么获取」，第10项完成条件（SETUP.md:153）不含账号可用。 |
| H23 | 部分 | 部分 | 无变化 | `test-plan.md:119`「准备方式 / 清理方式」；`AGENTS.md:751`「测试数据…已填写」；`testing/docs/environments.md:35`「执行后须清理测试数据」；`standards/testing/test-case-design.md:68`「执行后清理」。门控只查已填写；退出条件（test-plan.md:198–208）和 test-report.md 退出条件核查表无清理项；不登记具体种子账号，无恢复方式字段。 |
| H30 | 无 | 无 | 无变化 | 新增 `standards/deployment/ci-cd.md` 有 `:33`「每次发布的步骤和结果记录在 release.md」、`:153`「构建和部署步骤…存入版本控制」，但只是可追溯性和存放要求，没有「流水线只做通用动作、版本专用操作放发布文档」。 |
| H33 | 拦截 | 拦截 | 不变 | `AGENTS.md:1103`「未登记的根层内容会被静默忽略」；`AGENTS.md:1122`「新建根目录文件或顶层目录后不同步 .gitignore 白名单」；`.gitignore:3–4`「git check-ignore -v」。P1 新增 materials/ 已按规则登记（.gitignore `!/materials/`）。 |
| H36 | 无 | 无 | 无变化 | 查过 SETUP.md、README.md、AGENTS.md、standards/README.md：无升级指南、SOP 编号预留或编号与引用一致性检查。仅 `AGENTS.md:31` 出现「合并上游模板」，是 L0 阻断时的放行项，不是规则。 |

统计（本批 9 条）：P0 拦截 3 / 部分 4 / 无 3 → P1 拦截 5 / 部分 2 / 无 2。

## 二、P0 矛盾复评

| 编号 | P1 状态 | 依据 |
|---|---|---|
| C1 凭据互斥 | 已消除（有低残余） | 四处禁令全部删除（`AGENTS.md:1104`、`testing/docs/environments.md:16`、test-plan/acceptance 的「禁止记录」警示行已删）；`acceptance.md:26/153` 与 `test-plan.md:151` 的「直接记录 / 须使用生产环境凭证」现与总则一致。 |
| C6 测试数据操作 | **未消除** | P1 未触及。`testing/docs/environments.md:36`「所有数据操作须通过接口进行」仍与 `test-plan.md:122`「从 staging 数据库 seed」、`:75`「查询 DB 验证字段值」冲突；`test-plan.md:109`「使用 staging 数据库和服务」与 `:130`「写入自己的 app_dev_${USER} schema」仍冲突。 |
| C7 初始化口径 | 已消除（引入 N1） | 三段均解：①§0 改读配置状态表（`AGENTS.md:14`「唯一依据」），哨兵与清单不一致不再存在；②SETUP 先第1、2项（`SETUP.md:68`），与 SOP-08（`AGENTS.md:822`）一致，OSS 降为第12项 L1；③OSS 不使用 = 第12项 ➖，`AGENTS.md:940` SOP-10 步骤0 处理「标了不适用但现在要上传」。 |
| 其他涉及初始化、凭据、规范路径的条目 | 无 | P0 的 C2–C5、C8、C9 不属这三类。顺带：C4（待验收统一为 🕐）、C5（豁免统一为任何级别）、C8（`AGENTS.md:652/654`「缺陷状态等文档照常更新」）已随 P1 消除；C2、C3、C9 未动。 |

## 三、P1 新引入或暴露的内部矛盾

| 编号 | 矛盾 | 位置 | 严重度 |
|---|---|---|---|
| N1 | 第13项规范确认是 L2，却被 SOP-08、SOP-09 的完成标志当必做：§0 与 SETUP 称 L2 不阻断、「L0 全部已确认就可以开始日常工作」。 | `SETUP.md:44`「L2」；`SETUP.md:247`「L0 全部已确认就可以开始」；`AGENTS.md:827`「第 13 项已表态」；`AGENTS.md:869` 同；`AGENTS.md:23–25` | 中 |
| N2 | L0 未完成时的放行范围不一致：§0 放行「面板维护（修改面板规则、合并上游模板）」，§7 的禁止只放行 SOP-08/09/09.5；且该禁令标题写「（新产品）」而 `AGENTS.md:1149` 另立存量一节，文本重叠。SOP-00 步骤（`AGENTS.md:188–191`）也漏了 §0，而 `AGENTS.md:64` 要求 §0 先于 §3。 | `AGENTS.md:31`；`AGENTS.md:1145`；`AGENTS.md:1144/1149`；`AGENTS.md:188` | 低 |
| N3 | 存量第3项 L1「需求分析」（`SETUP.md:34`；`AGENTS.md:871`「第 3 项在需求分析前」）没有对应的 SOP-07 门控行：表内无「→ 需求分析」（`AGENTS.md:746–754` 从 →产品设计 起），隐含条款（`AGENTS.md:744`）最早在 →产品设计 才生效。需求分析可在第3项未完成时开始，仅靠 §3 Step 4 的提示行（`AGENTS.md:100`）。 | 同左 | 中 |
| N4 | DESIGN.md 状态来源和措辞不一：SETUP 第4项（`SETUP.md:35` L1 产品设计，状态 ✅）、standards/README「待填写」（`standards/README.md:53`）、门控「已配置」（`AGENTS.md:749`，在 →技术方案）、禁令「未确认」（`AGENTS.md:1146`）。第4项确认后无规则要求同步 standards/README 状态；时点上隐含条款要求 →产品设计 前确认，显式行写 →技术方案。另 `standards/README.md:40` business-rules.md「待填写」无对应配置项和门控，永远没有消费方。 | 同左 | 低 |
| N5 | 存量探索清单漏第4、12项：`AGENTS.md:864` 与 `SETUP.md:79` 的探索项不含 4、12，第14–19项问一次（`AGENTS.md:867`）也不含，二者只在门控或 SOP-10 才被发现。「不适用」被当作等级列的值（`SETUP.md:38–39`），但等级表只定义 L0/L1/L2。 | 同左 | 低 |
| R-凭据 | 凭据残留限制（低）：`engineering/docs/db-schema/README.md:83`「不存敏感数据（实际值、密码、API 密钥）」；`standards/version-control/merge-strategy.md:154`「敏感信息（密钥、密码）未提交」（合并清单，未限定适用对象）；`test-plan.md:159`、`acceptance.md:33`「动态凭证（不记录值，执行时获取）」（按凭证类型分类，不是禁令，但字面上是「不记录」）。 | 同左 | 低 |

## 四、规范路径引用核查

脚本核对非 maintainer 的全部 `standards/…` 路径与相对链接：均指向新结构，无一失效（唯一未解析是 `versions/v1.0.0/testing/defects.md` 内的占位 `...`）。standards/engineering、standards/operations、standards/testing/standards.md、standards/ai 仅出现在 maintainer/（P0 报告证据、tracker），属维护区历史引用，不影响面板。注意：P0 报告 H13、H15、H26、H30 等引用的旧路径在当前面板已不存在，需用新路径重判（H13 已重判）。
