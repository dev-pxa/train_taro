#!/usr/bin/env bash
set -euo pipefail

SSH_HOST="${SSH_HOST:-49.232.34.105}"
SSH_USER="${SSH_USER:-root}"
SSH_PORT="${SSH_PORT:-22}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/train-taro}"
H5_HTTP_PORT="${H5_HTTP_PORT:-8081}"
BACKEND_UPSTREAM="${BACKEND_UPSTREAM:-host.docker.internal:8082}"
ARCHIVE_NAME="train-taro-h5-release.tgz"
LOCAL_ARCHIVE="/tmp/${ARCHIVE_NAME}"
REMOTE_ARCHIVE="/tmp/${ARCHIVE_NAME}"
SSH_KEY_PATH="${SSH_KEY_PATH:-}"
SSH_KEY_ARGS=()

if [[ -n "$SSH_KEY_PATH" ]]; then
  SSH_KEY_ARGS=(-i "$SSH_KEY_PATH")
fi

if [[ -z "$DEPLOY_PATH" || "$DEPLOY_PATH" == "/" ]]; then
  echo "Invalid DEPLOY_PATH: ${DEPLOY_PATH}" >&2
  exit 1
fi

echo "Packing project..."
tar \
  --exclude='.git' \
  --exclude='.github' \
  --exclude='.swc' \
  --exclude='dist' \
  --exclude='node_modules' \
  --exclude='.DS_Store' \
  --exclude='github-actions-train-taro-h5' \
  --exclude='github-actions-train-taro-h5.pub' \
  -czf "$LOCAL_ARCHIVE" .

echo "Uploading to ${SSH_USER}@${SSH_HOST}:${REMOTE_ARCHIVE}..."
scp "${SSH_KEY_ARGS[@]}" -P "$SSH_PORT" "$LOCAL_ARCHIVE" "${SSH_USER}@${SSH_HOST}:${REMOTE_ARCHIVE}"

echo "Deploying on ${SSH_HOST}:${DEPLOY_PATH}..."
ssh "${SSH_KEY_ARGS[@]}" -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" \
  "DEPLOY_PATH='$DEPLOY_PATH' H5_HTTP_PORT='$H5_HTTP_PORT' BACKEND_UPSTREAM='$BACKEND_UPSTREAM' REMOTE_ARCHIVE='$REMOTE_ARCHIVE' bash -s" <<'REMOTE'
set -euo pipefail

if [[ -z "$DEPLOY_PATH" || "$DEPLOY_PATH" == "/" ]]; then
  echo "Invalid DEPLOY_PATH: ${DEPLOY_PATH}" >&2
  exit 1
fi

mkdir -p "$DEPLOY_PATH"
find "$DEPLOY_PATH" -mindepth 1 -maxdepth 1 ! -name '.env' -exec rm -rf {} +
tar -xzf "$REMOTE_ARCHIVE" -C "$DEPLOY_PATH"

cd "$DEPLOY_PATH"
cat > .env <<EOF
H5_HTTP_PORT=$H5_HTTP_PORT
BACKEND_UPSTREAM=$BACKEND_UPSTREAM
EOF

docker compose build --pull
docker compose up -d
docker compose ps
curl -fsS "http://127.0.0.1:${H5_HTTP_PORT}/healthz"
REMOTE

echo
echo "Deploy completed: http://${SSH_HOST}:${H5_HTTP_PORT}"
