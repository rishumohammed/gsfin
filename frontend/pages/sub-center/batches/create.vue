<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ 1. TOP HEADER & BREADCRUMBS ═══ -->
      <div class="admin-header-row">
        <div>
          <div class="header-breadcrumbs">
            <NuxtLink to="/sub-center?tab=batches" class="btn-back-link">
              <i class="mdi mdi-arrow-left"></i> Back to Exam Batches
            </NuxtLink>
            <span class="bc-sep">/</span>
            <div class="breadcrumb-trail">
              <NuxtLink to="/sub-center" class="bc-link">Partner Portal</NuxtLink>
              <i class="mdi mdi-chevron-right bc-icon"></i>
              <NuxtLink to="/sub-center?tab=batches" class="bc-link">Exam Batches</NuxtLink>
              <i class="mdi mdi-chevron-right bc-icon"></i>
              <span class="bc-current">Create Batch</span>
            </div>
          </div>
          <h1 class="admin-title">Create Examination Batch</h1>
          <p class="admin-subtitle">
            Configure examination details, schedule exam window, and enroll students in bulk. 1 student consumes 1 token.
          </p>
        </div>

        <div class="header-actions">
          <button class="btn-icon-refresh" title="Refresh Roster & Wallet" @click="refreshAll" :disabled="loadingData">
            <i :class="['mdi', 'mdi-refresh', { 'spin-icon': loadingData }]"></i>
          </button>
        </div>
      </div>

      <!-- ═══ 2. REAL-TIME TOKEN WALLET KPI RIBBON ═══ -->
      <div class="metrics-grid">
        <!-- 1. Available Wallet Balance -->
        <div class="metric-card metric-card-emerald">
          <div class="metric-icon-box bg-emerald-light">
            <i class="mdi mdi-wallet-outline text-emerald"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Available Wallet Tokens</span>
            <span class="metric-value text-emerald">{{ wallet.totalRemaining ?? 0 }}</span>
            <span class="metric-sub text-emerald">Current Balance</span>
          </div>
        </div>

        <!-- 2. Selected Candidates -->
        <div class="metric-card metric-card-blue">
          <div class="metric-icon-box bg-blue-light">
            <i class="mdi mdi-account-multiple-check-outline text-blue"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Selected Students</span>
            <span class="metric-value text-blue">{{ selectedStudentIds.length }}</span>
            <span class="metric-sub text-blue">Total in this batch</span>
          </div>
        </div>

        <!-- 3. Token Deduction Cost -->
        <div class="metric-card metric-card-indigo">
          <div class="metric-icon-box bg-indigo-light">
            <i class="mdi mdi-ticket-confirmation-outline text-indigo"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Required Batch Cost</span>
            <span class="metric-value text-indigo">{{ selectedStudentIds.length }} Token(s)</span>
            <span class="metric-sub text-indigo">1 Token per student</span>
          </div>
        </div>

        <!-- 4. Projected Balance -->
        <div :class="['metric-card', isShortfall ? 'metric-card-red' : 'metric-card-slate']">
          <div :class="['metric-icon-box', isShortfall ? 'bg-red-light' : 'bg-slate-light']">
            <i :class="['mdi', isShortfall ? 'mdi-alert-circle-outline text-red' : 'mdi-wallet-travel text-slate-700']"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Balance After Batch</span>
            <span :class="['metric-value', isShortfall ? 'text-red' : 'text-slate-800']">
              {{ (wallet.totalRemaining ?? 0) - selectedStudentIds.length }}
            </span>
            <span :class="['metric-sub font-semibold', isShortfall ? 'text-red' : 'text-slate-400']">
              {{ isShortfall ? `Shortfall: ${selectedStudentIds.length - (wallet.totalRemaining ?? 0)} tokens` : 'Sufficient Balance' }}
            </span>
          </div>
        </div>
      </div>

      <!-- ═══ 3. TOKEN SHORTFALL WARNING ALERT ═══ -->
      <div v-if="isShortfall" class="shortfall-alert-card">
        <div class="shortfall-alert-left">
          <div class="shortfall-icon-box">
            <i class="mdi mdi-alert-circle"></i>
          </div>
          <div>
            <h4 class="shortfall-title">Insufficient Wallet Token Balance</h4>
            <p class="shortfall-desc">
              You selected <strong>{{ selectedStudentIds.length }}</strong> students, but only have <strong>{{ wallet.totalRemaining ?? 0 }}</strong> tokens remaining in your wallet.
              Shortfall: <strong>{{ selectedStudentIds.length - (wallet.totalRemaining ?? 0) }} token(s)</strong>.
            </p>
          </div>
        </div>
        <NuxtLink to="/sub-center?tab=wallet" class="btn-red text-xs py-2 px-4 no-underline">
          <i class="mdi mdi-cart-plus"></i> Buy More Tokens
        </NuxtLink>
      </div>

      <!-- ═══ 4. MAIN WORKSPACE PANELS ═══ -->
      <div class="panels-container">

        <!-- ─── SECTION 1: CERTIFICATION EXAM & SCHEDULE ─── -->
        <div class="panel-card">
          <div class="panel-card-header">
            <div class="panel-title-wrap">
              <i class="mdi mdi-calendar-clock panel-icon"></i>
              <div>
                <h3>1. Certification Exam &amp; Exam Window</h3>
                <p class="panel-subtitle-text">Choose the approved qualification exam and optional exam window time limits</p>
              </div>
            </div>
            <span v-if="exams.length > 0" class="badge-chip chip-green">
              <i class="mdi mdi-check-decagram"></i>
              {{ exams.length }} Authorized Program{{ exams.length > 1 ? 's' : '' }} Available
            </span>
          </div>

          <div class="card-content-body">
            <!-- 3-Column Responsive Grid -->
            <div class="exam-schedule-grid">
              <!-- Column 1: Select Exam -->
              <div class="form-group">
                <label class="form-label-xs">
                  Certification Exam <span class="required-star">*</span>
                </label>
                <div class="input-with-icon custom-select-wrapper">
                  <i class="mdi mdi-certificate-outline input-prefix-icon"></i>
                  <select 
                    v-model="batchForm.exam_id" 
                    class="modal-input-field modal-select input-has-prefix" 
                    required 
                    :disabled="loadingExams || exams.length === 0"
                  >
                    <option value="" disabled v-if="loadingExams">Loading authorized certifications...</option>
                    <option value="" disabled v-else-if="exams.length === 0">No authorized programs for this branch</option>
                    <option value="" disabled v-else>Choose an authorized certification...</option>
                    <option v-for="exam in exams" :key="exam.id" :value="exam.id">
                      {{ exam.name }}
                    </option>
                  </select>
                  <i class="mdi mdi-chevron-down select-chevron"></i>
                </div>
                <span v-if="!loadingExams && exams.length === 0" class="form-help-warn">
                  No approved training programs have been enabled for this branch center.
                </span>
              </div>

              <!-- Column 2: Exam Window Opens At -->
              <div class="form-group">
                <label class="form-label-xs">
                  Exam Window Opens At <span class="optional-tag">(Optional)</span>
                </label>
                <div class="input-with-icon">
                  <i class="mdi mdi-calendar-start input-prefix-icon"></i>
                  <input
                    v-model="batchForm.opens_at"
                    type="datetime-local"
                    class="modal-input-field input-has-prefix"
                  />
                </div>
                <span class="form-help-text">Leave blank to open immediately</span>
              </div>

              <!-- Column 3: Exam Window Closes At -->
              <div class="form-group">
                <label class="form-label-xs">
                  Exam Window Closes At <span class="optional-tag">(Optional)</span>
                </label>
                <div class="input-with-icon">
                  <i class="mdi mdi-calendar-end input-prefix-icon"></i>
                  <input
                    v-model="batchForm.closes_at"
                    type="datetime-local"
                    class="modal-input-field input-has-prefix"
                  />
                </div>
                <span class="form-help-text">Leave blank for open-ended window</span>
              </div>
            </div>

            <!-- Quick Schedule Presets -->
            <div class="schedule-presets-bar">
              <span class="preset-label">Quick Schedule:</span>
              <button type="button" class="preset-chip-btn" @click="applySchedulePreset(7)">
                <i class="mdi mdi-calendar-clock"></i> 7 Days Window
              </button>
              <button type="button" class="preset-chip-btn" @click="applySchedulePreset(14)">
                <i class="mdi mdi-calendar-clock"></i> 14 Days Window
              </button>
              <button type="button" class="preset-chip-btn" @click="applySchedulePreset(30)">
                <i class="mdi mdi-calendar-clock"></i> 30 Days Window
              </button>
              <button type="button" class="preset-chip-btn preset-chip-clear" @click="clearSchedule">
                <i class="mdi mdi-close"></i> Open-Ended (No Expiration)
              </button>
            </div>
          </div>
        </div>

        <!-- ─── SECTION 2: CANDIDATE STUDENTS MANAGEMENT ─── -->
        <div class="panel-card">
          <div class="panel-card-header">
            <div class="panel-title-wrap">
              <i class="mdi mdi-account-group-outline panel-icon"></i>
              <div>
                <h3>2. Select Students Roster <span class="required-star">*</span></h3>
                <p class="panel-subtitle-text">
                  Select candidates to enroll in this batch. Click any student row to toggle selection.
                </p>
              </div>
            </div>

            <!-- Selection Count Badges -->
            <div class="panel-filter-row">
              <span class="badge-chip chip-green">
                <i class="mdi mdi-check"></i> {{ selectedStudentIds.length }} Selected
              </span>
              <span class="badge-chip chip-slate">
                {{ filteredStudents.length }} of {{ students.length }} Students
              </span>
            </div>
          </div>

          <!-- Filter & Bulk Actions Bar -->
          <div class="roster-toolbar">
            <!-- Left: Search and Mode Pills -->
            <div class="roster-toolbar-left">
              <div class="search-input-wrap">
                <i class="mdi mdi-magnify search-icon"></i>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search students by name, email..."
                  class="table-search-input"
                />
                <button v-if="searchQuery" type="button" class="search-clear-btn" @click="searchQuery = ''">
                  <i class="mdi mdi-close-circle"></i>
                </button>
              </div>

              <!-- Filter Tabs (All / Selected / Unselected) -->
              <div class="filter-mode-pills">
                <button
                  type="button"
                  :class="['filter-pill-btn', { active: filterMode === 'all' }]"
                  @click="filterMode = 'all'"
                >
                  All ({{ students.length }})
                </button>
                <button
                  type="button"
                  :class="['filter-pill-btn', { 'active-green': filterMode === 'selected' }]"
                  @click="filterMode = 'selected'"
                >
                  Selected ({{ selectedStudentIds.length }})
                </button>
                <button
                  type="button"
                  :class="['filter-pill-btn', { active: filterMode === 'unselected' }]"
                  @click="filterMode = 'unselected'"
                >
                  Unselected ({{ students.length - selectedStudentIds.length }})
                </button>
              </div>
            </div>

            <!-- Right: Bulk Actions -->
            <div class="roster-toolbar-right">
              <button
                type="button"
                class="btn-bulk-action"
                @click="selectAllFiltered"
                :title="`Select all ${filteredStudents.length} filtered students`"
              >
                <i class="mdi mdi-check-all text-emerald"></i> Select All ({{ filteredStudents.length }})
              </button>
              <button
                type="button"
                class="btn-bulk-action"
                @click="clearAllSelections"
                :disabled="selectedStudentIds.length === 0"
              >
                <i class="mdi mdi-close text-red"></i> Clear (0)
              </button>
            </div>
          </div>

          <!-- Selected Candidates Summary Tray (Collapsible chip list) -->
          <div v-if="selectedStudentIds.length > 0" class="selected-summary-tray">
            <div class="tray-inner">
              <span class="tray-label">Selected ({{ selectedStudentIds.length }}):</span>
              <div class="tray-chips">
                <span
                  v-for="st in selectedStudentsPreview"
                  :key="st.id"
                  class="tray-chip"
                >
                  <span>{{ st.name }}</span>
                  <button type="button" class="tray-chip-remove" @click.stop="toggleStudent(st.id)">
                    <i class="mdi mdi-close-circle"></i>
                  </button>
                </span>
                <span v-if="selectedStudentIds.length > 12" class="tray-more-text">
                  +{{ selectedStudentIds.length - 12 }} more
                </span>
              </div>
            </div>
            <button type="button" class="tray-deselect-btn" @click="clearAllSelections">
              Deselect All
            </button>
          </div>

          <!-- ═══ STUDENTS TABLE ═══ -->
          <div class="table-responsive">
            <div v-if="loadingStudents" class="table-empty-box">
              <span class="spinner-sm-red mb-2"></span>
              <p class="text-xs font-medium">Loading students...</p>
            </div>

            <div v-else-if="filteredStudents.length === 0" class="table-empty-box">
              <i class="mdi mdi-account-search-outline empty-icon"></i>
              <h4 class="empty-title">No Students Found</h4>
              <p class="empty-desc">
                {{ searchQuery ? 'No students match your search filter.' : 'Your student directory is currently empty. Please add students first.' }}
              </p>
              <NuxtLink v-if="students.length === 0" to="/sub-center?tab=students" class="btn-red text-xs py-1.5 px-3 mt-4 inline-flex items-center gap-1 no-underline">
                <i class="mdi mdi-account-plus"></i> Add Students
              </NuxtLink>
            </div>

            <table v-else class="gsfin-table">
              <thead>
                <tr>
                  <th class="th-checkbox">
                    <input
                      type="checkbox"
                      class="custom-checkbox"
                      :checked="isAllFilteredSelected"
                      :indeterminate.prop="isIndeterminate"
                      @click="toggleSelectAllFiltered"
                      title="Select or deselect all students on this view"
                    />
                  </th>
                  <th>Student Account</th>
                  <th>Phone Number</th>
                  <th>Education / Program</th>
                  <th>Registered Date</th>
                  <th class="text-right">Enrollment Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="student in paginatedStudents"
                  :key="student.id"
                  :class="['table-row-selectable', { 'row-selected': isSelected(student.id) }]"
                  @click="toggleStudent(student.id)"
                >
                  <!-- Checkbox -->
                  <td class="td-checkbox" @click.stop>
                    <input
                      type="checkbox"
                      class="custom-checkbox"
                      :checked="isSelected(student.id)"
                      @change="toggleStudent(student.id)"
                    />
                  </td>

                  <!-- Student Name & Avatar -->
                  <td>
                    <div class="candidate-cell">
                      <img
                        v-if="student.face_photo"
                        :src="student.face_photo"
                        alt="Photo"
                        class="candidate-avatar-photo"
                      />
                      <div v-else class="candidate-avatar-circle">
                        {{ student.name ? student.name.charAt(0).toUpperCase() : 'S' }}
                      </div>
                      <div class="candidate-info-col">
                        <div class="candidate-name">{{ student.name }}</div>
                        <div class="candidate-email">{{ student.email }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Phone Number -->
                  <td>
                    <span v-if="student.phone" class="text-slate-700 font-mono text-xs">{{ student.phone }}</span>
                    <span v-else class="text-slate-300 text-xs">—</span>
                  </td>

                  <!-- Education -->
                  <td>
                    <div class="text-xs text-slate-800 font-medium">{{ student.education_level || 'General / Professional' }}</div>
                    <div v-if="student.institution_name" class="text-[11px] text-slate-400 truncate max-w-xs">{{ student.institution_name }}</div>
                  </td>

                  <!-- Registered Date -->
                  <td>
                    <span class="text-xs text-slate-600">{{ formatDate(student.created_at) }}</span>
                  </td>

                  <!-- Selection Status Pill -->
                  <td class="text-right">
                    <span v-if="isSelected(student.id)" class="badge-chip chip-green">
                      <i class="mdi mdi-check"></i> Selected
                    </span>
                    <span v-else class="badge-chip chip-slate">
                      Not Selected
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <div v-if="filteredStudents.length > pageSize" class="pagination-footer-row">
            <div class="pagination-count-text">
              Showing <strong>{{ (currentPage - 1) * pageSize + 1 }}</strong> - <strong>{{ Math.min(currentPage * pageSize, filteredStudents.length) }}</strong> of <strong>{{ filteredStudents.length }}</strong> students
            </div>

            <div class="pagination-controls">
              <label class="text-xs text-slate-500">Per page:</label>
              <select v-model.number="pageSize" class="pagination-select">
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
                <option :value="500">All</option>
              </select>

              <div class="pagination-nav-btns">
                <button
                  type="button"
                  class="btn-page-nav"
                  :disabled="currentPage === 1"
                  @click="currentPage--"
                >
                  <i class="mdi mdi-chevron-left"></i>
                </button>
                <span class="page-current-indicator">Page {{ currentPage }} of {{ totalPages }}</span>
                <button
                  type="button"
                  class="btn-page-nav"
                  :disabled="currentPage === totalPages"
                  @click="currentPage++"
                >
                  <i class="mdi mdi-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ═══ 5. STICKY ACTION DOCK ═══ -->
      <div class="batch-sticky-dock">
        <div class="dock-left-group">
          <NuxtLink to="/sub-center?tab=batches" class="btn-glass">
            <i class="mdi mdi-arrow-left"></i> Cancel &amp; Return
          </NuxtLink>
          <div class="dock-summary-text">
            <span>Selected: <strong class="text-slate-900">{{ selectedStudentIds.length }}</strong> students</span>
            <span class="dock-sep">•</span>
            <span>Cost: <strong class="text-emerald">{{ selectedStudentIds.length }} Token(s)</strong></span>
            <span class="dock-sep">•</span>
            <span>Wallet: <strong :class="isShortfall ? 'text-red' : 'text-slate-800'">{{ (wallet.totalRemaining ?? 0) - selectedStudentIds.length }} Remaining</strong></span>
          </div>
        </div>

        <div class="dock-right-group">
          <button
            type="button"
            class="btn-red"
            :disabled="savingBatch || selectedStudentIds.length === 0 || !batchForm.exam_id || isShortfall"
            @click="submitCreateBatch"
          >
            <i :class="['mdi', savingBatch ? 'mdi-loading spin-icon' : 'mdi-layers-plus']"></i>
            <span>
              {{ savingBatch ? 'Creating Batch & Enrolling...' : `Create Exam Batch (${selectedStudentIds.length} Students)` }}
            </span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'sub_center_staff']
});

const router = useRouter();
const api = useApi();

// State
const loadingData = ref(false);
const loadingExams = ref(false);
const loadingStudents = ref(false);
const savingBatch = ref(false);

const wallet = ref<any>({ totalRemaining: 0, totalPurchased: 0, totalUsed: 0 });
const exams = ref<any[]>([]);
const students = ref<any[]>([]);
const selectedStudentIds = ref<string[]>([]);

const batchForm = ref({
  exam_id: '',
  opens_at: '',
  closes_at: ''
});

// Search & Filter
const searchQuery = ref('');
const filterMode = ref<'all' | 'selected' | 'unselected'>('all');
const currentPage = ref(1);
const pageSize = ref(50);

// Computed
const isShortfall = computed(() => {
  return selectedStudentIds.value.length > (wallet.value.totalRemaining || 0);
});

const filteredStudents = computed(() => {
  let list = students.value || [];

  // Filter mode
  if (filterMode.value === 'selected') {
    list = list.filter(s => selectedStudentIds.value.includes(s.id));
  } else if (filterMode.value === 'unselected') {
    list = list.filter(s => !selectedStudentIds.value.includes(s.id));
  }

  // Search filter
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter(s => {
      const name = (s.name || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const phone = (s.phone || '').toLowerCase();
      const id = (s.id || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || id.includes(q);
    });
  }

  return list;
});

const totalPages = computed(() => {
  return Math.ceil(filteredStudents.value.length / pageSize.value) || 1;
});

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredStudents.value.slice(start, start + pageSize.value);
});

const isAllFilteredSelected = computed(() => {
  if (filteredStudents.value.length === 0) return false;
  return filteredStudents.value.every(s => selectedStudentIds.value.includes(s.id));
});

const isIndeterminate = computed(() => {
  if (filteredStudents.value.length === 0) return false;
  const count = filteredStudents.value.filter(s => selectedStudentIds.value.includes(s.id)).length;
  return count > 0 && count < filteredStudents.value.length;
});

const selectedStudentsPreview = computed(() => {
  const map = new Map(students.value.map(s => [s.id, s]));
  return selectedStudentIds.value.slice(0, 12).map(id => map.get(id)).filter(Boolean);
});

// Selection helpers
function isSelected(id: string) {
  return selectedStudentIds.value.includes(id);
}

function toggleStudent(id: string) {
  const idx = selectedStudentIds.value.indexOf(id);
  if (idx > -1) {
    selectedStudentIds.value.splice(idx, 1);
  } else {
    selectedStudentIds.value.push(id);
  }
}

function selectAllFiltered() {
  const set = new Set(selectedStudentIds.value);
  filteredStudents.value.forEach(s => set.add(s.id));
  selectedStudentIds.value = Array.from(set);
}

function toggleSelectAllFiltered() {
  if (isAllFilteredSelected.value) {
    const filteredSet = new Set(filteredStudents.value.map(s => s.id));
    selectedStudentIds.value = selectedStudentIds.value.filter(id => !filteredSet.has(id));
  } else {
    selectAllFiltered();
  }
}

function clearAllSelections() {
  selectedStudentIds.value = [];
}

// Preset scheduling
function applySchedulePreset(days: number) {
  const now = new Date();
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const pad = (n: number) => String(n).padStart(2, '0');
  const formatIsoLocal = (d: Date) => {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  batchForm.value.opens_at = formatIsoLocal(now);
  batchForm.value.closes_at = formatIsoLocal(end);
}

function clearSchedule() {
  batchForm.value.opens_at = '';
  batchForm.value.closes_at = '';
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// Data fetching
async function fetchWallet() {
  try {
    const { data } = await api.get('/sub-center/wallet');
    wallet.value = data || { totalRemaining: 0, totalPurchased: 0, totalUsed: 0 };
  } catch (err) {
    console.error('Failed to fetch wallet:', err);
  }
}

async function fetchExams() {
  loadingExams.value = true;
  try {
    const { data } = await api.get('/sub-center/exams');
    exams.value = Array.isArray(data) ? data : [];
    if (exams.value.length === 1 && !batchForm.value.exam_id) {
      batchForm.value.exam_id = exams.value[0].id;
    }
  } catch (err) {
    console.error('Failed to fetch exams:', err);
  } finally {
    loadingExams.value = false;
  }
}

async function fetchStudents() {
  loadingStudents.value = true;
  try {
    const { data } = await api.get('/sub-center/students');
    students.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Failed to fetch students:', err);
  } finally {
    loadingStudents.value = false;
  }
}

async function refreshAll() {
  loadingData.value = true;
  await Promise.allSettled([fetchWallet(), fetchExams(), fetchStudents()]);
  loadingData.value = false;
}

// Batch Submission
async function submitCreateBatch() {
  if (!batchForm.value.exam_id) {
    alert('Please select an authorized certification exam.');
    return;
  }
  if (selectedStudentIds.value.length === 0) {
    alert('Please select at least 1 student for this batch.');
    return;
  }
  if (isShortfall.value) {
    alert('Insufficient wallet tokens to create this batch. Please buy tokens or reduce selection.');
    return;
  }

  savingBatch.value = true;
  try {
    const payload = {
      exam_id: batchForm.value.exam_id,
      student_ids: selectedStudentIds.value,
      opens_at: batchForm.value.opens_at || null,
      closes_at: batchForm.value.closes_at || null
    };

    const { data } = await api.post('/sub-center/batches', payload);
    alert(data?.message || `Successfully created batch with ${selectedStudentIds.value.length} enrolled students!`);
    router.push('/sub-center?tab=batches');
  } catch (err: any) {
    alert(err?.response?.data?.message || err?.message || 'Failed to create exam batch.');
  } finally {
    savingBatch.value = false;
  }
}

onMounted(async () => {
  await refreshAll();
});
</script>

<style scoped>
/* Page Layout */
.gsfin-admin-page {
  background-color: #FAFAFD;
  min-height: 100vh;
  padding-bottom: 60px;
}

.admin-wrap {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .admin-wrap {
    padding: 16px;
  }
}

/* Header & Breadcrumbs */
.admin-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.header-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.btn-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748B;
  text-decoration: none;
  transition: color 0.15s;
}
.btn-back-link:hover {
  color: #E31B23;
}

.breadcrumb-trail {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #64748B;
}

.bc-link {
  color: #64748B;
  text-decoration: none;
  transition: color 0.15s;
}
.bc-link:hover {
  color: #E31B23;
}

.bc-sep {
  color: #CBD5E1;
  font-size: 0.8rem;
}

.bc-icon {
  color: #CBD5E1;
  font-size: 0.85rem;
}

.bc-current {
  color: #0F172A;
  font-weight: 600;
}

.admin-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  letter-spacing: -0.02em;
}

.admin-subtitle {
  font-size: 0.86rem;
  color: #64748B;
  margin: 4px 0 0 0;
  font-weight: 400;
  max-width: 760px;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-icon-refresh {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.1);
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  transition: all 0.15s;
}
.btn-icon-refresh:hover {
  background: #F8FAFC;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.2);
}

.spin-icon {
  animation: spin 0.75s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}
@media (max-width: 1024px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}

.metric-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 22px 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.metric-card-emerald {
  background: linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 55%, #DCFCE7 100%);
  border: 1px solid rgba(16, 185, 129, 0.18);
}
.metric-card-blue {
  background: linear-gradient(135deg, #FFFFFF 0%, #F0F7FF 55%, #E1EFFF 100%);
  border: 1px solid rgba(37, 99, 235, 0.18);
}
.metric-card-indigo {
  background: linear-gradient(135deg, #FFFFFF 0%, #EEF2FF 55%, #E0E7FF 100%);
  border: 1px solid rgba(79, 70, 229, 0.18);
}
.metric-card-red {
  background: linear-gradient(135deg, #FFFFFF 0%, #FEF2F2 55%, #FEE2E2 100%);
  border: 1px solid rgba(227, 27, 35, 0.18);
}
.metric-card-slate {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.metric-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.55rem;
  flex-shrink: 0;
}

.bg-emerald-light { background: rgba(16, 185, 129, 0.12) !important; }
.text-emerald { color: #059669 !important; }
.bg-blue-light { background: rgba(37, 99, 235, 0.12) !important; }
.text-blue { color: #2563EB !important; }
.bg-indigo-light { background: rgba(79, 70, 229, 0.12) !important; }
.text-indigo { color: #4F46E5 !important; }
.bg-red-light { background: rgba(227, 27, 35, 0.12) !important; }
.text-red { color: #E31B23 !important; }
.bg-slate-light { background: #F1F5F9 !important; }

.metric-info {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.74rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748B;
}

.metric-value {
  font-size: 1.55rem;
  font-weight: 600;
  line-height: 1.2;
  margin-top: 3px;
}

.metric-sub {
  font-size: 0.72rem;
  margin-top: 3px;
}

/* Shortfall Alert */
.shortfall-alert-card {
  padding: 16px 20px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 18px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.shortfall-alert-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.shortfall-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #FEE2E2;
  color: #DC2626;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}
.shortfall-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: #991B1B;
  margin: 0;
}
.shortfall-desc {
  font-size: 0.78rem;
  color: #B91C1C;
  margin: 2px 0 0 0;
}

/* Panels */
.panels-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.panel-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
  overflow: hidden;
}

.panel-card-header {
  padding: 18px 26px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  background: #FAFAFD;
}

.panel-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-icon {
  font-size: 1.4rem;
  color: #E31B23;
}

.panel-title-wrap h3 {
  font-size: 1.05rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
}

.panel-subtitle-text {
  font-size: 0.78rem;
  color: #64748B;
  margin: 2px 0 0 0;
}

.panel-filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.card-content-body {
  padding: 24px 26px;
}

/* Section 1 Form Grid */
.exam-schedule-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 18px;
}
@media (max-width: 960px) {
  .exam-schedule-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label-xs {
  font-size: 0.76rem;
  font-weight: 600;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.required-star {
  color: #E31B23;
}
.optional-tag {
  color: #94A3B8;
  font-weight: 400;
  text-transform: none;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix-icon {
  position: absolute;
  left: 14px;
  color: #94A3B8;
  font-size: 1.15rem;
  pointer-events: none;
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
  font-family: inherit;
  box-sizing: border-box;
  transition: all 0.15s ease;
}
.modal-input-field:focus {
  border-color: #E31B23;
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.08);
}

.modal-input-field.input-has-prefix {
  padding-left: 42px;
}

.custom-select-wrapper {
  position: relative;
}

.modal-select {
  appearance: none;
  padding-right: 36px;
  cursor: pointer;
}

.select-chevron {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748B;
  pointer-events: none;
  font-size: 1.1rem;
}

.form-help-text {
  font-size: 0.72rem;
  color: #94A3B8;
  margin-top: 2px;
}
.form-help-warn {
  font-size: 0.75rem;
  color: #D97706;
  margin-top: 4px;
}

/* Schedule Presets Bar */
.schedule-presets-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid #F1F5F9;
}

.preset-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748B;
  margin-right: 2px;
}

.preset-chip-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 50px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}
.preset-chip-btn:hover {
  background: #FEF2F2;
  border-color: rgba(227, 27, 35, 0.3);
  color: #E31B23;
}
.preset-chip-clear {
  color: #64748B;
}

/* Section 2 Toolbar */
.roster-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 26px;
  background: #FAFAFD;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  flex-wrap: wrap;
}

.roster-toolbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.roster-toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 280px;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #94A3B8;
  font-size: 1.1rem;
  pointer-events: none;
}

.table-search-input {
  width: 100%;
  padding: 8px 36px 8px 40px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  font-size: 0.84rem;
  color: #0F172A;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.table-search-input:focus {
  border-color: #E31B23;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.08);
}

.search-clear-btn {
  position: absolute;
  right: 10px;
  color: #94A3B8;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
}
.search-clear-btn:hover {
  color: #475569;
}

/* Filter Mode Pills */
.filter-mode-pills {
  display: inline-flex;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  padding: 2px;
}

.filter-pill-btn {
  padding: 6px 14px;
  font-size: 0.74rem;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: #64748B;
  cursor: pointer;
  transition: all 0.15s ease;
}
.filter-pill-btn:hover {
  color: #0F172A;
}
.filter-pill-btn.active {
  background: #0F172A;
  color: #FFFFFF;
}
.filter-pill-btn.active-green {
  background: #059669;
  color: #FFFFFF;
}

.btn-bulk-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  color: #334155;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-bulk-action:hover:not(:disabled) {
  background: #F8FAFC;
  border-color: #CBD5E1;
  color: #0F172A;
}
.btn-bulk-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Selected Summary Tray */
.selected-summary-tray {
  padding: 12px 26px;
  background: #F0FDF4;
  border-bottom: 1px solid rgba(16, 185, 129, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.tray-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.tray-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #065F46;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.tray-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.tray-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 50px;
  background: #FFFFFF;
  border: 1px solid #A7F3D0;
  color: #065F46;
  font-size: 0.75rem;
  font-weight: 500;
}
.tray-chip-remove {
  background: transparent;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}
.tray-chip-remove:hover {
  color: #E31B23;
}
.tray-more-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #059669;
}
.tray-deselect-btn {
  background: transparent;
  border: none;
  color: #059669;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

/* GSFIN Table */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.gsfin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.gsfin-table th {
  padding: 14px 24px;
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
  padding: 16px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
  font-size: 0.86rem;
  color: #334155;
  vertical-align: middle;
}

.th-checkbox, .td-checkbox {
  width: 48px;
  text-align: center !important;
  padding-left: 18px !important;
  padding-right: 12px !important;
}

.table-row-selectable {
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.table-row-selectable:hover {
  background: #F8FAFC;
}
.table-row-selectable.row-selected {
  background: #F0FDF4 !important;
}
.table-row-selectable.row-selected td {
  border-bottom-color: rgba(16, 185, 129, 0.15);
}

.custom-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #E31B23;
  cursor: pointer;
}

/* Candidate Cell */
.candidate-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
}

.candidate-avatar-photo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #10B981;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.candidate-avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(79, 70, 229, 0.08);
  color: #4F46E5;
  border: 1px solid rgba(79, 70, 229, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.candidate-info-col {
  display: flex;
  flex-direction: column;
}

.candidate-name {
  font-weight: 600;
  font-size: 0.86rem;
  color: #0F172A;
  line-height: 1.3;
}

.candidate-email {
  font-size: 0.75rem;
  color: #64748B;
  font-family: monospace;
  margin-top: 2px;
}

/* Badges & Chips */
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

/* Empty State */
.table-empty-box {
  text-align: center;
  padding: 48px 24px;
}
.empty-icon {
  font-size: 2.8rem;
  color: #CBD5E1;
  display: block;
  margin-bottom: 8px;
}
.empty-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #334155;
  margin: 0;
}
.empty-desc {
  font-size: 0.78rem;
  color: #94A3B8;
  margin: 4px 0 0 0;
}

/* Pagination Bar */
.pagination-footer-row {
  padding: 16px 26px;
  background: #FAFAFD;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.pagination-count-text {
  font-size: 0.78rem;
  color: #64748B;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination-select {
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  font-size: 0.75rem;
  color: #0F172A;
  outline: none;
}

.pagination-nav-btns {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
}

.btn-page-nav {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-page-nav:hover:not(:disabled) {
  background: #F1F5F9;
  color: #0F172A;
}
.btn-page-nav:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.page-current-indicator {
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  padding: 0 4px;
}

/* Sticky Action Dock */
.batch-sticky-dock {
  position: sticky;
  bottom: 20px;
  z-index: 50;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 20px;
  padding: 16px 28px;
  box-shadow: 0 12px 32px -4px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 28px;
  flex-wrap: wrap;
}

.dock-left-group {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.dock-summary-text {
  font-size: 0.8rem;
  color: #64748B;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dock-sep {
  color: #CBD5E1;
}

.dock-right-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Standard Buttons */
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
  transition: all 0.2s ease;
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
  transition: all 0.2s ease;
  cursor: pointer;
  text-decoration: none;
}
.btn-red:hover:not(:disabled) {
  background: #C4131B;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(227, 27, 35, 0.3);
}
.btn-red:disabled {
  background: #CBD5E1;
  color: #94A3B8;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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
</style>