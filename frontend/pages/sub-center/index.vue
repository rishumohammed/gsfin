<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">



      <!-- Loading State -->
      <div v-if="loadingBatches && batches.length === 0" class="text-center py-16 text-slate-500 font-medium">
        <span class="spinner-sm-red mb-2"></span>
        <p class="text-sm">Loading {{ centerName }} Administration &amp; Token Wallet...</p>
      </div>

      <div v-else>
        <!-- ═══ METRICS CARDS ROW (EXECUTIVE KPI BAR - DASHBOARD & WALLET TABS) ═══ -->
        <div v-if="activeTab === 'dashboard' || activeTab === 'wallet'" class="metrics-grid">
          <div class="metric-card" @click="switchTab('wallet')">
            <div class="metric-icon-box bg-indigo-light">
              <i class="mdi mdi-wallet-outline text-indigo"></i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Token Wallet Balance</span>
              <span class="metric-value text-indigo">{{ wallet.totalRemaining || 0 }}</span>
              <span class="metric-sub text-indigo">Purchased: {{ wallet.totalPurchased || 0 }} • Used: {{ wallet.totalUsed || 0 }}</span>
            </div>
          </div>

          <div class="metric-card" @click="switchTab('batches')">
            <div class="metric-icon-box bg-emerald-light">
              <i class="mdi mdi-subtitles-outline text-emerald"></i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Active Exam Batches</span>
              <span class="metric-value text-emerald">{{ batches.length }}</span>
              <span class="metric-sub text-emerald">Test Batches Created</span>
            </div>
          </div>

          <div class="metric-card" @click="switchTab('students')">
            <div class="metric-icon-box bg-amber-light">
              <i class="mdi mdi-account-group-outline text-amber"></i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Registered Candidates</span>
              <span class="metric-value text-amber">{{ students.length }}</span>
              <span class="metric-sub text-amber">Student Roster</span>
            </div>
          </div>

          <div class="metric-card" @click="switchTab('certificates')">
            <div class="metric-icon-box bg-red-light">
              <i class="mdi mdi-file-certificate-outline text-red"></i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Certificates Issued</span>
              <span class="metric-value text-red">{{ certificates.length }}</span>
              <span class="metric-sub text-red">Verified Qualifications</span>
            </div>
          </div>
        </div>

        <!-- ═══ TAB 0: EXECUTIVE DASHBOARD ═══ -->
        <div v-if="activeTab === 'dashboard'" class="tab-panel">
          <div class="dashboard-split-row">
            <!-- Left: Recent Exam Batches -->
            <div class="panel-card">
              <div class="panel-card-header">
                <div class="panel-title-wrap">
                  <i class="mdi mdi-subtitles-outline panel-icon"></i>
                  <div>
                    <h3>Recent Exam Batches</h3>
                    <p class="panel-subtitle-text">Latest active test batches and candidate assignments</p>
                  </div>
                </div>
                <button class="btn-text-red text-xs font-bold hover:underline flex items-center gap-1" @click="switchTab('batches')">
                  View All Batches <i class="mdi mdi-arrow-right"></i>
                </button>
              </div>

              <div class="card-content-body">
                <div v-if="batches.length === 0" class="text-center py-10 text-slate-400 text-xs">
                  <i class="mdi mdi-clipboard-text-outline text-4xl block mb-2 text-slate-300"></i>
                  No exam batches created yet.
                </div>

                <div v-else class="space-y-3">
                  <div
                    v-for="b in batches.slice(0, 5)"
                    :key="b.id"
                    class="batch-feed-row"
                    @click="switchTab('batches'); viewBatchDetails(b);"
                  >
                    <div class="min-w-0 flex-1">
                      <div class="font-bold text-slate-900 text-sm truncate">{{ b.exam_name }}</div>
                      <div class="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span>Candidates: <strong class="text-slate-800">{{ b.student_count || 0 }}</strong></span>
                        <span>•</span>
                        <span>Status: <span class="badge-chip chip-green uppercase">{{ b.status }}</span></span>
                      </div>
                    </div>
                    <button class="btn-table-action btn-edit text-xs">
                      View <i class="mdi mdi-chevron-right ml-1"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Quick Operations -->
            <div class="panel-card flex flex-col justify-between">
              <div>
                <div class="panel-card-header">
                  <div class="panel-title-wrap">
                    <i class="mdi mdi-flash-outline panel-icon"></i>
                    <div>
                      <h3>Quick Operations</h3>
                      <p class="panel-subtitle-text">Shortcuts &amp; portal actions</p>
                    </div>
                  </div>
                </div>

                <div class="card-content-body space-y-3">
                  <button class="btn-action-tile" @click="switchTab('batches')">
                    <div class="metric-icon-box bg-emerald-light text-emerald shrink-0" style="width:40px; height:40px; border-radius:12px; font-size:1.2rem;">
                      <i class="mdi mdi-layers-triple"></i>
                    </div>
                    <div>
                      <div class="font-bold text-xs">View Exam Batches</div>
                      <div class="text-[11px] text-slate-400">Manage active test sessions</div>
                    </div>
                  </button>

                  <button class="btn-action-tile" @click="switchTab('students')">
                    <div class="metric-icon-box bg-indigo-light text-indigo shrink-0" style="width:40px; height:40px; border-radius:12px; font-size:1.2rem;">
                      <i class="mdi mdi-account-group"></i>
                    </div>
                    <div>
                      <div class="font-bold text-xs">Candidate Student Directory</div>
                      <div class="text-[11px] text-slate-400">View registered student roster</div>
                    </div>
                  </button>

                  <button class="btn-action-tile" @click="switchTab('wallet')">
                    <div class="metric-icon-box bg-amber-light text-amber shrink-0" style="width:40px; height:40px; border-radius:12px; font-size:1.2rem;">
                      <i class="mdi mdi-wallet-outline"></i>
                    </div>
                    <div>
                      <div class="font-bold text-xs">Token Wallet Audit</div>
                      <div class="text-[11px] text-slate-400">Check balance and history</div>
                    </div>
                  </button>
                </div>
              </div>

              <div class="card-content-footer flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-50/50">
                <span>Candidate Roster: <strong class="text-slate-900">{{ students.length }}</strong></span>
                <button class="text-red font-bold hover:underline" @click="switchTab('students')">View Directory</button>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══ TAB 1: BATCHES ═══ -->
        <div v-else-if="activeTab === 'batches'" class="tab-panel">
          <div class="panel-card">
            <div class="panel-card-header">
              <div class="panel-title-wrap">
                <i class="mdi mdi-subtitles-outline panel-icon"></i>
                <div>
                  <h3>Exam Batches &amp; Candidate Enrollments</h3>
                  <p class="panel-subtitle-text">Active test batches, candidate assignments, and dedicated retry link management</p>
                </div>
              </div>

              <div class="panel-filter-row">
                <button class="btn-red text-xs py-2 px-4" @click="openCreateBatchModal">
                  <i class="mdi mdi-plus"></i> Create Exam Batch
                </button>
                <button class="btn-icon-refresh" title="Refresh Batches" @click="fetchBatches" :disabled="loadingBatches">
                  <i :class="['mdi', 'mdi-refresh', { 'spin-icon': loadingBatches }]"></i>
                </button>
              </div>
            </div>

            <div class="table-responsive">
              <v-data-table
                :headers="batchHeaders"
                :items="batches"
                :loading="loadingBatches"
                class="elevation-0 gsfin-table"
              >
                <template v-slot:no-data>
                  <div class="text-center py-12 px-4">
                    <i class="mdi mdi-clipboard-text-outline text-4xl block mb-2 text-slate-300"></i>
                    <h3 class="text-base font-bold text-slate-900">No Exam Batches Created</h3>
                    <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Create your first student exam batch to spend tokens and enroll candidates for certification exams.
                    </p>
                    <button class="btn-red" @click="openCreateBatchModal">
                      <i class="mdi mdi-plus"></i> Create Exam Batch
                    </button>
                  </div>
                </template>

                <template v-slot:item.exam_name="{ item }: any">
                  <div class="font-bold text-slate-900 py-2">{{ item.exam_name }}</div>
                </template>

                <template v-slot:item.status="{ item }: any">
                  <span
                    :class="[
                      'badge-chip',
                      item.status === 'open' ? 'chip-green' :
                      item.status === 'cancelled' ? 'chip-red' :
                      'chip-slate'
                    ]"
                  >
                    {{ item.status.toUpperCase() }}
                  </span>
                </template>

                <template v-slot:item.student_count="{ item }: any">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-800">
                    {{ item.student_count || 0 }} Candidates
                  </span>
                </template>

                <template v-slot:item.opens_at="{ item }: any">
                  <span class="text-xs text-slate-600 font-medium">{{ formatDate(item.opens_at) }}</span>
                </template>

                <template v-slot:item.closes_at="{ item }: any">
                  <span class="text-xs text-slate-600 font-medium">{{ formatDate(item.closes_at) }}</span>
                </template>

                <template v-slot:item.actions="{ item }: any">
                  <div class="action-btn-group">
                    <button class="btn-table-action btn-view" title="View Batch Assignments" @click="viewBatchDetails(item)">
                      <i class="mdi mdi-eye-outline"></i> View Assignments
                    </button>
                    <button v-if="item.status === 'open'" class="btn-table-action btn-danger" title="Cancel Batch" @click="cancelBatch(item)">
                      <i class="mdi mdi-close-circle-outline"></i> Cancel
                    </button>
                  </div>
                </template>
              </v-data-table>
            </div>
          </div>

          <!-- BATCH ASSIGNMENT DETAILS VIEW (WHEN SELECTED) -->
          <div v-if="selectedBatch" class="panel-card mt-6 border-red-200">
            <div class="panel-card-header bg-red-50/40">
              <div class="panel-title-wrap">
                <i class="mdi mdi-account-details panel-icon"></i>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="badge-chip chip-red">Selected Batch</span>
                    <h3 class="text-slate-900">{{ selectedBatch.exam_name }}</h3>
                  </div>
                  <p class="panel-subtitle-text mt-0.5">Batch ID: <code class="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{{ selectedBatch.id }}</code></p>
                </div>
              </div>
              <button @click="selectedBatch = null" class="btn-icon-refresh" title="Close Details">
                <i class="mdi mdi-close"></i>
              </button>
            </div>

            <div class="table-responsive">
              <v-data-table
                :headers="assignmentHeaders"
                :items="batchAssignments"
                :loading="loadingAssignments"
                class="elevation-0 gsfin-table"
              >
                <template v-slot:item.student_name="{ item }: any">
                  <div class="font-bold text-slate-900">{{ item.student_name }}</div>
                </template>
                <template v-slot:item.student_email="{ item }: any">
                  <div class="text-xs text-slate-600 font-mono">{{ item.student_email }}</div>
                </template>
                <template v-slot:item.attempts="{ item }: any">
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-bold',
                      item.attempts_used >= item.max_attempts ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
                    ]"
                  >
                    {{ item.attempts_used }} / {{ item.max_attempts }}
                  </span>
                </template>
                <template v-slot:item.status="{ item }: any">
                  <div class="flex items-center gap-1.5">
                    <span
                      :class="[
                        'badge-chip',
                        item.status === 'passed' ? 'chip-green' :
                        item.status === 'failed' ? 'chip-red' :
                        'chip-slate'
                      ]"
                    >
                      {{ item.status.toUpperCase() }}
                    </span>
                    <span v-if="item.is_retry_link" class="badge-chip chip-amber">
                      Dedicated Link
                    </span>
                  </div>
                </template>
                <template v-slot:item.actions="{ item }: any">
                  <div class="action-btn-group">
                    <button
                      v-if="item.attempts_used < item.max_attempts && ['not_started', 'in_progress', 'failed'].includes(item.status)"
                      class="btn-table-action btn-edit"
                      title="Grant Tech Retry"
                      @click="grantTechnicalRetry(item)"
                    >
                      <i class="mdi mdi-restart"></i> Tech Retry
                    </button>

                    <button
                      v-if="item.status === 'failed'"
                      class="btn-table-action btn-view"
                      title="Create Dedicated Retry Link"
                      @click="openRetryLinkModal(item)"
                    >
                      <i class="mdi mdi-link-plus"></i> Retry Link
                    </button>

                    <a
                      v-if="item.status === 'passed' && item.certificate_url"
                      :href="item.certificate_url"
                      target="_blank"
                      class="btn-table-action btn-success"
                      title="Download Student Certificate"
                    >
                      <i class="mdi mdi-certificate"></i> Certificate
                    </a>
                  </div>
                </template>
              </v-data-table>
            </div>
          </div>
        </div>

        <!-- ═══ TAB 2: CANDIDATE DIRECTORY ═══ -->
        <div v-else-if="activeTab === 'students'" class="tab-panel">
          <div class="panel-card">
            <div class="panel-card-header">
              <div class="panel-title-wrap">
                <i class="mdi mdi-account-group panel-icon"></i>
                <div>
                  <h3>Candidate Student Directory</h3>
                  <p class="panel-subtitle-text">Registered candidates available for exam batch enrollments</p>
                </div>
              </div>

              <div class="panel-filter-row">
                <div class="search-input-wrap">
                  <i class="mdi mdi-magnify search-icon"></i>
                  <input v-model="studentSearchQuery" type="text" placeholder="Search candidate name or email..." class="table-search-input" />
                </div>
                <button class="btn-red text-xs py-2 px-4" @click="showAddStudentModal = true">
                  <i class="mdi mdi-account-plus"></i> Register Candidate
                </button>
              </div>
            </div>

            <div class="table-responsive">
              <v-data-table
                :headers="studentHeaders"
                :items="filteredModalStudents"
                :loading="loadingStudents"
                class="elevation-0 gsfin-table"
              >
                <template v-slot:item.name="{ item }: any">
                  <div class="flex items-center gap-3 py-2">
                    <div class="w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs">
                      {{ item.name ? item.name.charAt(0).toUpperCase() : 'S' }}
                    </div>
                    <span class="font-bold text-slate-900">{{ item.name }}</span>
                  </div>
                </template>
                <template v-slot:item.email="{ item }: any">
                  <span class="text-xs text-slate-600 font-mono">{{ item.email }}</span>
                </template>
                <template v-slot:item.phone="{ item }: any">
                  <span class="text-xs text-slate-600 font-medium">{{ item.phone || 'Not provided' }}</span>
                </template>
                <template v-slot:item.created_at="{ item }: any">
                  <span class="text-xs text-slate-500 font-medium">{{ formatDate(item.created_at) }}</span>
                </template>
              </v-data-table>
            </div>
          </div>
        </div>

        <!-- ═══ TAB 3: WALLET & AUDIT ═══ -->
        <div v-else-if="activeTab === 'wallet'" class="tab-panel">
          <div class="panel-card">
            <div class="panel-card-header">
              <div class="panel-title-wrap">
                <i class="mdi mdi-wallet-outline panel-icon"></i>
                <div>
                  <h3>Token Wallet Ledger &amp; Transaction Audit</h3>
                  <p class="panel-subtitle-text">Real-time audit log of token package purchases and exam batch candidate consumption</p>
                </div>
              </div>

              <div class="panel-filter-row">
                <button class="btn-red text-xs py-2 px-4" @click="showStoreModal = true">
                  <i class="mdi mdi-cart-plus"></i> Buy Token Package
                </button>
                <button class="btn-icon-refresh" title="Refresh Wallet" @click="fetchWallet(); fetchTransactions();" :disabled="loadingTransactions">
                  <i :class="['mdi', 'mdi-refresh', { 'spin-icon': loadingTransactions }]"></i>
                </button>
              </div>
            </div>

            <div class="table-responsive">
              <v-data-table
                :headers="txHeaders"
                :items="transactions"
                :loading="loadingTransactions"
                class="elevation-0 gsfin-table"
              >
                <template v-slot:item.type="{ item }: any">
                  <span
                    :class="[
                      'badge-chip',
                      item.type === 'purchase' ? 'chip-green' :
                      item.type === 'consume' ? 'chip-red' :
                      'chip-amber'
                    ]"
                  >
                    {{ item.type.toUpperCase() }}
                  </span>
                </template>
                <template v-slot:item.token_count="{ item }: any">
                  <span :class="item.token_count > 0 ? 'text-emerald-600 font-black' : 'text-red-600 font-black'">
                    {{ item.token_count > 0 ? '+' : '' }}{{ item.token_count }} Tokens
                  </span>
                </template>
                <template v-slot:item.package_name="{ item }: any">
                  <span class="text-xs text-slate-700 font-semibold">{{ item.package_name || 'System / Batch Refund' }}</span>
                </template>
                <template v-slot:item.created_at="{ item }: any">
                  <span class="text-xs text-slate-500 font-medium">{{ formatDate(item.created_at) }}</span>
                </template>
              </v-data-table>
            </div>
          </div>
        </div>

        <!-- ═══ TAB 4: CERTIFICATES ═══ -->
        <div v-else-if="activeTab === 'certificates'" class="tab-panel">
          <div class="panel-card">
            <div class="panel-card-header">
              <div class="panel-title-wrap">
                <i class="mdi mdi-file-certificate-outline panel-icon"></i>
                <div>
                  <h3>Center Certificates &amp; Verifications</h3>
                  <p class="panel-subtitle-text">Official certificates issued to candidate students enrolled from {{ centerName }}</p>
                </div>
              </div>

              <div class="panel-filter-row">
                <div class="search-input-wrap">
                  <i class="mdi mdi-magnify search-icon"></i>
                  <input
                    v-model="certSearchQuery"
                    type="text"
                    placeholder="Search student, cert # or exam..."
                    class="table-search-input"
                  />
                </div>
                <button class="btn-icon-refresh" title="Refresh Certificates" @click="fetchCertificates" :disabled="loadingCertificates">
                  <i :class="['mdi', 'mdi-refresh', { 'spin-icon': loadingCertificates }]"></i>
                </button>
              </div>
            </div>

            <div class="table-responsive">
              <v-data-table
                :headers="certificateHeaders"
                :items="filteredCertificates"
                :loading="loadingCertificates"
                class="elevation-0 gsfin-table"
              >
                <template v-slot:no-data>
                  <div class="text-center py-12 px-4">
                    <i class="mdi mdi-file-certificate-outline text-4xl block mb-2 text-slate-300"></i>
                    <h3 class="text-base font-bold text-slate-900">No Certificates Issued Yet</h3>
                    <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Certificates will automatically appear here as enrolled candidates from {{ centerName }} complete and pass their batch exams.
                    </p>
                  </div>
                </template>

                <template v-slot:item.certificate_number="{ item }: any">
                  <div class="flex items-center gap-2 py-2">
                    <span class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center text-sm shrink-0 border border-emerald-100">
                      <i class="mdi mdi-certificate"></i>
                    </span>
                    <div>
                      <div class="font-mono font-bold text-slate-900 text-xs">{{ item.certificate_number || item.id }}</div>
                      <div class="text-[10px] text-slate-400 font-medium">Verified Certificate</div>
                    </div>
                  </div>
                </template>

                <template v-slot:item.student_name="{ item }: any">
                  <div>
                    <div class="font-bold text-slate-900 text-xs">{{ item.student_name }}</div>
                    <div class="text-[11px] text-slate-500 font-mono">{{ item.student_email }}</div>
                  </div>
                </template>

                <template v-slot:item.exam_name="{ item }: any">
                  <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {{ item.exam_name }}
                  </span>
                </template>

                <template v-slot:item.issue_date="{ item }: any">
                  <span class="text-xs text-slate-600 font-medium">{{ formatDate(item.issue_date) }}</span>
                </template>

                <template v-slot:item.actions="{ item }: any">
                  <div class="action-btn-group">
                    <a
                      v-if="item.pdf_url"
                      :href="item.pdf_url"
                      target="_blank"
                      class="btn-table-action btn-edit"
                      title="Download PDF"
                    >
                      <i class="mdi mdi-download"></i> PDF
                    </a>
                    <a
                      :href="item.verification_url || ('/verify/' + (item.certificate_number || item.id))"
                      target="_blank"
                      class="btn-table-action btn-view"
                      title="Verify Certificate Online"
                    >
                      <i class="mdi mdi-shield-check"></i> Verify
                    </a>
                  </div>
                </template>
              </v-data-table>
            </div>
          </div>
        </div>

        <!-- ═══ TAB 5: PROFILE & SETTINGS ═══ -->
        <div v-else-if="activeTab === 'profile'" class="tab-panel">
          <div class="profile-grid">
            <!-- Left Column: User Profile Details -->
            <div class="profile-card">
              <div class="profile-card-header">
                <div class="profile-avatar">
                  {{ (profileData?.user?.name || authStore.user?.name || 'A').charAt(0).toUpperCase() }}
                </div>
                <div>
                  <h3 class="profile-name">{{ profileData?.user?.name || authStore.user?.name || 'Sub-Center Staff' }}</h3>
                  <div class="profile-role-chip">{{ profileData?.user?.role || 'SUB_CENTER_STAFF' }}</div>
                  <div class="profile-email">{{ profileData?.user?.email || authStore.user?.email || 'staff@apexcenter.com' }}</div>
                </div>
              </div>

              <div class="profile-fields">
                <div class="field-item">
                  <label class="field-label">Account Role</label>
                  <div class="field-value font-semibold">Authorized Sub-Center Administrator</div>
                </div>

                <div class="field-item">
                  <label class="field-label">User Account ID</label>
                  <div class="field-value font-mono text-xs">{{ profileData?.user?.id || authStore.user?.id || '—' }}</div>
                </div>

                <div class="field-item">
                  <label class="field-label">Account Registration</label>
                  <div class="field-value">{{ formatDate(profileData?.user?.created_at) }}</div>
                </div>
              </div>
            </div>

            <!-- Middle Column: Sub-Center Organization Details -->
            <div class="profile-card">
              <div class="profile-card-header">
                <div class="profile-icon-box bg-indigo-light text-indigo">
                  <i class="mdi mdi-office-building-outline"></i>
                </div>
                <div>
                  <h3 class="profile-name">{{ centerName }}</h3>
                  <span class="profile-sub">Organization &amp; Licensing</span>
                </div>
              </div>

              <div class="profile-fields">
                <div class="field-item">
                  <label class="field-label">Center Name</label>
                  <div class="field-value font-bold text-slate-900">{{ centerName }}</div>
                </div>

                <div class="field-item">
                  <label class="field-label">Organization ID</label>
                  <div class="field-value font-mono text-xs">{{ profileData?.organization?.id || '—' }}</div>
                </div>

                <div class="field-item">
                  <label class="field-label">Token Wallet Balance</label>
                  <div class="wallet-balance-banner">
                    <span class="font-bold text-emerald-800">{{ wallet.totalRemaining || 0 }} Available Tokens</span>
                    <button class="btn-text-red" @click="showStoreModal = true">Buy Tokens</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: Quick Security & Preferences -->
            <div class="profile-card">
              <div class="profile-card-header">
                <div class="profile-icon-box bg-amber-light text-amber">
                  <i class="mdi mdi-shield-key-outline"></i>
                </div>
                <div>
                  <h3 class="profile-name">Security &amp; Portal Actions</h3>
                  <span class="profile-sub">Session &amp; Credentials</span>
                </div>
              </div>

              <div class="action-buttons-stack">
                <button class="btn-action-tile" @click="openEditProfileModal">
                  <i class="mdi mdi-account-edit-outline text-indigo"></i>
                  <span>Edit Profile &amp; Center Details</span>
                </button>

                <button class="btn-action-tile" @click="fetchProfile(); fetchWallet();">
                  <i class="mdi mdi-refresh text-red"></i>
                  <span>Sync &amp; Refresh Profile Session</span>
                </button>

                <button class="btn-action-tile" @click="showStoreModal = true">
                  <i class="mdi mdi-cart-plus text-emerald"></i>
                  <span>Open Token Store Modal</span>
                </button>

                <button class="btn-action-tile btn-logout-tile" @click="handleLogout">
                  <i class="mdi mdi-logout"></i>
                  <span>Logout of Portal</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- ═══ MODALS TELEPORTED TO BODY ═══ -->

    <!-- Token Store Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showStoreModal" class="modal-overlay" @click.self="showStoreModal = false">
          <div class="modal-card max-w-2xl">
            <div class="modal-header">
              <div class="flex items-center gap-3">
                <div class="icon-box-lg bg-red-light text-red">
                  <i class="mdi mdi-cart-plus"></i>
                </div>
                <div>
                  <h3 class="modal-title">Purchase Token Packages</h3>
                  <span class="text-xs text-slate-500 font-medium">Tokens are spent when enrolling candidates in exam batches</span>
                </div>
              </div>
              <button class="modal-close-btn" @click="showStoreModal = false"><i class="mdi mdi-close"></i></button>
            </div>

            <div class="modal-body">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  v-for="pkg in availablePackages"
                  :key="pkg.id"
                  class="border border-slate-200 rounded-2xl p-5 text-center flex flex-col justify-between hover:border-red transition-colors bg-slate-50/50"
                >
                  <div>
                    <div class="text-sm font-bold text-slate-900">{{ pkg.name }}</div>
                    <div class="text-3xl font-black text-red my-2">{{ pkg.token_count }}</div>
                    <div class="text-xs font-semibold uppercase tracking-wider text-slate-500">Tokens</div>
                    <div class="text-xl font-bold text-slate-900 mt-3">${{ Number(pkg.price).toFixed(2) }}</div>
                  </div>
                  <button
                    class="btn-red w-full justify-center mt-4"
                    @click="buyTokenPackage(pkg.id)"
                    :disabled="buyingPkg"
                  >
                    Purchase
                  </button>
                </div>
              </div>
            </div>

            <div class="modal-footer flex justify-end">
              <button class="btn-glass" @click="showStoreModal = false">Close</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Register Student Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAddStudentModal" class="modal-overlay" @click.self="showAddStudentModal = false">
          <div class="modal-card max-w-md">
            <div class="modal-header">
              <div class="flex items-center gap-3">
                <div class="icon-box-lg bg-red-light text-red">
                  <i class="mdi mdi-account-plus"></i>
                </div>
                <div>
                  <h3 class="modal-title">Register Candidate Student</h3>
                  <span class="text-xs text-slate-500 font-medium">Add candidate to sub-center directory for exam batch enrollment</span>
                </div>
              </div>
              <button class="modal-close-btn" @click="showAddStudentModal = false"><i class="mdi mdi-close"></i></button>
            </div>

            <form @submit.prevent="registerStudent">
              <div class="modal-body space-y-4">
                <div>
                  <label class="form-label-xs">Student Full Name *</label>
                  <input v-model="studentForm.name" type="text" class="modal-input-field" placeholder="Full Candidate Name" required />
                </div>
                <div>
                  <label class="form-label-xs">Email Address *</label>
                  <input v-model="studentForm.email" type="email" class="modal-input-field" placeholder="candidate@example.com" required />
                </div>
                <div>
                  <label class="form-label-xs">Phone Number (Optional)</label>
                  <input v-model="studentForm.phone" type="text" class="modal-input-field" placeholder="+1 555-0199" />
                </div>
              </div>

              <div class="modal-footer flex items-center justify-between">
                <button type="button" class="btn-glass" @click="showAddStudentModal = false">Cancel</button>
                <button type="submit" class="btn-red" :disabled="savingStudent">
                  <i class="mdi mdi-account-check"></i> Register Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Create Batch Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCreateBatchModal" class="modal-overlay" @click.self="showCreateBatchModal = false">
          <div class="modal-card max-w-xl">
            <div class="modal-header">
              <div class="flex items-center gap-3">
                <div class="icon-box-lg bg-red-light text-red">
                  <i class="mdi mdi-plus"></i>
                </div>
                <div>
                  <h3 class="modal-title">Create Exam Batch</h3>
                  <span class="text-xs text-slate-500 font-medium mt-0.5 block">1 candidate enrollment consumes 1 token from your wallet</span>
                </div>
              </div>
              <button class="modal-close-btn" @click="showCreateBatchModal = false"><i class="mdi mdi-close"></i></button>
            </div>

            <form @submit.prevent="submitCreateBatch">
              <div class="modal-body space-y-4">
                <!-- Shortfall Warning Banner -->
                <div v-if="batchShortfall > 0" class="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4">
                  <div>
                    <div class="font-bold text-xs uppercase tracking-wider text-amber-800">Insufficient Token Balance</div>
                    <div class="text-xs mt-0.5">
                      Selected: <strong>{{ batchForm.student_ids.length }}</strong> | Available: <strong>{{ wallet.totalRemaining }}</strong> | Shortfall: <strong class="text-red">{{ batchShortfall }} tokens</strong>
                    </div>
                  </div>
                  <button type="button" class="btn-glass text-xs text-amber-800" @click="showStoreModal = true">Buy Tokens</button>
                </div>

                <div>
                  <label class="form-label-xs">Select Certification Exam *</label>
                  <select v-model="batchForm.exam_id" class="modal-input-field" required>
                    <option value="" disabled>Choose an active certification exam...</option>
                    <option v-for="exam in exams" :key="exam.id" :value="exam.id">{{ exam.name }}</option>
                  </select>
                </div>

                <!-- Interactive Candidate Selection Roster -->
                <div class="space-y-2 mb-4">
                  <div class="flex items-center justify-between pb-1">
                    <label class="form-label-xs mb-0">Select Candidate Students *</label>
                    <div class="flex items-center gap-2 text-xs font-semibold">
                      <button type="button" class="text-red hover:underline" @click="selectAllStudents">Select All</button>
                      <span class="text-slate-300">•</span>
                      <button type="button" class="text-slate-500 hover:underline" @click="deselectAllStudents">Clear Selection</button>
                    </div>
                  </div>

                  <!-- Candidate Search Filter -->
                  <div class="search-box w-full">
                    <i class="mdi mdi-magnify search-icon"></i>
                    <input
                      v-model="studentSearchQuery"
                      type="text"
                      placeholder="Filter candidates by name or email..."
                      class="search-input py-1.5 text-xs"
                    />
                  </div>

                  <!-- Candidate Checkbox List -->
                  <div class="student-select-box">
                    <div v-if="filteredModalStudents.length === 0" class="text-center py-6 text-slate-400 text-xs font-medium">
                      No candidates match your filter or roster is empty.
                    </div>

                    <div
                      v-for="student in filteredModalStudents"
                      :key="student.id"
                      class="student-picker-row"
                      :class="{ 'selected': isStudentSelected(student.id) }"
                      @click="toggleStudentSelection(student.id)"
                    >
                      <input
                        type="checkbox"
                        :checked="isStudentSelected(student.id)"
                        class="student-checkbox"
                        @click.stop="toggleStudentSelection(student.id)"
                      />
                      <div class="w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {{ student.name ? student.name.charAt(0).toUpperCase() : 'S' }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="font-bold text-slate-900 text-xs truncate">{{ student.name }}</div>
                        <div class="text-[11px] text-slate-500 font-mono truncate">{{ student.email }}</div>
                      </div>
                      <span v-if="isStudentSelected(student.id)" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Selected
                      </span>
                    </div>
                  </div>

                  <!-- Selection Counter Summary -->
                  <div class="flex items-center justify-between mt-2 text-xs font-semibold text-slate-500">
                    <span>
                      <strong class="text-slate-900">{{ batchForm.student_ids.length }}</strong> candidate(s) selected
                    </span>
                    <span class="text-red font-bold">
                      Cost: {{ batchForm.student_ids.length }} Token(s)
                    </span>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="form-label-xs">Exam Batch Opens At (Optional)</label>
                    <input v-model="batchForm.opens_at" type="datetime-local" class="modal-input-field" />
                  </div>
                  <div>
                    <label class="form-label-xs">Exam Batch Closes At (Optional)</label>
                    <input v-model="batchForm.closes_at" type="datetime-local" class="modal-input-field" />
                  </div>
                </div>
              </div>

              <div class="modal-footer flex items-center justify-between">
                <button type="button" class="btn-glass" @click="showCreateBatchModal = false">Cancel</button>
                <button type="submit" class="btn-red" :disabled="savingBatch || batchForm.student_ids.length === 0 || batchShortfall > 0">
                  <i class="mdi mdi-check"></i> Create Exam Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Single Student Retry Link Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showRetryLinkModal" class="modal-overlay" @click.self="showRetryLinkModal = false">
          <div class="modal-card max-w-md">
            <div class="modal-header">
              <div class="flex items-center gap-3">
                <div class="icon-box-lg bg-indigo-light text-indigo">
                  <i class="mdi mdi-link-plus"></i>
                </div>
                <div>
                  <h3 class="modal-title">Create Single-Student Retry Link</h3>
                  <span class="text-xs text-slate-500 font-medium">Generates a dedicated retry link (Spends 1 token)</span>
                </div>
              </div>
              <button class="modal-close-btn" @click="showRetryLinkModal = false"><i class="mdi mdi-close"></i></button>
            </div>

            <div class="modal-body space-y-4">
              <p class="text-xs text-slate-600 leading-relaxed">
                Generates a dedicated single-student retry link tied to the original exam batch for candidate retry.
              </p>

              <div>
                <label class="form-label-xs">Link Expiration Date/Time (Optional)</label>
                <input v-model="retryLinkExpiresAt" type="datetime-local" class="modal-input-field" />
              </div>
            </div>

            <div class="modal-footer flex items-center justify-between">
              <button class="btn-glass" @click="showRetryLinkModal = false">Cancel</button>
              <button class="btn-red" @click="submitDedicatedRetryLink" :disabled="creatingRetryLink">
                <i class="mdi mdi-link-variant"></i> Generate Link (1 Token)
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Edit Profile Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showEditProfileModal" class="modal-overlay" @click.self="showEditProfileModal = false">
          <div class="modal-card max-w-lg">
            <div class="modal-header">
              <div class="flex items-center gap-3.5">
                <div class="icon-box-lg bg-red-light text-red">
                  <i class="mdi mdi-account-edit"></i>
                </div>
                <div>
                  <h3 class="modal-title">Edit Profile &amp; Center Details</h3>
                  <span class="text-xs text-slate-500 font-medium">Update staff credentials and sub-center organization information</span>
                </div>
              </div>
              <button class="modal-close-btn" @click="showEditProfileModal = false"><i class="mdi mdi-close"></i></button>
            </div>

            <form @submit.prevent="submitUpdateProfile">
              <div class="modal-body">
                <!-- Staff Credentials Section -->
                <div class="form-group">
                  <label class="form-label-xs">Staff Full Name</label>
                  <input v-model="editProfileForm.name" type="text" class="modal-input-field" placeholder="Enter staff full name" required />
                </div>

                <div class="form-group">
                  <label class="form-label-xs">Staff Email (Read-Only)</label>
                  <input :value="profileData?.user?.email || authStore.user?.email" type="email" class="modal-input-field" disabled />
                </div>

                <div class="form-group">
                  <label class="form-label-xs">Contact Phone</label>
                  <input v-model="editProfileForm.phone" type="text" class="modal-input-field" placeholder="Enter contact phone number" />
                </div>

                <!-- Organization Details Section -->
                <div class="pt-5 border-t border-slate-100 mt-6">
                  <div class="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-4">Organization Settings</div>
                  <div class="form-group mb-0">
                    <label class="form-label-xs">Sub-Center / Organization Name</label>
                    <input v-model="editProfileForm.organization_name" type="text" class="modal-input-field" placeholder="Enter sub-center organization name" required />
                  </div>
                </div>
              </div>

              <div class="modal-footer flex items-center justify-between">
                <button type="button" class="btn-glass" @click="showEditProfileModal = false">Cancel</button>
                <button type="submit" class="btn-red" :disabled="savingProfile">
                  <i :class="['mdi', savingProfile ? 'mdi-loading spin-icon' : 'mdi-check']"></i> Save Changes
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
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';

const config = useRuntimeConfig();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const api = useApi();

const initialTab = computed(() => {
  const t = route.query.tab as string;
  if (['dashboard', 'students', 'wallet', 'batches', 'certificates', 'profile'].includes(t)) return t;
  return 'dashboard';
});

const activeTab = ref(initialTab.value);

watch(() => route.query.tab, (newTab) => {
  if (['dashboard', 'students', 'wallet', 'batches', 'certificates', 'profile'].includes(newTab as string)) {
    activeTab.value = newTab as string;
  } else if (!newTab) {
    activeTab.value = 'dashboard';
  }
});

const switchTab = (tab: string) => {
  activeTab.value = tab;
  router.push({ path: '/sub-center', query: { tab } });
};

const handleLogout = async () => {
  await authStore.logout();
};

// Candidate picker state & helpers for batch modal
const studentSearchQuery = ref('');

const filteredModalStudents = computed(() => {
  if (!studentSearchQuery.value) return students.value;
  const q = studentSearchQuery.value.toLowerCase();
  return students.value.filter(s => s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q));
});

const toggleStudentSelection = (studentId: string) => {
  const index = batchForm.value.student_ids.indexOf(studentId);
  if (index > -1) {
    batchForm.value.student_ids.splice(index, 1);
  } else {
    batchForm.value.student_ids.push(studentId);
  }
};

const isStudentSelected = (studentId: string) => {
  return batchForm.value.student_ids.includes(studentId);
};

const selectAllStudents = () => {
  batchForm.value.student_ids = students.value.map(s => s.id);
};

const deselectAllStudents = () => {
  batchForm.value.student_ids = [];
};

// Wallet state
const wallet = ref<any>({ totalRemaining: 0, totalPurchased: 0, totalUsed: 0 });
const transactions = ref<any[]>([]);
const loadingTransactions = ref(false);
const availablePackages = ref<any[]>([]);
const showStoreModal = ref(false);
const buyingPkg = ref(false);

// Student state
const students = ref<any[]>([]);
const loadingStudents = ref(false);
const showAddStudentModal = ref(false);
const savingStudent = ref(false);
const studentForm = ref({ name: '', email: '', phone: '' });

// Exam state
const exams = ref<any[]>([]);

// Batch state
const batches = ref<any[]>([]);
const loadingBatches = ref(false);
const showCreateBatchModal = ref(false);
const savingBatch = ref(false);
const batchForm = ref<any>({ exam_id: '', student_ids: [], opens_at: '', closes_at: '' });

const selectedBatch = ref<any>(null);
const batchAssignments = ref<any[]>([]);
const loadingAssignments = ref(false);

// Certificates State
const certificates = ref<any[]>([]);
const loadingCertificates = ref(false);
const certSearchQuery = ref('');

const filteredCertificates = computed(() => {
  if (!certSearchQuery.value) return certificates.value;
  const q = certSearchQuery.value.toLowerCase();
  return certificates.value.filter(c =>
    c.student_name?.toLowerCase().includes(q) ||
    c.student_email?.toLowerCase().includes(q) ||
    c.certificate_number?.toLowerCase().includes(q) ||
    c.exam_name?.toLowerCase().includes(q)
  );
});

// Profile State
const profileData = ref<any>(null);
const loadingProfile = ref(false);
const showEditProfileModal = ref(false);
const savingProfile = ref(false);
const editProfileForm = ref({
  name: '',
  phone: '',
  organization_name: ''
});

const centerName = computed(() => {
  return profileData.value?.organization?.name || authStore.user?.org_name || authStore.user?.organization_name || 'Sub-Center';
});

// Retry Link State
const showRetryLinkModal = ref(false);
const targetAssignmentForRetryLink = ref<any>(null);
const retryLinkExpiresAt = ref('');
const creatingRetryLink = ref(false);

// Table Headers
const batchHeaders = [
  { title: 'Exam Name', key: 'exam_name' },
  { title: 'Status', key: 'status' },
  { title: 'Enrolled Count', key: 'student_count' },
  { title: 'Opens At', key: 'opens_at' },
  { title: 'Closes At', key: 'closes_at' },
  { title: 'Actions', key: 'actions', sortable: false }
];

const assignmentHeaders = [
  { title: 'Student Name', key: 'student_name' },
  { title: 'Email', key: 'student_email' },
  { title: 'Attempts Used', key: 'attempts' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false }
];

const studentHeaders = [
  { title: 'Student Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phone' },
  { title: 'Registration Date', key: 'created_at' }
];

const txHeaders = [
  { title: 'Transaction Type', key: 'type' },
  { title: 'Tokens', key: 'token_count' },
  { title: 'Package', key: 'package_name' },
  { title: 'Timestamp', key: 'created_at' }
];

const certificateHeaders = [
  { title: 'Certificate Number', key: 'certificate_number' },
  { title: 'Student Candidate', key: 'student_name' },
  { title: 'Exam Qualification', key: 'exam_name' },
  { title: 'Issue Date', key: 'issue_date' },
  { title: 'Actions', key: 'actions', sortable: false }
];

// Shortfall calculation
const batchShortfall = computed(() => {
  const needed = batchForm.value.student_ids.length;
  const avail = wallet.value.totalRemaining || 0;
  return needed > avail ? needed - avail : 0;
});

onMounted(() => {
  fetchWallet();
  fetchStudents();
  fetchExams();
  fetchBatches();
  fetchAvailablePackages();
  fetchTransactions();
  fetchCertificates();
  fetchProfile();
});

async function fetchWallet() {
  try {
    const { data } = await api.get('/sub-center/wallet');
    wallet.value = data;
  } catch (err) {
    console.error('Error fetching wallet', err);
  }
}

async function fetchStudents() {
  loadingStudents.value = true;
  try {
    const { data } = await api.get('/sub-center/students');
    students.value = data;
  } catch (err) {
    console.error(err);
  } finally {
    loadingStudents.value = false;
  }
}

async function registerStudent() {
  if (!studentForm.value.name || !studentForm.value.email) return;
  savingStudent.value = true;
  try {
    await api.post('/sub-center/students', studentForm.value);
    showAddStudentModal.value = false;
    studentForm.value = { name: '', email: '', phone: '' };
    fetchStudents();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to register student');
  } finally {
    savingStudent.value = false;
  }
}

async function fetchAvailablePackages() {
  try {
    const { data } = await api.get('/sub-center/token-packages');
    availablePackages.value = data;
  } catch (err) {
    console.error(err);
  }
}

async function buyTokenPackage(packageId: string) {
  buyingPkg.value = true;
  try {
    await api.post('/sub-center/packages/purchase', { package_id: packageId });
    showStoreModal.value = false;
    fetchWallet();
    fetchTransactions();
    alert('Token package purchased successfully!');
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to purchase tokens');
  } finally {
    buyingPkg.value = false;
  }
}

async function fetchTransactions() {
  loadingTransactions.value = true;
  try {
    const { data } = await api.get('/sub-center/transactions');
    transactions.value = data;
  } catch (err) {
    console.error(err);
  } finally {
    loadingTransactions.value = false;
  }
}

async function fetchExams() {
  try {
    const { data } = await api.get('/sub-center/exams');
    exams.value = data;
  } catch (err) {
    console.error(err);
  }
}

async function fetchBatches() {
  loadingBatches.value = true;
  try {
    const { data } = await api.get('/sub-center/batches');
    batches.value = data;
  } catch (err) {
    console.error(err);
  } finally {
    loadingBatches.value = false;
  }
}

function openCreateBatchModal() {
  batchForm.value = { exam_id: '', student_ids: [], opens_at: '', closes_at: '' };
  showCreateBatchModal.value = true;
}

async function submitCreateBatch() {
  savingBatch.value = true;
  try {
    await api.post('/sub-center/batches', batchForm.value);
    showCreateBatchModal.value = false;
    fetchBatches();
    fetchWallet();
    fetchTransactions();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to create batch');
  } finally {
    savingBatch.value = false;
  }
}

async function cancelBatch(batch: any) {
  if (!confirm('Are you sure you want to cancel this batch? Unstarted tokens will be instantly refunded.')) return;
  try {
    await api.post(`/sub-center/batches/${batch.id}/cancel`);
    fetchBatches();
    fetchWallet();
    fetchTransactions();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to cancel batch');
  }
}

async function viewBatchDetails(batch: any) {
  selectedBatch.value = batch;
  loadingAssignments.value = true;
  try {
    const { data } = await api.get(`/sub-center/batches/${batch.id}`);
    batchAssignments.value = data.assignments;
  } catch (err) {
    console.error(err);
  } finally {
    loadingAssignments.value = false;
  }
}

async function grantTechnicalRetry(item: any) {
  if (!confirm('Grant technical retry for this assignment?')) return;
  try {
    await api.post(`/sub-center/assignments/${item.id}/grant-retry`);
    if (selectedBatch.value) viewBatchDetails(selectedBatch.value);
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to grant technical retry');
  }
}

function openRetryLinkModal(item: any) {
  targetAssignmentForRetryLink.value = item;
  retryLinkExpiresAt.value = '';
  showRetryLinkModal.value = true;
}

async function submitDedicatedRetryLink() {
  if (!targetAssignmentForRetryLink.value) return;
  creatingRetryLink.value = true;
  try {
    await api.post(`/sub-center/assignments/${targetAssignmentForRetryLink.value.id}/retry-link`, {
      expires_at: retryLinkExpiresAt.value || null
    });
    showRetryLinkModal.value = false;
    fetchWallet();
    fetchTransactions();
    if (selectedBatch.value) viewBatchDetails(selectedBatch.value);
    alert('Single-student retry link created successfully!');
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to create dedicated retry link');
  } finally {
    creatingRetryLink.value = false;
  }
}

async function fetchCertificates() {
  loadingCertificates.value = true;
  try {
    const { data } = await api.get('/sub-center/certificates');
    certificates.value = data;
  } catch (err) {
    console.error('Error fetching certificates:', err);
  } finally {
    loadingCertificates.value = false;
  }
}

async function fetchProfile() {
  loadingProfile.value = true;
  try {
    const { data } = await api.get('/sub-center/profile');
    profileData.value = data;
  } catch (err) {
    console.error('Error fetching profile:', err);
  } finally {
    loadingProfile.value = false;
  }
}

function openEditProfileModal() {
  editProfileForm.value = {
    name: profileData.value?.user?.name || authStore.user?.name || '',
    phone: profileData.value?.user?.phone || '',
    organization_name: profileData.value?.organization?.name || authStore.user?.org_name || ''
  };
  showEditProfileModal.value = true;
}

async function submitUpdateProfile() {
  savingProfile.value = true;
  try {
    const { data: updated } = await api.put('/sub-center/profile', editProfileForm.value);
    profileData.value = {
      user: updated.user,
      organization: updated.organization
    };
    if (authStore.user) {
      authStore.user.name = updated.user.name;
      if (updated.organization?.name) {
        authStore.user.org_name = updated.organization.name;
      }
    }
    showEditProfileModal.value = false;
    alert('Profile and center details updated successfully!');
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to update profile details');
  } finally {
    savingProfile.value = false;
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
}

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'sub_center_staff']
});
</script>

<style scoped>
.gsfin-admin-page {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  background: #FAFAFD;
  color: #0F172A;
  min-height: 100vh;
  padding: 40px 48px;
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
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.eyebrow-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  font-weight: 800;
  color: #E31B23;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.admin-title {
  font-size: 1.95rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
  letter-spacing: -0.02em;
}

.admin-subtitle {
  font-size: 0.94rem;
  color: #64748B;
  margin: 6px 0 0 0;
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
  color: #334155;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}
.btn-glass:hover { background: #F8FAFC; color: #E31B23; border-color: rgba(227, 27, 35, 0.3); }

.btn-red {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.88rem;
  box-shadow: 0 3px 10px rgba(227, 27, 35, 0.2);
  transition: all 0.2s ease;
  cursor: pointer;
  text-decoration: none;
}
.btn-red:hover { background: #C4131B; transform: translateY(-1px); }

.live-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  padding: 8px 18px;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #10B981;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  animation: pulseDot 1.8s infinite;
}
@keyframes pulseDot {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 36px;
}
@media (max-width: 1024px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .metrics-grid { grid-template-columns: 1fr; } }

.metric-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
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

.bg-indigo-light { background: rgba(79, 70, 229, 0.1); }
.text-indigo { color: #4F46E5; }
.bg-emerald-light { background: rgba(16, 185, 129, 0.1); }
.text-emerald { color: #059669; }
.bg-amber-light { background: rgba(245, 158, 11, 0.1); }
.text-amber { color: #D97706; }
.bg-red-light { background: rgba(227, 27, 35, 0.1); }
.text-red { color: #E31B23; }

.metric-info {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748B;
}

.metric-value {
  font-size: 1.75rem;
  font-weight: 900;
  color: #0F172A;
  line-height: 1.2;
  margin: 4px 0 2px 0;
}

.metric-sub {
  font-size: 0.76rem;
  font-weight: 700;
}

/* Panel & Card */
.panel-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
  overflow: hidden;
}

.panel-card-header {
  padding: 24px 32px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  background: #FAFAFD;
}

.panel-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}
.panel-icon {
  font-size: 1.35rem;
  color: #E31B23;
}
.panel-title-wrap h3 {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
}
.panel-subtitle-text {
  font-size: 0.78rem;
  color: #64748B;
  margin: 2px 0 0 0;
  font-weight: 500;
}

.panel-filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

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
  padding: 8px 14px 8px 40px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  font-size: 0.84rem;
  color: #0F172A;
  outline: none;
  width: 260px;
  transition: border-color 0.2s;
}
.table-search-input:focus {
  border-color: #E31B23;
}

.btn-icon-refresh {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-icon-refresh:hover {
  color: #E31B23;
  border-color: #E31B23;
}
.spin-icon {
  animation: spin 0.75s linear infinite;
}

.card-content-body {
  padding: 24px;
}
.card-content-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

.batch-feed-row {
  padding: 14px 18px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #F8FAFC;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.batch-feed-row:hover {
  background: #FFFFFF;
  border-color: rgba(227, 27, 35, 0.3);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

/* Tables */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.gsfin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.86rem;
}

.gsfin-table :deep(th) {
  padding: 16px 24px !important;
  font-size: 0.72rem !important;
  font-weight: 800 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.06em !important;
  color: #64748B !important;
  background: #F8FAFC !important;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08) !important;
  white-space: nowrap !important;
}

.gsfin-table :deep(td) {
  padding: 18px 24px !important;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06) !important;
  color: #334155 !important;
  vertical-align: middle !important;
}

.gsfin-table :deep(tbody tr:hover) {
  background: rgba(248, 250, 252, 0.9) !important;
}

/* Badges & Chips */
.badge-chip {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.chip-green { background: rgba(16, 185, 129, 0.1); color: #059669; }
.chip-blue { background: rgba(59, 130, 246, 0.1); color: #2563EB; }
.chip-red { background: rgba(227, 27, 35, 0.1); color: #E31B23; }
.chip-amber { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.chip-slate { background: rgba(100, 116, 139, 0.1); color: #64748B; }

/* Action Buttons & Icon Action Group */
.action-btn-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-table-action {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view { background: rgba(59, 130, 246, 0.1); color: #2563EB; text-decoration: none; }
.btn-view:hover { background: #2563EB; color: #FFFFFF; }

.btn-edit { background: #F1F5F9; color: #475569; }
.btn-edit:hover { background: #E2E8F0; color: #0F172A; }

.btn-warn { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.btn-warn:hover { background: #D97706; color: #FFFFFF; }

.btn-success { background: rgba(16, 185, 129, 0.1); color: #059669; text-decoration: none; }
.btn-success:hover { background: #059669; color: #FFFFFF; }

.btn-danger { background: rgba(227, 27, 35, 0.08); color: #E31B23; }
.btn-danger:hover { background: #E31B23; color: #FFFFFF; }

/* Dashboard Split Row Layout */
.dashboard-split-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}
@media (max-width: 1024px) {
  .dashboard-split-row {
    grid-template-columns: 1fr;
  }
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  box-sizing: border-box;
}

.modal-card {
  background: #FFFFFF;
  border-radius: 24px;
  width: 100%;
  max-height: calc(100vh - 48px);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin: auto;
  animation: modalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalPop {
  from { opacity: 0; transform: scale(0.96) translateY(12px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 24px 32px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: #FAFAFD;
}

.icon-box-lg {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.45rem;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
  line-height: 1.2;
}

.modal-close-btn {
  background: #F1F5F9;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #64748B;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.modal-close-btn:hover { background: rgba(227, 27, 35, 0.1); color: #E31B23; }

.modal-card form {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.modal-body {
  padding: 32px 32px 28px 32px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 20px 32px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  background: #FAFAFD;
  flex-shrink: 0;
}

.form-group {
  margin-bottom: 22px;
}
.form-group:last-child {
  margin-bottom: 0;
}

.form-label-xs {
  display: block;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #475569;
  margin-bottom: 8px;
}

.modal-input-field {
  width: 100%;
  height: 46px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  font-size: 0.92rem;
  font-weight: 500;
  color: #0F172A;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  box-sizing: border-box;
}

.modal-input-field:focus {
  background: #FFFFFF;
  border-color: #E31B23;
  box-shadow: 0 0 0 4px rgba(227, 27, 35, 0.12);
}

.modal-input-field:disabled,
.modal-input-field[disabled] {
  background-color: #F8FAFC !important;
  color: #64748B !important;
  border-color: #E2E8F0 !important;
  cursor: not-allowed !important;
  opacity: 0.85;
}

.spinner-sm-red {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(227, 27, 35, 0.2);
  border-top-color: #E31B23;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .gsfin-admin-page { padding: 24px 16px; }
  .admin-header-row { flex-direction: column; align-items: flex-start; }
}

/* Candidate Picker Roster Styles */
.student-select-box {
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 14px;
  background: #FAFAFD;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-picker-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.06);
  cursor: pointer;
  transition: all 0.18s ease;
}

.student-picker-row:hover {
  border-color: rgba(227, 27, 35, 0.3);
  background: #FFFDFD;
}

.student-picker-row.selected {
  border-color: rgba(16, 185, 129, 0.4);
  background: #ECFDF5;
}

.student-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #E31B23;
  cursor: pointer;
}

/* Search Box Controls */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  font-size: 1.1rem;
  pointer-events: none;
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 8px 14px 8px 38px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  font-size: 0.84rem;
  outline: none;
  background: #FFFFFF;
  color: #0F172A;
  transition: all 0.2s;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #E31B23;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.1);
}

/* ── Profile & Settings Layout ── */
.profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.profile-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
  display: flex;
  flex-direction: column;
}

.profile-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.profile-avatar {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: rgba(227, 27, 35, 0.1);
  color: #E31B23;
  font-weight: 900;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.profile-name {
  font-size: 1rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
  line-height: 1.2;
}

.profile-role-chip {
  font-size: 0.68rem;
  font-weight: 800;
  color: #E31B23;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-top: 3px;
}

.profile-email {
  font-size: 0.76rem;
  color: #64748B;
  font-family: monospace;
  margin-top: 2px;
}

.profile-sub {
  font-size: 0.75rem;
  color: #64748B;
  font-weight: 500;
}

.field-item {
  margin-bottom: 14px;
}
.field-item:last-child {
  margin-bottom: 0;
}

.field-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94A3B8;
  margin-bottom: 4px;
}

.field-value {
  padding: 10px 14px;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  font-size: 0.84rem;
  color: #0F172A;
}

.wallet-balance-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #ECFDF5;
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 12px;
  font-size: 0.84rem;
}

.btn-text-red {
  background: none;
  border: none;
  color: #E31B23;
  font-weight: 800;
  font-size: 0.78rem;
  cursor: pointer;
}
.btn-text-red:hover { text-decoration: underline; }

.action-buttons-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-action-tile {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #FFFFFF;
  color: #334155;
  font-size: 0.84rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.18s ease;
  text-align: left;
}
.btn-action-tile:hover {
  background: #F8FAFC;
  border-color: rgba(15, 23, 42, 0.15);
  transform: translateY(-1px);
}

.btn-logout-tile {
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.2);
  background: #FFFDFD;
}
.btn-logout-tile:hover {
  background: #FEF2F2;
  border-color: rgba(227, 27, 35, 0.4);
}
</style>
