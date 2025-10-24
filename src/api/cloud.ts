import { apiClient } from "@/services/apiClient";

/**
 * 获取云盘数据
 * @param limit - 返回数量
 * @param offset - 偏移数量
 */
export const userCloud = (limit: number = 50, offset: number = 0) => {
  return apiClient.get(
    "/user/cloud",
    {
      limit,
      offset,
      timestamp: Date.now(),
    },
  );
};

/**
 * 云盘歌曲删除
 * @param id - 歌曲ID
 */
export const deleteCloudSong = (id: number) => {
  return apiClient.get(
    "/user/cloud/del",
    {
      id,
      timestamp: Date.now(),
    },
  );
};

/**
 * 云盘歌曲信息匹配纠正
 * @param {string} uid - 用户 id
 * @param {string} sid - 原歌曲 id
 * @param {string} asid - 要匹配的歌曲 id
 */
export const matchCloudSong = (uid: number, sid: number, asid: number) => {
  return apiClient.get(
    "/cloud/match",
    {
      uid,
      sid,
      asid,
      timestamp: Date.now(),
    },
  );
};

/**
 * 上传歌曲到云盘，暂不支持
 * @param file - 要上传的音乐文件
 */
export const uploadCloudSong = (file: File) => {
  const formData = new FormData();
  formData.append("songFile", file);

  return apiClient.post(
    "/cloud",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timestamp: Date.now(),
    },
  );
};

/**
 * 云盘导入歌曲
 * @param song - 歌曲名称
 * @param fileType - 歌曲格式
 * @param fileSize - 歌曲大小
 * @param bitrate - 歌曲比特率
 * @param md5 - 歌曲 md5
 * @param id - 歌曲 id（可选）
 * @param artist - 歌手（可选）
 * @param album - 专辑（可选）
 */
export const importCloudSong = (
  song: string,
  fileType: string,
  fileSize: number,
  bitrate: number,
  md5: string,
  id?: number,
  artist?: string,
  album?: string,
) => {
  const params = {
    id,
    song,
    fileType,
    fileSize,
    bitrate,
    md5,
    artist,
    album,
    timestamp: Date.now(),
  };

  return apiClient.post("/cloud/import", params, {});
};
