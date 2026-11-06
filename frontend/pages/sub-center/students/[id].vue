<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ TOP BREADCRUMB & BACK NAVIGATION ═══ -->
      <div class="top-nav-bar">
        <div class="nav-left">
          <NuxtLink to="/sub-center?tab=students" class="btn-back">
            <i class="mdi mdi-arrow-left"></i> Back to Candidate Directory
          </NuxtLink>
          <div class="breadcrumb-trail">
            <NuxtLink to="/sub-center" class="bc-link">Partner Portal</NuxtLink>
            <i class="mdi mdi-chevron-right bc-sep"></i>
            <NuxtLink to="/sub-center?tab=students" class="bc-link">Candidate Directory</NuxtLink>
            <i class="mdi mdi-chevron-right bc-sep"></i>
            <span class="bc-current">{{ student?.name || 'Candidate Details' }}</span>
          </div>
        </div>

        <div class="nav-right">
          <button class="btn-icon-refresh" title="Refresh Candidate Data" @click="fetchStudentDetails" :disabled="loading">
            <i :class="['mdi', 'mdi-refresh', { 'spin-icon': loading }]"></i>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="state-card text-center py-16">
        <span class="spinner-lg-red"></span>
        <p class="mt-4 text-slate-600 font-semibold text-sm">Loading Candidate Profile &amp; Records...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="state-card text-center py-16">
        <div class="error-icon-box">
          <i class="mdi mdi-alert-circle-outline"></i>
        </div>
        <h3 class="text-lg font-semibold text-slate-900 mb-2">Unable to Load Candidate</h3>
        <p class="text-slate-500 mb-6 max-w-md mx-auto text-xs">{{ error }}</p>
        <NuxtLink to="/sub-center?tab=students" class="btn-red-lg">
          <i class="mdi mdi-arrow-left"></i> Return to Directory
        </NuxtLink>
      </div>

      <!-- Candidate Main Content -->
      <div v-else-if="student" class="space-y-6 fade-in">

        <!-- ═══ 1. HERO PROFILE CARD ═══ -->
        <div class="hero-card">
          <div class="hero-left">
            <div class="student-avatar-box">
              <i class="mdi mdi-account-circle-outline"></i>
            </div>
            <div class="student-meta">
              <div class="hero-title-row">
                <h1 class="student-name">{{ student.name }}</h1>
                <span :class="['status-badge', passedCount > 0 ? 'badge-certified' : 'badge-active']">
                  <i :class="['mdi', passedCount > 0 ? 'mdi-shield-check' : 'mdi-account-check']"></i>
                  {{ passedCount > 0 ? 'Certified Candidate' : 'Registered Candidate' }}
                </span>
              </div>
              <div class="meta-tags-row">
                <span class="meta-pill font-mono"><i class="mdi mdi-email-outline"></i> {{ student.email }}</span>
                <span v-if="student.phone" class="meta-pill"><i class="mdi mdi-phone-outline"></i> {{ student.phone }}</span>
                <span v-if="student.education_level" class="meta-pill badge-education">
                  <i class="mdi mdi-school-outline"></i> {{ student.education_level }}
                </span>
                <span class="meta-pill text-slate-400">
                  <i class="mdi mdi-calendar-clock-outline"></i> Joined {{ formatDate(student.created_at) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="hero-actions">
            <button class="btn-action btn-action-secondary" @click="openEditModal">
              <i class="mdi mdi-pencil-outline"></i> Edit Profile
            </button>
            <button class="btn-action btn-action-red" @click="enrollInBatch">
              <i class="mdi mdi-plus-circle-outline"></i> Enroll in Batch
            </button>
          </div>
        </div>

        <!-- ═══ 2. METRIC STATS SUMMARY ═══ -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon bg-indigo-light">
              <i class="mdi mdi-book-open-page-variant-outline text-indigo"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Enrolled Exams</span>
              <span class="kpi-value">{{ assignments.length }}</span>
              <span class="kpi-sub text-slate-500">Total sessions assigned</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon bg-green-light">
              <i class="mdi mdi-check-decagram-outline text-emerald-600"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Passed / Certified</span>
              <span class="kpi-value text-emerald-600">{{ passedCount }}</span>
              <span class="kpi-sub text-emerald-600">
                {{ assignments.length > 0 ? Math.round((passedCount / assignments.length) * 100) : 0 }}% completion rate
              </span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon bg-red-light">
              <i class="mdi mdi-certificate text-red"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Certificates Issued</span>
              <span class="kpi-value text-red">{{ certificates.length }}</span>
              <span class="kpi-sub text-slate-500">Official qualifications</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon bg-amber-light">
              <i class="mdi mdi-progress-clock text-amber"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Pending / Active</span>
              <span class="kpi-value text-amber">{{ inProgressCount }}</span>
              <span class="kpi-sub text-slate-500">In progress or queued</span>
            </div>
          </div>
        </div>

        <!-- ═══ 3. TABS CONTAINER ═══ -->
        <div class="tabs-container">
          <div class="tabs-header">
            <button
              :class="['tab-btn', { active: activeTab === 'exams' }]"
              @click="activeTab = 'exams'"
            >
              <i class="mdi mdi-book-open-outline tab-icon"></i>
              <span>Exam Sessions &amp; Enrollments</span>
              <span class="tab-badge">{{ assignments.length }}</span>
            </button>

            <button
              :class="['tab-btn', { active: activeTab === 'results' }]"
              @click="activeTab = 'results'"
            >
              <i class="mdi mdi-chart-box-outline tab-icon"></i>
              <span>Results &amp; Attempts</span>
              <span class="tab-badge">{{ totalAttemptsCount }}</span>
            </button>

            <button
              :class="['tab-btn', { active: activeTab === 'certificates' }]"
              @click="activeTab = 'certificates'"
            >
              <i class="mdi mdi-certificate-outline tab-icon"></i>
              <span>Certificates</span>
              <span class="tab-badge">{{ certificates.length }}</span>
            </button>

            <button
              :class="['tab-btn', { active: activeTab === 'profile' }]"
              @click="activeTab = 'profile'"
            >
              <i class="mdi mdi-card-account-details-outline tab-icon"></i>
              <span>Candidate Profile</span>
            </button>
          </div>

          <!-- TAB 1: EXAM SESSIONS -->
          <div v-if="activeTab === 'exams'" class="tab-content">
            <div v-if="assignments.length === 0" class="empty-state-box">
              <i class="mdi mdi-book-open-outline text-4xl text-slate-300 block mb-2"></i>
              <h4 class="text-sm font-semibold text-slate-900">No Exam Sessions Assigned</h4>
              <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                This candidate is not currently enrolled in any exam batches under your sub-center.
              </p>
              <button class="btn-red text-xs py-2 px-4" @click="enrollInBatch">
                <i class="mdi mdi-plus"></i> Enroll Candidate in Exam
              </button>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="item in assignments"
                :key="item.assignment_id"
                class="session-card"
              >
                <div class="session-card-header">
                  <div class="flex items-center gap-3">
                    <div class="session-icon-box">
                      <i class="mdi mdi-file-document-edit-outline"></i>
                    </div>
                    <div>
                      <h4 class="session-title">{{ item.exam_name }}</h4>
                      <div class="session-sub">
                        <span>Batch ID: <code class="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">{{ item.batch_id }}</code></span>
                        <span class="mx-1">&bull;</span>
                        <span>Assigned: {{ formatDate(item.created_at) }}</span>
                        <span v-if="item.duration_minutes" class="mx-1">&bull;</span>
                        <span v-if="item.duration_minutes">{{ item.duration_minutes }} Mins Duration</span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <span
                      :class="[
                        'badge-chip',
                        item.status === 'passed' ? 'chip-green' :
                        item.status === 'failed' ? 'chip-red' :
                        item.status === 'in_progress' ? 'chip-amber' :
                        'chip-slate'
                      ]"
                    >
                      {{ item.status.toUpperCase() }}
                    </span>
                    <span v-if="item.is_retry_link" class="badge-chip chip-amber">
                      Dedicated Link
                    </span>
                  </div>
                </div>

                <div class="session-card-body">
                  <div class="session-stat-item">
                    <span class="stat-label">Attempts Used</span>
                    <span class="stat-value">{{ item.attempts_used }} / {{ item.max_attempts }}</span>
                  </div>

                  <div class="session-stat-item">
                    <span class="stat-label">Passing Standard</span>
                    <span class="stat-value">{{ item.passing_score || 70 }}%</span>
                  </div>

                  <div class="session-stat-item">
                    <span class="stat-label">Batch Window</span>
                    <span class="stat-value text-xs font-normal text-slate-600">
                      {{ item.batch_opens_at ? formatDate(item.batch_opens_at) : 'Open' }} &ndash;
                      {{ item.batch_closes_at ? formatDate(item.batch_closes_at) : 'No deadline' }}
                    </span>
                  </div>

                  <div class="session-stat-actions">
                    <a
                      v-if="['not_started', 'in_progress'].includes(item.status)"
                      :href="'/exam/take-' + (item.assignment_id || item.id)"
                      target="_blank"
                      class="btn-action-sm btn-action-primary"
                      title="Open Candidate Exam Sitting"
                    >
                      <i class="mdi mdi-play-circle mr-1"></i> Take Exam
                    </a>

                    <button
                      v-if="['not_started', 'in_progress'].includes(item.status)"
                      class="btn-action-sm btn-action-secondary"
                      title="Copy Exam Sitting Link"
                      @click="copyExamLink(item)"
                    >
                      <i class="mdi mdi-content-copy mr-1"></i> Copy Link
                    </button>

                    <a
                      v-if="item.status === 'passed' && item.certificate_url"
                      :href="item.certificate_url"
                      target="_blank"
                      class="btn-action-sm btn-action-success"
                      title="Download Certificate"
                    >
                      <i class="mdi mdi-certificate mr-1"></i> View Certificate
                    </a>

                    <button
                      v-if="item.status === 'failed' && item.attempts_used >= item.max_attempts"
                      class="btn-action-sm btn-action-secondary"
                      @click="createDedicatedRetry(item)"
                    >
                      <i class="mdi mdi-link-plus mr-1"></i> Grant Dedicated Retry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: RESULTS & ATTEMPTS -->
          <div v-if="activeTab === 'results'" class="tab-content">
            <div v-if="allAttempts.length === 0" class="empty-state-box">
              <i class="mdi mdi-chart-box-outline text-4xl text-slate-300 block mb-2"></i>
              <h4 class="text-sm font-semibold text-slate-900">No Exam Attempts Recorded</h4>
              <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                The candidate has not launched or submitted an attempt for any assigned exams yet.
              </p>
            </div>

            <div v-else class="table-responsive">
              <table class="gsfin-native-table">
                <thead>
                  <tr>
                    <th>Exam Qualification</th>
                    <th>Started At</th>
                    <th>Completed At</th>
                    <th>Score / Result</th>
                    <th>Proctoring Status</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="att in allAttempts" :key="att.id">
                    <td>
                      <div class="font-semibold text-slate-900 text-xs">{{ att.exam_name }}</div>
                      <div class="text-[11px] text-slate-400 font-mono">ID: {{ att.id.substring(0, 8) }}...</div>
                    </td>
                    <td class="text-xs text-slate-600">{{ formatDate(att.started_at) }}</td>
                    <td class="text-xs text-slate-600">{{ att.ended_at ? formatDate(att.ended_at) : 'In progress' }}</td>
                    <td>
                      <div v-if="att.parsedResult" class="font-semibold text-xs">
                        <span :class="att.parsedResult.passed ? 'text-emerald-600' : 'text-red-600'">
                          {{ att.parsedResult.score !== undefined ? att.parsedResult.score + '%' : (att.parsedResult.passed ? 'PASSED' : 'FAILED') }}
                        </span>
                      </div>
                      <span v-else class="text-xs text-slate-400 italic">No score</span>
                    </td>
                    <td>
                      <span
                        :class="[
                          'badge-chip text-[11px]',
                          att.proctoring_status === 'passed' ? 'chip-green' :
                          att.proctoring_status === 'flagged' ? 'chip-red' :
                          'chip-slate'
                        ]"
                      >
                        {{ att.proctoring_status ? att.proctoring_status.toUpperCase() : 'STANDARD' }}
                      </span>
                    </td>
                    <td>
                      <span
                        :class="[
                          'badge-chip',
                          att.end_reason === 'passed' || (att.parsedResult && att.parsedResult.passed) ? 'chip-green' :
                          att.end_reason === 'failed' || (att.parsedResult && !att.parsedResult.passed) ? 'chip-red' :
                          'chip-slate'
                        ]"
                      >
                        {{ (att.end_reason || (att.parsedResult?.passed ? 'PASSED' : 'COMPLETED')).toUpperCase() }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB 3: CERTIFICATES -->
          <div v-if="activeTab === 'certificates'" class="tab-content">
            <div v-if="certificates.length === 0" class="empty-state-box">
              <i class="mdi mdi-certificate-outline text-4xl text-slate-300 block mb-2"></i>
              <h4 class="text-sm font-semibold text-slate-900">No Certificates Earned Yet</h4>
              <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Certificates are generated and verified automatically once the candidate passes an assigned certification exam.
              </p>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="cert in certificates"
                :key="cert.id || cert.cert_number"
                class="cert-item-card"
              >
                <div class="cert-header">
                  <div class="cert-seal">
                    <i class="mdi mdi-seal"></i>
                  </div>
                  <div>
                    <span class="cert-tag">Verified Certificate</span>
                    <h4 class="cert-exam-title">{{ cert.exam_name }}</h4>
                  </div>
                </div>

                <div class="cert-details">
                  <div class="cert-detail-row">
                    <span class="cert-detail-label">Certificate No:</span>
                    <span class="cert-detail-value font-mono">{{ cert.cert_number || 'PENDING' }}</span>
                  </div>
                  <div class="cert-detail-row">
                    <span class="cert-detail-label">Date Issued:</span>
                    <span class="cert-detail-value">{{ formatDate(cert.issued_at) }}</span>
                  </div>
                  <div class="cert-detail-row">
                    <span class="cert-detail-label">Status:</span>
                    <span class="badge-chip chip-green">{{ (cert.status || 'ACTIVE').toUpperCase() }}</span>
                  </div>
                </div>

                <div class="cert-footer">
                  <a
                    v-if="cert.pdf_url"
                    :href="cert.pdf_url"
                    target="_blank"
                    class="btn-action-sm btn-action-red"
                  >
                    <i class="mdi mdi-download mr-1"></i> Download PDF
                  </a>
                  <a
                    :href="'/verify/' + (cert.cert_number || cert.id)"
                    target="_blank"
                    class="btn-action-sm btn-action-secondary"
                  >
                    <i class="mdi mdi-shield-check mr-1"></i> Verify Authenticity
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 4: CANDIDATE PROFILE INFO -->
          <div v-if="activeTab === 'profile'" class="tab-content">
            <div class="profile-details-grid">
              <div class="info-group">
                <span class="info-group-label">Candidate Full Name</span>
                <span class="info-group-value">{{ student.name }}</span>
              </div>
              <div class="info-group">
                <span class="info-group-label">Email Address</span>
                <span class="info-group-value font-mono">{{ student.email }}</span>
              </div>
              <div class="info-group">
                <span class="info-group-label">Phone Number</span>
                <span class="info-group-value">{{ student.phone || 'Not provided' }}</span>
              </div>
              <div class="info-group">
                <span class="info-group-label">Education Level</span>
                <span class="info-group-value">{{ student.education_level || 'Not provided' }}</span>
              </div>
              <div class="info-group">
                <span class="info-group-label">Gender</span>
                <span class="info-group-value">{{ student.gender || 'Not specified' }}</span>
              </div>
              <div class="info-group">
                <span class="info-group-label">Date of Birth</span>
                <span class="info-group-value">{{ student.dob ? formatDate(student.dob) : 'Not specified' }}</span>
              </div>
              <div class="info-group">
                <span class="info-group-label">Registration Date</span>
                <span class="info-group-value">{{ formatDate(student.created_at) }}</span>
              </div>
              <div class="info-group">
                <span class="info-group-label">Center Organization ID</span>
                <span class="info-group-value font-mono text-xs">{{ student.org_id }}</span>
              </div>
            </div>

            <div class="mt-6 flex justify-end">
              <button class="btn-action btn-action-secondary" @click="openEditModal">
                <i class="mdi mdi-pencil mr-1"></i> Edit Candidate Details
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- ═══ EDIT CANDIDATE MODAL ═══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
          <div class="modal-card" style="max-width: 580px;">
            <div class="modal-header">
              <div class="flex items-center gap-3">
                <div class="icon-box-lg bg-red-light text-red">
                  <i class="mdi mdi-account-edit"></i>
                </div>
                <div>
                  <h3 class="modal-title">Edit Candidate Student</h3>
                  <span class="text-xs text-slate-500 font-medium">Update candidate information and credentials</span>
                </div>
              </div>
              <button class="modal-close-btn" @click="showEditModal = false"><i class="mdi mdi-close"></i></button>
            </div>

            <form @submit.prevent="updateCandidate">
              <div class="modal-body" style="overflow-y: auto; max-height: calc(88vh - 140px); padding-bottom: 24px;">
                <div class="form-row-2 mb-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                  <div class="form-group mb-0">
                    <label class="form-label-xs">Full Name <span class="required-star">*</span></label>
                    <div class="input-with-icon">
                      <i class="mdi mdi-account-outline input-prefix-icon"></i>
                      <input v-model="editForm.name" type="text" class="modal-input-field input-has-prefix" placeholder="Full Name" required />
                    </div>
                  </div>
                  <div class="form-group mb-0">
                    <label class="form-label-xs">Phone Number</label>
                    <div class="input-with-icon">
                      <i class="mdi mdi-phone-outline input-prefix-icon"></i>
                      <input v-model="editForm.phone" type="text" class="modal-input-field input-has-prefix" placeholder="Phone Number" />
                    </div>
                  </div>
                </div>

                <div class="form-group mb-4">
                  <label class="form-label-xs">Email Address <span class="required-star">*</span></label>
                  <div class="input-with-icon">
                    <i class="mdi mdi-email-outline input-prefix-icon"></i>
                    <input v-model="editForm.email" type="email" class="modal-input-field input-has-prefix" placeholder="Email Address" required />
                  </div>
                </div>

                <div class="form-row-2 mb-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                  <div class="form-group mb-0">
                    <label class="form-label-xs">New Password (Optional)</label>
                    <div class="input-with-icon">
                      <i class="mdi mdi-lock-outline input-prefix-icon"></i>
                      <input
                        v-model="editForm.password"
                        :type="showPassword ? 'text' : 'password'"
                        class="modal-input-field input-has-prefix has-suffix"
                        placeholder="Leave blank to keep existing"
                      />
                      <button type="button" class="input-suffix-btn" @click="showPassword = !showPassword">
                        <i :class="['mdi', showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline']"></i>
                      </button>
                    </div>
                  </div>
                  <div class="form-group mb-0">
                    <label class="form-label-xs">Confirm New Password</label>
                    <div class="input-with-icon">
                      <i class="mdi mdi-lock-check-outline input-prefix-icon"></i>
                      <input
                        v-model="editForm.confirm_password"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        class="modal-input-field input-has-prefix has-suffix"
                        placeholder="Confirm new password"
                      />
                      <button type="button" class="input-suffix-btn" @click="showConfirmPassword = !showConfirmPassword">
                        <i :class="['mdi', showConfirmPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline']"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="form-group mb-4">
                  <label class="form-label-xs">Education Level</label>
                  <div class="custom-select-wrapper">
                    <select v-model="editForm.education_level" class="modal-input-field modal-select">
                      <option value="" disabled>Choose Education Level...</option>
                      <option v-for="lvl in educationLevels" :key="lvl" :value="lvl">{{ lvl }}</option>
                    </select>
                    <i class="mdi mdi-chevron-down select-chevron"></i>
                  </div>
                </div>

                <div class="form-row-2 mb-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                  <div class="form-group mb-0">
                    <label class="form-label-xs">Gender</label>
                    <div class="custom-select-wrapper">
                      <select v-model="editForm.gender" class="modal-input-field modal-select">
                        <option value="" disabled>Select Gender...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                      <i class="mdi mdi-chevron-down select-chevron"></i>
                    </div>
                  </div>
                  <div class="form-group mb-0">
                    <label class="form-label-xs">Date of Birth</label>
                    <input v-model="editForm.dob" type="date" class="modal-input-field" />
                  </div>
                </div>
              </div>

              <div class="modal-footer flex items-center justify-between">
                <button type="button" class="btn-glass" @click="showEditModal = false">Cancel</button>
                <button type="submit" class="btn-red" :disabled="savingEdit || !editForm.name || !editForm.email">
                  <i :class="['mdi', savingEdit ? 'mdi-loading spin-icon' : 'mdi-content-save-check']"></i>
                  {{ savingEdit ? 'Saving...' : 'Update Candidate' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNuxtApp } from '#app';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'sub_center_staff']
});

const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp();
const api = $api as any;

const studentId = computed(() => String(route.params.id));
const student = ref<any>(null);
const assignments = ref<any[]>([]);
const certificates = ref<any[]>([]);
const loading = ref(true);
const error = ref('');

const activeTab = ref<'exams' | 'results' | 'certificates' | 'profile'>('exams');

const showEditModal = ref(false);
const savingEdit = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const editForm = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirm_password: '',
  education_level: '',
  gender: '',
  dob: ''
});

const educationLevels = ref<string[]>([
  'SSLC / 10th Standard',
  'Plus Two / 12th Standard',
  'Diploma',
  'Undergraduate / Bachelor Degree',
  'Postgraduate / Master Degree',
  'Doctorate / PhD',
  'Other / Professional'
]);

// KPI Calculations
const passedCount = computed(() => {
  return assignments.value.filter(a => a.status === 'passed').length;
});

const inProgressCount = computed(() => {
  return assignments.value.filter(a => ['in_progress', 'not_started'].includes(a.status)).length;
});

// All attempts extracted from all assignments
const allAttempts = computed(() => {
  const list: any[] = [];
  for (const a of assignments.value) {
    if (Array.isArray(a.attempts)) {
      for (const att of a.attempts) {
        let parsedResult = null;
        if (att.result) {
          try {
            parsedResult = typeof att.result === 'string' ? JSON.parse(att.result) : att.result;
          } catch (e) {
            parsedResult = null;
          }
        }
        list.push({
          ...att,
          exam_name: a.exam_name,
          parsedResult
        });
      }
    }
  }
  return list.sort((x, y) => new Date(y.started_at || 0).getTime() - new Date(x.started_at || 0).getTime());
});

const totalAttemptsCount = computed(() => allAttempts.value.length);

onMounted(() => {
  fetchStudentDetails();
  fetchEducationLevels();
});

async function fetchEducationLevels() {
  try {
    const { data } = await api.get('/sub-center/education-levels');
    if (Array.isArray(data) && data.length > 0) {
      educationLevels.value = data;
    }
  } catch (e) {
    // Keep fallback list
  }
}

async function fetchStudentDetails() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.get(`/sub-center/students/${studentId.value}`);
    student.value = data;
    assignments.value = Array.isArray(data.assignments) ? data.assignments : [];
    certificates.value = Array.isArray(data.certificates) ? data.certificates : [];
  } catch (err: any) {
    console.error('Error loading student details:', err);
    error.value = err.response?.data?.message || err.message || 'Candidate not found in your organization.';
  } finally {
    loading.value = false;
  }
}

function openEditModal() {
  if (!student.value) return;
  editForm.value = {
    name: student.value.name || '',
    email: student.value.email || '',
    phone: student.value.phone || '',
    password: '',
    confirm_password: '',
    education_level: student.value.education_level || '',
    gender: student.value.gender || '',
    dob: student.value.dob ? String(student.value.dob).slice(0, 10) : ''
  };
  showPassword.value = false;
  showConfirmPassword.value = false;
  showEditModal.value = true;
}

async function updateCandidate() {
  if (!editForm.value.name || !editForm.value.email) {
    alert('Candidate name and email are required.');
    return;
  }
  if (editForm.value.password && editForm.value.password !== editForm.value.confirm_password) {
    alert('Password and Confirm Password do not match.');
    return;
  }
  savingEdit.value = true;
  try {
    await api.put(`/sub-center/students/${studentId.value}`, editForm.value);
    showEditModal.value = false;
    alert('Candidate details updated successfully!');
    fetchStudentDetails();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to update candidate');
  } finally {
    savingEdit.value = false;
  }
}

function enrollInBatch() {
  router.push('/sub-center?tab=batches');
}

function copyExamLink(item: any) {
  const id = item.assignment_id || item.id;
  const url = `${window.location.origin}/exam/take-${id}`;
  navigator.clipboard.writeText(url);
  alert(`Exam sitting link copied to clipboard:\n${url}`);
}

function createDedicatedRetry(item: any) {
  router.push('/sub-center?tab=batches');
}

function formatDate(val: any) {
  if (!val) return '-';
  try {
    return new Date(val).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return String(val);
  }
}
</script>

<style scoped>
.gsfin-admin-page {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 32px 24px;
  font-family: inherit;
}

.admin-wrap {
  max-width: 1240px;
  margin: 0 auto;
}

/* Top Nav Bar */
.top-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 16px;
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
  font-size: 0.9rem;
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
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-icon-refresh:hover:not(:disabled) {
  background: #f8fafc;
  color: #0f172a;
  border-color: #cbd5e1;
}

.spin-icon {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* Hero Card */
.hero-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  flex-wrap: wrap;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.student-avatar-box {
  width: 68px;
  height: 68px;
  border-radius: 16px;
  background: #fef2f2;
  color: #dc2626;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.25rem;
  border: 1px solid #fee2e2;
  flex-shrink: 0;
}

.hero-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.student-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.01em;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-certified {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.badge-active {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.meta-tags-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.775rem;
  color: #475569;
  font-weight: 500;
  padding: 3px 9px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.badge-education {
  background: #faf5ff;
  color: #7e22ce;
  border-color: #e9d5ff;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 9px;
  font-size: 0.825rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
}

.btn-action-secondary {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #cbd5e1;
}

.btn-action-secondary:hover {
  background: #e2e8f0;
}

.btn-action-red {
  background: #dc2626;
  color: #ffffff;
}

.btn-action-red:hover {
  background: #b91c1c;
}

.btn-action-sm {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 7px;
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.btn-action-success {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.btn-action-success:hover {
  background: #059669;
  color: #ffffff;
}

.btn-action-primary {
  background: #059669;
  color: #ffffff;
  border: 1px solid #059669;
}

.btn-action-primary:hover {
  background: #047857;
  color: #ffffff;
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}

.kpi-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.bg-indigo-light { background: #e0e7ff; }
.text-indigo { color: #4338ca; }
.bg-green-light { background: #ecfdf5; }
.bg-red-light { background: #fee2e2; }
.text-red { color: #dc2626; }
.bg-amber-light { background: #fef3c7; }
.text-amber { color: #d97706; }

.kpi-content {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.04em;
}

.kpi-value {
  font-size: 1.6rem;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.2;
}

.kpi-sub {
  font-size: 0.725rem;
  font-weight: 500;
  margin-top: 2px;
}

/* Tabs */
.tabs-container {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.tabs-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  overflow-x: auto;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.825rem;
  font-weight: 600;
  color: #64748b;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.tab-btn:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.tab-btn.active {
  background: #ffffff;
  color: #dc2626;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.tab-btn .tab-icon {
  font-size: 1.15rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 2px;
}

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  margin-left: 4px;
  background: #e2e8f0;
  color: #475569;
}

.tab-btn.active .tab-badge {
  background: #fee2e2;
  color: #dc2626;
}

.tab-content {
  padding: 24px;
}

/* Session Cards */
.session-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  padding: 18px 20px;
  transition: border-color 0.15s;
}

.session-card:hover {
  border-color: #cbd5e1;
}

.session-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.session-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #fef2f2;
  color: #dc2626;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.session-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.session-sub {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 2px;
}

.session-card-body {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  align-items: center;
  padding-top: 14px;
}

@media (max-width: 800px) {
  .session-card-body {
    grid-template-columns: 1fr 1fr;
  }
}

.session-stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
}

.stat-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin-top: 2px;
}

.session-stat-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

/* Tables */
.table-responsive {
  overflow-x: auto;
}

.gsfin-native-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.gsfin-native-table th {
  padding: 10px 14px;
  font-size: 0.725rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.gsfin-native-table td {
  padding: 12px 14px;
  font-size: 0.8rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
}

.gsfin-native-table tr:hover td {
  background: #f8fafc;
}

/* Certificate Cards */
.cert-item-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.cert-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.cert-seal {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #fee2e2;
  color: #dc2626;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.cert-tag {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #059669;
  letter-spacing: 0.04em;
}

.cert-exam-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
  margin: 2px 0 0;
}

.cert-details {
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
}

.cert-detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.775rem;
}

.cert-detail-label {
  color: #64748b;
  font-weight: 500;
}

.cert-detail-value {
  color: #0f172a;
  font-weight: 600;
}

.cert-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

/* Badges */
.badge-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.725rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.chip-green { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.chip-red { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.chip-amber { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
.chip-slate { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

/* Profile Grid */
.profile-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 650px) {
  .profile-details-grid {
    grid-template-columns: 1fr;
  }
}

.info-group {
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
}

.info-group-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.info-group-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

/* Empty State */
.empty-state-box {
  padding: 48px 24px;
  text-align: center;
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.modal-card {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  padding: 18px 22px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.modal-close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.25rem;
  cursor: pointer;
}

.modal-close-btn:hover { color: #0f172a; }

.modal-body {
  padding: 22px;
}

.modal-footer {
  padding: 14px 22px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.form-label-xs {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 5px;
}

.required-star { color: #dc2626; }

.modal-input-field {
  width: 100%;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  font-size: 0.825rem;
  color: #0f172a;
  outline: none;
}

.modal-input-field:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.1);
}

.input-with-icon { position: relative; }

.input-prefix-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.input-has-prefix { padding-left: 34px; }
.has-suffix { padding-right: 36px; }

.input-suffix-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.custom-select-wrapper { position: relative; }

.select-chevron {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #94a3b8;
}

.btn-glass {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-glass:hover { background: #f1f5f9; }

.btn-red {
  padding: 8px 18px;
  border-radius: 8px;
  background: #dc2626;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.btn-red:hover:not(:disabled) { background: #b91c1c; }
.btn-red:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner-lg-red {
  display: inline-block;
  width: 36px;
  height: 36px;
  border: 3px solid rgba(220, 38, 38, 0.15);
  border-top-color: #dc2626;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

.fade-in {
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

