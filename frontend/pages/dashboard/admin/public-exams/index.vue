<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ HEADER ROW ═══ -->
      <div class="admin-header-row">
        <div>
          <h1 class="admin-title">Exams</h1>
          <p class="admin-subtitle">Configure official certification exams, question bank pools, proctoring controls, and passing standards.</p>
        </div>

        <div class="header-actions">
          <NuxtLink
            to="/dashboard/admin/public-exams/proctoring"
            class="btn-glass"
          >
            <i class="mdi mdi-shield-check-outline"></i> Proctoring Logs
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
          <div class="panel-filter-row">
            <div class="search-input-wrap">
              <i class="mdi mdi-magnify search-icon"></i>
              <input
                v-model="search"
                type="text"
                placeholder="Search exams by name or certification..."
                class="table-search-input"
              />
            </div>

            <select v-model="qualificationFilter" class="table-select-filter">
              <option value="All">All Certifications</option>
              <option v-for="q in qualifications" :key="q.id" :value="q.id">{{ q.name }}</option>
            </select>

            <select v-model="statusFilter" class="table-select-filter">
              <option value="All">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="review">Under Review</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <span class="total-count-badge">Total: {{ filteredExams.length }} Exams</span>
        </div>

        <!-- ═══ CERTIFICATION EXAMS CARDS LIST ═══ -->
        <div class="partner-cards-list">
          <!-- Loading State -->
          <div v-if="loading" class="panel-loading-state">
            <span class="spinner-sm-red"></span>
            <div class="mt-2 text-xs font-medium text-slate-500">Loading certification exams...</div>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredExams.length === 0" class="panel-empty-state">
            <i class="mdi mdi-clipboard-text-off-outline text-4xl block mb-2 text-slate-400"></i>
            <h3 class="text-base font-semibold text-slate-900 mb-1">No Certification Exams Found</h3>
            <p class="text-xs text-slate-500 max-w-md mx-auto mb-5">
              There are no certification exams matching your current filter criteria. Create your first exam to get started.
            </p>
            <NuxtLink
              to="/dashboard/admin/public-exams/create"
              class="btn-red inline-flex items-center gap-1.5"
            >
              <i class="mdi mdi-plus"></i> Create Exam
            </NuxtLink>
          </div>

          <!-- Exam Cards -->
          <div
            v-for="item in paginatedExams"
            :key="item.id"
            class="partner-card"
          >
            <div class="partner-card-header">
              <!-- Left Identity -->
              <div class="partner-identity-left">
                <div class="partner-logo-avatar">
                  <i class="mdi mdi-file-certificate-outline"></i>
                </div>
                <div class="partner-identity-info">
                  <div class="partner-title-row">
                    <NuxtLink
                      :to="`/dashboard/admin/public-exams/questions?examId=${item.id}`"
                      class="partner-name-link"
                      title="Open Question Bank for this Exam"
                    >
                      {{ item.name }}
                    </NuxtLink>
                    <span
                      :class="[
                        'partner-status-tag',
                        item.status === 'published' ? 'tag-active' :
                        item.status === 'draft' ? 'tag-inactive' : 'tag-amber'
                      ]"
                    >
                      <span class="pulse-dot"></span>
                      {{ getStatusLabel(item.status).toUpperCase() }}
                    </span>
                    <span class="partner-type-tag font-mono">{{ item.slug }}</span>
                    <span v-if="item.difficulty_level" class="partner-type-tag capitalize">Level: {{ item.difficulty_level }}</span>
                  </div>

                  <div class="partner-meta-strip">
                    <span class="partner-meta-item">
                      <i class="mdi mdi-help-circle-outline"></i> {{ item.total_questions || 0 }} Questions
                    </span>
                    <span class="partner-meta-item">
                      <i class="mdi mdi-clock-outline"></i> {{ item.duration_minutes }} Mins
                    </span>
                    <span class="partner-meta-item font-semibold text-slate-700">
                      <i class="mdi mdi-check-circle-outline"></i> Pass: {{ item.pass_percentage }}%
                    </span>
                    <span
                      :class="[
                        'pool-pill',
                        (item.question_count || 0) >= (item.total_questions || 0) * 3 && (item.total_questions || 0) > 0
                          ? 'pool-pill-ready'
                          : 'pool-pill-need'
                      ]"
                      :title="`Requires at least 3× questions in Question Bank (${(item.total_questions || 0) * 3} required)`"
                    >
                      <i :class="['mdi', (item.question_count || 0) >= (item.total_questions || 0) * 3 && (item.total_questions || 0) > 0 ? 'mdi-check-circle' : 'mdi-alert-circle-outline']"></i>
                      <span>Bank: {{ item.question_count || 0 }} / {{ (item.total_questions || 0) * 3 }}</span>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Right Stats & Actions -->
              <div class="partner-header-right">
                <div class="partner-stat-pill">
                  <div class="stat-cell">
                    <span class="stat-num text-indigo">{{ item.question_count || 0 }}</span>
                    <span class="stat-lbl">Bank Questions</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-cell">
                    <span class="stat-num text-emerald">{{ item.attempts_count || 0 }}</span>
                    <span class="stat-lbl">Attempts</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-cell">
                    <span class="stat-num text-slate-800">{{ item.candidate_count || 0 }}</span>
                    <span class="stat-lbl">Candidates</span>
                  </div>
                </div>

                <div class="card-action-cluster">
                  <!-- Primary Action: Question Bank -->
                  <NuxtLink
                    :to="`/dashboard/admin/public-exams/questions?examId=${item.id}`"
                    class="btn-view-batches"
                    title="Open Question Bank"
                  >
                    <span>Question Bank</span>
                    <i class="mdi mdi-arrow-right"></i>
                  </NuxtLink>

                  <!-- Icon Actions Row -->
                  <div class="card-icon-actions">
                    <NuxtLink
                      :to="`/dashboard/admin/public-exams/create?id=${item.id}`"
                      class="btn-icon-action"
                      title="Edit Exam Configuration"
                    >
                      <i class="mdi mdi-pencil-outline"></i>
                    </NuxtLink>

                    <button
                      type="button"
                      class="btn-icon-action"
                      title="Duplicate Exam"
                      @click="duplicateExam(item.id)"
                    >
                      <i class="mdi mdi-content-copy"></i>
                    </button>

                    <button
                      v-if="item.status !== 'published'"
                      type="button"
                      class="btn-icon-action text-emerald hover:bg-emerald-50"
                      title="Publish to Catalog"
                      @click="changeStatus(item.id, 'published')"
                    >
                      <i class="mdi mdi-rocket-launch-outline"></i>
                    </button>
                    <button
                      v-else
                      type="button"
                      class="btn-icon-action text-amber hover:bg-amber-50"
                      title="Unpublish (Revert to Draft)"
                      @click="changeStatus(item.id, 'draft')"
                    >
                      <i class="mdi mdi-pause-circle-outline"></i>
                    </button>

                    <button
                      type="button"
                      class="btn-icon-action btn-icon-del"
                      title="Delete Exam"
                      @click="confirmDelete(item)"
                    >
                      <i class="mdi mdi-trash-can-outline"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Global GSFIN Pagination Component -->
          <AppPagination
            v-if="filteredExams.length > 0"
            v-model="page"
            v-model:items-per-page="perPage"
            :total-items="filteredExams.length"
            :per-page-options="[10, 25, 50, 100]"
          />
        </div>
      </div>
    </div>

    <!-- ═══ DELETE CONFIRMATION MODAL (GSFIN Global Style) ═══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="deleteDialog" class="modal-overlay" @click.self="deleteDialog = false">
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
                Are you sure you want to delete <strong class="text-slate-900">"{{ targetExam?.name }}"</strong>?
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
        </div>
      </Transition>
    </Teleport>

    <!-- ═══ 3X QUESTION POOL INCOMPLETE MODAL (GSFIN Global Style) ═══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="publishWarningDialog" class="modal-overlay" @click.self="publishWarningDialog = false">
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
        </div>
      </Transition>
    </Teleport>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="lg">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'main_admin', 'sub_admin', 'lms_user']
});

const api = useApi();

const loading = ref(true);
const exams = ref<any[]>([]);
const qualifications = ref<any[]>([]);
const search = ref('');
const qualificationFilter = ref('All');
const statusFilter = ref('All');

// Pagination State
const page = ref(1);
const perPage = ref(10);

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
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' as const, width: '200px', minWidth: '200px' }
];

function getStatusClass(status: string) {
  if (status === 'published') return 'status-active';
  if (status === 'draft') return 'status-read';
  if (status === 'review') return 'status-suspended';
  return 'status-new';
}

function getStatusLabel(status: string) {
  if (status === 'published') return 'Active';
  if (status === 'draft') return 'Draft';
  if (status === 'review') return 'Review';
  return 'Archived';
}

const filteredExams = computed(() => {
  return exams.value.filter(exam => {
    const matchesSearch = !search.value || 
      exam.name.toLowerCase().includes(search.value.toLowerCase()) ||
      (exam.qualification_name && exam.qualification_name.toLowerCase().includes(search.value.toLowerCase()));
    const matchesQual = qualificationFilter.value === 'All' || exam.qualification_id === qualificationFilter.value;
    const matchesStatus = statusFilter.value === 'All' || exam.status === statusFilter.value;
    return matchesSearch && matchesQual && matchesStatus;
  });
});

const paginatedExams = computed(() => {
  const start = (page.value - 1) * perPage.value;
  return filteredExams.value.slice(start, start + perPage.value);
});

watch([search, qualificationFilter, statusFilter], () => {
  page.value = 1;
});

async function loadData() {
  loading.value = true;
  try {
    const [qualsRes, examsRes] = await Promise.all([
      api.get('/public/qualifications'),
      api.get('/admin/public-exams')
    ]);
    qualifications.value = qualsRes.data || [];
    exams.value = examsRes.data || [];
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
.th-exam-std { min-width: 280px; }
.th-exam-cfg { min-width: 220px; }
.th-exam-status { min-width: 140px; }
.th-exam-engage { min-width: 130px; }
.th-exam-date { min-width: 110px; }
.th-exam-actions { min-width: 190px; }

.table-select-filter {
  width: auto;
  min-width: 150px;
  max-width: 220px;
  height: 38px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  font-size: 0.84rem;
  font-weight: 600;
  color: #0F172A;
  cursor: pointer;
  box-sizing: border-box;
}

.table-select-filter:focus {
  border-color: #E31B23;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.1);
  outline: none;
}

.actions-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
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

.btn-table-action.btn-pause {
  background: rgba(245, 158, 11, 0.08);
  color: #D97706;
  border-color: rgba(245, 158, 11, 0.2);
}

.btn-table-action.btn-pause:hover {
  background: #D97706;
  color: #FFFFFF;
}

/* Exam Standard Cell */
.exam-cell-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.exam-thumb {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  overflow: hidden;
  background: #F1F5F9;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.exam-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.exam-thumb-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: #64748B;
  font-size: 1.25rem;
  border-radius: 10px;
}

.exam-info-wrap {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.exam-name-text {
  font-size: 0.92rem;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.3;
}

.exam-desc-text {
  font-size: 0.78rem;
  line-height: 1.35;
  color: #64748B;
  max-width: 360px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.exam-meta-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: #94A3B8;
  margin-top: 2px;
}

.exam-slug-tag {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.70rem;
  font-weight: 600;
  color: #475569;
  background: #F1F5F9;
  padding: 1px 6px;
  border-radius: 4px;
}

.exam-level-tag {
  font-weight: 600;
  color: #475569;
}

/* Questions & Duration Cell */
.exam-config-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.exam-config-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #64748B;
  white-space: nowrap;
}

.exam-q-count {
  font-weight: 600;
  color: #0F172A;
}

.exam-duration {
  color: #475569;
}

.exam-pass-badge {
  font-weight: 600;
  color: #334155;
}

.dot {
  color: #CBD5E1;
  font-weight: 600;
}

/* Question Pool Indicator */
.pool-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.pool-pill-ready {
  background: rgba(16, 185, 129, 0.08);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.pool-pill-need {
  background: rgba(245, 158, 11, 0.08);
  color: #B45309;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.pool-pill-tag {
  font-weight: 600;
}

/* ═════ CARD ROW LIST STYLES ═════ */
.partner-cards-list {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.partner-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02);
  transition: all 0.2s ease;
  overflow: hidden;
}
.partner-card:hover {
  transform: translateY(-2px);
  border-color: rgba(227, 27, 35, 0.25);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}
.partner-card-header {
  padding: 20px 24px;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
}
.partner-identity-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 300px;
}
.partner-logo-avatar {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(227, 27, 35, 0.08) 0%, rgba(227, 27, 35, 0.16) 100%);
  border: 1px solid rgba(227, 27, 35, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  color: #E31B23;
  flex-shrink: 0;
}
.partner-identity-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.partner-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.partner-name-link {
  font-size: 1.15rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  letter-spacing: -0.01em;
  text-decoration: none;
  transition: color 0.15s ease;
}
.partner-name-link:hover {
  color: #E31B23;
}
.partner-status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 50px;
  letter-spacing: 0.04em;
  border: none;
}
.tag-active {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}
.tag-inactive {
  background: rgba(100, 116, 139, 0.1);
  color: #64748B;
}
.tag-amber {
  background: rgba(245, 158, 11, 0.1);
  color: #D97706;
}
.partner-type-tag {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748B;
  background: #F1F5F9;
  padding: 3px 10px;
  border-radius: 50px;
}
.partner-meta-strip {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: #64748B;
}
.partner-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  text-decoration: none;
}
.partner-meta-item i {
  color: #94A3B8;
  font-size: 0.95rem;
}
.partner-header-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.partner-stat-pill {
  display: flex;
  align-items: center;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  padding: 8px 16px;
  gap: 14px;
}
.stat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.15;
}
.stat-num {
  font-size: 1.05rem;
  font-weight: 600;
  color: #0F172A;
}
.stat-lbl {
  font-size: 0.68rem;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 2px;
}
.stat-divider {
  width: 1px;
  height: 24px;
  background: rgba(15, 23, 42, 0.1);
}
.card-action-cluster {
  display: flex;
  align-items: center;
  gap: 10px;
}
.btn-view-batches {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  background: #E31B23;
  color: #FFFFFF;
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(227, 27, 35, 0.2);
  white-space: nowrap;
}
.btn-view-batches:hover {
  background: #C41219;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(227, 27, 35, 0.28);
}
.btn-view-batches i {
  font-size: 0.95rem;
  transition: transform 0.15s ease;
}
.btn-view-batches:hover i {
  transform: translateX(3px);
}
.card-icon-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-icon-action {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #FFFFFF;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 1rem;
  text-decoration: none;
}
.btn-icon-action:hover {
  background: #F8FAFC;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.2);
}
.btn-icon-del:hover {
  background: #FEF2F2;
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.25);
}
.panel-loading-state, .panel-empty-state {
  padding: 48px;
  text-align: center;
  color: #64748B;
}

/* Badge Chips */
.badge-chip {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.chip-green {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.chip-slate {
  background: rgba(100, 116, 139, 0.1);
  color: #64748B;
}

.chip-amber {
  background: rgba(245, 158, 11, 0.1);
  color: #D97706;
}

.total-count-badge {
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748B;
  background: rgba(100, 116, 139, 0.08);
  padding: 4px 12px;
  border-radius: 20px;
  white-space: nowrap;
}

.spinner-sm-red {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(227, 27, 35, 0.2);
  border-top-color: #E31B23;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

