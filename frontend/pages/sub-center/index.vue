<template>
  <v-container fluid class="py-8 px-6 bg-grey-lighten-4 min-vh-100">
    <!-- Sub-Center Header & Wallet Quick Bar -->
    <v-row class="mb-6 align-center">
      <v-col cols="12" md="7">
        <div class="d-flex align-center gap-4">
          <div class="rounded-circle bg-teal-darken-2 d-flex align-center justify-center elevation-2" style="width: 48px; height: 48px; min-width: 48px;">
            <v-icon icon="mdi-school" size="28" color="white"></v-icon>
          </div>
          <div>
            <h1 class="text-h4 font-weight-bold text-slate-900 mb-1">
              Sub-Center Administration Portal
            </h1>
            <p class="text-subtitle-1 text-grey-darken-1 mb-0">
              Student Registration • Token Wallet • Batch Exam Management • Retries & Dedicated Links
            </p>
          </div>
        </div>
      </v-col>

      <!-- Token Wallet Card -->
      <v-col cols="12" md="5">
        <v-card class="pa-4 rounded-xl elevation-2 bg-gradient-teal border-0">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-caption font-weight-bold text-uppercase text-white opacity-80">Token Wallet Balance</div>
              <div class="d-flex align-baseline gap-2 mt-1">
                <span class="text-h3 font-weight-black text-white">{{ wallet.totalRemaining || 0 }}</span>
                <span class="text-subtitle-2 text-white font-weight-medium">Tokens Available</span>
              </div>
              <div class="text-caption text-white opacity-90 mt-1">
                Purchased: {{ wallet.totalPurchased || 0 }} • Consumed: {{ wallet.totalUsed || 0 }}
              </div>
            </div>
            <v-btn color="amber-darken-2" size="large" variant="elevated" class="font-weight-bold" prepend-icon="mdi-cart-plus" @click="showStoreModal = true">
              Buy Tokens
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Sub-Center Navigation Tabs -->
    <v-card class="elevation-1 rounded-lg mb-6">
      <v-tabs v-model="activeTab" color="teal-darken-2" align-tabs="start" class="border-b">
        <v-tab value="batches" class="text-none text-body-1 font-weight-bold py-3">
          <v-icon start icon="mdi-subtitles-outline"></v-icon>
          Batches & Exam Enrollments
        </v-tab>
        <v-tab value="students" class="text-none text-body-1 font-weight-bold py-3">
          <v-icon start icon="mdi-account-group"></v-icon>
          Student Directory
        </v-tab>
        <v-tab value="wallet" class="text-none text-body-1 font-weight-bold py-3">
          <v-icon start icon="mdi-wallet-outline"></v-icon>
          Wallet & Store History
        </v-tab>
      </v-tabs>

      <v-card-text class="pa-6">
        <v-window v-model="activeTab">
          
          <!-- TAB 1: BATCHES & EXAM ENROLLMENTS -->
          <v-window-item value="batches">
            <div class="d-flex justify-space-between align-center mb-4">
              <div>
                <h3 class="text-h6 font-weight-bold">Exam Batches</h3>
                <p class="text-body-2 text-grey">Create batches to enroll your students in main authority certification exams.</p>
              </div>
              <v-btn color="teal-darken-2" prepend-icon="mdi-plus" size="large" @click="openCreateBatchModal">
                Create Exam Batch
              </v-btn>
            </div>

            <v-card variant="outlined" class="rounded-lg border mb-6">
              <v-data-table
                :headers="batchHeaders"
                :items="batches"
                :loading="loadingBatches"
                class="elevation-0"
              >
                <template v-slot:no-data>
                  <div class="text-center py-10 px-4">
                    <div class="rounded-circle bg-teal-50 d-inline-flex align-center justify-center mb-3 pa-4">
                      <v-icon size="40" color="teal-darken-2">mdi-clipboard-text-outline</v-icon>
                    </div>
                    <div class="text-subtitle-1 font-weight-bold text-slate-800">No Batches Created Yet</div>
                    <div class="text-caption text-slate-500 max-w-xs mx-auto mb-4">
                      Create your first student exam batch to spend tokens and enroll students.
                    </div>
                    <v-btn color="teal-darken-2" size="small" prepend-icon="mdi-plus" @click="showAddBatchModal = true">
                      Create New Batch
                    </v-btn>
                  </div>
                </template>
                <template v-slot:item.status="{ item }: any">
                  <v-chip :color="getBatchStatusColor(item.status)" size="small" variant="flat" class="text-uppercase font-weight-bold">
                    {{ item.status }}
                  </v-chip>
                </template>
                <template v-slot:item.student_count="{ item }: any">
                  <v-chip size="small" color="info" variant="tonal">
                    {{ item.student_count || 0 }} Students
                  </v-chip>
                </template>
                <template v-slot:item.actions="{ item }: any">
                  <div class="d-flex gap-2">
                    <v-btn size="small" color="teal-darken-2" variant="tonal" @click="viewBatchDetails(item)">
                      View Assignments
                    </v-btn>
                    <v-btn
                      v-if="item.status === 'open'"
                      size="small"
                      color="warning"
                      variant="tonal"
                      @click="openEditBatchModal(item)"
                    >
                      Edit
                    </v-btn>
                    <v-btn
                      v-if="item.status === 'open'"
                      size="small"
                      color="error"
                      variant="tonal"
                      @click="cancelBatch(item)"
                    >
                      Cancel
                    </v-btn>
                  </div>
                </template>
              </v-data-table>
            </v-card>

            <!-- BATCH ASSIGNMENT DETAILS VIEW (WHEN SELECTED) -->
            <v-card v-if="selectedBatch" variant="outlined" class="rounded-lg border pa-4 bg-white">
              <div class="d-flex justify-space-between align-center mb-4">
                <div>
                  <h3 class="text-h6 font-weight-bold text-teal-darken-3">
                    Batch Details: {{ selectedBatch.exam_name }}
                  </h3>
                  <span class="text-caption text-grey">Batch ID: {{ selectedBatch.id }}</span>
                </div>
                <v-btn icon="mdi-close" variant="text" size="small" @click="selectedBatch = null"></v-btn>
              </div>

              <v-data-table
                :headers="assignmentHeaders"
                :items="batchAssignments"
                :loading="loadingAssignments"
                class="elevation-0"
              >
                <template v-slot:item.attempts="{ item }: any">
                  <v-chip size="small" :color="item.attempts_used >= item.max_attempts ? 'error' : 'info'" variant="tonal">
                    {{ item.attempts_used }} / {{ item.max_attempts }}
                  </v-chip>
                </template>
                <template v-slot:item.status="{ item }: any">
                  <v-chip :color="getAssignmentStatusColor(item.status)" size="small" variant="flat" class="text-uppercase font-weight-bold">
                    {{ item.status }}
                  </v-chip>
                  <v-chip v-if="item.is_retry_link" size="x-small" color="purple" variant="outlined" class="ms-1">
                    Dedicated Link
                  </v-chip>
                </template>
                <template v-slot:item.actions="{ item }: any">
                  <div class="d-flex gap-2">
                    <!-- Manual Technical Retry -->
                    <v-btn
                      v-if="item.attempts_used < item.max_attempts && ['not_started', 'in_progress', 'failed'].includes(item.status)"
                      size="small"
                      color="warning"
                      variant="flat"
                      prepend-icon="mdi-restart"
                      @click="grantTechnicalRetry(item)"
                    >
                      Grant Tech Retry
                    </v-btn>

                    <!-- Dedicated Single-Student Retry Link (for failed assignments) -->
                    <v-btn
                      v-if="item.status === 'failed'"
                      size="small"
                      color="purple-darken-1"
                      variant="flat"
                      prepend-icon="mdi-link-plus"
                      @click="openRetryLinkModal(item)"
                    >
                      Create Retry Link
                    </v-btn>

                    <!-- Uniform Certificate Download -->
                    <v-btn
                      v-if="item.status === 'passed' && item.certificate_url"
                      size="small"
                      color="success"
                      variant="tonal"
                      prepend-icon="mdi-certificate"
                      :href="item.certificate_url"
                      target="_blank"
                    >
                      Certificate
                    </v-btn>
                  </div>
                </template>
              </v-data-table>
            </v-card>
          </v-window-item>

          <!-- TAB 2: STUDENT DIRECTORY -->
          <v-window-item value="students">
            <div class="d-flex justify-space-between align-center mb-4">
              <div>
                <h3 class="text-h6 font-weight-bold">Registered Students</h3>
                <p class="text-body-2 text-grey">Students registered specifically under your sub-center.</p>
              </div>
              <v-btn color="teal-darken-2" prepend-icon="mdi-account-plus" size="large" @click="showAddStudentModal = true">
                Register Student
              </v-btn>
            </div>

            <v-card variant="outlined" class="rounded-lg border">
              <v-data-table
                :headers="studentHeaders"
                :items="students"
                :loading="loadingStudents"
                class="elevation-0"
              >
                <template v-slot:item.created_at="{ item }: any">
                  {{ formatDate(item.created_at) }}
                </template>
              </v-data-table>
            </v-card>
          </v-window-item>

          <!-- TAB 3: WALLET & STORE HISTORY -->
          <v-window-item value="wallet">
            <div class="d-flex justify-space-between align-center mb-4">
              <div>
                <h3 class="text-h6 font-weight-bold">Token Wallet & Store</h3>
                <p class="text-body-2 text-grey">Purchase token packages and view your wallet audit log.</p>
              </div>
              <v-btn color="amber-darken-2" prepend-icon="mdi-cart-plus" size="large" @click="showStoreModal = true">
                Buy Token Packages
              </v-btn>
            </div>

            <v-card variant="outlined" class="rounded-lg border">
              <v-card-title class="pa-4 bg-grey-lighten-4 border-b font-weight-bold text-subtitle-1">
                Transaction Audit Trail
              </v-card-title>
              <v-data-table
                :headers="txHeaders"
                :items="transactions"
                :loading="loadingTransactions"
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
      </v-card-text>
    </v-card>

    <!-- MODALS -->

    <!-- Token Store Modal -->
    <v-dialog v-model="showStoreModal" max-width="650">
      <v-card class="pa-4 rounded-xl">
        <v-card-title class="text-h6 font-weight-bold">Purchase Token Packages</v-card-title>
        <v-card-text>
          <v-row class="mt-2">
            <v-col v-for="pkg in availablePackages" :key="pkg.id" cols="12" sm="4">
              <v-card variant="outlined" class="pa-4 rounded-lg text-center h-100 d-flex flex-column justify-space-between border-teal">
                <div>
                  <div class="text-subtitle-1 font-weight-bold text-teal-darken-3">{{ pkg.name }}</div>
                  <div class="text-h4 font-weight-black my-2 text-amber-darken-3">{{ pkg.token_count }}</div>
                  <div class="text-caption text-grey">Tokens</div>
                  <div class="text-h6 font-weight-bold text-success mt-3">${{ Number(pkg.price).toFixed(2) }}</div>
                </div>
                <v-btn color="teal-darken-2" class="mt-4 font-weight-bold" variant="flat" block @click="buyTokenPackage(pkg.id)" :loading="buyingPkg">
                  Purchase
                </v-btn>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="showStoreModal = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Register Student Modal -->
    <v-dialog v-model="showAddStudentModal" max-width="500">
      <v-card class="pa-4 rounded-xl">
        <v-card-title class="text-h6 font-weight-bold">Register Student</v-card-title>
        <v-card-text>
          <v-form>
            <v-text-field v-model="studentForm.name" label="Student Full Name" required variant="outlined" class="mb-2"></v-text-field>
            <v-text-field v-model="studentForm.email" label="Email Address" type="email" required variant="outlined" class="mb-2"></v-text-field>
            <v-text-field v-model="studentForm.phone" label="Phone Number" variant="outlined"></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="showAddStudentModal = false">Cancel</v-btn>
          <v-btn color="teal-darken-2" variant="flat" :loading="savingStudent" @click="registerStudent">Register</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Create Batch Modal -->
    <v-dialog v-model="showCreateBatchModal" max-width="650">
      <v-card class="pa-4 rounded-xl">
        <v-card-title class="text-h6 font-weight-bold">Create Exam Batch</v-card-title>
        <v-card-text>
          <!-- Shortfall Warning Banner -->
          <v-alert
            v-if="batchShortfall > 0"
            type="warning"
            variant="tonal"
            class="mb-4 rounded-lg"
          >
            <div class="d-flex justify-space-between align-center">
              <div>
                <strong>Insufficient Token Balance!</strong><br />
                Selected Students: {{ batchForm.student_ids.length }} | Available Tokens: {{ wallet.totalRemaining }}<br />
                Shortfall: <strong>{{ batchShortfall }} tokens</strong>
              </div>
              <v-btn color="amber-darken-3" size="small" variant="flat" @click="showStoreModal = true">Buy Tokens</v-btn>
            </div>
          </v-alert>

          <v-form>
            <v-select
              v-model="batchForm.exam_id"
              :items="exams"
              item-title="name"
              item-value="id"
              label="Select Certification Exam"
              variant="outlined"
              class="mb-2"
            ></v-select>

            <v-select
              v-model="batchForm.student_ids"
              :items="students"
              item-title="name"
              item-value="id"
              label="Select Students for Enrollment"
              multiple
              chips
              variant="outlined"
              class="mb-2"
            ></v-select>

            <v-row>
              <v-col cols="6">
                <v-text-field v-model="batchForm.opens_at" label="Opens At" type="datetime-local" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="batchForm.closes_at" label="Closes At (Fixed Window)" type="datetime-local" variant="outlined"></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="showCreateBatchModal = false">Cancel</v-btn>
          <v-btn
            color="teal-darken-2"
            variant="flat"
            :disabled="batchShortfall > 0 || batchForm.student_ids.length === 0 || !batchForm.exam_id"
            :loading="savingBatch"
            @click="submitCreateBatch"
          >
            Submit & Spend Tokens
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Create Dedicated Single-Student Retry Link Modal -->
    <v-dialog v-model="showRetryLinkModal" max-width="500">
      <v-card class="pa-4 rounded-xl">
        <v-card-title class="text-h6 font-weight-bold">Create Single-Student Retry Link</v-card-title>
        <v-card-text>
          <p class="text-body-2 text-grey mb-4">
            Generates a dedicated single-student retry link tied to the original batch. Consumes <strong>1 token</strong> from your wallet.
          </p>
          <v-text-field v-model="retryLinkExpiresAt" label="Link Expiration Date/Time (Optional)" type="datetime-local" variant="outlined"></v-text-field>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="showRetryLinkModal = false">Cancel</v-btn>
          <v-btn color="purple-darken-1" variant="flat" :loading="creatingRetryLink" @click="submitDedicatedRetryLink">
            Generate Link & Spend 1 Token
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const config = useRuntimeConfig();
const activeTab = ref('batches');

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
});

async function fetchWallet() {
  try {
    wallet.value = await $fetch<any>(`${config.public.apiBase}/sub-center/wallet`, { credentials: 'include' });
  } catch (err) {
    console.error('Error fetching wallet', err);
  }
}

async function fetchStudents() {
  loadingStudents.value = true;
  try {
    students.value = await $fetch<any[]>(`${config.public.apiBase}/sub-center/students`, { credentials: 'include' });
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
    await $fetch(`${config.public.apiBase}/sub-center/students`, {
      method: 'POST',
      body: studentForm.value,
      credentials: 'include'
    });
    showAddStudentModal.value = false;
    studentForm.value = { name: '', email: '', phone: '' };
    fetchStudents();
  } catch (err: any) {
    alert(err.message || 'Failed to register student');
  } finally {
    savingStudent.value = false;
  }
}

async function fetchAvailablePackages() {
  try {
    availablePackages.value = await $fetch<any[]>(`${config.public.apiBase}/sub-center/token-packages`, { credentials: 'include' });
  } catch (err) {
    console.error(err);
  }
}

async function buyTokenPackage(packageId: string) {
  buyingPkg.value = true;
  try {
    await $fetch(`${config.public.apiBase}/sub-center/packages/purchase`, {
      method: 'POST',
      body: { package_id: packageId },
      credentials: 'include'
    });
    showStoreModal.value = false;
    fetchWallet();
    fetchTransactions();
    alert('Token package purchased successfully!');
  } catch (err: any) {
    alert(err.message || 'Failed to purchase tokens');
  } finally {
    buyingPkg.value = false;
  }
}

async function fetchTransactions() {
  loadingTransactions.value = true;
  try {
    transactions.value = await $fetch<any[]>(`${config.public.apiBase}/sub-center/transactions`, { credentials: 'include' });
  } catch (err) {
    console.error(err);
  } finally {
    loadingTransactions.value = false;
  }
}

async function fetchExams() {
  try {
    exams.value = await $fetch<any[]>(`${config.public.apiBase}/sub-center/exams`, { credentials: 'include' });
  } catch (err) {
    console.error(err);
  }
}

async function fetchBatches() {
  loadingBatches.value = true;
  try {
    batches.value = await $fetch<any[]>(`${config.public.apiBase}/sub-center/batches`, { credentials: 'include' });
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
    await $fetch(`${config.public.apiBase}/sub-center/batches`, {
      method: 'POST',
      body: batchForm.value,
      credentials: 'include'
    });
    showCreateBatchModal.value = false;
    fetchBatches();
    fetchWallet();
    fetchTransactions();
  } catch (err: any) {
    alert(err.message || 'Failed to create batch');
  } finally {
    savingBatch.value = false;
  }
}

async function cancelBatch(batch: any) {
  if (!confirm('Are you sure you want to cancel this batch? Unstarted tokens will be instantly refunded.')) return;
  try {
    await $fetch(`${config.public.apiBase}/sub-center/batches/${batch.id}/cancel`, {
      method: 'POST',
      credentials: 'include'
    });
    fetchBatches();
    fetchWallet();
    fetchTransactions();
  } catch (err: any) {
    alert(err.message || 'Failed to cancel batch');
  }
}

async function viewBatchDetails(batch: any) {
  selectedBatch.value = batch;
  loadingAssignments.value = true;
  try {
    const res = await $fetch<any>(`${config.public.apiBase}/sub-center/batches/${batch.id}`, { credentials: 'include' });
    batchAssignments.value = res.assignments;
  } catch (err) {
    console.error(err);
  } finally {
    loadingAssignments.value = false;
  }
}

async function grantTechnicalRetry(item: any) {
  if (!confirm('Grant technical retry for this assignment?')) return;
  try {
    await $fetch(`${config.public.apiBase}/sub-center/assignments/${item.id}/grant-retry`, {
      method: 'POST',
      credentials: 'include'
    });
    if (selectedBatch.value) viewBatchDetails(selectedBatch.value);
  } catch (err: any) {
    alert(err.message || 'Failed to grant technical retry');
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
    await $fetch(`${config.public.apiBase}/sub-center/assignments/${targetAssignmentForRetryLink.value.id}/retry-link`, {
      method: 'POST',
      body: { expires_at: retryLinkExpiresAt.value || null },
      credentials: 'include'
    });
    showRetryLinkModal.value = false;
    fetchWallet();
    fetchTransactions();
    if (selectedBatch.value) viewBatchDetails(selectedBatch.value);
    alert('Single-student retry link created successfully!');
  } catch (err: any) {
    alert(err.message || 'Failed to create dedicated retry link');
  } finally {
    creatingRetryLink.value = false;
  }
}

function openEditBatchModal(batch: any) {
  alert('Use batch assignment controls or edit form to adjust student enrollments.');
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

function getAssignmentStatusColor(status: string) {
  switch (status) {
    case 'passed': return 'success';
    case 'failed': return 'error';
    case 'in_progress': return 'warning';
    case 'not_started': return 'info';
    default: return 'grey';
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
  role: ['super_admin', 'sub_center_staff']
});
</script>

<style scoped>
.bg-gradient-teal {
  background: linear-gradient(135deg, #0d9488 0%, #115e59 100%);
}
.border-teal {
  border-color: #0d9488 !important;
}
</style>
