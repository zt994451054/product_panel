# SOP-00 收到任何指令前的必做准备（不可跳过）

**触发**：收到任何与本项目相关的指令

1. 执行 AGENTS.md §0 初始化检查和 §3 状态速查（读 CURRENT.md → 版本 README → CHANGES.md）
2. 判断本次指令属于哪类工作，找到对应 SOP
3. 按 AGENTS.md §4 读 `standards/README.md`，找到与本次工作相关的规范文件
4. 执行对应 SOP

**示例**：
> 用户说：「帮我写 v1.0.0 的技术方案」
>
> AI 正确行为：
> Step 1 → 读 CURRENT.md：当前版本 v1.0.0，阶段：技术方案设计中
> Step 2 → 本次工作属于技术方案类 → 对应 SOP-02
> Step 3 → 读 standards/README.md，再读 architecture/ 中相关文件、security/security-baseline.md 和用到的 middleware/ 文件
> Step 4 → 执行 SOP-02
