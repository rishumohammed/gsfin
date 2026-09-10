<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="apple-btn"
    :class="[
      variant ? `btn-${variant}` : 'btn-p',
      size ? `btn-${size}` : '',
      { 'btn-loading': loading }
    ]"
    @click="$emit('click', $event)"
  >
    <v-icon v-if="icon && !loading" :icon="icon" :size="size === 'xs' ? 14 : 16" class="mr-1"></v-icon>
    <v-progress-circular v-if="loading" indeterminate size="16" width="2" class="mr-2"></v-progress-circular>
    <slot />
  </NuxtLink>

  <button
    v-else
    class="apple-btn"
    :class="[
      variant ? `btn-${variant}` : 'btn-p',
      size ? `btn-${size}` : '',
      { 'btn-loading': loading }
    ]"
    :type="type || 'button'"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <v-icon v-if="icon && !loading" :icon="icon" :size="size === 'xs' ? 14 : 16" class="mr-1"></v-icon>
    <v-progress-circular v-if="loading" indeterminate size="16" width="2" class="mr-2"></v-progress-circular>
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'p' | 'g' | 'danger' | 'success' | 'blue';
  size?: 'sm' | 'xs' | 'lg';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  to?: string;
  color?: string;
}>();

defineEmits(['click']);
</script>

<style scoped>
.apple-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font);
  padding: 8px 16px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
  cursor: pointer;
  border: none;
  outline: none;
  text-decoration: none;
  gap: 4px;
}

/* Primary */
.btn-p,
.btn-blue {
  background-color: #2563EB;
  color: #FFFFFF !important;
  border: 1px solid #2563EB;
}
.btn-p:hover:not(:disabled),
.btn-blue:hover:not(:disabled) {
  background-color: #1D4ED8;
  color: #FFFFFF !important;
  transform: translateY(-1px);
  border: 1px solid #1D4ED8;
}

/* Ghost */
.btn-g {
  background-color: var(--paper, #FAFAF9);
  color: var(--muted, #1F2937);
  border: 1px solid rgba(0, 0, 0, 0.07);
}
.btn-g:hover:not(:disabled) {
  background-color: #E5E7EB;
  color: #111827 !important;
}

/* Danger */
.btn-danger {
  background-color: #EF4444;
  color: #FFFFFF !important;
}
.btn-danger:hover:not(:disabled) {
  background-color: #DC2626;
  color: #FFFFFF !important;
  transform: translateY(-1px);
}

/* Success */
.btn-success {
  background-color: #10B981;
  color: #FFFFFF !important;
}
.btn-success:hover:not(:disabled) {
  background-color: #059669;
  color: #FFFFFF !important;
  transform: translateY(-1px);
}

/* Sizes */
.btn-sm  { padding: 6px 12px; font-size: 12px; border-radius: var(--radius-sm); }
.btn-xs  { padding: 4px 10px; font-size: 11px; border-radius: var(--radius-sm); }
.btn-lg  { padding: 12px 24px; font-size: 15px; border-radius: var(--radius-md); }

.apple-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  border: 1px solid var(--border, #E2E8F0);
}

.apple-btn:active:not(:disabled) {
  transform: scale(0.97);
}
</style>
