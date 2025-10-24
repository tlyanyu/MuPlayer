<template>
  <div class="discover-toplists">
    <template v-if="topListData.length > 0">
      <template v-for="(group, groupIndex) in topListData" :key="groupIndex">
        <n-divider :style="groupIndex === topListData.length - 1 && !shouldShowTracks(group.displayType) ? 'margin-bottom: 0' : ''">
          {{ group.name }}
        </n-divider>
        <Transition name="fade" mode="out-in">
          <!-- 显示 TOP_3 的分组：使用 SongListCard 显示前三首歌 -->
          <div v-if="shouldShowTracks(group.displayType) && group.list?.length > 0" class="toplist-group">
            <n-grid cols="1 600:2 1000:3" x-gap="20" y-gap="20">
              <n-gi v-for="(item, index) in group.list" :key="index">
                <SongListCard
                  :cover="item.coverSize?.m || item.cover"
                  :title="item.name"
                  :height="160"
                  :description="item.updateTip"
                  size="normal"
                  @click="router.push({ name: 'playlist', query: { id: item.id } })"
                >
                  <template v-if="item.tracks && item.tracks.length > 0" #info>
                    <div
                      v-for="(song, songIndex) in item.tracks.slice(0, 3)"
                      :key="songIndex"
                      class="song-item text-hidden"
                    >
                      <n-text class="name">{{ songIndex + 1 }}. {{ song.first }}</n-text>
                      <n-text class="desc" depth="3">{{ song.second }}</n-text>
                    </div>
                  </template>
                </SongListCard>
              </n-gi>
            </n-grid>
          </div>
          <!-- 不显示 TOP_3 的分组：使用 CoverList -->
          <CoverList
            v-else-if="group.list?.length > 0"
            :data="group.list"
            :loading="true"
            type="playlist"
          />
        </Transition>
      </template>
    </template>
    <div v-else class="loading-placeholder">
      <n-grid cols="1 600:2 1000:3" x-gap="20" y-gap="20">
        <n-gi v-for="item in 4" :key="item">
          <n-card class="loading">
            <n-skeleton class="cover" />
            <div class="desc">
              <n-skeleton text round :repeat="3" />
            </div>
          </n-card>
        </n-gi>
      </n-grid>
    </div>
  </div>
</template>

<script setup lang="ts">
import { topPlaylist } from "@/api/playlist";
import type { CoverType } from "@/types/main";
import { formatCoverList } from "@/utils/format";

const router = useRouter();

// 排行榜分组数据类型
interface ToplistGroup {
  name: string;
  displayType: string;
  list: CoverType[];
}

// 排行榜数据
const topListData = ref<ToplistGroup[]>([]);

// 判断是否应该显示tracks（前三首歌）
const shouldShowTracks = (displayType: string) => {
  return displayType === 'TOP_3';
};

// 获取排行榜数据
const getTopPlaylistData = async () => {
  const result = await topPlaylist();
  // 处理分组数据，注意返回数据在data字段中
  if (result.data && Array.isArray(result.data)) {
    topListData.value = result.data
      .map((group: any) => {
        // 过滤出targetType为PLAYLIST的榜单
        const filteredList = (group.list || []).filter((item: any) => item.targetType === 'PLAYLIST');

        return {
          name: group.name || '未命名榜单',
          displayType: group.displayType || '',
          list: formatCoverList(filteredList),
        };
      })
      // 过滤掉没有榜单的分组和名为"榜单推荐"的分组
      .filter((group: ToplistGroup) => group.list.length > 0 && group.name !== '榜单推荐');
  }
};

onMounted(getTopPlaylistData);
</script>

<style lang="scss" scoped>
.discover-toplists {
  .song-item {
    .desc {
      &::before {
        content: "-";
        margin: 0 4px;
      }
    }
  }
  .loading {
    height: 160px;
    border-radius: 12px;
    cursor: pointer;
    :deep(.n-card__content) {
      display: flex;
      height: 100%;
      padding: 16px;
    }
    .cover {
      height: 100%;
      width: auto;
      border-radius: 8px;
      aspect-ratio: 1/1;
      margin-right: 20px;
    }
    .desc {
      display: flex;
      flex-direction: column;
      justify-content: space-evenly;
      width: 100%;
      :deep(.n-skeleton) {
        height: 20px;
      }
    }
  }
}
</style>
