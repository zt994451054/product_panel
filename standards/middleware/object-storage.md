# 对象存储使用规范（S3 兼容）

> **主标准**：[AWS S3 Documentation](https://docs.aws.amazon.com/s3/)（S3 协议是对象存储事实标准）
> **适用产品**：AWS S3 / 腾讯云 COS / 阿里云 OSS / MinIO / 任何 S3 兼容实现

> **说明**：本页是产品代码使用对象存储的通用写法，路径、有效期、CDN 等取值都是示例，项目可自定义。本项目实际配置（厂商、Bucket、Region、CDN 域名）和文件管理约定见 [OSS.md](../../OSS.md)，以它为准。

---

## 核心原则

1. **存储桶（Bucket）权限默认私有**：存储桶默认私有读写，需要访问时通过签名 URL 提供；如使用 CDN，由 CDN 鉴权控制
2. **代码不持有长期凭证**：应用代码通过 STS 临时凭证或 Presigned URL 访问，不硬编码 AK/SK
3. **后端生成路径**：对象 Key（路径）由后端生成，前端不自行构造
4. **前端不拼接访问地址**：文件访问 URL 由后端生成并返回，前端不自行拼接存储或 CDN 域名

---

## 主要厂商对应关系

| 概念 | AWS S3 | 腾讯 COS | 阿里 OSS | MinIO |
|------|--------|---------|---------|-------|
| 存储桶 | Bucket | Bucket | Bucket | Bucket |
| 对象路径 | Object Key | CosPath | ObjectKey | Object Key |
| 临时凭证 | STS AssumeRole | STS GetFederationToken | STS AssumeRole | 无内置（用 MinIO Policy）|
| 预签名 URL | Presigned URL | 预签名 URL | 预签名 URL | Presigned URL |
| 访问密钥 | AccessKeyId + SecretAccessKey | SecretId + SecretKey | AccessKeyId + AccessKeySecret | AccessKey + SecretKey |

---

## 客户端直传方案选型

### 方案 A：Presigned URL（推荐，简单场景）

后端生成有时效的预签名 URL，前端直接 PUT 上传：

```
前端 → 后端：申请上传权限（文件类型、场景）
后端 → 前端：返回 Presigned PUT URL（带签名，有效期示例：15 分钟）
前端 → 存储：直接 PUT 到 Presigned URL
前端 → 后端：提交对象 Key，后端校验并入库
```

**优点**：实现简单，后端无需集成 STS；有效期内只能上传到指定路径

**适用**：单文件上传，不需要前端 SDK

### 方案 B：STS 临时凭证（推荐，复杂场景）

后端申请临时访问凭证，前端用 S3 SDK 上传（支持分片、断点续传）：

```
前端 → 后端：申请上传权限
后端 → STS服务：申请受限临时凭证（仅允许上传指定路径）
后端 → 前端：返回临时 AK/SK/Token + 对象 Key
前端 → 存储：使用 S3 SDK + 临时凭证上传
前端 → 后端：提交对象 Key，后端校验并入库
```

**优点**：支持大文件分片上传、断点续传、前端进度条
**适用**：大文件上传，需要使用前端 S3 SDK

---

## 完整上传流程

推荐流程如下，可按场景调整；其中**权限校验（第 3 步）、已授权 Key 缓存（第 6 步）、提交时校验（第 10 步）不可省略**：

```
1. 前端获取文件信息（类型、大小）
         ↓
2. 前端向后端申请上传权限
   （传：场景ID、文件后缀）
         ↓
3. 后端权限校验
   - 校验用户身份
   - 校验场景是否允许该文件类型
   - 校验文件类型合法性
         ↓
4. 后端生成对象 Key（路径）
   格式由项目约定，示例见下节
         ↓
5. 后端生成上传凭证
   方案A：生成 Presigned PUT URL（有效期示例：15 分钟）
   方案B：调用 STS 获取临时 AK/SK/Token
         ↓
6. 后端缓存已授权的对象 Key（防止前端上传到其他路径）
         ↓
7. 后端将凭证 + Key 返回给前端
         ↓
8. 前端上传文件到对象存储
   - 上传路径必须与后端返回的 Key 一致
   - Content-Type 必须与后端约定的一致
         ↓
9. 前端将对象 Key 提交给后端
         ↓
10. 后端从缓存校验 Key 合法性 → 保存到数据库 → 删除缓存
```

---

## 对象 Key（路径）设计规范

【必须】对象 Key 由后端生成，禁止前端自行构造路径

【必须】文件名包含不可预测的唯一 ID（避免重复、避免遍历）

【必须】路径结构能按前缀限定权限（用户私有文件能限定到单个用户，便于最小授权）

下面是一种示例约定，路径结构由项目自定义。S3 Key 习惯上不以 `/` 开头：

**业务文件**（系统上传）：

```
{业务域}/{资源类型}/{业务ID}/{文件名}.{后缀}

示例：
content/cover/post-42/1714310400_abc123.jpg
catalog/image/sku-001/1714310400_def456.png
```

**用户私有文件**（用户上传的个人文件）：

```
users/{用户ID}/{资源类型}/{文件名}.{后缀}

示例：
users/u-001/photo/1714310400_ghi789.jpg
users/u-001/document/1714310400_jkl012.pdf
```

---

## STS 临时凭证规范

### 权限最小化原则

【必须】临时凭证只授予上传到**指定路径**的权限，不授予全局权限：

```json
// AWS STS Policy 示例（只允许上传到指定路径；分片上传的 UploadPart 等操作也由 s3:PutObject 授权）
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": "arn:aws:s3:::my-bucket/users/u-001/*"
    }
  ]
}
```

```python
# Python - AWS STS 申请临时凭证
import json

import boto3

sts = boto3.client('sts')
response = sts.assume_role(
    RoleArn='arn:aws:iam::111122223333:role/upload-role',
    RoleSessionName=f'upload-{user_id}',
    DurationSeconds=900,  # 示例值：15 分钟
    Policy=json.dumps(policy)  # 最小权限 Policy
)
credentials = response['Credentials']
```

### 凭证有效期

| 使用场景 | 有效期（示例值，项目可调整）|
|---------|----------|
| 单文件上传 | 15 分钟 |
| 大文件分片上传 | 1-2 小时 |
| 缓存后复用 | 有效期剩余 > 5 分钟才可复用 |

---

## Presigned URL 生成规范

```python
# Python - AWS S3 Presigned PUT URL
import boto3

s3 = boto3.client('s3', region_name='us-east-1')

presigned_url = s3.generate_presigned_url(
    'put_object',
    Params={
        'Bucket': 'my-bucket',
        'Key': object_key,
        'ContentType': content_type,  # 限制上传的 Content-Type，前端须带相同请求头
    },
    ExpiresIn=900,  # 示例值：15 分钟
    HttpMethod='PUT',
)

# 需要限制文件大小时改用 Presigned POST：Presigned PUT 无法限定大小范围
presigned_post = s3.generate_presigned_post(
    Bucket='my-bucket',
    Key=object_key,
    Fields={'Content-Type': content_type},
    Conditions=[
        {'Content-Type': content_type},
        ['content-length-range', 0, 10485760],  # 示例值：0-10MB
    ],
    ExpiresIn=900,
)
# 前端用 multipart/form-data 把 presigned_post['fields'] 和文件提交到 presigned_post['url']
```

```go
// Go - Presigned PUT URL（aws-sdk-go-v2）
cfg, err := config.LoadDefaultConfig(ctx)
if err != nil {
    return "", err
}
presigner := s3.NewPresignClient(s3.NewFromConfig(cfg))
req, err := presigner.PresignPutObject(ctx, &s3.PutObjectInput{
    Bucket: aws.String("my-bucket"),
    Key:    aws.String(objectKey),
}, s3.WithPresignExpires(15*time.Minute))
if err != nil {
    return "", err
}
urlStr := req.URL
```

```typescript
// Node.js - @aws-sdk/s3-request-presigner
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const client = new S3Client({ region: 'us-east-1' })
const url = await getSignedUrl(
  client,
  new PutObjectCommand({ Bucket: 'my-bucket', Key: objectKey }),
  { expiresIn: 900 }
)
```

---

## 分片上传与断点续传

### 何时使用分片上传

| 文件大小 | 推荐方案 |
|---------|---------|
| < 5MB | 直传（Presigned PUT URL 或 STS 单次 PutObject）|
| 5MB ~ 100MB | 分片上传（提升速度，支持并发）|
| > 100MB | **必须**分片上传（S3 单次 PUT 最大 5GB；分片上传的单对象上限以厂商现行文档为准）|

### S3 Multipart Upload 三步流程

```
1. CreateMultipartUpload  →  获取 UploadId
         ↓
2. UploadPart × N         →  每片上传，获取 ETag
         ↓
3. CompleteMultipartUpload →  合并所有分片，完成上传

异常时：
AbortMultipartUpload      →  取消并清理已上传的分片
```

### 分片参数规范

| 参数 | 规范值 | 说明 |
|------|--------|------|
| 分片大小 | 5MB ~ 100MB | S3 最小分片 5MB（最后一片可以更小）|
| **推荐分片大小** | **10MB** | 平衡网络利用率和内存占用 |
| 并发上传数 | 3 ~ 5 | 超过 5 个并发对移动端影响用户体验 |
| 最大分片数 | 10000 | S3 协议上限 |
| 未完成上传的清理 | 示例：7 天 | S3 不会自动清理，需配置 Lifecycle Rule（AbortIncompleteMultipartUpload），否则已上传分片持续占用存储 |

### 多语言实现示例

**Python（分片上传）：**

```python
import boto3
from boto3.s3.transfer import TransferConfig

s3 = boto3.client('s3')

# 方式1：手动控制分片
def multipart_upload(bucket, key, file_path):
    # 1. 初始化分片上传，获取 UploadId
    response = s3.create_multipart_upload(Bucket=bucket, Key=key)
    upload_id = response['UploadId']

    parts = []
    part_size = 10 * 1024 * 1024  # 10MB

    try:
        with open(file_path, 'rb') as f:
            part_number = 1
            while True:
                data = f.read(part_size)
                if not data:
                    break
                # 2. 上传每一片
                resp = s3.upload_part(
                    Bucket=bucket, Key=key,
                    UploadId=upload_id,
                    PartNumber=part_number,
                    Body=data
                )
                parts.append({'PartNumber': part_number, 'ETag': resp['ETag']})
                part_number += 1

        # 3. 合并所有分片
        s3.complete_multipart_upload(
            Bucket=bucket, Key=key,
            UploadId=upload_id,
            MultipartUpload={'Parts': parts}
        )
    except Exception as e:
        # 异常时中止，清理已上传的碎片
        s3.abort_multipart_upload(Bucket=bucket, Key=key, UploadId=upload_id)
        raise e

# 方式2：使用 boto3 transfer（自动分片+并发，推荐）
config = TransferConfig(
    multipart_threshold=5 * 1024 * 1024,   # 5MB 以上自动分片
    multipart_chunksize=10 * 1024 * 1024,  # 10MB 每片
    max_concurrency=5,                      # 最大并发数
    use_threads=True,
)
s3.upload_file(file_path, bucket, key, Config=config)
```

**Go（分片上传）：**

```go
import (
    "github.com/aws/aws-sdk-go-v2/feature/s3/manager"
    "github.com/aws/aws-sdk-go-v2/service/s3"
)

// 使用 s3manager 自动分片上传（推荐）
uploader := manager.NewUploader(s3Client, func(u *manager.Uploader) {
    u.PartSize = 10 * 1024 * 1024  // 10MB 每片
    u.Concurrency = 5               // 5 个并发
})

result, err := uploader.Upload(ctx, &s3.PutObjectInput{
    Bucket: aws.String(bucket),
    Key:    aws.String(key),
    Body:   file,
})
```

**JavaScript 前端（分片上传 + 进度条）：**

```typescript
import { S3Client, CreateMultipartUploadCommand,
         UploadPartCommand, CompleteMultipartUploadCommand,
         AbortMultipartUploadCommand } from '@aws-sdk/client-s3'

const PART_SIZE = 10 * 1024 * 1024  // 10MB

async function multipartUpload(
  s3: S3Client, bucket: string, key: string, file: File,
  onProgress?: (percent: number) => void
) {
  // 1. 初始化
  const { UploadId } = await s3.send(new CreateMultipartUploadCommand({
    Bucket: bucket, Key: key, ContentType: file.type
  }))

  const parts: { PartNumber: number; ETag: string }[] = []
  const totalParts = Math.ceil(file.size / PART_SIZE)

  try {
    for (let i = 0; i < totalParts; i++) {
      const start = i * PART_SIZE
      const chunk = file.slice(start, start + PART_SIZE)

      // 2. 上传每一片
      const { ETag } = await s3.send(new UploadPartCommand({
        Bucket: bucket, Key: key,
        UploadId, PartNumber: i + 1,
        Body: chunk,
      }))
      parts.push({ PartNumber: i + 1, ETag: ETag! })
      onProgress?.(Math.round(((i + 1) / totalParts) * 100))
    }

    // 3. 合并
    await s3.send(new CompleteMultipartUploadCommand({
      Bucket: bucket, Key: key, UploadId,
      MultipartUpload: { Parts: parts }
    }))
  } catch (err) {
    await s3.send(new AbortMultipartUploadCommand({
      Bucket: bucket, Key: key, UploadId
    }))
    throw err
  }
}
```

---

## 断点续传

**原理**：保存已完成分片的 `UploadId` 和每片的 `ETag`，网络中断后恢复时跳过已完成的分片。

```python
import json
import os

RESUME_FILE = '.upload_resume.json'  # 本地断点信息文件

def resumable_upload(bucket, key, file_path):
    s3 = boto3.client('s3')
    part_size = 10 * 1024 * 1024
    resume_data = {}

    # 读取断点信息
    if os.path.exists(RESUME_FILE):
        with open(RESUME_FILE) as f:
            resume_data = json.load(f)

    upload_id = resume_data.get('upload_id')
    completed_parts = {p['PartNumber']: p for p in resume_data.get('parts', [])}

    # 如果没有断点，重新初始化
    if not upload_id:
        resp = s3.create_multipart_upload(Bucket=bucket, Key=key)
        upload_id = resp['UploadId']
        resume_data = {'upload_id': upload_id, 'key': key, 'parts': []}

    parts = list(completed_parts.values())
    file_size = os.path.getsize(file_path)
    total_parts = (file_size + part_size - 1) // part_size

    try:
        with open(file_path, 'rb') as f:
            for part_num in range(1, total_parts + 1):
                if part_num in completed_parts:
                    print(f"Part {part_num} already done, skipping")
                    continue

                f.seek((part_num - 1) * part_size)
                data = f.read(part_size)
                resp = s3.upload_part(
                    Bucket=bucket, Key=key,
                    UploadId=upload_id, PartNumber=part_num, Body=data
                )
                part_info = {'PartNumber': part_num, 'ETag': resp['ETag']}
                parts.append(part_info)

                # 实时保存断点信息
                resume_data['parts'] = parts
                with open(RESUME_FILE, 'w') as rf:
                    json.dump(resume_data, rf)

        # 完成上传
        parts.sort(key=lambda x: x['PartNumber'])
        s3.complete_multipart_upload(
            Bucket=bucket, Key=key, UploadId=upload_id,
            MultipartUpload={'Parts': parts}
        )
        os.remove(RESUME_FILE)  # 清理断点文件

    except Exception as e:
        # 保留断点文件，下次可以继续
        print(f"Upload interrupted, resume info saved. Error: {e}")
        raise
```

**前端断点续传（IndexedDB 存储断点）：**

```typescript
// 将 UploadId 和已完成分片存入 IndexedDB
async function saveResumeInfo(key: string, uploadId: string, parts: CompletedPart[]) {
  const db = await openDB('upload-resume', 1)
  await db.put('uploads', { key, uploadId, parts, timestamp: Date.now() }, key)
}

async function getResumeInfo(key: string) {
  const db = await openDB('upload-resume', 1)
  return db.get('uploads', key)
}

// 上传时先检查是否有断点
const resumeInfo = await getResumeInfo(objectKey)
const uploadId = resumeInfo?.uploadId || (await initMultipartUpload()).UploadId
const completedParts = resumeInfo?.parts || []
```

### 断点续传注意事项

| 注意点 | 说明 |
|--------|------|
| **UploadId 有效期** | UploadId 在完成或中止前一直有效，被 Lifecycle Rule 清理后需重新上传。建议配置 Lifecycle Rule 自动中止过期的未完成上传 |
| **ETag 验证** | 合并时 S3 会校验每片的 ETag，ETag 错误会失败 |
| **文件变化检测** | 续传前需验证本地文件的 hash（或大小+时间戳），防止文件已变化仍用旧断点 |
| **并发安全** | 同一文件同一时间只允许一个上传任务，防止冲突 |

---

## 上传授权校验

【必须】后端将已授权的 Key 缓存，前端提交时校验合法性：

```python
import hashlib

def upload_auth_key(user_id, scene_id, object_key):
    # 缓存 Key 结构为示例，项目可自定义
    # 不能用内置 hash()：每个进程的盐不同，多实例或重启后算出的值不一致，校验必然失败
    digest = hashlib.sha256(object_key.encode("utf-8")).hexdigest()
    return f"upload:auth:{user_id}:{scene_id}:{digest}"

# 授权时写入缓存。TTL 为示例值，不短于上传凭证的有效期
redis.setex(upload_auth_key(user_id, scene_id, object_key), 7200, object_key)

# 前端提交时校验（假设 Redis 客户端已开启 decode_responses）
cache_key = upload_auth_key(user_id, scene_id, submitted_key)
stored_key = redis.get(cache_key)
if stored_key != submitted_key:
    raise ForbiddenError("上传路径不合法")
redis.delete(cache_key)
```

---

## 文件访问规范

【必须】业务文件所在的存储桶设为**私有读写**，通过后端生成的签名 URL 提供访问；如使用 CDN，同时开启 CDN 鉴权：

```python
# 生成带签名的访问 URL（后端生成，前端直接使用）
def get_signed_url(object_key: str, expires: int = 7200) -> str:
    url = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': BUCKET_NAME, 'Key': object_key},
        ExpiresIn=expires,
    )
    return url  # 有效期为示例值，按文件敏感程度调整
```

下表是常见选项，按项目实际情况选择：

| 场景 | 访问方式 |
|------|---------|
| 私有业务文件（合同、证件）| 后端生成签名 URL，有效期尽量短 |
| 用户上传的媒体（头像、图片）| 签名 URL；如使用 CDN，用 CDN 签名（Token 鉴权）|
| 公开静态资源（产品图、宣传图）| 独立的公开读 Bucket，可加 CDN；该 Bucket 禁止用户上传 |
| 长视频 | 签名 URL + 续期机制 |

---

## 临时文件清理

用户上传后未提交（中途放弃）的临时文件需要清理，下面两种方案按项目选择，路径和时长都是示例：

### 方案1：前缀转移

```
上传路径：tmp/users/{userId}/{filename}   ← 临时前缀
提交成功：复制到 data/users/{userId}/{filename} 后删除临时对象  ← 正式前缀
清理：Lifecycle Rule 或定时任务清理 tmp/ 下超过 48 小时的对象
```

### 方案2：对象标签 + 生命周期规则

```python
# 上传时打标签
s3.put_object_tagging(
    Bucket=BUCKET,
    Key=object_key,
    Tagging={'TagSet': [{'Key': 'status', 'Value': 'temp'}]}
)

# 提交成功后删除标签（表示正式）
s3.delete_object_tagging(Bucket=BUCKET, Key=object_key)

# 存储桶配置：status=temp 的文件 2 天后自动删除（Lifecycle Policy）
```

---

## 安全规范

【必须】存储桶**禁止设置公有写权限**（任何时候）

【必须】产品代码及其配置文件中禁止写死 AK/SK，使用 STS 或环境变量注入

【必须】上传文件类型白名单校验，禁止上传可执行文件（`.exe`、`.sh`、`.php` 等）

【必须】文件大小限制：根据业务场景设置合理上限

【必须】使用 CDN 时开启防盗链：设置 Referer 白名单或 Token 鉴权

【推荐】开启对象存储的服务端加密（SSE-S3 或 SSE-KMS）

---

## 浏览器下载中文文件名

```python
# Python - 设置 Content-Disposition（RFC 5987）
import urllib.parse

filename_encoded = urllib.parse.quote(original_filename)  # URL 编码
# Content-Disposition: attachment; filename*=UTF-8''%E6%B5%8B%E8%AF%95.pdf
disposition = f"attachment; filename*=UTF-8''{filename_encoded}"
```

---

## 文件类型与 Content-Type 映射

| 类型 | 扩展名 | Content-Type |
|------|--------|-------------|
| 视频 | mp4, m4v | video/mp4 |
| 视频 | webm | video/webm |
| 视频 | mov | video/quicktime |
| 音频 | mp3 | audio/mpeg |
| 图片 | png | image/png |
| 图片 | jpg, jpeg | image/jpeg |
| 图片 | gif | image/gif |
| 图片 | webp | image/webp |
| 文档 | pdf | application/pdf |
| 文档 | docx | application/vnd.openxmlformats-officedocument.wordprocessingml.document |
| 文档 | xlsx | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet |
| 文档 | pptx | application/vnd.openxmlformats-officedocument.presentationml.presentation |
| 压缩 | zip | application/zip |
| 文本 | txt | text/plain |

---

## 多语言 SDK 推荐

| 语言 | 推荐 SDK |
|------|---------|
| Python | `boto3`（AWS）/ `cos-python-sdk-v5`（腾讯）/ `oss2`（阿里）|
| Go | `aws-sdk-go-v2` / `cos-go-sdk-v5` / `aliyun-oss-go-sdk` |
| Java | `aws-java-sdk-s3` / `cos_api-5.x` / `aliyun-oss-sdk` |
| Node.js | `@aws-sdk/client-s3` / `cos-nodejs-sdk-v5` |
| 前端 | `@aws-sdk/client-s3` / `cos-js-sdk-v5` |

> **推荐**：使用 `boto3`（Python）或 `aws-sdk-go-v2`（Go）配合各厂商的 S3 兼容端点，一套代码可切换不同存储服务。

## Related

- [OSS.md](../../OSS.md)（本项目实际配置与文件管理约定）
- [数据安全规范](../security/data-security.md)（存储加密、访问控制）
- [安全基线规范](../security/security-baseline.md)（文件上传安全）
