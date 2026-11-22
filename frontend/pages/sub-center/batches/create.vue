<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ 1. TOP HEADER & BREADCRUMBS ═══ -->
      <div class="admin-header-row mb-6">
        <div>
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <NuxtLink to="/sub-center?tab=batches" class="btn-back-link">
              <i class="mdi mdi-arrow-left"></i> Back to Exam Batches
            </NuxtLink>
            <span class="text-slate-300">/</span>
            <div class="breadcrumb-trail">
              <NuxtLink to="/sub-center" class="bc-link">Partner Portal</NuxtLink>
              <i class="mdi mdi-chevron-right bc-sep"></i>
              <NuxtLink to="/sub-center?tab=batches" class="bc-link">Exam Batches</NuxtLink>
              <i class="mdi mdi-chevron-right bc-sep"></i>
              <span class="bc-current">Create Batch</span>
            </div>
          </div>
          <h1 class="admin-title">Create Examination Batch</h1>
          <p class="admin-subtitle">
            Configure examination details, schedule sitting window, and enroll students in bulk. 1 student consumes 1 token.
          </p>
        </div>

        <div class="header-actions">
          <button class="btn-icon-refresh" title="Refresh Roster & Wallet" @click="refreshAll" :disabled="loadingData">
            <i :class="['mdi', 'mdi-refresh', { 'spin-icon': loadingData }]"></i>
          </button>
        </div>
      </div>

      <!-- ═══ 2. REAL-TIME TOKEN WALLET KPI RIBBON ═══ -->
      <div class="metrics-grid mb-6">
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
          <div :class="['metric-icon-box', isShortfall ? 'bg-red-light' : 'bg-slate-100']">
            <i :class="['mdi', isShortfall ? 'mdi-alert-circle-outline text-red' : 'mdi-wallet-travel text-slate-700']"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Balance After Batch</span>
            <span :class="['metric-value', isShortfall ? 'text-red' : 'text-slate-800']">
              {{ (wallet.totalRemaining ?? 0) - selectedStudentIds.length }}
            </span>
            <span :class="['metric-sub', isShortfall ? 'text-red font-semibold' : 'text-slate-400']">
              {{ isShortfall ? `Shortfall: ${selectedStudentIds.length - (wallet.totalRemaining ?? 0)} tokens` : 'Sufficient Balance' }}
            </span>
          </div>
        </div>
      </div>

      <!-- ═══ 3. TOKEN SHORTFALL WARNING ALERT ═══ -->
      <div v-if="isShortfall" class="p-4 bg-red-50 border border-red-200 rounded-2xl mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-red-100 text-red flex items-center justify-center text-xl flex-shrink-0">
            <i class="mdi mdi-alert-circle"></i>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-red-900 m-0">Insufficient Wallet Token Balance</h4>
            <p class="text-xs text-red-700 m-0 mt-0.5">
              You selected <strong>{{ selectedStudentIds.length }}</strong> students, but only have <strong>{{ wallet.totalRemaining ?? 0 }}</strong> tokens remaining.
              Shortfall: <strong>{{ selectedStudentIds.length - (wallet.totalRemaining ?? 0) }} token(s)</strong>.
            </p>
          </div>
        </div>
        <NuxtLink to="/sub-center?tab=wallet" class="btn-red text-xs py-2 px-4 inline-flex items-center gap-1.5 no-underline">
          <i class="mdi mdi-cart-plus"></i> Buy More Tokens
        </NuxtLink>
      </div>

      <!-- ═══ 4. MAIN WORKSPACE PANELS ═══ -->
      <div class="space-y-6">

        <!-- ─── SECTION 1: CERTIFICATION EXAM & SCHEDULE ─── -->
        <div class="panel-card">
          <div class="panel-card-header">
            <div class="panel-title-wrap">
              <i class="mdi mdi-calendar-clock panel-icon"></i>
              <div>
                <h3>1. Certification Exam &amp; Schedule Window</h3>
                <p class="panel-subtitle-text">Choose the approved qualification exam and optional time limits</p>
              </div>
            </div>
            <span v-if="exams.length > 0" class="badge-chip chip-green">
              <i class="mdi mdi-check-decagram mr-1"></i>
              {{ exams.length }} Authorized Program{{ exams.length > 1 ? 's' : '' }} Available
            </span>
          </div>

          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
              <!-- Select Exam -->
              <div class="form-group md:col-span-1">
                <label class="form-label-xs">
                  Certification Exam <span class="text-red">*</span>
                </label>
                <div class="custom-select-wrapper">
                  <select 
                    v-model="batchForm.exam_id" 
                    class="modal-input-field modal-select" 
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
                <span v-if="!loadingExams && exams.length === 0" class="text-xs text-amber-600 mt-1 block">
                  No approved training programs have been enabled for this branch center.
                </span>
              </div>

              <!-- Exam Window Opens At -->
              <div class="form-group md:col-span-1">
                <label class="form-label-xs">
                  Exam Window Opens At <span class="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  v-model="batchForm.opens_at"
                  type="datetime-local"
                  class="modal-input-field"
                />
                <span class="text-[11px] text-slate-400 mt-1 block">Leave blank to open immediately</span>
              </div>

              <!-- Exam Window Closes At -->
              <div class="form-group md:col-span-1">
                <label class="form-label-xs">
                  Exam Window Closes At <span class="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  v-model="batchForm.closes_at"
                  type="datetime-local"
                  class="modal-input-field"
                />
                <span class="text-[11px] text-slate-400 mt-1 block">Leave blank for open-ended window</span>
              </div>
            </div>

            <!-- Quick Schedule Presets -->
            <div class="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quick Schedule:</span>
              <button type="button" class="preset-pill" @click="applySchedulePreset(7)">
                <i class="mdi mdi-calendar-clock"></i> 7 Days Window
              </button>
              <button type="button" class="preset-pill" @click="applySchedulePreset(14)">
                <i class="mdi mdi-calendar-clock"></i> 14 Days Window
              </button>
              <button type="button" class="preset-pill" @click="applySchedulePreset(30)">
                <i class="mdi mdi-calendar-clock"></i> 30 Days Window
              </button>
              <button type="button" class="preset-pill text-slate-500" @click="clearSchedule">
                <i class="mdi mdi-close"></i> Open-Ended (No Expiration)
              </button>
            </div>
          </div>
        </div>

        <!-- ─── SECTION 2: CANDIDATE STUDENTS MANAGEMENT ─── -->
        <div class="panel-card">
          <div class="panel-card-header flex-wrap gap-3">
            <div class="panel-title-wrap">
              <i class="mdi mdi-account-group-outline panel-icon"></i>
              <div>
                <h3>2. Select Students Roster <span class="text-red">*</span></h3>
                <p class="panel-subtitle-text">
                  Select students to enroll in this batch. Click any student row to toggle selection.
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
          <div class="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-wrap">
            <!-- Search Input -->
            <div class="search-input-wrap flex-1 max-w-md">
              <i class="mdi mdi-magnify search-icon"></i>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search students by name, email, phone..."
                class="table-search-input w-full"
              />
              <button v-if="searchQuery" type="button" class="search-clear-btn" @click="searchQuery = ''">
                <i class="mdi mdi-close-circle"></i>
              </button>
            </div>

            <!-- Quick Filter Tabs (All / Selected / Unselected) -->
            <div class="flex items-center gap-2 flex-wrap">
              <div class="filter-mode-pills">
                <button
                  type="button"
                  :class="['filter-pill-btn', filterMode === 'all' ? 'active' : '']"
                  @click="filterMode = 'all'"
                >
                  All ({{ students.length }})
                </button>
                <button
                  type="button"
                  :class="['filter-pill-btn', filterMode === 'selected' ? 'active-green' : '']"
                  @click="filterMode = 'selected'"
                >
                  Selected ({{ selectedStudentIds.length }})
                </button>
                <button
                  type="button"
                  :class="['filter-pill-btn', filterMode === 'unselected' ? 'active' : '']"
                  @click="filterMode = 'unselected'"
                >
                  Unselected ({{ students.length - selectedStudentIds.length }})
                </button>
              </div>

              <!-- Bulk Action Buttons -->
              <button
                type="button"
                class="btn-bulk-action"
                @click="selectAllFiltered"
                :title="`Select all ${filteredStudents.length} filtered students`"
              >
                <i class="mdi mdi-check-all text-emerald"></i> Select All Filtered ({{ filteredStudents.length }})
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
          <div v-if="selectedStudentIds.length > 0" class="p-3 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Selected ({{ selectedStudentIds.length }}):</span>
              <div class="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto">
                <span
                  v-for="st in selectedStudentsPreview"
                  :key="st.id"
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-emerald-200 text-slate-800 shadow-2xs"
                >
                  <span>{{ st.name }}</span>
                  <button type="button" class="text-slate-400 hover:text-red cursor-pointer ml-0.5" @click.stop="toggleStudent(st.id)">
                    <i class="mdi mdi-close-circle text-xs"></i>
                  </button>
                </span>
                <span v-if="selectedStudentIds.length > 12" class="text-xs text-emerald-700 font-medium">
                  +{{ selectedStudentIds.length - 12 }} more
                </span>
              </div>
            </div>
            <button type="button" class="text-xs text-emerald-700 hover:underline font-semibold cursor-pointer" @click="clearAllSelections">
              Deselect All
            </button>
          </div>

          <!-- ═══ STUDENTS TABLE ═══ -->
          <div class="table-responsive">
            <div v-if="loadingStudents" class="text-center py-16 text-slate-500">
              <span class="spinner-sm-red mb-2"></span>
              <p class="text-xs font-medium">Loading students...</p>
            </div>

            <div v-else-if="filteredStudents.length === 0" class="text-center py-16 text-slate-400">
              <i class="mdi mdi-account-search-outline text-4xl block mb-2 text-slate-300"></i>
              <p class="text-sm font-semibold text-slate-700 m-0">No Students Found</p>
              <p class="text-xs text-slate-400 mt-1 m-0">
                {{ searchQuery ? 'No students match your search filter.' : 'Your student directory is currently empty. Please add students first.' }}
              </p>
              <NuxtLink v-if="students.length === 0" to="/sub-center?tab=students" class="btn-red text-xs py-1.5 px-3 mt-4 inline-flex items-center gap-1 no-underline">
                <i class="mdi mdi-account-plus"></i> Add Students
              </NuxtLink>
            </div>

            <table v-else class="gsfin-table">
              <thead>
                <tr>
                  <th class="w-12 text-center">
                    <input
                      type="checkbox"
                      class="custom-checkbox cursor-pointer"
                      :checked="isAllFilteredSelected"
                      :indeterminate.prop="isIndeterminate"
                      @click="toggleSelectAllFiltered"
                      title="Select or deselect all students on this view"
                    />
                  </th>
                  <th>Student Name</th>
                  <th>Contact Info</th>
                  <th>Education / Program</th>
                  <th>Registered Date</th>
                  <th class="text-right">Enrollment Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="student in paginatedStudents"
                  :key="student.id"
                  :class="['cursor-pointer', { 'row-selected': isSelected(student.id) }]"
                  @click="toggleStudent(student.id)"
                >
                  <!-- Checkbox -->
                  <td class="text-center" @click.stop>
                    <input
                      type="checkbox"
                      class="custom-checkbox cursor-pointer"
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
                      <div>
                        <div class="font-semibold text-slate-900 text-xs leading-tight">{{ student.name }}</div>
                        <span v-if="student.id" class="text-[10px] text-slate-400 font-mono">ID: {{ student.id.slice(0, 8) }}</span>
                      </div>
                    </div>
                  </td>

                  <!-- Contact Info -->
                  <td>
                    <div class="text-xs text-slate-700 font-mono leading-tight">{{ student.email }}</div>
                    <div v-if="student.phone" class="text-[11px] text-slate-400 mt-0.5">{{ student.phone }}</div>
                  </td>

                  <!-- Education -->
                  <td>
                    <span class="text-xs text-slate-700 font-medium">{{ student.education_level || 'General / Professional' }}</span>
                    <span v-if="student.institution_name" class="text-[11px] text-slate-400 block truncate max-w-xs">{{ student.institution_name }}</span>
                  </td>

                  <!-- Registered Date -->
                  <td>
                    <span class="text-xs text-slate-500">{{ formatDate(student.created_at) }}</span>
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

          <!-- Pagination / Page Size Footer -->
          <div v-if="filteredStudents.length > pageSize" class="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-600">
            <div>
              Showing <strong>{{ (currentPage - 1) * pageSize + 1 }}</strong> - <strong>{{ Math.min(currentPage * pageSize, filteredStudents.length) }}</strong> of <strong>{{ filteredStudents.length }}</strong> candidates
            </div>

            <div class="flex items-center gap-2">
              <label class="text-xs text-slate-500">Per page:</label>
              <select v-model.number="pageSize" class="border border-slate-200 rounded px-2 py-1 bg-white text-xs">
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
                <option :value="500">All</option>
              </select>

              <div class="flex items-center gap-1 ml-3">
                <button
                  type="button"
                  class="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  :disabled="currentPage === 1"
                  @click="currentPage--"
                >
                  <i class="mdi mdi-chevron-left"></i>
                </button>
                <span class="px-2 font-medium">Page {{ currentPage }} of {{ totalPages }}</span>
                <button
                  type="button"
                  class="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
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
      <div class="batch-action-dock">
        <div class="dock-left">
          <NuxtLink to="/sub-center?tab=batches" class="btn-glass">
            <i class="mdi mdi-arrow-left"></i> Cancel &amp; Return
          </NuxtLink>
          <div class="hidden sm:block text-xs text-slate-600">
            Selected: <strong class="text-slate-900">{{ selectedStudentIds.length }}</strong> students
            • Cost: <strong class="text-emerald">{{ selectedStudentIds.length }} Token(s)</strong>
            • Wallet: <strong :class="isShortfall ? 'text-red' : 'text-slate-800'">{{ (wallet.totalRemaining ?? 0) - selectedStudentIds.length }} Remaining</strong>
          </div>
        </div>

        <div class="dock-right">
          <button
            type="button"
            class="btn-red flex items-center gap-2"
            :disabled="savingBatch || selectedStudentIds.length === 0 || !batchForm.exam_id || isShortfall"
            @click="submitCreateBatch"
          >
            <i :class="['mdi', savingBatch ? 'mdi-loading spin-icon' : 'mdi-check-decagram']"></i>
            <span>
              {{ savingBatch ? 'Creating Batch &amp; Enrolling...' : `Create Exam Batch (${selectedStudentIds.length} Students)` }}
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
    // Deselect filtered
    const filteredSet = new Set(filteredStudents.value.map(s => s.id));
    selectedStudentIds.value = selectedStudentIds.value.filter(id => !filteredSet.has(id));
  } else {
    // Select all filtered
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
  if (!dateStr) return 'N/A';
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
    // Auto-select if single authorized program
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
.gsfin-admin-page {
  background-color: #FAFAFD;
  min-height: 100vh;
  padding-bottom: 40px;
}

.admin-wrap {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px;
}

@media (max-width: 768px) {
  .admin-wrap {
    padding: 16px;
  }
}

/* ── Top Header & Breadcrumbs ── */
.admin-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── KPI Metric Cards ── */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
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
  border-radius: 18px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
}

.metric-card-emerald {
  background: linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 60%, #DCFCE7 100%);
  border: 1px solid rgba(16, 185, 129, 0.16);
}
.metric-card-blue {
  background: linear-gradient(135deg, #FFFFFF 0%, #F0F7FF 60%, #E1EFFF 100%);
  border: 1px solid rgba(37, 99, 235, 0.16);
}
.metric-card-indigo {
  background: linear-gradient(135deg, #FFFFFF 0%, #EEF2FF 60%, #E0E7FF 100%);
  border: 1px solid rgba(79, 70, 229, 0.16);
}
.metric-card-red {
  background: linear-gradient(135deg, #FFFFFF 0%, #FEF2F2 60%, #FEE2E2 100%);
  border: 1px solid rgba(227, 27, 35, 0.16);
}
.metric-card-slate {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.metric-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.45rem;
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

.metric-info {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748B;
}

.metric-value {
  font-size: 1.45rem;
  font-weight: 600;
  line-height: 1.25;
  margin-top: 2px;
}

.metric-sub {
  font-size: 0.72rem;
  margin-top: 2px;
}

/* ── Panel Card ── */
.panel-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
  overflow: hidden;
}

.panel-card-header {
  padding: 18px 24px;
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

.panel-title-wrap h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
}

.panel-subtitle-text {
  font-size: 0.78rem;
  color: #64748B;
  margin: 2px 0 0 0;
}

.panel-icon {
  font-size: 1.35rem;
  color: #E31B23;
}

.panel-filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* ── Badges & Chips ── */
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

/* ── Form Inputs ── */
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
  font-family: inherit;
  box-sizing: border-box;
  transition: all 0.15s;
}

.modal-input-field:focus {
  border-color: #E31B23;
  background: #FFFFFF;
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
}

.preset-pill {
  padding: 4px 12px;
  border-radius: 20px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  font-size: 0.74rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s;
}
.preset-pill:hover {
  background: #F1F5F9;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.2);
}

/* ── Filter Toolbar ── */
.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #94A3B8;
  font-size: 1.1rem;
}

.table-search-input {
  padding: 9px 36px 9px 40px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  font-size: 0.84rem;
  color: #0F172A;
  outline: none;
  transition: border-color 0.2s;
}
.table-search-input:focus {
  border-color: #E31B23;
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

.filter-mode-pills {
  display: inline-flex;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  padding: 2px;
}

.filter-pill-btn {
  padding: 6px 12px;
  font-size: 0.74rem;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #64748B;
  cursor: pointer;
  transition: all 0.15s;
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
  padding: 7px 12px;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  color: #334155;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
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

/* ── GSFIN Table Styling ── */
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
  padding: 14px 20px;
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
  padding: 14px 20px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
  font-size: 0.84rem;
  color: #334155;
  vertical-align: middle;
}

.gsfin-table tbody tr {
  transition: background-color 0.15s ease;
}

.gsfin-table tbody tr:hover {
  background: #F8FAFC;
}

.gsfin-table tbody tr.row-selected {
  background: rgba(16, 185, 129, 0.05);
}

.candidate-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.candidate-avatar-photo {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #10B981;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.candidate-avatar-circle {
  width: 36px;
  height: 36px;
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

.custom-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #E31B23;
  cursor: pointer;
}

/* ── Sticky Action Dock ── */
.batch-action-dock {
  position: sticky;
  bottom: 16px;
  z-index: 50;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 18px;
  padding: 14px 24px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 24px;
}

.dock-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-glass {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
  color: #334155;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 9px 16px;
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
  border-color: rgba(15, 23, 42, 0.2);
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
  box-shadow: 0 3px 10px rgba(227, 27, 35, 0.2);
  transition: all 0.2s ease;
  cursor: pointer;
  text-decoration: none;
}
.btn-red:hover:not(:disabled) {
  background: #C4131B;
  transform: translateY(-1px);
}
.btn-red:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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
</style>