<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ TOP HEADER ═══ -->
      <div class="admin-header-row">
        <div>
          <h1 class="admin-title">Qualifications Management</h1>
          <p class="admin-subtitle">Manage global food safety &amp; quality certification standards, detail pages, and curricula.</p>
        </div>

        <div class="header-actions">
          <NuxtLink to="/qualifications" target="_blank" class="btn-glass">
            <i class="mdi mdi-open-in-new"></i> View Public Catalog
          </NuxtLink>
          <button class="btn-red" @click="openDialog()">
            <i class="mdi mdi-plus"></i> Add Qualification
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

      <!-- ═══ DATA TABLE CONTAINER ═══ -->
      <div class="panel-card mt-4">
        <div class="panel-card-header">
          <div class="panel-filter-row">
            <div class="search-input-wrap">
              <i class="mdi mdi-magnify search-icon"></i>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search qualifications..."
                class="table-search-input"
              />
            </div>

            <select v-model="categoryFilter" class="table-select-filter">
              <option value="All Categories">All Categories</option>
              <option value="Food Safety">Food Safety</option>
              <option value="Quality Management">Quality Management</option>
              <option value="Food Science">Food Science</option>
            </select>
          </div>

          <span class="total-count-badge">Total: {{ filteredQualifications.length }} Qualifications</span>
        </div>

        <div class="table-responsive">
          <table class="gsfin-table">
            <thead>
              <tr>
                <th>Qualification Standard</th>
                <th>Category &amp; Level</th>
                <th>Duration &amp; Validity</th>
                <th>Status</th>
                <th>Display Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="6" class="text-center py-8 text-slate-500">
                  <span class="spinner-sm-red"></span> Loading Qualifications...
                </td>
              </tr>
              <tr v-else-if="filteredQualifications.length === 0">
                <td colspan="6" class="text-center py-8 text-slate-500">
                  <i class="mdi mdi-certificate-outline text-3xl block mb-2 text-slate-400"></i>
                  No Qualifications Found
                </td>
              </tr>
              <tr v-for="q in filteredQualifications" :key="q.id">
                <td>
                  <div class="qual-cell-row">
                    <div class="qual-thumb">
                      <img :src="q.image_url || '/hero-bk.png'" :alt="q.name" />
                    </div>
                    <div>
                      <div class="qual-name">{{ q.name }}</div>
                      <div class="qual-sub text-slate-500">{{ q.subtitle || q.short_description }}</div>
                      <span v-if="q.badge_tag" class="chip-red-sm mt-1">{{ q.badge_tag }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="font-weight-bold text-slate-900">{{ q.category }}</div>
                  <div class="text-slate-500 text-xs">{{ q.level }}</div>
                </td>
                <td>
                  <div><i class="mdi mdi-clock-outline text-slate-400"></i> {{ q.duration }}</div>
                  <div class="text-slate-500 text-xs"><i class="mdi mdi-shield-check-outline text-slate-400"></i> {{ q.validity }}</div>
                </td>
                <td>
                  <button
                    class="badge-chip cursor-pointer border-0"
                    :class="q.is_active ? 'chip-green' : 'chip-slate'"
                    @click="toggleActive(q)"
                  >
                    {{ q.is_active ? 'Active' : 'Draft' }}
                  </button>
                </td>
                <td>
                  <div class="order-adjust-wrap">
                    <span>{{ q.order_index }}</span>
                    <div class="order-btns">
                      <button class="order-btn" @click="changeOrder(q, -1)"><i class="mdi mdi-chevron-up"></i></button>
                      <button class="order-btn" @click="changeOrder(q, 1)"><i class="mdi mdi-chevron-down"></i></button>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="btn-table-action btn-edit" @click="openDialog(q)">
                      <i class="mdi mdi-pencil"></i> Edit
                    </button>
                    <button class="btn-table-action btn-danger" @click="confirmDelete(q)">
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

    <!-- ═══ ADD / EDIT QUALIFICATION MODAL ═══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="dialog" class="modal-overlay" @click.self="closeDialog">
          <div class="modal-card modal-lg">
            <div class="modal-header">
              <h3>{{ editedItem.id ? 'Edit Qualification Standard' : 'Add New Qualification Standard' }}</h3>
              <button class="modal-close-btn" @click="closeDialog"><i class="mdi mdi-close"></i></button>
            </div>

            <!-- Tab Navigation inside Modal -->
            <div class="modal-tabs-bar">
              <button class="modal-tab-btn" :class="{ 'active': modalTab === 'basic' }" @click="modalTab = 'basic'">
                1. Basic Metadata
              </button>
              <button class="modal-tab-btn" :class="{ 'active': modalTab === 'curriculum' }" @click="modalTab = 'curriculum'">
                2. Curriculum &amp; Modules
              </button>
              <button class="modal-tab-btn" :class="{ 'active': modalTab === 'audience' }" @click="modalTab = 'audience'">
                3. Audience &amp; Benefits
              </button>
            </div>

            <div class="modal-body">
              <!-- TAB 1: BASIC METADATA -->
              <div v-if="modalTab === 'basic'" class="modal-tab-content">
                <div class="form-row-2 mb-3">
                  <div class="form-group">
                    <label class="form-label">Qualification Name *</label>
                    <input v-model="editedItem.name" type="text" placeholder="CODEX HACCP" class="modal-input" @input="autoGenerateSlug" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">URL Slug *</label>
                    <input v-model="editedItem.slug" type="text" placeholder="codex-haccp" class="modal-input" />
                  </div>
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">Subtitle Header</label>
                  <input v-model="editedItem.subtitle" type="text" placeholder="Hazard Analysis &amp; Critical Control Points..." class="modal-input" />
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">Short Description</label>
                  <textarea v-model="editedItem.short_description" rows="2" placeholder="Brief summary for catalog cards..." class="modal-textarea"></textarea>
                </div>

                <div class="form-row-2 mb-3">
                  <div class="form-group">
                    <label class="form-label">Category</label>
                    <select v-model="editedItem.category" class="modal-select">
                      <option value="Food Safety">Food Safety</option>
                      <option value="Quality Management">Quality Management</option>
                      <option value="Food Science">Food Science</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Level Tag</label>
                    <input v-model="editedItem.level" type="text" placeholder="Advanced Level" class="modal-input" />
                  </div>
                </div>

                <div class="form-row-2 mb-3">
                  <div class="form-group">
                    <label class="form-label">Duration</label>
                    <input v-model="editedItem.duration" type="text" placeholder="35 Hours Self-Paced + Exam" class="modal-input" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Assessment Type</label>
                    <input v-model="editedItem.assessment_type" type="text" placeholder="Online Exam (Proctored)" class="modal-input" />
                  </div>
                </div>

                <div class="form-row-2 mb-3">
                  <div class="form-group">
                    <label class="form-label">Validity Period</label>
                    <input v-model="editedItem.validity" type="text" placeholder="3 Years International Recognition" class="modal-input" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Red Badge Tag (Optional)</label>
                    <input v-model="editedItem.badge_tag" type="text" placeholder="Global Standard" class="modal-input" />
                  </div>
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">Banner Image URL</label>
                  <input v-model="editedItem.image_url" type="text" placeholder="/img/course-haccp.jpg" class="modal-input" />
                </div>
              </div>

              <!-- TAB 2: CURRICULUM & MODULES -->
              <div v-else-if="modalTab === 'curriculum'" class="modal-tab-content">
                <div class="form-group mb-4">
                  <label class="form-label">Executive Overview / Full Description</label>
                  <textarea v-model="editedItem.full_description" rows="4" placeholder="Comprehensive detail narrative..." class="modal-textarea"></textarea>
                </div>

                <div class="list-editor-wrap mb-4">
                  <div class="list-editor-head">
                    <label class="form-label">Key Learning Modules</label>
                    <button type="button" class="btn-add-sm" @click="addModule"><i class="mdi mdi-plus"></i> Add Module</button>
                  </div>
                  <div v-for="(m, idx) in editedItem.key_modules" :key="idx" class="list-editor-row mb-2">
                    <input v-model="editedItem.key_modules[idx]" type="text" placeholder="Module Title (e.g. Module 1: Hazard Analysis)" class="modal-input" />
                    <button type="button" class="btn-del-icon" @click="removeModule(idx)"><i class="mdi mdi-close"></i></button>
                  </div>
                </div>
              </div>

              <!-- TAB 3: AUDIENCE & BENEFITS -->
              <div v-else-if="modalTab === 'audience'" class="modal-tab-content">
                <div class="list-editor-wrap mb-4">
                  <div class="list-editor-head">
                    <label class="form-label">Who Should Attend</label>
                    <button type="button" class="btn-add-sm" @click="addAttendee"><i class="mdi mdi-plus"></i> Add Target Role</button>
                  </div>
                  <div v-for="(att, idx) in editedItem.who_should_attend" :key="idx" class="list-editor-row mb-2">
                    <input v-model="editedItem.who_should_attend[idx]" type="text" placeholder="Target Role (e.g. Food Safety Managers)" class="modal-input" />
                    <button type="button" class="btn-del-icon" @click="removeAttendee(idx)"><i class="mdi mdi-close"></i></button>
                  </div>
                </div>

                <div class="list-editor-wrap mb-4">
                  <div class="list-editor-head">
                    <label class="form-label">Key Benefits</label>
                    <button type="button" class="btn-add-sm" @click="addBenefit"><i class="mdi mdi-plus"></i> Add Benefit</button>
                  </div>
                  <div v-for="(b, idx) in editedItem.benefits" :key="idx" class="list-editor-row mb-2">
                    <input v-model="editedItem.benefits[idx]" type="text" placeholder="Benefit (e.g. GFSI Alignment)" class="modal-input" />
                    <button type="button" class="btn-del-icon" @click="removeBenefit(idx)"><i class="mdi mdi-close"></i></button>
                  </div>
                </div>

                <div class="list-editor-wrap mb-4">
                  <div class="list-editor-head">
                    <label class="form-label">Prerequisites</label>
                    <button type="button" class="btn-add-sm" @click="addPrereq"><i class="mdi mdi-plus"></i> Add Prerequisite</button>
                  </div>
                  <div v-for="(p, idx) in editedItem.prerequisites" :key="idx" class="list-editor-row mb-2">
                    <input v-model="editedItem.prerequisites[idx]" type="text" placeholder="Prerequisite (e.g. Basic food hygiene)" class="modal-input" />
                    <button type="button" class="btn-del-icon" @click="removePrereq(idx)"><i class="mdi mdi-close"></i></button>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-glass" @click="closeDialog">Cancel</button>
              <button class="btn-red" :disabled="saving" @click="saveItem">
                {{ saving ? 'Saving...' : (editedItem.id ? 'Update Qualification' : 'Save Qualification') }}
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
            <h3 class="font-weight-bold text-slate-900 text-xl mb-2">Delete Qualification?</h3>
            <p class="text-slate-500 text-sm mb-6">
              Are you sure you want to delete <strong>{{ itemToDelete?.name }}</strong>?
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
  middleware: ['auth']
});

const api = useApi();
const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const qualifications = ref<any[]>([]);
const error = ref<string | null>(null);

const searchQuery = ref('');
const categoryFilter = ref('All Categories');
const modalTab = ref('basic');

const dialog = ref(false);
const deleteDialog = ref(false);

const defaultItem = {
  id: null,
  slug: '',
  name: '',
  subtitle: '',
  short_description: '',
  full_description: '',
  category: 'Food Safety',
  level: 'Advanced',
  duration: '35 Hours Self-Paced + Exam',
  assessment_type: 'Online Examination',
  validity: '3 Years International Recognition',
  prerequisites: [] as string[],
  key_modules: [] as string[],
  who_should_attend: [] as string[],
  benefits: [] as string[],
  badge_tag: '',
  image_url: '',
  icon_name: 'mdi-certificate',
  order_index: 0,
  is_active: true
};

const editedItem = ref({ ...defaultItem });
const itemToDelete = ref<any>(null);

const filteredQualifications = computed(() => {
  return qualifications.value.filter((q) => {
    const matchesSearch =
      !searchQuery.value ||
      q.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      q.slug.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      q.category.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesCategory =
      categoryFilter.value === 'All Categories' || q.category === categoryFilter.value;

    return matchesSearch && matchesCategory;
  });
});

const fetchQualifications = async () => {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/admin/qualifications');
    qualifications.value = data;
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch qualifications';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchQualifications();
});

const autoGenerateSlug = () => {
  if (!editedItem.value.id && editedItem.value.name) {
    editedItem.value.slug = editedItem.value.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
};

const openDialog = (item?: any) => {
  modalTab.value = 'basic';
  if (item) {
    editedItem.value = {
      ...item,
      prerequisites: Array.isArray(item.prerequisites) ? [...item.prerequisites] : [],
      key_modules: Array.isArray(item.key_modules) ? [...item.key_modules] : [],
      who_should_attend: Array.isArray(item.who_should_attend) ? [...item.who_should_attend] : [],
      benefits: Array.isArray(item.benefits) ? [...item.benefits] : []
    };
  } else {
    editedItem.value = { ...defaultItem, order_index: qualifications.value.length + 1 };
  }
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  editedItem.value = { ...defaultItem };
};

const addModule = () => editedItem.value.key_modules.push('');
const removeModule = (i: number) => editedItem.value.key_modules.splice(i, 1);

const addAttendee = () => editedItem.value.who_should_attend.push('');
const removeAttendee = (i: number) => editedItem.value.who_should_attend.splice(i, 1);

const addBenefit = () => editedItem.value.benefits.push('');
const removeBenefit = (i: number) => editedItem.value.benefits.splice(i, 1);

const addPrereq = () => editedItem.value.prerequisites.push('');
const removePrereq = (i: number) => editedItem.value.prerequisites.splice(i, 1);

const saveItem = async () => {
  if (!editedItem.value.name || !editedItem.value.slug) {
    error.value = 'Name and slug are required.';
    return;
  }
  saving.value = true;
  error.value = null;

  try {
    const payload = {
      ...editedItem.value,
      key_modules: editedItem.value.key_modules.filter((m) => m.trim()),
      who_should_attend: editedItem.value.who_should_attend.filter((a) => a.trim()),
      benefits: editedItem.value.benefits.filter((b) => b.trim()),
      prerequisites: editedItem.value.prerequisites.filter((p) => p.trim())
    };

    if (editedItem.value.id) {
      await api.put(`/admin/qualifications/${editedItem.value.id}`, payload);
    } else {
      await api.post('/admin/qualifications', payload);
    }

    closeDialog();
    await fetchQualifications();
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to save qualification';
  } finally {
    saving.value = false;
  }
};

const toggleActive = async (item: any) => {
  try {
    await api.patch(`/admin/qualifications/${item.id}/active`, {
      is_active: !item.is_active
    });
    item.is_active = !item.is_active;
  } catch (err: any) {
    error.value = err.message || 'Failed to update status';
  }
};

const changeOrder = async (item: any, delta: number) => {
  const newOrder = Math.max(0, (item.order_index || 0) + delta);
  try {
    await api.patch(`/admin/qualifications/${item.id}/reorder`, {
      order_index: newOrder
    });
    await fetchQualifications();
  } catch (err: any) {
    error.value = err.message || 'Failed to reorder';
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
    await api.delete(`/admin/qualifications/${itemToDelete.value.id}`);
    deleteDialog.value = false;
    itemToDelete.value = null;
    await fetchQualifications();
  } catch (err: any) {
    error.value = err.message || 'Failed to delete qualification';
  } finally {
    deleting.value = false;
  }
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

.admin-wrap {
  max-width: 1300px;
  margin: 0 auto;
}

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

.admin-subtitle {
  font-size: 0.92rem;
  color: #64748B;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

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
.btn-red:hover {
  background: #C4131B;
  transform: translateY(-1px);
}

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
  text-decoration: none;
  transition: all 0.2s;
}
.btn-glass:hover {
  background: #E2E8F0;
}

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
.close-alert-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: #DC2626;
  cursor: pointer;
}

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

.panel-filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #94A3B8;
  font-size: 1.1rem;
}

.table-search-input {
  padding: 9px 14px 9px 40px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  font-size: 0.86rem;
  color: #0F172A;
  outline: none;
  width: 260px;
}
.table-search-input:focus { border-color: #E31B23; }

.table-select-filter {
  padding: 9px 14px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  font-size: 0.86rem;
  font-weight: 700;
  color: #0F172A;
  outline: none;
  cursor: pointer;
}

.total-count-badge {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748B;
}

.table-responsive { width: 100%; overflow-x: auto; }

.gsfin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.88rem;
}

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

.gsfin-table td {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  color: #334155;
  vertical-align: middle;
}

.gsfin-table tbody tr:hover { background: rgba(248, 250, 252, 0.8); }

.qual-cell-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qual-thumb {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  overflow: hidden;
  background: #F1F5F9;
  flex-shrink: 0;
}
.qual-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.qual-name { font-weight: 800; color: #0F172A; }
.qual-sub { font-size: 0.78rem; line-height: 1.3; max-width: 300px; }

.badge-chip {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}

.chip-green { background: rgba(16, 185, 129, 0.1); color: #059669; }
.chip-slate { background: rgba(100, 116, 139, 0.1); color: #64748B; }
.chip-red-sm { background: rgba(227, 27, 35, 0.1); color: #E31B23; font-size: 0.68rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; display: inline-block; }

.order-adjust-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
}
.order-btns { display: flex; flex-direction: column; }
.order-btn {
  background: none;
  border: none;
  font-size: 1rem;
  color: #64748B;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}
.order-btn:hover { color: #E31B23; }

.actions-cell { display: flex; align-items: center; gap: 8px; }

.btn-table-action {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.btn-edit { background: #F1F5F9; color: #334155; }
.btn-edit:hover { background: #E31B23; color: #FFFFFF; }
.btn-danger { background: rgba(239, 68, 68, 0.1); color: #DC2626; }
.btn-danger:hover { background: #DC2626; color: #FFFFFF; }

/* Modal & Tabs */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  background: #FFFFFF;
  border-radius: 20px;
  width: 100%;
  max-width: 540px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.modal-lg { max-width: 720px; }
.modal-sm { max-width: 400px; }

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-header h3 { font-size: 1.2rem; font-weight: 800; color: #0F172A; margin: 0; }
.modal-close-btn { background: #F1F5F9; border: none; width: 32px; height: 32px; border-radius: 50%; color: #64748B; cursor: pointer; }

.modal-tabs-bar {
  display: flex;
  background: #FAFAFD;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  padding: 4px 16px;
  gap: 6px;
}
.modal-tab-btn {
  background: none;
  border: none;
  padding: 10px 16px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #64748B;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}
.modal-tab-btn.active {
  color: #E31B23;
  border-bottom-color: #E31B23;
}

.modal-body { padding: 24px; overflow-y: auto; flex: 1; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 0.8rem; font-weight: 700; color: #334155; }
.modal-input, .modal-select, .modal-textarea {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #F8FAFC;
  font-size: 0.9rem;
  color: #0F172A;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}
.modal-input:focus, .modal-select:focus, .modal-textarea:focus { border-color: #E31B23; background: #FFFFFF; }

.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.list-editor-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.btn-add-sm {
  background: rgba(227, 27, 35, 0.1);
  color: #E31B23;
  border: none;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
}
.list-editor-row { display: flex; align-items: center; gap: 8px; }
.btn-del-icon { background: none; border: none; color: #DC2626; cursor: pointer; font-size: 1.1rem; }

.modal-footer {
  padding: 16px 24px;
  background: #FAFAFD;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}
.modal-footer-center { display: flex; gap: 12px; justify-content: center; margin-top: 16px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.spinner-sm-red {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(227, 27, 35, 0.2);
  border-top-color: #E31B23;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
