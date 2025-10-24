import { apiClient, RequestOptions } from "@/services/apiClient";

/**
 * 获取用户账号信息
 * @param options 请求选项
 */
export const userAccount = (options?: RequestOptions) => {
  return apiClient.get(
    "/user/account",
    {
      timestamp: Date.now(),
    },
    options,
  );
};

/**
 * 获取用户详情
 * @param uid 用户 ID
 * @param options 请求选项
 */
export const userDetail = (uid: number, options?: RequestOptions) => {
  return apiClient.get(
    "/user/detail",
    {
      uid,
      timestamp: Date.now(),
    },
    options,
  );
};

/**
 * 获取用户订阅信息，包括歌单、收藏、MV 和 DJ 数量
 * @param options 请求选项
 */
export const userSubcount = (options?: RequestOptions) => {
  return apiClient.get(
    "/user/subcount",
    {
      timestamp: Date.now(),
    },
    options,
  );
};

/**
 * 获取用户歌单
 * @param limit - 返回数量
 * @param offset - 偏移数量
 * @param uid - 用户ID
 * @param options 请求选项
 */
export const userPlaylist = (
  limit: number = 50,
  offset: number = 0,
  uid: number,
  options?: RequestOptions,
) => {
  return apiClient.get(
    "/user/playlist",
    {
      uid,
      limit,
      offset,
      timestamp: Date.now(),
    },
    options,
  );
};

/**
 * 获取用户收藏专辑
 * @param limit - 返回数量
 * @param offset - 偏移数量
 * @param options 请求选项
 */
export const userAlbum = (limit: number = 50, offset: number = 0, options?: RequestOptions) => {
  return apiClient.get(
    "/album/sublist",
    {
      limit,
      offset,
      timestamp: Date.now(),
    },
    options,
  );
};

/**
 * 获取用户收藏歌手
 * @param limit - 返回数量
 * @param offset - 偏移数量
 * @param options 请求选项
 */
export const userArtist = (limit: number = 50, offset: number = 0, options?: RequestOptions) => {
  return apiClient.get(
    "/artist/sublist",
    {
      limit,
      offset,
      timestamp: Date.now(),
    },
    options,
  );
};

/**
 * 获取用户收藏 MV
 * @param options 请求选项
 */
export const userMv = (options?: RequestOptions) => {
  return apiClient.get(
    "/mv/sublist",
    { timestamp: Date.now() },
    options,
  );
};

/**
 * 获取用户收藏电台
 * @param options 请求选项
 */
export const userDj = (options?: RequestOptions) => {
  return apiClient.get(
    "/dj/sublist",
    { timestamp: Date.now() },
    options,
  );
};

/**
 * 获取用户喜欢的音乐
 * @param uid - 用户ID
 * @param options 请求选项
 */
export const userLike = (uid: number, options?: RequestOptions) => {
  return apiClient.get(
    "/likelist",
    {
      uid,
      timestamp: Date.now(),
    },
    options,
  );
};

/**
 * 听歌打卡，待实现
 * @param id - 歌曲ID
 * @param sourceid - 来源ID
 * @param time - 时间
 */
export const scrobble = (
  id: number,
  sourceid?: number,
  time?: number,
) => {
  return apiClient.get(
    "/scrobble",
    {
      id,
      sourceid,
      time,
      timestamp: Date.now(),
    },
  );
};

/**
 * 每日签到，待实现
 * @param type - 签到类型
 */
export const dailySignin = (type: 0 | 1 = 0) => {
  return apiClient.get(
    "/daily_signin",
    {
      type,
      timestamp: Date.now(),
    },
  );
};
