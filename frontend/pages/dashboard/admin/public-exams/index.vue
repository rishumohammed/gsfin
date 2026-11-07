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

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="440">
      <div class="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/80">
        <h3 class="text-lg font-semibold text-slate-900 mb-2">Delete Certification Exam?</h3>
        <p class="text-xs text-slate-600 mb-6">
          Are you sure you want to delete <span class="font-semibold text-slate-800">"{{ targetExam?.name }}"</span>? This action will permanently remove questions and student attempts.
        </p>
        <div class="flex justify-end gap-3">
          <v-btn variant="text" class="text-none font-semibold text-slate-600" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn
            color="#E31B23"
            class="font-semibold text-white text-none rounded-xl"
            :loading="deleting"
            @click="deleteExam"
          >
            Delete Exam
          </v-btn>
        </div>
      </div>
    </v-dialog>

    <!-- 3x Question Bank Pool Warning Dialog -->
    <v-dialog v-model="publishWarningDialog" max-width="480">
      <div class="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/80">
        <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
          <i class="mdi mdi-alert-circle-outline text-2xl"></i>
        </div>
        <h3 class="text-base font-semibold text-slate-900 mb-2">Question Bank Pool Incomplete</h3>
        <p class="text-xs text-slate-600 leading-relaxed mb-4">
          Cannot publish <span class="font-semibold text-slate-800">"{{ publishWarningExam?.name }}"</span>.
          Every certification exam requires at least <span class="font-semibold text-slate-800">3× questions</span> in the Question Bank before publishing.
        </p>
        <div class="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3 mb-6">
          <div class="flex justify-between text-xs text-slate-700 font-medium mb-1.5">
            <span>Exam Questions Conducted:</span>
            <span class="font-semibold text-slate-900">{{ publishWarningExam?.total_questions || 0 }}</span>
          </div>
          <div class="flex justify-between text-xs text-slate-700 font-medium mb-1.5">
            <span>Required in Question Bank (3×):</span>
            <span class="font-semibold text-amber-800">{{ (publishWarningExam?.total_questions || 0) * 3 }}</span>
          </div>
          <div class="flex justify-between text-xs text-slate-700 font-medium">
            <span>Currently in Question Bank:</span>
            <span class="font-semibold text-slate-900">{{ publishWarningExam?.question_count || 0 }}</span>
          </div>
        </div>
        <div class="flex justify-end gap-3">
          <v-btn variant="text" class="text-none font-semibold text-slate-600" @click="publishWarningDialog = false">Cancel</v-btn>
          <v-btn
            color="#E31B23"
            class="font-semibold text-white text-none rounded-xl"
            prepend-icon="mdi-database-plus-outline"
            :to="`/dashboard/admin/public-exams/questions?examId=${publishWarningExam?.id}`"
            @click="publishWarningDialog = false"
          >
            Open Question Bank
          </v-btn>
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
</style>

