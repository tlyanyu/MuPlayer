<template>
  <div class="like-type">
    <CoverList :data="dataStore.currentUserLikeData.albums" :loading="true" type="album" />
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from "@/stores";

const dataStore = useDataStore();
</script>
