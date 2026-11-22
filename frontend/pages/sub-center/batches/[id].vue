<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ TOP BREADCRUMB & BACK NAVIGATION ═══ -->
      <div class="top-nav-bar mb-6">
        <div class="nav-left">
          <NuxtLink to="/sub-center?tab=batches" class="btn-back">
            <i class="mdi mdi-arrow-left"></i> Back to Exam Batches
          </NuxtLink>
          <div class="breadcrumb-trail">
            <NuxtLink to="/sub-center" class="bc-link">Partner Portal</NuxtLink>
            <i class="mdi mdi-chevron-right bc-sep"></i>
            <NuxtLink to="/sub-center?tab=batches" class="bc-link">Exam Batches</NuxtLink>
            <i class="mdi mdi-chevron-right bc-sep"></i>
            <span class="bc-current">{{ batch?.exam_name || 'Batch Details' }}</span>
          </div>
        </div>

        <div class="nav-right">
          <button class="btn-icon-refresh" title="Refresh Batch Data" @click="fetchBatchDetails" :disabled="loading">
            <i :class="['mdi', 'mdi-refresh', { 'spin-icon': loading }]"></i>
          </button>
        </div>
      </div>

      <!-- ═══ LOADING STATE ═══ -->
      <div v-if="loading && !batch" class="text-center py-20 text-slate-500 font-medium">
        <span class="spinner-sm-red mb-2"></span>
        <p class="text-sm">Loading Examination Batch Roster &amp; Details...</p>
      </div>

      <!-- ═══ ERROR STATE ═══ -->
      <div v-else-if="error" class="p-8 bg-white border border-slate-200 rounded-2xl text-center max-w-lg mx-auto my-12">
        <div class="w-12 h-12 rounded-full bg-red-50 text-red flex items-center justify-center mx-auto mb-3 text-2xl">
          <i class="mdi mdi-alert-circle-outline"></i>
        </div>
        <h3 class="text-base font-semibold text-slate-900 mb-1">Unable to Load Batch</h3>
        <p class="text-xs text-slate-500 mb-4">{{ error }}</p>
        <NuxtLink to="/sub-center?tab=batches" class="btn-red text-xs py-2 px-4 no-underline inline-block">
          Return to Batches
        </NuxtLink>
      </div>

      <!-- ═══ BATCH MAIN CONTENT ═══ -->
      <div v-else-if="batch" class="space-y-6">

        <!-- ─── 1. BATCH HERO BANNER ─── -->
        <div class="hero-batch-card">
          <div class="hero-left">
            <div class="w-14 h-14 rounded-2xl bg-red-50 text-red flex items-center justify-center text-3xl border border-red-100 flex-shrink-0">
              <i class="mdi mdi-clipboard-text-clock-outline"></i>
            </div>
            <div>
              <div class="flex items-center gap-2.5 flex-wrap">
                <span
                  :class="[
                    'px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase',
                    batch.status === 'open' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    batch.status === 'closed' ? 'bg-slate-100 text-slate-700' :
                    batch.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                    'bg-amber-50 text-amber-700'
                  ]"
                >
                  {{ batch.status }}
                </span>
                <h1 class="text-xl font-semibold text-slate-900 m-0">{{ batch.exam_name }}</h1>
              </div>

              <div class="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                <span class="inline-flex items-center gap-1 font-mono">
                  <span class="text-slate-400 font-sans">Batch ID:</span>
                  <code class="bg-white border border-slate-200 px-1.5 py-0.5 rounded select-all">{{ batch.id }}</code>
                </span>
                <span v-if="batch.created_at">
                  <i class="mdi mdi-calendar-blank text-slate-400 mr-1"></i>Created: {{ formatDate(batch.created_at) }}
                </span>
                <span>
                  <i class="mdi mdi-clock-outline text-slate-400 mr-1"></i>Duration: {{ batch.duration_minutes || 60 }} mins
                </span>
                <span v-if="batch.opens_at">
                  <i class="mdi mdi-door-open text-slate-400 mr-1"></i>Opens: {{ formatDate(batch.opens_at) }}
                </span>
                <span v-if="batch.closes_at">
                  <i class="mdi mdi-door-closed text-slate-400 mr-1"></i>Closes: {{ formatDate(batch.closes_at) }}
                </span>
              </div>
            </div>
          </div>

          <div class="hero-right flex items-center gap-2">
            <NuxtLink to="/sub-center/batches/create" class="btn-glass text-xs py-2 px-3 no-underline inline-flex items-center gap-1.5">
              <i class="mdi mdi-plus"></i> New Batch
            </NuxtLink>
          </div>
        </div>

        <!-- ─── 2. BATCH KPI SUMMARY CARDS ─── -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Total Enrolled -->
          <div class="kpi-card">
            <div class="kpi-icon-box bg-blue-50 text-blue-600">
              <i class="mdi mdi-account-group-outline"></i>
            </div>
            <div>
              <span class="kpi-label">Total Enrolled</span>
              <div class="kpi-val text-blue-600">{{ assignments.length }} Students</div>
              <span class="kpi-sub text-slate-400">Total batch roster</span>
            </div>
          </div>

          <!-- Passed Students -->
          <div class="kpi-card">
            <div class="kpi-icon-box bg-emerald-50 text-emerald-600">
              <i class="mdi mdi-check-decagram-outline"></i>
            </div>
            <div>
              <span class="kpi-label">Passed &amp; Certified</span>
              <div class="kpi-val text-emerald-600">{{ passedCount }} Students</div>
              <span class="kpi-sub text-slate-400">
                {{ assignments.length ? Math.round((passedCount / assignments.length) * 100) : 0 }}% pass rate
              </span>
            </div>
          </div>

          <!-- Failed Students -->
          <div class="kpi-card">
            <div class="kpi-icon-box bg-red-50 text-red-600">
              <i class="mdi mdi-close-circle-outline"></i>
            </div>
            <div>
              <span class="kpi-label">Failed / Need Retake</span>
              <div class="kpi-val text-red-600">{{ failedCount }} Students</div>
              <span class="kpi-sub text-slate-400">Eligible for retry</span>
            </div>
          </div>

          <!-- Pending / Not Started -->
          <div class="kpi-card">
            <div class="kpi-icon-box bg-slate-100 text-slate-700">
              <i class="mdi mdi-timer-sand"></i>
            </div>
            <div>
              <span class="kpi-label">Pending / In Progress</span>
              <div class="kpi-val text-slate-800">{{ pendingCount }} Students</div>
              <span class="kpi-sub text-slate-400">Awaiting exam sitting</span>
            </div>
          </div>
        </div>

        <!-- ─── 3. STUDENT ASSIGNMENTS ROSTER ─── -->
        <div class="panel-section-card">
          <div class="section-card-header flex-wrap gap-3">
            <div>
              <h3 class="text-sm font-semibold text-slate-900 m-0">Enrolled Students</h3>
              <p class="text-xs text-slate-500 m-0 mt-0.5">
                Manage student exam links, monitor sitting status, grant retries, and access issued certificates.
              </p>
            </div>

            <!-- Header Action Tools -->
            <div class="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                class="btn-roster-action"
                @click="copyAllExamLinks"
                :disabled="assignments.length === 0"
                title="Copy all candidate names and individual exam sitting links to clipboard"
              >
                <i :class="['mdi', copiedAllLinks ? 'mdi-check text-emerald-600' : 'mdi-content-copy']"></i>
                <span>{{ copiedAllLinks ? 'All Links Copied!' : 'Copy All Exam Links' }}</span>
              </button>

              <button
                type="button"
                class="btn-roster-action"
                @click="exportRosterCSV"
                :disabled="assignments.length === 0"
                title="Export this batch candidate roster to CSV"
              >
                <i class="mdi mdi-file-delimited-outline"></i>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <!-- Filter & Search Controls Bar -->
          <div class="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <!-- Search Input -->
            <div class="search-box flex-1 max-w-md">
              <i class="mdi mdi-magnify search-icon"></i>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search students by name or email..."
                class="search-input"
              />
              <button v-if="searchQuery" type="button" class="search-clear-btn" @click="searchQuery = ''">
                <i class="mdi mdi-close-circle"></i>
              </button>
            </div>

            <!-- Status Filter Tabs -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <div class="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                <button
                  type="button"
                  :class="['px-3 py-1 text-xs font-semibold rounded-md transition-all', statusFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900']"
                  @click="statusFilter = 'all'"
                >
                  All ({{ assignments.length }})
                </button>
                <button
                  type="button"
                  :class="['px-3 py-1 text-xs font-semibold rounded-md transition-all', statusFilter === 'passed' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900']"
                  @click="statusFilter = 'passed'"
                >
                  Passed ({{ passedCount }})
                </button>
                <button
                  type="button"
                  :class="['px-3 py-1 text-xs font-semibold rounded-md transition-all', statusFilter === 'failed' ? 'bg-red text-white' : 'text-slate-600 hover:text-slate-900']"
                  @click="statusFilter = 'failed'"
                >
                  Failed ({{ failedCount }})
                </button>
                <button
                  type="button"
                  :class="['px-3 py-1 text-xs font-semibold rounded-md transition-all', statusFilter === 'in_progress' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900']"
                  @click="statusFilter = 'in_progress'"
                >
                  In Progress ({{ inProgressCount }})
                </button>
                <button
                  type="button"
                  :class="['px-3 py-1 text-xs font-semibold rounded-md transition-all', statusFilter === 'not_started' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-slate-900']"
                  @click="statusFilter = 'not_started'"
                >
                  Not Started ({{ notStartedCount }})
                </button>
              </div>
            </div>
          </div>

          <!-- ═══ ASSIGNMENTS TABLE ═══ -->
          <div class="overflow-x-auto">
            <div v-if="filteredAssignments.length === 0" class="text-center py-16 text-slate-400">
              <i class="mdi mdi-account-search-outline text-4xl block mb-2 text-slate-300"></i>
              <p class="text-sm font-semibold text-slate-700 m-0">No Students Found</p>
              <p class="text-xs text-slate-400 mt-1 m-0">No students match your search or status filter.</p>
            </div>

            <table v-else class="candidates-table">
              <thead>
                <tr>
                  <th class="w-10">#</th>
                  <th>Student</th>
                  <th>Contact Email</th>
                  <th>Attempts Used</th>
                  <th>Sitting Status</th>
                  <th class="text-right">Sitting Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, idx) in paginatedAssignments"
                  :key="item.id"
                  class="candidate-table-row"
                >
                  <!-- Index -->
                  <td class="text-xs text-slate-400 font-mono w-10">
                    {{ (currentPage - 1) * pageSize + idx + 1 }}
                  </td>

                  <!-- Student Name -->
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                        {{ item.student_name ? item.student_name.charAt(0).toUpperCase() : 'S' }}
                      </div>
                      <div>
                        <div class="font-semibold text-slate-900 text-xs">{{ item.student_name }}</div>
                        <span class="text-[10px] text-slate-400 font-mono">Assign ID: {{ (item.assignment_id || item.id).slice(0, 8) }}</span>
                      </div>
                    </div>
                  </td>

                  <!-- Student Email -->
                  <td>
                    <span class="text-xs text-slate-700 font-mono">{{ item.student_email }}</span>
                  </td>

                  <!-- Attempts -->
                  <td>
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-mono',
                        item.attempts_used >= item.max_attempts ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
                      ]"
                    >
                      {{ item.attempts_used }} / {{ item.max_attempts }} Sittings
                    </span>
                  </td>

                  <!-- Status -->
                  <td>
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span
                        :class="[
                          'px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase',
                          item.status === 'passed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          item.status === 'failed' ? 'bg-red-50 text-red-700 border border-red-200' :
                          item.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-slate-100 text-slate-600'
                        ]"
                      >
                        {{ formatStatus(item.status) }}
                      </span>
                      <span v-if="item.is_retry_link" class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        Dedicated Link
                      </span>
                    </div>
                  </td>

                  <!-- Actions -->
                  <td class="text-right">
                    <div class="action-btn-group inline-flex items-center gap-1 justify-end">
                      <!-- 1. Open Candidate Sitting in Browser -->
                      <a
                        v-if="['not_started', 'in_progress'].includes(item.status)"
                        :href="'/exam/take-' + (item.assignment_id || item.id)"
                        target="_blank"
                        class="btn-table-action btn-take-exam"
                        title="Open Candidate Exam Sitting"
                      >
                        <i class="mdi mdi-play-circle-outline"></i>
                      </a>

                      <!-- 2. Copy Candidate Exam Link -->
                      <button
                        v-if="['not_started', 'in_progress'].includes(item.status)"
                        class="btn-table-action btn-copy-link"
                        :title="copiedItemId === item.id ? 'Copied Link!' : 'Copy Candidate Exam Link'"
                        @click="copyExamLink(item)"
                      >
                        <i :class="['mdi', copiedItemId === item.id ? 'mdi-check text-emerald-600' : 'mdi-content-copy']"></i>
                      </button>

                      <!-- 3. Grant Technical Retry -->
                      <button
                        v-if="item.attempts_used < item.max_attempts && ['not_started', 'in_progress', 'failed'].includes(item.status)"
                        class="btn-table-action btn-edit"
                        title="Grant Technical Retry Sitting"
                        @click="grantTechnicalRetry(item)"
                      >
                        <i class="mdi mdi-restart"></i>
                      </button>

                      <!-- 4. Create Dedicated Retry Link (if failed) -->
                      <button
                        v-if="item.status === 'failed'"
                        class="btn-table-action btn-view"
                        title="Create Dedicated Retry Link"
                        @click="openRetryLinkModal(item)"
                      >
                        <i class="mdi mdi-link-plus"></i>
                      </button>

                      <!-- 5. Download Certificate -->
                      <a
                        v-if="item.status === 'passed' && item.certificate_url"
                        :href="item.certificate_url"
                        target="_blank"
                        class="btn-table-action btn-success"
                        title="Download Verified Certificate"
                      >
                        <i class="mdi mdi-certificate"></i>
                      </a>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <div v-if="filteredAssignments.length > pageSize" class="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-600">
            <div>
              Showing <strong>{{ (currentPage - 1) * pageSize + 1 }}</strong> - <strong>{{ Math.min(currentPage * pageSize, filteredAssignments.length) }}</strong> of <strong>{{ filteredAssignments.length }}</strong> candidates
            </div>

            <div class="flex items-center gap-2">
              <label class="text-xs text-slate-500">Per page:</label>
              <select v-model.number="pageSize" class="border border-slate-200 rounded px-2 py-1 bg-white text-xs">
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
                <option :value="500">All</option>
              </select>

              <div class="flex items-center gap-1 ml-3">
                <button
                  type="button"
                  class="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  :disabled="currentPage === 1"
                  @click="currentPage--"
                >
                  <i class="mdi mdi-chevron-left"></i>
                </button>
                <span class="px-2 font-medium">Page {{ currentPage }} of {{ totalPages }}</span>
                <button
                  type="button"
                  class="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  :disabled="currentPage === totalPages"
                  @click="currentPage++"
                >
                  <i class="mdi mdi-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ═══ RETRY LINK MODAL ═══ -->
      <Teleport to="body">
        <Transition name="fade">
          <div v-if="showRetryLinkModal" class="modal-overlay" @click.self="showRetryLinkModal = false">
            <div class="modal-card">
              <div class="modal-header">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center text-sm">
                    <i class="mdi mdi-link-plus"></i>
                  </div>
                  <div>
                    <h3 class="m-0 text-sm font-semibold text-slate-900 leading-tight">Create Dedicated Retry Link</h3>
                    <p class="m-0 text-xs text-slate-500 leading-tight">{{ targetAssignment?.student_name }}</p>
                  </div>
                </div>
                <button class="modal-close-btn" @click="showRetryLinkModal = false"><i class="mdi mdi-close"></i></button>
              </div>

              <div class="modal-body">
                <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs text-slate-600 leading-relaxed">
                  Issue a specialized single-sitting retry link for <strong>{{ targetAssignment?.student_name }}</strong>. 
                  This will consume <strong>1 Token</strong> from your center's token balance.
                </div>

                <div class="form-group mb-0">
                  <label class="form-label-xs">Link Expiration Date <span class="text-slate-400 font-normal">(Optional)</span></label>
                  <input
                    v-model="retryLinkExpiresAt"
                    type="datetime-local"
                    class="modal-input-field"
                  />
                  <span class="text-[11px] text-slate-400 mt-1 block">Leave blank for no expiration</span>
                </div>
              </div>

              <div class="modal-footer">
                <button class="btn-glass" @click="showRetryLinkModal = false">Cancel</button>
                <button class="btn-red" :disabled="creatingRetryLink" @click="submitDedicatedRetryLink">
                  <i :class="['mdi', creatingRetryLink ? 'mdi-loading spin-icon' : 'mdi-check-decagram']"></i>
                  <span>{{ creatingRetryLink ? 'Issuing Link...' : 'Confirm &amp; Deduct 1 Token' }}</span>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'sub_center_staff']
});

const route = useRoute();
const api = useApi();

const batchId = computed(() => String(route.params.id || ''));

// State
const loading = ref(true);
const error = ref('');

const batch = ref<any>(null);
const assignments = ref<any[]>([]);

// Search & Filter
const searchQuery = ref('');
const statusFilter = ref<'all' | 'passed' | 'failed' | 'in_progress' | 'not_started'>('all');
const currentPage = ref(1);
const pageSize = ref(50);

// Copy link feedback
const copiedItemId = ref<string | null>(null);
const copiedAllLinks = ref(false);

// Retry Link Modal
const showRetryLinkModal = ref(false);
const targetAssignment = ref<any>(null);
const retryLinkExpiresAt = ref('');
const creatingRetryLink = ref(false);

// Counts
const passedCount = computed(() => assignments.value.filter(a => a.status === 'passed').length);
const failedCount = computed(() => assignments.value.filter(a => a.status === 'failed').length);
const inProgressCount = computed(() => assignments.value.filter(a => a.status === 'in_progress').length);
const notStartedCount = computed(() => assignments.value.filter(a => a.status === 'not_started').length);
const pendingCount = computed(() => inProgressCount.value + notStartedCount.value);

// Filtered assignments
const filteredAssignments = computed(() => {
  let list = assignments.value || [];

  // Status Filter
  if (statusFilter.value !== 'all') {
    list = list.filter(a => a.status === statusFilter.value);
  }

  // Search filter
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter(a => {
      const name = (a.student_name || '').toLowerCase();
      const email = (a.student_email || '').toLowerCase();
      const id = (a.assignment_id || a.id || '').toLowerCase();
      return name.includes(q) || email.includes(q) || id.includes(q);
    });
  }

  return list;
});

const totalPages = computed(() => {
  return Math.ceil(filteredAssignments.value.length / pageSize.value) || 1;
});

const paginatedAssignments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredAssignments.value.slice(start, start + pageSize.value);
});

// Helpers
function formatStatus(st?: string) {
  if (!st) return 'UNKNOWN';
  return st.replace(/_/g, ' ');
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// Fetch Batch Details
async function fetchBatchDetails() {
  if (!batchId.value) {
    error.value = 'Invalid batch identifier.';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.get(`/sub-center/batches/${batchId.value}`);
    batch.value = data.batch;
    assignments.value = data.assignments || [];
  } catch (err: any) {
    error.value = err?.response?.data?.message || err?.message || 'Failed to load batch records.';
  } finally {
    loading.value = false;
  }
}

// Sitting links actions
function copyExamLink(item: any) {
  const id = item.assignment_id || item.id;
  const url = `${window.location.origin}/exam/take-${id}`;
  navigator.clipboard.writeText(url);
  copiedItemId.value = item.id;
  setTimeout(() => {
    if (copiedItemId.value === item.id) copiedItemId.value = null;
  }, 2500);
}

function copyAllExamLinks() {
  if (assignments.value.length === 0) return;
  const lines = [
    `GSFIN Exam Batch: ${batch.value?.exam_name || 'Certification Exam'}`,
    `Batch ID: ${batch.value?.id}`,
    '----------------------------------------',
    ...assignments.value.map(a => {
      const id = a.assignment_id || a.id;
      return `${a.student_name} (${a.student_email}): ${window.location.origin}/exam/take-${id}`;
    })
  ];

  navigator.clipboard.writeText(lines.join('\n'));
  copiedAllLinks.value = true;
  setTimeout(() => { copiedAllLinks.value = false; }, 3000);
}

function exportRosterCSV() {
  if (assignments.value.length === 0) return;
  const headers = ['Candidate Name', 'Candidate Email', 'Attempts Used', 'Max Attempts', 'Status', 'Exam Sitting Link', 'Certificate URL'];
  const rows = assignments.value.map(a => {
    const id = a.assignment_id || a.id;
    return [
      `"${a.student_name || ''}"`,
      `"${a.student_email || ''}"`,
      a.attempts_used || 0,
      a.max_attempts || 1,
      `"${a.status || ''}"`,
      `"${window.location.origin}/exam/take-${id}"`,
      `"${a.certificate_url || ''}"`
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `batch-${batch.value?.id || 'roster'}-candidates.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function grantTechnicalRetry(item: any) {
  if (!confirm(`Grant technical retry sitting for "${item.student_name}"?`)) return;
  try {
    await api.post(`/sub-center/assignments/${item.id}/grant-retry`);
    await fetchBatchDetails();
    alert('Technical retry granted successfully!');
  } catch (err: any) {
    alert(err?.response?.data?.message || err?.message || 'Failed to grant technical retry.');
  }
}

function openRetryLinkModal(item: any) {
  targetAssignment.value = item;
  retryLinkExpiresAt.value = '';
  showRetryLinkModal.value = true;
}

async function submitDedicatedRetryLink() {
  if (!targetAssignment.value) return;
  creatingRetryLink.value = true;
  try {
    await api.post(`/sub-center/assignments/${targetAssignment.value.id}/retry-link`, {
      expires_at: retryLinkExpiresAt.value || null
    });
    showRetryLinkModal.value = false;
    await fetchBatchDetails();
    alert('Dedicated retry link created and 1 token deducted from wallet.');
  } catch (err: any) {
    alert(err?.response?.data?.message || err?.message || 'Failed to create dedicated retry link.');
  } finally {
    creatingRetryLink.value = false;
  }
}

onMounted(async () => {
  await fetchBatchDetails();
});
</script>

<style scoped>
.gsfin-admin-page {
  background-color: #F8FAFC;
  min-height: 100vh;
  padding-bottom: 90px;
}

.admin-wrap {
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px 20px;
}

/* ── Top Nav ── */
.top-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 9px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  color: #334155;
  font-size: 0.825rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-back:hover {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
  color: #0f172a;
}

.breadcrumb-trail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.bc-link {
  color: #64748b;
  text-decoration: none;
  transition: color 0.15s;
}

.bc-link:hover {
  color: #dc2626;
}

.bc-sep {
  color: #cbd5e1;
}

.bc-current {
  color: #0f172a;
  font-weight: 600;
}

.btn-icon-refresh {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-icon-refresh:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* ── Hero Batch Card ── */
.hero-batch-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.03);
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* ── KPI Cards ── */
.kpi-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

.kpi-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.kpi-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  display: block;
}

.kpi-val {
  font-size: 1.15rem;
  font-weight: 600;
  font-family: inherit;
  line-height: 1.25;
  margin-top: 2px;
}

.kpi-sub {
  font-size: 0.72rem;
  display: block;
  margin-top: 2px;
}

/* ── Section Cards ── */
.panel-section-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
}

.section-card-header {
  padding: 18px 22px;
  background: #FAFAFD;
  border-bottom: 1px solid rgba(15, 23, 42, 0.07);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ── Search & Bulk Actions ── */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #94A3B8;
  font-size: 1rem;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 34px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 8px;
  font-size: 0.82rem;
  color: #0F172A;
  outline: none;
}

.search-input:focus {
  border-color: #E31B23;
}

.search-clear-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
}

.btn-roster-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 8px;
  font-size: 0.76rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-roster-action:hover:not(:disabled) {
  background: #F1F5F9;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.2);
}

.btn-roster-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Candidates Table ── */
.candidates-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.candidates-table th {
  padding: 12px 16px;
  background: #F8FAFC;
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.candidate-table-row {
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  transition: background-color 0.12s;
}

.candidate-table-row:hover {
  background-color: #F8FAFC;
}

.candidates-table td {
  padding: 12px 16px;
  vertical-align: middle;
}

.action-btn-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-table-action {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.15s;
  text-decoration: none;
}

.btn-take-exam {
  background: #EFF6FF;
  color: #2563EB;
  border-color: rgba(37, 99, 235, 0.2);
}
.btn-take-exam:hover {
  background: #2563EB;
  color: #FFFFFF;
}

.btn-copy-link {
  background: #F8FAFC;
  color: #475569;
  border-color: rgba(15, 23, 42, 0.12);
}
.btn-copy-link:hover {
  background: #F1F5F9;
  color: #0F172A;
}

.btn-edit {
  background: #F8FAFC;
  color: #64748B;
  border-color: rgba(15, 23, 42, 0.1);
}
.btn-edit:hover {
  background: #F1F5F9;
  color: #0F172A;
}

.btn-view {
  background: #F0FDF4;
  color: #16A34A;
  border-color: rgba(22, 163, 74, 0.2);
}
.btn-view:hover {
  background: #16A34A;
  color: #FFFFFF;
}

.btn-success {
  background: #ECFDF5;
  color: #059669;
  border-color: rgba(16, 185, 129, 0.2);
}
.btn-success:hover {
  background: #059669;
  color: #FFFFFF;
}

.btn-glass {
  background: #F1F5F9;
  color: #334155;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.84rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-glass:hover {
  background: #E2E8F0;
  color: #0F172A;
}

.btn-red {
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  padding: 8px 18px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.84rem;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 2px 6px rgba(227, 27, 35, 0.25);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-red:hover:not(:disabled) {
  background: #C41E3A;
}

.btn-red:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Modal Overlay ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-card {
  background: #FFFFFF;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
  overflow: hidden;
}

.modal-header {
  padding: 18px 22px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FAFAFD;
}

.modal-close-btn {
  background: #F1F5F9;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: #64748B;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  background: #E2E8F0;
  color: #0F172A;
}

.modal-body {
  padding: 22px;
}

.modal-footer {
  padding: 16px 22px;
  background: #FAFAFD;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label-xs {
  font-size: 0.78rem;
  font-weight: 600;
  color: #334155;
}

.modal-input-field {
  width: 100%;
  padding: 9px 12px;
  border-radius: 9px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #F8FAFC;
  font-size: 0.84rem;
  color: #0F172A;
  outline: none;
  box-sizing: border-box;
}

.modal-input-field:focus {
  border-color: #E31B23;
  background: #FFFFFF;
}

.spinner-sm-red {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(227, 27, 35, 0.2);
  border-top-color: #E31B23;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  display: inline-block;
}

.spin-icon {
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

