<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ TOP BREADCRUMB & BACK NAVIGATION ═══ -->
      <div class="top-nav-bar mb-6">
        <div class="nav-left">
          <NuxtLink to="/sub-center?tab=batches" class="btn-back">
            <i class="mdi mdi-arrow-left"></i> Back to Batches
          </NuxtLink>
          <div class="breadcrumb-trail">
            <NuxtLink to="/sub-center" class="bc-link">Partner Portal</NuxtLink>
            <i class="mdi mdi-chevron-right bc-sep"></i>
            <NuxtLink to="/sub-center?tab=batches" class="bc-link">Exam Batches</NuxtLink>
            <i class="mdi mdi-chevron-right bc-sep"></i>
            <span class="bc-current">Create New Batch</span>
          </div>
        </div>

        <div class="nav-right">
          <button class="btn-icon-refresh" title="Refresh Roster &amp; Wallet" @click="refreshAll" :disabled="loadingData">
            <i :class="['mdi', 'mdi-refresh', { 'spin-icon': loadingData }]"></i>
          </button>
        </div>
      </div>

      <!-- ═══ PAGE HEADER & TITLE ═══ -->
      <div class="page-title-strip mb-6">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-red-50 text-red flex items-center justify-center text-2xl border border-red-100 flex-shrink-0">
            <i class="mdi mdi-layers-plus"></i>
          </div>
          <div>
            <h1 class="text-xl font-semibold text-slate-900 m-0">Create Examination Batch</h1>
            <p class="text-xs text-slate-500 mt-1 m-0">
              Configure examination details, schedule sitting window, and enroll up to 100+ candidates in bulk. 1 candidate consumes 1 token.
            </p>
          </div>
        </div>
      </div>

      <!-- ═══ REAL-TIME TOKEN WALLET KPI RIBBON ═══ -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- 1. Available Wallet Balance -->
        <div class="kpi-card">
          <div class="kpi-icon-box bg-emerald-50 text-emerald-600">
            <i class="mdi mdi-wallet-outline"></i>
          </div>
          <div>
            <span class="kpi-label">Available Wallet Tokens</span>
            <div class="kpi-val text-emerald-600">{{ wallet.totalRemaining ?? 0 }} Tokens</div>
            <span class="kpi-sub text-slate-400">Current Balance</span>
          </div>
        </div>

        <!-- 2. Selected Candidates -->
        <div class="kpi-card">
          <div class="kpi-icon-box bg-blue-50 text-blue-600">
            <i class="mdi mdi-account-multiple-check-outline"></i>
          </div>
          <div>
            <span class="kpi-label">Selected Candidates</span>
            <div class="kpi-val text-blue-600">{{ selectedStudentIds.length }} Candidates</div>
            <span class="kpi-sub text-slate-400">Total in this batch</span>
          </div>
        </div>

        <!-- 3. Token Deduction Cost -->
        <div class="kpi-card">
          <div class="kpi-icon-box bg-purple-50 text-purple-600">
            <i class="mdi mdi-ticket-confirmation-outline"></i>
          </div>
          <div>
            <span class="kpi-label">Required Batch Cost</span>
            <div class="kpi-val text-purple-600">{{ selectedStudentIds.length }} Token(s)</div>
            <span class="kpi-sub text-slate-400">1 Token per student</span>
          </div>
        </div>

        <!-- 4. Projected Balance -->
        <div class="kpi-card">
          <div :class="['kpi-icon-box', isShortfall ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700']">
            <i :class="['mdi', isShortfall ? 'mdi-alert-circle-outline' : 'mdi-wallet-travel']"></i>
          </div>
          <div>
            <span class="kpi-label">Balance After Batch</span>
            <div :class="['kpi-val', isShortfall ? 'text-red-600' : 'text-slate-800']">
              {{ (wallet.totalRemaining ?? 0) - selectedStudentIds.length }} Tokens
            </div>
            <span :class="['kpi-sub font-medium', isShortfall ? 'text-red-500' : 'text-slate-400']">
              {{ isShortfall ? `Shortfall of ${selectedStudentIds.length - (wallet.totalRemaining ?? 0)} tokens` : 'Sufficient Balance' }}
            </span>
          </div>
        </div>
      </div>

      <!-- ═══ TOKEN SHORTFALL WARNING ALERT ═══ -->
      <div v-if="isShortfall" class="p-4 bg-red-50 border border-red-200 rounded-xl mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-xl flex-shrink-0">
            <i class="mdi mdi-alert-circle"></i>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-red-900 m-0">Insufficient Wallet Token Balance</h4>
            <p class="text-xs text-red-700 m-0 mt-0.5">
              You selected <strong>{{ selectedStudentIds.length }}</strong> candidates, but only have <strong>{{ wallet.totalRemaining ?? 0 }}</strong> tokens remaining in your wallet.
              Shortfall: <strong>{{ selectedStudentIds.length - (wallet.totalRemaining ?? 0) }} token(s)</strong>.
            </p>
          </div>
        </div>
        <NuxtLink to="/sub-center?tab=wallet" class="btn-red text-xs py-2 px-4 inline-flex items-center gap-1.5 no-underline">
          <i class="mdi mdi-cart-plus"></i> Buy More Tokens
        </NuxtLink>
      </div>

      <!-- ═══ MAIN 2-SECTION WORKSPACE ═══ -->
      <div class="space-y-6">

        <!-- ─── SECTION 1: CERTIFICATION EXAM & SCHEDULE ─── -->
        <div class="panel-section-card">
          <div class="section-card-header">
            <div class="flex items-center gap-2.5">
              <span class="step-badge">1</span>
              <div>
                <h3 class="text-sm font-semibold text-slate-900 m-0">Certification Exam &amp; Schedule Window</h3>
                <p class="text-xs text-slate-500 m-0 mt-0.5">Choose the approved qualification exam and optional time limits</p>
              </div>
            </div>
            <span v-if="exams.length > 0" class="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/70">
              <i class="mdi mdi-check-decagram text-emerald-600 mr-1"></i>
              {{ exams.length }} Authorized Certification{{ exams.length > 1 ? 's' : '' }} Available
            </span>
          </div>

          <div class="section-card-body">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div class="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
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

        <!-- ─── SECTION 2: CANDIDATE STUDENTS MANAGEMENT (50-100+ ROSTER) ─── -->
        <div class="panel-section-card">
          <div class="section-card-header flex-wrap gap-3">
            <div class="flex items-center gap-2.5">
              <span class="step-badge">2</span>
              <div>
                <h3 class="text-sm font-semibold text-slate-900 m-0">
                  Select Students
                  <span class="text-red">*</span>
                </h3>
                <p class="text-xs text-slate-500 m-0 mt-0.5">
                  Select individual or multiple students to enroll. Click any student to toggle selection.
                </p>
              </div>
            </div>

            <!-- Selection Count Badges -->
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {{ selectedStudentIds.length }} Selected
              </span>
              <span class="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                {{ filteredStudents.length }} of {{ students.length }} Students
              </span>
            </div>
          </div>

          <!-- Filter & Bulk Actions Bar -->
          <div class="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <!-- Search Input -->
            <div class="search-box flex-1 max-w-md">
              <i class="mdi mdi-magnify search-icon"></i>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search students by name, email, phone..."
                class="search-input"
              />
              <button v-if="searchQuery" type="button" class="search-clear-btn" @click="searchQuery = ''">
                <i class="mdi mdi-close-circle"></i>
              </button>
            </div>

            <!-- Quick Filter Tabs (All / Selected / Unselected) -->
            <div class="flex items-center gap-2 flex-wrap">
              <div class="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                <button
                  type="button"
                  :class="['px-3 py-1 text-xs font-semibold rounded-md transition-all', filterMode === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900']"
                  @click="filterMode = 'all'"
                >
                  All ({{ students.length }})
                </button>
                <button
                  type="button"
                  :class="['px-3 py-1 text-xs font-semibold rounded-md transition-all', filterMode === 'selected' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900']"
                  @click="filterMode = 'selected'"
                >
                  Selected ({{ selectedStudentIds.length }})
                </button>
                <button
                  type="button"
                  :class="['px-3 py-1 text-xs font-semibold rounded-md transition-all', filterMode === 'unselected' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900']"
                  @click="filterMode = 'unselected'"
                >
                  Unselected ({{ students.length - selectedStudentIds.length }})
                </button>
              </div>

              <!-- Bulk Action Buttons -->
              <button
                type="button"
                class="btn-roster-action"
                @click="selectAllFiltered"
                :title="`Select all ${filteredStudents.length} filtered students`"
              >
                <i class="mdi mdi-check-all text-emerald-600"></i> Select All Filtered ({{ filteredStudents.length }})
              </button>
              <button
                type="button"
                class="btn-roster-action"
                @click="clearAllSelections"
                :disabled="selectedStudentIds.length === 0"
              >
                <i class="mdi mdi-close text-red-500"></i> Clear (0)
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
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white border border-emerald-200 text-slate-800 shadow-2xs"
                >
                  <span>{{ st.name }}</span>
                  <button type="button" class="text-slate-400 hover:text-red-500 cursor-pointer ml-0.5" @click.stop="toggleStudent(st.id)">
                    <i class="mdi mdi-close-circle text-xs"></i>
                  </button>
                </span>
                <span v-if="selectedStudentIds.length > 12" class="text-xs text-emerald-700 font-medium">
                  +{{ selectedStudentIds.length - 12 }} more
                </span>
              </div>
            </div>
            <button type="button" class="text-xs text-emerald-700 hover:underline font-semibold" @click="clearAllSelections">
              Deselect All
            </button>
          </div>

          <!-- ═══ STUDENTS TABLE ═══ -->
          <div class="overflow-x-auto">
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

            <table v-else class="candidates-table">
              <thead>
                <tr>
                  <th class="w-11 text-center">
                    <input
                      type="checkbox"
                      class="custom-checkbox"
                      :checked="isAllFilteredSelected"
                      :indeterminate.prop="isIndeterminate"
                      @click="toggleSelectAllFiltered"
                      title="Select or deselect all students on this view"
                    />
                  </th>
                  <th>Student Name</th>
                  <th>Contact Info</th>
                  <th>Education / Program</th>
                  <th>Registered</th>
                  <th class="text-right">Enrollment Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="student in paginatedStudents"
                  :key="student.id"
                  :class="['candidate-table-row', { 'row-selected': isSelected(student.id) }]"
                  @click="toggleStudent(student.id)"
                >
                  <!-- Checkbox -->
                  <td class="text-center" @click.stop>
                    <input
                      type="checkbox"
                      class="custom-checkbox"
                      :checked="isSelected(student.id)"
                      @change="toggleStudent(student.id)"
                    />
                  </td>

                  <!-- Candidate Name & Avatar -->
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
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
                    <span v-if="isSelected(student.id)" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <i class="mdi mdi-check"></i> Selected
                    </span>
                    <span v-else class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-slate-400 bg-slate-50">
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

      <!-- ═══ STICKY BOTTOM SUBMISSION BAR ═══ -->
      <div class="sticky-action-dock">
        <div class="dock-inner">
          <div class="dock-left">
            <NuxtLink to="/sub-center?tab=batches" class="btn-glass">
              Cancel &amp; Return
            </NuxtLink>
            <div class="hidden sm:block text-xs text-slate-600">
              Selected: <strong class="text-slate-900">{{ selectedStudentIds.length }}</strong> students
              • Cost: <strong class="text-emerald-700">{{ selectedStudentIds.length }} Token(s)</strong>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';

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
  background-color: #F8FAFC;
  min-height: 100vh;
  padding-bottom: 90px;
}

.admin-wrap {
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px 20px;
}

/* ── Top Nav ── */
.top-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 9px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  color: #334155;
  font-size: 0.825rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-back:hover {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
  color: #0f172a;
}

.breadcrumb-trail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.bc-link {
  color: #64748b;
  text-decoration: none;
  transition: color 0.15s;
}

.bc-link:hover {
  color: #dc2626;
}

.bc-sep {
  color: #cbd5e1;
}

.bc-current {
  color: #0f172a;
  font-weight: 600;
}

.btn-icon-refresh {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-icon-refresh:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* ── KPI Cards ── */
.kpi-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

.kpi-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.kpi-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  display: block;
}

.kpi-val {
  font-size: 1.15rem;
  font-weight: 600;
  font-family: inherit;
  line-height: 1.25;
  margin-top: 2px;
}

.kpi-sub {
  font-size: 0.72rem;
  display: block;
  margin-top: 2px;
}

/* ── Section Cards ── */
.panel-section-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
}

.section-card-header {
  padding: 18px 22px;
  background: #FAFAFD;
  border-bottom: 1px solid rgba(15, 23, 42, 0.07);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step-badge {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #E31B23;
  color: #FFFFFF;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-card-body {
  padding: 22px;
}

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
  border-radius: 10px;
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
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748B;
  pointer-events: none;
}

.preset-pill {
  padding: 3px 10px;
  border-radius: 20px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  font-size: 0.72rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s;
}

.preset-pill:hover {
  background: #F1F5F9;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.2);
}

/* ── Search & Bulk Actions ── */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #94A3B8;
  font-size: 1rem;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 34px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 8px;
  font-size: 0.82rem;
  color: #0F172A;
  outline: none;
}

.search-input:focus {
  border-color: #E31B23;
}

.search-clear-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
}

.btn-roster-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 8px;
  font-size: 0.76rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-roster-action:hover:not(:disabled) {
  background: #F1F5F9;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.2);
}

.btn-roster-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Candidates Table ── */
.candidates-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.candidates-table th {
  padding: 12px 16px;
  background: #F8FAFC;
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.candidate-table-row {
  cursor: pointer;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  transition: background-color 0.12s;
}

.candidate-table-row:hover {
  background-color: #F8FAFC;
}

.candidate-table-row.row-selected {
  background-color: #F0FDF4;
}

.candidates-table td {
  padding: 12px 16px;
  vertical-align: middle;
}

.custom-checkbox {
  width: 17px;
  height: 17px;
  accent-color: #E31B23;
  cursor: pointer;
}

/* ── Sticky Bottom Dock ── */
.sticky-action-dock {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  border-top: 1px solid rgba(15, 23, 42, 0.1);
  box-shadow: 0 -4px 16px rgba(15, 23, 42, 0.06);
  z-index: 100;
  padding: 12px 20px;
}

.dock-inner {
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.dock-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-glass {
  background: #F1F5F9;
  color: #334155;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 9px 18px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.86rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-glass:hover {
  background: #E2E8F0;
  color: #0F172A;
}

.btn-red {
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  padding: 10px 22px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 2px 6px rgba(227, 27, 35, 0.25);
}

.btn-red:hover:not(:disabled) {
  background: #C41E3A;
  box-shadow: 0 4px 12px rgba(227, 27, 35, 0.35);
}

.btn-red:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.spinner-sm-red {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(227, 27, 35, 0.2);
  border-top-color: #E31B23;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  display: inline-block;
}

.spin-icon {
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

