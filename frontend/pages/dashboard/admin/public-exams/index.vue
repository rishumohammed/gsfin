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
            <div class="py-3">
              <div class="font-semibold text-slate-900 text-sm mb-1">{{ item.name }}</div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  {{ item.category_name || 'General Certification' }}
                </span>
              </div>
            </div>
          </template>

          <!-- Configuration Column -->
          <template v-slot:item.settings="{ item }">
            <div class="py-3">
              <div class="font-semibold text-slate-900 text-xs">{{ item.question_count || 0 }} Questions</div>
              <div class="text-xs text-slate-500 mt-0.5">
                {{ item.duration_minutes }} Mins • Pass Score: <strong class="text-slate-800">{{ item.passing_marks }} ({{ item.pass_percentage }}%)</strong>
              </div>
            </div>
          </template>

          <!-- Status Column -->
          <template v-slot:item.status="{ item }">
            <div class="flex flex-col items-center justify-center py-2">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider',
                  item.status === 'published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  item.status === 'draft' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                  item.status === 'review' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-red-50 text-red-700 border border-red-200'
                ]"
              >
                {{ item.status === 'published' ? 'Active in Catalog' : item.status }}
              </span>
            </div>
          </template>

          <!-- Partner Engagement Column -->
          <template v-slot:item.engagement="{ item }">
            <div class="py-3 text-center">
              <div class="font-semibold text-slate-900 text-xs">{{ item.attempts_count || 0 }} Attempts</div>
              <div class="text-[11px] text-slate-500 font-medium mt-0.5">{{ item.candidate_count || 0 }} Students Conducted</div>
            </div>
          </template>

          <!-- Created Date Column -->
          <template v-slot:item.created_at="{ item }">
            <span class="text-xs text-slate-500 font-medium">{{ formatDate(item.created_at) }}</span>
          </template>

          <!-- Actions Column -->
          <template v-slot:item.actions="{ item }">
            <div class="actions-cell-2rows">
              <!-- Row 1: Authoring & Templates (3 buttons) -->
              <div class="actions-row">
                <!-- Manage Questions / Question Bank -->
                <v-btn
                  icon="mdi-database-outline"
                  variant="outlined"
                  size="x-small"
                  color="#E31B23"
                  class="rounded-lg action-btn"
                  :to="`/dashboard/admin/public-exams/questions?examId=${item.id}`"
                  title="Question Bank"
                />
                <!-- Edit Exam Settings -->
                <v-btn
                  icon="mdi-pencil-outline"
                  variant="outlined"
                  size="x-small"
                  color="slate"
                  class="rounded-lg action-btn"
                  :to="`/dashboard/admin/public-exams/create?id=${item.id}`"
                  title="Edit Exam Settings"
                />
                <!-- Duplicate Exam -->
                <v-btn
                  icon="mdi-content-copy"
                  variant="outlined"
                  size="x-small"
                  color="amber"
                  class="rounded-lg action-btn"
                  @click="duplicateExam(item.id)"
                  title="Duplicate Exam"
                />
              </div>

              <!-- Row 2: Status & Deletion (2 buttons) -->
              <div class="actions-row">
                <!-- Publish / Unpublish Toggle -->
                <v-btn
                  v-if="item.status !== 'published'"
                  icon="mdi-rocket-launch-outline"
                  variant="flat"
                  size="x-small"
                  color="#10B981"
                  class="rounded-lg text-white action-btn"
                  @click="changeStatus(item.id, 'published')"
                  title="Publish to Partner Centers"
                />
                <v-btn
                  v-else
                  icon="mdi-pause-circle-outline"
                  variant="tonal"
                  size="x-small"
                  color="slate"
                  class="rounded-lg action-btn"
                  @click="changeStatus(item.id, 'draft')"
                  title="Unpublish (Set to Draft)"
                />
                <!-- Delete -->
                <v-btn
                  icon="mdi-delete-outline"
                  variant="tonal"
                  size="x-small"
                  color="error"
                  class="rounded-lg action-btn"
                  @click="confirmDelete(item)"
                  title="Delete Exam"
                />
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
          Are you sure you want to delete <strong>"{{ targetExam?.name }}"</strong>? This action will permanently remove questions and student attempts.
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

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const headers = [
  { title: 'Exam', key: 'name' },
  { title: 'Details', key: 'settings', sortable: false },
  { title: 'Status', key: 'status', align: 'center' as const },
  { title: 'Attempts', key: 'engagement', align: 'center' as const, sortable: false },
  { title: 'Date', key: 'created_at' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const, width: '130px' }
];

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
    alert('Exam duplicated successfully as a Draft!');
    loadData();
  } catch (err) {
    console.error('Duplication failed:', err);
  }
}

async function changeStatus(id: string, newStatus: string) {
  try {
    await api.put(`/admin/public-exams/${id}`, { status: newStatus });
    loadData();
  } catch (err) {
    console.error('Failed to toggle status:', err);
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
  gap: 5px;
  align-items: flex-end;
  justify-content: center;
  padding: 6px 0;
  width: max-content;
  margin-left: auto;
}

.actions-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

.action-btn {
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  transition: all 0.15s ease !important;
}

.action-btn:hover {
  transform: translateY(-1px);
}
</style>

