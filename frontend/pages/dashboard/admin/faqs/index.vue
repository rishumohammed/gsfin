<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ TOP HEADER ═══ -->
      <div class="admin-header-row">
        <div>
          <h1 class="admin-title">Manage FAQs</h1>
          <p class="admin-subtitle">Configure frequently asked questions and answers displayed across the GSFIN platform.</p>
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
                <th>Actions</th>
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
              <tr v-for="(item, index) in filteredFaqs" :key="item.id">
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
                    <span>{{ index + 1 }}</span>
                    <div class="order-btns">
                      <button class="order-btn" :disabled="index === 0" @click="moveUp(index)"><i class="mdi mdi-chevron-up"></i></button>
                      <button class="order-btn" :disabled="index === filteredFaqs.length - 1" @click="moveDown(index)"><i class="mdi mdi-chevron-down"></i></button>
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
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
});

const api = useApi();
const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const faqs = ref<any[]>([]);
const error = ref<string | null>(null);
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
.gsfin-admin-page {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  background: #FAFAFD;
  color: #0F172A;
  min-height: 100vh;
  padding: 32px 36px;
  box-sizing: border-box;
}

.admin-wrap { max-width: 1300px; margin: 0 auto; }

.admin-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.eyebrow-red {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #E31B23;
}

.admin-title {
  font-size: 2rem;
  font-weight: 800;
  color: #0F172A;
  margin: 4px 0;
  letter-spacing: -0.02em;
}

.admin-subtitle { font-size: 0.92rem; color: #64748B; margin: 0; }

.header-actions { display: flex; align-items: center; gap: 12px; }

.btn-red {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.86rem;
  box-shadow: 0 3px 10px rgba(227, 27, 35, 0.2);
  transition: all 0.2s ease;
  cursor: pointer;
}
.btn-red:hover { background: #C4131B; transform: translateY(-1px); }

.btn-glass {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #F1F5F9;
  color: #334155;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.86rem;
  cursor: pointer;
}
.btn-glass:hover { background: #E2E8F0; }

.error-banner {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #DC2626;
  padding: 12px 18px;
  border-radius: 14px;
  font-size: 0.88rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.close-alert-btn { margin-left: auto; background: none; border: none; color: #DC2626; cursor: pointer; }

.panel-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
  overflow: hidden;
}

.panel-card-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  background: #FAFAFD;
}

.search-input-wrap { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 14px; color: #94A3B8; font-size: 1.1rem; }
.table-search-input {
  padding: 9px 14px 9px 40px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  font-size: 0.86rem;
  color: #0F172A;
  outline: none;
  width: 280px;
}
.table-search-input:focus { border-color: #E31B23; }

.total-count-badge { font-size: 0.8rem; font-weight: 700; color: #64748B; }

.table-responsive { width: 100%; overflow-x: auto; }
.gsfin-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem; }
.gsfin-table th {
  padding: 14px 20px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748B;
  background: #F8FAFC;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}
.gsfin-table td { padding: 16px 20px; border-bottom: 1px solid rgba(15, 23, 42, 0.06); color: #334155; vertical-align: middle; }
.gsfin-table tbody tr:hover { background: rgba(248, 250, 252, 0.8); }

.faq-question-text { font-weight: 800; color: #0F172A; margin-bottom: 4px; }
.faq-answer-text { font-size: 0.82rem; line-height: 1.4; max-width: 540px; }

.badge-chip { display: inline-block; padding: 4px 12px; border-radius: 50px; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; }
.chip-green { background: rgba(16, 185, 129, 0.1); color: #059669; }
.chip-slate { background: rgba(100, 116, 139, 0.1); color: #64748B; }

.order-adjust-wrap { display: flex; align-items: center; gap: 8px; font-weight: 800; }
.order-btns { display: flex; flex-direction: column; }
.order-btn { background: none; border: none; font-size: 1rem; color: #64748B; cursor: pointer; padding: 0; line-height: 1; }
.order-btn:hover { color: #E31B23; }
.order-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.actions-cell { display: flex; align-items: center; gap: 6px; }

.btn-table-action {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.btn-edit { background: #F1F5F9; color: #334155; }
.btn-edit:hover { background: #E31B23; color: #FFFFFF; }
.btn-danger { background: rgba(239, 68, 68, 0.1); color: #DC2626; }
.btn-danger:hover { background: #DC2626; color: #FFFFFF; }

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
.modal-header h3 { font-size: 1.2rem; font-weight: 800; color: #0F172A; margin: 0; }
.modal-close-btn { background: #F1F5F9; border: none; width: 32px; height: 32px; border-radius: 50%; color: #64748B; cursor: pointer; }
.modal-body { padding: 24px; }
.modal-footer { padding: 16px 24px; background: #FAFAFD; border-top: 1px solid rgba(15, 23, 42, 0.06); display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
.modal-footer-center { display: flex; gap: 12px; justify-content: center; margin-top: 16px; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 0.8rem; font-weight: 700; color: #334155; }
.modal-input, .modal-textarea {
  width: 100%; padding: 10px 14px; border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12); background: #F8FAFC;
  font-size: 0.9rem; color: #0F172A; outline: none; font-family: inherit; box-sizing: border-box;
}
.modal-input:focus, .modal-textarea:focus { border-color: #E31B23; background: #FFFFFF; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.spinner-sm-red { width: 16px; height: 16px; border: 2px solid rgba(227, 27, 35, 0.2); border-top-color: #E31B23; border-radius: 50%; animation: spin 0.75s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
