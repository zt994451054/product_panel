# 桌面端 Web 交互模板

> 本页面是 [桌面端 Web 交互规范](desktop-web.md) 的模板库。  
> 模板用于让交互说明、状态定义和验收检查更稳定，不代表新增研发流程。
> 模板可作为 [设计说明模板](../../../versions/v1.0.0/product/design-spec.md)（`design-spec.md`）的可选附录使用。

## 交互说明模板

```md
## Interaction Draft: [功能或页面名称]

### 1. Context
- Product:
- Page or workflow:
- Primary user:
- Primary task:
- Current state:
- Known evidence inspected:
- Assumptions:

### 2. User Intent
- Surface behavior:
- Deeper intent:
- User question:
- Product response goal:

### 3. Proposed Interaction Model
- Chosen pattern:
- Why this pattern fits:
- Rejected alternatives:
- Default behavior:
- Edge cases:

### 4. Step-by-Step Flow
| Step | User action | System response | Feedback | Next available action |
|---|---|---|---|---|
| 1 |  |  |  |  |

### 5. State and Feedback Map
| State | UI behavior | Copy / message | Recovery | Focus / accessibility |
|---|---|---|---|---|
| Default |  |  |  |  |
| Loading |  |  |  |  |
| Empty |  |  |  |  |
| No results |  |  |  |  |
| Error |  |  |  |  |

### 6. CTA Hierarchy
- Primary CTA:
- Secondary actions:
- Destructive actions:
- Hidden or overflow actions:
- Why this does not make users choose among equal CTAs:

### 7. Navigation and Persistence
- URL behavior:
- Browser Back / Forward:
- Deep link:
- Scroll behavior:
- State persistence:

### 8. Accessibility and Keyboard
- Keyboard path:
- Focus order:
- Focus after action:
- Screen-reader announcements:
- Hover / focus parity:

### 9. Analytics
| Event | Trigger | Properties | Success / failure signal |
|---|---|---|---|
|  |  |  |  |

### 10. Acceptance Checks
- [ ]
- [ ]
- [ ]

### 11. Open Questions
-
```

## 组件选择记录模板

```md
## Component Choice Decision Record

- Decision ID:
- Date:
- Product:
- Feature / workflow:
- Decision owner:

### Problem
What interaction problem are we solving?

### Chosen Pattern
- Pattern:
- Variant:
- Why this choice fits the task:
- Why this choice fits the current state:

### Alternatives Considered
| Alternative | Why not chosen |
|---|---|
|  |  |

### Use Rules
- Use when:
- Do not use when:
- Default desktop behavior:
- Mobile / responsive note if relevant:
- Escape hatch / exception:

### Accessibility and Semantics
- Expected HTML / ARIA semantics:
- Keyboard behavior:
- Focus behavior:
- Screen-reader expectations:
- Hover / focus parity:

### App-State Implications
- URL / deep link:
- Browser Back / Forward:
- Persistence of open / selected state:
- Loading / error behavior:

### Analytics
- Events:
- Properties:
- Expected KPI movement:
```

## 状态与反馈地图模板

```md
## State and Feedback Map

| Region / component | User trigger | Normal state | Loading state | Success feedback | Empty / no data | No results | Validation error | Permission / auth error | System error | Undo / retry | Focus behavior | Screen-reader announcement |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |  |  |  |  |
```

## CTA 层级检查模板

```md
## CTA Hierarchy Review

### Page / View
- Name:
- Primary user task:
- Primary CTA:
- Why it is primary:

### Secondary Actions
| Action | Why secondary | Placement |
|---|---|---|
|  |  |  |

### Destructive Actions
- Action:
- Destructive styling:
- Confirm, undo, or both:
- Why that model is appropriate:

### Overflow and Tertiary Actions
- What moves to overflow:
- Why frequency / importance justifies that:
- How users discover it:

### Risks
- More than one primary CTA? Why?
- Any ambiguous card or row click?
- Any hidden-only action?
- Any disabled state needing explanation?
- Any action that looks like navigation but behaves like a command?

### Acceptance
- [ ] The primary CTA is obvious or intentionally absent
- [ ] Secondary actions do not compete visually with the primary CTA
- [ ] Destructive actions are clearly separated
- [ ] Hidden actions are not required for primary task completion
```

## 空、加载、错误状态检查模板

```md
## Empty / Loading / Error State Checklist

### Empty State
- [ ] Explains what would normally appear here
- [ ] Distinguishes first use, no data, no results, permissions, and system issues
- [ ] Provides a useful next action when one exists
- [ ] Replaces the absent component rather than leaving dead chrome behind
- [ ] Does not blame the user

### Loading State
- [ ] Chosen pattern is appropriate
- [ ] Layout remains stable
- [ ] Existing content remains visible when practical
- [ ] Long-running work shows progress or clear activity
- [ ] Loading does not steal focus unexpectedly

### Error State
- [ ] Uses plain language
- [ ] States what happened
- [ ] States what the user can do next
- [ ] Preserves user effort and context
- [ ] Exposes retry, undo, cancel, or support path where relevant
- [ ] Differentiates user-fixable and system-level errors
- [ ] Error is reachable and announced when relevant
```

## 可访问性与键盘检查模板

```md
## Accessibility and Keyboard Checklist

### Structure
- [ ] Landmarks are present and labeled where needed
- [ ] Heading structure is logical
- [ ] Current location is perceivable
- [ ] Selected state does not rely on color alone

### Keyboard
- [ ] Primary flow is keyboard-completable
- [ ] Focus order is meaningful
- [ ] Focus indicator is visible and not obscured
- [ ] Custom controls support expected keyboard interaction
- [ ] Keyboard shortcuts do not override common browser, OS, or assistive-technology shortcuts

### Dynamic UI
- [ ] Dialogs define initial focus and focus return
- [ ] Modals trap focus only when truly modal
- [ ] Drawers and side panels have defined focus behavior
- [ ] In-place updates preserve or move focus intentionally
- [ ] Dynamic success, busy, and error states are announced when relevant

### Controls
- [ ] Buttons, links, tabs, disclosures, tables, menus, and forms use correct semantics
- [ ] Icon-only controls have accessible names
- [ ] Form labels are visible and associated
- [ ] Errors are linked to the right fields
- [ ] Targets meet size and spacing expectations or equivalent controls exist

### Hover and Pointer
- [ ] No critical action depends on hover alone
- [ ] Hover-triggered content also works on focus
- [ ] Tooltips do not contain interactive controls
- [ ] Drag-and-drop has a non-drag alternative when it affects a primary task
```

## UX QA 检查模板

```md
## UX QA Checklist

### Navigation and History
- [ ] Current location is visible
- [ ] Browser Back / Forward works for meaningful states
- [ ] Deep links restore correct state
- [ ] Refresh preserves meaningful state where expected
- [ ] Scroll and sticky headers do not obscure targets

### State and Feedback
- [ ] Default state matches spec
- [ ] Loading state matches spec
- [ ] Empty state matches spec
- [ ] No-results state matches spec
- [ ] Success feedback matches spec
- [ ] Error state matches spec
- [ ] Retry / undo / cancel paths work
- [ ] No silent failures

### Collections and Tables
- [ ] Row click behavior is explicit
- [ ] Row actions are discoverable
- [ ] Batch actions appear only after selection
- [ ] Sort state is visible
- [ ] Filters show applied state
- [ ] Clear-all works
- [ ] Pagination resets correctly after sort / filter changes

### CTA and Affordance
- [ ] Primary CTA is clear
- [ ] Similar elements behave similarly
- [ ] Informational elements do not look clickable
- [ ] Clickable elements produce expected results
- [ ] Disabled states are explained or removed when clearer

### Accessibility
- [ ] Keyboard-only primary flow passes
- [ ] Focus visibility passes
- [ ] Dialog / drawer focus behavior passes
- [ ] Screen-reader smoke test completed where relevant
- [ ] Hover-only dependency check passes
```

## 交互例外记录模板

```md
## Interaction Standard Exception Log

- Exception ID:
- Date:
- Product:
- Feature:
- Owner:

### Standard Being Overridden
- Standard:
- Default rule:

### Reason for Exception
- User need:
- Product constraint:
- Technical constraint:
- Accessibility impact:

### Risk Assessment
- UX risk:
- Accessibility risk:
- Engineering risk:
- Analytics risk:

### Mitigation
- Temporary safeguards:
- QA checks:
- Analytics to monitor:

### Review
- Expiration or review date:
- Decision: keep exception / migrate to standard / update standard
- Sign-off:
```

## Related

- [桌面端 Web 交互规范](desktop-web.md)
- [UI/UX 设计规范](../ui-ux-standards.md)
- [验收标准规范](../acceptance-criteria.md)
