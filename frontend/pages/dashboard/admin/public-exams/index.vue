<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ HEADER ROW ═══ -->
      <div class="admin-header-row">
        <div>
          <h1 class="admin-title">Exams</h1>
        </div>

        <div class="header-actions">
          <NuxtLink
            to="/dashboard/admin/public-exams/proctoring"
            class="btn-glass"
          >
            <i class="mdi mdi-shield-check-outline"></i> Proctoring Logs
          </NuxtLink>
          <NuxtLink
            to="/dashboard/admin/public-exams/categories"
            class="btn-glass"
          >
            <i class="mdi mdi-shape-outline"></i> Categories
          </NuxtLink>
          <NuxtLink
            to="/dashboard/admin/public-exams/create"
            class="btn-red"
          >
            <i class="mdi mdi-plus"></i> Create Exam
          </NuxtLink>
        </div>
      </div>

      <!-- ═══ MAIN DIRECTORY PANEL ═══ -->
      <div class="panel-card">
        <div class="panel-card-header">
          <div class="panel-title-wrap">
            <i class="mdi mdi-clipboard-text-outline panel-icon"></i>
            <h3>All Exams</h3>
          </div>

          <div class="panel-filter-row">
            <div class="search-input-wrap">
              <i class="mdi mdi-magnify search-icon"></i>
              <input
                v-model="search"
                type="text"
                placeholder="Search exams by name or category..."
                class="table-search-input"
              />
            </div>

            <select v-model="categoryFilter" class="table-select-filter">
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>

            <select v-model="statusFilter" class="table-select-filter">
              <option value="All">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="review">Under Review</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div class="table-responsive">
          <v-data-table
            :headers="headers"
            :items="filteredExams"
            :loading="loading"
            class="elevation-0 gsfin-table"
          >
          <!-- Custom Empty State -->
          <template v-slot:no-data>
            <div class="py-16 text-center px-4">
              <div class="empty-state-icon-box">
                <v-icon icon="mdi-clipboard-text-off-outline" size="32" color="#E31B23"></v-icon>
              </div>
              <h3 class="text-base font-semibold text-slate-900 mb-1">No Certification Exams Found</h3>
              <p class="text-xs text-slate-500 max-w-md mx-auto mb-6">
                There are no certification exams matching your current filter criteria. Create your first exam to get started.
              </p>
              <v-btn
                color="#E31B23"
                class="font-semibold text-white text-none rounded-xl shadow-md"
                prepend-icon="mdi-plus"
                to="/dashboard/admin/public-exams/create"
              >
                Create Exam
              </v-btn>
            </div>
          </template>

          <!-- Exam Details Column -->
          <template v-slot:item.name="{ item }">
            <div class="py-2.5">
              <div class="font-semibold text-slate-900 text-sm mb-1.5 flex items-center gap-2 flex-wrap">
                <span>{{ item.name }}</span>
                <span v-if="item.qualification_id" class="badge-cert-pill" title="Official Certification Standard">
                  <i class="mdi mdi-certificate-outline"></i>
                  Certification
                </span>
              </div>
              <div class="programs-badges-wrap">
                <span class="badge-program-tag">
                  <i class="mdi mdi-shape-outline"></i>
                  {{ item.category_name || item.qualification_category || 'Food Safety Standard' }}
                </span>
                <span
                  v-if="item.enable_proctoring"
                  class="badge-proctor-tag"
                >
                  <i class="mdi mdi-shield-check"></i>
                  AI Proctored
                </span>
              </div>
            </div>
          </template>

          <!-- Configuration / Question Bank Pool Column -->
          <template v-slot:item.settings="{ item }">
            <div class="py-2.5">
              <div class="font-semibold text-slate-900 text-xs">
                {{ item.total_questions || 0 }} Questions on Exam
              </div>
              <div class="text-xs text-slate-500 mt-0.5 whitespace-nowrap">
                {{ item.duration_minutes }} Mins • Pass: <span class="font-semibold text-slate-800">{{ item.passing_marks }} ({{ item.pass_percentage }}%)</span>
              </div>
              <!-- 3x Question Bank Pool Status Indicator -->
              <div class="mt-1.5">
                <div 
                  :class="[
                    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold border',
                    (item.question_count || 0) >= (item.total_questions || 0) * 3 && (item.total_questions || 0) > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                      : 'bg-amber-50 text-amber-700 border-amber-200/80'
                  ]"
                  :title="`Requires at least 3× questions in Question Bank (${(item.total_questions || 0) * 3} required)`"
                >
                  <i :class="['mdi', (item.question_count || 0) >= (item.total_questions || 0) * 3 && (item.total_questions || 0) > 0 ? 'mdi-check-circle' : 'mdi-alert-circle-outline']"></i>
                  <span>Bank: {{ item.question_count || 0 }} / {{ (item.total_questions || 0) * 3 }}</span>
                  <span v-if="(item.question_count || 0) >= (item.total_questions || 0) * 3 && (item.total_questions || 0) > 0" class="opacity-80 font-medium">Ready</span>
                  <span v-else class="opacity-90 font-medium">(Need {{ Math.max(0, ((item.total_questions || 0) * 3) - (item.question_count || 0)) }})</span>
                </div>
              </div>
            </div>
          </template>

          <!-- Status Column -->
          <template v-slot:item.status="{ item }">
            <div class="flex items-center justify-center py-2">
              <span :class="['status-btn', getStatusClass(item.status)]">
                <span class="status-dot"></span>
                {{ getStatusLabel(item.status) }}
              </span>
            </div>
          </template>

          <!-- Partner Engagement Column -->
          <template v-slot:item.engagement="{ item }">
            <div class="py-2.5 text-center whitespace-nowrap">
              <div class="font-semibold text-slate-900 text-xs">{{ item.attempts_count || 0 }} Attempts</div>
              <div class="text-[11px] text-slate-500 font-medium mt-0.5">{{ item.candidate_count || 0 }} Students Conducted</div>
            </div>
          </template>

          <!-- Created Date Column -->
          <template v-slot:item.created_at="{ item }">
            <span class="text-xs text-slate-500 font-medium whitespace-nowrap">{{ formatDate(item.created_at) }}</span>
          </template>

          <!-- Actions Column (2 Rows) -->
          <template v-slot:item.actions="{ item }">
            <div class="actions-cell-2rows">
              <!-- Row 1: Authoring & Questions (Question Bank, Edit) -->
              <div class="actions-row">
                <NuxtLink
                  :to="`/dashboard/admin/public-exams/questions?examId=${item.id}`"
                  class="btn-table-action icon-only btn-qb"
                  title="Question Bank"
                >
                  <i class="mdi mdi-database-outline"></i>
                </NuxtLink>
                <NuxtLink
                  :to="`/dashboard/admin/public-exams/create?id=${item.id}`"
                  class="btn-table-action icon-only btn-edit"
                  title="Edit Exam Settings"
                >
                  <i class="mdi mdi-pencil-outline"></i>
                </NuxtLink>
              </div>

              <!-- Row 2: Operations & Lifecycle (Duplicate, Status Toggle, Delete) -->
              <div class="actions-row">
                <button
                  type="button"
                  class="btn-table-action icon-only btn-warn"
                  title="Duplicate Exam"
                  @click="duplicateExam(item.id)"
                >
                  <i class="mdi mdi-content-copy"></i>
                </button>
                <button
                  v-if="item.status !== 'published'"
                  type="button"
                  class="btn-table-action icon-only btn-success"
                  title="Publish to Partner Centers"
                  @click="changeStatus(item.id, 'published')"
                >
                  <i class="mdi mdi-rocket-launch-outline"></i>
                </button>
                <button
                  v-else
                  type="button"
                  class="btn-table-action icon-only btn-edit"
                  title="Unpublish (Set to Draft)"
                  @click="changeStatus(item.id, 'draft')"
                >
                  <i class="mdi mdi-pause-circle-outline"></i>
                </button>
                <button
                  type="button"
                  class="btn-table-action icon-only btn-danger"
                  title="Delete Exam"
                  @click="confirmDelete(item)"
                >
                  <i class="mdi mdi-trash-can-outline"></i>
                </button>
              </div>
            </div>
          </template>
        </v-data-table>
      </div>
    </div>
  </div>

    <!-- ═══ DELETE CONFIRMATION MODAL (GSFIN Global Style) ═══ -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <div class="modal-card">
        <!-- Modal Header -->
        <div class="modal-header">
          <div class="modal-title-row">
            <div class="modal-header-icon bg-red-50 text-red-600">
              <i class="mdi mdi-alert-octagon-outline"></i>
            </div>
            <div class="modal-title-text">
              <h3>Delete Certification Exam?</h3>
              <p>Permanent action • cannot be undone</p>
            </div>
          </div>
          <button type="button" class="modal-close-btn" @click="deleteDialog = false" title="Close">
            <i class="mdi mdi-close"></i>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <p class="modal-lead-text">
            Are you sure you want to delete this certification exam from the portal?
          </p>

          <!-- Exam Highlight Card -->
          <div class="modal-info-card border-red">
            <div class="modal-info-card-title">{{ targetExam?.name }}</div>
            <div class="modal-info-card-meta">
              <span class="badge-program-tag">
                <i class="mdi mdi-shape-outline"></i>
                {{ targetExam?.category_name || targetExam?.qualification_category || 'Food Safety Standard' }}
              </span>
              <span v-if="targetExam?.qualification_id" class="badge-cert-pill">
                <i class="mdi mdi-certificate-outline"></i> Certification
              </span>
            </div>
            <div class="modal-info-card-stats">
              <span>{{ targetExam?.total_questions || 0 }} Questions on Exam</span>
              <span class="dot">•</span>
              <span>{{ targetExam?.question_count || 0 }} in Bank</span>
              <span class="dot">•</span>
              <span>{{ targetExam?.attempts_count || 0 }} Attempts</span>
            </div>
          </div>

          <!-- Danger Warning Callout -->
          <div class="modal-danger-callout">
            <i class="mdi mdi-alert-circle text-red-500"></i>
            <div>
              <strong>Warning:</strong> Deleting this exam will permanently erase all questions in its Question Bank, candidate registrations, and student attempt histories.
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button type="button" class="btn-glass" @click="deleteDialog = false">
            Cancel
          </button>
          <button
            type="button"
            class="btn-danger-confirm"
            :disabled="deleting"
            @click="deleteExam"
          >
            <i :class="['mdi', deleting ? 'mdi-loading spin-icon' : 'mdi-trash-can-outline']"></i>
            <span>{{ deleting ? 'Deleting Exam...' : 'Delete Exam' }}</span>
          </button>
        </div>
      </div>
    </v-dialog>

    <!-- ═══ 3X QUESTION POOL INCOMPLETE MODAL (GSFIN Global Style) ═══ -->
    <v-dialog v-model="publishWarningDialog" max-width="520">
      <div class="modal-card">
        <!-- Modal Header -->
        <div class="modal-header">
          <div class="modal-title-row">
            <div class="modal-header-icon bg-amber-50 text-amber-600">
              <i class="mdi mdi-database-alert-outline"></i>
            </div>
            <div class="modal-title-text">
              <h3>Question Bank Pool Incomplete</h3>
              <p>3× Question Bank Requirement for Publishing</p>
            </div>
          </div>
          <button type="button" class="modal-close-btn" @click="publishWarningDialog = false" title="Close">
            <i class="mdi mdi-close"></i>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <p class="modal-lead-text">
            Cannot publish <strong class="text-slate-900">"{{ publishWarningExam?.name }}"</strong>.
            Every certification exam requires at least <strong class="text-slate-900">3× questions</strong> in the Question Bank before publishing.
          </p>

          <!-- Pool Calculation Table -->
          <div class="pool-calc-card">
            <div class="pool-calc-row">
              <span class="pool-calc-label">Questions Conducted on Exam:</span>
              <span class="pool-calc-val">{{ publishWarningExam?.total_questions || 0 }} Questions</span>
            </div>
            <div class="pool-calc-row highlight">
              <span class="pool-calc-label">Required in Question Bank (3× Pool):</span>
              <span class="pool-calc-val">{{ (publishWarningExam?.total_questions || 0) * 3 }} Questions</span>
            </div>
            <div class="pool-calc-row">
              <span class="pool-calc-label">Currently in Question Bank:</span>
              <span class="pool-calc-val text-amber-700">{{ publishWarningExam?.question_count || 0 }} Questions</span>
            </div>
            <div class="pool-calc-divider"></div>
            <div class="pool-calc-row deficit">
              <span class="pool-calc-label">Questions Needed to Publish:</span>
              <span class="pool-calc-val text-red-600 font-semibold">+{{ Math.max(0, ((publishWarningExam?.total_questions || 0) * 3) - (publishWarningExam?.question_count || 0)) }} More</span>
            </div>
          </div>

          <div class="modal-info-callout">
            <i class="mdi mdi-information-outline text-blue-500"></i>
            <div>
              When candidates take this exam, questions are randomly drawn from this 3× pool so each candidate receives a randomized question set.
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button type="button" class="btn-glass" @click="publishWarningDialog = false">
            Close
          </button>
          <NuxtLink
            :to="`/dashboard/admin/public-exams/questions?examId=${publishWarningExam?.id}`"
            class="btn-red flex items-center gap-1.5"
            @click="publishWarningDialog = false"
          >
            <i class="mdi mdi-database-plus-outline"></i>
            <span>Open Question Bank</span>
          </NuxtLink>
        </div>
      </div>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="lg">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'main_admin', 'sub_admin', 'lms_user']
});

const api = useApi();

const loading = ref(true);
const exams = ref<any[]>([]);
const categories = ref<any[]>([]);
const search = ref('');
const categoryFilter = ref('All');
const statusFilter = ref('All');

// Delete Exam Dialog State
const deleteDialog = ref(false);
const targetExam = ref<any>(null);
const deleting = ref(false);

// 3x Question Pool Warning Dialog State
const publishWarningDialog = ref(false);
const publishWarningExam = ref<any>(null);

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const headers = [
  { title: 'Exam', key: 'name', minWidth: '220px' },
  { title: 'Details', key: 'settings', sortable: false, minWidth: '180px' },
  { title: 'Status', key: 'status', align: 'center' as const, minWidth: '150px' },
  { title: 'Attempts', key: 'engagement', align: 'center' as const, sortable: false, minWidth: '140px' },
  { title: 'Date', key: 'created_at', minWidth: '110px' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' as const, width: '135px', minWidth: '135px' }
];

function getStatusClass(status: string) {
  if (status === 'published') return 'status-active';
  if (status === 'draft') return 'status-read';
  if (status === 'review') return 'status-suspended';
  return 'status-new';
}

function getStatusLabel(status: string) {
  if (status === 'published') return 'Active in Catalog';
  if (status === 'draft') return 'Draft Mode';
  if (status === 'review') return 'Under Review';
  return 'Archived';
}

const filteredExams = computed(() => {
  return exams.value.filter(exam => {
    const matchesSearch = !search.value || exam.name.toLowerCase().includes(search.value.toLowerCase());
    const matchesCategory = categoryFilter.value === 'All' || exam.category_id === categoryFilter.value;
    const matchesStatus = statusFilter.value === 'All' || exam.status === statusFilter.value;
    return matchesSearch && matchesCategory && matchesStatus;
  });
});

async function loadData() {
  loading.value = true;
  try {
    const [catsRes, examsRes] = await Promise.all([
      api.get('/public/exams/categories'),
      api.get('/admin/public-exams')
    ]);
    categories.value = [{ id: 'All', name: 'All Categories' }, ...catsRes.data];
    exams.value = examsRes.data;
  } catch (err) {
    console.error('Failed to load exams listing:', err);
  } finally {
    loading.value = false;
  }
}

async function duplicateExam(id: string) {
  try {
    await api.post(`/admin/public-exams/${id}/duplicate`);
    snackbarText.value = 'Exam duplicated successfully as a Draft!';
    snackbarColor.value = 'success';
    snackbar.value = true;
    loadData();
  } catch (err: any) {
    console.error('Duplication failed:', err);
    snackbarText.value = err.response?.data?.message || 'Duplication failed';
    snackbarColor.value = 'error';
    snackbar.value = true;
  }
}

async function changeStatus(id: string, newStatus: string) {
  const exam = exams.value.find(e => e.id === id);
  if (newStatus === 'published' && exam) {
    const totalQ = exam.total_questions || 0;
    const requiredPool = totalQ * 3;
    const currentPool = exam.question_count || 0;
    if (totalQ <= 0 || currentPool < requiredPool) {
      publishWarningExam.value = exam;
      publishWarningDialog.value = true;
      return;
    }
  }

  try {
    await api.put(`/admin/public-exams/${id}`, { status: newStatus });
    snackbarText.value = newStatus === 'published'
      ? `Exam "${exam?.name || ''}" is now Published!`
      : `Exam "${exam?.name || ''}" reverted to Draft mode.`;
    snackbarColor.value = 'success';
    snackbar.value = true;
    loadData();
  } catch (err: any) {
    console.error('Failed to toggle status:', err);
    snackbarText.value = err.response?.data?.message || 'Failed to toggle status';
    snackbarColor.value = 'error';
    snackbar.value = true;
  }
}

function confirmDelete(exam: any) {
  targetExam.value = exam;
  deleteDialog.value = true;
}

async function deleteExam() {
  if (!targetExam.value) return;
  deleting.value = true;
  try {
    await api.delete(`/admin/public-exams/${targetExam.value.id}`);
    deleteDialog.value = false;
    targetExam.value = null;
    loadData();
  } catch (err) {
    console.error('Failed to delete exam:', err);
  } finally {
    deleting.value = false;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.actions-cell-2rows {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: max-content;
  margin: 0 auto;
}

.actions-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.btn-table-action.btn-qb {
  background: rgba(227, 27, 35, 0.08);
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.2);
}

.btn-table-action.btn-qb:hover {
  background: #E31B23;
  color: #FFFFFF;
}

.btn-table-action.btn-cert {
  background: rgba(99, 102, 241, 0.08);
  color: #4F46E5;
  border-color: rgba(99, 102, 241, 0.2);
}

.btn-table-action.btn-cert:hover {
  background: #4F46E5;
  color: #FFFFFF;
}

.btn-table-action.btn-proctor {
  background: rgba(227, 27, 35, 0.08);
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.2);
}

.btn-table-action.btn-proctor:hover {
  background: #E31B23;
  color: #FFFFFF;
}

/* Global Tags & Badges Match */
.programs-badges-wrap {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.badge-program-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.70rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  background: #F1F5F9;
  color: #334155;
  border: 1px solid rgba(15, 23, 42, 0.08);
  white-space: nowrap;
}

.badge-program-tag i {
  color: #059669;
  font-size: 0.78rem;
}

.badge-proctor-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.70rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(227, 27, 35, 0.08);
  color: #E31B23;
  border: 1px solid rgba(227, 27, 35, 0.2);
  white-space: nowrap;
}

.badge-proctor-tag i {
  color: #E31B23;
  font-size: 0.78rem;
}

.badge-cert-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: #EEF2FF;
  color: #4F46E5;
  border: 1px solid rgba(99, 102, 241, 0.25);
  font-size: 0.65rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.badge-cert-pill i {
  font-size: 0.72rem;
}

/* ── GSFIN Global Modal Architecture ── */
.modal-card {
  background: #FFFFFF;
  border-radius: 20px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FAFAFD;
}

.modal-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.modal-title-text h3 {
  font-size: 1.05rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  line-height: 1.25;
}

.modal-title-text p {
  font-size: 0.75rem;
  color: #64748B;
  margin: 2px 0 0 0;
  line-height: 1.2;
}

.modal-close-btn {
  background: #F1F5F9;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #64748B;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: #E2E8F0;
  color: #0F172A;
}

.modal-body {
  padding: 22px 24px;
}

.modal-lead-text {
  font-size: 0.85rem;
  color: #334155;
  line-height: 1.5;
  margin-bottom: 16px;
}

.modal-info-card {
  padding: 14px 16px;
  border-radius: 12px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  margin-bottom: 16px;
}

.modal-info-card.border-red {
  border-left: 4px solid #E31B23;
}

.modal-info-card-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0F172A;
  margin-bottom: 6px;
}

.modal-info-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.modal-info-card-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  color: #64748B;
  font-weight: 500;
}

.modal-info-card-stats .dot {
  color: #CBD5E1;
}

.modal-danger-callout {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 10px;
  font-size: 0.78rem;
  color: #991B1B;
  line-height: 1.45;
}

.modal-danger-callout i {
  font-size: 1.1rem;
  flex-shrink: 0;
  margin-top: 1px;
}

.modal-info-callout {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 10px;
  font-size: 0.78rem;
  color: #1E40AF;
  line-height: 1.45;
  margin-top: 14px;
}

.modal-info-callout i {
  font-size: 1.1rem;
  flex-shrink: 0;
  margin-top: 1px;
}

.pool-calc-card {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 14px 16px;
}

.pool-calc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #475569;
  padding: 5px 0;
}

.pool-calc-row.highlight {
  font-weight: 600;
  color: #0F172A;
}

.pool-calc-row.deficit {
  font-weight: 600;
  font-size: 0.85rem;
}

.pool-calc-divider {
  height: 1px;
  background: #E2E8F0;
  margin: 6px 0;
}

.modal-footer {
  padding: 16px 24px;
  background: #FAFAFD;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.btn-danger-confirm {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(227, 27, 35, 0.25);
}

.btn-danger-confirm:hover:not(:disabled) {
  background: #C41219;
  transform: translateY(-1px);
}

.btn-danger-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

