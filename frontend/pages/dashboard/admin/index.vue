<template>
  <div class="gsfin-admin-page">
    <div class="dashboard-wrap">

      <!-- Loading State -->
      <div v-if="loading" class="py-12 text-center text-slate-500">
        <span class="spinner-sm-red"></span> Loading Executive Dashboard...
      </div>

      <!-- Error State -->
      <div v-else-if="errorMsg" class="error-card text-center py-10 px-6 my-6">
        <i class="mdi mdi-alert-circle-outline text-4xl text-red mb-2 block"></i>
        <h2 class="text-lg font-bold text-slate-900">Dashboard Analytics Unavailable</h2>
        <p class="text-sm text-slate-500 mb-4">{{ errorMsg }}</p>
        <button class="btn-red" @click="fetchData"><i class="mdi mdi-reload"></i> Retry Loading</button>
      </div>

      <!-- Main Dashboard Content -->
      <div v-else class="fade-in">
        
        <!-- Top Header Row -->
        <div class="dash-header-row">
          <div>
            <div class="eyebrow-chip">
              <i class="mdi mdi-chart-timeline-variant"></i> EXECUTIVE CONTROL CENTER
            </div>
            <h1 class="dash-title">Executive Dashboard</h1>
            <p class="dash-subtitle">Real-time overview of qualification exams, candidate enrollments, partner networks, and system health.</p>
          </div>


        </div>

        <!-- ═══ KPI METRIC CARDS GRID ═══ -->
        <div class="kpi-grid">
          <div class="kpi-card" v-for="stat in data.kpis?.row1" :key="stat.title">
            <div class="kpi-header">
              <div :class="['kpi-icon-box', getKpiColorClass(stat.color)]">
                <i :class="`mdi ${stat.icon}`"></i>
              </div>
              <span class="kpi-badge">Live</span>
            </div>
            <div class="kpi-body">
              <span class="kpi-value">{{ stat.value }}</span>
              <span class="kpi-label">{{ stat.title }}</span>
            </div>
          </div>
        </div>

        <!-- ═══ MAIN GRID: RECENT CANDIDATES + SYSTEM & QUICK ACTIONS ═══ -->
        <div class="dash-main-grid">
          
          <!-- LEFT COLUMN: Recent Registrations & Active Exams Feed -->
          <div class="main-col-left">
            <div class="panel-card">
              <div class="panel-card-header">
                <div class="panel-title-wrap">
                  <i class="mdi mdi-account-clock-outline panel-icon"></i>
                  <h3>Recent Candidate Registrations</h3>
                </div>
                <NuxtLink to="/dashboard/admin/public-exams" class="link-action">
                  View All Exams <i class="mdi mdi-arrow-right"></i>
                </NuxtLink>
              </div>

              <div class="table-responsive">
                <table class="gsfin-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Registered Exam</th>
                      <th>Registration Date</th>
                      <th class="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="c in data.recentCandidates" :key="c.id">
                      <td>
                        <div class="candidate-cell">
                          <div class="avatar-circle">
                            {{ getInitials(c.name) }}
                          </div>
                          <div>
                            <div class="font-weight-bold text-slate-900">{{ c.name }}</div>
                            <div class="text-xs text-slate-500">{{ c.email }}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="badge-chip chip-blue">
                          {{ c.exam_name }}
                        </span>
                      </td>
                      <td class="text-slate-500 font-medium">{{ formatDate(c.created_at) }}</td>
                      <td class="text-right">
                        <NuxtLink to="/dashboard/admin/public-exams" class="btn-icon-action" title="View Exam Details">
                          <i class="mdi mdi-open-in-new"></i>
                        </NuxtLink>
                      </td>
                    </tr>
                    <tr v-if="!data.recentCandidates || data.recentCandidates.length === 0">
                      <td colspan="4" class="text-center py-8 text-slate-500">
                        <i class="mdi mdi-account-search-outline text-3xl block mb-2 text-slate-400"></i>
                        No candidate registrations recorded yet.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Quick Action Shortcuts -->
            <div class="shortcuts-grid">
              <NuxtLink to="/admin/multi-tenant" class="shortcut-card hover-red">
                <div class="shortcut-icon icon-red">
                  <i class="mdi mdi-office-building-cog-outline"></i>
                </div>
                <div>
                  <h4>Partner Management</h4>
                  <p>Manage partner sub-centers, live batch feeds, and token allocations.</p>
                </div>
              </NuxtLink>

              <NuxtLink to="/dashboard/admin/public-exams" class="shortcut-card hover-indigo">
                <div class="shortcut-icon icon-indigo">
                  <i class="mdi mdi-file-certificate-outline"></i>
                </div>
                <div>
                  <h4>Exams &amp; Qualifications</h4>
                  <p>Configure certification catalogs, question banks, and grading criteria.</p>
                </div>
              </NuxtLink>

              <NuxtLink to="/dashboard/admin/proctoring" class="shortcut-card hover-emerald">
                <div class="shortcut-icon icon-emerald">
                  <i class="mdi mdi-shield-check-outline"></i>
                </div>
                <div>
                  <h4>AI Proctoring Logs</h4>
                  <p>Inspect identity verification logs, warning triggers, and integrity audits.</p>
                </div>
              </NuxtLink>

              <NuxtLink to="/dashboard/admin/settings" class="shortcut-card hover-amber">
                <div class="shortcut-icon icon-amber">
                  <i class="mdi mdi-cog-outline"></i>
                </div>
                <div>
                  <h4>System Settings</h4>
                  <p>Configure platform logos, email dispatch, legal governance, and options.</p>
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- RIGHT COLUMN: System Health & Banner Links -->
          <div class="main-col-right">
            
            <!-- System Health Card -->
            <div class="panel-card mb-6">
              <div class="panel-card-header">
                <div class="panel-title-wrap">
                  <i class="mdi mdi-server-network panel-icon text-emerald"></i>
                  <h3>System Health &amp; Operations</h3>
                </div>
              </div>
              <div class="pa-6">
                
                <div class="health-progress-wrap mb-6">
                  <div class="health-label-row">
                    <span class="text-sm font-bold text-slate-700">Storage Capacity</span>
                    <span class="text-xs font-bold text-emerald">{{ data.systemHealth?.diskUsage || 32 }}% Used</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" :style="{ width: (data.systemHealth?.diskUsage || 32) + '%' }"></div>
                  </div>
                </div>

                <div class="health-list">
                  <div class="health-item">
                    <div class="health-item-left">
                      <i class="mdi mdi-database-check-outline text-emerald"></i>
                      <span>Database Service</span>
                    </div>
                    <span class="badge-chip chip-green">{{ data.systemHealth?.dbStatus || 'Online' }}</span>
                  </div>

                  <div class="health-item">
                    <div class="health-item-left">
                      <i class="mdi mdi-cached text-emerald"></i>
                      <span>Redis Cache Engine</span>
                    </div>
                    <span class="badge-chip chip-green">{{ data.systemHealth?.redisStatus || 'Online' }}</span>
                  </div>

                  <div class="health-item">
                    <div class="health-item-left">
                      <i class="mdi mdi-email-fast-outline text-blue"></i>
                      <span>Resend Email Dispatch</span>
                    </div>
                    <span class="badge-chip chip-green">Active</span>
                  </div>
                </div>

              </div>
            </div>

            <!-- Banner Card: Partner Management -->
            <div class="promo-card bg-gradient-red mb-6">
              <div class="promo-content">
                <span class="promo-tag">GSFIN Network</span>
                <h3>Partner Center Management</h3>
                <p>Monitor live sub-center exam batches, token purchases, and partner center accounts.</p>
                <NuxtLink to="/admin/multi-tenant" class="btn-promo">
                  Open Console <i class="mdi mdi-arrow-right"></i>
                </NuxtLink>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import dayjs from 'dayjs';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'main_admin', 'sub_admin']
});

const api = useApi();
const loading = ref(true);
const errorMsg = ref('');

const data = ref<any>({
  kpis: { row1: [] },
  recentCandidates: [],
  systemHealth: { diskUsage: 32, dbStatus: 'Online', redisStatus: 'Online' }
});

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

function formatDate(date: string | Date) {
  if (!date) return '-';
  return dayjs(date).format('MMM D, YYYY h:mm A');
}

function getInitials(name: string) {
  if (!name) return 'C';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function getKpiColorClass(color: string) {
  switch (color) {
    case 'primary': return 'kpi-red';
    case 'info': return 'kpi-indigo';
    case 'success': return 'kpi-emerald';
    case 'warning': return 'kpi-amber';
    default: return 'kpi-red';
  }
}

onMounted(fetchData);
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

.dashboard-wrap {
  max-width: 1300px;
  margin: 0 auto;
}

.eyebrow-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(227, 27, 35, 0.08);
  color: #E31B23;
  border: 1px solid rgba(227, 27, 35, 0.18);
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.dash-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.dash-title {
  font-size: 1.95rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
}

.dash-subtitle {
  font-size: 0.9rem;
  color: #64748B;
  margin: 0;
  max-width: 680px;
}



/* KPI Cards Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}
@media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .kpi-grid { grid-template-columns: 1fr; } }

.kpi-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 22px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.kpi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.kpi-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.45rem;
}

.kpi-red { background: rgba(227, 27, 35, 0.08); color: #E31B23; }
.kpi-indigo { background: rgba(79, 70, 229, 0.08); color: #4F46E5; }
.kpi-emerald { background: rgba(16, 185, 129, 0.08); color: #059669; }
.kpi-amber { background: rgba(245, 158, 11, 0.08); color: #D97706; }

.kpi-badge {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: 50px;
  background: #F1F5F9;
  color: #64748B;
}

.kpi-value {
  display: block;
  font-size: 1.85rem;
  font-weight: 900;
  color: #0F172A;
  line-height: 1.2;
  margin-bottom: 2px;
}

.kpi-label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748B;
}

/* Main Grid Layout */
.dash-main-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}
@media (max-width: 1024px) { .dash-main-grid { grid-template-columns: 1fr; } }

.main-col-left {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.panel-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
  overflow: hidden;
}

.panel-card-header {
  padding: 18px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  font-weight: 800;
  color: #0F172A;
  margin: 0;
}

.link-action {
  font-size: 0.82rem;
  font-weight: 700;
  color: #E31B23;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: transform 0.2s;
}
.link-action:hover {
  transform: translateX(2px);
}

/* Candidate Table & Cell */
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

.candidate-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(227, 27, 35, 0.1);
  color: #E31B23;
  font-weight: 800;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.badge-chip {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.72rem;
  font-weight: 800;
}
.chip-blue { background: rgba(59, 130, 246, 0.1); color: #2563EB; }
.chip-green { background: rgba(16, 185, 129, 0.1); color: #059669; }

.btn-icon-action {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #F1F5F9;
  color: #64748B;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 1.05rem;
  transition: all 0.2s;
}
.btn-icon-action:hover {
  background: #E31B23;
  color: #FFFFFF;
}

/* Shortcuts Grid */
.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
@media (max-width: 600px) { .shortcuts-grid { grid-template-columns: 1fr; } }

.shortcut-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  text-decoration: none;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.shortcut-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}
.hover-red:hover { border-color: rgba(227, 27, 35, 0.4); }
.hover-indigo:hover { border-color: rgba(79, 70, 229, 0.4); }
.hover-emerald:hover { border-color: rgba(16, 185, 129, 0.4); }
.hover-amber:hover { border-color: rgba(245, 158, 11, 0.4); }

.shortcut-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}
.icon-red { background: rgba(227, 27, 35, 0.1); color: #E31B23; }
.icon-indigo { background: rgba(79, 70, 229, 0.1); color: #4F46E5; }
.icon-emerald { background: rgba(16, 185, 129, 0.1); color: #059669; }
.icon-amber { background: rgba(245, 158, 11, 0.1); color: #D97706; }

.shortcut-card h4 {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0 0 4px 0;
}
.shortcut-card p {
  font-size: 0.8rem;
  color: #64748B;
  margin: 0;
  line-height: 1.45;
}

/* System Health Section */
.pa-6 { padding: 24px; }
.health-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.progress-bar-bg {
  width: 100%;
  height: 8px;
  background: #F1F5F9;
  border-radius: 50px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: #10B981;
  border-radius: 50px;
  transition: width 0.4s ease;
}

.health-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.health-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}
.health-item:last-child { border-bottom: none; }

.health-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #334155;
}

/* Promo Card */
.promo-card {
  border-radius: 20px;
  padding: 28px;
  color: #FFFFFF;
  box-shadow: 0 10px 25px rgba(227, 27, 35, 0.2);
  position: relative;
  overflow: hidden;
}
.bg-gradient-red {
  background: linear-gradient(135deg, #E31B23 0%, #990B11 100%);
}
.promo-tag {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: rgba(255, 255, 255, 0.2);
  padding: 3px 10px;
  border-radius: 50px;
  display: inline-block;
  margin-bottom: 12px;
}
.promo-content h3 {
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0 0 8px 0;
}
.promo-content p {
  font-size: 0.84rem;
  opacity: 0.9;
  margin: 0 0 20px 0;
  line-height: 1.5;
}
.btn-promo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #FFFFFF;
  color: #E31B23;
  padding: 9px 18px;
  border-radius: 10px;
  font-size: 0.84rem;
  font-weight: 800;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease;
}
.btn-promo:hover {
  transform: translateY(-2px);
}

.fade-in { animation: fadeIn 0.25s ease-in-out; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.spinner-sm-red {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(227, 27, 35, 0.2);
  border-top-color: #E31B23;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
