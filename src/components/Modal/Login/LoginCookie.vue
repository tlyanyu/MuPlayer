<template>
  <div class="login-cookie">
    <n-alert :bordered="false" title="如何获取 Cookie" type="info">
      <template #icon>
        <SvgIcon name="Help" />
      </template>
      可在官方的
      <n-a :href="currentPlatformConfig.helpUrl" target="_blank">网页端</n-a>
      登录后，在浏览器开发者工具中获取 Cookie，{{ currentPlatformConfig.requiredText }}。<br />
      格式示例：<code>{{ currentPlatformConfig.formatExample }}</code><br />
      请注意：必须以 <code>;</code> 结束
    </n-alert>
    <n-input
      v-model:value="cookie"
      :autosize="{ minRows: 3, maxRows: 6 }"
      type="textarea"
      :placeholder="cookiePlaceholder"
    />
    <n-flex class="menu">
      <n-button v-if="isElectron" type="primary" @click="openWeb">自动获取</n-button>
      <n-button type="primary" @click="login">登录</n-button>
    </n-flex>
  </div>
</template>

<script setup lang="ts">
import type { LoginType } from "@/types/main";
import { isElectron } from "@/utils/helper";
import { usePlatformStore } from "@/stores/platform";
import { Platform } from "@/services/apiConfig";

const emit = defineEmits<{
  close: [];
  saveLogin: [any, LoginType];
}>();

const platformStore = usePlatformStore();
const cookie = ref<string>();

// ==================== 平台配置 ====================
interface PlatformCookieConfig {
  fields: string[];
  validator: (value: string) => { valid: boolean; message?: string };
  helpUrl: string;
  formatExample: string;
  requiredText: string;
  placeholder: string;
}

const platformConfigs: Record<Platform, PlatformCookieConfig> = {
  [Platform.NETEASE]: {
    fields: ["MUSIC_U"],
    validator: (value: string) => {
      if (!value.includes("MUSIC_U")) {
        return { valid: false, message: "必须包含 MUSIC_U 字段" };
      }
      if (!value.endsWith(";")) {
        return { valid: false, message: "必须以分号结束" };
      }
      return { valid: true };
    },
    helpUrl: "https://music.163.com/",
    formatExample: "MUSIC_U=00C7...;",
    requiredText: "只需要 MUSIC_U 字段即可",
    placeholder: "请输入网易云音乐 Cookie（需包含 MUSIC_U 字段）",
  },
  [Platform.QQMUSIC]: {
    fields: ["uin", "qm_keyst"],
    validator: (value: string) => {
      if (!value.includes("uin") || !value.includes("qm_keyst")) {
        return { valid: false, message: "必须包含 uin 和 qm_keyst 两个字段" };
      }
      const hasSemicolon = value.split(";").filter(part => part.trim()).length >= 2;
      if (!hasSemicolon) {
        return { valid: false, message: "每个字段必须以分号结束" };
      }
      return { valid: true };
    },
    helpUrl: "https://y.qq.com/",
    formatExample: "uin=123456789; qm_keyst=Q_H_L_5K...;",
    requiredText: "需要 uin 和 qm_keyst 两个字段",
    placeholder: "请输入 QQ 音乐 Cookie（需包含 uin 和 qm_keyst 字段）",
  },
};

// 当前平台配置
const currentPlatformConfig = computed(() => {
  return platformConfigs[platformStore.currentPlatform];
});

// 根据平台显示不同的占位符
const cookiePlaceholder = computed(() => {
  return currentPlatformConfig.value.placeholder;
});

// 开启窗口
const openWeb = () => {
  window.$dialog.info({
    title: "使用前告知",
    content:
      "请知悉，该功能仍旧无法确保账号的安全性！请自行决定是否使用！如遇打开窗口后页面出现白屏或者无法点击等情况，请关闭后重试",
    positiveText: "我已了解",
    negativeText: "取消",
    onPositiveClick: () => window.electron.ipcRenderer.send("open-login-web"),
  });
};

// Cookie 登录
const login = async () => {
  const config = currentPlatformConfig.value;
  const platformName = platformStore.currentPlatform === Platform.NETEASE 
    ? "网易云音乐" 
    : "QQ 音乐";

  if (!cookie.value) {
    window.$message.warning(`请输入 ${platformName} Cookie`);
    return;
  }

  const trimmedValue = cookie.value.trim();
  
  // 使用平台配置的验证器
  const validation = config.validator(trimmedValue);
  
  if (!validation.valid) {
    window.$message.warning(`Cookie 格式不正确：${validation.message}`);
    return;
  }

  // 写入 Cookie
  try {
    // 将 cookie 字符串转换为 cookies 对象
    const cookiesObj: Record<string, string> = {};
    trimmedValue.split(";").forEach((part) => {
      const [key, value] = part.split("=").map(s => s.trim());
      if (key && value) {
        cookiesObj[key] = value;
      }
    });

    // 保存登录信息
    emit(
      "saveLogin",
      {
        code: 200,
        cookies: cookiesObj,
      },
      "cookie",
    );
    // 注意：不在这里关闭或提示成功，由父组件Login.vue统一处理
  } catch (error) {
    window.$message.error("登录失败，请重试");
    console.error(`${platformName} Cookie 登录出错：`, error);
  }
};

onMounted(() => {
  if (isElectron) {
    window.electron.ipcRenderer.on("send-cookies", (_, value) => {
      if (!value) return;
      cookie.value = value;
      login();
    });
  }
});
</script>

<style lang="scss" scoped>
.login-cookie {
  .n-input,
  .n-button {
    width: 100%;
    margin-top: 20px;
  }
  code {
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: var(--n-border-color);
    padding: 4px 6px;
    border-radius: 8px;
    margin: 4px 0;
    font-family: auto;
  }
  .menu {
    margin-top: 20px;
    .n-button {
      width: auto;
      flex: 1;
      margin: 0;
    }
  }
}
</style>
