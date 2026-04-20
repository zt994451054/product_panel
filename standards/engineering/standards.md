# 研发规范

> 本规范优先于公司级规范，未覆盖条目以公司级规范为准。

## 分支策略

```
main        ← 生产环境，保护分支，禁止直接 push
develop     ← 集成分支，所有功能合入此分支
feat/*      ← 功能分支，命名：feat/{version}-{brief}
hotfix/*    ← 热修复分支，命名：hotfix/{version}-{brief}
release/*   ← 发布分支，命名：release/{version}
```

## 提交规范

```
feat:     新功能
fix:      Bug 修复
docs:     文档变更
style:    代码格式（不影响逻辑）
refactor: 重构
test:     测试相关
chore:    构建/工具变更
```

示例：`feat(v1.0.0): 新增用户手机号验证`

## 代码审查

<!-- 描述 Code Review 要求，如：PR 必须经过至少 1 人 review 才能合并 -->

## 其他约定

<!-- 补充产品特有的研发约定 -->
