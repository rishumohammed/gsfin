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
      <div v-if="loading && !batch" class="state-card text-center py-20">
        <span class="spinner-sm-red"></span>
        <p class="loading-text mt-3">Loading Exam Batch Candidate Roster &amp; Certificates...</p>
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
      <div v-else-if="batch" class="fade-in space-y-6">

        <!-- ─── 1. BATCH EXECUTIVE HERO CARD ─── -->
        <div class="hero-card">
          <div class="hero-left">
            <div class="batch-avatar">
              <i class="mdi mdi-file-certificate-outline"></i>
            </div>
            <div class="batch-meta">
              <div class="hero-title-row">
                <h1 class="batch-title">{{ batch.exam_name }}</h1>
                <span
                  :class="[
                    'status-badge',
                    batch.batch_status === 'open' ? 'badge-active' :
                    batch.batch_status === 'closed' ? 'badge-closed' : 'badge-amber'
                  ]"
                >
                  <span class="pulse-dot"></span>
                  {{ (batch.batch_status || 'conducted').toUpperCase() }}
                </span>
              </div>

              <div class="meta-tags-row">
                <span class="meta-pill">
                  <i class="mdi mdi-office-building"></i>
                  <span class="font-semibold text-slate-800">{{ batch.org_name }}</span>
                  <span v-if="batch.city" class="text-slate-400">({{ batch.city }}, {{ batch.country }})</span>
                </span>

                <span class="meta-pill">
                  <i class="mdi mdi-fingerprint"></i>
                  <span class="text-slate-400">Batch Code:</span>
                  <code class="batch-code-badge">{{ batch.batch_id || batch.id }}</code>
                  <button
                    type="button"
                    class="btn-copy-mini"
                    :title="copiedBatchId ? 'Copied!' : 'Copy Batch Code'"
                    @click="copyBatchId"
                  >
                    <i :class="['mdi', copiedBatchId ? 'mdi-check text-emerald' : 'mdi-content-copy']"></i>
                  </button>
                </span>

                <span v-if="batch.created_at" class="meta-pill">
                  <i class="mdi mdi-calendar-blank"></i>
                  <span>Conducted: {{ formatDate(batch.created_at) }}</span>
                </span>

                <span class="meta-pill">
                  <i class="mdi mdi-clock-outline"></i>
                  <span>Duration: {{ batch.duration_minutes || 60 }} mins</span>
                </span>
              </div>
            </div>
          </div>

          <div class="hero-actions">
            <button
              type="button"
              class="btn-action btn-action-secondary"
              @click="exportCSV"
              :disabled="students.length === 0"
              title="Export candidate roster to CSV"
            >
              <i class="mdi mdi-file-delimited-outline"></i>
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              class="btn-action btn-action-secondary"
              @click="copyAllCerts"
              :disabled="certifiedStudentsCount === 0"
              title="Copy all issued certificate serial numbers"
            >
              <i :class="['mdi', copiedAllCerts ? 'mdi-check text-emerald' : 'mdi-content-copy']"></i>
              <span>{{ copiedAllCerts ? 'All Copied!' : 'Copy Cert IDs' }}</span>
            </button>
          </div>
        </div>

        <!-- ─── 2. BATCH KPI SUMMARY CARDS (TRUE 4-COLUMN GRID) ─── -->
        <div class="kpi-grid">
          <!-- Total Candidates -->
          <div class="kpi-card">
            <div class="kpi-icon bg-indigo-light">
              <i class="mdi mdi-account-group text-indigo"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Total Candidates</span>
              <span class="kpi-value">{{ stats.total_candidates ?? students.length }}</span>
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
              <span class="kpi-value text-emerald">{{ stats.certified_count ?? certifiedStudentsCount }}</span>
              <span class="kpi-sub text-emerald">Issued Credentials</span>
            </div>
          </div>

          <!-- Passed Sitting -->
          <div class="kpi-card">
            <div class="kpi-icon bg-emerald-light">
              <i class="mdi mdi-check-decagram text-emerald"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Passed Sitting</span>
              <span class="kpi-value text-emerald">{{ stats.passed_count ?? passedStudentsCount }}</span>
              <span class="kpi-sub text-emerald">Qualified Candidates</span>
            </div>
          </div>

          <!-- Failed / Retake Required -->
          <div class="kpi-card">
            <div class="kpi-icon bg-red-light">
              <i class="mdi mdi-close-circle-outline text-red"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Failed / Retake Required</span>
              <span class="kpi-value text-red">{{ stats.failed_count ?? failedStudentsCount }}</span>
              <span class="kpi-sub text-red">Below Passing Score</span>
            </div>
          </div>
        </div>

        <!-- ─── 3. CANDIDATE CERTIFICATES ROSTER PANEL ─── -->
        <div class="panel-card">
          <!-- Panel Header with Title & Search -->
          <div class="panel-card-header">
            <div class="panel-header-left">
              <div class="panel-header-icon bg-red-light text-red">
                <i class="mdi mdi-account-group-outline"></i>
              </div>
              <div>
                <h3 class="panel-title">Candidate Roster &amp; Issued Certificates</h3>
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
              All Candidates <span class="tab-count">{{ students.length }}</span>
            </button>
            <button
              type="button"
              :class="['filter-tab-btn', statusFilter === 'certified' ? 'active' : '']"
              @click="statusFilter = 'certified'"
            >
              <i class="mdi mdi-certificate text-emerald"></i>
              <span>Certified</span>
              <span class="tab-count count-emerald">{{ certifiedStudentsCount }}</span>
            </button>
            <button
              type="button"
              :class="['filter-tab-btn', statusFilter === 'passed' ? 'active' : '']"
              @click="statusFilter = 'passed'"
            >
              <i class="mdi mdi-check-circle text-emerald"></i>
              <span>Passed</span>
              <span class="tab-count count-emerald">{{ passedStudentsCount }}</span>
            </button>
            <button
              type="button"
              :class="['filter-tab-btn', statusFilter === 'failed' ? 'active' : '']"
              @click="statusFilter = 'failed'"
            >
              <i class="mdi mdi-close-circle text-red"></i>
              <span>Failed</span>
              <span class="tab-count count-red">{{ failedStudentsCount }}</span>
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

          <!-- Candidates Table -->
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
                <!-- Empty State (When 0 candidates found) -->
                <tr v-if="paginatedStudents.length === 0">
                  <td colspan="6" class="text-center py-16">
                    <div class="empty-state-box">
                      <div class="empty-icon-wrap">
                        <i class="mdi mdi-account-group-outline"></i>
                      </div>
                      <h4 class="empty-state-title">No Candidates Found</h4>
                      <p v-if="searchQuery" class="empty-state-desc">
                        No candidates match your search query &quot;{{ searchQuery }}&quot;.
                      </p>
                      <p v-else-if="statusFilter !== 'all'" class="empty-state-desc">
                        No candidates in this batch match the &quot;{{ statusFilter }}&quot; filter.
                      </p>
                      <p v-else class="empty-state-desc">
                        No candidates have been assigned or taken this examination session yet.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Candidate Rows -->
                <tr v-for="s in paginatedStudents" :key="s.assignment_id || s.student_id || s.student_email">
                  <!-- Candidate Name & Email -->
                  <td>
                    <div class="candidate-cell">
                      <div class="avatar-circle">
                        {{ getInitials(s.student_name) }}
                      </div>
                      <div>
                        <div class="font-semibold text-slate-900 leading-snug">{{ s.student_name }}</div>
                        <div class="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{{ s.student_email }}</span>
                          <span v-if="s.student_phone && s.student_phone !== 'N/A'" class="text-slate-400 font-mono">
                            &bull; {{ s.student_phone }}
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
                          s.exam_status === 'passed' ? 'chip-green' :
                          s.exam_status === 'failed' ? 'chip-red' :
                          s.exam_status === 'in_progress' ? 'chip-amber' : 'chip-slate'
                        ]"
                      >
                        <i
                          :class="[
                            'mdi',
                            s.exam_status === 'passed' ? 'mdi-check-circle' :
                            s.exam_status === 'failed' ? 'mdi-close-circle' :
                            s.exam_status === 'in_progress' ? 'mdi-clock-outline' : 'mdi-account-clock'
                          ]"
                        ></i>
                        {{ formatExamStatus(s.exam_status) }}
                      </span>
                      <span class="attempt-badge">
                        Attempt {{ s.attempts_used || 1 }}
                      </span>
                    </div>
                  </td>

                  <!-- Certificate Number -->
                  <td>
                    <div v-if="s.cert_number" class="cert-serial-box">
                      <code class="cert-code">{{ s.cert_number }}</code>
                      <button
                        type="button"
                        class="btn-copy-mini"
                        :title="copiedCertId === s.cert_number ? 'Copied!' : 'Copy Certificate Serial'"
                        @click="copyCert(s.cert_number)"
                      >
                        <i :class="['mdi', copiedCertId === s.cert_number ? 'mdi-check text-emerald' : 'mdi-content-copy']"></i>
                      </button>
                    </div>
                    <span v-else class="text-xs text-slate-400 italic">No Certificate Issued</span>
                  </td>

                  <!-- Issued Date -->
                  <td class="text-slate-500 font-medium text-xs">
                    {{ s.issued_at ? formatDate(s.issued_at) : '—' }}
                  </td>

                  <!-- Cert Status -->
                  <td>
                    <span
                      v-if="s.cert_number"
                      :class="[
                        'badge-chip',
                        s.cert_status === 'active' ? 'chip-green' :
                        s.cert_status === 'revoked' ? 'chip-red' : 'chip-amber'
                      ]"
                    >
                      <i :class="['mdi', s.cert_status === 'active' ? 'mdi-shield-check' : 'mdi-close-octagon']"></i>
                      {{ s.cert_status === 'active' ? 'Active Verified' : (s.cert_status === 'revoked' ? 'Revoked' : 'Pending') }}
                    </span>
                    <span v-else class="badge-chip chip-slate">PENDING</span>
                  </td>

                  <!-- Actions -->
                  <td class="text-right">
                    <div class="actions-cell justify-end">
                      <!-- Proctoring Audit Link -->
                      <NuxtLink
                        v-if="s.attempt_id"
                        :to="'/dashboard/admin/proctoring/' + s.attempt_id"
                        class="btn-action-icon"
                        title="View Proctoring Audit Log"
                      >
                        <i class="mdi mdi-shield-account-outline"></i>
                      </NuxtLink>

                      <!-- Download PDF Certificate -->
                      <button
                        v-if="s.cert_number"
                        type="button"
                        class="btn-action-icon btn-pdf"
                        title="Download Certificate PDF"
                        @click="downloadCert(s.cert_number)"
                      >
                        <i class="mdi mdi-file-pdf-box"></i>
                      </button>

                      <!-- Revoke Certificate Modal Trigger -->
                      <button
                        v-if="canManage && s.cert_number && s.cert_status === 'active'"
                        type="button"
                        class="btn-action-icon btn-danger-icon"
                        title="Revoke Certificate"
                        @click="openRevokeModal(s)"
                      >
                        <i class="mdi mdi-close-octagon-outline"></i>
                      </button>

                      <!-- Reissue Certificate Modal Trigger -->
                      <button
                        v-if="canManage && s.cert_number && s.cert_status === 'revoked'"
                        type="button"
                        class="btn-action-icon btn-success-icon"
                        title="Re-issue Certificate"
                        @click="openReissueModal(s)"
                      >
                        <i class="mdi mdi-refresh"></i>
                      </button>

                      <span v-if="!s.cert_number && !s.attempt_id" class="text-xs text-slate-400 font-medium">—</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination -->
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

      <!-- ═══ REVOKE CERTIFICATE CONFIRMATION MODAL ═══ -->
      <div v-if="showRevokeModal" class="modal-overlay" @click.self="showRevokeModal = false">
        <div class="modal-card modal-sm">
          <div class="modal-header">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-red-50 text-red flex items-center justify-center text-lg">
                <i class="mdi mdi-shield-alert-outline"></i>
              </div>
              <div>
                <h3 class="m-0 text-base font-semibold text-slate-900">Revoke Certificate</h3>
                <p class="m-0 text-xs text-slate-500">Invalidate credential permanently</p>
              </div>
            </div>
            <button class="modal-close-btn" @click="showRevokeModal = false"><i class="mdi mdi-close"></i></button>
          </div>
          <div class="modal-body py-4">
            <p class="text-sm text-slate-600 mb-3">
              Are you sure you want to revoke certificate <strong class="text-slate-900 font-mono">{{ targetStudent?.cert_number }}</strong> issued to
              <strong class="text-slate-900">{{ targetStudent?.student_name }}</strong>?
            </p>
            <div class="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              <i class="mdi mdi-alert-circle mr-1"></i>
              Public verification lookups for this serial ID will immediately show <strong>REVOKED</strong> status.
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showRevokeModal = false" :disabled="submittingAction">Cancel</button>
            <button class="btn-red" @click="confirmRevoke" :disabled="submittingAction">
              <span v-if="submittingAction" class="spinner-sm-white"></span>
              <span v-else>Confirm Revocation</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ═══ REISSUE CERTIFICATE CONFIRMATION MODAL ═══ -->
      <div v-if="showReissueModal" class="modal-overlay" @click.self="showReissueModal = false">
        <div class="modal-card modal-sm">
          <div class="modal-header">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald flex items-center justify-center text-lg">
                <i class="mdi mdi-refresh"></i>
              </div>
              <div>
                <h3 class="m-0 text-base font-semibold text-slate-900">Re-issue Certificate</h3>
                <p class="m-0 text-xs text-slate-500">Generate a new authentic credential</p>
              </div>
            </div>
            <button class="modal-close-btn" @click="showReissueModal = false"><i class="mdi mdi-close"></i></button>
          </div>
          <div class="modal-body py-4">
            <p class="text-sm text-slate-600 mb-3">
              Generate a replacement credential for <strong class="text-slate-900">{{ targetStudent?.student_name }}</strong>?
            </p>
            <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
              <i class="mdi mdi-information-outline mr-1"></i>
              A new unique certificate number will be generated and registered in the GSFIN central verification ledger.
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showReissueModal = false" :disabled="submittingAction">Cancel</button>
            <button class="btn-red bg-emerald hover:bg-emerald-700" @click="confirmReissue" :disabled="submittingAction">
              <span v-if="submittingAction" class="spinner-sm-white"></span>
              <span v-else>Confirm Re-issuance</span>
            </button>
          </div>
        </div>
      </div>

    </div>
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

const page = ref(1);
const perPage = ref(25);

const targetStudent = ref<any>(null);
const showRevokeModal = ref(false);
const showReissueModal = ref(false);
const submittingAction = ref(false);

const copiedBatchId = ref(false);
const copiedAllCerts = ref(false);
const copiedCertId = ref<string | null>(null);

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
  const id = batch.value.batch_id || batch.value.id;
  navigator.clipboard.writeText(id);
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
  const url = `/api/certs/${encodeURIComponent(certNumber)}/download`;
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
    await api.put(`/main-admin/certificates/${encodeURIComponent(targetStudent.value.cert_number)}/revoke`);
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
    s.attempts_used || 1,
    `"${s.cert_number || ''}"`,
    `"${s.issued_at ? formatDate(s.issued_at) : ''}"`,
    `"${s.cert_status || 'PENDING'}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Batch_${batch.value?.exam_name || 'Roster'}_${(batch.value?.batch_id || batchId.value).slice(0, 8)}.csv`);
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
  text-decoration: none;
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

.spinner-sm-white {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
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
  text-decoration: none;
  display: inline-block;
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
  background: rgba(227, 27, 35, 0.08);
  color: #E31B23;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  flex-shrink: 0;
  border: 1px solid rgba(227, 27, 35, 0.12);
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
  background: rgba(227, 27, 35, 0.08);
  color: #E31B23;
  font-weight: 600;
  font-size: 0.84rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(227, 27, 35, 0.12);
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

.btn-danger-icon:hover {
  background: #FEF2F2;
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.2);
}

.btn-success-icon:hover {
  background: #ECFDF5;
  color: #059669;
  border-color: rgba(16, 185, 129, 0.2);
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

/* ─── MODALS ─── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.modal-card {
  background: #FFFFFF;
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
  overflow: hidden;
  animation: modalIn 0.2s ease-out;
}

.modal-sm { max-width: 460px; }

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FAFAFD;
}

.modal-close-btn {
  background: none;
  border: none;
  color: #94A3B8;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
}

.modal-close-btn:hover {
  color: #0F172A;
}

.modal-body {
  padding: 24px;
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

.btn-cancel {
  padding: 9px 18px;
  border-radius: 12px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  color: #475569;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel:hover:not(:disabled) {
  background: #F1F5F9;
  color: #0F172A;
}

.btn-red {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  border-radius: 12px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(227, 27, 35, 0.2);
}

.btn-red:hover:not(:disabled) {
  background: #C41219;
  transform: translateY(-1px);
}

.btn-red:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fade-in {
  animation: fadeIn 0.25s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
