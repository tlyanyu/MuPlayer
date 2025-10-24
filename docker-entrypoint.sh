#!/bin/sh

set -e

# Nginx 代理目标地址
# 默认值 http://localhost:3000，可通过环境变量覆盖
MULTI_API_UPSTREAM="${VITE_API_BACKEND:-http://localhost:3000}"

# 确保 proxy_pass 目标以 / 结尾，保持与 Nginx 配置一致
case "$MULTI_API_UPSTREAM" in
  */) ;;
  *) MULTI_API_UPSTREAM="${MULTI_API_UPSTREAM}/" ;;
esac

export MULTI_API_UPSTREAM

# 使用环境变量渲染 Nginx 配置模板
if [ -f /etc/nginx/templates/default.conf.template ]; then
  envsubst '${MULTI_API_UPSTREAM}' \
    < /etc/nginx/templates/default.conf.template \
    > /etc/nginx/conf.d/default.conf
fi

if [ "$#" -gt 0 ]; then
  exec "$@"
else
  exec nginx -g "daemon off;"
fi
