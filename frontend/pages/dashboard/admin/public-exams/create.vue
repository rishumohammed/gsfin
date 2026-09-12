<template>
  <div class="exam-create-page min-h-screen pb-16" style="background-color: #FAFAFD;">
    <!-- Page Header -->
    <div class="bg-white border-b border-slate-200/80 shadow-xs mb-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div class="d-flex align-center gap-4">
            <v-btn
              to="/dashboard/admin/public-exams"
              icon="mdi-arrow-left"
              variant="outlined"
              color="slate"
              size="small"
              class="rounded-xl border-slate-300"
              title="Back to All Exams"
            />
            <div>
              <div class="d-flex align-center gap-2 mb-1 flex-wrap">
                <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  {{ isEditMode ? 'Edit Certification Exam' : 'Create Certification Exam' }}
                </h1>
              </div>
              <p class="text-xs sm:text-sm text-slate-500 font-medium">
                {{ isEditMode ? 'Modify configurations, passing criteria, and certificate rules for this exam.' : 'Set up basic exam details, time limits, candidate rules, proctoring options, and certificates.' }}
              </p>
            </div>
          </div>

          <div class="d-flex align-center gap-3">
            <v-btn
              variant="outlined"
              color="slate"
              class="text-none font-bold rounded-xl border-slate-300 text-slate-700 me-3 mr-3"
              to="/dashboard/admin/public-exams"
            >
              Cancel
            </v-btn>
            <v-btn
              color="#E31B23"
              size="large"
              class="font-bold text-white text-none rounded-xl shadow-md hover:bg-red-700"
              prepend-icon="mdi-check-circle-outline"
              :loading="saving"
              @click="saveExam"
            >
              {{ isEditMode ? 'Save Settings' : 'Create Exam' }}
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Form Container -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <v-form ref="examForm" v-model="formValid" lazy-validation>
        <v-row>
          <!-- Left Column: Form Sections -->
          <v-col cols="12" md="8">
            <!-- Section 1: Basic Information -->
            <div class="form-card mb-6">
              <div class="card-header-wrap">
                <div class="card-icon-box bg-red-50 text-red-600">
                  <v-icon icon="mdi-file-document-outline" size="20" color="#E31B23"></v-icon>
                </div>
                <div>
                  <h3 class="card-title">1. Basic Information</h3>
                  <p class="card-subtitle">Set title, category, description, and candidate instructions.</p>
                </div>
              </div>

              <div class="form-body">
                <div class="form-group mb-4">
                  <label class="form-label">Exam Title <span class="text-red-500">*</span></label>
                  <input
                    v-model="fields.name"
                    type="text"
                    placeholder="e.g. KEAM Physics Certification Test"
                    class="form-input"
                    @input="onTitleChange(fields.name)"
                  />
                </div>

                <v-row dense class="mb-4">
                  <v-col cols="12" sm="6">
                    <div class="form-group">
                      <label class="form-label">Category <span class="text-red-500">*</span></label>
                      <select v-model="fields.category_id" class="form-select">
                        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                      </select>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <div class="form-group">
                      <label class="form-label">SEO Slug <span class="text-red-500">*</span></label>
                      <input
                        v-model="fields.slug"
                        type="text"
                        placeholder="e.g. keam-physics-mock"
                        class="form-input"
                      />
                    </div>
                  </v-col>
                </v-row>

                <div class="form-group mb-4">
                  <label class="form-label">Exam Overview / Scope</label>
                  <textarea
                    v-model="fields.description"
                    rows="3"
                    placeholder="Brief overview explaining what candidates are evaluated on..."
                    class="form-textarea"
                  ></textarea>
                </div>

                <div class="form-group mb-4">
                  <label class="form-label">Instructions for Candidates</label>
                  <textarea
                    v-model="fields.instructions"
                    rows="3"
                    placeholder="Rules and guidelines shown to candidates before clicking 'Start Exam'..."
                    class="form-textarea"
                  ></textarea>
                </div>

                <v-row dense>
                  <v-col cols="12" sm="4">
                    <div class="form-group">
                      <label class="form-label">Duration (Minutes) <span class="text-red-500">*</span></label>
                      <input
                        v-model.number="fields.duration_minutes"
                        type="number"
                        min="1"
                        class="form-input"
                      />
                    </div>
                  </v-col>
                  <v-col cols="12" sm="4">
                    <div class="form-group">
                      <label class="form-label">Pass Percentage (%) <span class="text-red-500">*</span></label>
                      <input
                        v-model.number="fields.pass_percentage"
                        type="number"
                        min="0"
                        max="100"
                        class="form-input"
                      />
                    </div>
                  </v-col>
                  <v-col cols="12" sm="4">
                    <div class="form-group">
                      <label class="form-label">Negative Marks</label>
                      <input
                        v-model.number="fields.negative_marking"
                        type="number"
                        step="0.25"
                        placeholder="0.00"
                        class="form-input"
                      />
                    </div>
                  </v-col>
                </v-row>
              </div>
            </div>

            <!-- Section 2: Scheduling & Banner Image -->
            <div class="form-card mb-6">
              <div class="card-header-wrap">
                <div class="card-icon-box bg-blue-50 text-blue-600">
                  <v-icon icon="mdi-calendar-clock-outline" size="20" color="#2563EB"></v-icon>
                </div>
                <div>
                  <h3 class="card-title">2. Scheduling & Media</h3>
                  <p class="card-subtitle">Define registration windows, test availability, and cover artwork.</p>
                </div>
              </div>

              <div class="form-body">
                <v-row dense class="mb-4">
                  <v-col cols="12" sm="6">
                    <div class="form-group">
                      <label class="form-label">Registration Start Date</label>
                      <input
                        v-model="fields.registration_start_date"
                        type="datetime-local"
                        class="form-input"
                      />
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <div class="form-group">
                      <label class="form-label">Registration End Date</label>
                      <input
                        v-model="fields.registration_end_date"
                        type="datetime-local"
                        class="form-input"
                      />
                    </div>
                  </v-col>
                </v-row>

                <v-row dense class="mb-4">
                  <v-col cols="12" sm="6">
                    <div class="form-group">
                      <label class="form-label">Exam Access Start Date</label>
                      <input
                        v-model="fields.exam_start_date"
                        type="datetime-local"
                        class="form-input"
                      />
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <div class="form-group">
                      <label class="form-label">Exam Access End Date</label>
                      <input
                        v-model="fields.exam_end_date"
                        type="datetime-local"
                        class="form-input"
                      />
                    </div>
                  </v-col>
                </v-row>

                <div class="form-group">
                  <label class="form-label">Exam Cover Artwork</label>
                  <div v-if="fields.image_url" class="mb-3 rounded-xl overflow-hidden border border-slate-200 relative max-h-48 bg-slate-100">
                    <img
                      :src="fields.image_url.startsWith('http') ? fields.image_url : (baseUrl.replace('/api', '') + (fields.image_url.startsWith('/') ? fields.image_url : '/' + fields.image_url))"
                      alt="Exam Cover"
                      class="w-full h-48 object-cover"
                    />
                  </div>
                  <v-row dense>
                    <v-col cols="12" sm="6">
                      <div class="d-flex gap-2 align-center">
                        <input
                          type="file"
                          ref="fileInputRef"
                          accept="image/*"
                          class="hidden"
                          @change="onFileSelected"
                        />
                        <button
                          type="button"
                          class="btn-upload-cover"
                          :disabled="uploadingImage"
                          @click="triggerFileSelect"
                        >
                          <v-icon icon="mdi-cloud-upload-outline" size="18"></v-icon>
                          <span>{{ uploadingImage ? 'Uploading...' : 'Choose Image File' }}</span>
                        </button>
                      </div>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <input
                        v-model="fields.image_url"
                        type="text"
                        placeholder="Or paste external image URL..."
                        class="form-input"
                      />
                    </v-col>
                  </v-row>
                </div>
              </div>
            </div>

            <!-- Section 3: Simulator Rules & Integrity -->
            <div class="form-card mb-6">
              <div class="card-header-wrap">
                <div class="card-icon-box bg-purple-50 text-purple-600">
                  <v-icon icon="mdi-tune-variant" size="20" color="#9333EA"></v-icon>
                </div>
                <div>
                  <h3 class="card-title">3. Test Simulator & Proctoring Settings</h3>
                  <p class="card-subtitle">Configure question ordering, explanations, retakes, and tab monitoring.</p>
                </div>
              </div>

              <div class="form-body">
                <div class="toggle-grid mb-4">
                  <label class="toggle-card">
                    <input type="checkbox" v-model="fields.randomize_questions" class="toggle-checkbox" />
                    <div>
                      <div class="toggle-title">Randomize Question Order</div>
                      <div class="toggle-sub">Shuffle questions for each candidate</div>
                    </div>
                  </label>

                  <label class="toggle-card">
                    <input type="checkbox" v-model="fields.randomize_options" class="toggle-checkbox" />
                    <div>
                      <div class="toggle-title">Randomize Option Choices</div>
                      <div class="toggle-sub">Shuffle A/B/C/D choices dynamically</div>
                    </div>
                  </label>

                  <label class="toggle-card">
                    <input type="checkbox" v-model="fields.show_correct_answers" class="toggle-checkbox" />
                    <div>
                      <div class="toggle-title">Show Correct Answers</div>
                      <div class="toggle-sub">Display answers upon exam completion</div>
                    </div>
                  </label>

                  <label class="toggle-card">
                    <input type="checkbox" v-model="fields.show_explanations" class="toggle-checkbox" />
                    <div>
                      <div class="toggle-title">Show Detailed Explanations</div>
                      <div class="toggle-sub">Provide solution steps post-exam</div>
                    </div>
                  </label>
                </div>

                <v-divider class="my-4"></v-divider>

                <!-- Retakes & Certificates -->
                <v-row dense align="center" class="mb-4">
                  <v-col cols="12" sm="6">
                    <label class="toggle-card">
                      <input type="checkbox" v-model="fields.allow_retake" class="toggle-checkbox" />
                      <div>
                        <div class="toggle-title">Allow Test Retakes</div>
                        <div class="toggle-sub">Enable candidates to re-attempt test</div>
                      </div>
                    </label>
                  </v-col>
                  <v-col cols="12" sm="6" v-if="fields.allow_retake">
                    <div class="form-group">
                      <label class="form-label">Max Allowed Retakes (0 = Unlimited)</label>
                      <input v-model.number="fields.max_retakes" type="number" min="0" class="form-input" />
                    </div>
                  </v-col>
                </v-row>

                <!-- Proctoring -->
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div class="font-extrabold text-slate-900 text-sm mb-3 d-flex align-center gap-2">
                    <v-icon icon="mdi-shield-alert-outline" size="18" color="#E31B23"></v-icon>
                    AI Proctoring & Integrity Checks
                  </div>
                  <v-row dense align="center">
                    <v-col cols="12" sm="6">
                      <label class="toggle-card bg-white">
                        <input type="checkbox" v-model="fields.enable_proctoring" class="toggle-checkbox" />
                        <div>
                          <div class="toggle-title">Tab-Switch Detection</div>
                          <div class="toggle-sub">Track browser focus loss</div>
                        </div>
                      </label>
                    </v-col>
                    <v-col cols="12" sm="6" v-if="fields.enable_proctoring">
                      <div class="form-group">
                        <label class="form-label">Max Allowed Violations</label>
                        <input v-model.number="fields.max_proctoring_warnings" type="number" min="1" class="form-input" />
                      </div>
                    </v-col>
                  </v-row>
                </div>
              </div>
            </div>
          </v-col>

          <!-- Right Column: Workflow Status & Certificates Card -->
          <v-col cols="12" md="4">
            <!-- Publish Status Card -->
            <div class="form-card mb-6 sticky top-6">
              <div class="card-header-wrap">
                <div class="card-icon-box bg-emerald-50 text-emerald-600">
                  <v-icon icon="mdi-rocket-launch-outline" size="20" color="#10B981"></v-icon>
                </div>
                <div>
                  <h3 class="card-title">Workflow & Status</h3>
                  <p class="card-subtitle">Set public visibility and state.</p>
                </div>
              </div>

              <div class="form-body">
                <div class="form-group mb-6">
                  <label class="form-label">Publication Status</label>
                  <select v-model="fields.status" class="form-select capitalize">
                    <option value="draft">Draft (Offline Preview)</option>
                    <option value="review">Under Review</option>
                    <option value="published">Published (Live Online)</option>
                    <option value="archived">Archived (Read Only)</option>
                  </select>
                </div>

                <div class="form-group mb-6">
                  <label class="toggle-card bg-slate-50">
                    <input type="checkbox" v-model="fields.enable_certificate" class="toggle-checkbox" />
                    <div>
                      <div class="toggle-title">Automate Certificates</div>
                      <div class="toggle-sub">Auto-generate PDF certificate for passing candidates</div>
                    </div>
                  </label>
                </div>

                <v-btn
                  color="#E31B23"
                  block
                  size="large"
                  class="font-bold text-white text-none rounded-xl shadow-md mb-3"
                  prepend-icon="mdi-content-save-outline"
                  :loading="saving"
                  @click="saveExam"
                >
                  {{ isEditMode ? 'Save Settings' : 'Create Certification Exam' }}
                </v-btn>

                <v-btn
                  variant="outlined"
                  color="slate"
                  block
                  class="text-none font-bold rounded-xl border-slate-300 text-slate-700"
                  to="/dashboard/admin/public-exams"
                >
                  Cancel
                </v-btn>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-form>
    </div>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="lg">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'main_admin', 'sub_admin', 'lms_user']
});

const route = useRoute();
const router = useRouter();
const api = useApi();

const isEditMode = computed(() => !!route.query.id);
const loading = ref(false);
const saving = ref(false);
const formValid = ref(false);
const examForm = ref<any>(null);

const categories = ref<any[]>([]);

const fields = ref<any>({
  name: '',
  category_id: '',
  slug: '',
  description: '',
  instructions: '',
  duration_minutes: 60,
  pass_percentage: 50,
  negative_marking: 0.00,
  randomize_questions: false,
  randomize_options: false,
  show_correct_answers: true,
  show_explanations: true,
  allow_retake: true,
  max_retakes: 0,
  enable_certificate: true,
  anonymous_access: true,
  require_name: true,
  require_email: false,
  require_mobile: false,
  enable_proctoring: false,
  max_proctoring_warnings: 3,
  enforce_fullscreen: false,
  status: 'draft',
  registration_start_date: '',
  registration_end_date: '',
  exam_start_date: '',
  exam_end_date: '',
  image_url: ''
});

const baseUrl = useRuntimeConfig().public.apiBase;
const fileInputRef = ref<HTMLInputElement | null>(null);
const uploadingImage = ref(false);

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

function triggerFileSelect() {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
}

async function onFileSelected(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  
  const file = target.files[0];
  uploadingImage.value = true;
  const formData = new FormData();
  formData.append('image', file);

  try {
    const { data } = await api.post('/admin/public-exams/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    fields.value.image_url = data.url;
    snackbarText.value = 'Image uploaded successfully!';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (err) {
    console.error('Failed to upload image:', err);
    snackbarText.value = 'Failed to upload image';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    uploadingImage.value = false;
  }
}

async function fetchCategories() {
  try {
    const { data } = await api.get('/public/exams/categories');
    categories.value = data;
    if (data.length > 0 && !fields.value.category_id) {
      fields.value.category_id = data[0].id;
    }
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

async function fetchExamDetails() {
  if (!isEditMode.value) return;
  loading.value = true;
  try {
    const examId = route.query.id as string;
    const { data: examsList } = await api.get('/admin/public-exams');
    const examMatch = examsList.find((e: any) => e.id === examId);

    if (examMatch) {
      fields.value = {
        name: examMatch.name,
        category_id: examMatch.category_id,
        slug: examMatch.slug,
        description: examMatch.description || '',
        instructions: examMatch.instructions || '',
        duration_minutes: examMatch.duration_minutes,
        pass_percentage: examMatch.pass_percentage,
        negative_marking: examMatch.negative_marking,
        randomize_questions: !!examMatch.randomize_questions,
        randomize_options: !!examMatch.randomize_options,
        show_correct_answers: !!examMatch.show_correct_answers,
        show_explanations: !!examMatch.show_explanations,
        allow_retake: !!examMatch.allow_retake,
        max_retakes: examMatch.max_retakes || 0,
        enable_certificate: !!examMatch.enable_certificate,
        anonymous_access: !!examMatch.anonymous_access,
        require_name: !!examMatch.require_name,
        require_email: !!examMatch.require_email,
        require_mobile: !!examMatch.require_mobile,
        enable_proctoring: !!examMatch.enable_proctoring,
        max_proctoring_warnings: examMatch.max_proctoring_warnings !== undefined ? examMatch.max_proctoring_warnings : 3,
        enforce_fullscreen: !!examMatch.enforce_fullscreen,
        status: examMatch.status,
        registration_start_date: examMatch.registration_start_date ? new Date(new Date(examMatch.registration_start_date).getTime() - new Date(examMatch.registration_start_date).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
        registration_end_date: examMatch.registration_end_date ? new Date(new Date(examMatch.registration_end_date).getTime() - new Date(examMatch.registration_end_date).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
        exam_start_date: examMatch.exam_start_date ? new Date(new Date(examMatch.exam_start_date).getTime() - new Date(examMatch.exam_start_date).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
        exam_end_date: examMatch.exam_end_date ? new Date(new Date(examMatch.exam_end_date).getTime() - new Date(examMatch.exam_end_date).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
        image_url: examMatch.image_url || ''
      };
    }
  } catch (err) {
    console.error('Failed to load exam details:', err);
  } finally {
    loading.value = false;
  }
}

function onTitleChange(val: string) {
  if (!isEditMode.value && val) {
    fields.value.slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
}

async function saveExam() {
  if (!fields.value.name) {
    snackbarText.value = 'Exam Title is required';
    snackbarColor.value = 'error';
    snackbar.value = true;
    return;
  }

  saving.value = true;
  try {
    let examId = route.query.id as string;
    
    if (isEditMode.value) {
      await api.put(`/admin/public-exams/${examId}`, fields.value);
    } else {
      const res = await api.post('/admin/public-exams', fields.value);
      examId = res.data.id;
    }

    snackbarText.value = isEditMode.value ? 'Exam updated successfully!' : 'Exam created successfully!';
    snackbarColor.value = 'success';
    snackbar.value = true;

    setTimeout(() => {
      router.push('/dashboard/admin/public-exams');
    }, 800);
  } catch (err) {
    console.error('Failed to save exam configurations:', err);
    snackbarText.value = 'Failed to save exam. Please check all fields.';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await fetchCategories();
  await fetchExamDetails();
});
</script>

<style scoped>
.form-card {
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.card-header-wrap {
  padding: 18px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #FAFAFD;
}

.card-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-title {
  font-size: 1rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
}

.card-subtitle {
  font-size: 0.78rem;
  color: #64748B;
  margin: 2px 0 0 0;
  font-weight: 500;
}

.form-body {
  padding: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.78rem;
  font-weight: 800;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #CBD5E1;
  background-color: #F8FAFC;
  font-size: 0.88rem;
  color: #0F172A;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #E31B23;
  background-color: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.12);
}

.btn-upload-cover {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px dashed #CBD5E1;
  background: #F8FAFC;
  color: #334155;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  justify-content: center;
  transition: all 0.2s ease;
}
.btn-upload-cover:hover {
  border-color: #E31B23;
  color: #E31B23;
  background: #FEF2F2;
}

.toggle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.toggle-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  background: #F8FAFC;
  cursor: pointer;
  transition: all 0.2s ease;
}
.toggle-card:hover {
  border-color: #CBD5E1;
}

.toggle-checkbox {
  accent-color: #E31B23;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  cursor: pointer;
}

.toggle-title {
  font-size: 0.84rem;
  font-weight: 800;
  color: #0F172A;
}

.toggle-sub {
  font-size: 0.74rem;
  color: #64748B;
  font-weight: 500;
}
</style>
