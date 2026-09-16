<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ TOP HEADER ROW ═══ -->
      <div class="admin-header-row">
        <div>
          <div class="eyebrow-chip mb-1">
            <i class="mdi mdi-palette-outline"></i> CREDENTIAL TEMPLATE ENGINE
          </div>
          <h1 class="admin-title">Certificate Template Configuration</h1>
          <p class="admin-subtitle">Customize signatory credentials, title designations, and live preview layout.</p>
        </div>

        <div class="header-actions">
          <NuxtLink to="/dashboard/admin/certificates" class="btn-glass">
            <i class="mdi mdi-arrow-left"></i> Back to Certificates
          </NuxtLink>
        </div>
      </div>

      <div class="grid-2col">
        <!-- ═══ CONFIG FORM PANEL ═══ -->
        <div class="panel-card pa-6">
          <div class="panel-header mb-6">
            <div class="flex items-center gap-2">
              <i class="mdi mdi-draw text-red text-xl"></i>
              <h3 class="panel-title">Signatory & Governance Settings</h3>
            </div>
            <p class="panel-desc">Configure authorized signatories appearing on issued certificates.</p>
          </div>

          <div class="form-grid">
            <div class="form-group mb-4">
              <label class="form-label">Signatory 1 Name (Left)</label>
              <input
                v-model="config.certificate_sig1_name"
                type="text"
                placeholder="e.g. Mr. Ameer Faisal"
                class="form-input"
              />
            </div>

            <div class="form-group mb-4">
              <label class="form-label">Signatory 1 Title (Left)</label>
              <input
                v-model="config.certificate_sig1_title"
                type="text"
                placeholder="e.g. Co-founder & Convenor"
                class="form-input"
              />
            </div>

            <div class="form-group mb-4">
              <label class="form-label">Signatory 2 Name (Right)</label>
              <input
                v-model="config.certificate_sig2_name"
                type="text"
                placeholder="e.g. Mr. Bins K Thomas"
                class="form-input"
              />
            </div>

            <div class="form-group mb-5">
              <label class="form-label">Signatory 2 Title (Right)</label>
              <input
                v-model="config.certificate_sig2_title"
                type="text"
                placeholder="e.g. General Secretary"
                class="form-input"
              />
            </div>

            <button
              class="btn-red w-full mb-3"
              :disabled="saving"
              @click="saveConfig"
            >
              <span v-if="saving" class="spinner-sm-white"></span>
              <i v-else class="mdi mdi-content-save-outline"></i>
              <span>Save Signatory Configuration</span>
            </button>

            <NuxtLink
              to="/dashboard/admin/settings"
              class="btn-glass w-full text-center flex items-center justify-center gap-2"
            >
              <i class="mdi mdi-image-outline text-red"></i>
              <span>Upload Logo, Seal & Signature Assets</span>
            </NuxtLink>
          </div>
        </div>

        <!-- ═══ LIVE PREVIEW PANEL ═══ -->
        <div class="panel-card pa-6 flex flex-col">
          <div class="panel-header mb-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="mdi mdi-eye-outline text-emerald text-xl"></i>
              <h3 class="panel-title">Live Certificate Preview</h3>
            </div>
            <span class="preview-badge">A4 Standard Format</span>
          </div>

          <div class="preview-frame flex-1 flex items-center justify-center">
            <CertificatePreview :config="config" />
          </div>
        </div>
      </div>

      <!-- Toast Notification -->
      <div v-if="toast.show" :class="['toast-notification', toast.type]">
        <i :class="['mdi', toast.type === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle']"></i>
        <span>{{ toast.text }}</span>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import CertificatePreview from '@/components/CertificatePreview.vue';

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], roles: ['super_admin', 'main_admin'] });

const api = useApi();
const config = ref<any>({
  certificate_logo: '',
  certificate_seal: '',
  certificate_sig1_image: '',
  certificate_sig1_name: '',
  certificate_sig1_title: '',
  certificate_sig2_image: '',
  certificate_sig2_name: '',
  certificate_sig2_title: '',
});

const saving = ref(false);
const toast = ref({ show: false, text: '', type: 'success' });

const showToast = (msg: string, type: string = 'success') => {
  toast.value = { show: true, text: msg, type };
  setTimeout(() => { toast.value.show = false; }, 3500);
};

onMounted(async () => {
  try {
    const res = await api.get('/admin/config');
    const data = res.data || res;
    if (data && typeof data === 'object') {
      config.value = { ...config.value, ...data };
    }
  } catch (error) {
    console.error('Failed to load config', error);
  }
});

const saveConfig = async () => {
  saving.value = true;
  try {
    await api.put('/admin/config', {
      certificate_sig1_name: config.value.certificate_sig1_name,
      certificate_sig1_title: config.value.certificate_sig1_title,
      certificate_sig2_name: config.value.certificate_sig2_name,
      certificate_sig2_title: config.value.certificate_sig2_title,
    });
    showToast('Signatory configuration saved successfully!');
  } catch (error) {
    showToast('Failed to save configuration', 'error');
  } finally {
    saving.value = false;
  }
};
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
  justify-content: center;
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
.btn-red:hover:not(:disabled) {
  background: #C4131B;
  transform: translateY(-1px);
}
.btn-red:disabled { opacity: 0.6; cursor: not-allowed; }

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

.grid-2col {
  display: grid;
  grid-template-columns: 480px 1fr;
  gap: 28px;
}
@media (max-width: 1100px) {
  .grid-2col { grid-template-columns: 1fr; }
}

.panel-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
}

.panel-header {
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  padding-bottom: 16px;
}

.panel-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
}

.panel-desc {
  font-size: 0.82rem;
  color: #64748B;
  margin: 4px 0 0 0;
}

.text-red { color: #E31B23; }
.text-emerald { color: #059669; }

.form-group { display: flex; flex-direction: column; }
.form-label { font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 8px; }

.form-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  font-size: 0.9rem;
  color: #0F172A;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.form-input:focus { border-color: #E31B23; }

.preview-badge {
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 800;
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.preview-frame {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 24px;
  overflow: auto;
  min-height: 480px;
}

.toast-notification {
  position: fixed;
  bottom: 32px;
  right: 32px;
  padding: 14px 24px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 0.88rem;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
  z-index: 9999;
}
.toast-notification.success { background: #059669; color: #FFFFFF; }
.toast-notification.error { background: #DC2626; color: #FFFFFF; }

.spinner-sm-white {
  width: 14px; height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>

