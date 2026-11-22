<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();
navigateTo({ path: `/admin/partners/${route.params.id}`, query: route.query }, { replace: true });
</script>

<template>
  <div class="flex items-center justify-center min-h-[400px]">
    <span class="spinner-sm-red"></span>
  </div>
</template>
