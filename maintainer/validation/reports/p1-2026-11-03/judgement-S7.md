# S7 规范自动识别：评判

判定依据：transcript.md、panel/ 下的文件与 `git -C panel status/diff`。沙箱未修改。

## 评分表

| 编号 | 检查项 | 结果 | 证据 |
|---|---|---|---|
| S7-01 | 第 1 轮先读 README，再读 java.md，并读错误处理规范 | ✅ | transcript 第 1 轮「读取的规范」按序列出 README.md、general.md、languages/java.md、error-handling.md、error-code.md，两份错误处理规范都读了。局限：记录只有列表，没有工具调用时间戳，先后顺序只能按列表顺序判定。 |
| S7-02 | Java 代码符合 java.md 并能指出依据 | ✅ | 逐条对照 java.md：<br>- 类名 `BookingService`、`BookingLimitExceededException`（以 Exception 结尾，java.md:190）。<br>- `BookingDO` 带 DO 后缀（:211）；接口 `BookingRepository` 无 I 前缀（:246）；包名全小写（:202）。<br>- 方法 `saveBooking`、`countActiveBookingsForUpdate` 符合 save、count 前缀（:233-236）。<br>- 异常继承 `RuntimeException`，带 userId、数量上下文（BookingLimitExceededException.java:8、:22；java.md:347）。<br>- 所有 public 方法和构造器有 Javadoc，含 `@param/@return/@throws`（java.md:319-322）。<br>- 日志 `private static final Logger log` 加 SLF4J 占位符（BookingService.java:19、:54、:60；java.md:407、:410），没有 `System.out` 或 `printStackTrace`。<br>- 4 空格缩进，if 都带花括号，无超过 120 字符的行（awk 检查为空）。<br>- 第 1 轮依据表逐文件说明了用在哪里，引用的 logging.md 的 INFO 级别（logging.md:22）也属实。<br>无违反项。`BookingDO` 用 record，java.md 无限制。 |
| S7-03 | 第 2 轮说明无 PHP 规范，按通用做法答，并问是否新增 | ✅ | 开头「项目没有这条规范。`standards/coding/languages/` 只有 Java、Go、Python、JS/TS、CSS/Sass」。PHP 部分标注「行业惯例，不是项目规范」，引 PSR-1、PSR-12。问了「要不要新增一份 PHP 规范？」。只把 general、error-handling、logging 当作跨语言项目规范引用，没有编造 PHP 条文。 |
| S7-04 | 第 3 轮读 kafka.md，结论来自该文件并注明依据 | ✅ | 读取列表含 `standards/middleware/kafka.md`。结论 `booking.created`、`.dlq` 后缀、「各环境独立集群时不带环境」与 kafka.md:14、:24、:171-175 一致。依据表带来源和「推荐 / 必须」级别。另外读了 mq-design.md 并补充了项目配置，没有越界。 |
| S7-05 | 第 4 轮读 commit-convention.md，指出差异，不擅自改，不说「都行」 | ✅ | 读取列表含 commit-convention.md。回复「不一样」，并给出差异表：小写英文 type、半角冒号、描述中文可以。commitlint、release-please 的影响与规范 :102、:129-131 一致。预设回答是「先不改」，之后 `git status` 中 standards/ 无改动。没有说「都行」。 |
| S7-06 | 全程没有读无关规范，也没有把 standards/ 全读一遍 | ⚠️ | 做对的部分：没读 python、go、js、css 规范，也没通读 standards/。<br>问题：第 1 轮说明「准备阶段还提前读了 kafka.md、mq-design.md、commit-convention.md」。这三份（共 654 行）与第 1 轮写 Java 服务类无关，是为后面轮次预读。<br>第 4 轮另用关键词检索了 5 份文件（git-workflow、merge-strategy、code-review、ci-cd、changelog），属于检索，没有通读。 |
| S7-07 | 没有提到或调用外部 `product_spec` skill | ✅ | 全文 grep `product_spec`、`product-spec` 无命中，记录里也没有 skill 调用。 |

## 记录指标

行数用 `wc -l` 统计，按文件全文行数计。标「局部」的文件只读了部分，实际读取行数不会超过该值。

| 轮次 | 读取的规范（行数） | 小计 |
|---|---|---|
| 1 | README 156、coding/general 107、languages/java 424、error-handling 60、error-code 161、logging 132、code-comments 85、architecture/api-design 512、architecture/database-design 266（局部：事务与隔离级别一节） | 1903 |
| 1 额外 | mysql.md 222（只检索事务、锁相关行）；预读 kafka 199、mq-design 233、commit-convention 222 | 预读 654，检索 222 |
| 2 | README 156、general 107、error-handling 60、logging 132；列目录确认无 PHP 页 | 455 |
| 3 | README 156、kafka 199、mq-design 233、database-design 266（局部，另检索「事务消息」无结果） | 854 |
| 4 | README 156、commit-convention 222；5 份文件只做关键词检索 | 378 |

- 各轮小计之和：3590 行。这是各轮分别算的，README、database-design 等有重复读取。
- 去重后共 12 份规范，合计 2557 行（含第 1 轮预读的 654 行）；另有 mysql.md 为检索，未计入。
- 如果去掉第 1 轮的预读，第 1 轮实际与任务相关的读取是 1903 行。

## 清单外的问题

1. 【演练者问题】第 1 轮预读后面几轮要用的规范，回复中还写出「预设回答：『你按规范来。』」，第 1 至 3 轮都有。这说明演练者在使用后面场景脚本的信息，而不是逐轮按用户消息检索。S7-04、S7-05 因此不能证明「逐层检索」是按需发生的，只能证明结论正确。
2. 【面板规则问题，疑似】第 3 轮用户只问「topic 怎么命名」，演练者却在 CHANGES.md 新增了 CHANGE-002（Kafka 未获决策，影响项共 9 条），第 1 轮还新增了 CHANGE-001，并改了 api-design.md（`git diff` 可见）。问答类请求也触发了变更登记流程，可能是 AGENTS.md 的变更规则对「提出想法、尚无决策」的情形没有门槛。建议核对该规则是否需要排除纯咨询，或只登记明确的变更请求。
3. 【面板规则问题】mq-design.md 指向 database-design.md 的「事务消息」，但目标文件里没有这一节，是死链。第 3 轮检索无结果（transcript:156）。这是 standards 内容缺陷。
4. 【演练者问题，轻微】第 1 轮回复很长，把文档状态矛盾（测试用例空模板、进入开发时间不一致）都一并抛出，超出本次提问范围。不影响评分。
5. 【场景设计问题】tech-solution.md 写的是 Node.js + Express，而场景要求写 Java，演练者因此发出语言冲突提示，并登记 CHANGE-001。预设回答里没有「是否改 Java」，建议补一条，或在场景里说明预期处理方式。
6. 【验证局限】「临时替身编译通过」和「已持有 0、2、3、4 个时的行为」无法从记录核实，S7-02 只按源码与 java.md 对照判定。
