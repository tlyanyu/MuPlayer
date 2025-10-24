import { apiClient } from "@/services/apiClient";

/**
 * 获取电台 - 分类
 */
export const radioCatList = () => {
  return apiClient.get("/dj/catelist", {});
};

/**
 * 获取电台 - 推荐
 */
export const radioRecommend = () => {
  return apiClient.get("/dj/recommend", {});
};

/**
 * 电台 - 新晋电台榜/热门电台榜
 * @param type "new" | "hot" - new: 新晋电台榜 / hot: 热门电台榜
 * @param limit 返回数量
 * @param offset 偏移数量
 */
export const radioToplist = (type: "new" | "hot", limit: number = 20, offset: number = 0) => {
  return apiClient.get("/dj/toplist", { type, limit, offset });
};

/**
 * 电台个性推荐
 */
export const radioPersonalized = () => {
  return apiClient.get("/dj/personalize/recommend", {});
};

/**
 * 获取电台 - 推荐类型
 */
export const radioTypes = () => {
  return apiClient.get("/dj/category/recommend", {});
};

/**
 * 私人 DJ
 */
export const radioPersonalDj = () => {
  return apiClient.get("/aidj/content/rcmd", {});
};

/**
 * 电台 - 类别热门电台
 * @param cateId 类别 id,可通过 /dj/category/recommend 接口获取
 * @param limit 返回数量
 * @param offset 偏移数量
 */
export const radioCatHot = (cateId: number, limit: number = 50, offset: number = 0) => {
  return apiClient.get("/dj/radio/hot", { cateId, limit, offset });
};

/**
 * 电台 - 分类推荐
 * @param type 电台类型 , 数字 , 可通过/dj/catelist获取 , 对应关系为 id 对应 此接口的 type, name 对应类型
 * @param useMultiPlatform - 是否使用多平台 API
 */
export const radioCatRecommend = (type: number) => {
  return apiClient.get("/dj/recommend/type", { type });
};

/**
 * 电台 - 详情
 * @param rid 电台 id
 */
export const radioDetail = (rid: number) => {
  return apiClient.get("/dj/detail", { rid });
};

/**
 * 电台 - 全部节目
 * @param rid 电台 id
 * @param limit 返回数量
 * @param offset 偏移数量
 */
export const radioAllProgram = (rid: number, limit: number = 50, offset: number = 0) => {
  return apiClient.get("/dj/program", { rid, limit, offset });
};

/**
 * 电台 - 节目详情
 * @param id 节目 id
 */
export const radioProgramDetail = (id: number) => {
  return apiClient.get("/dj/program/detail", { id });
};

/**
 * 电台 - 订阅
 * @param rid 电台 id
 * @param t 订阅类型 1:订阅 0:取消订阅
 */
export const radioSub = (rid: number, t: number = 1) => {
  return apiClient.get("/dj/sub", { rid, t, timestamp: Date.now() });
};
