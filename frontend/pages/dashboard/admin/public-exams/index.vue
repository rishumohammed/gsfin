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

        <div class="table-responsive">
          <table class="gsfin-table">
            <thead>
              <tr>
                <th style="min-width: 280px;">Exam Standard</th>
                <th style="min-width: 220px;">Questions &amp; Duration</th>
                <th style="min-width: 140px; text-align: center;">Status</th>
                <th style="min-width: 130px; text-align: center;">Engagement</th>
                <th style="min-width: 110px;">Created</th>
                <th class="th-actions" style="min-width: 190px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <!-- Loading State -->
              <tr v-if="loading">
                <td colspan="6" class="text-center py-12 text-slate-500">
                  <span class="spinner-sm-red"></span>
                  <div class="mt-2 text-xs font-medium text-slate-500">Loading certification exams...</div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-else-if="filteredExams.length === 0">
                <td colspan="6" class="text-center py-16 px-4">
                  <div class="empty-state-icon-box mb-3">
                    <i class="mdi mdi-clipboard-text-off-outline text-3xl text-slate-400"></i>
                  </div>
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
                </td>
              </tr>

              <!-- Data Rows -->
              <tr v-for="item in paginatedExams" :key="item.id">
                <!-- Col 1: Exam Standard -->
                <td>
                  <div class="exam-cell-row">
                    <div class="exam-icon-box">
                      <i class="mdi mdi-certificate-outline"></i>
                    </div>
                    <div class="exam-info-wrap">
                      <div class="exam-name-row">
                        <span class="exam-name-text">{{ item.name }}</span>
                        <span v-if="item.qualification_id" class="badge-cert-pill" title="Official Certification Standard">
                          <i class="mdi mdi-check-decagram"></i> Official
                        </span>
                      </div>
                      <div class="exam-meta-pills">
                        <span class="badge-program-tag">
                          <i class="mdi mdi-shape-outline"></i>
                          {{ item.qualification_category || 'Food Safety Standard' }}
                        </span>
                        <span v-if="item.enable_proctoring" class="badge-proctor-tag">
                          <i class="mdi mdi-shield-check"></i> AI Proctored
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Col 2: Questions & Duration -->
                <td>
                  <div class="exam-config-cell">
                    <div class="exam-config-line">
                      <span class="exam-q-count">{{ item.total_questions || 0 }} Questions</span>
                      <span class="dot">•</span>
                      <span class="exam-duration">{{ item.duration_minutes }} Mins</span>
                      <span class="dot">•</span>
                      <span class="exam-pass-badge">Pass: {{ item.pass_percentage }}%</span>
                    </div>
                    <div class="mt-1">
                      <div 
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
                        <span class="pool-pill-tag">
                          {{ (item.question_count || 0) >= (item.total_questions || 0) * 3 && (item.total_questions || 0) > 0 ? 'Ready' : `Need +${Math.max(0, ((item.total_questions || 0) * 3) - (item.question_count || 0))}` }}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Col 3: Status -->
                <td class="text-center">
                  <span :class="['badge-chip', item.status === 'published' ? 'chip-green' : (item.status === 'draft' ? 'chip-slate' : 'chip-amber')]">
                    {{ getStatusLabel(item.status) }}
                  </span>
                </td>

                <!-- Col 4: Engagement -->
                <td class="text-center">
                  <div class="font-semibold text-slate-900 text-xs">{{ item.attempts_count || 0 }} Attempts</div>
                  <div class="text-[11px] text-slate-400 font-medium mt-0.5">{{ item.candidate_count || 0 }} Candidates</div>
                </td>

                <!-- Col 5: Created Date -->
                <td>
                  <span class="text-xs text-slate-500 font-medium whitespace-nowrap">{{ formatDate(item.created_at) }}</span>
                </td>

                <!-- Col 6: Actions (5 Icon-Only Buttons in One Row) -->
                <td>
                  <div class="actions-cell">
                    <!-- 1. Question Bank -->
                    <NuxtLink
                      :to="`/dashboard/admin/public-exams/questions?examId=${item.id}`"
                      class="btn-table-action icon-only btn-qb"
                      title="Question Bank"
                    >
                      <i class="mdi mdi-database-outline"></i>
                    </NuxtLink>
                    <!-- 2. Edit Settings -->
                    <NuxtLink
                      :to="`/dashboard/admin/public-exams/create?id=${item.id}`"
                      class="btn-table-action icon-only btn-edit"
                      title="Edit Exam Settings"
                    >
                      <i class="mdi mdi-pencil-outline"></i>
                    </NuxtLink>
                    <!-- 3. Duplicate Exam -->
                    <button
                      type="button"
                      class="btn-table-action icon-only btn-warn"
                      title="Duplicate Exam"
                      @click="duplicateExam(item.id)"
                    >
                      <i class="mdi mdi-content-copy"></i>
                    </button>
                    <!-- 4. Toggle Status (Publish / Unpublish) -->
                    <button
                      v-if="item.status !== 'published'"
                      type="button"
                      class="btn-table-action icon-only btn-success"
                      title="Publish to Catalog"
                      @click="changeStatus(item.id, 'published')"
                    >
                      <i class="mdi mdi-rocket-launch-outline"></i>
                    </button>
                    <button
                      v-else
                      type="button"
                      class="btn-table-action icon-only btn-pause"
                      title="Unpublish (Revert to Draft)"
                      @click="changeStatus(item.id, 'draft')"
                    >
                      <i class="mdi mdi-pause-circle-outline"></i>
                    </button>
                    <!-- 5. Delete Exam -->
                    <button
                      type="button"
                      class="btn-table-action icon-only btn-danger"
                      title="Delete Exam"
                      @click="confirmDelete(item)"
                    >
                      <i class="mdi mdi-trash-can-outline"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Global GSFIN Pagination Component -->
          <AppPagination
            v-if="filteredExams.length > 0"
            v-model="page"
            v-model:items-per-page="perPage"
            :total-items="filteredExams.length"
            :per-page-options="[10, 25, 50]"
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
  if (status === 'published') return 'Active in Catalog';
  if (status === 'draft') return 'Draft Mode';
  if (status === 'review') return 'Under Review';
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
  align-items: center;
  gap: 12px;
}

.exam-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(227, 27, 35, 0.08);
  color: #E31B23;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.exam-info-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.exam-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.exam-name-text {
  font-size: 0.90rem;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.3;
}

.exam-meta-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
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
  font-weight: bold;
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
  font-weight: 700;
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

