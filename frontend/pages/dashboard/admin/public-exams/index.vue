<template>
  <div class="exam-portal-page min-h-screen pb-12" style="background-color: #FAFAFD;">
    <!-- Page Header -->
    <div class="bg-white border-b border-slate-200/80 shadow-xs mb-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div class="d-flex align-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 d-flex align-center justify-center text-white shadow-md shrink-0">
              <v-icon icon="mdi-clipboard-text-outline" size="26" color="white"></v-icon>
            </div>
            <div>
              <div class="d-flex align-center gap-2 mb-1 flex-wrap">
                <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Certification Exam Portal
                </h1>
              </div>
              <p class="text-xs sm:text-sm text-slate-500 font-medium">
                Create and manage certification exams, set passing criteria, manage question pools & publish workflows.
              </p>
            </div>
          </div>

          <div class="d-flex align-center gap-3 shrink-0">
            <v-btn
              variant="outlined"
              color="slate"
              class="text-none font-bold rounded-xl border-slate-300 text-slate-700 me-3 mr-3"
              to="/dashboard/admin/public-exams/categories"
            >
              Categories
            </v-btn>
            <v-btn
              color="#E31B23"
              size="large"
              class="font-bold text-white text-none rounded-xl shadow-md hover:bg-red-700"
              prepend-icon="mdi-plus"
              to="/dashboard/admin/public-exams/create"
            >
              Create Exam
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Search & Filters Card -->
      <div class="filter-card">
        <v-row dense align="center">
          <!-- Search Field -->
          <v-col cols="12" md="6">
            <div class="filter-field-wrap">
              <label class="filter-field-label">Search Exam</label>
              <div class="search-input-box">
                <v-icon icon="mdi-magnify" size="20" class="search-icon-inside"></v-icon>
                <input
                  v-model="search"
                  type="text"
                  placeholder="Search exams by name or category..."
                  class="gsfin-input"
                />
              </div>
            </div>
          </v-col>

          <!-- Category Select -->
          <v-col cols="12" md="3">
            <div class="filter-field-wrap">
              <label class="filter-field-label">Category</label>
              <div class="select-input-box">
                <select v-model="categoryFilter" class="gsfin-select">
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
                <v-icon icon="mdi-chevron-down" size="18" class="select-chevron-inside"></v-icon>
              </div>
            </div>
          </v-col>

          <!-- Status Select -->
          <v-col cols="12" md="3">
            <div class="filter-field-wrap">
              <label class="filter-field-label">Status</label>
              <div class="select-input-box">
                <select v-model="statusFilter" class="gsfin-select capitalize">
                  <option value="All">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="review">Under Review</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <v-icon icon="mdi-chevron-down" size="18" class="select-chevron-inside"></v-icon>
              </div>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- Main Exams Table Card -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div v-if="loading" class="p-12 text-center">
          <v-progress-circular indeterminate color="#E31B23" size="48"></v-progress-circular>
          <div class="mt-4 text-xs font-bold text-slate-500">Loading certification exams...</div>
        </div>

        <v-data-table
          v-else
          :headers="headers"
          :items="filteredExams"
          class="elevation-0 gsfin-exam-table"
        >
          <!-- Custom Empty State -->
          <template v-slot:no-data>
            <div class="py-16 text-center px-4">
              <div class="empty-state-icon-box">
                <v-icon icon="mdi-clipboard-text-off-outline" size="32" color="#E31B23"></v-icon>
              </div>
              <h3 class="text-base font-black text-slate-900 mb-1">No Certification Exams Found</h3>
              <p class="text-xs text-slate-500 max-w-md mx-auto mb-6">
                There are no certification exams matching your current filter criteria. Create your first exam to get started.
              </p>
              <v-btn
                color="#E31B23"
                class="font-bold text-white text-none rounded-xl shadow-md"
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
              <div class="font-black text-slate-900 text-sm mb-1">{{ item.name }}</div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                  {{ item.category_name || 'General Certification' }}
                </span>
              </div>
            </div>
          </template>

          <!-- Configuration Column -->
          <template v-slot:item.settings="{ item }">
            <div class="py-3">
              <div class="font-bold text-slate-900 text-xs">{{ item.question_count || 0 }} Questions</div>
              <div class="text-xs text-slate-500 mt-0.5">
                {{ item.duration_minutes }} Mins • Pass Score: <strong class="text-slate-800">{{ item.passing_marks }} ({{ item.pass_percentage }}%)</strong>
              </div>
            </div>
          </template>

          <!-- Status Column -->
          <template v-slot:item.status="{ item }">
            <div class="flex flex-col items-center gap-1.5 py-2">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider',
                  item.status === 'published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  item.status === 'draft' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                  item.status === 'review' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-red-50 text-red-700 border border-red-200'
                ]"
              >
                {{ item.status }}
              </span>
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                  item.registration_status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                ]"
              >
                <v-icon size="10" :icon="item.registration_status === 'open' ? 'mdi-lock-open-outline' : 'mdi-lock-outline'"></v-icon>
                {{ item.registration_status === 'open' ? 'Reg Open' : 'Reg Closed' }}
              </span>
            </div>
          </template>

          <!-- Engagement Column -->
          <template v-slot:item.engagement="{ item }">
            <div class="py-3 text-center">
              <div class="font-bold text-slate-900 text-xs">{{ item.candidate_count || 0 }} Candidates</div>
              <div class="text-[11px] text-slate-500 font-medium mt-0.5">{{ item.attempts_count || 0 }} Attempts</div>
            </div>
          </template>

          <!-- Created Date Column -->
          <template v-slot:item.created_at="{ item }">
            <span class="text-xs text-slate-500 font-medium">{{ formatDate(item.created_at) }}</span>
          </template>

          <!-- Actions Column -->
          <template v-slot:item.actions="{ item }">
            <div class="d-flex flex-column gap-1-5 py-2 px-1">
              <div class="action-btn-group">
                <!-- Manage Questions -->
                <v-btn
                  icon="mdi-database-outline"
                  variant="outlined"
                  size="x-small"
                  color="#E31B23"
                  class="rounded-lg"
                  :to="`/dashboard/admin/public-exams/questions?examId=${item.id}`"
                  title="Question Bank"
                />
                <!-- Registration Link -->
                <v-btn
                  icon="mdi-link-variant"
                  variant="outlined"
                  size="x-small"
                  color="teal"
                  class="rounded-lg"
                  :to="`/public-exams/${item.slug}/register`"
                  target="_blank"
                  title="Candidate Reg Link"
                />
                <!-- Candidates -->
                <v-btn
                  icon="mdi-account-group-outline"
                  variant="outlined"
                  size="x-small"
                  color="purple"
                  class="rounded-lg"
                  :to="`/dashboard/admin/public-exams/${item.id}/candidates`"
                  title="Enrolled Candidates"
                />
                <!-- Certificates -->
                <v-btn
                  icon="mdi-certificate-outline"
                  variant="outlined"
                  size="x-small"
                  color="indigo"
                  class="rounded-lg"
                  :to="`/dashboard/admin/public-exams/${item.id}/certificates`"
                  title="Issued Certificates"
                />
                <!-- Share Link Dialog -->
                <v-btn
                  icon="mdi-share-variant"
                  variant="outlined"
                  size="x-small"
                  color="slate"
                  class="rounded-lg"
                  @click="openShareDialog(item)"
                  title="Share Exam Link"
                />
              </div>

              <div class="action-btn-group">
                <!-- Edit Exam -->
                <v-btn
                  icon="mdi-pencil-outline"
                  variant="outlined"
                  size="x-small"
                  color="slate"
                  class="rounded-lg"
                  :to="`/dashboard/admin/public-exams/create?id=${item.id}`"
                  title="Edit Exam Settings"
                />
                <!-- Duplicate -->
                <v-btn
                  icon="mdi-content-copy"
                  variant="outlined"
                  size="x-small"
                  color="amber"
                  class="rounded-lg"
                  @click="duplicateExam(item.id)"
                  title="Duplicate Exam"
                />

                <!-- Publish / Unpublish Toggle -->
                <v-btn
                  v-if="item.status !== 'published'"
                  icon="mdi-rocket-launch-outline"
                  variant="flat"
                  size="x-small"
                  color="#10B981"
                  class="rounded-lg text-white"
                  @click="changeStatus(item.id, 'published')"
                  title="Publish Exam"
                />
                <v-btn
                  v-else
                  icon="mdi-pause-circle-outline"
                  variant="tonal"
                  size="x-small"
                  color="slate"
                  class="rounded-lg"
                  @click="changeStatus(item.id, 'draft')"
                  title="Set to Draft"
                />

                <!-- Stop / Open Registration -->
                <v-btn
                  v-if="item.registration_status !== 'closed'"
                  icon="mdi-stop-circle-outline"
                  variant="tonal"
                  size="x-small"
                  color="error"
                  class="rounded-lg"
                  @click="confirmStopRegistration(item)"
                  title="Stop Registration"
                />
                <v-btn
                  v-else
                  icon="mdi-lock-open-outline"
                  variant="tonal"
                  size="x-small"
                  color="teal"
                  class="rounded-lg"
                  @click="toggleRegistrationStatus(item.id, 'open')"
                  title="Open Registration"
                />

                <!-- Delete -->
                <v-btn
                  icon="mdi-delete-outline"
                  variant="tonal"
                  size="x-small"
                  color="error"
                  class="rounded-lg"
                  @click="confirmDelete(item)"
                  title="Delete Exam"
                />
              </div>
            </div>
          </template>
        </v-data-table>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="440">
      <div class="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/80">
        <h3 class="text-lg font-bold text-slate-900 mb-2">Delete Certification Exam?</h3>
        <p class="text-xs text-slate-600 mb-6">
          Are you sure you want to delete <strong>"{{ targetExam?.name }}"</strong>? This action will permanently remove questions, candidate attempts, and generated certificate records.
        </p>
        <div class="flex justify-end gap-3">
          <v-btn variant="text" class="text-none font-bold text-slate-600" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn
            color="#E31B23"
            class="font-bold text-white text-none rounded-xl"
            :loading="deleting"
            @click="deleteExam"
          >
            Delete Exam
          </v-btn>
        </div>
      </div>
    </v-dialog>

    <!-- Stop Registration Confirmation Dialog -->
    <v-dialog v-model="stopRegistrationDialog" max-width="440">
      <div class="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/80">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <v-icon icon="mdi-stop-circle-outline" color="#E31B23" size="24"></v-icon>
          </div>
          <h3 class="text-lg font-bold text-slate-900">Close Candidate Registrations?</h3>
        </div>
        <p class="text-xs text-slate-600 mb-6">
          Close registrations for <strong>{{ targetStopExam?.name }}</strong>? New candidates will no longer be able to register. You can reopen registrations at any time.
        </p>
        <div class="flex justify-end gap-3">
          <v-btn variant="text" class="text-none font-bold text-slate-600" @click="stopRegistrationDialog = false">Cancel</v-btn>
          <v-btn
            color="#E31B23"
            class="font-bold text-white text-none rounded-xl"
            :loading="togglingReg"
            @click="doStopRegistration"
          >
            Close Registrations
          </v-btn>
        </div>
      </div>
    </v-dialog>

    <!-- Share Link Dialog -->
    <v-dialog v-model="shareDialog" max-width="500">
      <div class="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/80">
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h3 class="text-lg font-bold text-slate-900">Share Exam Registration Link</h3>
          <button @click="shareDialog = false" class="text-slate-400 hover:text-slate-600">
            <v-icon icon="mdi-close" size="20"></v-icon>
          </button>
        </div>

        <p class="text-xs text-slate-600 mb-4">
          Share this direct link with candidate applicants for <strong>"{{ targetExam?.name }}"</strong>.
        </p>

        <v-text-field
          readonly
          v-model="shareUrl"
          variant="outlined"
          density="compact"
          class="mb-4 rounded-xl"
          hide-details
        >
          <template v-slot:append-inner>
            <v-btn variant="text" color="#E31B23" class="font-bold text-none" size="small" @click="executeCopy">
              Copy Link
            </v-btn>
          </template>
        </v-text-field>

        <div class="flex items-center justify-end gap-3 pt-2">
          <v-btn
            color="#25D366"
            class="text-white text-none font-bold rounded-xl"
            prepend-icon="mdi-whatsapp"
            :href="'https://wa.me/?text=' + encodeURIComponent('Take this certification exam: ' + shareUrl)"
            target="_blank"
          >
            WhatsApp
          </v-btn>
          <v-btn
            color="#E31B23"
            class="text-white text-none font-bold rounded-xl"
            prepend-icon="mdi-email-outline"
            :href="'mailto:?subject=Certification Exam Invitation&body=' + encodeURIComponent('Please access your certification exam using the following link:\n\n' + shareUrl)"
          >
            Email Link
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

// Stop Registration Dialog State
const stopRegistrationDialog = ref(false);
const targetStopExam = ref<any>(null);
const togglingReg = ref(false);

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// Share Dialog State
const shareDialog = ref(false);
const shareUrl = ref('');

const headers = [
  { title: 'Exam Details', key: 'name' },
  { title: 'Configuration', key: 'settings', sortable: false },
  { title: 'Status', key: 'status', align: 'center' as const },
  { title: 'Engagement', key: 'engagement', align: 'center' as const, sortable: false },
  { title: 'Created Date', key: 'created_at' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const }
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

function confirmStopRegistration(exam: any) {
  targetStopExam.value = exam;
  stopRegistrationDialog.value = true;
}

async function doStopRegistration() {
  if (!targetStopExam.value) return;
  togglingReg.value = true;
  try {
    await api.put(`/admin/public-exams/${targetStopExam.value.id}/registration-status`, { status: 'closed' });
    stopRegistrationDialog.value = false;
    snackbarText.value = 'Registrations have been closed successfully.';
    snackbarColor.value = 'success';
    snackbar.value = true;
    loadData();
  } catch (err) {
    console.error('Failed to stop registration:', err);
    snackbarText.value = 'Failed to stop registrations. Please try again.';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    togglingReg.value = false;
    targetStopExam.value = null;
  }
}

async function toggleRegistrationStatus(id: string, status: 'open' | 'closed') {
  try {
    await api.put(`/admin/public-exams/${id}/registration-status`, { status });
    snackbarText.value = status === 'open' ? 'Registrations are now open!' : 'Registrations have been closed.';
    snackbarColor.value = 'success';
    snackbar.value = true;
    loadData();
  } catch (err) {
    console.error('Failed to toggle registration status:', err);
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

function openShareDialog(exam: any) {
  targetExam.value = exam;
  shareUrl.value = `${window.location.origin}/public-exams/${exam.slug}`;
  shareDialog.value = true;
}

function executeCopy() {
  navigator.clipboard.writeText(shareUrl.value).then(() => {
    snackbarText.value = 'Exam link copied to clipboard!';
    snackbarColor.value = 'success';
    snackbar.value = true;
  }).catch(err => {
    console.error('Failed to copy:', err);
    snackbarText.value = 'Failed to copy automatically. Please select the text and copy manually.';
    snackbarColor.value = 'warning';
    snackbar.value = true;
  });
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.authority-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 12px;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 800;
  background-color: #FEF2F2;
  color: #B91C1C;
  border: 1px solid #FCA5A5;
}

.filter-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

.filter-field-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.filter-field-label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748B;
  display: block;
}

.search-input-box, .select-input-box {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.search-icon-inside {
  position: absolute;
  left: 12px;
  color: #94A3B8;
  pointer-events: none;
  z-index: 2;
}

.select-chevron-inside {
  position: absolute;
  right: 12px;
  color: #94A3B8;
  pointer-events: none;
  z-index: 2;
}

.gsfin-input {
  width: 100% !important;
  height: 44px !important;
  padding: 10px 14px 10px 40px !important;
  border-radius: 12px !important;
  border: 1px solid #CBD5E1 !important;
  background-color: #F8FAFC !important;
  font-size: 0.88rem !important;
  color: #0F172A !important;
  outline: none !important;
  box-sizing: border-box !important;
  transition: all 0.2s ease !important;
}

.gsfin-input:focus {
  border-color: #E31B23 !important;
  background-color: #FFFFFF !important;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.12) !important;
}

.gsfin-select {
  width: 100% !important;
  height: 44px !important;
  padding: 10px 36px 10px 14px !important;
  border-radius: 12px !important;
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

