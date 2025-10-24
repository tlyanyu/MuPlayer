<template>
  <div class="setting-type">
    <div v-if="isElectron" class="set-list">
      <!-- 后端服务器 -->
      <n-h3 prefix="bar">后端服务器</n-h3>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">后端 API 地址</n-text>
          <n-text class="tip" :depth="3">配置多平台音乐 API 后端地址，修改后自动重载服务器</n-text>
        </div>
        <n-flex>
          <n-button type="primary" strong secondary @click="saveApiBackend"> 保存 </n-button>
          <n-input
            v-model:value="apiBackendUrl"
            placeholder="请填写后端 API 地址，如 http://localhost:3000"
            class="set"
          />
        </n-flex>
      </n-card>

      <!-- 网络代理 -->
      <n-h3 prefix="bar">网络代理</n-h3>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">网络代理</n-text>
          <n-text class="tip" :depth="3">配置网络代理，修改后自动重载服务器</n-text>
        </div>
        <n-flex>
          <n-button type="primary" strong secondary @click="setProxy"> 保存并应用 </n-button>
          <n-select
            v-model:value="settingStore.proxyProtocol"
            :options="[
              {
                label: '关闭代理',
                value: 'off',
              },
              {
                label: 'HTTP 代理',
                value: 'HTTP',
              },
              {
                label: 'HTTPS 代理',
                value: 'HTTPS',
              },
            ]"
            class="set"
          />
        </n-flex>
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">代理服务器地址</n-text>
          <n-text class="tip" :depth="3">请填写代理服务器地址，如 172.27.112.1</n-text>
        </div>
        <n-input
          v-model:value="settingStore.proxyServe"
          :disabled="settingStore.proxyProtocol === 'off'"
          placeholder="请填写代理服务器地址"
          class="set"
        >
          <template #prefix>
            <n-text depth="3">
              {{ settingStore.proxyProtocol === "off" ? "-" : settingStore.proxyProtocol }}
            </n-text>
          </template>
        </n-input>
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">代理服务器端口</n-text>
          <n-text class="tip" :depth="3">请填写代理服务器端口，如 7890</n-text>
        </div>
        <n-input-number
          v-model:value="settingStore.proxyPort"
          :disabled="settingStore.proxyProtocol === 'off'"
          :show-button="false"
          :min="1"
          :max="65535"
          placeholder="请填写代理服务器端口"
          class="set"
        />
      </n-card>
      <n-collapse-transition :show="settingStore.proxyProtocol !== 'off'">
        <n-card class="set-item">
          <div class="label">
            <n-text class="name">测试代理</n-text>
            <n-text class="tip" :depth="3">测试代理配置是否可正常连通</n-text>
          </div>
          <n-button :loading="testProxyLoading" type="primary" strong secondary @click="testProxy">
            测试代理
          </n-button>
        </n-card>
      </n-collapse-transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { isElectron } from "@/utils/helper";
import { useSettingStore } from "@/stores";
import { debounce } from "lodash-es";

const settingStore = useSettingStore();
const apiBackendUrl = ref<string>("http://localhost:3000");
const testProxyLoading = ref<boolean>(false);

// 获取当前代理配置
const proxyConfig = computed(() => ({
  protocol: settingStore.proxyProtocol,
  server: settingStore.proxyServe,
  port: settingStore.proxyPort,
}));

onMounted(async () => {
  if (isElectron && window.api) {
    try {
      apiBackendUrl.value = await window.api.getApiBackend();
    } catch (error) {
      console.error("获取后端地址失败:", error);
      window.$message.error("获取后端地址失败");
    }
  }
});

// 保存后端地址
const saveApiBackend = debounce(() => {
  if (!apiBackendUrl.value) {
    window.$message.warning("请填写后端 API 地址");
    return;
  }

  window.$dialog.info({
    title: "提示",
    content: `将后端地址设置为 ${apiBackendUrl.value}，设置后将自动重载服务器，是否继续？`,
    positiveText: "保存",
    negativeText: "取消",
    onPositiveClick: async () => {
      try {
        // 保存配置
        window.api.setApiBackend(apiBackendUrl.value);
        window.$message.loading("正在重载服务器...", { duration: 0 });

        // 重载服务器
        const result = await window.api.reloadServer();
        window.$message.destroyAll();

        if (result.success) {
          window.$message.success("服务器重载成功，正在刷新页面...");
          // 延迟一下再重载页面，让用户看到成功消息
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else {
          window.$message.error(`服务器重载失败: ${result.error || "未知错误"}`);
        }
      } catch (error) {
        window.$message.destroyAll();
        console.error("保存后端地址失败:", error);
        window.$message.error("保存后端地址失败");
      }
    },
  });
}, 300);

// 应用代理
const setProxy = debounce(async () => {
  // 关闭代理
  if (settingStore.proxyProtocol === "off" || !settingStore.proxyServe || !settingStore.proxyPort) {
    window.electron.ipcRenderer.send("remove-proxy");

    // 热重载服务器使配置生效
    if ((window as any).api?.reloadServer) {
      window.$message.loading("正在重载服务器...", { duration: 0 });
      const result = await (window as any).api.reloadServer();
      window.$message.destroyAll();

      if (result.success) {
        window.$message.success("代理已关闭，服务器重载成功", { duration: 2000 });
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        window.$message.error(`服务器重载失败: ${result.error || "未知错误"}`);
      }
    } else {
      window.$message.success("成功关闭网络代理");
    }
    return;
  }

  // 设置代理
  window.electron.ipcRenderer.send("set-proxy", proxyConfig.value);

  // 热重载服务器使配置生效
  if ((window as any).api?.reloadServer) {
    window.$message.loading("正在重载服务器...", { duration: 0 });
    const result = await (window as any).api.reloadServer();
    window.$message.destroyAll();

    if (result.success) {
      window.$message.success("代理配置成功，服务器重载成功", { duration: 2000 });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      window.$message.error(`服务器重载失败: ${result.error || "未知错误"}`);
    }
  } else {
    window.$message.success("网络代理配置完成，请重启软件");
  }
}, 300);

// 测试代理
const testProxy = async () => {
  testProxyLoading.value = true;
  const result = await window.electron.ipcRenderer.invoke("test-proxy", proxyConfig.value);
  if (result) {
    window.$message.success("该代理可正常使用");
  } else {
    window.$message.error("代理测试失败，请重试");
  }
  testProxyLoading.value = false;
};
</script>

