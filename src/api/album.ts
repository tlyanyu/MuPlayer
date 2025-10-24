import { apiClient, RequestOptions } from "@/services/apiClient";

/**
 * 获取专辑详情
 * @param {number} id - 专辑id
 * @param options - 请求选项
 */
export const albumDetail = (id: number, options?: RequestOptions) => {
  return apiClient.get(
    "/album",
    { id },
    options
  );
};

/**
 * 收藏/取消收藏专辑
 * @param {number} id - 专辑id
 * @param {number} t - 操作类型，1 为收藏，其他为取消收藏
 * @param options - 请求选项
 */
export const likeAlbum = (id: number, t: number = 1 | 2, options?: RequestOptions) => {
  return apiClient.get(
    "/album/sub",
    {
      id,
      t,
      timestamp: new Date().getTime(),
    },
    options,
  );
};
