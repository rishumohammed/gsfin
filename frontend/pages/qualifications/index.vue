<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #fff;">
    <div style="text-align: center; color: #64748b;">
      <p style="font-weight: 500;">Redirecting to Certifications...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: [
    () => navigateTo('/#schemes')
  ]
});

onMounted(() => {
  navigateTo('/#schemes');
});
</script>
