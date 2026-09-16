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
        <p class="mt-4 text-slate-600 font-bold">Loading Partner Center Profile...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="state-card text-center py-16">
        <div class="error-icon-box">
          <i class="mdi mdi-alert-circle-outline"></i>
        </div>
        <h3 class="text-xl font-extrabold text-slate-900 mb-2">Failed to load Partner Center</h3>
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
              <div class="eyebrow-tag mb-1">
                <i class="mdi mdi-office-building"></i> AUTHORIZED PARTNER CENTER
              </div>
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
            <button class="btn-action btn-action-secondary" @click="openEditModal">
              <i class="mdi mdi-pencil"></i> Edit Details
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
                  <span class="field-value text-slate-900 font-extrabold">{{ partner.name }}</span>
                </div>

                <div class="field-box">
                  <span class="field-label">Institution Category</span>
                  <span class="field-value">{{ partner.institution_type || 'Authorized Training Center' }}</span>
                </div>

                <div class="field-box">
                  <span class="field-label">Primary Contact Email</span>
                  <span class="field-value text-blue font-bold">
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
                    <span class="text-xs font-extrabold uppercase text-slate-500">Token Balance</span>
                    <span class="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{{ partner.tokens_remaining || 0 }} Tokens</span>
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
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="batches.length === 0">
                    <td colspan="5" class="text-center py-10 text-slate-400 font-medium">No exam batches recorded for this partner center.</td>
                  </tr>
                  <tr v-for="b in batches" :key="b.id">
                    <td class="font-extrabold text-slate-900">{{ b.id.substring(0, 8) }}...</td>
                    <td class="font-bold text-slate-800">{{ b.exam_name || 'Certification Exam' }}</td>
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
                  <tr v-for="tx in transactions" :key="tx.id">
                    <td class="font-mono text-xs text-slate-400">{{ tx.id ? tx.id.substring(0, 8) : '#' }}...</td>
                    <td>
                      <span :class="['chip-pill', tx.type === 'purchase' || tx.type === 'credit' ? 'chip-green' : 'chip-red']">
                        {{ tx.type || 'usage' }}
                      </span>
                    </td>
                    <td class="font-extrabold" :class="tx.type === 'purchase' || tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'">
                      {{ tx.type === 'purchase' || tx.type === 'credit' ? '+' : '-' }}{{ tx.amount || tx.tokens || 0 }} Tokens
                    </td>
                    <td class="font-bold text-slate-800">{{ tx.package_name || tx.reference || 'Standard Package Allocation' }}</td>
                    <td class="text-slate-500 font-medium">{{ formatDate(tx.created_at) }}</td>
                  </tr>
                </tbody>
              </table>
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
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="staff.length === 0">
                    <td colspan="5" class="text-center py-10 text-slate-400 font-medium">No staff operators registered for this partner center yet.</td>
                  </tr>
                  <tr v-for="u in staff" :key="u.id">
                    <td class="font-extrabold text-slate-900">{{ u.name }}</td>
                    <td class="text-slate-700 font-medium">{{ u.email }}</td>
                    <td><span class="chip-pill chip-blue">{{ u.role }}</span></td>
                    <td>
                      <span :class="['chip-pill', u.status === 'active' || u.is_active ? 'chip-green' : 'chip-red']">
                        {{ u.status || (u.is_active ? 'active' : 'disabled') }}
                      </span>
                    </td>
                    <td class="text-slate-500 font-medium">{{ formatDate(u.created_at) }}</td>
                  </tr>
                </tbody>
              </table>
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

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';

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

const activeTab = ref('overview');
const showEditModal = ref(false);

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

const tabs = [
  { id: 'overview', label: 'Overview & Profile', icon: 'mdi-office-building' },
  { id: 'batches', label: 'Exam Batches', icon: 'mdi-layers-triple' },
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
  } catch (err: any) {
    console.error('Failed to load partner details:', err);
    error.value = err?.response?.data?.message || err?.message || 'Failed to load partner center details.';
  } finally {
    loading.value = false;
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
  padding: 40px 48px;
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
  font-weight: 700;
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
  font-weight: 700;
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
  font-weight: 800;
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
  font-weight: 800;
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
  font-weight: 800;
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
  font-weight: 700;
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
.kpi-label { font-size: 0.76rem; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }
.kpi-value { font-size: 1.75rem; font-weight: 800; color: #0F172A; line-height: 1.2; margin-top: 4px; }
.kpi-unit { font-size: 0.95rem; font-weight: 700; color: #64748B; }
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
  font-weight: 700;
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
  font-weight: 800;
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
  font-weight: 800;
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
  font-weight: 800;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.field-value {
  font-size: 0.98rem;
  color: #0F172A;
  font-weight: 700;
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
  font-weight: 800;
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
  font-weight: 700;
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
  font-weight: 800;
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
  font-weight: 700;
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
.gsfin-table th { background: #F8FAFC; padding: 18px 24px; font-size: 0.74rem; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid rgba(15, 23, 42, 0.08); }
.gsfin-table td { padding: 20px 24px; font-size: 0.9rem; color: #334155; border-bottom: 1px solid rgba(15, 23, 42, 0.06); vertical-align: middle; }

.chip-pill { padding: 6px 14px; border-radius: 50px; font-size: 0.74rem; font-weight: 800; text-transform: uppercase; }
.chip-green { background: rgba(16, 185, 129, 0.1); color: #059669; }
.chip-blue { background: rgba(37, 99, 235, 0.1); color: #2563EB; }
.chip-amber { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.chip-red { background: rgba(239, 68, 68, 0.1); color: #DC2626; }
.count-badge { padding: 6px 16px; border-radius: 50px; font-size: 0.8rem; font-weight: 800; }

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
.modal-header h3 { font-size: 1.15rem; font-weight: 800; color: #0F172A; margin: 0; }
.modal-close-btn { background: #F1F5F9; border: none; width: 32px; height: 32px; border-radius: 50%; color: #64748B; cursor: pointer; }
.modal-body { padding: 24px; }
.modal-footer { padding: 16px 24px; background: #FAFAFD; border-top: 1px solid rgba(15, 23, 42, 0.06); display: flex; align-items: center; justify-content: flex-end; gap: 12px; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 0.8rem; font-weight: 700; color: #334155; }
.modal-input {
  width: 100%; padding: 10px 14px; border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12); background: #F8FAFC;
  font-size: 0.88rem; color: #0F172A; outline: none; font-family: inherit; box-sizing: border-box;
}
.modal-input:focus { border-color: #E31B23; background: #FFFFFF; }

.btn-red-lg { background: #E31B23; color: #FFFFFF; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 0.9rem; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
.btn-red-md { background: #E31B23; color: #FFFFFF; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 0.86rem; cursor: pointer; }
.btn-glass { background: #F1F5F9; color: #334155; border: 1px solid rgba(15, 23, 42, 0.1); padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 0.86rem; cursor: pointer; }

.fade-in { animation: fadeIn 0.25s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.spinner-lg-red { width: 32px; height: 32px; border: 3px solid rgba(227, 27, 35, 0.2); border-top-color: #E31B23; border-radius: 50%; animation: spin 0.75s linear infinite; display: inline-block; }
.spinner-sm-red { width: 16px; height: 16px; border: 2px solid rgba(227, 27, 35, 0.2); border-top-color: #E31B23; border-radius: 50%; animation: spin 0.75s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
