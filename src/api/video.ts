import { apiClient, RequestOptions } from "@/services/apiClient";

/**
 * 视频详情
 * @param id - 视频/MV ID（网易云为 number，QQ音乐为 string）
 * @param type - 类型（mv 或 video）
 * @param options - 请求选项
 */
export const videoDetail = (
  id: number | string, 
  type: "mv" | "video",
  options?: RequestOptions
) => {
  return apiClient.get(
    `/${type}/detail`,
    type === "mv" ? { mvid: id } : { id },
    options
  );
};

/**
 * 视频地址
 * @param id - 视频/MV ID（网易云为 number，QQ音乐为 string）
 * @param type - 类型（mv 或 video）
 * @param r - 分辨率
 * @param options - 请求选项
 */
export const videoUrl = (
  id: number | string, 
  type: "mv" | "video", 
  r: number,
  options?: RequestOptions
) => {
  return apiClient.get(`/${type}/url`, { id, r }, options);
};

/**
 * 视频互动数据
 * @param id - 视频/MV ID（网易云为 number，QQ音乐为 string）
 * @param type - 类型（mv 或 video）
 * @param options - 请求选项
 */
export const videoDetailInfo = (
  id: number | string, 
  type: "mv" | "video",
  options?: RequestOptions
) => {
  return apiClient.get(
    `/${type}/detail/info`,
    type === "mv" ? { mvid: id } : { vid: id },
    options
  );
};

/**
 * 全部 mv
 * @param area - 地区, 可选值为全部, 内地, 港台, 欧美, 日本, 韩国, 默认为全部
 * @param type - 类型, 可选值为全部, 官方版, 原生, 现场版, 网易出品, 默认为全部
 * @param order - 排序, 可选值为上升最快, 最热, 最新, 默认为上升最快
 * @param limit - 返回数量，默认12
 * @param offset - 偏移数量，默认0
 */
export const allMv = (
  area: "全部" | "内地" | "港台" | "欧美" | "日本" | "韩国",
  type: "全部" | "官方版" | "原生" | "现场版" | "网易出品",
  order: "上升最快" | "最热" | "最新",
  limit: number = 12,
  offset: number = 0,
) => {
  return apiClient.get("/mv/all", { area, type, order, limit, offset });
};
