<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ TOP HEADER ROW ═══ -->
      <div class="admin-header-row">
        <div>
          <div class="eyebrow-chip mb-1">
            <i class="mdi mdi-certificate-outline"></i> CREDENTIAL &amp; CERTIFICATION GOVERNANCE
          </div>
          <h1 class="admin-title">Certificate Management</h1>
          <p class="admin-subtitle">View, issue, revoke, and re-issue verifiable digital credentials and qualification certificates.</p>
        </div>

        <div class="header-actions">
          <NuxtLink to="/dashboard/admin/certificate-template" class="btn-glass">
            <i class="mdi mdi-palette-outline"></i> Template Editor
          </NuxtLink>
          <button v-if="canManage" class="btn-red" @click="showIssueModal = true">
            <i class="mdi mdi-plus"></i> Issue Certificate
          </button>
        </div>
      </div>

      <!-- ═══ KPI METRIC STATS ═══ -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon bg-emerald-light">
            <i class="mdi mdi-certificate text-emerald"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Total Certificates</span>
            <span class="kpi-value">{{ certs.length }}</span>
            <span class="kpi-sub text-emerald">Issued Credentials</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon bg-indigo-light">
            <i class="mdi mdi-shield-check text-indigo"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Active Verified</span>
            <span class="kpi-value">{{ activeCount }}</span>
            <span class="kpi-sub text-indigo">Authentic Credentials</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon bg-red-light">
            <i class="mdi mdi-close-octagon text-red"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Revoked Status</span>
            <span class="kpi-value">{{ revokedCount }}</span>
            <span class="kpi-sub text-red">Invalidated Records</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon bg-amber-light">
            <i class="mdi mdi-file-document-outline text-amber"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">Verification Rate</span>
            <span class="kpi-value">{{ verificationRate }}</span>
            <span class="kpi-sub text-amber">QR Code Audited</span>
          </div>
        </div>
      </div>

      <!-- Modal Container -->
      <IssueCertificateModal v-model="showIssueModal" @issued="loadCerts" />

      <!-- ═══ CERTIFICATES DATA TABLE ═══ -->
      <div class="panel-card">
        <div class="panel-card-header">
          <div class="panel-filter-row">
            <div class="search-input-wrap">
              <i class="mdi mdi-magnify search-icon"></i>
              <input
                v-model="search"
                type="text"
                placeholder="Search student, course, or Cert ID..."
                class="table-search-input"
              />
            </div>

            <select v-model="statusFilter" class="table-select-filter">
              <option value="All">All Statuses</option>
              <option value="active">Active Verified</option>
              <option value="revoked">Revoked Records</option>
            </select>
          </div>

          <span class="count-badge">Total: {{ filteredCerts.length }} Certificates</span>
        </div>

        <div class="table-responsive">
          <table class="gsfin-table">
            <thead>
              <tr>
                <th>Certificate Serial ID</th>
                <th>Candidate / Student</th>
                <th>Qualification / Course</th>
                <th>Issued Date</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="6" class="text-center py-10 text-slate-500 font-medium">
                  <span class="spinner-sm-red"></span> Loading Issued Certificates...
                </td>
              </tr>
              <tr v-else-if="filteredCerts.length === 0">
                <td colspan="6" class="text-center py-12 text-slate-500">
                  <i class="mdi mdi-file-certificate-outline text-4xl block mb-2 text-slate-400"></i>
                  No Certificate Records Found
                </td>
              </tr>
              <tr v-for="item in filteredCerts" :key="item.cert_number">
                <td>
                  <div class="flex items-center gap-2">
                    <i class="mdi mdi-file-certificate text-red text-lg"></i>
                    <span class="font-mono font-bold text-slate-900 text-xs tracking-wider">{{ item.cert_number }}</span>
                  </div>
                </td>
                <td>
                  <div class="font-bold text-slate-900 text-sm">{{ item.student_name || 'Candidate Holder' }}</div>
                  <div class="text-xs text-slate-400 font-medium">{{ item.email }}</div>
                </td>
                <td>
                  <div class="font-bold text-slate-800 text-sm">{{ item.course_title || 'Qualification Exam' }}</div>
                </td>
                <td class="text-slate-500 font-medium text-xs whitespace-nowrap">
                  {{ formatDate(item.issued_at) }}
                </td>
                <td>
                  <span :class="['chip-pill', item.status === 'revoked' ? 'chip-red' : 'chip-green']">
                    {{ item.status || 'active' }}
                  </span>
                </td>
                <td class="text-right">
                  <div class="action-btn-group">
                    <button class="btn-icon-action btn-icon-view" title="Download PDF Certificate" @click="downloadCert(item.cert_number)">
                      <i class="mdi mdi-download"></i>
                    </button>
                    <button
                      v-if="item.status === 'active' && canManage"
                      class="btn-icon-action btn-icon-delete"
                      title="Revoke Certificate"
                      @click="confirmRevoke(item)"
                    >
                      <i class="mdi mdi-close-octagon"></i>
                    </button>
                    <button
                      v-if="item.status === 'revoked' && canManage"
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
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { useAuthStore } from '@/stores/auth';
import IssueCertificateModal from '@/components/admin/IssueCertificateModal.vue';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  roles: ['super_admin', 'main_admin', 'sub_admin', 'tutor']
});

const api = useApi();
const authStore = useAuthStore();

const certs = ref<any[]>([]);
const loading = ref(false);
const showIssueModal = ref(false);
const search = ref('');
const statusFilter = ref('All');

const canManage = computed(() => {
  const role = authStore.userRole;
  return role === 'super_admin' || role === 'main_admin';
});

const activeCount = computed(() => certs.value.filter(c => c.status !== 'revoked').length);
const revokedCount = computed(() => certs.value.filter(c => c.status === 'revoked').length);

const verificationRate = computed(() => {
  if (!certs.value || certs.value.length === 0) return '0%';
  const rate = Math.round((activeCount.value / certs.value.length) * 100);
  return `${rate}%`;
});

const filteredCerts = computed(() => {
  let list = certs.value || [];
  if (statusFilter.value !== 'All') {
    list = list.filter(c => c.status === statusFilter.value);
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase().trim();
    list = list.filter(c =>
      (c.cert_number || '').toLowerCase().includes(q) ||
      (c.student_name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.course_title || '').toLowerCase().includes(q)
    );
  }
  return list;
});

const loadCerts = async () => {
  loading.value = true;
  try {
    const res = await api.get('/main-admin/certificates');
    certs.value = res.data || res || [];
  } catch (error) {
    console.error('Failed to load certificates via main-admin:', error);
    try {
      const fallback = await api.get('/certs/admin');
      certs.value = fallback.data || fallback || [];
    } catch (err) {
      certs.value = [];
    }
  } finally {
    loading.value = false;
  }
};

const downloadCert = async (certNumber: string) => {
  try {
    const res = await api.get(`/certs/${certNumber}/download`, { responseType: 'blob' });
    const blob = new Blob([res.data || res], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${certNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  } catch (err) {
    console.error('Download failed:', err);
    alert('Failed to download certificate.');
  }
};

const confirmRevoke = async (item: any) => {
  if (!confirm(`Are you sure you want to revoke certificate ${item.cert_number} for ${item.student_name}?`)) return;
  try {
    await api.put(`/main-admin/certificates/${item.cert_number}/revoke`);
    await loadCerts();
  } catch (err) {
    alert('Failed to revoke certificate');
  }
};

const confirmReissue = async (item: any) => {
  if (!confirm(`Are you sure you want to re-issue certificate ${item.cert_number} for ${item.student_name}? This will generate a new credential.`)) return;
  try {
    const res = await api.post<any>(`/main-admin/certificates/${item.cert_number}/reissue`);
    alert(`Re-issued successfully. New Certificate ID: ${res.data?.newCertNumber}`);
    await loadCerts();
  } catch (err) {
    alert('Failed to re-issue certificate');
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

onMounted(() => {
  loadCerts();
});
</script>

<style scoped>
.gsfin-admin-page {
  padding: 40px 48px;
  background: #FAFAFD;
  min-height: 100vh;
  box-sizing: border-box;
}
.admin-wrap {
  max-width: 1440px;
  margin: 0 auto;
}

.admin-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.eyebrow-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  font-weight: 800;
  color: #E31B23;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.admin-title {
  font-size: 1.95rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0 0 6px 0;
  letter-spacing: -0.02em;
}

.admin-subtitle {
  font-size: 0.94rem;
  color: #64748B;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.btn-red {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  padding: 12px 22px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 0.88rem;
  box-shadow: 0 3px 10px rgba(227, 27, 35, 0.2);
  transition: all 0.2s ease;
  cursor: pointer;
}
.btn-red:hover {
  background: #C4131B;
  transform: translateY(-1px);
}

.btn-glass {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
  color: #334155;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 12px 22px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 0.88rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
}
.btn-glass:hover {
  background: #F8FAFC;
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.3);
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 36px;
}
@media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .kpi-grid { grid-template-columns: 1fr; } }

.kpi-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 26px 28px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.02);
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

.kpi-content { display: flex; flex-direction: column; }
.kpi-label { font-size: 0.76rem; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }
.kpi-value { font-size: 1.75rem; font-weight: 800; color: #0F172A; line-height: 1.2; margin-top: 4px; }
.kpi-sub { font-size: 0.78rem; font-weight: 600; margin-top: 6px; }

/* Panel & Card */
.panel-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
  overflow: hidden;
}

.panel-card-header {
  padding: 24px 32px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  background: #FAFAFD;
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
  left: 16px;
  color: #94A3B8;
  font-size: 1.15rem;
}

.table-search-input {
  padding: 10px 16px 10px 44px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  font-size: 0.88rem;
  color: #0F172A;
  outline: none;
  width: 280px;
  transition: border-color 0.2s;
}
.table-search-input:focus { border-color: #E31B23; }

.table-select-filter {
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  font-size: 0.88rem;
  font-weight: 700;
  color: #0F172A;
  outline: none;
  cursor: pointer;
}

.count-badge {
  padding: 6px 16px;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 800;
  background: #F1F5F9;
  color: #475569;
}

/* Tables */
.table-responsive { overflow-x: auto; }
.gsfin-table { width: 100%; border-collapse: collapse; text-align: left; }
.gsfin-table th { background: #F8FAFC; padding: 18px 24px; font-size: 0.74rem; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid rgba(15, 23, 42, 0.08); white-space: nowrap; }
.gsfin-table td { padding: 20px 24px; font-size: 0.9rem; color: #334155; border-bottom: 1px solid rgba(15, 23, 42, 0.06); vertical-align: middle; }

.chip-pill { padding: 6px 14px; border-radius: 50px; font-size: 0.74rem; font-weight: 800; text-transform: uppercase; display: inline-block; }
.chip-green { background: rgba(16, 185, 129, 0.1); color: #059669; }
.chip-red { background: rgba(239, 68, 68, 0.1); color: #DC2626; }

/* Action Buttons */
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

.spinner-sm-red { width: 16px; height: 16px; border: 2px solid rgba(227, 27, 35, 0.2); border-top-color: #E31B23; border-radius: 50%; animation: spin 0.75s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
