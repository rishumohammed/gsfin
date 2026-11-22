<template>
  <div class="email-templates-tab">
    <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
      <div>
        <h2 class="text-base font-semibold text-slate-900 m-0">Email Templates</h2>
        <p class="text-xs text-slate-500 mt-1 m-0">
          Customize automated transactional email templates for student registrations, credentials, OTPs, and exams.
        </p>
      </div>

      <div class="flex items-center gap-2" v-if="templates.length > 0">
        <button
          type="button"
          class="btn-glass text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
          :disabled="loading || resetting"
          @click="resetToDefaults"
          title="Restore standard default templates"
        >
          <i :class="['mdi', resetting ? 'mdi-loading spin-icon' : 'mdi-restore']"></i>
          Restore Standard Defaults
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-16 text-slate-500 font-medium">
      <span class="spinner-sm-red mb-2"></span>
      <p class="text-xs">Loading email templates...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="templates.length === 0" class="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-slate-50 my-2">
      <div class="w-12 h-12 rounded-2xl bg-red-50 text-red flex items-center justify-center mx-auto mb-3 text-2xl border border-red-100">
        <i class="mdi mdi-email-sync-outline"></i>
      </div>
      <h3 class="text-sm font-semibold text-slate-800 m-0">No Email Templates Found</h3>
      <p class="text-xs text-slate-500 mt-1 mb-4 max-w-md mx-auto">
        Your email templates database is currently uninitialized. Click below to load all standard default templates.
      </p>
      <button
        type="button"
        class="btn-red text-xs py-2 px-4 inline-flex items-center gap-1.5"
        :disabled="resetting"
        @click="resetToDefaults"
      >
        <i :class="['mdi', resetting ? 'mdi-loading spin-icon' : 'mdi-download-outline']"></i>
        Initialize Default Templates
      </button>
    </div>

    <!-- Templates Editor Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
      <!-- Left: Template List -->
      <div class="md:col-span-4">
        <div class="border border-slate-200 rounded-2xl bg-white p-2.5 shadow-xs">
          <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2 border-b border-slate-100 mb-1 flex items-center justify-between">
            <span>Templates</span>
            <span class="badge-chip chip-slate text-[10px]">{{ templates.length }}</span>
          </div>

          <div class="space-y-1 max-h-[560px] overflow-y-auto">
            <button
              v-for="template in templates"
              :key="template.id"
              type="button"
              :class="['template-item-btn', { active: selectedTemplate?.id === template.id }]"
              @click="selectTemplate(template)"
            >
              <div class="flex items-center gap-2">
                <i :class="['mdi', selectedTemplate?.id === template.id ? 'mdi-email-open-outline text-red' : 'mdi-email-outline text-slate-400']"></i>
                <div class="text-left min-w-0">
                  <div class="text-xs font-semibold truncate text-slate-800">{{ template.name }}</div>
                  <div class="text-[10px] text-slate-400 font-mono truncate">{{ template.id }}</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Right: Template Editor -->
      <div class="md:col-span-8">
        <div v-if="selectedTemplate" class="border border-slate-200 rounded-2xl bg-white p-6 shadow-xs">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-sm font-semibold text-slate-900 m-0">Edit: {{ selectedTemplate.name }}</h3>
              <span class="text-[10px] text-slate-400 font-mono">ID: {{ selectedTemplate.id }}</span>
            </div>
            <span class="badge-chip chip-green">
              <i class="mdi mdi-check-circle"></i> Active
            </span>
          </div>

          <form @submit.prevent="saveTemplate">
            <!-- Email Subject -->
            <div class="form-group mb-4">
              <label class="form-label-xs">
                Email Subject <span class="text-red">*</span>
              </label>
              <input
                v-model="editForm.subject"
                type="text"
                class="modal-input-field"
                placeholder="Enter email subject..."
                required
              />
            </div>

            <!-- HTML Body -->
            <div class="form-group mb-4">
              <div class="flex items-center justify-between mb-1">
                <label class="form-label-xs mb-0">HTML Body</label>
                <span class="text-[11px] text-slate-400">Raw HTML with placeholder tags</span>
              </div>
              <textarea
                v-model="editForm.body"
                rows="14"
                class="modal-input-field font-monospace text-xs leading-relaxed"
                placeholder="Enter HTML template here..."
                required
              ></textarea>
            </div>

            <!-- Placeholders Info Box -->
            <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-5">
              <div class="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <i class="mdi mdi-variable text-red"></i> Available Placeholders:
              </div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span
                  v-for="ph in currentPlaceholders"
                  :key="ph"
                  class="placeholder-tag cursor-pointer"
                  title="Click to copy placeholder"
                  @click="copyPlaceholder(ph)"
                >
                  <code v-pre>{{ {{ ph }} }}</code>
                </span>
              </div>
              <p class="text-[11px] text-slate-400 mt-2 mb-0">
                Click any placeholder to copy it to clipboard. These will be dynamically replaced when sending emails.
              </p>
            </div>

            <!-- Actions Row -->
            <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button type="button" class="btn-glass text-xs py-2 px-4" @click="resetForm">
                Discard Changes
              </button>
              <button type="submit" class="btn-red text-xs py-2 px-4 inline-flex items-center gap-1.5" :disabled="saving">
                <i :class="['mdi', saving ? 'mdi-loading spin-icon' : 'mdi-check']"></i>
                {{ saving ? 'Saving Template...' : 'Save Template' }}
              </button>
            </div>
          </form>
        </div>

        <div v-else class="text-center py-20 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-400">
          <i class="mdi mdi-email-edit-outline text-4xl block mb-2 text-slate-300"></i>
          <p class="text-xs font-semibold text-slate-600 m-0">Select a Template</p>
          <p class="text-[11px] text-slate-400 mt-1 m-0">Choose an email template from the left list to edit its subject and body.</p>
        </div>
      </div>
    </div>

    <!-- Notification Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="lg" timeout="3000">
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

const api = useApi();

const templates = ref<any[]>([]);
const loading = ref(true);
const selectedTemplate = ref<any>(null);
const saving = ref(false);
const resetting = ref(false);

const snackbar = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref('success');

const editForm = ref({
  subject: '',
  body: ''
});

const currentPlaceholders = computed(() => {
  if (!selectedTemplate.value) return ['name'];
  const id = selectedTemplate.value.id;

  switch (id) {
    case 'exam_registration_otp':
      return ['brand_logo', 'name', 'exam_name', 'otp'];
    case 'exam_registration_success':
      return ['brand_logo', 'name', 'exam_name', 'exam_date', 'exam_duration', 'email', 'password', 'exam_link'];
    case 'exam_reminder_1day':
    case 'exam_reminder_10min':
      return ['brand_logo', 'name', 'exam_name', 'exam_link'];
    case 'student_registration_otp':
      return ['name', 'otp', 'center_name'];
    case 'student_credentials':
      return ['name', 'email', 'password', 'otp', 'center_name', 'login_url'];
    case 'password_reset':
      return ['reset_link'];
    case 'exam_certificate':
      return ['name', 'exam_name', 'certificate_number', 'verify_url'];
    default:
      return ['name', 'email'];
  }
});

onMounted(() => {
  fetchTemplates();
});

const fetchTemplates = async () => {
  try {
    loading.value = true;
    const { data } = await api.get('/admin/email-templates');
    templates.value = Array.isArray(data) ? data : [];
    
    if (templates.value.length > 0 && !selectedTemplate.value) {
      selectTemplate(templates.value[0]);
    }
  } catch (error: any) {
    console.error('Failed to load email templates', error);
  } finally {
    loading.value = false;
  }
};

const selectTemplate = (template: any) => {
  selectedTemplate.value = template;
  editForm.value = {
    subject: template.subject || '',
    body: template.body || ''
  };
};

const resetForm = () => {
  if (selectedTemplate.value) {
    editForm.value = {
      subject: selectedTemplate.value.subject || '',
      body: selectedTemplate.value.body || ''
    };
  }
};

const saveTemplate = async () => {
  if (!selectedTemplate.value) return;

  try {
    saving.value = true;
    await api.put(`/admin/email-templates/${selectedTemplate.value.id}`, {
      subject: editForm.value.subject,
      body: editForm.value.body
    });

    snackbarMessage.value = `Template "${selectedTemplate.value.name}" updated successfully`;
    snackbarColor.value = 'success';
    snackbar.value = true;
    
    // Update local state
    const idx = templates.value.findIndex(t => t.id === selectedTemplate.value.id);
    if (idx !== -1) {
      templates.value[idx].subject = editForm.value.subject;
      templates.value[idx].body = editForm.value.body;
      selectedTemplate.value = { ...templates.value[idx] };
    }
  } catch (error: any) {
    snackbarMessage.value = error.response?.data?.message || 'Failed to update template';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    saving.value = false;
  }
};

const resetToDefaults = async () => {
  if (!confirm('Are you sure you want to initialize/restore the default GSFIN email templates? Any custom edits will be reset.')) {
    return;
  }

  try {
    resetting.value = true;
    const { data } = await api.post('/admin/email-templates/reset-defaults');
    templates.value = data.templates || [];
    if (templates.value.length > 0) {
      selectTemplate(templates.value[0]);
    }
    snackbarMessage.value = 'Default email templates loaded successfully!';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (err: any) {
    snackbarMessage.value = err.response?.data?.message || err.message || 'Failed to load default templates';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    resetting.value = false;
  }
};

const copyPlaceholder = (ph: string) => {
  const text = `{{${ph}}}`;
  navigator.clipboard.writeText(text);
  snackbarMessage.value = `Copied ${text} to clipboard!`;
  snackbarColor.value = 'info';
  snackbar.value = true;
};
</script>

<style scoped>
.font-monospace {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
}

.template-item-btn {
  width: 100%;
  display: block;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}
.template-item-btn:hover {
  background: #F8FAFC;
}
.template-item-btn.active {
  background: #FEF2F2;
  border-color: rgba(227, 27, 35, 0.2);
}

.placeholder-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  font-size: 0.72rem;
  color: #0F172A;
  transition: all 0.15s;
}
.placeholder-tag:hover {
  background: #F1F5F9;
  border-color: #CBD5E1;
  color: #E31B23;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label-xs {
  font-size: 0.78rem;
  font-weight: 600;
  color: #334155;
}

.modal-input-field {
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #F8FAFC;
  font-size: 0.86rem;
  color: #0F172A;
  outline: none;
  box-sizing: border-box;
  transition: all 0.15s;
}
.modal-input-field:focus {
  border-color: #E31B23;
  background: #FFFFFF;
}

.badge-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.chip-green { background: rgba(16, 185, 129, 0.1); color: #059669; }
.chip-slate { background: rgba(100, 116, 139, 0.1); color: #64748B; }

.btn-glass {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #FFFFFF;
  color: #334155;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-glass:hover:not(:disabled) {
  background: #F8FAFC;
  color: #0F172A;
}

.btn-red {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(227, 27, 35, 0.2);
  cursor: pointer;
  transition: all 0.15s;
}
.btn-red:hover:not(:disabled) {
  background: #C4131B;
}
.btn-red:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-sm-red {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(227, 27, 35, 0.2);
  border-top-color: #E31B23;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>