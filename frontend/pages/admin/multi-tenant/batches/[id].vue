<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ TOP BREADCRUMB & BACK NAVIGATION ═══ -->
      <div class="top-nav-bar mb-6">
        <div class="nav-left">
          <button class="btn-back" type="button" @click="handleBack">
            <i class="mdi mdi-arrow-left"></i>
            <span>Back to {{ batch?.org_name ? batch.org_name : 'Partner' }}</span>
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
      <div v-if="loading && !batch" class="text-center py-24 text-slate-500 font-medium">
        <span class="spinner-sm-red mb-2"></span>
        <p class="text-sm">Loading Exam Batch Candidate Roster &amp; Statistics...</p>
      </div>

      <!-- ═══ ERROR STATE ═══ -->
      <div v-else-if="error" class="p-8 bg-white border border-slate-200 rounded-2xl text-center max-w-lg mx-auto my-12">
        <div class="w-12 h-12 rounded-full bg-red-50 text-red flex items-center justify-center mx-auto mb-3 text-2xl">
          <i class="mdi mdi-alert-circle-outline"></i>
        </div>
        <h3 class="text-base font-semibold text-slate-900 mb-1">Unable to Load Batch Records</h3>
        <p class="text-xs text-slate-500 mb-4">{{ error }}</p>
        <button type="button" class="btn-red-action" @click="handleBack">
          Return to Partner Center
        </button>
      </div>

      <!-- ═══ BATCH MAIN CONTENT ═══ -->
      <div v-else-if="batch" class="space-y-6">

        <!-- ─── 1. BATCH EXECUTIVE HERO CARD ─── -->
        <div class="hero-batch-card">
          <div class="hero-left">
            <div class="hero-icon-box bg-indigo-light text-indigo">
              <i class="mdi mdi-layers-triple"></i>
            </div>
            <div class="hero-body">
              <div class="hero-title-row">
                <span
                  :class="[
                    'batch-status-pill',
                    batch.status === 'open' ? 'pill-green' :
                    batch.status === 'closed' ? 'pill-muted' : 'pill-amber'
                  ]"
                >
                  {{ batch.status ? batch.status.toUpperCase() : 'OPEN' }}
                </span>
                <h1 class="batch-exam-title">{{ batch.exam_name || 'Certification Exam Batch' }}</h1>
              </div>

              <div class="hero-meta-row">
                <span class="meta-item">
                  <i class="mdi mdi-office-building text-slate-400"></i>
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

                <span class="meta-item font-mono">
                  <span class="text-slate-400 font-sans">Batch ID:</span>
                  <code class="batch-code-badge">{{ batch.id }}</code>
                  <button
                    type="button"
                    class="copy-btn-sm"
                    :title="copiedBatchId ? 'Copied!' : 'Copy Batch ID'"
                    @click="copyBatchId"
                  >
                    <i :class="['mdi', copiedBatchId ? 'mdi-check text-emerald-600' : 'mdi-content-copy']"></i>
                  </button>
                </span>

                <span v-if="batch.duration_minutes" class="meta-item">
                  <i class="mdi mdi-clock-outline text-slate-400"></i>
                  <span>Duration: {{ batch.duration_minutes }} mins</span>
                </span>

                <span v-if="batch.created_at" class="meta-item">
                  <i class="mdi mdi-calendar-blank text-slate-400"></i>
                  <span>Created: {{ formatDate(batch.created_at) }}</span>
                </span>
              </div>
            </div>
          </div>

          <div class="hero-right">
            <button
              type="button"
              class="btn-glass text-xs py-2 px-3 inline-flex items-center gap-1.5"
              :disabled="assignments.length === 0"
              title="Export candidate roster to CSV"
              @click="exportCSV"
            >
              <i class="mdi mdi-file-delimited-outline"></i>
              <span>Export CSV Roster</span>
            </button>

            <NuxtLink
              v-if="batch.org_id"
              :to="'/admin/multi-tenant/' + batch.org_id"
              class="btn-glass text-xs py-2 px-3 inline-flex items-center gap-1.5 no-underline"
            >
              <i class="mdi mdi-office-building-outline"></i>
              <span>View Partner Profile</span>
            </NuxtLink>
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
              <span class="metric-value">{{ stats.total_candidates ?? assignments.length }}</span>
              <span class="metric-label">Enrolled Candidates</span>
              <span class="metric-sub text-indigo">Batch Total</span>
            </div>
          </div>

          <!-- Passed Candidates -->
          <div class="metric-card">
            <div class="metric-icon-box bg-emerald-light text-emerald">
              <i class="mdi mdi-check-decagram"></i>
            </div>
            <div class="metric-info">
              <span class="metric-value text-emerald">{{ stats.passed_count ?? passedCount }}</span>
              <span class="metric-label">Passed Sitting</span>
              <span class="metric-sub text-emerald">Exam Passed</span>
            </div>
          </div>

          <!-- Failed Candidates -->
          <div class="metric-card">
            <div class="metric-icon-box bg-red-light text-red">
              <i class="mdi mdi-close-circle-outline"></i>
            </div>
            <div class="metric-info">
              <span class="metric-value text-red">{{ stats.failed_count ?? failedCount }}</span>
              <span class="metric-label">Failed / Retake Required</span>
              <span class="metric-sub text-red">Needs Retest</span>
            </div>
          </div>

          <!-- Certified Students -->
          <div class="metric-card">
            <div class="metric-icon-box bg-emerald-light text-emerald">
              <i class="mdi mdi-certificate"></i>
            </div>
            <div class="metric-info">
              <span class="metric-value text-emerald">{{ stats.certified_count ?? certifiedCount }}</span>
              <span class="metric-label">Certified Holders</span>
              <span class="metric-sub text-emerald">Issued Credentials</span>
            </div>
          </div>
        </div>

        <!-- ─── 3. ENROLLED CANDIDATES ROSTER (ENGINEERED FOR 50-100+ STUDENTS) ─── -->
        <div class="panel-section-card">
          <div class="section-card-header flex-wrap gap-3">
            <div>
              <h3 class="text-sm font-semibold text-slate-900 m-0">Enrolled Candidates Roster</h3>
              <p class="text-xs text-slate-500 m-0 mt-0.5">
                Comprehensive candidate participation, examination sitting statuses, and issued certificate serials.
              </p>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                class="btn-roster-tool"
                :disabled="certifiedCount === 0"
                title="Copy all certificate numbers"
                @click="copyAllCerts"
              >
                <i :class="['mdi', copiedAllCerts ? 'mdi-check text-emerald-600' : 'mdi-content-copy']"></i>
                <span>{{ copiedAllCerts ? 'All Numbers Copied!' : 'Copy Certificate Numbers' }}</span>
              </button>
            </div>
          </div>

          <!-- Search & Filter Controls Bar -->
          <div class="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <!-- Search Input -->
            <div class="search-box flex-1 max-w-md">
              <i class="mdi mdi-magnify search-icon"></i>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search candidates by name, email, or certificate ID..."
                class="search-input"
              />
              <button v-if="searchQuery" type="button" class="search-clear-btn" @click="searchQuery = ''">
                <i class="mdi mdi-close-circle"></i>
              </button>
            </div>

            <!-- Status Tabs Filter -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <div class="status-tab-group">
                <button
                  type="button"
                  :class="['status-tab-btn', { active: statusFilter === 'all' }]"
                  @click="statusFilter = 'all'"
                >
                  All ({{ assignments.length }})
                </button>
                <button
                  type="button"
                  :class="['status-tab-btn', { active: statusFilter === 'passed' }]"
                  @click="statusFilter = 'passed'"
                >
                  Passed ({{ passedCount }})
                </button>
                <button
                  type="button"
                  :class="['status-tab-btn', { active: statusFilter === 'failed' }]"
                  @click="statusFilter = 'failed'"
                >
                  Failed ({{ failedCount }})
                </button>
                <button
                  type="button"
                  :class="['status-tab-btn', { active: statusFilter === 'in_progress' }]"
                  @click="statusFilter = 'in_progress'"
                >
                  In Progress ({{ inProgressCount }})
                </button>
                <button
                  type="button"
                  :class="['status-tab-btn', { active: statusFilter === 'not_started' }]"
                  @click="statusFilter = 'not_started'"
                >
                  Not Started ({{ notStartedCount }})
                </button>
              </div>
            </div>
          </div>

          <!-- Candidates Table -->
          <div class="table-responsive">
            <table class="gsfin-table">
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Attendance / Sitting Status</th>
                  <th>Attempts</th>
                  <th>Certificate Serial ID</th>
                  <th>Issued Date</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredAssignments.length === 0">
                  <td colspan="6" class="text-center py-16 text-slate-400">
                    <i class="mdi mdi-account-search-outline text-4xl block mb-2 text-slate-300"></i>
                    <div class="text-xs font-semibold text-slate-600">No candidates match your search or filter.</div>
                    <div v-if="searchQuery || statusFilter !== 'all'" class="text-xs text-slate-400 mt-1">
                      Try clearing your search query or switching filter tabs.
                    </div>
                  </td>
                </tr>

                <tr v-for="std in paginatedAssignments" :key="std.id || std.assignment_id">
                  <!-- Candidate Name & Email -->
                  <td>
                    <div class="flex items-center gap-3">
                      <div v-if="std.face_photo" class="candidate-avatar-img-wrap">
                        <img :src="backendUrl(std.face_photo)" alt="Candidate Face Photo" class="candidate-avatar-img" />
                      </div>
                      <div v-else class="candidate-avatar-initials">
                        {{ getInitials(std.student_name) }}
                      </div>
                      <div>
                        <div class="font-semibold text-slate-900 text-sm">{{ std.student_name || 'Candidate' }}</div>
                        <div class="text-xs text-slate-400 font-mono">{{ std.student_email }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Exam Status -->
                  <td>
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span :class="['chip-pill', getExamStatusPillClass(std.status)]">
                        {{ formatExamStatus(std.status) }}
                      </span>
                    </div>
                  </td>

                  <!-- Attempts Used -->
                  <td>
                    <span class="attempts-chip font-mono">
                      {{ std.attempts_used ?? std.attempts ?? 0 }} / {{ std.max_attempts ?? 2 }}
                    </span>
                  </td>

                  <!-- Certificate Serial ID -->
                  <td>
                    <div v-if="std.certificate_number || std.cert_number" class="cert-serial-cell">
                      <i class="mdi mdi-file-certificate text-red text-base"></i>
                      <span class="font-mono font-semibold text-slate-900 text-xs tracking-wider">
                        {{ std.certificate_number || std.cert_number }}
                      </span>
                      <button
                        type="button"
                        class="btn-copy-sm"
                        :title="copiedCertId === (std.certificate_number || std.cert_number) ? 'Copied!' : 'Copy Certificate Number'"
                        @click="copyCertId(std.certificate_number || std.cert_number)"
                      >
                        <i :class="['mdi', copiedCertId === (std.certificate_number || std.cert_number) ? 'mdi-check text-emerald-600' : 'mdi-content-copy']"></i>
                      </button>
                    </div>
                    <span v-else class="text-xs text-slate-400 italic">
                      No Certificate Issued
                    </span>
                  </td>

                  <!-- Issued Date -->
                  <td class="text-slate-500 font-medium text-xs whitespace-nowrap">
                    {{ std.issued_at ? formatDate(std.issued_at) : '—' }}
                  </td>

                  <!-- Actions -->
                  <td class="text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <!-- Download PDF Certificate -->
                      <a
                        v-if="std.certificate_url || std.pdf_url"
                        :href="backendUrl(std.certificate_url || std.pdf_url)"
                        target="_blank"
                        class="btn-icon-action btn-icon-view"
                        title="Download / View PDF Certificate"
                      >
                        <i class="mdi mdi-download"></i>
                      </a>

                      <!-- Direct Proctoring Audit Link (if available) -->
                      <NuxtLink
                        v-if="std.attempt_id"
                        :to="'/dashboard/admin/public-exams/proctoring/' + std.attempt_id"
                        class="btn-icon-action btn-icon-view"
                        title="View Candidate Proctoring Audit Telemetry"
                      >
                        <i class="mdi mdi-shield-search"></i>
                      </NuxtLink>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Controls -->
          <div class="p-4 border-t border-slate-100">
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'main_admin', 'sub_admin']
});

const route = useRoute();
const router = useRouter();
const api = useApi();
const batchId = route.params.id as string;

const loading = ref(true);
const error = ref<string | null>(null);
const batch = ref<any>(null);
const assignments = ref<any[]>([]);
const stats = ref<any>({});

const searchQuery = ref('');
const statusFilter = ref<'all' | 'passed' | 'failed' | 'in_progress' | 'not_started'>('all');
const page = ref(1);
const perPage = ref(25);

const copiedBatchId = ref(false);
const copiedCertId = ref<string | null>(null);
const copiedAllCerts = ref(false);

const handleBack = () => {
  if (batch.value?.org_id) {
    router.push(`/admin/multi-tenant/${batch.value.org_id}`);
  } else if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/admin/multi-tenant');
  }
};

const copyBatchId = async () => {
  try {
    await navigator.clipboard.writeText(batchId);
    copiedBatchId.value = true;
    setTimeout(() => { copiedBatchId.value = false; }, 2000);
  } catch (err) {
    console.error('Failed to copy batch ID', err);
  }
};

const copyCertId = async (certNum: string) => {
  try {
    await navigator.clipboard.writeText(certNum);
    copiedCertId.value = certNum;
    setTimeout(() => { copiedCertId.value = null; }, 2000);
  } catch (err) {
    console.error('Failed to copy cert number', err);
  }
};

const copyAllCerts = async () => {
  const certs = assignments.value
    .map(a => a.certificate_number || a.cert_number)
    .filter(Boolean);
  if (certs.length === 0) return;
  try {
    await navigator.clipboard.writeText(certs.join('\n'));
    copiedAllCerts.value = true;
    setTimeout(() => { copiedAllCerts.value = false; }, 2000);
  } catch (err) {
    console.error('Failed to copy all certs', err);
  }
};

// Summary metrics computed
const passedCount = computed(() => assignments.value.filter(a => a.status === 'passed').length);
const failedCount = computed(() => assignments.value.filter(a => a.status === 'failed').length);
const inProgressCount = computed(() => assignments.value.filter(a => a.status === 'in_progress').length);
const notStartedCount = computed(() => assignments.value.filter(a => a.status === 'not_started' || !a.status).length);
const certifiedCount = computed(() => assignments.value.filter(a => !!(a.certificate_number || a.cert_number)).length);

// Filtered & Paginated candidates
const filteredAssignments = computed(() => {
  let list = assignments.value || [];
  if (statusFilter.value !== 'all') {
    if (statusFilter.value === 'not_started') {
      list = list.filter(a => a.status === 'not_started' || !a.status);
    } else {
      list = list.filter(a => a.status === statusFilter.value);
    }
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(a => {
      const name = (a.student_name || '').toLowerCase();
      const email = (a.student_email || '').toLowerCase();
      const cert = (a.certificate_number || a.cert_number || '').toLowerCase();
      return name.includes(q) || email.includes(q) || cert.includes(q);
    });
  }
  return list;
});

const paginatedAssignments = computed(() => {
  const start = (page.value - 1) * perPage.value;
  return filteredAssignments.value.slice(start, start + perPage.value);
});

watch([searchQuery, statusFilter], () => {
  page.value = 1;
});

const backendUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const config = useRuntimeConfig();
  return `${config.public.apiBase.replace('/api', '')}${path}`;
};

const getInitials = (name?: string) => {
  if (!name) return 'CA';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatExamStatus = (status?: string) => {
  if (!status || status === 'not_started') return 'NOT STARTED';
  if (status === 'in_progress') return 'IN PROGRESS';
  return status.toUpperCase();
};

const getExamStatusPillClass = (status?: string) => {
  switch (status) {
    case 'passed': return 'chip-green';
    case 'failed': return 'chip-red';
    case 'in_progress': return 'chip-amber';
    default: return 'chip-muted';
  }
};

const fetchBatchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await api.get(`/main-admin/batches/${batchId}`);
    batch.value = data.batch || null;
    assignments.value = data.assignments || [];
    stats.value = data.stats || {};
  } catch (err: any) {
    console.error('Failed to load batch data:', err);
    error.value = err.response?.data?.message || err.message || 'Unable to load batch details.';
  } finally {
    loading.value = false;
  }
};

const exportCSV = () => {
  if (assignments.value.length === 0) return;
  const headers = ['Candidate Name', 'Candidate Email', 'Phone', 'Exam Status', 'Attempts Used', 'Certificate ID', 'Issued Date'];
  const rows = assignments.value.map(a => [
    `"${(a.student_name || '').replace(/"/g, '""')}"`,
    `"${(a.student_email || '').replace(/"/g, '""')}"`,
    `"${(a.student_phone || '').replace(/"/g, '""')}"`,
    `"${a.status || 'not_started'}"`,
    `"${a.attempts_used || a.attempts || 0}"`,
    `"${a.certificate_number || a.cert_number || ''}"`,
    `"${a.issued_at ? new Date(a.issued_at).toLocaleDateString() : ''}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Batch_${batchId.slice(0, 8)}_Candidates_Roster.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(async () => {
  await fetchBatchData();
});
</script>

<style scoped>
.gsfin-admin-page {
  background: #F8FAFC;
  min-height: 100vh;
  padding: 24px;
}

.admin-wrap {
  max-width: 1400px;
  margin: 0 auto;
}

/* ═══ TOP NAV BAR ═══ */
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
  gap: 16px;
  flex-wrap: wrap;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 10px;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}
.btn-back:hover {
  background: #F1F5F9;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.15);
}

.breadcrumb-trail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 600;
}
.bc-link {
  color: #64748B;
  text-decoration: none;
  transition: color 0.15s ease;
}
.bc-link:hover {
  color: #C9252C;
}
.bc-sep {
  color: #CBD5E1;
  font-size: 0.9rem;
}
.bc-current {
  color: #0F172A;
}

.btn-icon-refresh {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}
.btn-icon-refresh:hover:not(:disabled) {
  background: #F1F5F9;
  color: #0F172A;
}
.btn-icon-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ═══ HERO BATCH CARD ═══ */
.hero-batch-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  padding: 22px 26px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.hero-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
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

.hero-meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: #64748B;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.batch-code-badge {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 2px 7px;
  border-radius: 6px;
  color: #0F172A;
  font-size: 0.75rem;
  font-family: monospace;
  font-weight: 600;
  user-select: all;
}

.bg-indigo-light { background: #EEF2FF; }
.text-indigo { color: #4F46E5; }
.bg-emerald-light { background: #ECFDF5; }
.text-emerald { color: #059669; }
.bg-red-light { background: #FEF2F2; }
.text-red { color: #E31B23; }

.batch-exam-title {
  font-size: 1.35rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  letter-spacing: -0.01em;
}

.batch-status-pill {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 3px 9px;
  border-radius: 50px;
  text-transform: uppercase;
}

.copy-btn-sm {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  color: #64748B;
  display: inline-flex;
  align-items: center;
  transition: color 0.15s ease;
}
.copy-btn-sm:hover {
  color: #0F172A;
}

.btn-glass {
  background: #FFFFFF;
  color: #475569;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
}
.btn-glass:hover:not(:disabled) {
  background: #F1F5F9;
  color: #0F172A;
}
.btn-glass:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-red-action {
  padding: 8px 18px;
  background: #C9252C;
  color: #FFFFFF;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-red-action:hover {
  background: #B01E24;
}

/* ═══ 2. METRICS GRID (EXPLICIT 4-COL CSS) ═══ */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
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
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
}

.metric-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.metric-info {
  display: flex;
  flex-direction: column;
}

.metric-value {
  font-size: 24px;
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

/* ═══ PANEL SECTION CARD ═══ */
.panel-section-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02);
  overflow: hidden;
}

.section-card-header {
  padding: 18px 24px;
  background: #FFFFFF;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-roster-tool {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  font-size: 0.74rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-roster-tool:hover:not(:disabled) {
  background: #F1F5F9;
  color: #0F172A;
}
.btn-roster-tool:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ═══ SEARCH & FILTERS BAR ═══ */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 12px;
  color: #94A3B8;
  font-size: 1.1rem;
}
.search-input {
  width: 100%;
  padding: 8px 36px 8px 38px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  font-size: 0.8rem;
  color: #0F172A;
  outline: none;
  transition: border-color 0.15s ease;
}
.search-input:focus {
  border-color: #C9252C;
}
.search-clear-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  padding: 2px;
}
.search-clear-btn:hover {
  color: #0F172A;
}

.status-tab-group {
  display: inline-flex;
  background: #E2E8F0;
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
}
.status-tab-btn {
  padding: 5px 11px;
  font-size: 0.72rem;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.status-tab-btn:hover {
  color: #0F172A;
}
.status-tab-btn.active {
  background: #FFFFFF;
  color: #0F172A;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

/* ═══ CANDIDATE CELL & AVATAR ═══ */
.candidate-avatar-img-wrap {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.1);
  flex-shrink: 0;
}
.candidate-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.candidate-avatar-initials {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(201, 37, 44, 0.08);
  color: #C9252C;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 600;
  flex-shrink: 0;
}

/* ═══ CERT SERIAL CELL ═══ */
.cert-serial-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-copy-sm {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  color: #94A3B8;
  display: inline-flex;
  align-items: center;
  font-size: 0.88rem;
  transition: color 0.15s ease;
}
.btn-copy-sm:hover {
  color: #0F172A;
}

.attempts-chip {
  display: inline-block;
  padding: 2px 8px;
  background: #F1F5F9;
  color: #475569;
  border-radius: 6px;
  font-size: 0.74rem;
  font-weight: 600;
}

/* ═══ ACTION BUTTONS ═══ */
.btn-icon-action {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
}
.btn-icon-view {
  background: #F1F5F9;
  color: #475569;
  border: 1px solid rgba(15, 23, 42, 0.08);
}
.btn-icon-view:hover {
  background: #E2E8F0;
  color: #0F172A;
}

/* ═══ PILL CHIPS ═══ */
.chip-pill {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: 50px;
  text-transform: uppercase;
  display: inline-block;
}
.pill-green, .chip-green {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}
.pill-red, .chip-red {
  background: #FEF2F2;
  color: #DC2626;
}
.pill-amber, .chip-amber {
  background: #FFFBEB;
  color: #D97706;
}
.pill-muted, .chip-muted {
  background: #F1F5F9;
  color: #64748B;
}

/* ═══ SPINNER ═══ */
.spinner-sm-red {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 2px solid rgba(201, 37, 44, 0.2);
  border-top-color: #C9252C;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.spin-icon {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

