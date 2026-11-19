<script setup lang="ts">
import { navigateTo } from '#imports';

definePageMeta({
  layout: 'dashboard'
});

navigateTo('/dashboard/admin/inquiries', { replace: true });
</script>

<template>
  <div class="pa-12 text-center">
    <span class="spinner-sm-red"></span>
  </div>
</template>
