# SOP-05 开发与缺陷修复

**触发**：被要求开发功能、修复 Bug、修改代码

**核心原则：工程代码不入驱动面板。workspace/ 目录已被 .gitignore 忽略，所有代码变更只通过 push 到对应仓库体现，驱动面板零代码文件。**

**步骤：**
0. **先查版本阶段**（AGENTS.md §3 已读的 CURRENT.md）：
   - 阶段为「开发中」→ 继续
   - 阶段为「测试」或「发布」（含生产验收），且本次是修复缺陷 → 继续
   - 阶段在「测试设计」或更早 → **不写功能代码**，告知使用者当前阶段和进入开发还缺什么（见 SOP-07「→ 开发中」门控）。唯一例外：技术方案阶段为「核心实现路径验证」写的验证代码，结论记入 tech-solution.md
1. 读取 `engineering/README.md` 工程清单 → 找到目标工程的「工程名」、仓库地址、分支策略
2. Clone 代码到 workspace 目录（若已存在则 git pull 更新）
   - 命令：`git clone <仓库地址> engineering/workspace/<工程名>`
3. 读取 `engineering/docs/local-env.md` 了解本地模式 / 端口分配 / 隔离策略 / dev 连接方式，
   再读 `engineering/docs/local-setup.md` 了解启动命令
4. **基础设施依赖漂移软检查**（低成本，顺手做）：扫 workspace 下正在开发工程的依赖文件
   （`package.json` / `go.mod` / `requirements.txt` / `pom.xml` 等），看 client 库
   （`mysql2` / `ioredis` / `kafkajs` / `@elastic/elasticsearch` / `aws-sdk` ...）
   是否都在 `local-env.md` §3 依赖矩阵中有对应声明。发现 drift 则提示用户同步更新 §3（走 SOP-02）。
5. 读取当前版本对应的技术方案：`versions/{当前版本}/engineering/tech-solution.md`
5.5. **先查现有机制**：动手前在工程里搜索有没有已有的同类实现（工具函数、组件、中间件封装、重试或鉴权机制），能复用就复用；修缺陷时先找到同类问题在别处是怎么处理的。新写的东西与已有机制重复时，在提交说明里写明为什么不能复用
6. **前端开发须按原型还原**（不是「参考」）：
   - 读取 `versions/{当前版本}/product/design-spec.md`「原型增量」节：原型基准（提交号）、本版本改动区域、页面映射表与还原优先级
   - 进入 `foundation/design/prototype/`，读 README.md 确认目标终端路径及启动命令，`npm run dev` 启动对应终端原型（原型已更新到基准之后时，以基准提交为准）
   - 还原要求见原型 README「还原优先级」：高保真页面的布局、组件、文案、状态、交互与原型一致；参考还原页面的视觉风格一致，交互和流程同样须与原型一致
7. 按 AGENTS.md §4 读相关规范后开发：`standards/coding/general.md`、`standards/coding/languages/` 中用到的语言，前端加 `standards/coding/frontend/`，用到的 `standards/middleware/` 文件，提交和分支看 `standards/version-control/`
8. **提测前自测**：以 `testing/test-cases.md` 中本次涉及的 P0 用例为依据逐条自测；前端页面与原型逐页对照，偏差修正后再提测
9. 开发完成后按分支策略创建分支、提交、push 到远端
10. 驱动面板中不产生任何代码文件变更（缺陷状态等文档照常更新）

**完成标志**：代码已 push 到远端，相关 P0 用例自测通过，驱动面板没有新增代码文件（缺陷状态等文档照常更新）

**示例：Bug 修复完成后**
> 除代码 push 外，还需更新缺陷文件：
> defects.md 中 BUG-001 状态改为：🕐 待验收

**反例：**
> ❌ 在驱动面板根目录创建 src/ 或任何代码文件
> ❌ 没有读技术方案就开始写代码
> ❌ 版本还在「技术方案」或「测试设计」阶段，就开始写功能代码
> ❌ 把原型当「视觉参考」，按自己理解调整布局、文案或交互流程
> ❌ 代码写完不 push，只留在 workspace/ 本地

> **唯一例外（面板内原型代码豁免）**：`foundation/design/prototype/` 是面板内维护的 React 统一原型工程，属于**设计参考物**，其源码随面板提交；这不违反「面板不产生代码」原则。产品前端代码仍只在 gitignore 的 `engineering/workspace/` 中 clone，不入面板。

**示例：前端功能开发完整流程**
> 用户说：「帮我开发 v1.0.0 注册页面的前端」
>
> AI 正确行为：
> ⓪ 读 CURRENT.md：阶段为「开发中」→ 可以开始
> ① 读取 versions/v1.0.0/product/design-spec.md「原型增量」节
>    → 原型基准、本版本改动区域；/web/register 还原优先级为「高保真」
> ② 进入 foundation/design/prototype/，读 README.md 确认目标终端路径及启动命令，npm run dev 启动对应终端原型（端口 5173）
>    → 注册页按原型还原：布局、组件、文案、各状态（加载/错误/倒计时）与原型一致
> ③ 读取 standards/design/DESIGN.md 确认视觉规范（色彩/字体/间距）
> ④ 读 engineering/README.md 工程清单，找到前端工程的工程名（假设为 `web-frontend`），Clone 到：
>    git clone <前端仓库地址> engineering/workspace/web-frontend
> ⑤ 读取 versions/v1.0.0/engineering/tech-solution.md「前端设计」节
> ⑥ 读取 versions/v1.0.0/engineering/api-design.md 确认接口规范
> ⑦ 开发完成后：与统一原型（端口 5173）逐页对照，偏差逐项修正；按 test-cases.md 中注册相关 P0 用例自测
> ⑧ 自测通过后按分支策略 push，产品前端代码只在 engineering/workspace/ 产生，驱动面板的文档不产生变更
