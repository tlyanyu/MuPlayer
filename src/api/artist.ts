import { apiClient, RequestOptions } from "@/services/apiClient";

/**
 * 歌手分类列表
 * @param {number} type - 歌手类型（-1:全部 1:男歌手 2:女歌手 3:乐队）
 * @param {number} area - 歌手区域（-1:全部 7:华语 96:欧美 8:日本 16:韩国 0:其他）
 * @param {number|string} initial - 首字母索引查找参数
 * @param {number} [offset=0] - 偏移数量，默认 0
 * @param {number} [limit=80] - 返回数量，默认 80
 * @param options - 请求选项
 */
export const artistTypeList = (
  type: number = -1,
  area: number = -1,
  initial: number | string = -1,
  offset: number = 0,
  limit: number = 80,
  options?: RequestOptions
) => {
  return apiClient.get(
    "/artist/list",
    {
      type,
      area,
      initial,
      offset,
      limit,
    },
    options
  );
};

/**
 * 获取歌手详情
 * @param {number|string} id - 歌手id（网易云为 number，QQ音乐为 string）
 * @param options - 请求选项
 */
export const artistDetail = (id: number | string, options?: RequestOptions) => {
  return apiClient.get(
    "/artist/detail",
    { id },
    options
  );
};

/**
 * 获取歌手部分信息和热门歌曲
 * @param {number|string} id - 歌手id（网易云为 number，QQ音乐为 string）
 * @param options - 请求选项
 */
export const artistHotSongs = (id: number | string, options?: RequestOptions) => {
  return apiClient.get(
    "/artists",
    { id },
    options
  );
};

/**
 * 获取歌手全部歌曲
 * @param {number|string} id - 歌手id（网易云为 number，QQ音乐为 string）
 * @param {number} [limit=50] - 返回数量，默认50
 * @param {number} [offset=0] - 偏移数量，默认0
 * @param {string} order - hot: 热门, time: 时间
 * @param options - 请求选项
 */
export const artistAllSongs = (
  id: number | string,
  limit: number = 50,
  offset: number = 0,
  order: "hot" | "time" = "hot",
  options?: RequestOptions
) => {
  return apiClient.get(
    "/artist/songs",
    { id, limit, offset, order },
    options
  );
};

/**
 * 获取歌手专辑
 * @param {number|string} id - 歌手id（网易云为 number，QQ音乐为 string）
 * @param {number} [limit=50] - 返回数量，默认50
 * @param {number} [offset=0] - 偏移数量，默认0
 * @param options - 请求选项
 */
export const artistAblums = (
  id: number | string,
  limit: number = 50,
  offset: number = 0,
  options?: RequestOptions
) => {
  return apiClient.get(
    "/artist/album",
    { id, limit, offset },
    options
  );
};

/**
 * 获取歌手视频
 * @param {number|string} id - 歌手id（网易云为 number，QQ音乐为 string）
 * @param {number} [limit=50] - 返回数量，默认50
 * @param {number} [offset=0] - 偏移数量，默认0
 * @param options - 请求选项
 */
export const artistVideos = (
  id: number | string,
  limit: number = 50,
  offset: number = 0,
  options?: RequestOptions
) => {
  return apiClient.get(
    "/artist/mv",
    { id, limit, offset },
    options
  );
};

/**
 * 收藏/取消收藏歌手
 * @param {number|string} id - 歌手id（网易云为 number，QQ音乐为 string）
 * @param {number} t - 操作类型，1 为收藏，其他为取消收藏
 * @param options - 请求选项
 */
export const likeArtist = (id: number | string, t: number = 1 | 2, options?: RequestOptions) => {
  return apiClient.get(
    "/artist/sub",
    { id, t, timestamp: new Date().getTime() },
    options,
  );
};

/**
 * 搜索歌手，待实现，待修复
 * @param {string} keyword - 关键词
 * @param {number} [limit=10] - 返回数量
 */
export const searchArtist = (keyword: string, limit: number = 10) => {
  return apiClient.get(
    "/ugc/artist/search",
    { keyword, limit },
  );
};
