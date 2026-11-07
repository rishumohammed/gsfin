<template>
  <div class="exam-create-page min-h-screen pb-16" style="background-color: #FAFAFD;">
    <!-- Page Header -->
    <div class="exam-header-bar mb-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="header-inner-row">
          <!-- Left: Back Button + Title & Subtitle -->
          <div class="header-left-col">
            <NuxtLink
              to="/dashboard/admin/public-exams"
              class="btn-header-back"
              title="Back to All Exams"
            >
              <i class="mdi mdi-arrow-left"></i>
            </NuxtLink>
            <div class="header-titles">
              <h1 class="header-page-title">
                {{ isEditMode ? 'Edit Certification Exam' : 'Create Certification Exam' }}
              </h1>
              <p class="header-page-subtitle">
                {{ isEditMode ? 'Modify qualification curriculum, passing criteria, and proctoring rules for this exam.' : 'Set up certification course standards, question parameters, proctoring options, and credential rules for Partner Centers.' }}
              </p>
            </div>
          </div>

          <!-- Right: Action Buttons -->
          <div class="header-actions-col">
            <NuxtLink
              to="/dashboard/admin/public-exams"
              class="btn-header-cancel"
            >
              Cancel
            </NuxtLink>
            <button
              type="button"
              class="btn-header-save"
              :disabled="saving"
              @click="saveExam"
            >
              <i :class="['mdi', saving ? 'mdi-loading spin-icon' : (isEditMode ? 'mdi-content-save-outline' : 'mdi-check-circle-outline')]"></i>
              <span>{{ isEditMode ? 'Save Settings' : 'Create Exam' }}</span>
            </button>
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
                <!-- Certification Standard Selector -->
                <div class="form-group mb-4">
                  <div class="category-header-row mb-1">
                    <label class="form-label mb-0">Certification Standard <span class="text-red-500">*</span></label>
                    <span class="text-[11px] text-slate-500 font-medium">1-to-1 Certification Exam Mapping</span>
                  </div>
                  <select 
                    v-model="fields.qualification_id" 
                    class="form-select w-full"
                    @change="onQualificationChange"
                  >
                    <option value="">-- Select Certification Standard --</option>
                    <option v-for="q in qualifications" :key="q.id" :value="q.id">
                      {{ q.name }} ({{ q.category || 'Food Safety Standard' }})
                    </option>
                  </select>
                  <p class="text-[11px] text-slate-500 mt-1 font-medium">
                    Select the official GSFIN Certification this examination is conducted for. Exam title automatically syncs with the certification standard.
                  </p>
                </div>

                <div class="form-group mb-4">
                  <label class="form-label">Exam Title <span class="text-red-500">*</span></label>
                  <input
                    v-model="fields.name"
                    type="text"
                    placeholder="e.g. CODEX HACCP"
                    class="form-input"
                    @input="onTitleChange(fields.name)"
                  />
                  <p class="text-[11px] text-slate-500 mt-1 font-medium">
                    Exam name corresponds directly to the certification credential issued.
                  </p>
                </div>

                <v-row class="mb-4">
                  <v-col cols="12" sm="6">
                    <div class="form-group">
                      <div class="category-header-row">
                        <label class="form-label mb-0">Category <span class="text-red-500">*</span></label>
                        <button
                          type="button"
                          class="btn-manage-categories"
                          title="Manage Categories"
                          @click="openCategoryModal('list')"
                        >
                          <v-icon icon="mdi-cog-outline" size="14" class="mr-1"></v-icon>
                          <span>Manage Categories</span>
                        </button>
                      </div>

                      <div class="category-input-group">
                        <select v-model="fields.category_id" class="form-select flex-grow-1 category-select-field">
                          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                        </select>
                        <button
                          type="button"
                          class="btn-cat-action"
                          title="Quick Add New Category"
                          @click="openAddCategoryQuick"
                        >
                          <v-icon icon="mdi-plus" size="20" color="#E31B23"></v-icon>
                        </button>
                      </div>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <div class="form-group">
                      <label class="form-label">SEO Slug <span class="text-red-500">*</span></label>
                      <input
                        v-model="fields.slug"
                        type="text"
                        placeholder="e.g. codex-haccp"
                        class="form-input"
                      />
                    </div>
                  </v-col>
                </v-row>

                <!-- Questions & Marks Configuration -->
                <v-row dense class="mb-2">
                  <v-col cols="12" sm="3">
                    <div class="form-group">
                      <label class="form-label">Exam Questions <span class="text-red-500">*</span></label>
                      <input
                        v-model.number="fields.total_questions"
                        type="number"
                        min="1"
                        placeholder="10"
                        class="form-input"
                      />
                    </div>
                  </v-col>
                  <v-col cols="12" sm="3">
                    <div class="form-group">
                      <label class="form-label">Total Marks <span class="text-red-500">*</span></label>
                      <input
                        v-model.number="fields.total_marks"
                        type="number"
                        min="1"
                        placeholder="10"
                        class="form-input"
                      />
                    </div>
                  </v-col>
                  <v-col cols="12" sm="3">
                    <div class="form-group">
                      <label class="form-label">Passing Marks <span class="text-red-500">*</span></label>
                      <input
                        v-model.number="fields.passing_marks"
                        type="number"
                        min="1"
                        placeholder="5"
                        class="form-input"
                      />
                    </div>
                  </v-col>
                  <v-col cols="12" sm="3">
                    <div class="form-group">
                      <label class="form-label">Duration (Mins) <span class="text-red-500">*</span></label>
                      <input
                        v-model.number="fields.duration_minutes"
                        type="number"
                        min="1"
                        placeholder="60"
                        class="form-input"
                      />
                    </div>
                  </v-col>
                </v-row>

                <!-- 3x Question Bank Pool Notice -->
                <div class="p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/60 mb-4">
                  <div class="flex items-start gap-2.5">
                    <i class="mdi mdi-information-outline text-blue-600 text-lg mt-0.5"></i>
                    <div>
                      <div class="text-xs font-semibold text-blue-900 mb-0.5">
                        3× Question Bank Requirement for Publishing
                      </div>
                      <div class="text-[11px] text-blue-800 leading-relaxed font-medium">
                        This exam conducts <span class="font-semibold text-blue-950">{{ fields.total_questions || 0 }} questions</span> for candidates. To publish, the Question Bank must contain at least <span class="font-semibold text-blue-950">{{ (fields.total_questions || 0) * 3 }} questions (3× pool)</span>. During an exam, {{ fields.total_questions || 0 }} questions will be randomly sampled from the bank.
                      </div>
                    </div>
                  </div>
                </div>

                <v-row dense class="mb-4">
                  <v-col cols="12" sm="6">
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
                  <v-col cols="12" sm="6">
                    <div class="form-group">
                      <label class="form-label">Negative Marks per Wrong Answer</label>
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

                <div class="form-group mt-4">
                  <label class="form-label">Exam Cover Artwork</label>
                  
                  <!-- Hidden native file input -->
                  <input
                    type="file"
                    ref="fileInputRef"
                    accept="image/*"
                    style="display: none;"
                    @change="onFileSelected"
                  />

                  <!-- Preview Card when an image is present -->
                  <div v-if="fields.image_url" class="cover-preview-card mb-3">
                    <img
                      :src="fields.image_url.startsWith('http') ? fields.image_url : (baseUrl.replace('/api', '') + (fields.image_url.startsWith('/') ? fields.image_url : '/' + fields.image_url))"
                      alt="Exam Cover Preview"
                      class="cover-preview-img"
                      @error="(e: any) => { e.target.style.display = 'none'; }"
                    />
                    <div class="cover-preview-info">
                      <div class="cover-preview-title">Current Cover Artwork</div>
                      <div class="cover-preview-url">{{ fields.image_url }}</div>
                    </div>
                    <div class="cover-preview-actions">
                      <button
                        type="button"
                        class="btn-table-action btn-edit"
                        title="Replace Artwork"
                        @click="triggerFileSelect"
                      >
                        <i class="mdi mdi-upload"></i> Replace
                      </button>
                      <button
                        type="button"
                        class="btn-table-action btn-danger"
                        title="Remove Artwork"
                        @click="fields.image_url = ''"
                      >
                        <i class="mdi mdi-trash-can-outline"></i> Remove
                      </button>
                    </div>
                  </div>

                  <!-- Unified Upload Container -->
                  <div class="cover-upload-container">
                    <!-- Option 1: File Upload Dropzone -->
                    <button
                      type="button"
                      class="btn-upload-dropzone"
                      :disabled="uploadingImage"
                      @click="triggerFileSelect"
                    >
                      <i :class="['mdi', uploadingImage ? 'mdi-loading spin-icon' : 'mdi-cloud-upload-outline', 'upload-icon']"></i>
                      <div class="upload-text-wrap">
                        <span class="upload-primary-text">{{ uploadingImage ? 'Uploading Image...' : 'Choose Image File' }}</span>
                        <span class="upload-sub-text">PNG, JPG, WebP up to 5MB</span>
                      </div>
                    </button>

                    <!-- Divider -->
                    <div class="cover-divider">
                      <span>OR</span>
                    </div>

                    <!-- Option 2: External Image URL -->
                    <div class="cover-url-wrap">
                      <div class="url-input-inner">
                        <i class="mdi mdi-link-variant url-icon"></i>
                        <input
                          v-model="fields.image_url"
                          type="text"
                          placeholder="Or paste external image URL..."
                          class="cover-url-input"
                        />
                        <button
                          v-if="fields.image_url"
                          type="button"
                          class="btn-clear-url"
                          title="Clear URL"
                          @click="fields.image_url = ''"
                        >
                          <i class="mdi mdi-close-circle"></i>
                        </button>
                      </div>
                      <span class="url-helper-text">Direct web link (e.g. https://...)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 2: Simulator Rules & Integrity -->
            <div class="form-card mb-6">
              <div class="card-header-wrap">
                <div class="card-icon-box bg-purple-50 text-purple-600">
                  <v-icon icon="mdi-tune-variant" size="20" color="#9333EA"></v-icon>
                </div>
                <div>
                  <h3 class="card-title">2. Test Simulator & Proctoring Settings</h3>
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

                <!-- AI Proctoring & Integrity Checks Suite -->
                <div class="proctor-suite-card mt-2">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <div class="d-flex align-center gap-2.5">
                      <div class="card-icon-box icon-box-active">
                        <v-icon icon="mdi-shield-check" size="20"></v-icon>
                      </div>
                      <div>
                        <h4 class="text-sm font-semibold text-slate-900 m-0">AI Proctoring &amp; Integrity Checks</h4>
                        <p class="text-xs text-slate-500 m-0 font-normal">Candidate monitoring, computer vision tracking, and audit review</p>
                      </div>
                    </div>
                    <div>
                      <span
                        v-if="fields.enable_proctoring"
                        class="proctor-status-pill pill-active"
                      >
                        <i class="mdi mdi-check-circle"></i>
                        <span>Proctoring Active</span>
                      </span>
                      <span
                        v-else
                        class="proctor-status-pill pill-inactive"
                      >
                        <i class="mdi mdi-shield-off-outline"></i>
                        <span>Proctoring Inactive</span>
                      </span>
                    </div>
                  </div>

                  <!-- Master Toggle Card -->
                  <div
                    class="master-proctor-card mt-4 mb-4"
                    :class="{ 'is-active': fields.enable_proctoring }"
                    @click="fields.enable_proctoring = !fields.enable_proctoring"
                  >
                    <div class="master-card-left">
                      <div class="master-icon-wrap" :class="fields.enable_proctoring ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'">
                        <v-icon icon="mdi-shield-account-outline" size="24" :color="fields.enable_proctoring ? '#E31B23' : '#64748B'"></v-icon>
                      </div>
                      <div>
                        <div class="d-flex align-center gap-2">
                          <span class="master-title">Enable AI Proctoring Suite</span>
                          <span v-if="fields.enable_proctoring" class="status-pill-green">Active</span>
                          <span v-else class="status-pill-gray">Disabled</span>
                        </div>
                        <div class="master-sub">
                          Enforces camera vision monitoring, browser lockdown, candidate face baseline, and holds certificates for audit approval.
                        </div>
                      </div>
                    </div>
                    <div class="card-switch" :class="{ 'switch-on': fields.enable_proctoring }">
                      <span class="switch-dot"></span>
                    </div>
                  </div>

                  <!-- Sub-Options Grid (Expanded when Proctoring is Active) -->
                  <v-expand-transition>
                    <div v-if="fields.enable_proctoring" class="space-y-4">
                      <!-- Parameter Strip: Violation Warning Limit -->
                      <div class="proctoring-param-strip">
                        <div class="d-flex align-center gap-3">
                          <div class="param-icon-box">
                            <v-icon icon="mdi-alert-octagon-outline" size="20" color="#E31B23"></v-icon>
                          </div>
                          <div>
                            <div class="text-xs font-semibold text-slate-900">Violation Strike Threshold</div>
                            <div class="text-[11px] text-slate-500">Auto-terminates and submits attempt when cumulative infractions reach this count</div>
                          </div>
                        </div>
                        <div class="d-flex align-center gap-2">
                          <button
                            type="button"
                            class="btn-stepper"
                            :disabled="fields.max_proctoring_warnings <= 1"
                            @click="fields.max_proctoring_warnings = Math.max(1, (fields.max_proctoring_warnings || 3) - 1)"
                            title="Decrease limit"
                          >
                            <i class="mdi mdi-minus"></i>
                          </button>
                          <div class="stepper-value-box">
                            <span class="stepper-num">{{ fields.max_proctoring_warnings || 3 }}</span>
                            <span class="stepper-unit">Strikes</span>
                          </div>
                          <button
                            type="button"
                            class="btn-stepper"
                            :disabled="fields.max_proctoring_warnings >= 15"
                            @click="fields.max_proctoring_warnings = Math.min(15, (fields.max_proctoring_warnings || 3) + 1)"
                            title="Increase limit"
                          >
                            <i class="mdi mdi-plus"></i>
                          </button>
                        </div>
                      </div>

                      <!-- 10 Feature Toggles Grid -->
                      <v-row dense class="mt-2">
                        <!-- 1. Fullscreen Lock -->
                        <v-col cols="12" sm="6" class="mb-2">
                          <div
                            class="feature-toggle-card"
                            :class="{ 'is-active': fields.enforce_fullscreen }"
                            @click="fields.enforce_fullscreen = !fields.enforce_fullscreen"
                          >
                            <div class="card-icon-box" :class="fields.enforce_fullscreen ? 'icon-box-active' : 'icon-box-inactive'">
                              <v-icon icon="mdi-fullscreen" size="18"></v-icon>
                            </div>
                            <div class="card-text-wrap">
                              <div class="card-feature-title">Full Screen Lockdown</div>
                              <div class="card-feature-sub">Locks browser in fullscreen; exit triggers security alerts</div>
                            </div>
                            <div class="card-switch" :class="{ 'switch-on': fields.enforce_fullscreen }">
                              <span class="switch-dot"></span>
                            </div>
                          </div>
                        </v-col>

                        <!-- 2. Tab & Blur Detection -->
                        <v-col cols="12" sm="6" class="mb-2">
                          <div
                            class="feature-toggle-card"
                            :class="{ 'is-active': fields.proctoring_config.tab_switch_detection }"
                            @click="fields.proctoring_config.tab_switch_detection = !fields.proctoring_config.tab_switch_detection"
                          >
                            <div class="card-icon-box" :class="fields.proctoring_config.tab_switch_detection ? 'icon-box-active' : 'icon-box-inactive'">
                              <v-icon icon="mdi-tab" size="18"></v-icon>
                            </div>
                            <div class="card-text-wrap">
                              <div class="card-feature-title">Tab-Switch &amp; Blur Check</div>
                              <div class="card-feature-sub">1500ms debounced window blur &amp; devtools monitor</div>
                            </div>
                            <div class="card-switch" :class="{ 'switch-on': fields.proctoring_config.tab_switch_detection }">
                              <span class="switch-dot"></span>
                            </div>
                          </div>
                        </v-col>

                        <!-- 3. AI Face Mesh & Pose Tracking -->
                        <v-col cols="12" sm="6" class="mb-2">
                          <div
                            class="feature-toggle-card"
                            :class="{ 'is-active': fields.proctoring_config.enable_face_tracking }"
                            @click="fields.proctoring_config.enable_face_tracking = !fields.proctoring_config.enable_face_tracking"
                          >
                            <div class="card-icon-box" :class="fields.proctoring_config.enable_face_tracking ? 'icon-box-active' : 'icon-box-inactive'">
                              <v-icon icon="mdi-face-recognition" size="18"></v-icon>
                            </div>
                            <div class="card-text-wrap">
                              <div class="card-feature-title">Face Mesh &amp; Head-Pose</div>
                              <div class="card-feature-sub">Euler pitch/yaw/roll look-away &amp; multi-face audit</div>
                            </div>
                            <div class="card-switch" :class="{ 'switch-on': fields.proctoring_config.enable_face_tracking }">
                              <span class="switch-dot"></span>
                            </div>
                          </div>
                        </v-col>

                        <!-- 4. 3-Pose Biometric Identity Match -->
                        <v-col cols="12" sm="6" class="mb-2">
                          <div
                            class="feature-toggle-card"
                            :class="{ 'is-active': fields.proctoring_config.enable_face_verification }"
                            @click="fields.proctoring_config.enable_face_verification = !fields.proctoring_config.enable_face_verification"
                          >
                            <div class="card-icon-box" :class="fields.proctoring_config.enable_face_verification ? 'icon-box-active' : 'icon-box-inactive'">
                              <v-icon icon="mdi-account-check-outline" size="18"></v-icon>
                            </div>
                            <div class="card-text-wrap">
                              <div class="card-feature-title">3-Pose Biometric Match</div>
                              <div class="card-feature-sub">Pre-exam 3-pose selfie + live baseline face check</div>
                            </div>
                            <div class="card-switch" :class="{ 'switch-on': fields.proctoring_config.enable_face_verification }">
                              <span class="switch-dot"></span>
                            </div>
                          </div>
                        </v-col>

                        <!-- 5. Mobile Phone Detection -->
                        <v-col cols="12" sm="6" class="mb-2">
                          <div
                            class="feature-toggle-card"
                            :class="{ 'is-active': fields.proctoring_config.enable_object_detection }"
                            @click="fields.proctoring_config.enable_object_detection = !fields.proctoring_config.enable_object_detection"
                          >
                            <div class="card-icon-box" :class="fields.proctoring_config.enable_object_detection ? 'icon-box-active' : 'icon-box-inactive'">
                              <v-icon icon="mdi-cellphone-cog" size="18"></v-icon>
                            </div>
                            <div class="card-text-wrap">
                              <div class="card-feature-title">Mobile Phone Detection</div>
                              <div class="card-feature-sub">150ms COCO-SSD edge vision loop for smartphones</div>
                            </div>
                            <div class="card-switch" :class="{ 'switch-on': fields.proctoring_config.enable_object_detection }">
                              <span class="switch-dot"></span>
                            </div>
                          </div>
                        </v-col>

                        <!-- 6. 10-Second Video Streaming -->
                        <v-col cols="12" sm="6" class="mb-2">
                          <div
                            class="feature-toggle-card"
                            :class="{ 'is-active': fields.proctoring_config.record_video_chunks }"
                            @click="fields.proctoring_config.record_video_chunks = !fields.proctoring_config.record_video_chunks"
                          >
                            <div class="card-icon-box" :class="fields.proctoring_config.record_video_chunks ? 'icon-box-active' : 'icon-box-inactive'">
                              <v-icon icon="mdi-video-outline" size="18"></v-icon>
                            </div>
                            <div class="card-text-wrap">
                              <div class="card-feature-title">10-Second Video Streaming</div>
                              <div class="card-feature-sub">Continuous WebM chunks uploaded for auditor review</div>
                            </div>
                            <div class="card-switch" :class="{ 'switch-on': fields.proctoring_config.record_video_chunks }">
                              <span class="switch-dot"></span>
                            </div>
                          </div>
                        </v-col>

                        <!-- 7. Automated Snapshot Evidence -->
                        <v-col cols="12" sm="6" class="mb-2">
                          <div
                            class="feature-toggle-card"
                            :class="{ 'is-active': fields.proctoring_config.capture_screenshots }"
                            @click="fields.proctoring_config.capture_screenshots = !fields.proctoring_config.capture_screenshots"
                          >
                            <div class="card-icon-box" :class="fields.proctoring_config.capture_screenshots ? 'icon-box-active' : 'icon-box-inactive'">
                              <v-icon icon="mdi-camera-outline" size="18"></v-icon>
                            </div>
                            <div class="card-text-wrap">
                              <div class="card-feature-title">Automated Snapshot Evidence</div>
                              <div class="card-feature-sub">Auto-captures downscaled JPGs on violation (max 15)</div>
                            </div>
                            <div class="card-switch" :class="{ 'switch-on': fields.proctoring_config.capture_screenshots }">
                              <span class="switch-dot"></span>
                            </div>
                          </div>
                        </v-col>

                        <!-- 8. Text-To-Speech Audio Warnings -->
                        <v-col cols="12" sm="6" class="mb-2">
                          <div
                            class="feature-toggle-card"
                            :class="{ 'is-active': fields.proctoring_config.enable_voice_warnings }"
                            @click="fields.proctoring_config.enable_voice_warnings = !fields.proctoring_config.enable_voice_warnings"
                          >
                            <div class="card-icon-box" :class="fields.proctoring_config.enable_voice_warnings ? 'icon-box-active' : 'icon-box-inactive'">
                              <v-icon icon="mdi-volume-high" size="18"></v-icon>
                            </div>
                            <div class="card-text-wrap">
                              <div class="card-feature-title">Text-To-Speech Audio Alerts</div>
                              <div class="card-feature-sub">Audible Web Speech alerts warning candidate on violations</div>
                            </div>
                            <div class="card-switch" :class="{ 'switch-on': fields.proctoring_config.enable_voice_warnings }">
                              <span class="switch-dot"></span>
                            </div>
                          </div>
                        </v-col>

                        <!-- 9. Clipboard & Shortcut Lock -->
                        <v-col cols="12" sm="6" class="mb-2">
                          <div
                            class="feature-toggle-card"
                            :class="{ 'is-active': fields.proctoring_config.prevent_clipboard }"
                            @click="fields.proctoring_config.prevent_clipboard = !fields.proctoring_config.prevent_clipboard"
                          >
                            <div class="card-icon-box" :class="fields.proctoring_config.prevent_clipboard ? 'icon-box-active' : 'icon-box-inactive'">
                              <v-icon icon="mdi-content-cut" size="18"></v-icon>
                            </div>
                            <div class="card-text-wrap">
                              <div class="card-feature-title">Clipboard &amp; Shortcut Lock</div>
                              <div class="card-feature-sub">Blocks copy, paste, text select, and dev shortcuts</div>
                            </div>
                            <div class="card-switch" :class="{ 'switch-on': fields.proctoring_config.prevent_clipboard }">
                              <span class="switch-dot"></span>
                            </div>
                          </div>
                        </v-col>

                        <!-- 10. Certificate Audit Hold Gate -->
                        <v-col cols="12" sm="6" class="mb-2">
                          <div
                            class="feature-toggle-card"
                            :class="{ 'is-active': fields.proctoring_config.hold_certificate }"
                            @click="fields.proctoring_config.hold_certificate = !fields.proctoring_config.hold_certificate"
                          >
                            <div class="card-icon-box" :class="fields.proctoring_config.hold_certificate ? 'icon-box-active' : 'icon-box-inactive'">
                              <v-icon icon="mdi-certificate-outline" size="18"></v-icon>
                            </div>
                            <div class="card-text-wrap">
                              <div class="card-feature-title">Certificate Audit Hold Gate</div>
                              <div class="card-feature-sub">Holds certificates in 'Pending Review' until admin release</div>
                            </div>
                            <div class="card-switch" :class="{ 'switch-on': fields.proctoring_config.hold_certificate }">
                              <span class="switch-dot"></span>
                            </div>
                          </div>
                        </v-col>
                      </v-row>

                      <!-- Audit Shortcut if Editing -->
                      <div v-if="isEditMode" class="mt-3 pt-3 border-t border-slate-200/70 d-flex align-center justify-space-between flex-wrap gap-2">
                        <div class="text-xs text-slate-500 font-medium">
                          <i class="mdi mdi-information-outline mr-1 text-slate-400"></i>
                          Auditors can review video chunks, snapshot evidence, and approve withheld certificates.
                        </div>
                        <v-btn
                          variant="tonal"
                          color="#E31B23"
                          size="small"
                          class="text-none font-semibold rounded-lg"
                          prepend-icon="mdi-shield-search"
                          :to="`/dashboard/admin/public-exams/proctoring/exam/${route.query.id}`"
                        >
                          Audit Proctoring Logs for this Exam &rarr;
                        </v-btn>
                      </div>
                    </div>
                  </v-expand-transition>
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
                  <p class="card-subtitle">Set catalog availability and certificate rules.</p>
                </div>
              </div>

              <div class="form-body">
                <div class="form-group mb-6">
                  <label class="form-label">Catalog Status</label>
                  <select v-model="fields.status" class="form-select capitalize">
                    <option value="draft">Draft (Authoring Mode)</option>
                    <option value="review">Under Review</option>
                    <option value="published">Published (Active in Partner Catalog)</option>
                    <option value="archived">Archived (Read Only)</option>
                  </select>
                </div>

                <div class="form-group mb-6">
                  <label class="toggle-card bg-slate-50">
                    <input type="checkbox" v-model="fields.enable_certificate" class="toggle-checkbox" />
                    <div>
                      <div class="toggle-title">Automate Certificates</div>
                      <div class="toggle-sub">Auto-generate verified GSFIN Personnel Certificate for passing candidates</div>
                    </div>
                  </label>
                </div>

                <v-btn
                  color="#E31B23"
                  block
                  size="large"
                  class="font-semibold text-white text-none rounded-xl shadow-md mb-2 sidebar-save-btn"
                  :prepend-icon="isEditMode ? 'mdi-content-save-outline' : 'mdi-plus-circle-outline'"
                  :loading="saving"
                  @click="saveExam"
                >
                  {{ isEditMode ? 'Save Settings' : 'Create Exam' }}
                </v-btn>

                <div v-if="!isEditMode" class="create-hint-text text-center text-xs text-slate-500 mb-3">
                  <i class="mdi mdi-arrow-right-circle-outline mr-1 text-slate-400"></i>Directs to Question Bank next
                </div>

                <v-btn
                  variant="outlined"
                  color="slate"
                  block
                  class="text-none font-semibold rounded-xl border-slate-300 text-slate-700"
                  to="/dashboard/admin/public-exams"
                >
                  Cancel
                </v-btn>
              </div>
            </div>

            <!-- Certifying Authority Hub Quick Links (When in Edit Mode) -->
            <div v-if="isEditMode" class="form-card mb-6">
              <div class="card-header-wrap">
                <div class="card-icon-box bg-red-50 text-red-600">
                  <v-icon icon="mdi-shield-crown-outline" size="20" color="#E31B23"></v-icon>
                </div>
                <div>
                  <h3 class="card-title">Certifying Authority Hub</h3>
                  <p class="card-subtitle">Questions & certificate management</p>
                </div>
              </div>
              <div class="form-body space-y-3">
                <NuxtLink
                  :to="`/dashboard/admin/public-exams/questions?examId=${route.query.id}`"
                  class="authority-hub-btn"
                >
                  <div class="authority-btn-icon bg-red-50 text-red-600">
                    <i class="mdi mdi-database-edit-outline"></i>
                  </div>
                  <div class="authority-btn-text">
                    <div class="authority-btn-title">Manage Question Bank</div>
                    <div class="authority-btn-sub">Add questions, marks & bulk imports</div>
                  </div>
                  <i class="mdi mdi-chevron-right text-slate-400"></i>
                </NuxtLink>

                <NuxtLink
                  to="/dashboard/admin/certificate-template"
                  class="authority-hub-btn"
                >
                  <div class="authority-btn-icon bg-blue-50 text-blue-600">
                    <i class="mdi mdi-file-certificate-outline"></i>
                  </div>
                  <div class="authority-btn-text">
                    <div class="authority-btn-title">Certificate Template & Signatories</div>
                    <div class="authority-btn-sub">Configure GSFIN signatories & rules</div>
                  </div>
                  <i class="mdi mdi-chevron-right text-slate-400"></i>
                </NuxtLink>

                <NuxtLink
                  :to="`/dashboard/admin/public-exams/${route.query.id}/certificates`"
                  class="authority-hub-btn"
                >
                  <div class="authority-btn-icon bg-emerald-50 text-emerald-600">
                    <i class="mdi mdi-certificate-outline"></i>
                  </div>
                  <div class="authority-btn-text">
                    <div class="authority-btn-title">Issued Certificates</div>
                    <div class="authority-btn-sub">View credentials awarded for this exam</div>
                  </div>
                  <i class="mdi mdi-chevron-right text-slate-400"></i>
                </NuxtLink>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-form>
    </div>

    <!-- ═══ MANAGE CATEGORIES MODAL (V-DIALOG) ═══ -->
    <v-dialog v-model="showCategoryModal" max-width="600" scrollable>
      <v-card class="category-modal-card">
        <!-- Modal Header -->
        <div class="cat-modal-header">
          <div class="cat-modal-header-left">
            <div class="cat-modal-icon-box">
              <v-icon icon="mdi-shape-outline" size="22" color="#E31B23"></v-icon>
            </div>
            <div>
              <h3 class="cat-modal-title">Manage Exam Categories</h3>
              <p class="cat-modal-subtitle">Add, edit, or select categories for certification exams</p>
            </div>
          </div>
          <v-btn
            icon="mdi-close"
            variant="tonal"
            size="small"
            class="rounded-xl"
            @click="closeCategoryModal"
          />
        </div>

        <v-card-text class="pa-5">
          <!-- Sub-tabs row -->
          <div class="cat-tabs-row">
            <button
              type="button"
              class="cat-tab-btn"
              :class="{ active: catModalTab === 'add' }"
              @click="openAddCategoryQuick"
            >
              <v-icon icon="mdi-plus-circle-outline" size="16" class="mr-1"></v-icon>
              {{ editingCatId ? 'Edit Category' : 'Add New Category' }}
            </button>
            <button
              type="button"
              class="cat-tab-btn"
              :class="{ active: catModalTab === 'list' }"
              @click="catModalTab = 'list'"
            >
              <v-icon icon="mdi-format-list-bulleted" size="16" class="mr-1"></v-icon>
              Existing Categories ({{ categories.length }})
            </button>
            <NuxtLink
              to="/dashboard/admin/public-exams/categories"
              target="_blank"
              class="cat-full-link"
              title="Open full category management page in new tab"
            >
              <span>Full Manager</span>
              <v-icon icon="mdi-open-in-new" size="14"></v-icon>
            </NuxtLink>
          </div>

          <!-- TAB 1: ADD / EDIT -->
          <div v-if="catModalTab === 'add'" class="pt-2">
            <div class="form-group mb-4">
              <label class="form-label">Category Name <span class="text-red-500">*</span></label>
              <input
                v-model="catForm.name"
                type="text"
                placeholder="e.g. Food Safety Auditing, Banking, Quality Assurance..."
                class="form-input"
                @input="onCatNameInput"
              />
            </div>

            <div class="form-group mb-4">
              <label class="form-label">URL Slug</label>
              <input
                v-model="catForm.slug"
                type="text"
                placeholder="e.g. food-safety-auditing"
                class="form-input"
              />
              <span class="cat-field-hint">URL-friendly slug (auto-generated from category name)</span>
            </div>

            <div class="form-group mb-4">
              <label class="form-label">Description (Optional)</label>
              <textarea
                v-model="catForm.description"
                rows="3"
                placeholder="Brief scope of certification exams covered by this category..."
                class="form-textarea"
              ></textarea>
            </div>

            <div class="form-group mb-2">
              <label class="form-label">Visibility Status</label>
              <select v-model="catForm.status" class="form-select">
                <option value="active">Active (Visible)</option>
                <option value="inactive">Inactive (Hidden)</option>
              </select>
            </div>
          </div>

          <!-- TAB 2: LIST EXISTING CATEGORIES -->
          <div v-else class="cat-list-wrapper pt-2">
            <div
              v-for="cat in categories"
              :key="cat.id"
              class="cat-list-item"
              :class="{ selected: cat.id === fields.category_id }"
            >
              <div class="cat-item-info">
                <div class="cat-item-title-row">
                  <span class="cat-item-name">{{ cat.name }}</span>
                  <span class="cat-badge" :class="cat.status === 'active' ? 'badge-active' : 'badge-inactive'">
                    {{ cat.status }}
                  </span>
                  <span v-if="cat.id === fields.category_id" class="badge-selected">
                    Selected
                  </span>
                </div>
                <div class="cat-item-desc">{{ cat.description || 'No description provided' }}</div>
              </div>

              <div class="cat-item-actions">
                <v-btn
                  size="small"
                  :color="cat.id === fields.category_id ? '#10B981' : '#E31B23'"
                  variant="tonal"
                  class="cat-action-btn font-semibold rounded-lg text-none"
                  prepend-icon="mdi-check"
                  @click="selectAndCloseCat(cat)"
                >
                  {{ cat.id === fields.category_id ? 'Current' : 'Select' }}
                </v-btn>
                <v-btn
                  size="small"
                  variant="outlined"
                  color="slate"
                  class="cat-action-btn font-semibold rounded-lg text-none"
                  icon="mdi-pencil"
                  title="Edit Category"
                  @click="startEditCategory(cat)"
                />
              </div>
            </div>

            <div v-if="categories.length === 0" class="cat-empty-state">
              <v-icon icon="mdi-shape-outline" size="36" color="#94A3B8"></v-icon>
              <p class="mt-2 mb-0 font-medium">No categories created yet.</p>
              <button type="button" class="btn-create-first-cat mt-3" @click="openAddCategoryQuick">
                <v-icon icon="mdi-plus" size="16" class="mr-1"></v-icon> Add First Category
              </button>
            </div>
          </div>
        </v-card-text>

        <!-- Modal Actions Footer -->
        <div class="cat-modal-footer">
          <v-btn
            variant="outlined"
            color="slate"
            class="text-none font-semibold rounded-xl border-slate-300 me-2"
            @click="closeCategoryModal"
          >
            Cancel
          </v-btn>
          <v-btn
            v-if="catModalTab === 'add'"
            color="#E31B23"
            class="font-semibold text-white text-none rounded-xl shadow-md"
            :loading="savingCat"
            :disabled="savingCat || !catForm.name.trim()"
            @click="saveQuickCategory"
          >
            {{ editingCatId ? 'Update Category' : 'Create & Select Category' }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

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
const qualifications = ref<any[]>([]);

const fields = ref<any>({
  qualification_id: '',
  name: '',
  category_id: '',
  slug: '',
  description: '',
  instructions: '',
  duration_minutes: 60,
  total_questions: 10,
  total_marks: 10,
  passing_marks: 5,
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
  proctoring_config: {
    enable_face_tracking: true,
    enable_face_verification: true,
    enable_object_detection: true,
    enable_voice_warnings: true,
    record_video_chunks: true,
    capture_screenshots: true,
    tab_switch_detection: true,
    prevent_clipboard: true,
    hold_certificate: true
  },
  status: 'draft',
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

// Quick Category Management Modal State
const showCategoryModal = ref(false);
const catModalTab = ref<'add' | 'list'>('add');
const editingCatId = ref<string | null>(null);
const savingCat = ref(false);
const catForm = ref({
  name: '',
  slug: '',
  description: '',
  status: 'active'
});

function openCategoryModal(tab: 'add' | 'list' = 'list') {
  catModalTab.value = tab;
  if (tab === 'add' && !editingCatId.value) {
    catForm.value = { name: '', slug: '', description: '', status: 'active' };
  }
  showCategoryModal.value = true;
}

function openAddCategoryQuick() {
  editingCatId.value = null;
  catForm.value = { name: '', slug: '', description: '', status: 'active' };
  catModalTab.value = 'add';
  showCategoryModal.value = true;
}

function closeCategoryModal() {
  showCategoryModal.value = false;
  editingCatId.value = null;
}

function onCatNameInput() {
  if (!editingCatId.value) {
    catForm.value.slug = catForm.value.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
}

function startEditCategory(cat: any) {
  editingCatId.value = cat.id;
  catForm.value = {
    name: cat.name,
    slug: cat.slug || '',
    description: cat.description || '',
    status: cat.status || 'active'
  };
  catModalTab.value = 'add';
}

function selectAndCloseCat(cat: any) {
  fields.value.category_id = cat.id;
  snackbarText.value = `Selected category: "${cat.name}"`;
  snackbarColor.value = 'success';
  snackbar.value = true;
  closeCategoryModal();
}

async function saveQuickCategory() {
  if (!catForm.value.name.trim()) return;
  savingCat.value = true;
  try {
    if (!catForm.value.slug) {
      catForm.value.slug = catForm.value.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    if (editingCatId.value) {
      await api.put(`/admin/public-exams/categories/${editingCatId.value}`, catForm.value);
      snackbarText.value = 'Category updated successfully!';
    } else {
      const { data } = await api.post('/admin/public-exams/categories', catForm.value);
      if (data?.id) {
        fields.value.category_id = data.id;
      }
      snackbarText.value = 'Category created and selected!';
    }

    await fetchCategories();
    if (!editingCatId.value && catForm.value.name) {
      const found = categories.value.find(c => c.name.toLowerCase() === catForm.value.name.trim().toLowerCase());
      if (found) fields.value.category_id = found.id;
    }

    snackbarColor.value = 'success';
    snackbar.value = true;
    closeCategoryModal();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to save category');
  } finally {
    savingCat.value = false;
  }
}

async function fetchCategories() {
  try {
    const { data } = await api.get('/admin/public-exams/categories');
    categories.value = data;
    if (data.length > 0 && !fields.value.category_id) {
      fields.value.category_id = data[0].id;
    }
  } catch (err) {
    try {
      const { data } = await api.get('/public/exams/categories');
      categories.value = data;
      if (data.length > 0 && !fields.value.category_id) {
        fields.value.category_id = data[0].id;
      }
    } catch (fallbackErr) {
      console.error('Failed to load categories:', fallbackErr);
    }
  }
}

async function fetchQualifications() {
  try {
    const { data } = await api.get('/admin/qualifications');
    qualifications.value = data;
  } catch (err) {
    try {
      const { data } = await api.get('/public/qualifications');
      qualifications.value = data;
    } catch (fallbackErr) {
      console.error('Failed to load qualifications:', fallbackErr);
    }
  }
}

function onQualificationChange() {
  if (!fields.value.qualification_id) return;
  const qual = qualifications.value.find((q: any) => q.id === fields.value.qualification_id);
  if (qual) {
    fields.value.name = qual.name;
    fields.value.slug = qual.slug;
    if (!fields.value.description) {
      fields.value.description = qual.short_description || '';
    }
    if (!fields.value.instructions) {
      fields.value.instructions = 'Standard proctored examination for GSFIN Certification. 10 questions randomly sampled from question bank pool. 50% required to pass.';
    }
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
        qualification_id: examMatch.qualification_id || '',
        name: examMatch.name,
        category_id: examMatch.category_id,
        slug: examMatch.slug,
        description: examMatch.description || '',
        instructions: examMatch.instructions || '',
        duration_minutes: examMatch.duration_minutes || 60,
        total_questions: examMatch.total_questions !== undefined ? examMatch.total_questions : 10,
        total_marks: examMatch.total_marks !== undefined ? examMatch.total_marks : 10,
        passing_marks: examMatch.passing_marks !== undefined ? examMatch.passing_marks : 5,
        pass_percentage: examMatch.pass_percentage !== undefined ? examMatch.pass_percentage : 50,
        negative_marking: examMatch.negative_marking || 0.00,
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
        proctoring_config: (() => {
          let pc = examMatch.proctoring_config;
          if (typeof pc === 'string') {
            try { pc = JSON.parse(pc); } catch (_) { pc = {}; }
          }
          return {
            enable_face_tracking: pc?.enable_face_tracking !== false,
            enable_face_verification: pc?.enable_face_verification !== false,
            enable_object_detection: pc?.enable_object_detection !== false,
            enable_voice_warnings: pc?.enable_voice_warnings !== false,
            record_video_chunks: pc?.record_video_chunks !== false,
            capture_screenshots: pc?.capture_screenshots !== false,
            tab_switch_detection: pc?.tab_switch_detection !== false,
            prevent_clipboard: pc?.prevent_clipboard !== false,
            hold_certificate: pc?.hold_certificate !== false
          };
        })(),
        status: examMatch.status,
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
      snackbarText.value = 'Exam configurations updated successfully!';
      snackbarColor.value = 'success';
      snackbar.value = true;
      setTimeout(() => {
        router.push('/dashboard/admin/public-exams');
      }, 700);
    } else {
      const res = await api.post('/admin/public-exams', fields.value);
      examId = res.data.id;
      snackbarText.value = 'Exam created successfully! Directing to Question Bank...';
      snackbarColor.value = 'success';
      snackbar.value = true;
      setTimeout(() => {
        router.push(`/dashboard/admin/public-exams/questions?examId=${examId}`);
      }, 900);
    }
  } catch (err: any) {
    console.error('Failed to save exam configurations:', err);
    snackbarText.value = err.response?.data?.message || 'Failed to save exam. Please check all fields.';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await Promise.all([
    fetchCategories(),
    fetchQualifications(),
    fetchExamDetails()
  ]);
});
</script>

<style scoped>
/* Top Page Header Bar */
.exam-header-bar {
  background: #FFFFFF;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  padding: 20px 0;
}

.header-inner-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.header-left-col {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.btn-header-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid #CBD5E1;
  background-color: #FFFFFF;
  color: #334155;
  font-size: 1.25rem;
  text-decoration: none;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.btn-header-back:hover {
  background-color: #F8FAFC;
  border-color: #94A3B8;
  color: #0F172A;
}

.header-titles {
  flex: 1;
  min-width: 0;
}

.header-page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.header-page-subtitle {
  font-size: 0.82rem;
  color: #64748B;
  margin: 4px 0 0 0;
  font-weight: 500;
  line-height: 1.4;
}

.header-actions-col {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.btn-header-cancel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 12px;
  border: 1px solid #CBD5E1;
  background-color: #FFFFFF;
  color: #334155;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn-header-cancel:hover {
  background-color: #F8FAFC;
  border-color: #94A3B8;
  color: #0F172A;
}

.btn-header-save {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border-radius: 12px;
  background-color: #E31B23;
  color: #FFFFFF;
  border: none;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(227, 27, 35, 0.25);
  transition: all 0.2s ease;
}

.btn-header-save:hover:not(:disabled) {
  background-color: #C4131B;
}

.btn-header-save:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .header-inner-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .header-actions-col {
    width: 100%;
    justify-content: flex-end;
  }
}

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
  font-weight: 600;
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
  font-weight: 600;
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
  font-weight: 600;
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
  font-weight: 600;
  color: #0F172A;
}

.toggle-sub {
  font-size: 0.74rem;
  color: #64748B;
  font-weight: 500;
}

/* Category Management Input & Label Controls */
.category-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.btn-manage-categories {
  background: none;
  border: none;
  padding: 2px 4px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #E31B23;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: all 0.15s ease;
  border-radius: 6px;
}
.btn-manage-categories:hover {
  color: #B91C1C;
  background-color: #FEF2F2;
  text-decoration: underline;
}

.category-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.category-select-field {
  flex: 1;
  min-width: 0;
}

.btn-cat-action {
  height: 42px;
  width: 42px;
  min-width: 42px;
  border-radius: 10px;
  border: 1px solid #CBD5E1;
  background-color: #F8FAFC;
  color: #E31B23;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}
.btn-cat-action:hover {
  background-color: #FEF2F2;
  border-color: #E31B23;
  color: #B91C1C;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(227, 27, 35, 0.15);
}

/* Category Modal Dialog Styles */
.category-modal-card {
  border-radius: 16px !important;
  background: #FFFFFF !important;
  border: 1px solid #E2E8F0 !important;
  overflow: hidden !important;
}

.cat-modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid #E2E8F0;
  background-color: #FAFAFD;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cat-modal-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cat-modal-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background-color: #FEF2F2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cat-modal-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
}

.cat-modal-subtitle {
  font-size: 0.78rem;
  color: #64748B;
  margin: 2px 0 0 0;
  font-weight: 500;
}

.cat-tabs-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid #E2E8F0;
  flex-wrap: wrap;
}

.cat-tab-btn {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid #CBD5E1;
  background-color: #F8FAFC;
  color: #475569;
  display: inline-flex;
  align-items: center;
  transition: all 0.15s ease;
}
.cat-tab-btn:hover {
  background-color: #F1F5F9;
  color: #0F172A;
}
.cat-tab-btn.active {
  background-color: #E31B23;
  color: #FFFFFF;
  border-color: #E31B23;
  box-shadow: 0 2px 4px rgba(227, 27, 35, 0.2);
}

.cat-full-link {
  margin-left: auto;
  font-size: 0.76rem;
  font-weight: 600;
  color: #E31B23;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s ease;
}
.cat-full-link:hover {
  background-color: #FEF2F2;
  text-decoration: underline;
}

.cat-field-hint {
  font-size: 0.72rem;
  color: #64748B;
  margin-top: 4px;
  display: block;
  font-weight: 500;
}

.cat-list-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 380px;
  overflow-y: auto;
}

.cat-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  background-color: #F8FAFC;
  transition: all 0.15s ease;
}
.cat-list-item:hover {
  border-color: #CBD5E1;
  background-color: #FFFFFF;
}
.cat-list-item.selected {
  border-color: #E31B23;
  background-color: #FEF2F2;
}

.cat-item-info {
  flex: 1;
  min-width: 0;
  margin-right: 12px;
}

.cat-item-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.cat-item-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: #0F172A;
}

.cat-badge {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.badge-active {
  background-color: #DEF7EC;
  color: #03543F;
}
.badge-inactive {
  background-color: #E2E8F0;
  color: #475569;
}
.badge-selected {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
  background-color: #FEE2E2;
  color: #991B1B;
}

.cat-item-desc {
  font-size: 0.74rem;
  color: #64748B;
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cat-item-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.cat-empty-state {
  text-align: center;
  padding: 32px 16px;
  color: #64748B;
  font-size: 0.84rem;
}

.btn-create-first-cat {
  background-color: #E31B23;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

.cat-modal-footer {
  padding: 16px 24px;
  background-color: #FAFAFD;
  border-top: 1px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.text-2xs {
  font-size: 0.68rem;
  line-height: 1rem;
}

/* Exam Cover Artwork Container & Controls */
.cover-upload-container {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 14px 16px;
}
@media (max-width: 768px) {
  .cover-upload-container {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .cover-divider {
    display: none;
  }
}

.btn-upload-dropzone {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px dashed #CBD5E1;
  background: #F8FAFC;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
}
.btn-upload-dropzone:hover {
  border-color: #E31B23;
  background: #FEF2F2;
  color: #E31B23;
}
.btn-upload-dropzone .upload-icon {
  font-size: 1.5rem;
  color: #E31B23;
  flex-shrink: 0;
}
.upload-text-wrap {
  display: flex;
  flex-direction: column;
}
.upload-primary-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: #0F172A;
}
.upload-sub-text {
  font-size: 0.72rem;
  color: #64748B;
  font-weight: 500;
}

.cover-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.cover-url-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.url-input-inner {
  position: relative;
  display: flex;
  align-items: center;
}
.url-icon {
  position: absolute;
  left: 12px;
  font-size: 1.1rem;
  color: #94A3B8;
  pointer-events: none;
}
.cover-url-input {
  width: 100%;
  padding: 10px 36px 10px 38px;
  border-radius: 10px;
  border: 1px solid #CBD5E1;
  background-color: #F8FAFC;
  font-size: 0.85rem;
  color: #0F172A;
  outline: none;
  transition: all 0.2s ease;
}
.cover-url-input:focus {
  border-color: #E31B23;
  background-color: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.1);
}
.btn-clear-url {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
}
.btn-clear-url:hover {
  color: #EF4444;
}
.url-helper-text {
  font-size: 0.72rem;
  color: #64748B;
  font-weight: 500;
}

/* Cover Preview Card */
.cover-preview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  background: #F8FAFC;
}
.cover-preview-img {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #CBD5E1;
  flex-shrink: 0;
}
.cover-preview-info {
  flex: 1;
  min-width: 0;
}
.cover-preview-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: #0F172A;
}
.cover-preview-url {
  font-size: 0.72rem;
  color: #64748B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: monospace;
}
.cover-preview-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* Authority Hub Quick Navigation Links */
.authority-hub-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  background-color: #F8FAFC;
  text-decoration: none;
  transition: all 0.2s ease;
}

.authority-hub-btn:hover {
  border-color: #CBD5E1;
  background-color: #FFFFFF;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05);
}

.authority-btn-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.authority-btn-text {
  flex: 1;
  min-width: 0;
}

.authority-btn-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: #0F172A;
}

.authority-btn-sub {
  font-size: 0.72rem;
  color: #64748B;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-save-btn {
  font-size: 0.9rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.01em;
  padding: 0 16px !important;
  height: 46px !important;
  min-height: 46px !important;
}

.sidebar-save-btn :deep(.v-btn__content) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.create-hint-text {
  font-size: 0.74rem;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-weight: 500;
}

/* AI Proctoring & Integrity Checks Redesign */
.proctor-suite-card {
  background: #F8FAFD;
  border: 1px solid #E2E8F0;
  border-radius: 20px;
  padding: 22px;
}

.proctor-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.proctor-status-pill.pill-active {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FECACA;
}

.proctor-status-pill.pill-inactive {
  background: #F1F5F9;
  color: #64748B;
  border: 1px solid #E2E8F0;
}

/* Master Toggle Card */
.master-proctor-card {
  background: #FFFFFF;
  border: 1.5px solid #E2E8F0;
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.master-proctor-card:hover {
  border-color: #CBD5E1;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
}

.master-proctor-card.is-active {
  border-color: #F87171;
  box-shadow: 0 4px 14px rgba(227, 27, 35, 0.08);
}

.master-card-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.master-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.master-title {
  font-size: 0.92rem;
  font-weight: 600;
  color: #0F172A;
}

.master-sub {
  font-size: 0.74rem;
  color: #64748B;
  margin-top: 2px;
  line-height: 1.4;
  font-weight: 500;
}

.status-pill-green {
  font-size: 0.68rem;
  font-weight: 600;
  color: #059669;
  background-color: #ECFDF5;
  border: 1px solid #A7F3D0;
  padding: 1px 8px;
  border-radius: 9999px;
}

.status-pill-gray {
  font-size: 0.68rem;
  font-weight: 600;
  color: #64748B;
  background-color: #F1F5F9;
  border: 1px solid #E2E8F0;
  padding: 1px 8px;
  border-radius: 9999px;
}

/* Violation Strike Limit Parameter Strip */
.proctoring-param-strip {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  padding: 12px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
}

.param-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background-color: #FEF2F2;
  color: #DC2626;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-stepper {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #CBD5E1;
  background-color: #F8FAFC;
  color: #334155;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.15s ease;
}

.btn-stepper:hover:not(:disabled) {
  background-color: #FFFFFF;
  border-color: #94A3B8;
  color: #0F172A;
}

.btn-stepper:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.stepper-value-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 68px;
  padding: 2px 8px;
  background-color: #F1F5F9;
  border-radius: 8px;
}

.stepper-num {
  font-size: 0.88rem;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.1;
}

.stepper-unit {
  font-size: 0.64rem;
  color: #64748B;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Feature Toggle Cards Grid */
.feature-toggle-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  min-height: 74px;
  height: 100%;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-toggle-card:hover {
  border-color: #CBD5E1;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.feature-toggle-card.is-active {
  border-color: #FECACA;
  background: #FFFFFF;
  box-shadow: 0 2px 8px rgba(227, 27, 35, 0.04);
}

.card-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.icon-box-active {
  background-color: #FEF2F2;
  color: #DC2626;
}

.icon-box-inactive {
  background-color: #F1F5F9;
  color: #64748B;
}

.card-text-wrap {
  flex: 1;
  min-width: 0;
}

.card-feature-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.25;
}

.card-feature-sub {
  font-size: 0.7rem;
  color: #64748B;
  margin-top: 2px;
  line-height: 1.35;
  font-weight: 500;
}

/* Custom Sleek Switch */
.card-switch {
  width: 36px;
  height: 20px;
  border-radius: 9999px;
  background-color: #CBD5E1;
  position: relative;
  transition: background-color 0.25s ease;
  flex-shrink: 0;
}

.card-switch.switch-on {
  background-color: #E31B23;
}

.switch-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #FFFFFF;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.card-switch.switch-on .switch-dot {
  transform: translateX(16px);
}
</style>
