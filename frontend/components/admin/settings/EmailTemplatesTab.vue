<template>
  <div class="email-templates-tab">
    <!-- Intro Banner Matching EducationLevelsTab Style -->
    <div class="intro-banner mb-6">
      <div class="intro-banner-inner">
        <div class="intro-left">
          <div class="icon-avatar-lg bg-red-light text-red">
            <i class="mdi mdi-email-edit-outline"></i>
          </div>
          <div>
            <h3 class="intro-title">Transactional Email Templates</h3>
            <p class="intro-desc">
              Customize automated email notifications sent to students and candidates for registrations, credentials, OTP verification, and qualification exam updates.
            </p>
          </div>
        </div>

        <div class="intro-right">
          <button
            type="button"
            class="btn-reset-defaults"
            :disabled="loading || resetting"
            @click="resetToDefaults"
            title="Restore standard GSFIN templates"
          >
            <i :class="['mdi', resetting ? 'mdi-loading spin-icon' : 'mdi-restore']"></i>
            <span>Restore Standard Defaults</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="empty-state-card">
      <span class="spinner-sm-red mb-2"></span>
      <p class="empty-state-text">Loading email templates...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="templates.length === 0" class="empty-state-card">
      <div class="icon-avatar-lg bg-red-light text-red mx-auto mb-3">
        <i class="mdi mdi-email-sync-outline"></i>
      </div>
      <h4 class="empty-title">No Email Templates Found</h4>
      <p class="empty-desc">
        Your email templates database is currently uninitialized. Click below to load all standard default templates.
      </p>
      <button
        type="button"
        class="btn-red mt-4"
        :disabled="resetting"
        @click="resetToDefaults"
      >
        <i :class="['mdi', resetting ? 'mdi-loading spin-icon' : 'mdi-download-outline']"></i>
        <span>Initialize Default Templates</span>
      </button>
    </div>

    <!-- Master-Detail 2-Column Layout (Explicit Flex Grid) -->
    <div v-else class="templates-workspace-layout">
      <!-- Left Column: Template Selection List -->
      <div class="templates-sidebar">
        <div class="templates-list-card">
          <div class="templates-list-header">
            <span class="list-header-title">Templates Roster</span>
            <span class="badge-chip chip-slate">{{ templates.length }}</span>
          </div>

          <div class="templates-scroll-list">
            <button
              v-for="template in templates"
              :key="template.id"
              type="button"
              :class="['template-item-card', { active: selectedTemplate?.id === template.id }]"
              @click="selectTemplate(template)"
            >
              <div class="template-item-icon">
                <i :class="['mdi', selectedTemplate?.id === template.id ? 'mdi-email-open-outline' : 'mdi-email-outline']"></i>
              </div>
              <div class="template-item-info">
                <div class="template-item-title">{{ template.name }}</div>
                <div class="template-item-id">{{ template.id }}</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column: Template Editor Workspace -->
      <div class="template-editor-main">
        <div v-if="selectedTemplate" class="editor-card">
          <!-- Editor Header -->
          <div class="editor-header-bar">
            <div>
              <h3 class="editor-title">{{ selectedTemplate.name }}</h3>
              <span class="editor-id-pill">ID: {{ selectedTemplate.id }}</span>
            </div>
            <div class="editor-status-wrap">
              <span class="badge-chip chip-green">
                <i class="mdi mdi-check-circle"></i> Active Template
              </span>
            </div>
          </div>

          <form @submit.prevent="saveTemplate">
            <!-- Email Subject -->
            <div class="form-group-block">
              <label class="form-label-xs">
                Email Subject Line <span class="required-star">*</span>
              </label>
              <input
                v-model="editForm.subject"
                type="text"
                class="editor-input"
                placeholder="Enter email subject line..."
                required
              />
            </div>

            <!-- HTML Body -->
            <div class="form-group-block">
              <div class="editor-label-row">
                <label class="form-label-xs">HTML Email Template Body</label>
                <span class="editor-label-hint">HTML markup with dynamic placeholders</span>
              </div>
              <textarea
                v-model="editForm.body"
                rows="14"
                class="editor-textarea"
                placeholder="Enter HTML body markup here..."
                required
              ></textarea>
            </div>

            <!-- Placeholders Info Box -->
            <div class="placeholders-box">
              <div class="placeholders-header">
                <i class="mdi mdi-code-braces text-red"></i> Available Dynamic Variables
              </div>
              <div class="placeholders-list">
                <button
                  v-for="ph in currentPlaceholders"
                  :key="ph"
                  type="button"
                  class="placeholder-pill-btn"
                  :title="`Click to copy {{${ph}}} to clipboard`"
                  @click="copyPlaceholder(ph)"
                >
                  <span>&#123;&#123;{{ ph }}&#125;&#125;</span>
                  <i class="mdi mdi-content-copy text-xs"></i>
                </button>
              </div>
              <p class="placeholders-footnote">
                Click any placeholder to copy it to clipboard. Placeholders are dynamically substituted when emails are generated.
              </p>
            </div>

            <!-- Editor Action Buttons -->
            <div class="editor-actions-row">
              <button type="button" class="btn-glass" @click="resetForm">
                <i class="mdi mdi-undo"></i> Discard Changes
              </button>
              <button type="submit" class="btn-red" :disabled="saving">
                <i :class="['mdi', saving ? 'mdi-loading spin-icon' : 'mdi-check-decagram']"></i>
                <span>{{ saving ? 'Saving Template...' : 'Save Template Changes' }}</span>
              </button>
            </div>
          </form>
        </div>

        <div v-else class="empty-state-card">
          <i class="mdi mdi-email-edit-outline empty-icon"></i>
          <h4 class="empty-title">Select a Template</h4>
          <p class="empty-desc">Choose an email template from the roster on the left to edit its subject and body.</p>
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
  if (!confirm('Are you sure you want to restore all standard GSFIN email templates? Any custom edits will be replaced with defaults.')) {
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
/* Intro Banner */
.intro-banner {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 18px 24px;
  margin-bottom: 24px;
}

.intro-banner-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.intro-left {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 800px;
}

.intro-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
}

.intro-desc {
  font-size: 0.8rem;
  color: #64748B;
  margin: 4px 0 0 0;
  line-height: 1.5;
}

.icon-avatar-lg {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.bg-red-light {
  background: rgba(227, 27, 35, 0.08);
}
.text-red {
  color: #E31B23;
}

.btn-reset-defaults {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  color: #475569;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}
.btn-reset-defaults:hover:not(:disabled) {
  background: #FEF2F2;
  border-color: rgba(227, 27, 35, 0.3);
  color: #E31B23;
}
.btn-reset-defaults:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Master-Detail Workspace Layout */
.templates-workspace-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
@media (max-width: 960px) {
  .templates-workspace-layout {
    flex-direction: column;
  }
}

.templates-sidebar {
  width: 320px;
  flex-shrink: 0;
}
@media (max-width: 960px) {
  .templates-sidebar {
    width: 100%;
  }
}

.template-editor-main {
  flex: 1;
  min-width: 0;
  width: 100%;
}

/* Templates List Card */
.templates-list-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 18px;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
}

.templates-list-header {
  padding: 10px 14px 12px 14px;
  border-bottom: 1px solid #F1F5F9;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.list-header-title {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748B;
}

.templates-scroll-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 600px;
  overflow-y: auto;
}

.template-item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  width: 100%;
  cursor: pointer;
  transition: all 0.18s ease;
  text-align: left;
  box-sizing: border-box;
}
.template-item-card:hover {
  background: #F8FAFC;
}
.template-item-card.active {
  background: #FEF2F2;
  border-color: rgba(227, 27, 35, 0.25);
}
.template-item-card.active .template-item-title {
  color: #E31B23;
}
.template-item-card.active .template-item-icon {
  background: #FEE2E2;
  color: #E31B23;
}

.template-item-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #F1F5F9;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  flex-shrink: 0;
  transition: all 0.18s;
}

.template-item-info {
  min-width: 0;
  flex: 1;
}

.template-item-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.template-item-id {
  font-size: 0.7rem;
  color: #94A3B8;
  font-family: monospace;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Editor Card */
.editor-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 18px;
  padding: 24px 28px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
}

.editor-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  margin-bottom: 20px;
  border-bottom: 1px solid #F1F5F9;
  flex-wrap: wrap;
}

.editor-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
}

.editor-id-pill {
  font-size: 0.72rem;
  font-family: monospace;
  color: #64748B;
  background: #F1F5F9;
  padding: 2px 8px;
  border-radius: 6px;
  margin-top: 4px;
  display: inline-block;
}

.form-group-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.form-label-xs {
  font-size: 0.78rem;
  font-weight: 600;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.required-star {
  color: #E31B23;
}

.editor-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.editor-label-hint {
  font-size: 0.72rem;
  color: #94A3B8;
}

.editor-input {
  width: 100%;
  padding: 11px 16px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  background: #F8FAFC;
  font-size: 0.88rem;
  color: #0F172A;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: all 0.18s ease;
}
.editor-input:focus {
  background: #FFFFFF;
  border-color: #E31B23;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.1);
}

.editor-textarea {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  background: #0B0F17;
  color: #E2E8F0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.18s ease;
  resize: vertical;
  min-height: 280px;
}
.editor-textarea:focus {
  border-color: #E31B23;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.15);
}

/* Placeholders Box */
.placeholders-box {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 24px;
}

.placeholders-header {
  font-size: 0.74rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #475569;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.placeholders-list {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.placeholder-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  font-size: 0.75rem;
  font-family: monospace;
  color: #0F172A;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}
.placeholder-pill-btn:hover {
  background: #FEF2F2;
  border-color: rgba(227, 27, 35, 0.3);
  color: #E31B23;
  transform: translateY(-1px);
}

.placeholders-footnote {
  font-size: 0.72rem;
  color: #94A3B8;
  margin: 10px 0 0 0;
  line-height: 1.4;
}

/* Editor Action Buttons */
.editor-actions-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 18px;
  border-top: 1px solid #F1F5F9;
}

.btn-glass {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
  color: #334155;
  border: 1px solid rgba(15, 23, 42, 0.14);
  padding: 10px 18px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.84rem;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.18s ease;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}
.btn-glass:hover {
  background: #F1F5F9;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.22);
}

.btn-red {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  padding: 11px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.86rem;
  box-shadow: 0 3px 12px rgba(227, 27, 35, 0.25);
  transition: all 0.18s ease;
  cursor: pointer;
  text-decoration: none;
}
.btn-red:hover:not(:disabled) {
  background: #C4131B;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(227, 27, 35, 0.3);
}
.btn-red:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Badges */
.badge-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 50px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.chip-green { background: rgba(16, 185, 129, 0.1); color: #059669; }
.chip-slate { background: rgba(100, 116, 139, 0.1); color: #64748B; }

/* Empty & Loading States */
.empty-state-card {
  text-align: center;
  padding: 48px 24px;
  background: #FFFFFF;
  border: 1px dashed rgba(15, 23, 42, 0.14);
  border-radius: 18px;
}

.empty-icon {
  font-size: 3rem;
  color: #CBD5E1;
  display: block;
  margin-bottom: 8px;
}
.empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
}
.empty-desc {
  font-size: 0.8rem;
  color: #64748B;
  margin: 4px 0 0 0;
}
.empty-state-text {
  font-size: 0.84rem;
  color: #64748B;
  font-weight: 500;
}

.spinner-sm-red {
  display: inline-block;
  width: 22px;
  height: 22px;
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