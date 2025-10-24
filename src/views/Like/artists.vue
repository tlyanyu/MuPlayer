<template>
  <div class="like-type">
    <ArtistList :data="dataStore.currentUserLikeData.artists" :loading="true" />
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from "@/stores";

const dataStore = useDataStore();
</script>
