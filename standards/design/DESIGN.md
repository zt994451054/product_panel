# {产品名称} Design System

> 遵循 awesome-design-md 格式。本文件是产品设计的唯一视觉约束基线。
> 参考：https://github.com/VoltAgent/awesome-design-md

---

## Overview

<!-- 产品设计理念：一段话描述产品的视觉风格和设计哲学 -->

---

## Color System

### Primary Colors
```
Primary:       #______   <!-- 主色，用于主要操作按钮、链接、强调 -->
Primary Hover: #______
Primary Light: #______   <!-- 浅色背景变体 -->
```

### Neutral Colors
```
Gray 50:   #______   <!-- 页面背景 -->
Gray 100:  #______   <!-- 卡片背景 -->
Gray 200:  #______   <!-- 边框 -->
Gray 400:  #______   <!-- 禁用文字、占位符 -->
Gray 700:  #______   <!-- 次要文字 -->
Gray 900:  #______   <!-- 主要文字 -->
```

### Semantic Colors
```
Success:  #______   <!-- 成功状态 -->
Warning:  #______   <!-- 警告状态 -->
Error:    #______   <!-- 错误状态 -->
Info:     #______   <!-- 信息提示 -->
```

---

## Typography

### Font Family
```
Sans:  '{字体名}', system-ui, -apple-system, sans-serif
Mono:  '{等宽字体}', 'Courier New', monospace
```

### Type Scale
```
xs:   12px / line-height: 1.5
sm:   14px / line-height: 1.5
base: 16px / line-height: 1.6
lg:   18px / line-height: 1.5
xl:   20px / line-height: 1.4
2xl:  24px / line-height: 1.3
3xl:  30px / line-height: 1.2
4xl:  36px / line-height: 1.1
```

### Font Weights
```
Regular:   400
Medium:    500
Semibold:  600
Bold:      700
```

---

## Spacing System

> 基于 4px 网格

```
1:   4px
2:   8px
3:   12px
4:   16px
5:   20px
6:   24px
8:   32px
10:  40px
12:  48px
16:  64px
20:  80px
```

---

## Border Radius

```
sm:   4px    <!-- 输入框、小标签 -->
md:   6px    <!-- 按钮、卡片 -->
lg:   8px    <!-- 模态框、面板 -->
xl:   12px   <!-- 大卡片 -->
full: 9999px <!-- 胶囊形状、头像 -->
```

---

## Shadows

```
sm:  0 1px 2px rgba(0,0,0,0.05)
md:  0 4px 6px -1px rgba(0,0,0,0.1)
lg:  0 10px 15px -3px rgba(0,0,0,0.1)
xl:  0 20px 25px -5px rgba(0,0,0,0.1)
```

---

## Components

### Button
```
Height:        36px (default) / 32px (sm) / 40px (lg)
Padding:       0 16px
Border Radius: md (6px)
Font:          14px / semibold

Variants:
  Primary:   bg=Primary, text=white
  Secondary: bg=Gray100, text=Gray900, border=Gray200
  Ghost:     bg=transparent, text=Gray700
  Danger:    bg=Error, text=white
```

### Input
```
Height:        36px
Padding:       0 12px
Border:        1px solid Gray200
Border Radius: sm (4px)
Font:          14px / regular
Focus:         border=Primary, ring=Primary/20
```

### Card
```
Background:    white
Border:        1px solid Gray200
Border Radius: lg (8px)
Padding:       24px
Shadow:        sm
```

### Badge / Tag
```
Height:        20px
Padding:       0 8px
Border Radius: full
Font:          12px / medium
```

### Navigation
```
<!-- 描述导航栏的高度、背景、字体、间距等 -->
```

---

## Motion & Animation

```
Duration Fast:   150ms   <!-- hover、focus 状态切换 -->
Duration Normal: 200ms   <!-- 组件展开、收起 -->
Duration Slow:   300ms   <!-- 页面过渡、模态框 -->
Easing:          cubic-bezier(0.4, 0, 0.2, 1)   <!-- ease-in-out -->
```

---

## Layout & Grid

```
Container Max Width: 1280px
Container Padding:   0 24px (mobile: 0 16px)
Breakpoints:
  sm:  640px
  md:  768px
  lg:  1024px
  xl:  1280px
```

---

## Icons

```
Library:  <!-- 使用的图标库，如 Lucide Icons / Heroicons -->
Size:     16px (sm) / 20px (default) / 24px (lg)
Style:    <!-- outline / solid / mixed -->
```
