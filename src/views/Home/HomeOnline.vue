<template>
  <div class="home-online">
    <!-- 登录功能 -->
    <n-grid v-if="isLogin()" :cols="2" :x-gap="20" class="main-rec">
      <n-gi>
        <n-flex :size="20" class="rec-list" justify="space-between" vertical>
          <!-- 每日推荐 -->
          <SongListCard
            :data="musicStore.dailySongsData.list"
            :title="dailySongsTitle"
            :height="90"
            description="根据你的音乐口味 · 每日更新"
            size="small"
            @click="router.push({ name: 'daily-songs' })"
          />
          <!-- 我喜欢的音乐 -->
          <SongListCard
            :data="dataStore.currentLikeSongsList.data"
            :height="90"
            title="我喜欢的音乐"
            description="发现你独特的音乐品味"
            size="small"
            @click="router.push({ name: 'like-songs' })"
          />
        </n-flex>
      </n-gi>
      <!-- 私人FM -->
      <n-gi>
        <PersonalFM />
      </n-gi>
    </n-grid>
    <!-- 公共推荐 -->
    <template v-for="(item, index) in recData" :key="index">
      <!-- QQ音乐平台隐藏雷达歌单和推荐播客（QQ音乐没有对应功能） -->
      <div
        v-if="!((index === 'radar' || index === 'radio') && platformStore.currentPlatform === 'qqmusic')"
        class="rec-public"
      >
        <n-flex
          class="title"
          align="center"
          justify="space-between"
          @click="router.push({ path: item.path ?? undefined })"
        >
          <n-h3 prefix="bar">
            <n-text>{{ item.name }}</n-text>
            <SvgIcon v-if="item.path" :size="26" name="Right" />
          </n-h3>
        </n-flex>
        <!-- 列表 -->
        <ArtistList v-if="item.type === 'artist'" :data="item.list as ArtistType[]" :loading="true" />
        <CoverList v-else :data="item.list as CoverType[]" :type="item.type" :cols="item.cols" :loading="true" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ArtistType, CoverType } from "@/types/main";
import { NText } from "naive-ui";
import { useDataStore, useMusicStore } from "@/stores";
import { usePlatformStore } from "@/stores/platform";
import { newAlbumsAll, personalized, radarPlaylist, topArtists } from "@/api/rec";
import { allMv } from "@/api/video";
import { radioRecommend } from "@/api/radio";
import { getCacheData } from "@/utils/cache";
import { formatArtistsList, formatCoverList } from "@/utils/format";
// import { sleep } from "@/utils/helper";
import { isLogin } from "@/utils/auth";
import SvgIcon from "@/components/Global/SvgIcon.vue";

interface RecItemType {
  name: string;
  list: (ArtistType | CoverType)[];  // 使用联合类型而不是数组联合
  type: "playlist" | "artist" | "video" | "radio" | "album";
  path?: string;
  cols?: string;
}

interface RecDataType {
  playlist: RecItemType;
  radar: RecItemType;
  artist: RecItemType;
  video: RecItemType;
  radio: RecItemType;
  album: RecItemType;
}

const router = useRouter();
const dataStore = useDataStore();
const musicStore = useMusicStore();
const platformStore = usePlatformStore();

// 日推标题
const dailySongsTitle = computed(() => {
  const day = new Date().getDate();
  return h("div", { class: "date" }, [
    h("div", { class: "date-icon" }, [
      h(SvgIcon, { name: "Calendar-Empty", size: 30, depth: 2 }),
      h(NText, null, () => day),
    ]),
    h(NText, { class: "name" }, () => ["每日推荐"]),
  ]);
});

// 推荐数据
const recData = ref<RecDataType>({
  playlist: {
    name: isLogin() ? "专属歌单" : "推荐歌单",
    list: [] as CoverType[],
    type: "playlist",
    path: "/discover/playlists",
  },
  radar: {
    name: "雷达歌单",
    list: [] as CoverType[],
    type: "playlist",
  },
  artist: {
    name: "歌手推荐",
    list: [] as ArtistType[],
    type: "artist",
    path: "/discover/artists",
  },
  video: {
    name: "推荐 MV",
    list: [] as CoverType[],
    type: "video",
    cols: "2 600:2 800:3 900:4 1200:5 1400:6",
  },
  radio: {
    name: "推荐播客",
    list: [] as CoverType[],
    type: "radio",
  },
  album: {
    name: "新碟上架",
    list: [] as CoverType[],
    type: "album",
    path: "/discover/new",
  },
});

// 防重复调用 & 竞态控制
const isLoadingData = ref(false);
const lastLoadTime = ref(0);
const currentReqToken = ref<symbol | null>(null);
const loadedPlatform = ref<string | null>(null);

// 平台维度缓存键
const cacheKey = (name: string) => `${platformStore.currentPlatform}:${name}`;

// 获取全部推荐
const getAllRecData = async () => {
  // 防重复：如果正在加载，跳过
  if (isLoadingData.value) {
    console.log('⏭️ 数据正在加载中，跳过重复调用');
    return;
  }

  // 防抖：300ms内的重复调用跳过
  const now = Date.now();
  if (now - lastLoadTime.value < 300) {
    console.log('⏭️ 300ms内已加载过，跳过重复调用');
    return;
  }

  isLoadingData.value = true;
  lastLoadTime.value = now;

  // 生成本轮请求 token，用于丢弃旧响应
  const token = Symbol('rec-load');
  currentReqToken.value = token;

  try {
    const tasks: Promise<any>[] = [];

    // 歌单
    tasks.push((async () => {
      try {
        const playlistRes = await getCacheData(
          personalized,
          { key: cacheKey('playlistRec'), time: 10 },
          "playlist",
          isLogin() ? 21 : 20,
        );
        if (currentReqToken.value !== token) return;
        recData.value.playlist.list = formatCoverList(
          playlistRes.result?.filter((pl: any) => !pl.name.includes("私人雷达")) || [],
        );
      } catch (error) {
        if (currentReqToken.value !== token) return;
        console.error("Error getting playlist:", error);
        recData.value.playlist.list = [];
      }
    })());

    // 雷达歌单（仅网易云音乐平台）
    if (platformStore.currentPlatform !== 'qqmusic') {
      tasks.push((async () => {
        try {
          const radarRes = await getCacheData(
            radarPlaylist,
            {
              key: cacheKey('radarRec'),
              time: 30,
              validator: (data) => Array.isArray(data) && data.length > 0 && data.every((item: any) => item != null)
            }
          );
          if (currentReqToken.value !== token) return;
          recData.value.radar.list = formatCoverList(radarRes);
          if (radarRes.length < 5) {
            console.warn(`⚠️ 雷达歌单只获取到 ${radarRes.length} 个,可能存在API限流`);
          }
        } catch (error) {
          if (currentReqToken.value !== token) return;
          console.error("Error getting radar:", error);
          recData.value.radar.list = [];
        }
      })());
    } else {
      recData.value.radar.list = [];
    }

    // 歌手
    tasks.push((async () => {
      try {
        const artistRes = await getCacheData(topArtists, { key: cacheKey('artistRec'), time: 10 }, 6);
        if (currentReqToken.value !== token) return;
        recData.value.artist.list = formatArtistsList(artistRes.artists || []);
      } catch (error) {
        if (currentReqToken.value !== token) return;
        console.error("Error getting artist:", error);
        recData.value.artist.list = [];
      }
    })());

    // MV
    tasks.push((async () => {
      try {
        const videoRes = await getCacheData(allMv, { key: cacheKey('videoRec'), time: 10 });
        if (currentReqToken.value !== token) return;
        recData.value.video.list = formatCoverList(videoRes.mvs || videoRes.data || []);
      } catch (error) {
        if (currentReqToken.value !== token) return;
        console.error("Error getting video:", error);
        recData.value.video.list = [];
      }
    })());

    // 播客（仅网易云音乐平台）
    if (platformStore.currentPlatform !== 'qqmusic') {
      tasks.push((async () => {
        try {
          const radioRes = await getCacheData(radioRecommend, { key: cacheKey('radioRec'), time: 10 });
          if (currentReqToken.value !== token) return;
          recData.value.radio.list = formatCoverList(radioRes.djRadios || []);
        } catch (error) {
          if (currentReqToken.value !== token) return;
          console.error("Error getting radio:", error);
          recData.value.radio.list = [];
        }
      })());
    } else {
      recData.value.radio.list = [];
    }

    // 新碟
    tasks.push((async () => {
      try {
        const albumRes = await getCacheData(newAlbumsAll, { key: cacheKey('albumRec'), time: 10 });
        if (currentReqToken.value !== token) return;
        recData.value.album.list = formatCoverList(albumRes.albums || []);
      } catch (error) {
        if (currentReqToken.value !== token) return;
        console.error("Error getting album:", error);
        recData.value.album.list = [];
      }
    })());

    // 等待所有推荐块完成（互不影响）
    await Promise.allSettled(tasks);

    // 本轮仍有效则标记已加载平台
    if (currentReqToken.value === token) {
      loadedPlatform.value = platformStore.currentPlatform;
    }
  } catch (error) {
    window.$message.error("个性化推荐获取出错");
    console.error("Error getting personalized data:", error);
  } finally {
    isLoadingData.value = false;
  }
};

onMounted(() => {
  getAllRecData();
});

onActivated(() => {
  // 仅在未加载当前平台时触发，避免重复加载
  if (loadedPlatform.value !== platformStore.currentPlatform) {
    getAllRecData();
  }
});

// 监听平台切换，清空数据并刷新
watch(() => platformStore.currentPlatform, () => {
  console.log("🔄 HomeOnline: 检测到平台切换，清空数据");

  // 立即清空内存数据，避免显示旧平台的数据
  recData.value.playlist.list = [];
  recData.value.radar.list = [];
  recData.value.artist.list = [];
  recData.value.video.list = [];
  recData.value.radio.list = [];
  recData.value.album.list = [];

  // 使在途请求失效，并允许立即重新加载
  currentReqToken.value = Symbol('rec-cancelled');
  isLoadingData.value = false;
  lastLoadTime.value = 0;

  // 重新获取新平台的数据（会自动检查和使用缓存）
  getAllRecData();
}, { immediate: false });

// 监听登录状态变化，清空缓存并刷新推荐数据
watch(() => dataStore.currentLoginStatus, (newStatus, oldStatus) => {
  // 跳过初始化阶段（oldStatus 为 undefined 表示首次触发）
  if (oldStatus === undefined) {
    console.log('⏭️ 跳过初始化阶段的登录状态 watch 触发');
    return;
  }

  // 只在状态真正改变时触发
  if (newStatus !== oldStatus) {
    console.log(`🔄 检测到登录状态变化 (${oldStatus} -> ${newStatus})，清空当前平台缓存`);

    // 清空当前平台的所有推荐缓存（使用平台前缀）
    const cacheKeys = ['playlistRec', 'radarRec', 'artistRec', 'videoRec', 'radioRec', 'albumRec'];
    cacheKeys.forEach(key => {
      const platformKey = cacheKey(key);
      sessionStorage.removeItem(platformKey);
      console.log(`🧹 清除缓存: ${platformKey}`);
    });

    // 重新获取数据
    getAllRecData();
  }
}, { immediate: false });
</script>

<style lang="scss" scoped>
.main-rec {
  .date {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
    .date-icon {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 4px;
      .n-text {
        position: absolute;
        font-size: 12px;
        color: var(--primary-hex);
        line-height: normal;
        margin-top: 4px;
        transform: scale(0.8);
      }
    }
    .name {
      font-size: 18px;
      font-weight: bold;
    }
  }
}
.title {
  margin-top: 28px;
  padding: 0 4px;
  .n-h {
    margin: 0;
    display: flex;
    align-items: center;
    cursor: pointer;
    .n-icon {
      opacity: 0;
      transform: translateX(4px);
      transition:
        opacity 0.3s,
        transform 0.3s;
    }
    &:hover {
      .n-icon {
        opacity: 1;
        transform: translateX(0);
      }
    }
  }
}
</style>
