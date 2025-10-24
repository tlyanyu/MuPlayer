import { apiClient, RequestOptions } from "@/services/apiClient";

// 搜索类型枚举
export enum SearchTypes {
  Single = 1,
  Album = 10,
  Artist = 100,
  Playlist = 1000,
  User = 1002,
  Mv = 1004,
  Lyrics = 1006,
  Radio = 1009,
  Video = 1014,
  All = 1018,
  Audio = 2000,
}

/**
 * 热搜
 */
export const searchHot = () => {
  return apiClient.get(
    "/search/hot/detail",
    {},
  );
};

/**
 * 搜索建议
 * @param {string} keywords - 搜索关键词
 * @param {boolean} mobile - 是否移动端
 */
export const searchSuggest = (keywords: string, mobile: boolean = false) => {
  return apiClient.get(
    "/search/suggest",
    {
      keywords,
      ...(mobile && { type: "mobile" }),
    },
  );
};

/**
 * 搜索多重匹配
 * @param {string} keywords - 搜索关键词
 */
export const searchMultimatch = (keywords: string) => {
  return apiClient.get(
    "/search/multimatch",
    { keywords },
  );
};

/**
 * 默认搜索关键词
 */
export const searchDefault = () => {
  return apiClient.get(
    "/search/default",
    { timestamp: Date.now() },
  );
};

/**
 * 搜索结果
 * @param keywords 搜索关键词
 * @param limit 返回数量
 * @param offset 偏移量
 * @param type 搜索类型
 * @param options 请求选项
 */
export const searchResult = async (
  keywords: string,
  limit: number = 30,
  offset = 0,
  type: SearchTypes = SearchTypes.All,
  options?: RequestOptions,
) => {
  return apiClient.get(
    "/cloudsearch",
    {
      keywords,
      limit,
      offset,
      type,
    },
    options,
  );
};
