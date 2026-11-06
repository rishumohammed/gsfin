<template>
  <div v-if="totalItems > 0" class="app-pagination-container">
    <!-- Left: Status Info -->
    <div class="pagination-info">
      Showing <strong>{{ startItem }}</strong>–<strong>{{ endItem }}</strong> of <strong>{{ totalItems }}</strong> items
    </div>

    <!-- Right: Per-page selector & Page navigation -->
    <div class="pagination-actions">
      <!-- Items per page dropdown -->
      <div v-if="showPerPage" class="per-page-wrap">
        <span class="per-page-label">Rows per page:</span>
        <select
          :value="itemsPerPage"
          class="per-page-select"
          @change="handlePerPageChange"
        >
          <option v-for="opt in perPageOptions" :key="opt" :value="opt">
            {{ opt }}
          </option>
        </select>
      </div>

      <!-- Navigation buttons -->
      <div class="page-buttons-group">
        <!-- Previous -->
        <button
          type="button"
          class="page-btn nav-btn"
          :disabled="modelValue <= 1"
          title="Previous Page"
          @click="changePage(modelValue - 1)"
        >
          <i class="mdi mdi-chevron-left"></i>
        </button>

        <!-- Page Numbers -->
        <template v-for="(p, idx) in visiblePages" :key="idx">
          <span v-if="p === '...'" class="page-ellipsis">...</span>
          <button
            v-else
            type="button"
            :class="['page-btn', 'page-num-btn', p === modelValue ? 'active' : '']"
            @click="changePage(Number(p))"
          >
            {{ p }}
          </button>
        </template>

        <!-- Next -->
        <button
          type="button"
          class="page-btn nav-btn"
          :disabled="modelValue >= totalPages"
          title="Next Page"
          @click="changePage(modelValue + 1)"
        >
          <i class="mdi mdi-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: number;
    totalItems: number;
    itemsPerPage?: number;
    perPageOptions?: number[];
    showPerPage?: boolean;
  }>(),
  {
    itemsPerPage: 10,
    perPageOptions: () => [10, 25, 50, 100],
    showPerPage: true
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', page: number): void;
  (e: 'update:itemsPerPage', size: number): void;
  (e: 'change', page: number): void;
}>();

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(props.totalItems / props.itemsPerPage));
});

const startItem = computed(() => {
  if (props.totalItems === 0) return 0;
  return (props.modelValue - 1) * props.itemsPerPage + 1;
});

const endItem = computed(() => {
  return Math.min(props.totalItems, props.modelValue * props.itemsPerPage);
});

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = props.modelValue;

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];
  pages.push(1);

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  pages.push(total);
  return pages;
});

function changePage(page: number) {
  if (page < 1 || page > totalPages.value || page === props.modelValue) return;
  emit('update:modelValue', page);
  emit('change', page);
}

function handlePerPageChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const newSize = Number(target.value);
  emit('update:itemsPerPage', newSize);
  emit('update:modelValue', 1);
  emit('change', 1);
}
</script>

<style scoped>
.app-pagination-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #FFFFFF;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  flex-wrap: wrap;
  gap: 14px;
  font-size: 0.82rem;
  color: #64748B;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 4px;
}
.pagination-info strong {
  color: #0F172A;
  font-weight: 600;
}

.pagination-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.per-page-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.per-page-label {
  font-size: 0.78rem;
  color: #64748B;
  font-weight: 600;
}
.per-page-select {
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  color: #0F172A;
  font-size: 0.8rem;
  font-weight: 600;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
}
.per-page-select:focus {
  border-color: #E31B23;
}

.page-buttons-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #FFFFFF;
  color: #334155;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}
.page-btn:hover:not(:disabled) {
  background: #F8FAFC;
  border-color: rgba(227, 27, 35, 0.3);
  color: #E31B23;
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: rgba(15, 23, 42, 0.05);
  background: #F8FAFC;
}

.page-num-btn.active {
  background: #E31B23;
  color: #FFFFFF;
  border-color: #E31B23;
  box-shadow: 0 2px 6px rgba(227, 27, 35, 0.25);
}

.nav-btn {
  font-size: 1.1rem;
}

.page-ellipsis {
  padding: 0 4px;
  color: #94A3B8;
  font-weight: 600;
}
</style>
