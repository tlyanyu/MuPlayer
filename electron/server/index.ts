import { join } from "path";
import { isDev } from "../main/utils";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import fastifyHttpProxy from "@fastify/http-proxy";
import fastify from "fastify";
import log from "../main/logger";
import Store from "electron-store";
import type { StoreType } from "../main/store";

/**
 * 初始化 MuPlayer 内置代理服务器
 *
 * 功能说明：
 * - 提供多平台 API 统一代理入口 (/api/multi → 多平台API服务)
 * - 在 Electron 生产环境提供静态文件服务
 * - 支持 HTTP/HTTPS 代理配置
 * - 支持运行时动态配置后端地址
 *
 * 架构设计：
 * - 专注于多平台代理核心功能
 * - 支持从 electron-store 读取配置
 * - 代理请求支持网络代理设置
 */
const initAppServer = async (store: Store<StoreType>) => {
  try {
    // 创建 Fastify 服务器实例，配置忽略尾随斜杠
    const server = fastify({
      ignoreTrailingSlash: true,
    });
    
    // 注册核心插件
    // Cookie 支持：用于处理认证相关的 Cookie 信息
    server.register(fastifyCookie);
    
    // Multipart 支持：用于处理文件上传等多部分表单数据
    server.register(fastifyMultipart);
    
    // 静态文件服务：仅在 Electron 生产环境启用
    if (!isDev) {
      log.info("📂 Serving static files from /renderer");
      server.register(fastifyStatic, {
        root: join(__dirname, "../renderer"),
      });
    }
    // API 信息接口：提供服务器状态和配置信息
    server.get("/api", (_, reply) => {
      reply.send({
        name: "MuPlayer API",
        description: "MuPlayer Multi-Platform Music API Service",
        author: "tlyanyu",
        version: "1.0.0",
        modes: [
          {
            name: "Multi-Platform Mode",
            description: "Unified multi-platform music API",
            prefix: "/api/multi",
            platforms: ["netease", "qqmusic"],
          },
        ],
      });
    });

    // 从 store 读取配置
    const multiApiUrl = store.get("apiBackend", "http://localhost:3000");
    const proxyConfig = store.get("proxy", "");

    // 配置代理 Agent（如果设置了代理）
    const proxyOptions: any = {};
    if (proxyConfig) {
      // 使用 undici 的 proxy 选项（@fastify/http-proxy 官方文档推荐方式）
      proxyOptions.undici = {
        proxy: proxyConfig,
      };
      log.info(`🔐 Using proxy: ${proxyConfig}`);
    } else {
      log.info(`ℹ️  No proxy configured, using direct connection`);
    }

    // 配置多平台 API 代理
    // 将所有 /api/multi/* 请求代理到独立的 multiPlatformMusicApi 服务
    server.register(fastifyHttpProxy, {
      upstream: multiApiUrl,           // 后端服务地址（从 store 读取）
      prefix: "/api/multi",            // 匹配的请求前缀
      rewritePrefix: "/",              // 重写路径（移除 /api/multi 前缀）
      http2: false,                    // 禁用 HTTP/2 避免兼容问题
      ...proxyOptions,                 // 应用代理配置
    });

    log.info(`🔗 Proxying /api/multi → ${multiApiUrl}`);

    // 服务器启动配置
    // 从环境变量获取端口，默认使用 25884
    const port = Number(process.env["VITE_SERVER_PORT"] || 25884);
    await server.listen({ port });
    
    // 启动日志：记录服务器状态和可用接口
    log.info(`🌐 MuPlayer Server started on port ${port}`);
    log.info(`🌍 Multi-Platform API: http://localhost:${port}/api/multi`);
    
    return server;
  } catch (error) {
    // 错误处理：启动失败时记录详细的错误信息
    log.error("🚫 AppServer failed to start");
    throw error;
  }
};

export default initAppServer;
