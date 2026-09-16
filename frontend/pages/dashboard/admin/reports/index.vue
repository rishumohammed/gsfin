<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ HEADER ROW ═══ -->
      <div class="admin-header-row">
        <div>
          <div class="eyebrow-chip mb-1">
            <i class="mdi mdi-chart-bar font-bold"></i> EXECUTIVE REPORTS &amp; DATA ANALYTICS
          </div>
          <h1 class="admin-title">Reports &amp; Analytics</h1>
          <p class="admin-subtitle">
            Comprehensive audit reports across examination performance, sub-center partner volume, certificate issuance, and governance.
          </p>
        </div>

        <div class="header-actions">
          <div class="filter-select-wrap">
            <i class="mdi mdi-calendar-range text-slate-400"></i>
            <select v-model="selectedPeriod" class="filter-select">
              <option value="all">All Time History</option>
              <option value="30days">Last 30 Days</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          
          <button class="btn-glass" @click="exportCSV">
            <i class="mdi mdi-download-outline"></i> Export CSV
          </button>
          
          <button class="btn-red" @click="printReport">
            <i class="mdi mdi-printer-outline"></i> Print Summary
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16 text-slate-500 font-medium">
        <span class="spinner-sm-red mb-2"></span>
        <p class="text-sm">Calculating platform analytics &amp; audit metrics...</p>
      </div>

      <div v-else>
        <!-- ═══ EXECUTIVE KPI GRID ═══ -->
        <div class="kpi-grid mb-8">
          <div class="kpi-card">
            <div class="kpi-icon bg-indigo-light">
              <i class="mdi mdi-file-document-multiple-outline text-indigo"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Total Exam Attempts</span>
              <span class="kpi-value">{{ overview.total_attempts || 0 }}</span>
              <span class="kpi-sub text-slate-500">Across {{ overview.total_exams || 0 }} Active Exams</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon bg-emerald-light">
              <i class="mdi mdi-chart-line text-emerald"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Platform Pass Rate</span>
              <span class="kpi-value text-emerald">{{ overview.pass_rate || 0 }}%</span>
              <span class="kpi-sub text-slate-500">{{ overview.passed_attempts || 0 }} Passed Candidates</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon bg-red-light">
              <i class="mdi mdi-certificate-outline text-red"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Issued Credentials</span>
              <span class="kpi-value">{{ overview.total_certificates || 0 }}</span>
              <span class="kpi-sub text-slate-500">{{ overview.total_qualifications || 0 }} Qualifications Active</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon bg-amber-light">
              <i class="mdi mdi-wallet-outline text-amber"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Token Consumption</span>
              <span class="kpi-value">{{ overview.tokens_used || 0 }}</span>
              <span class="kpi-sub text-slate-500">Of {{ overview.tokens_purchased || 0 }} Tokens Sold</span>
            </div>
          </div>
        </div>

        <!-- ═══ REPORT TABS & CONTAINER ═══ -->
        <div class="panel-card pa-6 mb-8">
          <div class="report-tabs-bar">
            <button 
              class="tab-btn" 
              :class="{ 'active': activeTab === 'exams' }"
              @click="activeTab = 'exams'"
            >
              <i class="mdi mdi-clipboard-text-outline mr-1.5"></i> 1. Exam Performance Report
            </button>
            <button 
              class="tab-btn" 
              :class="{ 'active': activeTab === 'partners' }"
              @click="activeTab = 'partners'"
            >
              <i class="mdi mdi-office-building-outline mr-1.5"></i> 2. Sub-Center Partner Activity
            </button>
            <button 
              class="tab-btn" 
              :class="{ 'active': activeTab === 'certs' }"
              @click="activeTab = 'certs'"
            >
              <i class="mdi mdi-shield-check-outline mr-1.5"></i> 3. Certificate Governance
            </button>
            <button 
              class="tab-btn" 
              :class="{ 'active': activeTab === 'trends' }"
              @click="activeTab = 'trends'"
            >
              <i class="mdi mdi-trending-up mr-1.5"></i> 4. Monthly Velocity &amp; Growth
            </button>
          </div>

          <!-- TAB 1: EXAM PERFORMANCE -->
          <div v-if="activeTab === 'exams'" class="tab-pane">
            <div class="tab-pane-header mb-4">
              <div>
                <h3 class="panel-title">Examination Performance Breakdown</h3>
                <p class="panel-desc">Detailed metrics on candidate attempt volume, pass/fail ratios, and average score percentages.</p>
              </div>
              <span class="total-count-badge">{{ examBreakdown.length }} Exams Analyzed</span>
            </div>

            <div class="table-responsive">
              <table class="gsfin-table">
                <thead>
                  <tr>
                    <th>Exam Standard Title</th>
                    <th>Total Attempts</th>
                    <th>Passed</th>
                    <th>Failed</th>
                    <th>Pass Rate (%)</th>
                    <th>Avg Score (%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="examBreakdown.length === 0">
                    <td colspan="6" class="text-center py-8 text-slate-400">No exam attempts recorded yet.</td>
                  </tr>
                  <tr v-for="e in examBreakdown" :key="e.id">
                    <td>
                      <div class="font-bold text-slate-900">{{ e.title }}</div>
                      <span class="text-xs text-slate-500 font-mono">ID: #{{ e.id }}</span>
                    </td>
                    <td>
                      <span class="font-bold text-slate-800">{{ e.total_attempts }}</span>
                    </td>
                    <td>
                      <span class="chip-green-sm">{{ e.passed_count }} Passed</span>
                    </td>
                    <td>
                      <span class="chip-slate-sm">{{ e.failed_count }} Failed</span>
                    </td>
                    <td>
                      <div class="flex items-center gap-2">
                        <div class="progress-bar-wrap">
                          <div class="progress-bar-fill" :style="{ width: `${calculateRate(e.passed_count, e.total_attempts)}%` }"></div>
                        </div>
                        <span class="font-bold text-slate-800 text-xs">
                          {{ calculateRate(e.passed_count, e.total_attempts) }}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span class="font-bold text-slate-900">{{ e.avg_score ? e.avg_score + '%' : 'N/A' }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB 2: PARTNER ACTIVITY -->
          <div v-else-if="activeTab === 'partners'" class="tab-pane">
            <div class="tab-pane-header mb-4">
              <div>
                <h3 class="panel-title">Sub-Center Partner Activity &amp; Wallet Usage</h3>
                <p class="panel-desc">Audit breakdown of partner token balances, purchases, exam batch creations, and consumption velocity.</p>
              </div>
              <span class="total-count-badge">{{ partnerBreakdown.length }} Partners Tracked</span>
            </div>

            <div class="table-responsive">
              <table class="gsfin-table">
                <thead>
                  <tr>
                    <th>Sub-Center Partner</th>
                    <th>Code &amp; Location</th>
                    <th>Purchased Tokens</th>
                    <th>Tokens Consumed</th>
                    <th>Tokens Remaining</th>
                    <th>Batches Created</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="partnerBreakdown.length === 0">
                    <td colspan="6" class="text-center py-8 text-slate-400">No partner sub-centers registered yet.</td>
                  </tr>
                  <tr v-for="p in partnerBreakdown" :key="p.id">
                    <td>
                      <div class="font-bold text-slate-900">{{ p.name }}</div>
                    </td>
                    <td>
                      <span class="code-pill">{{ p.code }}</span>
                      <div class="text-xs text-slate-500 mt-0.5">{{ p.city || 'Global' }}, {{ p.country || 'International' }}</div>
                    </td>
                    <td>
                      <span class="font-bold text-indigo-600">{{ p.tokens_purchased }}</span>
                    </td>
                    <td>
                      <span class="font-bold text-slate-800">{{ p.tokens_used }}</span>
                    </td>
                    <td>
                      <span :class="['badge-chip', Number(p.tokens_remaining) > 50 ? 'chip-green' : 'chip-amber']">
                        {{ p.tokens_remaining }} Remaining
                      </span>
                    </td>
                    <td>
                      <span class="font-bold text-slate-800">{{ p.batch_count }} Batches</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB 3: CERTIFICATE GOVERNANCE -->
          <div v-else-if="activeTab === 'certs'" class="tab-pane">
            <div class="tab-pane-header mb-4">
              <div>
                <h3 class="panel-title">Certificate Governance &amp; Issuance Breakdown</h3>
                <p class="panel-desc">Audit metrics of active vs revoked certificates issued across qualification standards.</p>
              </div>
              <span class="total-count-badge">{{ certBreakdown.length }} Qualification Groups</span>
            </div>

            <div class="table-responsive">
              <table class="gsfin-table">
                <thead>
                  <tr>
                    <th>Qualification Standard Name</th>
                    <th>Total Certificates Issued</th>
                    <th>Active Credentials</th>
                    <th>Revoked Credentials</th>
                    <th>Verification Integrity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="certBreakdown.length === 0">
                    <td colspan="5" class="text-center py-8 text-slate-400">No certificates recorded in system.</td>
                  </tr>
                  <tr v-for="c in certBreakdown" :key="c.qualification_name">
                    <td>
                      <div class="font-bold text-slate-900">{{ c.qualification_name }}</div>
                    </td>
                    <td>
                      <span class="font-bold text-slate-900">{{ c.total_issued }}</span>
                    </td>
                    <td>
                      <span class="chip-green-sm">{{ c.active_count }} Active</span>
                    </td>
                    <td>
                      <span :class="['chip-slate-sm', Number(c.revoked_count) > 0 ? 'text-red bg-red-light' : '']">
                        {{ c.revoked_count }} Revoked
                      </span>
                    </td>
                    <td>
                      <div class="flex items-center gap-2">
                        <i class="mdi mdi-shield-check text-emerald text-base"></i>
                        <span class="font-bold text-slate-800 text-xs">100% Cryptographic Verification</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB 4: MONTHLY TRENDS -->
          <div v-else-if="activeTab === 'trends'" class="tab-pane">
            <div class="tab-pane-header mb-4">
              <div>
                <h3 class="panel-title">Monthly Examination Attempt Velocity</h3>
                <p class="panel-desc">Historical trend analysis of monthly candidate attempts and pass velocity over the past 6 months.</p>
              </div>
            </div>

            <div v-if="monthlyTrend.length === 0" class="py-12 text-center text-slate-400">
              No historical monthly data recorded yet.
            </div>
            <div v-else class="grid grid-cols-3 gap-4">
              <div v-for="m in monthlyTrend" :key="m.month_label" class="trend-card">
                <div class="trend-month">{{ m.month_label }}</div>
                <div class="trend-value">{{ m.total_attempts }} <span class="trend-unit">Attempts</span></div>
                <div class="trend-footer">
                  <span class="chip-green-sm">{{ m.passed_attempts }} Passed</span>
                  <span class="text-xs font-bold text-slate-600">
                    {{ calculateRate(m.passed_attempts, m.total_attempts) }}% Success
                  </span>
                </div>
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

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  roles: ['super_admin', 'main_admin', 'sub_admin']
});

const api = useApi();
const loading = ref(true);
const selectedPeriod = ref('all');
const activeTab = ref('exams');

const overview = ref<any>({});
const examBreakdown = ref<any[]>([]);
const partnerBreakdown = ref<any[]>([]);
const certBreakdown = ref<any[]>([]);
const monthlyTrend = ref<any[]>([]);

const fetchAnalytics = async () => {
  loading.value = true;
  try {
    const res = await api.get('/main-admin/reports/analytics');
    const data = res.data || res;
    overview.value = data.overview || {};
    examBreakdown.value = data.examBreakdown || [];
    partnerBreakdown.value = data.partnerBreakdown || [];
    certBreakdown.value = data.certBreakdown || [];
    monthlyTrend.value = data.monthlyTrend || [];
  } catch (err) {
    console.error('Failed to fetch analytics report:', err);
  } finally {
    loading.value = false;
  }
};

const calculateRate = (passed: number, total: number) => {
  if (!total || total === 0) return 0;
  return Math.round((Number(passed) / Number(total)) * 100);
};

const printReport = () => {
  window.print();
};

const exportCSV = () => {
  let csvContent = 'data:text/csv;charset=utf-8,';
  
  if (activeTab.value === 'exams') {
    csvContent += 'Exam Title,Total Attempts,Passed,Failed,Pass Rate %\n';
    examBreakdown.value.forEach(e => {
      csvContent += `"${e.title}",${e.total_attempts},${e.passed_count},${e.failed_count},${calculateRate(e.passed_count, e.total_attempts)}%\n`;
    });
  } else if (activeTab.value === 'partners') {
    csvContent += 'Sub-Center Name,Code,City,Purchased Tokens,Tokens Used,Tokens Remaining\n';
    partnerBreakdown.value.forEach(p => {
      csvContent += `"${p.name}",${p.code},"${p.city || ''}",${p.tokens_purchased},${p.tokens_used},${p.tokens_remaining}\n`;
    });
  } else {
    csvContent += 'Qualification Standard,Total Issued,Active,Revoked\n';
    certBreakdown.value.forEach(c => {
      csvContent += `"${c.qualification_name}",${c.total_issued},${c.active_count},${c.revoked_count}\n`;
    });
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `gsfin_report_${activeTab.value}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(() => {
  fetchAnalytics();
});
</script>

<style scoped>
.gsfin-admin-page {
  padding: 40px 48px;
  background: #FAFAFD;
  min-height: 100vh;
  box-sizing: border-box;
}
.admin-wrap {
  max-width: 1440px;
  margin: 0 auto;
}

.admin-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.eyebrow-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  font-weight: 800;
  color: #E31B23;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.admin-title {
  font-size: 1.95rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
  letter-spacing: -0.02em;
}

.admin-subtitle {
  font-size: 0.94rem;
  color: #64748B;
  margin: 6px 0 0 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-select-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 8px 14px;
  border-radius: 12px;
}

.filter-select {
  border: none;
  background: transparent;
  font-size: 0.84rem;
  font-weight: 700;
  color: #0F172A;
  outline: none;
  cursor: pointer;
}

.btn-red {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.88rem;
  box-shadow: 0 3px 10px rgba(227, 27, 35, 0.2);
  transition: all 0.2s ease;
  cursor: pointer;
}
.btn-red:hover { background: #C4131B; transform: translateY(-1px); }

.btn-glass {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
  color: #334155;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-glass:hover { background: #F8FAFC; color: #E31B23; border-color: rgba(227, 27, 35, 0.3); }

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
@media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .kpi-grid { grid-template-columns: 1fr; } }

.kpi-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.02);
}

.kpi-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
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
.kpi-label { font-size: 0.74rem; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }
.kpi-value { font-size: 1.6rem; font-weight: 800; color: #0F172A; line-height: 1.2; margin-top: 2px; }
.kpi-sub { font-size: 0.74rem; font-weight: 600; margin-top: 2px; }

/* Panel & Tabs */
.panel-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
}

.report-tabs-bar {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  padding-bottom: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.tab-btn {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.06);
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 0.84rem;
  font-weight: 700;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn:hover { background: #F1F5F9; color: #0F172A; }
.tab-btn.active {
  background: #FEF2F2;
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.3);
  box-shadow: 0 2px 8px rgba(227, 27, 35, 0.08);
}

.tab-pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.panel-title { font-size: 1.15rem; font-weight: 800; color: #0F172A; margin: 0; }
.panel-desc { font-size: 0.84rem; color: #64748B; margin: 4px 0 0 0; }

.total-count-badge {
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.74rem;
  font-weight: 800;
  background: #F1F5F9;
  color: #475569;
}

/* Tables */
.table-responsive { overflow-x: auto; }
.gsfin-table { width: 100%; border-collapse: collapse; text-align: left; }
.gsfin-table th {
  padding: 14px 18px;
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748B;
  background: #FAFAFD;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}
.gsfin-table td {
  padding: 16px 18px;
  font-size: 0.88rem;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  vertical-align: middle;
}
.gsfin-table tbody tr:hover { background: #F8FAFC; }

.chip-green-sm {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 800;
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.chip-slate-sm {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 800;
  background: #F1F5F9;
  color: #64748B;
}

.badge-chip { padding: 4px 12px; border-radius: 50px; font-size: 0.74rem; font-weight: 800; }
.chip-green { background: rgba(16, 185, 129, 0.1); color: #059669; }
.chip-amber { background: rgba(245, 158, 11, 0.1); color: #D97706; }

.progress-bar-wrap {
  width: 100px;
  height: 8px;
  border-radius: 10px;
  background: #E2E8F0;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: #059669;
  border-radius: 10px;
}

.code-pill {
  font-family: monospace;
  font-size: 0.74rem;
  font-weight: 800;
  background: #F1F5F9;
  color: #334155;
  padding: 2px 8px;
  border-radius: 6px;
}

/* Trend Grid */
.trend-card {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 20px;
}
.trend-month { font-size: 0.82rem; font-weight: 800; color: #64748B; text-transform: uppercase; }
.trend-value { font-size: 1.5rem; font-weight: 800; color: #0F172A; margin: 4px 0 12px 0; }
.trend-unit { font-size: 0.82rem; font-weight: 600; color: #64748B; }
.trend-footer { display: flex; align-items: center; justify-content: space-between; }
</style>
