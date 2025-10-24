import { defineStore } from "pinia";
import { Platform } from "@/services/apiConfig";

/**
 * 后端服务状态
 */
interface BackendStatus {
  online: boolean;
  version: string;
  platforms: string[];
  lastCheck: number;
}

/**
 * 平台配置接口（可扩展）
 */
export interface PlatformConfig {
  /**
   * 平台主题色类型
   */
  themeColorType?:
    | "default"
    | "orange"
    | "blue"
    | "pink"
    | "brown"
    | "indigo"
    | "green"
    | "purple"
    | "yellow"
    | "teal"
    | "custom";
  /**
   * 平台自定义主题色（当 themeColorType 为 custom 时使用）
   */
  themeCustomColor?: string;
  // 未来可扩展的配置项：
  // displayName?: string;
  // songLevel?: string;
  // customSettings?: Record<string, any>;
}

/**
 * 平台状态管理 Store
 */
export const usePlatformStore = defineStore("platform", {
  state: () => ({
    /**
     * 当前选择的音乐平台
     */
    currentPlatform: Platform.NETEASE as Platform,

    /**
     * 可用平台列表
     */
    availablePlatforms: [Platform.NETEASE, Platform.QQMUSIC] as Platform[],

    /**
     * 后端服务状态
     */
    backendStatus: {
      online: false,
      version: "",
      platforms: [],
      lastCheck: 0,
    } as BackendStatus,

    /**
     * 是否正在检查后端状态
     */
    checkingBackend: false,

    /**
     * 是否启用平台独立配置
     */
    usePlatformConfig: false,

    /**
     * 各平台的独立配置
     */
    platformConfigs: {
      [Platform.NETEASE]: {
        themeColorType: "default",
        themeCustomColor: "#fe7971",
      },
      [Platform.QQMUSIC]: {
        themeColorType: "blue",
        themeCustomColor: "#3b5998",
      },
    } as Record<Platform, PlatformConfig>,
  }),

  getters: {
    /**
     * 后端服务是否在线
     */
    isBackendOnline: (state) => state.backendStatus.online,

    /**
     * 获取当前平台显示名称
     */
    currentPlatformName: (state) => {
      const names: Record<Platform, string> = {
        [Platform.NETEASE]: "网易云音乐",
        [Platform.QQMUSIC]: "QQ音乐",
      };
      return names[state.currentPlatform];
    },
  },

  actions: {
    /**
     * 切换音乐平台
     * @param platform 平台名称
     */
    switchPlatform(platform: Platform) {
      if (!this.availablePlatforms.includes(platform)) {
        console.warn(`平台 ${platform} 不可用`);
        return;
      }

      this.currentPlatform = platform;
      const platformName = platform === Platform.NETEASE ? "网易云音乐" : "QQ音乐";
      console.log(`🔄 已切换到${platformName}`);

      // 如果启用了平台独立配置，应用该平台的主题色
      if (this.usePlatformConfig) {
        this.applyPlatformTheme(platform);
      }
    },

    /**
     * 更新平台配置
     * @param platform 平台名称
     * @param config 配置内容
     */
    updatePlatformConfig(platform: Platform, config: PlatformConfig) {
      if (!this.availablePlatforms.includes(platform)) {
        console.warn(`平台 ${platform} 不可用`);
        return;
      }

      // 更新配置
      this.platformConfigs[platform] = { ...this.platformConfigs[platform], ...config };

      // 如果是当前平台且启用了独立配置，立即应用
      if (this.usePlatformConfig && platform === this.currentPlatform) {
        this.applyPlatformTheme(platform);
      }

      console.log(`✅ ${platform} 配置已更新`, config);
    },

    /**
     * 应用平台主题色到全局设置
     * @param platform 平台名称
     */
    applyPlatformTheme(platform: Platform) {
      const config = this.platformConfigs[platform];
      if (!config) return;

      // 动态导入 settingStore 避免循环依赖
      import("@/stores/setting").then(({ useSettingStore }) => {
        const settingStore = useSettingStore();

        // 应用主题色配置
        if (config.themeColorType) {
          settingStore.themeColorType = config.themeColorType;
        }
        if (config.themeColorType === "custom" && config.themeCustomColor) {
          settingStore.themeCustomColor = config.themeCustomColor;
        }

        const platformName = platform === Platform.NETEASE ? "网易云音乐" : "QQ音乐";
        console.log(`🎨 已应用${platformName}的主题色配置`);
      });
    },

    /**
     * 检查后端服务状态
     * @returns 是否在线
     */
    async checkBackendStatus(): Promise<boolean> {
      // 避免重复检查
      if (this.checkingBackend) {
        return this.backendStatus.online;
      }

      const now = Date.now();
      this.checkingBackend = true;

      try {
        const axios = (await import("axios")).default;
        const { getApiBaseURL } = await import("@/services/apiConfig");
        
        await axios.get("/status", {
          baseURL: getApiBaseURL(),
          timeout: 3000, 
        });

        this.backendStatus = {
          online: true,
          version: "",
          platforms: [],
          lastCheck: now,
        };

        console.log("✅ 后端服务在线");
        return true;
      } catch (error) {
        this.backendStatus = {
          online: false,
          version: "",
          platforms: [],
          lastCheck: now,
        };

        console.warn("❌ 后端服务离线", error);
        return false;
      } finally {
        this.checkingBackend = false;
      }
    },

    /**
     * 重置到默认状态
     */
    reset() {
      this.currentPlatform = Platform.NETEASE;
      this.backendStatus = {
        online: false,
        version: "",
        platforms: [],
        lastCheck: 0,
      };
    },
  },

  // 持久化存储 (保存所有 state)
  persist: {
    key: "muplayer-platform",
    storage: localStorage,
  },
});
