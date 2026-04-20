# E2E 自动化测试工程

## 职责

模拟真实用户操作，测试完整的端到端用户流程。
覆盖目标：产品核心主流程 100% 覆盖。

## 仓库信息

- **Git 地址**：<!-- https://github.com/org/product-e2e-tests -->
- **主分支**：main
- **分支策略**：见 `standards/engineering/standards.md`

## Clone 到本地

```bash
# clone E2E 测试工程到 workspace 目录（已被 .gitignore 忽略）
git clone <仓库地址> testing/e2e/workspace
```

## 本地运行

```bash
cd testing/e2e/workspace
# 安装依赖
# <!-- 如：pnpm install -->

# 配置环境
# cp .env.example .env
# 编辑 .env，配置 BASE_URL（指向 staging 或本地）

# 运行全部测试
# <!-- 如：pnpm test -->

# 运行特定测试（调试时）
# <!-- 如：pnpm test --grep "注册流程" -->

# 可视化调试模式
# <!-- 如：pnpm test:headed -->
```

## CI 集成

<!-- 说明如何接入 CI 流水线，例如：
- 触发条件：前端/后端服务部署到 staging 后自动触发
- 失败时自动截图存档
- CI 配置见工程仓库 .github/workflows/ 目录
-->

## 测试结果

测试执行结果记录在对应版本：`versions/{ver}/testing/test-cases.md`
