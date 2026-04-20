# 性能测试工程

## 职责

对系统进行压测和负载测试，验证系统容量和响应时间是否满足非功能需求。
执行时机：版本发布前，由测试负责人手动触发。

## 仓库信息

- **Git 地址**：<!-- https://github.com/org/product-perf-tests -->
- **主分支**：main
- **分支策略**：见 `standards/engineering/standards.md`

## Clone 到本地

```bash
# clone 性能测试工程到 workspace 目录（已被 .gitignore 忽略）
git clone <仓库地址> testing/performance/workspace
```

## 本地运行

```bash
cd testing/performance/workspace
# 安装依赖
# <!-- 如：brew install k6 / pip install locust -->

# 配置目标环境
# export BASE_URL=https://staging.example.com

# 运行压测场景
# <!-- 如：k6 run scripts/register-flow.js -->
# <!-- 如：locust -f locustfile.py --headless -u 100 -r 10 -->
```

## 压测场景说明

| 场景 | 说明 | 并发用户数 | 持续时间 |
|------|------|----------|---------|
| <!-- 如：注册流程压测 --> | <!-- 模拟用户注册 --> | <!-- 如：500 --> | <!-- 如：5 分钟 --> |
| <!-- 如：核心接口压测 --> | <!-- 核心 API 吞吐量验证 --> | <!-- --> | <!-- --> |

## 性能基线参考

见 `foundation/tech-arch/overview.md` 性能基线节

## 测试结果

测试执行结果记录在对应版本：`versions/{ver}/testing/test-report.md`
