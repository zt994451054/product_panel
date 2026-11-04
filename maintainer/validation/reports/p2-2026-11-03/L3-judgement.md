# L3 复评（P2 拆分后）

被评审：面板 HEAD 5bcea9d（AGENTS.md 298 行 + agents/）。路径相对面板根目录。口径同 cases.md：从严，只认规则文本，不推测善意执行。

## 一、用例判定

| 编号 | 本轮 | 上轮 | 变化 | 证据 | 残余缺口 |
|---|---|---|---|---|---|
| H05 | 拦截 | 部分 | 升 | `AGENTS.md:221`「未立项的调研记录」；`agents/sop/SOP-00.5-backlog.md:29`「写在 `foundation/product/research/」；同文件:31「不要把未立项的调研写进任何版本目录」；`foundation/product/backlog.md:24` 表头有「调研记录」列；research/README.md 在，白名单不忽略 | §5 索引里 SOP-00.5 的触发（`AGENTS.md:144`）未写「调研」，靠 §6 落档表兜底（落档前必查） |
| H32 | 拦截 | 无 | 升 | `AGENTS.md:180`「写入面板以外的系统」触发读 collaboration；`AGENTS.md:264`「未经使用者逐项授权写入」；`agents/collaboration.md:30`「写后回读核对」；:31「检查工具默认值」；:32「被拦下不绕过」 | 回读、默认值两条只在 collaboration.md，入口 §7 没写；SOP-10（rclone 上传）、SOP-02 发布文档、SOP-12 都不指向它，全靠 §5.2 触发 |
| H34 | 部分 | 部分 | 缺口缩小 | `agents/sop/SOP-06-new-version.md:12`「版本号没有被占用」；:18「主线占号」；:19「并行立项」；`versions/CURRENT.md`「在研 / 搁置版本」表；`versions/README.md:11`「挂起」「放弃」 | 路由断：§5 索引 SOP-06 仍写「当前版本已发布，需要开始新的迭代版本」（`AGENTS.md:151`），没写并行立项、挂起、放弃；挂起/放弃没有索引入口。§3 Step 1（`AGENTS.md:81`）只查热修复/待发布，不读「在研 / 搁置」表，状态摘要看不到并行版本。SOP-07 门控不查 |
| H35 | 部分 | 无 | 升 | `AGENTS.md:265`「自动 stash、自动切换分支」；:266「正式文档引用未提交、未合入的内容」；`agents/collaboration.md:79`「动之前先问」；:81「正式文档不引用未提交」；`AGENTS.md:185`「切分支、建 worktree、提交」触发 | 「正式文档引用未提交」一段已拦住；「多会话共用一个工作区、未提交改动堆积」一段没有：没有开工先核对 git status、完成即提交、不留跨任务未提交改动的规则；隔离只在「需要隔离时」，非强制 |
| H36 | 部分 | 无 | 升 | `AGENTS.md:160`「编号从 50 开始」；`agents/upgrade.md:15`「不要对整个文件用 ours / theirs」；:33–:36 核对清单（编号不重复、下游自有内容没丢）；`agents/README.md:36`「50 起留给下游」 | 路由断：§5 索引和 §5.2 都没有「合并上游模板」触发行；upgrade.md 只经 agents/README.md 表（`agents/README.md:16`）和 `AGENTS.md:160` 一处括号链接到达，`AGENTS.md:31` 只提到允许合并，没链接。补一条入口触发即可升拦截。另：下游已用 <50 号的旧 SOP 如何改号，只写在 upgrade.md 的 P2 迁移说明里（:44-:46），不在核对清单 |
| H37 | 部分 | 部分 | 缺口缩小 | `AGENTS.md:64`「不算规则；要长期生效就写进面板」；`agents/rules-log.md:9`「只有写进面板的才是规则」；:11「以「规则候选」结尾」；`agents/collaboration.md:49`「授权只记在 AI 私有记忆」 | 「长期约束只存私有记忆」一段已拦（入口必读）。「复盘以规则候选结尾」只在 rules-log.md；复盘节点 `standards/deployment/incident-response.md:128` 的 Postmortem 模板只有预防措施表，没有规则候选，也不指向 rules-log |
| H38 | 拦截 | 无 | 升 | `AGENTS.md:171`「不用内部代号」「长对话后也不切换」；:172「每轮最多问 4 个问题」；:173「需要使用者决定的事单独列出」；入口 §5.1 每次回复适用，完整写法 `agents/communication.md:23` | 面板自身有 3 处与此冲突：①`AGENTS.md:96` §3 规定的话术含「见 SOP-07 时间戳要求」；②`SETUP.md:178` 第 14 项一条「问」含约 5 个子问题（按 :172 计数超限）；③`SETUP.md:70`、`SOP-08:8` 一次问第 14–18 项（5 项）。执行者照卡片或话术走会违反 §5.1 |
| H39 | 拦截 | 无 | 升 | `AGENTS.md:184`「使用者要你无人值守地连续推进」触发；`agents/collaboration.md:40`「先盘点决策」；:44「拿到预授权」；:45「标出需要人在场的步骤」；:46「超出预授权的事不做」 | 无 SOP 引用；预授权写入 CHANGES.md（:44），与 SOP-04 的变更登记用途混用，未说明格式 |
| H40 | 拦截 | 无 | 升 | `AGENTS.md:268`「派发子 agent 时不交代红线和交付物」；:181「派发子 agent 或并行任务」触发；`agents/collaboration.md:12`「目标：」、:14「红线：」派发模板；:19「共享台账只有一个写入者」 | SOP-03 的独立评审（派子 agent）不指向 collaboration.md，靠 §5.2 与 §7 |
| H41 | 拦截 | 部分 | 升 | `AGENTS.md:267`「须标实测 / 推断 / 未验证」；:183「上下文压缩、换会话或交给别人接手」触发；`agents/collaboration.md:65`「证据等级」；:73「接手方先核对」「以文件为准」 | 接手核对依赖交接说明存在；§3 状态速查本身不要求核对 git 与文档实际状态，使用者口头说「接着做」的新会话不一定读到交接说明 |

统计：拦截 6 条（H05 H32 H38 H39 H40 H41）；部分 4 条（H34 H35 H36 H37）；无 0 条。与上轮相比：升 8 条（H05 H32 H35 H36 H38 H39 H40 H41），持平 2 条（H34 H37，缺口都缩小了），降 0 条。

## 二、P2 引入的矛盾或断裂

| 编号 | 问题 | 位置 | 严重度 |
|---|---|---|---|
| P1 | §5 索引的触发文字没跟 SOP 文件同步：SOP-06 文件已加「并行立项」「挂起与放弃」，索引仍是旧触发；SOP-00.5 文件加了「④ 记录调研」，索引触发没提调研 | `AGENTS.md:151` vs `agents/sop/SOP-06-new-version.md:3,23`；`AGENTS.md:144` vs `SOP-00.5-backlog.md:27` | 中 |
| P2 | 「合并上游模板」「修改面板规则」没有 §5 / §5.2 触发行，upgrade.md、rules-log.md 只经 agents/README.md 或 §6 间接到达 | `AGENTS.md:31,160,223`；`agents/README.md:15–16` | 中 |
| P3 | 基线优先级规则（版本内文档 > foundation 基线，冲突须同步）由入口全文降为 §4 末尾一句指针；SOP-01、SOP-02、SOP-05 不链接 baselines.md，只有 SOP-07、SOP-11 链接。写需求、技术方案时遇到版本与基线差异，不会被引到该页 | `AGENTS.md:126`；`agents/sop/SOP-02-tech-solution.md:6,10`；`agents/sop/SOP-07-stage-gate.md:57`；`SOP-11-hotfix.md:21` | 中 |
| P4 | §5.1 与面板自带话术/卡片冲突（见 H38 残余①②③） | `AGENTS.md:96`、`SETUP.md:178`、`SETUP.md:70` | 低 |
| P5 | SOP-00 第 2 步写「找到对应 SOP」但不指 §5 索引；§2 第一句说按 §5 索引读，两处不互指 | `agents/sop/SOP-00-before-any-task.md:6`；`AGENTS.md:61` | 低 |
| P6 | upgrade.md 核对清单的 grep 命令未排除 `maintainer/`，保留该目录的项目会扫到验证文档里的假 SOP 编号（如 SOP-13、SOP-14）而误报 | `agents/upgrade.md:34` | 低 |

已核对无问题：
- AGENTS.md 与 agents/ 全部相对链接（含 SOP 文件内的 `../baselines.md`）无断链；SOP 索引 16 行与 `agents/sop/` 16 个文件一一对应，编号无重复，文件首行标题与编号一致；`.gitignore:24` 已有 `!/agents/`，`git check-ignore` 对新文件无输出。
- `agents/sop/` 内引用「AGENTS.md §0 / §1 / §3 / §4」共 8 处，§0 §1 §3 §4 均存在且含义未变。
- 旧「§4.1」「§4.2」引用：除 `agents/upgrade.md:44` 的迁移说明外，全仓无残留；SOP-07、SOP-11 原「按 §4.2」已改为指向 `baselines.md`。
- 内容丢失对比（`git show ecdfa44:AGENTS.md` 的 §4.1/§4.2/§5/§6/§7 逐行归一化比对）：SOP-00 至 SOP-12 全部正文、§4.1、§4.2 在新文件中都有；缺失行只有标题行、`§` 引用改写、SOP-10 的 rclone skill 安装段（有意替换，见 upgrade.md 末条）及 §7 对应的「未检查 rclone skill」禁令（随之删除）。新增行为 SOP-00.5 ④、SOP-06 第 8–9 步与挂起放弃段、baselines.md 标题与说明，均已在 upgrade.md 登记。

## 三、入口索引能否找到该读的 SOP

可找到：新需求、生产问题、写文档、测试、变更、开发修缺陷、推进阶段、新产品、存量、探索、上传、热修、生产验收，「什么时候用」一栏都与任务说法对得上；SOP-00 作为兜底也在表首。

找不到或不清楚：
1. 并行立项、挂起、放弃版本（SOP-06 触发行旧，见 P1）。
2. 合并上游模板、修改面板规则（见 P2）。
3. 独立的调研、竞品分析请求（SOP-00.5 触发行不含，靠 §6 落档表）。
4. 执行发布部署本身：索引只有「写发布流程」（SOP-02）和「部署完成后验收」（SOP-12），部署动作属外部系统写入，应指向 §5.2，索引未提。
5. 版本收尾（合并打标、清理）：L3 H27 在上一轮是「部分」，本轮不在复评范围，索引也无对应行。
