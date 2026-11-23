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
            <NuxtLink to="/dashboard/admin/certificates" class="bc-link">Partner Centers</NuxtLink>
            <i class="mdi mdi-chevron-right bc-sep"></i>
            <span class="bc-link text-slate-600">{{ partner?.name || 'Partner Center' }}</span>
            <i class="mdi mdi-chevron-right bc-sep"></i>
            <span class="bc-current">Issued Certificates</span>
          </div>
        </div>

        <div class="nav-right">
          <button class="btn-icon-refresh" title="Refresh Partner Certificates" @click="fetchPartnerData" :disabled="loading">
            <i :class="['mdi', 'mdi-refresh', { 'spin-icon': loading }]"></i>
          </button>
        </div>
      </div>

      <!-- ═══ LOADING STATE ═══ -->
      <div v-if="loading && !partner" class="state-card text-center py-20">
        <span class="spinner-sm-red"></span>
        <p class="loading-text mt-3">Loading Partner Official Certificates &amp; Records...</p>
      </div>

      <!-- ═══ ERROR STATE ═══ -->
      <div v-else-if="error" class="error-state-card">
        <div class="error-icon-box">
          <i class="mdi mdi-alert-circle-outline"></i>
        </div>
        <h3 class="error-title">Unable to Load Partner Records</h3>
        <p class="error-desc">{{ error }}</p>
        <NuxtLink to="/dashboard/admin/certificates" class="btn-return">
          Return to Certificates
        </NuxtLink>
      </div>

      <!-- ═══ MAIN CONTENT ═══ -->
      <div v-else-if="partner" class="fade-in space-y-6">

        <!-- ─── 1. PARTNER EXECUTIVE HERO CARD ─── -->
        <div class="hero-card">
          <div class="hero-left">
            <div class="partner-avatar">
              <i class="mdi mdi-domain"></i>
            </div>
            <div class="partner-meta">
              <div class="hero-title-row">
                <h1 class="partner-title">{{ partner.name }}</h1>
                <span
                  :class="[
                    'status-badge',
                    partner.status === 'active' ? 'badge-active' : 'badge-amber'
                  ]"
                >
                  <span class="pulse-dot"></span>
                  {{ partner.status === 'active' ? 'Accredited Center' : partner.status }}
                </span>
                <span class="partner-type-tag">{{ partner.institution_type || 'Authorized Training Center' }}</span>
              </div>

              <div class="meta-tags-row">
                <span class="meta-pill">
                  <i class="mdi mdi-email-outline"></i>
                  <span>{{ partner.contact_email || partner.email || 'portal@gsfin.org' }}</span>
                </span>

                <span v-if="partner.contact_phone && partner.contact_phone !== 'N/A'" class="meta-pill">
                  <i class="mdi mdi-phone-outline"></i>
                  <span>{{ partner.contact_phone }}</span>
                </span>

                <span class="meta-pill">
                  <i class="mdi mdi-map-marker-outline"></i>
                  <span>{{ partner.city || 'International' }}, {{ partner.country || 'Global' }}</span>
                </span>

                <span class="meta-pill">
                  <i class="mdi mdi-fingerprint"></i>
                  <span class="text-slate-400">Partner ID:</span>
                  <code class="partner-code-badge">{{ (partner.id || partnerId).slice(0, 12) }}</code>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── 2. KPI METRICS CARDS ─── -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon-box bg-emerald-light">
              <i class="mdi mdi-certificate text-emerald"></i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Total Certificates</span>
              <span class="metric-value">{{ stats.total_certificates ?? certificates.length }}</span>
              <span class="metric-sub text-emerald">Official Credentials</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon-box bg-indigo-light">
              <i class="mdi mdi-shield-check text-indigo"></i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Active Verified</span>
              <span class="metric-value">{{ activeCount }}</span>
              <span class="metric-sub text-indigo">Valid Credentials</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon-box bg-red-light">
              <i class="mdi mdi-close-octagon text-red"></i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Revoked</span>
              <span class="metric-value">{{ revokedCount }}</span>
              <span class="metric-sub text-red">Invalidated Records</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon-box bg-amber-light">
              <i class="mdi mdi-file-document-outline text-amber"></i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Verification Rate</span>
              <span class="metric-value">{{ verificationRate }}</span>
              <span class="metric-sub text-amber">QR Code Audited</span>
            </div>
          </div>
        </div>

        <!-- ─── 3. CERTIFICATES DATA PANEL ─── -->
        <div class="panel-card">
          <div class="panel-card-header">
            <div class="panel-filter-row">
              <div class="search-input-wrap">
                <i class="mdi mdi-magnify search-icon"></i>
                <input
                  v-model="search"
                  type="text"
                  placeholder="Search candidate name, email, cert ID, exam..."
                  class="table-search-input"
                />
              </div>

              <select v-model="statusFilter" class="table-select-filter">
                <option value="All">All Statuses</option>
                <option value="active">Active Verified</option>
                <option value="revoked">Revoked Records</option>
              </select>

              <button
                type="button"
                class="btn-glass-sm"
                title="Export Certificates Roster CSV"
                @click="exportCsv"
                :disabled="filteredCertificates.length === 0"
              >
                <i class="mdi mdi-download"></i>
                <span>Export CSV</span>
              </button>
            </div>

            <span class="count-badge">
              Total: {{ filteredCertificates.length }} Certificates
            </span>
          </div>

          <!-- Table Container -->
          <div class="table-responsive">
            <table class="gsfin-table">
              <thead>
                <tr>
                  <th>Certificate ID</th>
                  <th>Candidate / Student</th>
                  <th>Examination / Course</th>
                  <th>Issue Date</th>
                  <th>Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="6" class="text-center py-12 text-slate-500 font-medium">
                    <span class="spinner-sm-red"></span> Loading Certificate Records...
                  </td>
                </tr>
                <tr v-else-if="filteredCertificates.length === 0">
                  <td colspan="6" class="text-center py-14 text-slate-500">
                    <i class="mdi mdi-file-certificate-outline text-4xl block mb-2 text-slate-400"></i>
                    No Certificates Found for {{ partner.name }}
                  </td>
                </tr>
                <tr v-for="item in paginatedCertificates" :key="item.certificate_id || item.cert_number">
                  <td>
                    <div class="flex items-center gap-2">
                      <i class="mdi mdi-file-certificate text-red text-lg"></i>
                      <span class="font-mono font-semibold text-slate-900 text-xs tracking-wider">{{ item.cert_number }}</span>
                      <button
                        class="btn-copy-id"
                        :title="copySuccessId === item.cert_number ? 'Copied!' : 'Copy Certificate Number'"
                        @click="copyToClipboard(item.cert_number)"
                      >
                        <i :class="['mdi', copySuccessId === item.cert_number ? 'mdi-check text-emerald' : 'mdi-content-copy']"></i>
                      </button>
                    </div>
                  </td>
                  <td>
                    <div class="flex items-center gap-2.5">
                      <div class="candidate-avatar">
                        {{ getInitials(item.student_name) }}
                      </div>
                      <div>
                        <div class="font-semibold text-slate-900 text-sm">{{ item.student_name || 'Candidate' }}</div>
                        <div class="text-xs text-slate-400 font-medium">{{ item.student_email }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="font-semibold text-slate-800 text-sm">{{ item.exam_name || 'Certification Exam' }}</div>
                  </td>
                  <td class="text-slate-500 font-medium text-xs whitespace-nowrap">
                    {{ formatDate(item.issued_at) }}
                  </td>
                  <td>
                    <span :class="['chip-pill', item.cert_status === 'revoked' ? 'chip-red' : 'chip-green']">
                      {{ item.cert_status === 'revoked' ? 'Revoked' : 'Active Verified' }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="action-btn-group justify-end">
                      <button
                        class="btn-icon-action btn-icon-view"
                        title="Download Official PDF Certificate"
                        @click="downloadCert(item.cert_number)"
                      >
                        <i class="mdi mdi-download"></i>
                      </button>
                      <button
                        v-if="item.cert_status === 'active' && canManage"
                        class="btn-icon-action btn-icon-delete"
                        title="Revoke Certificate"
                        @click="confirmRevoke(item)"
                      >
                        <i class="mdi mdi-close-octagon"></i>
                      </button>
                      <button
                        v-if="item.cert_status === 'revoked' && canManage"
                        class="btn-icon-action btn-icon-warn"
                        title="Re-issue Certificate"
                        @click="confirmReissue(item)"
                      >
                        <i class="mdi mdi-refresh"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <AppPagination
              v-if="filteredCertificates.length > 0"
              v-model="page"
              v-model:items-per-page="perPage"
              :total-items="filteredCertificates.length"
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

const partnerId = computed(() => String(route.params.id || ''));

const loading = ref(false);
const error = ref<string | null>(null);
const partner = ref<any>(null);
const certificates = ref<any[]>([]);
const batches = ref<any[]>([]);
const stats = ref<any>({});
const search = ref('');
const statusFilter = ref('All');
const copySuccessId = ref<string | null>(null);

// Pagination
const page = ref(1);
const perPage = ref(10);

const canManage = computed(() => {
  const role = authStore.userRole;
  return role === 'super_admin' || role === 'main_admin';
});

const activeCount = computed(() => certificates.value.filter(c => c.cert_status !== 'revoked').length);
const revokedCount = computed(() => certificates.value.filter(c => c.cert_status === 'revoked').length);
const verificationRate = computed(() => {
  if (!certificates.value || certificates.value.length === 0) return '0%';
  const rate = Math.round((activeCount.value / certificates.value.length) * 100);
  return `${rate}%`;
});

const filteredCertificates = computed(() => {
  let list = certificates.value || [];
  if (statusFilter.value !== 'All') {
    list = list.filter(c => c.cert_status === statusFilter.value);
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase().trim();
    list = list.filter(c =>
      (c.cert_number || '').toLowerCase().includes(q) ||
      (c.student_name || '').toLowerCase().includes(q) ||
      (c.student_email || '').toLowerCase().includes(q) ||
      (c.exam_name || '').toLowerCase().includes(q) ||
      (c.batch_id || '').toLowerCase().includes(q)
    );
  }
  return list;
});

const paginatedCertificates = computed(() => {
  const start = (page.value - 1) * perPage.value;
  return filteredCertificates.value.slice(start, start + perPage.value);
});

watch([search, statusFilter], () => {
  page.value = 1;
});

async function fetchPartnerData() {
  if (!partnerId.value) return;
  loading.value = true;
  error.value = null;
  try {
    const res: any = await api.get(`/main-admin/certificates/partners/${partnerId.value}`);
    partner.value = res.partner || res.data?.partner;
    certificates.value = res.certificates || res.data?.certificates || [];
    batches.value = res.batches || res.data?.batches || [];
    stats.value = res.stats || res.data?.stats || {};
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to load partner certificate records.';
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
  if (!name) return 'CD';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const copyToClipboard = async (text: string) => {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copySuccessId.value = text;
    setTimeout(() => {
      if (copySuccessId.value === text) {
        copySuccessId.value = null;
      }
    }, 2000);
  } catch (err) {
    console.error('Copy failed:', err);
  }
};

const downloadCert = async (certNumber: string) => {
  if (!certNumber) return;
  try {
    const res = await api.get(`/main-admin/certificates/${encodeURIComponent(certNumber)}/download`, { responseType: 'blob' });
    const blob = new Blob([res.data || res], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GSFIN-Certificate-${certNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.warn('Blob download fallback, opening direct URL:', err);
    window.open(`/api/main-admin/certificates/${encodeURIComponent(certNumber)}/download`, '_blank');
  }
};

const confirmRevoke = async (item: any) => {
  if (!confirm(`Are you sure you want to revoke certificate ${item.cert_number} for ${item.student_name}?`)) return;
  try {
    await api.put(`/main-admin/certificates/${item.cert_number}/revoke`);
    await fetchPartnerData();
  } catch (err) {
    alert('Failed to revoke certificate');
  }
};

const confirmReissue = async (item: any) => {
  if (!confirm(`Are you sure you want to re-issue certificate ${item.cert_number} for ${item.student_name}? This will generate a new credential.`)) return;
  try {
    const res = await api.post<any>(`/main-admin/certificates/${item.cert_number}/reissue`);
    alert(`Re-issued successfully. New Certificate ID: ${res.data?.newCertNumber}`);
    await fetchPartnerData();
  } catch (err) {
    alert('Failed to re-issue certificate');
  }
};

function exportCsv() {
  if (filteredCertificates.value.length === 0) return;
  const headers = ['Certificate ID', 'Student Name', 'Student Email', 'Exam Name', 'Batch ID', 'Issue Date', 'Status'];
  const rows = filteredCertificates.value.map(c => [
    c.cert_number,
    `"${(c.student_name || '').replace(/"/g, '""')}"`,
    c.student_email || '',
    `"${(c.exam_name || '').replace(/"/g, '""')}"`,
    c.batch_id || '',
    formatDate(c.issued_at),
    c.cert_status || 'active'
  ]);
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${partner.value?.name || 'Partner'}_Certificates.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

onMounted(() => {
  fetchPartnerData();
});
</script>

<style scoped>
.gsfin-admin-page {
  padding: 0;
  background: #FAFAFD;
  min-height: 100vh;
  box-sizing: border-box;
}
.admin-wrap {
  max-width: 1400px;
  margin: 0 auto;
}

/* Top Nav Bar */
.top-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
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
  gap: 6px;
  padding: 8px 16px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  color: #334155;
  font-size: 0.84rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}
.btn-back:hover {
  background: #F8FAFC;
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.3);
}
.breadcrumb-trail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}
.bc-link {
  color: #64748B;
  text-decoration: none;
  font-weight: 500;
}
.bc-link:hover { color: #E31B23; }
.bc-sep { color: #94A3B8; font-size: 1rem; }
.bc-current { color: #0F172A; font-weight: 600; }

.btn-icon-refresh {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #FFFFFF;
  color: #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-icon-refresh:hover {
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.3);
}
.spin-icon { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Hero Card */
.hero-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.02);
  margin-bottom: 24px;
}
.hero-left {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
}
.partner-avatar {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(227, 27, 35, 0.08) 0%, rgba(227, 27, 35, 0.16) 100%);
  border: 1px solid rgba(227, 27, 35, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: #E31B23;
  flex-shrink: 0;
}
.partner-meta { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.hero-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.partner-title {
  font-size: 1.45rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  letter-spacing: -0.01em;
}
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 12px;
  border-radius: 50px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.badge-active { background: rgba(16, 185, 129, 0.1); color: #059669; }
.badge-amber { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.partner-type-tag {
  font-size: 0.74rem;
  font-weight: 600;
  color: #64748B;
  background: #F1F5F9;
  padding: 3px 12px;
  border-radius: 50px;
}
.meta-tags-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 0.82rem;
  color: #64748B;
}
.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.meta-pill i { color: #94A3B8; font-size: 0.95rem; }
.partner-code-badge {
  background: #F1F5F9;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  color: #0F172A;
}

/* KPI Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}
@media (max-width: 1024px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .metrics-grid { grid-template-columns: 1fr; } }

.metric-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 22px 24px;
  display: flex;
  align-items: flex-start;
  gap: 18px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.02);
}
.metric-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.55rem;
  flex-shrink: 0;
}
.bg-emerald-light { background: rgba(16, 185, 129, 0.1); }
.text-emerald { color: #059669; }
.bg-indigo-light { background: rgba(99, 102, 241, 0.1); }
.text-indigo { color: #4F46E5; }
.bg-red-light { background: rgba(227, 27, 35, 0.08); }
.text-red { color: #E31B23; }
.bg-amber-light { background: rgba(245, 158, 11, 0.1); }
.text-amber { color: #D97706; }

.metric-info { display: flex; flex-direction: column; }
.metric-label { font-size: 0.78rem; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.04em; }
.metric-value { font-size: 1.7rem; font-weight: 600; color: #0F172A; margin: 4px 0 2px 0; line-height: 1.1; }
.metric-sub { font-size: 0.74rem; font-weight: 500; }

/* Panel Card */
.panel-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  box-shadow: 0 3px 14px rgba(15, 23, 42, 0.02);
  overflow: hidden;
  margin-bottom: 24px;
}
.panel-card-header {
  padding: 18px 24px;
  background: #FFFFFF;
  border-bottom: 1px solid rgba(15, 23, 42, 0.07);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.panel-filter-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 14px;
  color: #94A3B8;
  font-size: 1.15rem;
}
.table-search-input {
  padding: 9px 14px 9px 40px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  font-size: 0.86rem;
  color: #0F172A;
  outline: none;
  width: 290px;
  transition: border-color 0.2s;
}
.table-search-input:focus { border-color: #E31B23; }

.table-select-filter {
  padding: 9px 14px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  font-size: 0.86rem;
  font-weight: 600;
  color: #0F172A;
  outline: none;
  cursor: pointer;
}
.btn-glass-sm {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 12px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-glass-sm:hover:not(:disabled) {
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.3);
  background: #F8FAFC;
}
.count-badge {
  padding: 6px 16px;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #F1F5F9;
  color: #475569;
}

/* Table */
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
  padding: 12px 18px;
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
  padding: 14px 18px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
  font-size: 0.86rem;
  color: #334155;
  vertical-align: middle;
}
.gsfin-table tbody tr:hover {
  background: #F8FAFD;
}

.candidate-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #F1F5F9;
  color: #334155;
  font-weight: 600;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chip-pill {
  padding: 5px 12px;
  border-radius: 50px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  display: inline-block;
  letter-spacing: 0.03em;
}
.chip-green { background: rgba(16, 185, 129, 0.1); color: #059669; }
.chip-red { background: rgba(239, 68, 68, 0.1); color: #DC2626; }

.action-btn-group { display: inline-flex; align-items: center; gap: 8px; }
.btn-icon-action {
  width: 36px; height: 36px; border-radius: 10px; border: none;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 1.1rem; cursor: pointer; transition: all 0.18s ease;
}
.btn-icon-view { background: rgba(59, 130, 246, 0.1); color: #2563EB; }
.btn-icon-view:hover { background: #2563EB; color: #FFFFFF; }
.btn-icon-warn { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.btn-icon-warn:hover { background: #D97706; color: #FFFFFF; }
.btn-icon-delete { background: rgba(239, 68, 68, 0.1); color: #DC2626; }
.btn-icon-delete:hover { background: #DC2626; color: #FFFFFF; }

.btn-copy-id {
  background: transparent;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: all 0.15s ease;
}
.btn-copy-id:hover {
  color: #E31B23;
  background: rgba(227, 27, 35, 0.06);
}

/* States */
.state-card, .error-state-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 48px;
  text-align: center;
}
.error-icon-box {
  width: 56px; height: 56px; border-radius: 16px;
  background: #FEF2F2; color: #DC2626;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 1.8rem; margin-bottom: 14px;
}
.error-title { font-size: 1.2rem; font-weight: 600; color: #0F172A; margin: 0 0 6px 0; }
.error-desc { font-size: 0.88rem; color: #64748B; margin-bottom: 20px; }
.btn-return {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 22px; background: #E31B23; color: #FFFFFF;
  border-radius: 12px; font-weight: 600; font-size: 0.85rem; text-decoration: none;
}
.spinner-sm-red { width: 18px; height: 18px; border: 2px solid rgba(227, 27, 35, 0.2); border-top-color: #E31B23; border-radius: 50%; animation: spin 0.75s linear infinite; display: inline-block; }
</style>

