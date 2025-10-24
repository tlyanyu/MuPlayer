<template>
  <div class="mv-toplist">
    <!-- 地区筛选 -->
    <div class="filters">
      <div class="filter-group">
        <div class="filter-options">
          <n-button
            v-for="tab in areaTabs"
            :key="tab.area"
            :type="currentArea === tab.area ? 'primary' : 'default'"
            :secondary="currentArea !== tab.area"
            round
            @click="handleAreaChange(tab.area)"
          >
            {{ tab.name }}
          </n-button>
        </div>
      </div>
    </div>

    <!-- 排行榜列表 -->
    <Transition name="fade" mode="out-in">
      <div v-if="rankData.length > 0" class="rank-list">
        <n-card
          v-for="(item, index) in rankData"
          :key="item.id"
          class="rank-item"
          hoverable
          @click="router.push({ name: 'video', query: { id: item.id } })"
        >
          <!-- 排名徽章 -->
          <div class="rank-badge">
            <div v-if="index < 3" :class="['medal', `rank-${index + 1}`]">
              {{ index + 1 }}
            </div>
            <div v-else class="number">{{ index + 1 }}</div>
          </div>

          <!-- 视频封面 -->
          <s-image
            :src="`${item.cover}?param=360y203`"
            :default-src="'/images/video.jpg?assest'"
            class="cover"
            once
          />

          <!-- 视频信息 -->
          <div class="info">
            <n-text class="title text-hidden">{{ item.name }}</n-text>
            <div v-if="Array.isArray(item.artists)" class="artists text-hidden">
              <n-text
                v-for="(ar, arIndex) in item.artists"
                :key="arIndex"
                class="ar"
                depth="3"
              >
                {{ ar.name || "未知艺术家" }}
              </n-text>
            </div>
            <n-text v-else class="artists text-hidden" depth="3">
              {{ item.artists || "未知艺术家" }}
            </n-text>
          </div>

          <!-- 发布时间 -->
          <n-text class="time" depth="3">
            发布时间: {{ formatTimestamp(item.createTime) }}
          </n-text>
        </n-card>
      </div>
      <!-- 加载中 -->
      <div v-else-if="loading" class="rank-list loading">
        <n-card v-for="item in 20" :key="item" class="rank-item">
          <n-skeleton class="rank-badge" circle />
          <n-skeleton class="cover" />
          <div class="info">
            <n-skeleton text :repeat="2" />
          </div>
          <n-skeleton class="time" text />
        </n-card>
      </div>
      <!-- 空状态 -->
      <n-empty v-else description="暂无排行数据" size="large" class="empty" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { CoverType } from "@/types/main";
import { mvRank } from "@/api/mv";
import { formatCoverList } from "@/utils/format";
import { formatTimestamp } from "@/utils/time";

const router = useRouter();

// 地区标签配置
const areaTabs = [
  { name: "总榜", area: 0 },
  { name: "内地", area: 1 },
  { name: "港台", area: 2 },
  { name: "欧美", area: 3 },
  { name: "韩国", area: 4 },
  { name: "日本", area: 5 },
];

// 当前地区
const currentArea = ref<number>(0);

// 排行榜数据
const loading = ref<boolean>(true);
const rankData = ref<CoverType[]>([]);

// 获取排行榜数据
const getRankData = async () => {
  try {
    loading.value = true;
    const result = await mvRank(currentArea.value, 100, 0);
    rankData.value = formatCoverList(result.mvs || []);
  } catch (error) {
    console.error("Error getting mv rank:", error);
    window.$message.error("获取排行榜数据失败");
  } finally {
    loading.value = false;
  }
};

// 切换地区
const handleAreaChange = (area: number) => {
  currentArea.value = area;
  getRankData();
};

onMounted(() => {
  getRankData();
});
</script>

<style lang="scss" scoped>
.mv-toplist {
  // 筛选器
  .filters {
    margin-bottom: 30px;

    .filter-group {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;

      .filter-options {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
    }
  }

  .rank-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .rank-item {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      cursor: pointer;
      transition: all 0.3s;

      :deep(.n-card__content) {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 0;
      }

      &:hover {
        transform: translateX(4px);
      }

      // 排名徽章
      .rank-badge {
        width: 50px;
        min-width: 50px;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 20px;

        .medal {
          width: 40px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 50%;
          font-size: 18px;
          font-weight: bold;
          color: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

          &.rank-1 {
            background: linear-gradient(135deg, #ffd700, #ffa500);
          }

          &.rank-2 {
            background: linear-gradient(135deg, #c0c0c0, #808080);
          }

          &.rank-3 {
            background: linear-gradient(135deg, #cd7f32, #8b4513);
          }
        }

        .number {
          font-size: 22px;
          font-weight: bold;
          color: var(--text-color-3);
        }
      }

      // 视频封面
      .cover {
        width: 180px;
        height: 101px;
        min-width: 180px;
        border-radius: 8px;
        overflow: hidden;
        margin-right: 20px;
      }

      // 视频信息
      .info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;

        .title {
          font-size: 16px;
          font-weight: 500;
        }

        .artists {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;

          .ar {
            &:not(:last-child)::after {
              content: "/";
              margin-left: 4px;
            }
          }
        }
      }

      // 发布时间
      .time {
        width: 140px;
        min-width: 140px;
        text-align: right;
        font-size: 13px;
      }
    }

    // 加载状态
    &.loading {
      .rank-item {
        cursor: default;

        &:hover {
          transform: none;
        }

        .rank-badge {
          :deep(.n-skeleton) {
            width: 40px;
            height: 40px;
          }
        }

        .cover {
          :deep(.n-skeleton) {
            width: 100%;
            height: 100%;
          }
        }

        .info {
          :deep(.n-skeleton) {
            height: 18px;
          }
        }

        .time {
          :deep(.n-skeleton) {
            width: 100%;
            height: 16px;
          }
        }
      }
    }
  }

  .empty {
    margin-top: 80px;
  }
}
</style>
