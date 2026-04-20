# 整体测试策略

## 测试分层

```
E2E 测试（用户旅程）
    ↑
集成测试（API/服务协作）
    ↑
单元测试（函数/模块，在工程仓库中维护）
```

## 工具选型

| 测试类型 | 工具 | 说明 |
|---------|------|------|
| 单元测试 | <!-- 如：Jest / Vitest / JUnit --> | 在各工程仓库维护，不在本目录管理 |
| 集成测试 | <!-- 如：Postman / REST-assured --> | testing/integration/workspace/ |
| E2E 测试 | <!-- 如：Playwright / Cypress --> | testing/e2e/workspace/ |
| 性能测试 | <!-- 如：k6 / JMeter / Locust --> | testing/performance/workspace/ |

## 覆盖率目标

见 `standards/testing/standards.md` 测试分层节

## 质量门禁

见各版本 `versions/{ver}/testing/test-plan.md` 退出条件

## 测试数据原则

- 测试数据与生产数据严格隔离
- 禁止在测试环境使用真实用户数据
- 敏感测试数据（密钥/账号）通过测试环境配置注入，不硬编码

## 工程执行规范

- 集成测试和 E2E 测试须在 staging 环境执行
- 性能测试须在独立压测环境或 staging 低峰期执行，避免影响日常测试
- 测试执行结果记录在对应版本的 `versions/{ver}/testing/` 目录下
