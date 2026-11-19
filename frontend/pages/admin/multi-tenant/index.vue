<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ TOP HEADER ═══ -->
      <div class="admin-header-row">
        <div>
          <h1 class="admin-title">{{ currentTitle }}</h1>
        </div>

        <div class="header-actions">
          <div class="live-status-badge">
            <span class="pulse-dot"></span> Live Hub
          </div>
        </div>
      </div>

      <!-- ═══ METRICS CARDS ROW ═══ -->
      <div class="metrics-grid">
        <div class="metric-card metric-card-indigo" @click="switchTab('subcenters')">
          <div class="metric-icon-box bg-indigo-light">
            <i class="mdi mdi-office-building text-indigo"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Partner Centers</span>
            <span class="metric-value">{{ overview.metrics.totalSubCenters || 0 }}</span>
            <span class="metric-sub text-indigo">Active Partners</span>
          </div>
        </div>

        <div class="metric-card metric-card-emerald" @click="switchTab('batches')">
          <div class="metric-icon-box bg-emerald-light">
            <i class="mdi mdi-layers-triple text-emerald"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Active Batches</span>
            <span class="metric-value">{{ overview.metrics.activeBatches || 0 }}</span>
            <span class="metric-sub text-emerald">Active Sessions</span>
          </div>
        </div>

        <div class="metric-card metric-card-amber" @click="switchTab('requests')">
          <div class="metric-icon-box bg-amber-light">
            <i class="mdi mdi-ticket-percent-outline text-amber"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Token Requests</span>
            <span class="metric-value">{{ overview.metrics.pendingTokenRequests || tokenRequestCounts.pending || 0 }}</span>
            <span class="metric-sub text-amber font-semibold">Pending Approval</span>
          </div>
        </div>

        <div class="metric-card metric-card-red" @click="switchTab('audit')">
          <div class="metric-icon-box bg-red-light">
            <i class="mdi mdi-ticket-confirmation text-red"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Tokens Issued</span>
            <span class="metric-value">{{ overview.metrics.totalTokensSold || 0 }}</span>
            <span class="metric-sub text-red">Total Issued</span>
          </div>
        </div>
      </div>

      <!-- ═══ TAB CONTENT PANELS ═══ -->

      <!-- TAB 1 & 2: OVERVIEW & LIVE BATCHES -->
      <div v-if="activeTab === 'overview' || activeTab === 'batches'" class="tab-panel">
        <div class="panel-card">
          <div class="panel-card-header">
            <div class="panel-title-wrap">
              <i class="mdi mdi-cube-outline panel-icon"></i>
              <h3>Live Partner Center Batches Feed</h3>
            </div>

            <div class="panel-filter-row">
              <div class="search-input-wrap">
                <i class="mdi mdi-magnify search-icon"></i>
                <input
                  v-model="batchSearch"
                  type="text"
                  placeholder="Search batch or exam..."
                  class="table-search-input"
                />
              </div>

              <select v-model="batchStatusFilter" class="table-select-filter">
                <option value="all">All Statuses</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="created">Created</option>
              </select>

              <button class="btn-icon-refresh" title="Refresh Live Feed" @click="fetchOverview" :disabled="loadingOverview">
                <i :class="['mdi', 'mdi-refresh', { 'spin-icon': loadingOverview }]"></i>
              </button>
            </div>
          </div>

          <!-- Batches Cards List -->
          <div class="partner-cards-list">
            <div v-if="loadingOverview" class="panel-loading-state">
              <span class="spinner-sm-red"></span> Loading Live Batches Feed...
            </div>
            <div v-else-if="filteredBatches.length === 0" class="panel-empty-state">
              <i class="mdi mdi-layers-off-outline text-4xl block mb-2 text-slate-400"></i>
              <div class="font-semibold text-slate-700">No Active Batches Found</div>
              <div class="text-sm text-slate-500">No exam batches match your search filter.</div>
            </div>
            <div
              v-for="b in paginatedBatches"
              :key="b.id"
              class="partner-card"
            >
              <div class="partner-card-header">
                <div class="partner-identity-left">
                  <div class="partner-logo-avatar bg-indigo-light text-indigo">
                    <i class="mdi mdi-layers-triple"></i>
                  </div>
                  <div class="partner-identity-info">
                    <div class="partner-title-row">
                      <NuxtLink
                        :to="'/admin/multi-tenant/batches/' + b.id"
                        class="partner-name-link"
                        title="View Batch Candidate Roster"
                      >
                        {{ b.exam_name || b.exam_title || 'Certification Exam' }}
                      </NuxtLink>
                      <span
                        :class="[
                          'partner-status-tag',
                          b.status === 'in_progress' ? 'tag-active' :
                          b.status === 'completed' ? 'tag-inactive' : 'tag-amber'
                        ]"
                      >
                        <span class="pulse-dot"></span>
                        {{ (b.status || 'CREATED').replace('_', ' ').toUpperCase() }}
                      </span>
                      <span class="partner-type-tag font-mono">Batch #{{ b.id.slice(0, 8) }}</span>
                    </div>

                    <div class="partner-meta-strip">
                      <span class="partner-meta-item font-semibold text-slate-800">
                        <i class="mdi mdi-office-building"></i> {{ b.org_name || 'Partner Center' }}
                      </span>
                      <span v-if="b.created_at" class="partner-meta-item">
                        <i class="mdi mdi-calendar-blank"></i> Conducted: {{ formatDate(b.created_at) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Batch Stats Summary Pill & Action -->
                <div class="partner-header-right">
                  <div class="partner-stat-pill">
                    <div class="stat-cell">
                      <span class="stat-num text-indigo">{{ b.student_count || 0 }}</span>
                      <span class="stat-lbl">Candidates</span>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-cell">
                      <span class="stat-num text-emerald">{{ b.passed_count || 0 }}</span>
                      <span class="stat-lbl">Passed</span>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-cell">
                      <span class="stat-num text-red">{{ b.failed_count || 0 }}</span>
                      <span class="stat-lbl">Failed</span>
                    </div>
                  </div>

                  <NuxtLink
                    :to="'/admin/multi-tenant/batches/' + b.id"
                    class="btn-view-batches"
                    title="View Candidate Roster & Certificates"
                  >
                    <span>View Roster</span>
                    <i class="mdi mdi-arrow-right"></i>
                  </NuxtLink>
                </div>
              </div>
            </div>

            <AppPagination
              v-if="filteredBatches.length > 0"
              v-model="batchPage"
              v-model:items-per-page="batchPerPage"
              :total-items="filteredBatches.length"
              :per-page-options="[10, 25, 50, 100]"
            />
          </div>
        </div>
      </div>

      <!-- TAB 3: PARTNER CENTERS MANAGEMENT (FULL CRUD) -->
      <div v-else-if="activeTab === 'subcenters'" class="tab-panel">
        <div class="panel-card">
          <div class="panel-card-header">
            <div class="panel-title-wrap">
              <i class="mdi mdi-office-building panel-icon"></i>
              <h3>Partner Centers Directory</h3>
            </div>

            <div class="panel-filter-row">
              <div class="search-input-wrap">
                <i class="mdi mdi-magnify search-icon"></i>
                <input
                  v-model="orgSearch"
                  type="text"
                  placeholder="Search partner name, email or city..."
                  class="table-search-input"
                />
              </div>

              <select v-model="orgStatusFilter" class="table-select-filter">
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>

              <button class="btn-red btn-sm" @click="openAddOrgModal">
                <i class="mdi mdi-plus"></i> Add Partner Center
              </button>
            </div>
          </div>

          <!-- Partner Centers Cards List -->
          <div class="partner-cards-list">
            <div v-if="loadingOrgs" class="panel-loading-state">
              <span class="spinner-sm-red"></span> Loading Partner Centers...
            </div>
            <div v-else-if="filteredOrganizations.length === 0" class="panel-empty-state">
              <i class="mdi mdi-domain-off text-4xl block mb-2 text-slate-400"></i>
              <div class="font-semibold text-slate-700">No Partner Centers Found</div>
              <div class="text-sm text-slate-500">Try adjusting your search query or status filter.</div>
            </div>
            <div
              v-for="org in paginatedOrganizations"
              :key="org.id"
              class="partner-card"
            >
              <div class="partner-card-header">
                <div class="partner-identity-left">
                  <div class="partner-logo-avatar">
                    <i class="mdi mdi-domain"></i>
                  </div>
                  <div class="partner-identity-info">
                    <div class="partner-title-row">
                      <NuxtLink
                        :to="`/admin/multi-tenant/${org.id}`"
                        class="partner-name-link"
                        title="View Partner Profile"
                      >
                        {{ org.name }}
                      </NuxtLink>
                      <button
                        type="button"
                        class="partner-status-tag"
                        :class="org.status === 'active' ? 'tag-active' : 'tag-inactive'"
                        @click="toggleOrgStatus(org)"
                        :title="org.status === 'active' ? 'Click to Suspend Center' : 'Click to Activate Center'"
                      >
                        <span class="pulse-dot"></span>
                        {{ org.status === 'active' ? 'Accredited Center' : 'Suspended' }}
                      </button>
                      <span class="partner-type-tag">{{ org.institution_type || 'Authorized Training Center' }}</span>
                    </div>

                    <div class="partner-meta-strip">
                      <a :href="`mailto:${org.contact_email}`" class="partner-meta-item text-slate-600 hover:text-red transition-colors">
                        <i class="mdi mdi-email-outline"></i> {{ org.contact_email }}
                      </a>
                      <span v-if="org.contact_phone" class="partner-meta-item">
                        <i class="mdi mdi-phone-outline"></i> {{ org.contact_phone }}
                      </span>
                      <span class="partner-meta-item">
                        <i class="mdi mdi-map-marker-outline"></i> {{ org.city || 'Global' }}, {{ org.country || 'Jurisdiction' }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Partner Stats Summary Pill & Actions -->
                <div class="partner-header-right">
                  <div class="partner-stat-pill">
                    <div class="stat-cell">
                      <span class="stat-num text-indigo">{{ org.attended_students || 0 }}</span>
                      <span class="stat-lbl">Candidates</span>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-cell">
                      <span class="stat-num text-emerald">{{ org.passed_students || 0 }}</span>
                      <span class="stat-lbl">Passed</span>
                    </div>
                    <div class="stat-divider"></div>
                    <div
                      class="stat-cell cursor-pointer"
                      title="Click to Take Back / Refund Tokens"
                      @click="openTokenAdjustmentModal(org)"
                    >
                      <span class="stat-num text-amber">{{ org.tokens_remaining || org.token_balance || 0 }}</span>
                      <span class="stat-lbl">Tokens</span>
                    </div>
                  </div>

                  <div class="card-action-cluster">
                    <NuxtLink
                      :to="`/admin/multi-tenant/${org.id}`"
                      class="btn-view-batches"
                      title="View Center"
                    >
                      <span>View Center</span>
                      <i class="mdi mdi-arrow-right"></i>
                    </NuxtLink>

                    <div class="card-icon-actions">
                      <button class="btn-icon-action" title="Refund Tokens" @click="openTokenAdjustmentModal(org)">
                        <i class="mdi mdi-cash-refund"></i>
                      </button>
                      <button class="btn-icon-action" title="Edit Center" @click="editOrg(org)">
                        <i class="mdi mdi-pencil-outline"></i>
                      </button>
                      <button class="btn-icon-action" title="Reset Password" @click="openResetPasswordModal(org)">
                        <i class="mdi mdi-key-outline"></i>
                      </button>
                      <button class="btn-icon-action btn-icon-del" title="Delete Center" @click="deleteOrg(org)">
                        <i class="mdi mdi-trash-can-outline"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <AppPagination
              v-if="filteredOrganizations.length > 0"
              v-model="orgPage"
              v-model:items-per-page="orgPerPage"
              :total-items="filteredOrganizations.length"
              :per-page-options="[10, 25, 50, 100]"
            />
          </div>
        </div>
      </div>

      <!-- TAB 4: EXAM CATALOG -->
      <div v-else-if="activeTab === 'exams'" class="tab-panel">
        <div class="panel-card">
          <div class="panel-card-header">
            <div class="panel-title-wrap">
              <i class="mdi mdi-file-certificate panel-icon"></i>
              <h3>Exams Catalog</h3>
            </div>

            <div class="panel-filter-row">
              <div class="search-input-wrap">
                <i class="mdi mdi-magnify search-icon"></i>
                <input
                  v-model="examSearch"
                  type="text"
                  placeholder="Search catalog exams..."
                  class="table-search-input"
                />
              </div>

              <button class="btn-red btn-sm" @click="openAddExamModal">
                <i class="mdi mdi-plus"></i> Add Exam
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="gsfin-table">
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Duration (Mins)</th>
                  <th>Max Attempts Cap</th>
                  <th>Status</th>
                  <th class="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingExams">
                  <td colspan="5" class="text-center py-6 text-slate-500">
                    <span class="spinner-sm-red"></span> Loading Exams...
                  </td>
                </tr>
                <tr v-else-if="filteredExams.length === 0">
                  <td colspan="5" class="text-center py-8 text-slate-500">No Catalog Exams Found</td>
                </tr>
                <tr v-for="exam in paginatedExams" :key="exam.id">
                  <td class="font-semibold text-slate-900">{{ exam.name }}</td>
                  <td>{{ exam.duration_minutes }} Mins</td>
                  <td>{{ exam.max_attempts }} Attempts</td>
                  <td>
                    <span :class="['badge-chip', exam.status === 'active' ? 'chip-green' : 'chip-slate']">
                      {{ exam.status }}
                    </span>
                  </td>
                  <td>
                    <div class="actions-cell">
                      <button class="btn-table-action btn-edit" title="Edit" @click="editExam(exam)">
                        <i class="mdi mdi-pencil-outline"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <AppPagination
              v-if="filteredExams.length > 0"
              v-model="examPage"
              v-model:items-per-page="examPerPage"
              :total-items="filteredExams.length"
              :per-page-options="[10, 25, 50, 100]"
            />
          </div>
        </div>
      </div>

      <!-- TAB 5: TOKEN PACKAGES CATALOG -->
      <div v-else-if="activeTab === 'packages'" class="tab-panel">
        <div class="panel-card">
          <div class="panel-card-header">
            <div class="panel-title-wrap">
              <i class="mdi mdi-package-variant-closed panel-icon"></i>
              <h3>Token Packages Catalog</h3>
            </div>

            <div class="panel-filter-row">
              <div class="search-input-wrap">
                <i class="mdi mdi-magnify search-icon"></i>
                <input
                  v-model="pkgSearch"
                  type="text"
                  placeholder="Search token packages..."
                  class="table-search-input"
                />
              </div>

              <button class="btn-red btn-sm" @click="openAddPkgModal">
                <i class="mdi mdi-plus"></i> Add Package
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="gsfin-table">
              <thead>
                <tr>
                  <th>Package Name</th>
                  <th>Token Count</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th class="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingPackages">
                  <td colspan="5" class="text-center py-6 text-slate-500">
                    <span class="spinner-sm-red"></span> Loading Packages...
                  </td>
                </tr>
                <tr v-else-if="filteredPackages.length === 0">
                  <td colspan="5" class="text-center py-8 text-slate-500">No Token Packages Found</td>
                </tr>
                <tr v-for="pkg in paginatedPackages" :key="pkg.id">
                  <td class="font-semibold text-slate-900">{{ pkg.name }}</td>
                  <td>
                    <span class="badge-token-count">
                      <i class="mdi mdi-ticket-confirmation"></i> {{ pkg.token_count }} Tokens
                    </span>
                  </td>
                  <td class="font-semibold text-emerald">${{ pkg.price }}</td>
                  <td>
                    <span :class="['badge-chip', pkg.status === 'active' ? 'chip-green' : 'chip-slate']">
                      {{ pkg.status }}
                    </span>
                  </td>
                  <td>
                    <div class="actions-cell">
                      <button
                        class="btn-table-action btn-edit"
                        title="Edit Package"
                        @click="openEditPkgModal(pkg)"
                      >
                        <i class="mdi mdi-pencil-outline"></i>
                      </button>
                      <button
                        class="btn-table-action"
                        :class="pkg.status === 'active' ? 'btn-warn' : 'btn-success'"
                        :title="pkg.status === 'active' ? 'Retire Package' : 'Activate Package'"
                        @click="togglePkgStatus(pkg)"
                      >
                        <i :class="['mdi', pkg.status === 'active' ? 'mdi-archive-arrow-down-outline' : 'mdi-check-circle-outline']"></i>
                      </button>
                      <button
                        class="btn-table-action btn-danger"
                        title="Delete Package"
                        @click="confirmDeletePkg(pkg)"
                      >
                        <i class="mdi mdi-trash-can-outline"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <AppPagination
              v-if="filteredPackages.length > 0"
              v-model="pkgPage"
              v-model:items-per-page="pkgPerPage"
              :total-items="filteredPackages.length"
              :per-page-options="[10, 25, 50, 100]"
            />
          </div>
        </div>
      </div>

      <!-- TAB: TOKEN PURCHASE REQUESTS & APPROVALS -->
      <div v-else-if="activeTab === 'requests'" class="tab-panel">
        <div class="panel-card">
          <div class="panel-card-header">
            <div class="panel-title-wrap">
              <i class="mdi mdi-ticket-percent-outline panel-icon"></i>
              <div>
                <h3>Partner Token Purchase Requests</h3>
                <p class="panel-subtitle-text">Verify offline payment collections and approve token allocations for partner centers</p>
              </div>
            </div>

            <div class="panel-filter-row">
              <div class="search-input-wrap">
                <i class="mdi mdi-magnify search-icon"></i>
                <input
                  v-model="requestSearch"
                  type="text"
                  placeholder="Search partner, package or reference..."
                  class="table-search-input"
                />
              </div>

              <select v-model="requestStatusFilter" class="table-select-filter">
                <option value="pending">Pending Approval ({{ tokenRequestCounts.pending }})</option>
                <option value="all">All Requests ({{ tokenRequestCounts.total }})</option>
                <option value="approved">Approved ({{ tokenRequestCounts.approved }})</option>
                <option value="rejected">Rejected ({{ tokenRequestCounts.rejected }})</option>
              </select>

              <button class="btn-icon-refresh" title="Refresh Requests" @click="fetchTokenRequests" :disabled="loadingRequests">
                <i :class="['mdi', 'mdi-refresh', { 'spin-icon': loadingRequests }]"></i>
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="gsfin-table">
              <thead>
                <tr>
                  <th>Partner Center</th>
                  <th>Package Requested</th>
                  <th>Tokens</th>
                  <th>Amount</th>
                  <th>Payment / Wire Ref</th>
                  <th>Requested Date</th>
                  <th>Status</th>
                  <th class="th-actions text-center w-48">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingRequests">
                  <td colspan="8" class="text-center py-6 text-slate-500">
                    <span class="spinner-sm-red"></span> Loading Token Requests...
                  </td>
                </tr>
                <tr v-else-if="filteredTokenRequests.length === 0">
                  <td colspan="8" class="text-center py-8 text-slate-500">No token purchase requests found matching filter</td>
                </tr>
                <tr v-for="req in paginatedTokenRequests" :key="req.id">
                  <td>
                    <div class="font-semibold text-slate-900">{{ req.org_name }}</div>
                    <div class="text-xs text-slate-500">{{ req.org_city ? `${req.org_city}, ` : '' }}{{ req.org_country || 'UAE' }}</div>
                  </td>
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
                  <td class="text-xs text-slate-500">{{ formatDate(req.created_at) }}</td>
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
                  <td class="text-center">
                    <div class="actions-cell">
                      <template v-if="req.status === 'pending'">
                        <button
                          class="btn-request-action btn-request-approve"
                          title="Confirm Payment & Approve"
                          @click="openApproveModal(req)"
                        >
                          <i class="mdi mdi-check"></i>
                          <span>Approve</span>
                        </button>
                        <button
                          class="btn-request-action btn-request-reject"
                          title="Reject Request"
                          @click="openRejectModal(req)"
                        >
                          <i class="mdi mdi-close"></i>
                          <span>Reject</span>
                        </button>
                      </template>
                      <template v-else-if="req.status === 'approved'">
                        <span class="text-[11px] text-slate-500 font-medium" :title="req.approved_at ? formatDate(req.approved_at) : ''">
                          Approved {{ req.approved_by_name ? `by ${req.approved_by_name}` : '' }}
                        </span>
                      </template>
                      <template v-else-if="req.status === 'rejected'">
                        <span class="text-[11px] text-red-500 font-medium" :title="req.admin_notes || 'No reason'">
                          {{ req.admin_notes || 'Rejected' }}
                        </span>
                      </template>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <AppPagination
              v-if="filteredTokenRequests.length > 0"
              v-model="requestPage"
              v-model:items-per-page="requestPerPage"
              :total-items="filteredTokenRequests.length"
              :per-page-options="[10, 25, 50]"
            />
          </div>
        </div>
      </div>

      <!-- TAB 6: TOKEN AUDIT TRAIL -->
      <div v-else-if="activeTab === 'audit'" class="tab-panel">
        <div class="panel-card">
          <div class="panel-card-header">
            <div class="panel-title-wrap">
              <i class="mdi mdi-history panel-icon"></i>
              <h3>Token Audit Trail</h3>
            </div>

            <div class="panel-filter-row">
              <div class="search-input-wrap">
                <i class="mdi mdi-magnify search-icon"></i>
                <input
                  v-model="auditSearch"
                  type="text"
                  placeholder="Search partner or transaction type..."
                  class="table-search-input"
                />
              </div>

              <select v-model="auditTypeFilter" class="table-select-filter">
                <option value="all">All Types</option>
                <option value="purchase">Purchase</option>
                <option value="consumption">Consumption</option>
                <option value="refund">Refund</option>
              </select>
            </div>
          </div>

          <div class="table-responsive">
            <table class="gsfin-table">
              <thead>
                <tr>
                  <th>Partner Center</th>
                  <th>Transaction Type</th>
                  <th>Token Count</th>
                  <th>Package</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingAudit">
                  <td colspan="5" class="text-center py-6 text-slate-500">
                    <span class="spinner-sm-red"></span> Loading Audit Trail...
                  </td>
                </tr>
                <tr v-else-if="filteredAuditTransactions.length === 0">
                  <td colspan="5" class="text-center py-8 text-slate-500">No Transactions Recorded</td>
                </tr>
                <tr v-for="tx in paginatedAuditTransactions" :key="tx.id">
                  <td class="font-semibold text-slate-900">{{ tx.org_name || 'Partner Center' }}</td>
                  <td>
                    <span :class="['badge-chip', getTxTypeClass(tx.type)]">
                      {{ tx.type }}
                    </span>
                  </td>
                  <td class="font-semibold" :class="tx.token_count > 0 ? 'text-green' : 'text-red'">
                    {{ tx.token_count > 0 ? '+' : '' }}{{ tx.token_count }}
                  </td>
                  <td>{{ tx.package_name || '-' }}</td>
                  <td class="text-slate-500">{{ formatDate(tx.created_at) }}</td>
                </tr>
              </tbody>
            </table>
            <AppPagination
              v-if="filteredAuditTransactions.length > 0"
              v-model="auditPage"
              v-model:items-per-page="auditPerPage"
              :total-items="filteredAuditTransactions.length"
              :per-page-options="[10, 25, 50, 100]"
            />
          </div>
        </div>
      </div>

    </div>

    <!-- ═══ MODALS ═══ -->

    <!-- Create / Edit Partner Center Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAddOrgModal" class="modal-overlay" @click.self="showAddOrgModal = false">
          <div class="modal-card modal-card-lg">
            <div class="modal-header">
              <h3>{{ editingOrg ? 'Edit Partner Center' : 'Add New Partner Center' }}</h3>
              <button class="modal-close-btn" @click="showAddOrgModal = false"><i class="mdi mdi-close"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-row-2 mb-3">
                <div class="form-group">
                  <label class="form-label">Partner Center Name *</label>
                  <input v-model="orgForm.name" type="text" placeholder="e.g. Apex Food Safety Institute" class="modal-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">Contact Email *</label>
                  <input v-model="orgForm.contact_email" type="email" placeholder="contact@apexcenter.com" class="modal-input" />
                </div>
              </div>

              <div class="form-row-2 mb-3">
                <div class="form-group">
                  <label class="form-label">Contact Phone</label>
                  <input v-model="orgForm.contact_phone" type="text" placeholder="+971 4 123 4567" class="modal-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">Institution Type</label>
                  <select v-model="orgForm.institution_type" class="modal-select">
                    <option value="Authorized Training Center">Authorized Training Center</option>
                    <option value="University / College">University / College</option>
                    <option value="Vocational Institute">Vocational Institute</option>
                    <option value="Corporate Partner">Corporate Partner</option>
                    <option value="Independent Exam Center">Independent Exam Center</option>
                  </select>
                </div>
              </div>

              <div class="form-row-2 mb-3">
                <div class="form-group">
                  <div class="flex items-center justify-between mb-1">
                    <label class="form-label mb-0">Country *</label>
                    <NuxtLink to="/dashboard/admin/settings?tab=partner_settings" class="text-[11px] text-red hover:underline font-medium">
                      <i class="mdi mdi-cog-outline"></i> Manage in Settings
                    </NuxtLink>
                  </div>
                  <select v-model="orgForm.country" class="modal-select">
                    <option value="" disabled>Select Country</option>
                    <option v-for="c in configuredCountries" :key="c" :value="c">{{ c }}</option>
                    <option v-if="orgForm.country && !configuredCountries.includes(orgForm.country)" :value="orgForm.country">
                      {{ orgForm.country }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">City / Region</label>
                  <input v-model="orgForm.city" type="text" placeholder="e.g. Dubai" class="modal-input" />
                </div>
              </div>

              <div class="form-group mb-3">
                <div class="flex items-center justify-between mb-1">
                  <label class="form-label mb-0">Approved Training Programs</label>
                  <div class="flex items-center gap-3">
                    <button type="button" class="text-[11px] text-red hover:underline font-medium" @click="toggleSelectAllPrograms">
                      {{ (orgForm.programs || []).length === availablePrograms.length ? 'Deselect All' : 'Select All' }}
                    </button>
                    <NuxtLink to="/dashboard/admin/settings?tab=partner_settings" class="text-[11px] text-red hover:underline font-medium">
                      <i class="mdi mdi-cog-outline"></i> Manage in Settings
                    </NuxtLink>
                  </div>
                </div>
                <div class="checkbox-grid max-h-56 overflow-y-auto custom-scrollbar">
                  <label v-for="prog in availablePrograms" :key="prog" class="checkbox-label">
                    <input
                      type="checkbox"
                      :value="prog"
                      v-model="orgForm.programs"
                      class="checkbox-input"
                    />
                    <span>{{ prog }}</span>
                  </label>
                </div>
                <div class="text-[11px] text-slate-500 mt-1 px-1">
                  {{ (orgForm.programs || []).length }} programs selected
                </div>
              </div>

              <div v-if="!editingOrg" class="form-group mb-3">
                <label class="form-label">Initial Login Password (Optional)</label>
                <input v-model="orgForm.initial_password" type="text" placeholder="Leave blank to auto-generate secure password" class="modal-input" />
                <span class="text-xs text-slate-500 mt-1 block">If blank, the system will automatically generate a temporary password and email it to the partner.</span>
              </div>

              <div v-if="editingOrg" class="form-group mb-3">
                <label class="form-label">Account Status</label>
                <select v-model="orgForm.status" class="modal-select">
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-glass" @click="showAddOrgModal = false">Cancel</button>
              <button class="btn-red" :disabled="savingOrg" @click="saveOrganization">
                {{ savingOrg ? 'Saving...' : (editingOrg ? 'Update Partner' : 'Create Partner Center') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Create/Edit Exam Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAddExamModal" class="modal-overlay" @click.self="showAddExamModal = false">
          <div class="modal-card">
            <div class="modal-header">
              <h3>{{ editingExam ? 'Edit Exam' : 'Create Catalog Exam' }}</h3>
              <button class="modal-close-btn" @click="showAddExamModal = false"><i class="mdi mdi-close"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group mb-3">
                <label class="form-label">Exam Title</label>
                <input v-model="examForm.name" type="text" placeholder="Food Safety Manager Exam" class="modal-input" />
              </div>
              <div class="form-group mb-3">
                <label class="form-label">Description</label>
                <textarea v-model="examForm.description" rows="3" placeholder="Comprehensive evaluation..." class="modal-textarea"></textarea>
              </div>
              <div class="form-row-2 mb-3">
                <div class="form-group">
                  <label class="form-label">Duration (Minutes)</label>
                  <input v-model.number="examForm.duration_minutes" type="number" class="modal-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">Max Attempts Limit</label>
                  <input v-model.number="examForm.max_attempts" type="number" class="modal-input" />
                </div>
              </div>
              <div v-if="editingExam" class="form-group mb-3">
                <label class="form-label">Status</label>
                <select v-model="examForm.status" class="modal-select">
                  <option value="active">Active</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-glass" @click="showAddExamModal = false">Cancel</button>
              <button class="btn-red" :disabled="savingExam" @click="saveExam">
                {{ savingExam ? 'Saving...' : 'Save Exam' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Create / Edit Package Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showPkgModal" class="modal-overlay" @click.self="showPkgModal = false">
          <div class="modal-card">
            <div class="modal-header">
              <h3>{{ editingPkgId ? 'Edit Token Package' : 'Create Token Package' }}</h3>
              <button class="modal-close-btn" @click="showPkgModal = false"><i class="mdi mdi-close"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group mb-3">
                <label class="form-label">Package Name</label>
                <input v-model="pkgForm.name" type="text" placeholder="Starter Pack (50 Tokens)" class="modal-input" />
              </div>
              <div class="form-row-2 mb-3">
                <div class="form-group">
                  <label class="form-label">Token Count</label>
                  <input v-model.number="pkgForm.token_count" type="number" class="modal-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">Price ($)</label>
                  <input v-model.number="pkgForm.price" type="number" class="modal-input" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-glass" @click="showPkgModal = false">Cancel</button>
              <button class="btn-red" :disabled="savingPkg" @click="savePackage">
                {{ savingPkg ? (editingPkgId ? 'Saving...' : 'Creating...') : (editingPkgId ? 'Save Changes' : 'Create Package') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Package Confirmation Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDeletePkgModal" class="modal-overlay" @click.self="showDeletePkgModal = false">
          <div class="modal-card modal-sm">
            <div class="modal-header">
              <div class="modal-title-row">
                <div class="modal-header-icon bg-red-50 text-red-600">
                  <i class="mdi mdi-alert-octagon-outline"></i>
                </div>
                <div class="modal-title-text">
                  <h3>Delete Token Package</h3>
                  <p>Permanent action</p>
                </div>
              </div>
              <button class="modal-close-btn" @click="showDeletePkgModal = false"><i class="mdi mdi-close"></i></button>
            </div>
            <div class="modal-body">
              <p class="modal-lead-text">
                Are you sure you want to delete token package <strong class="text-slate-900">"{{ pkgToDelete?.name }}"</strong>?
              </p>
              <div class="modal-info-card border-red">
                <div class="modal-info-card-title">{{ pkgToDelete?.name }}</div>
                <div class="modal-info-card-stats">
                  <span>{{ pkgToDelete?.token_count }} Tokens</span>
                  <span class="dot">•</span>
                  <span>${{ pkgToDelete?.price }}</span>
                  <span class="dot">•</span>
                  <span class="capitalize">{{ pkgToDelete?.status }}</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-glass" @click="showDeletePkgModal = false">Cancel</button>
              <button class="btn-red bg-red-600" :disabled="deletingPkg" @click="deletePackage">
                {{ deletingPkg ? 'Deleting...' : 'Delete Package' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
 
    <!-- Reset Password / Credentials Provisioning Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showResetModal" class="modal-overlay" @click.self="closeResetModal">
          <div class="modal-card">
            <div class="modal-header">
              <div class="flex items-center gap-2.5">
                <div :class="[
                  'w-8 h-8 rounded-lg flex items-center justify-center text-sm',
                  resetSuccessResult ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                ]">
                  <i :class="['mdi', resetSuccessResult ? 'mdi-check-decagram' : 'mdi-key-variant']"></i>
                </div>
                <div>
                  <h3 class="m-0 text-sm font-semibold text-slate-900 leading-tight">
                    {{ resetSuccessResult?.isNewAccount ? 'Partner Account Created' : (resetSuccessResult ? 'Password Reset Complete' : 'Reset Partner Password') }}
                  </h3>
                  <p class="m-0 text-xs text-slate-500 leading-tight">{{ selectedResetOrg?.name }}</p>
                </div>
              </div>
              <button class="modal-close-btn" @click="closeResetModal"><i class="mdi mdi-close"></i></button>
            </div>
            
            <div class="modal-body">
              <div v-if="!resetSuccessResult">
                <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4 text-xs text-slate-600 leading-relaxed">
                  Reset login credentials for <strong>{{ selectedResetOrg?.name }}</strong>. 
                  Target account email: <strong class="text-slate-900">{{ selectedResetOrg?.contact_email }}</strong>.
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

              <!-- Success State: Structured Credentials Card -->
              <div v-else class="py-1">
                <div class="text-center mb-4">
                  <div class="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2.5 text-2xl shadow-sm">
                    <i class="mdi mdi-check-decagram"></i>
                  </div>
                  <h4 class="text-base font-semibold text-slate-900 m-0">
                    {{ resetSuccessResult.isNewAccount ? 'Partner Account Provisioned' : 'Credentials Successfully Updated' }}
                  </h4>
                  <p class="text-xs text-slate-500 mt-1 mb-0">
                    Credentials for <span class="font-medium text-slate-700">{{ selectedResetOrg?.name || 'Partner Center' }}</span> are ready.
                  </p>
                  <div v-if="resetSendEmail" class="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <i class="mdi mdi-email-check-outline text-emerald-600"></i>
                    <span>Email notification dispatched to {{ resetSuccessResult.email }}</span>
                  </div>
                </div>

                <div class="credentials-card">
                  <!-- Portal URL Row -->
                  <div class="credential-row">
                    <div class="flex items-center justify-between mb-1">
                      <span class="credential-label">Portal Login URL</span>
                      <button 
                        type="button"
                        class="btn-credential-copy" 
                        :class="{ 'copied': copiedField === 'url' }"
                        @click="copyText(getLoginUrl(), 'url')"
                      >
                        <i :class="['mdi', copiedField === 'url' ? 'mdi-check text-emerald-600' : 'mdi-content-copy']"></i>
                        <span>{{ copiedField === 'url' ? 'Copied' : 'Copy' }}</span>
                      </button>
                    </div>
                    <div class="credential-value-box">
                      <i class="mdi mdi-link-variant text-slate-400 text-sm"></i>
                      <span class="credential-text truncate">{{ getLoginUrl() }}</span>
                    </div>
                  </div>

                  <!-- Login Email Row -->
                  <div class="credential-row">
                    <div class="flex items-center justify-between mb-1">
                      <span class="credential-label">Authorized Login Email</span>
                      <button 
                        type="button"
                        class="btn-credential-copy" 
                        :class="{ 'copied': copiedField === 'email' }"
                        @click="copyText(resetSuccessResult.email, 'email')"
                      >
                        <i :class="['mdi', copiedField === 'email' ? 'mdi-check text-emerald-600' : 'mdi-content-copy']"></i>
                        <span>{{ copiedField === 'email' ? 'Copied' : 'Copy' }}</span>
                      </button>
                    </div>
                    <div class="credential-value-box">
                      <i class="mdi mdi-email-outline text-slate-400 text-sm"></i>
                      <span class="credential-text truncate font-mono select-all">{{ resetSuccessResult.email }}</span>
                    </div>
                  </div>

                  <!-- Temporary Password Row -->
                  <div class="credential-row">
                    <div class="flex items-center justify-between mb-1">
                      <span class="credential-label">{{ resetSuccessResult.isNewAccount ? 'Initial Login Password' : 'Temporary Password' }}</span>
                      <div class="flex items-center gap-1.5">
                        <button 
                          type="button"
                          class="btn-credential-copy" 
                          :title="showPassword ? 'Hide password' : 'Show password'"
                          @click="showPassword = !showPassword"
                        >
                          <i :class="['mdi', showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline']"></i>
                          <span>{{ showPassword ? 'Hide' : 'Show' }}</span>
                        </button>
                        <button 
                          type="button"
                          class="btn-credential-copy" 
                          :class="{ 'copied': copiedField === 'password' }"
                          @click="copyText(resetSuccessResult.tempPassword, 'password')"
                        >
                          <i :class="['mdi', copiedField === 'password' ? 'mdi-check text-emerald-600' : 'mdi-content-copy']"></i>
                          <span>{{ copiedField === 'password' ? 'Copied' : 'Copy' }}</span>
                        </button>
                      </div>
                    </div>
                    <div class="credential-value-box credential-password-box">
                      <i class="mdi mdi-lock-outline text-slate-400 text-sm"></i>
                      <span class="credential-text font-mono font-medium text-slate-900 select-all tracking-wider">
                        {{ showPassword ? resetSuccessResult.tempPassword : '••••••••••••' }}
                      </span>
                    </div>
                  </div>

                  <!-- Security Note -->
                  <div class="security-notice-pill">
                    <i class="mdi mdi-shield-check-outline text-emerald-600 flex-shrink-0 text-base"></i>
                    <span>Temporary credentials — user will be prompted to set a permanent password upon first login.</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer" :class="{ 'justify-between': resetSuccessResult }">
              <template v-if="!resetSuccessResult">
                <button class="btn-glass" @click="closeResetModal" :disabled="resettingPassword">Cancel</button>
                <button class="btn-red" @click="executePasswordReset" :disabled="resettingPassword">
                  <span v-if="resettingPassword"><span class="spinner-sm-white"></span> Resetting...</span>
                  <span v-else>Confirm &amp; Reset Password</span>
                </button>
              </template>
              <template v-else>
                <button 
                  type="button"
                  class="btn-glass flex items-center gap-1.5" 
                  @click="copyAllCredentials"
                >
                  <i :class="['mdi', copiedField === 'all' ? 'mdi-check text-emerald-600' : 'mdi-content-copy']"></i>
                  <span>{{ copiedField === 'all' ? 'Credentials Copied!' : 'Copy All Credentials' }}</span>
                </button>
                <button class="btn-red" @click="closeResetModal">Done</button>
              </template>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Approve Token Purchase Request Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showApproveModal" class="modal-overlay" @click.self="showApproveModal = false">
          <div class="modal-card">
            <div class="modal-header">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-sm">
                  <i class="mdi mdi-cash-check"></i>
                </div>
                <div>
                  <h3 class="m-0 text-sm font-semibold text-slate-900 leading-tight">Confirm Payment &amp; Issue Tokens</h3>
                  <p class="m-0 text-xs text-slate-500 leading-tight">{{ selectedRequest?.org_name }}</p>
                </div>
              </div>
              <button class="modal-close-btn" @click="showApproveModal = false"><i class="mdi mdi-close"></i></button>
            </div>

            <div class="modal-body">
              <!-- Token Credit Hero Banner -->
              <div class="token-credit-hero">
                <div class="flex items-center gap-3">
                  <div class="token-credit-icon">
                    <i class="mdi mdi-database-plus-outline"></i>
                  </div>
                  <div>
                    <div class="token-credit-amount">+{{ selectedRequest?.token_count }} Tokens</div>
                    <div class="token-credit-sub">Will be credited to {{ selectedRequest?.org_name }}'s wallet</div>
                  </div>
                </div>
                <div class="token-credit-badge">
                  <i class="mdi mdi-check-circle-outline"></i>
                  <span>Ready to Credit</span>
                </div>
              </div>

              <!-- Transaction Summary Card -->
              <div class="request-summary-card">
                <div class="summary-grid">
                  <div class="summary-item">
                    <span class="summary-label">Package Requested</span>
                    <span class="summary-val font-semibold text-slate-800">
                      <i class="mdi mdi-package-variant-closed text-slate-400 mr-1"></i>
                      {{ selectedRequest?.package_name }}
                    </span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Amount Collected</span>
                    <span class="summary-val font-semibold text-emerald-600 font-mono">
                      ${{ Number(selectedRequest?.amount || 0).toFixed(2) }} USD
                    </span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Tokens to Issue</span>
                    <span class="summary-val font-semibold text-slate-900 font-mono">
                      {{ selectedRequest?.token_count }} Tokens
                    </span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Partner Payment Ref</span>
                    <span v-if="selectedRequest?.payment_reference" class="summary-val font-mono text-xs text-slate-800 bg-white border border-slate-200/80 px-2 py-0.5 rounded select-all inline-block truncate">
                      {{ selectedRequest?.payment_reference }}
                    </span>
                    <span v-else class="summary-val text-slate-400 italic text-xs">None provided</span>
                  </div>
                </div>
              </div>

              <div class="form-group mb-3">
                <label class="form-label">Official Receipt / Reference ID <span class="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  v-model="approveForm.payment_reference"
                  type="text"
                  placeholder="e.g. Bank Wire Ref #, Cheque #, or Receipt ID"
                  class="modal-input"
                />
              </div>

              <div class="form-group mb-0">
                <label class="form-label">Approval Audit Notes <span class="text-slate-400 font-normal">(Optional)</span></label>
                <textarea
                  v-model="approveForm.admin_notes"
                  rows="2"
                  placeholder="e.g. Payment verified via bank statement"
                  class="modal-input resize-none"
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-glass" @click="showApproveModal = false">Cancel</button>
              <button class="btn-emerald" :disabled="approvingRequest" @click="confirmApproveRequest">
                <i :class="['mdi', approvingRequest ? 'mdi-loading spin-icon' : 'mdi-check-decagram-outline']"></i>
                {{ approvingRequest ? 'Crediting Tokens...' : 'Confirm & Credit Tokens' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Reject Token Purchase Request Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showRejectModal" class="modal-overlay" @click.self="showRejectModal = false">
          <div class="modal-card">
            <div class="modal-header">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center text-sm">
                  <i class="mdi mdi-alert-circle-outline"></i>
                </div>
                <div>
                  <h3 class="m-0 text-sm font-semibold text-slate-900 leading-tight">Reject Token Purchase Request</h3>
                  <p class="m-0 text-xs text-slate-500 leading-tight">{{ selectedRequest?.org_name }}</p>
                </div>
              </div>
              <button class="modal-close-btn" @click="showRejectModal = false"><i class="mdi mdi-close"></i></button>
            </div>

            <div class="modal-body">
              <div class="p-3 bg-red-50 border border-red-100 rounded-xl mb-4 text-xs text-red-900 leading-relaxed flex items-start gap-2.5">
                <i class="mdi mdi-alert-outline text-red-500 text-base flex-shrink-0 mt-0.5"></i>
                <div>
                  You are rejecting the purchase request for <strong>{{ selectedRequest?.package_name }}</strong> ({{ selectedRequest?.token_count }} Tokens) from <strong>{{ selectedRequest?.org_name }}</strong>.
                  The partner will be notified of this action.
                </div>
              </div>

              <div class="form-group mb-0">
                <label class="form-label">Reason for Rejection *</label>
                <textarea
                  v-model="rejectForm.admin_notes"
                  rows="3"
                  placeholder="e.g. Payment not received within required window / Reference ID not verifiable"
                  class="modal-input"
                  required
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-glass" @click="showRejectModal = false">Cancel</button>
              <button class="btn-red" :disabled="rejectingRequest || !rejectForm.admin_notes" @click="confirmRejectRequest">
                <i :class="['mdi', rejectingRequest ? 'mdi-loading spin-icon' : 'mdi-close-circle']"></i>
                {{ rejectingRequest ? 'Rejecting...' : 'Reject Request' }}
              </button>
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
                  <span class="token-balance-val">{{ selectedOrgForTokens?.tokens_remaining || selectedOrgForTokens?.token_balance || 0 }} Tokens</span>
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
                    Max: {{ selectedOrgForTokens?.tokens_remaining || selectedOrgForTokens?.token_balance || 0 }} Tokens
                  </span>
                </div>
                <input
                  v-model.number="tokenAdjustmentAmount"
                  type="number"
                  min="1"
                  :max="tokenAdjustmentMode === 'refund' ? (selectedOrgForTokens?.tokens_remaining || selectedOrgForTokens?.token_balance || 0) : 10000"
                  placeholder="Enter tokens count"
                  class="modal-input"
                  required
                />
                <div v-if="tokenAdjustmentMode === 'refund' && (selectedOrgForTokens?.tokens_remaining || selectedOrgForTokens?.token_balance || 0) > 0" class="token-presets-row">
                  <div class="preset-pill-group">
                    <button
                      type="button"
                      v-for="amt in [10, 50, 100].filter(a => a <= (selectedOrgForTokens?.tokens_remaining || selectedOrgForTokens?.token_balance || 0))"
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
                    @click="tokenAdjustmentAmount = selectedOrgForTokens?.tokens_remaining || selectedOrgForTokens?.token_balance || 0"
                  >
                    Refund All ({{ selectedOrgForTokens?.tokens_remaining || selectedOrgForTokens?.token_balance || 0 }})
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
                  class="modal-input resize-none"
                ></textarea>
              </div>

              <!-- Projected Balance Calculation Banner -->
              <div :class="['token-projection-banner', tokenAdjustmentMode === 'refund' ? 'projection-refund' : 'projection-grant']">
                <div class="projection-label">
                  <i :class="['mdi', tokenAdjustmentMode === 'refund' ? 'mdi-information-outline' : 'mdi-plus-circle-outline']"></i>
                  <span>Resulting Wallet Balance:</span>
                </div>
                <div class="projection-calc">
                  <span>{{ selectedOrgForTokens?.tokens_remaining || selectedOrgForTokens?.token_balance || 0 }}</span>
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
                :disabled="adjustingTokens || !tokenAdjustmentAmount || tokenAdjustmentAmount <= 0 || tokenAdjustmentAmount > (selectedOrgForTokens?.tokens_remaining || selectedOrgForTokens?.token_balance || 0)"
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useApi } from '@/composables/useApi';
import { useRoute, useRouter } from 'vue-router';
import { useNavStore } from '@/stores/nav';
import AppPagination from '@/components/common/AppPagination.vue';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role']
});

const api = useApi();
const route = useRoute();
const router = useRouter();
const navStore = useNavStore();

const activeTab = ref(route.query.tab ? String(route.query.tab) : 'subcenters');

const tabItems = [
  { label: 'Overview', value: 'overview', icon: 'mdi-view-dashboard-outline' },
  { label: 'Batches', value: 'batches', icon: 'mdi-layers-triple-outline' },
  { label: 'Partners', value: 'subcenters', icon: 'mdi-office-building' },
  { label: 'Exams', value: 'exams', icon: 'mdi-file-certificate' },
  { label: 'Requests', value: 'requests', icon: 'mdi-ticket-percent-outline' },
  { label: 'Packages', value: 'packages', icon: 'mdi-package-variant-closed' },
  { label: 'History', value: 'audit', icon: 'mdi-history' }
];

const DEFAULT_PARTNER_COUNTRIES = [
  'India',
  'United Arab Emirates',
  'Saudi Arabia',
  'Qatar',
  'Oman',
  'Kuwait',
  'Bahrain',
  'United Kingdom',
  'United States',
  'Singapore',
  'Malaysia',
  'Australia',
  'Canada',
  'Germany',
  'Egypt',
  'South Africa',
  'Nigeria',
  'Kenya',
  'Philippines',
  'Sri Lanka',
  'Pakistan',
  'Bangladesh',
  'Indonesia'
];

const DEFAULT_PARTNER_PROGRAMS = [
  'CODEX HACCP',
  'ISO 22000 Food Safety',
  'Food Safety Manager',
  'Halal Audit Certification',
  'BRCGS Global Standard',
  'FSSC 22000 Lead Auditor',
  'Food Science & Technology',
  'GHP & GMP Foundation'
];

const configuredCountries = ref<string[]>([...DEFAULT_PARTNER_COUNTRIES]);
const availablePrograms = ref<string[]>([...DEFAULT_PARTNER_PROGRAMS]);

async function fetchPartnerSettings() {
  try {
    const [configRes, qualRes] = await Promise.allSettled([
      api.get('/admin/config'),
      api.get('/public/qualifications')
    ]);

    if (configRes.status === 'fulfilled' && configRes.value?.data) {
      const data = configRes.value.data;
      let rawCountries = null;
      let rawPrograms = null;

      if (Array.isArray(data)) {
        const cItem = data.find((c: any) => c.key === 'partner_countries');
        if (cItem) rawCountries = cItem.value;
        const pItem = data.find((c: any) => c.key === 'partner_training_programs');
        if (pItem) rawPrograms = pItem.value;
      } else if (data && typeof data === 'object') {
        rawCountries = data.partner_countries;
        rawPrograms = data.partner_training_programs;
      }

      if (rawCountries) {
        const parsed = typeof rawCountries === 'string' ? JSON.parse(rawCountries) : rawCountries;
        if (Array.isArray(parsed) && parsed.length > 0) {
          configuredCountries.value = parsed;
        }
      }

      const progList: string[] = [];
      if (rawPrograms) {
        const parsed = typeof rawPrograms === 'string' ? JSON.parse(rawPrograms) : rawPrograms;
        if (Array.isArray(parsed) && parsed.length > 0) {
          progList.push(...parsed);
        }
      } else {
        progList.push(...DEFAULT_PARTNER_PROGRAMS);
      }

      // Merge active qualifications from certifications catalog
      if (qualRes.status === 'fulfilled' && Array.isArray(qualRes.value?.data)) {
        qualRes.value.data.forEach((q: any) => {
          const title = q.title || q.name;
          if (title && !progList.includes(title)) {
            progList.push(title);
          }
        });
      }

      if (progList.length > 0) {
        availablePrograms.value = progList;
      }
    }
  } catch (err) {
    console.error('Failed to load partner settings/qualifications:', err);
  }
}

function toggleSelectAllPrograms() {
  if (!orgForm.value.programs) orgForm.value.programs = [];
  if (orgForm.value.programs.length === availablePrograms.value.length) {
    orgForm.value.programs = [];
  } else {
    orgForm.value.programs = [...availablePrograms.value];
  }
}

const currentTitle = computed(() => {
  switch (activeTab.value) {
    case 'batches': return 'Batches';
    case 'subcenters': return 'Partners';
    case 'exams': return 'Exams';
    case 'requests': return 'Token Purchase Requests';
    case 'packages': return 'Packages';
    case 'audit': return 'History';
    case 'overview':
    default:
      return 'Partners';
  }
});

function switchTab(val: string) {
  activeTab.value = val;
  router.push({ query: { ...route.query, tab: val } });
}

watch(() => route.query.tab, (newTab) => {
  if (newTab) {
    activeTab.value = String(newTab);
  } else {
    activeTab.value = 'subcenters';
  }
});

// Overview state
const overview = ref<any>({ metrics: {}, recentBatches: [] });
const loadingOverview = ref(false);

// Organizations state & CRUD
const organizations = ref<any[]>([]);
const loadingOrgs = ref(false);
const showAddOrgModal = ref(false);
const savingOrg = ref(false);
const editingOrg = ref<any>(null);

const orgForm = ref({
  name: '',
  contact_email: '',
  contact_phone: '',
  country: 'United Arab Emirates',
  city: 'Dubai',
  institution_type: 'Authorized Training Center',
  programs: ['CODEX HACCP', 'ISO 22000 Food Safety'],
  status: 'active',
  initial_password: ''
});

// Reset password modal state
const showResetModal = ref(false);
const selectedResetOrg = ref<any>(null);
const resetPasswordMode = ref<'auto' | 'custom'>('auto');
const customResetPassword = ref('');
const resetSendEmail = ref(true);
const resettingPassword = ref(false);
const resetSuccessResult = ref<{ email: string; tempPassword: string; isNewAccount?: boolean } | null>(null);
const copiedPassword = ref(false);
const showPassword = ref(true);
const copiedField = ref<string | null>(null);

// Exams state
const exams = ref<any[]>([]);
const loadingExams = ref(false);
const showAddExamModal = ref(false);
const savingExam = ref(false);
const editingExam = ref<any>(null);
const examForm = ref({ name: '', description: '', duration_minutes: 60, max_attempts: 1, status: 'active' });

// Packages state
const packages = ref<any[]>([]);
const loadingPackages = ref(false);
const showPkgModal = ref(false);
const editingPkgId = ref<string | null>(null);
const savingPkg = ref(false);
const pkgForm = ref({ name: '', token_count: 50, price: 500 });
const showDeletePkgModal = ref(false);
const pkgToDelete = ref<any>(null);
const deletingPkg = ref(false);

// Audit state
const auditTransactions = ref<any[]>([]);
const loadingAudit = ref(false);

// Filter states
const batchSearch = ref('');
const batchStatusFilter = ref('all');
const orgSearch = ref('');
const orgStatusFilter = ref('all');
const examSearch = ref('');
const pkgSearch = ref('');
const auditSearch = ref('');
const auditTypeFilter = ref('all');

// Token purchase requests state
const tokenRequests = ref<any[]>([]);
const tokenRequestCounts = ref({ total: 0, pending: 0, approved: 0, rejected: 0 });
const loadingRequests = ref(false);
const requestStatusFilter = ref('pending');
const requestSearch = ref('');
const requestPage = ref(1);
const requestPerPage = ref(10);

// Approve & Reject Modals State
const showApproveModal = ref(false);
const selectedRequest = ref<any>(null);
const approvingRequest = ref(false);
const approveForm = ref({ payment_reference: '', admin_notes: '' });

const showRejectModal = ref(false);
const rejectingRequest = ref(false);
const rejectForm = ref({ admin_notes: '' });

// Token Adjustment / Refund Modal State
const showTokenAdjustmentModal = ref(false);
const selectedOrgForTokens = ref<any>(null);
const tokenAdjustmentMode = ref<'refund' | 'grant'>('refund');
const tokenAdjustmentAmount = ref<number>(50);
const tokenAdjustmentReason = ref<string>('');
const adjustingTokens = ref(false);

const projectedTokenBalance = computed(() => {
  const current = Number(selectedOrgForTokens.value?.tokens_remaining || selectedOrgForTokens.value?.token_balance || 0);
  const amt = Number(tokenAdjustmentAmount.value || 0);
  if (tokenAdjustmentMode.value === 'refund') {
    return Math.max(0, current - amt);
  }
  return current + amt;
});

// Computed Filtered Data Arrays
const filteredBatches = computed(() => {
  let list = overview.value.recentBatches || [];
  if (batchStatusFilter.value !== 'all') {
    list = list.filter((b: any) => b.status === batchStatusFilter.value);
  }
  if (batchSearch.value.trim()) {
    const q = batchSearch.value.toLowerCase();
    list = list.filter((b: any) =>
      (b.title || b.batch_name || '').toLowerCase().includes(q) ||
      (b.exam_name || b.exam_title || '').toLowerCase().includes(q) ||
      (b.org_name || '').toLowerCase().includes(q)
    );
  }
  return list;
});

const filteredOrganizations = computed(() => {
  let list = organizations.value || [];
  if (orgStatusFilter.value !== 'all') {
    list = list.filter((o: any) => o.status === orgStatusFilter.value);
  }
  if (orgSearch.value.trim()) {
    const q = orgSearch.value.toLowerCase();
    list = list.filter((o: any) =>
      (o.name || '').toLowerCase().includes(q) ||
      (o.contact_email || '').toLowerCase().includes(q) ||
      (o.city || '').toLowerCase().includes(q) ||
      (o.country || '').toLowerCase().includes(q)
    );
  }
  return list;
});

const filteredExams = computed(() => {
  let list = exams.value || [];
  if (examSearch.value.trim()) {
    const q = examSearch.value.toLowerCase();
    list = list.filter((e: any) => (e.name || e.title || '').toLowerCase().includes(q));
  }
  return list;
});

const filteredPackages = computed(() => {
  let list = packages.value || [];
  if (pkgSearch.value.trim()) {
    const q = pkgSearch.value.toLowerCase();
    list = list.filter((p: any) => (p.name || p.title || '').toLowerCase().includes(q));
  }
  return list;
});

const filteredAuditTransactions = computed(() => {
  let list = auditTransactions.value || [];
  if (auditTypeFilter.value !== 'all') {
    list = list.filter((a: any) => a.type === auditTypeFilter.value);
  }
  if (auditSearch.value.trim()) {
    const q = auditSearch.value.toLowerCase();
    list = list.filter((a: any) =>
      (a.org_name || '').toLowerCase().includes(q) ||
      (a.type || '').toLowerCase().includes(q) ||
      (a.notes || '').toLowerCase().includes(q)
    );
  }
  return list;
});

// --- Pagination States & Computeds ---
const batchPage = ref(1);
const batchPerPage = ref(10);
const paginatedBatches = computed(() => {
  const start = (batchPage.value - 1) * batchPerPage.value;
  return filteredBatches.value.slice(start, start + batchPerPage.value);
});
watch([batchSearch, batchStatusFilter], () => { batchPage.value = 1; });

const orgPage = ref(1);
const orgPerPage = ref(10);
const paginatedOrganizations = computed(() => {
  const start = (orgPage.value - 1) * orgPerPage.value;
  return filteredOrganizations.value.slice(start, start + orgPerPage.value);
});
watch([orgSearch, orgStatusFilter], () => { orgPage.value = 1; });

const examPage = ref(1);
const examPerPage = ref(10);
const paginatedExams = computed(() => {
  const start = (examPage.value - 1) * examPerPage.value;
  return filteredExams.value.slice(start, start + examPerPage.value);
});
watch(examSearch, () => { examPage.value = 1; });

const pkgPage = ref(1);
const pkgPerPage = ref(10);
const paginatedPackages = computed(() => {
  const start = (pkgPage.value - 1) * pkgPerPage.value;
  return filteredPackages.value.slice(start, start + pkgPerPage.value);
});
watch(pkgSearch, () => { pkgPage.value = 1; });

const auditPage = ref(1);
const auditPerPage = ref(10);
const paginatedAuditTransactions = computed(() => {
  const start = (auditPage.value - 1) * auditPerPage.value;
  return filteredAuditTransactions.value.slice(start, start + auditPerPage.value);
});
watch([auditSearch, auditTypeFilter], () => { auditPage.value = 1; });

const filteredTokenRequests = computed(() => {
  let list = tokenRequests.value || [];
  if (requestStatusFilter.value !== 'all') {
    list = list.filter((r: any) => r.status === requestStatusFilter.value);
  }
  if (requestSearch.value.trim()) {
    const q = requestSearch.value.toLowerCase();
    list = list.filter((r: any) =>
      (r.org_name || '').toLowerCase().includes(q) ||
      (r.package_name || '').toLowerCase().includes(q) ||
      (r.payment_reference || '').toLowerCase().includes(q) ||
      (r.admin_notes || '').toLowerCase().includes(q)
    );
  }
  return list;
});

const paginatedTokenRequests = computed(() => {
  const start = (requestPage.value - 1) * requestPerPage.value;
  return filteredTokenRequests.value.slice(start, start + requestPerPage.value);
});
watch([requestSearch, requestStatusFilter], () => { requestPage.value = 1; });

let pollInterval: any = null;

onMounted(() => {
  fetchAllData();
  pollInterval = setInterval(() => {
    if (activeTab.value === 'overview') fetchOverview();
  }, 5000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});

async function fetchAllData() {
  fetchOverview();
  fetchOrganizations();
  fetchExams();
  fetchPackages();
  fetchAudit();
  fetchTokenRequests();
  fetchPartnerSettings();
}

async function fetchTokenRequests() {
  loadingRequests.value = true;
  try {
    const { data } = await api.get('/main-admin/token-requests');
    tokenRequests.value = data?.requests || [];
    if (data?.counts) {
      tokenRequestCounts.value = data.counts;
    }
  } catch (err) {
    console.error('Error fetching token requests', err);
  } finally {
    loadingRequests.value = false;
  }
}

function openApproveModal(req: any) {
  selectedRequest.value = req;
  approveForm.value = {
    payment_reference: req.payment_reference || '',
    admin_notes: ''
  };
  showApproveModal.value = true;
}

async function confirmApproveRequest() {
  if (!selectedRequest.value) return;
  approvingRequest.value = true;
  try {
    const { data } = await api.post(`/main-admin/token-requests/${selectedRequest.value.id}/approve`, approveForm.value);
    showApproveModal.value = false;
    alert(data.message || 'Token purchase request approved and tokens credited successfully!');
    await fetchTokenRequests();
    await fetchOverview();
    await fetchAudit();
    await navStore.fetchBadges();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to approve request');
  } finally {
    approvingRequest.value = false;
  }
}

function openRejectModal(req: any) {
  selectedRequest.value = req;
  rejectForm.value = { admin_notes: '' };
  showRejectModal.value = true;
}

async function confirmRejectRequest() {
  if (!selectedRequest.value || !rejectForm.value.admin_notes.trim()) {
    alert('Please provide a reason for rejection.');
    return;
  }
  rejectingRequest.value = true;
  try {
    const { data } = await api.post(`/main-admin/token-requests/${selectedRequest.value.id}/reject`, rejectForm.value);
    showRejectModal.value = false;
    alert(data.message || 'Token purchase request rejected.');
    await fetchTokenRequests();
    await fetchOverview();
    await navStore.fetchBadges();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to reject request');
  } finally {
    rejectingRequest.value = false;
  }
}

function openTokenAdjustmentModal(org: any) {
  selectedOrgForTokens.value = org;
  tokenAdjustmentMode.value = 'refund';
  const avail = Number(org.tokens_remaining || org.token_balance || 0);
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
    await fetchOrganizations();
    await fetchOverview();
    await fetchAudit();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to adjust tokens');
  } finally {
    adjustingTokens.value = false;
  }
}

async function fetchOverview() {
  loadingOverview.value = true;
  try {
    const { data } = await api.get('/main-admin/dashboard/overview');
    overview.value = data;
  } catch (err) {
    console.error('Error fetching overview', err);
  } finally {
    loadingOverview.value = false;
  }
}

async function fetchOrganizations() {
  loadingOrgs.value = true;
  try {
    const { data } = await api.get('/main-admin/organizations');
    organizations.value = data;
  } catch (err) {
    console.error(err);
  } finally {
    loadingOrgs.value = false;
  }
}

function openAddOrgModal() {
  editingOrg.value = null;
  orgForm.value = {
    name: '',
    contact_email: '',
    contact_phone: '',
    country: configuredCountries.value[0] || 'United Arab Emirates',
    city: 'Dubai',
    institution_type: 'Authorized Training Center',
    programs: availablePrograms.value.slice(0, 2),
    status: 'active',
    initial_password: ''
  };
  showAddOrgModal.value = true;
}

function editOrg(org: any) {
  editingOrg.value = org;
  orgForm.value = {
    name: org.name || '',
    contact_email: org.contact_email || '',
    contact_phone: org.contact_phone || '',
    country: org.country || configuredCountries.value[0] || 'United Arab Emirates',
    city: org.city || 'Dubai',
    institution_type: org.institution_type || 'Authorized Training Center',
    programs: parsePrograms(org.programs),
    status: org.status || 'active',
    initial_password: ''
  };
  showAddOrgModal.value = true;
}

async function saveOrganization() {
  if (!orgForm.value.name || !orgForm.value.contact_email) {
    alert('Please enter Partner Center name and contact email.');
    return;
  }
  savingOrg.value = true;
  try {
    if (editingOrg.value) {
      await api.put(`/main-admin/organizations/${editingOrg.value.id}`, orgForm.value);
      showAddOrgModal.value = false;
      editingOrg.value = null;
      fetchOrganizations();
    } else {
      const { data } = await api.post('/main-admin/organizations', orgForm.value);
      showAddOrgModal.value = false;
      fetchOrganizations();
      if (data?.tempPassword) {
        selectedResetOrg.value = { name: orgForm.value.name, contact_email: orgForm.value.contact_email };
        resetSuccessResult.value = {
          email: orgForm.value.contact_email,
          tempPassword: data.tempPassword,
          isNewAccount: true
        };
        showResetModal.value = true;
      }
    }
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to save partner center');
  } finally {
    savingOrg.value = false;
  }
}

function openResetPasswordModal(org: any) {
  selectedResetOrg.value = org;
  resetPasswordMode.value = 'auto';
  customResetPassword.value = '';
  resetSendEmail.value = true;
  resetSuccessResult.value = null;
  copiedPassword.value = false;
  copiedField.value = null;
  showPassword.value = true;
  showResetModal.value = true;
}

function closeResetModal() {
  showResetModal.value = false;
  selectedResetOrg.value = null;
  resetSuccessResult.value = null;
  customResetPassword.value = '';
  copiedField.value = null;
  showPassword.value = true;
}

function getLoginUrl() {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/login`;
  }
  return 'https://gsfin.org/login';
}

async function copyText(text: string, fieldKey: string) {
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

async function copyAllCredentials() {
  if (!resetSuccessResult.value) return;
  const loginUrl = getLoginUrl();
  const orgName = selectedResetOrg.value?.name || 'Partner Center';
  const text = [
    `GSFIN Partner Portal Credentials`,
    `Organization: ${orgName}`,
    `Portal Login URL: ${loginUrl}`,
    `Authorized Email: ${resetSuccessResult.value.email}`,
    `Temporary Password: ${resetSuccessResult.value.tempPassword}`,
    `Note: Temporary credentials. Please set a permanent password upon first login.`
  ].join('\n');
  await copyText(text, 'all');
}

async function copyToClipboard(text: string) {
  await copyText(text, 'password');
}

async function executePasswordReset() {
  if (!selectedResetOrg.value) return;
  if (resetPasswordMode.value === 'custom' && !customResetPassword.value) {
    alert('Please enter a new password.');
    return;
  }

  resettingPassword.value = true;
  try {
    const payload: any = {
      send_email: resetSendEmail.value
    };
    if (resetPasswordMode.value === 'custom') {
      payload.password = customResetPassword.value;
    }

    const { data } = await api.post(`/main-admin/organizations/${selectedResetOrg.value.id}/reset-password`, payload);
    resetSuccessResult.value = {
      email: data.email || selectedResetOrg.value.contact_email,
      tempPassword: data.tempPassword || customResetPassword.value
    };
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to reset password');
  } finally {
    resettingPassword.value = false;
  }
}

async function deleteOrg(org: any) {
  if (!confirm(`Are you sure you want to delete "${org.name}"? This action cannot be undone.`)) return;
  try {
    await api.delete(`/main-admin/organizations/${org.id}`);
    fetchOrganizations();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to delete partner center');
  }
}

async function toggleOrgStatus(item: any) {
  const newStatus = item.status === 'active' ? 'suspended' : 'active';
  try {
    await api.patch(`/main-admin/organizations/${item.id}/status`, { status: newStatus });
    fetchOrganizations();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to update status');
  }
}

function parsePrograms(programsVal: any): string[] {
  if (!programsVal) return ['CODEX HACCP'];
  if (Array.isArray(programsVal)) return programsVal;
  try {
    const parsed = JSON.parse(programsVal);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // If comma separated string
    return String(programsVal).split(',').map(s => s.trim());
  }
  return ['CODEX HACCP'];
}

function formatOrgLocation(org: any): string {
  let country = (org.country || '').trim();
  if (country.toLowerCase() === 'united arab emirates') country = 'UAE';
  if (country.toLowerCase() === 'united kingdom') country = 'UK';
  const city = (org.city || '').trim();
  if (city && country) {
    return `${city}, ${country}`;
  }
  return city || country || 'Global';
}

// Exam Catalog Methods
async function fetchExams() {
  loadingExams.value = true;
  try {
    const { data } = await api.get('/main-admin/exams');
    exams.value = data;
  } catch (err) {
    console.error(err);
  } finally {
    loadingExams.value = false;
  }
}

function openAddExamModal() {
  editingExam.value = null;
  examForm.value = { name: '', description: '', duration_minutes: 60, max_attempts: 1, status: 'active' };
  showAddExamModal.value = true;
}

function editExam(exam: any) {
  editingExam.value = exam;
  examForm.value = {
    name: exam.name,
    description: exam.description || '',
    duration_minutes: exam.duration_minutes || 60,
    max_attempts: exam.max_attempts || 1,
    status: exam.status || 'active'
  };
  showAddExamModal.value = true;
}

async function saveExam() {
  if (!examForm.value.name) return;
  savingExam.value = true;
  try {
    if (editingExam.value) {
      await api.put(`/main-admin/exams/${editingExam.value.id}`, examForm.value);
    } else {
      await api.post('/main-admin/exams', examForm.value);
    }
    showAddExamModal.value = false;
    editingExam.value = null;
    examForm.value = { name: '', description: '', duration_minutes: 60, max_attempts: 1, status: 'active' };
    fetchExams();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to save exam');
  } finally {
    savingExam.value = false;
  }
}

// Token Package Methods
async function fetchPackages() {
  loadingPackages.value = true;
  try {
    const { data } = await api.get('/main-admin/token-packages');
    packages.value = data;
  } catch (err) {
    console.error(err);
  } finally {
    loadingPackages.value = false;
  }
}

function openAddPkgModal() {
  editingPkgId.value = null;
  pkgForm.value = { name: '', token_count: 50, price: 500 };
  showPkgModal.value = true;
}

function openEditPkgModal(pkg: any) {
  editingPkgId.value = pkg.id;
  pkgForm.value = {
    name: pkg.name,
    token_count: Number(pkg.token_count),
    price: Number(pkg.price)
  };
  showPkgModal.value = true;
}

async function savePackage() {
  if (!pkgForm.value.name || !pkgForm.value.token_count) return;
  savingPkg.value = true;
  try {
    if (editingPkgId.value) {
      await api.put(`/main-admin/token-packages/${editingPkgId.value}`, pkgForm.value);
    } else {
      await api.post('/main-admin/token-packages', pkgForm.value);
    }
    showPkgModal.value = false;
    editingPkgId.value = null;
    pkgForm.value = { name: '', token_count: 50, price: 500 };
    fetchPackages();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to save token package');
  } finally {
    savingPkg.value = false;
  }
}

function confirmDeletePkg(pkg: any) {
  pkgToDelete.value = pkg;
  showDeletePkgModal.value = true;
}

async function deletePackage() {
  if (!pkgToDelete.value) return;
  deletingPkg.value = true;
  try {
    await api.delete(`/main-admin/token-packages/${pkgToDelete.value.id}`);
    showDeletePkgModal.value = false;
    pkgToDelete.value = null;
    fetchPackages();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to delete token package');
  } finally {
    deletingPkg.value = false;
  }
}

async function togglePkgStatus(item: any) {
  const newStatus = item.status === 'active' ? 'retired' : 'active';
  try {
    await api.patch(`/main-admin/token-packages/${item.id}/status`, { status: newStatus });
    fetchPackages();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to update package status');
  }
}

// Audit Methods
async function fetchAudit() {
  loadingAudit.value = true;
  try {
    const { data } = await api.get('/main-admin/audit-transactions');
    auditTransactions.value = data;
  } catch (err) {
    console.error(err);
  } finally {
    loadingAudit.value = false;
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function getBatchStatusClass(status: string) {
  switch (status) {
    case 'in_progress': return 'chip-blue';
    case 'completed': return 'chip-green';
    default: return 'chip-slate';
  }
}

function getTxTypeClass(type: string) {
  switch (type) {
    case 'purchase':
    case 'admin_grant':
    case 'redeem': return 'chip-green';
    case 'consume':
    case 'consumption': return 'chip-red';
    case 'refund':
    case 'admin_refund': return 'chip-amber';
    default: return 'chip-slate';
  }
}
</script>

<style scoped>
.gsfin-admin-page {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  background: #FAFAFD;
  color: #0F172A;
  min-height: 100vh;
  padding: 0;
  box-sizing: border-box;
}

.admin-wrap {
  max-width: 1400px;
  margin: 0 auto;
}

.admin-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
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
  gap: 14px;
}

.btn-red {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  padding: 12px 22px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 0.88rem;
  box-shadow: 0 3px 10px rgba(227, 27, 35, 0.2);
  transition: all 0.2s ease;
  cursor: pointer;
}
.btn-red:hover {
  background: #C4131B;
  transform: translateY(-1px);
}
.btn-sm {
  padding: 10px 18px;
  font-size: 0.84rem;
  border-radius: 12px;
}

.btn-glass {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #F1F5F9;
  color: #334155;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 12px 22px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-glass:hover {
  background: #E2E8F0;
}

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
  gap: 20px;
  margin-bottom: 20px;
}
@media (max-width: 1024px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .metrics-grid { grid-template-columns: 1fr; } }

.panel-nav-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.panel-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.panel-tab-btn:hover {
  background: #F8FAFC;
  color: #0F172A;
  border-color: #CBD5E1;
}

.panel-tab-btn.active {
  background: #C41E3A;
  color: #FFFFFF;
  border-color: #C41E3A;
}

.tab-badge-amber {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 9999px;
  background: #FEF3C7;
  color: #B45309;
  font-size: 0.72rem;
  font-weight: 600;
}

.panel-tab-btn.active .tab-badge-amber {
  background: #FFFFFF;
  color: #C41E3A;
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
.metric-card-indigo {
  background: linear-gradient(135deg, #FFFFFF 0%, #EEF2FF 55%, #E0E7FF 100%);
  border: 1px solid rgba(79, 70, 229, 0.16);
}
.metric-card-indigo:hover {
  border-color: rgba(79, 70, 229, 0.35);
  box-shadow: 0 12px 28px -4px rgba(79, 70, 229, 0.15), 0 4px 12px rgba(15, 23, 42, 0.03);
}

.metric-card-emerald {
  background: linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 55%, #DCFCE7 100%);
  border: 1px solid rgba(16, 185, 129, 0.16);
}
.metric-card-emerald:hover {
  border-color: rgba(16, 185, 129, 0.35);
  box-shadow: 0 12px 28px -4px rgba(16, 185, 129, 0.15), 0 4px 12px rgba(15, 23, 42, 0.03);
}

.metric-card-amber {
  background: linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 55%, #FEF3C7 100%);
  border: 1px solid rgba(217, 119, 6, 0.16);
}
.metric-card-amber:hover {
  border-color: rgba(217, 119, 6, 0.35);
  box-shadow: 0 12px 28px -4px rgba(217, 119, 6, 0.15), 0 4px 12px rgba(15, 23, 42, 0.03);
}

.metric-card-red {
  background: linear-gradient(135deg, #FFFFFF 0%, #FEF2F2 55%, #FEE2E2 100%);
  border: 1px solid rgba(227, 27, 35, 0.16);
}
.metric-card-red:hover {
  border-color: rgba(227, 27, 35, 0.35);
  box-shadow: 0 12px 28px -4px rgba(227, 27, 35, 0.15), 0 4px 12px rgba(15, 23, 42, 0.03);
}

.metric-card-blue {
  background: linear-gradient(135deg, #FFFFFF 0%, #F0F7FF 55%, #E1EFFF 100%);
  border: 1px solid rgba(37, 99, 235, 0.16);
}
.metric-card-blue:hover {
  border-color: rgba(37, 99, 235, 0.35);
  box-shadow: 0 12px 28px -4px rgba(37, 99, 235, 0.15), 0 4px 12px rgba(15, 23, 42, 0.03);
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
  gap: 10px;
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
  width: 250px;
  transition: border-color 0.2s;
}
.table-search-input:focus {
  border-color: #E31B23;
}

.table-select-filter {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  font-size: 0.84rem;
  font-weight: 600;
  color: #0F172A;
  outline: none;
  cursor: pointer;
}

.btn-icon-refresh {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  color: #64748B;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-icon-refresh:hover:not(:disabled) {
  border-color: #E31B23;
  color: #E31B23;
}

/* ═════ PARTNER CARDS LIST STYLES ═════ */
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
  background: linear-gradient(135deg, rgba(227, 27, 35, 0.08) 0%, rgba(227, 27, 35, 0.16) 100%);
  border: 1px solid rgba(227, 27, 35, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  color: #E31B23;
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
  cursor: pointer;
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
.card-action-cluster {
  display: flex;
  align-items: center;
  gap: 10px;
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
.card-icon-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-icon-action {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #FFFFFF;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 1rem;
}
.btn-icon-action:hover {
  background: #F8FAFC;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.2);
}
.btn-icon-del:hover {
  background: #FEF2F2;
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.25);
}
.panel-loading-state, .panel-empty-state {
  padding: 48px;
  text-align: center;
  color: #64748B;
}
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

/* Partner Centers Table Specific Alignment */
.partner-centers-table th {
  white-space: nowrap !important;
}

.partner-centers-table td {
  vertical-align: middle !important;
}

.metrics-pill-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.metrics-pill-row span {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  background: #FFFFFF;
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
  overflow: hidden;
}
.modal-card-lg {
  max-width: 680px;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FAFAFD;
}
.modal-header h3 {
  font-size: 1.15rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
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
}
.modal-close-btn:hover {
  background: #E2E8F0;
  color: #0F172A;
}

.modal-body {
  padding: 24px;
  max-height: 75vh;
  overflow-y: auto;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #334155;
}
.modal-input, .modal-select, .modal-textarea {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #F8FAFC;
  font-size: 0.88rem;
  color: #0F172A;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}
.modal-input:focus, .modal-select:focus, .modal-textarea:focus {
  border-color: #E31B23;
  background: #FFFFFF;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 14px;
  border-radius: 12px;
}
@media (max-width: 500px) { .checkbox-grid { grid-template-columns: 1fr; } }

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.84rem;
  color: #334155;
  font-weight: 600;
  cursor: pointer;
}
.checkbox-label input[type="checkbox"] {
  accent-color: #E31B23;
  width: 16px;
  height: 16px;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (max-width: 550px) { .form-row-2 { grid-template-columns: 1fr; } }

.modal-footer {
  padding: 16px 24px;
  background: #FAFAFD;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

/* ── Credentials Provisioning Card ── */
.credentials-card {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.credential-row {
  display: flex;
  flex-direction: column;
}

.credential-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748B;
}

.btn-credential-copy {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
  line-height: 1.4;
}

.btn-credential-copy:hover {
  background: #F1F5F9;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.2);
}

.btn-credential-copy.copied {
  background: #ECFDF5;
  color: #059669;
  border-color: rgba(16, 185, 129, 0.3);
}

.credential-value-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 8px;
  padding: 8px 12px;
  transition: border-color 0.15s;
}

.credential-value-box:hover {
  border-color: rgba(15, 23, 42, 0.25);
}

.credential-text {
  font-size: 0.84rem;
  color: #1E293B;
  flex: 1;
}

.credential-password-box {
  background: #FFFFFF;
  border-color: rgba(227, 27, 35, 0.2);
}

.security-notice-pill {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #F0FDF4;
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.75rem;
  color: #166534;
  line-height: 1.4;
  margin-top: 4px;
}

/* ── Token Request Approve Modal Styles ── */
.token-credit-hero {
  background: linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.token-credit-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #D1FAE5;
  color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.token-credit-amount {
  font-size: 1.1rem;
  font-weight: 600;
  color: #065F46;
  font-family: inherit;
  line-height: 1.2;
}

.token-credit-sub {
  font-size: 0.74rem;
  color: #047857;
  margin-top: 2px;
}

.token-credit-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  background: #A7F3D0;
  color: #065F46;
}

.request-summary-card {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 14px;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 500px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.summary-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748B;
}

.summary-val {
  font-size: 0.84rem;
  color: #0F172A;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.spinner-sm-red {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(227, 27, 35, 0.2);
  border-top-color: #E31B23;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Request Action Buttons ── */
.btn-request-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.16s ease;
  white-space: nowrap;
  line-height: 1;
}

.btn-request-approve {
  background: #ECFDF5;
  color: #059669;
  border-color: rgba(16, 185, 129, 0.3);
}

.btn-request-approve:hover {
  background: #059669;
  color: #FFFFFF;
  border-color: #059669;
}

.btn-request-reject {
  background: #FEF2F2;
  color: #DC2626;
  border-color: rgba(239, 68, 68, 0.3);
}

.btn-request-reject:hover {
  background: #DC2626;
  color: #FFFFFF;
  border-color: #DC2626;
}

.btn-table-action.btn-refund {
  background: rgba(245, 158, 11, 0.08);
  color: #D97706;
  border-color: rgba(245, 158, 11, 0.2);
}
.btn-table-action.btn-refund:hover {
  background: #D97706;
  color: #FFFFFF;
}

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
</style>
