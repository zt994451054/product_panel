# OSS.md — 对象存储配置与使用规范

> 本文件记录本项目的 OSS 配置信息和文件管理约定。
> rclone 的安装、配置、命令操作由 rclone skill 处理。
> 凭证（AK/SK）不在此文件中，存储在本机 rclone 配置里。

---

## 配置信息

> 初始化时由 AI 根据你提供的信息填写。

| 配置项 | 值 |
|--------|-----|
| 云厂商 | <!-- 如：阿里云 OSS / 腾讯云 COS / AWS S3 / Cloudflare R2 / MinIO --> |
| Bucket 名称 | <!-- --> |
| Region | <!-- 如：cn-hangzhou --> |
| CDN 访问域名 | <!-- 如：https://assets.example.com --> |
| rclone Remote 名称 | <!-- 如：niuma-hr --> |
| **product-slug** | <!-- 产品唯一标识符，用于 OSS 路径前缀，如：niuma-hr。kebab-case，与产品名一致，初始化时确定后不再变更 --> |

---

## OSS 目录结构

```
{bucket}/
└── {product-slug}/
    ├── foundation/
    │   ├── market/        # 市调图表、竞品截图、用研视频
    │   └── docs/          # 商业计划书等 PDF 物料
    ├── versions/
    │   └── {version}/     # 如 v1.0.0
    │       ├── design/    # 设计稿导出（PNG/PDF/SVG）
    │       ├── testing/   # 测试截图、录屏、日志附件
    │       └── release/   # 发布产物
    └── shared/            # 跨版本共用资源（logo、品牌物料等）
```

---

## 文件命名规范

格式：`{YYYYMMDD}-{描述}.{ext}`

```
20260419-login-bug-screenshot.png
20260419-TC001-actual-result.mp4
20260419-user-interview-user03.mp4
20260419-v1.0.0-release-notes.pdf
```

---

## 文件落档对照表

AI 上传文件后，按此表确定 OSS 路径和嵌入位置：

| 文件类型 | OSS 路径 | 嵌入到哪个文档 |
|---------|---------|-------------|
| 测试截图 / 录屏 | `versions/{ver}/testing/` | `defects.md` 或 `test-cases.md` |
| 设计稿导出 | `versions/{ver}/design/` | `design-spec.md` 或 `foundation/design/prototype/` |
| 市调图表 / 报告 | `foundation/market/` | `market-research.md` |
| 用研视频 / 录音 | `foundation/market/` | `user-research.md` |
| 发布产物 | `versions/{ver}/release/` | `release.md` |
| 跨版本品牌物料 | `shared/` | 按需引用 |

---

## AI 操作原则

上传后的 URL 格式：
```
https://{CDN域名}/{product-slug}/{路径}/{文件名}
```

**核心原则：上传完成后只在文档中记录 CDN URL，本地文件无需保留在驱动面板中。**

**上传前必做：** 执行 `rclone listremotes` 验证 remote 已配置；若未配置，停止上传，执行下方「新主机配置引导」。

---

## 新主机配置引导

> 本节供 AI 在检测到 rclone 未配置时使用。AK/SK 跟随主机，不存入面板。

当 `rclone listremotes` 未返回本项目 remote 名时，AI 告知用户：

```
⚠️ 当前主机尚未配置 OSS 访问凭证，无法上传文件。

本项目使用 rclone 管理对象存储，凭证存储在本机（不入 git）。
请按以下步骤完成一次性配置：

① 确认 rclone 已安装
   rclone version
   （未安装：https://rclone.org/install/）

② 获取 AK/SK
   向管理员索取本项目专用的 OSS 访问凭证（AK/SK）。
   - 云厂商和 Bucket 信息见本文件「配置信息」表

③ 配置 rclone remote（以阿里云 OSS 为例）
   rclone config create {remote名} s3 \
     provider Alibaba \
     access_key_id <AK> \
     secret_access_key <SK> \
     endpoint oss-{region}.aliyuncs.com \
     acl private

④ 验证连通性
   rclone ls {remote名}:{bucket名}/{product-slug}/

   输出文件列表即表示配置成功。

配置完成后，重新执行上传操作。
```

> AI 引导完成后，在 OSS.md 配置信息表确认 remote 名/bucket/CDN 域名已填写，不填写 AK/SK。
