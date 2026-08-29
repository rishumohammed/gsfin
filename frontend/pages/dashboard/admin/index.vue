<template>
  <v-container fluid class="py-8 px-6 bg-grey-lighten-4 min-vh-100">
    <div v-if="loading">
      <v-skeleton-loader type="heading" class="mb-8" width="300"></v-skeleton-loader>
      <v-row class="mb-4">
        <v-col v-for="i in 4" :key="i" cols="12" sm="6" md="3">
          <v-skeleton-loader type="card" class="rounded-xl"></v-skeleton-loader>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="8">
          <v-skeleton-loader type="table" class="rounded-xl"></v-skeleton-loader>
        </v-col>
        <v-col cols="12" md="4">
          <v-skeleton-loader type="list-item-three-line" class="rounded-xl" height="300"></v-skeleton-loader>
        </v-col>
      </v-row>
    </div>

    <div v-else-if="errorMsg" class="error-state text-center pa-10 mt-10">
      <v-icon icon="mdi-alert-circle-outline" size="64" color="grey-lighten-1" class="mb-4"></v-icon>
      <h2 class="text-h5 font-weight-bold text-grey-darken-2">Dashboard Data Unavailable</h2>
      <p class="text-grey mb-2">We couldn't load the talent hunt analytics at this moment.</p>
      <p v-if="errorMsg" class="text-error mb-6 font-weight-bold">{{ errorMsg }}</p>
      <v-btn color="primary" @click="fetchData" prepend-icon="mdi-reload" class="text-none font-weight-bold px-6" rounded="lg">Retry Loading</v-btn>
    </div>

    <div v-else>
      <div class="d-flex align-center flex-wrap mb-8 gap-4">
        <div>
          <h1 class="text-h4 font-weight-bold text-slate-900 tracking-tight mb-1">Talent Hunt Overview</h1>
          <p class="text-secondary mb-0">Comprehensive analytics and system health for your exam platform.</p>
        </div>
        <v-spacer></v-spacer>
        <v-btn color="primary" prepend-icon="mdi-plus" height="42" rounded="lg" class="px-5 text-none font-weight-bold" elevation="0" to="/admin/multi-tenant">
          Sub-Center Console
        </v-btn>
      </div>

      <v-row class="mb-8" v-if="data.kpis && data.kpis.row1">
        <v-col cols="12" sm="6" md="3" v-for="stat in data.kpis.row1" :key="stat.title">
          <v-card variant="outlined" class="pa-5 rounded-xl border-surface h-100 bg-white hover-up transition-fast">
            <div class="d-flex justify-space-between align-start mb-2">
              <div class="rounded-xl d-flex align-center justify-center" style="width: 48px; height: 48px; background: #eff6ff;">
                <v-icon :icon="stat.icon" size="26" color="primary"></v-icon>
              </div>
            </div>
            <div class="mt-4">
              <div class="text-h4 font-weight-black mb-1 text-slate-900">{{ stat.value }}</div>
              <div class="text-caption text-secondary font-weight-bold text-uppercase letter-spacing-1">{{ stat.title }}</div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <!-- Recent Candidates Table -->
        <v-col cols="12" md="8">
          <v-card class="pa-6 rounded-xl border-surface bg-white h-100" variant="outlined">
            <div class="d-flex align-center justify-space-between mb-6">
              <div class="d-flex align-center">
                <div class="rounded-xl d-flex align-center justify-center mr-3" style="width: 40px; height: 40px; background: #eff6ff;">
                  <v-icon icon="mdi-account-clock-outline" color="primary" size="20"></v-icon>
                </div>
                <div class="text-h6 font-weight-bold text-slate-900">Recent Registrations</div>
              </div>
              <v-btn variant="text" color="primary" size="small" class="text-none font-weight-bold" to="/dashboard/admin/exams/candidates">View All</v-btn>
            </div>
            
            <v-table hover class="clean-table">
              <thead>
                <tr>
                  <th class="font-weight-bold text-secondary bg-slate-50">Candidate</th>
                  <th class="font-weight-bold text-secondary bg-slate-50">Registered Exam</th>
                  <th class="font-weight-bold text-secondary bg-slate-50">Date</th>
                  <th class="font-weight-bold text-secondary bg-slate-50 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in data.recentCandidates" :key="c.id">
                  <td class="font-weight-bold py-3">
                    <div class="text-body-2 font-weight-bold text-slate-900">{{ c.name }}</div>
                    <div class="text-caption text-secondary">{{ c.email }}</div>
                  </td>
                  <td class="py-3">
                    <v-chip size="small" color="primary" variant="tonal" class="font-weight-bold">{{ c.exam_name }}</v-chip>
                  </td>
                  <td class="text-secondary py-3 text-caption">{{ formatDate(c.created_at) }}</td>
                  <td class="text-right py-3">
                    <v-btn icon="mdi-open-in-new" variant="text" size="small" color="secondary"></v-btn>
                  </td>
                </tr>
                <tr v-if="!data.recentCandidates || data.recentCandidates.length === 0">
                  <td colspan="4" class="text-center py-10 text-secondary">
                    <v-icon size="40" color="grey-lighten-2" class="mb-3 d-block mx-auto">mdi-account-search-outline</v-icon>
                    No recent candidates found.
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>

        <!-- Right Column (System Health & Actions) -->
        <v-col cols="12" md="4" class="d-flex flex-column gap-6">
          
          <!-- System Health -->
          <v-card class="pa-6 rounded-xl border-surface bg-white" variant="outlined">
            <div class="d-flex align-center mb-6">
              <div class="rounded-xl d-flex align-center justify-center mr-3" style="width: 40px; height: 40px; background: #ecfdf5;">
                <v-icon icon="mdi-server-network" color="success" size="20"></v-icon>
              </div>
              <div class="text-h6 font-weight-bold text-slate-900">System Health</div>
            </div>
            
            <div class="mb-6">
              <div class="d-flex justify-space-between align-end mb-2">
                <span class="text-subtitle-2 font-weight-bold text-slate-700">Storage Capacity</span>
                <span class="text-caption font-weight-bold" :class="data.systemHealth?.diskUsage > 80 ? 'text-error' : 'text-primary'">{{ data.systemHealth?.diskUsage || 0 }}% used</span>
              </div>
              <v-progress-linear 
                :model-value="data.systemHealth?.diskUsage || 0" 
                :color="data.systemHealth?.diskUsage > 80 ? 'error' : 'primary'" 
                rounded 
                height="8"
                bg-color="grey-lighten-3"
              ></v-progress-linear>
            </div>
            
            <v-list density="compact" class="bg-transparent pa-0">
              <v-list-item class="px-0 py-2 border-b">
                <template #prepend><v-icon icon="mdi-database-check-outline" color="success" class="mr-3"></v-icon></template>
                <v-list-item-title class="font-weight-medium text-body-2">Database Service</v-list-item-title>
                <template #append>
                  <v-chip size="x-small" color="success" variant="flat" class="font-weight-bold">
                    {{ data.systemHealth?.dbStatus || 'Unknown' }}
                  </v-chip>
                </template>
              </v-list-item>
              <v-list-item class="px-0 py-2">
                <template #prepend><v-icon icon="mdi-cached" color="success" class="mr-3"></v-icon></template>
                <v-list-item-title class="font-weight-medium text-body-2">Redis Cache</v-list-item-title>
                <template #append>
                  <v-chip size="x-small" color="success" variant="flat" class="font-weight-bold">
                    {{ data.systemHealth?.redisStatus || 'Unknown' }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
          
          <!-- Sub-Center & Certification Platform Link -->
          <v-card class="pa-6 rounded-xl bg-indigo-darken-3 text-white shadow-lg overflow-hidden position-relative mb-4">
            <div class="position-absolute opacity-10" style="right: -20px; top: -20px; transform: scale(2);">
              <v-icon size="150" color="white">mdi-shield-crown</v-icon>
            </div>
            <div class="position-relative z-index-1">
              <div class="text-h6 font-weight-bold mb-2">Sub-Center Management</div>
              <p class="text-body-2 mb-6 opacity-90">Manage sub-center accounts, token packages, exam catalog, and real-time live feeds.</p>
              <v-btn color="white" class="text-indigo-darken-3 font-weight-bold px-6" rounded="lg" to="/admin/multi-tenant">Open Sub-Center Admin</v-btn>
            </div>
          </v-card>

          <!-- Quick Links -->
          <v-card class="pa-6 rounded-xl bg-primary text-white shadow-lg overflow-hidden position-relative">
            <div class="position-absolute opacity-10" style="right: -20px; top: -20px; transform: scale(2);">
              <v-icon size="150" color="white">mdi-rocket-launch-outline</v-icon>
            </div>
            <div class="position-relative z-index-1">
              <div class="text-h6 font-weight-bold mb-2">Need to adjust branding?</div>
              <p class="text-body-2 mb-6 opacity-90">Manage email templates, platform logos, and dynamic system settings.</p>
              <v-btn color="white" class="text-primary font-weight-bold px-6" rounded="lg" to="/dashboard/admin/settings">Go to Settings</v-btn>
            </div>
          </v-card>

        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import dayjs from 'dayjs';

const api = useApi();
const loading = ref(true);

interface KPI {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  exam_name: string;
  created_at: string;
}

interface SystemHealth {
  diskUsage: number;
  dbStatus: string;
  redisStatus: string;
}

interface AdminDashboardData {
  kpis: {
    row1: KPI[];
  };
  recentCandidates: Candidate[];
  systemHealth: SystemHealth;
}

const data = ref<AdminDashboardData>({
  kpis: { row1: [] },
  recentCandidates: [],
  systemHealth: { diskUsage: 0, dbStatus: 'Offline', redisStatus: 'Offline' }
});

const errorMsg = ref('');

const fetchData = async () => {
  try {
    errorMsg.value = '';
    loading.value = true;
    const { data: res } = await api.get('/admin/public-exams/dashboard-stats');
    data.value = res;
  } catch (err: any) {
    console.error('Failed to fetch dashboard stats', err);
    errorMsg.value = err.response?.data?.message || err.message || 'Unknown error';
  } finally {
    loading.value = false;
  }
};

const formatDate = (date: string | Date) => dayjs(date).format('MMM D, YYYY h:mm A');

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'sub_admin']
});

onMounted(fetchData);
</script>

<style scoped>
.border-surface {
  border: 1px solid rgba(226, 232, 240, 0.8) !important;
}

.transition-fast {
  transition: all 0.2s ease;
}

.hover-up:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -6px rgba(15, 23, 42, 0.08) !important;
  border-color: #cbd5e1 !important;
}

.letter-spacing-1 {
  letter-spacing: 1px;
}

.shadow-lg {
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1) !important;
}

.opacity-10 {
  opacity: 0.1;
}

.opacity-90 {
  opacity: 0.9;
}

.z-index-1 {
  z-index: 1;
}

.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
.gap-6 { gap: 24px; }
</style>
