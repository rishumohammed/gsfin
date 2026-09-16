<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16 text-slate-500 font-medium">
        <span class="spinner-sm-red mb-2"></span>
        <p class="text-sm">Loading Qualification Specification...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="panel-card pa-8 text-center">
        <i class="mdi mdi-alert-circle-outline text-5xl text-red mb-3"></i>
        <h3 class="font-bold text-slate-900 text-lg">Failed to Load Qualification</h3>
        <p class="text-slate-500 text-sm max-w-md mx-auto mt-1 mb-4">{{ error }}</p>
        <NuxtLink to="/dashboard/admin/qualifications" class="btn-glass">
          <i class="mdi mdi-arrow-left"></i> Back to Qualifications
        </NuxtLink>
      </div>

      <!-- Content Page -->
      <div v-else-if="qual">
        <!-- ═══ TOP HEADER ROW ═══ -->
        <div class="admin-header-row">
          <div>
            <div class="eyebrow-chip mb-1">
              <i class="mdi mdi-certificate-outline"></i> QUALIFICATION SPECIFICATION GOVERNANCE
            </div>
            <div class="flex items-center gap-3">
              <h1 class="admin-title">{{ qual.name }}</h1>
              <span v-if="qual.badge_tag" class="badge-tag-chip">{{ qual.badge_tag }}</span>
              <span :class="['status-chip', qual.is_active ? 'status-active' : 'status-draft']">
                {{ qual.is_active ? 'Active Standard' : 'Draft Standard' }}
              </span>
            </div>
            <p class="admin-subtitle">{{ qual.subtitle || qual.short_description }}</p>
          </div>

          <div class="header-actions">
            <NuxtLink to="/dashboard/admin/qualifications" class="btn-glass">
              <i class="mdi mdi-arrow-left"></i> Back to Catalog
            </NuxtLink>
            <NuxtLink :to="`/qualifications/${qual.slug}`" target="_blank" class="btn-glass">
              <i class="mdi mdi-open-in-new"></i> Preview Public Page
            </NuxtLink>
            <button class="btn-red" @click="openEditModal">
              <i class="mdi mdi-pencil-outline"></i> Edit Qualification
            </button>
          </div>
        </div>

        <!-- ═══ KPI SPECIFICATION CARDS ═══ -->
        <div class="kpi-grid mb-8">
          <div class="kpi-card">
            <div class="kpi-icon bg-emerald-light">
              <i class="mdi mdi-folder-outline text-emerald"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Category</span>
              <span class="kpi-value-sm">{{ qual.category || 'General Safety' }}</span>
              <span class="kpi-sub text-slate-500">Qualification Group</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon bg-indigo-light">
              <i class="mdi mdi-school-outline text-indigo"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Skill Level</span>
              <span class="kpi-value-sm">{{ qual.level || 'Advanced' }}</span>
              <span class="kpi-sub text-slate-500">Tier Designation</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon bg-amber-light">
              <i class="mdi mdi-clock-outline text-amber"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Duration</span>
              <span class="kpi-value-sm">{{ qual.duration || 'Self-Paced' }}</span>
              <span class="kpi-sub text-slate-500">Total Credit Hours</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon bg-red-light">
              <i class="mdi mdi-shield-check-outline text-red"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Validity</span>
              <span class="kpi-value-sm">{{ qual.validity || '3 Years' }}</span>
              <span class="kpi-sub text-slate-500">Recertification Term</span>
            </div>
          </div>
        </div>

        <!-- ═══ MAIN 2-COLUMN DETAILS ═══ -->
        <div class="detail-grid">
          <!-- LEFT COLUMN: Overview & Modules -->
          <div class="space-y-6">
            <!-- Executive Overview -->
            <div class="panel-card pa-6">
              <div class="panel-header mb-4">
                <h3 class="panel-title flex items-center gap-2">
                  <i class="mdi mdi-text-box-outline text-red"></i>
                  Executive Specification Narrative
                </h3>
              </div>
              <p class="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                {{ qual.full_description || qual.short_description || 'No extended description provided.' }}
              </p>
            </div>

            <!-- Learning Modules -->
            <div class="panel-card pa-6">
              <div class="panel-header mb-4 flex items-center justify-between">
                <h3 class="panel-title flex items-center gap-2">
                  <i class="mdi mdi-book-open-page-variant-outline text-emerald"></i>
                  Curriculum &amp; Key Learning Modules
                </h3>
                <span class="count-pill">{{ (qual.key_modules || []).length }} Modules</span>
              </div>

              <div v-if="!qual.key_modules || qual.key_modules.length === 0" class="text-slate-400 text-sm py-4 text-center">
                No curriculum modules listed for this qualification.
              </div>
              <ul v-else class="module-checklist">
                <li v-for="(m, idx) in qual.key_modules" :key="idx" class="module-item">
                  <div class="module-num">{{ Number(idx) + 1 }}</div>
                  <div class="module-text">{{ m }}</div>
                </li>
              </ul>
            </div>
          </div>

          <!-- RIGHT COLUMN: Audience, Benefits & Metadata -->
          <div class="space-y-6">
            <!-- Target Audience -->
            <div class="panel-card pa-6">
              <div class="panel-header mb-4">
                <h3 class="panel-title flex items-center gap-2">
                  <i class="mdi mdi-account-group-outline text-indigo"></i>
                  Target Audience / Who Should Attend
                </h3>
              </div>

              <div v-if="!qual.who_should_attend || qual.who_should_attend.length === 0" class="text-slate-400 text-sm py-2">
                No specific target audience roles specified.
              </div>
              <div v-else class="audience-flex">
                <span v-for="(a, idx) in qual.who_should_attend" :key="idx" class="role-chip">
                  <i class="mdi mdi-check-decagram-outline text-indigo mr-1"></i> {{ a }}
                </span>
              </div>
            </div>

            <!-- Key Benefits -->
            <div class="panel-card pa-6">
              <div class="panel-header mb-4">
                <h3 class="panel-title flex items-center gap-2">
                  <i class="mdi mdi-star-outline text-amber"></i>
                  Key Qualification Benefits
                </h3>
              </div>

              <div v-if="!qual.benefits || qual.benefits.length === 0" class="text-slate-400 text-sm py-2">
                No specific qualification benefits recorded.
              </div>
              <ul v-else class="benefit-list">
                <li v-for="(b, idx) in qual.benefits" :key="idx">
                  <i class="mdi mdi-star text-amber mr-2"></i> {{ b }}
                </li>
              </ul>
            </div>

            <!-- Prerequisites & Meta -->
            <div class="panel-card pa-6">
              <div class="panel-header mb-4">
                <h3 class="panel-title flex items-center gap-2">
                  <i class="mdi mdi-cog-outline text-slate-600"></i>
                  Governance Metadata
                </h3>
              </div>

              <div class="space-y-3 text-xs">
                <div class="meta-row">
                  <span class="meta-title">URL Slug:</span>
                  <code class="font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">{{ qual.slug }}</code>
                </div>
                <div class="meta-row">
                  <span class="meta-title">Assessment Type:</span>
                  <span class="font-bold text-slate-800">{{ qual.assessment_type || 'Online Examination' }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-title">Display Order Index:</span>
                  <span class="font-bold text-slate-800">#{{ qual.order_index }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- ═══ INLINE EDIT QUALIFICATION MODAL ═══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="dialog" class="modal-overlay" @click.self="closeDialog">
          <div class="modal-card modal-lg">
            <div class="modal-header">
              <h3>Edit Qualification Standard</h3>
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
                    <input v-model="editedItem.name" type="text" placeholder="CODEX HACCP" class="modal-input" />
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
                  <textarea v-model="editedItem.short_description" rows="2" placeholder="Brief summary..." class="modal-textarea"></textarea>
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
                    <input v-model="editedItem.key_modules[idx]" type="text" class="modal-input" />
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
                    <input v-model="editedItem.who_should_attend[idx]" type="text" class="modal-input" />
                    <button type="button" class="btn-del-icon" @click="removeAttendee(idx)"><i class="mdi mdi-close"></i></button>
                  </div>
                </div>

                <div class="list-editor-wrap mb-4">
                  <div class="list-editor-head">
                    <label class="form-label">Key Benefits</label>
                    <button type="button" class="btn-add-sm" @click="addBenefit"><i class="mdi mdi-plus"></i> Add Benefit</button>
                  </div>
                  <div v-for="(b, idx) in editedItem.benefits" :key="idx" class="list-editor-row mb-2">
                    <input v-model="editedItem.benefits[idx]" type="text" class="modal-input" />
                    <button type="button" class="btn-del-icon" @click="removeBenefit(idx)"><i class="mdi mdi-close"></i></button>
                  </div>
                </div>

                <div class="list-editor-wrap mb-4">
                  <div class="list-editor-head">
                    <label class="form-label">Prerequisites</label>
                    <button type="button" class="btn-add-sm" @click="addPrereq"><i class="mdi mdi-plus"></i> Add Prerequisite</button>
                  </div>
                  <div v-for="(p, idx) in editedItem.prerequisites" :key="idx" class="list-editor-row mb-2">
                    <input v-model="editedItem.prerequisites[idx]" type="text" class="modal-input" />
                    <button type="button" class="btn-del-icon" @click="removePrereq(idx)"><i class="mdi mdi-close"></i></button>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-glass" @click="closeDialog">Cancel</button>
              <button class="btn-red" :disabled="saving" @click="saveItem">
                {{ saving ? 'Saving...' : 'Update Qualification' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  roles: ['super_admin', 'main_admin', 'sub_admin', 'tutor']
});

const route = useRoute();
const api = useApi();

const qualId = route.params.id as string;
const qual = ref<any>(null);
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);

const dialog = ref(false);
const modalTab = ref('basic');
const editedItem = ref<any>({});

const fetchQualification = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.get(`/admin/qualifications/${qualId}`);
    qual.value = res.data || res;
  } catch (err: any) {
    console.error('Failed to fetch qualification detail:', err);
    error.value = err.response?.data?.message || err.message || 'Qualification not found.';
  } finally {
    loading.value = false;
  }
};

const openEditModal = () => {
  modalTab.value = 'basic';
  editedItem.value = {
    ...qual.value,
    prerequisites: Array.isArray(qual.value.prerequisites) ? [...qual.value.prerequisites] : [],
    key_modules: Array.isArray(qual.value.key_modules) ? [...qual.value.key_modules] : [],
    who_should_attend: Array.isArray(qual.value.who_should_attend) ? [...qual.value.who_should_attend] : [],
    benefits: Array.isArray(qual.value.benefits) ? [...qual.value.benefits] : []
  };
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  editedItem.value = {};
};

const addModule = () => editedItem.value.key_modules.push('');
const removeModule = (i: number | string) => editedItem.value.key_modules.splice(Number(i), 1);

const addAttendee = () => editedItem.value.who_should_attend.push('');
const removeAttendee = (i: number | string) => editedItem.value.who_should_attend.splice(Number(i), 1);

const addBenefit = () => editedItem.value.benefits.push('');
const removeBenefit = (i: number | string) => editedItem.value.benefits.splice(Number(i), 1);

const addPrereq = () => editedItem.value.prerequisites.push('');
const removePrereq = (i: number | string) => editedItem.value.prerequisites.splice(Number(i), 1);

const saveItem = async () => {
  if (!editedItem.value.name || !editedItem.value.slug) {
    alert('Name and slug are required.');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...editedItem.value,
      key_modules: editedItem.value.key_modules.filter((m: string) => m.trim()),
      who_should_attend: editedItem.value.who_should_attend.filter((a: string) => a.trim()),
      benefits: editedItem.value.benefits.filter((b: string) => b.trim()),
      prerequisites: editedItem.value.prerequisites.filter((p: string) => p.trim())
    };

    await api.put(`/admin/qualifications/${qualId}`, payload);
    closeDialog();
    await fetchQualification();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to update qualification');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  fetchQualification();
});
</script>

<style scoped>
.gsfin-admin-page {
  padding: 40px 48px;
  background: #FAFAFD;
  min-height: 100vh;
  box-sizing: border-box;
}
.admin-wrap {
  max-width: 1440px;
  margin: 0 auto;
}

.admin-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.eyebrow-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  font-weight: 800;
  color: #E31B23;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.admin-title {
  font-size: 1.95rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
  letter-spacing: -0.02em;
}

.admin-subtitle {
  font-size: 0.94rem;
  color: #64748B;
  margin: 6px 0 0 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.btn-red {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  padding: 12px 22px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 0.88rem;
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
  gap: 8px;
  background: #FFFFFF;
  color: #334155;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 12px 22px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 0.88rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
}
.btn-glass:hover {
  background: #F8FAFC;
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.3);
}

.badge-tag-chip {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 800;
  background: rgba(227, 27, 35, 0.1);
  color: #E31B23;
}

.status-chip {
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
}
.status-active { background: rgba(16, 185, 129, 0.1); color: #059669; }
.status-draft { background: rgba(100, 116, 139, 0.1); color: #64748B; }

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
@media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .kpi-grid { grid-template-columns: 1fr; } }

.kpi-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.02);
}
.kpi-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.45rem;
  flex-shrink: 0;
}
.bg-amber-light { background: rgba(245, 158, 11, 0.1); }
.bg-indigo-light { background: rgba(79, 70, 229, 0.1); }
.bg-emerald-light { background: rgba(16, 185, 129, 0.1); }
.bg-red-light { background: rgba(227, 27, 35, 0.1); }

.text-amber { color: #D97706; }
.text-indigo { color: #4F46E5; }
.text-emerald { color: #059669; }
.text-red { color: #E31B23; }

.kpi-content { display: flex; flex-direction: column; }
.kpi-label { font-size: 0.74rem; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }
.kpi-value-sm { font-size: 1.15rem; font-weight: 800; color: #0F172A; line-height: 1.3; margin-top: 2px; }
.kpi-sub { font-size: 0.74rem; font-weight: 600; margin-top: 2px; }

/* Grid Layout */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 28px;
}
@media (max-width: 1100px) { .detail-grid { grid-template-columns: 1fr; } }

.panel-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
}

.panel-header {
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  padding-bottom: 14px;
}

.panel-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
}

.count-pill {
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.74rem;
  font-weight: 800;
  background: #F1F5F9;
  color: #475569;
}

.module-checklist {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.module-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 12px 16px;
  background: #F8FAFC;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.module-num {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(227, 27, 35, 0.1);
  color: #E31B23;
  font-size: 0.82rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.module-text {
  font-size: 0.88rem;
  font-weight: 700;
  color: #1E293B;
  line-height: 1.4;
  margin-top: 3px;
}

.audience-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.role-chip {
  padding: 8px 14px;
  border-radius: 12px;
  background: rgba(79, 70, 229, 0.08);
  color: #4F46E5;
  font-size: 0.82rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
}

.benefit-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.benefit-list li {
  font-size: 0.88rem;
  font-weight: 600;
  color: #334155;
  display: flex;
  align-items: center;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed rgba(15, 23, 42, 0.08);
}
.meta-row:last-child { border-bottom: none; }
.meta-title { font-weight: 700; color: #64748B; }

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

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.spinner-sm-red {
  width: 18px; height: 18px;
  border: 2px solid rgba(227, 27, 35, 0.2);
  border-top-color: #E31B23;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
