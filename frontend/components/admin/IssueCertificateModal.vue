<template>
  <Teleport to="body">
    <div v-if="show" class="gsfin-modal-overlay" @click.self="show = false">
      <div class="gsfin-modal-card">
        <div class="modal-header">
          <div class="header-title-flex">
            <div class="modal-icon-badge">
              <i class="mdi mdi-certificate-outline"></i>
            </div>
            <div>
              <h3 class="modal-title">Issue Verified Credential</h3>
              <p class="modal-subtitle">Directly issue an authentic credential to a qualified candidate.</p>
            </div>
          </div>
          <button class="modal-close-btn" @click="show = false">
            <i class="mdi mdi-close"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- Candidate Name -->
          <div class="form-group mb-4">
            <label class="form-label">Candidate Full Name <span class="text-red">*</span></label>
            <input
              v-model="studentName"
              type="text"
              placeholder="e.g. John Doe"
              class="form-input"
            />
          </div>

          <!-- Candidate Email -->
          <div class="form-group mb-4">
            <label class="form-label">Candidate Email Address <span class="text-red">*</span></label>
            <input
              v-model="studentEmail"
              type="email"
              placeholder="e.g. john.doe@example.com"
              class="form-input"
            />
          </div>

          <!-- Examination Selection -->
          <div class="form-group mb-4">
            <label class="form-label">Certification Examination <span class="text-red">*</span></label>
            <div class="select-wrapper">
              <select v-model="selectedExam" class="form-select" :disabled="loadingExams">
                <option :value="null">-- Choose Qualification Exam --</option>
                <option v-for="exam in exams" :key="exam.id" :value="exam.id">
                  {{ exam.name }}
                </option>
              </select>
              <i class="mdi mdi-chevron-down select-icon"></i>
            </div>
          </div>

          <!-- Accredited Partner Center Selection -->
          <div class="form-group mb-2">
            <label class="form-label">Accredited Partner Center (Optional)</label>
            <div class="select-wrapper">
              <select v-model="selectedOrg" class="form-select" :disabled="loadingOrgs">
                <option :value="null">-- GSFIN Direct Authority / Independent --</option>
                <option v-for="org in organizations" :key="org.id" :value="org.id">
                  {{ org.name }} ({{ org.city || 'Global' }}, {{ org.country || 'Jurisdiction' }})
                </option>
              </select>
              <i class="mdi mdi-chevron-down select-icon"></i>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="show = false">Cancel</button>
          <button
            class="btn-red"
            :disabled="issuing || !studentName.trim() || !studentEmail.trim() || !selectedExam"
            @click="issueCertificate"
          >
            <span v-if="issuing" class="spinner-sm-white"></span>
            <i v-else class="mdi mdi-check-circle-outline"></i>
            <span>Issue Certificate Now</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useApi } from '@/composables/useApi';

const props = defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue', 'issued']);

const show = ref(props.modelValue);
const api = useApi();

const studentName = ref('');
const studentEmail = ref('');
const selectedExam = ref<string | null>(null);
const selectedOrg = ref<string | null>(null);

const exams = ref<any[]>([]);
const organizations = ref<any[]>([]);
const loadingExams = ref(false);
const loadingOrgs = ref(false);
const issuing = ref(false);

watch(() => props.modelValue, (val) => {
  show.value = val;
  if (val) {
    loadData();
  }
});

watch(show, (val) => {
  emit('update:modelValue', val);
});

const loadData = async () => {
  loadExams();
  loadOrganizations();
};

const loadExams = async () => {
  loadingExams.value = true;
  try {
    const { data } = await api.get('/main-admin/exams');
    exams.value = data || [];
  } catch (error) {
    console.error('Failed to load exams:', error);
  } finally {
    loadingExams.value = false;
  }
};

const loadOrganizations = async () => {
  loadingOrgs.value = true;
  try {
    const { data } = await api.get('/main-admin/organizations');
    organizations.value = data || [];
  } catch (error) {
    console.error('Failed to load organizations:', error);
  } finally {
    loadingOrgs.value = false;
  }
};

const issueCertificate = async () => {
  if (!studentName.value.trim() || !studentEmail.value.trim() || !selectedExam.value) return;

  issuing.value = true;
  try {
    const res: any = await api.post('/main-admin/certificates/issue-direct', {
      studentName: studentName.value.trim(),
      studentEmail: studentEmail.value.trim(),
      examId: selectedExam.value,
      orgId: selectedOrg.value
    });

    emit('issued');
    show.value = false;
    studentName.value = '';
    studentEmail.value = '';
    selectedExam.value = null;
    selectedOrg.value = null;

    alert(`Certificate issued successfully! Serial ID: ${res.certNumber || res.data?.certNumber}`);
  } catch (error: any) {
    console.error('Failed to issue certificate:', error);
    alert(error.response?.data?.message || 'Failed to issue certificate');
  } finally {
    issuing.value = false;
  }
};
</script>

<style scoped>
.gsfin-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
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
  max-width: 520px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.16);
  overflow: hidden;
  animation: modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 24px 28px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FAFAFD;
}

.header-title-flex {
  display: flex;
  align-items: center;
  gap: 14px;
}

.modal-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(227, 27, 35, 0.08);
  color: #E31B23;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.25;
}

.modal-subtitle {
  margin: 3px 0 0 0;
  font-size: 0.82rem;
  color: #64748B;
}

.modal-close-btn {
  background: none;
  border: none;
  color: #94A3B8;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.15s;
}

.modal-close-btn:hover {
  background: #F1F5F9;
  color: #0F172A;
}

.modal-body {
  padding: 24px 28px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 0.84rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 11px 14px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  font-size: 0.88rem;
  color: #0F172A;
  background: #FFFFFF;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
}

.form-input:focus {
  outline: none;
  border-color: #E31B23;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.1);
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-select {
  width: 100%;
  padding: 11px 40px 11px 14px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  font-size: 0.88rem;
  color: #0F172A;
  background: #FFFFFF;
  appearance: none;
  transition: all 0.2s;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
}

.form-select:focus {
  outline: none;
  border-color: #E31B23;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.1);
}

.select-icon {
  position: absolute;
  right: 14px;
  color: #94A3B8;
  font-size: 1.15rem;
  pointer-events: none;
}

.modal-footer {
  padding: 18px 28px;
  background: #FAFAFD;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  padding: 10px 20px;
  border-radius: 12px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  color: #475569;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel:hover {
  background: #F1F5F9;
  color: #0F172A;
}

.btn-red {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  padding: 10px 22px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.86rem;
  cursor: pointer;
  transition: all 0.2s ease;
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

.spinner-sm-white {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
