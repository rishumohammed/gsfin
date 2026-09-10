<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ TOP HEADER ═══ -->
      <div class="admin-header-row">
        <div>
          <div class="eyebrow-red">SYSTEM ADMINISTRATION</div>
          <h1 class="admin-title">System Users &amp; Access Control</h1>
          <p class="admin-subtitle">Manage internal staff accounts, administrative roles, and system permissions.</p>
        </div>

        <div class="header-actions">
          <button class="btn-glass" @click="showAuditLogs = true">
            <i class="mdi mdi-history"></i> Audit Logs
          </button>
          <button class="btn-red" @click="openAddModal">
            <i class="mdi mdi-account-plus"></i> Add System User
          </button>
        </div>
      </div>

      <!-- ═══ STATS METRICS ROW ═══ -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon-box bg-blue-light">
            <i class="mdi mdi-account-group text-blue"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Total System Users</span>
            <span class="metric-value">{{ stats.total || 0 }}</span>
            <span class="metric-sub text-blue">Staff &amp; Admins</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box bg-emerald-light">
            <i class="mdi mdi-account-check text-emerald"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Active Accounts</span>
            <span class="metric-value">{{ stats.active || 0 }}</span>
            <span class="metric-sub text-emerald">Authorized Access</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box bg-red-light">
            <i class="mdi mdi-shield-account text-red"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Super Admins</span>
            <span class="metric-value">{{ stats.superAdmin || 0 }}</span>
            <span class="metric-sub text-red">Full Authority Access</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box bg-amber-light">
            <i class="mdi mdi-account-key text-amber"></i>
          </div>
          <div class="metric-info">
            <span class="metric-label">Sub Admins</span>
            <span class="metric-value">{{ stats.subAdmin || 0 }}</span>
            <span class="metric-sub text-amber">Granular Permissions</span>
          </div>
        </div>
      </div>

      <!-- ═══ USERS TABLE PANEL ═══ -->
      <div class="panel-card mt-4">
        <div class="panel-card-header">
          <div class="search-input-wrap">
            <i class="mdi mdi-magnify search-icon"></i>
            <input
              v-model="search"
              type="text"
              placeholder="Search system users by name or email..."
              class="table-search-input"
            />
          </div>
          <span class="total-count-badge">Total Accounts: {{ filteredUsers.length }}</span>
        </div>

        <div class="table-responsive">
          <table class="gsfin-table">
            <thead>
              <tr>
                <th>User Account</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="6" class="text-center py-8 text-slate-500">
                  <span class="spinner-sm-red"></span> Loading Users...
                </td>
              </tr>
              <tr v-else-if="filteredUsers.length === 0">
                <td colspan="6" class="text-center py-8 text-slate-500">
                  <i class="mdi mdi-account-off-outline text-3xl block mb-2 text-slate-400"></i>
                  No System Users Found
                </td>
              </tr>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>
                  <div class="user-cell">
                    <div class="user-avatar">{{ getUserInitials(user.name) }}</div>
                    <div>
                      <div class="user-name">{{ user.name }}</div>
                      <div class="user-email text-slate-500">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span :class="['badge-role', getRoleBadgeClass(user.role)]">
                    {{ formatRole(user.role) }}
                  </span>
                </td>
                <td>
                  <span :class="['badge-chip', user.status === 'active' ? 'chip-green' : 'chip-amber']">
                    {{ user.status }}
                  </span>
                </td>
                <td class="text-slate-500">
                  {{ user.last_login_at ? formatDate(user.last_login_at) : 'Never' }}
                </td>
                <td class="text-slate-500">
                  {{ formatDate(user.created_at) }}
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="btn-table-action btn-edit" title="Edit Permissions" @click="openEditModal(user)">
                      <i class="mdi mdi-pencil"></i>
                    </button>
                    <button class="btn-table-action btn-warn" title="Reset Password" @click="resetPassword(user)">
                      <i class="mdi mdi-key-variant"></i>
                    </button>
                    <button
                      class="btn-table-action"
                      :class="user.status === 'active' ? 'btn-warn' : 'btn-success'"
                      :title="user.status === 'active' ? 'Suspend Account' : 'Activate Account'"
                      @click="toggleStatus(user)"
                    >
                      <i :class="['mdi', user.status === 'active' ? 'mdi-account-minus' : 'mdi-account-check']"></i>
                    </button>
                    <button class="btn-table-action btn-danger" title="Delete Account" @click="confirmDelete(user)">
                      <i class="mdi mdi-trash-can-outline"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- ═══ MODALS ═══ -->
    <SystemUserModal
      v-model="showUserModal"
      :user="selectedUser"
      @saved="fetchData"
    />

    <!-- Audit Logs Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAuditLogs" class="modal-overlay" @click.self="showAuditLogs = false">
          <div class="modal-card modal-lg">
            <div class="modal-header">
              <h3>System User Audit Logs</h3>
              <button class="modal-close-btn" @click="showAuditLogs = false"><i class="mdi mdi-close"></i></button>
            </div>
            <div class="modal-body">
              <div class="table-responsive">
                <table class="gsfin-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Admin Name</th>
                      <th>Action</th>
                      <th>Target User</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="loadingAudit">
                      <td colspan="4" class="text-center py-6 text-slate-500">
                        <span class="spinner-sm-red"></span> Loading Audit Logs...
                      </td>
                    </tr>
                    <tr v-else-if="auditLogs.length === 0">
                      <td colspan="4" class="text-center py-6 text-slate-500">No Audit Logs Recorded</td>
                    </tr>
                    <tr v-for="log in auditLogs" :key="log.id">
                      <td class="text-slate-500">{{ formatDate(log.created_at) }}</td>
                      <td class="font-weight-bold text-slate-900">{{ log.admin_name || 'System' }}</td>
                      <td>
                        <span class="chip-blue badge-chip">{{ log.action }}</span>
                      </td>
                      <td>{{ log.target || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-glass" @click="showAuditLogs = false">Close</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Temp Password Dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showPasswordDialog" class="modal-overlay" @click.self="showPasswordDialog = false">
          <div class="modal-card modal-sm text-center pa-6">
            <i class="mdi mdi-key-variant text-amber text-5xl mb-2"></i>
            <h3 class="font-weight-bold text-slate-900 text-xl mb-2">Temporary Password Generated</h3>
            <p class="text-slate-500 text-sm mb-4">Please copy and securely share this password with the user:</p>
            <div class="pw-copy-box mb-4">
              <code>{{ tempPassword }}</code>
              <button class="btn-copy" @click="copyPassword">
                <i class="mdi mdi-content-copy"></i> {{ copied ? 'Copied!' : 'Copy' }}
              </button>
            </div>
            <button class="btn-red w-100" @click="showPasswordDialog = false">Done</button>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import SystemUserModal from '@/components/system-users/SystemUserModal.vue';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
});

const api = useApi();
const loading = ref(false);
const users = ref<any[]>([]);
const stats = ref<any>({});
const search = ref('');

const showUserModal = ref(false);
const selectedUser = ref<any>(null);

const showAuditLogs = ref(false);
const auditLogs = ref<any[]>([]);
const loadingAudit = ref(false);

const showPasswordDialog = ref(false);
const tempPassword = ref('');
const copied = ref(false);

const filteredUsers = computed(() => {
  if (!search.value.trim()) return users.value;
  const q = search.value.toLowerCase();
  return users.value.filter(u =>
    (u.name || '').toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q) ||
    (u.role || '').toLowerCase().includes(q)
  );
});

const getUserInitials = (name: string) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

const formatRole = (role: string) => {
  if (!role) return '';
  return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'super_admin': return 'role-super';
    case 'main_admin': return 'role-main';
    case 'sub_admin': return 'role-sub';
    default: return 'role-default';
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const fetchData = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/admin/system-users');
    users.value = data.users || [];
    stats.value = data.stats || {};
  } catch (err) {
    console.error('Failed to fetch users:', err);
  } finally {
    loading.value = false;
  }
};

const fetchAuditLogs = async () => {
  loadingAudit.value = true;
  try {
    const { data } = await api.get('/admin/system-users/audit-logs');
    auditLogs.value = data || [];
  } catch (err) {
    console.error('Failed to fetch audit logs:', err);
  } finally {
    loadingAudit.value = false;
  }
};

watch(showAuditLogs, (val) => {
  if (val && auditLogs.value.length === 0) fetchAuditLogs();
});

const openAddModal = () => {
  selectedUser.value = null;
  showUserModal.value = true;
};

const openEditModal = (user: any) => {
  selectedUser.value = { ...user };
  showUserModal.value = true;
};

const toggleStatus = async (user: any) => {
  const newStatus = user.status === 'active' ? 'suspended' : 'active';
  if (!confirm(`Are you sure you want to ${newStatus} this user?`)) return;

  try {
    await api.put(`/admin/system-users/${user.id}/status`, { status: newStatus });
    fetchData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to update status');
  }
};

const resetPassword = async (user: any) => {
  if (!confirm(`Generate a new temporary password for ${user.name}?`)) return;

  try {
    const { data } = await api.post(`/admin/system-users/${user.id}/reset-password`);
    tempPassword.value = data.tempPassword;
    copied.value = false;
    showPasswordDialog.value = true;
    fetchData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to reset password');
  }
};

const copyPassword = () => {
  navigator.clipboard.writeText(tempPassword.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 3000);
};

const confirmDelete = async (user: any) => {
  if (!confirm(`WARNING: Are you sure you want to delete ${user.name}?`)) return;

  try {
    await api.delete(`/admin/system-users/${user.id}`);
    fetchData();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to delete user');
  }
};

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

.admin-wrap { max-width: 1300px; margin: 0 auto; }

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

.admin-subtitle { font-size: 0.92rem; color: #64748B; margin: 0; }

.header-actions { display: flex; align-items: center; gap: 12px; }

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
.btn-red:hover { background: #C4131B; transform: translateY(-1px); }

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
.btn-glass:hover { background: #E2E8F0; }

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

.bg-blue-light { background: rgba(59, 130, 246, 0.1); }
.text-blue { color: #2563EB; }
.bg-emerald-light { background: rgba(16, 185, 129, 0.1); }
.text-emerald { color: #059669; }
.bg-amber-light { background: rgba(245, 158, 11, 0.1); }
.text-amber { color: #D97706; }
.bg-red-light { background: rgba(227, 27, 35, 0.1); }
.text-red { color: #E31B23; }

.metric-info { display: flex; flex-direction: column; }
.metric-label { font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; }
.metric-value { font-size: 1.8rem; font-weight: 900; color: #0F172A; line-height: 1.2; margin: 2px 0; }
.metric-sub { font-size: 0.76rem; font-weight: 700; }

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

.search-input-wrap { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 14px; color: #94A3B8; font-size: 1.1rem; }
.table-search-input {
  padding: 9px 14px 9px 40px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  font-size: 0.86rem;
  color: #0F172A;
  outline: none;
  width: 300px;
}
.table-search-input:focus { border-color: #E31B23; }

.total-count-badge { font-size: 0.8rem; font-weight: 700; color: #64748B; }

.table-responsive { width: 100%; overflow-x: auto; }
.gsfin-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem; }
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
.gsfin-table td { padding: 16px 20px; border-bottom: 1px solid rgba(15, 23, 42, 0.06); color: #334155; vertical-align: middle; }
.gsfin-table tbody tr:hover { background: rgba(248, 250, 252, 0.8); }

.user-cell { display: flex; align-items: center; gap: 12px; }
.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #E31B23;
  color: #FFFFFF;
  font-weight: 800;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.user-name { font-weight: 800; color: #0F172A; }
.user-email { font-size: 0.8rem; }

.badge-role {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.72rem;
  font-weight: 800;
}
.role-super { background: rgba(227, 27, 35, 0.1); color: #E31B23; }
.role-main { background: rgba(79, 70, 229, 0.1); color: #4F46E5; }
.role-sub { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.role-default { background: rgba(100, 116, 139, 0.1); color: #64748B; }

.badge-chip { display: inline-block; padding: 4px 12px; border-radius: 50px; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; }
.chip-green { background: rgba(16, 185, 129, 0.1); color: #059669; }
.chip-amber { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.chip-blue { background: rgba(59, 130, 246, 0.1); color: #2563EB; }

.actions-cell { display: flex; align-items: center; gap: 6px; }

.btn-table-action {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.btn-edit { background: #F1F5F9; color: #334155; }
.btn-edit:hover { background: #E31B23; color: #FFFFFF; }
.btn-warn { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.btn-warn:hover { background: #D97706; color: #FFFFFF; }
.btn-success { background: rgba(16, 185, 129, 0.1); color: #059669; }
.btn-success:hover { background: #059669; color: #FFFFFF; }
.btn-danger { background: rgba(239, 68, 68, 0.1); color: #DC2626; }
.btn-danger:hover { background: #DC2626; color: #FFFFFF; }

.pw-copy-box {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pw-copy-box code { font-size: 1.1rem; font-weight: 800; color: #E31B23; letter-spacing: 0.05em; }
.btn-copy { background: #E31B23; color: #FFFFFF; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 0.78rem; cursor: pointer; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-card { background: #FFFFFF; border-radius: 20px; width: 100%; max-width: 500px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15); overflow: hidden; }
.modal-lg { max-width: 720px; }
.modal-sm { max-width: 400px; }
.modal-header { padding: 20px 24px; border-bottom: 1px solid rgba(15, 23, 42, 0.08); display: flex; align-items: center; justify-content: space-between; }
.modal-header h3 { font-size: 1.2rem; font-weight: 800; color: #0F172A; margin: 0; }
.modal-close-btn { background: #F1F5F9; border: none; width: 32px; height: 32px; border-radius: 50%; color: #64748B; cursor: pointer; }
.modal-body { padding: 24px; max-height: 70vh; overflow-y: auto; }
.modal-footer { padding: 16px 24px; background: #FAFAFD; border-top: 1px solid rgba(15, 23, 42, 0.06); display: flex; align-items: center; justify-content: flex-end; gap: 12px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.spinner-sm-red { width: 16px; height: 16px; border: 2px solid rgba(227, 27, 35, 0.2); border-top-color: #E31B23; border-radius: 50%; animation: spin 0.75s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
