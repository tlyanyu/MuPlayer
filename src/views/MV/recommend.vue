<template>
  <div class="mv-recommend">
    <!-- 推荐内容 -->
    <div class="rec">
      <!-- 置顶轮播 (无标题) -->
      <div v-if="mvFocusData.length > 0" class="focus-carousel">
        <n-carousel
          :autoplay="true"
          :interval="5000"
          :show-dots="true"
          :show-arrow="hoverCarousel"
          dot-type="dot"
          @mouseenter="hoverCarousel = true"
          @mouseleave="hoverCarousel = false"
        >
          <div v-for="(group, groupIndex) in focusGroups" :key="groupIndex" class="carousel-item">
            <n-grid cols="3" x-gap="20">
              <n-gi v-for="(item, index) in group" :key="index">
                <div class="focus-item" @click="router.push({ name: 'video', query: { id: item.id } })">
                  <s-image
                    :src="`${item.cover}?param=800y320`"
                    :default-src="'/images/video.jpg?assest'"
                    class="focus-cover"
                    once
                  />
                  <div class="focus-info">
                    <n-text class="focus-name text-hidden">{{ item.name }}</n-text>
                    <div v-if="Array.isArray(item.artists)" class="focus-artists text-hidden">
                      <n-text v-for="(ar, arIndex) in item.artists" :key="arIndex" class="ar" depth="3">
                        {{ ar.name || "未知艺术家" }}
                      </n-text>
                    </div>
                    <n-text v-else class="focus-artists text-hidden" depth="3">
                      {{ item.artists || "未知艺术家" }}
                    </n-text>
                  </div>
                </div>
              </n-gi>
            </n-grid>
          </div>
        </n-carousel>
      </div>

      <!-- 最新 -->
      <n-h3 class="title" prefix="bar">
        <n-text class="name">最新</n-text>
      </n-h3>
      <CoverList :data="mvNewData" :loading="true" cols="2 600:2 800:3 900:4 1200:5" type="video" />

      <!-- 热门 -->
      <n-h3 class="title" prefix="bar">
        <n-text class="name">热门</n-text>
      </n-h3>
      <CoverList :data="mvHotData" :loading="true" cols="2 600:2 800:3 900:4 1200:5" type="video" />

      <!-- 合集 -->
      <n-h3 class="title" prefix="bar">
        <n-text class="name">合集</n-text>
      </n-h3>
      <CoverList
        :data="mvCollectionData"
        :loading="true"
        cols="2 600:2 800:3 900:4 1200:5"
        type="video"
      />

      <!-- 个性推荐 -->
      <n-h3 class="title" prefix="bar">
        <n-text class="name">个性推荐</n-text>
      </n-h3>
      <CoverList
        :data="mvRecommendData"
        :loading="true"
        cols="2 600:2 800:3 900:4 1200:5"
        type="video"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CoverType } from "@/types/main";
import { mvFocus, mvNew, mvHot, mvCollection, mvAll } from "@/api/mv";
import { formatCoverList } from "@/utils/format";

const router = useRouter();

// MV 数据
const mvFocusData = ref<CoverType[]>([]);
const mvNewData = ref<CoverType[]>([]);
const mvHotData = ref<CoverType[]>([]);
const mvCollectionData = ref<CoverType[]>([]);
const mvRecommendData = ref<CoverType[]>([]);

// 轮播控制
const hoverCarousel = ref<boolean>(false);

// 置顶数据分组（每3个一组）
const focusGroups = computed(() => {
  const groups: CoverType[][] = [];
  for (let i = 0; i < mvFocusData.value.length; i += 3) {
    groups.push(mvFocusData.value.slice(i, i + 3));
  }
  return groups;
});

// 获取置顶推荐
const getMvFocus = async () => {
  try {
    const result = await mvFocus();
    mvFocusData.value = formatCoverList(result.mvs || []);
  } catch (error) {
    console.error("Error getting mv focus:", error);
    window.$message.error("获取置顶推荐失败");
  }
};

// 获取最新视频
const getMvNew = async () => {
  try {
    const result = await mvNew(20, 0);
    mvNewData.value = formatCoverList(result.mvs || []);
  } catch (error) {
    console.error("Error getting mv new:", error);
    window.$message.error("获取最新视频失败");
  }
};

// 获取热门视频
const getMvHot = async () => {
  try {
    const result = await mvHot(20, 0);
    mvHotData.value = formatCoverList(result.mvs || []);
  } catch (error) {
    console.error("Error getting mv hot:", error);
    window.$message.error("获取热门视频失败");
  }
};

// 获取合集视频
const getMvCollection = async () => {
  try {
    const result = await mvCollection(20, 0);
    mvCollectionData.value = formatCoverList(result.mvs || []);
  } catch (error) {
    console.error("Error getting mv collection:", error);
    window.$message.error("获取合集视频失败");
  }
};

// 获取个性推荐
const getMvRecommend = async () => {
  try {
    const result = await mvAll("全部", "全部", "最热", 20, 0);
    mvRecommendData.value = formatCoverList(result.mvs || []);
  } catch (error) {
    console.error("Error getting mv recommend:", error);
    window.$message.error("获取个性推荐失败");
  }
};

onMounted(() => {
  getMvFocus();
  getMvNew();
  getMvHot();
  getMvCollection();
  getMvRecommend();
});
</script>

<style lang="scss" scoped>
.mv-recommend {
  .rec {
    // 置顶轮播
    .focus-carousel {
      margin-bottom: 50px;
      position: relative;

      :deep(.n-carousel) {
        height: auto;
        padding-bottom: 36px;

        .n-carousel__slides {
          height: auto;
        }

        // 轮播箭头
        .n-carousel__arrow {
          width: 40px;
          height: 40px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          transition: all 0.3s;

          &:hover {
            background: rgba(0, 0, 0, 0.8);
          }
        }

        // 轮播指示点
        .n-carousel__dots {
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);

          .n-carousel__dot {
            margin: 0 8px;
          }

          // 自定义指示点配色，兼容明暗模式
          --n-dot-color: rgba(var(--primary), 0.24);
          --n-dot-color-focus: rgba(var(--primary), 0.48);
          --n-dot-color-active: var(--primary-hex);
        }

        &.n-carousel--bottom.n-carousel--show-arrow {
          .n-carousel__dots {
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);

            .n-carousel__dot {
              margin: 0 8px;
            }

            --n-dot-color: rgba(var(--primary), 0.24);
            --n-dot-color-focus: rgba(var(--primary), 0.48);
            --n-dot-color-active: var(--primary-hex);
          }
        }

        &.n-carousel--show-arrow {
          .n-carousel__arrow-group {
            bottom: calc(12px + 36px);
            right: 12px;
          }
        }
      }

      .carousel-item {
        width: 100%;
      }

      .focus-item {
        position: relative;
        cursor: pointer;
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

          .focus-info {
            opacity: 1;
          }
        }

        // 封面图片 - 宽高比 2.5:1
        .focus-cover {
          width: 100%;
          aspect-ratio: 2.5 / 1;
          object-fit: cover;
          display: block;
        }

        // 信息遮罩
        .focus-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
          opacity: 0;
          transition: opacity 0.3s;

          .focus-name {
            font-size: 16px;
            font-weight: 500;
            color: #fff;
            margin-bottom: 4px;
            display: block;
          }

          .focus-artists {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 13px;

            .ar {
              &:not(:last-child)::after {
                content: "/";
                margin-left: 4px;
              }
            }
          }
        }

      }
    }

    .title {
      margin: 30px 0 0 0;
      display: flex;
      align-items: center;
      width: max-content;
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
}
</style>
