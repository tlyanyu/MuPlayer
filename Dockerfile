# ================================
# 构建阶段
# ================================
FROM node:20-alpine AS builder

# 配置 Alpine 镜像源（加速下载）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 安装必要工具
RUN apk update && apk add --no-cache git

WORKDIR /app

# 复制依赖配置文件
COPY package*.json ./

# 跳过Electron二进制下载（Web版本不需要）
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1

# 安装依赖但跳过postinstall脚本
RUN npm ci --ignore-scripts

# 复制源代码
COPY . .

# 创建 .env 文件（如果不存在）
RUN [ ! -e ".env" ] && cp .env.example .env || true

# 构建应用（跳过typecheck，因为auto-imports.d.ts和components.d.ts在运行时生成）
RUN npx electron-vite build

# ================================
# 生产阶段
# ================================
FROM nginx:1.27-alpine-slim

# 配置 Alpine 镜像源（加速下载）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 安装 envsubst 用于模板渲染
RUN apk add --no-cache gettext

# 复制构建产物
COPY --from=builder /app/out/renderer /usr/share/nginx/html

# 复制 Nginx 配置模板与入口脚本
COPY --from=builder /app/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=builder /app/docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

# 配置环境
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:25884/ || exit 1

# 暴露端口
EXPOSE 25884

ENTRYPOINT ["/docker-entrypoint.sh"]
