<!-- 平台设置 -->
<template>
  <div class="setting-type">
    <div class="set-list">
      <n-h3 prefix="bar"> 音乐平台设置 </n-h3>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">当前平台</n-text>
          <n-text class="tip" :depth="3">选择当前使用的音乐平台</n-text>
        </div>
        <n-select
          v-model:value="currentPlatform"
          class="set"
          :options="platformOptions"
          @update:value="handlePlatformChange"
        />
      </n-card>

      <n-card class="set-item">
        <div class="label">
          <n-text class="name">后端 API 状态</n-text>
          <n-text class="tip" :depth="3">显示多平台 API 后端服务器连接状态</n-text>
        </div>
        <div class="set status-indicator">
          <n-tag
            :type="backendStatusType"
            :bordered="false"
            size="small"
          >
            {{ backendStatusText }}
          </n-tag>
          <n-button
            size="small"
            secondary
            @click="checkBackendStatus"
            :loading="checking"
          >
            检查连接
          </n-button>
        </div>
      </n-card>

      <n-card class="set-item">
        <div class="label">
          <n-text class="name">启用平台个性配置</n-text>
          <n-text class="tip" :depth="3">为每个平台配置独立的主题色等设置，切换平台时自动应用</n-text>
        </div>
        <n-switch
          v-model:value="platformStore.usePlatformConfig"
          class="set"
          :round="false"
          @update:value="handleUsePlatformConfigChange"
        />
      </n-card>

      <n-collapse-transition :show="platformStore.usePlatformConfig">
        <n-card class="platform-config-container">
          <n-tabs type="segment" animated>
            <n-tab-pane name="netease" tab="网易云音乐">
              <n-space vertical :size="12" style="margin-top: 12px">
                <n-card class="set-item">
                  <div class="label">
                    <n-text class="name">主题色</n-text>
                    <n-text class="tip" :depth="3">切换到该平台时自动应用</n-text>
                  </div>
                  <n-select
                    v-model:value="platformConfigsLocal[Platform.NETEASE].themeColorType"
                    class="set"
                    :options="themeColorOptions"
                    @update:value="handleThemeColorChange(Platform.NETEASE)"
                  />
                </n-card>
                <n-collapse-transition
                  :show="platformConfigsLocal[Platform.NETEASE].themeColorType === 'custom'"
                >
                  <n-card class="set-item">
                    <div class="label">
                      <n-text class="name">自定义颜色</n-text>
                    </div>
                    <n-color-picker
                      v-model:value="platformConfigsLocal[Platform.NETEASE].themeCustomColor"
                      class="set"
                      :show-alpha="false"
                      :modes="['hex']"
                      @update:value="handleCustomColorChange(Platform.NETEASE)"
                    />
                  </n-card>
                </n-collapse-transition>
              </n-space>
            </n-tab-pane>
            <n-tab-pane name="qqmusic" tab="QQ 音乐">
              <n-space vertical :size="12" style="margin-top: 12px">
                <n-card class="set-item">
                  <div class="label">
                    <n-text class="name">主题色</n-text>
                    <n-text class="tip" :depth="3">切换到该平台时自动应用</n-text>
                  </div>
                  <n-select
                    v-model:value="platformConfigsLocal[Platform.QQMUSIC].themeColorType"
                    class="set"
                    :options="themeColorOptions"
                    @update:value="handleThemeColorChange(Platform.QQMUSIC)"
                  />
                </n-card>
                <n-collapse-transition
                  :show="platformConfigsLocal[Platform.QQMUSIC].themeColorType === 'custom'"
                >
                  <n-card class="set-item">
                    <div class="label">
                      <n-text class="name">自定义颜色</n-text>
                    </div>
                    <n-color-picker
                      v-model:value="platformConfigsLocal[Platform.QQMUSIC].themeCustomColor"
                      class="set"
                      :show-alpha="false"
                      :modes="['hex']"
                      @update:value="handleCustomColorChange(Platform.QQMUSIC)"
                    />
                  </n-card>
                </n-collapse-transition>
              </n-space>
            </n-tab-pane>
          </n-tabs>
        </n-card>
      </n-collapse-transition>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from "vue";
import { usePlatformStore } from "@/stores/platform";
import type { PlatformConfig } from "@/stores/platform";
import { Platform } from "@/services/apiConfig";
import themeColor from "@/assets/data/themeColor.json";

const platformStore = usePlatformStore();

// ==================== 平台主题配置 ====================
// 主题色选项（复用 themeColor.json）
const themeColorOptions = computed(() => {
  return Object.entries(themeColor).map(([key, value]) => ({
    label: value.name,
    value: key,
    style: {
      color: value.color,
    },
  }));
});

// 本地配置副本（用于编辑）
const platformConfigsLocal = reactive<Record<Platform, PlatformConfig>>({
  [Platform.NETEASE]: { ...platformStore.platformConfigs[Platform.NETEASE] },
  [Platform.QQMUSIC]: { ...platformStore.platformConfigs[Platform.QQMUSIC] },
});

// 启用平台个性配置的变化处理
const handleUsePlatformConfigChange = (value: boolean) => {
  if (value) {
    window.$message.success("已启用平台个性配置，切换平台时将自动应用对应主题色");
    // 立即应用当前平台的配置
    platformStore.applyPlatformTheme(platformStore.currentPlatform);
  } else {
    window.$message.info("已禁用平台个性配置，将使用全局主题色");
  }
};

// 主题色类型变化处理
const handleThemeColorChange = (platform: Platform) => {
  const config = platformConfigsLocal[platform];
  platformStore.updatePlatformConfig(platform, config);
  const platformName = platform === Platform.NETEASE ? "网易云音乐" : "QQ 音乐";
  window.$message.success(`${platformName}主题色已更新`);
};

// 自定义颜色变化处理
const handleCustomColorChange = (platform: Platform) => {
  const config = platformConfigsLocal[platform];
  platformStore.updatePlatformConfig(platform, config);
  const platformName = platform === Platform.NETEASE ? "网易云音乐" : "QQ 音乐";
  window.$message.success(`${platformName}自定义主题色已更新`);
};

// 平台选项
const platformOptions = [
  { label: "网易云音乐", value: Platform.NETEASE },
  { label: "QQ 音乐", value: Platform.QQMUSIC },
];

// 当前平台
const currentPlatform = ref(platformStore.currentPlatform);

// 后端状态
const checking = ref(false);

// 后端状态类型
const backendStatusType = computed(() => {
  if (platformStore.backendStatus.online) {
    return "success";
  } else if (platformStore.backendStatus.lastCheck > 0) {
    return "error";
  } else {
    return "default";
  }
});

// 后端状态文本
const backendStatusText = computed(() => {
  if (platformStore.backendStatus.online) {
    return "在线";
  } else if (platformStore.backendStatus.lastCheck > 0) {
    return "离线";
  } else {
    return "未检查";
  }
});

// 切换平台
const handlePlatformChange = (value: Platform) => {
  platformStore.switchPlatform(value);
  window.$message.success(
    `已切换到 ${value === Platform.NETEASE ? "网易云音乐" : "QQ 音乐"}`,
  );
};

// 检查后端状态
const checkBackendStatus = async () => {
  checking.value = true;
  try {
    await platformStore.checkBackendStatus();
    if (platformStore.backendStatus.online) {
      window.$message.success("后端服务连接正常");
    } else {
      window.$message.error("后端服务连接失败，请检查服务是否正常运行");
    }
  } catch {
    window.$message.error("检查失败，请稍后重试");
  } finally {
    checking.value = false;
  }
};

onMounted(() => {
  // 组件挂载时检查后端状态
  platformStore.checkBackendStatus();
});
</script>

<style lang="scss" scoped>
.setting-type {
  .set-list {
    margin-bottom: 40px;

    &:last-child {
      margin-bottom: 0;
    }

    .set-item {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 12px;
      transition:
        background-color 0.3s,
        transform 0.3s;

      &:last-child {
        margin-bottom: 0;
      }

      &:hover {
        transform: scale(1.01);
      }

      .label {
        max-width: 70%;
        margin-right: 20px;

        .name {
          font-size: 16px;
          font-weight: bold;
        }

        .tip {
          font-size: 13px;
          line-height: 1.8;
        }
      }

      .set {
        min-width: 120px;

        &.status-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
        }
      }
    }

    :deep(.n-alert) {
      margin-top: 12px;
    }

    .platform-config-container {
      margin-top: 12px;
      padding: 0;
      
      :deep(.n-card__content) {
        padding: 0;
      }
      
      :deep(.n-tabs) {
        .n-tabs-nav {
          padding: 16px 16px 0;
        }
        
        .n-tabs-pane-wrapper {
          padding: 0 16px 16px;
        }
      }
    }


  }
}
</style>
