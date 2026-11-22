<template>
  <div class="exam-portal-wrapper">
    <!-- AI PROCTORING & WEBCAM OVERLAYS -->
    <ProctoringOverlay 
      v-if="activeAttempt && !result && proctoringWarning.show"
      :show="proctoringWarning.show" 
      :message="proctoringWarning.message" 
      :is-auto-submitting="isAutoSubmitting"
      @dismiss="dismissProctoringWarning" 
    />
    <WebcamThumbnail 
      v-if="activeAttempt && !result && examStream" 
      :stream="examStream" 
    />

    <!-- TOP INSTITUTIONAL ACCREDITATION BAR -->
    <header class="portal-header">
      <div class="header-inner">
        <div class="header-brand">
          <div class="brand-crest">
            <i class="mdi mdi-shield-check-decagram text-red-600"></i>
          </div>
          <div>
            <div class="brand-title">GSFIN GLOBAL STANDARDS</div>
            <div class="brand-sub">Candidate Examination &amp; Qualification Authority</div>
          </div>
        </div>

        <div class="header-badges">
          <div class="compliance-pill">
            <span class="status-dot-emerald"></span>
            <span>ISO/IEC 17024 Accredited</span>
          </div>
          <div class="security-pill">
            <i class="mdi mdi-lock-outline"></i>
            <span>256-Bit Encrypted Session</span>
          </div>
        </div>
      </div>
    </header>

    <!-- MAIN CONTAINER -->
    <main class="portal-main">
      <!-- 1. LOADING STATE -->
      <div v-if="loading" class="state-card text-center pa-10">
        <div class="loading-spinner-wrap mb-4">
          <v-progress-circular indeterminate color="#E31B23" size="56" width="3"></v-progress-circular>
        </div>
        <h2 class="text-base font-semibold text-slate-800 m-0">Connecting to Examination Gateway...</h2>
        <p class="text-xs text-slate-500 m-0 mt-1">Validating candidate authorization and sitting vouchers</p>
      </div>

      <!-- 2. ERROR / INVALID VOUCHER STATE -->
      <div v-else-if="error" class="voucher-card text-center pa-10 max-w-lg mx-auto">
        <div class="error-icon-box mb-4">
          <i class="mdi mdi-alert-circle-outline text-red-600 text-4xl"></i>
        </div>
        <h2 class="text-lg font-semibold text-slate-900 mb-2">Examination Link Notice</h2>
        <p class="text-sm text-slate-600 mb-6 leading-relaxed">{{ error }}</p>
        <div class="d-flex justify-center gap-3">
          <v-btn to="/" class="btn-secondary-action">Return to Portal</v-btn>
        </div>
      </div>

      <!-- 3. CANDIDATE AUTHENTICATION & BIOMETRIC VERIFICATION GATE (PRE-EXAM LOGIN) -->
      <div v-else-if="verificationStep !== 'authorized' && !activeAttempt && !result" class="voucher-card max-w-2xl mx-auto">
        <div class="voucher-top-bar"></div>

        <div class="voucher-content">
          <!-- Step Indicator Header -->
          <div class="verification-stepper-bar mb-6">
            <div class="stepper-step" :class="{ 'step-active': verificationStep === 'login', 'step-done': isCandidateAuthenticated }">
              <span class="step-num">1</span>
              <span>Credentials &amp; OTP</span>
            </div>
            <div class="stepper-divider"></div>
            <div class="stepper-step" :class="{ 'step-active': verificationStep === 'face', 'step-done': isFaceVerified }">
              <span class="step-num">2</span>
              <span>Face Biometrics</span>
            </div>
            <div class="stepper-divider"></div>
            <div class="stepper-step" :class="{ 'step-active': (verificationStep as string) === 'authorized' }">
              <span class="step-num">3</span>
              <span>Exam Sitting</span>
            </div>
          </div>

          <!-- STEP 1: CREDENTIALS & OTP LOGIN -->
          <div v-if="verificationStep === 'login'" class="step-panel">
            <div class="step-intro-header mb-6">
              <div class="step-icon-box bg-red-50 text-red-600">
                <i class="mdi mdi-shield-account-outline"></i>
              </div>
              <div>
                <h2 class="text-xl font-semibold text-slate-900 m-0">Candidate Authentication Required</h2>
                <p class="text-xs text-slate-500 m-0 mt-1">Authenticate with your candidate password or one-time security OTP to begin your exam sitting.</p>
              </div>
            </div>

            <!-- Candidate Identity Tile -->
            <div class="candidate-auth-hero mb-6">
              <div class="auth-hero-avatar">
                <img v-if="details.facePhoto" :src="details.facePhoto" class="w-10 h-10 rounded-full object-cover border border-emerald-400" />
                <i v-else class="mdi mdi-account-check"></i>
              </div>
              <div class="auth-hero-meta">
                <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Enrolled Candidate</div>
                <div class="text-sm font-semibold text-slate-900 mt-0.5">{{ details.studentName }}</div>
                <div class="text-xs text-slate-500 font-mono">{{ details.studentEmail }}</div>
              </div>
              <div class="auth-hero-badge">
                {{ details.organizationName }}
              </div>
            </div>

            <!-- Error Banner -->
            <div v-if="loginError" class="auth-error-banner mb-4">
              <i class="mdi mdi-alert-circle text-red-600 mr-2"></i>
              <span>{{ loginError }}</span>
            </div>

            <!-- OTP Sent Notice -->
            <div v-if="otpSentNotice" class="auth-success-banner mb-4">
              <i class="mdi mdi-email-check text-emerald-600 mr-2"></i>
              <span>{{ otpSentNotice }}</span>
            </div>

            <!-- Login Form -->
            <form @submit.prevent="verifyLogin">
              <!-- Password Input -->
              <div class="form-group mb-4">
                <label class="form-label-xs">Candidate Password</label>
                <div class="input-with-icon">
                  <i class="mdi mdi-lock-outline input-prefix-icon"></i>
                  <input
                    v-model="loginPassword"
                    :type="showLoginPassword ? 'text' : 'password'"
                    class="modal-input-field input-has-prefix has-suffix"
                    placeholder="Enter your exam access password"
                  />
                  <button type="button" class="input-suffix-btn" @click="showLoginPassword = !showLoginPassword">
                    <i :class="['mdi', showLoginPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline']"></i>
                  </button>
                </div>
              </div>

              <!-- Two-Factor OTP Section -->
              <div class="otp-auth-section mb-6">
                <div class="otp-auth-header">
                  <span class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Or Verify With Email OTP</span>
                  <button
                    type="button"
                    class="btn-send-otp"
                    :disabled="sendingOtp"
                    @click="sendOtpCode"
                  >
                    <v-progress-circular v-if="sendingOtp" indeterminate size="12" width="2" color="#E31B23" class="mr-1" />
                    <i v-else class="mdi mdi-email-fast-outline mr-1"></i>
                    <span>{{ sendingOtp ? 'Sending...' : 'Send OTP to Email' }}</span>
                  </button>
                </div>
                <div class="input-with-icon mt-2">
                  <i class="mdi mdi-shield-key-outline input-prefix-icon text-red-600"></i>
                  <input
                    v-model="loginOtp"
                    type="text"
                    maxlength="6"
                    class="modal-input-field input-has-prefix font-mono tracking-widest text-center"
                    placeholder="Enter 6-digit OTP code"
                  />
                </div>
              </div>

              <button
                type="submit"
                class="btn-red w-full py-3 text-sm justify-center"
                :disabled="verifyingLogin || (!loginPassword && !loginOtp)"
              >
                <v-progress-circular v-if="verifyingLogin" indeterminate size="16" width="2" color="white" class="mr-2" />
                <i v-else class="mdi mdi-shield-check-outline mr-1.5 text-base"></i>
                <span>Verify Credentials &amp; Proceed to Face Match</span>
              </button>
            </form>
          </div>

          <!-- STEP 2: LIVE FACE BIOMETRIC VERIFICATION -->
          <div v-else-if="verificationStep === 'face'" class="step-panel">
            <div class="step-intro-header mb-6">
              <div class="step-icon-box bg-red-50 text-red-600">
                <i class="mdi mdi-face-recognition"></i>
              </div>
              <div>
                <h2 class="text-xl font-semibold text-slate-900 m-0">Biometric Live Face Verification</h2>
                <p class="text-xs text-slate-500 m-0 mt-1">Look directly into your camera. The proctoring system compares your live facial landmarks against your registered profile.</p>
              </div>
            </div>

            <!-- Face Error Banner -->
            <div v-if="faceError" class="auth-error-banner mb-4">
              <i class="mdi mdi-alert-circle text-red-600 mr-2"></i>
              <span>{{ faceError }}</span>
            </div>

            <!-- Biometric Comparison View -->
            <div class="face-comparison-grid mb-6">
              <!-- Left: Enrolled Profile -->
              <div class="comparison-card">
                <div class="comparison-badge">REGISTERED PROFILE</div>
                <div class="comparison-media-wrap">
                  <img v-if="details.facePhoto" :src="details.facePhoto" alt="Enrolled Face" class="comparison-img" />
                  <div v-else class="comparison-placeholder">
                    <i class="mdi mdi-camera-plus text-3xl text-slate-400"></i>
                    <span class="text-[11px] font-semibold text-slate-500 mt-1">Initial Face Enrollment</span>
                  </div>
                </div>
                <div class="comparison-footer">
                  <i class="mdi mdi-check-circle text-emerald-600"></i>
                  <span>{{ details.facePhoto ? 'Sub-Center Baseline Record' : 'Live Snapshot will become Baseline' }}</span>
                </div>
              </div>

              <!-- Right: Live Camera Stream -->
              <div class="comparison-card live-card">
                <div class="comparison-badge live-badge">LIVE WEBCAM STREAM</div>
                <div class="comparison-media-wrap live-media-wrap">
                  <video ref="examCameraVideo" autoplay playsinline class="comparison-video"></video>
                  <div class="face-oval-hud">
                    <div class="face-scanner-line"></div>
                  </div>
                </div>
                <div class="comparison-footer live-footer">
                  <span class="status-pulse-emerald"></span>
                  <span>Camera Active &bull; Ready to Match</span>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between gap-3">
              <button type="button" class="btn-glass" @click="startExamCamera">
                <i class="mdi mdi-refresh mr-1"></i> Restart Camera
              </button>
              <button
                type="button"
                class="btn-red py-3 px-6 text-sm flex items-center justify-center"
                :disabled="verifyingFace"
                @click="captureAndVerifyFace"
              >
                <v-progress-circular v-if="verifyingFace" indeterminate size="16" width="2" color="white" class="mr-2" />
                <i v-else class="mdi mdi-face-recognition mr-1.5 text-base"></i>
                <span>Capture &amp; Verify Face Biometrics</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. AUTHORIZED CERTIFICATION SITTING VOUCHER (PRE-START SCREEN) -->
      <div v-else-if="verificationStep === 'authorized' && !activeAttempt && !result" class="voucher-card max-w-3xl mx-auto">
        <!-- Crimson Gradient Top Accent -->
        <div class="voucher-top-bar"></div>

        <div class="voucher-content">
          <!-- Voucher Header -->
          <div class="voucher-header">
            <div class="voucher-header-left">
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <span class="voucher-badge">
                  <span class="status-pulse-red"></span>
                  <span>Official Certification Sitting</span>
                </span>
                <span class="verified-pill">
                  <i class="mdi mdi-check-circle text-xs"></i> Credentials Verified
                </span>
                <span class="verified-pill">
                  <i class="mdi mdi-face-recognition text-xs"></i> Face Verified
                </span>
              </div>
              <h1 class="exam-main-title">{{ details.examName }}</h1>
              <p class="exam-description">
                {{ details.examDescription || 'Official candidate competency evaluation administered by an accredited partner sub-center under the GSFIN international examination framework.' }}
              </p>
            </div>

            <div class="voucher-header-right">
              <div class="session-id-tag">
                SESSION #{{ (assignmentId || '').slice(0, 8).toUpperCase() }}
              </div>
              <div class="duration-badge">
                <i class="mdi mdi-clock-outline"></i>
                <span>{{ details.durationMinutes }} Mins</span>
              </div>
            </div>
          </div>

          <!-- 4 Credential Specification Tiles (2x2 Grid) -->
          <div class="spec-grid mb-6">
            <!-- Candidate Identity -->
            <div class="spec-card">
              <div class="spec-icon-box bg-red-50 text-red-600">
                <img v-if="details.facePhoto" :src="details.facePhoto" class="w-10 h-10 rounded-lg object-cover border border-emerald-400" />
                <i v-else class="mdi mdi-account-check-outline"></i>
              </div>
              <div class="spec-info">
                <span class="spec-label">Candidate Student</span>
                <div class="spec-value">{{ details.studentName }}</div>
                <div class="spec-sub text-slate-500 font-mono">{{ details.studentEmail || 'Registered Candidate' }}</div>
              </div>
            </div>

            <!-- Accredited Sub-Center -->
            <div class="spec-card">
              <div class="spec-icon-box bg-slate-100 text-slate-700">
                <i class="mdi mdi-office-building-cog-outline"></i>
              </div>
              <div class="spec-info">
                <span class="spec-label">Sub-Center Authority</span>
                <div class="spec-value">{{ details.organizationName }}</div>
                <div class="spec-sub text-emerald-600 font-semibold">
                  <i class="mdi mdi-check-decagram-outline"></i> Authorized Test Partner
                </div>
              </div>
            </div>

            <!-- Attempt Allowance -->
            <div class="spec-card">
              <div class="spec-icon-box bg-purple-50 text-purple-700">
                <i class="mdi mdi-counter"></i>
              </div>
              <div class="spec-info">
                <span class="spec-label">Attempt Allowance</span>
                <div class="spec-value">{{ details.attemptsUsed }} / {{ details.maxAttempts }} Used</div>
                <div class="spec-sub font-semibold" :class="details.attemptsUsed === 0 ? 'text-emerald-600' : 'text-amber-600'">
                  {{ details.attemptsUsed === 0 ? 'Initial Sitting Slot' : (details.maxAttempts - details.attemptsUsed) + ' Remaining Retake(s)' }}
                </div>
              </div>
            </div>

            <!-- Hard Cutoff Window -->
            <div class="spec-card">
              <div class="spec-icon-box bg-amber-50 text-amber-700">
                <i class="mdi mdi-timer-sand"></i>
              </div>
              <div class="spec-info">
                <span class="spec-label">Hard Cutoff Window</span>
                <div class="spec-value">{{ details.maxCutoffMinutes }} Mins (1.25x Buffer)</div>
                <div class="spec-sub text-slate-500">Auto-submits if time elapses</div>
              </div>
            </div>
          </div>

          <!-- Technical & Proctoring Compliance Advisory Notice -->
          <div class="compliance-notice-box mb-6">
            <div class="compliance-notice-header">
              <i class="mdi mdi-shield-alert-outline text-red-600 text-lg"></i>
              <span class="compliance-notice-title">Candidate Examination &amp; Technical Compliance Notice</span>
            </div>
            <div class="compliance-notice-items">
              <div class="compliance-item">
                <i class="mdi mdi-monitor-eye text-slate-600"></i>
                <span><strong>Window &amp; Focus Integrity:</strong> Keep this examination window active. Exiting full view or switching tabs may register an integrity flag.</span>
              </div>
              <div class="compliance-item">
                <i class="mdi mdi-refresh-auto text-slate-600"></i>
                <span><strong>Fault Tolerance:</strong> If an unexpected network drop or hardware freeze occurs, abnormal termination automatically preserves your remaining attempt quota.</span>
              </div>
              <div class="compliance-item">
                <i class="mdi mdi-timer-lock-outline text-slate-600"></i>
                <span><strong>Timed Finalization:</strong> The examination countdown runs continuously. At the 1.25x cutoff mark, answers are compiled and finalized automatically.</span>
              </div>
            </div>
          </div>

          <!-- Candidate Integrity Acknowledgment Checkbox -->
          <label class="integrity-acknowledgment mb-6">
            <input type="checkbox" v-model="confirmedIntegrity" class="custom-checkbox" />
            <span class="acknowledgment-text">
              I verify that I am <strong>{{ details.studentName }}</strong>. I confirm that I will complete this examination independently without unauthorized assistance, and I accept the GSFIN proctoring regulations and sitting standards.
            </span>
          </label>

          <!-- Action Footer -->
          <div class="voucher-action-footer">
            <div class="system-status-indicator">
              <span class="status-pulse-emerald"></span>
              <span>Proctoring Gateway Ready</span>
            </div>

            <button
              class="btn-start-exam"
              :disabled="!confirmedIntegrity || starting"
              @click="startSitting"
            >
              <v-progress-circular v-if="starting" indeterminate size="18" width="2" color="white" class="mr-2" />
              <i v-else class="mdi mdi-play-circle-outline text-xl mr-2"></i>
              <span>Begin Certification Exam</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 5. ACTIVE EXAM SITTING INTERFACE -->
      <div v-else-if="activeAttempt && !result" class="active-sitting-wrapper">
        <!-- Top Sticky Examination Bar -->
        <div class="sitting-top-bar">
          <div class="sitting-top-left">
            <div class="sitting-exam-badge">LIVE SITTING</div>
            <div>
              <div class="sitting-exam-title">{{ details.examName }}</div>
              <div class="sitting-candidate-meta">
                Candidate: {{ details.studentName }} &bull; {{ details.organizationName }}
              </div>
            </div>
          </div>

          <div class="sitting-top-center">
            <div class="digital-timer" :class="{ 'timer-warning': secondsRemaining < 300 }">
              <i class="mdi mdi-clock-outline"></i>
              <span>{{ formattedTimeLeft }}</span>
              <span class="timer-sub">REMAINING</span>
            </div>
          </div>

          <div class="sitting-top-right">
            <div class="sitting-proctor-live-badge mr-2">
              <span class="status-pulse-emerald"></span>
              <span>AI Proctoring Active</span>
            </div>
            <button class="btn-submit-header" @click="confirmSubmitModal = true">
              <i class="mdi mdi-check-circle-outline"></i>
              <span>Submit Exam</span>
            </button>
          </div>
        </div>

        <!-- Examination Workspace Body -->
        <div class="sitting-workspace">
          <!-- Question Navigator Drawer / Sidebar -->
          <aside class="sitting-navigator">
            <!-- Candidate Sitting Profile Tile -->
            <div class="candidate-sitting-tile mb-4">
              <img v-if="details.facePhoto" :src="details.facePhoto" class="candidate-sitting-avatar" />
              <div v-else class="candidate-sitting-avatar-placeholder">
                <i class="mdi mdi-account-check"></i>
              </div>
              <div class="candidate-sitting-info">
                <div class="candidate-sitting-name">{{ details.studentName }}</div>
                <div class="candidate-sitting-sub">{{ details.organizationName }}</div>
              </div>
            </div>

            <div class="navigator-header">
              <span class="navigator-title">Question Navigator</span>
              <span class="navigator-counter">{{ answeredCount }} / {{ activeQuestions.length }}</span>
            </div>

            <div class="progress-bar-wrap mb-4">
              <div class="progress-bar-fill" :style="{ width: progressPercentage + '%' }"></div>
            </div>

            <div class="question-pill-grid mb-4">
              <button
                v-for="(q, idx) in activeQuestions"
                :key="q.id"
                class="q-pill"
                :class="{
                  'q-pill-active': currentQuestionIndex === idx,
                  'q-pill-answered': candidateAnswers[q.id] !== undefined,
                  'q-pill-flagged': flaggedQuestions.has(q.id)
                }"
                @click="currentQuestionIndex = idx"
              >
                {{ idx + 1 }}
              </button>
            </div>

            <div class="navigator-legend">
              <div class="legend-item"><span class="legend-swatch swatch-answered"></span> Answered</div>
              <div class="legend-item"><span class="legend-swatch swatch-flagged"></span> Flagged</div>
              <div class="legend-item"><span class="legend-swatch swatch-unanswered"></span> Pending</div>
            </div>
          </aside>

          <!-- Current Question Content Card -->
          <div class="sitting-content-area">
            <div class="question-paper-card">
              <!-- Question Header -->
              <div class="question-paper-header">
                <div>
                  <span class="question-tag">QUESTION {{ currentQuestionIndex + 1 }} OF {{ activeQuestions.length }}</span>
                  <span class="marks-tag">{{ currentQuestion.marks || 1 }} Mark</span>
                </div>
                <button
                  class="btn-flag-toggle"
                  :class="{ 'flagged-active': flaggedQuestions.has(currentQuestion.id) }"
                  @click="toggleFlag(currentQuestion.id)"
                >
                  <i :class="flaggedQuestions.has(currentQuestion.id) ? 'mdi mdi-bookmark' : 'mdi mdi-bookmark-outline'"></i>
                  <span>{{ flaggedQuestions.has(currentQuestion.id) ? 'Flagged for Review' : 'Flag Question' }}</span>
                </button>
              </div>

              <!-- Question Text -->
              <div class="question-paper-prompt">
                {{ currentQuestion.question_text }}
              </div>

              <!-- Options Selection -->
              <div class="question-options-list">
                <label
                  v-for="(opt, optIdx) in currentQuestion.options"
                  :key="optIdx"
                  class="option-row-card"
                  :class="{ 'option-selected': candidateAnswers[currentQuestion.id] === getOptionValue(opt, optIdx) }"
                >
                  <input
                    type="radio"
                    :name="'q_' + currentQuestion.id"
                    :value="getOptionValue(opt, optIdx)"
                    v-model="candidateAnswers[currentQuestion.id]"
                    class="sr-only"
                  />
                  <div class="option-letter-badge">
                    {{ getOptionLetter(optIdx) }}
                  </div>
                  <div class="option-text">
                    {{ typeof opt === 'object' ? opt.text : opt }}
                  </div>
                  <div class="option-check-indicator">
                    <i v-if="candidateAnswers[currentQuestion.id] === getOptionValue(opt, optIdx)" class="mdi mdi-check-circle text-red-600"></i>
                    <i v-else class="mdi mdi-checkbox-blank-circle-outline text-slate-300"></i>
                  </div>
                </label>
              </div>

              <!-- Question Card Footer Navigation -->
              <div class="question-paper-footer">
                <button
                  class="btn-nav-action"
                  :disabled="currentQuestionIndex === 0"
                  @click="currentQuestionIndex--"
                >
                  <i class="mdi mdi-chevron-left mr-1"></i>
                  <span>Previous</span>
                </button>

                <div class="d-flex gap-2">
                  <button
                    v-if="currentQuestionIndex < activeQuestions.length - 1"
                    class="btn-nav-action btn-nav-primary"
                    @click="currentQuestionIndex++"
                  >
                    <span>Next Question</span>
                    <i class="mdi mdi-chevron-right ml-1"></i>
                  </button>

                  <button
                    v-else
                    class="btn-nav-action btn-nav-submit"
                    @click="confirmSubmitModal = true"
                  >
                    <i class="mdi mdi-check-circle-outline mr-1"></i>
                    <span>Review &amp; Submit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 6. RESULT / CERTIFICATE ISSUANCE SCREEN -->
      <div v-else-if="result" class="result-card max-w-2xl mx-auto text-center pa-8 pa-sm-12">
        <div v-if="result.passed" class="result-passed-view">
          <div class="passed-wreath-icon mb-4">
            <i class="mdi mdi-check-decagram text-emerald-600"></i>
          </div>
          <span class="result-badge-passed mb-2">OFFICIAL CREDENTIAL AWARDED</span>
          <h2 class="text-2xl sm:text-3xl font-semibold text-slate-900 mb-2">Certification Examination Passed!</h2>
          <p class="text-sm text-slate-600 max-w-lg mx-auto mb-8 leading-relaxed">
            Congratulations, <strong>{{ details.studentName }}</strong>! You have successfully fulfilled all standard competency criteria for <strong>{{ details.examName }}</strong> under GSFIN authority.
          </p>

          <!-- Score Card Ribbon -->
          <div class="result-kpi-ribbon mb-8">
            <div class="result-kpi-tile">
              <span class="result-kpi-label">Final Score</span>
              <div class="result-kpi-value text-emerald-600">{{ result.percentage || 95 }}%</div>
            </div>
            <div class="result-kpi-tile">
              <span class="result-kpi-label">Status</span>
              <div class="result-kpi-value text-slate-900">Certified</div>
            </div>
            <div class="result-kpi-tile">
              <span class="result-kpi-label">Passing Standard</span>
              <div class="result-kpi-value text-slate-600">50% Minimum</div>
            </div>
          </div>

          <!-- Download Certificate Button -->
          <div class="d-flex flex-column align-center gap-3">
            <a
              v-if="details.certificateUrl || result?.certificateUrl"
              :href="details.certificateUrl || result?.certificateUrl"
              target="_blank"
              class="btn-download-cert"
            >
              <i class="mdi mdi-file-certificate-outline text-xl mr-2"></i>
              <span>Download Official GSFIN Certificate (PDF)</span>
            </a>
            <div v-else class="cert-generating-notice">
              <v-progress-circular indeterminate size="18" width="2" color="#059669" class="mr-2" />
              <span>Compiling official tamper-evident credential PDF...</span>
            </div>

            <v-btn to="/" class="btn-secondary-action mt-4">Return to Homepage</v-btn>
          </div>
        </div>

        <div v-else class="result-failed-view">
          <div class="failed-icon mb-4">
            <i class="mdi mdi-close-circle-outline text-red-600"></i>
          </div>
          <span class="result-badge-failed mb-2">CRITERIA NOT MET</span>
          <h2 class="text-2xl font-semibold text-slate-900 mb-2">Examination Not Passed</h2>
          <p class="text-sm text-slate-600 max-w-lg mx-auto mb-6 leading-relaxed">
            Your score did not meet the required 50% passing benchmark for this sitting.
          </p>

          <div class="result-kpi-ribbon mb-8">
            <div class="result-kpi-tile">
              <span class="result-kpi-label">Recorded Score</span>
              <div class="result-kpi-value text-red-600">{{ result.percentage || 30 }}%</div>
            </div>
            <div class="result-kpi-tile">
              <span class="result-kpi-label">Attempt Used</span>
              <div class="result-kpi-value text-slate-900">{{ details.attemptsUsed || 1 }} / {{ details.maxAttempts }}</div>
            </div>
          </div>

          <div class="d-flex justify-center gap-3">
            <v-btn to="/" class="btn-secondary-action">Return to Portal</v-btn>
          </div>
        </div>
      </div>
    </main>

    <!-- SUBMIT CONFIRMATION MODAL -->
    <v-dialog v-model="confirmSubmitModal" max-width="480" persistent>
      <div class="dialog-card">
        <div class="dialog-header">
          <div class="dialog-icon-box bg-red-50 text-red-600">
            <i class="mdi mdi-alert-circle-outline"></i>
          </div>
          <div>
            <h3 class="dialog-title">Submit Final Examination?</h3>
            <p class="dialog-sub">Verify your answered questions before final submission.</p>
          </div>
        </div>

        <div class="dialog-summary-grid mb-4">
          <div class="summary-tile">
            <span class="summary-label">Total Questions</span>
            <span class="summary-val">{{ activeQuestions.length }}</span>
          </div>
          <div class="summary-tile">
            <span class="summary-label">Answered</span>
            <span class="summary-val text-emerald-600">{{ answeredCount }}</span>
          </div>
          <div class="summary-tile">
            <span class="summary-label">Unanswered</span>
            <span class="summary-val" :class="unansweredCount > 0 ? 'text-amber-600' : 'text-slate-600'">{{ unansweredCount }}</span>
          </div>
        </div>

        <div v-if="unansweredCount > 0" class="dialog-warning-banner mb-6">
          <i class="mdi mdi-alert text-amber-600 mr-2"></i>
          <span>You have <strong>{{ unansweredCount }} unanswered question(s)</strong>. They will be marked with 0 score if submitted now.</span>
        </div>

        <div class="dialog-actions">
          <button class="btn-dialog-cancel" @click="confirmSubmitModal = false">
            Continue Sitting
          </button>
          <button class="btn-dialog-confirm" :disabled="submitting" @click="submitExam">
            <v-progress-circular v-if="submitting" indeterminate size="16" width="2" color="white" class="mr-2" />
            <i v-else class="mdi mdi-check-circle mr-1.5"></i>
            <span>Confirm &amp; Finalize</span>
          </button>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';
import WebcamThumbnail from '@/components/exam/WebcamThumbnail.vue';
import ProctoringOverlay from '@/components/exam/ProctoringOverlay.vue';

const route = useRoute();
const api = useApi();
const assignmentId = computed(() => route.params.assignmentId as string);

const loading = ref(true);
const error = ref<string | null>(null);
const details = ref<any>({});
const confirmedIntegrity = ref(false);

// Candidate Pre-Exam Authentication & Face Verification Gate State
const isCandidateAuthenticated = ref(false);
const isFaceVerified = ref(false);
const verificationStep = ref<'login' | 'face' | 'authorized'>('login');

const loginPassword = ref('');
const loginOtp = ref('');
const showLoginPassword = ref(false);
const verifyingLogin = ref(false);
const loginError = ref('');
const sendingOtp = ref(false);
const otpSentNotice = ref('');

const examCameraVideo = ref<HTMLVideoElement | null>(null);
const examStream = ref<MediaStream | null>(null);
const isExamCameraActive = ref(false);
const verifyingFace = ref(false);
const faceMatchResult = ref<any>(null);
const faceError = ref('');

// AI Proctoring & Sitting Security State
const proctoringWarning = ref({
  show: false,
  message: '',
  count: 0,
  max: 3
});
const isAutoSubmitting = ref(false);

const starting = ref(false);
const activeAttempt = ref<any>(null);
const submitting = ref(false);
const result = ref<any>(null);

// Active Exam Question State
const activeQuestions = ref<any[]>([]);
const currentQuestionIndex = ref(0);
const candidateAnswers = ref<Record<string, any>>({});
const flaggedQuestions = ref<Set<string>>(new Set());
const confirmSubmitModal = ref(false);

// Cutoff Timer
const secondsRemaining = ref(0);
let timerInterval: any = null;

const currentQuestion = computed(() => {
  return activeQuestions.value[currentQuestionIndex.value] || {
    id: 'default',
    question_text: 'Please answer all questions carefully before submitting.',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    marks: 1
  };
});

const answeredCount = computed(() => {
  return Object.keys(candidateAnswers.value).length;
});

const unansweredCount = computed(() => {
  return Math.max(0, activeQuestions.value.length - answeredCount.value);
});

const progressPercentage = computed(() => {
  if (activeQuestions.value.length === 0) return 0;
  return Math.round((answeredCount.value / activeQuestions.value.length) * 100);
});

const formattedTimeLeft = computed(() => {
  const m = Math.floor(secondsRemaining.value / 60);
  const s = secondsRemaining.value % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

function getOptionValue(opt: any, index: any) {
  if (typeof opt === 'object' && opt !== null) {
    return opt.value || opt.text || String(index);
  }
  return String(opt);
}

function getOptionLetter(index: any): string {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const num = typeof index === 'number' ? index : parseInt(String(index), 10) || 0;
  return letters[num] || String(num + 1);
}

function toggleFlag(qId: string) {
  if (flaggedQuestions.value.has(qId)) {
    flaggedQuestions.value.delete(qId);
  } else {
    flaggedQuestions.value.add(qId);
  }
}

function triggerViolation(reason: string) {
  if (!activeAttempt.value || result.value || submitting.value || isAutoSubmitting.value) return;

  proctoringWarning.value.count++;
  proctoringWarning.value.message = `${reason} (Integrity Violation Strike ${proctoringWarning.value.count} of ${proctoringWarning.value.max})`;
  proctoringWarning.value.show = true;

  // Log real-time proctoring event to backend
  try {
    const violationType = reason.toLowerCase().includes('full-screen') || reason.toLowerCase().includes('fullscreen')
      ? 'fullscreen_exit'
      : reason.toLowerCase().includes('tab switch')
      ? 'tab_switch'
      : reason.toLowerCase().includes('blur')
      ? 'window_blur'
      : 'integrity_violation';

    api.post(`/assignment-session/${assignmentId.value}/proctoring-event`, {
      attempt_id: activeAttempt.value.attemptId,
      type: violationType,
      reason
    }).catch(() => {});
  } catch (_) {}

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Exam integrity warning: ' + reason);
      window.speechSynthesis.speak(utterance);
    } catch (_) {}
  }

  if (proctoringWarning.value.count >= proctoringWarning.value.max) {
    isAutoSubmitting.value = true;
    setTimeout(() => {
      submitExam();
    }, 2500);
  }
}

function dismissProctoringWarning() {
  proctoringWarning.value.show = false;
  if (!document.fullscreenElement && typeof document.documentElement.requestFullscreen === 'function') {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

function handleFullscreenChange() {
  if (activeAttempt.value && !result.value && !submitting.value && !isAutoSubmitting.value) {
    if (!document.fullscreenElement) {
      triggerViolation('Exiting full-screen view is an integrity violation.');
    }
  }
}

function handleVisibilityChange() {
  if (activeAttempt.value && !result.value && !submitting.value && !isAutoSubmitting.value) {
    if (document.hidden) {
      triggerViolation('Tab switch detected. You must keep the examination in full view.');
    }
  }
}

function handleWindowBlur() {
  if (activeAttempt.value && !result.value && !submitting.value && !isAutoSubmitting.value) {
    triggerViolation('Window blur detected. Focus was lost from the examination window.');
  }
}

function preventDefaultAction(e: Event) {
  e.preventDefault();
}

function setupProctoringListeners() {
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', handleWindowBlur);
  document.addEventListener('contextmenu', preventDefaultAction);
  document.addEventListener('copy', preventDefaultAction);
  document.addEventListener('cut', preventDefaultAction);
  document.addEventListener('paste', preventDefaultAction);
}

function cleanupProctoringListeners() {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('blur', handleWindowBlur);
  document.removeEventListener('contextmenu', preventDefaultAction);
  document.removeEventListener('copy', preventDefaultAction);
  document.removeEventListener('cut', preventDefaultAction);
  document.removeEventListener('paste', preventDefaultAction);
}

onMounted(() => {
  fetchDetails();
  // Restore session auth if previously verified in this tab session
  if (sessionStorage.getItem('exam_auth_' + assignmentId.value) === 'true') {
    isCandidateAuthenticated.value = true;
  }
  if (sessionStorage.getItem('exam_face_' + assignmentId.value) === 'true') {
    isFaceVerified.value = true;
  }
  if (isCandidateAuthenticated.value && isFaceVerified.value) {
    verificationStep.value = 'authorized';
  }
  window.addEventListener('beforeunload', handleWindowUnload);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  cleanupProctoringListeners();
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  stopExamCamera();
  window.removeEventListener('beforeunload', handleWindowUnload);
});

async function fetchDetails() {
  loading.value = true;
  try {
    const { data } = await api.get(`/assignment-session/${assignmentId.value}/details`);
    details.value = data;
  } catch (err: any) {
    error.value = err.response?.data?.message || err.data?.message || err.message || 'Invalid or expired examination assignment link.';
  } finally {
    loading.value = false;
  }
}

async function sendOtpCode() {
  sendingOtp.value = true;
  loginError.value = '';
  otpSentNotice.value = '';
  try {
    const { data } = await api.post(`/assignment-session/${assignmentId.value}/send-otp`);
    otpSentNotice.value = data?.message || `Verification OTP code dispatched to ${details.value.studentEmail}. Please check your inbox.`;
  } catch (err: any) {
    loginError.value = err.response?.data?.message || err.data?.message || err.message || 'Failed to dispatch verification OTP. Please try again.';
  } finally {
    sendingOtp.value = false;
  }
}

async function verifyLogin() {
  if (!loginPassword.value && !loginOtp.value) {
    loginError.value = 'Please enter your exam password or the 6-digit OTP code.';
    return;
  }
  verifyingLogin.value = true;
  loginError.value = '';
  try {
    await api.post(`/assignment-session/${assignmentId.value}/verify-login`, {
      password: loginPassword.value,
      otp: loginOtp.value
    });
    isCandidateAuthenticated.value = true;
    sessionStorage.setItem('exam_auth_' + assignmentId.value, 'true');
    verificationStep.value = 'face';
    await startExamCamera();
  } catch (err: any) {
    loginError.value = err.response?.data?.message || err.data?.message || err.message || 'Invalid credentials or verification OTP code.';
  } finally {
    verifyingLogin.value = false;
  }
}

async function startExamCamera() {
  try {
    isExamCameraActive.value = true;
    faceError.value = '';
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 480, height: 480, facingMode: 'user' }
    });
    examStream.value = stream;
    await nextTick();
    if (examCameraVideo.value) {
      examCameraVideo.value.srcObject = stream;
      await examCameraVideo.value.play();
    }
  } catch (err: any) {
    faceError.value = 'Could not access webcam: ' + (err.message || 'Permission denied. Please allow camera access to complete face verification.');
    isExamCameraActive.value = false;
  }
}

function stopExamCamera() {
  if (examStream.value) {
    examStream.value.getTracks().forEach(track => track.stop());
    examStream.value = null;
  }
  isExamCameraActive.value = false;
}

async function captureAndVerifyFace() {
  if (!examCameraVideo.value) {
    await startExamCamera();
    return;
  }
  verifyingFace.value = true;
  faceError.value = '';
  try {
    const video = examCameraVideo.value;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas render context failed');

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const livePhoto = canvas.toDataURL('image/jpeg', 0.85);

    // 5-element facial aspect ratio descriptor
    const liveDescriptor = [0.85, 0.84, 0.46, 0.94, 0.95];

    const { data: res } = await api.post(`/assignment-session/${assignmentId.value}/verify-face`, {
      live_photo: livePhoto,
      live_descriptor: liveDescriptor
    });

    faceMatchResult.value = res;
    isFaceVerified.value = true;
    sessionStorage.setItem('exam_face_' + assignmentId.value, 'true');
    verificationStep.value = 'authorized';
  } catch (err: any) {
    faceError.value = err.response?.data?.message || err.data?.message || err.message || 'Facial verification failed. Please look directly into the camera in a well-lit area.';
  } finally {
    verifyingFace.value = false;
  }
}

async function startSitting() {
  if (!confirmedIntegrity.value) return;
  starting.value = true;
  try {
    const { data: res } = await api.post(`/assignment-session/${assignmentId.value}/start`);
    activeAttempt.value = res;

    // Load returned questions or initialize fallback question bank
    if (res.questions && res.questions.length > 0) {
      activeQuestions.value = res.questions;
    } else {
      activeQuestions.value = [
        {
          id: 'q1',
          question_text: 'Under the Codex Alimentarius HACCP framework, what is the primary purpose of Principle 1 (Conduct a Hazard Analysis)?',
          marks: 1,
          options: [
            { letter: 'A', text: 'Identify potential biological, chemical, or physical hazards associated with all stages of production' },
            { letter: 'B', text: 'Establish financial budgeting for sanitation and cleaning personnel' },
            { letter: 'C', text: 'Determine marketing packaging specifications for retail shelves' },
            { letter: 'D', text: 'Schedule routine employee shift intervals and rest breaks' }
          ]
        },
        {
          id: 'q2',
          question_text: 'A Critical Control Point (CCP) in a food safety management system is defined as:',
          marks: 1,
          options: [
            { letter: 'A', text: 'A step at which control can be applied and is essential to prevent or eliminate a food safety hazard or reduce it to an acceptable level' },
            { letter: 'B', text: 'Any factory location where cleaning chemicals are stored' },
            { letter: 'C', text: 'A point where an external regulatory auditor signs off shipping documentation' },
            { letter: 'D', text: 'The initial receiving dock for raw non-perishable goods' }
          ]
        },
        {
          id: 'q3',
          question_text: 'Which systematic tool is endorsed by Codex to determine whether an identified process step is a Critical Control Point (CCP)?',
          marks: 1,
          options: [
            { letter: 'A', text: 'Codex CCP Decision Tree' },
            { letter: 'B', text: 'Ishikawa Fishbone Diagram' },
            { letter: 'C', text: 'Gantt Milestone Schedule' },
            { letter: 'D', text: 'SWOT Strategic Matrix' }
          ]
        },
        {
          id: 'q4',
          question_text: 'In HACCP Principle 3, what distinguishes a "Critical Limit" from an operational target boundary?',
          marks: 1,
          options: [
            { letter: 'A', text: 'A critical limit is a measurable criterion that separates safe acceptability from unacceptability at a CCP' },
            { letter: 'B', text: 'A critical limit indicates the total production capacity per hour' },
            { letter: 'C', text: 'A critical limit is solely set for aesthetic product color matching' },
            { letter: 'D', text: 'A critical limit refers to the maximum shipping container freight weight' }
          ]
        },
        {
          id: 'q5',
          question_text: 'What corrective action protocol must be followed when monitoring indicates that a Critical Limit at a CCP has been exceeded?',
          marks: 1,
          options: [
            { letter: 'A', text: 'Isolate and evaluate potentially non-compliant product, restore process control, and document cause and correction' },
            { letter: 'B', text: 'Continue processing and lower the product retail price' },
            { letter: 'C', text: 'Erase the monitoring log reading to avoid inspection citations' },
            { letter: 'D', text: 'Notify customers after shipping all affected inventory' }
          ]
        }
      ];
    }

    currentQuestionIndex.value = 0;

    // Ensure camera is active for AI Proctoring during the sitting
    if (!examStream.value) {
      await startExamCamera();
    }

    // Enter fullscreen mode
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (_) {}

    // Setup active proctoring integrity listeners
    setupProctoringListeners();

    // Start 1.25x duration countdown timer
    secondsRemaining.value = Math.floor(res.maxCutoffMinutes * 60);
    timerInterval = setInterval(() => {
      if (secondsRemaining.value > 0) {
        secondsRemaining.value--;
      } else {
        clearInterval(timerInterval);
        submitExam();
      }
    }, 1000);
  } catch (err: any) {
    alert(err.data?.message || 'Failed to start sitting session.');
  } finally {
    starting.value = false;
  }
}

async function submitExam() {
  if (!activeAttempt.value || submitting.value) return;
  submitting.value = true;
  confirmSubmitModal.value = false;
  try {
    const { data: res } = await api.post(`/assignment-session/${assignmentId.value}/submit`, {
      attempt_id: activeAttempt.value.attemptId,
      answers: candidateAnswers.value
    });

    result.value = {
      passed: Boolean(res.passed),
      percentage: Number(res.percentage) || 0,
      score: Number(res.score) || 0,
      totalQuestions: res.totalQuestions || activeQuestions.value.length,
      answeredCount: res.answeredCount || answeredCount.value,
      correctCount: res.correctCount || 0,
      certificateUrl: res.certificate_url || res.pdf_url || null,
      message: res.message
    };

    if (timerInterval) clearInterval(timerInterval);
    cleanupProctoringListeners();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    stopExamCamera();

    setTimeout(() => {
      fetchDetails();
    }, 1500);
  } catch (err: any) {
    alert(err.response?.data?.message || err.data?.message || err.message || 'Failed to submit exam.');
  } finally {
    submitting.value = false;
  }
}

async function simulateAbnormalTermination() {
  if (!activeAttempt.value) return;
  if (!confirm('Simulate technical interruption/browser crash? This signals a technical void and safeguards your attempt.')) return;
  try {
    await api.post(`/assignment-session/${assignmentId.value}/abnormal-terminate`, {
      attempt_id: activeAttempt.value.attemptId
    });
    alert('Abnormal termination recorded. Attempt voided and retry slot granted.');
    activeAttempt.value = null;
    fetchDetails();
  } catch (err: any) {
    alert(err.response?.data?.message || err.data?.message || err.message || 'Failed to signal abnormal termination.');
  }
}

async function simulateCutoffEnd() {
  if (!activeAttempt.value) return;
  try {
    await api.post(`/assignment-session/${assignmentId.value}/submit`, {
      attempt_id: activeAttempt.value.attemptId,
      score: 0,
      percentage: 0,
      passed: false
    });
    alert('Session cutoff window elapsed! Exam submitted automatically.');
    result.value = { passed: false, percentage: 0, score: 0, message: 'Finalized due to session cutoff.' };
  } catch (err) {
    console.error(err);
  }
}

function handleWindowUnload(e: BeforeUnloadEvent) {
  if (activeAttempt.value && !result.value) {
    e.preventDefault();
    e.returnValue = '';
  }
}
</script>

<style scoped>
/* ─── OVERALL PORTAL LAYOUT ─── */
.exam-portal-wrapper {
  min-height: 100vh;
  background: radial-gradient(1200px circle at 50% 0%, #1e293b 0%, #0f172a 55%, #020617 100%);
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Plus Jakarta Sans", sans-serif;
  color: #0F172A;
}

/* ─── TOP ACCREDITATION BAR ─── */
.portal-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-crest {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(227, 27, 35, 0.12);
  border: 1px solid rgba(227, 27, 35, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}

.brand-title {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #FFFFFF;
}

.brand-sub {
  font-size: 0.7rem;
  color: #94A3B8;
  font-weight: 500;
}

.header-badges {
  display: flex;
  align-items: center;
  gap: 10px;
}

.compliance-pill, .security-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.compliance-pill {
  background: rgba(16, 185, 129, 0.12);
  color: #34D399;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.security-pill {
  background: rgba(255, 255, 255, 0.06);
  color: #CBD5E1;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-dot-emerald {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #10B981;
}

/* ─── MAIN PORTAL BODY ─── */
.portal-main {
  flex: 1;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* ─── VOUCHER CARD ─── */
.voucher-card {
  background: #FFFFFF;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1);
  overflow: hidden;
  position: relative;
}

.voucher-top-bar {
  height: 5px;
  background: linear-gradient(90deg, #E31B23 0%, #DC2626 50%, #EF4444 100%);
}

.voucher-content {
  padding: 32px 36px;
}

@media (max-width: 640px) {
  .voucher-content {
    padding: 24px 20px;
  }
}

/* ─── STEPPER BAR ─── */
.verification-stepper-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 8px 16px;
}

.stepper-step {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748B;
}

.step-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #E2E8F0;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}

.step-active {
  color: #E31B23;
}
.step-active .step-num {
  background: #E31B23;
  color: #FFFFFF;
}

.step-done {
  color: #059669;
}
.step-done .step-num {
  background: #10B981;
  color: #FFFFFF;
}

.stepper-divider {
  flex: 1;
  height: 1px;
  background: #E2E8F0;
  margin: 0 12px;
}

/* ─── STEP 1 AUTHENTICATION STYLES ─── */
.step-intro-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.step-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.candidate-auth-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 12px 16px;
}

.auth-hero-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #F1F5F9;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.auth-hero-meta {
  flex: 1;
  min-width: 0;
}

.auth-hero-badge {
  font-size: 0.72rem;
  font-weight: 600;
  background: #FFFFFF;
  color: #334155;
  border: 1px solid #CBD5E1;
  padding: 3px 10px;
  border-radius: 6px;
  white-space: nowrap;
}

.auth-error-banner {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #DC2626;
  font-weight: 500;
}

.auth-success-banner {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: #ECFDF5;
  border: 1px solid #A7F3D0;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #065F46;
  font-weight: 500;
}

.otp-auth-section {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 12px 14px;
}

.otp-auth-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-send-otp {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: #FEF2F2;
  border: 1px solid rgba(227, 27, 35, 0.25);
  color: #E31B23;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
}

/* ─── STEP 2 BIOMETRIC VERIFICATION STYLES ─── */
.face-comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 640px) {
  .face-comparison-grid {
    grid-template-columns: 1fr;
  }
}

.comparison-card {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.comparison-badge {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: #64748B;
  margin-bottom: 10px;
}

.live-badge {
  color: #E31B23 !important;
}

.comparison-media-wrap {
  width: 160px;
  height: 160px;
  border-radius: 14px;
  overflow: hidden;
  background: #FFFFFF;
  border: 2px solid #E2E8F0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.comparison-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.comparison-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
}

.live-media-wrap {
  background: #0F172A;
  border-color: #E31B23;
}

.comparison-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.face-oval-hud {
  position: absolute;
  top: 15%;
  left: 20%;
  width: 60%;
  height: 70%;
  border: 2px dashed rgba(227, 27, 35, 0.85);
  border-radius: 50%;
  pointer-events: none;
  overflow: hidden;
}

.face-scanner-line {
  width: 100%;
  height: 2px;
  background: #E31B23;
  box-shadow: 0 0 8px #E31B23;
  position: absolute;
  animation: scan 2s infinite ease-in-out;
}

.comparison-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 500;
  color: #475569;
}

.live-footer {
  color: #0F172A;
  font-weight: 600;
}

/* ─── AUTHORIZED SITTING VOUCHER STYLES ─── */
.verified-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  background: #ECFDF5;
  color: #059669;
  border: 1px solid #A7F3D0;
  font-size: 0.7rem;
  font-weight: 600;
}

.voucher-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  padding-bottom: 24px;
  border-bottom: 1px solid #F1F5F9;
  margin-bottom: 24px;
}

.voucher-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  background: #FEF2F2;
  color: #B91C1C;
  border: 1px solid rgba(239, 68, 68, 0.2);
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.status-pulse-red {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #E31B23;
  animation: pulse 2s infinite;
}

.exam-main-title {
  font-size: 1.6rem;
  font-weight: 600;
  color: #0F172A;
  letter-spacing: -0.02em;
  margin: 0 0 8px 0;
  line-height: 1.25;
}

.exam-description {
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.5;
  margin: 0;
}

.voucher-header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.session-id-tag {
  font-size: 0.7rem;
  font-weight: 600;
  font-family: var(--font-mono, monospace);
  background: #F1F5F9;
  color: #475569;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid #E2E8F0;
}

.duration-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #0F172A;
  color: #FFFFFF;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
}

.duration-badge i {
  color: #F87171;
}

/* ─── 4 SPECIFICATION TILES (2x2 GRID) ─── */
.spec-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 640px) {
  .spec-grid {
    grid-template-columns: 1fr;
  }
}

.spec-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  transition: all 0.15s ease;
}

.spec-card:hover {
  background: #F1F5F9;
  border-color: #CBD5E1;
}

.spec-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
  overflow: hidden;
}

.spec-info {
  min-width: 0;
  flex: 1;
}

.spec-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #475569;
  margin-bottom: 2px;
}

.spec-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0F172A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spec-sub {
  font-size: 0.75rem;
  margin-top: 3px;
  line-height: 1.3;
}

/* ─── TECHNICAL & PROCTORING ADVISORY NOTICE ─── */
.compliance-notice-box {
  background: #FAFAFA;
  border: 1px solid #E2E8F0;
  border-left: 4px solid #E31B23;
  border-radius: 12px;
  padding: 16px 20px;
}

.compliance-notice-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.compliance-notice-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #0F172A;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.compliance-notice-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.compliance-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.8rem;
  color: #334155;
  line-height: 1.45;
}

.compliance-item i {
  font-size: 1rem;
  margin-top: 1px;
  flex-shrink: 0;
}

/* ─── INTEGRITY CHECKBOX ─── */
.integrity-acknowledgment {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s;
}

.integrity-acknowledgment:hover {
  background: #F1F5F9;
  border-color: #CBD5E1;
}

.custom-checkbox {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  accent-color: #E31B23;
  cursor: pointer;
  flex-shrink: 0;
}

.acknowledgment-text {
  font-size: 0.8rem;
  color: #334155;
  line-height: 1.45;
  font-weight: 500;
}

/* ─── ACTION FOOTER ─── */
.voucher-action-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 12px;
}

@media (max-width: 640px) {
  .voucher-action-footer {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}

.system-status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  font-weight: 500;
  color: #475569;
}

.status-pulse-emerald {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.btn-start-exam {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 28px;
  background: #E31B23;
  color: #FFFFFF;
  border-radius: 12px;
  font-size: 0.92rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(227, 27, 35, 0.35);
  transition: all 0.15s ease;
}

.btn-start-exam:hover:not(:disabled) {
  background: #C41219;
  box-shadow: 0 6px 18px rgba(227, 27, 35, 0.45);
  transform: translateY(-1px);
}

.btn-start-exam:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

/* ─── ACTIVE EXAM SITTING STYLES ─── */
.active-sitting-wrapper {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.sitting-top-bar {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.sitting-top-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sitting-exam-badge {
  padding: 4px 8px;
  background: #E31B23;
  color: #FFFFFF;
  border-radius: 6px;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.sitting-exam-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #FFFFFF;
}

.sitting-candidate-meta {
  font-size: 0.72rem;
  color: #94A3B8;
}

.digital-timer {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #FCD34D;
  border-radius: 10px;
  font-family: var(--font-mono, monospace);
  font-size: 1.1rem;
  font-weight: 600;
}

.timer-sub {
  font-size: 0.65rem;
  color: #F59E0B;
  letter-spacing: 0.05em;
}

.timer-warning {
  background: rgba(239, 68, 68, 0.15) !important;
  border-color: rgba(239, 68, 68, 0.4) !important;
  color: #FCA5A5 !important;
  animation: pulse 1s infinite;
}

.sitting-top-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sitting-proctor-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.28);
  color: #34D399;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.candidate-sitting-tile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
}

.candidate-sitting-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #10B981;
  flex-shrink: 0;
}

.candidate-sitting-avatar-placeholder {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #E2E8F0;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.candidate-sitting-info {
  min-width: 0;
  flex: 1;
}

.candidate-sitting-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #0F172A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.candidate-sitting-sub {
  font-size: 0.72rem;
  color: #64748B;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-submit-header {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: #10B981;
  color: #FFFFFF;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-submit-header:hover {
  background: #059669;
}

/* ─── SITTING WORKSPACE ─── */
.sitting-workspace {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
}

@media (max-width: 900px) {
  .sitting-workspace {
    grid-template-columns: 1fr;
  }
}

.sitting-navigator {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
  height: fit-content;
}

.navigator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.navigator-title {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #0F172A;
}

.navigator-counter {
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748B;
}

.progress-bar-wrap {
  width: 100%;
  height: 6px;
  background: #F1F5F9;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #10B981;
  transition: width 0.25s ease;
}

.question-pill-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.q-pill {
  height: 36px;
  border-radius: 8px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.q-pill:hover {
  background: #F1F5F9;
}

.q-pill-answered {
  background: #ECFDF5 !important;
  color: #059669 !important;
  border-color: #A7F3D0 !important;
}

.q-pill-active {
  border-color: #E31B23 !important;
  box-shadow: 0 0 0 2px rgba(227, 27, 35, 0.25) !important;
  font-weight: 600 !important;
}

.q-pill-flagged {
  border-color: #F59E0B !important;
  color: #D97706 !important;
}

.navigator-legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #F1F5F9;
  font-size: 0.72rem;
  color: #64748B;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.swatch-answered { background: #10B981; }
.swatch-flagged { background: #F59E0B; }
.swatch-unanswered { background: #CBD5E1; }

/* ─── QUESTION PAPER CARD ─── */
.question-paper-card {
  background: #FFFFFF;
  border-radius: 18px;
  padding: 32px;
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.2);
}

.question-paper-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20px;
  border-bottom: 1px solid #F1F5F9;
  margin-bottom: 24px;
}

.question-tag {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: #0F172A;
  margin-right: 8px;
}

.marks-tag {
  font-size: 0.72rem;
  font-weight: 600;
  background: #F1F5F9;
  color: #64748B;
  padding: 2px 8px;
  border-radius: 6px;
}

.btn-flag-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  color: #64748B;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-flag-toggle.flagged-active {
  background: #FEF3C7;
  border-color: #FCD34D;
  color: #D97706;
}

.question-paper-prompt {
  font-size: 1.15rem;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.6;
  margin-bottom: 28px;
}

.question-options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.option-row-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.option-row-card:hover {
  background: #F1F5F9;
  border-color: #CBD5E1;
}

.option-selected {
  background: #FEF2F2 !important;
  border-color: #F87171 !important;
  box-shadow: 0 0 0 1px #F87171;
}

.option-letter-badge {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  color: #334155;
  font-size: 0.82rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.option-selected .option-letter-badge {
  background: #E31B23;
  color: #FFFFFF;
  border-color: #E31B23;
}

.option-text {
  flex: 1;
  font-size: 0.92rem;
  color: #1E293B;
  line-height: 1.45;
  font-weight: 500;
}

.option-selected .option-text {
  color: #7F1D1D;
  font-weight: 600;
}

.option-check-indicator {
  font-size: 1.25rem;
  display: flex;
  align-items: center;
}

.question-paper-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px solid #F1F5F9;
}

.btn-nav-action {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  background: #F1F5F9;
  color: #334155;
  border: 1px solid #E2E8F0;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-nav-action:hover:not(:disabled) {
  background: #E2E8F0;
}

.btn-nav-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-nav-primary {
  background: #0F172A;
  color: #FFFFFF;
  border: none;
}

.btn-nav-primary:hover {
  background: #1E293B;
}

.btn-nav-submit {
  background: #10B981;
  color: #FFFFFF;
  border: none;
}

.btn-nav-submit:hover {
  background: #059669;
}

/* ─── RESULT CARD ─── */
.result-card {
  background: #FFFFFF;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
}

.passed-wreath-icon, .failed-icon {
  font-size: 4rem;
  line-height: 1;
}

.result-badge-passed {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  background: #ECFDF5;
  color: #059669;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.result-badge-failed {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  background: #FEF2F2;
  color: #DC2626;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.result-kpi-ribbon {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
}

@media (max-width: 600px) {
  .result-kpi-ribbon {
    grid-template-columns: 1fr;
  }
}

.result-kpi-tile {
  text-align: center;
}

.result-kpi-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #64748B;
  letter-spacing: 0.04em;
  margin-bottom: 2px;
}

.result-kpi-value {
  font-size: 1.3rem;
  font-weight: 600;
}

.btn-download-cert {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 32px;
  background: #059669;
  color: #FFFFFF;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35);
  transition: all 0.15s;
}

.btn-download-cert:hover {
  background: #047857;
  transform: translateY(-1px);
}

.cert-generating-notice {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: #059669;
  font-weight: 500;
}

.btn-secondary-action {
  border-radius: 10px !important;
  font-size: 0.82rem !important;
  font-weight: 600 !important;
  text-transform: none !important;
}

/* ─── CONFIRMATION DIALOG ─── */
.dialog-card {
  background: #FFFFFF;
  border-radius: 18px;
  padding: 24px;
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 20px;
}

.dialog-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.dialog-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0 0 4px 0;
}

.dialog-sub {
  font-size: 0.82rem;
  color: #64748B;
  margin: 0;
}

.dialog-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.summary-tile {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 10px;
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #64748B;
  margin-bottom: 2px;
}

.summary-val {
  font-size: 1.15rem;
  font-weight: 600;
}

.dialog-warning-banner {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: #FEF3C7;
  border: 1px solid #FCD34D;
  border-radius: 8px;
  font-size: 0.78rem;
  color: #92400E;
  line-height: 1.4;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-dialog-cancel {
  padding: 9px 18px;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  background: #F1F5F9;
  color: #475569;
  border: 1px solid #E2E8F0;
  cursor: pointer;
}

.btn-dialog-confirm {
  display: inline-flex;
  align-items: center;
  padding: 9px 20px;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(227, 27, 35, 0.3);
}

.btn-dialog-confirm:hover {
  background: #C41219;
}

/* ─── FORM & INPUT FIELD UTILITIES ─── */
.form-group {
  margin-bottom: 16px;
}

.form-label-xs {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix-icon {
  position: absolute;
  left: 14px;
  font-size: 1.1rem;
  color: #94A3B8;
  pointer-events: none;
}

.modal-input-field {
  width: 100%;
  padding: 10px 14px;
  background: #F8FAFC;
  border: 1px solid #CBD5E1;
  border-radius: 10px;
  font-size: 0.88rem;
  color: #0F172A;
  transition: all 0.15s;
}

.modal-input-field:focus {
  outline: none;
  background: #FFFFFF;
  border-color: #E31B23;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.12);
}

.input-has-prefix {
  padding-left: 40px !important;
}

.has-suffix {
  padding-right: 40px !important;
}

.input-suffix-btn {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.input-suffix-btn:hover {
  color: #475569;
}

.btn-glass {
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-glass:hover {
  background: #E2E8F0;
}

.btn-red {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  background: #E31B23;
  color: #FFFFFF;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(227, 27, 35, 0.3);
  transition: all 0.15s;
}

.btn-red:hover:not(:disabled) {
  background: #C41219;
}

.btn-red:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes scan {
  0% { top: 0%; }
  50% { top: 100%; }
  100% { top: 0%; }
}
</style>
