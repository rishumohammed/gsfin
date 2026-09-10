<template>
  <div class="subcenter-dashboard min-h-screen pb-12" style="background-color: #FAFAFD;">
    <!-- Page Header & Quick Wallet Bar -->
    <div class="bg-white border-b border-slate-200/80 shadow-xs mb-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div class="flex items-center gap-4">
            <div class="w-13 h-13 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-md shadow-red-500/20">
              <v-icon icon="mdi-shield-home" size="28" color="white"></v-icon>
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Sub-Center Administration
                </h1>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                  Partner Portal
                </span>
              </div>
              <p class="text-xs sm:text-sm text-slate-500 font-medium">
                Student Registrations • Exam Batches • Token Wallet • Retry Links & Certificates
              </p>
            </div>
          </div>

          <!-- Token Wallet Card Header Summary -->
          <div class="flex items-center gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-slate-800 min-w-[320px] justify-between">
            <div>
              <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Token Wallet Balance</div>
              <div class="flex items-baseline gap-2 mt-0.5">
                <span class="text-3xl font-black text-white">{{ wallet.totalRemaining || 0 }}</span>
                <span class="text-xs font-semibold text-slate-300">Tokens Available</span>
              </div>
              <div class="text-[11px] text-slate-400 mt-1">
                Purchased: <strong class="text-white">{{ wallet.totalPurchased || 0 }}</strong> • Used: <strong class="text-white">{{ wallet.totalUsed || 0 }}</strong>
              </div>
            </div>
            <v-btn
              color="#E31B23"
              size="medium"
              class="font-bold text-white text-none rounded-xl shadow-md hover:bg-red-700"
              prepend-icon="mdi-cart-plus"
              @click="showStoreModal = true"
            >
              Buy Tokens
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Container -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      <!-- Navigation Tabs Container -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
        <!-- Sub-Center Custom Light Tab Bar -->
        <div class="flex border-b border-slate-200/80 bg-slate-50/60 px-4 pt-3 gap-2 overflow-x-auto">
          <button
            @click="activeTab = 'batches'"
            :class="[
              'px-5 py-3 text-sm font-bold rounded-t-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap border-b-2',
              activeTab === 'batches'
                ? 'bg-white text-red-600 border-red-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
            ]"
          >
            <v-icon icon="mdi-subtitles-outline" size="18" :color="activeTab === 'batches' ? '#E31B23' : '#64748B'"></v-icon>
            Batches & Enrollments
            <span class="ml-1 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-semibold">
              {{ batches.length }}
            </span>
          </button>

          <button
            @click="activeTab = 'students'"
            :class="[
              'px-5 py-3 text-sm font-bold rounded-t-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap border-b-2',
              activeTab === 'students'
                ? 'bg-white text-red-600 border-red-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
            ]"
          >
            <v-icon icon="mdi-account-group" size="18" :color="activeTab === 'students' ? '#E31B23' : '#64748B'"></v-icon>
            Student Directory
            <span class="ml-1 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-semibold">
              {{ students.length }}
            </span>
          </button>

          <button
            @click="activeTab = 'wallet'"
            :class="[
              'px-5 py-3 text-sm font-bold rounded-t-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap border-b-2',
              activeTab === 'wallet'
                ? 'bg-white text-red-600 border-red-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
            ]"
          >
            <v-icon icon="mdi-wallet-outline" size="18" :color="activeTab === 'wallet' ? '#E31B23' : '#64748B'"></v-icon>
            Wallet Audit & Store
          </button>
        </div>

        <div class="p-6">
          <!-- TAB 1: BATCHES & EXAM ENROLLMENTS -->
          <div v-if="activeTab === 'batches'">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 class="text-lg font-bold text-slate-900">Exam Batches & Enrollments</h2>
                <p class="text-xs sm:text-sm text-slate-500">
                  Create exam batches to assign candidates for certification exams using your token wallet.
                </p>
              </div>
              <v-btn
                color="#E31B23"
                size="large"
                class="font-bold text-white text-none rounded-xl shadow-md hover:bg-red-700"
                prepend-icon="mdi-plus"
                @click="openCreateBatchModal"
              >
                Create Exam Batch
              </v-btn>
            </div>

            <!-- Batches Table Card -->
            <div class="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs mb-8">
              <v-data-table
                :headers="batchHeaders"
                :items="batches"
                :loading="loadingBatches"
                class="elevation-0 gsfin-table"
              >
                <template v-slot:no-data>
                  <div class="text-center py-12 px-4">
                    <div class="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-xs">
                      <v-icon size="36" color="#E31B23">mdi-clipboard-text-outline</v-icon>
                    </div>
                    <h3 class="text-base font-bold text-slate-900">No Exam Batches Created</h3>
                    <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Create your first student exam batch to spend tokens and enroll candidates for certification exams.
                    </p>
                    <v-btn
                      color="#E31B23"
                      size="small"
                      class="font-bold text-white text-none rounded-lg"
                      prepend-icon="mdi-plus"
                      @click="openCreateBatchModal"
                    >
                      Create Batch
                    </v-btn>
                  </div>
                </template>

                <template v-slot:item.exam_name="{ item }: any">
                  <div class="font-bold text-slate-900 py-2">{{ item.exam_name }}</div>
                </template>

                <template v-slot:item.status="{ item }: any">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider',
                      item.status === 'open' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      item.status === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    ]"
                  >
                    {{ item.status }}
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
                  <div class="flex items-center gap-2 py-1">
                    <v-btn
                      size="small"
                      variant="outlined"
                      color="slate"
                      class="text-none font-bold rounded-lg text-slate-700 border-slate-300"
                      @click="viewBatchDetails(item)"
                    >
                      View Assignments
                    </v-btn>
                    <v-btn
                      v-if="item.status === 'open'"
                      size="small"
                      variant="tonal"
                      color="error"
                      class="text-none font-bold rounded-lg"
                      @click="cancelBatch(item)"
                    >
                      Cancel
                    </v-btn>
                  </div>
                </template>
              </v-data-table>
            </div>

            <!-- BATCH ASSIGNMENT DETAILS VIEW (WHEN SELECTED) -->
            <div v-if="selectedBatch" class="border border-red-200 rounded-2xl p-6 bg-red-50/20 shadow-sm transition-all duration-300">
              <div class="flex items-center justify-between mb-6 pb-4 border-b border-red-100">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">Selected Batch</span>
                    <h3 class="text-lg font-bold text-slate-900">
                      {{ selectedBatch.exam_name }}
                    </h3>
                  </div>
                  <p class="text-xs text-slate-500 mt-0.5">Batch ID: <code class="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{{ selectedBatch.id }}</code></p>
                </div>
                <button @click="selectedBatch = null" class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors">
                  <v-icon icon="mdi-close" size="18"></v-icon>
                </button>
              </div>

              <div class="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
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
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider',
                          item.status === 'passed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          item.status === 'failed' ? 'bg-red-50 text-red-700 border border-red-200' :
                          item.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        ]"
                      >
                        {{ item.status }}
                      </span>
                      <span v-if="item.is_retry_link" class="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-50 text-purple-700 border border-purple-200">
                        Dedicated Link
                      </span>
                    </div>
                  </template>
                  <template v-slot:item.actions="{ item }: any">
                    <div class="flex items-center gap-2 py-1">
                      <!-- Manual Technical Retry -->
                      <v-btn
                        v-if="item.attempts_used < item.max_attempts && ['not_started', 'in_progress', 'failed'].includes(item.status)"
                        size="small"
                        color="#D97706"
                        class="text-none font-bold text-white rounded-lg shadow-xs"
                        prepend-icon="mdi-restart"
                        @click="grantTechnicalRetry(item)"
                      >
                        Grant Tech Retry
                      </v-btn>

                      <!-- Dedicated Single-Student Retry Link (for failed assignments) -->
                      <v-btn
                        v-if="item.status === 'failed'"
                        size="small"
                        color="#7C3AED"
                        class="text-none font-bold text-white rounded-lg shadow-xs"
                        prepend-icon="mdi-link-plus"
                        @click="openRetryLinkModal(item)"
                      >
                        Create Retry Link
                      </v-btn>

                      <!-- Uniform Certificate Download -->
                      <v-btn
                        v-if="item.status === 'passed' && item.certificate_url"
                        size="small"
                        color="#10B981"
                        class="text-none font-bold text-white rounded-lg shadow-xs"
                        prepend-icon="mdi-certificate"
                        :href="item.certificate_url"
                        target="_blank"
                      >
                        Certificate
                      </v-btn>
                    </div>
                  </template>
                </v-data-table>
              </div>
            </div>
          </div>

          <!-- TAB 2: STUDENT DIRECTORY -->
          <div v-if="activeTab === 'students'">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 class="text-lg font-bold text-slate-900">Registered Students</h2>
                <p class="text-xs sm:text-sm text-slate-500">
                  Directory of candidate students registered under your sub-center.
                </p>
              </div>
              <v-btn
                color="#E31B23"
                size="large"
                class="font-bold text-white text-none rounded-xl shadow-md hover:bg-red-700"
                prepend-icon="mdi-account-plus"
                @click="showAddStudentModal = true"
              >
                Register Student
              </v-btn>
            </div>

            <div class="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs">
              <v-data-table
                :headers="studentHeaders"
                :items="students"
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
                  <span class="text-xs text-slate-600 font-medium">{{ item.phone || '-' }}</span>
                </template>
                <template v-slot:item.created_at="{ item }: any">
                  <span class="text-xs text-slate-500 font-medium">{{ formatDate(item.created_at) }}</span>
                </template>
              </v-data-table>
            </div>
          </div>

          <!-- TAB 3: WALLET & STORE HISTORY -->
          <div v-if="activeTab === 'wallet'">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 class="text-lg font-bold text-slate-900">Token Wallet & Store</h2>
                <p class="text-xs sm:text-sm text-slate-500">
                  Purchase token packages and view your wallet audit log.
                </p>
              </div>
              <v-btn
                color="#E31B23"
                size="large"
                class="font-bold text-white text-none rounded-xl shadow-md hover:bg-red-700"
                prepend-icon="mdi-cart-plus"
                @click="showStoreModal = true"
              >
                Buy Token Packages
              </v-btn>
            </div>

            <div class="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs">
              <div class="px-6 py-4 bg-slate-50 border-b border-slate-200/80 font-bold text-slate-900 text-sm">
                Transaction Audit Trail
              </div>
              <v-data-table
                :headers="txHeaders"
                :items="transactions"
                :loading="loadingTransactions"
                class="elevation-0 gsfin-table"
              >
                <template v-slot:item.type="{ item }: any">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider',
                      item.type === 'purchase' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      item.type === 'consume' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-purple-50 text-purple-700 border border-purple-200'
                    ]"
                  >
                    {{ item.type }}
                  </span>
                </template>
                <template v-slot:item.token_count="{ item }: any">
                  <span :class="item.token_count > 0 ? 'text-emerald-600 font-black' : 'text-red-600 font-black'">
                    {{ item.token_count > 0 ? '+' : '' }}{{ item.token_count }}
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
      </div>
    </div>

    <!-- MODALS -->

    <!-- Token Store Modal -->
    <v-dialog v-model="showStoreModal" max-width="700">
      <div class="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/80">
        <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/80">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <v-icon icon="mdi-cart-plus" color="#E31B23" size="24"></v-icon>
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900">Purchase Token Packages</h3>
              <p class="text-xs text-slate-500">Tokens are spent when enrolling candidates in exam batches</p>
            </div>
          </div>
          <button @click="showStoreModal = false" class="text-slate-400 hover:text-slate-600">
            <v-icon icon="mdi-close" size="20"></v-icon>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div
            v-for="pkg in availablePackages"
            :key="pkg.id"
            class="border border-slate-200/80 rounded-2xl p-5 text-center flex flex-col justify-between hover:border-red-500 transition-colors bg-slate-50/50"
          >
            <div>
              <div class="text-sm font-bold text-slate-900">{{ pkg.name }}</div>
              <div class="text-3xl font-black text-red-600 my-2">{{ pkg.token_count }}</div>
              <div class="text-xs font-semibold uppercase tracking-wider text-slate-500">Tokens</div>
              <div class="text-xl font-bold text-slate-900 mt-3">${{ Number(pkg.price).toFixed(2) }}</div>
            </div>
            <v-btn
              color="#E31B23"
              class="mt-4 font-bold text-white text-none rounded-xl"
              variant="flat"
              block
              @click="buyTokenPackage(pkg.id)"
              :loading="buyingPkg"
            >
              Purchase
            </v-btn>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <v-btn variant="text" class="text-none font-bold text-slate-600" @click="showStoreModal = false">Close</v-btn>
        </div>
      </div>
    </v-dialog>

    <!-- Register Student Modal -->
    <v-dialog v-model="showAddStudentModal" max-width="500">
      <div class="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/80">
        <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/80">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <v-icon icon="mdi-account-plus" color="#E31B23" size="24"></v-icon>
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900">Register Student</h3>
              <p class="text-xs text-slate-500">Register candidate student for exam batch enrollment</p>
            </div>
          </div>
          <button @click="showAddStudentModal = false" class="text-slate-400 hover:text-slate-600">
            <v-icon icon="mdi-close" size="20"></v-icon>
          </button>
        </div>

        <form @submit.prevent="registerStudent" class="space-y-4">
          <v-text-field
            v-model="studentForm.name"
            label="Student Full Name *"
            required
            variant="outlined"
            density="compact"
            class="rounded-lg"
          ></v-text-field>

          <v-text-field
            v-model="studentForm.email"
            label="Email Address *"
            type="email"
            required
            variant="outlined"
            density="compact"
            class="rounded-lg"
          ></v-text-field>

          <v-text-field
            v-model="studentForm.phone"
            label="Phone Number (Optional)"
            variant="outlined"
            density="compact"
            class="rounded-lg"
          ></v-text-field>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <v-btn variant="text" class="text-none font-bold text-slate-600" @click="showAddStudentModal = false">Cancel</v-btn>
            <v-btn
              color="#E31B23"
              class="font-bold text-white text-none rounded-xl"
              :loading="savingStudent"
              type="submit"
            >
              Register Candidate
            </v-btn>
          </div>
        </form>
      </div>
    </v-dialog>

    <!-- Create Batch Modal -->
    <v-dialog v-model="showCreateBatchModal" max-width="650">
      <div class="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/80">
        <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/80">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <v-icon icon="mdi-plus" color="#E31B23" size="24"></v-icon>
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900">Create Exam Batch</h3>
              <p class="text-xs text-slate-500">1 candidate enrollment consumes 1 token</p>
            </div>
          </div>
          <button @click="showCreateBatchModal = false" class="text-slate-400 hover:text-slate-600">
            <v-icon icon="mdi-close" size="20"></v-icon>
          </button>
        </div>

        <!-- Shortfall Warning Banner -->
        <div
          v-if="batchShortfall > 0"
          class="p-4 mb-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4"
        >
          <div>
            <div class="font-bold text-sm">Insufficient Token Balance!</div>
            <div class="text-xs mt-0.5">
              Selected: <strong>{{ batchForm.student_ids.length }}</strong> | Available: <strong>{{ wallet.totalRemaining }}</strong> | Shortfall: <strong class="text-red-600">{{ batchShortfall }} tokens</strong>
            </div>
          </div>
          <v-btn
            color="#D97706"
            size="small"
            class="text-none font-bold text-white rounded-lg"
            @click="showStoreModal = true"
          >
            Buy Tokens
          </v-btn>
        </div>

        <form @submit.prevent="submitCreateBatch" class="space-y-4">
          <v-select
            v-model="batchForm.exam_id"
            :items="exams"
            item-title="name"
            item-value="id"
            label="Select Certification Exam *"
            variant="outlined"
            density="compact"
            class="rounded-lg"
          ></v-select>

          <v-select
            v-model="batchForm.student_ids"
            :items="students"
            item-title="name"
            item-value="id"
            label="Select Students for Enrollment *"
            multiple
            chips
            variant="outlined"
            density="compact"
            class="rounded-lg"
          ></v-select>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <v-text-field
              v-model="batchForm.opens_at"
              label="Opens At"
              type="datetime-local"
              variant="outlined"
              density="compact"
            ></v-text-field>

            <v-text-field
              v-model="batchForm.closes_at"
              label="Closes At (Fixed Window)"
              type="datetime-local"
              variant="outlined"
              density="compact"
            ></v-text-field>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <v-btn variant="text" class="text-none font-bold text-slate-600" @click="showCreateBatchModal = false">Cancel</v-btn>
            <v-btn
              color="#E31B23"
              class="font-bold text-white text-none rounded-xl"
              :disabled="batchShortfall > 0 || batchForm.student_ids.length === 0 || !batchForm.exam_id"
              :loading="savingBatch"
              type="submit"
            >
              Submit & Spend Tokens
            </v-btn>
          </div>
        </form>
      </div>
    </v-dialog>

    <!-- Create Dedicated Single-Student Retry Link Modal -->
    <v-dialog v-model="showRetryLinkModal" max-width="500">
      <div class="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/80">
        <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/80">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <v-icon icon="mdi-link-plus" color="#7C3AED" size="24"></v-icon>
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900">Create Dedicated Retry Link</h3>
              <p class="text-xs text-slate-500">Consumes 1 token from wallet</p>
            </div>
          </div>
          <button @click="showRetryLinkModal = false" class="text-slate-400 hover:text-slate-600">
            <v-icon icon="mdi-close" size="20"></v-icon>
          </button>
        </div>

        <p class="text-xs text-slate-600 mb-4">
          Generates a dedicated single-student retry link tied to the original batch for candidate retry.
        </p>

        <v-text-field
          v-model="retryLinkExpiresAt"
          label="Link Expiration Date/Time (Optional)"
          type="datetime-local"
          variant="outlined"
          density="compact"
          class="mb-4"
        ></v-text-field>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <v-btn variant="text" class="text-none font-bold text-slate-600" @click="showRetryLinkModal = false">Cancel</v-btn>
          <v-btn
            color="#7C3AED"
            class="font-bold text-white text-none rounded-xl"
            :loading="creatingRetryLink"
            @click="submitDedicatedRetryLink"
          >
            Generate Link & Spend 1 Token
          </v-btn>
        </div>
      </div>
    </v-dialog>
  </div>
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
.gsfin-table :deep(th) {
  font-weight: 700 !important;
  color: #0F172A !important;
  background-color: #F8FAFC !important;
  font-size: 0.75rem !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  border-bottom: 1px solid #E2E8F0 !important;
}
.gsfin-table :deep(td) {
  border-bottom: 1px solid #F1F5F9 !important;
  font-size: 0.875rem !important;
}
</style>

