# Nginx 配置规范

> **主标准**：[Nginx Official Documentation](https://nginx.org/en/docs/)

> **说明**：本页配置是参考写法，不是部署要求。路径、worker 参数、部署形态按项目实际情况确定。

---

## 基础配置模板

```nginx
# /etc/nginx/nginx.conf
user nginx;
worker_processes auto;          # 自动匹配 CPU 核数
worker_rlimit_nofile 65535;    # 单 Worker 最大文件描述符数

events {
    worker_connections 4096;    # 单 Worker 最大连接数
    use epoll;                  # Linux 使用 epoll（默认）
    multi_accept on;            # 一次性接受多个连接
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # 日志格式（JSON，便于日志分析）
    log_format json_log escape=json
        '{"time":"$time_iso8601",'
        '"remote_addr":"$remote_addr",'
        '"request":"$request",'
        '"status":"$status",'
        '"body_bytes_sent":"$body_bytes_sent",'
        '"request_time":"$request_time",'
        '"upstream_response_time":"$upstream_response_time",'
        '"http_x_forwarded_for":"$http_x_forwarded_for"}';

    access_log /var/log/nginx/access.log json_log buffer=16k flush=2s;
    error_log  /var/log/nginx/error.log warn;

    # 性能优化
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout 65;
    gzip            on;
    gzip_types      text/plain application/json application/javascript text/css;

    include /etc/nginx/conf.d/*.conf;
}
```

---

## 反向代理配置

```nginx
# /etc/nginx/conf.d/order-service.conf

upstream order_service {
    # ✅ keepalive：复用连接，减少 TCP 握手开销
    keepalive 32;
    keepalive_requests 1000;
    keepalive_timeout 60s;

    server order-svc-1.internal:8080 weight=1 max_fails=3 fail_timeout=30s;
    server order-svc-2.internal:8080 weight=1 max_fails=3 fail_timeout=30s;
    server order-svc-3.internal:8080 backup;    # 备用节点
}

server {
    listen 80;
    server_name api.example.com;
    return 301 https://$host$request_uri;  # HTTP → HTTPS 强制跳转
}

server {
    listen 443 ssl;
    http2 on;    # nginx 1.25.1+ 写法；更早的版本用 listen 443 ssl http2;
    server_name api.example.com;

    # SSL 证书
    ssl_certificate     /etc/nginx/ssl/api.crt;
    ssl_certificate_key /etc/nginx/ssl/api.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;

    # 安全响应头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header Content-Security-Policy "default-src 'self'" always;

    location /v1/ {
        proxy_pass         http://order_service;
        proxy_http_version 1.1;
        proxy_set_header   Connection "";           # 必须：配合 keepalive
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Request-ID $request_id;  # 透传 requestId

        # 超时配置
        proxy_connect_timeout 5s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;

        # 缓冲
        proxy_buffering    on;
        proxy_buffer_size  4k;
        proxy_buffers      8 4k;
    }
}
```

---

## 限流配置

```nginx
http {
    # 定义限流区域（按 IP 限流）
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/s;

    # 按用户 Token 限流
    map $http_authorization $user_key {
        ~^Bearer\s+(.+)$ $1;
        default $binary_remote_addr;
    }
    limit_req_zone $user_key zone=user_limit:20m rate=200r/s;

    server {
        location /v1/ {
            # 100 r/s，允许突发 50 个请求排队
            limit_req zone=api_limit burst=50 nodelay;
            limit_req_status 429;    # 超限返回 429，而非默认的 503
        }

        location /v1/auth/ {
            # 登录接口更严格：10 r/s，使用独立的限流区域
            limit_req zone=auth_limit burst=10 nodelay;
            limit_req_status 429;
        }
    }
}
```

---

## 静态资源缓存

```nginx
location ~* \.(js|css|png|jpg|gif|ico|woff2)$ {
    expires 30d;                              # 30 天强缓存
    add_header Cache-Control "public, immutable";
    access_log off;                           # 静态资源不记录访问日志
}

location ~* \.html$ {
    expires -1;                               # HTML 不缓存（总是从服务端获取）
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}
```

---

## 健康检查端点

```nginx
location /nginx-health {
    access_log off;
    return 200 "OK\n";
    add_header Content-Type text/plain;
}
```

---

## WebSocket 代理

```nginx
location /ws/ {
    proxy_pass http://websocket_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;    # 必须：WebSocket 升级
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 3600s;                  # WebSocket 长连接，超时设长
}
```

---

## 性能调优参数

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| `worker_processes` | `auto` | 自动匹配 CPU 核数 |
| `worker_connections` | 4096 | 根据并发量调整 |
| `keepalive_timeout` | 65 | 客户端连接保持时间 |
| `gzip_min_length` | 1024 | 小于 1KB 不压缩 |
| `client_max_body_size` | 10m | 上传文件大小限制 |
| `proxy_connect_timeout` | 5s | 连接上游超时（短） |
| `proxy_read_timeout` | 60s | 读取上游响应超时 |

---

## 禁止事项

【禁止】生产环境 Nginx 直接暴露配置文件中的内部服务地址

【禁止】`server_tokens on`（暴露 Nginx 版本信息，应设为 `off`）

```nginx
server_tokens off;  # 隐藏版本号
```

【禁止】`autoindex on`（目录索引，避免暴露文件列表）

【禁止】在 Nginx 配置中写死上游服务 IP，应使用 DNS 或服务发现
