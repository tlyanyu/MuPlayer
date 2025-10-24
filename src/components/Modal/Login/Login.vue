<template>
  <div class="login">
    <img src="/icons/favicon.png?assest" alt="logo" class="logo" />
    <!-- 登录方式 -->
    <n-tabs class="login-tabs" default-value="login-qr" type="segment" animated>
      <!-- 扫码登录 -->
      <n-tab-pane name="login-qr" tab="扫码登录">
        <LoginQRCode @saveLogin="saveLogin" />
      </n-tab-pane>
      <!-- Cookie登录 -->
      <n-tab-pane name="login-cookie" tab="Cookie登录">
        <LoginCookie @saveLogin="handleCookieLogin" />
      </n-tab-pane>
      <!-- 验证码登录（禁用） -->
      <n-tab-pane name="login-phone" tab="验证码登录">
        <div class="disabled-hint">
          <n-empty description="该登录方式暂不支持" size="small">
            <template #icon>
              <n-icon size="48">
                <SvgIcon name="Lock" />
              </n-icon>
            </template>
          </n-empty>
        </div>
      </n-tab-pane>
      <!-- UID登录（禁用） -->
      <n-tab-pane name="login-uid" tab="UID登录">
        <div class="disabled-hint">
          <n-empty description="该登录方式暂不支持" size="small">
            <template #icon>
              <n-icon size="48">
                <SvgIcon name="Lock" />
              </n-icon>
            </template>
          </n-empty>
        </div>
      </n-tab-pane>
    </n-tabs>
    <!-- 关闭登录 -->
    <n-button :focusable="false" class="close" strong secondary round @click="emit('close')">
      <template #icon>
        <SvgIcon name="WindowClose" />
      </template>
      取消
    </n-button>
  </div>
</template>

<script setup lang="ts">
import { setCookies } from "@/utils/cookie";
import { updateSpecialUserData, updateUserData } from "@/utils/auth";
import { useDataStore } from "@/stores";
import { usePlatformStore } from "@/stores/platform";
import { LoginType } from "@/types/main";
import LoginQRCode from "./LoginQRCode.vue";
import LoginCookie from "./LoginCookie.vue";

const emit = defineEmits<{
  close: [];
}>();

const dataStore = useDataStore();
const platformStore = usePlatformStore();

// 保存登录信息
const saveLogin = async (loginData: any, type: LoginType = "qr") => {
  console.log("loginData:", loginData);
  if (!loginData) return;

  try {
    // 保存 cookie（必须在 updateUserData 之前）
    if (type !== "uid") {
      const currentPlatform = platformStore.currentPlatform;

      // 通用Cookie处理 - 传递 platform 参数以启用核心字段过滤
      setCookies(loginData.cookies, {
        expireTime: loginData.expireTime,
        platform: currentPlatform,  // 🎯 新增: 指定平台,启用核心字段过滤和 IndexedDB 存储
      });

      // 保存平台级登录时间和登录类型
      dataStore.platformUsers[currentPlatform].lastLoginTime = Date.now();
      dataStore.platformUsers[currentPlatform].loginType = type;
      dataStore.savePlatformUsers();
    }

    // 关闭登录弹窗
    emit("close");
    window.$message.success("登录成功，正在获取用户信息...");

    // 🎯 两步登录策略：先快速登录，再后台获取完整数据
    if (type !== "uid") {
      // 步骤1：快速获取基础用户信息（不阻塞用户）
      await updateUserData(undefined, false);
      window.$message.success("用户信息加载完成");

      // 步骤2：后台异步获取完整用户数据（歌单、喜欢的歌曲等）
      // 注意：skipBasicInfo=true 避免重复调用 userDetail 和 userSubcount
      updateUserData(undefined, true, true).then(() => {
        console.log("✅ 完整用户数据同步完成");
        window.$message.info("数据同步完成", { duration: 2000 });
      }).catch(err => {
        console.error("❌ 数据同步失败：", err);
      });
    } else {
      await updateSpecialUserData(loginData?.profile);
    }
  } catch (error) {
    console.error("❌ 登录后更新用户数据失败:", error);
    window.$message.error("用户信息获取失败，请刷新页面重试");
  }
};

// Cookie登录处理
const handleCookieLogin = async (loginData: any, type: LoginType = "cookie") => {
  await saveLogin(loginData, type);
};

onBeforeMount(() => {
  if (dataStore.currentLoginStatus) {
    window.$message.warning("已登录，请勿再次操作");
    emit("close");
  }
});
</script>

<style lang="scss" scoped>
.login {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  .logo {
    width: 60px;
    height: 60px;
    margin: 20px auto 30px auto;
  }
  .disabled-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    padding: 40px 20px;
  }
  .close {
    margin-top: 20px;
    margin-bottom: 8px;
  }
}
</style>
