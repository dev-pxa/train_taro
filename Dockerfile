FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build:h5

FROM nginx:1.27-alpine

ENV BACKEND_UPSTREAM=host.docker.internal:8082

COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html
# Keep legacy entry filenames available for users whose browser cached an old index.html.
RUN set -eux; \
  app_js="$(find /usr/share/nginx/html/js -maxdepth 1 -name 'app.*.js' | head -n 1)"; \
  runtime_js="$(find /usr/share/nginx/html/js -maxdepth 1 -name '964.*.js' | head -n 1)"; \
  if [ -n "$app_js" ]; then cp "$app_js" /usr/share/nginx/html/js/app.js; fi; \
  if [ -n "$runtime_js" ]; then cp "$runtime_js" /usr/share/nginx/html/js/964.js; fi

EXPOSE 80
