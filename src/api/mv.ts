import { apiClient, RequestOptions } from "@/services/apiClient";

/**
 * MV - 置顶推荐
 * @param options - 请求选项
 */
export const mvFocus = (options?: RequestOptions) => {
  return apiClient.get("/mv/focus", {}, options);
};

/**
 * MV - 最新
 * @param limit 返回数量，默认20
 * @param offset 偏移数量，默认0
 * @param options - 请求选项
 */
export const mvNew = (limit: number = 20, offset: number = 0, options?: RequestOptions) => {
  return apiClient.get("/mv/new", { limit, offset }, options);
};

/**
 * MV - 热门
 * @param limit 返回数量，默认20
 * @param offset 偏移数量，默认0
 * @param options - 请求选项
 */
export const mvHot = (limit: number = 20, offset: number = 0, options?: RequestOptions) => {
  return apiClient.get("/mv/hot", { limit, offset }, options);
};

/**
 * MV - 合集
 * @param limit 返回数量，默认20
 * @param offset 偏移数量，默认0
 * @param options - 请求选项
 */
export const mvCollection = (limit: number = 20, offset: number = 0, options?: RequestOptions) => {
  return apiClient.get("/mv/collection", { limit, offset }, options);
};

/**
 * MV - 全部（个性推荐）
 * @param area - 地区，默认为全部
 * @param type - 类型，默认为全部
 * @param order - 排序，默认为最热
 * @param limit - 返回数量，默认20
 * @param offset - 偏移数量，默认0
 * @param options - 请求选项
 */
export const mvAll = (
  area: string = "全部",
  type: string = "全部",
  order: string = "最热",
  limit: number = 20,
  offset: number = 0,
  options?: RequestOptions,
) => {
  return apiClient.get("/mv/all", { area, type, order, limit, offset }, options);
};

/**
 * MV - 排行榜
 * @param area - 地区类型 (0:总榜, 1:内地, 2:港台, 3:欧美, 4:韩国, 5:日本)
 * @param limit - 返回数量，默认100
 * @param offset - 偏移数量，默认0
 * @param options - 请求选项
 */
export const mvRank = (
  area: number = 0,
  limit: number = 100,
  offset: number = 0,
  options?: RequestOptions,
) => {
  return apiClient.get("/mv/rank", { area, limit, offset }, options);
};

/**
 * QQ音乐MV分类列表
 * @param area - 地区ID (16=内地, 17=港台, 18=欧美, 19=韩国, 20=日本, 15=全部)
 * @param type - 类型ID (7=全部, 8=MV, 9=现场, 10=翻唱, 11=舞蹈, 12=影视, 13=综艺, 14=儿歌)
 * @param order - 排序方式 (0=最热, 1=最新)
 * @param limit - 每页数量，默认20
 * @param offset - 分页起始位置，默认0
 * @param options - 请求选项
 * @returns {mvs: [], total: number}
 */
export const mvList = (
  area: number = 15,
  type: number = 7,
  order: number = 0,
  limit: number = 20,
  offset: number = 0,
  options?: RequestOptions,
) => {
  return apiClient.get("/mv/list", { area, type, order, limit, offset }, options);
};
