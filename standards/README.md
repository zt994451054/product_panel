# 产品规范总览

## 规范层级关系

```
公司级规范（通过 product_spec skill 注入）← 基础约束
       ↓ 被覆盖
产品级规范（本目录）                      ← 优先使用
```

**原则**：有产品级规范的条目以产品级为准；本目录未覆盖的条目回退使用公司级规范。

每个规范文件顶部声明：
> 本规范优先于公司级规范，未覆盖条目以公司级规范为准。

## 规范目录

| 领域 | 文件 | 说明 |
|------|------|------|
| 产品 | `product/standards.md` | 业务逻辑约束、功能边界规范 |
| 设计 | `design/DESIGN.md` | 产品设计系统（色彩/字体/间距/组件，awesome-design-md 格式） |
| 研发 | `engineering/standards.md` | 分支策略、提交规范、代码规范 |
| 研发·前端 | `engineering/frontend.md` | 前端框架约定、组件规范 |
| 研发·后端 | `engineering/backend.md` | API 设计规范、数据库规范 |
| 测试 | `testing/standards.md` | 测试用例规范、覆盖率要求、测试分层 |
| 运维 | `operations/standards.md` | 部署流程、环境管理、监控告警 |

## 重要提示

> 进行任何 UI 设计、原型输出、前端还原工作前，必须先读取 `design/DESIGN.md`。
