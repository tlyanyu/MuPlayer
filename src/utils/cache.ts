type StorageType = "localStorage" | "sessionStorage";

interface CacheOptions {
  key: string;
  time: number; // 缓存时长，单位为分钟
  storage?: StorageType; // 默认为 sessionStorage
  useCache?: boolean; // 是否使用缓存，默认为 true
  validator?: (data: any) => boolean; // 缓存数据验证器，返回false则重新请求
}

/**
 * 获取接口请求缓存
 * @template T
 * @param {(...args: any[]) => Promise<T>} promiseFunc - 异步请求函数
 * @param {Object} options - 缓存选项
 * @param {string} options.key - 用于存储和检索缓存数据的键值
 * @param {number} options.time - 缓存有效时间（分钟）。如果为 -1，则表示永久有效
 * @param {string} [options.storage="sessionStorage"] - 储存方式，默认为 `sessionStorage`，可选 `localStorage`
 * @param {Function} [options.validator] - 缓存数据验证器，返回false则重新请求
 * @param {...any} args - 传递的参数
 * @returns {Promise<T>}
 * @returns
 */
export const getCacheData = async <T>(
  promiseFunc: (...args: any[]) => Promise<T>,
  options: CacheOptions,
  ...args: any[]
): Promise<T> => {
  const { key, time, storage = "sessionStorage", useCache = true, validator } = options;
  // 储存方式
  const storageObj = window[storage];
  try {
    // 获取缓存数据
    const cachedData = storageObj.getItem(key);
    if (cachedData && useCache) {
      // 判断缓存是否过期
      const { value, expiry } = JSON.parse(cachedData);

      // 验证缓存数据有效性
      if (validator && !validator(value)) {
        console.log(`⚠️ Cached data validation failed for key: ${key}, refetching...`);
        storageObj.removeItem(key); // 清除无效缓存
      } else if (expiry === 0 || new Date().getTime() < expiry) {
        console.log(`✅ Cached data found for key: ${key}`, value);
        return value;
      }
    }
    // 请求数据
    const result = await promiseFunc(...args);
    const expiry = time === -1 ? -1 : new Date().getTime() + time * 60 * 1000;
    // 存储数据
    storageObj.setItem(key, JSON.stringify({ value: result, expiry }));
    return result;
  } catch (error) {
    console.error(`❌ Error in getCacheData: ${error}`);
    throw error;
  }
};
