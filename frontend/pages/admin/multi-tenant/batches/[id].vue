<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ TOP BREADCRUMB & BACK NAVIGATION ═══ -->
      <div class="top-nav-bar">
        <div class="nav-left">
          <button class="btn-back" type="button" @click="handleBack">
            <i class="mdi mdi-arrow-left"></i>
            <span>Back to {{ batch?.org_name ? batch.org_name : 'Partner Directory' }}</span>
          </button>
          <div class="breadcrumb-trail">
            <NuxtLink to="/admin/multi-tenant" class="bc-link">Partner Centers</NuxtLink>
            <i class="mdi mdi-chevron-right bc-sep"></i>
            <NuxtLink
              v-if="batch?.org_id"
              :to="'/admin/multi-tenant/' + batch.org_id"
              class="bc-link text-slate-600"
            >
              {{ batch.org_name }}
            </NuxtLink>
            <span v-else class="bc-link text-slate-600">Partner Center</span>
            <i class="mdi mdi-chevron-right bc-sep"></i>
            <span class="bc-current">Batch #{{ batchId ? batchId.slice(0, 8) : '' }}</span>
          </div>
        </div>

        <div class="nav-right">
          <button
            class="btn-icon-refresh"
            type="button"
            title="Refresh Batch Data"
            :disabled="loading"
            @click="fetchBatchData"
          >
            <i :class="['mdi', 'mdi-refresh', { 'spin-icon': loading }]"></i>
          </button>
        </div>
      </div>

      <!-- ═══ LOADING STATE ═══ -->
      <div v-if="loading && !batch" class="state-card text-center py-20">
        <span class="spinner-sm-red"></span>
        <p class="loading-text mt-3">Loading Exam Batch Candidate Roster &amp; Statistics...</p>
      </div>

      <!-- ═══ ERROR STATE ═══ -->
      <div v-else-if="error" class="error-state-card">
        <div class="error-icon-box">
          <i class="mdi mdi-alert-circle-outline"></i>
        </div>
        <h3 class="error-title">Unable to Load Batch Records</h3>
        <p class="error-desc">{{ error }}</p>
        <button type="button" class="btn-return" @click="handleBack">
          Return to Partner Center
        </button>
      </div>

      <!-- ═══ BATCH MAIN CONTENT ═══ -->
      <div v-else-if="batch" class="fade-in space-y-6">

        <!-- ─── 1. BATCH EXECUTIVE HERO CARD ─── -->
        <div class="hero-card">
          <div class="hero-left">
            <div class="batch-avatar">
              <i class="mdi mdi-layers-triple"></i>
            </div>
            <div class="batch-meta">
              <div class="hero-title-row">
                <h1 class="batch-title">{{ batch.exam_name || 'Certification Exam Batch' }}</h1>
                <span
                  :class="[
                    'status-badge',
                    batch.status === 'open' ? 'badge-active' :
                    batch.status === 'closed' ? 'badge-closed' : 'badge-amber'
                  ]"
                >
                  <span class="pulse-dot"></span>
                  {{ (batch.status || 'open').toUpperCase() }}
                </span>
              </div>

              <div class="meta-tags-row">
                <span class="meta-pill">
                  <i class="mdi mdi-office-building"></i>
                  <NuxtLink
                    v-if="batch.org_id"
                    :to="'/admin/multi-tenant/' + batch.org_id"
                    class="font-semibold text-slate-800 hover:text-red transition-colors no-underline"
                  >
                    {{ batch.org_name }}
                  </NuxtLink>
                  <span v-else class="font-semibold text-slate-800">{{ batch.org_name }}</span>
                  <span v-if="batch.city" class="text-slate-400">({{ batch.city }}, {{ batch.country }})</span>
                </span>

                <span class="meta-pill">
                  <i class="mdi mdi-fingerprint"></i>
                  <span class="text-slate-400">Batch Code:</span>
                  <code class="batch-code-badge">{{ batch.id }}</code>
                  <button
                    type="button"
                    class="btn-copy-mini"
                    :title="copiedBatchId ? 'Copied!' : 'Copy Batch ID'"
                    @click="copyBatchId"
                  >
                    <i :class="['mdi', copiedBatchId ? 'mdi-check text-emerald-600' : 'mdi-content-copy']"></i>
                  </button>
                </span>

                <span v-if="batch.duration_minutes" class="meta-pill">
                  <i class="mdi mdi-clock-outline"></i>
                  <span>Duration: {{ batch.duration_minutes }} mins</span>
                </span>

                <span v-if="batch.created_at" class="meta-pill">
                  <i class="mdi mdi-calendar-blank"></i>
                  <span>Created: {{ formatDate(batch.created_at) }}</span>
                </span>
              </div>
            </div>
          </div>

          <div class="hero-actions">
            <button
              type="button"
              class="btn-action btn-action-secondary"
              :disabled="assignments.length === 0"
              title="Export candidate roster to CSV"
              @click="exportCSV"
            >
              <i class="mdi mdi-file-delimited-outline"></i>
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              class="btn-action btn-action-secondary"
              :disabled="certifiedCount === 0"
              title="Copy all certificate numbers"
              @click="copyAllCerts"
            >
              <i :class="['mdi', copiedAllCerts ? 'mdi-check text-emerald' : 'mdi-content-copy']"></i>
              <span>{{ copiedAllCerts ? 'All Copied!' : 'Copy Cert IDs' }}</span>
            </button>

            <NuxtLink
              v-if="batch.org_id"
              :to="'/admin/multi-tenant/' + batch.org_id"
              class="btn-action btn-action-secondary no-underline"
            >
              <i class="mdi mdi-office-building-outline"></i>
              <span>Partner Center</span>
            </NuxtLink>
          </div>
        </div>

        <!-- ─── 2. BATCH KPI SUMMARY CARDS (4-COLUMN GRID) ─── -->
        <div class="kpi-grid">
          <!-- Total Candidates -->
          <div class="kpi-card">
            <div class="kpi-icon bg-indigo-light">
              <i class="mdi mdi-account-group text-indigo"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Total Candidates</span>
              <span class="kpi-value">{{ stats.total_candidates ?? assignments.length }}</span>
              <span class="kpi-sub text-indigo">Batch Attendance</span>
            </div>
          </div>

          <!-- Certified Holders -->
          <div class="kpi-card">
            <div class="kpi-icon bg-emerald-light">
              <i class="mdi mdi-certificate text-emerald"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Certified Holders</span>
              <span class="kpi-value text-emerald">{{ stats.certified_count ?? certifiedCount }}</span>
              <span class="kpi-sub text-emerald">Issued Credentials</span>
            </div>
          </div>

          <!-- Passed Candidates -->
          <div class="kpi-card">
            <div class="kpi-icon bg-emerald-light">
              <i class="mdi mdi-check-decagram text-emerald"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Passed Sitting</span>
              <span class="kpi-value text-emerald">{{ stats.passed_count ?? passedCount }}</span>
              <span class="kpi-sub text-emerald">Qualified Candidates</span>
            </div>
          </div>

          <!-- Failed Candidates -->
          <div class="kpi-card">
            <div class="kpi-icon bg-red-light">
              <i class="mdi mdi-close-circle-outline text-red"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Failed / Retake Required</span>
              <span class="kpi-value text-red">{{ stats.failed_count ?? failedCount }}</span>
              <span class="kpi-sub text-red">Below Passing Score</span>
            </div>
          </div>
        </div>

        <!-- ─── 3. ENROLLED CANDIDATES ROSTER PANEL ─── -->
        <div class="panel-card">
          <!-- Panel Header -->
          <div class="panel-card-header">
            <div class="panel-header-left">
              <div class="panel-header-icon bg-red-light text-red">
                <i class="mdi mdi-account-group-outline"></i>
              </div>
              <div>
                <h3 class="panel-title">Enrolled Candidates Roster</h3>
              </div>
            </div>

            <div class="panel-header-actions">
              <div class="search-input-wrap">
                <i class="mdi mdi-magnify search-icon"></i>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search candidates by name, email, or certificate ID..."
                  class="table-search-input"
                />
                <button v-if="searchQuery" type="button" class="search-clear-btn" @click="searchQuery = ''">
                  <i class="mdi mdi-close"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Filter Tab Bar -->
          <div class="filter-tab-bar">
            <button
              type="button"
              :class="['filter-tab-btn', statusFilter === 'all' ? 'active' : '']"
              @click="statusFilter = 'all'"
            >
              All Candidates <span class="tab-count">{{ assignments.length }}</span>
            </button>
            <button
              type="button"
              :class="['filter-tab-btn', statusFilter === 'certified' ? 'active' : '']"
              @click="statusFilter = 'certified'"
            >
              <i class="mdi mdi-certificate text-emerald"></i>
              <span>Certified</span>
              <span class="tab-count count-emerald">{{ certifiedCount }}</span>
            </button>
            <button
              type="button"
              :class="['filter-tab-btn', statusFilter === 'passed' ? 'active' : '']"
              @click="statusFilter = 'passed'"
            >
              <i class="mdi mdi-check-circle text-emerald"></i>
              <span>Passed</span>
              <span class="tab-count count-emerald">{{ passedCount }}</span>
            </button>
            <button
              type="button"
              :class="['filter-tab-btn', statusFilter === 'failed' ? 'active' : '']"
              @click="statusFilter = 'failed'"
            >
              <i class="mdi mdi-close-circle text-red"></i>
              <span>Failed</span>
              <span class="tab-count count-red">{{ failedCount }}</span>
            </button>
            <button
              type="button"
              :class="['filter-tab-btn', statusFilter === 'in_progress' ? 'active' : '']"
              @click="statusFilter = 'in_progress'"
            >
              <i class="mdi mdi-clock-outline text-amber"></i>
              <span>In Progress</span>
              <span class="tab-count count-amber">{{ inProgressCount }}</span>
            </button>
          </div>

          <!-- Candidate Table -->
          <div class="table-responsive">
            <table class="gsfin-table">
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Attendance / Exam Status</th>
                  <th>Certificate Serial ID</th>
                  <th>Issued Date</th>
                  <th>Cert Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <!-- Empty State -->
                <tr v-if="paginatedAssignments.length === 0">
                  <td colspan="6" class="text-center py-16">
                    <div class="empty-state-box">
                      <div class="empty-icon-wrap">
                        <i class="mdi mdi-account-group-outline"></i>
                      </div>
                      <h4 class="empty-state-title">No Candidates Found</h4>
                      <p v-if="searchQuery" class="empty-state-desc">
                        No candidate records match your search query &quot;{{ searchQuery }}&quot;.
                      </p>
                      <p v-else-if="statusFilter !== 'all'" class="empty-state-desc">
                        No candidates in this batch match the &quot;{{ statusFilter }}&quot; filter.
                      </p>
                      <p v-else class="empty-state-desc">
                        No candidates have been assigned to this batch examination session yet.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Candidate Rows -->
                <tr v-for="a in paginatedAssignments" :key="a.id">
                  <!-- Candidate Name & Email -->
                  <td>
                    <div class="candidate-cell">
                      <div class="avatar-circle">
                        {{ getInitials(a.student_name) }}
                      </div>
                      <div>
                        <div class="font-semibold text-slate-900 leading-snug">{{ a.student_name }}</div>
                        <div class="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{{ a.student_email }}</span>
                          <span v-if="a.student_phone && a.student_phone !== 'N/A'" class="text-slate-400 font-mono">
                            &bull; {{ a.student_phone }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Exam Status -->
                  <td>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span
                        :class="[
                          'badge-chip',
                          a.status === 'passed' ? 'chip-green' :
                          a.status === 'failed' ? 'chip-red' :
                          a.status === 'in_progress' ? 'chip-amber' : 'chip-slate'
                        ]"
                      >
                        <i
                          :class="[
                            'mdi',
                            a.status === 'passed' ? 'mdi-check-circle' :
                            a.status === 'failed' ? 'mdi-close-circle' :
                            a.status === 'in_progress' ? 'mdi-clock-outline' : 'mdi-account-clock'
                          ]"
                        ></i>
                        {{ formatExamStatus(a.status) }}
                      </span>
                      <span class="attempt-badge">
                        Attempt {{ a.attempts_used || 1 }} / {{ a.max_attempts || 1 }}
                      </span>
                    </div>
                  </td>

                  <!-- Certificate Serial ID -->
                  <td>
                    <div v-if="a.certificate_number || a.cert_number" class="cert-serial-box">
                      <code class="cert-code">{{ a.certificate_number || a.cert_number }}</code>
                      <button
                        type="button"
                        class="btn-copy-mini"
                        :title="copiedCertId === (a.certificate_number || a.cert_number) ? 'Copied!' : 'Copy Certificate Serial'"
                        @click="copyCert(a.certificate_number || a.cert_number)"
                      >
                        <i :class="['mdi', copiedCertId === (a.certificate_number || a.cert_number) ? 'mdi-check text-emerald' : 'mdi-content-copy']"></i>
                      </button>
                    </div>
                    <span v-else class="text-xs text-slate-400 italic">No Certificate Issued</span>
                  </td>

                  <!-- Issued Date -->
                  <td class="text-slate-500 font-medium text-xs">
                    {{ a.issued_at ? formatDate(a.issued_at) : '—' }}
                  </td>

                  <!-- Cert Status -->
                  <td>
                    <span
                      v-if="a.certificate_number || a.cert_number"
                      :class="[
                        'badge-chip',
                        a.cert_status === 'active' ? 'chip-green' :
                        a.cert_status === 'revoked' ? 'chip-red' : 'chip-amber'
                      ]"
                    >
                      <i :class="['mdi', a.cert_status === 'active' ? 'mdi-shield-check' : 'mdi-close-octagon']"></i>
                      {{ a.cert_status === 'active' ? 'Active Verified' : (a.cert_status === 'revoked' ? 'Revoked' : 'Pending') }}
                    </span>
                    <span v-else class="badge-chip chip-slate">PENDING</span>
                  </td>

                  <!-- Actions -->
                  <td class="text-right">
                    <div class="actions-cell justify-end">
                      <!-- Proctoring Link -->
                      <NuxtLink
                        v-if="a.attempt_id"
                        :to="'/dashboard/admin/proctoring/' + a.attempt_id"
                        class="btn-action-icon"
                        title="View Proctoring Audit Log"
                      >
                        <i class="mdi mdi-shield-account-outline"></i>
                      </NuxtLink>

                      <!-- Download PDF Certificate -->
                      <button
                        v-if="a.certificate_number || a.cert_number"
                        type="button"
                        class="btn-action-icon btn-pdf"
                        title="Download Certificate PDF"
                        @click="downloadCert(a.certificate_number || a.cert_number)"
                      >
                        <i class="mdi mdi-file-pdf-box"></i>
                      </button>

                      <span v-if="!a.certificate_number && !a.cert_number && !a.attempt_id" class="text-xs text-slate-400 font-medium">—</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination -->
            <AppPagination
              v-if="filteredAssignments.length > 0"
              v-model="page"
              v-model:items-per-page="perPage"
              :total-items="filteredAssignments.length"
              :per-page-options="[10, 25, 50, 100]"
            />
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import AppPagination from '@/components/common/AppPagination.vue';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'main_admin', 'sub_admin']
});

const route = useRoute();
const router = useRouter();
const api = useApi();

const batchId = computed(() => route.params.id as string);

const loading = ref(true);
const error = ref<string | null>(null);
const batch = ref<any>(null);
const assignments = ref<any[]>([]);
const stats = ref<any>({});

const searchQuery = ref('');
const statusFilter = ref<'all' | 'certified' | 'passed' | 'failed' | 'in_progress'>('all');

const page = ref(1);
const perPage = ref(25);

const copiedBatchId = ref(false);
const copiedAllCerts = ref(false);
const copiedCertId = ref<string | null>(null);

const passedCount = computed(() => assignments.value.filter(a => a.status === 'passed').length);
const failedCount = computed(() => assignments.value.filter(a => a.status === 'failed').length);
const inProgressCount = computed(() => assignments.value.filter(a => a.status === 'in_progress').length);
const certifiedCount = computed(() => assignments.value.filter(a => !!(a.certificate_number || a.cert_number)).length);

const filteredAssignments = computed(() => {
  let list = assignments.value || [];
  const q = searchQuery.value.toLowerCase().trim();

  if (statusFilter.value === 'certified') {
    list = list.filter(a => !!(a.certificate_number || a.cert_number));
  } else if (statusFilter.value === 'passed') {
    list = list.filter(a => a.status === 'passed');
  } else if (statusFilter.value === 'failed') {
    list = list.filter(a => a.status === 'failed');
  } else if (statusFilter.value === 'in_progress') {
    list = list.filter(a => a.status === 'in_progress');
  }

  if (q) {
    list = list.filter(a =>
      (a.student_name || '').toLowerCase().includes(q) ||
      (a.student_email || '').toLowerCase().includes(q) ||
      (a.certificate_number || a.cert_number || '').toLowerCase().includes(q)
    );
  }

  return list;
});

const paginatedAssignments = computed(() => {
  const start = (page.value - 1) * perPage.value;
  return filteredAssignments.value.slice(start, start + perPage.value);
});

onMounted(() => {
  fetchBatchData();
});

async function fetchBatchData() {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await api.get(`/main-admin/batches/${batchId.value}`);
    batch.value = data?.batch || null;
    assignments.value = data?.assignments || [];
    stats.value = data?.stats || {};
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to load batch records.';
  } finally {
    loading.value = false;
  }
}

function handleBack() {
  if (batch.value?.org_id) {
    router.push(`/admin/multi-tenant/${batch.value.org_id}`);
  } else {
    router.push('/admin/multi-tenant');
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

function formatExamStatus(st: string) {
  if (!st) return 'Pending';
  switch (st.toLowerCase()) {
    case 'passed': return 'Passed';
    case 'failed': return 'Failed';
    case 'in_progress': return 'In Progress';
    case 'not_started': return 'Not Started';
    case 'expired': return 'Expired';
    default: return st.charAt(0).toUpperCase() + st.slice(1);
  }
}

function getInitials(name: string) {
  if (!name) return 'CD';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function copyBatchId() {
  if (!batch.value) return;
  navigator.clipboard.writeText(batch.value.id);
  copiedBatchId.value = true;
  setTimeout(() => {
    copiedBatchId.value = false;
  }, 2000);
}

function copyCert(certNumber: string) {
  if (!certNumber) return;
  navigator.clipboard.writeText(certNumber);
  copiedCertId.value = certNumber;
  setTimeout(() => {
    if (copiedCertId.value === certNumber) copiedCertId.value = null;
  }, 2000);
}

function copyAllCerts() {
  const certNumbers = assignments.value
    .map(a => a.certificate_number || a.cert_number)
    .filter(Boolean);

  if (certNumbers.length === 0) return;

  navigator.clipboard.writeText(certNumbers.join('\n'));
  copiedAllCerts.value = true;
  setTimeout(() => {
    copiedAllCerts.value = false;
  }, 2500);
}

function downloadCert(certNumber: string) {
  const url = `/api/certs/${encodeURIComponent(certNumber)}/download`;
  window.open(url, '_blank');
}

function exportCSV() {
  if (assignments.value.length === 0) return;

  const headers = ['Candidate Name', 'Candidate Email', 'Phone', 'Exam Status', 'Attempts Used', 'Certificate ID', 'Issued Date'];
  const rows = assignments.value.map(a => [
    `"${(a.student_name || '').replace(/"/g, '""')}"`,
    `"${(a.student_email || '').replace(/"/g, '""')}"`,
    `"${(a.student_phone || '').replace(/"/g, '""')}"`,
    `"${formatExamStatus(a.status)}"`,
    a.attempts_used || 1,
    `"${a.certificate_number || a.cert_number || ''}"`,
    `"${a.issued_at ? formatDate(a.issued_at) : ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Batch_${batch.value?.exam_name || 'Roster'}_${batchId.value.slice(0, 8)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<style scoped>
.gsfin-admin-page {
  padding: 0;
  background-color: #FAFAFD;
  min-height: 100vh;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
  color: #0F172A;
}

.admin-wrap {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

/* ─── TOP NAVIGATION & BREADCRUMB ─── */
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
  padding: 8px 16px;
  border-radius: 12px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  font-size: 0.84rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
}

.btn-back:hover {
  background: #F8FAFC;
  border-color: rgba(227, 27, 35, 0.3);
  color: #E31B23;
}

.breadcrumb-trail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
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
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: #64748B;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
  font-size: 1.15rem;
}

.btn-icon-refresh:hover:not(:disabled) {
  background: #F8FAFC;
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.3);
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ─── LOADING & ERROR STATES ─── */
.state-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
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

.loading-text {
  font-size: 0.88rem;
  color: #64748B;
  font-weight: 500;
}

.error-state-card {
  padding: 40px;
  background: #FFFFFF;
  border: 1px solid #FEE2E2;
  border-radius: 24px;
  text-align: center;
  max-width: 500px;
  margin: 48px auto;
  box-shadow: 0 4px 20px rgba(227, 27, 35, 0.04);
}

.error-icon-box {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #FEF2F2;
  color: #E31B23;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 1.75rem;
}

.error-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0 0 8px;
}

.error-desc {
  font-size: 0.84rem;
  color: #64748B;
  margin-bottom: 20px;
}

.btn-return {
  background: #E31B23;
  color: #FFFFFF;
  padding: 10px 22px;
  border-radius: 12px;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-return:hover {
  background: #C41219;
}

/* ─── 1. HERO CARD ─── */
.hero-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  padding: 32px 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.02);
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 22px;
  flex: 1;
  min-width: 320px;
}

.batch-avatar {
  width: 68px;
  height: 68px;
  border-radius: 20px;
  background: rgba(79, 70, 229, 0.08);
  color: #4F46E5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  flex-shrink: 0;
  border: 1px solid rgba(79, 70, 229, 0.12);
}

.batch-meta {
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
  font-size: 1.65rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-active {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.badge-closed {
  background: #F1F5F9;
  color: #475569;
  border: 1px solid #E2E8F0;
}

.badge-amber {
  background: rgba(245, 158, 11, 0.1);
  color: #D97706;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.meta-tags-row {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.meta-pill {
  font-size: 0.84rem;
  font-weight: 500;
  color: #64748B;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.meta-pill i {
  color: #94A3B8;
  font-size: 1rem;
}

.batch-code-badge {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  padding: 2px 8px;
  border-radius: 6px;
  color: #0F172A;
  font-size: 0.76rem;
  font-family: monospace;
  font-weight: 600;
  user-select: all;
}

.btn-copy-mini {
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

.btn-copy-mini:hover {
  color: #0F172A;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-action-secondary {
  background: #FFFFFF;
  color: #334155;
  border: 1px solid rgba(15, 23, 42, 0.12);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

.btn-action-secondary:hover:not(:disabled) {
  background: #F8FAFC;
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.3);
}

.btn-action-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─── 2. KPI GRID (RESPONSIVE 4-COLUMNS) ─── */
.kpi-grid {
  display: grid !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  gap: 20px !important;
  margin-bottom: 28px !important;
}

@media (max-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}

@media (max-width: 640px) {
  .kpi-grid {
    grid-template-columns: 1fr !important;
  }
}

.kpi-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 22px 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.02);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.kpi-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.55rem;
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

.kpi-content {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 0.74rem;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kpi-value {
  font-size: 1.85rem;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.2;
  margin-top: 4px;
}

.kpi-sub {
  font-size: 0.78rem;
  font-weight: 600;
  margin-top: 4px;
}

/* ─── 3. PANEL CARD: CANDIDATES ROSTER ─── */
.panel-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
  overflow: hidden;
}

.panel-card-header {
  padding: 22px 28px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  background: #FAFAFD;
}

.panel-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.panel-header-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.panel-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  line-height: 1.3;
}

.panel-subtitle {
  font-size: 0.8rem;
  color: #64748B;
  margin: 2px 0 0;
}

.panel-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 320px;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #94A3B8;
  font-size: 1.1rem;
  pointer-events: none;
}

.table-search-input {
  width: 100%;
  padding: 9px 36px 9px 38px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 12px;
  font-size: 0.84rem;
  color: #0F172A;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
}

.table-search-input:focus {
  border-color: #E31B23;
  outline: none;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.1);
}

.search-clear-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: #94A3B8;
  font-size: 1rem;
  display: flex;
  align-items: center;
}

.search-clear-btn:hover {
  color: #0F172A;
}

/* ─── FILTER TAB STRIP ─── */
.filter-tab-bar {
  padding: 12px 28px;
  background: #FFFFFF;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
}

.filter-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid transparent;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748B;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.filter-tab-btn:hover {
  background: #F8FAFC;
  color: #0F172A;
}

.filter-tab-btn.active {
  background: #F1F5F9;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.08);
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 7px;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 600;
  background: #E2E8F0;
  color: #475569;
}

.count-emerald { background: rgba(16, 185, 129, 0.15); color: #059669; }
.count-red { background: rgba(227, 27, 35, 0.12); color: #E31B23; }
.count-amber { background: rgba(245, 158, 11, 0.15); color: #D97706; }

/* ─── GSFIN TABLE ─── */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.gsfin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.gsfin-table th {
  padding: 12px 24px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748B;
  background: #FAFAFD;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  white-space: nowrap;
}

.gsfin-table td {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
  font-size: 0.86rem;
  font-weight: 400;
  color: #334155;
  vertical-align: middle;
}

.gsfin-table tbody tr:hover {
  background: #F8FAFC;
}

.candidate-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(79, 70, 229, 0.08);
  color: #4F46E5;
  font-weight: 600;
  font-size: 0.84rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(79, 70, 229, 0.12);
}

.badge-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 11px;
  border-radius: 50px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.chip-green { background: rgba(16, 185, 129, 0.1); color: #059669; }
.chip-red { background: rgba(227, 27, 35, 0.1); color: #E31B23; }
.chip-amber { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.chip-slate { background: #F1F5F9; color: #475569; }

.attempt-badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 6px;
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  color: #64748B;
  font-size: 0.72rem;
  font-weight: 500;
  white-space: nowrap;
}

.cert-serial-box {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  padding: 3px 8px;
  border-radius: 8px;
}

.cert-code {
  font-family: monospace;
  font-size: 0.78rem;
  font-weight: 600;
  color: #0F172A;
  user-select: all;
}

.actions-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-action-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #F1F5F9;
  color: #64748B;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
}

.btn-action-icon:hover {
  background: #FFFFFF;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.12);
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
}

.btn-pdf {
  color: #E31B23;
  background: #FEF2F2;
}

.btn-pdf:hover {
  background: #E31B23;
  color: #FFFFFF;
}

/* ─── EMPTY STATE ─── */
.empty-state-box {
  padding: 32px 20px;
  text-align: center;
  max-width: 440px;
  margin: 0 auto;
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: #F1F5F9;
  color: #94A3B8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 16px;
}

.empty-state-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0 0 6px;
}

.empty-state-desc {
  font-size: 0.82rem;
  color: #64748B;
  margin: 0;
  line-height: 1.5;
}

.fade-in {
  animation: fadeIn 0.25s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
