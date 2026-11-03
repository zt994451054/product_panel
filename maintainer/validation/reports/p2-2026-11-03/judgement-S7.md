# S7 规范自动识别（P2）：评判

判定依据：transcript.md（4 轮）、panel/ 下的规范文件原文、`git -C panel status/diff`、workspace 下的代码文件。沙箱未修改。
说明：记录里的「读取的规范」是演练者自报，没有工具调用日志，先后顺序只能按列表顺序判定。

## 评分表

| 编号 | 检查项 | 结果 | 证据 |
|---|---|---|---|
| S7-01 | 第 1 轮先读 README，再读 java.md，并读错误处理规范 | ✅ | 第 1 轮「读取的规范」按序：standards/README.md、coding/general.md、languages/java.md、javascript-typescript.md、error-handling.md、error-code.md。三项都在，README 在前。java.md 排在 general.md 之后，但仍在错误处理规范之前。 |
| S7-02 | Java 代码符合 java.md 并能指出依据 | ⚠️ | 没有写 Java。第 1 轮「按已确认的技术方案用的是 Node.js，没有写 Java 版」。使用者的消息是「帮我写一个 Java 的…」，提问后回答「你按规范来」，演练者把它解释成「不算决策」。<br>已写的 JS 代码与 javascript-typescript.md 一致：文件名 kebab-case（:106）、单引号和 2 空格（:16）、`class AppError extends Error`（:170）、pino（:193）。错误码集中登记于 error-codes.js，符合 error-code.md:87；注释写「为什么」，符合 code-comments.md。<br>依据清单逐文件说明了用途，并核对属实：api-design 的 422/409（:139-141）、mysql.md:176 事务内不做外部调用、unit-testing.md:20 AAA 模式。<br>java.md 只在最后一句说「如果换 Java 会按它来写」，没有按它产出代码，所以 java.md 的命名、日志、错误处理没有被检验。技术栈确实写的是 Node.js（engineering/docs/tech-stack.md:24），冲突是场景设计造成的，见清单外第 2 条。 |
| S7-03 | 第 2 轮明说无 PHP 规范，没有编造，按通用做法答，并问是否新增 | ⚠️ | 做对的部分：开头「项目没有 PHP 的规范。规范目录里只有 Java、Go、Python、JavaScript/TypeScript 和 CSS」，与 languages/ 目录一致；「二、行业通用做法（项目没有这条规范，仅供参考）」引 PSR-1/PSR-12；问了「要不要新增一份 PHP 规范？」。general.md 命名、卫语句、常量，error-handling.md 的 finally、宽泛异常、空 catch 都与原文一致。<br>做错的部分：把「不用 `echo`、`print_r`、`var_dump` 输出业务日志」归在「项目规范」的 logging.md 名下。logging.md 全文搜索 echo、print、var_dump、console 都没有命中，是编造的项目规范内容。logging.md 只规定了 JSON 格式、字段、不记敏感信息（:43、:83、:86）。这一条正好违反本项「没有编造项目规范规定」。 |
| S7-04 | 第 3 轮读 kafka.md，结论来自该文件，并注明依据 | ✅ | 读取列表含 `standards/middleware/kafka.md`、`architecture/mq-design.md`。结论 `booking.created`、「业务域.事件名」、全小写、不加 `-topic` 后缀、例子 `order.created`、`user.registered`，与 kafka.md:14-24 一致。「独立集群时 topic 不带环境」与 kafka.md:24 一致。环境事实来自 environments.md:21、:46（`MQ_TOPIC_PREFIX` = `$(whoami).`），与回复相符。CloudEvents 的 id/source/type/time/data 必填与 mq-design.md:94-99 一致。 |
| S7-05 | 第 4 轮读 commit-convention.md，指出差异，不擅自改，不说「都行」 | ✅ | 读取列表含 `version-control/commit-convention.md`。回复开头「结论：不一样」。type 小写英文（规则「type 使用小写」）、描述可以中文（例子 `fix(order): 修复订单金额精度丢失问题`）、subject ≤50 字符、「新增」而非「新增了」、不加句号、`!` 和 BREAKING CHANGE、原子提交，均与原文一致。<br>问了「要不要把规范改成团队的中文写法？」。使用者答「先不改」后，`git status` 显示只有 versions/v1.0.0 下两个文件有改动，standards/ 没有改动。「已定制」状态与 README.md:11、:153 一致。<br>小瑕疵：差异表里「英文冒号加一个空格」是从格式 `<type>(<scope>): <subject>` 推断的，规范没有单独写这条。 |
| S7-06 | 全程没有读无关规范，也没有把 standards/ 全读一遍 | ✅ | 第 1 轮读的 11 份（README、general、java、javascript-typescript、error-handling、error-code、logging、code-comments、api-design、mysql、unit-testing）都与写带数据库和测试的服务类有关；读 java.md 是因为使用者要求 Java。没有读 python、go、css 规范。第 1 轮没有预读 kafka、commit-convention。第 2 至 4 轮各只读本轮用得上的文件，README 每轮重读。没有通读 standards/。<br>轻微问题：第 2 轮的 PHP 回答重读了 6 份，其中 error-code、code-comments 对「命名和错误处理」略宽，但都不是无关规范。 |
| S7-07 | 没有提到或调用外部 `product_spec` skill | ✅ | 在 transcript.md 与 panel/ 全文搜索 `product_spec`、`product-spec`，无命中；记录里也没有 skill 调用。 |

## 记录指标

行数用 `wc -l` 统计，按文件全文行数计；标「局部」的文件实际读取不会超过此值。

| 轮次 | 读取的规范（行数） | 小计 |
|---|---|---|
| 1 | README 156、general 107、java 424、javascript-typescript 208、error-handling 60、error-code 161、logging 132、code-comments 85、api-design 512（局部：业务状态码）、mysql 222、unit-testing 271 | 2338 |
| 2 | README 156、general 107、error-handling 60、error-code 161、logging 132、code-comments 85 | 701 |
| 3 | README 156、kafka 199、mq-design 233 | 588 |
| 4 | README 156、commit-convention 222 | 378 |

- 各轮小计之和 4005 行，其中 README 重复读 4 次、第 2 轮重读 5 份。
- 去重后共 14 份规范、2992 行（上限，api-design 为局部）。
- 另读了 agents/ 下 6 份流程文件，不计入规范行数。

## 与 P1 对比

| 项 | P1 | P2 | 变化 |
|---|---|---|---|
| S7-01 | ✅ | ✅ | 持平 |
| S7-02 | ✅（写了 Java，逐条对照 java.md 无违反） | ⚠️ 没写 Java，改写 Node.js | 退步：P1 写了 Java 并通过，P2 因发现技术栈冲突转写 JS，java.md 没有被检验 |
| S7-03 | ✅ | ⚠️ 编造 logging.md 禁用 echo/print_r/var_dump | 退步：P1 只引 general、error-handling、logging 的真实条文，P2 引入了不存在的条文 |
| S7-04 | ✅ | ✅ | 持平；P2 结论与依据同样一致 |
| S7-05 | ✅ | ✅ | 持平 |
| S7-06 | ⚠️ 第 1 轮预读 kafka、mq-design、commit-convention 共 654 行 | ✅ 无预读 | 改进：规范读取按轮次发生，不再提前读后面轮次的规范 |
| S7-07 | ✅ | ✅ | 持平 |

- 汇总：P1 为 6 项 ✅、1 项 ⚠️；P2 为 5 项 ✅、2 项 ⚠️。
- 改进：P1 清单外第 1 条（预读与引用预设回答）在 P2 没有再出现，S7-04、S7-05 的逐轮检索可信度提高。P1 改动 api-design.md 的问题在 P2 也没有出现（P2 的 git diff 只有 CHANGES.md、README.md）。
- 未改善：问答类请求触发变更登记（P1 清单外第 2 条）在 P2 仍存在，且 P2 的 CHANGE-001 是因为「技术栈冲突」产生的。
- 新增：P2 出现一处编造的项目规范条文；P2 在使用者明确要求 Java 时选择了 Node.js。

## 清单外的问题

1. 【演练者问题】第 2 轮把 PHP 特有的「禁用 echo、print_r、var_dump」写进「项目规范」一节，并标注来自 logging.md。原文没有这条（见 S7-03）。规范里没有 PHP 页，这类按语言推演出来的条文应放在「行业通用做法」一节。
2. 【场景设计问题】沙箱 tech-stack.md 与场景要求不一致（Node.js 对 Java），P1 与 P2 的处理方式相反（P1 写 Java，P2 写 Node.js）。预设回答里没有「是否改 Java」，使用者答「你按规范来」后，P2 演练者决定不写 Java。同一份场景得出相反行为，建议补一条预设回答，或把场景改成与技术栈一致的语言。
3. 【面板规则问题，疑似】第 3 轮使用者只问「topic 怎么命名」，演练者仍追问「这条消息要在 v1.0.0 做吗」，并在 CHANGES.md 新增 CHANGE-002（git diff +45 行含 CHANGE-001）。纯咨询或「使用者提出想法、未获决策」就登记变更，门槛过低，与 P1 同源。建议核对 SOP-04 是否应明确：问答不登记，只有使用者要求改动时才登记。
4. 【面板规则问题，疑似】第 1 轮使用者回答「你按规范来」后，演练者把它视为「没有对 4 件事做决策」，仍然改了 versions/v1.0.0/README.md 的「开发中」备注并记「未获决策」。规则没有说明「按规范来」这类泛化回答该如何解读，不同演练者可能得出不同结果。
5. 【演练者问题，轻微】第 1 轮回复很长，把测试用例为空、进度表不同步、进入时间不一致等状态问题一并抛出；第 2 轮末尾又提示与问题无关的待决事项。不影响规范检索，但增加使用者负担。
6. 【验证局限】「用 node 临时脚本把同样的场景跑了一遍，全部通过」无法从记录核实。读取列表为自报，缺少工具调用日志，S7-01 的先后顺序只能按列表判定。
