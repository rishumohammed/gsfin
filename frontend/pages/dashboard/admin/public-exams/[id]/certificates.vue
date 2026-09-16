<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ TOP HEADER ROW ═══ -->
      <div class="admin-header-row">
        <div>
          <div class="eyebrow-chip mb-1">
            <i class="mdi mdi-certificate-outline"></i> PUBLIC EXAM CERTIFICATES
          </div>
          <h1 class="admin-title">Generated Exam Certificates</h1>
          <p class="admin-subtitle">View, edit candidate credentials, and resend digital qualification certificates.</p>
        </div>

        <div class="header-actions">
          <NuxtLink to="/dashboard/admin/public-exams" class="btn-glass">
            <i class="mdi mdi-arrow-left"></i> Back to Public Exams
          </NuxtLink>
        </div>
      </div>

      <!-- ═══ CERTIFICATES DATA PANEL ═══ -->
      <div class="panel-card">
        <div class="panel-card-header">
          <div class="search-input-wrap">
            <i class="mdi mdi-magnify search-icon"></i>
            <input
              v-model="search"
              type="text"
              placeholder="Search candidate name or email..."
              class="table-search-input"
            />
          </div>
          <span class="count-badge">Total: {{ filteredCertificates.length }} Records</span>
        </div>

        <div class="table-responsive">
          <table class="gsfin-table">
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Candidate Email</th>
                <th>Issued Timestamp</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="4" class="text-center py-10 text-slate-500 font-medium">
                  <span class="spinner-sm-red"></span> Loading Certificates...
                </td>
              </tr>
              <tr v-else-if="filteredCertificates.length === 0">
                <td colspan="4" class="text-center py-12 text-slate-500">
                  <i class="mdi mdi-file-certificate-outline text-4xl block mb-2 text-slate-400"></i>
                  No Certificates Issued for this Exam
                </td>
              </tr>
              <tr v-for="item in filteredCertificates" :key="item.id">
                <td>
                  <div class="font-bold text-slate-900 text-sm">{{ item.candidate_name }}</div>
                </td>
                <td>
                  <div class="text-slate-600 text-sm font-medium">{{ item.candidate_email }}</div>
                </td>
                <td class="text-slate-500 font-medium text-xs whitespace-nowrap">
                  {{ formatDate(item.created_at) }}
                </td>
                <td class="text-right">
                  <div class="action-btn-group">
                    <a
                      :href="getMediaUrl(item.pdf_url)"
                      target="_blank"
                      class="btn-icon-action btn-icon-view"
                      title="View PDF Certificate"
                    >
                      <i class="mdi mdi-open-in-new"></i>
                    </a>
                    <button
                      class="btn-icon-action btn-icon-primary"
                      title="Resend Certificate Email"
                      @click="confirmResend(item)"
                    >
                      <i class="mdi mdi-email-fast-outline"></i>
                    </button>
                    <button
                      class="btn-icon-action btn-icon-warn"
                      title="Edit Candidate Name"
                      @click="openEditDialog(item)"
                    >
                      <i class="mdi mdi-pencil-outline"></i>
                    </button>
                    <button
                      class="btn-icon-action btn-icon-delete"
                      title="Delete Certificate"
                      @click="confirmDelete(item)"
                    >
                      <i class="mdi mdi-trash-can-outline"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Edit Candidate Dialog -->
      <Teleport to="body">
        <div v-if="editDialog" class="gsfin-modal-overlay" @click.self="editDialog = false">
          <div class="gsfin-modal-card">
            <div class="modal-header">
              <div class="flex items-center gap-2">
                <i class="mdi mdi-pencil-outline text-red text-xl"></i>
                <h3 class="modal-title">Edit Candidate Name</h3>
              </div>
              <button class="modal-close-btn" @click="editDialog = false"><i class="mdi mdi-close"></i></button>
            </div>
            <div class="modal-body">
              <p class="text-slate-500 text-sm mb-4">Updating candidate name will immediately regenerate the PDF certificate file.</p>
              <div class="form-group mb-2">
                <label class="form-label">Candidate Name</label>
                <input v-model="editCandidateName" type="text" class="form-input" placeholder="Full candidate name" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="editDialog = false">Cancel</button>
              <button class="btn-red" :disabled="saving" @click="saveEdit">
                <span v-if="saving" class="spinner-sm-white"></span>
                <span>Save & Regenerate</span>
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Resend Dialog -->
      <Teleport to="body">
        <div v-if="resendDialog" class="gsfin-modal-overlay" @click.self="resendDialog = false">
          <div class="gsfin-modal-card">
            <div class="modal-header">
              <div class="flex items-center gap-2">
                <i class="mdi mdi-email-fast-outline text-red text-xl"></i>
                <h3 class="modal-title">Resend Certificate Email</h3>
              </div>
              <button class="modal-close-btn" @click="resendDialog = false"><i class="mdi mdi-close"></i></button>
            </div>
            <div class="modal-body">
              <p class="text-slate-600 text-sm">
                Resend digital credential notification to <strong>{{ targetCert?.candidate_email }}</strong>?
              </p>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="resendDialog = false">Cancel</button>
              <button class="btn-red" :disabled="resending" @click="resendEmail">
                <span v-if="resending" class="spinner-sm-white"></span>
                <span>Resend Email</span>
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Delete Dialog -->
      <Teleport to="body">
        <div v-if="deleteDialog" class="gsfin-modal-overlay" @click.self="deleteDialog = false">
          <div class="gsfin-modal-card">
            <div class="modal-header">
              <div class="flex items-center gap-2">
                <i class="mdi mdi-trash-can-outline text-red text-xl"></i>
                <h3 class="modal-title">Delete Certificate</h3>
              </div>
              <button class="modal-close-btn" @click="deleteDialog = false"><i class="mdi mdi-close"></i></button>
            </div>
            <div class="modal-body">
              <p class="text-slate-600 text-sm">
                Are you sure you want to delete the certificate for <strong>"{{ targetCert?.candidate_name }}"</strong>? The generated PDF file will be removed permanently.
              </p>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="deleteDialog = false">Cancel</button>
              <button class="btn-red" :disabled="deleting" @click="deleteCertificate">
                <span v-if="deleting" class="spinner-sm-white"></span>
                <span>Delete Certificate</span>
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Toast Notification -->
      <div v-if="toast.show" :class="['toast-notification', toast.type]">
        <i :class="['mdi', toast.type === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle']"></i>
        <span>{{ toast.text }}</span>
      </div>

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
  roles: ['super_admin', 'main_admin', 'sub_admin', 'lms_user']
});

const route = useRoute();
const api = useApi();
const examId = route.params.id as string;
const config = useRuntimeConfig();

const loading = ref(true);
const certificates = ref<any[]>([]);
const search = ref('');

const editDialog = ref(false);
const resendDialog = ref(false);
const deleteDialog = ref(false);

const targetCert = ref<any>(null);
const editCandidateName = ref('');
const saving = ref(false);
const resending = ref(false);
const deleting = ref(false);

const toast = ref({ show: false, text: '', type: 'success' });

const showToast = (text: string, type: string = 'success') => {
  toast.value = { show: true, text, type };
  setTimeout(() => { toast.value.show = false; }, 3500);
};

const filteredCertificates = computed(() => {
  if (!search.value) return certificates.value;
  const s = search.value.toLowerCase().trim();
  return certificates.value.filter(c => 
    (c.candidate_name || '').toLowerCase().includes(s) || 
    (c.candidate_email || '').toLowerCase().includes(s)
  );
});

async function loadData() {
  loading.value = true;
  try {
    const res = await api.get(`/admin/public-exams/${examId}/issued-certificates`);
    certificates.value = res.data || res || [];
  } catch (err) {
    console.error('Failed to load certificates:', err);
  } finally {
    loading.value = false;
  }
}

function openEditDialog(cert: any) {
  targetCert.value = cert;
  editCandidateName.value = cert.candidate_name;
  editDialog.value = true;
}

async function saveEdit() {
  if (!editCandidateName.value.trim()) {
    showToast('Candidate name is required', 'error');
    return;
  }
  
  saving.value = true;
  try {
    await api.put(`/admin/public-exams/issued-certificates/${targetCert.value.id}`, {
      candidate_name: editCandidateName.value
    });
    showToast('Certificate updated and regenerated successfully');
    editDialog.value = false;
    loadData();
  } catch (err) {
    showToast('Failed to update certificate', 'error');
  } finally {
    saving.value = false;
  }
}

function confirmResend(cert: any) {
  targetCert.value = cert;
  resendDialog.value = true;
}

async function resendEmail() {
  resending.value = true;
  try {
    await api.post(`/admin/public-exams/issued-certificates/${targetCert.value.id}/resend`);
    showToast('Email resent successfully');
    resendDialog.value = false;
  } catch (err) {
    showToast('Failed to resend email', 'error');
  } finally {
    resending.value = false;
  }
}

function confirmDelete(cert: any) {
  targetCert.value = cert;
  deleteDialog.value = true;
}

async function deleteCertificate() {
  deleting.value = true;
  try {
    await api.delete(`/admin/public-exams/issued-certificates/${targetCert.value.id}`);
    showToast('Certificate deleted successfully');
    deleteDialog.value = false;
    loadData();
  } catch (err) {
    showToast('Failed to delete certificate', 'error');
  } finally {
    deleting.value = false;
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

function getMediaUrl(url: string | null) {
  if (!url) return '#';
  return config.public.apiBase.replace('/api', '') + url;
}

onMounted(() => {
  loadData();
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
  background: #FAFAFD;
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
  width: 320px;
  transition: border-color 0.2s;
}
.table-search-input:focus { border-color: #E31B23; }

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

/* Action Buttons */
.action-btn-group { display: inline-flex; align-items: center; gap: 8px; }
.btn-icon-action {
  width: 36px; height: 36px; border-radius: 10px; border: none;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 1.1rem; cursor: pointer; transition: all 0.18s ease;
  text-decoration: none;
}
.btn-icon-view { background: rgba(59, 130, 246, 0.1); color: #2563EB; }
.btn-icon-view:hover { background: #2563EB; color: #FFFFFF; }
.btn-icon-primary { background: rgba(227, 27, 35, 0.1); color: #E31B23; }
.btn-icon-primary:hover { background: #E31B23; color: #FFFFFF; }
.btn-icon-warn { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.btn-icon-warn:hover { background: #D97706; color: #FFFFFF; }
.btn-icon-delete { background: rgba(239, 68, 68, 0.1); color: #DC2626; }
.btn-icon-delete:hover { background: #DC2626; color: #FFFFFF; }

/* Modal Styles */
.gsfin-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 24px;
}

.gsfin-modal-card {
  background: #FFFFFF;
  border-radius: 24px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.16);
  overflow: hidden;
  animation: modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 20px 28px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FAFAFD;
}

.modal-title { font-size: 1.1rem; font-weight: 800; color: #0F172A; margin: 0; }
.modal-close-btn { background: transparent; border: none; color: #94A3B8; font-size: 1.25rem; cursor: pointer; padding: 4px; border-radius: 8px; }
.modal-close-btn:hover { background: #E2E8F0; color: #0F172A; }

.modal-body { padding: 24px 28px; }
.form-group { display: flex; flex-direction: column; }
.form-label { font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 8px; }

.form-input {
  width: 100%; padding: 12px 16px; border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.14); background: #FFFFFF;
  font-size: 0.9rem; color: #0F172A; outline: none; box-sizing: border-box;
}
.form-input:focus { border-color: #E31B23; }

.modal-footer {
  padding: 18px 28px; border-top: 1px solid rgba(15, 23, 42, 0.08);
  display: flex; align-items: center; justify-content: flex-end; gap: 12px;
  background: #FAFAFD;
}

.btn-cancel {
  background: transparent; border: 1px solid rgba(15, 23, 42, 0.12);
  color: #475569; padding: 10px 20px; border-radius: 12px;
  font-weight: 700; font-size: 0.88rem; cursor: pointer;
}
.btn-cancel:hover { background: #F1F5F9; color: #0F172A; }

.btn-red {
  display: inline-flex; align-items: center; gap: 8px;
  background: #E31B23; color: #FFFFFF; border: none;
  padding: 10px 22px; border-radius: 12px; font-weight: 700; font-size: 0.88rem;
  box-shadow: 0 3px 10px rgba(227, 27, 35, 0.2); cursor: pointer;
}
.btn-red:hover:not(:disabled) { background: #C4131B; transform: translateY(-1px); }
.btn-red:disabled { opacity: 0.6; cursor: not-allowed; }

.toast-notification {
  position: fixed; bottom: 32px; right: 32px; padding: 14px 24px;
  border-radius: 16px; font-weight: 700; font-size: 0.88rem;
  display: flex; align-items: center; gap: 10px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12); z-index: 9999;
}
.toast-notification.success { background: #059669; color: #FFFFFF; }
.toast-notification.error { background: #DC2626; color: #FFFFFF; }

.text-red { color: #E31B23; }
.spinner-sm-red {
  width: 16px; height: 16px; border: 2px solid rgba(227, 27, 35, 0.2);
  border-top-color: #E31B23; border-radius: 50%; animation: spin 0.75s linear infinite; display: inline-block;
}
.spinner-sm-white {
  width: 14px; height: 14px; border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #FFFFFF; border-radius: 50%; animation: spin 0.75s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>

