<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ TOP HEADER ═══ -->
      <div class="admin-header-row">
        <div>
          <h1 class="admin-title">{{ currentTitle }}</h1>
          <p class="admin-subtitle">Overview of partner centers, exams, token balances, and live batch activity.</p>
        </div>

        <div class="header-actions">
          <button v-if="activeTab === 'subcenters'" class="btn-red" @click="showAddOrgModal = true">
            <i class="mdi mdi-plus"></i> Add Partner Center
          </button>
          <button v-if="activeTab === 'exams'" class="btn-red" @click="showAddExamModal = true">
            <i class="mdi mdi-plus"></i> Add Exam
          </button>
          <button v-if="activeTab === 'packages'" class="btn-red" @click="showAddPkgModal = true">
            <i class="mdi mdi-plus"></i> Add Token Package
          </button>

          <div class="live-status-badge">
            <span class="pulse-dot"></span> Live Hub
          </div>
        </div>
      </div>

      <!-- ═══ METRICS CARDS ROW ═══ -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon-box bg-indigo-light">
            <i class="mdi mdi-office-building text-indigo"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Partner Centers</span>
            <span class="metric-value">{{ overview.metrics.totalSubCenters || 0 }}</span>
            <span class="metric-sub text-indigo">Active Partners</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box bg-emerald-light">
            <i class="mdi mdi-layers-triple text-emerald"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Active Batches</span>
            <span class="metric-value">{{ overview.metrics.activeBatches || 0 }}</span>
            <span class="metric-sub text-emerald">Active Sessions</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box bg-amber-light">
            <i class="mdi mdi-ticket-confirmation text-amber"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Tokens Issued</span>
            <span class="metric-value">{{ overview.metrics.totalTokensSold || 0 }}</span>
            <span class="metric-sub text-amber">Total Issued</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box bg-red-light">
            <i class="mdi mdi-ticket-percent text-red"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Tokens Consumed</span>
            <span class="metric-value">{{ overview.metrics.totalTokensConsumed || 0 }}</span>
            <span class="metric-sub text-red">Total Used</span>
          </div>
        </div>
      </div>


      <!-- ═══ TAB CONTENT PANELS ═══ -->

      <!-- TAB 1: OVERVIEW & LIVE BATCHES -->
      <div v-if="activeTab === 'overview' || activeTab === 'batches'" class="tab-panel">
        <div class="panel-card">
          <div class="panel-card-header">
            <div class="panel-title-wrap">
              <i class="mdi mdi-cube-outline panel-icon"></i>
              <h3>Live Sub-Center Batches Feed</h3>
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

              <button class="btn-icon-refresh" @click="fetchOverview" :disabled="loadingOverview">
                <i :class="['mdi', 'mdi-refresh', { 'spin-icon': loadingOverview }]"></i>
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="gsfin-table">
              <thead>
                <tr>
                  <th>Sub-Center</th>
                  <th>Exam Title</th>
                  <th>Status</th>
                  <th>Student Metrics</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingOverview">
                  <td colspan="5" class="text-center py-6 text-slate-500">
                    <span class="spinner-sm-red"></span> Loading Live Feed...
                  </td>
                </tr>
                <tr v-else-if="filteredBatches.length === 0">
                  <td colspan="5" class="text-center py-8 text-slate-500">
                    <i class="mdi mdi-layers-off-outline text-3xl block mb-2 text-slate-400"></i>
                    No Active Batches Found
                  </td>
                </tr>
                <tr v-for="b in filteredBatches" :key="b.id">
                  <td class="font-weight-bold text-slate-900">{{ b.org_name || 'Sub-Center' }}</td>
                  <td>{{ b.exam_name || b.exam_title || 'Certification Exam' }}</td>
                  <td>
                    <span :class="['badge-chip', getBatchStatusClass(b.status)]">
                      {{ b.status }}
                    </span>
                  </td>
                  <td>
                    <div class="metrics-pill-row">
                      <span class="chip-blue">Total: {{ b.student_count || 0 }}</span>
                      <span class="chip-green">Passed: {{ b.passed_count || 0 }}</span>
                      <span class="chip-red">Failed: {{ b.failed_count || 0 }}</span>
                      <span class="chip-amber">In Progress: {{ b.in_progress_count || 0 }}</span>
                    </div>
                  </td>
                  <td class="text-slate-500">{{ formatDate(b.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: SUB-CENTER ACCOUNTS MANAGEMENT -->
      <div v-else-if="activeTab === 'subcenters'" class="tab-panel">
        <div class="panel-card">
          <div class="panel-card-header">
            <div class="search-input-wrap">
              <i class="mdi mdi-magnify search-icon"></i>
              <input
                v-model="orgSearch"
                type="text"
                placeholder="Search sub-center name or email..."
                class="table-search-input"
              />
            </div>

            <select v-model="orgStatusFilter" class="table-select-filter">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div class="table-responsive">
            <table class="gsfin-table">
              <thead>
                <tr>
                  <th>Sub-Center Name</th>
                  <th>Contact Email</th>
                  <th>Contact Phone</th>
                  <th>Status</th>
                  <th>Wallet Tokens</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingOrgs">
                  <td colspan="6" class="text-center py-6 text-slate-500">
                    <span class="spinner-sm-red"></span> Loading Accounts...
                  </td>
                </tr>
                <tr v-else-if="filteredOrganizations.length === 0">
                  <td colspan="6" class="text-center py-8 text-slate-500">No Sub-Centers Found</td>
                </tr>
                <tr v-for="org in filteredOrganizations" :key="org.id">
                  <td class="font-weight-bold text-slate-900">{{ org.name }}</td>
                  <td>{{ org.contact_email }}</td>
                  <td>{{ org.contact_phone || '-' }}</td>
                  <td>
                    <span :class="['badge-chip', org.status === 'active' ? 'chip-green' : 'chip-amber']">
                      {{ org.status }}
                    </span>
                  </td>
                  <td>
                    <span class="badge-token-count">
                      <i class="mdi mdi-ticket-confirmation"></i> {{ org.token_balance || 0 }} Tokens
                    </span>
                  </td>
                  <td>
                    <button
                      class="btn-table-action"
                      :class="org.status === 'active' ? 'btn-warn' : 'btn-success'"
                      @click="toggleOrgStatus(org)"
                    >
                      {{ org.status === 'active' ? 'Suspend' : 'Activate' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 3: EXAM CATALOG -->
      <div v-else-if="activeTab === 'exams'" class="tab-panel">
        <div class="panel-card">
          <div class="panel-card-header">
            <div class="search-input-wrap">
              <i class="mdi mdi-magnify search-icon"></i>
              <input
                v-model="examSearch"
                type="text"
                placeholder="Search catalog exams..."
                class="table-search-input"
              />
            </div>
          </div>

          <div class="table-responsive">
            <table class="gsfin-table">
              <thead>
                <tr>
                  <th>Exam Name</th>
                  <th>Duration (Mins)</th>
                  <th>Max Attempts Cap</th>
                  <th>Status</th>
                  <th>Actions</th>
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
                <tr v-for="exam in filteredExams" :key="exam.id">
                  <td class="font-weight-bold text-slate-900">{{ exam.name }}</td>
                  <td>{{ exam.duration_minutes }} Mins</td>
                  <td>{{ exam.max_attempts }} Attempts</td>
                  <td>
                    <span :class="['badge-chip', exam.status === 'active' ? 'chip-green' : 'chip-slate']">
                      {{ exam.status }}
                    </span>
                  </td>
                  <td>
                    <button class="btn-table-action btn-edit" @click="editExam(exam)">
                      <i class="mdi mdi-pencil"></i> Edit
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 4: TOKEN PACKAGES CATALOG -->
      <div v-else-if="activeTab === 'packages'" class="tab-panel">
        <div class="panel-card">
          <div class="panel-card-header">
            <div class="search-input-wrap">
              <i class="mdi mdi-magnify search-icon"></i>
              <input
                v-model="pkgSearch"
                type="text"
                placeholder="Search token packages..."
                class="table-search-input"
              />
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
                  <th>Actions</th>
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
                <tr v-for="pkg in filteredPackages" :key="pkg.id">
                  <td class="font-weight-bold text-slate-900">{{ pkg.name }}</td>
                  <td>
                    <span class="badge-token-count">
                      <i class="mdi mdi-ticket-confirmation"></i> {{ pkg.token_count }} Tokens
                    </span>
                  </td>
                  <td class="font-weight-bold text-emerald">${{ pkg.price }}</td>
                  <td>
                    <span :class="['badge-chip', pkg.status === 'active' ? 'chip-green' : 'chip-slate']">
                      {{ pkg.status }}
                    </span>
                  </td>
                  <td>
                    <button
                      class="btn-table-action"
                      :class="pkg.status === 'active' ? 'btn-warn' : 'btn-success'"
                      @click="togglePkgStatus(pkg)"
                    >
                      {{ pkg.status === 'active' ? 'Retire' : 'Activate' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 5: TOKEN AUDIT TRAIL -->
      <div v-else-if="activeTab === 'audit'" class="tab-panel">
        <div class="panel-card">
          <div class="panel-card-header">
            <div class="search-input-wrap">
              <i class="mdi mdi-magnify search-icon"></i>
              <input
                v-model="auditSearch"
                type="text"
                placeholder="Search sub-center or transaction type..."
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

          <div class="table-responsive">
            <table class="gsfin-table">
              <thead>
                <tr>
                  <th>Sub-Center</th>
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
                <tr v-for="tx in filteredAuditTransactions" :key="tx.id">
                  <td class="font-weight-bold text-slate-900">{{ tx.org_name || 'Sub-Center' }}</td>
                  <td>
                    <span :class="['badge-chip', getTxTypeClass(tx.type)]">
                      {{ tx.type }}
                    </span>
                  </td>
                  <td class="font-weight-bold" :class="tx.token_count > 0 ? 'text-green' : 'text-red'">
                    {{ tx.token_count > 0 ? '+' : '' }}{{ tx.token_count }}
                  </td>
                  <td>{{ tx.package_name || '-' }}</td>
                  <td class="text-slate-500">{{ formatDate(tx.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>

    <!-- ═══ MODALS ═══ -->

    <!-- Create Sub-Center Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAddOrgModal" class="modal-overlay" @click.self="showAddOrgModal = false">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Create New Sub-Center</h3>
              <button class="modal-close-btn" @click="showAddOrgModal = false"><i class="mdi mdi-close"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group mb-3">
                <label class="form-label">Sub-Center Name</label>
                <input v-model="newOrg.name" type="text" placeholder="Apex Testing Center" class="modal-input" />
              </div>
              <div class="form-group mb-3">
                <label class="form-label">Contact Email</label>
                <input v-model="newOrg.contact_email" type="email" placeholder="contact@apexcenter.com" class="modal-input" />
              </div>
              <div class="form-group mb-3">
                <label class="form-label">Contact Phone</label>
                <input v-model="newOrg.contact_phone" type="text" placeholder="+1-555-0199" class="modal-input" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-glass" @click="showAddOrgModal = false">Cancel</button>
              <button class="btn-red" :disabled="savingOrg" @click="createOrganization">
                {{ savingOrg ? 'Creating...' : 'Create Sub-Center' }}
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

    <!-- Create Package Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAddPkgModal" class="modal-overlay" @click.self="showAddPkgModal = false">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Create Token Package</h3>
              <button class="modal-close-btn" @click="showAddPkgModal = false"><i class="mdi mdi-close"></i></button>
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
              <button class="btn-glass" @click="showAddPkgModal = false">Cancel</button>
              <button class="btn-red" :disabled="savingPkg" @click="createPackage">
                {{ savingPkg ? 'Creating...' : 'Create Package' }}
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

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role']
});

const api = useApi();
const route = useRoute();
const activeTab = ref(route.query.tab ? String(route.query.tab) : 'overview');

const tabItems = [
  { label: 'Dashboard Overview', value: 'overview', icon: 'mdi-view-dashboard-outline' },
  { label: 'Live Batches', value: 'batches', icon: 'mdi-layers-triple-outline' },
  { label: 'Sub-Center Accounts', value: 'subcenters', icon: 'mdi-office-building' },
  { label: 'Exam Catalog', value: 'exams', icon: 'mdi-file-certificate' },
  { label: 'Token Packages', value: 'packages', icon: 'mdi-package-variant-closed' },
  { label: 'Token Audit Trail', value: 'audit', icon: 'mdi-history' }
];

const currentTitle = computed(() => {
  switch (activeTab.value) {
    case 'batches': return 'Live Batches';
    case 'subcenters': return 'Partner Centers';
    case 'exams': return 'Exams Catalog';
    case 'packages': return 'Token Packages';
    case 'audit': return 'Token History';
    case 'overview':
    default:
      return 'Dashboard';
  }
});

watch(() => route.query.tab, (newTab) => {
  if (newTab) activeTab.value = String(newTab);
});

// Overview state
const overview = ref<any>({ metrics: {}, recentBatches: [] });
const loadingOverview = ref(false);

// Organizations state
const organizations = ref<any[]>([]);
const loadingOrgs = ref(false);
const showAddOrgModal = ref(false);
const savingOrg = ref(false);
const newOrg = ref({ name: '', contact_email: '', contact_phone: '' });

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
const showAddPkgModal = ref(false);
const savingPkg = ref(false);
const pkgForm = ref({ name: '', token_count: 50, price: 500 });

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
      (o.contact_email || '').toLowerCase().includes(q)
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

async function createOrganization() {
  if (!newOrg.value.name || !newOrg.value.contact_email) return;
  savingOrg.value = true;
  try {
    await api.post('/main-admin/organizations', newOrg.value);
    showAddOrgModal.value = false;
    newOrg.value = { name: '', contact_email: '', contact_phone: '' };
    fetchOrganizations();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to create organization');
  } finally {
    savingOrg.value = false;
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

async function createPackage() {
  if (!pkgForm.value.name || !pkgForm.value.token_count) return;
  savingPkg.value = true;
  try {
    await api.post('/main-admin/token-packages', pkgForm.value);
    showAddPkgModal.value = false;
    pkgForm.value = { name: '', token_count: 50, price: 500 };
    fetchPackages();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to create token package');
  } finally {
    savingPkg.value = false;
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

async function fetchAudit() {
  loadingAudit.value = true;
  try {
    const { data } = await api.get('/main-admin/token-audit');
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
    case 'purchase': return 'chip-green';
    case 'consumption': return 'chip-red';
    case 'refund': return 'chip-amber';
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
  padding: 32px 36px;
  box-sizing: border-box;
}

.admin-wrap {
  max-width: 1300px;
  margin: 0 auto;
}

.admin-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.eyebrow-red {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #E31B23;
}

.admin-title {
  font-size: 2rem;
  font-weight: 800;
  color: #0F172A;
  margin: 4px 0;
  letter-spacing: -0.02em;
}

.admin-subtitle {
  font-size: 0.92rem;
  color: #64748B;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-red {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.86rem;
  box-shadow: 0 3px 10px rgba(227, 27, 35, 0.2);
  transition: all 0.2s ease;
  cursor: pointer;
}
.btn-red:hover {
  background: #C4131B;
  transform: translateY(-1px);
}

.btn-glass {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #F1F5F9;
  color: #334155;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.86rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-glass:hover {
  background: #E2E8F0;
}

.live-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  padding: 6px 14px;
  border-radius: 50px;
  font-size: 0.78rem;
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
  gap: 20px;
  margin-bottom: 28px;
}
@media (max-width: 1024px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .metrics-grid { grid-template-columns: 1fr; } }

.metric-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
}

.metric-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
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
  font-size: 1.8rem;
  font-weight: 900;
  color: #0F172A;
  line-height: 1.2;
  margin: 2px 0;
}

.metric-sub {
  font-size: 0.76rem;
  font-weight: 700;
}

/* Tabs Bar */
.admin-tabs-bar {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  padding: 6px;
  margin-bottom: 24px;
  overflow-x: auto;
}

.tab-btn {
  background: none;
  border: none;
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 0.86rem;
  font-weight: 700;
  color: #64748B;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: #0F172A;
  background: rgba(15, 23, 42, 0.04);
}

.tab-btn--active {
  background: #FFFFFF !important;
  color: #E31B23 !important;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

/* Panel & Card */
.panel-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
  overflow: hidden;
}

.panel-card-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  background: #FAFAFD;
}

.panel-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.panel-icon {
  font-size: 1.4rem;
  color: #E31B23;
}
.panel-title-wrap h3 {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
}

.panel-filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
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
  padding: 9px 14px 9px 40px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  font-size: 0.86rem;
  color: #0F172A;
  outline: none;
  width: 240px;
  transition: border-color 0.2s;
}
.table-search-input:focus {
  border-color: #E31B23;
}

.table-select-filter {
  padding: 9px 14px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  font-size: 0.86rem;
  font-weight: 700;
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

/* Tables */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.gsfin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.88rem;
}

.gsfin-table th {
  padding: 14px 20px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748B;
  background: #F8FAFC;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.gsfin-table td {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  color: #334155;
  vertical-align: middle;
}

.gsfin-table tbody tr:hover {
  background: rgba(248, 250, 252, 0.8);
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

.badge-token-count {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(245, 158, 11, 0.1);
  color: #D97706;
  font-weight: 800;
  font-size: 0.8rem;
  padding: 4px 12px;
  border-radius: 50px;
}

.metrics-pill-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.metrics-pill-row span {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
}

/* Action Buttons */
.btn-table-action {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-warn { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.btn-warn:hover { background: #D97706; color: #FFFFFF; }

.btn-success { background: rgba(16, 185, 129, 0.1); color: #059669; }
.btn-success:hover { background: #059669; color: #FFFFFF; }

.btn-edit { background: #F1F5F9; color: #334155; }
.btn-edit:hover { background: #E31B23; color: #FFFFFF; }

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
  max-width: 500px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
  overflow: hidden;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-header h3 {
  font-size: 1.2rem;
  font-weight: 800;
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
}

.modal-body {
  padding: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #334155;
}
.modal-input, .modal-select, .modal-textarea {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #F8FAFC;
  font-size: 0.9rem;
  color: #0F172A;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}
.modal-input:focus, .modal-select:focus, .modal-textarea:focus {
  border-color: #E31B23;
  background: #FFFFFF;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.modal-footer {
  padding: 16px 24px;
  background: #FAFAFD;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
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
</style>
