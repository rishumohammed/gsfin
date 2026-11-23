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
            <NuxtLink to="/dashboard/admin/proctoring" class="bc-link">Proctoring Governance</NuxtLink>
            <i class="mdi mdi-chevron-right bc-sep"></i>
            <span class="bc-link text-slate-600">{{ details?.exam_title || 'Examination' }}</span>
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
          <h1 class="admin-title">AI Proctoring Audit Review</h1>
          <div class="flex items-center gap-2.5 mt-1.5 flex-wrap">
            <span class="attempt-id-chip">
              <span class="text-slate-400 font-sans">Attempt ID:</span>
              <code class="font-mono">{{ attemptId }}</code>
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
              <div class="section-header-title-wrap">
                <div class="section-icon-box biometric-header-icon">
                  <i class="mdi mdi-card-account-details-outline"></i>
                </div>
                <div>
                  <h3 class="section-heading">Candidate Biometric Baseline</h3>
                  <p class="section-subheading">Identity verification &amp; webcam telemetry</p>
                </div>
              </div>
            </div>

            <div class="baseline-card-body">
              <!-- Registered Selfie Photo Frame -->
              <div class="selfie-frame-wrap">
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
                    <span class="placeholder-title">No Biometric Photo Stored</span>
                    <span class="placeholder-desc">Baseline was captured via anonymous or direct session</span>
                  </div>
                </div>
              </div>

              <!-- Candidate Metadata Key-Values Container -->
              <div class="meta-list-card">
                <div class="meta-row">
                  <span class="meta-label">
                    <i class="mdi mdi-account-outline"></i> Candidate Name
                  </span>
                  <span class="meta-val font-semibold">
                    {{ details?.candidate_name || 'Candidate' }}
                  </span>
                </div>

                <div class="meta-row">
                  <span class="meta-label">
                    <i class="mdi mdi-email-outline"></i> Candidate Email
                  </span>
                  <span class="meta-val text-muted">
                    {{ details?.candidate_email || 'No email recorded' }}
                  </span>
                </div>

                <div v-if="details?.candidate_phone" class="meta-row">
                  <span class="meta-label">
                    <i class="mdi mdi-phone-outline"></i> Contact Phone
                  </span>
                  <span class="meta-val font-mono">
                    {{ details.candidate_phone }}
                  </span>
                </div>

                <div class="meta-row">
                  <span class="meta-label">
                    <i class="mdi mdi-file-certificate-outline"></i> Examination
                  </span>
                  <span class="meta-val font-semibold">
                    {{ details?.exam_title || 'Certification Exam Sitting' }}
                  </span>
                </div>

                <div v-if="details?.is_subcenter" class="meta-row">
                  <span class="meta-label">
                    <i class="mdi mdi-domain"></i> Testing Center
                  </span>
                  <span class="meta-val">
                    {{ details?.org_name || 'Authorized Testing Center' }}
                  </span>
                </div>

                <div v-if="details?.batch_code" class="meta-row">
                  <span class="meta-label">
                    <i class="mdi mdi-tag-outline"></i> Batch Code
                  </span>
                  <span class="meta-val font-mono">
                    {{ details.batch_code }}
                  </span>
                </div>

                <div v-if="details?.result" class="meta-row">
                  <span class="meta-label">
                    <i class="mdi mdi-trophy-outline"></i> Exam Result
                  </span>
                  <span class="meta-val">
                    <span :class="['result-pill', details.result === 'pass' ? 'result-pass' : 'result-fail']">
                      <i :class="['mdi', details.result === 'pass' ? 'mdi-check-circle' : 'mdi-close-circle']"></i>
                      <span>{{ details.result === 'pass' ? 'PASSED' : 'FAILED' }}</span>
                    </span>
                  </span>
                </div>

                <div class="meta-row">
                  <span class="meta-label">
                    <i class="mdi mdi-shield-check-outline"></i> Audit Status
                  </span>
                  <span class="meta-val">
                    <span :class="['status-pill', getStatusPillClass(details?.proctoring_status)]">
                      {{ formatStatus(details?.proctoring_status || 'pending_review') }}
                    </span>
                  </span>
                </div>

                <div v-if="details?.started_at" class="meta-row">
                  <span class="meta-label">
                    <i class="mdi mdi-clock-outline"></i> Started At
                  </span>
                  <span class="meta-val text-muted font-tabular">
                    {{ formatDate(details.started_at) }}
                  </span>
                </div>

                <div v-if="details?.submitted_at" class="meta-row">
                  <span class="meta-label">
                    <i class="mdi mdi-clock-check-outline"></i> Submitted At
                  </span>
                  <span class="meta-val text-muted font-tabular">
                    {{ formatDate(details.submitted_at) }}
                  </span>
                </div>
              </div>

              <!-- Integrity & Severity Mini KPI Cards -->
              <div class="mini-kpi-grid">
                <div class="mini-kpi-card">
                  <div class="mini-kpi-num">{{ events.length }}</div>
                  <div class="mini-kpi-label">
                    <i class="mdi mdi-shield-search-outline"></i> Logged Events
                  </div>
                </div>

                <div class="mini-kpi-card" :class="{ 'is-danger': highSeverityCount > 0 }">
                  <div class="mini-kpi-num">{{ highSeverityCount }}</div>
                  <div class="mini-kpi-label">
                    <i class="mdi mdi-alert-octagon-outline"></i> High Severity
                  </div>
                </div>
              </div>

              <!-- Trust / Integrity Score Card with Progress Bar -->
              <div class="integrity-card" :class="integrityToneClass">
                <div class="integrity-card-top">
                  <div class="integrity-icon-wrap">
                    <i :class="['mdi', integrityIconName]"></i>
                  </div>
                  <div class="integrity-info">
                    <div class="integrity-title">{{ integrityTitle }}</div>
                    <div class="integrity-subtitle">{{ integritySubtitle }}</div>
                  </div>
                  <div class="integrity-score-pill">
                    {{ integrityPercent }}
                  </div>
                </div>
                <div class="integrity-progress-track">
                  <div class="integrity-progress-fill" :style="{ width: integrityPercent }"></div>
                </div>
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
            <div class="section-card-header">
              <div class="section-header-title-wrap">
                <div class="section-icon-box evidence-header-icon">
                  <i class="mdi mdi-shield-search-outline"></i>
                </div>
                <div>
                  <h3 class="section-heading">Violation Events &amp; Snapshot Evidence</h3>
                  <p class="section-subheading">Proctoring telemetry recorded during candidate's sitting</p>
                </div>
              </div>

              <!-- Segmented View Mode Toggle -->
              <div class="view-mode-toggle">
                <button
                  type="button"
                  class="toggle-btn"
                  :class="{ 'is-active': viewMode === 'timeline' }"
                  @click="viewMode = 'timeline'"
                >
                  <i class="mdi mdi-timeline-clock-outline"></i>
                  <span>Timeline View</span>
                  <span class="toggle-count" :class="{ 'count-active': viewMode === 'timeline' }">{{ events.length }}</span>
                </button>
                <button
                  type="button"
                  class="toggle-btn"
                  :class="{ 'is-active': viewMode === 'grid' }"
                  @click="viewMode = 'grid'"
                >
                  <i class="mdi mdi-grid"></i>
                  <span>Snapshot Gallery</span>
                  <span class="toggle-count" :class="{ 'count-active': viewMode === 'grid' }">{{ eventsWithScreenshots.length }}</span>
                </button>
              </div>
            </div>

            <!-- Body Area -->
            <div class="evidence-body-wrap">

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
                <div class="checkpoints-grid">
                  <div class="checkpoint-card">
                    <div class="checkpoint-icon">
                      <i class="mdi mdi-face-recognition"></i>
                    </div>
                    <div>
                      <div class="checkpoint-title">Biometric Continuity</div>
                      <div class="checkpoint-desc">Continuous single-face visual tracking; no proxy deviation.</div>
                    </div>
                  </div>

                  <div class="checkpoint-card">
                    <div class="checkpoint-icon">
                      <i class="mdi mdi-fullscreen"></i>
                    </div>
                    <div>
                      <div class="checkpoint-title">Fullscreen Focus</div>
                      <div class="checkpoint-desc">Zero tab switches, background minimizations, or window blurs.</div>
                    </div>
                  </div>

                  <div class="checkpoint-card">
                    <div class="checkpoint-icon">
                      <i class="mdi mdi-camera-lock-outline"></i>
                    </div>
                    <div>
                      <div class="checkpoint-title">Video Telemetry</div>
                      <div class="checkpoint-desc">Active webcam stream verified throughout entire examination.</div>
                    </div>
                  </div>

                  <div class="checkpoint-card">
                    <div class="checkpoint-icon">
                      <i class="mdi mdi-code-tags-check"></i>
                    </div>
                    <div>
                      <div class="checkpoint-title">Browser Security</div>
                      <div class="checkpoint-desc">No developer tools or DOM inspection events triggered.</div>
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

const integrityToneClass = computed(() => {
  if (events.value.length === 0) return 'tone-success';
  if (highSeverityCount.value > 0) return 'tone-danger';
  return 'tone-warning';
});

const integrityIconName = computed(() => {
  if (events.value.length === 0) return 'mdi-shield-check';
  if (highSeverityCount.value > 0) return 'mdi-shield-alert';
  return 'mdi-shield-outline';
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
  if (path.startsWith('http')) return path;
  const config = useRuntimeConfig();
  return `${config.public.apiBase.replace('/api', '')}${path}`;
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

.eyebrow-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  background: rgba(201, 37, 44, 0.08);
  color: #C9252C;
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
  grid-template-columns: 390px 1fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 1100px) {
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
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
  overflow: hidden;
}

.section-card-header {
  padding: 18px 24px;
  background: #FFFFFF;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

@media (max-width: 768px) {
  .section-card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

.section-header-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.evidence-header-icon {
  background: #FEF2F2 !important;
  color: #E31B23 !important;
  border: 1px solid rgba(227, 27, 35, 0.2);
}

.biometric-header-icon {
  background: #FEF2F2 !important;
  color: #E31B23 !important;
  border: 1px solid rgba(227, 27, 35, 0.2);
}

.section-heading {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  line-height: 1.3;
}

.section-subheading {
  font-size: 0.74rem;
  color: #64748B;
  margin: 2px 0 0 0;
  line-height: 1.35;
}

.baseline-card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.evidence-body-wrap {
  padding: 24px;
}

/* ═══ SELFIE FRAME (GSFIN RED ACCENTS) ═══ */
.selfie-frame-wrap {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  padding: 16px;
  text-align: center;
}

.selfie-preview-box {
  position: relative;
  display: inline-block;
  cursor: pointer;
  max-width: 250px;
  width: 100%;
}

.selfie-img {
  width: 100%;
  max-width: 250px;
  height: 190px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
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
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  color: #FFFFFF;
  font-size: 0.65rem;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.selfie-placeholder-box {
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.placeholder-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #FEF2F2;
  color: #E31B23;
  border: 2px solid rgba(227, 27, 35, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(227, 27, 35, 0.08);
}

.placeholder-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.placeholder-title {
  font-size: 0.84rem;
  font-weight: 600;
  color: #0F172A;
}

.placeholder-desc {
  font-size: 0.72rem;
  color: #64748B;
  line-height: 1.35;
  max-width: 240px;
}

/* ═══ METADATA STRUCTURED LIST CARD ═══ */
.meta-list-card {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  overflow: hidden;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 13px;
  font-size: 0.76rem;
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
}

.meta-row:last-child {
  border-bottom: none;
}

.meta-label {
  color: #64748B;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-weight: 500;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.meta-label i {
  font-size: 0.95rem;
  color: #94A3B8;
}

.meta-val {
  text-align: right;
  color: #0F172A;
  font-weight: 600;
  max-width: 62%;
  word-break: break-word;
}

.meta-val.text-muted {
  color: #64748B;
  font-weight: 500;
}

.meta-val.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.72rem;
}

.meta-val.font-tabular {
  font-variant-numeric: tabular-nums;
  font-size: 0.72rem;
}

/* ═══ MINI METRICS KPI TILES ═══ */
.mini-kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.mini-kpi-card {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  transition: all 0.15s ease;
}

.mini-kpi-card.is-danger {
  background: #FEF2F2;
  border-color: rgba(227, 27, 35, 0.25);
}

.mini-kpi-num {
  font-size: 1.35rem;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.mini-kpi-card.is-danger .mini-kpi-num {
  color: #E31B23;
}

.mini-kpi-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748B;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
}

.mini-kpi-label i {
  font-size: 0.9rem;
  color: #64748B;
}

.mini-kpi-card.is-danger .mini-kpi-label,
.mini-kpi-card.is-danger .mini-kpi-label i {
  color: #E31B23;
}

/* ═══ STATUS PILLS ═══ */
.status-pill {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 50px;
  letter-spacing: 0.04em;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.pill-green {
  background: #ECFDF5;
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.pill-red {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid rgba(220, 38, 38, 0.2);
}

.pill-amber {
  background: #FFFBEB;
  color: #D97706;
  border: 1px solid rgba(217, 119, 6, 0.2);
}

.pill-muted {
  background: #F1F5F9;
  color: #64748B;
  border: 1px solid rgba(100, 116, 139, 0.15);
}

/* ═══ TRUST / INTEGRITY SCORE CARD ═══ */
.integrity-card {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.integrity-card.tone-success {
  background: #F0FDF4;
  border-color: rgba(16, 185, 129, 0.25);
}

.integrity-card.tone-warning {
  background: #FFFBEB;
  border-color: rgba(245, 158, 11, 0.25);
}

.integrity-card.tone-danger {
  background: #FEF2F2;
  border-color: rgba(227, 27, 35, 0.25);
}

.integrity-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.integrity-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  flex-shrink: 0;
}

.tone-success .integrity-icon-wrap {
  background: #DCFCE7;
  color: #059669;
}

.tone-warning .integrity-icon-wrap {
  background: #FEF3C7;
  color: #D97706;
}

.tone-danger .integrity-icon-wrap {
  background: #FEE2E2;
  color: #E31B23;
}

.integrity-info {
  flex: 1;
  min-width: 0;
}

.integrity-title {
  font-size: 0.78rem;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.25;
}

.integrity-subtitle {
  font-size: 0.69rem;
  color: #64748B;
  margin-top: 2px;
  line-height: 1.3;
}

.integrity-score-pill {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.tone-success .integrity-score-pill {
  background: #DCFCE7;
  color: #059669;
}

.tone-warning .integrity-score-pill {
  background: #FEF3C7;
  color: #D97706;
}

.tone-danger .integrity-score-pill {
  background: #FEE2E2;
  color: #E31B23;
}

.integrity-progress-track {
  height: 5px;
  background: rgba(15, 23, 42, 0.08);
  border-radius: 10px;
  overflow: hidden;
}

.tone-success .integrity-progress-fill {
  height: 100%;
  background: #059669;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.tone-warning .integrity-progress-fill {
  height: 100%;
  background: #D97706;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.tone-danger .integrity-progress-fill {
  height: 100%;
  background: #E31B23;
  border-radius: 10px;
  transition: width 0.3s ease;
}

/* ═══ VIEW MODE TOGGLE (GSFIN SEGMENTED CONTROL) ═══ */
.view-mode-toggle {
  display: inline-flex;
  align-items: center;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 10px;
  padding: 3px;
  gap: 3px;
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.76rem;
  font-weight: 600;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: #64748B;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.toggle-btn:hover {
  color: #0F172A;
}

.toggle-btn.is-active {
  background: #FFFFFF;
  color: #0F172A;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}

.toggle-count {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 10px;
  background: #E2E8F0;
  color: #475569;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.toggle-count.count-active {
  background: #FEF2F2;
  color: #E31B23;
}

/* ═══ CLEAN SESSION SHOWCASE ═══ */
.clean-session-showcase {
  padding: 36px 20px;
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

/* ═══ CHECKPOINTS GRID (IN CLEAN SESSION SHOWCASE) ═══ */
.checkpoints-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  max-width: 620px;
  margin: 0 auto;
  text-align: left;
}

@media (max-width: 640px) {
  .checkpoints-grid {
    grid-template-columns: 1fr;
  }
}

.checkpoint-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
}

.checkpoint-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: #ECFDF5;
  color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  flex-shrink: 0;
}

.checkpoint-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.25;
}

.checkpoint-desc {
  font-size: 0.72rem;
  color: #64748B;
  margin-top: 2px;
  line-height: 1.35;
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
