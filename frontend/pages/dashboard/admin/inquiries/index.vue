<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ HEADER ROW ═══ -->
      <div class="admin-header-row">
        <div>
          <div class="eyebrow-chip mb-1">
            <i class="mdi mdi-email-open-outline"></i> COMMUNICATION &amp; PARTNERSHIP GOVERNANCE
          </div>
          <h1 class="admin-title">Inquiries &amp; Partner Applications</h1>
          <p class="admin-subtitle">
            Manage institutional partner accreditation applications and general contact inquiry leads in real time.
          </p>
        </div>

        <div class="header-actions">
          <button class="btn-glass" @click="fetchInquiries">
            <i class="mdi mdi-refresh"></i> Refresh Data
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16 text-slate-500 font-medium">
        <span class="spinner-sm-red mb-2"></span>
        <p class="text-sm">Loading inquiries &amp; partner submissions...</p>
      </div>

      <div v-else>
        <!-- ═══ FILTERING & TABLE ═══ -->
        <div class="panel-card pa-6">
          <div class="table-controls mb-6">
            <div class="tab-pill-group">
              <button 
                class="pill-tab-btn" 
                :class="{ 'active': activeTab === 'all' }"
                @click="activeTab = 'all'"
              >
                All Submissions ({{ inquiries.length }})
              </button>
              <button 
                class="pill-tab-btn" 
                :class="{ 'active': activeTab === 'partner' }"
                @click="activeTab = 'partner'"
              >
                <i class="mdi mdi-office-building mr-1"></i> Partner Applications ({{ partnerCount }})
              </button>
              <button 
                class="pill-tab-btn" 
                :class="{ 'active': activeTab === 'general' }"
                @click="activeTab = 'general'"
              >
                <i class="mdi mdi-message-text-outline mr-1"></i> General Inquiries ({{ generalCount }})
              </button>
            </div>

            <div class="search-filter-wrap">
              <div class="search-box">
                <i class="mdi mdi-magnify search-icon"></i>
                <input v-model="searchQuery" type="text" placeholder="Search by institution, name, or email..." class="search-input" />
              </div>

              <select v-model="statusFilter" class="filter-select">
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
              </select>
            </div>
          </div>

          <div class="table-responsive">
            <table class="gsfin-table">
              <!-- DYNAMIC TABLE HEADERS PER TAB -->
              <thead v-if="activeTab === 'partner'">
                <tr>
                  <th>Applicant Institution &amp; Country</th>
                  <th>Contact Person &amp; Email</th>
                  <th>Phone / WhatsApp</th>
                  <th>Application Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <thead v-else-if="activeTab === 'general'">
                <tr>
                  <th>Sender Name &amp; Email</th>
                  <th>Inquiry Subject</th>
                  <th>Phone / WhatsApp</th>
                  <th>Date Received</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <thead v-else>
                <tr>
                  <th>Submission Type &amp; Subject</th>
                  <th>Sender / Institution</th>
                  <th>Contact Email / Phone</th>
                  <th>Date Received</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr v-if="filteredInquiries.length === 0">
                  <td colspan="6" class="text-center py-10 text-slate-400">
                    <i class="mdi mdi-email-open-outline text-3xl block mb-2 text-slate-300"></i>
                    No inquiries or partner applications match your criteria.
                  </td>
                </tr>

                <!-- RENDER FOR TAB: PARTNER APPLICATIONS -->
                <template v-if="activeTab === 'partner'">
                  <tr v-for="item in filteredInquiries" :key="item.id" :class="{ 'unread-row': item.status === 'new' }">
                    <td>
                      <div class="font-bold text-slate-900 flex items-center gap-2">
                        <i class="mdi mdi-domain text-emerald text-base"></i>
                        {{ parsePartnerDetails(item).institution }}
                      </div>
                      <div class="text-xs text-slate-500 font-medium mt-0.5">
                        <i class="mdi mdi-earth text-slate-400 mr-1"></i> {{ parsePartnerDetails(item).country }}
                      </div>
                    </td>
                    <td>
                      <div class="font-bold text-slate-900">{{ item.name }}</div>
                      <a :href="`mailto:${item.email}`" class="text-xs text-red hover:underline font-medium">{{ item.email }}</a>
                    </td>
                    <td>
                      <span class="text-slate-700 text-xs font-semibold">{{ item.phone || 'Not provided' }}</span>
                    </td>
                    <td>
                      <span class="text-xs text-slate-500 font-medium">{{ formatDate(item.submitted_at) }}</span>
                    </td>
                    <td>
                      <button class="status-btn" :class="getStatusClass(item.status)" @click="toggleStatus(item)">
                        {{ item.status.toUpperCase() }}
                      </button>
                    </td>
                    <td>
                      <div class="actions-cell">
                        <button class="btn-table-action btn-view" title="View Partner Details" @click="openViewModal(item)">
                          <i class="mdi mdi-eye-outline"></i> View Application
                        </button>
                        <a :href="`mailto:${item.email}?subject=Re: ${encodeURIComponent(item.subject || 'Partner Application')}`" class="btn-table-action btn-edit" title="Send Email Reply">
                          <i class="mdi mdi-reply"></i> Reply
                        </a>
                        <button class="btn-table-action btn-danger" title="Delete Submission" @click="confirmDelete(item)">
                          <i class="mdi mdi-trash-can-outline"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>

                <!-- RENDER FOR TAB: GENERAL INQUIRIES -->
                <template v-else-if="activeTab === 'general'">
                  <tr v-for="item in filteredInquiries" :key="item.id" :class="{ 'unread-row': item.status === 'new' }">
                    <td>
                      <div class="font-bold text-slate-900">{{ item.name }}</div>
                      <a :href="`mailto:${item.email}`" class="text-xs text-red hover:underline font-medium">{{ item.email }}</a>
                    </td>
                    <td>
                      <div class="subject-text">{{ item.subject || 'General Inquiry' }}</div>
                    </td>
                    <td>
                      <span class="text-slate-700 text-xs font-semibold">{{ item.phone || 'Not provided' }}</span>
                    </td>
                    <td>
                      <span class="text-xs text-slate-500 font-medium">{{ formatDate(item.submitted_at) }}</span>
                    </td>
                    <td>
                      <button class="status-btn" :class="getStatusClass(item.status)" @click="toggleStatus(item)">
                        {{ item.status.toUpperCase() }}
                      </button>
                    </td>
                    <td>
                      <div class="actions-cell">
                        <button class="btn-table-action btn-view" title="View Inquiry" @click="openViewModal(item)">
                          <i class="mdi mdi-eye-outline"></i> View
                        </button>
                        <a :href="`mailto:${item.email}?subject=Re: ${encodeURIComponent(item.subject || 'Inquiry')}`" class="btn-table-action btn-edit" title="Send Email Reply">
                          <i class="mdi mdi-reply"></i> Reply
                        </a>
                        <button class="btn-table-action btn-danger" title="Delete Inquiry" @click="confirmDelete(item)">
                          <i class="mdi mdi-trash-can-outline"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>

                <!-- RENDER FOR TAB: ALL SUBMISSIONS -->
                <template v-else>
                  <tr v-for="item in filteredInquiries" :key="item.id" :class="{ 'unread-row': item.status === 'new' }">
                    <td>
                      <div class="flex items-center gap-2">
                        <span v-if="isPartnerApp(item.subject)" class="type-tag tag-partner">
                          <i class="mdi mdi-office-building"></i> Partner Application
                        </span>
                        <span v-else class="type-tag tag-general">
                          <i class="mdi mdi-message-text"></i> Inquiry
                        </span>
                      </div>
                      <div class="subject-text mt-1">{{ item.subject || 'General Inquiry' }}</div>
                    </td>
                    <td>
                      <div class="font-bold text-slate-900">
                        {{ isPartnerApp(item.subject) ? parsePartnerDetails(item).institution : item.name }}
                      </div>
                      <div v-if="isPartnerApp(item.subject)" class="text-xs text-slate-500 font-medium">Contact: {{ item.name }}</div>
                    </td>
                    <td>
                      <a :href="`mailto:${item.email}`" class="text-xs text-red hover:underline font-medium block">{{ item.email }}</a>
                      <span class="text-slate-500 text-xs">{{ item.phone || 'No phone' }}</span>
                    </td>
                    <td>
                      <span class="text-xs text-slate-500 font-medium">{{ formatDate(item.submitted_at) }}</span>
                    </td>
                    <td>
                      <button class="status-btn" :class="getStatusClass(item.status)" @click="toggleStatus(item)">
                        {{ item.status.toUpperCase() }}
                      </button>
                    </td>
                    <td>
                      <div class="actions-cell">
                        <button class="btn-table-action btn-view" title="View Submission" @click="openViewModal(item)">
                          <i class="mdi mdi-eye-outline"></i> View
                        </button>
                        <a :href="`mailto:${item.email}?subject=Re: ${encodeURIComponent(item.subject || 'Inquiry')}`" class="btn-table-action btn-edit" title="Send Email Reply">
                          <i class="mdi mdi-reply"></i> Reply
                        </a>
                        <button class="btn-table-action btn-danger" title="Delete Inquiry" @click="confirmDelete(item)">
                          <i class="mdi mdi-trash-can-outline"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>

    <!-- ═══ INQUIRY & PARTNER APPLICATION DETAIL MODAL ═══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="detailModalOpen" class="modal-overlay" @click.self="detailModalOpen = false">
          <div class="modal-card">
            
            <!-- Modal Header -->
            <div class="modal-header">
              <div class="flex items-center gap-3">
                <div :class="['icon-box-lg', isPartnerApp(selectedItem?.subject) ? 'bg-emerald-light text-emerald' : 'bg-indigo-light text-indigo']">
                  <i :class="['mdi', isPartnerApp(selectedItem?.subject) ? 'mdi-office-building' : 'mdi-email-outline']"></i>
                </div>
                <div>
                  <h3 class="modal-title">
                    {{ isPartnerApp(selectedItem?.subject) ? 'Institutional Partner Accreditation Application' : 'General Contact Submission' }}
                  </h3>
                  <span class="text-xs text-slate-500 font-medium">Received {{ formatDate(selectedItem?.submitted_at) }}</span>
                </div>
              </div>
              <button class="modal-close-btn" @click="detailModalOpen = false"><i class="mdi mdi-close"></i></button>
            </div>

            <div class="modal-body space-y-5">
              
              <!-- IF PARTNER APPLICATION: SHOW STRUCTURED INSTITUTION CARD -->
              <div v-if="isPartnerApp(selectedItem?.subject)" class="partner-details-grid space-y-4">
                <div class="sender-info-box">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <span class="detail-label">Institution Name:</span>
                      <span class="detail-val text-indigo-900 font-black">{{ parsePartnerDetails(selectedItem).institution }}</span>
                    </div>
                    <div>
                      <span class="detail-label">Country Jurisdiction:</span>
                      <span class="detail-val">{{ parsePartnerDetails(selectedItem).country }}</span>
                    </div>
                    <div>
                      <span class="detail-label">Contact Person:</span>
                      <span class="detail-val">{{ selectedItem?.name }}</span>
                    </div>
                    <div>
                      <span class="detail-label">Application Status:</span>
                      <span :class="['status-btn', getStatusClass(selectedItem?.status)]">{{ selectedItem?.status.toUpperCase() }}</span>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="info-card-sm">
                    <span class="detail-label">Email Address:</span>
                    <a :href="`mailto:${selectedItem?.email}`" class="detail-val text-red hover:underline">{{ selectedItem?.email }}</a>
                  </div>
                  <div class="info-card-sm">
                    <span class="detail-label">Phone / WhatsApp:</span>
                    <span class="detail-val">{{ selectedItem?.phone || 'Not provided' }}</span>
                  </div>
                </div>

                <div>
                  <span class="detail-label block mb-1">Facility Details &amp; Applicant Notes:</span>
                  <div class="message-content-box whitespace-pre-line">{{ parsePartnerDetails(selectedItem).notes }}</div>
                </div>
              </div>

              <!-- IF GENERAL INQUIRY: SHOW REGULAR INQUIRY CARD -->
              <div v-else class="space-y-4">
                <div class="sender-info-box">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <span class="detail-label">Sender Name:</span>
                      <span class="detail-val">{{ selectedItem?.name }}</span>
                    </div>
                    <div>
                      <span class="detail-label">Email Address:</span>
                      <a :href="`mailto:${selectedItem?.email}`" class="detail-val text-red hover:underline">{{ selectedItem?.email }}</a>
                    </div>
                    <div>
                      <span class="detail-label">Phone Number:</span>
                      <span class="detail-val">{{ selectedItem?.phone || 'Not provided' }}</span>
                    </div>
                    <div>
                      <span class="detail-label">Status:</span>
                      <span :class="['status-btn', getStatusClass(selectedItem?.status)]">{{ selectedItem?.status.toUpperCase() }}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span class="detail-label block mb-1">Subject Header:</span>
                  <div class="subject-box">{{ selectedItem?.subject }}</div>
                </div>

                <div>
                  <span class="detail-label block mb-1">Inquiry Message Text:</span>
                  <div class="message-content-box whitespace-pre-line">{{ selectedItem?.message }}</div>
                </div>
              </div>

            </div>

            <div class="modal-footer flex items-center justify-between">
              <div class="flex items-center gap-2">
                <button class="btn-glass text-xs" @click="updateStatus(selectedItem, 'read')" :disabled="selectedItem?.status === 'read'">
                  Mark Read
                </button>
                <button class="btn-glass text-xs text-emerald" @click="updateStatus(selectedItem, 'replied')" :disabled="selectedItem?.status === 'replied'">
                  Mark Replied
                </button>
              </div>

              <div class="flex items-center gap-2">
                <button class="btn-glass" @click="detailModalOpen = false">Close</button>
                <a :href="`mailto:${selectedItem?.email}?subject=Re: ${encodeURIComponent(selectedItem?.subject || 'Inquiry')}`" class="btn-red text-decoration-none">
                  <i class="mdi mdi-reply"></i> Send Reply Email
                </a>
              </div>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import dayjs from 'dayjs';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  roles: ['super_admin', 'main_admin', 'sub_admin']
});

const api = useApi();
const loading = ref(true);
const inquiries = ref<any[]>([]);

const activeTab = ref<'all' | 'partner' | 'general'>('all');
const searchQuery = ref('');
const statusFilter = ref('all');

const detailModalOpen = ref(false);
const selectedItem = ref<any>(null);

const isPartnerApp = (subject: string) => {
  if (!subject) return false;
  const s = subject.toLowerCase();
  return s.includes('partner application') || s.includes('partnership') || s.includes('accreditation:');
};

const parsePartnerDetails = (item: any) => {
  if (!item || !item.message) {
    return { institution: item?.name || 'Institution', country: 'Global Jurisdiction', notes: item?.message || '' };
  }

  const msg = item.message;
  let institution = '';
  let country = '';
  let notes = msg;

  const instMatch = msg.match(/Organization Name:\s*(.+)/i) || msg.match(/Institution:\s*(.+)/i);
  if (instMatch) institution = instMatch[1].trim();

  const countryMatch = msg.match(/Country:\s*(.+)/i);
  if (countryMatch) country = countryMatch[1].trim();

  const notesMatch = msg.match(/Notes:\s*([\s\S]+)/i) || msg.match(/Additional Message:\s*([\s\S]+)/i);
  if (notesMatch) notes = notesMatch[1].trim();

  if (!institution && item.subject) {
    const parts = item.subject.split('-');
    if (parts.length > 1) institution = parts[parts.length - 1].trim();
  }

  return {
    institution: institution || item.name || 'Training Center',
    country: country || 'Global Jurisdiction',
    notes: notes || msg
  };
};

const partnerCount = computed(() => inquiries.value.filter(i => isPartnerApp(i.subject)).length);
const generalCount = computed(() => inquiries.value.filter(i => !isPartnerApp(i.subject)).length);
const unreadCount = computed(() => inquiries.value.filter(i => i.status === 'new').length);

const filteredInquiries = computed(() => {
  return inquiries.value.filter(item => {
    // Tab filter
    if (activeTab.value === 'partner' && !isPartnerApp(item.subject)) return false;
    if (activeTab.value === 'general' && isPartnerApp(item.subject)) return false;

    // Status filter
    if (statusFilter.value !== 'all' && item.status !== statusFilter.value) return false;

    // Search query
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const matchName = item.name && item.name.toLowerCase().includes(q);
      const matchEmail = item.email && item.email.toLowerCase().includes(q);
      const matchSubject = item.subject && item.subject.toLowerCase().includes(q);
      const matchMsg = item.message && item.message.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchSubject && !matchMsg) return false;
    }

    return true;
  });
});

const fetchInquiries = async () => {
  loading.value = true;
  try {
    const res = await api.get('/admin/inquiries');
    inquiries.value = res.data || res || [];
  } catch (err) {
    console.error('Failed to fetch inquiries:', err);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  return dayjs(dateStr).format('MMM DD, YYYY · h:mm A');
};

const getStatusClass = (status: string) => {
  switch (status) {
    case 'new': return 'status-new';
    case 'read': return 'status-read';
    case 'replied': return 'status-replied';
    default: return 'status-read';
  }
};

const toggleStatus = async (item: any) => {
  const nextStatus = item.status === 'new' ? 'read' : item.status === 'read' ? 'replied' : 'new';
  await updateStatus(item, nextStatus);
};

const updateStatus = async (item: any, newStatus: string) => {
  try {
    await api.patch(`/admin/inquiries/${item.id}/status`, { status: newStatus });
    item.status = newStatus;
  } catch (err) {
    console.error('Failed to update status:', err);
  }
};

const openViewModal = (item: any) => {
  selectedItem.value = item;
  detailModalOpen.value = true;
  if (item.status === 'new') {
    updateStatus(item, 'read');
  }
};

const confirmDelete = async (item: any) => {
  if (!confirm(`Are you sure you want to delete submission from ${item.name}?`)) return;
  try {
    await api.delete(`/admin/inquiries/${item.id}`);
    inquiries.value = inquiries.value.filter(i => i.id !== item.id);
  } catch (err) {
    alert('Failed to delete submission');
  }
};

onMounted(() => {
  fetchInquiries();
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
  text-decoration: none;
}
.btn-glass:hover { background: #F8FAFC; color: #E31B23; border-color: rgba(227, 27, 35, 0.3); }

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
  text-decoration: none;
}
.btn-red:hover { background: #C4131B; transform: translateY(-1px); }

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
  cursor: pointer;
  transition: all 0.2s ease;
}
.kpi-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06); }
.kpi-active { border-color: #E31B23; background: #FFFDFD; }

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

/* Panel & Controls */
.panel-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
}

.table-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.tab-pill-group {
  display: flex;
  gap: 6px;
  background: #FAFAFD;
  padding: 4px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.pill-tab-btn {
  background: transparent;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;
}
.pill-tab-btn.active {
  background: #FFFFFF;
  color: #E31B23;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
}

.search-filter-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  position: relative;
  width: 280px;
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
}
.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  font-size: 0.84rem;
  outline: none;
  background: #FFFFFF;
}
.search-input:focus { border-color: #E31B23; }

.filter-select {
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  font-size: 0.84rem;
  font-weight: 700;
  color: #334155;
  background: #FFFFFF;
  outline: none;
  cursor: pointer;
}

/* Table */
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
.unread-row { background: #FFFDFD; font-weight: 600; }

.type-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 50px;
  font-size: 0.72rem;
  font-weight: 800;
}
.tag-partner { background: rgba(16, 185, 129, 0.1); color: #059669; }
.tag-general { background: rgba(79, 70, 229, 0.1); color: #4F46E5; }

.subject-text { font-size: 0.88rem; font-weight: 700; color: #0F172A; }

.status-btn {
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.72rem;
  font-weight: 800;
  border: none;
  cursor: pointer;
}
.status-new { background: rgba(227, 27, 35, 0.1); color: #E31B23; }
.status-read { background: rgba(100, 116, 139, 0.1); color: #64748B; }
.status-replied { background: rgba(16, 185, 129, 0.1); color: #059669; }

.actions-cell { display: flex; align-items: center; gap: 8px; }

.btn-table-action {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #FFFFFF;
  color: #334155;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  transition: all 0.2s;
}
.btn-table-action:hover { background: #F8FAFC; color: #E31B23; }
.btn-danger:hover { background: #FEF2F2; color: #E31B23; border-color: rgba(227, 27, 35, 0.3); }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}

.modal-card {
  background: #FFFFFF;
  border-radius: 24px;
  width: 100%;
  max-width: 580px;
  max-height: calc(100vh - 48px);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.icon-box-lg {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}

.modal-title { font-size: 1.1rem; font-weight: 800; color: #0F172A; margin: 0; line-height: 1.3; }
.modal-close-btn { background: #F1F5F9; border: none; width: 32px; height: 32px; border-radius: 50%; color: #64748B; cursor: pointer; }

.modal-body { padding: 24px; overflow-y: auto; flex: 1; }

.sender-info-box {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  padding: 16px;
}
.info-card-sm {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  padding: 12px 14px;
}

.detail-label { font-size: 0.72rem; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }
.detail-val { font-size: 0.88rem; font-weight: 700; color: #0F172A; display: block; margin-top: 2px; }

.subject-box {
  font-size: 0.92rem;
  font-weight: 800;
  color: #0F172A;
  background: #F1F5F9;
  padding: 10px 14px;
  border-radius: 10px;
}

.message-content-box {
  font-size: 0.88rem;
  color: #334155;
  line-height: 1.6;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 16px;
  border-radius: 14px;
}

.modal-footer {
  padding: 16px 24px;
  background: #FAFAFD;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}
</style>
