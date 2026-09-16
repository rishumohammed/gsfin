<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ TOP HEADER ROW ═══ -->
      <div class="admin-header-row">
        <div>
          <div class="eyebrow-chip mb-1">
            <i class="mdi mdi-certificate-outline"></i> CREDENTIAL PORTAL
          </div>
          <h1 class="admin-title">{{ pageTitle }}</h1>
          <p class="admin-subtitle">{{ pageSubtitle }}</p>
        </div>

        <div v-if="userRole !== 'student'" class="header-actions">
          <button class="btn-red" @click="showIssueModal = true">
            <i class="mdi mdi-plus"></i> Issue Certificate
          </button>
        </div>
      </div>

      <!-- Modal Container -->
      <IssueCertificateModal v-model="showIssueModal" @issued="fetchData" />
      <ExternalCertificateModal v-model="showExternalModal" :certificate="selectedExternalCert" @saved="fetchExternalData" />

      <!-- ═══ STUDENT TAB SWITCHER ═══ -->
      <div v-if="userRole === 'student'" class="tab-switcher-row mb-6">
        <button
          :class="['tab-pill-btn', activeTab === 'internal' ? 'active' : '']"
          @click="activeTab = 'internal'"
        >
          <i class="mdi mdi-shield-check-outline"></i> Platform Credentials
        </button>
        <button
          :class="['tab-pill-btn', activeTab === 'external' ? 'active' : '']"
          @click="activeTab = 'external'"
        >
          <i class="mdi mdi-file-document-outline"></i> External Certifications
        </button>
      </div>

      <!-- ═══ PLATFORM CERTIFICATES TAB ═══ -->
      <div v-if="activeTab === 'internal'" class="panel-card">
        <div v-if="loading" class="text-center py-12 text-slate-500 font-medium">
          <span class="spinner-sm-red"></span> Loading credentials...
        </div>

        <div v-else-if="certificates.length === 0" class="empty-state">
          <i class="mdi mdi-certificate-outline text-5xl text-slate-300 mb-3"></i>
          <h3 class="font-bold text-slate-800 text-lg">No Certificates Found</h3>
          <p class="text-slate-500 text-sm max-w-md mt-1">{{ emptyStateText }}</p>
        </div>

        <div v-else class="table-responsive">
          <table class="gsfin-table">
            <thead>
              <tr>
                <th>Certificate Details</th>
                <th>Qualification / Course</th>
                <th>Date Issued</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in certificates" :key="item.cert_number">
                <td>
                  <div class="flex items-center gap-3">
                    <div class="cert-avatar-badge">
                      <i class="mdi mdi-file-certificate text-red"></i>
                    </div>
                    <div>
                      <div class="font-bold text-slate-900 text-sm">{{ item.student_name || authStore.user?.name }}</div>
                      <div class="text-xs text-slate-400 font-mono">ID: {{ item.cert_number }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="font-bold text-slate-800 text-sm">{{ item.course_title }}</div>
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
                    <button class="btn-icon-action btn-icon-view" title="Download PDF" @click="downloadCertificate(item)">
                      <i class="mdi mdi-download"></i>
                    </button>
                    <button class="btn-icon-action btn-icon-whatsapp" title="Share via WhatsApp" @click="shareOnWhatsApp(item)">
                      <i class="mdi mdi-whatsapp"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ═══ EXTERNAL CERTIFICATES TAB ═══ -->
      <div v-else-if="activeTab === 'external'" class="space-y-6">
        <div class="flex items-center justify-between gap-4 mb-4">
          <h2 class="font-bold text-slate-900 text-lg">My Verified External Credentials</h2>
          <button class="btn-red" @click="openAddExternalModal">
            <i class="mdi mdi-plus"></i> Add External Certificate
          </button>
        </div>

        <div v-if="loadingExternal" class="panel-card text-center py-12 text-slate-500 font-medium">
          <span class="spinner-sm-red"></span> Loading external certifications...
        </div>

        <div v-else-if="externalCertificates.length === 0" class="panel-card empty-state">
          <i class="mdi mdi-certificate-outline text-5xl text-slate-300 mb-3"></i>
          <h3 class="font-bold text-slate-800 text-lg">No External Credentials</h3>
          <p class="text-slate-500 text-sm max-w-md mt-1">You have not uploaded any external certifications yet.</p>
        </div>

        <div v-else class="external-grid">
          <div v-for="cert in externalCertificates" :key="cert.id" class="external-card">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div>
                <h4 class="font-bold text-slate-900 text-base leading-snug line-clamp-2">{{ cert.certificate_name }}</h4>
                <div class="text-slate-500 font-medium text-xs mt-1">{{ cert.issuer }}</div>
              </div>
              <div class="dropdown-actions">
                <button class="btn-icon-sm" title="Edit Certificate" @click="editExternalCert(cert)">
                  <i class="mdi mdi-pencil-outline"></i>
                </button>
                <button class="btn-icon-sm text-red" title="Delete Certificate" @click="deleteExternalCert(cert.id)">
                  <i class="mdi mdi-trash-can-outline"></i>
                </button>
              </div>
            </div>

            <div class="text-xs text-slate-400 font-medium mb-3">
              Issued: {{ formatDate(cert.issue_date) }}
              <span v-if="cert.expiry_date"> &bull; Expires: {{ formatDate(cert.expiry_date) }}</span>
            </div>

            <div v-if="cert.skills && getSkillsList(cert.skills).length > 0" class="skills-flex mb-4">
              <span v-for="skill in getSkillsList(cert.skills)" :key="skill" class="skill-tag">
                {{ skill }}
              </span>
            </div>

            <div class="card-footer-btns">
              <a v-if="cert.file_url" :href="`${api.defaults.baseURL?.replace('/api', '') || ''}${cert.file_url}`" target="_blank" class="btn-glass-sm flex-1 text-center">
                View Document
              </a>
              <a v-if="cert.verification_url" :href="cert.verification_url" target="_blank" class="btn-glass-sm flex-1 text-center">
                Verify Link
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import dayjs from 'dayjs';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';
import IssueCertificateModal from '@/components/admin/IssueCertificateModal.vue';
import ExternalCertificateModal from '@/components/certificates/ExternalCertificateModal.vue';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'main_admin', 'sub_admin', 'lms_user', 'tutor', 'student']
});

const authStore = useAuthStore();
const api = useApi();
const loading = ref(true);
const showIssueModal = ref(false);
const certificates = ref<any[]>([]);
const userRole = computed(() => authStore.userRole);

const activeTab = ref('internal');
const showExternalModal = ref(false);
const selectedExternalCert = ref<any>(null);
const externalCertificates = ref<any[]>([]);
const loadingExternal = ref(false);

const pageTitle = computed(() => userRole.value === 'student' ? 'My Certificates' : 'Issued Certificates');
const pageSubtitle = computed(() => userRole.value === 'student' ? 'View and download your earned qualifications and credentials.' : 'Manage and verify all certificates issued across the network.');
const emptyStateText = computed(() => userRole.value === 'student' 
  ? 'Complete a qualification course and pass the exam to earn your verifiable certificate.' 
  : 'No certificates have been issued in the system yet.'
);

const fetchData = async () => {
  loading.value = true;
  try {
    const endpoint = userRole.value === 'student' ? '/certs/my-certificates' : '/certs/admin';
    const res = await api.get(endpoint);
    certificates.value = res.data || res || [];
  } catch (error) {
    console.error('Failed to fetch certificates:', error);
  } finally {
    loading.value = false;
  }
};

const fetchExternalData = async () => {
  if (userRole.value !== 'student') return;
  loadingExternal.value = true;
  try {
    const res = await api.get('/certs/external');
    externalCertificates.value = res.data || res || [];
  } catch (error) {
    console.error('Failed to fetch external certificates:', error);
  } finally {
    loadingExternal.value = false;
  }
};

const openAddExternalModal = () => {
  selectedExternalCert.value = null;
  showExternalModal.value = true;
};

const editExternalCert = (cert: any) => {
  selectedExternalCert.value = cert;
  showExternalModal.value = true;
};

const deleteExternalCert = async (id: string) => {
  if (!confirm('Are you sure you want to delete this certificate?')) return;
  try {
    await api.delete(`/certs/external/${id}`);
    fetchExternalData();
  } catch (error) {
    console.error('Failed to delete certificate:', error);
    alert('Failed to delete certificate');
  }
};

const getSkillsList = (skillsData: any) => {
  if (!skillsData) return [];
  try {
    return typeof skillsData === 'string' ? JSON.parse(skillsData) : skillsData;
  } catch(e) {
    return [];
  }
};

const downloadCertificate = (cert: any) => {
  api.get(`/certs/${cert.cert_number}/download`, { responseType: 'blob' })
    .then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate-${cert.cert_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch(err => {
      console.error('Download error:', err);
      alert('Failed to download certificate. Please try again.');
    });
};

const shareOnWhatsApp = (cert: any) => {
  const text = `I'm proud to share my qualification certificate for ${cert.course_title} from GSFIN! Verify here: ${window.location.origin}/verify?id=${cert.cert_number}`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

const formatDate = (date: string) => date ? dayjs(date).format('MMM D, YYYY') : 'N/A';

onMounted(() => {
  fetchData();
  fetchExternalData();
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

.tab-switcher-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #FFFFFF;
  padding: 6px;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  width: fit-content;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
}

.tab-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 700;
  color: #64748B;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}
.tab-pill-btn.active {
  background: #E31B23;
  color: #FFFFFF;
  box-shadow: 0 2px 10px rgba(227, 27, 35, 0.2);
}

.panel-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
  overflow: hidden;
}

.empty-state {
  padding: 64px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Tables */
.table-responsive { overflow-x: auto; }
.gsfin-table { width: 100%; border-collapse: collapse; text-align: left; }
.gsfin-table th { background: #F8FAFC; padding: 18px 24px; font-size: 0.74rem; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid rgba(15, 23, 42, 0.08); white-space: nowrap; }
.gsfin-table td { padding: 20px 24px; font-size: 0.9rem; color: #334155; border-bottom: 1px solid rgba(15, 23, 42, 0.06); vertical-align: middle; }

.cert-avatar-badge {
  width: 40px; height: 40px; border-radius: 12px;
  background: rgba(227, 27, 35, 0.1);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.25rem; flex-shrink: 0;
}

.chip-pill { padding: 6px 14px; border-radius: 50px; font-size: 0.74rem; font-weight: 800; text-transform: uppercase; display: inline-block; }
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
.btn-icon-whatsapp { background: rgba(34, 197, 94, 0.1); color: #16A34A; }
.btn-icon-whatsapp:hover { background: #16A34A; color: #FFFFFF; }

.external-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.external-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
  display: flex;
  flex-direction: column;
}

.btn-icon-sm {
  width: 32px; height: 32px; border-radius: 8px; border: none;
  background: #F1F5F9; color: #475569;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s ease;
}
.btn-icon-sm:hover { background: #E2E8F0; color: #0F172A; }
.btn-icon-sm.text-red:hover { background: rgba(239, 68, 68, 0.1); color: #DC2626; }

.dropdown-actions { display: flex; align-items: center; gap: 6px; }

.skills-flex { display: flex; flex-wrap: wrap; gap: 6px; }
.skill-tag {
  padding: 4px 10px; border-radius: 6px;
  font-size: 0.72rem; font-weight: 700;
  background: rgba(227, 27, 35, 0.08); color: #E31B23;
}

.card-footer-btns { display: flex; gap: 10px; margin-top: auto; padding-top: 8px; }
.btn-glass-sm {
  padding: 8px 14px; border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12); background: #FFFFFF;
  color: #334155; font-size: 0.8rem; font-weight: 700;
  text-decoration: none; transition: all 0.18s;
}
.btn-glass-sm:hover { background: #F8FAFC; color: #E31B23; border-color: rgba(227, 27, 35, 0.3); }

.text-red { color: #E31B23; }
.spinner-sm-red {
  width: 16px; height: 16px;
  border: 2px solid rgba(227, 27, 35, 0.2); border-top-color: #E31B23;
  border-radius: 50%; animation: spin 0.75s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
