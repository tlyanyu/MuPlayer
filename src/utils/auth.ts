import { removeCookie, setCookies } from "./cookie";
import type { UserLikeDataType, CoverType, ArtistType, SongType } from "@/types/main";
import {
  userDetail,
  userSubcount,
  userLike,
  userDj,
  userMv,
  userArtist,
  userAlbum,
  userPlaylist,
} from "@/api/user";
import { likeSong } from "@/api/song";
import { formatCoverList, formatArtistsList, formatSongsList } from "@/utils/format";
import { useDataStore } from "@/stores";
import { refreshLogin } from "@/api/login";
import { debounce, isFunction } from "lodash-es";
import { isBeforeSixAM } from "./time";
import { dailyRecommend } from "@/api/rec";
import { isElectron } from "./helper";
import { likePlaylist, playlistTracks } from "@/api/playlist";
import { likeArtist } from "@/api/artist";
import { likeAlbum } from "@/api/album";
import { radioSub } from "@/api/radio";
import { usePlatformStore } from "@/stores/platform";
import { Platform, getPlatformDisplayName } from "@/services/apiConfig";

/**
 * 用户是否登录
 * @returns 0 - 未登录 / 1 - 正常登录
 */
export const isLogin = (): 0 | 1 => {
  const dataStore = useDataStore();
  return dataStore.currentLoginStatus ? 1 : 0;
};

// 退出登录
export const toLogout = async () => {
  const dataStore = useDataStore();
  const platformStore = usePlatformStore();

  // 多平台模式退出
  const currentPlatform = platformStore.currentPlatform;

  if (currentPlatform === Platform.NETEASE) {
    // 网易云退出：删除 Cookie
    removeCookie("MUSIC_U");
    removeCookie("__csrf");
  } else if (currentPlatform === Platform.QQMUSIC) {
    // QQ 音乐退出：删除 Cookie
    removeCookie("uin");
    removeCookie("qm_keyst");
  }

  // 清除当前平台的用户数据(包括 IndexedDB 中的 cookies)
  dataStore.clearPlatformUserData(currentPlatform);
  window.$message.success(`成功退出${getPlatformDisplayName(currentPlatform)}`);
};

/**
 * 刷新登录
 * @param platform 指定平台（默认当前平台）
 * @param silent 是否静默刷新（不显示消息）
 * @param force 是否强制刷新（跳过2天限制，用于手动刷新）
 */
export const refreshLoginData = async (
  platform?: Platform,
  silent: boolean = true,
  force: boolean = false
): Promise<{ success: boolean; message?: string }> => {
  const dataStore = useDataStore();
  const platformStore = usePlatformStore();
  
  const targetPlatform = platform || platformStore.currentPlatform;
  
  // 限制1: 仅支持 QQ 音乐平台
  if (targetPlatform !== Platform.QQMUSIC) {
    return { success: false, message: "当前平台不支持刷新登录" };
  }
  
  // 获取平台数据
  const platformData = dataStore.platformUsers[targetPlatform];
  
  // 限制2: 仅支持二维码登录
  if (platformData.loginType !== 'qr') {
    return { success: false, message: "仅支持二维码登录方式刷新" };
  }
  
  // 检查是否有完整 cookies（只有扫码登录才有）
  if (!platformData.cookies || Object.keys(platformData.cookies).length === 0) {
    return { success: false, message: "缺少完整 Cookie，无法刷新" };
  }
  
  const lastLoginTime = platformData.lastLoginTime;
  
  // 检查是否需要刷新（超过 2 天）
  const REFRESH_THRESHOLD = 2 * 24 * 60 * 60 * 1000; // 2天
  const now = Date.now();
  
  // force=true 时跳过2天限制（用于手动刷新）
  if (!force && !silent && lastLoginTime && (now - lastLoginTime) < REFRESH_THRESHOLD) {
    return { success: false, message: "登录状态正常，无需刷新" };
  }
  
  try {
    // 调用刷新 API（POST 方式，传递完整 cookies）
    const result = await refreshLogin(platformData.cookies);
    
    if (result?.code === 200 && result.cookie) {
      // 更新 Cookies（setCookies 会自动处理秒级/毫秒级时间戳转换）
      setCookies(result.cookie, {
        expireTime: result.expireTime,
        platform: targetPlatform,
      });
      
      // 更新登录时间
      platformData.lastLoginTime = now;
      dataStore.savePlatformUsers();
      
      if (!silent) window.$message.success("刷新登录成功");
      return { success: true, message: "刷新成功" };
    } else {
      if (!silent) window.$message.error("刷新登录失败，请重新登录");
      return { success: false, message: "刷新失败" };
    }
  } catch (error) {
    console.error("❌ 刷新登录失败:", error);
    if (!silent) window.$message.error("刷新登录失败");
    return { success: false, message: "刷新出错" };
  }
};

/**
 * 更新用户信息
 * 
 * @param platform 指定平台
 * @param includeUserLikes 是否包含用户喜欢数据
 * @param skipBasicInfo 是否跳过基础信息获取
 */
export const updateUserData = async (
  platform?: Platform,
  includeUserLikes: boolean = true,
  skipBasicInfo: boolean = false
) => {
  try {
    const dataStore = useDataStore();
    const platformStore = usePlatformStore();

    const targetPlatform = platform || platformStore.currentPlatform;

    const options = platform ? { platform } : undefined;

    // 获取基础用户信息
    if (!skipBasicInfo) {
      // 获取用户信息（必需）
      const userData = await userDetail(0, options);

      // 尝试获取用户订阅信息（可选，失败不影响登录）
      let subcountData = {
        artistCount: 0,
        djRadioCount: 0,
        mvCount: 0,
        subPlaylistCount: 0,
        createdPlaylistCount: 0,
      };
      try {
        subcountData = await userSubcount(options);
      } catch (error) {
        console.warn(`⚠️ 获取${getPlatformDisplayName(targetPlatform)}订阅信息失败，跳过`, error);
      }

      // 构建用户数据对象
      const userDataObj = {
        userId: userData.userId,
        userType: userData.userType,
        vipType: userData.vipType,
        name: userData.nickname,
        level: userData.level,
        avatarUrl: userData.avatarUrl,
        backgroundUrl: userData.backgroundUrl,
        createTime: userData.createTime,
        createDays: userData.createDays,
        artistCount: subcountData.artistCount,
        djRadioCount: subcountData.djRadioCount,
        mvCount: subcountData.mvCount,
        subPlaylistCount: subcountData.subPlaylistCount,
        createdPlaylistCount: subcountData.createdPlaylistCount,
      };

      // 保存用户数据到平台
      dataStore.setPlatformUserData(targetPlatform, userDataObj);
      console.log(`✅ 多平台模式：已保存${getPlatformDisplayName(targetPlatform)}用户数据`);
    }

    // 获取用户喜欢数据（可选）
    if (includeUserLikes) {
      const allUserLikeResult = await Promise.allSettled([
        updateUserLikeSongs(platform),
        updateUserLikePlaylist(platform),
        updateUserLikeArtists(platform),
        updateUserLikeAlbums(platform),
        updateUserLikeMvs(platform),
        updateUserLikeDjs(platform),
        // 每日推荐
        updateDailySongsData(false, platform),
      ]);
      // 若部分失败
      const hasFailed = allUserLikeResult.some((result) => result.status === "rejected");
      if (hasFailed) {
        console.warn("⚠️ 部分用户喜欢数据更新失败，但不影响登录");
      }
    }
  } catch (error) {
    console.error("❌ Error updating user data:", error);
    throw error;
  }
};

// 更新用户信息 - 特殊登录模式
export const updateSpecialUserData = async (userData?: any) => {
  try {
    const dataStore = useDataStore();
    const platformStore = usePlatformStore();
    
    if (!userData) {
      const userId = dataStore.currentUserData.userId;
      const result = await userDetail(userId);
      userData = result?.profile;
    }
    
    // 构建用户数据对象
    const userDataObj = {
      userId: userData.userId,
      userType: userData.userType,
      vipType: userData.vipType,
      name: userData.nickname,
      level: userData.level,
      avatarUrl: userData.avatarUrl,
      backgroundUrl: userData.backgroundUrl,
      createTime: userData.createTime,
      createDays: userData.createDays,
    };
    
    // 保存用户数据到平台
    const currentPlatform = platformStore.currentPlatform;
    dataStore.setPlatformUserData(currentPlatform, userDataObj);
    
    // 获取用户喜欢数据
    await updateUserLikePlaylist();
  } catch (error) {
    console.error("❌ Error updating special user data:", error);
    throw error;
  }
};

/**
 * 更新用户喜欢歌曲
 * @param platform 指定平台（可选）
 */
export const updateUserLikeSongs = async (platform?: Platform) => {
  const dataStore = useDataStore();
  const platformStore = usePlatformStore();
  
  const targetPlatform = platform || platformStore.currentPlatform;
  const options = platform ? { platform } : undefined;
  
  const userId = dataStore.currentUserData.userId;
  if (!isLogin() || !userId) return;
  
  const result = await userLike(userId, options);
  
  // 保存数据到平台
  dataStore.setPlatformUserLikeData(targetPlatform, "songs", result.ids);
};

/**
 * 更新用户喜欢歌单
 * @param platform 指定平台（可选）
 */
export const updateUserLikePlaylist = async (platform?: Platform) => {
  const dataStore = useDataStore();
  const platformStore = usePlatformStore();

  const targetPlatform = platform || platformStore.currentPlatform;
  const options = platform ? { platform } : undefined;

  const currentUserData = dataStore.currentUserData;
  const userId = currentUserData.userId;
  if (!isLogin() || !userId) return;

  let result;
  if (dataStore.loginType === "uid") {
    result = await userPlaylist(30, 0, userId, options);
  } else {
    result = await userPlaylist(1000, 0, userId, options);
  }

  const allPlaylists = result.playlist || [];

  const createdPlaylists = allPlaylists.filter(pl => pl.userId === userId).map(pl => {
    // 注入平台存储的用户名(修复 QQ 音乐 creator.nickname 缺失问题)
    if (pl.creator && (!pl.creator.name || pl.creator.name === "")) {
      pl.creator.name = currentUserData.name || "";
    }
    return pl;
  });
  const subPlaylists = allPlaylists.filter(pl => pl.userId !== userId);

  // 保存数据到平台
  const playlists = formatCoverList([...createdPlaylists, ...subPlaylists]);
  dataStore.setPlatformUserLikeData(targetPlatform, "playlists", playlists);

  // 更新统计数据（解决 QQ 音乐 subcount 缺失问题）
  if (dataStore.currentUserData) {
    dataStore.currentUserData.createdPlaylistCount = createdPlaylists.length;
    dataStore.currentUserData.subPlaylistCount = subPlaylists.length;
  }

  console.log(`✅ ${getPlatformDisplayName(targetPlatform)} 歌单更新成功: 创建 ${createdPlaylists.length}, 收藏 ${subPlaylists.length}`);
};

/**
 * 更新用户喜欢歌手
 * @param platform 指定平台（可选）
 */
export const updateUserLikeArtists = async (platform?: Platform) => {
  await setUserLikeDataLoop(userArtist, formatArtistsList, "artists", platform);
};

/**
 * 更新用户喜欢专辑
 * @param platform 指定平台（可选）
 */
export const updateUserLikeAlbums = async (platform?: Platform) => {
  await setUserLikeDataLoop(userAlbum, formatCoverList, "albums", platform);
};

/**
 * 更新用户喜欢电台
 * @param platform 指定平台（可选）
 */
export const updateUserLikeDjs = async (platform?: Platform) => {
  const dataStore = useDataStore();
  const platformStore = usePlatformStore();
  
  const targetPlatform = platform || platformStore.currentPlatform;
  const options = platform ? { platform } : undefined;
  
  const userId = dataStore.currentUserData.userId;
  if (!isLogin() || !userId) return;
  
  const result = await userDj(options);
  const djs = formatCoverList(result.djRadios);
  
  // 保存数据到平台
  dataStore.setPlatformUserLikeData(targetPlatform, "djs", djs);
};

/**
 * 更新用户喜欢MV
 * @param platform 指定平台（可选）
 */
export const updateUserLikeMvs = async (platform?: Platform) => {
  const dataStore = useDataStore();
  const platformStore = usePlatformStore();
  
  const targetPlatform = platform || platformStore.currentPlatform;
  const options = platform ? { platform } : undefined;
  
  const userId = dataStore.currentUserData.userId;
  if (!isLogin() || !userId) return;
  
  const result = await userMv(options);
  const mvs = formatCoverList(result.data);
  
  // 保存数据到平台
  dataStore.setPlatformUserLikeData(targetPlatform, "mvs", mvs);
};

// 喜欢歌曲
export const toLikeSong = debounce(
  async (song: SongType, like: boolean) => {
    if (!isLogin()) {
      window.$message.warning("请登录后使用");
      return;
    }
    const dataStore = useDataStore();
    const platformStore = usePlatformStore();
    const { id, path } = song;
    if (path) {
      window.$message.warning("本地歌曲暂不支持该操作");
      return;
    }

    // 使用歌曲所属平台,如果没有则使用当前平台
    const songPlatform = song.platform || platformStore.currentPlatform;
    const likeList = dataStore.getUserLikeDataByPlatform(songPlatform).songs;
    const exists = likeList.includes(id);

    // 传递 song 对象
    const { code } = await likeSong(id, like, {
      resource: song,
      platform: songPlatform,
    });

    if (code === 200) {
      if (like && !exists) {
        likeList.push(id);
        window.$message.success("已添加到我喜欢的音乐");
        // 同步更新喜欢歌曲列表，将新歌曲添加到列表开头
        const likeSongsListData = dataStore.platformUsers[songPlatform].likeSongsList;
        await dataStore.setPlatformLikeSongsList(
          songPlatform,
          likeSongsListData.detail,
          [song, ...likeSongsListData.data],
        );
      } else if (!like && exists) {
        likeList.splice(likeList.indexOf(id), 1);
        window.$message.success("已取消喜欢");
        // 同步更新喜欢歌曲列表，从列表中移除该歌曲
        const likeSongsListData = dataStore.platformUsers[songPlatform].likeSongsList;
        await dataStore.setPlatformLikeSongsList(
          songPlatform,
          likeSongsListData.detail,
          likeSongsListData.data.filter((s) => s.id !== id),
        );
      } else if (like && exists) {
        window.$message.info("我喜欢的音乐中已存在该歌曲");
      }
      // 更新对应平台的数据
      dataStore.setPlatformUserLikeData(songPlatform, "songs", likeList);
      // ipc
      if (isElectron) window.electron.ipcRenderer.send("like-status-change", like);
    } else {
      window.$message.error(`${like ? "喜欢" : "取消"}音乐时发生错误`);
      return;
    }
  },
  300,
  { leading: true, trailing: false },
);

// 收藏/取消收藏歌单
export const toLikePlaylist = debounce(
  async (playlist: CoverType | null, like: boolean) => {
    if (!playlist?.id) return;
    if (!isLogin()) {
      window.$message.warning("请登录后使用");
      return;
    }
    const options = playlist ? { resource: playlist } : undefined;
    const { code } = await likePlaylist(playlist.id, like ? 1 : 2, options);
    if (code === 200) {
      window.$message.success((like ? "收藏" : "取消收藏") + "歌单成功");
      // 更新
      await updateUserLikePlaylist();
    } else {
      window.$message.success((like ? "收藏" : "取消收藏") + "歌单失败，请重试");
      return;
    }
  },
  300,
  { leading: true, trailing: false },
);

// 收藏/取消收藏歌手
export const toLikeArtist = debounce(
  async (artist: ArtistType | null, like: boolean) => {
    if (!artist?.id) return;
    if (!isLogin()) {
      window.$message.warning("请登录后使用");
      return;
    }
    const { code } = await likeArtist(artist.id, like ? 1 : 2, { resource: artist });
    if (code === 200) {
      window.$message.success((like ? "收藏" : "取消收藏") + "歌手成功");
      // 更新
      await updateUserLikeArtists();
    } else {
      window.$message.success((like ? "收藏" : "取消收藏") + "歌手失败，请重试");
      return;
    }
  },
  300,
  { leading: true, trailing: false },
);

// 收藏/取消收藏专辑
export const toLikeAlbum = debounce(
  async (album: CoverType | null, like: boolean) => {
    if (!album?.id) return;
    if (!isLogin()) {
      window.$message.warning("请登录后使用");
      return;
    }
    const { code } = await likeAlbum(album.id, like ? 1 : 2, { resource: album });
    if (code === 200) {
      window.$message.success((like ? "收藏" : "取消收藏") + "专辑成功");
      // 更新
      await updateUserLikeAlbums();
    } else {
      window.$message.success((like ? "收藏" : "取消收藏") + "专辑失败，请重试");
      return;
    }
  },
  300,
  { leading: true, trailing: false },
);

// 订阅/取消订阅播客
export const toSubRadio = debounce(
  async (id: number, like: boolean) => {
    if (!id) return;
    if (!isLogin()) {
      window.$message.warning("请登录后使用");
      return;
    }
    const { code } = await radioSub(id, like ? 1 : 0);
    if (code === 200) {
      window.$message.success((like ? "订阅" : "取消订阅") + "播客成功");
      // 更新
      await updateUserLikeDjs();
    } else {
      window.$message.success((like ? "订阅" : "取消订阅") + "播客失败，请重试");
      return;
    }
  },
  300,
  { leading: true, trailing: false },
);

/**
 * 循环获取用户喜欢数据
 * @param platform 指定平台（可选）
 */
const setUserLikeDataLoop = async <T>(
  apiFunction: (limit: number, offset: number, options?: any) => Promise<{ data: any[]; count: number }>,
  formatFunction: (data: any[], platform?: Platform) => T[],
  key: keyof UserLikeDataType,
  platform?: Platform,
) => {
  const dataStore = useDataStore();
  const platformStore = usePlatformStore();
  
  const targetPlatform = platform || platformStore.currentPlatform;
  const options = platform ? { platform } : undefined;
  
  const userId = dataStore.currentUserData.userId;
  if (!isLogin() || !userId) return;
  
  // 必要数据
  let offset: number = 0;
  const allData: T[] = [];
  const limit: number = 100;
  // 是否可循环
  let canLoop: boolean = true;
  // 循环获取
  while (canLoop) {
    const { data, count } = await apiFunction(limit, offset, options);
    // 数据处理
    const formattedData = formatFunction(data, targetPlatform);
    // 若为空
    if (formattedData.length === 0) break;
    // 合并数据
    allData.push(...formattedData);
    // 更新偏移量
    offset += limit;
    canLoop = offset < count && formattedData.length > 0;
  }
  
  // 保存数据到平台
  if (key === "artists") {
    dataStore.setPlatformUserLikeData(targetPlatform, key, allData as ArtistType[]);
  } else if (key === "albums" || key === "mvs" || key === "djs") {
    dataStore.setPlatformUserLikeData(targetPlatform, key, allData as CoverType[]);
  } else {
    console.error(`Unsupported key: ${key}`);
  }
  
  return allData;
};

/**
 * 更新每日推荐
 * @param refresh 是否强制刷新
 * @param platform 指定平台（可选）
 */
export const updateDailySongsData = async (refresh = false, platform?: Platform) => {
  try {
    const dataStore = useDataStore();
    const platformStore = usePlatformStore();
    
    const targetPlatform = platform || platformStore.currentPlatform;
    const options = platform ? { platform } : undefined;
    
    if (!isLogin()) {
      // 清空当前平台数据
      await dataStore.setPlatformDailySongsData(targetPlatform, { timestamp: null, list: [] });
      return;
    }

    const dailySongsData = dataStore.currentDailySongsData;
    const { timestamp, list } = dailySongsData;

    // 是否需要刷新
    if (!refresh && list.length > 0 && timestamp && !isBeforeSixAM(timestamp)) return;

    // 获取每日推荐
    const result = await dailyRecommend("songs", options);
    const songsData = formatSongsList(result.data.dailySongs, targetPlatform);

    // 更新数据
    await dataStore.setPlatformDailySongsData(targetPlatform, { 
      timestamp: Date.now(), 
      list: songsData 
    });

    if (refresh) window.$message.success("每日推荐更新成功");
  } catch (error) {
    console.error("❌ Error updating daily songs data:", error);
    throw error;
  }
};

/**
 * 删除歌曲
 * @param pid 歌单id
 * @param ids 要删除的歌曲id
 */
export const deleteSongs = async (pid: number, ids: number[], callback?: () => void) => {
  try {
    window.$dialog.warning({
      title: "删除歌曲",
      content: ids?.length > 1 ? "确定删除这些选中的歌曲吗？" : "确定删除这个歌曲吗？",
      positiveText: "删除",
      negativeText: "取消",
      onPositiveClick: async () => {
        const result = await playlistTracks(pid, ids, "del");
        if (result.status === 200) {
          if (result.body?.code !== 200) {
            window.$message.error(result.body?.message || "删除歌曲失败，请重试");
            return;
          }
          if (isFunction(callback)) callback();
          window.$message.success("删除成功");
        } else {
          window.$message.error(result?.message || "删除歌曲失败，请重试");
        }
      },
    });
  } catch (error) {
    console.error("❌ Error deleting songs:", error);
    throw error;
  }
};
