<template>
  <div class="discover-artists">
    <div class="filters">
      <!-- 地区筛选 -->
      <div v-if="areaFilter" class="filter-group">
        <div class="filter-options">
          <n-button
            v-for="(option, index) in areaFilter.options"
            :key="index"
            :type="selections[areaFilter.key] === option.value ? 'primary' : 'default'"
            :secondary="selections[areaFilter.key] !== option.value"
            round
            @click="onFilterChange(areaFilter.key, option.value)"
          >
            {{ option.name }}
          </n-button>
        </div>
      </div>

      <!-- 类型 + 流派筛选 (同一行) -->
      <div v-if="typeFilter || genreFilter" class="filter-group combined">
        <!-- 类型按钮 -->
        <div v-if="typeFilter" class="filter-options">
          <n-button
            v-for="(option, index) in typeFilter.options"
            :key="index"
            :type="selections[typeFilter.key] === option.value ? 'primary' : 'default'"
            :secondary="selections[typeFilter.key] !== option.value"
            round
            @click="onFilterChange(typeFilter.key, option.value)"
          >
            {{ option.name }}
          </n-button>
        </div>

        <!-- 流派下拉选择器 -->
        <div v-if="genreFilter" class="filter-select">
          <n-select
            :value="selections[genreFilter.key]"
            :options="genreSelectOptions"
            :menu-props="{ style: 'min-width: 120px;' }"
            @update:value="(value) => genreFilter && onFilterChange(genreFilter.key, value)"
          />
        </div>
      </div>

      <!-- 字母筛选 -->
      <div v-if="initialFilter" class="filter-group initial-filter">
        <div class="filter-options">
          <span
            v-for="(option, index) in initialFilter.options"
            :key="index"
            :class="['initial-item', { active: selections[initialFilter.key] === option.value }]"
            @click="onFilterChange(initialFilter.key, option.value)"
          >
            {{ option.name }}
          </span>
        </div>
      </div>
    </div>
    <ArtistList :data="artistsData" :loading="loading" :loadMore="hasMore" @loadMore="loadMore" />
  </div>
</template>

<script setup lang="ts">
import type { ArtistType } from "@/types/main";
import { artistTypeList } from "@/api/artist";
import { formatArtistsList } from "@/utils/format";
import { ArtistAdapter } from "@/adapters/artistAdapter";
import { usePlatformStore } from "@/stores";

const router = useRouter();
const platformStore = usePlatformStore();

// 从适配器获取筛选配置
const filterConfig = ArtistAdapter.getConfig(platformStore.currentPlatform);

// 按 key 分组筛选器,便于模板访问
const areaFilter = computed(() => filterConfig.filters.find((f) => f.key === "area"));
const typeFilter = computed(() => filterConfig.filters.find((f) => f.key === "type"));
const genreFilter = computed(() => filterConfig.filters.find((f) => f.key === "genre"));
const initialFilter = computed(() => filterConfig.filters.find((f) => f.key === "initial"));

// 流派下拉选择器选项
const genreSelectOptions = computed(() => {
  if (!genreFilter.value) return [];
  return genreFilter.value.options.map((option) => ({
    label: option.name,
    value: option.value,
  }));
});

// 初始化selections (从路由query或默认值)
const selections = ref<Record<string, number | string>>({});

// 初始化所有维度的选中值
const initSelections = () => {
  const query = router.currentRoute.value.query;
  const newSelections: Record<string, number | string> = {};

  filterConfig.filters.forEach((filter) => {
    if (query[filter.key]) {
      // 从query读取
      const queryValue = query[filter.key] as string;
      // 尝试转换为数字,如果失败则保持字符串
      newSelections[filter.key] = isNaN(Number(queryValue))
        ? queryValue
        : Number(queryValue);
    } else {
      // 使用默认值(第一个选项的value)
      newSelections[filter.key] = filter.options[0].value;
    }
  });

  selections.value = newSelections;
};

// 初始化
initSelections();

// 歌手数据
const hasMore = ref<boolean>(true);
const loading = ref<boolean>(true);
const artistsOffset = ref<number>(0);
const artistsData = ref<ArtistType[]>([]);

// 获取歌手数据
const getArtistListData = async () => {
  loading.value = true;

  // 通过适配器转换参数
  const apiParams = ArtistAdapter.toApiParams(
    platformStore.currentPlatform,
    selections.value
  );

  // 调用API
  const result = await artistTypeList(
    apiParams.type,
    apiParams.area,
    apiParams.initial,
    artistsOffset.value,
    80,
    {
      platform: platformStore.currentPlatform,
      extraParams: apiParams.extraParams,
    }
  );

  // 是否还有
  hasMore.value = result?.more;
  // 处理数据
  const arData = formatArtistsList(result.artists);
  artistsData.value = artistsData.value?.concat(arData);
  loading.value = false;
};

// 筛选变化
const onFilterChange = (key: string, value: number | string) => {
  artistsOffset.value = 0;

  // 更新selections
  selections.value = {
    ...selections.value,
    [key]: value,
  };

  // 更新路由
  router.push({
    name: "discover-artists",
    query: selections.value,
  });
};

// 加载更多
const loadMore = () => {
  artistsOffset.value += 80;
  getArtistListData();
};

// 参数变化
onBeforeRouteUpdate((to) => {
  if (to.name !== "discover-artists") return;

  // 重新初始化selections
  const query = to.query;
  const newSelections: Record<string, number | string> = {};

  filterConfig.filters.forEach((filter) => {
    if (query[filter.key]) {
      const queryValue = query[filter.key] as string;
      newSelections[filter.key] = isNaN(Number(queryValue))
        ? queryValue
        : Number(queryValue);
    } else {
      newSelections[filter.key] = filter.options[0].value;
    }
  });

  selections.value = newSelections;

  // 获取歌单
  loading.value = true;
  artistsData.value = [];
  getArtistListData();
});

onMounted(getArtistListData);
</script>

<style lang="scss" scoped>
.discover-artists {
  // 筛选器
  .filters {
    margin-top: 20px;
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

      // 类型 + 流派组合行样式
      &.combined {
        justify-content: space-between;
        align-items: center;

        .filter-select {
          // 去除下拉框边框,使用纯文本样式
          :deep(.n-base-selection) {
            --n-border: none !important;
            --n-border-hover: none !important;
            --n-border-active: none !important;
            --n-border-focus: none !important;
            --n-box-shadow-active: none !important;
            --n-box-shadow-focus: none !important;
            background-color: transparent !important;
            padding: 0 !important;
            width: auto !important;
            min-width: auto !important;
          }

          :deep(.n-base-selection-label) {
            background-color: transparent !important;
            padding: 0 !important;
          }

          :deep(.n-base-selection__border),
          :deep(.n-base-selection__state-border) {
            display: none !important;
          }

          :deep(.n-base-suffix) {
            padding: 0 !important;
            margin-left: 4px !important;
          }

          // 添加悬停效果
          :deep(.n-base-selection:hover) {
            color: var(--primary-hex) !important;

            * {
              color: var(--primary-hex) !important;
            }
          }
        }
      }

      // 字母筛选样式
      &.initial-filter {
        .filter-options {
          gap: 16px;

          .initial-item {
            cursor: pointer;
            color: rgba(128, 128, 128, 0.8);
            transition: color 0.3s;
            user-select: none;
            font-size: 14px;

            &:hover {
              color: var(--primary-hex);
            }

            &.active {
              color: var(--primary-hex);
              font-weight: 500;
            }
          }
        }
      }
    }
  }
}
</style>

<style lang="scss">
// 下拉选项悬停效果 - 必须使用非 scoped 样式,因为下拉菜单通过 Teleport 渲染在 body 中
.n-base-select-option:hover,
.n-base-select-option.n-base-select-option--pending {
  color: var(--primary-hex) !important;

  * {
    color: var(--primary-hex) !important;
  }
}
</style>
