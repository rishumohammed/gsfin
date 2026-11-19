<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ TOP BREADCRUMB & BACK NAVIGATION ═══ -->
      <div class="top-nav-bar">
        <div class="nav-left">
          <NuxtLink to="/dashboard/admin/certificates" class="btn-back">
            <i class="mdi mdi-arrow-left"></i>
            <span>Back to Certificates</span>
          </NuxtLink>
          <div class="breadcrumb-trail">
            <NuxtLink to="/dashboard/admin/certificates" class="bc-link">Partner Certificates</NuxtLink>
            <i class="mdi mdi-chevron-right bc-sep"></i>
            <span class="bc-link text-slate-600">{{ batch?.org_name || 'Partner Center' }}</span>
            <i class="mdi mdi-chevron-right bc-sep"></i>
            <span class="bc-current">{{ batch?.exam_name || 'Conducted Exam' }}</span>
          </div>
        </div>

        <div class="nav-right">
          <button class="btn-icon-refresh" title="Refresh Batch Data" @click="fetchBatchData" :disabled="loading">
            <i :class="['mdi', 'mdi-refresh', { 'spin-icon': loading }]"></i>
          </button>
        </div>
      </div>

      <!-- ═══ LOADING STATE ═══ -->
      <div v-if="loading && !batch" class="loading-state-box">
        <span class="spinner-sm-red"></span>
        <p class="loading-text">Loading Exam Batch Candidate Roster &amp; Certificates...</p>
      </div>

      <!-- ═══ ERROR STATE ═══ -->
      <div v-else-if="error" class="error-state-card">
        <div class="error-icon-box">
          <i class="mdi mdi-alert-circle-outline"></i>
        </div>
        <h3 class="error-title">Unable to Load Batch Records</h3>
        <p class="error-desc">{{ error }}</p>
        <NuxtLink to="/dashboard/admin/certificates" class="btn-return">
          Return to Certificates
        </NuxtLink>
      </div>

      <!-- ═══ BATCH MAIN CONTENT ═══ -->
      <div v-else-if="batch" class="batch-content-stack">

        <!-- ─── 1. BATCH HERO BANNER ─── -->
        <div class="hero-batch-card">
          <div class="hero-left">
            <div class="hero-icon-box">
              <i class="mdi mdi-file-certificate-outline"></i>
            </div>
            <div class="hero-body">
              <div class="hero-title-row">
                <span
                  :class="[
                    'status-pill',
                    batch.batch_status === 'open' ? 'pill-open' :
                    batch.batch_status === 'closed' ? 'pill-closed' : 'pill-amber'
                  ]"
                >
                  {{ batch.batch_status || 'CONDUCTED' }}
                </span>
                <h1 class="batch-title">{{ batch.exam_name }}</h1>
              </div>

              <div class="hero-meta-row">
                <span class="meta-item">
                  <i class="mdi mdi-office-building"></i>
                  <strong>{{ batch.org_name }}</strong>
                  <span class="meta-sub">({{ batch.city }}, {{ batch.country }})</span>
                </span>
                <span class="meta-item font-mono">
                  <span class="meta-label">Batch ID:</span>
                  <code class="batch-code-badge">{{ batch.batch_id }}</code>
                  <button
                    type="button"
                    class="btn-copy-inline"
                    :title="copiedBatchId ? 'Copied!' : 'Copy Batch ID'"
                    @click="copyBatchId"
                  >
                    <i :class="['mdi', copiedBatchId ? 'mdi-check text-emerald' : 'mdi-content-copy']"></i>
                  </button>
                </span>
                <span v-if="batch.created_at" class="meta-item">
                  <i class="mdi mdi-calendar-blank"></i>
                  <span>Conducted: {{ formatDate(batch.created_at) }}</span>
                </span>
                <span class="meta-item">
                  <i class="mdi mdi-clock-outline"></i>
                  <span>Duration: {{ batch.duration_minutes || 60 }} mins</span>
                </span>
              </div>
            </div>
          </div>

          <div class="hero-right">
            <button
              type="button"
              class="btn-export"
              @click="exportCSV"
              :disabled="students.length === 0"
              title="Export candidate roster to CSV"
            >
              <i class="mdi mdi-file-delimited-outline"></i>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <!-- ─── 2. BATCH KPI SUMMARY CARDS (4-COLUMN GRID) ─── -->
        <div class="metrics-grid">
          <!-- Total Candidates -->
          <div class="metric-card">
            <div class="metric-icon-box bg-indigo-light text-indigo">
              <i class="mdi mdi-account-group"></i>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ stats.total_candidates || students.length }}</span>
              <span class="metric-label">Total Candidates</span>
              <span class="metric-sub text-indigo">Batch Attendance</span>
            </div>
          </div>

          <!-- Certified Students -->
          <div class="metric-card">
            <div class="metric-icon-box bg-emerald-light text-emerald">
              <i class="mdi mdi-certificate"></i>
            </div>
            <div class="metric-info">
              <span class="metric-value text-emerald">{{ stats.certified_count || certifiedStudentsCount }}</span>
              <span class="metric-label">Certified Holders</span>
              <span class="metric-sub text-emerald">Issued Credentials</span>
            </div>
          </div>

          <!-- Passed Candidates -->
          <div class="metric-card">
            <div class="metric-icon-box bg-emerald-light text-emerald">
              <i class="mdi mdi-check-decagram"></i>
            </div>
            <div class="metric-info">
              <span class="metric-value text-emerald">{{ stats.passed_count || passedStudentsCount }}</span>
              <span class="metric-label">Passed Sitting</span>
              <span class="metric-sub text-emerald">Qualified Candidates</span>
            </div>
          </div>

          <!-- Failed Candidates -->
          <div class="metric-card">
            <div class="metric-icon-box bg-red-light text-red">
              <i class="mdi mdi-close-circle-outline"></i>
            </div>
            <div class="metric-info">
              <span class="metric-value text-red">{{ stats.failed_count || failedStudentsCount }}</span>
              <span class="metric-label">Failed / Retake Required</span>
              <span class="metric-sub text-red">Below Passing Score</span>
            </div>
          </div>
        </div>

        <!-- ─── 3. CANDIDATE CERTIFICATES ROSTER ─── -->
        <div class="panel-section-card">
          <div class="section-card-header">
            <div>
              <h3 class="section-title">Candidate Roster &amp; Issued Certificates</h3>
              <p class="section-subtitle">
                Full examination sitting logs, candidate scores, issued credential numbers, and PDF certificates.
              </p>
            </div>

            <!-- Action Tools -->
            <div class="section-actions">
              <button
                type="button"
                class="btn-roster-action"
                @click="copyAllCerts"
                :disabled="certifiedStudentsCount === 0"
                title="Copy all certificate numbers"
              >
                <i :class="['mdi', copiedAllCerts ? 'mdi-check text-emerald' : 'mdi-content-copy']"></i>
                <span>{{ copiedAllCerts ? 'All Numbers Copied!' : 'Copy Certificate Numbers' }}</span>
              </button>
            </div>
          </div>

          <!-- Filter & Search Controls Bar -->
          <div class="panel-filter-bar">
            <!-- Search Input -->
            <div class="search-box">
              <i class="mdi mdi-magnify search-icon"></i>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search candidates by name, email, or certificate serial ID..."
                class="search-input"
              />
              <button v-if="searchQuery" type="button" class="search-clear-btn" @click="searchQuery = ''">
                <i class="mdi mdi-close-circle"></i>
              </button>
            </div>

            <!-- Status Filter Segmented Control Tabs -->
            <div class="filter-tabs">
              <button
                type="button"
                :class="['filter-tab-btn', { active: statusFilter === 'all' }]"
                @click="statusFilter = 'all'"
              >
                <span>All</span>
                <span class="tab-count-pill">{{ students.length }}</span>
              </button>
              <button
                type="button"
                :class="['filter-tab-btn tab-emerald', { active: statusFilter === 'certified' }]"
                @click="statusFilter = 'certified'"
              >
                <span>Certified</span>
                <span class="tab-count-pill">{{ certifiedStudentsCount }}</span>
              </button>
              <button
                type="button"
                :class="['filter-tab-btn tab-emerald', { active: statusFilter === 'passed' }]"
                @click="statusFilter = 'passed'"
              >
                <span>Passed</span>
                <span class="tab-count-pill">{{ passedStudentsCount }}</span>
              </button>
              <button
                type="button"
                :class="['filter-tab-btn tab-red', { active: statusFilter === 'failed' }]"
                @click="statusFilter = 'failed'"
              >
                <span>Failed</span>
                <span class="tab-count-pill">{{ failedStudentsCount }}</span>
              </button>
              <button
                type="button"
                :class="['filter-tab-btn tab-indigo', { active: statusFilter === 'in_progress' }]"
                @click="statusFilter = 'in_progress'"
              >
                <span>In Progress</span>
                <span class="tab-count-pill">{{ inProgressCount }}</span>
              </button>
            </div>
          </div>

          <!-- ═══ CANDIDATES TABLE ═══ -->
          <div class="table-container">
            <div v-if="filteredStudents.length === 0" class="empty-roster-box">
              <i class="mdi mdi-account-search-outline empty-icon"></i>
              <p class="empty-title">No Candidates Found</p>
              <p class="empty-desc">No candidate matches your search query or selected status filter.</p>
            </div>

            <table v-else class="roster-table">
              <thead>
                <tr>
                  <th>Candidate / Student</th>
                  <th>Attendance / Exam Status</th>
                  <th>Certificate Serial ID</th>
                  <th>Issued Date</th>
                  <th>Cert Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="std in paginatedStudents" :key="std.assignment_id || std.cert_number">
                  <!-- Student Info -->
                  <td>
                    <div class="candidate-cell">
                      <img
                        v-if="std.face_photo"
                        :src="std.face_photo"
                        class="candidate-photo"
                        alt="Candidate Photo"
                      />
                      <div v-else class="candidate-avatar">
                        {{ getInitials(std.student_name) }}
                      </div>
                      <div class="candidate-meta">
                        <div class="candidate-name">{{ std.student_name || 'Candidate' }}</div>
                        <div class="candidate-email">{{ std.student_email }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Exam Status -->
                  <td>
                    <div class="exam-status-cell">
                      <span :class="['chip-pill', getExamStatusClass(std.exam_status)]">
                        {{ formatExamStatus(std.exam_status) }}
                      </span>
                      <span v-if="std.attempts_used" class="attempts-sub">
                        (Attempt {{ std.attempts_used }})
                      </span>
                    </div>
                  </td>

                  <!-- Certificate Serial ID -->
                  <td>
                    <div v-if="std.cert_number" class="cert-serial-cell">
                      <i class="mdi mdi-file-certificate text-red"></i>
                      <span class="cert-serial-text">{{ std.cert_number }}</span>
                      <button
                        class="btn-copy-id"
                        :title="copySuccessId === std.cert_number ? 'Copied!' : 'Copy Certificate Number'"
                        @click.stop="copyToClipboard(std.cert_number)"
                      >
                        <i :class="['mdi', copySuccessId === std.cert_number ? 'mdi-check text-emerald' : 'mdi-content-copy']"></i>
                      </button>
                    </div>
                    <div v-else class="no-cert-label">
                      No Certificate Issued
                    </div>
                  </td>

                  <!-- Issued Date -->
                  <td class="date-cell">
                    {{ std.issued_at ? formatDate(std.issued_at) : '—' }}
                  </td>

                  <!-- Cert Status -->
                  <td>
                    <span
                      v-if="std.cert_number"
                      :class="[
                        'chip-pill',
                        std.cert_status === 'active' ? 'chip-green' :
                        std.cert_status === 'revoked' ? 'chip-red' :
                        'chip-muted'
                      ]"
                    >
                      {{ (std.cert_status || 'active').toUpperCase() }}
                    </span>
                    <span v-else class="chip-pill chip-muted">
                      PENDING
                    </span>
                  </td>

                  <!-- Actions -->
                  <td class="text-right">
                    <div class="action-btn-group">
                      <!-- Download PDF Certificate -->
                      <button
                        v-if="std.cert_number"
                        class="btn-table-action btn-success"
                        title="Download Certificate PDF"
                        @click="downloadCert(std.cert_number)"
                      >
                        <i class="mdi mdi-download"></i>
                      </button>

                      <!-- Revoke Certificate Modal -->
                      <button
                        v-if="std.cert_number && std.cert_status === 'active' && canManage"
                        class="btn-table-action btn-danger"
                        title="Revoke Certificate"
                        @click="openRevokeModal(std)"
                      >
                        <i class="mdi mdi-close-octagon-outline"></i>
                      </button>

                      <!-- Reissue Certificate Modal -->
                      <button
                        v-if="std.cert_number && std.cert_status === 'revoked' && canManage"
                        class="btn-table-action btn-warn"
                        title="Re-issue Certificate"
                        @click="openReissueModal(std)"
                      >
                        <i class="mdi mdi-refresh"></i>
                      </button>

                      <!-- If no certificate -->
                      <span v-if="!std.cert_number" class="action-dash">—</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <div class="pagination-footer">
            <AppPagination
              v-if="filteredStudents.length > 0"
              v-model="page"
              v-model:items-per-page="perPage"
              :total-items="filteredStudents.length"
              :per-page-options="[10, 25, 50, 100]"
            />
          </div>
        </div>

      </div>

    </div>

    <!-- ═══ REVOKE CONFIRMATION MODAL ═══ -->
    <v-dialog v-model="showRevokeModal" max-width="440" persistent>
      <div class="dialog-box">
        <div class="dialog-icon-box bg-red-light text-red">
          <i class="mdi mdi-alert-octagon-outline"></i>
        </div>
        <h3 class="dialog-title">Revoke Certificate Credential?</h3>
        <p class="dialog-desc">
          Are you sure you want to revoke certificate <strong class="font-mono text-slate-800">{{ targetStudent?.cert_number }}</strong> for candidate <strong>{{ targetStudent?.student_name }}</strong>? The certificate will immediately show as revoked upon public verification.
        </p>
        <div class="dialog-actions">
          <button type="button" class="btn-dialog-cancel" @click="showRevokeModal = false">Cancel</button>
          <button type="button" class="btn-dialog-danger" :disabled="submittingAction" @click="confirmRevoke">
            <i v-if="submittingAction" class="mdi mdi-loading spin-icon mr-1"></i>
            {{ submittingAction ? 'Revoking...' : 'Confirm Revocation' }}
          </button>
        </div>
      </div>
    </v-dialog>

    <!-- ═══ REISSUE CONFIRMATION MODAL ═══ -->
    <v-dialog v-model="showReissueModal" max-width="440" persistent>
      <div class="dialog-box">
        <div class="dialog-icon-box bg-emerald-light text-emerald">
          <i class="mdi mdi-certificate-outline"></i>
        </div>
        <h3 class="dialog-title">Re-issue Active Certificate?</h3>
        <p class="dialog-desc">
          This will assign a new active serial number for candidate <strong>{{ targetStudent?.student_name }}</strong> and reinstate credential verification.
        </p>
        <div class="dialog-actions">
          <button type="button" class="btn-dialog-cancel" @click="showReissueModal = false">Cancel</button>
          <button type="button" class="btn-dialog-success" :disabled="submittingAction" @click="confirmReissue">
            <i v-if="submittingAction" class="mdi mdi-loading spin-icon mr-1"></i>
            {{ submittingAction ? 'Re-issuing...' : 'Re-issue Certificate' }}
          </button>
        </div>
      </div>
    </v-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { useAuthStore } from '@/stores/auth';
import AppPagination from '@/components/common/AppPagination.vue';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'main_admin', 'sub_admin', 'tutor']
});

const route = useRoute();
const api = useApi();
const authStore = useAuthStore();

const batchId = computed(() => route.params.id as string);

const loading = ref(true);
const error = ref<string | null>(null);
const batch = ref<any>(null);
const students = ref<any[]>([]);
const stats = ref<any>({});

const searchQuery = ref('');
const statusFilter = ref<'all' | 'certified' | 'passed' | 'failed' | 'in_progress'>('all');
const copySuccessId = ref<string | null>(null);
const copiedAllCerts = ref(false);
const copiedBatchId = ref(false);

const page = ref(1);
const perPage = ref(25);

const targetStudent = ref<any>(null);
const showRevokeModal = ref(false);
const showReissueModal = ref(false);
const submittingAction = ref(false);

const canManage = computed(() => {
  const role = authStore.userRole;
  return role === 'super_admin' || role === 'main_admin';
});

const certifiedStudentsCount = computed(() => students.value.filter(s => !!s.cert_number).length);
const passedStudentsCount = computed(() => students.value.filter(s => s.exam_status === 'passed').length);
const failedStudentsCount = computed(() => students.value.filter(s => s.exam_status === 'failed').length);
const inProgressCount = computed(() => students.value.filter(s => s.exam_status === 'in_progress').length);

const filteredStudents = computed(() => {
  let list = students.value || [];
  const q = searchQuery.value.toLowerCase().trim();

  if (statusFilter.value === 'certified') {
    list = list.filter(s => !!s.cert_number);
  } else if (statusFilter.value === 'passed') {
    list = list.filter(s => s.exam_status === 'passed');
  } else if (statusFilter.value === 'failed') {
    list = list.filter(s => s.exam_status === 'failed');
  } else if (statusFilter.value === 'in_progress') {
    list = list.filter(s => s.exam_status === 'in_progress');
  }

  if (q) {
    list = list.filter(s =>
      (s.student_name || '').toLowerCase().includes(q) ||
      (s.student_email || '').toLowerCase().includes(q) ||
      (s.cert_number || '').toLowerCase().includes(q)
    );
  }

  return list;
});

const paginatedStudents = computed(() => {
  const start = (page.value - 1) * perPage.value;
  return filteredStudents.value.slice(start, start + perPage.value);
});

onMounted(() => {
  fetchBatchData();
});

async function fetchBatchData() {
  loading.value = true;
  error.value = null;
  try {
    const res: any = await api.get(`/main-admin/certificates/batches/${batchId.value}`);
    batch.value = res.batch || res.data?.batch;
    students.value = res.students || res.data?.students || [];
    stats.value = res.stats || res.data?.stats || {};
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to load batch certificate records.';
  } finally {
    loading.value = false;
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function getInitials(name?: string) {
  if (!name) return 'C';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatExamStatus(status?: string) {
  if (!status) return 'ATTENDED';
  if (status === 'passed') return 'PASSED';
  if (status === 'failed') return 'FAILED';
  if (status === 'in_progress') return 'IN PROGRESS';
  return status.toUpperCase();
}

function getExamStatusClass(status?: string) {
  if (status === 'passed') return 'chip-green';
  if (status === 'failed') return 'chip-red';
  if (status === 'in_progress') return 'chip-indigo';
  return 'chip-muted';
}

function copyToClipboard(text: string) {
  if (!text) return;
  navigator.clipboard.writeText(text);
  copySuccessId.value = text;
  setTimeout(() => {
    if (copySuccessId.value === text) {
      copySuccessId.value = null;
    }
  }, 2000);
}

function copyBatchId() {
  if (!batch.value?.batch_id) return;
  navigator.clipboard.writeText(batch.value.batch_id);
  copiedBatchId.value = true;
  setTimeout(() => {
    copiedBatchId.value = false;
  }, 2000);
}

function copyAllCerts() {
  const certNumbers = students.value
    .map(s => s.cert_number)
    .filter(Boolean);

  if (certNumbers.length === 0) return;

  navigator.clipboard.writeText(certNumbers.join('\n'));
  copiedAllCerts.value = true;
  setTimeout(() => {
    copiedAllCerts.value = false;
  }, 2500);
}

function downloadCert(certNumber: string) {
  const url = `/api/main-admin/certificates/${encodeURIComponent(certNumber)}/pdf`;
  window.open(url, '_blank');
}

function openRevokeModal(std: any) {
  targetStudent.value = std;
  showRevokeModal.value = true;
}

function openReissueModal(std: any) {
  targetStudent.value = std;
  showReissueModal.value = true;
}

async function confirmRevoke() {
  if (!targetStudent.value?.cert_number) return;
  submittingAction.value = true;
  try {
    await api.post(`/main-admin/certificates/${encodeURIComponent(targetStudent.value.cert_number)}/revoke`, {
      reason: 'Revoked by administrator from batch roster'
    });
    showRevokeModal.value = false;
    await fetchBatchData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to revoke certificate');
  } finally {
    submittingAction.value = false;
  }
}

async function confirmReissue() {
  if (!targetStudent.value?.cert_number) return;
  submittingAction.value = true;
  try {
    await api.post(`/main-admin/certificates/${encodeURIComponent(targetStudent.value.cert_number)}/reissue`);
    showReissueModal.value = false;
    await fetchBatchData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to re-issue certificate');
  } finally {
    submittingAction.value = false;
  }
}

function exportCSV() {
  if (students.value.length === 0) return;

  const headers = ['Candidate Name', 'Email', 'Phone', 'Exam Status', 'Attempts', 'Certificate Number', 'Issued Date', 'Cert Status'];
  const rows = students.value.map(s => [
    `"${(s.student_name || '').replace(/"/g, '""')}"`,
    `"${(s.student_email || '').replace(/"/g, '""')}"`,
    `"${(s.student_phone || '').replace(/"/g, '""')}"`,
    `"${formatExamStatus(s.exam_status)}"`,
    s.attempts_used || 0,
    `"${s.cert_number || ''}"`,
    `"${s.issued_at ? formatDate(s.issued_at) : ''}"`,
    `"${s.cert_status || 'PENDING'}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Certificates_${batch.value?.exam_name || 'Batch'}_${batchId.value.slice(0, 8)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<style scoped>
.gsfin-admin-page {
  padding: 24px 32px;
  background-color: #F8FAFC;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
  color: #0F172A;
}

.admin-wrap {
  max-width: 1400px;
  margin: 0 auto;
}

/* ─── TOP NAVIGATION BAR ─── */
.top-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  text-decoration: none;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

.btn-back:hover {
  background: #F1F5F9;
  border-color: rgba(15, 23, 42, 0.15);
  color: #0F172A;
}

.breadcrumb-trail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
}

.bc-link {
  color: #64748B;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s ease;
}

.bc-link:hover {
  color: #E31B23;
}

.bc-sep {
  color: #CBD5E1;
  font-size: 0.85rem;
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
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: #64748B;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

.btn-icon-refresh:hover:not(:disabled) {
  background: #F1F5F9;
  color: #0F172A;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ─── LOADING & ERROR STATES ─── */
.loading-state-box {
  text-align: center;
  padding: 80px 20px;
  color: #64748B;
  font-weight: 500;
}

.loading-text {
  font-size: 0.85rem;
  margin-top: 10px;
}

.spinner-sm-red {
  display: inline-block;
  width: 28px;
  height: 28px;
  border: 3px solid rgba(227, 27, 35, 0.15);
  border-top-color: #E31B23;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.error-state-card {
  padding: 32px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  text-align: center;
  max-width: 480px;
  margin: 48px auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.error-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #FEF2F2;
  color: #E31B23;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  font-size: 1.5rem;
}

.error-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0 0 6px;
}

.error-desc {
  font-size: 0.8rem;
  color: #64748B;
  margin-bottom: 16px;
}

.btn-return {
  background: #E31B23;
  color: #FFFFFF;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
  transition: background 0.15s;
}

.btn-return:hover {
  background: #C41219;
}

/* ─── BATCH STACK ─── */
.batch-content-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ─── HERO BATCH CARD ─── */
.hero-batch-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

@media (max-width: 868px) {
  .hero-batch-card {
    flex-direction: column;
    align-items: flex-start;
  }
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.hero-icon-box {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #FEF2F2;
  border: 1px solid #FEE2E2;
  color: #E31B23;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}

.hero-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hero-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.batch-title {
  font-size: 1.35rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.status-pill.pill-open {
  background: #ECFDF5;
  color: #065F46;
  border: 1px solid #A7F3D0;
}

.status-pill.pill-closed {
  background: #F1F5F9;
  color: #475569;
  border: 1px solid #E2E8F0;
}

.status-pill.pill-amber {
  background: #FFFBEB;
  color: #92400E;
  border: 1px solid #FDE68A;
}

.hero-meta-row {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: #64748B;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.meta-sub {
  color: #94A3B8;
  font-size: 0.78rem;
}

.meta-label {
  color: #94A3B8;
  font-size: 0.75rem;
}

.batch-code-badge {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  padding: 2px 7px;
  border-radius: 6px;
  color: #0F172A;
  font-size: 0.75rem;
  font-family: monospace;
  font-weight: 600;
  user-select: all;
}

.btn-copy-inline {
  background: none;
  border: none;
  cursor: pointer;
  color: #94A3B8;
  font-size: 0.85rem;
  padding: 2px 4px;
  border-radius: 4px;
  transition: color 0.15s;
  display: inline-flex;
  align-items: center;
}

.btn-copy-inline:hover {
  color: #0F172A;
}

.hero-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-export {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  border-radius: 10px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  color: #334155;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}

.btn-export:hover:not(:disabled) {
  background: #F1F5F9;
  border-color: rgba(15, 23, 42, 0.2);
  color: #0F172A;
}

.btn-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─── 2. KPI METRICS GRID (EXPLICIT 4-COL CSS) ─── */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

@media (max-width: 1024px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}

.metric-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 20px 22px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
}

.metric-icon-box {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.bg-indigo-light { background: #EEF2FF; }
.text-indigo { color: #4F46E5; }

.bg-emerald-light { background: #ECFDF5; }
.text-emerald { color: #059669; }

.bg-red-light { background: #FEF2F2; }
.text-red { color: #E31B23; }

.metric-info {
  display: flex;
  flex-direction: column;
}

.metric-value {
  font-size: 26px;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.metric-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 3px;
}

.metric-sub {
  font-size: 11px;
  font-weight: 500;
  margin-top: 2px;
}

/* ─── 3. PANEL SECTION CARD ─── */
.panel-section-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.section-card-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
}

.section-subtitle {
  font-size: 0.78rem;
  color: #64748B;
  margin: 3px 0 0;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-roster-action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 10px;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-roster-action:hover:not(:disabled) {
  background: #F1F5F9;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.15);
}

.btn-roster-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─── FILTER & SEARCH CONTROLS BAR ─── */
.panel-filter-bar {
  padding: 14px 24px;
  background: #F8FAFC;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 440px;
  min-width: 260px;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 1.05rem;
  color: #94A3B8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 36px 8px 36px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 10px;
  font-size: 0.8rem;
  color: #0F172A;
  outline: none;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
}

.search-input:focus {
  border-color: #E31B23;
  box-shadow: 0 0 0 2px rgba(227, 27, 35, 0.1);
}

.search-clear-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  font-size: 1rem;
}

/* ─── FILTER TABS SEGMENTED CONTROL ─── */
.filter-tabs {
  display: inline-flex;
  align-items: center;
  background: #F1F5F9;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 12px;
  padding: 3px;
  gap: 3px;
  flex-wrap: wrap;
}

.filter-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 9px;
  font-size: 0.74rem;
  font-weight: 600;
  border: none;
  background: transparent;
  color: #64748B;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-tab-btn:hover {
  color: #0F172A;
}

.filter-tab-btn.active {
  background: #FFFFFF;
  color: #0F172A;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.filter-tab-btn.tab-emerald.active {
  color: #059669;
}

.filter-tab-btn.tab-red.active {
  color: #E31B23;
}

.filter-tab-btn.tab-indigo.active {
  color: #4F46E5;
}

.tab-count-pill {
  background: rgba(15, 23, 42, 0.08);
  color: #475569;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 0.68rem;
  font-weight: 600;
}

.filter-tab-btn.active .tab-count-pill {
  background: #0F172A;
  color: #FFFFFF;
}

.filter-tab-btn.tab-emerald.active .tab-count-pill {
  background: #059669;
  color: #FFFFFF;
}

.filter-tab-btn.tab-red.active .tab-count-pill {
  background: #E31B23;
  color: #FFFFFF;
}

.filter-tab-btn.tab-indigo.active .tab-count-pill {
  background: #4F46E5;
  color: #FFFFFF;
}

/* ─── CANDIDATES ROSTER TABLE ─── */
.table-container {
  overflow-x: auto;
}

.roster-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.roster-table th {
  padding: 13px 20px;
  background: #F8FAFC;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748B;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  white-space: nowrap;
}

.roster-table td {
  padding: 14px 20px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.04);
  font-size: 0.82rem;
  vertical-align: middle;
}

.roster-table tr:hover {
  background-color: #F8FAFC;
}

.candidate-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.candidate-photo {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(15, 23, 42, 0.08);
  flex-shrink: 0;
}

.candidate-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #F1F5F9;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  flex-shrink: 0;
}

.candidate-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.candidate-name {
  font-weight: 600;
  color: #0F172A;
  font-size: 0.84rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.candidate-email {
  font-size: 0.75rem;
  color: #64748B;
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.exam-status-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.attempts-sub {
  font-size: 0.72rem;
  color: #94A3B8;
  font-weight: 500;
}

.cert-serial-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.cert-serial-text {
  font-family: monospace;
  font-weight: 600;
  color: #0F172A;
  font-size: 0.78rem;
  letter-spacing: 0.03em;
}

.btn-copy-id {
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  font-size: 0.88rem;
  padding: 2px 4px;
  border-radius: 4px;
  transition: color 0.15s;
  display: inline-flex;
  align-items: center;
}

.btn-copy-id:hover {
  color: #E31B23;
}

.no-cert-label {
  font-size: 0.76rem;
  color: #94A3B8;
  font-style: italic;
}

.date-cell {
  font-size: 0.78rem;
  color: #64748B;
  font-weight: 500;
  white-space: nowrap;
}

/* ─── STATUS CHIP PILLS ─── */
.chip-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.chip-green {
  background: #ECFDF5;
  color: #065F46;
  border: 1px solid #A7F3D0;
}

.chip-red {
  background: #FEF2F2;
  color: #991B1B;
  border: 1px solid #FECACA;
}

.chip-indigo {
  background: #EEF2FF;
  color: #3730A3;
  border: 1px solid #C7D2FE;
}

.chip-muted {
  background: #F1F5F9;
  color: #475569;
  border: 1px solid #E2E8F0;
}

/* ─── ACTION BUTTONS ─── */
.action-btn-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.btn-table-action {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-table-action.btn-success {
  color: #059669;
  border-color: #A7F3D0;
  background: #ECFDF5;
}

.btn-table-action.btn-success:hover {
  background: #059669;
  color: #FFFFFF;
}

.btn-table-action.btn-danger {
  color: #DC2626;
  border-color: #FECACA;
  background: #FEF2F2;
}

.btn-table-action.btn-danger:hover {
  background: #DC2626;
  color: #FFFFFF;
}

.btn-table-action.btn-warn {
  color: #D97706;
  border-color: #FDE68A;
  background: #FFFBEB;
}

.btn-table-action.btn-warn:hover {
  background: #D97706;
  color: #FFFFFF;
}

.action-dash {
  color: #CBD5E1;
  font-size: 0.8rem;
  padding: 0 4px;
}

.empty-roster-box {
  text-align: center;
  padding: 64px 20px;
  color: #94A3B8;
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 8px;
  color: #CBD5E1;
}

.empty-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #334155;
  margin: 0;
}

.empty-desc {
  font-size: 0.78rem;
  color: #94A3B8;
  margin: 4px 0 0;
}

.pagination-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

/* ─── MODAL DIALOGS ─── */
.dialog-box {
  padding: 28px;
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.dialog-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  font-size: 1.5rem;
}

.dialog-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0 0 8px;
}

.dialog-desc {
  font-size: 0.82rem;
  color: #64748B;
  line-height: 1.5;
  margin-bottom: 20px;
}

.dialog-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.btn-dialog-cancel {
  padding: 8px 16px;
  border-radius: 9px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-dialog-cancel:hover {
  background: #F1F5F9;
  color: #0F172A;
}

.btn-dialog-danger {
  padding: 8px 18px;
  border-radius: 9px;
  background: #E31B23;
  color: #FFFFFF;
  font-size: 0.8rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-dialog-danger:hover:not(:disabled) {
  background: #C41219;
}

.btn-dialog-success {
  padding: 8px 18px;
  border-radius: 9px;
  background: #059669;
  color: #FFFFFF;
  font-size: 0.8rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-dialog-success:hover:not(:disabled) {
  background: #047857;
}

.text-right {
  text-align: right;
}
</style>
