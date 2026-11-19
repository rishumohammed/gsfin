<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ TOP HEADER ROW ═══ -->
      <div class="admin-header-row">
        <div>
          <h1 class="admin-title">Certificates</h1>
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
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon-box bg-emerald-light">
            <i class="mdi mdi-certificate text-emerald"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Total Certificates</span>
            <span class="metric-value">{{ certs.length }}</span>
            <span class="metric-sub text-emerald">Issued Credentials</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box bg-indigo-light">
            <i class="mdi mdi-shield-check text-indigo"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Active Verified</span>
            <span class="metric-value">{{ activeCount }}</span>
            <span class="metric-sub text-indigo">Authentic Credentials</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box bg-red-light">
            <i class="mdi mdi-close-octagon text-red"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Revoked Status</span>
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

      <!-- Modal Container -->
      <IssueCertificateModal v-model="showIssueModal" @issued="loadCerts" />

      <!-- ═══ MAIN CERTIFICATES & PARTNER CARD CONTAINER ═══ -->
      <div class="panel-card">
        <!-- ═══ FILTER & VIEW MODE BAR ═══ -->
        <div class="panel-card-header">
          <div class="panel-filter-row">
            <!-- View Mode Tabs -->
            <div class="view-mode-tabs">
              <button
                :class="['view-mode-btn', viewMode === 'partners' ? 'active' : '']"
                @click="viewMode = 'partners'"
              >
                <i class="mdi mdi-domain"></i> By Partner
              </button>
              <button
                :class="['view-mode-btn', viewMode === 'table' ? 'active' : '']"
                @click="viewMode = 'table'"
              >
                <i class="mdi mdi-table"></i> All Certificates
              </button>
            </div>

            <!-- Search Input -->
            <div class="search-input-wrap">
              <i class="mdi mdi-magnify search-icon"></i>
              <input
                v-model="search"
                type="text"
                placeholder="Search partner, exam, student, or cert ID..."
                class="table-search-input"
              />
            </div>

            <!-- Status Filter -->
            <select v-model="statusFilter" class="table-select-filter">
              <option value="All">All Statuses</option>
              <option value="active">Active Verified</option>
              <option value="revoked">Revoked Records</option>
            </select>


          </div>

          <span class="count-badge">
            <template v-if="viewMode === 'partners'">
              {{ filteredPartners.length }} Partner Centers ({{ totalFilteredCerts }} Certs)
            </template>
            <template v-else>
              Total: {{ filteredCerts.length }} Certificates
            </template>
          </span>
        </div>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- VIEW 1: PARTNER CENTER CARDS HIERARCHY                 -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <div v-if="viewMode === 'partners'" class="partner-cards-list">
          <div v-if="loading" class="panel-loading-state">
            <span class="spinner-sm-red"></span> Loading Partner Centers & Examinations...
          </div>

          <div v-else-if="filteredPartners.length === 0" class="panel-empty-state">
            <i class="mdi mdi-domain-off text-4xl block mb-2 text-slate-400"></i>
            <div class="font-semibold text-slate-700">No Partner Centers Found</div>
            <div class="text-sm text-slate-500">Try adjusting your search query or status filter.</div>
          </div>

          <div
            v-for="partner in paginatedPartners"
            :key="partner.id"
            class="partner-card"
          >
            <!-- ═══ PARTNER CARD ROW ═══ -->
            <div class="partner-card-header">
              <div class="partner-identity-left">
                <div class="partner-logo-avatar">
                  <i class="mdi mdi-domain"></i>
                </div>
                <div class="partner-identity-info">
                  <div class="partner-title-row">
                    <NuxtLink
                      :to="'/admin/multi-tenant/' + partner.id + '?tab=batches'"
                      class="partner-name-link"
                      title="View Partner Profile and Batches"
                    >
                      {{ partner.name }}
                    </NuxtLink>
                    <span :class="['partner-status-tag', partner.status === 'active' ? 'tag-active' : 'tag-inactive']">
                      {{ partner.status === 'active' ? 'Accredited Center' : partner.status }}
                    </span>
                    <span class="partner-type-tag">{{ partner.type || 'Authorized Training Center' }}</span>
                  </div>

                  <div class="partner-meta-strip">
                    <span class="partner-meta-item">
                      <i class="mdi mdi-email-outline"></i> {{ partner.email }}
                    </span>
                    <span v-if="partner.phone && partner.phone !== 'N/A'" class="partner-meta-item">
                      <i class="mdi mdi-phone-outline"></i> {{ partner.phone }}
                    </span>
                    <span class="partner-meta-item">
                      <i class="mdi mdi-map-marker-outline"></i> {{ partner.city }}, {{ partner.country }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Partner Stats Summary Pill & View Batches Action -->
              <div class="partner-header-right">
                <div class="partner-stat-pill">
                  <div class="stat-cell">
                    <span class="stat-num">{{ partner.exams.length }}</span>
                    <span class="stat-lbl">Conducted Exams</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-cell">
                    <span class="stat-num text-indigo">{{ partner.total_students }}</span>
                    <span class="stat-lbl">Candidates</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-cell">
                    <span class="stat-num text-emerald">{{ partner.total_certificates }}</span>
                    <span class="stat-lbl">Certificates</span>
                  </div>
                </div>

                <NuxtLink
                  :to="'/admin/multi-tenant/' + partner.id + '?tab=batches'"
                  class="btn-view-batches"
                  title="View Exam Batches & Candidates in Partner Profile"
                >
                  <span>View Batches</span>
                  <i class="mdi mdi-arrow-right"></i>
                </NuxtLink>
              </div>
            </div>
          </div>
          <AppPagination
            v-if="filteredPartners.length > 0"
            v-model="partnerPage"
            v-model:items-per-page="partnerPerPage"
            :total-items="filteredPartners.length"
            :per-page-options="[5, 10, 20, 50]"
          />
        </div>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- VIEW 2: FLAT ALL CERTIFICATES DATA TABLE                -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <div v-else class="table-responsive">
          <table class="gsfin-table">
            <thead>
              <tr>
                <th>Certificate ID</th>
                <th>Student</th>
                <th>Partner</th>
                <th>Course</th>
                <th>Issue Date</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="7" class="text-center py-10 text-slate-500 font-medium">
                  <span class="spinner-sm-red"></span> Loading Issued Certificates...
                </td>
              </tr>
              <tr v-else-if="filteredCerts.length === 0">
                <td colspan="7" class="text-center py-12 text-slate-500">
                  <i class="mdi mdi-file-certificate-outline text-4xl block mb-2 text-slate-400"></i>
                  No Certificate Records Found
                </td>
              </tr>
              <tr v-for="item in paginatedCerts" :key="item.cert_number">
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
                  <div class="font-semibold text-slate-900 text-sm">{{ item.student_name || 'Candidate Holder' }}</div>
                  <div class="text-xs text-slate-400 font-medium">{{ item.email }}</div>
                </td>
                <td>
                  <div class="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                    <i class="mdi mdi-domain text-slate-400"></i>
                    {{ item.partner_name || 'Apex Testing Center' }}
                  </div>
                  <div class="text-xs text-slate-400">{{ item.partner_city || 'International' }}, {{ item.partner_country || 'Global' }}</div>
                </td>
                <td>
                  <div class="font-semibold text-slate-800 text-sm">{{ item.course_title || 'Qualification Exam' }}</div>
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
          <AppPagination
            v-if="filteredCerts.length > 0"
            v-model="certPage"
            v-model:items-per-page="certPerPage"
            :total-items="filteredCerts.length"
            :per-page-options="[10, 25, 50, 100]"
          />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useApi } from '@/composables/useApi';
import { useAuthStore } from '@/stores/auth';
import IssueCertificateModal from '@/components/admin/IssueCertificateModal.vue';
import AppPagination from '@/components/common/AppPagination.vue';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'main_admin', 'sub_admin', 'tutor']
});

const api = useApi();
const authStore = useAuthStore();

const certs = ref<any[]>([]);
const partnerTree = ref<any[]>([]);
const loading = ref(false);
const showIssueModal = ref(false);
const search = ref('');
const statusFilter = ref('All');
const viewMode = ref<'partners' | 'table'>('partners');
const copySuccessId = ref<string | null>(null);

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

// Clipboard copy helper
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

// Candidate Avatar initials
const getInitials = (name?: string) => {
  if (!name) return 'C';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatExamStatus = (status?: string) => {
  if (!status) return 'ATTENDED';
  if (status === 'passed') return 'PASSED';
  if (status === 'failed') return 'FAILED';
  if (status === 'in_progress') return 'IN PROGRESS';
  return status.toUpperCase();
};

const getExamStatusClass = (status?: string) => {
  if (status === 'passed') return 'chip-green';
  if (status === 'failed') return 'chip-red';
  if (status === 'in_progress') return 'chip-indigo';
  return 'chip-muted';
};

// Filtered flat certificates list
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
      (c.course_title || '').toLowerCase().includes(q) ||
      (c.partner_name || '').toLowerCase().includes(q)
    );
  }
  return list;
});

// Filtered Partner Hierarchy
const filteredPartners = computed(() => {
  const list = partnerTree.value || [];
  const q = search.value.toLowerCase().trim();
  const st = statusFilter.value;

  return list.map(partner => {
    // Filter exams and students inside this partner
    const matchingExams = (partner.exams || []).map((exam: any) => {
      const matchingStudents = (exam.students || []).filter((student: any) => {
        // Status filter
        if (st !== 'All') {
          if (st === 'active' && student.cert_status === 'revoked') return false;
          if (st === 'revoked' && student.cert_status !== 'revoked') return false;
        }

        // Search filter
        if (!q) return true;
        return (
          (student.student_name || '').toLowerCase().includes(q) ||
          (student.student_email || '').toLowerCase().includes(q) ||
          (student.cert_number || '').toLowerCase().includes(q) ||
          (exam.exam_name || '').toLowerCase().includes(q) ||
          (partner.name || '').toLowerCase().includes(q)
        );
      });

      const examMatches = !q || (exam.exam_name || '').toLowerCase().includes(q) || (partner.name || '').toLowerCase().includes(q);

      return {
        ...exam,
        students: matchingStudents,
        total_certificates: matchingStudents.filter((s: any) => !!s.cert_number).length,
        _matches: examMatches || matchingStudents.length > 0
      };
    }).filter((e: any) => e._matches && (e.students.length > 0 || !q));

    const totalStudents = matchingExams.reduce((sum: number, e: any) => sum + e.students.length, 0);
    const totalCerts = matchingExams.reduce((sum: number, e: any) => sum + e.total_certificates, 0);

    const partnerMatches = !q || 
      (partner.name || '').toLowerCase().includes(q) || 
      (partner.email || '').toLowerCase().includes(q) ||
      (partner.city || '').toLowerCase().includes(q) ||
      (partner.country || '').toLowerCase().includes(q);

    return {
      ...partner,
      exams: matchingExams,
      total_students: totalStudents,
      total_certificates: totalCerts,
      _matches: partnerMatches || matchingExams.length > 0
    };
  }).filter(p => p._matches && (p.exams.length > 0 || !q));
});

const totalFilteredCerts = computed(() => {
  return filteredPartners.value.reduce((sum, p) => sum + p.total_certificates, 0);
});

// Pagination state
const partnerPage = ref(1);
const partnerPerPage = ref(5);
const certPage = ref(1);
const certPerPage = ref(10);

const paginatedPartners = computed(() => {
  const start = (partnerPage.value - 1) * partnerPerPage.value;
  return filteredPartners.value.slice(start, start + partnerPerPage.value);
});

const paginatedCerts = computed(() => {
  const start = (certPage.value - 1) * certPerPage.value;
  return filteredCerts.value.slice(start, start + certPerPage.value);
});

watch([search, statusFilter], () => {
  partnerPage.value = 1;
  certPage.value = 1;
});

// Fallback hierarchy builder if server hierarchy endpoint is unavailable
const buildFallbackTree = (list: any[]) => {
  const map = new Map<string, any>();
  for (const c of list) {
    const partnerId = c.partner_id || 'org-apex-01';
    const partnerName = c.partner_name || 'Apex Testing Center';
    const examName = c.course_title || 'Qualification Exam';

    if (!map.has(partnerId)) {
      map.set(partnerId, {
        id: partnerId,
        name: partnerName,
        email: c.partner_email || 'contact@apexcenter.com',
        phone: c.partner_phone || '+1-555-0199',
        city: c.partner_city || 'Dubai',
        country: c.partner_country || 'UAE',
        type: c.partner_type || 'Authorized Testing Center',
        status: 'active',
        total_exams: 0,
        total_students: 0,
        total_certificates: 0,
        exams: []
      });
    }

    const partner = map.get(partnerId);
    let exam = partner.exams.find((e: any) => e.exam_name === examName);
    if (!exam) {
      exam = {
        batch_id: c.batch_id || ('batch-' + partner.exams.length),
        exam_id: c.exam_id || 'exam-1',
        exam_name: examName,
        duration_minutes: 60,
        batch_status: c.batch_status || 'closed',
        created_at: c.issued_at,
        total_students: 0,
        total_certificates: 0,
        students: []
      };
      partner.exams.push(exam);
      partner.total_exams += 1;
    }

    if (!exam.students.some((s: any) => s.cert_number === c.cert_number)) {
      exam.total_students += 1;
      exam.total_certificates += 1;
      partner.total_students += 1;
      partner.total_certificates += 1;
      exam.students.push({
        assignment_id: c.assignment_id || c.id,
        student_name: c.student_name,
        student_email: c.email,
        student_phone: c.phone || 'N/A',
        exam_status: c.exam_status || 'passed',
        attempts_used: c.attempts_used || 1,
        max_attempts: 1,
        certificate_id: c.id,
        cert_number: c.cert_number,
        issued_at: c.issued_at,
        cert_status: c.status || 'active',
        pdf_url: null
      });
    }
  }
  return Array.from(map.values());
};

const loadCerts = async () => {
  loading.value = true;
  try {
    const [certsRes, treeRes] = await Promise.allSettled([
      api.get('/main-admin/certificates'),
      api.get('/main-admin/certificates/hierarchy')
    ]);

    if (certsRes.status === 'fulfilled') {
      certs.value = (certsRes.value as any)?.data || certsRes.value || [];
    }

    if (treeRes.status === 'fulfilled' && Array.isArray((treeRes.value as any)?.data)) {
      partnerTree.value = (treeRes.value as any).data;
    } else {
      partnerTree.value = buildFallbackTree(certs.value);
    }
  } catch (error) {
    console.error('Failed to load certificates via main-admin:', error);
    try {
      const fallback = await api.get('/certs/admin');
      certs.value = fallback.data || fallback || [];
      partnerTree.value = buildFallbackTree(certs.value);
    } catch (err) {
      certs.value = [];
      partnerTree.value = [];
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
  padding: 0;
  background: #FAFAFD;
  min-height: 100vh;
  box-sizing: border-box;
}
.admin-wrap {
  max-width: 1400px;
  margin: 0 auto;
}

.admin-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.admin-title {
  font-size: 1.95rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0 0 6px 0;
  letter-spacing: -0.02em;
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
  font-weight: 600;
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
  font-weight: 600;
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
.metrics-grid, .kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}
@media (max-width: 1024px) { .metrics-grid, .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .metrics-grid, .kpi-grid { grid-template-columns: 1fr; } }

.metric-card, .kpi-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 22px 24px;
  display: flex;
  align-items: flex-start;
  gap: 18px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.02);
}
.metric-icon-box, .kpi-icon {
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

.metric-info, .kpi-content { display: flex; flex-direction: column; }
.metric-label, .kpi-label { font-size: 0.74rem; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }
.metric-value, .kpi-value { font-size: 1.85rem; font-weight: 600; color: #0F172A; line-height: 1.2; margin-top: 4px; }
.metric-sub, .kpi-sub { font-size: 0.78rem; font-weight: 600; margin-top: 6px; }

/* Main Panel Card */
.panel-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
  overflow: hidden;
}

.panel-card-header {
  padding: 20px 28px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  background: #FAFAFD;
}

.panel-filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* View Mode Tabs */
.view-mode-tabs {
  display: inline-flex;
  background: #F1F5F9;
  padding: 4px;
  border-radius: 12px;
  gap: 4px;
}
.view-mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #64748B;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.view-mode-btn:hover {
  color: #0F172A;
}
.view-mode-btn.active {
  background: #FFFFFF;
  color: #0F172A;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
}
.view-mode-btn.active i {
  color: #E31B23;
}

/* Search input */
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
  width: 270px;
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

.expand-collapse-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-text-subtle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 10px;
  color: #64748B;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-text-subtle:hover {
  background: #F8FAFC;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.2);
}

.count-badge {
  padding: 6px 16px;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #F1F5F9;
  color: #475569;
}

/* ═════ PARTNER CARDS HIERARCHY STYLES ═════ */
.partner-cards-list {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.partner-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.09);
  border-radius: 20px;
  box-shadow: 0 3px 14px rgba(15, 23, 42, 0.03);
  overflow: hidden;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.partner-card:hover {
  border-color: rgba(227, 27, 35, 0.25);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
}

.partner-card-header {
  padding: 20px 24px;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.partner-identity-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}
.partner-logo-avatar {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(227, 27, 35, 0.08) 0%, rgba(227, 27, 35, 0.16) 100%);
  border: 1px solid rgba(227, 27, 35, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  color: #E31B23;
  flex-shrink: 0;
}
.partner-identity-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.partner-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.partner-name-link {
  font-size: 1.15rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  letter-spacing: -0.01em;
  text-decoration: none;
  transition: color 0.15s ease;
}
.partner-name-link:hover {
  color: #E31B23;
}
.partner-status-tag {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 50px;
  letter-spacing: 0.04em;
}
.tag-active {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}
.tag-inactive {
  background: rgba(239, 68, 68, 0.1);
  color: #DC2626;
}
.partner-type-tag {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748B;
  background: #F1F5F9;
  padding: 3px 10px;
  border-radius: 50px;
}

.partner-meta-strip {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: #64748B;
}
.partner-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.partner-meta-item i {
  color: #94A3B8;
  font-size: 0.95rem;
}

.partner-header-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
  margin-left: auto;
}
.partner-stat-pill {
  display: flex;
  align-items: center;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  padding: 8px 16px;
  gap: 14px;
}
.stat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.15;
}
.stat-num {
  font-size: 1.05rem;
  font-weight: 600;
  color: #0F172A;
}
.stat-lbl {
  font-size: 0.68rem;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 2px;
}
.stat-divider {
  width: 1px;
  height: 24px;
  background: rgba(15, 23, 42, 0.1);
}
.btn-view-batches {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  background: #E31B23;
  color: #FFFFFF;
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(227, 27, 35, 0.2);
  white-space: nowrap;
}
.btn-view-batches:hover {
  background: #C41219;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(227, 27, 35, 0.28);
}
.btn-view-batches i {
  font-size: 0.95rem;
  transition: transform 0.15s ease;
}
.btn-view-batches:hover i {
  transform: translateX(3px);
}

.panel-loading-state, .panel-empty-state {
  padding: 48px;
  text-align: center;
  color: #64748B;
}

@media (max-width: 1024px) {
  .partner-card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  .partner-header-right {
    width: 100%;
    justify-content: space-between;
    margin-left: 0;
    padding-top: 14px;
    border-top: 1px solid rgba(15, 23, 42, 0.06);
  }
}

@media (max-width: 640px) {
  .partner-header-right {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
}

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

/* Tables */
.table-responsive {
  width: 100%;
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #FFFFFF;
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
  font-weight: 400;
  color: #334155;
  vertical-align: middle;
}

.gsfin-table tbody tr:hover {
  background: #F8FAFD;
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
