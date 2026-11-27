# SOP-04 变更处理（先记录，后修改）

**触发**：收到任何变更指令——需求调整、设计修改、接口变更、任何「改一下之前的方案」

**核心原则：先登记，后修改。任何情况下不得跳过变更登记直接修改文档。**

变更的登记、处理进度和完结都用命令记录（`change open` / `change handle` / `change close`，见 [state.md](../state.md) §3）；`CHANGES.md` 只写叙述。

**不登记的情况**：使用者只是咨询（「X 应该怎么做」「这和规范一样吗」），或提出的想法还没决定要改。回答即可，不登记；使用者决定改了再登记。

**步骤：**
1. **判断范围影响**：不变 / 扩大 / 缩小。新增功能、验收标准、终端，或现有功能工作量明显增加，都算扩大；数据量、性能指标、接口或页面数量明显变化（如每天的时段从 48 个变成 96 个）也算，拿不准时按扩大处理并说明理由
   - **扩大**：先告诉负责人扩大了什么、对进度有什么影响，取得明确同意，用 `decision add` 登记他的原话，拿到决定编号。没取得同意前不登记变更、不改文档
   - 一个版本累计扩大三次及以上，在汇报里提醒负责人复核整体范围
2. **登记变更**（先于修改任何文档）：
   `change open --version {版本} --type {类型} --summary "{改了什么}" --reason "{为什么}" --scope-impact none|expand|shrink --affects {受影响的文档} [--decision {决定编号}] --by ai`
   - `--affects` 列出所有受影响的文档，宁可多列：需求文档、产品设计、原型、技术方案、接口设计、数据库设计、发布流程、发布关键项、测试计划、测试用例、产品架构基线、技术架构基线（键名见 `help`）
   - 范围扩大必须带 `--decision`，否则命令拒绝
   - 命令分配变更编号并记下登记时间
3. 在 `CHANGES.md` 用这个编号追加一节，写变更内容和原因的细节
4. 逐一修改受影响的文档；范围扩大的，版本 README「版本范围」表新增或更新行，「来源」写变更编号和决定编号
   - **需求变更时**：对受影响的需求条目运行 `item change --item {条目编号} --ref {变更编号}`；新增的功能用 `item add` 登记，移出本版本的用 `item drop`。还是草稿的条目改动后仍然是草稿（它从来没被确认过），只是多了变更编号；确认仍要走 `item confirm`
   - **需求变更时**：`item change` 会把关联该需求条目、已通过的用例自动退回「需回归」（需求变了，原来的结果可能失效，不重测等于伪装通过）。没有关联到这条需求条目、但同样受影响的用例，用 `case regress` 手工退回；用例内容要改的，改 `testing/test-cases.md` 详情，新增的用例先 `case add`
5. 每改完一份文档运行 `change handle --change {变更编号} --target {文档}`。文档改了、但里面还留着没确认的内容（第 9 步的新口径、待使用者答复的数字）时，加 `--pending "{还有什么待确认}"`：它会一直显示在 `status` 里，变更也完结不了；使用者确认并改好后，不带 `--pending` 再记一次。做的过程中发现还影响别的文档，运行 `change affect --change {变更编号} --add {文档}`
6. 还没处理的文档在 `CHANGES.md` 这一节写明负责人和截止时间；负责人或截止时间是 AI 建议的，写「建议：@xx，YYYY-MM-DD」，使用者确认后去掉「建议」
7. 告知用户：已处理清单 + 待处理清单
8. **完结须使用者确认**：受影响的文档都处理完后，请使用者确认，用他的原话运行 `change close --change {变更编号} --quote "{原话}" --by {确认的成员}`。AI 不能自行完结变更
9. 变更中由 AI 推导出的新口径（如新的指标、阈值、规则、优先级、截止日期）写入已确认需求前，须经使用者确认；未确认前在 `CHANGES.md` 标「待确认」，不写进 requirements.md

**完成标志**：变更已用命令登记，改完的文档已用 `change handle` 记录，没改完的已写明负责人

**示例：登记一条不改变范围的变更**
```
node tools/panel.mjs change open --version v1.0.0 --type requirement \
  --summary "注册由邮箱验证改为手机号验证" --reason "用户反馈邮箱收件率低" \
  --scope-impact none --affects requirements,tech-solution,test-cases --by ai
→ 编号：CHANGE-xiaolin-001

（改完需求文档和技术方案后）
node tools/panel.mjs change handle --version v1.0.0 --change CHANGE-xiaolin-001 --target requirements,tech-solution --by ai
→ CHANGE-xiaolin-001 还差：测试用例
```
CHANGES.md 里对应写：
```
## CHANGE-xiaolin-001 注册改为手机号验证
**变更内容**：注册流程由邮箱验证改为手机号验证
**变更原因**：用户反馈邮箱收件率低
**各文档改了哪里**：requirements.md 注册流程章节；tech-solution.md 认证模块
**待处理**：测试用例，建议：@王五，2026-04-20
```

**反例（错误行为）：**
> ❌ 直接打开 requirements.md 修改，没有先运行 `change open`
> ❌ 先改了文档，再补登记变更
> ❌ `--affects` 只写了需求文档，没有检查技术方案和测试用例是否受影响
> ❌ 文档都改完后自己运行 `change close`，原话写「已完成」

**示例：测试阶段收到需求变更**
> 用户说：「测试过程中发现注册需要加图形验证码」
>
> AI 正确行为：
> ① 判断这是范围扩大（新增验收标准和第三方依赖），先不登记、不改文档
> ② 告知用户：「这是范围扩大：要新增验收标准，还要接入一个验证码服务，已执行的注册用例要重测。需要你确认是否纳入本版本；不纳入可以放进需求池留给下个版本。」
> ③ 负责人明确同意后：`decision add` 记原话 → `change open --scope-impact expand --decision {决定编号} --affects requirements,design-spec,tech-solution,api-design,test-plan,test-cases,release-items` → 更新版本范围表 → 逐份修改文档并 `change handle`；建议暂停当前测试，等变更实施后重新进入测试阶段
> ④ 负责人没有明确同意（「你看着办」、没回答）：不登记、不改文档，问题保持待确认
