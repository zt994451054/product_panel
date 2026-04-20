# 集成测试工程

## 职责

测试 API/服务之间的协作是否符合预期，验证接口合约。
覆盖目标：本产品所有新增 API 接口 100% 覆盖。

## 仓库信息

- **Git 地址**：<!-- https://github.com/org/product-integration-tests -->
- **主分支**：main
- **分支策略**：见 `standards/engineering/standards.md`

## Clone 到本地

```bash
# clone 集成测试工程到 workspace 目录（已被 .gitignore 忽略）
git clone <仓库地址> testing/integration/workspace
```

## 本地运行

```bash
cd testing/integration/workspace
# 安装依赖
# <!-- 如：pnpm install / pip install -r requirements.txt -->

# 配置环境
# cp .env.example .env
# 编辑 .env，配置 API_BASE_URL 等

# 运行测试
# <!-- 如：pnpm test / pytest -->
```

## CI 集成

<!-- 说明如何接入 CI 流水线，例如：
- 每次代码合并到 develop 分支后自动触发
- 触发条件：API 服务部署到 staging 后
- CI 配置见工程仓库 .github/workflows/ 目录
-->

## 测试结果

测试执行结果记录在对应版本：`versions/{ver}/testing/test-cases.md`
