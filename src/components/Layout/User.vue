<template>
  <n-popover trigger="manual" :show="userMenuShow" @clickoutside="userMenuShow = false">
    <template #trigger>
      <div
        class="user"
        :style="{ pointerEvents: userMenuShow ? 'none' : 'auto' }"
        @click="openMenu"
      >
        <div class="avatar">
          <n-avatar
            v-if="dataStore.currentLoginStatus"
            :src="dataStore.currentUserData?.avatarUrl"
            fallback-src="/images/avatar.jpg?assest"
            round
          />
          <n-avatar v-else round>
            <SvgIcon name="Person" :depth="3" size="26" />
          </n-avatar>
        </div>
        <div class="user-data">
          <n-text class="name">
            {{ dataStore.currentLoginStatus ? dataStore.currentUserData.name || "未知用户名" : "未登录" }}
          </n-text>
          <!-- VIP -->
          <img
            v-if="dataStore.currentLoginStatus && dataStore.currentUserData.vipType !== 0"
            class="vip"
            :src="vipIconPath"
          />
          <SvgIcon :class="['down', { open: userMenuShow }]" name="DropDown" :depth="3" />
        </div>
      </div>
    </template>
    <div class="user-menu" @click="userMenuShow = false">
      <!-- 喜欢数量 -->
      <div class="like-num">
        <div
          v-for="(item, index) in userLikeData"
          :key="index"
          class="num-item"
          @click="router.push({ name: item.name })"
        >
          <n-number-animation :from="0" :to="item.value" />
          <n-text :depth="3">{{ item.label }}</n-text>
        </div>
      </div>
      <n-divider />
      <!-- 登录信息（仅 QQ 音乐 + 二维码登录显示） -->
      <div 
        v-if="showRefreshControl"
        class="login-info"
      >
        <n-flex vertical :size="8">
          <!-- 上次登录时间 -->
          <n-flex align="center" justify="space-between">
            <n-text :depth="3" style="font-size: 12px">上次登录</n-text>
            <n-text style="font-size: 12px">{{ lastLoginTime }}</n-text>
          </n-flex>
          
          <!-- 刷新登录按钮 -->
          <n-button
            :focusable="false"
            :loading="refreshing"
            class="refresh-login"
            strong
            secondary
            round
            @click.stop="handleRefreshLogin"
          >
            <template #icon>
              <SvgIcon name="Refresh" />
            </template>
            刷新登录
          </n-button>
        </n-flex>
      </div>
      <n-divider v-if="showRefreshControl" />
      <!-- 退出登录 -->
      <n-button :focusable="false" class="logout" strong secondary round @click="isLogout">
        <template #icon>
          <SvgIcon name="Power" />
        </template>
        退出登录
      </n-button>
    </div>
  </n-popover>
</template>

<script setup lang="ts">
import { useDataStore, usePlatformStore } from "@/stores";
import { Platform } from "@/services/apiConfig";
import dayjs from "dayjs";

import { openUserLogin } from "@/utils/modal";
import {
  toLogout,
  isLogin,
  refreshLoginData,
} from "@/utils/auth";

const router = useRouter();
const dataStore = useDataStore();
const platformStore = usePlatformStore();


// 用户菜单展示
const userMenuShow = ref<boolean>(false);

// 刷新状态
const refreshing = ref(false);

// VIP 图标路径
const vipIconPath = computed(() => {
  return platformStore.currentPlatform === Platform.NETEASE
    ? "/images/vip-netease.png?assest"
    : "/images/vip-qq.png?assest";
});

// 开启用户菜单
const openMenu = () => {
  if (dataStore.currentLoginStatus) {
    userMenuShow.value = !userMenuShow.value;
  } else {
    // 未登录时打开登录弹窗
    openUserLogin();
  }
};

// 用户喜欢数据
const userLikeData = computed(() => {
  return [
    {
      label: "歌单",
      name: "like-playlists",
      value: dataStore.currentUserLikeData.playlists.length,
    },
    {
      label: "专辑",
      name: "like-albums",
      value: dataStore.currentUserLikeData.albums.length,
    },
    {
      label: "歌手",
      name: "like-artists",
      value: dataStore.currentUserLikeData.artists.length,
    },
  ];
});

// 是否显示刷新控件（QQ 音乐 + 二维码登录）
const showRefreshControl = computed(() => {
  const platform = platformStore.currentPlatform;
  const platformData = dataStore.platformUsers[platform];
  
  return (
    dataStore.currentLoginStatus &&
    platform === Platform.QQMUSIC &&
    platformData.loginType === 'qr'
  );
});

// 上次登录时间（格式化为固定格式，精确到分钟）
const lastLoginTime = computed(() => {
  const platformData = dataStore.platformUsers[platformStore.currentPlatform];
  const time = platformData.lastLoginTime;

  if (!time) return "未知";

  // 使用固定格式：YYYY-MM-DD HH:mm
  const currentYear = dayjs().year();
  const loginYear = dayjs(time).year();

  // 如果是今年，省略年份显示
  if (currentYear === loginYear) {
    return dayjs(time).format("MM-DD HH:mm");
  }

  // 跨年则显示完整日期
  return dayjs(time).format("YYYY-MM-DD HH:mm");
});

// 手动刷新登录
const handleRefreshLogin = async () => {
  refreshing.value = true;
  
  try {
    const result = await refreshLoginData(undefined, false, true); // 非静默模式 + 强制刷新
    
    if (result.success) {
      // 刷新成功，关闭菜单
      userMenuShow.value = false;
    }
  } catch (error) {
    console.error("刷新登录异常:", error);
    window.$message.error("刷新登录时发生错误");
  } finally {
    refreshing.value = false;
  }
};

// 退出登录
const isLogout = () => {
  if (!isLogin()) {
    openUserLogin();
    return;
  }
  window.$dialog.warning({
    title: "退出登录",
    content: "确认退出当前用户登录？",
    positiveText: "确认登出",
    negativeText: "取消",
    onPositiveClick: () => toLogout(),
  });
};
</script>

<style lang="scss" scoped>
.user {
  display: flex;
  align-items: center;
  height: 34px;
  border-radius: 25px;
  background-color: rgba(var(--primary), 0.08);
  transition: background-color 0.3s;
  cursor: pointer;
  -webkit-app-region: no-drag;
  .avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    min-width: 38px;
    border-radius: 50%;
    border: 2px solid rgba(var(--primary), 0.28);
    .n-avatar {
      width: 100%;
      height: 100%;
    }
  }
  .user-data {
    display: flex;
    align-items: center;
    padding-left: 8px;
    max-width: 200px;
    .vip {
      margin-left: 6px;
      height: 18px;
    }
    .down {
      font-size: 26px;
      margin-right: 4px;
      transition: transform 0.3s;
      &.open {
        transform: rotate(180deg);
      }
    }
  }
  &:hover {
    background-color: rgba(var(--primary), 0.28);
  }
  &:active {
    background-color: rgba(var(--primary), 0.12);
  }
}
.user-menu {
  display: flex;
  justify-content: center;
  flex-direction: column;
  padding: 6px 8px;
  .like-num {
    display: flex;
    justify-content: space-around;
    .num-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      .n-text {
        font-size: 12px;
        font-weight: normal;
      }
    }
  }
  .login-info {
    margin: 8px 0;
  }
  .refresh-login,
  .logout {
    width: 100%;
  }
  .n-divider {
    margin: 12px 0;
  }
}
</style>
