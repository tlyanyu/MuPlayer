<template>
  <div class="mv-library">
    <!-- 筛选器 -->
    <div class="filters">
      <!-- 地区筛选 -->
      <div class="filter-group">
        <div class="filter-options">
          <n-button
            v-for="area in areaOptions"
            :key="area.id"
            :type="selectedArea === area.id ? 'primary' : 'default'"
            :secondary="selectedArea !== area.id"
            round
            @click="handleAreaChange(area.id)"
          >
            {{ area.name }}
          </n-button>
        </div>
      </div>

      <!-- 类型筛选 -->
      <div class="filter-group">
        <div class="filter-options">
          <n-button
            v-for="type in typeOptions"
            :key="type.id"
            :type="selectedType === type.id ? 'primary' : 'default'"
            :secondary="selectedType !== type.id"
            round
            @click="handleTypeChange(type.id)"
          >
            {{ type.name }}
          </n-button>
        </div>
      </div>
    </div>

    <!-- 标题栏 -->
    <div class="header">
      <n-h3 class="section-title" prefix="bar">
        <n-text class="name">全部MV</n-text>
      </n-h3>
      <div class="sort-tabs">
        <n-button
          :type="selectedOrder === 0 ? 'primary' : 'default'"
          :secondary="selectedOrder !== 0"
          size="small"
          round
          @click="handleOrderChange(0)"
        >
          最热
        </n-button>
        <n-button
          :type="selectedOrder === 1 ? 'primary' : 'default'"
          :secondary="selectedOrder !== 1"
          size="small"
          round
          @click="handleOrderChange(1)"
        >
          最新
        </n-button>
      </div>
    </div>

    <!-- 视频列表 -->
    <CoverList
      :data="mvListData"
      :loading="loading"
      :loadMore="hasMore"
      cols="2 600:2 800:3 900:4 1200:5"
      type="video"
      @loadMore="loadMore"
    />
  </div>
</template>

<script setup lang="ts">
import type { CoverType } from "@/types/main";
import { mvList } from "@/api/mv";
import { formatCoverList } from "@/utils/format";

// 地区选项
const areaOptions = [
  { id: 15, name: "全部" },
  { id: 16, name: "内地" },
  { id: 17, name: "港台" },
  { id: 18, name: "欧美" },
  { id: 19, name: "韩国" },
  { id: 20, name: "日本" },
];

// 类型选项
const typeOptions = [
  { id: 7, name: "全部" },
  { id: 8, name: "MV" },
  { id: 9, name: "现场" },
  { id: 10, name: "翻唱" },
  { id: 11, name: "舞蹈" },
  { id: 12, name: "影视" },
  { id: 13, name: "综艺" },
  { id: 14, name: "儿歌" },
];

// 当前选择的筛选条件
const selectedArea = ref<number>(15);
const selectedType = ref<number>(7);
const selectedOrder = ref<number>(0);

// 加载更多相关
const hasMore = ref<boolean>(true);
const loading = ref<boolean>(true);
const offset = ref<number>(0);
const pageSize = 50;

// 数据
const mvListData = ref<CoverType[]>([]);

// 获取MV列表
const getMvList = async () => {
  try {
    loading.value = true;
    const result = await mvList(
      selectedArea.value,
      selectedType.value,
      selectedOrder.value,
      pageSize,
      offset.value,
    );

    // 处理数据
    const videoData = formatCoverList(result.mvs || []);
    mvListData.value = mvListData.value.concat(videoData);

    // 判断是否还有更多数据
    const total = result.total || 0;
    hasMore.value = offset.value + pageSize < total;

    loading.value = false;
  } catch (error) {
    console.error("Error getting mv list:", error);
    window.$message.error("获取视频列表失败");
    loading.value = false;
  }
};

// 加载更多
const loadMore = () => {
  offset.value += pageSize;
  getMvList();
};

// 重置列表
const resetList = () => {
  offset.value = 0;
  mvListData.value = [];
  hasMore.value = true;
  getMvList();
};

// 处理地区变更
const handleAreaChange = (areaId: number) => {
  if (selectedArea.value === areaId) return;
  selectedArea.value = areaId;
  resetList();
};

// 处理类型变更
const handleTypeChange = (typeId: number) => {
  if (selectedType.value === typeId) return;
  selectedType.value = typeId;
  resetList();
};

// 处理排序变更
const handleOrderChange = (order: number) => {
  if (selectedOrder.value === order) return;
  selectedOrder.value = order;
  resetList();
};

onMounted(() => {
  getMvList();
});
</script>

<style lang="scss" scoped>
.mv-library {
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

        // 统一按钮样式,确保对齐
        :deep(.n-button) {
          min-width: 68px;
          padding-left: 16px;
          padding-right: 16px;
        }
      }
    }
  }

  // 标题栏
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    .section-title {
      margin: 0;
    }

    .sort-tabs {
      display: flex;
      gap: 8px;
    }
  }
}
</style>
