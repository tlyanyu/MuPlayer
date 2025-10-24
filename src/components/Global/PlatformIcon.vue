<template>
  <SvgIcon
    v-if="platformIcon"
    :name="platformIcon"
    :size="size"
    :class="['platform-icon', platform, { clickable: clickable && !isCurrentPlatform }]"
    @click="handleClick"
  />
</template>

<script setup lang="ts">
import { Platform } from "@/services/apiConfig";
import { usePlatformStore } from "@/stores/platform";

const props = withDefaults(
  defineProps<{
    platform?: Platform;
    size?: string | number;
    clickable?: boolean;
  }>(),
  {
    size: 16,
    clickable: false,
  },
);

const platformStore = usePlatformStore();

// 根据平台类型映射图标名称
const platformIcon = computed(() => {
  if (!props.platform) return null;

  const iconMap: Record<Platform, string> = {
    [Platform.NETEASE]: "Netease",
    [Platform.QQMUSIC]: "QQMusic",
  };

  return iconMap[props.platform] || null;
});

// 是否为当前平台
const isCurrentPlatform = computed(() => {
  return props.platform === platformStore.currentPlatform;
});

// 点击处理
const handleClick = (event: MouseEvent) => {
  if (!props.clickable || !props.platform) return;

  // 如果是当前平台，不响应
  if (isCurrentPlatform.value) return;

  // 阻止事件冒泡
  event.stopPropagation();

  // 切换平台
  platformStore.switchPlatform(props.platform);

  // 获取平台名称并显示提示
  const platformName = props.platform === Platform.NETEASE ? "网易云音乐" : "QQ音乐";
  window.$message?.success(`已切换到${platformName}`);
};
</script>

<style lang="scss" scoped>
.platform-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s;

  // 强制使用主题色，不受全局着色影响
  :deep(.n-icon) {
    color: var(--primary-hex) !important;
  }

  :deep(.svg-container) {
    color: var(--primary-hex) !important;
  }

  // 可点击样式
  &.clickable {
    cursor: pointer;
    border-radius: 4px;
    padding: 2px;

    &:hover {
      background-color: rgba(var(--primary), 0.12);
      transform: scale(1.1);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}
</style>
