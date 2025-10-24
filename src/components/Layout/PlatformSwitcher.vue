<template>
  <n-dropdown
    :options="menuOptions"
    :render-label="renderLabel"
    trigger="click"
    placement="bottom-start"
    @select="handleSelect"
  >
    <div :class="['platform-dropdown', { switching: isSwitching }]">
      <svg
        viewBox="0 0 24 24"
        width="28"
        height="28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 10L12 15L17 10"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </n-dropdown>
</template>

<script setup lang="ts">
import type { DropdownOption } from "naive-ui";
import { usePlatformStore } from "@/stores/platform";
import { useSettingStore, useStatusStore } from "@/stores";
import { Platform } from "@/services/apiConfig";
import { renderIcon } from "@/utils/helper";
import { openSetting } from "@/utils/modal";
import { setColorSchemes } from "@/utils/color";
import themeColor from "@/assets/data/themeColor.json";
import { computed, h, VNode } from "vue";
import PlatformIcon from "@/components/Global/PlatformIcon.vue";

const platformStore = usePlatformStore();
const settingStore = useSettingStore();
const statusStore = useStatusStore();

// 切换中状态
const isSwitching = ref(false);

// 获取当前主题色
const getCurrentThemeColor = computed(() => {
  const themeType = settingStore.themeMode === "dark" ? "dark" : "light";
  let colorSchemes;

  if (settingStore.themeFollowCover && statusStore.songCoverTheme) {
    const coverColor = statusStore.songCoverTheme;
    colorSchemes = setColorSchemes(coverColor, themeType);
  } else if (settingStore.themeColorType !== "custom") {
    colorSchemes = setColorSchemes(themeColor[settingStore.themeColorType].color, themeType);
  } else {
    colorSchemes = setColorSchemes(settingStore.themeCustomColor, themeType);
  }

  return colorSchemes?.primary || '236, 65, 65';
});

// 自定义渲染标签函数
const renderLabel = (option: DropdownOption): VNode | undefined => {
  if (!option.label) return undefined;

  const isSelected = option.key === platformStore.currentPlatform;
  const primaryRgb = getCurrentThemeColor.value;
  const primaryColor = `rgb(${primaryRgb})`;

  return h(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
      }
    },
    [
      // 文字
      h('span', {
        style: {
          color: isSelected ? primaryColor : 'inherit',
          fontWeight: isSelected ? '600' : 'normal',
        }
      }, option.label as string)
    ]
  );
};

// 下拉菜单选项
const menuOptions = computed<DropdownOption[]>(() => {
  const currentPlatform = platformStore.currentPlatform;
  const primaryRgb = getCurrentThemeColor.value;
  const primaryColor = `rgb(${primaryRgb})`;

  // 为选中项创建样式
  const selectedStyle = {
    backgroundColor: `rgba(${primaryRgb}, 0.2)`, 
    borderLeft: `4px solid ${primaryColor}`, 
    borderRadius: '0', 
  };

  // 创建平台图标
  const createPlatformIcon = (platform: Platform) => {
    return () => h(PlatformIcon, {
      platform: platform,
      size: 18,
    });
  };

  return [
    {
      key: Platform.NETEASE,
      label: '网易云音乐',
      icon: createPlatformIcon(Platform.NETEASE),
      props: {
        style: currentPlatform === Platform.NETEASE ? selectedStyle : {}
      }
    },
    {
      key: Platform.QQMUSIC,
      label: 'QQ 音乐',
      icon: createPlatformIcon(Platform.QQMUSIC),
      props: {
        style: currentPlatform === Platform.QQMUSIC ? selectedStyle : {}
      }
    },
    {
      type: 'divider',
      key: 'divider',
    },
    {
      key: 'settings',
      label: '平台设置',
      icon: renderIcon('Settings', { size: 18 }),
    },
  ];
});

// 处理菜单选择
const handleSelect = async (key: string) => {
  // 如果选择的是设置，打开设置页面
  if (key === 'settings') {
    openSetting('platform');
    return;
  }

  // 否则是切换平台
  const targetPlatform = key as Platform;
  await switchToPlatform(targetPlatform);
};

// 切换平台
const switchToPlatform = async (platform: Platform) => {
  // 如果已经是当前平台，不执行切换
  if (platform === platformStore.currentPlatform) return;

  // 设置切换状态
  isSwitching.value = true;

  try {
    // 切换平台
    platformStore.switchPlatform(platform);

    // 获取平台名称
    const platformName = platform === Platform.NETEASE ? '网易云音乐' : 'QQ 音乐';

    // 显示提示
    window.$message.success(`已切换到${platformName}`);
    // 路由跳转由 App.vue 统一处理（监听平台变化后清缓存并导航至首页）
  } finally {
    // 延迟恢复状态，让动画完成
    setTimeout(() => {
      isSwitching.value = false;
    }, 400);
  }
};
</script>

<style lang="scss" scoped>
.platform-dropdown {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  -webkit-app-region: no-drag;
  border-radius: 4px;

  svg {
    color: var(--text-color-3);
    transition: color 0.3s ease;
  }

  &:hover {
    background-color: rgba(var(--primary), 0.08);

    svg {
      color: var(--text-color);
    }
  }

  &:active {
    transform: scale(0.95);
  }

  // 切换动画
  &.switching {
    animation: platformSwitch 0.4s ease;
  }
}

// 下拉菜单样式
:deep(.n-dropdown-menu) {
  padding: 4px;

  .n-dropdown-option {
    margin: 2px 0;
    overflow: hidden;

    .n-dropdown-option-body {
      padding: 8px 12px;
      transition: all 0.2s var(--n-bezier);
      border-left: 4px solid transparent;  // 默认透明边框占位

      // 悬停状态
      &:hover {
        background-color: rgba(255, 255, 255, 0.1) !important;
      }
    }
  }

  // 分割线样式
  .n-dropdown-divider {
    margin: 4px 8px;
    border-color: rgba(255, 255, 255, 0.06);
  }
}

@keyframes platformSwitch {
  0% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: scale(0.85) rotate(180deg);
    opacity: 0.7;
  }
  100% {
    transform: scale(1) rotate(360deg);
    opacity: 1;
  }
}
</style>
