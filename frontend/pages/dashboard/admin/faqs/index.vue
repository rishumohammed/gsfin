<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ TOP HEADER ═══ -->
      <div class="admin-header-row">
        <div>
          <NuxtLink to="/dashboard/admin/settings" class="btn-back-link mb-2">
            <i class="mdi mdi-arrow-left"></i> Back to Settings
          </NuxtLink>
          <h1 class="admin-title">Manage FAQs</h1>
        </div>

        <div class="header-actions">
          <button class="btn-red" @click="openDialog()">
            <i class="mdi mdi-plus"></i> Add New FAQ
          </button>
        </div>
      </div>

      <!-- Alert Banner -->
      <Transition name="fade">
        <div v-if="error" class="error-banner">
          <i class="mdi mdi-alert-circle-outline"></i>
          <span>{{ error }}</span>
          <button class="close-alert-btn" @click="error = null"><i class="mdi mdi-close"></i></button>
        </div>
      </Transition>

      <!-- ═══ TABLE CONTAINER ═══ -->
      <div class="panel-card mt-4">
        <div class="panel-card-header">
          <div class="search-input-wrap">
            <i class="mdi mdi-magnify search-icon"></i>
            <input
              v-model="search"
              type="text"
              placeholder="Search FAQs..."
              class="table-search-input"
            />
          </div>

          <span class="total-count-badge">Total: {{ filteredFaqs.length }} FAQs</span>
        </div>

        <div class="table-responsive">
          <table class="gsfin-table">
            <thead>
              <tr>
                <th>Question &amp; Answer Preview</th>
                <th>Status</th>
                <th>Display Order</th>
                <th class="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="4" class="text-center py-8 text-slate-500">
                  <span class="spinner-sm-red"></span> Loading FAQs...
                </td>
              </tr>
              <tr v-else-if="filteredFaqs.length === 0">
                <td colspan="4" class="text-center py-8 text-slate-500">
                  <i class="mdi mdi-comment-question-outline text-3xl block mb-2 text-slate-400"></i>
                  No FAQs Found
                </td>
              </tr>
              <tr v-for="(item, index) in paginatedFaqs" :key="item.id">
                <td>
                  <div class="faq-question-text">{{ item.question }}</div>
                  <div class="faq-answer-text text-slate-500">{{ item.answer }}</div>
                </td>
                <td>
                  <button
                    class="badge-chip cursor-pointer border-0"
                    :class="item.is_active ? 'chip-green' : 'chip-slate'"
                    @click="toggleActive(item)"
                  >
                    {{ item.is_active ? 'Active' : 'Hidden' }}
                  </button>
                </td>
                <td>
                  <div class="order-adjust-wrap">
                    <span>{{ (page - 1) * perPage + index + 1 }}</span>
                    <div class="order-btns">
                      <button class="order-btn" :disabled="index === 0 && page === 1" @click="moveUp((page - 1) * perPage + index)"><i class="mdi mdi-chevron-up"></i></button>
                      <button class="order-btn" :disabled="(page - 1) * perPage + index === filteredFaqs.length - 1" @click="moveDown((page - 1) * perPage + index)"><i class="mdi mdi-chevron-down"></i></button>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="btn-table-action btn-edit" title="Edit FAQ" @click="openDialog(item)">
                      <i class="mdi mdi-pencil"></i>
                    </button>
                    <button class="btn-table-action btn-danger" title="Delete FAQ" @click="confirmDelete(item)">
                      <i class="mdi mdi-trash-can-outline"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <AppPagination
            v-if="filteredFaqs.length > 0"
            v-model="page"
            v-model:items-per-page="perPage"
            :total-items="filteredFaqs.length"
            :per-page-options="[10, 25, 50, 100]"
          />
        </div>
      </div>

    </div>

    <!-- ═══ CREATE / EDIT FAQ MODAL ═══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="dialog" class="modal-overlay" @click.self="closeDialog">
          <div class="modal-card">
            <div class="modal-header">
              <h3>{{ editedItem.id ? 'Edit FAQ' : 'Add New FAQ' }}</h3>
              <button class="modal-close-btn" @click="closeDialog"><i class="mdi mdi-close"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group mb-3">
                <label class="form-label">Question *</label>
                <input v-model="editedItem.question" type="text" placeholder="What is HACCP certification?" class="modal-input" />
              </div>
              <div class="form-group mb-3">
                <label class="form-label">Answer *</label>
                <textarea v-model="editedItem.answer" rows="4" placeholder="Detailed answer explanation..." class="modal-textarea"></textarea>
              </div>
              <div class="form-group mb-3">
                <label class="remember-label">
                  <input type="checkbox" v-model="editedItem.is_active" class="custom-checkbox" />
                  <span>Display on Public Website</span>
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-glass" @click="closeDialog">Cancel</button>
              <button class="btn-red" :disabled="saving" @click="saveItem">
                {{ saving ? 'Saving...' : (editedItem.id ? 'Update FAQ' : 'Save FAQ') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="deleteDialog" class="modal-overlay" @click.self="deleteDialog = false">
          <div class="modal-card modal-sm text-center pa-6">
            <i class="mdi mdi-alert-circle-outline text-red text-5xl mb-2"></i>
            <h3 class="font-weight-bold text-slate-900 text-xl mb-2">Delete FAQ?</h3>
            <p class="text-slate-500 text-sm mb-6">
              Are you sure you want to delete this FAQ entry?
            </p>
            <div class="modal-footer-center">
              <button class="btn-glass" @click="deleteDialog = false">Cancel</button>
              <button class="btn-red" :disabled="deleting" @click="deleteItem">
                {{ deleting ? 'Deleting...' : 'Confirm Delete' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useApi } from '@/composables/useApi';
import AppPagination from '@/components/common/AppPagination.vue';

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
});

const api = useApi();
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const faqs = ref<any[]>([]);
const search = ref('');

const dialog = ref(false);
const deleteDialog = ref(false);

const defaultItem = {
  id: null,
  question: '',
  answer: '',
  is_active: true,
  order_index: 0
};
const editedItem = ref({ ...defaultItem });
const itemToDelete = ref<any>(null);

const filteredFaqs = computed(() => {
  if (!search.value.trim()) return faqs.value;
  const q = search.value.toLowerCase();
  return faqs.value.filter(f =>
    (f.question || '').toLowerCase().includes(q) ||
    (f.answer || '').toLowerCase().includes(q)
  );
});

// Pagination state
const page = ref(1);
const perPage = ref(10);
const paginatedFaqs = computed(() => {
  const start = (page.value - 1) * perPage.value;
  return filteredFaqs.value.slice(start, start + perPage.value);
});
watch(search, () => {
  page.value = 1;
});

const fetchFaqs = async () => {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/admin/faqs');
    faqs.value = data;
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch FAQs';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchFaqs();
});

const openDialog = (item?: any) => {
  if (item) {
    editedItem.value = { ...item };
  } else {
    editedItem.value = { ...defaultItem, order_index: faqs.value.length };
  }
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  editedItem.value = { ...defaultItem };
};

const saveItem = async () => {
  if (!editedItem.value.question || !editedItem.value.answer) {
    error.value = 'Question and Answer are required.';
    return;
  }

  saving.value = true;
  error.value = null;
  try {
    if (editedItem.value.id) {
      await api.put(`/admin/faqs/${editedItem.value.id}`, editedItem.value);
    } else {
      await api.post('/admin/faqs', editedItem.value);
    }
    await fetchFaqs();
    closeDialog();
  } catch (err: any) {
    error.value = err.message || 'Failed to save FAQ';
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (item: any) => {
  itemToDelete.value = item;
  deleteDialog.value = true;
};

const deleteItem = async () => {
  if (!itemToDelete.value) return;
  deleting.value = true;
  try {
    await api.delete(`/admin/faqs/${itemToDelete.value.id}`);
    await fetchFaqs();
    deleteDialog.value = false;
  } catch (err: any) {
    error.value = err.message || 'Failed to delete FAQ';
  } finally {
    deleting.value = false;
  }
};

const toggleActive = async (item: any) => {
  try {
    await api.put(`/admin/faqs/${item.id}`, { ...item, is_active: !item.is_active });
    item.is_active = !item.is_active;
  } catch (err) {
    console.error(err);
    fetchFaqs();
  }
};

const updateOrderOnServer = async () => {
  try {
    const items = faqs.value.map((f, index) => ({ id: f.id, order_index: index }));
    await api.post('/admin/faqs/reorder', { items });
  } catch (err) {
    console.error(err);
  }
};

const moveUp = (index: number) => {
  if (index === 0) return;
  const temp = faqs.value[index];
  faqs.value[index] = faqs.value[index - 1];
  faqs.value[index - 1] = temp;
  updateOrderOnServer();
};

const moveDown = (index: number) => {
  if (index === faqs.value.length - 1) return;
  const temp = faqs.value[index];
  faqs.value[index] = faqs.value[index + 1];
  faqs.value[index + 1] = temp;
  updateOrderOnServer();
};
</script>

<style scoped>
/* Page-specific styles for FAQs */

.faq-question-text { font-weight: 600; color: #0F172A; margin-bottom: 4px; }
.faq-answer-text { font-size: 0.82rem; line-height: 1.4; max-width: 540px; }

.badge-chip { display: inline-block; padding: 4px 12px; border-radius: 50px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; }
.chip-green { background: rgba(16, 185, 129, 0.1); color: #059669; }
.chip-slate { background: rgba(100, 116, 139, 0.1); color: #64748B; }

.order-adjust-wrap { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.order-btns { display: flex; flex-direction: column; }
.order-btn { background: none; border: none; font-size: 1rem; color: #64748B; cursor: pointer; padding: 0; line-height: 1; }
.order-btn:hover { color: #E31B23; }
.order-btn:disabled { opacity: 0.3; cursor: not-allowed; }


.remember-label { display: flex; align-items: center; gap: 8px; font-size: 0.84rem; color: #475569; cursor: pointer; font-weight: 600; }
.custom-checkbox { accent-color: #E31B23; width: 16px; height: 16px; cursor: pointer; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-card { background: #FFFFFF; border-radius: 20px; width: 100%; max-width: 540px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15); overflow: hidden; }
.modal-sm { max-width: 400px; }
.modal-header { padding: 20px 24px; border-bottom: 1px solid rgba(15, 23, 42, 0.08); display: flex; align-items: center; justify-content: space-between; }
.modal-header h3 { font-size: 1.2rem; font-weight: 600; color: #0F172A; margin: 0; }
.modal-close-btn { background: #F1F5F9; border: none; width: 32px; height: 32px; border-radius: 50%; color: #64748B; cursor: pointer; }
.modal-body { padding: 24px; }
.modal-footer { padding: 16px 24px; background: #FAFAFD; border-top: 1px solid rgba(15, 23, 42, 0.06); display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
.modal-footer-center { display: flex; gap: 12px; justify-content: center; margin-top: 16px; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 0.8rem; font-weight: 600; color: #334155; }
.modal-input, .modal-textarea {
  width: 100%; padding: 10px 14px; border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12); background: #F8FAFC;
  font-size: 0.9rem; color: #0F172A; outline: none; font-family: inherit; box-sizing: border-box;
}
.modal-input:focus, .modal-textarea:focus { border-color: #E31B23; background: #FFFFFF; }

.btn-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 6px 14px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #334155;
  text-decoration: none;
  transition: all 0.2s ease;
}
.btn-back-link:hover {
  background: #F1F5F9;
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.3);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.spinner-sm-red { width: 16px; height: 16px; border: 2px solid rgba(227, 27, 35, 0.2); border-top-color: #E31B23; border-radius: 50%; animation: spin 0.75s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
