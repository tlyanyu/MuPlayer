<template>
  <div class="discover-new">
    <n-flex class="menu" justify="space-between">
      <n-flex class="type">
        <n-button
          v-for="(item, index) in newTypeNames"
          :key="index"
          :type="index === newTypeChoose ? 'primary' : 'default'"
          :secondary="index !== newTypeChoose"
          size="small"
          round
          @click="newQueryChange(index, newAreaChoose)"
        >
          {{ item }}
        </n-button>
      </n-flex>
      <n-flex class="area">
        <n-button
          v-for="(item, index) in newAreaNames"
          :key="index"
          :type="index === newAreaChoose ? 'primary' : 'default'"
          :secondary="index !== newAreaChoose"
          size="small"
          round
          @click="newQueryChange(newTypeChoose, index)"
        >
          {{ item.name }}
        </n-button>
      </n-flex>
    </n-flex>
    <!-- 列表 -->
    <Transition name="fade" mode="out-in">
      <CoverList
        v-if="newTypeChoose === 0"
        :data="newAlbumData"
        :loading="loading"
        :loadMore="hasMore"
        @loadMore="loadMore"
        type="album"
      />
      <SongList
        v-else-if="newTypeChoose === 1"
        :data="newSongData"
        :loading="loading"
        disabledSort
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { newAlbumsAll, newSongs } from "@/api/rec";
import type { CoverType, SongType } from "@/types/main";
import { formatCoverList, formatSongsList } from "@/utils/format";
import { AlbumAdapter } from "@/adapters/albumAdapter";
import { usePlatformStore } from "@/stores";

const router = useRouter();
const platformStore = usePlatformStore();

// 分类数据
const newTypeNames = ["新碟上架", "新歌速递"];
const newTypeChoose = ref<number>(Number(router.currentRoute.value.query?.type as string) || 0);
const newAreaChoose = ref<number>(Number(router.currentRoute.value.query?.area as string) || 0);

// 动态获取地区配置(根据当前类型)
const newAreaNames = computed(() => {
  const type = newTypeChoose.value === 0 ? "album" : "song";
  return AlbumAdapter.getConfig(platformStore.currentPlatform, type).areas;
});

// 音乐数据
const hasMore = ref<boolean>(true);
const loading = ref<boolean>(true);
const newOffset = ref<number>(0);
const newSongData = ref<SongType[]>([]);
const newAlbumData = ref<CoverType[]>([]);

// 获取最新音乐数据
const getAllNewData = async () => {
  // 获取数据
  loading.value = true;
  // 新碟上架
  if (newTypeChoose.value === 0) {
    // 通过适配器转换参数
    const apiParams = AlbumAdapter.toApiParams(
      platformStore.currentPlatform,
      newAreaChoose.value,
      newOffset.value,
      50,
      "album"
    );

    const result = await newAlbumsAll(
      apiParams.cat,
      50,
      newOffset.value,
      {
        platform: platformStore.currentPlatform,
        extraParams: apiParams.extraParams,
      }
    );
    // 是否还有
    hasMore.value = result.total > newOffset.value + 50;
    // 处理数据
    const albumData = formatCoverList(result.albums);
    newAlbumData.value = newAlbumData.value.concat(albumData);
  }
  // 新歌速递
  else if (newTypeChoose.value === 1) {
    // 通过适配器转换参数
    const apiParams = AlbumAdapter.toApiParams(
      platformStore.currentPlatform,
      newAreaChoose.value,
      0,
      0,
      "song"
    );

    const result = await newSongs(apiParams.type, {
      platform: platformStore.currentPlatform,
      extraParams: apiParams.extraParams, // 添加 extraParams 支持 QQ 音乐
    });
    // 处理数据
    newSongData.value = formatSongsList(result.data);
  }
  loading.value = false;
};

// 参数变化
const newQueryChange = (type: number, area: number) => {
  // 如果切换类型,检查 area 索引是否有效
  let validArea = area;
  if (type !== newTypeChoose.value) {
    // 获取新类型的地区配置
    const newConfig = AlbumAdapter.getConfig(
      platformStore.currentPlatform,
      type === 0 ? "album" : "song"
    );
    // 如果当前 area 超出新配置范围,重置为 0
    if (area >= newConfig.areas.length) {
      validArea = 0;
    }
  }

  router.push({
    name: "discover-new",
    query: { type, area: validArea },
  });
};

// 加载更多
const loadMore = () => {
  newOffset.value += 50;
  getAllNewData();
};

// 路由参数变化
onBeforeRouteUpdate((to) => {
  if (to.name !== "discover-new") return;

  // 提取参数
  const newType = Number(to.query?.type as string) || 0;
  let newArea = Number(to.query?.area as string) || 0;

  // 验证 area 索引有效性
  const config = AlbumAdapter.getConfig(
    platformStore.currentPlatform,
    newType === 0 ? "album" : "song"
  );

  // 如果 area 超出范围,重置为 0
  if (newArea >= config.areas.length) {
    newArea = 0;
  }

  // 更新参数
  newTypeChoose.value = newType;
  newAreaChoose.value = newArea;

  // 获取数据
  loading.value = true;
  newOffset.value = 0;
  newSongData.value = [];
  newAlbumData.value = [];
  getAllNewData();
});

onMounted(getAllNewData);
</script>

<style lang="scss" scoped>
.discover-new {
  display: flex;
  flex-direction: column;
  height: 100%;
  .menu {
    margin-top: 20px;
  }
  .song-list {
    flex: 1;
  }
}
</style>
