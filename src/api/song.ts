import { songLevelData } from "@/utils/meta";
import { apiClient, RequestOptions } from "@/services/apiClient";

/**
 * 获取歌曲详情
 * @param ids 歌曲 ID 或 ID 数组
 * @param options 请求选项
 */
export const songDetail = async (ids: number | number[], options?: RequestOptions) => {
  const idStr = Array.isArray(ids) ? ids.join(",") : ids.toString();
  return apiClient.post(
    "/song/detail",
    { ids: idStr },
    { timestamp: Date.now() },
    options,
  );
};

/**
 * 获取歌曲音质详情
 * @param id - 歌曲 ID
 * @param options 请求选项
 */
export const songQuality = (id: number, options?: RequestOptions) => {
  return apiClient.get("/song/music/detail", { id }, options);
};

/**
 * 获取歌曲 URL
 * @param id 歌曲 ID
 * @param level 音质等级
 * @param options 请求选项
 */
export const songUrl = async (
  id: number,
  level:
    | "standard"
    | "higher"
    | "exhigh"
    | "lossless"
    | "hires"
    | "jyeffect"
    | "sky"
    | "jymaster" = "exhigh",
  options?: RequestOptions,
) => {
  return apiClient.get(
    "/song/url/v1",
    {
      id,
      level,
      timestamp: Date.now(),
    },
    options,
  );
};

// 获取解锁歌曲 URL, 待实现
export const unlockSongUrl = (id: number, keyword: string, server: "netease" | "kuwo") => {
  const params = server === "netease" ? { id } : { keyword };
  return apiClient.post(`/unblock/${server}`, params);
};

/**
 * 获取歌曲歌词
 * @param id 歌曲 ID
 * @param options 请求选项
 */
export const songLyric = async (
  id: number,
  options?: RequestOptions,
) => {
  return apiClient.get(
    "/lyric/new",
    { id },
    options,
  );
};

/**
 * 获取歌曲下载链接
 * @param id 音乐 id
 * @param level 播放音质等级, 分为 standard => 标准,higher => 较高, exhigh=>极高, lossless=>无损, hires=>Hi-Res, jyeffect => 高清环绕声, sky => 沉浸环绕声, `dolby` => `杜比全景声`, jymaster => 超清母带
 * @param options 请求选项
 */
export const songDownloadUrl = (id: number, level: keyof typeof songLevelData = "h", options?: RequestOptions) => {
  // 获取对应音质
  const levelName = songLevelData[level].level;

  return apiClient.get(
    "/song/download/url/v1",
    { id, level: levelName, timestamp: Date.now() },
    options,
  );
};

/**
 * 喜欢歌曲
 * @param id - 歌曲 ID
 * @param like - true: 喜欢, false: 取消喜欢
 * @param options 请求选项
 */
export const likeSong = (id: number, like: boolean = true, options?: RequestOptions) => {
  return apiClient.get(
    "/like",
    { id, like, timestamp: Date.now() },
    options, 
  );
};

/**
 * 本地歌曲文件匹配
 * @param title - 文件的标题信息，是文件属性里的标题属性，并非文件名
 * @param album - 文件的专辑信息
 * @param artist - 文件的艺术家信息
 * @param duration - 文件的时长，单位为秒
 * @param md5 - 文件的 md5
 * @param options 请求选项
 */
export const matchSong = (
  title: string,
  artist: string,
  album: string,
  duration: number,
  md5: string,
  options?: RequestOptions,
) => {
  return apiClient.get(
    "/search/match",
    { title, artist, album, duration, md5 },
    options,
  );
};

/**
 * 歌曲动态封面
 * @param id - 歌曲 id
 * @param options 请求选项
 */
export const songDynamicCover = (
  id: number, 
  options?: RequestOptions,
) => {
  return apiClient.get("/song/dynamic/cover", { id }, options);
};

/**
 * 副歌时间
 * @param id 歌曲 ID
 * @param options 请求选项
 */
export const songChorus = async (
  id: number,
  options?: RequestOptions,
) => {
  return apiClient.get(
    "/song/chorus",
    { id, timestamp: Date.now() },
    options,
  );
};
