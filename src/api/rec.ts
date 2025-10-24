import idMeta from "@/assets/data/idMeta.json";
import { apiClient, RequestOptions } from "@/services/apiClient";

/**
 * 每日推荐 - 需要登录
 * @param {string} [type] - 推荐类型，songs 日推歌曲 / resource 推荐歌单
 * @param options 请求选项
 */
export const dailyRecommend = (type: "songs" | "resource" = "songs", options?: RequestOptions) => {
  return apiClient.get(
    `/recommend/${type}`,
    { timestamp: Date.now() },
    options,
  );
};

/**
 * 推荐内容
 * @param {string} [type] - 推荐类型
 * @param {number} [limit=50] - 返回结果的数量
 * @param options - 请求选项
 */
export const personalized = (
  type: "playlist" | "mv" | "newsong" | "djprogram" | "privatecontent" = "playlist",
  limit: number = 50,
  options?: RequestOptions,
) => {
  const url = type === "playlist" ? "/personalized" : `/personalized/${type}`;

  return apiClient.get(
    url,
    { limit },
    options,
  );
};

/**
 * 雷达歌单
 */
export const radarPlaylist = async () => {
  const allRadar = idMeta.radarPlaylist.map((playlist) => {
    return apiClient.get(
      "/playlist/detail",
      { id: playlist.id },
    );
  });
  const result = await Promise.allSettled(allRadar);
  // 只返回成功的结果,过滤掉失败的请求
  return result
    .filter((res): res is PromiseFulfilledResult<any> => res.status === 'fulfilled')
    .map((res) => res.value.playlist)
    .filter(Boolean); // 过滤掉可能的null/undefined
};

/**
 * 获取热门歌手
 * @param limit - 返回数量，默认为 10
 * @param options - 请求选项
 */
export const topArtists = async (limit: number = 10, options?: RequestOptions) => {
  return apiClient.get(
    "/top/artists",
    { limit },
    options,
  );
};

/**
 * 新歌速递
 * @param {number} type - 全部:0 / 华语:7 / 欧美:96 / 韩国:16 / 日本:8
 * @param options - 请求选项
 */
export const newSongs = async (type: 0 | 7 | 96 | 16 | 8 = 0, options?: RequestOptions) => {
  return apiClient.get(
    "/top/song",
    { type },
    options,
  );
};

/**
 * 最新专辑
 * @param options - 请求选项
 */
export const newAlbums = async (options?: RequestOptions) => {
  return apiClient.get(
    "/album/new",
    {},
    options,
  );
};

/**
 * 新碟上架 - 全部
 * @param {string} [cat="ALL"] - ALL:全部 / ZH:华语 / EA:欧美 / KR:韩国 / JP:日本
 * @param {number} [limit=20] - 返回数量，默认20
 * @param {number} [offset=0] - 偏移数量，默认0
 * @param options - 请求选项
 */
export const newAlbumsAll = (
  cat: "ALL" | "ZH" | "EA" | "KR" | "JP" = "ALL",
  limit: number = 20,
  offset: number = 0,
  options?: RequestOptions,
) => {
  return apiClient.get(
    "/album/new",
    { cat, limit, offset },
    options,
  );
};

/**
 * 私人 FM
 * @param options - 请求选项
 */
export const personalFm = (options?: RequestOptions) => {
  return apiClient.get(
    "/personal/fm",
    { timestamp: Date.now() },
    options,
  );
};

/**
 * 私人 FM - 垃圾桶
 * @param {number} id - 歌曲id
 * @param options - 请求选项
 */
export const personalFmToTrash = (id: number, options?: RequestOptions) => {
  return apiClient.get(
    "/fm/trash",
    { id, timestamp: Date.now() },
    options,
  );
};
