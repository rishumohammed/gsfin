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
                <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                  {{ isEditMode ? 'Edit Certification Exam' : 'Create Certification Exam' }}
                </h1>
              </div>
              <p class="text-xs sm:text-sm text-slate-500 font-medium">
                {{ isEditMode ? 'Modify qualification curriculum, passing criteria, and proctoring rules for this exam.' : 'Set up certification course standards, question parameters, proctoring options, and credential rules for Partner Centers.' }}
              </p>
            </div>
          </div>

          <div class="d-flex align-center gap-3">
            <v-btn
              variant="outlined"
              color="slate"
              class="text-none font-semibold rounded-xl border-slate-300 text-slate-700 me-3 mr-3"
              to="/dashboard/admin/public-exams"
            >
              Cancel
            </v-btn>
            <v-btn
              color="#E31B23"
              size="large"
              class="font-semibold text-white text-none rounded-xl shadow-md hover:bg-red-700"
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

            <!-- Section 2: Catalog Media & Delivery Model -->
            <div class="form-card mb-6">
              <div class="card-header-wrap">
                <div class="card-icon-box bg-blue-50 text-blue-600">
                  <v-icon icon="mdi-certificate-outline" size="20" color="#2563EB"></v-icon>
                </div>
                <div>
                  <h3 class="card-title">2. Catalog Media & Availability</h3>
                  <p class="card-subtitle">Accreditation artwork and Certifying Authority on-demand delivery model.</p>
                </div>
              </div>

              <div class="form-body">
                <!-- Certifying Authority On-Demand Delivery Model Card -->
                <div class="delivery-model-notice mb-5">
                  <div class="notice-icon-wrap">
                    <v-icon icon="mdi-shield-check" size="22" color="#059669"></v-icon>
                  </div>
                  <div class="notice-text-wrap">
                    <div class="notice-title">Certifying Authority • On-Demand Partner Delivery</div>
                    <p class="notice-desc">
                      As the personnel certifying authority, GSFIN standardizes exam curriculum, question banks, and verifiable credentials.
                      Authorized Partner Centers enroll their students and conduct proctored exams on demand using their center token wallets — without rigid calendar windows.
                    </p>
                    <div class="notice-badges">
                      <span class="notice-badge"><i class="mdi mdi-all-inclusive mr-1"></i> Continuous On-Demand Delivery</span>
                      <span class="notice-badge"><i class="mdi mdi-wallet-outline mr-1"></i> Partner Center Token Redemption</span>
                      <span class="notice-badge"><i class="mdi mdi-calendar-clock mr-1"></i> Flexible Center Scheduling</span>
                      <span class="notice-badge"><i class="mdi mdi-file-certificate-outline mr-1"></i> Automated GSFIN Credentials</span>
                    </div>
                  </div>
                </div>

                <div class="form-group">
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
                  <div class="font-semibold text-slate-900 text-sm mb-3 d-flex align-center gap-2">
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
                  class="font-semibold text-white text-none rounded-xl shadow-md mb-3"
                  prepend-icon="mdi-content-save-outline"
                  :loading="saving"
                  @click="saveExam"
                >
                  {{ isEditMode ? 'Save Settings' : 'Create & Proceed to Questions' }}
                </v-btn>

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
  status: 'published',
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

/* Certifying Authority Delivery Model Banner */
.delivery-model-notice {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 20px;
  background-color: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: 14px;
}

.notice-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background-color: #DCFCE7;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notice-text-wrap {
  flex: 1;
  min-width: 0;
}

.notice-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #166534;
  margin-bottom: 4px;
}

.notice-desc {
  font-size: 0.8rem;
  line-height: 1.5;
  color: #15803D;
  margin: 0 0 12px 0;
  font-weight: 500;
}

.notice-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.notice-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 9999px;
  background-color: #FFFFFF;
  color: #166534;
  border: 1px solid #86EFAC;
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
</style>
