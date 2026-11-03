# CSS / Sass 编码规范

> **主标准**：[BEM](https://getbem.com/) + [Airbnb CSS Style Guide](https://github.com/airbnb/css)

跨语言原则见 [通用编码规范](../general.md)。视觉取值（色彩、字体、间距）以 [DESIGN.md](../../design/DESIGN.md) 为准，全局样式的作用域约束见 [前端性能规范](../frontend/performance.md)。

---

## 格式与编码实践

格式化工具：`prettier` + `stylelint`。

```scss
// prettier + stylelint（BEM + Airbnb CSS 规则）
// 缩进：2 空格

// ✅ 变量集中定义
$color-primary: #1677ff;
$spacing-md: 16px;
$spacing-sm: 8px;

// ✅ Sass 嵌套不超过 3 层
// ❌ 超过 3 层的嵌套（选择器过长，性能和可读性差）
.a { .b { .c { .d { } } } }  // ❌ 4 层

// ❌ 禁止 !important（特殊情况加注释说明原因）
color: red !important;  // ❌
```

---

## 命名

```scss
// ✅ BEM 命名：block__element--modifier
.order-card {
  padding: $spacing-md;

  &__header {             // Element
    font-size: 1.125rem;
    font-weight: 600;
  }

  &__body {
    padding: $spacing-sm;
  }

  &--featured {           // Modifier
    border: 2px solid $color-primary;
    box-shadow: $shadow-md;
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```
