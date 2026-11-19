<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ HEADER ROW ═══ -->
      <div class="admin-header-row">
        <div>
          <div class="eyebrow-chip mb-1">
            <i class="mdi mdi-shield-check"></i>
            <span>EXAMINATION GOVERNANCE &amp; INTEGRITY</span>
          </div>
          <h1 class="admin-title">Proctoring Management</h1>
          <p class="admin-subtitle">
            Hierarchical proctoring audit: Branch / Partner Center &rarr; Exam Batch &rarr; Candidate Proctoring Details.
          </p>
        </div>
      </div>

      <!-- ═══ TOP KPI METRICS ═══ -->
      <div class="kpi-grid mb-6">
        <div class="kpi-card">
          <div class="kpi-icon-box bg-blue-light text-blue">
            <i class="mdi mdi-domain"></i>
          </div>
          <div>
            <div class="kpi-val">{{ stats.totalBranches || branches.length }}</div>
            <div class="kpi-lbl">Branches Monitored</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box bg-purple-light text-purple">
            <i class="mdi mdi-calendar-text"></i>
          </div>
          <div>
            <div class="kpi-val">{{ stats.totalBatches || totalBatchesCount }}</div>
            <div class="kpi-lbl">Exam Batches</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box bg-emerald-light text-emerald">
            <i class="mdi mdi-account-group"></i>
          </div>
          <div>
            <div class="kpi-val">{{ stats.totalCandidates || 0 }}</div>
            <div class="kpi-lbl">Candidates Monitored</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box bg-amber-light text-amber">
            <i class="mdi mdi-alert-circle"></i>
          </div>
          <div>
            <div class="kpi-val">{{ stats.totalViolations || 0 }}</div>
            <div class="kpi-lbl">Total Violations</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box bg-red-light text-red">
            <i class="mdi mdi-shield-alert"></i>
          </div>
          <div>
            <div class="kpi-val">{{ (stats.flaggedCount || 0) + (stats.pendingReviewCount || 0) }}</div>
            <div class="kpi-lbl">Audit Review Needed</div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- LEVEL 1: BRANCHES VIEW                                      -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <div v-if="currentLevel === 'branches'" class="panel-card">
        <div class="panel-card-header">
          <div class="panel-filter-row">
            <div class="search-input-wrap">
              <i class="mdi mdi-magnify search-icon"></i>
              <input
                v-model="branchSearch"
                type="text"
                placeholder="Search branches by name, city, jurisdiction..."
                class="table-search-input"
              />
            </div>

            <select v-model="branchStatusFilter" class="table-select-filter">
              <option value="All">All Statuses</option>
              <option value="active">Active</option>
              <option value="needs_review">Needs Audit Review</option>
            </select>
          </div>

          <span class="total-count-badge">Total: {{ filteredBranches.length }} Branches</span>
        </div>

        <!-- Level 1 Branches Cards List -->
        <div class="partner-cards-list">
          <div v-if="loading" class="panel-loading-state">
            <span class="spinner-sm-red"></span>
            <div class="mt-2 text-xs font-medium text-slate-500">Loading branch proctoring data...</div>
          </div>
          <div v-else-if="filteredBranches.length === 0" class="panel-empty-state">
            <i class="mdi mdi-domain-off text-4xl text-slate-400 block mb-2"></i>
            <div class="font-semibold text-slate-800">No Branches Found</div>
            <div class="text-xs text-slate-400 mt-1">No training center branches match your search criteria.</div>
          </div>
          <div
            v-for="branch in filteredBranches"
            :key="branch.id"
            class="partner-card"
          >
            <div class="partner-card-header">
              <!-- Left Identity -->
              <div class="partner-identity-left">
                <div class="partner-logo-avatar" :class="branch.id === 'branch-direct-portal' ? 'bg-indigo-light text-indigo' : 'bg-red-light text-red'">
                  <i :class="branch.id === 'branch-direct-portal' ? 'mdi mdi-earth' : 'mdi mdi-domain'"></i>
                </div>
                <div class="partner-identity-info">
                  <div class="partner-title-row">
                    <span
                      class="partner-name-link cursor-pointer"
                      @click="selectBranch(branch)"
                      title="Inspect Batches for this Branch"
                    >
                      {{ branch.name }}
                    </span>
                    <span
                      v-if="(branch.flagged_count || 0) > 0"
                      class="partner-status-tag tag-inactive"
                    >
                      <span class="pulse-dot bg-red"></span>
                      {{ branch.flagged_count }} Flagged
                    </span>
                    <span
                      v-else-if="(branch.pending_review_count || 0) > 0"
                      class="partner-status-tag tag-amber"
                    >
                      <span class="pulse-dot bg-amber"></span>
                      {{ branch.pending_review_count }} Review
                    </span>
                    <span
                      v-else
                      class="partner-status-tag tag-active"
                    >
                      <span class="pulse-dot"></span>
                      Clean Health
                    </span>
                    <span class="partner-type-tag">{{ branch.code }}</span>
                    <span class="partner-type-tag">{{ branch.type }}</span>
                  </div>

                  <div class="partner-meta-strip">
                    <span class="partner-meta-item">
                      <i class="mdi mdi-map-marker-outline"></i> {{ branch.city }}, {{ branch.country }}
                    </span>
                    <span v-if="(branch.high_severity_count || 0) > 0" class="partner-meta-item text-red font-semibold">
                      <i class="mdi mdi-alert-octagon"></i> {{ branch.high_severity_count }} High Risk Violations
                    </span>
                  </div>
                </div>
              </div>

              <!-- Right Stats & Actions -->
              <div class="partner-header-right">
                <div class="partner-stat-pill">
                  <div class="stat-cell">
                    <span class="stat-num text-indigo">{{ branch.total_batches || (branch.batches ? branch.batches.length : 0) }}</span>
                    <span class="stat-lbl">Batches</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-cell">
                    <span class="stat-num text-slate-800">{{ branch.total_candidates || 0 }}</span>
                    <span class="stat-lbl">Candidates</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-cell">
                    <span class="stat-num" :class="(branch.total_violations || 0) > 0 ? 'text-red' : 'text-emerald'">
                      {{ branch.total_violations || 0 }}
                    </span>
                    <span class="stat-lbl">Violations</span>
                  </div>
                </div>

                <button
                  type="button"
                  class="btn-view-batches"
                  @click="selectBranch(branch)"
                  title="View Exam Batches"
                >
                  <span>View Batches</span>
                  <i class="mdi mdi-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- LEVEL 2: EXAM BATCHES VIEW                                  -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <div v-else-if="currentLevel === 'batches' && selectedBranch" class="panel-card">
        <!-- Selected Branch Banner -->
        <div class="branch-scope-banner">
          <div class="flex items-center gap-3">
            <button class="btn-icon-back" title="Back to All Branches" @click="navigateToLevel('branches')">
              <i class="mdi mdi-arrow-left"></i>
            </button>
            <div>
              <div class="scope-eyebrow">SELECTED BRANCH / JURISDICTION</div>
              <h2 class="scope-title">{{ selectedBranch.name }}</h2>
              <div class="scope-meta">
                <span><i class="mdi mdi-map-marker-outline"></i> {{ selectedBranch.city }}, {{ selectedBranch.country }}</span>
                <span>&bull;</span>
                <span><i class="mdi mdi-tag-outline"></i> {{ selectedBranch.code }}</span>
                <span>&bull;</span>
                <span><i class="mdi mdi-email-outline"></i> {{ selectedBranch.contact_email || 'portal@gsfin.org' }}</span>
              </div>
            </div>
          </div>

          <div class="scope-stats-row">
            <div class="scope-stat-box">
              <span class="val">{{ selectedBranch.batches ? selectedBranch.batches.length : 0 }}</span>
              <span class="lbl">Batches</span>
            </div>
            <div class="scope-stat-box">
              <span class="val">{{ selectedBranch.total_candidates || 0 }}</span>
              <span class="lbl">Candidates</span>
            </div>
            <div class="scope-stat-box text-red">
              <span class="val">{{ selectedBranch.total_violations || 0 }}</span>
              <span class="lbl">Violations</span>
            </div>
          </div>
        </div>

        <div class="panel-card-header">
          <div class="panel-filter-row">
            <div class="search-input-wrap">
              <i class="mdi mdi-magnify search-icon"></i>
              <input
                v-model="batchSearch"
                type="text"
                placeholder="Search batches by code or exam name..."
                class="table-search-input"
              />
            </div>

            <select v-model="batchStatusFilter" class="table-select-filter">
              <option value="All">All Batches</option>
              <option value="open">Open / In-Progress</option>
              <option value="closed">Closed / Completed</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <span class="total-count-badge">Total: {{ filteredBatches.length }} Exam Batches</span>
        </div>

        <!-- Level 2 Batches Cards List -->
        <div class="partner-cards-list">
          <div v-if="filteredBatches.length === 0" class="panel-empty-state">
            <i class="mdi mdi-calendar-remove text-4xl text-slate-400 block mb-2"></i>
            <div class="font-semibold text-slate-800">No Batches Found for this Branch</div>
            <div class="text-xs text-slate-400 mt-1">This branch does not have any active or recorded exam batches matching the filter.</div>
          </div>
          <div
            v-for="batch in filteredBatches"
            :key="batch.id"
            class="partner-card"
          >
            <div class="partner-card-header">
              <!-- Left Identity -->
              <div class="partner-identity-left">
                <div class="partner-logo-avatar bg-purple-light text-purple">
                  <i class="mdi mdi-calendar-check"></i>
                </div>
                <div class="partner-identity-info">
                  <div class="partner-title-row">
                    <span
                      class="partner-name-link cursor-pointer"
                      @click="selectBatch(batch)"
                      title="Inspect Candidate Proctoring Logs for this Batch"
                    >
                      {{ batch.exam_name }}
                    </span>
                    <span
                      v-if="(batch.flagged_count || 0) > 0"
                      class="partner-status-tag tag-inactive"
                    >
                      <span class="pulse-dot bg-red"></span>
                      {{ batch.flagged_count }} Flagged
                    </span>
                    <span
                      v-else-if="(batch.pending_review_count || 0) > 0"
                      class="partner-status-tag tag-amber"
                    >
                      <span class="pulse-dot bg-amber"></span>
                      {{ batch.pending_review_count }} Review
                    </span>
                    <span
                      v-else
                      class="partner-status-tag tag-active"
                    >
                      <span class="pulse-dot"></span>
                      Clean
                    </span>
                    <span class="partner-type-tag font-mono">{{ batch.batch_code }}</span>
                  </div>

                  <div class="partner-meta-strip">
                    <span v-if="batch.created_at" class="partner-meta-item">
                      <i class="mdi mdi-calendar-blank"></i> Created: {{ formatDate(batch.created_at) }}
                    </span>
                    <span v-if="batch.opens_at" class="partner-meta-item">
                      <i class="mdi mdi-clock-outline"></i> Window: {{ formatDate(batch.opens_at) }} &rarr; {{ formatDate(batch.closes_at) }}
                    </span>
                    <span v-else class="partner-meta-item">
                      <i class="mdi mdi-infinity"></i> Continuous Session
                    </span>
                  </div>
                </div>
              </div>

              <!-- Right Stats & Actions -->
              <div class="partner-header-right">
                <div class="partner-stat-pill">
                  <div class="stat-cell">
                    <span class="stat-num text-slate-800">{{ batch.total_candidates || 0 }}</span>
                    <span class="stat-lbl">Enrolled</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-cell">
                    <span class="stat-num text-amber">{{ batch.pending_review_count || 0 }}</span>
                    <span class="stat-lbl">Review</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-cell">
                    <span class="stat-num" :class="(batch.flagged_count || 0) > 0 ? 'text-red' : 'text-emerald'">
                      {{ batch.flagged_count || 0 }}
                    </span>
                    <span class="stat-lbl">Flagged</span>
                  </div>
                </div>

                <button
                  type="button"
                  class="btn-view-batches"
                  @click="selectBatch(batch)"
                  title="Audit Proctoring Details"
                >
                  <span>Audit Logs</span>
                  <i class="mdi mdi-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- LEVEL 3: PROCTORING DETAILS (CANDIDATES & VIOLATIONS)       -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      <div v-else-if="currentLevel === 'details' && selectedBatch" class="panel-card">
        <!-- Selected Batch Banner -->
        <div class="batch-scope-banner">
          <div class="flex items-center gap-3">
            <button class="btn-icon-back" title="Back to Batches" @click="navigateToLevel('batches')">
              <i class="mdi mdi-arrow-left"></i>
            </button>
            <div>
              <div class="scope-eyebrow">SELECTED EXAM BATCH PROCTORING AUDIT</div>
              <h2 class="scope-title">{{ selectedBatch.batch_code }} &bull; {{ selectedBatch.exam_name }}</h2>
              <div class="scope-meta">
                <span><i class="mdi mdi-domain"></i> {{ selectedBatch.branch_name }}</span>
                <span>&bull;</span>
                <span><i class="mdi mdi-clock-outline"></i> Batch Status: <strong class="text-slate-900 capitalize">{{ selectedBatch.status || 'Active' }}</strong></span>
              </div>
            </div>
          </div>

          <div class="scope-stats-row">
            <div class="scope-stat-box">
              <span class="val">{{ batchCandidates.length }}</span>
              <span class="lbl">Candidates</span>
            </div>
            <div class="scope-stat-box text-emerald">
              <span class="val">{{ batchCandidates.filter(c => c.proctoring_status === 'approved').length }}</span>
              <span class="lbl">Approved</span>
            </div>
            <div class="scope-stat-box text-amber">
              <span class="val">{{ batchCandidates.filter(c => c.proctoring_status === 'pending_review').length }}</span>
              <span class="lbl">Pending</span>
            </div>
            <div class="scope-stat-box text-red">
              <span class="val">{{ batchCandidates.filter(c => c.proctoring_status === 'flagged').length }}</span>
              <span class="lbl">Flagged</span>
            </div>
          </div>
        </div>

        <div class="panel-card-header">
          <div class="panel-filter-row">
            <div class="search-input-wrap">
              <i class="mdi mdi-magnify search-icon"></i>
              <input
                v-model="candidateSearch"
                type="text"
                placeholder="Search candidates by name, email..."
                class="table-search-input"
              />
            </div>

            <select v-model="candidateStatusFilter" class="table-select-filter">
              <option value="All">All Verdicts</option>
              <option value="pending_review">Pending Review</option>
              <option value="flagged">Flagged</option>
              <option value="approved">Approved</option>
            </select>
          </div>

          <span class="total-count-badge">Total: {{ filteredCandidates.length }} Candidates in Batch</span>
        </div>

        <div class="table-responsive">
          <table class="gsfin-table">
            <thead>
              <tr>
                <th class="th-candidate">Candidate &amp; Biometric</th>
                <th class="th-result text-center">Exam Result</th>
                <th class="th-verdict text-center">Proctoring Verdict</th>
                <th class="th-violations">Violations Detected</th>
                <th class="th-attempt-time">Attempt Timestamps</th>
                <th class="th-actions th-audit-act text-center">Audit Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loadingCandidates">
                <td colspan="6" class="text-center py-12 text-slate-500">
                  <span class="spinner-sm-red"></span>
                  <div class="mt-2 text-xs font-medium text-slate-500">Loading candidates proctoring records...</div>
                </td>
              </tr>
              <tr v-else-if="filteredCandidates.length === 0">
                <td colspan="6" class="text-center py-16 text-slate-500">
                  <i class="mdi mdi-account-off text-3xl text-slate-400 block mb-2"></i>
                  <div class="font-semibold text-slate-800">No Candidate Records in this Batch</div>
                  <div class="text-xs text-slate-400 mt-1">No candidate attempts have been registered under this examination batch yet.</div>
                </td>
              </tr>
              <tr v-for="cand in filteredCandidates" :key="cand.attempt_id">
                <!-- Candidate Info & Biometric Selfie -->
                <td>
                  <div class="candidate-cell-flex">
                    <div class="candidate-avatar-wrap">
                      <img
                        v-if="cand.reference_selfie_url"
                        :src="getSelfieUrl(cand.reference_selfie_url)"
                        alt="Selfie"
                        class="candidate-selfie-img"
                      />
                      <div v-else class="candidate-avatar-fallback">
                        <i class="mdi mdi-account"></i>
                      </div>
                    </div>
                    <div>
                      <div class="candidate-name">{{ cand.candidate_name }}</div>
                      <div class="candidate-email">{{ cand.candidate_email }}</div>
                      <div class="candidate-id-tag">Attempt: {{ cand.attempt_id.slice(0, 8) }}</div>
                    </div>
                  </div>
                </td>

                <!-- Exam Result / Score -->
                <td class="text-center">
                  <span :class="['badge-chip', cand.result === 'pass' || cand.passed ? 'chip-green' : (cand.result === 'fail' ? 'chip-red' : 'chip-slate')]">
                    {{ cand.result === 'pass' || cand.passed ? 'Passed' : (cand.result === 'fail' ? 'Failed' : 'In Progress') }}
                  </span>
                  <div v-if="cand.score !== undefined && cand.score !== null" class="text-[11px] text-slate-500 mt-1 font-semibold">
                    Score: {{ cand.score }} / {{ cand.total_marks || 10 }}
                  </div>
                </td>

                <!-- Proctoring Verdict -->
                <td class="text-center">
                  <span :class="['badge-chip', cand.proctoring_status === 'approved' ? 'chip-green' : (cand.proctoring_status === 'flagged' ? 'chip-red' : 'chip-amber')]">
                    <i :class="['mdi mr-1', cand.proctoring_status === 'approved' ? 'mdi-check-decagram' : (cand.proctoring_status === 'flagged' ? 'mdi-flag' : 'mdi-clock')]"></i>
                    {{ formatVerdict(cand.proctoring_status) }}
                  </span>
                </td>

                <!-- Violations Detected -->
                <td>
                  <div v-if="(cand.violation_count || 0) > 0" class="violations-flex">
                    <span v-for="(vText, vIdx) in cand.violations_summary" :key="vIdx" class="violation-chip">
                      {{ formatViolation(vText) }}
                    </span>
                    <span v-if="cand.high_severity_count > 0" class="violation-chip high-risk">
                      <i class="mdi mdi-alert mr-0.5"></i> High Risk
                    </span>
                  </div>
                  <div v-else class="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <i class="mdi mdi-shield-check"></i> Zero Anomaly Flags
                  </div>
                </td>

                <!-- Attempt Timestamps -->
                <td>
                  <div class="text-xs text-slate-700">
                    <span class="font-medium text-slate-400">Started:</span> {{ formatDateTime(cand.started_at) }}
                  </div>
                  <div v-if="cand.submitted_at" class="text-xs text-slate-700 mt-0.5">
                    <span class="font-medium text-slate-400">Submitted:</span> {{ formatDateTime(cand.submitted_at) }}
                  </div>
                </td>

                <!-- Audit Action Button -->
                <td class="text-center">
                  <div class="actions-cell">
                    <NuxtLink
                      :to="`/dashboard/admin/public-exams/proctoring/${cand.attempt_id}`"
                      class="btn-table-action btn-view"
                      title="Inspect Video &amp; Biometric Evidence"
                    >
                      <i class="mdi mdi-eye-outline"></i> Audit
                    </NuxtLink>
                    <button
                      v-if="cand.proctoring_status !== 'approved'"
                      class="btn-table-action btn-success icon-only"
                      title="Approve &amp; Issue Certificate"
                      @click="approveCandidate(cand.attempt_id)"
                    >
                      <i class="mdi mdi-check"></i>
                    </button>
                    <button
                      v-if="cand.proctoring_status !== 'flagged'"
                      class="btn-table-action btn-danger icon-only"
                      title="Flag Attempt"
                      @click="flagCandidate(cand.attempt_id)"
                    >
                      <i class="mdi mdi-flag-outline"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { useRuntimeConfig } from '#imports';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'main_admin', 'sub_admin', 'lms_user']
});

const api = useApi();
const route = useRoute();
const router = useRouter();
const runtimeConfig = useRuntimeConfig();

// Hierarchy Level State: 'branches' | 'batches' | 'details'
const currentLevel = ref<'branches' | 'batches' | 'details'>('branches');

const loading = ref(true);
const loadingCandidates = ref(false);

const branches = ref<any[]>([]);
const stats = ref<any>({
  totalBranches: 0,
  totalBatches: 0,
  totalCandidates: 0,
  totalViolations: 0,
  highSeverityViolations: 0,
  flaggedCount: 0,
  pendingReviewCount: 0
});

// Selected Entities
const selectedBranch = ref<any>(null);
const selectedBatch = ref<any>(null);
const batchCandidates = ref<any[]>([]);

// Filters
const branchSearch = ref('');
const branchStatusFilter = ref('All');

const batchSearch = ref('');
const batchStatusFilter = ref('All');

const candidateSearch = ref('');
const candidateStatusFilter = ref('All');

// Toast
const toast = ref({ show: false, text: '', type: 'success' });
const showToast = (text: string, type: 'success' | 'error' = 'success') => {
  toast.value = { show: true, text, type };
  setTimeout(() => { toast.value.show = false; }, 3500);
};

// Total batches count computed
const totalBatchesCount = computed(() => {
  return branches.value.reduce((acc, b) => acc + (b.batches ? b.batches.length : 0), 0);
});

// Computed Filtered Branches
const filteredBranches = computed(() => {
  return branches.value.filter(b => {
    const q = branchSearch.value.toLowerCase();
    const matchesSearch = !q ||
      b.name.toLowerCase().includes(q) ||
      (b.city && b.city.toLowerCase().includes(q)) ||
      (b.country && b.country.toLowerCase().includes(q)) ||
      (b.code && b.code.toLowerCase().includes(q));

    const matchesStatus = branchStatusFilter.value === 'All' ||
      (branchStatusFilter.value === 'active' && b.status === 'active') ||
      (branchStatusFilter.value === 'needs_review' && ((b.flagged_count || 0) > 0 || (b.pending_review_count || 0) > 0));

    return matchesSearch && matchesStatus;
  });
});

// Computed Filtered Batches
const filteredBatches = computed(() => {
  if (!selectedBranch.value || !selectedBranch.value.batches) return [];
  return selectedBranch.value.batches.filter((batch: any) => {
    const q = batchSearch.value.toLowerCase();
    const matchesSearch = !q ||
      (batch.batch_code && batch.batch_code.toLowerCase().includes(q)) ||
      (batch.exam_name && batch.exam_name.toLowerCase().includes(q));

    const matchesStatus = batchStatusFilter.value === 'All' || batch.status === batchStatusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

// Computed Filtered Candidates
const filteredCandidates = computed(() => {
  return batchCandidates.value.filter(cand => {
    const q = candidateSearch.value.toLowerCase();
    const matchesSearch = !q ||
      cand.candidate_name.toLowerCase().includes(q) ||
      cand.candidate_email.toLowerCase().includes(q) ||
      cand.attempt_id.toLowerCase().includes(q);

    const matchesStatus = candidateStatusFilter.value === 'All' || cand.proctoring_status === candidateStatusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

// Navigation in Hierarchy
function navigateToLevel(level: 'branches' | 'batches' | 'details') {
  currentLevel.value = level;
  if (level === 'branches') {
    selectedBatch.value = null;
    router.replace({ path: '/dashboard/admin/public-exams/proctoring' });
  } else if (level === 'batches') {
    selectedBatch.value = null;
    if (selectedBranch.value) {
      router.replace({ path: '/dashboard/admin/public-exams/proctoring', query: { branchId: selectedBranch.value.id } });
    }
  }
}

function selectBranch(branch: any) {
  selectedBranch.value = branch;
  selectedBatch.value = null;
  currentLevel.value = 'batches';
  router.replace({ path: '/dashboard/admin/public-exams/proctoring', query: { branchId: branch.id } });
}

async function selectBatch(batch: any) {
  selectedBatch.value = batch;
  currentLevel.value = 'details';
  router.replace({
    path: '/dashboard/admin/public-exams/proctoring',
    query: { branchId: selectedBranch.value?.id, batchId: batch.id }
  });
  await fetchBatchCandidates(batch.id);
}

// Fetch Hierarchy from Backend
async function fetchHierarchy() {
  loading.value = true;
  try {
    const { data } = await api.get('/proctoring/admin/hierarchy');
    if (data) {
      branches.value = data.branches || [];
      stats.value = data.stats || stats.value;

      // Handle query params on refresh
      if (route.query.branchId) {
        const branchMatch = branches.value.find(b => String(b.id) === String(route.query.branchId));
        if (branchMatch) {
          selectedBranch.value = branchMatch;
          currentLevel.value = 'batches';

          if (route.query.batchId) {
            const batchMatch = (branchMatch.batches || []).find((bat: any) => String(bat.id) === String(route.query.batchId));
            if (batchMatch) {
              selectedBatch.value = batchMatch;
              currentLevel.value = 'details';
              await fetchBatchCandidates(batchMatch.id);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to load proctoring hierarchy', err);
    showToast('Failed to load proctoring hierarchy', 'error');
  } finally {
    loading.value = false;
  }
}

// Fetch Candidates for Selected Batch
async function fetchBatchCandidates(batchId: string) {
  loadingCandidates.value = true;
  try {
    const { data } = await api.get(`/proctoring/admin/batch/${batchId}/candidates`);
    if (data && data.candidates) {
      batchCandidates.value = data.candidates;
      if (data.batch && selectedBatch.value) {
        selectedBatch.value = { ...selectedBatch.value, ...data.batch };
      }
    } else {
      batchCandidates.value = [];
    }
  } catch (err) {
    console.error('Failed to load batch candidates', err);
    showToast('Failed to load candidate proctoring data', 'error');
  } finally {
    loadingCandidates.value = false;
  }
}

// Quick Actions
async function approveCandidate(attemptId: string) {
  try {
    await api.post(`/proctoring/admin/${attemptId}/approve-certificate`);
    showToast('Proctoring approved & certificate issued successfully!');
    if (selectedBatch.value) await fetchBatchCandidates(selectedBatch.value.id);
  } catch (err: any) {
    showToast(err.response?.data?.message || 'Approval failed', 'error');
  }
}

async function flagCandidate(attemptId: string) {
  const reason = prompt('Please enter flag rationale / suspicious activity summary:');
  if (!reason) return;
  try {
    await api.post(`/proctoring/admin/${attemptId}/flag-attempt`, { reason });
    showToast('Attempt flagged for governance audit.');
    if (selectedBatch.value) await fetchBatchCandidates(selectedBatch.value.id);
  } catch (err: any) {
    showToast(err.response?.data?.message || 'Flagging failed', 'error');
  }
}

// Utility Formatters
function formatDate(dateStr: string | null) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatVerdict(status: string) {
  if (status === 'approved') return 'Approved';
  if (status === 'flagged') return 'Flagged';
  if (status === 'pending_review') return 'Review Pending';
  return 'All Clean';
}

function formatViolation(raw: string) {
  return raw
    .replace(/_/g, ' ')
    .replace('multiple faces', 'Multiple Faces')
    .replace('face absent', 'Face Absent')
    .replace('mobile phone detected', 'Phone Detected')
    .replace('fullscreen exit', 'Fullscreen Exit')
    .replace('tab switch', 'Tab Switch')
    .replace('proxy mismatch', 'Face Mismatch');
}

function getSelfieUrl(pathStr: string) {
  if (!pathStr) return '';
  if (pathStr.startsWith('http')) return pathStr;
  const base = (runtimeConfig.public?.apiBase || '/api').replace('/api', '');
  return base + (pathStr.startsWith('/') ? pathStr : '/' + pathStr);
}

onMounted(() => {
  fetchHierarchy();
});
</script>

<style scoped>
.th-branch { min-width: 260px; }
.th-loc { min-width: 160px; }
.th-num { min-width: 130px; }
.th-health { min-width: 170px; }
.th-act { min-width: 130px; }
.th-batch { min-width: 250px; }
.th-exam-name { min-width: 220px; }
.th-sched { min-width: 170px; }
.th-status { min-width: 110px; }
.th-candidates { min-width: 120px; }
.th-proc-status { min-width: 150px; }
.th-batch-act { min-width: 150px; }
.th-candidate { min-width: 250px; }
.th-result { min-width: 140px; }
.th-verdict { min-width: 140px; }
.th-violations { min-width: 200px; }
.th-attempt-time { min-width: 150px; }
.th-audit-act { min-width: 130px; }

.gsfin-admin-page {
  padding: 24px 32px;
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
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.eyebrow-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  font-weight: 600;
  color: #E31B23;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.admin-title {
  font-size: 1.95rem;
  font-weight: 600;
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
  gap: 12px;
}

.btn-glass {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  color: #334155;
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-glass:hover:not(:disabled) {
  border-color: #E31B23;
  color: #E31B23;
  background: #FFF5F5;
}

/* KPI Cards Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}
@media (max-width: 1200px) {
  .kpi-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .kpi-grid { grid-template-columns: 1fr; }
}

.kpi-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 18px 20px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
}

.kpi-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.kpi-val {
  font-size: 1.45rem;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.2;
}

.kpi-lbl {
  font-size: 0.74rem;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 2px;
}

/* Panel Card */
.panel-card {
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
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
}

.panel-filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
}

.search-input-wrap {
  position: relative;
  min-width: 260px;
  flex: 1;
  max-width: 380px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  font-size: 1.1rem;
}

.table-search-input {
  width: 100%;
  height: 38px;
  padding: 8px 12px 8px 36px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FAFAFD;
  font-size: 0.84rem;
  color: #0F172A;
  box-sizing: border-box;
}
.table-search-input:focus {
  border-color: #E31B23;
  outline: none;
  background: #FFFFFF;
}

.table-select-filter {
  height: 38px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  font-size: 0.84rem;
  font-weight: 600;
  color: #0F172A;
  cursor: pointer;
}

.total-count-badge {
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748B;
  background: rgba(100, 116, 139, 0.08);
  padding: 4px 12px;
  border-radius: 20px;
  white-space: nowrap;
}

/* ═════ PROCTORING CARDS LIST STYLES ═════ */
.partner-cards-list {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.partner-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02);
  transition: all 0.2s ease;
  overflow: hidden;
}
.partner-card:hover {
  transform: translateY(-2px);
  border-color: rgba(227, 27, 35, 0.25);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}
.partner-card-header {
  padding: 20px 24px;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
}
.partner-identity-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 300px;
}
.partner-logo-avatar {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  flex-shrink: 0;
}
.partner-identity-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.partner-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.partner-name-link {
  font-size: 1.15rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  letter-spacing: -0.01em;
  text-decoration: none;
  transition: color 0.15s ease;
}
.partner-name-link:hover {
  color: #E31B23;
}
.partner-status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 50px;
  letter-spacing: 0.04em;
  border: none;
}
.tag-active {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}
.tag-inactive {
  background: rgba(239, 68, 68, 0.1);
  color: #DC2626;
}
.tag-amber {
  background: rgba(245, 158, 11, 0.1);
  color: #D97706;
}
.partner-type-tag {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748B;
  background: #F1F5F9;
  padding: 3px 10px;
  border-radius: 50px;
}
.partner-meta-strip {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: #64748B;
}
.partner-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  text-decoration: none;
}
.partner-meta-item i {
  color: #94A3B8;
  font-size: 0.95rem;
}
.partner-header-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.partner-stat-pill {
  display: flex;
  align-items: center;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  padding: 8px 16px;
  gap: 14px;
}
.stat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.15;
}
.stat-num {
  font-size: 1.05rem;
  font-weight: 600;
  color: #0F172A;
}
.stat-lbl {
  font-size: 0.68rem;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 2px;
}
.stat-divider {
  width: 1px;
  height: 24px;
  background: rgba(15, 23, 42, 0.1);
}
.btn-view-batches {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  background: #E31B23;
  color: #FFFFFF;
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(227, 27, 35, 0.2);
  white-space: nowrap;
  border: none;
  cursor: pointer;
}
.btn-view-batches:hover {
  background: #C41219;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(227, 27, 35, 0.28);
}
.btn-view-batches i {
  font-size: 0.95rem;
  transition: transform 0.15s ease;
}
.btn-view-batches:hover i {
  transform: translateX(3px);
}
.panel-loading-state, .panel-empty-state {
  padding: 48px;
  text-align: center;
  color: #64748B;
}
.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10B981;
}
.bg-red { background: #DC2626 !important; }
.bg-amber { background: #D97706 !important; }

/* Scope Banners */
.branch-scope-banner,
.batch-scope-banner {
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
  padding: 20px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.btn-icon-back {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.1);
  color: #0F172A;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-icon-back:hover {
  background: #E31B23;
  color: #FFFFFF;
  border-color: #E31B23;
}

.scope-eyebrow {
  font-size: 0.68rem;
  font-weight: 600;
  color: #E31B23;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.scope-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0F172A;
  margin: 2px 0 4px 0;
}

.scope-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: #64748B;
  flex-wrap: wrap;
}

.scope-stats-row {
  display: flex;
  gap: 14px;
}

.scope-stat-box {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.scope-stat-box .val {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0F172A;
}
.scope-stat-box .lbl {
  font-size: 0.68rem;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
}

/* Table Architecture */
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
  background: #F8FAFC;
  padding: 14px 20px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.gsfin-table td {
  padding: 16px 20px;
  font-size: 0.88rem;
  color: #334155;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  vertical-align: middle;
}

.clickable-row {
  cursor: pointer;
  transition: background 0.15s ease;
}
.clickable-row:hover {
  background: #F8FAFD;
}

/* Branch Cell */
.branch-cell-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.branch-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.branch-title {
  font-size: 0.92rem;
  font-weight: 600;
  color: #0F172A;
}

.branch-sub {
  font-size: 0.74rem;
  color: #64748B;
  margin-top: 2px;
}

/* Batch Cell */
.batch-icon-badge {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #F1F5F9;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
}

.batch-code-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.86rem;
  font-weight: 600;
  color: #0F172A;
}

.batch-sub-text {
  font-size: 0.72rem;
  color: #64748B;
}

/* Candidate Cell */
.candidate-cell-flex {
  display: flex;
  align-items: center;
  gap: 12px;
}

.candidate-avatar-wrap {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  overflow: hidden;
  background: #F1F5F9;
  flex-shrink: 0;
}

.candidate-selfie-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.candidate-avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748B;
  font-size: 1.25rem;
}

.candidate-name {
  font-size: 0.90rem;
  font-weight: 600;
  color: #0F172A;
}

.candidate-email {
  font-size: 0.74rem;
  color: #64748B;
}

.candidate-id-tag {
  font-family: monospace;
  font-size: 0.68rem;
  color: #94A3B8;
}

/* Badges & Chips */
.badge-count-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 50px;
  font-size: 0.74rem;
  font-weight: 600;
  background: #F1F5F9;
  color: #334155;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.badge-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.chip-green { background: rgba(16, 185, 129, 0.1); color: #059669; }
.chip-slate { background: rgba(100, 116, 139, 0.1); color: #64748B; }
.chip-amber { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.chip-red { background: rgba(227, 27, 35, 0.1); color: #E31B23; }

.violations-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.violation-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.70rem;
  font-weight: 600;
  background: rgba(245, 158, 11, 0.08);
  color: #B45309;
  border: 1px solid rgba(245, 158, 11, 0.2);
}
.violation-chip.high-risk {
  background: rgba(227, 27, 35, 0.08);
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.25);
}

.btn-action-drill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  background: #F1F5F9;
  color: #0F172A;
  border: 1px solid rgba(15, 23, 42, 0.08);
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-action-drill:hover {
  background: #E31B23;
  color: #FFFFFF;
  border-color: #E31B23;
}

.actions-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-table-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.76rem;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s ease;
}
.btn-table-action.icon-only {
  width: 30px;
  height: 30px;
  padding: 0;
  justify-content: center;
}
.btn-table-action.btn-view {
  background: #F1F5F9;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.08);
}
.btn-table-action.btn-view:hover {
  background: #0F172A;
  color: #FFFFFF;
}
.btn-table-action.btn-success {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border-color: rgba(16, 185, 129, 0.2);
}
.btn-table-action.btn-success:hover {
  background: #059669;
  color: #FFFFFF;
}
.btn-table-action.btn-danger {
  background: rgba(227, 27, 35, 0.1);
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.2);
}
.btn-table-action.btn-danger:hover {
  background: #E31B23;
  color: #FFFFFF;
}

/* Color Presets */
.bg-blue-light { background: rgba(59, 130, 246, 0.1); }
.text-blue { color: #2563EB; }
.bg-purple-light { background: rgba(147, 51, 234, 0.1); }
.text-purple { color: #9333EA; }
.bg-emerald-light { background: rgba(16, 185, 129, 0.1); }
.text-emerald { color: #059669; }
.bg-amber-light { background: rgba(245, 158, 11, 0.1); }
.text-amber { color: #D97706; }
.bg-red-light { background: rgba(227, 27, 35, 0.1); }
.text-red { color: #E31B23; }
.bg-indigo-light { background: rgba(99, 102, 241, 0.1); }
.text-indigo { color: #4F46E5; }

.spinner-sm-red {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(227, 27, 35, 0.2);
  border-top-color: #E31B23;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Toast */
.toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 12px;
  background: #0F172A;
  color: #FFFFFF;
  font-size: 0.86rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  z-index: 9999;
}
.toast-notification.success i { color: #10B981; }
.toast-notification.error i { color: #EF4444; }
</style>
