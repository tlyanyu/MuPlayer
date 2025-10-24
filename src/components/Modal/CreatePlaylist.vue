<template>
  <div class="create-playlist">
    <n-tabs v-model:value="playlistType" type="segment" animated>
      <n-tab-pane :disabled="isLogin() !== 1" name="online" tab="在线歌单">
        <n-form ref="onlineFormRef" :model="onlineFormData" :rules="onlineFormRules">
          <n-form-item label="歌单名称" path="name">
            <n-input v-model:value="onlineFormData.name" placeholder="请输入歌单名称" />
          </n-form-item>
          <n-form-item label="歌单类型" path="type">
            <n-select v-model:value="onlineFormData.type" :options="onlinePlaylistType" />
          </n-form-item>
          <n-form-item label="设为隐私歌单" path="privacy" label-placement="left">
            <n-switch v-model:value="onlineFormData.privacy" />
          </n-form-item>
        </n-form>
      </n-tab-pane>
      <n-tab-pane name="local" tab="本地歌单">
        <n-empty description="暂未实现" />
      </n-tab-pane>
    </n-tabs>
    <n-button class="create" type="primary" @click="toCreatePlaylist"> 新建 </n-button>
  </div>
</template>

<script setup lang="ts">
import type { FormInst, FormRules, SelectOption } from "naive-ui";
import { textRule } from "@/utils/rules";
import { debounce } from "lodash-es";
import { createPlaylist } from "@/api/playlist";
import { isLogin, updateUserLikePlaylist } from "@/utils/auth";

const emit = defineEmits<{ close: [] }>();

// 表单类型
interface OnlineFormType {
  name: string;
  type: "NORMAL" | "VIDEO" | "SHARED";
  privacy?: boolean;
}

// 歌单类别
const playlistType = ref<"online" | "local">(isLogin() === 1 ? "online" : "local");

// 在线歌单数据
const onlineFormRef = ref<FormInst | null>(null);
const onlineFormData = ref<OnlineFormType>({ name: "", type: "NORMAL", privacy: false });
const onlineFormRules: FormRules = { name: textRule };

// 在线歌单类型
const onlinePlaylistType: SelectOption[] = [
  {
    label: "普通歌单",
    value: "NORMAL",
  },
  {
    label: "视频歌单",
    disabled: true,
    value: "VIDEO",
  },
  {
    label: "共享歌单",
    disabled: true,
    value: "SHARED",
  },
];

// 新建歌单
const toCreatePlaylist = debounce(
  async (e: MouseEvent) => {
    e.preventDefault();
    if (playlistType.value === "online") {
      // 是否输入
      await onlineFormRef.value?.validate((errors) => errors);
      // 新建歌单
      const result = await createPlaylist(
        onlineFormData.value.name,
        onlineFormData.value.privacy,
        onlineFormData.value.type,
      );
      if (result.code === 200) {
        emit("close");
        window.$message.success("新建歌单成功");
        // 🔧 修复：直接刷新歌单列表（updateUserLikePlaylist 会自动重新计算计数）
        await updateUserLikePlaylist();
      } else {
        window.$message.error(result.message || "新建歌单失败，请重试");
      }
    }
  },
  300,
  { leading: true, trailing: false },
);
</script>

<style lang="scss" scoped>
.create-playlist {
  .n-form {
    margin-top: 12px;
  }
  .create {
    width: 100%;
  }
  .n-empty {
    padding: 40px 0;
  }
}
</style>
