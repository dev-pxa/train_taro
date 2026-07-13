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
H5_HTTP_PORT=8081
```

然后通过 `http://服务器IP:8081` 访问。

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

## 6. GitHub Actions 自动部署

项目已提供 `.github/workflows/deploy-h5.yml`。每次推送到 `master` 分支时，GitHub Actions 会通过 SSH 登录腾讯云服务器，把当前代码上传到服务器，并执行：

```bash
docker compose build --no-cache
docker compose up -d
```

### 腾讯云服务器准备

1. 在腾讯云安全组放行 SSH 端口，默认 `22`。
2. 放行 H5 访问端口，默认 `80`。
3. 在服务器安装 Docker 和 Docker Compose。
4. 确认后端服务监听 `8082`，并能从 H5 容器访问。

### 配置 SSH 登录

在本机生成一组专用于 GitHub Actions 的 SSH key：

```bash
ssh-keygen -t ed25519 -C "github-actions-train-taro-h5" -f github-actions-train-taro-h5
```

把公钥追加到腾讯云服务器部署用户的 `authorized_keys`：

```bash
ssh root@服务器IP "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
cat github-actions-train-taro-h5.pub | ssh root@服务器IP "cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

### GitHub Secrets

进入 GitHub 仓库：

`Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`

必填：

```text
TENCENT_CLOUD_HOST=服务器公网IP
TENCENT_CLOUD_USER=root
TENCENT_CLOUD_SSH_KEY=github-actions-train-taro-h5 私钥文件内容
```

可选：

```text
TENCENT_CLOUD_PORT=22
TENCENT_CLOUD_DEPLOY_PATH=/opt/train-taro-h5
H5_HTTP_PORT=80
BACKEND_UPSTREAM=host.docker.internal:8082
```

如果后端在另一台服务器，把 `BACKEND_UPSTREAM` 设置为：

```text
BACKEND_UPSTREAM=后端服务器IP:8082
```

### 触发部署

推送到 `master`：

```bash
git push origin master
```

也可以在 GitHub 仓库的 `Actions` 页面手动运行 `Deploy H5 to Tencent Cloud`。
