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
          <!-- 1. Total Students -->
          <div class="metric-card metric-card-blue" @click="switchTab('students')">
            <div class="metric-icon-box bg-blue-light">
              <i class="mdi mdi-account-group-outline text-blue"></i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Total Students</span>
              <span class="metric-value text-blue">{{ students.length }}</span>
              <span class="metric-sub text-blue">Registered Roster</span>
            </div>
          </div>

          <!-- 2. Active Exam Batches -->
          <div class="metric-card metric-card-emerald" @click="switchTab('batches')">
            <div class="metric-icon-box bg-emerald-light">
              <i class="mdi mdi-subtitles-outline text-emerald"></i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Active Exam Batches</span>
              <span class="metric-value text-emerald">{{ batches.length }}</span>
              <span class="metric-sub text-emerald">Test Batches Created</span>
            </div>
          </div>

          <!-- 3. Certificates Issued -->
          <div class="metric-card metric-card-red" @click="switchTab('certificates')">
            <div class="metric-icon-box bg-red-light">
              <i class="mdi mdi-file-certificate-outline text-red"></i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Certificates Issued</span>
              <span class="metric-value text-red">{{ certificates.length }}</span>
              <span class="metric-sub text-red">Verified Qualifications</span>
            </div>
          </div>

          <!-- 4. Token Wallet Balance -->
          <div class="metric-card metric-card-indigo" @click="switchTab('wallet')">
            <div class="metric-icon-box bg-indigo-light">
              <i class="mdi mdi-wallet-outline text-indigo"></i>
            </div>
            <div class="metric-info">
              <span class="metric-label">Token Wallet Balance</span>
              <span class="metric-value text-indigo">{{ wallet.totalRemaining || 0 }}</span>
              <span class="metric-sub text-indigo">Purchased: {{ wallet.totalPurchased || 0 }} • Used: {{ wallet.totalUsed || 0 }}</span>
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
                    <p class="panel-subtitle-text">Latest active test batches and student enrollments</p>
                  </div>
                </div>
                <button class="btn-text-red text-xs font-semibold hover:underline flex items-center gap-1" @click="switchTab('batches')">
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
                    @click="goToBatch(b.id)"
                  >
                    <div class="min-w-0 flex-1">
                      <div class="font-semibold text-slate-900 text-sm truncate">{{ b.exam_name }}</div>
                      <div class="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span>Students: <strong class="text-slate-800">{{ b.student_count || 0 }}</strong></span>
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
                      <div class="font-semibold text-xs">View Exam Batches</div>
                      <div class="text-[11px] text-slate-400">Manage active test sessions</div>
                    </div>
                  </button>

                  <button class="btn-action-tile" @click="switchTab('students')">
                    <div class="metric-icon-box bg-indigo-light text-indigo shrink-0" style="width:40px; height:40px; border-radius:12px; font-size:1.2rem;">
                      <i class="mdi mdi-account-group"></i>
                    </div>
                    <div>
                      <div class="font-semibold text-xs">Students</div>
                      <div class="text-[11px] text-slate-400">View registered students</div>
                    </div>
                  </button>

                  <button class="btn-action-tile" @click="switchTab('wallet')">
                    <div class="metric-icon-box bg-indigo-light text-indigo shrink-0" style="width:40px; height:40px; border-radius:12px; font-size:1.2rem;">
                      <i class="mdi mdi-wallet-outline"></i>
                    </div>
                    <div>
                      <div class="font-semibold text-xs">Token Wallet Audit</div>
                      <div class="text-[11px] text-slate-400">Check balance and history</div>
                    </div>
                  </button>
                </div>
              </div>

              <div class="card-content-footer flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-50/50">
                <span>Total Students: <strong class="text-slate-900">{{ students.length }}</strong></span>
                <button class="text-red font-semibold hover:underline" @click="switchTab('students')">View Students</button>
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
                  <h3>Exam Batches</h3>
                  <p class="panel-subtitle-text">Active test batches, student enrollments, and dedicated retry links</p>
                </div>
              </div>

              <div class="panel-filter-row">
                <NuxtLink to="/sub-center/batches/create" class="btn-red text-xs py-2 px-4 no-underline inline-flex items-center gap-1">
                  <i class="mdi mdi-plus"></i> Create Exam Batch
                </NuxtLink>
                <button class="btn-icon-refresh" title="Refresh Batches" @click="fetchBatches" :disabled="loadingBatches">
                  <i :class="['mdi', 'mdi-refresh', { 'spin-icon': loadingBatches }]"></i>
                </button>
              </div>
            </div>

            <div class="table-responsive">
              <table class="gsfin-table">
                <thead>
                  <tr>
                    <th>Exam Certification</th>
                    <th>Status</th>
                    <th>Students</th>
                    <th>Opens At</th>
                    <th>Closes At</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingBatches">
                    <td colspan="6" class="text-center py-12 text-slate-500">
                      <span class="spinner-sm-red"></span> Loading Batches...
                    </td>
                  </tr>
                  <tr v-else-if="batches.length === 0">
                    <td colspan="6" class="text-center py-16">
                      <div class="empty-state-box">
                        <div class="empty-icon-wrap">
                          <i class="mdi mdi-clipboard-text-outline"></i>
                        </div>
                        <h4 class="empty-state-title">No Exam Batches Created</h4>
                        <p class="empty-state-desc">
                          Create your first exam batch to enroll students for certification exams.
                        </p>
                        <NuxtLink to="/sub-center/batches/create" class="btn-red btn-sm mt-3 inline-flex items-center gap-1.5 no-underline">
                          <i class="mdi mdi-plus"></i> Create Exam Batch
                        </NuxtLink>
                      </div>
                    </td>
                  </tr>
                  <tr v-for="item in paginatedBatches" :key="item.id" class="cursor-pointer" @click="goToBatch(item.id)">
                    <td>
                      <div class="font-semibold text-slate-900">{{ item.exam_name }}</div>
                      <div class="text-[11px] font-mono text-slate-400">Batch #{{ item.id?.slice(0, 8) }}</div>
                    </td>
                    <td>
                      <span :class="['badge-chip', item.status === 'open' ? 'chip-green' : item.status === 'cancelled' ? 'chip-red' : 'chip-slate']">
                        {{ item.status?.toUpperCase() }}
                      </span>
                    </td>
                    <td>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800">
                        {{ item.student_count || 0 }} Students
                      </span>
                    </td>
                    <td>
                      <span class="text-xs text-slate-600 font-medium whitespace-nowrap">{{ formatDate(item.opens_at) }}</span>
                    </td>
                    <td>
                      <span class="text-xs text-slate-600 font-medium whitespace-nowrap">{{ formatDate(item.closes_at) }}</span>
                    </td>
                    <td class="text-right" @click.stop>
                      <div class="action-btn-group justify-end">
                        <NuxtLink :to="'/sub-center/batches/' + item.id" class="btn-table-action btn-view no-underline" title="View Batch &amp; Enrolled Students">
                          <i class="mdi mdi-eye-outline"></i>
                        </NuxtLink>
                        <button v-if="item.status === 'open'" class="btn-table-action btn-danger" title="Cancel Batch" @click="cancelBatch(item)">
                          <i class="mdi mdi-close-circle-outline"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <AppPagination
                v-if="batches.length > 0"
                v-model="batchPage"
                v-model:items-per-page="batchPerPage"
                :total-items="batches.length"
                :per-page-options="[10, 25, 50, 100]"
              />
            </div>
          </div>
        </div>

        <!-- ═══ TAB 2: STUDENTS ═══ -->
        <div v-else-if="activeTab === 'students'" class="tab-panel">
          <div class="panel-card">
            <div class="panel-card-header">
              <div class="panel-title-wrap">
                <i class="mdi mdi-account-group panel-icon"></i>
                <div>
                  <h3>Students</h3>
                  <p class="panel-subtitle-text">Manage registered students for training and exams</p>
                </div>
              </div>

              <div class="panel-filter-row">
                <div class="search-input-wrap">
                  <i class="mdi mdi-magnify search-icon"></i>
                  <input v-model="studentSearchQuery" type="text" placeholder="Search students..." class="table-search-input" />
                </div>
                <button class="btn-red text-xs py-2 px-4 inline-flex items-center gap-1.5" @click="openRegisterStudentModal">
                  <i class="mdi mdi-account-plus"></i> Add Student
                </button>
              </div>
            </div>

            <div class="table-responsive">
              <table class="gsfin-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Face Photo</th>
                    <th>Phone</th>
                    <th>Education</th>
                    <th>Registered Date</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingStudents">
                    <td colspan="6" class="text-center py-12 text-slate-500">
                      <span class="spinner-sm-red"></span> Loading Students...
                    </td>
                  </tr>
                  <tr v-else-if="filteredModalStudents.length === 0">
                    <td colspan="6" class="text-center py-16">
                      <div class="empty-state-box">
                        <div class="empty-icon-wrap">
                          <i class="mdi mdi-account-group-outline"></i>
                        </div>
                        <h4 class="empty-state-title">No Students Found</h4>
                        <p v-if="studentSearchQuery" class="empty-state-desc">
                          No students match &quot;{{ studentSearchQuery }}&quot;.
                        </p>
                        <p v-else class="empty-state-desc">
                          No students registered yet in your center.
                        </p>
                        <button v-if="!studentSearchQuery" class="btn-red btn-sm mt-3 inline-flex items-center gap-1.5" @click="openRegisterStudentModal">
                          <i class="mdi mdi-account-plus"></i> Add First Student
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-for="item in paginatedStudents" :key="item.id">
                    <td>
                      <div class="candidate-cell">
                        <img v-if="item.face_photo" :src="item.face_photo" class="candidate-avatar-photo" alt="" />
                        <div v-else class="candidate-avatar-circle">
                          {{ getInitials(item.name) }}
                        </div>
                        <div class="candidate-meta">
                          <NuxtLink :to="'/sub-center/students/' + item.id" class="candidate-name-link" title="View Student Profile">
                            {{ item.name }}
                          </NuxtLink>
                          <span class="candidate-email-text">{{ item.email }}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span v-if="item.face_photo" class="badge-chip chip-green">
                        <i class="mdi mdi-face-recognition"></i> Enrolled
                      </span>
                      <span v-else class="badge-chip chip-amber">
                        <i class="mdi mdi-camera-outline"></i> Pending
                      </span>
                    </td>
                    <td>
                      <span v-if="item.phone" class="font-mono text-xs text-slate-700 font-medium">{{ item.phone }}</span>
                      <span v-else class="text-xs text-slate-400 italic">-</span>
                    </td>
                    <td>
                      <span v-if="item.education_level" class="badge-chip chip-purple whitespace-nowrap">
                        {{ item.education_level }}
                      </span>
                      <span v-else class="text-xs text-slate-400 italic">-</span>
                    </td>
                    <td>
                      <span class="text-xs text-slate-500 font-medium whitespace-nowrap">{{ formatDate(item.created_at) }}</span>
                    </td>
                    <td class="text-right">
                      <div class="action-btn-group justify-end">
                        <button class="btn-table-action btn-email" title="Resend Credentials Email" @click="resendStudentCredentials(item)">
                          <i class="mdi mdi-email-sync-outline"></i>
                        </button>
                        <NuxtLink :to="'/sub-center/students/' + item.id" class="btn-table-action btn-view" title="View Student Profile">
                          <i class="mdi mdi-eye-outline"></i>
                        </NuxtLink>
                        <button class="btn-table-action btn-edit" title="Edit Student" @click="openEditStudentModal(item)">
                          <i class="mdi mdi-pencil-outline"></i>
                        </button>
                        <button class="btn-table-action btn-danger" title="Delete Student" @click="confirmDeleteStudent(item)">
                          <i class="mdi mdi-trash-can-outline"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <AppPagination
                v-if="filteredModalStudents.length > 0"
                v-model="studentPage"
                v-model:items-per-page="studentPerPage"
                :total-items="filteredModalStudents.length"
                :per-page-options="[10, 25, 50, 100]"
              />
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
                  <h3>Token Wallet &amp; Transaction Audit</h3>
                  <p class="panel-subtitle-text">Unified statement of token purchase requests, admin approvals, and candidate exam batch consumption</p>
                </div>
              </div>

              <div class="panel-filter-row">
                <div class="wallet-balance-pill">
                  <i class="mdi mdi-wallet-outline text-emerald-600"></i>
                  <span>Available Balance: <strong>{{ wallet.totalRemaining || 0 }} Tokens</strong></span>
                </div>
                <button class="btn-red text-xs py-2 px-4" @click="showStoreModal = true">
                  <i class="mdi mdi-cart-plus"></i> Request Token Package
                </button>
                <button class="btn-icon-refresh" title="Refresh Wallet" @click="fetchWallet(); fetchTransactions(); fetchTokenRequests();" :disabled="loadingTransactions || loadingTokenRequests">
                  <i :class="['mdi', 'mdi-refresh', { 'spin-icon': loadingTransactions || loadingTokenRequests }]"></i>
                </button>
              </div>
            </div>

            <!-- Filter Tabs Bar inside the single card -->
            <div class="wallet-filter-tabs-bar">
              <button
                type="button"
                :class="['wallet-tab-btn', { active: walletViewMode === 'all' }]"
                @click="walletViewMode = 'all'"
              >
                All Wallet Activity ({{ allActivityCount }})
              </button>
              <button
                type="button"
                :class="['wallet-tab-btn', { active: walletViewMode === 'requests' }]"
                @click="walletViewMode = 'requests'"
              >
                Purchase Requests ({{ tokenRequests.length }})
                <span v-if="pendingRequestsCount > 0" class="tab-badge-amber">
                  {{ pendingRequestsCount }} Pending
                </span>
              </button>
              <button
                type="button"
                :class="['wallet-tab-btn', { active: walletViewMode === 'ledger' }]"
                @click="walletViewMode = 'ledger'"
              >
                Usage &amp; Deductions ({{ usageDeductionsCount }})
              </button>
            </div>

            <div class="table-responsive">
              <table class="gsfin-table">
                <thead>
                  <tr>
                    <th>Activity Type</th>
                    <th>Item / Package Description</th>
                    <th>Tokens</th>
                    <th>Reference / Invoice</th>
                    <th>Status</th>
                    <th class="text-right">Date &amp; Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingTransactions || loadingTokenRequests">
                    <td colspan="6" class="text-center py-12 text-slate-500">
                      <span class="spinner-sm-red"></span> Loading Ledger Activity...
                    </td>
                  </tr>
                  <tr v-else-if="unifiedWalletEntries.length === 0">
                    <td colspan="6" class="text-center py-16 text-slate-500">
                      <i class="mdi mdi-history text-3xl block mb-2 text-slate-300"></i>
                      No activity records found in this category.
                    </td>
                  </tr>
                  <tr v-for="(item, idx) in paginatedWalletEntries" :key="item.id || idx">
                    <td>
                      <span
                        :class="[
                          'badge-chip',
                          item.rawType === 'request' && item.status === 'pending' ? 'chip-amber' :
                          item.rawType === 'request' && item.status === 'rejected' ? 'chip-red' :
                          item.rawType === 'purchase' || item.rawType === 'redeem' || (item.rawType === 'request' && item.status === 'approved') ? 'chip-green' :
                          item.rawType === 'consume' ? 'chip-red' :
                          'chip-blue'
                        ]"
                      >
                        <i :class="['mdi', item.icon]"></i>
                        {{ item.typeLabel }}
                      </span>
                    </td>
                    <td>
                      <div class="font-semibold text-slate-800 text-xs">{{ item.package_name || 'System / Batch Allocation' }}</div>
                      <div v-if="item.subDetails" class="text-[11px] text-slate-500 mt-0.5">{{ item.subDetails }}</div>
                    </td>
                    <td>
                      <span :class="item.tokenCountClass">
                        {{ item.tokenCountDisplay }}
                      </span>
                    </td>
                    <td>
                      <span v-if="item.reference" class="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {{ item.reference }}
                      </span>
                      <span v-else class="text-xs text-slate-400 italic">-</span>
                    </td>
                    <td>
                      <span :class="['badge-chip', item.statusClass]">
                        {{ item.statusLabel }}
                      </span>
                    </td>
                    <td class="text-right">
                      <span class="text-xs text-slate-500 font-medium whitespace-nowrap">{{ formatDate(item.created_at) }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <AppPagination
                v-if="unifiedWalletEntries.length > 0"
                v-model="walletPage"
                v-model:items-per-page="walletPerPage"
                :total-items="unifiedWalletEntries.length"
                :per-page-options="[10, 25, 50, 100]"
              />
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
                  <p class="panel-subtitle-text">Official certificates issued to students from {{ centerName }}</p>
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
              <table class="gsfin-table">
                <thead>
                  <tr>
                    <th>Certificate Number</th>
                    <th>Student</th>
                    <th>Certification Exam</th>
                    <th>Issued Date</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingCertificates">
                    <td colspan="5" class="text-center py-12 text-slate-500">
                      <span class="spinner-sm-red"></span> Loading Certificates...
                    </td>
                  </tr>
                  <tr v-else-if="filteredCertificates.length === 0">
                    <td colspan="5" class="text-center py-16">
                      <div class="empty-state-box">
                        <div class="empty-icon-wrap">
                          <i class="mdi mdi-file-certificate-outline"></i>
                        </div>
                        <h4 class="empty-state-title">No Certificates Issued Yet</h4>
                        <p class="empty-state-desc">
                          Certificates will automatically appear here as students from {{ centerName }} complete and pass their exams.
                        </p>
                      </div>
                    </td>
                  </tr>
                  <tr v-for="item in paginatedCertificates" :key="item.id">
                    <td>
                      <div class="flex items-center gap-2">
                        <span class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 font-semibold flex items-center justify-center text-sm shrink-0 border border-emerald-100">
                          <i class="mdi mdi-certificate"></i>
                        </span>
                        <div>
                          <div class="font-mono font-semibold text-slate-900 text-xs">{{ item.certificate_number || item.id }}</div>
                          <div class="text-[10px] text-slate-400 font-medium">Verified Certificate</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="font-semibold text-slate-900 text-xs">{{ item.student_name }}</div>
                      <div class="text-[11px] text-slate-500 font-mono">{{ item.student_email }}</div>
                    </td>
                    <td>
                      <span class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        {{ item.exam_name }}
                      </span>
                    </td>
                    <td>
                      <span class="text-xs text-slate-600 font-medium whitespace-nowrap">{{ formatDate(item.issue_date) }}</span>
                    </td>
                    <td class="text-right">
                      <div class="action-btn-group justify-end">
                        <a
                          v-if="item.pdf_url"
                          :href="item.pdf_url"
                          target="_blank"
                          class="btn-table-action btn-edit"
                          title="Download PDF"
                        >
                          <i class="mdi mdi-download"></i>
                        </a>
                        <a
                          :href="item.verification_url || ('/verify/' + (item.certificate_number || item.id))"
                          target="_blank"
                          class="btn-table-action btn-view"
                          title="Verify Online"
                        >
                          <i class="mdi mdi-shield-check"></i>
                        </a>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <AppPagination
                v-if="filteredCertificates.length > 0"
                v-model="certPage"
                v-model:items-per-page="certPerPage"
                :total-items="filteredCertificates.length"
                :per-page-options="[10, 25, 50, 100]"
              />
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
                  <div class="field-value font-semibold text-slate-900">{{ centerName }}</div>
                </div>

                <div class="field-item">
                  <label class="field-label">Organization ID</label>
                  <div class="field-value font-mono text-xs">{{ profileData?.organization?.id || '—' }}</div>
                </div>

                <div class="field-item">
                  <label class="field-label">Token Wallet Balance</label>
                  <div class="wallet-balance-banner">
                    <span class="font-semibold text-emerald-800">{{ wallet.totalRemaining || 0 }} Available Tokens</span>
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
          <div class="modal-card store-modal-card">
            <div class="modal-header">
              <div class="modal-title-row">
                <div class="modal-header-icon bg-red-50 text-red-600 border border-red-100">
                  <i class="mdi mdi-cart-arrow-down"></i>
                </div>
                <div class="modal-title-text">
                  <h3>Request Token Packages</h3>
                  <p>Select a package to request exam credit tokens for your center</p>
                </div>
              </div>
              <button class="modal-close-btn" @click="showStoreModal = false" aria-label="Close modal"><i class="mdi mdi-close"></i></button>
            </div>

            <div class="modal-body">
              <!-- Center Token Status & Offline Billing Banner -->
              <div class="store-balance-banner mb-4">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="balance-icon-box">
                      <i class="mdi mdi-ticket-percent-outline"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Current Available Balance</div>
                      <div class="text-sm font-semibold text-slate-900 mt-0.5">
                        {{ wallet?.totalRemaining || 0 }} Tokens available in center wallet
                      </div>
                    </div>
                  </div>
                  <div class="offline-pill">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Offline Billing / Invoice</span>
                  </div>
                </div>
              </div>

              <!-- Packages Selection Grid -->
              <div class="form-group mb-4">
                <div class="flex items-center justify-between mb-1.5">
                  <label class="form-label mb-0">Select Token Package</label>
                  <span class="text-[11px] text-slate-400">Fixed rate exam credits</span>
                </div>
                <div class="packages-selection-grid">
                  <div
                    v-for="pkg in availablePackages"
                    :key="pkg.id"
                    :class="['package-select-card', { 'selected': selectedPackageId === pkg.id }]"
                    @click="selectedPackageId = pkg.id"
                  >
                    <!-- Card Top -->
                    <div class="package-card-top">
                      <span class="package-tier-name truncate" :title="pkg.name">{{ pkg.name }}</span>
                      <span v-if="selectedPackageId === pkg.id" class="selected-badge">
                        <i class="mdi mdi-check"></i>
                        <span>Selected</span>
                      </span>
                      <span v-else class="unselected-radio"></span>
                    </div>

                    <!-- Token Count -->
                    <div class="package-token-count">
                      <span class="token-num">{{ pkg.token_count }}</span>
                      <span class="token-unit">Tokens</span>
                    </div>

                    <!-- Pricing Info -->
                    <div class="package-price-row">
                      <div class="package-price">${{ Number(pkg.price).toFixed(2) }}</div>
                      <div class="price-rate">${{ (Number(pkg.price) / Number(pkg.token_count)).toFixed(1) }} / token</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Payment Reference Input Field -->
              <div class="form-group mb-2">
                <div class="flex items-center justify-between mb-1">
                  <label class="form-label mb-0">Payment / Wire Transfer Reference <span class="text-xs text-slate-400 font-normal">(Optional)</span></label>
                  <span class="text-[11px] text-slate-400">Wire UTR, Invoice #, Cheque, or PO</span>
                </div>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i class="mdi mdi-receipt-text-outline text-base"></i>
                  </div>
                  <input
                    v-model="tokenRequestPaymentRef"
                    type="text"
                    placeholder="e.g. Bank Wire Ref #, Invoice #1042, or Cheque Number"
                    class="modal-input !pl-10"
                  />
                </div>
              </div>

              <!-- Selected Order Confirmation Summary -->
              <div v-if="selectedPackage" class="selected-order-summary mt-3">
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2 text-slate-700">
                    <i class="mdi mdi-check-circle-outline text-emerald-600"></i>
                    <span>Selected: <strong>{{ selectedPackage.name }}</strong> ({{ selectedPackage.token_count }} Tokens)</span>
                  </div>
                  <div class="font-semibold text-slate-900">
                    Total Payable: ${{ Number(selectedPackage.price).toFixed(2) }}
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer flex items-center justify-between">
              <button type="button" class="btn-glass" @click="showStoreModal = false">Cancel</button>
              <button
                type="button"
                class="btn-red"
                :disabled="submittingTokenRequest || !selectedPackageId"
                @click="submitSelectedTokenRequest"
              >
                <span v-if="submittingTokenRequest" class="flex items-center gap-2">
                  <span class="spinner-sm-white"></span>
                  <span>Submitting Request...</span>
                </span>
                <span v-else class="flex items-center gap-2">
                  <i class="mdi mdi-send text-base"></i>
                  <span>Submit Request (${{ Number(selectedPackage?.price || 0).toFixed(2) }})</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Register / Edit Student Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAddStudentModal" class="modal-overlay" @click.self="showAddStudentModal = false">
          <div class="modal-card modal-card-student-form">
            <div class="modal-header">
              <div class="modal-title-row">
                <div class="modal-header-icon bg-red-50 text-red border border-red-100">
                  <i :class="['mdi', editingStudent ? 'mdi-account-edit' : 'mdi-account-plus']"></i>
                </div>
                <div class="modal-title-text">
                  <h3>{{ editingStudent ? 'Edit Student' : 'Add New Student' }}</h3>
                  <p>{{ editingStudent ? 'Update student details and credentials' : 'Add a student to your center directory' }}</p>
                </div>
              </div>
              <button class="modal-close-btn" @click="showAddStudentModal = false" aria-label="Close modal"><i class="mdi mdi-close"></i></button>
            </div>

            <form @submit.prevent="registerStudent">
              <div class="modal-body modal-scrollable-body">
                <!-- Row 1: Full Name & Phone Number -->
                <div class="form-row-2 mb-4 form-grid-two">
                  <div class="form-group mb-0">
                    <label class="form-label-xs">Full Name <span class="required-star">*</span></label>
                    <div class="input-with-icon">
                      <i class="mdi mdi-account-outline input-prefix-icon"></i>
                      <input v-model="studentForm.name" type="text" class="modal-input-field input-has-prefix" placeholder="Full Name" required />
                    </div>
                  </div>
                  <div class="form-group mb-0">
                    <label class="form-label-xs">Phone Number</label>
                    <div class="input-with-icon">
                      <i class="mdi mdi-phone-outline input-prefix-icon"></i>
                      <input v-model="studentForm.phone" type="text" class="modal-input-field input-has-prefix" placeholder="Phone Number" />
                    </div>
                  </div>
                </div>

                <!-- Row 2: Email Address -->
                <div class="form-group mb-4">
                  <div class="flex items-center justify-between mb-1">
                    <label class="form-label-xs mb-0">Email Address <span class="required-star">*</span></label>
                    <span class="text-[11px] text-slate-400 font-medium">Used for login and exam notifications</span>
                  </div>
                  <div class="input-with-icon">
                    <i class="mdi mdi-email-outline input-prefix-icon"></i>
                    <input v-model="studentForm.email" type="email" class="modal-input-field input-has-prefix" placeholder="Email Address" required />
                  </div>
                </div>

                <!-- Row 2B: Student Face Photo Section -->
                <div class="face-enrollment-card mb-4">
                  <div class="flex items-center justify-between mb-2">
                    <div>
                      <label class="form-label-xs m-0">Face Photo</label>
                      <span class="text-[11px] text-slate-500 block">Live photo for pre-exam identity verification</span>
                    </div>
                    <span v-if="studentForm.face_photo" class="badge-emerald-sm">
                      <i class="mdi mdi-check-circle"></i> Photo Enrolled
                    </span>
                    <span v-else class="badge-amber-sm">
                      <i class="mdi mdi-camera-outline"></i> Photo Required
                    </span>
                  </div>

                  <!-- If photo captured -->
                  <div v-if="studentForm.face_photo" class="captured-photo-display">
                    <img :src="studentForm.face_photo" alt="Student Face" class="enrolled-face-thumb" />
                    <div class="captured-photo-meta">
                      <div class="text-xs font-semibold text-slate-900">Face Photo Saved</div>
                      <div class="text-[11px] text-slate-500">Camera verification matches against this photo during exam login.</div>
                      <div class="mt-2 flex gap-2">
                        <button type="button" class="btn-xs-retake" @click="retakeStudentPhoto">
                          <i class="mdi mdi-camera-retake-outline"></i> Retake Photo
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- If camera active -->
                  <div v-else-if="isStudentCameraActive" class="webcam-live-container">
                    <div class="webcam-frame-box">
                      <video 
                        ref="subCenterWebcamVideo" 
                        autoplay 
                        playsinline 
                        class="webcam-video-el"
                        :style="{ transform: isCameraMirrored ? 'scaleX(-1)' : 'none' }"
                      ></video>
                      <div class="webcam-oval-overlay"></div>
                    </div>
                    <div class="webcam-controls-row">
                      <button type="button" class="btn-capture-photo" @click="captureStudentPhoto">
                        <i class="mdi mdi-camera"></i> Take Photo
                      </button>
                      <button 
                        type="button" 
                        class="btn-flip-camera" 
                        @click="isCameraMirrored = !isCameraMirrored"
                        :title="isCameraMirrored ? 'Switch to unmirrored' : 'Switch to mirrored'"
                      >
                        <i class="mdi mdi-flip-horizontal mr-1"></i> {{ isCameraMirrored ? 'Mirrored' : 'Unmirrored' }}
                      </button>
                      <button type="button" class="btn-cancel-camera" @click="stopStudentCamera">
                        Cancel
                      </button>
                    </div>
                  </div>

                  <!-- Real-Time Camera Capture Action -->
                  <div v-else class="face-capture-actions">
                    <button type="button" class="btn-face-action" @click="startStudentCamera">
                      <i class="mdi mdi-camera-plus text-2xl text-red"></i>
                      <span class="font-semibold text-slate-800 text-sm">Take Photo</span>
                      <span class="text-[11px] text-slate-500 font-normal">Live camera photo required for identity verification</span>
                    </button>
                  </div>
                </div>

                <!-- Row 3: Password & Confirm Password -->
                <div class="form-row-2 mb-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                  <div class="form-group mb-0">
                    <div class="flex items-center justify-between mb-1">
                      <label class="form-label-xs mb-0">
                        {{ editingStudent ? 'New Password (Optional)' : 'Password' }}
                        <span v-if="!editingStudent" class="required-star">*</span>
                      </label>
                      <button
                        type="button"
                        class="text-[11px] text-red font-semibold hover:underline flex items-center gap-1"
                        @click="generateAndFillStudentPassword"
                        title="Generate random password"
                      >
                        <i class="mdi mdi-refresh"></i> Auto-Generate
                      </button>
                    </div>
                    <div class="input-with-icon">
                      <i class="mdi mdi-lock-outline input-prefix-icon"></i>
                      <input
                        v-model="studentForm.password"
                        :type="showPassword ? 'text' : 'password'"
                        class="modal-input-field input-has-prefix has-suffix"
                        :placeholder="editingStudent ? 'Leave blank to keep existing' : 'Password'"
                      />
                      <button type="button" class="input-suffix-btn" @click="showPassword = !showPassword">
                        <i :class="['mdi', showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline']"></i>
                      </button>
                    </div>
                  </div>
                  <div class="form-group mb-0">
                    <label class="form-label-xs">
                      {{ editingStudent ? 'Confirm New Password' : 'Confirm Password' }}
                    </label>
                    <div class="input-with-icon">
                      <i class="mdi mdi-lock-check-outline input-prefix-icon"></i>
                      <input
                        v-model="studentForm.confirm_password"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        class="modal-input-field input-has-prefix has-suffix"
                        :placeholder="editingStudent ? 'Confirm new password' : 'Confirm Password'"
                      />
                      <button type="button" class="input-suffix-btn" @click="showConfirmPassword = !showConfirmPassword">
                        <i :class="['mdi', showConfirmPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline']"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Row 4: Education Level -->
                <div class="form-group mb-4">
                  <label class="form-label-xs">Education Level</label>
                  <div class="custom-select-wrapper">
                    <select v-model="studentForm.education_level" class="modal-input-field modal-select">
                      <option value="" disabled>Choose Education Level...</option>
                      <option v-for="lvl in educationLevels" :key="lvl" :value="lvl">{{ lvl }}</option>
                    </select>
                    <i class="mdi mdi-chevron-down select-chevron"></i>
                  </div>
                </div>

                <!-- Row 5: Gender & Date of Birth -->
                <div class="form-row-2 mb-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                  <div class="form-group mb-0">
                    <label class="form-label-xs">Gender</label>
                    <div class="custom-select-wrapper">
                      <select v-model="studentForm.gender" class="modal-input-field modal-select">
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
                    <input v-model="studentForm.dob" type="date" class="modal-input-field" />
                  </div>
                </div>
              </div>

              <div class="modal-footer flex items-center justify-between">
                <button type="button" class="btn-glass" @click="showAddStudentModal = false">Cancel</button>
                <button type="submit" class="btn-red" :disabled="savingStudent || !studentForm.name || !studentForm.email">
                  <i :class="['mdi', savingStudent ? 'mdi-loading spin-icon' : (editingStudent ? 'mdi-content-save-check' : 'mdi-account-check')]"></i>
                  {{ savingStudent ? 'Saving...' : (editingStudent ? 'Update Student' : 'Save Student') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Student Enrolled Credentials & Security OTP Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showStudentCredentialsModal && newRegisteredCredentials" class="modal-overlay" @click.self="showStudentCredentialsModal = false">
          <div class="modal-card modal-card-creds">
            <div class="modal-header">
              <div class="modal-title-row">
                <div class="modal-header-icon bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <i class="mdi mdi-shield-account-outline"></i>
                </div>
                <div class="modal-title-text">
                  <h3>Student Credentials &amp; OTP</h3>
                  <p>Official exam login access for {{ newRegisteredCredentials.name }}</p>
                </div>
              </div>
              <button class="modal-close-btn" @click="showStudentCredentialsModal = false" aria-label="Close modal"><i class="mdi mdi-close"></i></button>
            </div>

            <div class="modal-body modal-creds-body">
              <!-- Dispatched Notice / Status Banner -->
              <div v-if="newRegisteredCredentials.email_status?.success" class="dispatched-banner dispatched-banner-success mb-4">
                <i class="mdi mdi-email-check text-emerald-600 text-lg mr-2 shrink-0"></i>
                <div class="text-xs text-emerald-800">
                  <span>Credentials &amp; security OTP dispatched to <strong>{{ newRegisteredCredentials.email }}</strong> via Resend.</span>
                </div>
              </div>

              <div v-else class="dispatched-banner dispatched-banner-warning mb-4">
                <i class="mdi mdi-alert-circle text-amber-600 text-lg mr-2 shrink-0"></i>
                <div class="text-xs text-amber-900 leading-snug">
                  <div class="font-semibold text-amber-800">Email Delivery Notice</div>
                  <div class="mt-0.5 text-slate-700">{{ newRegisteredCredentials.email_status?.message || 'Email delivery not confirmed. Please copy credentials below or configure Resend in Admin Settings.' }}</div>
                </div>
              </div>

              <!-- Face Thumbnail & Name Hero -->
              <div class="candidate-cred-hero mb-4">
                <img v-if="newRegisteredCredentials.face_photo" :src="newRegisteredCredentials.face_photo" class="cred-face-avatar" />
                <div v-else class="cred-face-placeholder">
                  <i class="mdi mdi-account"></i>
                </div>
                <div>
                  <div class="font-semibold text-slate-900 text-sm">{{ newRegisteredCredentials.name }}</div>
                  <div class="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                    <i class="mdi mdi-face-recognition"></i>
                    {{ newRegisteredCredentials.has_face ? 'Face Photo Enrolled' : 'Face Photo Pending' }}
                  </div>
                </div>
              </div>

              <!-- Credential Fields -->
              <div class="cred-field-box mb-3">
                <div class="flex items-center justify-between mb-1">
                  <span class="cred-label">Email / Login ID</span>
                  <button type="button" class="btn-copy-mini" @click="copyText(newRegisteredCredentials.email, 'Username')">
                    <i class="mdi mr-1" :class="copiedField === 'Username' ? 'mdi-check text-emerald-600' : 'mdi-content-copy'"></i>
                    {{ copiedField === 'Username' ? 'Copied!' : 'Copy' }}
                  </button>
                </div>
                <div class="cred-val font-mono">{{ newRegisteredCredentials.email }}</div>
              </div>

              <div class="cred-field-box mb-3">
                <div class="flex items-center justify-between mb-1">
                  <span class="cred-label">Exam Password</span>
                  <div class="flex items-center gap-2">
                    <button type="button" class="btn-copy-mini" @click="showCredPassword = !showCredPassword">
                      <i :class="['mdi', showCredPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline']"></i>
                    </button>
                    <button type="button" class="btn-copy-mini" @click="copyText(newRegisteredCredentials.initial_password, 'Password')">
                      <i class="mdi mr-1" :class="copiedField === 'Password' ? 'mdi-check text-emerald-600' : 'mdi-content-copy'"></i>
                      {{ copiedField === 'Password' ? 'Copied!' : 'Copy' }}
                    </button>
                  </div>
                </div>
                <div class="cred-val font-mono">
                  {{ showCredPassword ? newRegisteredCredentials.initial_password : '••••••••••••' }}
                </div>
              </div>

              <div v-if="newRegisteredCredentials.otp_code" class="cred-field-box cred-field-otp mb-4">
                <div class="flex items-center justify-between mb-1">
                  <span class="cred-label text-red-700">Security Verification OTP Code</span>
                  <button type="button" class="btn-copy-mini text-red-700" @click="copyText(newRegisteredCredentials.otp_code, 'OTP Code')">
                    <i class="mdi mr-1" :class="copiedField === 'OTP Code' ? 'mdi-check text-emerald-600' : 'mdi-content-copy'"></i>
                    {{ copiedField === 'OTP Code' ? 'Copied!' : 'Copy OTP' }}
                  </button>
                </div>
                <div class="cred-val-otp">{{ newRegisteredCredentials.otp_code }}</div>
                <span class="text-[11px] text-red-600 block mt-1">Student enters this code during pre-exam verification.</span>
              </div>

              <!-- Copy All & Action Buttons -->
              <div class="flex items-center justify-between gap-3 pt-2">
                <div class="flex items-center gap-2">
                  <button type="button" class="btn-copy-all" @click="copyAllStudentCredentials">
                    <i class="mdi mdi-content-copy mr-1.5"></i> Copy All
                  </button>
                  <button
                    type="button"
                    class="btn-resend-inline"
                    :disabled="isResendingEmail"
                    @click="resendStudentCredentials(newRegisteredCredentials)"
                    title="Resend email via Resend"
                  >
                    <i :class="['mdi', isResendingEmail ? 'mdi-loading mdi-spin mr-1' : 'mdi-email-sync-outline mr-1']"></i>
                    {{ isResendingEmail ? 'Sending...' : 'Resend Email' }}
                  </button>
                </div>
                <button type="button" class="btn-red py-2 px-6" @click="showStudentCredentialsModal = false">
                  Done
                </button>
              </div>
            </div>
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
              <div class="modal-title-row">
                <div class="modal-header-icon bg-indigo-50 text-indigo border border-indigo-100">
                  <i class="mdi mdi-link-plus"></i>
                </div>
                <div class="modal-title-text">
                  <h3>Create Single-Student Retry Link</h3>
                  <p>Generates a dedicated retry link (Spends 1 token)</p>
                </div>
              </div>
              <button class="modal-close-btn" @click="showRetryLinkModal = false" aria-label="Close modal"><i class="mdi mdi-close"></i></button>
            </div>

            <div class="modal-body">
              <p class="retry-modal-info">
                Generates a dedicated single-student retry link tied to the original exam batch for candidate retry.
              </p>

              <div class="form-group mb-0">
                <label class="form-label-xs">Link Expiration Date/Time <span class="label-optional">(Optional)</span></label>
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
              <div class="modal-title-row">
                <div class="modal-header-icon bg-red-50 text-red border border-red-100">
                  <i class="mdi mdi-account-edit"></i>
                </div>
                <div class="modal-title-text">
                  <h3>Edit Profile &amp; Center Details</h3>
                  <p>Update staff credentials and sub-center organization information</p>
                </div>
              </div>
              <button class="modal-close-btn" @click="showEditProfileModal = false" aria-label="Close modal"><i class="mdi mdi-close"></i></button>
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
                  <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-4">Organization Settings</div>
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

// Token Purchase Requests State
const tokenRequests = ref<any[]>([]);
const loadingTokenRequests = ref(false);
const submittingTokenRequest = ref(false);
const tokenRequestPaymentRef = ref('');
const selectedPackageId = ref<string>('');
const walletViewMode = ref<'all' | 'requests' | 'ledger'>('all');

const selectedPackage = computed(() => {
  return availablePackages.value.find((p: any) => p.id === selectedPackageId.value) || availablePackages.value[0];
});

watch(availablePackages, (pkgs) => {
  if (pkgs && pkgs.length > 0 && !selectedPackageId.value) {
    selectedPackageId.value = pkgs[0].id;
  }
}, { immediate: true });

const pendingRequestsCount = computed(() => {
  return (tokenRequests.value || []).filter((r: any) => r.status === 'pending').length;
});

const allActivityCount = computed(() => {
  const activeRequests = (tokenRequests.value || []).filter((r: any) => r.status !== 'approved');
  return activeRequests.length + (transactions.value || []).length;
});

const usageDeductionsCount = computed(() => {
  return (transactions.value || []).filter((t: any) => t.type !== 'purchase').length;
});

// Student state
const students = ref<any[]>([]);
const loadingStudents = ref(false);
const showAddStudentModal = ref(false);
const editingStudent = ref<any>(null);
const showViewStudentModal = ref(false);
const viewingStudent = ref<any>(null);
const loadingViewStudent = ref(false);
const savingStudent = ref(false);
const studentForm = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirm_password: '',
  education_level: '',
  institution_name: '',
  gender: '',
  dob: '',
  face_photo: '',
  face_descriptor: null as any
});
const isStudentCameraActive = ref(false);
const isCameraMirrored = ref(false);
const subCenterWebcamVideo = ref<HTMLVideoElement | null>(null);
let subCenterStream: MediaStream | null = null;
const showStudentCredentialsModal = ref(false);
const newRegisteredCredentials = ref<any>(null);
const isResendingEmail = ref(false);
const showCredPassword = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const educationLevels = ref<string[]>([
  'SSLC / 10th Standard',
  'Plus Two / 12th Standard',
  'Diploma',
  'Undergraduate / Bachelor Degree',
  'Postgraduate / Master Degree',
  'Doctorate / PhD',
  'Other / Professional'
]);

// Exam state
const exams = ref<any[]>([]);
const loadingExams = ref(false);

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
const batchHeaders: any[] = [
  { title: 'Exam Name', key: 'exam_name' },
  { title: 'Status', key: 'status' },
  { title: 'Enrolled Count', key: 'student_count' },
  { title: 'Opens At', key: 'opens_at' },
  { title: 'Closes At', key: 'closes_at' },
  { title: 'Actions', key: 'actions', sortable: false }
];

const assignmentHeaders: any[] = [
  { title: 'Student Name', key: 'student_name' },
  { title: 'Email', key: 'student_email' },
  { title: 'Attempts Used', key: 'attempts' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false }
];

const studentHeaders: any[] = [
  { title: 'Candidate Student', key: 'name' },
  { title: 'Face Biometrics', key: 'face_photo' },
  { title: 'Phone', key: 'phone' },
  { title: 'Education Level', key: 'education_level' },
  { title: 'Registration Date', key: 'created_at' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
];

const unifiedWalletHeaders: any[] = [
  { title: 'Activity Type', key: 'type' },
  { title: 'Item / Package Description', key: 'package_name' },
  { title: 'Tokens', key: 'token_count' },
  { title: 'Reference / Invoice', key: 'reference' },
  { title: 'Status', key: 'status' },
  { title: 'Date & Time', key: 'created_at' }
];

const unifiedWalletEntries = computed(() => {
  const mode = walletViewMode.value;

  const formattedRequests = (tokenRequests.value || []).map((req: any) => {
    const isPending = req.status === 'pending';
    const isApproved = req.status === 'approved';
    const isRejected = req.status === 'rejected';

    return {
      id: `req-${req.id}`,
      rawId: req.id,
      rawType: 'request',
      typeLabel: isPending ? 'Purchase Request' : isApproved ? 'Purchase Approved' : 'Request Rejected',
      icon: isPending ? 'mdi-clock-outline' : isApproved ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline',
      package_name: req.package_name || 'Custom Token Package',
      subDetails: `$${Number(req.amount || 0).toFixed(2)} offline invoice`,
      token_count: req.token_count,
      tokenCountDisplay: `+${req.token_count} Tokens`,
      tokenCountClass: isApproved ? 'text-emerald-700 font-semibold' : isRejected ? 'text-slate-400 line-through' : 'text-amber-700 font-semibold',
      reference: req.payment_reference || '-',
      status: req.status,
      statusLabel: isPending ? 'Pending Approval' : isApproved ? 'Approved & Issued' : 'Rejected',
      statusClass: isPending ? 'chip-amber' : isApproved ? 'chip-green' : 'chip-red',
      created_at: req.created_at,
      source: 'request'
    };
  });

  const formattedTxs = (transactions.value || []).map((tx: any) => {
    const isPurchase = tx.type === 'purchase' || tx.type === 'admin_grant';
    const isConsume = tx.type === 'consume';
    const isRedeem = tx.type === 'redeem';
    const isRefund = tx.type === 'refund' || tx.type === 'refund_unused' || tx.type === 'admin_refund';

    const count = Number(tx.token_count || 0);
    const countDisplay = isRedeem ? '1 Token Redeemed' : (count > 0 ? `+${count} Tokens` : `${count} Tokens`);

    return {
      id: `tx-${tx.id}`,
      rawId: tx.id,
      rawType: tx.type,
      typeLabel: isPurchase ? (tx.type === 'admin_grant' ? 'Manual Token Grant' : 'Token Package Credit') : isRedeem ? 'Token Redeemed & Certified' : isConsume ? 'Candidate Exam Allocation' : isRefund ? 'Admin Refund / Revocation' : 'Wallet Adjustment',
      icon: isPurchase ? 'mdi-plus-circle-outline' : isRedeem ? 'mdi-check-decagram-outline' : isConsume ? 'mdi-minus-circle-outline' : isRefund ? 'mdi-cash-refund' : 'mdi-swap-horizontal',
      package_name: isRedeem ? (tx.exam_name ? `${tx.exam_name} Sitting` : 'Exam Certification Sitting') : isRefund ? 'Token Refund / Clawback' : (tx.package_name || (isConsume ? 'Candidate Exam Allocation' : 'System Allocation')),
      subDetails: isRedeem ? (tx.notes || 'Student passed and redeemed token') : (tx.exam_name ? `Exam: ${tx.exam_name}` : (tx.notes ? `Note: ${tx.notes}` : (isPurchase ? 'Direct Wallet Credit' : ''))),
      token_count: count,
      tokenCountDisplay: countDisplay,
      tokenCountClass: isRedeem ? 'text-emerald-700 font-semibold' : (count > 0 ? 'text-emerald-700 font-semibold' : 'text-red-700 font-semibold'),
      reference: tx.id ? tx.id.slice(0, 8).toUpperCase() : '-',
      status: 'completed',
      statusLabel: isRedeem ? 'Redeemed' : (isRefund ? 'Refunded' : 'Completed'),
      statusClass: isRefund ? 'chip-amber' : 'chip-green',
      created_at: tx.created_at,
      source: 'ledger'
    };
  });

  if (mode === 'requests') {
    return formattedRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  if (mode === 'ledger') {
    return formattedTxs.filter(t => t.rawType !== 'purchase').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // mode === 'all': show pending/rejected requests + all ledger transactions
  const activeRequests = formattedRequests.filter(r => r.status !== 'approved');
  const allList = [...activeRequests, ...formattedTxs];
  return allList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
});

const certificateHeaders: any[] = [
  { title: 'Certificate Number', key: 'certificate_number' },
  { title: 'Student Candidate', key: 'student_name' },
  { title: 'Exam Qualification', key: 'exam_name' },
  { title: 'Issue Date', key: 'issue_date' },
  { title: 'Actions', key: 'actions', sortable: false }
];

// ─── Table Pagination & Helpers ───
const batchPage = ref(1);
const batchPerPage = ref(10);
const paginatedBatches = computed(() => {
  const start = (batchPage.value - 1) * batchPerPage.value;
  return (batches.value || []).slice(start, start + batchPerPage.value);
});

const studentPage = ref(1);
const studentPerPage = ref(10);
const paginatedStudents = computed(() => {
  const start = (studentPage.value - 1) * studentPerPage.value;
  return (filteredModalStudents.value || []).slice(start, start + studentPerPage.value);
});

watch(studentSearchQuery, () => {
  studentPage.value = 1;
});

const walletPage = ref(1);
const walletPerPage = ref(10);
const paginatedWalletEntries = computed(() => {
  const start = (walletPage.value - 1) * walletPerPage.value;
  return (unifiedWalletEntries.value || []).slice(start, start + walletPerPage.value);
});

watch(walletViewMode, () => {
  walletPage.value = 1;
});

const certPage = ref(1);
const certPerPage = ref(10);
const paginatedCertificates = computed(() => {
  const start = (certPage.value - 1) * certPerPage.value;
  return (filteredCertificates.value || []).slice(start, start + certPerPage.value);
});

watch(certSearchQuery, () => {
  certPage.value = 1;
});

const getInitials = (name?: string) => {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Shortfall calculation
const batchShortfall = computed(() => {
  const needed = batchForm.value.student_ids.length;
  const avail = wallet.value.totalRemaining || 0;
  return needed > avail ? needed - avail : 0;
});

onMounted(() => {
  fetchWallet();
  fetchStudents();
  fetchEducationLevels();
  fetchExams();
  fetchBatches();
  fetchAvailablePackages();
  fetchTransactions();
  fetchTokenRequests();
  fetchCertificates();
  fetchProfile();
});

async function fetchEducationLevels() {
  try {
    const { data } = await api.get('/sub-center/education-levels');
    if (Array.isArray(data) && data.length > 0) {
      educationLevels.value = data;
    }
  } catch (err) {
    console.error('Error fetching education levels', err);
  }
}

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

function generateRandomStudentPassword() {
  return 'GSFIN-' + Math.floor(1000 + Math.random() * 9000) + '-Ex!';
}

function generateAndFillStudentPassword() {
  const p = generateRandomStudentPassword();
  studentForm.value.password = p;
  studentForm.value.confirm_password = p;
}

async function startStudentCamera() {
  try {
    isStudentCameraActive.value = true;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 480, height: 480, facingMode: 'user' }
    });
    subCenterStream = stream;
    await nextTick();
    if (subCenterWebcamVideo.value) {
      subCenterWebcamVideo.value.srcObject = stream;
      await subCenterWebcamVideo.value.play();
    }
  } catch (err: any) {
    alert('Could not access camera: ' + (err.message || 'Permission denied'));
    isStudentCameraActive.value = false;
  }
}

function stopStudentCamera() {
  if (subCenterStream) {
    subCenterStream.getTracks().forEach(track => track.stop());
    subCenterStream = null;
  }
  isStudentCameraActive.value = false;
}

function captureStudentPhoto() {
  if (!subCenterWebcamVideo.value) return;
  const video = subCenterWebcamVideo.value;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 480;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    if (isCameraMirrored.value) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    studentForm.value.face_photo = dataUrl;
    studentForm.value.face_descriptor = [0.85, 0.84, 0.46, 0.94, 0.95];
  }
  stopStudentCamera();
}

function retakeStudentPhoto() {
  studentForm.value.face_photo = '';
  studentForm.value.face_descriptor = null;
  startStudentCamera();
}

function goToBatch(id: string) {
  if (!id) return;
  router.push(`/sub-center/batches/${id}`);
}

const copiedField = ref<string | null>(null);

async function copyText(text: string, fieldKey: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copiedField.value = fieldKey;
    setTimeout(() => {
      if (copiedField.value === fieldKey) copiedField.value = null;
    }, 2500);
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
  }
}

function copyAllStudentCredentials() {
  if (!newRegisteredCredentials.value) return;
  const c = newRegisteredCredentials.value;
  const text = `GSFIN Student Credentials:\nName: ${c.name}\nEmail / Login ID: ${c.email}\nPassword: ${c.initial_password}\nSecurity OTP: ${c.otp_code || 'N/A'}`;
  navigator.clipboard.writeText(text);
  alert('All student credentials copied to clipboard!');
}

async function resendStudentCredentials(target: any) {
  const studentId = typeof target === 'string' ? target : (target?.id || target);
  if (!studentId) return;
  isResendingEmail.value = true;
  try {
    const res = await api.post(`/sub-center/students/${studentId}/resend-credentials`);
    if (res.data?.success) {
      alert(res.data.message || 'Credentials and OTP successfully sent via Resend!');
      if (newRegisteredCredentials.value && newRegisteredCredentials.value.id === studentId) {
        newRegisteredCredentials.value.email_status = { success: true, message: res.data.message };
      }
    } else {
      alert(`Email dispatch notice: ${res.data?.message || 'Could not send email'}`);
    }
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message || 'Failed to dispatch email';
    alert(`Failed to resend credentials: ${msg}`);
  } finally {
    isResendingEmail.value = false;
  }
}

function resetStudentForm() {
  studentForm.value = {
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    education_level: '',
    institution_name: '',
    gender: '',
    dob: '',
    face_photo: '',
    face_descriptor: null
  };
  editingStudent.value = null;
  showPassword.value = false;
  showConfirmPassword.value = false;
  stopStudentCamera();
}

function openRegisterStudentModal() {
  resetStudentForm();
  generateAndFillStudentPassword();
  showAddStudentModal.value = true;
}

function openEditStudentModal(item: any) {
  editingStudent.value = item;
  studentForm.value = {
    name: item.name || '',
    email: item.email || '',
    phone: item.phone || '',
    password: '',
    confirm_password: '',
    education_level: item.education_level || '',
    institution_name: item.institution_name || '',
    gender: item.gender || '',
    dob: item.dob ? String(item.dob).slice(0, 10) : '',
    face_photo: item.face_photo || '',
    face_descriptor: item.face_descriptor || null
  };
  showPassword.value = false;
  showConfirmPassword.value = false;
  showAddStudentModal.value = true;
}

function openViewStudentModal(item: any) {
  navigateTo('/sub-center/students/' + item.id);
}

async function confirmDeleteStudent(item: any) {
  if (!confirm(`Are you sure you want to delete student "${item.name}" (${item.email})?\n\nThis will remove their profile from your center's directory.`)) {
    return;
  }
  try {
    await api.delete(`/sub-center/students/${item.id}`);
    students.value = (students.value || []).filter((s: any) => s.id !== item.id);
    await fetchStudents();
    alert(`Student "${item.name}" was successfully deleted.`);
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to delete student');
  }
}

async function registerStudent() {
  if (!studentForm.value.name || !studentForm.value.email) {
    alert('Please enter student full name and email address.');
    return;
  }
  if (!editingStudent.value && !studentForm.value.face_photo) {
    alert('Student live camera photo is required. Please capture the face photo before proceeding.');
    return;
  }
  if (studentForm.value.password && studentForm.value.password !== studentForm.value.confirm_password) {
    alert('Password and Confirm Password do not match.');
    return;
  }
  savingStudent.value = true;
  try {
    if (editingStudent.value) {
      const studentId = editingStudent.value.id;
      const { data } = await api.put(`/sub-center/students/${studentId}`, studentForm.value);
      showAddStudentModal.value = false;
      stopStudentCamera();
      const idx = students.value.findIndex((s: any) => s.id === studentId);
      if (idx !== -1) {
        students.value[idx] = {
          ...students.value[idx],
          ...studentForm.value,
          ...(data || {})
        };
      }
      resetStudentForm();
      await fetchStudents();
      alert('Student details updated successfully!');
    } else {
      const { data } = await api.post('/sub-center/students', studentForm.value);
      showAddStudentModal.value = false;
      stopStudentCamera();
      newRegisteredCredentials.value = data;
      showStudentCredentialsModal.value = true;
      resetStudentForm();
      await fetchStudents();
    }
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to save student');
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

async function fetchTokenRequests() {
  loadingTokenRequests.value = true;
  try {
    const { data } = await api.get('/sub-center/token-requests');
    tokenRequests.value = data || [];
  } catch (err) {
    console.error('Error fetching token requests', err);
  } finally {
    loadingTokenRequests.value = false;
  }
}

async function submitTokenRequest(packageId: string) {
  submittingTokenRequest.value = true;
  try {
    const { data } = await api.post('/sub-center/token-requests', {
      package_id: packageId,
      payment_reference: tokenRequestPaymentRef.value
    });
    showStoreModal.value = false;
    tokenRequestPaymentRef.value = '';
    alert(data.message || 'Token purchase request submitted successfully! Awaiting administrator payment verification and approval.');
    await fetchTokenRequests();
    await fetchWallet();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to submit token purchase request');
  } finally {
    submittingTokenRequest.value = false;
  }
}

async function submitSelectedTokenRequest() {
  if (!selectedPackageId.value) return;
  await submitTokenRequest(selectedPackageId.value);
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
  loadingExams.value = true;
  try {
    const { data } = await api.get('/sub-center/exams');
    exams.value = Array.isArray(data) ? data : [];
    if (exams.value.length === 1 && !batchForm.value.exam_id) {
      batchForm.value.exam_id = exams.value[0].id;
    }
  } catch (err) {
    console.error('Failed to fetch authorized exams:', err);
  } finally {
    loadingExams.value = false;
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
  navigateTo('/sub-center/batches/create');
}

async function submitCreateBatch() {
  savingBatch.value = true;
  try {
    await api.post('/sub-center/batches', batchForm.value);
    showCreateBatchModal.value = false;
    await Promise.allSettled([fetchBatches(), fetchWallet(), fetchTransactions()]);
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
    await Promise.allSettled([fetchBatches(), fetchWallet(), fetchTransactions()]);
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to cancel batch');
  }
}

function viewBatchDetails(batch: any) {
  if (batch?.id) {
    navigateTo(`/sub-center/batches/${batch.id}`);
  }
}

function copyExamLink(item: any) {
  const id = item.assignment_id || item.id;
  const url = `${window.location.origin}/exam/take-${id}`;
  navigator.clipboard.writeText(url);
  alert(`Exam sitting link copied to clipboard:\n${url}`);
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
    await Promise.allSettled([fetchWallet(), fetchTransactions()]);
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
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return String(dateStr);
  }
}

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'sub_center_staff']
});
</script>

<style scoped>
/* Page-specific styles for Sub-Center */

.live-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  padding: 8px 18px;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 600;
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
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease;
  position: relative;
  overflow: hidden;
}
.metric-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.07);
}

/* Light / Mild Gradient KPI Variants */
.metric-card-blue {
  background: linear-gradient(135deg, #FFFFFF 0%, #F0F7FF 55%, #E1EFFF 100%);
  border: 1px solid rgba(37, 99, 235, 0.16);
}
.metric-card-blue:hover {
  border-color: rgba(37, 99, 235, 0.35);
  box-shadow: 0 12px 28px -4px rgba(37, 99, 235, 0.15), 0 4px 12px rgba(15, 23, 42, 0.03);
}

.metric-card-emerald {
  background: linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 55%, #DCFCE7 100%);
  border: 1px solid rgba(16, 185, 129, 0.16);
}
.metric-card-emerald:hover {
  border-color: rgba(16, 185, 129, 0.35);
  box-shadow: 0 12px 28px -4px rgba(16, 185, 129, 0.15), 0 4px 12px rgba(15, 23, 42, 0.03);
}

.metric-card-red {
  background: linear-gradient(135deg, #FFFFFF 0%, #FEF2F2 55%, #FEE2E2 100%);
  border: 1px solid rgba(227, 27, 35, 0.16);
}
.metric-card-red:hover {
  border-color: rgba(227, 27, 35, 0.35);
  box-shadow: 0 12px 28px -4px rgba(227, 27, 35, 0.15), 0 4px 12px rgba(15, 23, 42, 0.03);
}

.metric-card-indigo {
  background: linear-gradient(135deg, #FFFFFF 0%, #EEF2FF 55%, #E0E7FF 100%);
  border: 1px solid rgba(79, 70, 229, 0.16);
}
.metric-card-indigo:hover {
  border-color: rgba(79, 70, 229, 0.35);
  box-shadow: 0 12px 28px -4px rgba(79, 70, 229, 0.15), 0 4px 12px rgba(15, 23, 42, 0.03);
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

.bg-indigo-light { background: rgba(79, 70, 229, 0.1) !important; }
.text-indigo { color: #4F46E5 !important; }
.bg-emerald-light { background: rgba(16, 185, 129, 0.1) !important; }
.text-emerald { color: #059669 !important; }
.bg-blue-light { background: rgba(37, 99, 235, 0.1) !important; }
.text-blue { color: #2563EB !important; }
.bg-amber-light { background: rgba(245, 158, 11, 0.12) !important; }
.text-amber { color: #B45309 !important; }
.bg-red-light { background: rgba(227, 27, 35, 0.1) !important; }
.text-red { color: #E31B23 !important; }

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
  font-size: 1.75rem;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.2;
  margin: 4px 0 2px 0;
}

.metric-sub {
  font-size: 0.76rem;
  font-weight: 600;
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
  font-weight: 600;
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

.action-btn-group .btn-table-action {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
  font-size: 0.95rem;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-view { background: rgba(59, 130, 246, 0.1); color: #2563EB; text-decoration: none; }
.btn-view:hover { background: #2563EB; color: #FFFFFF; }

.btn-edit { background: #F1F5F9; color: #475569; }
.btn-edit:hover { background: #E2E8F0; color: #0F172A; }

.btn-warn { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.btn-warn:hover { background: #D97706; color: #FFFFFF; }

.btn-success { background: rgba(16, 185, 129, 0.1); color: #059669; text-decoration: none; }
.btn-success:hover { background: #059669; color: #FFFFFF; }

.btn-take-exam { background: #ECFDF5; color: #059669; border: 1px solid rgba(16, 185, 129, 0.3) !important; text-decoration: none; }
.btn-take-exam:hover { background: #059669; color: #FFFFFF; }

.btn-copy-link { background: rgba(79, 70, 229, 0.08); color: #4F46E5; border: 1px solid rgba(79, 70, 229, 0.2) !important; }
.btn-copy-link:hover { background: #4F46E5; color: #FFFFFF; }

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

.modal-card-student-form {
  max-width: 580px;
}

.modal-card-creds {
  max-width: 520px;
}

.modal-creds-body {
  padding: 24px;
}

.modal-scrollable-body {
  overflow-y: auto;
  max-height: calc(88vh - 140px);
  padding-bottom: 24px;
}

.form-grid-two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

@keyframes modalPop {
  from { opacity: 0; transform: scale(0.96) translateY(12px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 20px 28px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: #FAFAFD;
}

.modal-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.modal-header-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.modal-title-text {
  display: flex;
  flex-direction: column;
}

.modal-title-text h3 {
  font-size: 1.12rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  line-height: 1.28;
}

.modal-title-text p {
  font-size: 0.78rem;
  color: #64748B;
  margin: 3px 0 0 0;
  line-height: 1.3;
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
  font-weight: 600;
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

.batch-modal-card {
  max-width: 620px;
}

.modal-body {
  padding: 22px 28px 24px 28px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px 28px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  background: #FAFAFD;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.form-group {
  margin-bottom: 18px;
}
.form-group:last-child,
.form-group.mb-0 {
  margin-bottom: 0;
}
.form-group.mb-4 {
  margin-bottom: 16px;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 550px) {
  .form-row-2 {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.form-label-xs {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #475569;
  margin-bottom: 8px;
}

.required-star {
  color: #E31B23;
  font-weight: 600;
  margin-left: 2px;
}

.label-optional {
  font-weight: 500;
  color: #94A3B8;
  text-transform: none;
  font-size: 0.7rem;
  letter-spacing: normal;
  margin-left: 3px;
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

input[type="datetime-local"].modal-input-field {
  color-scheme: light;
  font-family: inherit;
  font-size: 0.86rem;
  cursor: pointer;
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

/* Custom Select Dropdown */
.custom-select-wrapper {
  position: relative;
  width: 100%;
}
.modal-select {
  appearance: none;
  -webkit-appearance: none;
  padding-right: 38px;
  cursor: pointer;
}
.select-chevron {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748B;
  font-size: 1.25rem;
  pointer-events: none;
}

/* Shortfall Warning Banner */
.shortfall-warning-banner {
  padding: 12px 16px;
  border-radius: 14px;
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  color: #78350F;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}
.shortfall-title {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #92400E;
  display: flex;
  align-items: center;
  gap: 5px;
}
.shortfall-desc {
  font-size: 0.76rem;
  margin-top: 2px;
  color: #78350F;
}
.btn-buy-tokens {
  background: #FFFFFF;
  border: 1px solid #FCD34D;
  color: #92400E;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.btn-buy-tokens:hover {
  background: #FEF3C7;
  border-color: #F59E0B;
}

/* Candidate Picker Roster Styles */
.roster-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.roster-action-pills {
  display: flex;
  align-items: center;
  gap: 8px;
}

.roster-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}
.roster-pill-btn:hover {
  background: #F1F5F9;
  color: #0F172A;
}
.pill-btn-select-all {
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.2);
  background: rgba(227, 27, 35, 0.04);
}
.pill-btn-select-all:hover {
  background: rgba(227, 27, 35, 0.1);
  border-color: #E31B23;
  color: #B91C1C;
}

.roster-search-box {
  margin-bottom: 8px;
}

.search-clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  font-size: 1.05rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.search-clear-btn:hover {
  color: #475569;
}

.student-select-box {
  max-height: 165px;
  overflow-y: auto;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 12px;
  background: #FAFAFD;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.roster-empty-state {
  text-align: center;
  padding: 22px 14px;
  color: #94A3B8;
  font-size: 0.78rem;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.roster-empty-icon {
  font-size: 1.6rem;
  color: #CBD5E1;
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

.student-avatar-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(227, 27, 35, 0.1);
  color: #E31B23;
  font-weight: 600;
  font-size: 0.72rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.student-info-col {
  flex: 1;
  min-width: 0;
}

.student-name-text {
  font-weight: 600;
  font-size: 0.78rem;
  color: #0F172A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-email-text {
  font-size: 0.7rem;
  color: #64748B;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-selected-pill {
  padding: 2px 8px;
  border-radius: 50px;
  font-size: 0.65rem;
  font-weight: 600;
  background: #ECFDF5;
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.25);
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.roster-footer-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748B;
}

.roster-cost-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(227, 27, 35, 0.06);
  border: 1px solid rgba(227, 27, 35, 0.15);
  color: #E31B23;
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.75rem;
}
.roster-cost-badge.cost-shortfall {
  background: #FEF2F2;
  border-color: #FCA5A5;
  color: #DC2626;
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

/* Store Request Modal Redesign */
.store-modal-card {
  max-width: 740px;
  width: 100%;
}

.store-balance-banner {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  padding: 12px 16px;
}

.balance-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #E31B23;
  font-size: 1.25rem;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.offline-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 600;
  background: #ECFDF5;
  color: #065F46;
  border: 1px solid rgba(16, 185, 129, 0.2);
  white-space: nowrap;
}

.packages-selection-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 720px) {
  .packages-selection-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 480px) {
  .packages-selection-grid {
    grid-template-columns: 1fr;
  }
}

.package-select-card {
  border: 1.5px solid rgba(15, 23, 42, 0.1);
  border-radius: 14px;
  padding: 14px;
  background: #FFFFFF;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  position: relative;
  text-align: left;
}
.package-select-card:hover {
  border-color: rgba(15, 23, 42, 0.22);
  background: #F8FAFC;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}
.package-select-card.selected {
  border-color: #E31B23;
  background: rgba(227, 27, 35, 0.02);
  box-shadow: 0 0 0 1px #E31B23, 0 8px 20px rgba(227, 27, 35, 0.08);
}

.package-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 10px;
}
.package-tier-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1E293B;
  line-height: 1.3;
}
.selected-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.66rem;
  font-weight: 600;
  color: #E31B23;
  background: #FEF2F2;
  border: 1px solid rgba(227, 27, 35, 0.2);
  padding: 2px 7px;
  border-radius: 9999px;
  white-space: nowrap;
}
.unselected-radio {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid #CBD5E1;
  display: block;
  flex-shrink: 0;
  transition: border-color 0.15s;
}
.package-select-card:hover .unselected-radio {
  border-color: #94A3B8;
}

.package-token-count {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-bottom: 10px;
}
.token-num {
  font-size: 1.65rem;
  font-weight: 600;
  color: #E31B23;
  line-height: 1;
}
.token-unit {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748B;
}

.package-price-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px dashed rgba(15, 23, 42, 0.08);
}
.package-price {
  font-size: 1.05rem;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.2;
}
.price-rate {
  font-size: 0.7rem;
  color: #64748B;
  font-weight: 500;
}

.selected-order-summary {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  padding: 10px 14px;
}

.retry-modal-info {
  font-size: 0.78rem;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 16px;
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
  font-weight: 600;
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
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  line-height: 1.2;
}

.profile-role-chip {
  font-size: 0.68rem;
  font-weight: 600;
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
  font-weight: 600;
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

.wallet-balance-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #ECFDF5;
  color: #047857;
  border: 1px solid rgba(16, 185, 129, 0.25);
  font-weight: 600;
  font-size: 0.82rem;
  padding: 6px 14px;
  border-radius: 9999px;
  white-space: nowrap;
}

.btn-text-red {
  background: none;
  border: none;
  color: #E31B23;
  font-weight: 600;
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
  font-weight: 600;
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

/* ── Wallet Filter Tabs Bar ── */
.wallet-filter-tabs-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  background: #F8FAFC;
  overflow-x: auto;
}

.wallet-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748B;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.16s ease;
  white-space: nowrap;
}

.wallet-tab-btn:hover {
  color: #0F172A;
  background: #EDF2F7;
}

.wallet-tab-btn.active {
  color: #E31B23;
  background: #FFFFFF;
  border-color: rgba(227, 27, 35, 0.2);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

.tab-badge-amber {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 9999px;
  font-size: 0.68rem;
  font-weight: 600;
  background: #FEF3C7;
  color: #B45309;
}

/* ─── CANDIDATE FACE ENROLLMENT & CREDENTIALS STYLES ─── */
.face-enrollment-card {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 14px 16px;
}

.badge-emerald-sm {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  background: #ECFDF5;
  color: #059669;
  border: 1px solid #A7F3D0;
  font-size: 0.68rem;
  font-weight: 600;
}

.badge-amber-sm {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  background: #FEF3C7;
  color: #D97706;
  border: 1px solid #FDE68A;
  font-size: 0.68rem;
  font-weight: 600;
}

.face-capture-actions {
  display: flex;
  flex-direction: column;
}

.btn-face-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 18px 16px;
  background: #FFFFFF;
  border: 1.5px dashed #CBD5E1;
  border-radius: 12px;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  width: 100%;
}

.btn-face-action:hover {
  background: #FEF2F2;
  border-color: #E31B23;
  color: #E31B23;
}

.captured-photo-display {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 10px;
}

.enrolled-face-thumb {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  object-fit: cover;
  border: 2px solid #10B981;
}

.captured-photo-meta {
  flex: 1;
}

.btn-xs-retake {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  background: #F1F5F9;
  color: #475569;
  border: 1px solid #CBD5E1;
  cursor: pointer;
}

.webcam-live-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.webcam-frame-box {
  position: relative;
  width: 220px;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  background: #0F172A;
  border: 2px solid #E2E8F0;
}

.webcam-video-el {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: none;
}

.btn-flip-camera {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 500;
  background: #F1F5F9;
  color: #334155;
  border: 1px solid #CBD5E1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: all 0.15s ease;
}

.btn-flip-camera:hover {
  background: #E2E8F0;
  color: #0F172A;
}

.webcam-oval-overlay {
  position: absolute;
  top: 10%;
  left: 20%;
  width: 60%;
  height: 80%;
  border: 2px dashed rgba(239, 68, 68, 0.8);
  border-radius: 50%;
  pointer-events: none;
}

.webcam-controls-row {
  display: flex;
  gap: 8px;
}

.btn-capture-photo {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  cursor: pointer;
}

.btn-cancel-camera {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 500;
  background: #F1F5F9;
  color: #475569;
  border: 1px solid #CBD5E1;
  cursor: pointer;
}

/* ─── CREDENTIALS SUCCESS MODAL STYLES ─── */
.dispatched-banner {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: #ECFDF5;
  border: 1px solid #A7F3D0;
  border-radius: 8px;
  font-size: 0.78rem;
  color: #065F46;
}

.dispatched-banner-warning {
  background: #FFFBEB;
  border-color: #FDE68A;
  color: #92400E;
}

.dispatched-banner-success {
  background: #ECFDF5;
  border-color: #A7F3D0;
  color: #065F46;
}

.candidate-cred-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
}

.cred-face-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #10B981;
}

.cred-face-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #E2E8F0;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.cred-field-box {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 10px 14px;
}

.cred-field-otp {
  background: #FEF2F2 !important;
  border-color: #FECACA !important;
}

.cred-label {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748B;
}

.cred-val {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0F172A;
}

.cred-val-otp {
  font-size: 1.5rem;
  font-weight: 600;
  color: #E31B23;
  letter-spacing: 4px;
  font-family: var(--font-mono, monospace);
}

.btn-copy-mini {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  color: #475569;
  cursor: pointer;
}

.btn-copy-all {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #F1F5F9;
  border: 1px solid #CBD5E1;
  color: #334155;
  cursor: pointer;
}

.btn-resend-inline {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  color: #1D4ED8;
  cursor: pointer;
}

.btn-resend-inline:hover:not(:disabled) {
  background: #DBEAFE;
}

.btn-resend-inline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-table-action.btn-email {
  color: #2563EB;
}

.btn-table-action.btn-email:hover {
  background: #EFF6FF;
  color: #1D4ED8;
}

/* ─── GSFIN TABLE DESIGN SYSTEM ─── */
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
  font-weight: 400;
  color: #334155;
  vertical-align: middle;
}

.gsfin-table tbody tr {
  transition: background-color 0.15s ease;
}

.gsfin-table tbody tr:hover {
  background: #F8FAFC;
}

.candidate-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
}

.candidate-avatar-photo {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #10B981;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.candidate-avatar-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(79, 70, 229, 0.08);
  color: #4F46E5;
  font-weight: 600;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(79, 70, 229, 0.15);
}

.candidate-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.candidate-name-link {
  font-size: 0.86rem;
  font-weight: 600;
  color: #0F172A;
  text-decoration: none;
  transition: color 0.15s ease;
  white-space: nowrap;
}

.candidate-name-link:hover {
  color: #E31B23;
}

.candidate-email-text {
  font-size: 0.75rem;
  color: #64748B;
  font-family: var(--font-mono, monospace);
  white-space: nowrap;
}

.badge-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 11px;
  border-radius: 50px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.chip-green {
  background: #ECFDF5;
  color: #047857;
  border: 1px solid #A7F3D0;
}

.chip-amber {
  background: #FFFBEB;
  color: #B45309;
  border: 1px solid #FDE68A;
}

.chip-red {
  background: #FEF2F2;
  color: #B91C1C;
  border: 1px solid #FECACA;
}

.chip-purple {
  background: #F3E8FF;
  color: #7E22CE;
  border: 1px solid #E9D5FF;
}

.chip-blue {
  background: #EFF6FF;
  color: #1D4ED8;
  border: 1px solid #BFDBFE;
}

.chip-slate {
  background: #F1F5F9;
  color: #475569;
  border: 1px solid #E2E8F0;
}

.actions-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-table-action {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #F1F5F9;
  color: #64748B;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-table-action:hover {
  background: #FFFFFF;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.12);
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
}

.btn-table-action.btn-view:hover {
  color: #2563EB;
  background: #EFF6FF;
}

.btn-table-action.btn-edit:hover {
  color: #4F46E5;
  background: #EEF2FF;
}

.btn-table-action.btn-danger:hover {
  color: #DC2626;
  background: #FEF2F2;
}

.empty-state-box {
  padding: 36px 20px;
  text-align: center;
  max-width: 440px;
  margin: 0 auto;
}

.empty-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: #F1F5F9;
  color: #94A3B8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  margin: 0 auto 12px auto;
}

.empty-state-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0 0 4px 0;
}

.empty-state-desc {
  font-size: 0.8rem;
  color: #64748B;
  margin: 0;
  line-height: 1.45;
}
</style>
