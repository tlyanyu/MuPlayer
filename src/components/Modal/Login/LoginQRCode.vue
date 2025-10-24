<template>
  <div class="login-qrcode">
    <div class="qr-img">
      <div
        v-if="qrImg"
        :class="['qr', { success: qrStatusCode === 802, error: qrStatusCode === 800 }]"
      >
        <!-- 如果是base64图片(QQ音乐),直接显示图片 -->
        <img
          v-if="qrImg.startsWith('data:image')"
          :src="qrImg"
          class="qr-image"
          alt="二维码"
        />
        <!-- 如果是URL(网易云音乐),生成二维码 -->
        <n-qr-code
          v-else
          :value="qrImg"
          :size="160"
          :icon-size="30"
          icon-src="/icons/favicon.png?assest"
          error-correction-level="H"
        />
        <!-- 待确认 -->
        <Transition name="fade" mode="out-in">
          <div v-if="loginName" class="login-data">
            <n-image
              :src="loginAvatar.replace(/^http:/, 'https:') + '?param=100y100'"
              class="cover"
              preview-disabled
              @load="coverLoaded"
            >
              <template #placeholder>
                <div class="cover-loading">
                  <img src="/images/avatar.jpg?assest" class="loading-img" alt="loading-img" />
                </div>
              </template>
            </n-image>
            <n-text>{{ loginName }}</n-text>
          </div>
        </Transition>
      </div>
      <n-skeleton v-else class="qr" />
    </div>
    <n-text class="tip" depth="3">{{ qrTipText }}</n-text>
  </div>
</template>

<script setup lang="ts">
import { qrKey, checkQr } from "@/api/login";
import { LoginType } from "@/types/main";
import { coverLoaded } from "@/utils/helper";

const props = defineProps<{
  pause?: boolean;
}>();

const emit = defineEmits<{
  saveLogin: [any, LoginType];
}>();

// 状态提示
const qrCodeTip = {
  800: "二维码过期，即将重试",
  801: "请打开云音乐 APP 或 手机QQ 扫码登录",
  802: "扫描成功，请在客户端确认登录",
  803: "登录成功",
} as const;

// 二维码数据
const qrImg = ref<string>("");
const qrUnikey = ref<string>("");
const qrStatusCode = ref<keyof typeof qrCodeTip>(801);

// 提示文本
const qrTipText = computed(() => {
  return qrCodeTip[qrStatusCode.value] || "遇到未知状态，请重试";
});

// 待确认数据
const loginName = ref<string>("");
const loginAvatar = ref<string>("");

// 登录成功标志 - 防止轮询重入
const isLoginSuccess = ref<boolean>(false);

// 组件卸载标志 - 防止组件销毁后异步请求继续执行
const isUnmounted = ref<boolean>(false);

// 获取二维码
const getQrData = async () => {
  // 组件已卸载则不执行
  if (isUnmounted.value) return;
  
  try {
    pauseCheck();
    isLoginSuccess.value = false; // 重置登录成功标志
    qrStatusCode.value = 801;
    loginName.value = "";
    loginAvatar.value = "";
    // 获取 key
    const res = await qrKey();
    if (isUnmounted.value) return; // 再次确认组件状态
    // 实际返回结构: { body: { data: { unikey, qrImg? } } }
    const unikey = res.body?.data?.unikey;
    const qrImgData = res.body?.data?.qrImg; // QQ音乐返回base64

    if (!unikey) {
      console.error("二维码获取失败：未返回 unikey", res);
      window.$message.error("二维码获取失败，请重试");
      return;
    }

    if (qrImgData && qrImgData.startsWith('data:image')) {
      qrImg.value = qrImgData; // 直接使用base64图片
    } else {
      qrImg.value = `https://music.163.com/login?codekey=${unikey}`; // 拼接URL
    }

    // 更改 key
    qrUnikey.value = unikey;
    // 检查状态
    if (isUnmounted.value) return; 
    resumeCheck();
  } catch (error) {
    if (isUnmounted.value) return; 
    pauseCheck();
    console.error("二维码获取失败：", error);
    window.$message.error("二维码获取失败，请检查网络连接");
  }
};

// 检查二维码状态
const checkQrStatus = async () => {
  // 登录成功后立即阻止后续轮询
  if (!qrUnikey.value || props.pause || isLoginSuccess.value || isUnmounted.value) return;
  try {
    // 检查状态
    const res = await checkQr(qrUnikey.value);
    
    // 检查组件是否已卸载
    if (isUnmounted.value) return;
    
    // 实际返回结构: { body: { code, message }, cookie: [...] }
    const { code, nickname, avatarUrl } = res.body || {};

    switch (code) {
      // 二维码过期
      case 800:
        // 调用 getQrData 前再次检查
        if (isUnmounted.value) return;
        qrStatusCode.value = 800;
        getQrData();
        break;
      // 等待扫码
      case 801:
        qrStatusCode.value = 801;
        break;
      // 待确认
      case 802:
        qrStatusCode.value = 802;
        loginName.value = nickname || "";
        loginAvatar.value = avatarUrl || "";
        break;
      // 登录成功
      case 803: {
        // 处理登录前检查组件状态
        if (isUnmounted.value) return;
        
        // 立即设置标志，阻止任何后续轮询
        isLoginSuccess.value = true;
        qrStatusCode.value = 803;
        pauseCheck();

        // 处理 cookie 数据
        if (res.cookie) {
          try {
            
            const cookiesObj = res.cookie;

            if (cookiesObj && typeof cookiesObj === 'object' && Object.keys(cookiesObj).length > 0) {
              console.log("✅ 登录成功，获取到 cookies");
              // 储存登录信息
              emit("saveLogin", {
                code: 200,
                cookies: cookiesObj,
                expireTime: res.expireTime
              }, "qr");
            } else {
              console.error("❌ 登录失败：cookies 对象为空或格式错误");
              window.$message.error("登录失败，未获取到有效凭证，请重试");
              getQrData();
            }
          } catch (error) {
            console.error("❌ Cookie 处理失败", error);
            window.$message.error("登录失败，Cookie 格式错误，请重试");
            getQrData();
          }
        } else {
          console.error("❌ 登录失败：未返回 cookie 字段");
          window.$message.error("登录失败，未获取到有效凭证，请重试");
          getQrData();
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    // 检查组件状态
    if (isUnmounted.value) return;
    console.error("检查二维码状态失败：", error);
    // 出错时不中断轮询，继续尝试
  }
};

// 控制检查二维码
const { pause: pauseCheck, resume: resumeCheck } = useIntervalFn(checkQrStatus, 1000, {
  immediate: false,
});

onMounted(getQrData);
onBeforeUnmount(() => {
  // 先设置卸载标志，阻断所有异步回调
  isUnmounted.value = true;
  // 停止定时器
  pauseCheck();
});
</script>

<style lang="scss" scoped>
.login-qrcode {
  display: flex;
  flex-direction: column;
  align-items: center;
  .qr-img {
    display: flex;
    margin: 20px 0;
    width: 180px;
    height: 180px;
    border-radius: 12px;
    overflow: hidden;
    .qr {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      .n-qr-code {
        padding: 0;
        height: 180px;
        width: 180px;
        min-height: 180px;
        min-width: 180px;
        transition:
          opacity 0.3s,
          filter 0.3s;
        :deep(canvas) {
          width: 100% !important;
          height: 100% !important;
        }
      }
      .qr-image {
        width: 180px;
        height: 180px;
        display: block;
        transition:
          opacity 0.3s,
          filter 0.3s;
      }
      .login-data {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 1;
        .cover {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          margin-bottom: 8px;
        }
      }
      &.success {
        .n-qr-code,
        .qr-image {
          opacity: 0.5;
          filter: blur(4px);
        }
      }
    }
  }
  .tip {
    margin-bottom: 12px;
  }
}
</style>
