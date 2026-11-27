# SOP-01 需求文档 / 产品设计类工作

**触发**：被要求撰写或修改需求文档、产品设计文档、原型更新

**步骤：**
0. 按 AGENTS.md §4 读相关规范：需求写法和验收标准看 `standards/product/`，原型和交互还要看 `standards/design/DESIGN.md`、`standards/product/interaction/` 中对应终端的文件
1. **如是从需求池纳入新需求**（启动版本或中途补充）：
   - 读取 `foundation/product/backlog.md`，找到目标需求点（状态为「已确认」）
   - 更新 backlog.md：「纳入版本」填当前版本号，状态改为「已纳入版本」（SOP-00.5）
2. 在 `versions/{当前版本}/product/requirements.md` 下创建或补充功能模块（将 backlog 需求点展开为完整需求）
   - 功能清单每新增一行，运行 `item add` 登记，把分配的编号填进表里；状态不写在文档里。使用者确认某条需求后运行 `item confirm`（`--quote` 填原话）；决定不在本版本做的运行 `item drop`
   - 改写已有需求、重做设计或原型前，先运行 `decision list --version {当前版本}`，不违背仍有效的决定
   - 需求依赖但没亲自验证过的事实（第三方能力、现有系统支持、线上数据），写进「实现前提与待验证假设」，标出哪些是关键假设
   - 请使用者确认需求时，把未验证的假设一起列出来；待确认问题有了答复，按原话用 `decision add` 登记。需求条目的优先级和内容一起确认：`item add` 时填的优先级只是你的建议，请使用者确认条目时把优先级一起列给他；他改了优先级，`item confirm` 带 `--priority`
3. 如是需求变更 → 先执行 SOP-04 记录变更，再修改文档，并对受影响的条目运行 `item change --ref {变更编号}`
4. 如涉及产品架构调整 → 同步更新 `foundation/product-arch/` + changelog.md（版本需求与基线有差异时怎么处理见 [baselines.md](../baselines.md)）
5. **产品设计收尾时固定原型基准**：原型更新完成并提交后，在 `design-spec.md`「原型增量」节填写原型基准（面板提交号 + 原型路径）、本版本改动区域、页面映射表的还原优先级、设计验收点；还原优先级在此确定，后续测试阶段不得下调
6. 阶段完成后按 SOP-07 核对门控、请使用者签收，用命令记录；不在文档里手写阶段状态

**完成标志**：文档已落档，原型基准已固定（产品设计阶段），变更已记录（如有）；阶段完成的已按 SOP-07 用命令记录

**示例：新增需求**
> 用户说：「v1.0.0 新增消息通知功能，支持站内信和邮件两种方式」
>
> AI 正确行为：
> ① 打开 versions/v1.0.0/product/requirements.md
> ② 运行 `item add --version v1.0.0 --module 消息通知 --name "支持站内信和邮件两种通知方式" --priority P1 --by ai`，得到编号（如 FEAT-xiaolin-004）；在「功能清单总览」表追加一行：
>    | FEAT-xiaolin-004 | 消息通知 | 支持站内信和邮件两种通知方式 | P1 | 普通用户/管理员 |
> ③ 在「功能需求详情」区新增「消息通知」模块章节，补充业务规则和验收标准
> ④ 检查 foundation/product-arch/overview.md 是否需要同步新增「消息模块」
> ⑤ 新条目是草稿。使用者看过并明确确认后，才运行 `item confirm`

**示例：需求变更（版本已在开发中）**
> 用户说：「v1.0.0 的注册流程要改，去掉邮箱验证，改成手机号验证」
>
> AI 正确行为：
> ① 先登记变更（不先改文档）：
>    `change open --version v1.0.0 --type requirement --summary "注册由邮箱验证改为手机号验证" --reason "…" --scope-impact none --affects requirements,tech-solution,api-design,test-cases --by ai`
>    拿到编号 CHANGE-xiaolin-001，在 CHANGES.md 用这个编号写变更细节
> ② 再修改 requirements.md 对应章节，对受影响的需求条目运行 `item change --ref CHANGE-xiaolin-001`
> ③ 运行 `change handle --change CHANGE-xiaolin-001 --target requirements`
> ④ 技术方案、接口设计、测试用例还没处理，在 CHANGES.md 写明由谁处理；`status` 会一直列出它们

**示例：需求状态为「草稿」时的正确处理**
> 用户说：「帮我给注册功能写技术方案」
>
> AI 正确行为：
> ① 先读 versions/v1.0.0/product/requirements.md
> ② 运行 `item list --version v1.0.0` → 「注册流程」对应的条目还是「草稿」
> ③ 停止操作，告知用户：
>    「注册功能的需求还是草稿，尚未确认。若现在推进技术方案，
>     一旦需求变更将导致方案废弃浪费。请先将需求确认后再推进。」
>
> ❌ 错误行为：忽略草稿状态，直接开始写技术方案

**示例：编写产品设计文档**
> 用户说：「v1.0.0 需求已确认，帮我写产品设计文档」
>
> AI 正确行为：
> ① 先读 standards/design/DESIGN.md（视觉规范基线，不可跳过）
> ② 读取 versions/v1.0.0/product/requirements.md 中已确认功能模块的验收标准
> ③ 打开 versions/v1.0.0/product/design-spec.md
> ④ 在「全局交互规范」节定义通用行为（加载/错误/空状态/操作反馈规则）
> ⑤ 为每个「已确认」功能模块编写：用户流程与页面跳转逻辑；原型未覆盖的业务规则和边界状态（原型能直接体现的视觉结构不需要在此重复描述）；版本相对统一原型的增量说明（写入 design-spec.md「原型增量」节：新增哪些页面/模块、已有页面有哪些交互变化）
> ⑥ 执行 SOP-07：核对门控、请使用者签收，用命令记录签收并进入下一阶段

**示例：更新统一原型（新功能上线前）**
> 用户说：「v1.0.0 设计文档已完成，帮我把新页面更新到原型里」
>
> AI 正确行为：
> ① 读 standards/design/DESIGN.md 确认视觉规范
> ② 读 versions/v1.0.0/product/design-spec.md「原型增量」节，确认需要新增或修改哪些页面
> ③ 进入 foundation/design/prototype/，读 README.md 确认目标终端路径及启动命令
> ④ 在对应终端目录实现目标页面/组件，npm run dev 启动后视觉验收通过
> ⑤ 提交面板后，在 versions/v1.0.0/product/design-spec.md「原型增量」节标记已完成，并填写原型基准（本次提交号）、改动区域和各页面还原优先级
