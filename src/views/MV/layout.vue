<template>
  <div class="mv-layout">
    <!-- 标题 -->
    <div class="header">
      <n-text class="title">视频</n-text>
    </div>
    <!-- 标签页 -->
    <n-tabs
      v-model:value="mvType"
      class="tabs"
      type="line"
      @update:value="(name: string) => router.push({ name })"
    >
      <n-tab name="mv-recommend"> 推荐 </n-tab>
      <n-tab name="mv-toplist"> 排行榜 </n-tab>
      <n-tab name="mv-library"> 视频库 </n-tab>
    </n-tabs>
    <!-- 路由 -->
    <RouterView v-slot="{ Component }">
      <Transition :name="`router-${settingStore.routeAnimation}`" mode="out-in">
        <KeepAlive v-if="settingStore.useKeepAlive">
          <component :is="Component" class="router-view" />
        </KeepAlive>
        <component v-else :is="Component" class="router-view" />
      </Transition>
    </RouterView>
  </div>
</template>

<script setup lang="ts">
import { useSettingStore } from "@/stores";

const router = useRouter();
const settingStore = useSettingStore();

// MV 路由
const mvType = ref<string>((router.currentRoute.value?.name as string) || "mv-recommend");
</script>

<style lang="scss" scoped>
.mv-layout {
  display: flex;
  flex-direction: column;

  .header {
    margin-top: 12px;
    margin-bottom: 20px;

    .title {
      font-size: 30px;
      font-weight: bold;
      line-height: normal;
    }
  }

  .tabs {
    margin-bottom: 30px;

    :deep(.n-tabs-nav) {
      --n-tab-font-size: 16px;
      --n-tab-border-color: transparent;
    }
  }
}
</style>
