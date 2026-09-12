<template>
  <div class="categories-page min-h-screen pb-16" style="background-color: #FAFAFD;">
    <!-- Page Header -->
    <div class="bg-white border-b border-slate-200/80 shadow-xs mb-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div class="d-flex align-center gap-4">
            <v-btn
              to="/dashboard/admin/public-exams"
              icon="mdi-arrow-left"
              variant="outlined"
              color="slate"
              size="small"
              class="rounded-xl border-slate-300"
              title="Back to All Exams"
            />
            <div>
              <div class="d-flex align-center gap-2 mb-1 flex-wrap">
                <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Exam Categories Manager
                </h1>
              </div>
              <p class="text-xs sm:text-sm text-slate-500 font-medium">
                Create, edit, and toggle classification categories for certification exams and mock tests.
              </p>
            </div>
          </div>

          <div>
            <v-btn
              color="#E31B23"
              size="large"
              class="font-bold text-white text-none rounded-xl shadow-md hover:bg-red-700"
              prepend-icon="mdi-plus"
              @click="openModal()"
            >
              Add Category
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Container -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Data Table Card -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div v-if="loading" class="p-12 text-center">
          <v-progress-circular indeterminate color="#E31B23" size="48"></v-progress-circular>
          <div class="mt-4 text-xs font-bold text-slate-500">Loading categories...</div>
        </div>

        <v-data-table
          v-else
          :headers="headers"
          :items="categories"
          class="elevation-0 gsfin-exam-table"
        >
          <!-- Custom Empty State -->
          <template v-slot:no-data>
            <div class="py-16 text-center px-4">
              <div class="empty-state-icon-box">
                <v-icon icon="mdi-shape-outline" size="32" color="#E31B23"></v-icon>
              </div>
              <h3 class="text-base font-black text-slate-900 mb-1">No Categories Found</h3>
              <p class="text-xs text-slate-500 max-w-md mx-auto mb-6">
                Start by creating category classifications to organize certification exams.
              </p>
              <v-btn
                color="#E31B23"
                class="font-bold text-white text-none rounded-xl shadow-md"
                prepend-icon="mdi-plus"
                @click="openModal()"
              >
                Add Category
              </v-btn>
            </div>
          </template>

          <!-- Category Name Column -->
          <template v-slot:item.name="{ item }">
            <div class="py-3">
              <div class="font-black text-slate-900 text-sm mb-0.5">{{ item.name }}</div>
              <div class="text-xs text-slate-500 font-mono">
                slug: <strong class="text-red-600">{{ item.slug }}</strong>
              </div>
            </div>
          </template>

          <!-- Description Column -->
          <template v-slot:item.description="{ item }">
            <span class="text-xs text-slate-600 font-medium">
              {{ item.description || 'No description provided.' }}
            </span>
          </template>

          <!-- Status Column -->
          <template v-slot:item.status="{ item }">
            <span
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider',
                item.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
              ]"
            >
              {{ item.status }}
            </span>
          </template>

          <!-- Actions Column -->
          <template v-slot:item.actions="{ item }">
            <div class="action-btn-group py-2 px-1">
              <!-- Toggle Active Status -->
              <v-btn
                icon
                variant="tonal"
                size="x-small"
                :color="item.status === 'active' ? 'slate' : 'emerald'"
                class="rounded-lg"
                :title="item.status === 'active' ? 'Deactivate Category' : 'Activate Category'"
                @click="toggleStatus(item)"
              >
                <v-icon size="16" :icon="item.status === 'active' ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"></v-icon>
              </v-btn>

              <!-- Edit -->
              <v-btn
                icon="mdi-pencil-outline"
                variant="outlined"
                size="x-small"
                color="slate"
                class="rounded-lg"
                title="Edit Category"
                @click="openModal(item)"
              />

              <!-- Delete -->
              <v-btn
                icon="mdi-delete-outline"
                variant="tonal"
                size="x-small"
                color="error"
                class="rounded-lg"
                title="Delete Category"
                @click="confirmDelete(item)"
              />
            </div>
          </template>
        </v-data-table>
      </div>
    </div>

    <!-- Add / Edit Modal Dialog -->
    <v-dialog v-model="modal.show" max-width="520">
      <v-card class="modal-card pa-6 rounded-2xl bg-white border border-slate-200">
        <div class="modal-header-row">
          <h3 class="modal-header-title">
            {{ modal.isEdit ? 'Edit Category' : 'Add New Category' }}
          </h3>
          <v-btn
            icon="mdi-close"
            variant="tonal"
            size="x-small"
            color="slate"
            class="rounded-lg"
            @click="modal.show = false"
          />
        </div>

        <form @submit.prevent="saveCategory">
          <div class="form-group mb-5">
            <label class="form-label">Category Name <span class="text-red-500">*</span></label>
            <input
              v-model="modal.data.name"
              type="text"
              placeholder="e.g. UPSC Prelims or Food Safety"
              required
              class="form-input"
            />
          </div>

          <div class="form-group mb-5">
            <label class="form-label">Description</label>
            <textarea
              v-model="modal.data.description"
              rows="3"
              placeholder="Brief summary of exams under this category..."
              class="form-textarea"
            ></textarea>
          </div>

          <div class="form-group mb-6">
            <label class="form-label">Initial Visibility Status</label>
            <div class="select-input-box">
              <select v-model="modal.data.status" class="gsfin-select">
                <option value="active">Active (Visible in Catalog Filters)</option>
                <option value="inactive">Inactive (Hidden from Filters)</option>
              </select>
              <v-icon icon="mdi-chevron-down" size="18" class="select-chevron-inside"></v-icon>
            </div>
          </div>

          <div class="d-flex justify-end gap-3 pt-3 border-t border-slate-100">
            <v-btn
              variant="outlined"
              color="slate"
              class="text-none font-bold rounded-xl border-slate-300 me-3 mr-3"
              @click="modal.show = false"
            >
              Cancel
            </v-btn>
            <v-btn
              color="#E31B23"
              class="font-bold text-white text-none rounded-xl shadow-md"
              :loading="modal.loading"
              type="submit"
            >
              {{ modal.isEdit ? 'Update Category' : 'Create Category' }}
            </v-btn>
          </div>
        </form>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="440">
      <v-card class="modal-card pa-6 rounded-2xl bg-white border border-slate-200">
        <h3 class="text-lg font-black text-slate-900 mb-2">Delete Category?</h3>
        <p class="text-xs text-slate-600 mb-6">
          Are you sure you want to delete category <strong>"{{ targetCategory?.name }}"</strong>? This action is permanent and cannot be undone.
        </p>
        <div class="d-flex justify-end gap-3 pt-2 border-t border-slate-100">
          <v-btn
            variant="outlined"
            color="slate"
            class="text-none font-bold rounded-xl border-slate-300 me-3 mr-3"
            @click="deleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="#E31B23"
            class="font-bold text-white text-none rounded-xl shadow-md"
            :loading="deleting"
            @click="deleteCategory"
          >
            Delete Category
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'main_admin', 'sub_admin', 'lms_user']
});

const api = useApi();
const categories = ref<any[]>([]);
const loading = ref(true);

const deleteDialog = ref(false);
const targetCategory = ref<any>(null);
const deleting = ref(false);

const headers = [
  { title: 'Category Name', key: 'name' },
  { title: 'Description', key: 'description' },
  { title: 'Status', key: 'status', align: 'center' as const },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const }
];

const modal = reactive({
  show: false,
  isEdit: false,
  loading: false,
  data: {
    id: '',
    name: '',
    description: '',
    status: 'active'
  }
});

async function fetchCategories() {
  loading.value = true;
  try {
    const { data } = await api.get('/admin/public-exams/categories');
    categories.value = data;
  } catch (err) {
    console.error('Failed to load categories:', err);
  } finally {
    loading.value = false;
  }
}

function openModal(item: any = null) {
  if (item) {
    modal.isEdit = true;
    modal.data = {
      id: item.id,
      name: item.name,
      description: item.description || '',
      status: item.status
    };
  } else {
    modal.isEdit = false;
    modal.data = {
      id: '',
      name: '',
      description: '',
      status: 'active'
    };
  }
  modal.show = true;
}

async function saveCategory() {
  if (!modal.data.name) return;
  modal.loading = true;
  try {
    if (modal.isEdit) {
      await api.put(`/admin/public-exams/categories/${modal.data.id}`, modal.data);
    } else {
      await api.post('/admin/public-exams/categories', modal.data);
    }
    modal.show = false;
    fetchCategories();
  } catch (err: any) {
    console.error('Save category error:', err);
    alert(err.response?.data?.message || 'Error occurred while saving category.');
  } finally {
    modal.loading = false;
  }
}

async function toggleStatus(item: any) {
  const newStatus = item.status === 'active' ? 'inactive' : 'active';
  try {
    await api.put(`/admin/public-exams/categories/${item.id}`, { status: newStatus });
    item.status = newStatus;
  } catch (err) {
    console.error('Failed to toggle category status:', err);
  }
}

function confirmDelete(item: any) {
  targetCategory.value = item;
  deleteDialog.value = true;
}

async function deleteCategory() {
  if (!targetCategory.value) return;
  deleting.value = true;
  try {
    await api.delete(`/admin/public-exams/categories/${targetCategory.value.id}`);
    deleteDialog.value = false;
    targetCategory.value = null;
    fetchCategories();
  } catch (err: any) {
    console.error('Failed to delete category:', err);
    alert(err.response?.data?.message || 'Failed to delete category. Make sure it is not linked to any exam.');
  } finally {
    deleting.value = false;
  }
}

onMounted(() => {
  fetchCategories();
});
</script>

<style scoped>
.modal-card {
  background: #FFFFFF !important;
  border-radius: 20px !important;
  border: 1px solid rgba(15, 23, 42, 0.08) !important;
  overflow: hidden !important;
}

.modal-header-row {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding-bottom: 14px !important;
  margin-bottom: 20px !important;
  border-bottom: 1px solid #F1F5F9 !important;
}

.modal-header-title {
  font-size: 1.15rem !important;
  font-weight: 900 !important;
  color: #0F172A !important;
  margin: 0 !important;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.78rem;
  font-weight: 800;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #CBD5E1;
  background-color: #F8FAFC;
  font-size: 0.88rem;
  color: #0F172A;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #E31B23;
  background-color: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.12);
}

.select-input-box {
  position: relative !important;
  width: 100% !important;
  display: flex !important;
  align-items: center !important;
}

.select-chevron-inside {
  position: absolute !important;
  right: 12px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  color: #94A3B8 !important;
  pointer-events: none !important;
  z-index: 2 !important;
}

.gsfin-select {
  width: 100% !important;
  height: 44px !important;
  padding: 10px 36px 10px 14px !important;
  border-radius: 10px !important;
  border: 1px solid #CBD5E1 !important;
  background-color: #F8FAFC !important;
  font-size: 0.88rem !important;
  font-weight: 600 !important;
  color: #0F172A !important;
  outline: none !important;
  cursor: pointer !important;
  box-sizing: border-box !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  transition: all 0.2s ease !important;
}

.gsfin-select:focus {
  border-color: #E31B23 !important;
  background-color: #FFFFFF !important;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.12) !important;
}

.gsfin-exam-table :deep(th) {
  font-weight: 700 !important;
  color: #0F172A !important;
  background-color: #F8FAFC !important;
  font-size: 0.75rem !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  border-bottom: 1px solid #E2E8F0 !important;
}

.gsfin-exam-table :deep(td) {
  border-bottom: 1px solid #F1F5F9 !important;
  font-size: 0.875rem !important;
}
</style>

