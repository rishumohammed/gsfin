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
      <div v-if="loading && !batch" class="loading-state-card">
        <span class="spinner-sm-red mb-2"></span>
        <p class="loading-text">Loading Examination Batch Roster &amp; Details...</p>
      </div>

      <!-- ═══ ERROR STATE ═══ -->
      <div v-else-if="error" class="error-state-card">
        <div class="error-icon-box">
          <i class="mdi mdi-alert-circle-outline"></i>
        </div>
        <h3 class="error-title">Unable to Load Batch</h3>
        <p class="error-desc">{{ error }}</p>
        <NuxtLink to="/sub-center?tab=batches" class="btn-red no-underline inline-block">
          Return to Batches
        </NuxtLink>
      </div>

      <!-- ═══ BATCH MAIN CONTENT ═══ -->
      <div v-else-if="batch" class="batch-content-stack">

        <!-- ─── 1. BATCH HERO BANNER ─── -->
        <div class="hero-batch-card">
          <div class="hero-left">
            <div class="batch-hero-avatar">
              <i class="mdi mdi-certificate-outline"></i>
            </div>
            <div class="batch-hero-details">
              <div class="batch-title-row">
                <span
                  :class="[
                    'badge-chip',
                    batch.status === 'open' ? 'chip-green' :
                    batch.status === 'closed' ? 'chip-slate' :
                    batch.status === 'cancelled' ? 'chip-red' :
                    'chip-amber'
                  ]"
                >
                  <span class="status-dot"></span>
                  {{ batch.status }}
                </span>
                <h1 class="batch-heading">{{ batch.exam_name }}</h1>
              </div>

              <div class="batch-meta-chips-row">
                <span class="meta-chip">
                  <span class="meta-label">Batch ID:</span>
                  <code class="meta-code">{{ batch.id }}</code>
                  <button type="button" class="btn-copy-chip" @click="copyBatchId" title="Copy Batch ID">
                    <i :class="['mdi', copiedBatchId ? 'mdi-check text-green' : 'mdi-content-copy']"></i>
                  </button>
                </span>
                <span v-if="batch.created_at" class="meta-chip">
                  <i class="mdi mdi-calendar-range"></i>
                  <span>Created: {{ formatDate(batch.created_at) }}</span>
                </span>
                <span class="meta-chip">
                  <i class="mdi mdi-clock-outline"></i>
                  <span>Duration: {{ batch.duration_minutes || 60 }} mins</span>
                </span>
                <span v-if="batch.opens_at" class="meta-chip">
                  <i class="mdi mdi-calendar-start"></i>
                  <span>Opens: {{ formatDate(batch.opens_at) }}</span>
                </span>
                <span v-if="batch.closes_at" class="meta-chip">
                  <i class="mdi mdi-calendar-end"></i>
                  <span>Closes: {{ formatDate(batch.closes_at) }}</span>
                </span>
              </div>
            </div>
          </div>

          <div class="hero-right">
            <NuxtLink to="/sub-center/batches/create" class="btn-new-batch">
              <i class="mdi mdi-plus-circle-outline"></i>
              <span>Create New Batch</span>
            </NuxtLink>
          </div>
        </div>

        <!-- ─── 2. BATCH KPI SUMMARY CARDS ─── -->
        <div class="batch-kpi-grid">
          <!-- Total Enrolled -->
          <div class="kpi-card kpi-card-blue">
            <div class="kpi-icon-box bg-blue-light text-blue">
              <i class="mdi mdi-account-group-outline"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Total Enrolled</span>
              <div class="kpi-val text-blue">{{ assignments.length }} Students</div>
              <span class="kpi-sub">Total batch roster</span>
            </div>
          </div>

          <!-- Passed Students -->
          <div class="kpi-card kpi-card-emerald">
            <div class="kpi-icon-box bg-emerald-light text-emerald">
              <i class="mdi mdi-check-decagram-outline"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Passed &amp; Certified</span>
              <div class="kpi-val text-emerald">{{ passedCount }} Students</div>
              <span class="kpi-sub">
                {{ assignments.length ? Math.round((passedCount / assignments.length) * 100) : 0 }}% pass rate
              </span>
            </div>
          </div>

          <!-- Failed Students -->
          <div class="kpi-card kpi-card-red">
            <div class="kpi-icon-box bg-red-light text-red">
              <i class="mdi mdi-close-circle-outline"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Failed / Need Retake</span>
              <div class="kpi-val text-red">{{ failedCount }} Students</div>
              <span class="kpi-sub">Eligible for retry</span>
            </div>
          </div>

          <!-- Pending / Not Started -->
          <div class="kpi-card kpi-card-slate">
            <div class="kpi-icon-box bg-slate-light text-slate">
              <i class="mdi mdi-timer-sand"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Pending / In Progress</span>
              <div class="kpi-val text-slate">{{ pendingCount }} Students</div>
              <span class="kpi-sub">Awaiting exam sitting</span>
            </div>
          </div>
        </div>

        <!-- ─── 3. STUDENT ASSIGNMENTS ROSTER ─── -->
        <div class="panel-section-card">
          <div class="section-card-header">
            <div>
              <h3 class="roster-heading">Enrolled Students</h3>
              <p class="roster-subheading">
                Manage candidate exam links, monitor sitting status, grant retries, and access issued certificates.
              </p>
            </div>

            <!-- Header Action Tools -->
            <div class="roster-header-actions">
              <button
                type="button"
                class="btn-roster-action"
                @click="copyAllExamLinks"
                :disabled="assignments.length === 0"
                title="Copy all candidate names and individual exam sitting links to clipboard"
              >
                <i :class="['mdi', copiedAllLinks ? 'mdi-check text-green' : 'mdi-content-copy']"></i>
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
          <div class="roster-toolbar">
            <!-- Search Input -->
            <div class="search-box">
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
            <div class="filter-segmented-bar">
              <button
                type="button"
                :class="['filter-tab-pill', { active: statusFilter === 'all' }]"
                @click="statusFilter = 'all'"
              >
                All ({{ assignments.length }})
              </button>
              <button
                type="button"
                :class="['filter-tab-pill', { active: statusFilter === 'passed' }]"
                @click="statusFilter = 'passed'"
              >
                Passed ({{ passedCount }})
              </button>
              <button
                type="button"
                :class="['filter-tab-pill', { active: statusFilter === 'failed' }]"
                @click="statusFilter = 'failed'"
              >
                Failed ({{ failedCount }})
              </button>
              <button
                type="button"
                :class="['filter-tab-pill', { active: statusFilter === 'in_progress' }]"
                @click="statusFilter = 'in_progress'"
              >
                In Progress ({{ inProgressCount }})
              </button>
              <button
                type="button"
                :class="['filter-tab-pill', { active: statusFilter === 'not_started' }]"
                @click="statusFilter = 'not_started'"
              >
                Not Started ({{ notStartedCount }})
              </button>
            </div>
          </div>

          <!-- ═══ ASSIGNMENTS TABLE ═══ -->
          <div class="table-scroll-wrap">
            <div v-if="filteredAssignments.length === 0" class="empty-roster-state">
              <i class="mdi mdi-account-search-outline empty-icon"></i>
              <p class="empty-title">No Students Found</p>
              <p class="empty-desc">No candidates match your current search or status filter.</p>
            </div>

            <table v-else class="gsfin-table">
              <thead>
                <tr>
                  <th class="th-index">#</th>
                  <th>Student Candidate</th>
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
                  <td class="td-index font-mono">
                    {{ (currentPage - 1) * pageSize + idx + 1 }}
                  </td>

                  <!-- Student Name -->
                  <td>
                    <div class="student-cell">
                      <div class="student-avatar-circle">
                        {{ item.student_name ? item.student_name.charAt(0).toUpperCase() : 'S' }}
                      </div>
                      <div class="student-info-col">
                        <div class="student-name">{{ item.student_name }}</div>
                        <span class="student-assign-id font-mono">
                          Assign ID: {{ (item.assignment_id || item.id).slice(0, 8) }}
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- Student Email -->
                  <td>
                    <span class="student-email-text font-mono">{{ item.student_email }}</span>
                  </td>

                  <!-- Attempts -->
                  <td>
                    <span
                      :class="[
                        'badge-chip font-mono',
                        item.attempts_used >= item.max_attempts ? 'chip-red' : 'chip-slate'
                      ]"
                    >
                      {{ item.attempts_used }} / {{ item.max_attempts }} Sittings
                    </span>
                  </td>

                  <!-- Status -->
                  <td>
                    <div class="status-cell-wrap">
                      <span
                        :class="[
                          'badge-chip',
                          item.status === 'passed' ? 'chip-green' :
                          item.status === 'failed' ? 'chip-red' :
                          item.status === 'in_progress' ? 'chip-blue' :
                          'chip-slate'
                        ]"
                      >
                        <span class="status-dot"></span>
                        {{ formatStatus(item.status) }}
                      </span>
                      <span v-if="item.is_retry_link" class="badge-chip chip-amber">
                        Dedicated Link
                      </span>
                    </div>
                  </td>

                  <!-- Actions -->
                  <td class="text-right">
                    <div class="action-btn-group">
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
                        <i :class="['mdi', copiedItemId === item.id ? 'mdi-check text-green' : 'mdi-content-copy']"></i>
                      </button>

                      <!-- 3. Grant Technical Retry -->
                      <button
                        v-if="item.attempts_used < item.max_attempts && ['not_started', 'in_progress', 'failed'].includes(item.status)"
                        class="btn-table-action btn-retry"
                        title="Grant Technical Retry Sitting"
                        @click="grantTechnicalRetry(item)"
                      >
                        <i class="mdi mdi-restart"></i>
                      </button>

                      <!-- 4. Create Dedicated Retry Link (if failed) -->
                      <button
                        v-if="item.status === 'failed'"
                        class="btn-table-action btn-dedicated-link"
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
                        class="btn-table-action btn-cert"
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
          <div v-if="filteredAssignments.length > pageSize" class="pagination-footer">
            <div class="pagination-info">
              Showing <strong>{{ (currentPage - 1) * pageSize + 1 }}</strong> - <strong>{{ Math.min(currentPage * pageSize, filteredAssignments.length) }}</strong> of <strong>{{ filteredAssignments.length }}</strong> candidates
            </div>

            <div class="pagination-controls">
              <label class="per-page-label">Per page:</label>
              <select v-model.number="pageSize" class="per-page-select">
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
                <option :value="500">All</option>
              </select>

              <div class="page-nav-btns">
                <button
                  type="button"
                  class="btn-page-nav"
                  :disabled="currentPage === 1"
                  @click="currentPage--"
                >
                  <i class="mdi mdi-chevron-left"></i>
                </button>
                <span class="page-count-text">Page {{ currentPage }} of {{ totalPages }}</span>
                <button
                  type="button"
                  class="btn-page-nav"
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
                <div class="modal-header-left">
                  <div class="modal-icon-box bg-amber-light text-amber">
                    <i class="mdi mdi-link-plus"></i>
                  </div>
                  <div>
                    <h3 class="modal-title">Create Dedicated Retry Link</h3>
                    <p class="modal-subtitle">{{ targetAssignment?.student_name }}</p>
                  </div>
                </div>
                <button class="modal-close-btn" @click="showRetryLinkModal = false">
                  <i class="mdi mdi-close"></i>
                </button>
              </div>

              <div class="modal-body">
                <div class="info-callout mb-4">
                  Issue a specialized single-sitting retry link for <strong>{{ targetAssignment?.student_name }}</strong>. 
                  This will consume <strong>1 Token</strong> from your center's token balance.
                </div>

                <div class="form-group mb-0">
                  <label class="form-label-xs">
                    Link Expiration Date <span class="optional-tag">(Optional)</span>
                  </label>
                  <input
                    v-model="retryLinkExpiresAt"
                    type="datetime-local"
                    class="modal-input-field"
                  />
                  <span class="form-help-text">Leave blank for no expiration</span>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn-glass" @click="showRetryLinkModal = false">Cancel</button>
                <button type="button" class="btn-red" :disabled="creatingRetryLink" @click="submitDedicatedRetryLink">
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
const copiedBatchId = ref(false);

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

function copyBatchId() {
  if (!batch.value?.id) return;
  navigator.clipboard.writeText(batch.value.id);
  copiedBatchId.value = true;
  setTimeout(() => { copiedBatchId.value = false; }, 2000);
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
  gap: 16px;
  flex-wrap: wrap;
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
  padding: 8px 14px;
  border-radius: 10px;
  background-color: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  color: #334155;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}
.btn-back:hover {
  background-color: #F1F5F9;
  border-color: rgba(15, 23, 42, 0.2);
  color: #0F172A;
}

.breadcrumb-trail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #64748B;
  font-weight: 500;
}
.bc-link {
  color: #64748B;
  text-decoration: none;
  transition: color 0.15s;
}
.bc-link:hover {
  color: #E31B23;
}
.bc-sep {
  color: #CBD5E1;
}
.bc-current {
  color: #0F172A;
  font-weight: 600;
}

.btn-icon-refresh {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-icon-refresh:hover {
  background: #F1F5F9;
  color: #0F172A;
}

.batch-content-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── Hero Batch Card ── */
.hero-batch-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 22px 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.batch-hero-avatar {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: rgba(227, 27, 35, 0.08);
  border: 1px solid rgba(227, 27, 35, 0.2);
  color: #E31B23;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  flex-shrink: 0;
}

.batch-hero-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.batch-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.batch-heading {
  font-size: 1.3rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  letter-spacing: -0.01em;
}

.batch-meta-chips-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.74rem;
  color: #64748B;
  font-weight: 500;
}

.meta-label {
  color: #94A3B8;
  font-weight: 600;
}

.meta-code {
  font-family: monospace;
  color: #0F172A;
  font-weight: 600;
  background: #FFFFFF;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.btn-copy-chip {
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  transition: color 0.15s;
}
.btn-copy-chip:hover {
  color: #E31B23;
}

.hero-right {
  display: flex;
  align-items: center;
}

.btn-new-batch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border-radius: 10px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.14);
  color: #0F172A;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.18s ease;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}
.btn-new-batch:hover {
  background: #FEF2F2;
  border-color: rgba(227, 27, 35, 0.3);
  color: #E31B23;
}

/* ── KPI Ribbon Grid ── */
.batch-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 1024px) {
  .batch-kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .batch-kpi-grid {
    grid-template-columns: 1fr;
  }
}

.kpi-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
  transition: transform 0.15s ease;
}
.kpi-card:hover {
  transform: translateY(-1px);
}

.kpi-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.bg-blue-light { background: rgba(37, 99, 235, 0.08); }
.text-blue { color: #2563EB; }
.bg-emerald-light { background: rgba(16, 185, 129, 0.08); }
.text-emerald { color: #059669; }
.bg-red-light { background: rgba(227, 27, 35, 0.08); }
.text-red { color: #E31B23; }
.bg-slate-light { background: rgba(100, 116, 139, 0.08); }
.text-slate { color: #475569; }
.bg-amber-light { background: rgba(245, 158, 11, 0.08); }
.text-amber { color: #D97706; }
.text-green { color: #059669; }

.kpi-info {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.kpi-val {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.3;
  margin-top: 2px;
}

.kpi-sub {
  font-size: 0.72rem;
  color: #94A3B8;
  margin-top: 2px;
}

/* ── Panel Section Card ── */
.panel-section-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
}

.section-card-header {
  padding: 20px 24px;
  background: #FAFAFD;
  border-bottom: 1px solid rgba(15, 23, 42, 0.07);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.roster-heading {
  font-size: 1rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
}

.roster-subheading {
  font-size: 0.76rem;
  color: #64748B;
  margin: 4px 0 0 0;
}

.roster-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-roster-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 9px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}
.btn-roster-action:hover:not(:disabled) {
  background: #F1F5F9;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.22);
}
.btn-roster-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Toolbar ── */
.roster-toolbar {
  padding: 14px 24px;
  background: #F8FAFC;
  border-bottom: 1px solid rgba(15, 23, 42, 0.07);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 360px;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #94A3B8;
  font-size: 1.05rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 34px 8px 36px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 9px;
  font-size: 0.82rem;
  color: #0F172A;
  outline: none;
  transition: all 0.15s ease;
}
.search-input:focus {
  border-color: #E31B23;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.08);
}

.search-clear-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  font-size: 0.95rem;
}
.search-clear-btn:hover {
  color: #0F172A;
}

/* Segmented Control Bar */
.filter-segmented-bar {
  display: inline-flex;
  align-items: center;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
  flex-wrap: wrap;
}

.filter-tab-pill {
  border: none;
  background: transparent;
  padding: 5px 12px;
  border-radius: 7px;
  font-size: 0.74rem;
  font-weight: 600;
  color: #64748B;
  cursor: pointer;
  transition: all 0.15s ease;
}
.filter-tab-pill:hover {
  color: #0F172A;
  background: #F1F5F9;
}
.filter-tab-pill.active {
  background: #0F172A;
  color: #FFFFFF;
}

/* ── Table Styling ── */
.table-scroll-wrap {
  overflow-x: auto;
}

.gsfin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.gsfin-table th {
  padding: 13px 20px;
  background: #F8FAFC;
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}
.th-index {
  width: 44px;
}

.candidate-table-row {
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  transition: background-color 0.12s ease;
}
.candidate-table-row:hover {
  background-color: #F8FAFC;
}

.gsfin-table td {
  padding: 14px 20px;
  vertical-align: middle;
}

.td-index {
  font-size: 0.76rem;
  color: #94A3B8;
}

/* Student Cell */
.student-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #F1F5F9;
  border: 1px solid rgba(15, 23, 42, 0.1);
  color: #334155;
  font-weight: 600;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.student-info-col {
  display: flex;
  flex-direction: column;
}

.student-name {
  font-size: 0.84rem;
  font-weight: 600;
  color: #0F172A;
}

.student-assign-id {
  font-size: 0.7rem;
  color: #94A3B8;
  margin-top: 1px;
}

.student-email-text {
  font-size: 0.8rem;
  color: #475569;
}

.status-cell-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

/* Badges */
.badge-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 50px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.chip-green { background: rgba(16, 185, 129, 0.1); color: #059669; }
.chip-slate { background: rgba(100, 116, 139, 0.1); color: #64748B; }
.chip-red { background: rgba(227, 27, 35, 0.1); color: #E31B23; }
.chip-amber { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.chip-blue { background: rgba(37, 99, 235, 0.1); color: #2563EB; }

/* Action Buttons */
.action-btn-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
}

.btn-table-action {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.15s ease;
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

.btn-retry {
  background: #F8FAFC;
  color: #64748B;
  border-color: rgba(15, 23, 42, 0.1);
}
.btn-retry:hover {
  background: #F1F5F9;
  color: #0F172A;
}

.btn-dedicated-link {
  background: #FEF3C7;
  color: #B45309;
  border-color: rgba(245, 158, 11, 0.25);
}
.btn-dedicated-link:hover {
  background: #F59E0B;
  color: #FFFFFF;
}

.btn-cert {
  background: #ECFDF5;
  color: #059669;
  border-color: rgba(16, 185, 129, 0.2);
}
.btn-cert:hover {
  background: #059669;
  color: #FFFFFF;
}

/* ── Pagination ── */
.pagination-footer {
  padding: 14px 24px;
  background: #FAFAFD;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.pagination-info {
  font-size: 0.78rem;
  color: #64748B;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.per-page-label {
  font-size: 0.75rem;
  color: #64748B;
}

.per-page-select {
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 7px;
  padding: 4px 8px;
  background: #FFFFFF;
  font-size: 0.76rem;
  color: #0F172A;
  outline: none;
}

.page-nav-btns {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-page-nav {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-page-nav:hover:not(:disabled) {
  background: #F1F5F9;
  color: #0F172A;
}
.btn-page-nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-count-text {
  font-size: 0.76rem;
  font-weight: 600;
  color: #475569;
  padding: 0 4px;
}

/* ── Empty & Error States ── */
.loading-state-card {
  text-align: center;
  padding: 64px 24px;
}
.loading-text {
  font-size: 0.88rem;
  color: #64748B;
  font-weight: 500;
  margin-top: 8px;
}

.error-state-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 18px;
  padding: 40px 24px;
  text-align: center;
  max-width: 480px;
  margin: 40px auto;
}
.error-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #FEF2F2;
  color: #E31B23;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  margin: 0 auto 12px auto;
}
.error-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0 0 6px 0;
}
.error-desc {
  font-size: 0.82rem;
  color: #64748B;
  margin: 0 0 20px 0;
}

.empty-roster-state {
  text-align: center;
  padding: 56px 24px;
}
.empty-icon {
  font-size: 2.8rem;
  color: #CBD5E1;
  display: block;
  margin-bottom: 6px;
}
.empty-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
}
.empty-desc {
  font-size: 0.78rem;
  color: #64748B;
  margin: 4px 0 0 0;
}

/* ── Buttons ── */
.btn-red {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.84rem;
  box-shadow: 0 3px 12px rgba(227, 27, 35, 0.25);
  transition: all 0.18s ease;
  cursor: pointer;
}
.btn-red:hover:not(:disabled) {
  background: #C4131B;
  transform: translateY(-1px);
}
.btn-red:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-glass {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #FFFFFF;
  color: #334155;
  border: 1px solid rgba(15, 23, 42, 0.14);
  padding: 9px 18px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-glass:hover {
  background: #F1F5F9;
  color: #0F172A;
}

/* ── Modal ── */
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
  border-radius: 18px;
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

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #0F172A;
}

.modal-subtitle {
  margin: 2px 0 0 0;
  font-size: 0.74rem;
  color: #64748B;
}

.modal-close-btn {
  background: #F1F5F9;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: #64748B;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: all 0.15s ease;
}
.modal-close-btn:hover {
  background: #E2E8F0;
  color: #0F172A;
}

.modal-body {
  padding: 22px;
}

.info-callout {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 0.78rem;
  color: #475569;
  line-height: 1.5;
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
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.optional-tag {
  color: #94A3B8;
  font-weight: normal;
  text-transform: none;
}

.modal-input-field {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  background: #F8FAFC;
  font-size: 0.84rem;
  color: #0F172A;
  outline: none;
  box-sizing: border-box;
  transition: all 0.15s ease;
}
.modal-input-field:focus {
  border-color: #E31B23;
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.08);
}

.form-help-text {
  font-size: 0.72rem;
  color: #94A3B8;
  margin-top: 3px;
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

.spinner-sm-red {
  width: 22px;
  height: 22px;
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

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
