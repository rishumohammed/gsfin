<template>
  <div class="pa-12 text-center">
    <div class="spinner-sm-red mx-auto"></div>
    <div class="mt-4 text-slate-500 font-medium text-sm">Redirecting to Proctoring Governance Hub...</div>
  </div>
</template>

<script setup lang="ts">
import { navigateTo } from '#imports';

definePageMeta({
  layout: 'dashboard',
  middleware: [() => navigateTo('/dashboard/admin/public-exams/proctoring')]
});
</script>

<style scoped>
.spinner-sm-red {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(227, 27, 35, 0.2);
  border-top-color: #E31B23;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
