<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ TOP BREADCRUMB & EYEBROW ═══ -->
      <div class="top-nav-bar">
        <div class="nav-left">
          <NuxtLink to="/admin/multi-tenant" class="btn-back">
            <i class="mdi mdi-arrow-left"></i> Back to Partner Directory
          </NuxtLink>
          <div class="breadcrumb-trail">
            <span class="bc-link">Partner Management</span>
            <i class="mdi mdi-chevron-right bc-sep"></i>
            <span class="bc-current">{{ partner?.name || 'Partner Center Details' }}</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="state-card text-center py-16">
        <span class="spinner-lg-red"></span>
        <p class="mt-4 text-slate-600 font-semibold">Loading Partner Center Profile...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="state-card text-center py-16">
        <div class="error-icon-box">
          <i class="mdi mdi-alert-circle-outline"></i>
        </div>
        <h3 class="text-xl font-semibold text-slate-900 mb-2">Failed to load Partner Center</h3>
        <p class="text-slate-500 mb-6 max-w-md mx-auto text-sm">{{ error }}</p>
        <NuxtLink to="/admin/multi-tenant" class="btn-red-lg">
          <i class="mdi mdi-arrow-left"></i> Return to Directory
        </NuxtLink>
      </div>

      <!-- Main Content Container -->
      <div v-else-if="partner" class="fade-in space-y-6">

        <!-- ═══ 1. HERO HEADER CARD ═══ -->
        <div class="hero-card">
          <div class="hero-left">
            <div class="partner-avatar">
              <i class="mdi mdi-domain"></i>
            </div>
            <div class="partner-meta">
              <div class="hero-title-row">
                <h1 class="partner-title">{{ partner.name }}</h1>
                <span :class="['status-badge', partner.status === 'active' ? 'badge-active' : 'badge-suspended']">
                  <span class="pulse-dot"></span> {{ partner.status }}
                </span>
              </div>
              <div class="meta-tags-row">
                <span class="meta-pill"><i class="mdi mdi-map-marker-outline"></i> {{ partner.city || 'Dubai' }}, {{ partner.country || 'UAE' }}</span>
                <span class="meta-pill"><i class="mdi mdi-certificate-outline"></i> {{ partner.institution_type || 'Authorized Training Center' }}</span>
                <span class="meta-pill text-slate-400"><i class="mdi mdi-fingerprint"></i> ID: {{ partner.id.substring(0, 12) }}...</span>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="hero-actions">
            <button class="btn-action btn-action-secondary" @click="openResetPasswordModal(partner)">
              <i class="mdi mdi-key-outline"></i> Reset Credentials
            </button>
            <button class="btn-action btn-action-secondary" @click="openEditModal">
              <i class="mdi mdi-pencil"></i> Edit Details
            </button>
            <button class="btn-action btn-action-secondary" @click="openTokenAdjustmentModal(partner)">
              <i class="mdi mdi-cash-refund"></i> Refund Tokens
            </button>
            <button
              :class="['btn-action', partner.status === 'active' ? 'btn-action-warn' : 'btn-action-success']"
              @click="toggleStatus"
            >
              <i :class="['mdi', partner.status === 'active' ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline']"></i>
              {{ partner.status === 'active' ? 'Suspend Access' : 'Activate Access' }}
            </button>
          </div>
        </div>

        <!-- ═══ 2. METRIC STATS GRID ═══ -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon bg-amber-light">
              <i class="mdi mdi-ticket-confirmation text-amber"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Wallet Balance</span>
              <span class="kpi-value">{{ partner.tokens_remaining || 0 }} <span class="kpi-unit">Tokens</span></span>
              <span class="kpi-sub text-amber">
                <i class="mdi mdi-arrow-up-bold text-xs"></i> {{ partner.tokens_purchased || 0 }} Issued &nbsp;&bull;&nbsp; {{ partner.tokens_used || 0 }} Consumed
              </span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon bg-indigo-light">
              <i class="mdi mdi-layers-triple text-indigo"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Exam Batches</span>
              <span class="kpi-value">{{ batches.length }}</span>
              <span class="kpi-sub text-indigo">Active &amp; Completed Sessions</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon bg-emerald-light">
              <i class="mdi mdi-account-group text-emerald"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Center Operators</span>
              <span class="kpi-value">{{ staff.length }}</span>
              <span class="kpi-sub text-emerald">Assigned Staff Accounts</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon bg-red-light">
              <i class="mdi mdi-certificate text-red"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Approved Curriculums</span>
              <span class="kpi-value">{{ parsePrograms(partner.programs).length }}</span>
              <span class="kpi-sub text-red">Accredited Certifications</span>
            </div>
          </div>
        </div>

        <!-- ═══ 3. NAVIGATION TAB PILLS ═══ -->
        <div class="tabs-container">
          <div class="tabs-pills">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="['tab-pill', { 'tab-pill--active': activeTab === tab.id }]"
              @click="activeTab = tab.id"
            >
              <i :class="['mdi', tab.icon]"></i> {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- ═══ 4. TAB PANELS CONTENT ═══ -->

        <!-- TAB 1: OVERVIEW & PROFILE (2-COLUMN GRID) -->
        <div v-if="activeTab === 'overview'" class="tab-panel fade-in">
          <div class="overview-grid">
            
            <!-- LEFT COLUMN (2/3): Profile & Contact Fields -->
            <div class="content-card">
              <div class="card-header-row">
                <div class="header-title-box">
                  <i class="mdi mdi-office-building header-icon text-red"></i>
                  <div>
                    <h3 class="card-title">Partner Center Specifications</h3>
                    <p class="card-subtitle">Complete profile and contact parameters registered for this institution.</p>
                  </div>
                </div>
              </div>

              <!-- Key-Value Fields Grid -->
              <div class="fields-grid">
                <div class="field-box">
                  <span class="field-label">Organization Name</span>
                  <span class="field-value text-slate-900 font-semibold">{{ partner.name }}</span>
                </div>

                <div class="field-box">
                  <span class="field-label">Institution Category</span>
                  <span class="field-value">{{ partner.institution_type || 'Authorized Training Center' }}</span>
                </div>

                <div class="field-box">
                  <span class="field-label">Primary Contact Email</span>
                  <span class="field-value text-blue font-semibold">
                    <i class="mdi mdi-email-outline mr-1"></i> {{ partner.contact_email }}
                  </span>
                </div>

                <div class="field-box">
                  <span class="field-label">Contact Phone Number</span>
                  <span class="field-value">
                    <i class="mdi mdi-phone-outline text-slate-400 mr-1"></i> {{ partner.contact_phone || 'Not Provided' }}
                  </span>
                </div>

                <div class="field-box">
                  <span class="field-label">Location Jurisdiction</span>
                  <span class="field-value">{{ partner.city || 'Dubai' }}, {{ partner.country || 'UAE' }}</span>
                </div>

                <div class="field-box">
                  <span class="field-label">System Registration Date</span>
                  <span class="field-value">{{ formatDate(partner.created_at) }}</span>
                </div>
              </div>

              <!-- Approved Accreditation Programs -->
              <div class="programs-section">
                <span class="section-micro-label">Approved Accreditation Programs</span>
                <div class="programs-tags-list">
                  <span v-for="(prog, idx) in parsePrograms(partner.programs)" :key="idx" class="program-tag-pill">
                    <i class="mdi mdi-check-circle text-red mr-1"></i> {{ prog }}
                  </span>
                </div>
              </div>
            </div>

            <!-- RIGHT COLUMN (1/3): Operational Status & Wallet Summary -->
            <div class="space-y-6">
              
              <!-- Operational Status Card -->
              <div class="content-card">
                <div class="card-header-row border-b-0 pb-0">
                  <h4 class="sidebar-card-title">Operational Governance</h4>
                </div>

                <div :class="['status-alert-box', partner.status === 'active' ? 'status-alert-green' : 'status-alert-amber']">
                  <div class="status-alert-header">
                    <i :class="['mdi', partner.status === 'active' ? 'mdi-check-circle' : 'mdi-alert-circle']"></i>
                    <span>{{ partner.status === 'active' ? 'Operational & Active' : 'Access Restricted' }}</span>
                  </div>
                  <p class="status-alert-body">
                    {{ partner.status === 'active' ? 'This partner center has active authorization to generate exam batches and consume wallet tokens.' : 'Exam creation and token allocation are currently suspended by system administrator.' }}
                  </p>
                </div>

                <!-- Wallet Mini Overview -->
                <div class="wallet-mini-card mt-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold uppercase text-slate-500">Token Balance</span>
                    <span class="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{{ partner.tokens_remaining || 0 }} Tokens</span>
                  </div>
                  <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                    <div
                      class="bg-amber-500 h-full rounded-full"
                      :style="{ width: getWalletPercent(partner.tokens_remaining, partner.tokens_purchased) + '%' }"
                    ></div>
                  </div>
                  <div class="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Issued: {{ partner.tokens_purchased || 0 }}</span>
                    <span>Used: {{ partner.tokens_used || 0 }}</span>
                  </div>
                </div>
              </div>

              <!-- Quick Navigation Shortcuts Card -->
              <div class="content-card">
                <h4 class="sidebar-card-title mb-3">Quick Actions &amp; Feed</h4>
                <div class="shortcuts-list">
                  <button class="shortcut-item" @click="activeTab = 'batches'">
                    <div class="shortcut-left">
                      <div class="shortcut-icon bg-indigo-light text-indigo">
                        <i class="mdi mdi-layers-triple"></i>
                      </div>
                      <span>View Exam Batches</span>
                    </div>
                    <i class="mdi mdi-chevron-right shortcut-arrow"></i>
                  </button>

                  <button class="shortcut-item" @click="activeTab = 'ledger'">
                    <div class="shortcut-left">
                      <div class="shortcut-icon bg-amber-light text-amber">
                        <i class="mdi mdi-history"></i>
                      </div>
                      <span>Token Audit Ledger</span>
                    </div>
                    <i class="mdi mdi-chevron-right shortcut-arrow"></i>
                  </button>

                  <button class="shortcut-item" @click="activeTab = 'staff'">
                    <div class="shortcut-left">
                      <div class="shortcut-icon bg-emerald-light text-emerald">
                        <i class="mdi mdi-account-group"></i>
                      </div>
                      <span>Center Operators</span>
                    </div>
                    <i class="mdi mdi-chevron-right shortcut-arrow"></i>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>

        <!-- TAB 2: EXAM BATCHES FEED -->
        <div v-else-if="activeTab === 'batches'" class="tab-panel fade-in">
          <div class="content-card">
            <div class="card-header-row">
              <div class="header-title-box">
                <i class="mdi mdi-layers-triple header-icon text-indigo"></i>
                <div>
                  <h3 class="card-title">Live &amp; Historical Exam Batches</h3>
                  <p class="card-subtitle">Real-time candidate participation and certification exam outcomes for this center.</p>
                </div>
              </div>
              <span class="count-badge bg-indigo-light text-indigo">Total: {{ batches.length }} Batches</span>
            </div>

            <div class="table-responsive">
              <table class="gsfin-table">
                <thead>
                  <tr>
                    <th>Batch Code / Session</th>
                    <th>Certification Exam</th>
                    <th>Status</th>
                    <th>Student Metrics</th>
                    <th>Created Date</th>
                    <th class="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="batches.length === 0">
                    <td colspan="6" class="text-center py-10 text-slate-400 font-medium">No exam batches recorded for this partner center.</td>
                  </tr>
                  <tr v-for="b in paginatedBatches" :key="b.id">
                    <td class="font-semibold text-slate-900">{{ b.id.substring(0, 8) }}...</td>
                    <td class="font-semibold text-slate-800">{{ b.exam_name || 'Certification Exam' }}</td>
                    <td>
                      <span :class="['chip-pill', getBatchStatusClass(b.status)]">
                        {{ b.status }}
                      </span>
                    </td>
                    <td>
                      <div class="metrics-pill-group">
                        <span class="chip-blue">Total: {{ b.student_count || 0 }}</span>
                        <span class="chip-green">Passed: {{ b.passed_count || 0 }}</span>
                        <span class="chip-red">Failed: {{ b.failed_count || 0 }}</span>
                      </div>
                    </td>
                    <td class="text-slate-500 font-medium">{{ formatDate(b.created_at) }}</td>
                    <td class="text-center">
                      <div class="actions-cell">
                        <button class="btn-table-action btn-view" title="View Batch Candidates & Certificates" @click="viewBatchDetails(b)">
                          <i class="mdi mdi-eye-outline"></i>
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

        <!-- TAB: TOKEN PURCHASE REQUESTS -->
        <div v-else-if="activeTab === 'requests'" class="tab-panel fade-in">
          <div class="content-card">
            <div class="card-header-row">
              <div class="header-title-box">
                <i class="mdi mdi-ticket-percent-outline header-icon text-amber"></i>
                <div>
                  <h3 class="card-title">Token Purchase Requests &amp; Payment Verification</h3>
                  <p class="card-subtitle">Offline payment confirmation and token crediting for {{ partner.name }}.</p>
                </div>
              </div>
              <span class="count-badge bg-amber-light text-amber">Total: {{ tokenRequests.length }} Requests</span>
            </div>

            <div class="table-responsive">
              <table class="gsfin-table">
                <thead>
                  <tr>
                    <th>Requested Date</th>
                    <th>Package Requested</th>
                    <th>Token Count</th>
                    <th>Amount Due</th>
                    <th>Payment Ref</th>
                    <th>Status</th>
                    <th>Admin Feedback</th>
                    <th class="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="tokenRequests.length === 0">
                    <td colspan="8" class="text-center py-10 text-slate-400 font-medium">No token purchase requests submitted by this center.</td>
                  </tr>
                  <tr v-for="req in tokenRequests" :key="req.id">
                    <td class="text-slate-500 font-medium">{{ formatDate(req.created_at) }}</td>
                    <td class="font-semibold text-slate-800">{{ req.package_name }}</td>
                    <td>
                      <span class="badge-token-count">
                        <i class="mdi mdi-ticket-confirmation"></i> {{ req.token_count }} Tokens
                      </span>
                    </td>
                    <td class="font-semibold text-emerald-600">${{ Number(req.amount).toFixed(2) }}</td>
                    <td>
                      <span v-if="req.payment_reference" class="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {{ req.payment_reference }}
                      </span>
                      <span v-else class="text-xs text-slate-400 italic">None provided</span>
                    </td>
                    <td>
                      <span
                        :class="[
                          'badge-chip',
                          req.status === 'pending' ? 'chip-amber' :
                          req.status === 'approved' ? 'chip-green' :
                          'chip-red'
                        ]"
                      >
                        <i :class="['mdi', req.status === 'pending' ? 'mdi-clock-outline' : (req.status === 'approved' ? 'mdi-check-circle' : 'mdi-close-circle')]"></i>
                        {{ req.status === 'pending' ? 'Pending Approval' : (req.status === 'approved' ? 'Approved & Issued' : 'Rejected') }}
                      </span>
                    </td>
                    <td>
                      <span v-if="req.admin_notes" class="text-xs text-slate-600">{{ req.admin_notes }}</span>
                      <span v-else class="text-xs text-slate-400 italic">-</span>
                    </td>
                    <td class="text-center">
                      <div class="actions-cell justify-center">
                        <template v-if="req.status === 'pending'">
                          <button
                            class="btn-table-action btn-success"
                            title="Confirm Payment &amp; Credit Tokens"
                            @click="approvePartnerRequest(req)"
                          >
                            <i class="mdi mdi-check-bold"></i> Approve
                          </button>
                          <button
                            class="btn-table-action btn-danger"
                            title="Reject Request"
                            @click="rejectPartnerRequest(req)"
                          >
                            <i class="mdi mdi-close"></i>
                          </button>
                        </template>
                        <span v-else class="text-xs text-slate-400 font-medium">Completed</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 3: TOKEN AUDIT LEDGER -->
        <div v-else-if="activeTab === 'ledger'" class="tab-panel fade-in">
          <div class="content-card">
            <div class="card-header-row">
              <div class="header-title-box">
                <i class="mdi mdi-ticket-confirmation header-icon text-amber"></i>
                <div>
                  <h3 class="card-title">Token Transaction Audit Ledger</h3>
                  <p class="card-subtitle">Complete chronological log of token allocations, package purchases, and consumption.</p>
                </div>
              </div>
              <span class="count-badge bg-amber-light text-amber">Balance: {{ partner.tokens_remaining || 0 }} Tokens</span>
            </div>

            <div class="table-responsive">
              <table class="gsfin-table">
                <thead>
                  <tr>
                    <th>Transaction Reference</th>
                    <th>Type</th>
                    <th>Token Amount</th>
                    <th>Package Description</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="transactions.length === 0">
                    <td colspan="5" class="text-center py-10 text-slate-400 font-medium">No token transaction records logged for this center.</td>
                  </tr>
                  <tr v-for="tx in paginatedTransactions" :key="tx.id">
                    <td class="font-mono text-xs text-slate-400">{{ tx.id ? tx.id.substring(0, 8) : '#' }}...</td>
                    <td>
                      <span :class="['chip-pill', tx.type === 'purchase' || tx.type === 'credit' || tx.type === 'admin_grant' ? 'chip-green' : (tx.type === 'admin_refund' || tx.type === 'refund_unused' ? 'chip-amber' : 'chip-red')]">
                        {{ tx.type || 'usage' }}
                      </span>
                    </td>
                    <td class="font-semibold" :class="Number(tx.token_count || tx.amount || 0) > 0 ? 'text-emerald-600' : 'text-red-600'">
                      {{ Number(tx.token_count || tx.amount || 0) > 0 ? `+${tx.token_count || tx.amount}` : `${tx.token_count || tx.amount}` }} Tokens
                    </td>
                    <td>
                      <div class="font-semibold text-slate-800">{{ tx.package_name || (tx.type === 'admin_refund' ? 'Admin Token Refund' : 'Standard Allocation') }}</div>
                      <div v-if="tx.notes" class="text-[11px] text-slate-500 mt-0.5">{{ tx.notes }}</div>
                    </td>
                    <td class="text-slate-500 font-medium">{{ formatDate(tx.created_at) }}</td>
                  </tr>
                </tbody>
              </table>
              <AppPagination
                v-if="transactions.length > 0"
                v-model="txPage"
                v-model:items-per-page="txPerPage"
                :total-items="transactions.length"
                :per-page-options="[10, 25, 50, 100]"
              />
            </div>
          </div>
        </div>

        <!-- TAB 4: CENTER OPERATORS / STAFF -->
        <div v-else-if="activeTab === 'staff'" class="tab-panel fade-in">
          <div class="content-card">
            <div class="card-header-row">
              <div class="header-title-box">
                <i class="mdi mdi-account-group header-icon text-emerald"></i>
                <div>
                  <h3 class="card-title">Center Operators &amp; Staff Roster</h3>
                  <p class="card-subtitle">Registered staff accounts with management access to this sub-center portal.</p>
                </div>
              </div>
              <span class="count-badge bg-emerald-light text-emerald">Total: {{ staff.length }} Operators</span>
            </div>

            <div class="table-responsive">
              <table class="gsfin-table">
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Email Address</th>
                    <th>Assigned Role</th>
                    <th>Account Status</th>
                    <th>Created At</th>
                    <th class="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="staff.length === 0">
                    <td colspan="6" class="text-center py-10 text-slate-400 font-medium">No staff operators registered for this partner center yet.</td>
                  </tr>
                  <tr v-for="u in paginatedStaff" :key="u.id">
                    <td class="font-semibold text-slate-900">{{ u.name }}</td>
                    <td class="text-slate-700 font-medium">{{ u.email }}</td>
                    <td><span class="chip-pill chip-blue">{{ u.role }}</span></td>
                    <td>
                      <span :class="['chip-pill', u.status === 'active' || u.is_active ? 'chip-green' : 'chip-red']">
                        {{ u.status || (u.is_active ? 'active' : 'disabled') }}
                      </span>
                    </td>
                    <td class="text-slate-500 font-medium">{{ formatDate(u.created_at) }}</td>
                    <td class="text-center">
                      <div class="actions-cell">
                        <button class="btn-table-action btn-key" title="Reset Operator Password" @click="openResetPasswordModal(partner, u)">
                          <i class="mdi mdi-key-outline"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <AppPagination
                v-if="staff.length > 0"
                v-model="staffPage"
                v-model:items-per-page="staffPerPage"
                :total-items="staff.length"
                :per-page-options="[10, 25, 50, 100]"
              />
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- ═══ EDIT PARTNER MODAL ═══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Edit Partner Center Profile</h3>
              <button class="modal-close-btn" @click="showEditModal = false"><i class="mdi mdi-close"></i></button>
            </div>
            <div class="modal-body space-y-4">
              <div class="form-group">
                <label class="form-label">Partner Center Name *</label>
                <input v-model="editForm.name" type="text" class="modal-input" placeholder="e.g. Apex Training Center" />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                  <label class="form-label">Contact Email *</label>
                  <input v-model="editForm.contact_email" type="email" class="modal-input" placeholder="contact@center.com" />
                </div>
                <div class="form-group">
                  <label class="form-label">Contact Phone</label>
                  <input v-model="editForm.contact_phone" type="text" class="modal-input" placeholder="+971 4 123 4567" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                  <label class="form-label">Country</label>
                  <input v-model="editForm.country" type="text" class="modal-input" placeholder="United Arab Emirates" />
                </div>
                <div class="form-group">
                  <label class="form-label">City</label>
                  <input v-model="editForm.city" type="text" class="modal-input" placeholder="Dubai" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Institution Type</label>
                <select v-model="editForm.institution_type" class="modal-input">
                  <option value="Authorized Training Center">Authorized Training Center</option>
                  <option value="University / Academic Institute">University / Academic Institute</option>
                  <option value="Government Body">Government Body</option>
                  <option value="Corporate Enterprise">Corporate Enterprise</option>
                </select>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-glass" @click="showEditModal = false">Cancel</button>
              <button class="btn-red-md" :disabled="saving" @click="savePartner">
                <span v-if="saving" class="spinner-sm-red mr-1"></span>
                {{ saving ? 'Saving...' : 'Update Partner Center' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ═══ RESET PASSWORD MODAL ═══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showResetModal" class="modal-overlay" @click.self="closeResetModal">
          <div class="modal-card">
            <div class="modal-header">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-semibold">
                  <i class="mdi mdi-key-variant"></i>
                </div>
                <div>
                  <h3 class="m-0 text-base font-semibold text-slate-900">Reset Credentials</h3>
                  <p class="m-0 text-xs text-slate-500">{{ resetTargetUser ? resetTargetUser.name : partner?.name }}</p>
                </div>
              </div>
              <button class="modal-close-btn" @click="closeResetModal"><i class="mdi mdi-close"></i></button>
            </div>
            
            <div class="modal-body">
              <div v-if="!resetSuccessResult">
                <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4 text-xs text-slate-600 leading-relaxed">
                  Reset login credentials for <strong>{{ resetTargetUser ? resetTargetUser.name : partner?.name }}</strong>. 
                  Account login email: <strong class="text-slate-900">{{ resetTargetEmail }}</strong>.
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">Password Mode</label>
                  <div class="flex gap-4 mt-1">
                    <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input type="radio" value="auto" v-model="resetPasswordMode" />
                      <span>Auto-generate secure password</span>
                    </label>
                    <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input type="radio" value="custom" v-model="resetPasswordMode" />
                      <span>Custom password</span>
                    </label>
                  </div>
                </div>

                <div v-if="resetPasswordMode === 'custom'" class="form-group mb-3">
                  <label class="form-label">New Password *</label>
                  <input
                    v-model="customResetPassword"
                    type="text"
                    placeholder="Enter new strong password"
                    class="modal-input"
                  />
                </div>

                <div class="form-group mb-2">
                  <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" v-model="resetSendEmail" />
                    <span>Send email notification with login instructions</span>
                  </label>
                </div>
              </div>

              <!-- Success State -->
              <div v-else class="text-center py-2">
                <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-2xl">
                  <i class="mdi mdi-check-circle-outline"></i>
                </div>
                <h4 class="text-base font-semibold text-slate-900 mb-1">Password Successfully Updated</h4>
                <p class="text-xs text-slate-500 mb-4">
                  Credentials for <strong>{{ resetSuccessResult.email }}</strong> are ready.
                  <span v-if="resetSendEmail" class="text-emerald-700 font-semibold block mt-1">Email notification dispatched successfully.</span>
                </p>

                <div class="p-3 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between text-left mb-2">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs text-slate-500 uppercase font-semibold">Temporary Password:</span>
                    <span class="font-mono font-semibold text-base text-slate-900 select-all">{{ resetSuccessResult.tempPassword }}</span>
                  </div>
                  <button 
                    class="btn-table-action btn-edit" 
                    :title="copiedPassword ? 'Copied!' : 'Copy to Clipboard'"
                    @click="copyToClipboard(resetSuccessResult.tempPassword)"
                  >
                    <i :class="['mdi', copiedPassword ? 'mdi-check' : 'mdi-content-copy']"></i>
                  </button>
                </div>
                <span v-if="copiedPassword" class="text-xs text-emerald-600 font-semibold block">Copied to clipboard!</span>
              </div>
            </div>

            <div class="modal-footer">
              <template v-if="!resetSuccessResult">
                <button class="btn-glass" @click="closeResetModal" :disabled="resettingPassword">Cancel</button>
                <button class="btn-red-md" @click="executePasswordReset" :disabled="resettingPassword">
                  <span v-if="resettingPassword"><span class="spinner-sm-white mr-1"></span> Resetting...</span>
                  <span v-else>Confirm &amp; Reset Password</span>
                </button>
              </template>
              <template v-else>
                <button class="btn-red-md" @click="closeResetModal">Done</button>
              </template>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ═══ BATCH DETAILS MODAL (STUDENTS & CERTIFICATES) ═══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showBatchModal" class="modal-overlay" @click.self="showBatchModal = false">
          <div class="modal-card max-w-2xl">
            <div class="modal-header">
              <div class="flex items-center gap-3">
                <div class="icon-box-lg bg-indigo-light text-indigo">
                  <i class="mdi mdi-layers-triple"></i>
                </div>
                <div>
                  <h3 class="modal-title">{{ selectedBatch?.exam_name || 'Exam Batch Session' }}</h3>
                  <span class="text-xs text-slate-500 font-medium">
                    Batch Code: <strong class="text-slate-800 font-mono">{{ selectedBatch?.id ? selectedBatch.id.substring(0, 12) + '...' : '' }}</strong> &bull;
                    Status: <strong class="text-indigo">{{ selectedBatch?.status }}</strong>
                  </span>
                </div>
              </div>
              <button class="modal-close-btn" @click="showBatchModal = false"><i class="mdi mdi-close"></i></button>
            </div>

            <div class="modal-body">
              <div v-if="loadingBatchDetails" class="text-center py-10">
                <span class="spinner-sm-red"></span>
                <p class="mt-2 text-xs text-slate-500 font-semibold">Loading enrolled candidates and certificates...</p>
              </div>

              <div v-else>
                <div class="flex items-center justify-between mb-3 text-xs font-semibold text-slate-700">
                  <span>Enrolled Candidates ({{ batchAssignments.length }})</span>
                  <div class="flex items-center gap-2">
                    <span class="chip-green">Passed: {{ batchAssignments.filter(a => a.status === 'passed').length }}</span>
                    <span class="chip-red">Failed: {{ batchAssignments.filter(a => a.status === 'failed').length }}</span>
                  </div>
                </div>

                <div class="table-responsive border border-slate-100 rounded-xl overflow-hidden">
                  <table class="gsfin-table">
                    <thead>
                      <tr>
                        <th>Candidate Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Attempts</th>
                        <th>Certificate</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="batchAssignments.length === 0">
                        <td colspan="5" class="text-center py-8 text-slate-400 text-xs font-medium">No candidates assigned to this batch session.</td>
                      </tr>
                      <tr v-for="a in batchAssignments" :key="a.id">
                        <td class="font-semibold text-slate-900">{{ a.student_name }}</td>
                        <td class="text-xs text-slate-500 font-mono">{{ a.student_email }}</td>
                        <td>
                          <span :class="['chip-pill', a.status === 'passed' ? 'chip-green' : (a.status === 'failed' ? 'chip-red' : 'chip-blue')]">
                            {{ a.status }}
                          </span>
                        </td>
                        <td><span class="chip-pill chip-slate">{{ a.attempts || 0 }}</span></td>
                        <td>
                          <a
                            v-if="a.certificate_url"
                            :href="a.certificate_url"
                            target="_blank"
                            class="inline-flex items-center gap-1 text-xs font-semibold text-red hover:underline"
                          >
                            <i class="mdi mdi-file-certificate-outline"></i> View Certificate
                          </a>
                          <span v-else class="text-xs text-slate-400">Not Issued</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="modal-footer flex justify-end">
              <button class="btn-glass" @click="showBatchModal = false">Close</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Token Adjustment / Refund Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showTokenAdjustmentModal" class="modal-overlay" @click.self="showTokenAdjustmentModal = false">
          <div class="modal-card modal-card-token">
            <div class="modal-header">
              <div class="modal-title-row">
                <div class="modal-header-icon bg-amber-light text-amber">
                  <i class="mdi mdi-cash-refund"></i>
                </div>
                <div class="modal-title-text">
                  <h3>Manage &amp; Refund Tokens</h3>
                  <p>{{ selectedOrgForTokens?.name }}</p>
                </div>
              </div>
              <button class="modal-close-btn" @click="showTokenAdjustmentModal = false"><i class="mdi mdi-close"></i></button>
            </div>

            <div class="modal-body">
              <!-- Current Balance Header Box -->
              <div class="token-balance-banner">
                <div class="token-balance-info">
                  <span class="token-balance-label">Current Available Balance</span>
                  <span class="token-balance-val">{{ selectedOrgForTokens?.tokens_remaining || 0 }} Tokens</span>
                </div>
                <div class="token-balance-icon-box">
                  <i class="mdi mdi-ticket-confirmation"></i>
                </div>
              </div>

              <!-- Action Mode Selection -->
              <div class="form-group mb-4">
                <label class="form-label">Action Type</label>
                <div class="token-mode-switch-grid">
                  <button
                    type="button"
                    :class="['token-mode-btn', { active: tokenAdjustmentMode === 'refund', 'btn-refund-mode': tokenAdjustmentMode === 'refund' }]"
                    @click="tokenAdjustmentMode = 'refund'"
                  >
                    <i class="mdi mdi-cash-refund"></i>
                    <span>Take Back / Refund</span>
                  </button>
                  <button
                    type="button"
                    :class="['token-mode-btn', { active: tokenAdjustmentMode === 'grant', 'btn-grant-mode': tokenAdjustmentMode === 'grant' }]"
                    @click="tokenAdjustmentMode = 'grant'"
                  >
                    <i class="mdi mdi-plus-circle"></i>
                    <span>Manual Grant / Add</span>
                  </button>
                </div>
              </div>

              <!-- Token Amount Input & Quick Presets -->
              <div class="form-group mb-3">
                <div class="form-label-row">
                  <label class="form-label mb-0">Token Count to {{ tokenAdjustmentMode === 'refund' ? 'Take Back / Refund' : 'Grant' }} *</label>
                  <span v-if="tokenAdjustmentMode === 'refund'" class="form-hint-max">
                    Max: {{ selectedOrgForTokens?.tokens_remaining || 0 }} Tokens
                  </span>
                </div>
                <input
                  v-model.number="tokenAdjustmentAmount"
                  type="number"
                  min="1"
                  :max="tokenAdjustmentMode === 'refund' ? (selectedOrgForTokens?.tokens_remaining || 0) : 10000"
                  placeholder="Enter tokens count"
                  class="modal-input"
                  required
                />
                <div v-if="tokenAdjustmentMode === 'refund' && (selectedOrgForTokens?.tokens_remaining || 0) > 0" class="token-presets-row">
                  <div class="preset-pill-group">
                    <button
                      type="button"
                      v-for="amt in [10, 50, 100].filter(a => a <= (selectedOrgForTokens?.tokens_remaining || 0))"
                      :key="amt"
                      :class="['preset-btn', { 'preset-selected': tokenAdjustmentAmount === amt }]"
                      @click="tokenAdjustmentAmount = amt"
                    >
                      {{ amt }}
                    </button>
                  </div>
                  <button
                    type="button"
                    class="preset-max-btn"
                    @click="tokenAdjustmentAmount = selectedOrgForTokens?.tokens_remaining || 0"
                  >
                    Refund All ({{ selectedOrgForTokens?.tokens_remaining || 0 }})
                  </button>
                </div>
              </div>

              <!-- Reason / Notes -->
              <div class="form-group mb-4">
                <label class="form-label">Reason / Administrative Note <span class="text-slate-400 font-normal">(Optional)</span></label>
                <textarea
                  v-model="tokenAdjustmentReason"
                  rows="2"
                  :placeholder="tokenAdjustmentMode === 'refund' ? 'e.g. Offline payment refunded, order cancelled, or adjustment of duplicate approval' : 'e.g. Complimentary test tokens or promotional credit'"
                  class="modal-input"
                  style="resize: none;"
                ></textarea>
              </div>

              <!-- Projected Balance Calculation Banner -->
              <div :class="['token-projection-banner', tokenAdjustmentMode === 'refund' ? 'projection-refund' : 'projection-grant']">
                <div class="projection-label">
                  <i :class="['mdi', tokenAdjustmentMode === 'refund' ? 'mdi-information-outline' : 'mdi-plus-circle-outline']"></i>
                  <span>Resulting Wallet Balance:</span>
                </div>
                <div class="projection-calc">
                  <span>{{ selectedOrgForTokens?.tokens_remaining || 0 }}</span>
                  <span :class="tokenAdjustmentMode === 'refund' ? 'text-red' : 'text-emerald'">
                    {{ tokenAdjustmentMode === 'refund' ? ` - ${tokenAdjustmentAmount || 0}` : ` + ${tokenAdjustmentAmount || 0}` }}
                  </span>
                  <span class="calc-equals">=</span>
                  <strong class="calc-result">{{ projectedTokenBalance }} Tokens</strong>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-glass" @click="showTokenAdjustmentModal = false">Cancel</button>
              <button
                v-if="tokenAdjustmentMode === 'refund'"
                class="btn-red"
                :disabled="adjustingTokens || !tokenAdjustmentAmount || tokenAdjustmentAmount <= 0 || tokenAdjustmentAmount > (selectedOrgForTokens?.tokens_remaining || 0)"
                @click="confirmTokenAdjustment"
              >
                <i :class="['mdi', adjustingTokens ? 'mdi-loading spin-icon' : 'mdi-cash-refund']"></i>
                {{ adjustingTokens ? 'Refunding Tokens...' : `Refund ${tokenAdjustmentAmount || 0} Tokens` }}
              </button>
              <button
                v-else
                class="btn-emerald"
                :disabled="adjustingTokens || !tokenAdjustmentAmount || tokenAdjustmentAmount <= 0"
                @click="confirmTokenAdjustment"
              >
                <i :class="['mdi', adjustingTokens ? 'mdi-loading spin-icon' : 'mdi-plus-circle']"></i>
                {{ adjustingTokens ? 'Granting Tokens...' : `Grant ${tokenAdjustmentAmount || 0} Tokens` }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';
import AppPagination from '@/components/common/AppPagination.vue';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role']
});

const route = useRoute();
const api = useApi();

const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);

const partner = ref<any>(null);
const batches = ref<any[]>([]);
const transactions = ref<any[]>([]);
const staff = ref<any[]>([]);

// Pagination state
const batchPage = ref(1);
const batchPerPage = ref(10);
const paginatedBatches = computed(() => {
  const start = (batchPage.value - 1) * batchPerPage.value;
  return batches.value.slice(start, start + batchPerPage.value);
});

const txPage = ref(1);
const txPerPage = ref(10);
const paginatedTransactions = computed(() => {
  const start = (txPage.value - 1) * txPerPage.value;
  return transactions.value.slice(start, start + txPerPage.value);
});

const staffPage = ref(1);
const staffPerPage = ref(10);
const paginatedStaff = computed(() => {
  const start = (staffPage.value - 1) * staffPerPage.value;
  return staff.value.slice(start, start + staffPerPage.value);
});

const activeTab = ref('overview');
const showEditModal = ref(false);

// Batch details modal state
const showBatchModal = ref(false);
const selectedBatch = ref<any>(null);
const batchAssignments = ref<any[]>([]);
const loadingBatchDetails = ref(false);

const viewBatchDetails = async (batch: any) => {
  selectedBatch.value = batch;
  showBatchModal.value = true;
  loadingBatchDetails.value = true;
  batchAssignments.value = [];
  try {
    const { data } = await api.get(`/main-admin/batches/${batch.id}`);
    batchAssignments.value = data.assignments || [];
  } catch (err: any) {
    console.error('Failed to load batch details:', err);
  } finally {
    loadingBatchDetails.value = false;
  }
};

// Reset password modal state
const showResetModal = ref(false);
const resetTargetUser = ref<any>(null);
const resetTargetEmail = ref('');
const resetPasswordMode = ref<'auto' | 'custom'>('auto');
const customResetPassword = ref('');
const resetSendEmail = ref(true);
const resettingPassword = ref(false);
const resetSuccessResult = ref<{ email: string; tempPassword: string; isNewAccount?: boolean } | null>(null);
const copiedPassword = ref(false);

const editForm = ref({
  name: '',
  contact_email: '',
  contact_phone: '',
  country: '',
  city: '',
  institution_type: 'Authorized Training Center',
  programs: ['CODEX HACCP'],
  status: 'active'
});

const tokenRequests = ref<any[]>([]);

// Token Adjustment / Refund Modal State
const showTokenAdjustmentModal = ref(false);
const selectedOrgForTokens = ref<any>(null);
const tokenAdjustmentMode = ref<'refund' | 'grant'>('refund');
const tokenAdjustmentAmount = ref<number>(50);
const tokenAdjustmentReason = ref<string>('');
const adjustingTokens = ref(false);

const projectedTokenBalance = computed(() => {
  const current = Number(selectedOrgForTokens.value?.tokens_remaining || 0);
  const amt = Number(tokenAdjustmentAmount.value || 0);
  if (tokenAdjustmentMode.value === 'refund') {
    return Math.max(0, current - amt);
  }
  return current + amt;
});

function openTokenAdjustmentModal(org: any) {
  selectedOrgForTokens.value = org || partner.value;
  tokenAdjustmentMode.value = 'refund';
  const avail = Number(selectedOrgForTokens.value?.tokens_remaining || 0);
  tokenAdjustmentAmount.value = avail >= 50 ? 50 : avail;
  tokenAdjustmentReason.value = '';
  showTokenAdjustmentModal.value = true;
}

async function confirmTokenAdjustment() {
  if (!selectedOrgForTokens.value) return;
  const org = selectedOrgForTokens.value;
  const amt = Number(tokenAdjustmentAmount.value);
  if (!amt || amt <= 0) {
    alert('Please enter a valid positive token amount.');
    return;
  }

  adjustingTokens.value = true;
  try {
    if (tokenAdjustmentMode.value === 'refund') {
      const { data } = await api.post(`/main-admin/organizations/${org.id}/refund-tokens`, {
        amount: amt,
        reason: tokenAdjustmentReason.value
      });
      alert(data.message || `Successfully refunded ${amt} tokens from ${org.name}.`);
    } else {
      const { data } = await api.post(`/main-admin/organizations/${org.id}/grant-tokens`, {
        amount: amt,
        reason: tokenAdjustmentReason.value
      });
      alert(data.message || `Successfully granted ${amt} tokens to ${org.name}.`);
    }
    showTokenAdjustmentModal.value = false;
    await fetchDetail();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to adjust tokens');
  } finally {
    adjustingTokens.value = false;
  }
}

const tabs = [
  { id: 'overview', label: 'Overview & Profile', icon: 'mdi-office-building' },
  { id: 'batches', label: 'Exam Batches', icon: 'mdi-layers-triple' },
  { id: 'requests', label: 'Token Requests', icon: 'mdi-ticket-percent-outline' },
  { id: 'ledger', label: 'Token Audit Log', icon: 'mdi-ticket-confirmation' },
  { id: 'staff', label: 'Center Operators', icon: 'mdi-account-group' }
];

const fetchDetail = async () => {
  loading.value = true;
  error.value = null;
  try {
    const orgId = route.params.id;
    const { data } = await api.get(`/main-admin/organizations/${orgId}`);
    partner.value = data.organization;
    batches.value = data.batches || [];
    transactions.value = data.transactions || [];
    staff.value = data.staff || [];
    tokenRequests.value = data.tokenRequests || [];
  } catch (err: any) {
    console.error('Failed to load partner details:', err);
    error.value = err?.response?.data?.message || err?.message || 'Failed to load partner center details.';
  } finally {
    loading.value = false;
  }
};

const approvePartnerRequest = async (req: any) => {
  const note = prompt(`Confirm payment of $${Number(req.amount).toFixed(2)} received for ${req.package_name}? Enter optional receipt or bank reference:`, req.payment_reference || '');
  if (note === null) return;
  try {
    await api.post(`/main-admin/token-requests/${req.id}/approve`, { payment_reference: note });
    alert('Payment confirmed and tokens credited successfully!');
    await fetchDetail();
  } catch (err: any) {
    alert(err?.response?.data?.message || err?.message || 'Failed to approve request');
  }
};

const rejectPartnerRequest = async (req: any) => {
  const reason = prompt('Please enter the reason for rejecting this token request:');
  if (!reason) return;
  try {
    await api.post(`/main-admin/token-requests/${req.id}/reject`, { admin_notes: reason });
    alert('Token request rejected.');
    await fetchDetail();
  } catch (err: any) {
    alert(err?.response?.data?.message || err?.message || 'Failed to reject request');
  }
};

const openEditModal = () => {
  if (!partner.value) return;
  editForm.value = {
    name: partner.value.name || '',
    contact_email: partner.value.contact_email || '',
    contact_phone: partner.value.contact_phone || '',
    country: partner.value.country || 'United Arab Emirates',
    city: partner.value.city || 'Dubai',
    institution_type: partner.value.institution_type || 'Authorized Training Center',
    programs: parsePrograms(partner.value.programs),
    status: partner.value.status || 'active'
  };
  showEditModal.value = true;
};

const savePartner = async () => {
  if (!editForm.value.name || !editForm.value.contact_email) return;
  saving.value = true;
  try {
    await api.put(`/main-admin/organizations/${partner.value.id}`, editForm.value);
    showEditModal.value = false;
    await fetchDetail();
  } catch (err: any) {
    alert(err?.response?.data?.message || err?.message || 'Failed to update partner center.');
  } finally {
    saving.value = false;
  }
};

const toggleStatus = async () => {
  if (!partner.value) return;
  const newStatus = partner.value.status === 'active' ? 'suspended' : 'active';
  try {
    await api.patch(`/main-admin/organizations/${partner.value.id}/status`, { status: newStatus });
    await fetchDetail();
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Failed to change status.');
  }
};

const openResetPasswordModal = (org: any, user: any = null) => {
  resetTargetUser.value = user;
  resetTargetEmail.value = user ? user.email : (org?.contact_email || '');
  resetPasswordMode.value = 'auto';
  customResetPassword.value = '';
  resetSendEmail.value = true;
  resetSuccessResult.value = null;
  copiedPassword.value = false;
  showResetModal.value = true;
};

const closeResetModal = () => {
  showResetModal.value = false;
  resetTargetUser.value = null;
  resetTargetEmail.value = '';
  resetSuccessResult.value = null;
  customResetPassword.value = '';
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    copiedPassword.value = true;
    setTimeout(() => { copiedPassword.value = false; }, 3000);
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
  }
};

const executePasswordReset = async () => {
  if (!partner.value) return;
  if (resetPasswordMode.value === 'custom' && !customResetPassword.value) {
    alert('Please enter a new password.');
    return;
  }

  resettingPassword.value = true;
  try {
    const payload: any = {
      send_email: resetSendEmail.value,
      email: resetTargetEmail.value
    };
    if (resetPasswordMode.value === 'custom') {
      payload.password = customResetPassword.value;
    }

    const { data } = await api.post(`/main-admin/organizations/${partner.value.id}/reset-password`, payload);
    resetSuccessResult.value = {
      email: data.email || resetTargetEmail.value,
      tempPassword: data.tempPassword || customResetPassword.value
    };
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to reset password');
  } finally {
    resettingPassword.value = false;
  }
};

const parsePrograms = (programsRaw: any): string[] => {
  if (!programsRaw) return ['CODEX HACCP'];
  if (Array.isArray(programsRaw)) return programsRaw;
  try {
    const parsed = JSON.parse(programsRaw);
    return Array.isArray(parsed) ? parsed : ['CODEX HACCP'];
  } catch (e) {
    return [String(programsRaw)];
  }
};

const getBatchStatusClass = (status: string) => {
  switch (status) {
    case 'in_progress': return 'chip-blue';
    case 'completed': return 'chip-green';
    default: return 'chip-amber';
  }
};

const getWalletPercent = (remaining: number, total: number) => {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round(((remaining || 0) / total) * 100));
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

onMounted(() => {
  fetchDetail();
});
</script>

<style scoped>
.gsfin-admin-page {
  padding: 24px 32px;
  background: #F8FAFC;
  min-height: 100vh;
}
.admin-wrap {
  max-width: 1440px;
  margin: 0 auto;
}

/* Top Nav & Breadcrumbs */
.top-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}
.nav-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 10px 20px;
  border-radius: 14px;
  font-size: 0.86rem;
  font-weight: 600;
  color: #334155;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
  transition: all 0.2s ease;
}
.btn-back:hover {
  background: #F1F5F9;
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.3);
}

.breadcrumb-trail {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.88rem;
  font-weight: 600;
}
.bc-link { color: #64748B; }
.bc-sep { color: #CBD5E1; font-size: 1.1rem; }
.bc-current { color: #0F172A; }

/* Hero Card */
.hero-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  padding: 36px 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.03);
  flex-wrap: wrap;
  margin-bottom: 36px;
}
.hero-left {
  display: flex;
  align-items: center;
  gap: 24px;
}
.partner-avatar {
  width: 72px;
  height: 72px;
  border-radius: 22px;
  background: rgba(227, 27, 35, 0.08);
  color: #E31B23;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  flex-shrink: 0;
}
.eyebrow-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  font-weight: 600;
  color: #E31B23;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.hero-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 4px;
}
.partner-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  line-height: 1.25;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 50px;
  font-size: 0.74rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.badge-active { background: rgba(16, 185, 129, 0.1); color: #059669; }
.badge-suspended { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.meta-tags-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.meta-pill {
  font-size: 0.86rem;
  font-weight: 600;
  color: #64748B;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 14px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}
.btn-action-secondary { background: #F1F5F9; color: #334155; border: 1px solid rgba(15, 23, 42, 0.1); }
.btn-action-secondary:hover { background: #E2E8F0; color: #0F172A; }
.btn-action-warn { background: rgba(245, 158, 11, 0.1); color: #D97706; border: 1px solid rgba(245, 158, 11, 0.2); }
.btn-action-warn:hover { background: #D97706; color: #FFFFFF; }
.btn-action-success { background: rgba(16, 185, 129, 0.1); color: #059669; border: 1px solid rgba(16, 185, 129, 0.2); }
.btn-action-success:hover { background: #059669; color: #FFFFFF; }

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 36px;
}
@media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .kpi-grid { grid-template-columns: 1fr; } }

.kpi-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 26px 28px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.02);
}
.kpi-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.55rem;
  flex-shrink: 0;
}
.bg-amber-light { background: rgba(245, 158, 11, 0.1); }
.bg-indigo-light { background: rgba(79, 70, 229, 0.1); }
.bg-emerald-light { background: rgba(16, 185, 129, 0.1); }
.bg-red-light { background: rgba(227, 27, 35, 0.1); }

.text-amber { color: #D97706; }
.text-indigo { color: #4F46E5; }
.text-emerald { color: #059669; }
.text-red { color: #E31B23; }

.kpi-content { display: flex; flex-direction: column; }
.kpi-label { font-size: 0.76rem; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }
.kpi-value { font-size: 1.75rem; font-weight: 600; color: #0F172A; line-height: 1.2; margin-top: 4px; }
.kpi-unit { font-size: 0.95rem; font-weight: 600; color: #64748B; }
.kpi-sub { font-size: 0.78rem; font-weight: 600; margin-top: 6px; }

/* Tabs Navigation Bar */
.tabs-container {
  margin-top: 36px;
  margin-bottom: 32px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  padding-bottom: 12px;
}
.tabs-pills {
  display: flex;
  align-items: center;
  gap: 14px;
  overflow-x: auto;
}
.tab-pill {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 12px 24px;
  border-radius: 14px;
  font-size: 0.92rem;
  font-weight: 600;
  color: #64748B;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.tab-pill:hover {
  background: #F8FAFC;
  color: #0F172A;
}
.tab-pill--active {
  background: #E31B23 !important;
  color: #FFFFFF !important;
  border-color: #E31B23 !important;
  box-shadow: 0 4px 14px rgba(227, 27, 35, 0.25);
}

/* Overview Layout (2-Column Grid) */
.overview-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
  margin-top: 32px;
}
@media (max-width: 1024px) { .overview-grid { grid-template-columns: 1fr; } }

/* Cards Styling */
.content-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  padding: 36px 40px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.02);
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 24px;
  margin-bottom: 32px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}
.header-title-box {
  display: flex;
  align-items: center;
  gap: 16px;
}
.header-icon {
  font-size: 2rem;
}
.card-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
}
.card-subtitle {
  font-size: 0.86rem;
  color: #64748B;
  margin: 4px 0 0 0;
}
.sidebar-card-title {
  font-size: 0.98rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Fields Grid */
.fields-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px 28px;
}
@media (max-width: 640px) { .fields-grid { grid-template-columns: 1fr; } }

.field-box {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.06);
  padding: 18px 22px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 0.74rem;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.field-value {
  font-size: 0.98rem;
  color: #0F172A;
  font-weight: 600;
}

/* Programs Section */
.programs-section {
  margin-top: 36px;
  padding-top: 28px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}
.section-micro-label {
  display: block;
  font-size: 0.74rem;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 14px;
}
.programs-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.program-tag-pill {
  display: inline-flex;
  align-items: center;
  background: #F1F5F9;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 8px 18px;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1E293B;
}

/* Status Alert Box */
.status-alert-box {
  padding: 24px;
  border-radius: 18px;
  border: 1px solid;
}
.status-alert-green { background: #ECFDF5; border-color: #A7F3D0; color: #065F46; }
.status-alert-amber { background: #FFFBEB; border-color: #FDE68A; color: #92400E; }

.status-alert-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 0.95rem;
}
.status-alert-body {
  font-size: 0.84rem;
  margin-top: 8px;
  line-height: 1.6;
  font-weight: 500;
}

.wallet-mini-card {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 20px;
  margin-top: 20px;
}

/* Shortcuts List */
.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.shortcut-item {
  width: 100%;
  padding: 14px 18px;
  border-radius: 14px;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s ease;
}
.shortcut-item:hover {
  background: #F1F5F9;
  border-color: rgba(227, 27, 35, 0.2);
}
.shortcut-left {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1E293B;
}
.shortcut-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}
.shortcut-arrow { color: #94A3B8; font-size: 1.2rem; }

/* Tables */
.table-responsive { overflow-x: auto; }
.gsfin-table { width: 100%; border-collapse: collapse; text-align: left; }
.gsfin-table th { background: #F8FAFC; padding: 18px 24px; font-size: 0.74rem; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid rgba(15, 23, 42, 0.08); }
.gsfin-table td { padding: 20px 24px; font-size: 0.9rem; color: #334155; border-bottom: 1px solid rgba(15, 23, 42, 0.06); vertical-align: middle; }

.chip-pill { padding: 6px 14px; border-radius: 50px; font-size: 0.74rem; font-weight: 600; text-transform: uppercase; }
.chip-green { background: rgba(16, 185, 129, 0.1); color: #059669; }
.chip-blue { background: rgba(37, 99, 235, 0.1); color: #2563EB; }
.chip-amber { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.chip-red { background: rgba(239, 68, 68, 0.1); color: #DC2626; }
.count-badge { padding: 6px 16px; border-radius: 50px; font-size: 0.8rem; font-weight: 600; }

.metrics-pill-group { display: flex; gap: 8px; flex-wrap: wrap; }

/* State Cards & Modals */
.state-card { background: #FFFFFF; border: 1px solid rgba(15, 23, 42, 0.08); border-radius: 20px; }
.error-icon-box { width: 56px; height: 56px; border-radius: 50%; background: rgba(239, 68, 68, 0.1); color: #DC2626; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 12px auto; }

.modal-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-card { background: #FFFFFF; border-radius: 20px; width: 100%; max-width: 540px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15); overflow: hidden; }
.modal-header { padding: 20px 24px; border-bottom: 1px solid rgba(15, 23, 42, 0.08); display: flex; align-items: center; justify-content: space-between; background: #FAFAFD; }
.modal-header h3 { font-size: 1.15rem; font-weight: 600; color: #0F172A; margin: 0; }
.modal-close-btn { background: #F1F5F9; border: none; width: 32px; height: 32px; border-radius: 50%; color: #64748B; cursor: pointer; }
.modal-body { padding: 24px; }
.modal-footer { padding: 16px 24px; background: #FAFAFD; border-top: 1px solid rgba(15, 23, 42, 0.06); display: flex; align-items: center; justify-content: flex-end; gap: 12px; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 0.8rem; font-weight: 600; color: #334155; }
.modal-input {
  width: 100%; padding: 10px 14px; border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12); background: #F8FAFC;
  font-size: 0.88rem; color: #0F172A; outline: none; font-family: inherit; box-sizing: border-box;
}
.modal-input:focus { border-color: #E31B23; background: #FFFFFF; }

.btn-red-lg { background: #E31B23; color: #FFFFFF; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 0.9rem; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
.btn-red-md { background: #E31B23; color: #FFFFFF; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 0.86rem; cursor: pointer; }
.btn-glass { background: #F1F5F9; color: #334155; border: 1px solid rgba(15, 23, 42, 0.1); padding: 10px 18px; border-radius: 10px; font-weight: 600; font-size: 0.86rem; cursor: pointer; }

.fade-in { animation: fadeIn 0.25s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.spinner-lg-red { width: 32px; height: 32px; border: 3px solid rgba(227, 27, 35, 0.2); border-top-color: #E31B23; border-radius: 50%; animation: spin 0.75s linear infinite; display: inline-block; }
.spinner-sm-red { width: 16px; height: 16px; border: 2px solid rgba(227, 27, 35, 0.2); border-top-color: #E31B23; border-radius: 50%; animation: spin 0.75s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Token Adjustment Modal Styles ── */
.modal-card-token {
  max-width: 520px;
}

.modal-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.modal-title-text h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  line-height: 1.2;
}

.modal-title-text p {
  font-size: 0.78rem;
  color: #64748B;
  margin: 3px 0 0 0;
  line-height: 1.2;
}

.token-balance-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  margin-bottom: 16px;
}

.token-balance-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.token-balance-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748B;
}

.token-balance-val {
  font-size: 1.35rem;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.2;
}

.token-balance-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #D97706;
  font-size: 1.4rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.token-mode-switch-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.token-mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: 12px;
  font-size: 0.82rem;
  font-weight: 600;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
}

.token-mode-btn:hover {
  background: #F8FAFC;
  border-color: rgba(15, 23, 42, 0.2);
}

.token-mode-btn.active.btn-refund-mode {
  background: #FEF2F2;
  border-color: rgba(239, 68, 68, 0.35);
  color: #DC2626;
  box-shadow: 0 2px 6px rgba(220, 38, 38, 0.1);
}

.token-mode-btn.active.btn-grant-mode {
  background: #ECFDF5;
  border-color: rgba(16, 185, 129, 0.35);
  color: #059669;
  box-shadow: 0 2px 6px rgba(5, 150, 105, 0.1);
}

.token-mode-btn i {
  font-size: 1.15rem;
}

.form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.form-hint-max {
  font-size: 0.74rem;
  color: #64748B;
  font-weight: 600;
}

.token-presets-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  gap: 8px;
}

.preset-pill-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.preset-btn {
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 0.76rem;
  font-weight: 600;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  color: #334155;
  cursor: pointer;
  transition: all 0.18s ease;
}

.preset-btn:hover {
  background: #F1F5F9;
  border-color: rgba(15, 23, 42, 0.2);
}

.preset-btn.preset-selected {
  background: #0F172A;
  color: #FFFFFF;
  border-color: #0F172A;
}

.preset-max-btn {
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 0.76rem;
  font-weight: 600;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: #FEF2F2;
  color: #DC2626;
  cursor: pointer;
  transition: all 0.18s ease;
  margin-left: auto;
}

.preset-max-btn:hover {
  background: #DC2626;
  color: #FFFFFF;
}

.token-projection-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.82rem;
  font-weight: 600;
  border: 1px solid transparent;
  gap: 12px;
  flex-wrap: wrap;
}

.projection-refund {
  background: #FFFBEB;
  border-color: rgba(245, 158, 11, 0.3);
  color: #92400E;
}

.projection-grant {
  background: #ECFDF5;
  border-color: rgba(16, 185, 129, 0.3);
  color: #065F46;
}

.projection-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.projection-calc {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: monospace, ui-monospace, sans-serif;
  font-size: 0.88rem;
}

.calc-equals {
  color: #94A3B8;
}

.calc-result {
  color: #0F172A;
  font-weight: 600;
}

.btn-emerald {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #059669;
  color: #FFFFFF;
  padding: 8px 18px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-emerald:hover:not(:disabled) {
  background: #047857;
}

.btn-emerald:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-red {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #E31B23;
  color: #FFFFFF;
  padding: 8px 18px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-red:hover:not(:disabled) {
  background: #C4131B;
}

.btn-red:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
