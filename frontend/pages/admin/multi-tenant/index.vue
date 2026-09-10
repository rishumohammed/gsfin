<template>
  <v-container fluid class="py-8 px-6 bg-grey-lighten-4 min-vh-100">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold text-slate-900 tracking-tight mb-0">
          {{ currentTitle }}
        </h1>
      </div>
      <div class="d-flex align-center gap-3">
        <v-btn v-if="activeTab === 'subcenters'" color="primary" prepend-icon="mdi-plus" height="42" rounded="lg" class="px-5 text-none font-weight-bold text-subtitle-2" elevation="0" @click="showAddOrgModal = true">
          Add Sub-Center
        </v-btn>
        <v-btn v-if="activeTab === 'exams'" color="primary" prepend-icon="mdi-plus" height="42" rounded="lg" class="px-5 text-none font-weight-bold text-subtitle-2" elevation="0" @click="showAddExamModal = true">
          Create Catalog Exam
        </v-btn>
        <v-btn v-if="activeTab === 'packages'" color="primary" prepend-icon="mdi-plus" height="42" rounded="lg" class="px-5 text-none font-weight-bold text-subtitle-2" elevation="0" @click="showAddPkgModal = true">
          Create Token Package
        </v-btn>
        <v-chip color="success" variant="tonal" size="small" class="font-weight-bold ms-2">
          <v-icon start icon="mdi-radiobox-marked" class="pulse-icon"></v-icon>
          Live
        </v-chip>
      </div>
    </div>

    <!-- Main View Window -->
    <v-window v-model="activeTab">
          
          <!-- TAB 1: REAL-TIME OVERVIEW DASHBOARD -->
          <v-window-item value="overview">
            <!-- Metrics Row -->
            <v-row class="mb-6">
              <v-col cols="12" sm="6" md="3">
                <v-card class="pa-5 rounded-xl border-0 shadow-sm metric-card metric-indigo">
                  <div class="d-flex justify-space-between align-start">
                    <div>
                      <div class="text-caption font-weight-bold text-uppercase tracking-wider text-slate-500">Sub-Centers</div>
                      <div class="text-h3 font-weight-black text-slate-900 mt-1">{{ overview.metrics.totalSubCenters || 0 }}</div>
                      <div class="text-caption text-indigo-darken-2 font-weight-semibold mt-1">
                        <v-icon icon="mdi-office-building" size="14" class="me-1"></v-icon>Active Organizations
                      </div>
                    </div>
                    <div class="rounded-xl bg-indigo-lighten-5 d-flex align-center justify-center" style="width: 52px; height: 52px;">
                      <v-icon icon="mdi-office-building" size="28" color="indigo-darken-1"></v-icon>
                    </div>
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-card class="pa-5 rounded-xl border-0 shadow-sm metric-card metric-emerald">
                  <div class="d-flex justify-space-between align-start">
                    <div>
                      <div class="text-caption font-weight-bold text-uppercase tracking-wider text-slate-500">Active Batches</div>
                      <div class="text-h3 font-weight-black text-slate-900 mt-1">{{ overview.metrics.activeBatches || 0 }}</div>
                      <div class="text-caption text-emerald-darken-2 font-weight-semibold mt-1">
                        <v-icon icon="mdi-layers-triple" size="14" class="me-1"></v-icon>Live Running Sessions
                      </div>
                    </div>
                    <div class="rounded-xl bg-emerald-lighten-5 d-flex align-center justify-center" style="width: 52px; height: 52px;">
                      <v-icon icon="mdi-account-group" size="28" color="emerald-darken-1"></v-icon>
                    </div>
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-card class="pa-5 rounded-xl border-0 shadow-sm metric-card metric-amber">
                  <div class="d-flex justify-space-between align-start">
                    <div>
                      <div class="text-caption font-weight-bold text-uppercase tracking-wider text-slate-500">Tokens Issued</div>
                      <div class="text-h3 font-weight-black text-slate-900 mt-1">{{ overview.metrics.totalTokensSold || 0 }}</div>
                      <div class="text-caption text-amber-darken-3 font-weight-semibold mt-1">
                        <v-icon icon="mdi-ticket-confirmation" size="14" class="me-1"></v-icon>Sub-Center Wallets
                      </div>
                    </div>
                    <div class="rounded-xl bg-amber-lighten-5 d-flex align-center justify-center" style="width: 52px; height: 52px;">
                      <v-icon icon="mdi-ticket-confirmation" size="28" color="amber-darken-2"></v-icon>
                    </div>
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-card class="pa-5 rounded-xl border-0 shadow-sm metric-card metric-purple">
                  <div class="d-flex justify-space-between align-start">
                    <div>
                      <div class="text-caption font-weight-bold text-uppercase tracking-wider text-slate-500">Tokens Consumed</div>
                      <div class="text-h3 font-weight-black text-slate-900 mt-1">{{ overview.metrics.totalTokensConsumed || 0 }}</div>
                      <div class="text-caption text-purple-darken-2 font-weight-semibold mt-1">
                        <v-icon icon="mdi-ticket-percent" size="14" class="me-1"></v-icon>Exam Enrollments
                      </div>
                    </div>
                    <div class="rounded-xl bg-purple-lighten-5 d-flex align-center justify-center" style="width: 52px; height: 52px;">
                      <v-icon icon="mdi-ticket-percent" size="28" color="purple-darken-1"></v-icon>
                    </div>
                  </div>
                </v-card>
              </v-col>
            </v-row>

            <!-- Real-Time Batches Table -->
            <v-card variant="outlined" class="rounded-lg border">
              <v-card-title class="d-flex flex-wrap align-center justify-space-between pa-4 bg-grey-lighten-4 border-b gap-3">
                <div class="d-flex align-center me-auto">
                  <v-icon icon="mdi-cube-outline" class="me-2" color="primary"></v-icon>
                  <span class="text-h6 font-weight-bold text-slate-900">Live Sub-Center Batches Feed</span>
                </div>
                <div class="d-flex align-center gap-3 flex-wrap">
                  <v-text-field
                    v-model="batchSearch"
                    prepend-inner-icon="mdi-magnify"
                    placeholder="Search batch or exam..."
                    hide-details
                    density="compact"
                    variant="outlined"
                    style="max-width: 240px;"
                    clearable
                  ></v-text-field>
                  <v-select
                    v-model="batchStatusFilter"
                    :items="[
                      { title: 'All Statuses', value: 'all' },
                      { title: 'In Progress', value: 'in_progress' },
                      { title: 'Completed', value: 'completed' },
                      { title: 'Created', value: 'created' }
                    ]"
                    hide-details
                    density="compact"
                    variant="outlined"
                    style="max-width: 170px;"
                  ></v-select>
                  <v-btn icon="mdi-refresh" variant="text" size="small" @click="fetchOverview" :loading="loadingOverview"></v-btn>
                </div>
              </v-card-title>
              
              <v-data-table
                :headers="batchHeaders"
                :items="filteredBatches"
                :loading="loadingOverview"
                class="elevation-0"
              >
                <template v-slot:no-data>
                  <div class="text-center py-10 px-4">
                    <div class="rounded-circle bg-slate-100 d-inline-flex align-center justify-center mb-3 pa-4">
                      <v-icon size="40" color="grey-darken-1">mdi-layers-off-outline</v-icon>
                    </div>
                    <div class="text-subtitle-1 font-weight-bold text-slate-800">No Active Batches Available</div>
                    <div class="text-caption text-slate-500 max-w-xs mx-auto mb-4">
                      Sub-centers have not launched any batch exam sessions yet.
                    </div>
                  </div>
                </template>

                <template v-slot:item.status="{ item }: any">
                  <v-chip
                    :color="getBatchStatusColor(item.status)"
                    size="small"
                    variant="tonal"
                    class="font-weight-bold text-uppercase"
                  >
                    {{ item.status }}
                  </v-chip>
                </template>
                <template v-slot:item.stats="{ item }: any">
                  <div class="d-flex gap-2">
                    <v-chip size="x-small" color="blue" variant="flat">Total: {{ item.student_count || 0 }}</v-chip>
                    <v-chip size="x-small" color="success" variant="flat">Passed: {{ item.passed_count || 0 }}</v-chip>
                    <v-chip size="x-small" color="error" variant="flat">Failed: {{ item.failed_count || 0 }}</v-chip>
                    <v-chip size="x-small" color="warning" variant="flat">In Progress: {{ item.in_progress_count || 0 }}</v-chip>
                  </div>
                </template>
                <template v-slot:item.created_at="{ item }: any">
                  {{ formatDate(item.created_at) }}
                </template>
              </v-data-table>
            </v-card>
          </v-window-item>

          <!-- TAB 2: SUB-CENTER ACCOUNTS MANAGEMENT -->
          <v-window-item value="subcenters">
            <v-card variant="outlined" class="rounded-lg border">
              <div class="pa-4 border-b bg-grey-lighten-4 d-flex align-center justify-space-between flex-wrap gap-3">
                <v-text-field
                  v-model="orgSearch"
                  prepend-inner-icon="mdi-magnify"
                  placeholder="Search sub-center name or email..."
                  hide-details
                  density="compact"
                  variant="outlined"
                  style="max-width: 300px;"
                  clearable
                ></v-text-field>
                <v-select
                  v-model="orgStatusFilter"
                  :items="[
                    { title: 'All Statuses', value: 'all' },
                    { title: 'Active', value: 'active' },
                    { title: 'Suspended', value: 'suspended' }
                  ]"
                  hide-details
                  density="compact"
                  variant="outlined"
                  style="max-width: 170px;"
                ></v-select>
              </div>
              <v-data-table
                :headers="orgHeaders"
                :items="filteredOrganizations"
                :loading="loadingOrgs"
                class="elevation-0"
              >
                <template v-slot:item.status="{ item }: any">
                  <v-chip :color="item.status === 'active' ? 'success' : 'error'" size="small" variant="flat">
                    {{ item.status }}
                  </v-chip>
                </template>
                <template v-slot:item.tokens="{ item }: any">
                  <div class="font-weight-medium">
                    <span class="text-success font-weight-bold">{{ item.tokens_remaining }}</span> remaining
                    <span class="text-grey">({{ item.tokens_used }} used / {{ item.tokens_purchased }} bought)</span>
                  </div>
                </template>
                <template v-slot:item.actions="{ item }: any">
                  <v-btn
                    size="small"
                    :color="item.status === 'active' ? 'warning' : 'success'"
                    variant="tonal"
                    @click="toggleOrgStatus(item)"
                  >
                    {{ item.status === 'active' ? 'Suspend' : 'Activate' }}
                  </v-btn>
                </template>
              </v-data-table>
            </v-card>
          </v-window-item>

          <!-- TAB 3: EXAM CATALOG -->
          <v-window-item value="exams">
            <v-card variant="outlined" class="rounded-lg border">
              <div class="pa-4 border-b bg-grey-lighten-4 d-flex align-center justify-space-between flex-wrap gap-3">
                <v-text-field
                  v-model="examSearch"
                  prepend-inner-icon="mdi-magnify"
                  placeholder="Search exam name..."
                  hide-details
                  density="compact"
                  variant="outlined"
                  style="max-width: 300px;"
                  clearable
                ></v-text-field>
              </div>
              <v-data-table
                :headers="examHeaders"
                :items="filteredExams"
                :loading="loadingExams"
                class="elevation-0"
              >
                <template v-slot:item.max_attempts="{ item }: any">
                  <v-chip color="indigo" size="small" variant="flat">
                    {{ item.max_attempts }} Attempt(s)
                  </v-chip>
                </template>
                <template v-slot:item.status="{ item }: any">
                  <v-chip :color="item.status === 'active' ? 'success' : 'grey'" size="small" variant="flat">
                    {{ item.status }}
                  </v-chip>
                </template>
                <template v-slot:item.actions="{ item }: any">
                  <v-btn size="small" icon="mdi-pencil" variant="text" color="primary" @click="openEditExamModal(item)"></v-btn>
                </template>
              </v-data-table>
            </v-card>
          </v-window-item>

          <!-- TAB 4: TOKEN PACKAGES -->
          <v-window-item value="packages">
            <v-card variant="outlined" class="rounded-lg border">
              <div class="pa-4 border-b bg-grey-lighten-4 d-flex align-center justify-space-between flex-wrap gap-3">
                <v-text-field
                  v-model="pkgSearch"
                  prepend-inner-icon="mdi-magnify"
                  placeholder="Search package name..."
                  hide-details
                  density="compact"
                  variant="outlined"
                  style="max-width: 300px;"
                  clearable
                ></v-text-field>
              </div>
              <v-data-table
                :headers="packageHeaders"
                :items="filteredPackages"
                :loading="loadingPackages"
                class="elevation-0"
              >
                <template v-slot:item.price="{ item }: any">
                  <span class="font-weight-bold text-success">${{ Number(item.price).toFixed(2) }}</span>
                </template>
                <template v-slot:item.token_count="{ item }: any">
                  <v-chip color="amber-darken-3" size="small" variant="flat">
                    {{ item.token_count }} Tokens
                  </v-chip>
                </template>
                <template v-slot:item.status="{ item }: any">
                  <v-chip :color="item.status === 'active' ? 'success' : 'grey'" size="small" variant="flat">
                    {{ item.status }}
                  </v-chip>
                </template>
                <template v-slot:item.actions="{ item }: any">
                  <v-btn
                    size="small"
                    :color="item.status === 'active' ? 'grey' : 'success'"
                    variant="tonal"
                    @click="togglePkgStatus(item)"
                  >
                    {{ item.status === 'active' ? 'Retire' : 'Activate' }}
                  </v-btn>
                </template>
              </v-data-table>
            </v-card>
          </v-window-item>

          <!-- TAB 5: AUDIT TRAIL -->
          <v-window-item value="audit">
            <v-card variant="outlined" class="rounded-lg border">
              <div class="pa-4 border-b bg-grey-lighten-4 d-flex align-center justify-space-between flex-wrap gap-3">
                <v-text-field
                  v-model="auditSearch"
                  prepend-inner-icon="mdi-magnify"
                  placeholder="Search sub-center, transaction type, or notes..."
                  hide-details
                  density="compact"
                  variant="outlined"
                  style="max-width: 320px;"
                  clearable
                ></v-text-field>
                <v-select
                  v-model="auditTypeFilter"
                  :items="[
                    { title: 'All Types', value: 'all' },
                    { title: 'Purchase', value: 'purchase' },
                    { title: 'Consumption', value: 'consumption' },
                    { title: 'Refund', value: 'refund' }
                  ]"
                  hide-details
                  density="compact"
                  variant="outlined"
                  style="max-width: 170px;"
                ></v-select>
              </div>
              <v-data-table
                :headers="auditHeaders"
                :items="filteredAuditTransactions"
                :loading="loadingAudit"
                class="elevation-0"
              >
                <template v-slot:item.type="{ item }: any">
                  <v-chip :color="getTxTypeColor(item.type)" size="small" variant="flat" class="text-uppercase font-weight-bold">
                    {{ item.type }}
                  </v-chip>
                </template>
                <template v-slot:item.token_count="{ item }: any">
                  <span :class="item.token_count > 0 ? 'text-success font-weight-bold' : 'text-error font-weight-bold'">
                    {{ item.token_count > 0 ? '+' : '' }}{{ item.token_count }}
                  </span>
                </template>
                <template v-slot:item.created_at="{ item }: any">
                  {{ formatDate(item.created_at) }}
                </template>
              </v-data-table>
            </v-card>
          </v-window-item>

        </v-window>

    <!-- MODALS -->
    <!-- Create Sub-Center Modal -->
    <v-dialog v-model="showAddOrgModal" max-width="500">
      <v-card class="pa-4 rounded-xl">
        <v-card-title class="text-h6 font-weight-bold">Create New Sub-Center</v-card-title>
        <v-card-text>
          <v-form ref="orgForm">
            <v-text-field v-model="newOrg.name" label="Sub-Center Name" required variant="outlined" class="mb-2"></v-text-field>
            <v-text-field v-model="newOrg.contact_email" label="Contact Email" type="email" required variant="outlined" class="mb-2"></v-text-field>
            <v-text-field v-model="newOrg.contact_phone" label="Contact Phone" variant="outlined"></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="showAddOrgModal = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="savingOrg" @click="createOrganization">Create Sub-Center</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Create/Edit Exam Modal -->
    <v-dialog v-model="showAddExamModal" max-width="550">
      <v-card class="pa-4 rounded-xl">
        <v-card-title class="text-h6 font-weight-bold">{{ editingExam ? 'Edit Exam' : 'Create Catalog Exam' }}</v-card-title>
        <v-card-text>
          <v-form>
            <v-text-field v-model="examForm.name" label="Exam Title" required variant="outlined" class="mb-2"></v-text-field>
            <v-textarea v-model="examForm.description" label="Description" variant="outlined" class="mb-2" rows="3"></v-textarea>
            <v-row>
              <v-col cols="6">
                <v-text-field v-model.number="examForm.duration_minutes" label="Duration (Minutes)" type="number" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="examForm.max_attempts" label="Max Attempts Limit" type="number" variant="outlined" hint="Admin-set cap"></v-text-field>
              </v-col>
            </v-row>
            <v-select v-if="editingExam" v-model="examForm.status" :items="['active', 'retired']" label="Status" variant="outlined" class="mt-2"></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="showAddExamModal = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="savingExam" @click="saveExam">Save Exam</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Create Package Modal -->
    <v-dialog v-model="showAddPkgModal" max-width="500">
      <v-card class="pa-4 rounded-xl">
        <v-card-title class="text-h6 font-weight-bold">Create Token Package</v-card-title>
        <v-card-text>
          <v-form>
            <v-text-field v-model="pkgForm.name" label="Package Name" required variant="outlined" class="mb-2"></v-text-field>
            <v-row>
              <v-col cols="6">
                <v-text-field v-model.number="pkgForm.token_count" label="Token Count" type="number" required variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="pkgForm.price" label="Price ($)" type="number" required variant="outlined"></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="showAddPkgModal = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="savingPkg" @click="createPackage">Create Package</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useApi } from '@/composables/useApi';

const api = useApi();
const route = useRoute();
const config = useRuntimeConfig();
const activeTab = ref(route.query.tab ? String(route.query.tab) : 'overview');

const currentTitle = computed(() => {
  switch (activeTab.value) {
    case 'subcenters': return 'Sub-Center Accounts';
    case 'exams': return 'Certification Exam Catalog';
    case 'packages': return 'Token Packages Catalog';
    case 'audit': return 'Global Token Audit Trail';
    case 'overview':
    default:
      return 'Live Batches Feed';
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

// Search & Filter state
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
    list = list.filter((e: any) => (e.title || e.name || '').toLowerCase().includes(q));
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

// Headers
const batchHeaders = [
  { title: 'Sub-Center', key: 'org_name' },
  { title: 'Exam Title', key: 'exam_name' },
  { title: 'Status', key: 'status' },
  { title: 'Student Sitting Metrics', key: 'stats' },
  { title: 'Created At', key: 'created_at' }
];

const orgHeaders = [
  { title: 'Sub-Center Name', key: 'name' },
  { title: 'Contact Email', key: 'contact_email' },
  { title: 'Contact Phone', key: 'contact_phone' },
  { title: 'Status', key: 'status' },
  { title: 'Wallet Tokens Summary', key: 'tokens' },
  { title: 'Actions', key: 'actions', sortable: false }
];

const examHeaders = [
  { title: 'Exam Name', key: 'name' },
  { title: 'Duration (Mins)', key: 'duration_minutes' },
  { title: 'Max Attempts Cap', key: 'max_attempts' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false }
];

const packageHeaders = [
  { title: 'Package Name', key: 'name' },
  { title: 'Token Count', key: 'token_count' },
  { title: 'Price', key: 'price' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false }
];

const auditHeaders = [
  { title: 'Sub-Center', key: 'org_name' },
  { title: 'Transaction Type', key: 'type' },
  { title: 'Token Count', key: 'token_count' },
  { title: 'Package', key: 'package_name' },
  { title: 'Timestamp', key: 'created_at' }
];

let pollInterval: any = null;

onMounted(() => {
  fetchAllData();
  // Poll every 5 seconds for real-time live feed update
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

function openEditExamModal(exam: any) {
  editingExam.value = exam;
  examForm.value = { ...exam };
  showAddExamModal.value = true;
}

async function saveExam() {
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
  savingPkg.value = true;
  try {
    await api.post('/main-admin/token-packages', pkgForm.value);
    showAddPkgModal.value = false;
    pkgForm.value = { name: '', token_count: 50, price: 500 };
    fetchPackages();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to create package');
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
    const { data } = await api.get('/main-admin/audit-transactions');
    auditTransactions.value = data;
  } catch (err) {
    console.error(err);
  } finally {
    loadingAudit.value = false;
  }
}

// Helpers
function getBatchStatusColor(status: string) {
  switch (status) {
    case 'open': return 'success';
    case 'closed': return 'grey';
    case 'cancelled': return 'error';
    default: return 'info';
  }
}

function getTxTypeColor(type: string) {
  switch (type) {
    case 'purchase': return 'success';
    case 'consume': return 'warning';
    case 'refund_unused': return 'purple';
    case 'refund_edit_removal': return 'info';
    default: return 'grey';
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
}

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'main_admin']
});
</script>

<style scoped>
.pulse-icon {
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
}

.metric-card {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(226, 232, 240, 0.8) !important;
  background: #ffffff !important;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -6px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.03) !important;
}

.metric-indigo:hover { border-color: #a5b4fc !important; }
.metric-emerald:hover { border-color: #6ee7b7 !important; }
.metric-amber:hover { border-color: #fde68a !important; }
.metric-purple:hover { border-color: #d8b4fe !important; }

.tracking-wider {
  letter-spacing: 0.05em;
}
</style>
