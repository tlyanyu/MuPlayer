import { isElectron, isDev } from "@/utils/helper";

/**
 * 支持的音乐平台
 */
export enum Platform {
  NETEASE = "netease",
  QQMUSIC = "qqmusic",
}

/**
 * 获取 API 基础 URL
 */
export function getApiBaseURL(): string {
  if (isDev) {
    // 开发模式：通过 Fastify 代理
    return "/api/multi";
  } else if (isElectron) {
    // Electron 生产模式：通过 Fastify 代理
    return "/api/multi";
  } else {
    // Web 生产模式：根据部署模式判断
    const deployMode = import.meta.env.VITE_DEPLOY_MODE;

    if (deployMode === "static") {
      // 静态托管部署：前端直连远程 API，需要后端配置 CORS
      const backend = import.meta.env.VITE_API_BACKEND;
      return backend || "http://localhost:3000";
    } else {
      // 容器部署（默认）：使用相对路径，通过 Nginx 代理转发，无需 CORS
      return "/api/multi";
    }
  }
}

/**
 * 获取平台显示名称
 */
export function getPlatformDisplayName(platform: Platform): string {
  const nameMap: Record<Platform, string> = {
    [Platform.NETEASE]: "网易云音乐",
    [Platform.QQMUSIC]: "QQ音乐",
  };
  return nameMap[platform] || platform;
}
