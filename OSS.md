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
| 设计稿导出 | `versions/{ver}/design/` | `design-spec.md` 或 `prototypes/README.md` |
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
