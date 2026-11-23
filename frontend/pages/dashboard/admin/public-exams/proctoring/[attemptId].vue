<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ TOP BREADCRUMB & BACK NAVIGATION ═══ -->
      <div class="top-nav-bar mb-6">
        <div class="nav-left">
          <button class="btn-back" type="button" @click="handleBack">
            <i class="mdi mdi-arrow-left"></i>
            <span>Back</span>
          </button>
          <div class="breadcrumb-trail">
            <NuxtLink to="/dashboard/admin/public-exams/proctoring" class="bc-link">Proctoring Governance</NuxtLink>
            <i class="mdi mdi-chevron-right bc-sep"></i>
            <span v-if="details?.is_subcenter" class="bc-link text-slate-600">{{ details?.org_name || 'Sub-Center' }}</span>
            <span v-else class="bc-link text-slate-600">{{ details?.exam_title || 'Public Exam' }}</span>
            <template v-if="details?.batch_code">
              <i class="mdi mdi-chevron-right bc-sep"></i>
              <span class="bc-link text-slate-600 font-mono">{{ details.batch_code }}</span>
            </template>
            <i class="mdi mdi-chevron-right bc-sep"></i>
            <span class="bc-current">Audit Review</span>
          </div>
        </div>

        <div class="nav-right">
          <button
            class="btn-icon-refresh"
            type="button"
            title="Refresh Audit Telemetry"
            :disabled="loading"
            @click="loadData"
          >
            <i :class="['mdi', 'mdi-refresh', { 'spin-icon': loading }]"></i>
          </button>
        </div>
      </div>

      <!-- ═══ HEADER ROW & ACTIONS BAR ═══ -->
      <div class="admin-header-row mb-6">
        <div>
          <!-- Dynamic Sitting Type & Batch Context Strip -->
          <div class="flex items-center gap-2 mb-1.5 flex-wrap">
            <span v-if="details?.is_subcenter" class="sitting-type-pill pill-subcenter">
              <i class="mdi mdi-domain"></i>
              <span>Sub-Center Batch Sitting</span>
              <span class="pill-divider">&bull;</span>
              <strong>{{ details?.org_name || 'Partner Center' }}</strong>
            </span>
            <span v-else class="sitting-type-pill pill-public">
              <i class="mdi mdi-earth"></i>
              <span>Direct Public Portal Sitting</span>
            </span>

            <span v-if="details?.batch_code" class="batch-code-chip font-mono">
              <i class="mdi mdi-tag-outline mr-0.5"></i> {{ details.batch_code }}
            </span>

            <span v-if="details?.result" :class="['result-pill', details.result === 'pass' ? 'result-pass' : 'result-fail']">
              <i :class="['mdi', details.result === 'pass' ? 'mdi-check-circle' : 'mdi-close-circle']"></i>
              <span>Result: {{ details.result.toUpperCase() }}</span>
            </span>
          </div>

          <h1 class="admin-title">
            {{ details?.exam_title || 'Public Exam' }} &bull; Proctoring Audit Review
          </h1>

          <div class="flex items-center gap-2.5 mt-2 flex-wrap">
            <span class="attempt-id-chip">
              <span class="text-slate-400 font-sans">Attempt ID:</span>
              <code class="font-mono font-semibold">{{ attemptId }}</code>
              <button
                type="button"
                class="copy-btn"
                :title="copiedAttemptId ? 'Copied!' : 'Copy Attempt ID'"
                @click="copyAttemptId"
              >
                <i :class="['mdi', copiedAttemptId ? 'mdi-check text-emerald-600' : 'mdi-content-copy']"></i>
              </button>
            </span>

            <span :class="['status-pill', getStatusPillClass(details?.proctoring_status)]">
              <i :class="['mdi mr-1', details?.proctoring_status === 'approved' ? 'mdi-check-decagram' : (details?.proctoring_status === 'flagged' ? 'mdi-flag' : 'mdi-clock-outline')]"></i>
              {{ formatStatus(details?.proctoring_status || 'pending_review') }}
            </span>
          </div>
        </div>

        <!-- Aligned Executive Action Buttons -->
        <div class="header-actions-group">
          <button
            type="button"
            class="btn-action btn-approve"
            :disabled="actionLoading"
            @click="showApproveDialog = true"
          >
            <i class="mdi mdi-certificate-outline"></i>
            <span>Approve &amp; Issue Certificate</span>
          </button>

          <button
            type="button"
            class="btn-action btn-flag"
            :disabled="actionLoading"
            @click="showFlagDialog = true"
          >
            <i class="mdi mdi-flag-outline"></i>
            <span>Flag Attempt</span>
          </button>

          <button
            type="button"
            class="btn-action btn-glass"
            :disabled="actionLoading || events.length === 0"
            @click="showClearDialog = true"
          >
            <i class="mdi mdi-broom"></i>
            <span>Clear Violations</span>
          </button>

          <button
            type="button"
            class="btn-action btn-glass-danger"
            :disabled="actionLoading"
            title="Permanently remove all proctoring logs for this sitting"
            @click="showDeleteDialog = true"
          >
            <i class="mdi mdi-trash-can-outline"></i>
            <span>Delete Data</span>
          </button>
        </div>
      </div>

      <!-- ═══ PROXY CANDIDATE HIGH-RISK ALERT BANNER ═══ -->
      <div v-if="hasProxyMismatch" class="proxy-alert-banner mb-6">
        <div class="alert-icon-wrap">
          <i class="mdi mdi-account-alert-outline"></i>
        </div>
        <div class="alert-content">
          <div class="alert-title">High Risk Facial Geometry Deviation Detected</div>
          <div class="alert-desc">
            Candidate facial vector deviated from their registered baseline selfie (<code class="font-mono">proxy_mismatch</code>).
            Carefully verify snapshot evidence below before validating certificate release.
          </div>
        </div>
        <div class="alert-badge">
          <i class="mdi mdi-alert-circle"></i> ACTION REQUIRED
        </div>
      </div>

      <!-- ═══ LOADING STATE ═══ -->
      <div v-if="loading && !details" class="text-center py-24 text-slate-500 font-medium">
        <span class="spinner-sm-red mb-2"></span>
        <p class="text-sm">Loading Candidate Proctoring Telemetry &amp; Evidence...</p>
      </div>

      <!-- ═══ MAIN AUDIT CONTENT ═══ -->
      <div v-else class="audit-layout-grid">

        <!-- ────────────────────────────────────────── -->
        <!-- LEFT COLUMN (4 COLS): BIOMETRIC & SITTING  -->
        <!-- ────────────────────────────────────────── -->
        <div class="audit-left-col">

          <!-- Biometric Baseline Card -->
          <div class="panel-section-card">
            <div class="section-card-header">
              <div class="flex items-center gap-2.5">
                <div class="section-icon-box bg-red-50 text-red">
                  <i class="mdi mdi-card-account-details-outline"></i>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-slate-900 m-0">Candidate Biometric Baseline</h3>
                  <p class="text-xs text-slate-400 m-0">Identity verification &amp; webcam telemetry</p>
                </div>
              </div>
            </div>

            <div class="p-5">
              <!-- Registered Selfie Photo Frame -->
              <div class="selfie-frame-wrap mb-5">
                <div v-if="details?.reference_selfie_url" class="selfie-preview-box cursor-pointer" @click="openPreview(details.reference_selfie_url)">
                  <img
                    :src="backendUrl(details.reference_selfie_url)"
                    alt="Registered Selfie Baseline"
                    class="selfie-img"
                  />
                  <div class="selfie-tag-pill">
                    <i class="mdi mdi-face-recognition text-emerald-600"></i>
                    <span>Registered Baseline Selfie</span>
                  </div>
                  <div class="selfie-zoom-hint">
                    <i class="mdi mdi-magnify-plus-outline"></i> Click to zoom
                  </div>
                </div>

                <div v-else class="selfie-placeholder-box">
                  <div class="placeholder-avatar">
                    {{ getInitials(details?.candidate_name) }}
                  </div>
                  <div class="placeholder-text">
                    <span class="text-xs font-semibold text-slate-700">No Biometric Photo Stored</span>
                    <span class="text-xs text-slate-400">Baseline was captured via anonymous or direct session</span>
                  </div>
                </div>
              </div>

              <!-- Candidate Metadata Key-Values -->
              <div class="meta-list">
                <div class="meta-item">
                  <div class="meta-label">
                    <i class="mdi mdi-account-outline"></i> Candidate Name
                  </div>
                  <div class="meta-val font-semibold text-slate-900">
                    {{ details?.candidate_name || 'Candidate' }}
                  </div>
                </div>

                <div class="meta-item">
                  <div class="meta-label">
                    <i class="mdi mdi-email-outline"></i> Candidate Email
                  </div>
                  <div class="meta-val text-slate-700">
                    {{ details?.candidate_email || 'No email recorded' }}
                  </div>
                </div>

                <div v-if="details?.candidate_phone" class="meta-item">
                  <div class="meta-label">
                    <i class="mdi mdi-phone-outline"></i> Contact Phone
                  </div>
                  <div class="meta-val text-slate-700 font-mono text-xs">
                    {{ details.candidate_phone }}
                  </div>
                </div>

                <div class="meta-item">
                  <div class="meta-label">
                    <i class="mdi mdi-file-certificate-outline"></i> Examination
                  </div>
                  <div class="meta-val font-semibold text-slate-900">
                    {{ details?.exam_title || 'Certification Exam' }}
                  </div>
                </div>

                <div v-if="details?.is_subcenter" class="meta-item">
                  <div class="meta-label">
                    <i class="mdi mdi-domain"></i> Testing Center
                  </div>
                  <div class="meta-val font-medium text-slate-800">
                    {{ details?.org_name || 'Authorized Testing Center' }}
                  </div>
                </div>

                <div v-if="details?.batch_code" class="meta-item">
                  <div class="meta-label">
                    <i class="mdi mdi-tag-outline"></i> Batch Code
                  </div>
                  <div class="meta-val font-mono text-xs font-semibold text-slate-800">
                    {{ details.batch_code }}
                  </div>
                </div>

                <div v-if="details?.result" class="meta-item">
                  <div class="meta-label">
                    <i class="mdi mdi-trophy-outline"></i> Exam Result
                  </div>
                  <div class="meta-val">
                    <span :class="['result-pill', details.result === 'pass' ? 'result-pass' : 'result-fail']">
                      <i :class="['mdi', details.result === 'pass' ? 'mdi-check-circle' : 'mdi-close-circle']"></i>
                      <span>{{ details.result === 'pass' ? 'PASSED' : 'FAILED' }}</span>
                    </span>
                  </div>
                </div>

                <div class="meta-item">
                  <div class="meta-label">
                    <i class="mdi mdi-shield-check-outline"></i> Audit Status
                  </div>
                  <div class="meta-val">
                    <span :class="['status-pill', getStatusPillClass(details?.proctoring_status)]">
                      {{ formatStatus(details?.proctoring_status || 'pending_review') }}
                    </span>
                  </div>
                </div>

                <div v-if="details?.started_at" class="meta-item">
                  <div class="meta-label">
                    <i class="mdi mdi-clock-outline"></i> Started At
                  </div>
                  <div class="meta-val text-slate-600 text-xs">
                    {{ formatDate(details.started_at) }}
                  </div>
                </div>

                <div v-if="details?.submitted_at" class="meta-item">
                  <div class="meta-label">
                    <i class="mdi mdi-clock-check-outline"></i> Submitted At
                  </div>
                  <div class="meta-val text-slate-600 text-xs">
                    {{ formatDate(details.submitted_at) }}
                  </div>
                </div>
              </div>

              <!-- Integrity & Severity Mini KPI Cards -->
              <div class="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100">
                <div class="metric-mini-tile">
                  <div class="metric-mini-num text-slate-900">{{ events.length }}</div>
                  <div class="metric-mini-label">
                    <i class="mdi mdi-shield-alert-outline text-indigo-500"></i> Logged Events
                  </div>
                </div>

                <div class="metric-mini-tile" :class="{ 'tile-warning': highSeverityCount > 0 }">
                  <div class="metric-mini-num" :class="highSeverityCount > 0 ? 'text-red' : 'text-slate-900'">
                    {{ highSeverityCount }}
                  </div>
                  <div class="metric-mini-label">
                    <i class="mdi mdi-alert-octagon-outline text-red"></i> High Severity
                  </div>
                </div>
              </div>

              <!-- Trust / Integrity Score Badge -->
              <div class="mt-4 p-3 rounded-xl border flex items-center justify-between" :class="integrityClass">
                <div class="flex items-center gap-2">
                  <i :class="['mdi text-lg', integrityIcon]"></i>
                  <div>
                    <div class="text-xs font-semibold">{{ integrityTitle }}</div>
                    <div class="text-xs text-slate-500">{{ integritySubtitle }}</div>
                  </div>
                </div>
                <div class="text-sm font-semibold font-mono">{{ integrityPercent }}</div>
              </div>
            </div>
          </div>

        </div>

        <!-- ────────────────────────────────────────── -->
        <!-- RIGHT COLUMN (8 COLS): EVIDENCE & TIMELINE -->
        <!-- ────────────────────────────────────────── -->
        <div class="audit-right-col">

          <div class="panel-section-card">
            <!-- Section Header with Segmented View Switcher -->
            <div class="section-card-header flex-wrap gap-3">
              <div class="flex items-center gap-2.5">
                <div class="section-icon-box bg-slate-100 text-slate-700">
                  <i class="mdi mdi-shield-search-outline"></i>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-slate-900 m-0">Violation Events &amp; Snapshot Evidence</h3>
                  <p class="text-xs text-slate-400 m-0">Proctoring telemetry recorded during candidate's sitting</p>
                </div>
              </div>

              <!-- Segmented View Mode Toggle -->
              <div class="view-mode-toggle">
                <button
                  type="button"
                  :class="['toggle-btn', { active: viewMode === 'timeline' }]"
                  @click="viewMode = 'timeline'"
                >
                  <i class="mdi mdi-timeline-clock-outline"></i>
                  <span>Timeline View ({{ events.length }})</span>
                </button>
                <button
                  type="button"
                  :class="['toggle-btn', { active: viewMode === 'grid' }]"
                  @click="viewMode = 'grid'"
                >
                  <i class="mdi mdi-grid"></i>
                  <span>Snapshot Gallery ({{ eventsWithScreenshots.length }})</span>
                </button>
              </div>
            </div>

            <!-- Body Area -->
            <div class="p-6">

              <!-- ═══ CASE 1: ZERO VIOLATIONS (CLEAN SESSION SHOWCASE) ═══ -->
              <div v-if="events.length === 0" class="clean-session-showcase">
                <div class="clean-shield-ring">
                  <i class="mdi mdi-shield-check"></i>
                </div>
                <h3 class="text-base font-semibold text-slate-900 mb-1">Clean Proctoring Session &bull; 100% Integrity</h3>
                <p class="text-xs text-slate-500 max-w-md mx-auto mb-6">
                  Zero security violations logged during this exam attempt. The candidate remained focused with continuous facial alignment and full-screen enforcement.
                </p>

                <!-- 4 Security Checkpoints -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left">
                  <div class="checkpoint-card">
                    <div class="checkpoint-icon bg-emerald-50 text-emerald-600">
                      <i class="mdi mdi-face-recognition"></i>
                    </div>
                    <div>
                      <div class="text-xs font-semibold text-slate-900">Biometric Continuity</div>
                      <div class="text-xs text-slate-500">Continuous single-face visual tracking; no proxy deviation.</div>
                    </div>
                  </div>

                  <div class="checkpoint-card">
                    <div class="checkpoint-icon bg-emerald-50 text-emerald-600">
                      <i class="mdi mdi-fullscreen"></i>
                    </div>
                    <div>
                      <div class="text-xs font-semibold text-slate-900">Fullscreen Focus</div>
                      <div class="text-xs text-slate-500">Zero tab switches, background minimizations, or window blurs.</div>
                    </div>
                  </div>

                  <div class="checkpoint-card">
                    <div class="checkpoint-icon bg-emerald-50 text-emerald-600">
                      <i class="mdi mdi-camera-lock-outline"></i>
                    </div>
                    <div>
                      <div class="text-xs font-semibold text-slate-900">Video Telemetry</div>
                      <div class="text-xs text-slate-500">Active webcam stream verified throughout entire examination.</div>
                    </div>
                  </div>

                  <div class="checkpoint-card">
                    <div class="checkpoint-icon bg-emerald-50 text-emerald-600">
                      <i class="mdi mdi-code-tags-check"></i>
                    </div>
                    <div>
                      <div class="text-xs font-semibold text-slate-900">Browser Security</div>
                      <div class="text-xs text-slate-500">No developer tools or DOM inspection events triggered.</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ═══ CASE 2: TIMELINE VIEW (WITH EVENTS) ═══ -->
              <div v-else-if="viewMode === 'timeline'" class="timeline-container">
                <div
                  v-for="(event, idx) in events"
                  :key="event.id || idx"
                  class="timeline-item-row"
                >
                  <!-- Timeline Node -->
                  <div class="timeline-marker">
                    <div :class="['marker-dot', getEventMarkerClass(event.type)]"></div>
                    <div v-if="idx < events.length - 1" class="marker-line"></div>
                  </div>

                  <!-- Timeline Content Card -->
                  <div class="timeline-event-card">
                    <div class="event-card-top">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="event-title">{{ formatType(event.type) }}</span>
                        <span :class="['severity-badge', getSeverityBadgeClass(event.type)]">
                          {{ getSeverityLabel(event.type) }}
                        </span>
                      </div>
                      <div class="event-time">
                        <i class="mdi mdi-clock-outline"></i>
                        <span>{{ formatEventTime(event.created_at) }}</span>
                      </div>
                    </div>

                    <!-- Snapshot Thumbnail (if present) -->
                    <div
                      v-if="event.metadata_json && event.metadata_json.screenshot"
                      class="event-snapshot-thumb"
                      @click="openPreview(event.metadata_json.screenshot)"
                    >
                      <img
                        :src="backendUrl(event.metadata_json.screenshot)"
                        alt="Violation snapshot"
                        class="thumb-img"
                      />
                      <div class="thumb-overlay">
                        <i class="mdi mdi-magnify-plus-outline"></i>
                        <span>Zoom Snapshot</span>
                      </div>
                    </div>

                    <!-- Metadata JSON view (if no screenshot) -->
                    <div
                      v-else-if="event.metadata_json && Object.keys(event.metadata_json).length > 0"
                      class="event-metadata-box"
                    >
                      <pre>{{ JSON.stringify(event.metadata_json, null, 2) }}</pre>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ═══ CASE 3: SNAPSHOT GALLERY GRID VIEW ═══ -->
              <div v-else-if="viewMode === 'grid'">
                <div v-if="eventsWithScreenshots.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div
                    v-for="event in eventsWithScreenshots"
                    :key="event.id"
                    class="gallery-snapshot-card"
                    @click="openPreview(event.metadata_json.screenshot)"
                  >
                    <div class="gallery-img-wrap">
                      <img
                        :src="backendUrl(event.metadata_json.screenshot)"
                        alt="Evidence snapshot"
                        class="gallery-img"
                      />
                      <span class="gallery-zoom-badge">
                        <i class="mdi mdi-magnify-plus-outline"></i>
                      </span>
                    </div>
                    <div class="gallery-card-body">
                      <div class="flex items-center justify-between gap-1 mb-1">
                        <span class="text-xs font-semibold text-slate-900 truncate">
                          {{ formatType(event.type) }}
                        </span>
                        <span :class="['severity-badge-sm', getSeverityBadgeClass(event.type)]">
                          {{ getSeverityLabel(event.type) }}
                        </span>
                      </div>
                      <div class="text-xs text-slate-400 font-mono">
                        {{ formatTimeOnly(event.created_at) }}
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-16 text-slate-400">
                  <i class="mdi mdi-camera-off text-4xl block mb-2 text-slate-300"></i>
                  <div class="text-xs font-semibold text-slate-600">No Snapshot Evidence Stored</div>
                  <div class="text-xs text-slate-400">No visual camera frames were triggered during recorded events.</div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- MODAL 1: APPROVE & ISSUE CERTIFICATE           -->
    <!-- ═══════════════════════════════════════════════ -->
    <div v-if="showApproveDialog" class="modal-backdrop">
      <div class="modal-dialog-box max-w-md">
        <div class="modal-header">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
              <i class="mdi mdi-certificate-outline"></i>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-900 m-0">Approve &amp; Issue Certificate</h3>
              <p class="text-xs text-slate-400 m-0">Confirm candidate proctoring audit pass</p>
            </div>
          </div>
          <button type="button" class="btn-close-modal" @click="showApproveDialog = false">
            <i class="mdi mdi-close"></i>
          </button>
        </div>

        <div class="modal-body text-xs text-slate-600 space-y-3">
          <p class="m-0">
            You are approving the proctoring audit for <strong>{{ details?.candidate_name || 'Candidate' }}</strong>.
          </p>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div class="flex items-center justify-between mb-1">
              <span class="text-slate-500">Total Security Violations:</span>
              <strong class="font-mono text-slate-900">{{ events.length }}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500">High Severity Violations:</span>
              <strong class="font-mono" :class="highSeverityCount > 0 ? 'text-red' : 'text-emerald-600'">
                {{ highSeverityCount }}
              </strong>
            </div>
          </div>
          <p class="text-slate-500 m-0">
            Upon confirmation, the candidate's certificate will be generated and signed by the GSFIN authority.
          </p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-modal-cancel" @click="showApproveDialog = false">
            Cancel
          </button>
          <button
            type="button"
            class="btn-modal-confirm bg-emerald-600 hover:bg-emerald-700 text-white"
            :disabled="actionLoading"
            @click="executeApprove"
          >
            <i v-if="actionLoading" class="mdi mdi-loading spin-icon mr-1"></i>
            <span>{{ actionLoading ? 'Processing...' : 'Confirm & Issue Certificate' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- MODAL 2: FLAG ATTEMPT (CUSTOM REASON)          -->
    <!-- ═══════════════════════════════════════════════ -->
    <div v-if="showFlagDialog" class="modal-backdrop">
      <div class="modal-dialog-box max-w-md">
        <div class="modal-header">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-red-50 text-red flex items-center justify-center text-lg">
              <i class="mdi mdi-flag-outline"></i>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-900 m-0">Flag Proctoring Attempt</h3>
              <p class="text-xs text-slate-400 m-0">Mark candidate sitting with security breach</p>
            </div>
          </div>
          <button type="button" class="btn-close-modal" @click="showFlagDialog = false">
            <i class="mdi mdi-close"></i>
          </button>
        </div>

        <div class="modal-body space-y-3">
          <div>
            <label class="text-xs font-semibold text-slate-700 block mb-1">Violation Reason</label>
            <select v-model="flagReasonPreset" class="form-select-sm w-full">
              <option value="proxy_mismatch">Proxy candidate impersonation / Biometric mismatch</option>
              <option value="multiple_faces">Multiple faces / Unauthorized persons detected in frame</option>
              <option value="frequent_tabs">Frequent tab switching &amp; window focus defocus</option>
              <option value="devtools">Browser developer tools / DOM inspection detected</option>
              <option value="mobile_device">Mobile phone or secondary electronic device present</option>
              <option value="camera_disabled">Webcam feed disabled / lens obscured during examination</option>
              <option value="custom">Other custom violation notes</option>
            </select>
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-700 block mb-1">Auditor Review Notes (Optional)</label>
            <textarea
              v-model="flagNotes"
              rows="3"
              class="form-textarea-sm w-full"
              placeholder="Provide specific timestamp references or audit findings..."
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-modal-cancel" @click="showFlagDialog = false">
            Cancel
          </button>
          <button
            type="button"
            class="btn-modal-confirm bg-red text-white"
            :disabled="actionLoading"
            @click="executeFlag"
          >
            <i v-if="actionLoading" class="mdi mdi-loading spin-icon mr-1"></i>
            <span>{{ actionLoading ? 'Flagging...' : 'Mark as Flagged' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- MODAL 3: CLEAR VIOLATIONS CONFIRMATION         -->
    <!-- ═══════════════════════════════════════════════ -->
    <div v-if="showClearDialog" class="modal-backdrop">
      <div class="modal-dialog-box max-w-sm">
        <div class="modal-header">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
              <i class="mdi mdi-broom"></i>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-900 m-0">Clear Violation Events?</h3>
              <p class="text-xs text-slate-400 m-0">Reset logged proctoring alerts</p>
            </div>
          </div>
          <button type="button" class="btn-close-modal" @click="showClearDialog = false">
            <i class="mdi mdi-close"></i>
          </button>
        </div>

        <div class="modal-body text-xs text-slate-600">
          Are you sure you want to clear all <strong>{{ events.length }}</strong> violation records for this sitting? This action resets the audit log to clean status.
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-modal-cancel" @click="showClearDialog = false">
            Cancel
          </button>
          <button
            type="button"
            class="btn-modal-confirm bg-slate-900 text-white"
            :disabled="actionLoading"
            @click="executeClear"
          >
            <i v-if="actionLoading" class="mdi mdi-loading spin-icon mr-1"></i>
            <span>{{ actionLoading ? 'Clearing...' : 'Clear Violations' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- MODAL 4: DELETE DATA CONFIRMATION              -->
    <!-- ═══════════════════════════════════════════════ -->
    <div v-if="showDeleteDialog" class="modal-backdrop">
      <div class="modal-dialog-box max-w-sm">
        <div class="modal-header">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-red-50 text-red flex items-center justify-center text-lg">
              <i class="mdi mdi-trash-can-outline"></i>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-900 m-0">Permanently Delete Audit Logs?</h3>
              <p class="text-xs text-slate-400 m-0">Irreversible sitting data deletion</p>
            </div>
          </div>
          <button type="button" class="btn-close-modal" @click="showDeleteDialog = false">
            <i class="mdi mdi-close"></i>
          </button>
        </div>

        <div class="modal-body text-xs text-slate-600">
          This will permanently purge all telemetry logs, snapshot images, and recording manifests for attempt 
          <code class="font-mono text-slate-900 font-semibold">{{ attemptId.slice(0, 8) }}</code>. This cannot be undone.
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-modal-cancel" @click="showDeleteDialog = false">
            Cancel
          </button>
          <button
            type="button"
            class="btn-modal-confirm bg-red text-white"
            :disabled="actionLoading"
            @click="executeDelete"
          >
            <i v-if="actionLoading" class="mdi mdi-loading spin-icon mr-1"></i>
            <span>{{ actionLoading ? 'Deleting...' : 'Delete Permanently' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- MODAL 5: FULLSCREEN SNAPSHOT IMAGE PREVIEW     -->
    <!-- ═══════════════════════════════════════════════ -->
    <div v-if="showPreviewDialog" class="modal-backdrop" @click="showPreviewDialog = false">
      <div class="preview-dialog-box" @click.stop>
        <button type="button" class="preview-close-btn" @click="showPreviewDialog = false">
          <i class="mdi mdi-close"></i>
        </button>
        <img :src="previewImageUrl" alt="Snapshot evidence preview" class="preview-full-img" />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'main_admin', 'lms_user']
});

const route = useRoute();
const router = useRouter();
const api = useApi();
const attemptId = route.params.attemptId as string;

const loading = ref(true);
const actionLoading = ref(false);
const details = ref<any>(null);
const events = ref<any[]>([]);
const viewMode = ref<'timeline' | 'grid'>('timeline');

const copiedAttemptId = ref(false);
const showApproveDialog = ref(false);
const showFlagDialog = ref(false);
const showClearDialog = ref(false);
const showDeleteDialog = ref(false);

const flagReasonPreset = ref('proxy_mismatch');
const flagNotes = ref('');

const showPreviewDialog = ref(false);
const previewImageUrl = ref('');

const handleBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/dashboard/admin/public-exams/proctoring');
  }
};

const copyAttemptId = async () => {
  try {
    await navigator.clipboard.writeText(attemptId);
    copiedAttemptId.value = true;
    setTimeout(() => { copiedAttemptId.value = false; }, 2000);
  } catch (err) {
    console.error('Failed to copy attempt ID', err);
  }
};

const hasProxyMismatch = computed(() => {
  return events.value.some(e => e.type === 'proxy_mismatch');
});

const highSeverityCount = computed(() => {
  const highTypes = ['proxy_mismatch', 'multiple_faces', 'face_absent', 'devtools_open', 'mobile_phone_detected', 'camera_disabled'];
  return events.value.filter(e => highTypes.includes(e.type)).length;
});

const eventsWithScreenshots = computed(() => {
  return events.value.filter(e => e.metadata_json && e.metadata_json.screenshot);
});

// Trust / Integrity Metric Calculations
const integrityPercent = computed(() => {
  if (events.value.length === 0) return '100%';
  const penalty = Math.min(100, highSeverityCount.value * 35 + (events.value.length - highSeverityCount.value) * 10);
  return `${Math.max(0, 100 - penalty)}%`;
});

const integrityClass = computed(() => {
  if (events.value.length === 0) return 'bg-emerald-50 border-emerald-200 text-emerald-800';
  if (highSeverityCount.value > 0) return 'bg-rose-50 border-rose-200 text-rose-800';
  return 'bg-amber-50 border-amber-200 text-amber-800';
});

const integrityIcon = computed(() => {
  if (events.value.length === 0) return 'mdi-shield-check text-emerald-600';
  if (highSeverityCount.value > 0) return 'mdi-shield-alert text-red';
  return 'mdi-shield-outline text-amber-600';
});

const integrityTitle = computed(() => {
  if (events.value.length === 0) return 'Verified Clean Session';
  if (highSeverityCount.value > 0) return 'Critical Violations Logged';
  return 'Minor Defocus Events';
});

const integritySubtitle = computed(() => {
  if (events.value.length === 0) return 'Candidate passed all proctoring criteria';
  if (highSeverityCount.value > 0) return 'Manual auditor clearance advised';
  return 'Candidate logged temporary tab focus blurs';
});

const openPreview = (url: string) => {
  previewImageUrl.value = backendUrl(url);
  showPreviewDialog.value = true;
};

const backendUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) return path;
  const config = useRuntimeConfig();
  const base = (config.public?.apiBase || '/api').replace(/\/api\/?$/, '');
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
};

const getInitials = (name?: string) => {
  if (!name) return 'CA';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatEventTime = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatTimeOnly = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatStatus = (status?: string) => {
  if (!status) return 'PENDING REVIEW';
  return status.replace(/_/g, ' ').toUpperCase();
};

const getStatusPillClass = (status?: string) => {
  switch (status) {
    case 'approved': return 'pill-green';
    case 'flagged': return 'pill-red';
    case 'pending_review': return 'pill-amber';
    default: return 'pill-muted';
  }
};

const formatType = (type: string) => {
  if (!type) return 'Security Event';
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const getSeverityLabel = (type: string) => {
  const highTypes = ['proxy_mismatch', 'multiple_faces', 'face_absent', 'devtools_open', 'mobile_phone_detected'];
  const medTypes = ['tab_switch', 'window_blur', 'fullscreen_exit', 'gaze_deviation'];
  if (highTypes.includes(type)) return 'High';
  if (medTypes.includes(type)) return 'Medium';
  return 'Low';
};

const getSeverityBadgeClass = (type: string) => {
  const s = getSeverityLabel(type);
  if (s === 'High') return 'badge-sev-high';
  if (s === 'Medium') return 'badge-sev-med';
  return 'badge-sev-low';
};

const getEventMarkerClass = (type: string) => {
  const s = getSeverityLabel(type);
  if (s === 'High') return 'marker-red';
  if (s === 'Medium') return 'marker-amber';
  return 'marker-slate';
};

onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await api.get(`/proctoring/admin/${attemptId}`);
    details.value = data.details || null;
    events.value = data.events || [];
  } catch (err) {
    console.error('Failed to load proctoring data', err);
  } finally {
    loading.value = false;
  }
};

const executeApprove = async () => {
  actionLoading.value = true;
  try {
    await api.post(`/proctoring/admin/${attemptId}/approve-certificate`);
    showApproveDialog.value = false;
    await loadData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to approve certificate');
  } finally {
    actionLoading.value = false;
  }
};

const executeFlag = async () => {
  actionLoading.value = true;
  try {
    const reason = flagReasonPreset.value === 'custom'
      ? (flagNotes.value.trim() || 'Flagged by auditor')
      : `${flagReasonPreset.value}: ${flagNotes.value.trim() || 'High severity violation confirmed'}`;
    await api.post(`/proctoring/admin/${attemptId}/flag-attempt`, { reason });
    showFlagDialog.value = false;
    await loadData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to flag attempt');
  } finally {
    actionLoading.value = false;
  }
};

const executeClear = async () => {
  actionLoading.value = true;
  try {
    await api.post(`/proctoring/admin/${attemptId}/clear-violations`);
    showClearDialog.value = false;
    await loadData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to clear violations');
  } finally {
    actionLoading.value = false;
  }
};

const executeDelete = async () => {
  actionLoading.value = true;
  try {
    await api.delete(`/proctoring/admin/attempt/${attemptId}`);
    showDeleteDialog.value = false;
    router.back();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to delete proctoring data');
  } finally {
    actionLoading.value = false;
  }
};
</script>

<style scoped>
.gsfin-admin-page {
  background: #F8FAFC;
  min-height: 100vh;
  padding: 24px;
}

.admin-wrap {
  max-width: 1400px;
  margin: 0 auto;
}

/* ═══ TOP NAV BAR ═══ */
.top-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
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
  gap: 8px;
  padding: 8px 14px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 10px;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}
.btn-back:hover {
  background: #F1F5F9;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.15);
}

.breadcrumb-trail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 600;
}
.bc-link {
  color: #64748B;
  text-decoration: none;
  transition: color 0.15s ease;
}
.bc-link:hover {
  color: #C9252C;
}
.bc-sep {
  color: #CBD5E1;
  font-size: 0.9rem;
}
.bc-current {
  color: #0F172A;
}

.btn-icon-refresh {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}
.btn-icon-refresh:hover:not(:disabled) {
  background: #F1F5F9;
  color: #0F172A;
}
.btn-icon-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ═══ ADMIN HEADER ROW ═══ */
.admin-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.sitting-type-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
}
.pill-subcenter {
  background: rgba(37, 99, 235, 0.08);
  color: #2563EB;
  border: 1px solid rgba(37, 99, 235, 0.2);
}
.pill-public {
  background: rgba(147, 51, 234, 0.08);
  color: #7C3AED;
  border: 1px solid rgba(147, 51, 234, 0.2);
}
.pill-divider {
  opacity: 0.5;
}

.batch-code-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: #F1F5F9;
  color: #475569;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
}

.result-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
}
.result-pass {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.25);
}
.result-fail {
  background: rgba(227, 27, 35, 0.1);
  color: #E31B23;
  border: 1px solid rgba(227, 27, 35, 0.25);
}

.eyebrow-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  background: rgba(227, 27, 35, 0.08);
  color: #E31B23;
  font-size: 0.68rem;
  font-weight: 600;
  border-radius: 6px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.admin-title {
  font-size: 1.55rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  letter-spacing: -0.02em;
}

.attempt-id-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  font-size: 0.74rem;
  color: #334155;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
}
.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  color: #64748B;
  display: flex;
  align-items: center;
  transition: color 0.15s ease;
}
.copy-btn:hover {
  color: #0F172A;
}

/* ═══ HEADER ACTIONS GROUP ═══ */
.header-actions-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* ═══ AUDIT DEDICATED TWO-COLUMN GRID ═══ */
.audit-layout-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 1024px) {
  .audit-layout-grid {
    grid-template-columns: 1fr;
  }
}

.audit-left-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.audit-right-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  border: none;
  white-space: nowrap;
}
.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-approve {
  background: #059669;
  color: #FFFFFF;
  box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);
}
.btn-approve:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);
}

.btn-flag {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FECACA;
}
.btn-flag:hover:not(:disabled) {
  background: #FEE2E2;
  color: #B91C1C;
  transform: translateY(-1px);
}

.btn-glass {
  background: #FFFFFF;
  color: #475569;
  border: 1px solid rgba(15, 23, 42, 0.1);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
}
.btn-glass:hover:not(:disabled) {
  background: #F1F5F9;
  color: #0F172A;
}

.btn-glass-danger {
  background: transparent;
  color: #94A3B8;
  border: 1px solid transparent;
}
.btn-glass-danger:hover:not(:disabled) {
  background: #FEF2F2;
  color: #DC2626;
  border-color: #FECACA;
}

/* ═══ PROXY ALERT BANNER ═══ */
.proxy-alert-banner {
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.alert-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #FEE2E2;
  color: #DC2626;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}
.alert-content {
  flex: 1;
  min-width: 250px;
}
.alert-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #991B1B;
  margin-bottom: 2px;
}
.alert-desc {
  font-size: 0.78rem;
  color: #B91C1C;
  line-height: 1.4;
}
.alert-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #DC2626;
  color: #FFFFFF;
  font-size: 0.68rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  letter-spacing: 0.05em;
}

/* ═══ PANEL SECTION CARD ═══ */
.panel-section-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02);
  overflow: hidden;
}

.section-card-header {
  padding: 16px 20px;
  background: #FFFFFF;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  flex-shrink: 0;
}

/* ═══ SELFIE FRAME ═══ */
.selfie-frame-wrap {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 14px;
  padding: 12px;
  text-align: center;
}
.selfie-preview-box {
  position: relative;
  display: inline-block;
  cursor: pointer;
  max-width: 240px;
  width: 100%;
}
.selfie-img {
  width: 100%;
  max-width: 240px;
  height: 190px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
  transition: transform 0.2s ease;
  display: block;
  margin: 0 auto;
}
.selfie-img:hover {
  transform: scale(1.02);
}
.selfie-zoom-hint {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4px);
  color: #FFFFFF;
  font-size: 0.65rem;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  pointer-events: none;
}
.selfie-tag-pill {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 50px;
  padding: 3px 10px;
  font-size: 0.68rem;
  font-weight: 600;
  color: #0F172A;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.selfie-placeholder-box {
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.placeholder-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(201, 37, 44, 0.08);
  color: #C9252C;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 600;
}
.placeholder-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* ═══ METADATA LIST ═══ */
.meta-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.meta-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.78rem;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.04);
}
.meta-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.meta-label {
  color: #64748B;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}
.meta-val {
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

/* ═══ MINI METRICS TILES ═══ */
.metric-mini-tile {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 12px;
  padding: 10px 14px;
}
.metric-mini-tile.tile-warning {
  background: #FEF2F2;
  border-color: #FECACA;
}
.metric-mini-num {
  font-size: 1.4rem;
  font-weight: 600;
  line-height: 1.1;
  font-family: monospace;
}
.metric-mini-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748B;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

/* ═══ STATUS PILLS ═══ */
.status-pill {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 50px;
  letter-spacing: 0.04em;
  display: inline-block;
}
.pill-green {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}
.pill-red {
  background: #FEF2F2;
  color: #DC2626;
}
.pill-amber {
  background: #FFFBEB;
  color: #D97706;
}
.pill-muted {
  background: #F1F5F9;
  color: #64748B;
}

/* ═══ VIEW MODE TOGGLE ═══ */
.view-mode-toggle {
  display: inline-flex;
  background: #F1F5F9;
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
}
.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.74rem;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #64748B;
  cursor: pointer;
  transition: all 0.15s ease;
}
.toggle-btn:hover {
  color: #0F172A;
}
.toggle-btn.active {
  background: #FFFFFF;
  color: #0F172A;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

/* ═══ CLEAN SESSION SHOWCASE ═══ */
.clean-session-showcase {
  padding: 40px 20px;
  text-align: center;
}
.clean-shield-ring {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #ECFDF5;
  border: 2px solid #A7F3D0;
  color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 16px auto;
  box-shadow: 0 6px 18px rgba(5, 150, 105, 0.12);
}
.checkpoint-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
}
.checkpoint-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

/* ═══ TIMELINE VIEW ═══ */
.timeline-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.timeline-item-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 16px;
  padding-top: 6px;
  flex-shrink: 0;
}
.marker-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #FFFFFF;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.1);
}
.marker-red {
  background: #EF4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}
.marker-amber {
  background: #F59E0B;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
}
.marker-slate {
  background: #64748B;
  box-shadow: 0 0 0 2px rgba(100, 116, 139, 0.2);
}
.marker-line {
  width: 2px;
  height: calc(100% + 16px);
  background: rgba(15, 23, 42, 0.08);
  margin-top: 4px;
}

.timeline-event-card {
  flex: 1;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 12px;
  padding: 12px 16px;
}
.event-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.event-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #0F172A;
}
.event-time {
  font-size: 0.72rem;
  color: #64748B;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-mono: true;
}

.severity-badge {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 50px;
  letter-spacing: 0.04em;
}
.badge-sev-high {
  background: #FEE2E2;
  color: #991B1B;
}
.badge-sev-med {
  background: #FEF3C7;
  color: #92400E;
}
.badge-sev-low {
  background: #F1F5F9;
  color: #475569;
}

.event-snapshot-thumb {
  position: relative;
  display: inline-block;
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.1);
  margin-top: 6px;
}
.thumb-img {
  width: 220px;
  height: 130px;
  object-fit: cover;
  display: block;
}
.thumb-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.74rem;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.event-snapshot-thumb:hover .thumb-overlay {
  opacity: 1;
}

.event-metadata-box {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  padding: 8px 12px;
  margin-top: 6px;
  font-size: 0.72rem;
  color: #334155;
  font-family: monospace;
  overflow-x: auto;
}

/* ═══ SNAPSHOT GALLERY GRID ═══ */
.gallery-snapshot-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
  transition: all 0.15s ease;
}
.gallery-snapshot-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
  border-color: rgba(201, 37, 44, 0.2);
}
.gallery-img-wrap {
  position: relative;
  width: 100%;
  height: 130px;
  background: #0F172A;
}
.gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.gallery-zoom-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.7);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}
.gallery-card-body {
  padding: 10px 12px;
}
.severity-badge-sm {
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 4px;
}

/* ═══ MODAL STYLES ═══ */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.modal-dialog-box {
  background: #FFFFFF;
  border-radius: 18px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
  width: 100%;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
}
.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.btn-close-modal {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #F1F5F9;
  border: none;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-close-modal:hover {
  background: #E2E8F0;
  color: #0F172A;
}
.modal-body {
  padding: 20px;
}
.modal-footer {
  padding: 14px 20px;
  background: #F8FAFC;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}
.btn-modal-cancel {
  padding: 8px 16px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 10px;
  color: #64748B;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-modal-cancel:hover {
  background: #F1F5F9;
  color: #0F172A;
}
.btn-modal-confirm {
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: all 0.15s ease;
}
.btn-modal-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-select-sm, .form-textarea-sm {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 0.8rem;
  color: #0F172A;
  outline: none;
  transition: border-color 0.15s ease;
}
.form-select-sm:focus, .form-textarea-sm:focus {
  border-color: #C9252C;
}

/* ═══ PREVIEW MODAL ═══ */
.preview-dialog-box {
  position: relative;
  max-width: 900px;
  max-height: 90vh;
  background: #000000;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}
.preview-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  border: none;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  z-index: 10;
  transition: all 0.15s ease;
}
.preview-close-btn:hover {
  background: rgba(255, 255, 255, 0.4);
}
.preview-full-img {
  max-width: 100%;
  max-height: 85vh;
  display: block;
  object-fit: contain;
}

/* ═══ SPINNER ═══ */
.spinner-sm-red {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 2px solid rgba(201, 37, 44, 0.2);
  border-top-color: #C9252C;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.spin-icon {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
