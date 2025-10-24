import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { getApiBaseURL, Platform } from "./apiConfig";
import { usePlatformStore } from "@/stores/platform";

/**
 * API 请求选项接口
 */
export interface RequestOptions {
  /**
   * 资源对象（如歌曲、歌单）
   */
  resource?: { platform?: Platform };

  /**
   * 直接指定平台
   */
  platform?: Platform;

  /**
   * 平台特定的额外参数
   */
  extraParams?: Record<string, any>;
}

/**
 * 多平台统一 API 客户端
 */
class MultiPlatformApiClient {
  private client: AxiosInstance;

  constructor() {
    // 创建 Axios 客户端实例
    this.client = axios.create({
      baseURL: getApiBaseURL(),  // 获取多平台 API 基础 URL
      timeout: 15000, 
    });

    this.setupInterceptors();     // 配置请求和响应拦截器
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors() {
    // 请求拦截器
    this.client.interceptors.request.use((config) => {
      if (!config.params) config.params = {};

      // 平台注入（3级优先级）
      const options = (config as any).__requestOptions as RequestOptions | undefined;
      const platformStore = this.getPlatformStore();
      const currentPlatform = platformStore?.currentPlatform || Platform.NETEASE;

      // 优先级：resource.platform > options.platform > currentPlatform
      const platform =
        options?.resource?.platform ||     // 资源平台
        options?.platform ||               // 指定平台
        currentPlatform;                   // 当前平台

      // 添加 platform 参数到请求
      config.params.platform = platform;

      // 合并平台特定的额外参数
      if (options?.extraParams) {
        config.params = { ...config.params, ...options.extraParams };
      }

      return config;
    });

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error("API 请求失败：", error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取平台 store
   */
  private getPlatformStore() {
    try {
      const store = usePlatformStore();
      console.log("[apiClient] getPlatformStore - currentPlatform:", store?.currentPlatform);
      return store;
    } catch (error) {
      console.error("[apiClient] getPlatformStore 失败:", error);
      return null;
    }
  }

  /**
   * 发送请求
   * @param config Axios 请求配置
   * @param options 请求选项
   */
  async request<T = any>(
    config: AxiosRequestConfig,
    options?: RequestOptions
  ): Promise<T> {
    // 将 options 附加到 config，以便在拦截器中访问
    (config as any).__requestOptions = options;

    return this.client.request(config);
  }

  /**
   * GET 请求
   * @param url 请求路径
   * @param params 查询参数
   * @param options 请求选项
   */
  async get<T = any>(
    url: string,
    params?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>({ method: "GET", url, params }, options);
  }

  /**
   * POST 请求
   * @param url 请求路径
   * @param data 请求体数据
   * @param params 查询参数
   * @param options 请求选项
   */
  async post<T = any>(
    url: string,
    data?: any,
    params?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>({ method: "POST", url, data, params }, options);
  }
}

// 导出单例
export const apiClient = new MultiPlatformApiClient();
