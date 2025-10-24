import Cookies from "js-cookie";
import { Platform } from "@/services/apiConfig";

// 各平台核心业务 Cookie 字段(只有这些字段会写入浏览器 Cookie)
const CORE_COOKIE_FIELDS: Record<Platform, string[]> = {
  [Platform.NETEASE]: ["MUSIC_U", "__csrf"],
  [Platform.QQMUSIC]: ["uin", "qm_keyst"],
};

// 获取 Cookie (仅从浏览器 Cookie 读取)
export const getCookie = (key: string) => {
  return Cookies.get(key);
};

// 移除 Cookie (仅从浏览器 Cookie 删除)
export const removeCookie = (key: string) => {
  Cookies.remove(key);
};

// 设置 Cookie - 核心字段写入浏览器,完整对象存入 IndexedDB
export const setCookies = (
  cookies: Record<string, string>,
  options?: {
    expireTime?: number;     // 过期时间戳
    platform?: Platform;     // 指定平台(用于保存到 IndexedDB)
  }
) => {
  const date = new Date();
  // 永不过期 (50年)
  date.setFullYear(date.getFullYear() + 50);
  const expires = date.toUTCString();

  // 获取当前平台 (如果没有指定则动态导入)
  const currentPlatform = options?.platform;

  // 1️⃣ 只将核心字段写入浏览器 Cookie
  if (currentPlatform && CORE_COOKIE_FIELDS[currentPlatform]) {
    const coreFields = CORE_COOKIE_FIELDS[currentPlatform];

    Object.entries(cookies).forEach(([name, value]) => {
      // 只有核心字段才写入浏览器 Cookie
      if (coreFields.includes(name)) {
        console.info(`🍪 Setting core cookie: ${name}`);

        // 添加 Cookie 安全属性
        const cookieAttributes = [
          `${name}=${value}`,
          `expires=${expires}`,
          `path=/`,
          `SameSite=Lax`,  // 防止 CSRF 攻击，允许正常的跨站导航
        ];

        document.cookie = cookieAttributes.join("; ");
      } else {
        console.debug(`⏭️ Skipping non-core cookie: ${name}`);
      }
    });
  } else {
    // 如果没有指定平台,保持原有行为(写入所有字段)
    Object.entries(cookies).forEach(([name, value]) => {
      console.info(`🍪 Setting cookie (no platform): ${name}`);
      const cookieAttributes = [
        `${name}=${value}`,
        `expires=${expires}`,
        `path=/`,
        `SameSite=Lax`,
      ];
      document.cookie = cookieAttributes.join("; ");
    });
  }

  // 保存完整 cookies 对象和过期时间到 platformUsers (IndexedDB)
  if (currentPlatform) {
    try {
      // 动态导入避免循环依赖
      import("@/stores").then(({ useDataStore }) => {
        const dataStore = useDataStore();
        const platformData = dataStore.platformUsers[currentPlatform];

        // 保存完整 cookies 对象到 IndexedDB
        platformData.cookies = cookies;
        console.log(`✅ ${currentPlatform} 完整 cookies 已保存到 IndexedDB (${Object.keys(cookies).length} 个字段)`);

        // 保存过期时间（自动处理秒级/毫秒级时间戳）
        if (options?.expireTime) {
          // 如果是秒级时间戳（小于 10000000000，即 2286年11月），转换为毫秒
          const expireTime = options.expireTime < 10000000000 
            ? options.expireTime * 1000 
            : options.expireTime;
          platformData.loginExpireTime = expireTime;
          console.log(`✅ ${currentPlatform} 登录过期时间已设置: ${new Date(expireTime).toLocaleString()}`);
        }

        // 持久化到 IndexedDB
        dataStore.savePlatformUsers();
      });
    } catch (error) {
      console.error("❌ 持久化 cookies 到 IndexedDB 失败:", error);
    }
  } else if (options?.expireTime) {

    try {
      import("@/stores").then(({ useDataStore }) => {
        import("@/stores/platform").then(({ usePlatformStore }) => {
          const dataStore = useDataStore();
          const platformStore = usePlatformStore();
          const platform = platformStore.currentPlatform;

          const platformData = dataStore.platformUsers[platform];

          if (options.expireTime) {
            // 如果是秒级时间戳（小于 10000000000，即 2286年11月），转换为毫秒
            const expireTime = options.expireTime < 10000000000 
              ? options.expireTime * 1000 
              : options.expireTime;
            platformData.loginExpireTime = expireTime;
            console.log(`✅ ${platform} 登录过期时间已设置: ${new Date(expireTime).toLocaleString()}`);
          }

          dataStore.savePlatformUsers();
        });
      });
    } catch (error) {
      console.error("❌ 持久化过期时间失败:", error);
    }
  }
};
