# 验收标准规范

> **主标准**：[BDD（Behavior-Driven Development）/ Cucumber](https://cucumber.io/docs/bdd/)
> **副标准**：[IEEE 29148 - Software Acceptance Testing](https://standards.ieee.org/ieee/29148/6938/)
> **补充**：参见 [需求文档模板](../../versions/v1.0.0/product/requirements.md) 了解验收标准在需求文档中的位置

> **术语说明**：本页的「验收标准（Acceptance Criteria）」指需求级的完成判断依据，写在 `requirements.md` 每个模块的「验收标准」中；面板中的 `AC-xxx` 是发布后生产验收（SOP-12）的验收用例编号，二者不是同一个概念。

---

## 验收标准的作用

验收标准（Acceptance Criteria）定义了一个需求"做完了"的判断依据：

- **产品视角**：验证功能是否符合预期
- **研发视角**：明确实现目标，减少歧义
- **测试视角**：直接转化为测试用例
- **AI Agent 视角**：自主判断任务是否完成，不依赖人工确认

---

## Given-When-Then 格式（BDD 标准）

【推荐】验收标准条目使用 Given-When-Then 句式，确保可执行。面板的 `requirements.md` 按正向 / 异常 / 边界 / 权限四类场景，以 `- [ ]` 清单列出验收标准并回填 `<!-- TC-xxx -->`，结构以该模板为准，GWT 用于写清每一条的内容：

```
Given（前提条件）：描述初始状态和上下文
When（触发操作）：描述用户的具体操作
Then（预期结果）：描述系统应该呈现的状态
```

**示例：**

```gherkin
Feature: 用户头像上传

Scenario: 正常上传 JPG 图片
  Given 用户已登录
  And 用户处于个人资料页面
  When 用户点击"更换头像"，选择一张 2MB 的 JPG 图片
  Then 系统显示裁剪框
  And 用户确认裁剪后，头像更新成功
  And 页面上显示新头像
  And Toast 提示"头像更新成功"

Scenario: 上传超过大小限制的图片
  Given 用户已登录
  When 用户选择一张 15MB 的图片
  Then 系统显示错误提示"图片大小不能超过 10MB"
  And 头像不发生变化

Scenario: 上传不支持的文件格式
  Given 用户已登录
  When 用户选择一个 PDF 文件
  Then 系统显示错误提示"仅支持 JPG、PNG、WebP 格式"
```

---

## 验收标准的覆盖范围

每个用户故事的验收标准必须覆盖：

| 类型 | 示例 |
|------|------|
| **正常路径（Happy Path）** | 用户完成核心操作的预期结果 |
| **错误路径（Error Path）** | 输入错误、操作失败时的处理 |
| **边界条件（Edge Case）** | 最大值、最小值、空值、特殊字符 |
| **权限控制** | 无权限时的处理 |
| **性能要求** | 响应时间、并发量（如适用）|

---

## 验收标准质量标准

好的验收标准应满足：

| 原则 | 说明 | 反例 |
|------|------|------|
| **可测试** | 可以用测试验证，结果明确 | "系统运行流畅"（无法测试）|
| **具体** | 有明确的输入、操作、输出 | "用户可以上传图片"（太模糊）|
| **独立** | 每条验收标准独立，不相互依赖 | 多个 Given/When 混在一条里 |
| **无技术细节** | 描述用户可见的行为，不涉及实现 | "调用 AWS S3 API 上传"（实现细节）|
| **肯定句** | 描述期望发生的事，而非不发生的事 | "系统不应该报错"（用正向表达替代）|

---

## 验收标准与测试用例的关系

验收标准直接映射为测试用例，AI Agent 可以从中提取自动化测试：

```
验收标准（Given-When-Then）
         ↓
测试用例（Test Case，记录在 versions/{ver}/testing/test-cases.md，编号 TC-xxx，四要素必填）
         ↓
自动化测试脚本（pytest / JUnit / Jest）
```

测试用例编写后，按 SOP-03 回填 `requirements.md` 各验收标准后的 `<!-- TC-xxx -->` 注释和模块的「测试覆盖」字段，保持需求与用例双向可追溯。

**示例映射：**

```python
# 从验收标准自动生成的测试用例
@pytest.mark.parametrize("file_size_mb,expected_result", [
    (2, "success"),          # 正常路径：2MB 图片上传成功
    (15, "size_exceeded"),   # 错误路径：15MB 超出限制
])
def test_avatar_upload(file_size_mb, expected_result):
    file = create_test_image(size_mb=file_size_mb)
    result = upload_avatar(user_id="10086", file=file)
    assert result.status == expected_result
```

---

## Definition of Done（DoD）

DoD 是团队级别的完成定义，适用于所有故事，不需要在每个故事里重复。

【必须】DoD 不得低于面板的测试底线（见 SOP-03）：用例覆盖本版本全部特性点和改动点，用例四要素（前置条件、操作步骤、测试数据、预期结果）齐全，所有用例执行通过、所有缺陷关闭才算完成；未通过的用例或未关闭的缺陷只有使用者能逐条豁免。

**示例 DoD（团队自定义，以下为参考）：**

```
□ 代码已合并到主分支
□ 单元测试通过，覆盖率达到项目自定的阈值（阈值见测试策略规范）
□ 通过 Code Review（至少 1 人批准）
□ 在测试环境验证通过
□ 对应测试用例已全部执行通过，缺陷已全部关闭（或已由使用者逐条豁免）
□ 产品经理已验收（基于验收标准逐条确认）
□ 如有 UI 变更，设计师已 QA 确认
□ 相关文档已更新（API 文档、用户手册等）
```

覆盖率阈值只在 [测试策略](../testing/testing-strategy.md) 中定义，且不替代上述测试底线。

---

## 验收执行规范

### 验收流程

```
1. 研发完成，提交测试环境
2. 研发自测：按验收标准逐条验证
3. 产品验收：独立验证验收标准
4. 发现问题 → 记录到 versions/{ver}/testing/defects.md，关联到对应的验收标准和用例
5. 修复后重新验收
6. 所有验收标准通过、缺陷关闭 → 功能验收完成
7. 发布后的生产验收和版本交付确认按 SOP-12 执行
```

### 验收环境要求

【必须】功能验收在**独立于开发环境的测试环境**进行，不在开发环境验收

【必须】使用接近真实的测试数据，而非硬编码数据

【必须】生产验收（UAT）按 SOP-12 执行，只使用指定的验收账号和数据，不污染真实用户数据

## 交互类验收补充

当需求涉及桌面端 Web 交互时，验收标准除 Given-When-Then 外，还应参考 [桌面端 Web 交互规范](interaction/desktop-web.md)。

交互类验收应按实际需要覆盖：

- 操作后是否有明确反馈
- 加载、空、无结果、错误、权限等状态是否完整
- 错误后是否保留用户输入和上下文
- 主 CTA、次要动作、危险动作是否清楚区分
- 搜索、筛选、排序、分页、选择状态是否可理解
- 浏览器返回、前进、刷新和深链接是否符合预期
- 主流程是否可仅用键盘完成
- hover 信息是否也可通过 focus 获得
- 信息元素是否避免伪装成可点击元素

## Related

- [需求文档模板](../../versions/v1.0.0/product/requirements.md)（验收标准在需求文档中的写法）
- [产品评审规范](product-review.md)
- [单元测试规范](../testing/unit-testing.md)（验收标准转化为测试）
- [测试策略](../testing/testing-strategy.md)（覆盖率阈值）
- [桌面端 Web 交互规范](interaction/desktop-web.md)
