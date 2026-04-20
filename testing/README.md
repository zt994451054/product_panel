# 测试工程总览

## 测试工程分类

| 工程 | 说明 | 触发时机 | 目录 |
|------|------|---------|------|
| 集成测试 | 测试 API/服务间协作 | 每次 CI 触发 | [integration/](./integration/README.md) |
| E2E 自动化 | 测试完整用户流程 | Staging 部署后触发 | [e2e/](./e2e/README.md) |
| 性能测试 | 压测/负载测试 | 版本发布前执行 | [performance/](./performance/README.md) |

## 测试文档索引

| 文档 | 说明 |
|------|------|
| [docs/test-strategy.md](./docs/test-strategy.md) | 整体测试策略 |
| [docs/environments.md](./docs/environments.md) | 测试环境说明 |

> 测试规范见 `standards/testing/standards.md`
> 版本测试方案和用例见 `versions/{version}/testing/`
