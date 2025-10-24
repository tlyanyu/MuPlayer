<template>
  <div class="artist-type">
    <CoverList
      :data="albumData"
      :loading="loading"
      :loadMore="hasMore"
      type="album"
      @loadMore="loadMore"
    />
  </div>
</template>

<script setup lang="ts">
import type { CoverType } from "@/types/main";
import type { Platform } from "@/services/apiConfig";
import { artistAblums } from "@/api/artist";
import { formatCoverList } from "@/utils/format";

const props = defineProps<{
  id: number | string;  // 支持网易云的 number 和 QQ音乐的 string
  platform?: Platform;
}>();

// 歌曲数据
const loading = ref<boolean>(true);
const hasMore = ref<boolean>(true);
const albumData = ref<CoverType[]>([]);
const albumOffset = ref<number>(0);

// 获取歌手全部专辑
const getArtistAllAlbums = async () => {
  try {
    if (!props.id) return;
    loading.value = true;
    // 构建平台路由选项（支持跨平台艺术家专辑访问）
    const options = props.platform ? { platform: props.platform } : undefined;
    // 获取数据
    const result = await artistAblums(props.id, 50, albumOffset.value, options);
    // 是否还有
    hasMore.value = result?.more;
    // 处理数据
    const listData = formatCoverList(result?.hotAlbums);
    albumData.value = albumData.value.concat(listData);
    loading.value = false;
  } catch (error) {
    console.error("Error getting artist all albums:", error);
  }
};

// 加载更多
const loadMore = () => {
  if (hasMore.value) {
    albumOffset.value += 50;
    getArtistAllAlbums();
  } else {
    loading.value = false;
  }
};

onMounted(getArtistAllAlbums);
</script>
