# SOP-10 对象存储文件上传与 URL 落档

**触发**：需要在文档中引用截图、录屏、设计稿导出、日志附件、报告 PDF 等二进制文件

**核心原则：git 只存 URL，文件存 OSS。上传完成后只需在文档中记录 CDN URL，本地文件无需保留在驱动面板中。**

**步骤：**
0. **前置：确认对象存储已配置**：`SETUP.md` 第 12 项状态须为已确认；标了不适用但现在要上传文件时，先和使用者确认并按该卡片配置。然后验证 rclone remote：
   ```bash
   rclone listremotes
   ```
   - 输出中包含 `OSS.md` 中的 remote 名 → 继续执行步骤 1
   - 输出为空 / 不含对应 remote 名 → **停止上传，执行「未配置引导流程」（见 OSS.md §新主机配置引导）**
1. 读取 `OSS.md` 获取：remote 名、bucket 名、CDN 域名、product-slug
2. 按命名规范重命名文件：`{YYYYMMDD}-{描述}.{ext}`
3. 查 OSS.md「文件落档对照表」确定 OSS 存放路径
4. 上传：`rclone copy <本地文件> {remote}:{bucket}/{product-slug}/{路径}/`，再用 `rclone ls` 确认对象存在
5. 构造 CDN URL，嵌入对应文档，本地文件可删除

> rclone 未安装时，告诉使用者按 https://rclone.org/install/ 安装；remote 的配置方法见 OSS.md「新主机配置引导」。不要从第三方网址下载或执行脚本来代替。

**示例：测试发现 Bug，上传截图并记录**
> AI 正确行为：
> ① `rclone listremotes` 确认 remote 已配置
> ② 文件重命名：`20260419-BUG001-email-notification-bug.png`
> ③ 读取 OSS.md → remote=`niuma-hr`，bucket=`niuma-assets`，CDN=`https://assets.niuma-hr.com`
> ④ `rclone copy` 上传到 `versions/v1.0.0/testing/` 路径下，`rclone ls` 确认
> ⑤ 在 defects.md 的 BUG-001 详情中嵌入 URL：
>    `![截图](https://assets.niuma-hr.com/niuma-hr/versions/v1.0.0/testing/20260419-BUG001-email-notification-bug.png)`
> ⑥ 本地截图文件无需保留在驱动面板目录中

**示例：初始化时配置对象存储**
> 用户说：「云厂商阿里云，AK=xxx，SK=yyy，Region=cn-hangzhou，CDN=https://assets.example.com，Bucket=my-assets」
>
> AI 正确行为：
> ① 确认 rclone 已安装（未安装则请使用者按官网安装）
> ② 按 OSS.md「新主机配置引导」配置 remote 并验证连通性
> ③ 在 OSS.md 配置信息表中填写：云厂商/Bucket/Region/CDN域名/remote名
