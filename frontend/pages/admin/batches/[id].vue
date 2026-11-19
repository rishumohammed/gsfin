<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { onMounted } from 'vue';

const route = useRoute();
const router = useRouter();

onMounted(() => {
  router.replace(`/admin/multi-tenant/batches/${route.params.id}`);
});
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <span class="spinner-sm-red"></span>
  </div>
</template>

