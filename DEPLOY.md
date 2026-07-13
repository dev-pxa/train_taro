# H5 Docker 部署说明

## 1. 前提

- 服务器已安装 Docker 和 Docker Compose。
- 后端服务监听 `8082` 端口，并提供 `/api/app` 接口前缀。
- 如果后端不在同一台服务器，把 `.env` 里的 `BACKEND_UPSTREAM` 改成 `后端IP或域名:8082`。

## 2. 构建并启动

在服务器进入项目目录：

```bash
cp .env.example .env
docker compose build
docker compose up -d
```

默认会把容器的 `80` 端口映射到服务器 `80` 端口。

如果服务器 80 端口已被占用，把 `.env` 中的端口改为：

```bash
H5_HTTP_PORT=8080
```

然后通过 `http://服务器IP:8080` 访问。

## 3. 接口代理

Nginx 会把前端请求：

```text
/api/app
/api/app/*
```

代理到：

```text
http://BACKEND_UPSTREAM/api/app
http://BACKEND_UPSTREAM/api/app/*
```

同服务器后端默认配置为：

```bash
BACKEND_UPSTREAM=host.docker.internal:8082
```

如果后端在另一台服务器，例如 `10.0.0.12:8082`：

```bash
BACKEND_UPSTREAM=10.0.0.12:8082
```

## 4. 验证

```bash
docker compose ps
docker compose logs -f train-taro-h5
curl http://127.0.0.1/healthz
curl -I http://127.0.0.1/api/app/login/config
```

`/healthz` 返回 `ok` 表示前端容器正常；接口验证能返回后端状态码表示代理链路已打通。

## 5. 更新部署

拉取或上传新代码后：

```bash
docker compose build --no-cache
docker compose up -d
```
