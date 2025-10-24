import { apiClient, RequestOptions } from "@/services/apiClient";

/**
 * 获取歌单详情
 * @param id 歌单 ID
 * @param options 请求选项
 */
export const playlistDetail = async (id: number, options?: RequestOptions) => {
  return apiClient.get(
    "/playlist/detail",
    {
      id,
      s: 0,
      noCookie: true,
      timestamp: Date.now(),
    },
    options,
  );
};

/**
 * 获取歌单所有歌曲
 * @param id 歌单 ID
 * @param limit 返回数量
 * @param offset 偏移量
 * @param options 请求选项
 */
export const playlistAllSongs = async (
  id: number,
  limit: number = 50,
  offset: number = 0,
  options?: RequestOptions,
) => {
  return apiClient.get(
    "/playlist/track/all",
    { id, limit, offset, timestamp: Date.now() },
    options,
  );
};

/**
 * 获取心动模式播放列表
 * @param {number} id - 歌曲 id
 * @param {number} pid - 歌单 id
 * @param {number} sid - 要开始播放的歌曲的 id
 * @param options - 请求选项
 */
export const heartRateList = (id: number, pid: number, sid?: number, options?: RequestOptions) => {
  return apiClient.get(
    "/playmode/intelligence/list",
    { id, pid, sid, timestamp: Date.now() },
    options,
  );
};

/**
 * 获取歌单分类信息
 * @param hq - 是否精品歌单
 */
export const playlistCatlist = (hq: boolean = false) => {
  const url = `/playlist/${hq ? "highquality/tags" : "catlist"}`;
  
  return apiClient.get(
    url,
    { hq, timestamp: Date.now() },
  );
};

/**
 * 获取所有分类歌单
 * @param cat 歌单分类
 * @param {number} [limit=50] - 返回数量，默认 50
 * @param {number} [offset=0] - 偏移数量，默认 0
 * @param hq 是否精品歌单
 * @param before 分页参数,取上一页最后一个歌单的 updateTime 获取下一页数据
 * @returns
 */
export const allCatlistPlaylist = (
  cat: string,
  limit: number = 50,
  offset: number = 0,
  hq: boolean = false,
  before?: number,
) => {
  const url = hq ? "/top/playlist/highquality" : "/top/playlist";

  return apiClient.get(
    url,
    { cat, limit, offset, ...(hq && { before }) },
  );
};

/**
 * 新建歌单
 * @param name - 歌单名称
 * @param privacy - 是否隐私
 * @param type - 歌单类型
 */
export const createPlaylist = (
  name: string,
  privacy: boolean = false,
  type: "NORMAL" | "VIDEO" | "SHARED" = "NORMAL",
) => {
  return apiClient.get(
    "/playlist/create",
    { name, privacy: privacy ? "10" : null, type, timestamp: Date.now() },
  );
};

/**
 * 删除歌单
 * @param id - 歌单ID
 */
export const deletePlaylist = (id: number) => {
  return apiClient.get(
    "/playlist/delete",
    { id, timestamp: Date.now() },
  );
};

/**
 * 更新歌单信息
 * @param id - 歌单ID
 * @param name - 歌单名称
 * @param desc - 歌单描述
 * @param tags - 歌单标签
 */
export const updatePlaylist = (
  id: number,
  name: string,
  desc: string,
  tags: string[],
) => {
  return apiClient.get(
    "/playlist/update",
    { id, name, desc, tags: tags.join(";"), timestamp: Date.now() },
  );
};

/**
 * 公开隐私歌单
 * @param id - 歌单ID
 */
export const updatePlaylistPrivacy = (id: number) => {
  return apiClient.get(
    "/playlist/privacy",
    { id, timestamp: Date.now() },
  );
};

/**
 * 向歌单中添加或删除歌曲
 * @param {number} pid - 歌单 id
 * @param {Array<number>} tracks - 要添加或删除的歌曲id数组
 * @param {string} [op="add"] - 操作类型，可选，默认为添加
 * @param options - 请求选项
 */
export const playlistTracks = (
  pid: number,
  tracks: number[],
  op: "add" | "del" = "add",
  options?: RequestOptions,
) => {
  return apiClient.post(
    "/playlist/tracks",
    { pid, tracks: tracks.join(","), op },
    { timestamp: Date.now() },
    options,
  );
};

/**
 * 收藏/取消收藏歌单
 * @param {number} id - 歌单id
 * @param {number} t - 操作类型，1为收藏，2为取消收藏
 * @param options - 请求选项
 */
export const likePlaylist = (id: number, t: number = 1 | 2, options?: RequestOptions) => {
  return apiClient.get(
    "/playlist/subscribe",
    { id, t, timestamp: Date.now() },
    options,
  );
};

/**
 * 获取专辑排行榜数据
 * @param {boolean} [detail=true] 是否获取详情数据，默认为 true
 */
export const topPlaylist = () => {
  const url = "/toplist/detail/v2";

  return apiClient.get(
    url,
    {},
  );
};
