import { defineStore } from "pinia";
import { toRaw } from "vue";
import type {
  SongType,
  CoverType,
  UserDataType,
  UserLikeDataType,
  CatType,
  LoginType,
  PlatformUsersType,
} from "@/types/main";
import { playlistCatlist } from "@/api/playlist";
import localforage from "localforage";
import { formatCategoryList } from "@/utils/format";
import { usePlatformStore } from "@/stores/platform";
import { Platform } from "@/services/apiConfig";

// UserDataKeys 类型定义
type UserDataKeys = keyof UserLikeDataType;

interface ListState {
  playList: SongType[];
  originalPlayList: SongType[];
  historyList: SongType[];
  searchHistory: string[];
  localPlayList: CoverType[];
  
  platformUsers: PlatformUsersType;
  
  // 防抖定时器映射表（私有，不持久化）
  dbWriteTimers?: Map<string, NodeJS.Timeout>;
}



// ==================== 统一多平台数据库架构 ====================

// globalDB - 全局播放和搜索数据
const globalDB = localforage.createInstance({
  name: "muplayer-global",
  description: "Global music data and search history",
  storeName: "global",
});

// platformUsersDB - 多平台用户数据
const platformUsersDB = localforage.createInstance({
  name: "muplayer-platform-users",
  description: "Multi-platform users data",
  storeName: "platform-users",
});

// localDB - 本地歌曲数据（用于清除）
const localDB = localforage.createInstance({
  name: "muplayer-local",
  description: "Local song data",
  storeName: "local",
});

/**
 * 深度去除 Proxy 包装（递归处理嵌套对象和数组）
 * @param obj 待处理的对象
 * @returns 完全去除 Proxy 的纯对象
 */
function deepToRaw<T = any>(obj: T): T {
  const observedToRaw = (observed: any): any => {
    const raw = toRaw(observed);
    
    // 处理数组
    if (Array.isArray(raw)) {
      return raw.map(item => observedToRaw(item));
    }
    
    // 处理普通对象
    if (raw && typeof raw === 'object' && raw.constructor === Object) {
      const result: any = {};
      for (const key in raw) {
        if (Object.prototype.hasOwnProperty.call(raw, key)) {
          result[key] = observedToRaw(raw[key]);
        }
      }
      return result;
    }
    
    // 其他类型直接返回
    return raw;
  };
  
  return observedToRaw(obj);
}

export const useDataStore = defineStore("data", {
  state: (): ListState => ({
    // 播放列表
    playList: [],
    // 原始播放列表
    originalPlayList: [],
    // 播放历史
    historyList: [],
    // 搜索历史（全局数据）
    searchHistory: [],
    // 本地歌单
    localPlayList: [],
    // 防抖定时器映射表
    dbWriteTimers: new Map<string, NodeJS.Timeout>(),
    // 多平台用户数据（初始化为空对象，避免 undefined 导致的访问错误）
    platformUsers: {
      [Platform.NETEASE]: {
        loginStatus: false,
        loginType: "qr" as LoginType,
        userData: { userId: 0, userType: 0, vipType: 0, name: "" },
        userLikeData: { songs: [], playlists: [], artists: [], albums: [], mvs: [], djs: [] },
        cloudPlayList: [],
        likeSongsList: {
          detail: { id: 0, name: "我喜欢的音乐", cover: "/images/album.jpg?assest" },
          data: [],
        },
        catData: { type: {}, cats: [], hqCats: [] },
        personalFM: { playIndex: 0, list: [] },
        dailySongsData: { timestamp: null, list: [] },
      },
      [Platform.QQMUSIC]: {
        loginStatus: false,
        loginType: "qr" as LoginType,
        userData: { userId: 0, userType: 0, vipType: 0, name: "" },
        userLikeData: { songs: [], playlists: [], artists: [], albums: [], mvs: [], djs: [] },
        cloudPlayList: [],
        likeSongsList: {
          detail: { id: 0, name: "我喜欢的音乐", cover: "/images/album.jpg?assest" },
          data: [],
        },
        catData: { type: {}, cats: [], hqCats: [] },
        personalFM: { playIndex: 0, list: [] },
        dailySongsData: { timestamp: null, list: [] },
      },
    },
  }),
  getters: {
    // 是否为喜欢歌曲 - 支持指定平台参数
    isLikeSong: (state) => (id: number, platform?: Platform) => {
      const platformStore = usePlatformStore();
      const targetPlatform = platform || platformStore.currentPlatform;
      return state.platformUsers[targetPlatform].userLikeData.songs.includes(id);
    },
    // 当前用户数据
    currentUserData(state): UserDataType {
      const platformStore = usePlatformStore();
      const platform = platformStore.currentPlatform;
      return state.platformUsers[platform].userData;
    },
    // 当前登录状态
    currentLoginStatus(state): boolean {
      const platformStore = usePlatformStore();
      const platform = platformStore.currentPlatform;
      return state.platformUsers[platform].loginStatus;
    },
    // 当前用户喜欢数据
    currentUserLikeData(state): UserLikeDataType {
      const platformStore = usePlatformStore();
      const platform = platformStore.currentPlatform;
      return state.platformUsers[platform].userLikeData;
    },
    // 根据平台获取用户喜欢数据
    getUserLikeDataByPlatform: (state) => (platform?: Platform): UserLikeDataType => {
      const platformStore = usePlatformStore();
      const targetPlatform = platform || platformStore.currentPlatform;
      return state.platformUsers[targetPlatform].userLikeData;
    },
    
    // 当前平台私人 FM 数据
    currentPersonalFM(state): { playIndex: number; list: SongType[] } {
      const platformStore = usePlatformStore();
      const platform = platformStore.currentPlatform;
      return state.platformUsers[platform].personalFM;
    },
    // 当前平台每日推荐数据
    currentDailySongsData(state): { timestamp: number | null; list: SongType[] } {
      const platformStore = usePlatformStore();
      const platform = platformStore.currentPlatform;
      return state.platformUsers[platform].dailySongsData;
    },
    // 当前平台云盘歌单数据
    currentCloudPlayList(state): SongType[] {
      const platformStore = usePlatformStore();
      const platform = platformStore.currentPlatform;
      return state.platformUsers[platform].cloudPlayList;
    },
    // 当前平台喜欢歌单数据
    currentLikeSongsList(state): { detail: CoverType; data: SongType[] } {
      const platformStore = usePlatformStore();
      const platform = platformStore.currentPlatform;
      return state.platformUsers[platform].likeSongsList;
    },
    // 当前平台分类数据
    currentCatData(state): {
      type: Record<number, string>;
      cats: CatType[];
      hqCats: CatType[];
    } {
      const platformStore = usePlatformStore();
      const platform = platformStore.currentPlatform;
      return state.platformUsers[platform].catData;
    },
    // 当前平台登录类型
    loginType(state): LoginType {
      const platformStore = usePlatformStore();
      const platform = platformStore.currentPlatform;
      return state.platformUsers[platform].loginType;
    },
  },
  actions: {
    // ==================== 性能优化：防抖写入机制 ====================
    
    /**
     * 防抖写入 IndexedDB
     * @param db 数据库实例
     * @param key 存储键名
     * @param getValue 获取待存储值的函数（延迟执行以获取最新状态）
     * @param delay 防抖延迟（毫秒）
     */
    debouncedWrite(
      db: LocalForage,
      key: string,
      getValue: () => any,
      delay = 300
    ) {
      if (!this.dbWriteTimers) {
        this.dbWriteTimers = new Map();
      }
      
      // 生成唯一键（数据库名 + 键名）
      const uniqueKey = `${db.config().name}_${key}`;
      
      // 清除之前的定时器
      const existingTimer = this.dbWriteTimers.get(uniqueKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      
      // 设置新的定时器
      const timer = setTimeout(async () => {
        try {
          // 深度去除 Proxy 包装（递归处理嵌套对象）
          // IndexedDB 会自动进行结构化克隆
          const rawValue = deepToRaw(getValue());
          await db.setItem(key, rawValue);
          this.dbWriteTimers?.delete(uniqueKey);
        } catch (error) {
          console.error(`❌ 写入 ${key} 到 ${db.config().name} 失败:`, error);
          this.dbWriteTimers?.delete(uniqueKey);
        }
      }, delay);
      
      this.dbWriteTimers.set(uniqueKey, timer);
    },
    
    /**
     * 强制刷新所有待写入数据（页面关闭前调用）
     */
    async flushPendingWrites() {
      if (!this.dbWriteTimers || this.dbWriteTimers.size === 0) {
        return;
      }
      
      const flushPromises: Promise<void>[] = [];
      
      for (const [uniqueKey, timer] of this.dbWriteTimers.entries()) {
        clearTimeout(timer);
        
        // 解析数据库名和键名
        const [dbName, key] = uniqueKey.split('_');
        let db: LocalForage;
        
        if (dbName === 'muplayer-global') {
          db = globalDB;
        } else if (dbName === 'muplayer-platform-users') {
          db = platformUsersDB;
        } else {
          continue;
        }
        
        // 根据键名获取对应的值
        const promise = (async () => {
          try {
            const value = this[key as keyof ListState];
            if (value !== undefined) {
              await db.setItem(key, deepToRaw(value));
            }
          } catch (error) {
            console.error(`❌ 强制保存 ${key} 失败:`, error);
          }
        })();
        
        flushPromises.push(promise);
      }
      
      await Promise.all(flushPromises);
      this.dbWriteTimers.clear();
    },
    
    // ==================== 数据加载和管理 ====================
    
    async loadData() {
      try {
        // 1. 加载全局数据（播放列表、搜索历史等）
        const globalDataKeys = await globalDB.keys();
        await Promise.all(
          globalDataKeys.map(async (key) => {
            const data = await globalDB.getItem(key);
            this[key] = data || [];
          }),
        );

        // 2. 加载多平台用户数据
        const platformUsersData = await platformUsersDB.getItem("platformUsers");

        if (platformUsersData) {
          this.platformUsers = platformUsersData as PlatformUsersType;

          // 3. 验证登录状态：检查 Cookie 是否仍然有效
          await this.validateLoginStatus();
        } else {
          // platformUsers 已在 state 中初始化，无需额外处理
        }
      } catch (error) {
        console.error("❌ 数据加载失败:", error);
      }
    },
    // 更新播放列表
    async setPlayList(data: SongType | SongType[]): Promise<number> {
      try {
        // 若为列表
        if (Array.isArray(data)) {
          this.playList = data;
          // 使用防抖写入
          this.debouncedWrite(globalDB, "playList", () => this.playList);
          return 0;
        }
        // 若为单曲
        else {
          const song = data;
          // 歌曲去重
          const playList = this.playList.filter((s) => s.id !== song.id);
          // 添加到歌单末尾
          playList.push(song);
          // 获取索引
          const index = playList.length - 1;
          // 更新状态
          this.playList = playList;
          // 使用防抖写入
          this.debouncedWrite(globalDB, "playList", () => this.playList);
          return index;
        }
      } catch (error) {
        console.error("❌ 更新播放列表失败:", error);
        throw error;
      }
    },
    // 保存原始播放列表
    async setOriginalPlayList(data: SongType[]): Promise<void> {
      this.originalPlayList = data;
      this.debouncedWrite(globalDB, "originalPlayList", () => this.originalPlayList);
    },
    // 获取原始播放列表
    async getOriginalPlayList(): Promise<SongType[] | null> {
      if (Array.isArray(this.originalPlayList) && this.originalPlayList.length > 0) {
        return this.originalPlayList;
      }
      const data = (await globalDB.getItem("originalPlayList")) as SongType[] | null;
      if (Array.isArray(data) && data.length > 0) {
        this.originalPlayList = data;
        return data;
      }
      return null;
    },
    // 清除原始播放列表
    async clearOriginalPlayList(): Promise<void> {
      this.originalPlayList = [];
      // 立即写入（清空操作不需要防抖）
      await globalDB.setItem("originalPlayList", []);
    },
    // 新增下一首播放歌曲
    async setNextPlaySong(song: SongType, index: number): Promise<number> {
      // 若为空,则直接添加
      if (this.playList.length === 0) {
        this.playList = [song];
        this.debouncedWrite(globalDB, "playList", () => this.playList);
        return 0;
      }

      // 在当前播放位置之后插入歌曲
      const indexAdd = index + 1;
      this.playList.splice(indexAdd, 0, song);
      // 移除重复的歌曲（如果存在）
      const playList = this.playList.filter((item, idx) => idx === indexAdd || item.id !== song.id);
      // 更新本地状态
      this.playList = playList;
      // 使用防抖写入
      this.debouncedWrite(globalDB, "playList", () => this.playList);
      // 返回刚刚插入的歌曲索引
      return playList.findIndex((item) => item.id === song.id);
    },
    // 更改播放历史
    async setHistory(song: SongType) {
      try {
        // 直接操作当前状态
        const historyList = this.historyList.length > 0 ? this.historyList : [];
        
        // 添加到首项并移除重复项
        const updatedList = [song, ...historyList.filter((item) => item.id !== song.id)];
        // 最多 500 首
        if (updatedList.length > 500) updatedList.splice(500);
        
        // 更新状态
        this.historyList = updatedList;
        // 使用防抖写入
        this.debouncedWrite(globalDB, "historyList", () => this.historyList);
      } catch (error) {
        console.error("Error updating history:", error);
        throw error;
      }
    },
    // 清除播放历史
    async clearHistory(): Promise<void> {
      try {
        this.historyList = [];
        // 立即写入（清空操作不需要防抖）
        await globalDB.setItem("historyList", []);
      } catch (error) {
        console.error("Error clearing history:", error);
        throw error;
      }
    },
    // 更改我喜欢的音乐（平台特定）
    async setLikeSongsList(detail: CoverType, data: SongType[]) {
      const platformStore = usePlatformStore();
      const platform = platformStore.currentPlatform;
      
      this.platformUsers[platform].likeSongsList = {
        detail,
        data,
      };
      await this.savePlatformUsers();
    },
    // 获取当前平台喜欢歌单数据
    async getUserLikePlaylist() {
      const platformStore = usePlatformStore();
      const platform = platformStore.currentPlatform;
      
      if (!this.platformUsers[platform].loginStatus) return null;
      
      const result = this.currentLikeSongsList;
      return result;
    },
    // 更改云盘歌单（平台特定）
    async setCloudPlayList(data: SongType[]) {
      const platformStore = usePlatformStore();
      const platform = platformStore.currentPlatform;
      
      this.platformUsers[platform].cloudPlayList = data;
      await this.savePlatformUsers();
    },
    // 清除当前平台用户数据
    async clearCurrentPlatformData() {
      try {
        const platformStore = usePlatformStore();
        const currentPlatform = platformStore.currentPlatform;
        this.clearPlatformUserData(currentPlatform);
      } catch (error) {
        console.error("❌ 清除当前平台用户数据失败:", error);
        throw error;
      }
    },
    // ==================== 私有辅助方法 ====================
    
    /**
     * 验证登录状态：检查 Cookie 是否仍然有效
     * 性能优化：只验证已登录的平台，使用 continue 提前跳过
     */
    async validateLoginStatus() {
      const { getCookie } = await import("@/utils/cookie");
      const now = Date.now();

      // 遍历所有平台，但只验证已登录的平台
      for (const platform of [Platform.NETEASE, Platform.QQMUSIC]) {
        const platformData = this.platformUsers[platform];

        // 性能优化：跳过未登录的平台
        if (!platformData.loginStatus) {
          continue;
        }

        let cookieValid = false;

        if (platform === Platform.NETEASE) {
          // 网易云：检查 MUSIC_U
          const musicU = getCookie("MUSIC_U");
          cookieValid = !!musicU && musicU.length > 0;
        } else if (platform === Platform.QQMUSIC) {
          // QQ音乐：检查 uin 或 qm_keyst
          const uin = getCookie("uin");
          const qmKeyst = getCookie("qm_keyst");
          cookieValid = !!(uin || qmKeyst);
        }

        // 通用过期时间检查 (所有平台)
        if (cookieValid && platformData.loginExpireTime) {
          if (now > platformData.loginExpireTime) {
            console.warn(`⚠️ ${platform} 登录已过期`);
            cookieValid = false;
          }
        }

        if (!cookieValid) {
          console.warn(`⚠️ ${platform} Cookie 已失效，清除登录状态`);
          this.clearPlatformUserData(platform);
        }
      }
    },

    /**
     * 获取默认平台用户数据
     */
    getDefaultPlatformUserData() {
      return {
        loginStatus: false,
        loginType: "qr" as LoginType,
        userData: {
          userId: 0,
          userType: 0,
          vipType: 0,
          name: "",
        },
        userLikeData: {
          songs: [],
          playlists: [],
          artists: [],
          albums: [],
          mvs: [],
          djs: [],
        },
        cloudPlayList: [],
        likeSongsList: {
          detail: {
            id: 0,
            name: "我喜欢的音乐",
            cover: "/images/album.jpg?assest",
          },
          data: [],
        },
        catData: {
          type: {},
          cats: [],
          hqCats: [],
        },
        personalFM: {
          playIndex: 0,
          list: [],
        },
        dailySongsData: {
          timestamp: null,
          list: [],
        },
      };
    },

    /**
     * 确保 platformUsers 已初始化
     */
    ensurePlatformUsersInitialized() {
      if (!this.platformUsers) {
        this.platformUsers = {
          [Platform.NETEASE]: this.getDefaultPlatformUserData(),
          [Platform.QQMUSIC]: this.getDefaultPlatformUserData(),
        };
      }
    },

    /**
     * 保存 platformUsers 到 IndexedDB（使用防抖优化）
     */
    async savePlatformUsers() {
      try {
        // 使用较长的防抖时间（500ms），因为用户数据更新频率较低
        this.debouncedWrite(platformUsersDB, "platformUsers", () => this.platformUsers, 500);
      } catch (error) {
        console.error("❌ 保存多平台用户数据失败:", error);
      }
    },

    // ==================== 平台数据管理方法 ====================
    
    /**
     * 设置指定平台的用户数据
     */
    setPlatformUserData(platform: Platform, userData: UserDataType) {
      this.platformUsers[platform].userData = userData;
      this.platformUsers[platform].loginStatus = true;
      this.savePlatformUsers();
    },
    
    /**
     * 设置指定平台的用户喜欢数据
     */
    setPlatformUserLikeData<K extends UserDataKeys>(
      platform: Platform,
      key: K,
      data: UserLikeDataType[K],
    ) {
      this.platformUsers[platform].userLikeData[key] = data;
      this.savePlatformUsers();
    },
    
    /**
     * 设置平台云盘歌单
     */
    async setPlatformCloudPlayList(platform: Platform, data: SongType[]) {
      this.platformUsers[platform].cloudPlayList = data;
      await this.savePlatformUsers();
    },

    /**
     * 设置平台喜欢歌单
     */
    async setPlatformLikeSongsList(platform: Platform, detail: CoverType, data: SongType[]) {
      this.platformUsers[platform].likeSongsList = {
        detail,
        data,
      };
      await this.savePlatformUsers();
    },

    /**
     * 设置平台分类数据
     */
    async setPlatformCatData(
      platform: Platform,
      data: {
        type: Record<number, string>;
        cats: CatType[];
        hqCats: CatType[];
        lastUpdated?: number;
      }
    ) {
      this.platformUsers[platform].catData = data;
      await this.savePlatformUsers();
    },

    /**
     * 设置平台私人 FM 数据
     */
    async setPlatformPersonalFM(
      platform: Platform,
      data: { playIndex: number; list: SongType[] }
    ) {
      this.platformUsers[platform].personalFM = data;
      await this.savePlatformUsers();
    },

    /**
     * 设置平台每日推荐数据
     */
    async setPlatformDailySongsData(
      platform: Platform,
      data: { timestamp: number | null; list: SongType[] }
    ) {
      this.platformUsers[platform].dailySongsData = data;
      await this.savePlatformUsers();
    },
    
    
    
    /**
     * 清除指定平台的用户数据
     */
    clearPlatformUserData(platform: Platform) {
      this.platformUsers[platform] = this.getDefaultPlatformUserData();
      this.savePlatformUsers();
    },
    // 清理数据库
    async deleteDB(name?: string): Promise<void> {
      try {
        if (name) {
          await localforage.dropInstance({ name });
          return;
        }
        
        // 清理所有当前数据库
        await globalDB.clear();
        await platformUsersDB.clear();
        await localDB.clear();
      } catch (error) {
        console.error("❌ 清理数据库失败:", error);
        throw error;
      }
    },
    // 获取歌单分类（平台特定）
    async getPlaylistCatList() {
      const platformStore = usePlatformStore();
      const platform = platformStore.currentPlatform;

      // 如果已有分类数据且是当前版本的（1小时内不重复请求）
      const currentData = this.platformUsers[platform]?.catData;
      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000; // 1小时的毫秒数

      if (currentData &&
          currentData.lastUpdated &&
          (now - currentData.lastUpdated) < ONE_HOUR) {
        return currentData;
      }

      // 容错处理，允许部分接口失败
      try {
        const [catsResult, hqCatsResult] = await Promise.allSettled([
          playlistCatlist(),      // 普通分类
          playlistCatlist(true)   // 精品分类（部分平台可能不支持）
        ]);

        // 处理普通分类结果
        if (catsResult.status === 'rejected') {
          console.error(`❌ 获取 ${platform} 普通分类失败:`, catsResult.reason);
          throw new Error(`获取 ${platform} 普通分类失败`);
        }

        const catsRes = catsResult.value;

        // 处理精品分类结果（如果失败则使用空数组）
        let hqCats: CatType[] = [];
        if (hqCatsResult.status === 'fulfilled') {
          hqCats = formatCategoryList(hqCatsResult.value.tags);
        } else {
          console.warn(`⚠️ ${platform} 精品分类不可用，使用空数组:`, hqCatsResult.reason?.message || hqCatsResult.reason);
        }

        const catData = {
          type: catsRes.categories,
          cats: formatCategoryList(catsRes.sub),
          hqCats,
          lastUpdated: now,
        };

        this.setPlatformCatData(platform, catData);
        return catData;
      } catch (error) {
        console.error(`❌ 获取 ${platform} 歌单分类数据失败:`, error);
        throw error;
      }
    },
  },
  // 持久化 - 仅存储必要的全局数据
  persist: {
    key: "muplayer-data",
    storage: localStorage,
    pick: [
      "searchHistory",    // 全局搜索历史
    ],
  },
});
