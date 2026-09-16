<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- Header Row -->
      <div class="admin-header-row">
        <div>
          <div class="eyebrow-chip mb-1">
            <i class="mdi mdi-bell-ring-outline"></i> SYSTEM &amp; PLATFORM ALERTS
          </div>
          <h1 class="admin-title">Notifications</h1>
          <p class="admin-subtitle">Stay updated with real-time exam, qualification, and certificate alerts.</p>
        </div>

        <div class="header-actions">
          <button v-if="notifications.length > 0 && unreadCount > 0" class="btn-glass" @click="markAllAsRead">
            <i class="mdi mdi-check-all"></i> Mark all as read
          </button>
          <button v-if="canSendTest" class="btn-red" @click="sendTestNotification" :disabled="sendingTest">
            <i class="mdi mdi-send-outline"></i> {{ sendingTest ? 'Sending...' : 'Send Test Alert' }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16 text-slate-500 font-medium">
        <span class="spinner-sm-red mb-2"></span>
        <p class="text-sm">Loading your notifications...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="notifications.length === 0" class="panel-card pa-12 text-center">
        <i class="mdi mdi-bell-off-outline text-5xl text-slate-300 mb-3"></i>
        <h3 class="font-bold text-slate-900 text-lg">No Notifications Yet</h3>
        <p class="text-slate-500 text-sm max-w-sm mx-auto mt-1 mb-6">
          When exam reminders, certificate issues, or system alerts occur, they will appear here in real time.
        </p>
        <button v-if="canSendTest" class="btn-red" @click="sendTestNotification">
          <i class="mdi mdi-lightning-bolt-outline"></i> Trigger Test Notification
        </button>
      </div>

      <!-- Notifications List -->
      <div v-else class="space-y-4">
        <div 
          v-for="n in notifications" 
          :key="n.id" 
          class="notif-card"
          :class="{ 'unread-card': !n.is_read }"
          @click="handleNotificationClick(n)"
        >
          <div class="notif-icon-box" :class="getTypeIconClass(n.type)">
            <i :class="['mdi', getTypeIcon(n.type)]"></i>
          </div>

          <div class="notif-content">
            <div class="notif-head">
              <span class="notif-title">{{ n.title }}</span>
              <span class="notif-time">{{ timeAgo(n.created_at) }}</span>
            </div>
            <p class="notif-msg">{{ n.message || n.body }}</p>
            <div v-if="n.link" class="notif-link-chip">
              <i class="mdi mdi-open-in-new"></i> View linked details
            </div>
          </div>

          <div class="notif-actions" @click.stop>
            <span v-if="!n.is_read" class="unread-pill">New</span>
            <button class="btn-del-icon" title="Delete notification" @click="deleteNotification(n.id)">
              <i class="mdi mdi-trash-can-outline"></i>
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { useAuthStore } from '@/stores/auth';
import { useSocket } from '@/composables/useSocket';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
});

const api = useApi();
const authStore = useAuthStore();
const { socket } = useSocket();

const loading = ref(true);
const sendingTest = ref(false);
const notifications = ref<any[]>([]);

const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length);
const canSendTest = computed(() => {
  const role = authStore.userRole;
  return ['super_admin', 'main_admin', 'sub_admin', 'tutor'].includes(role);
});

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    success: 'mdi-check-circle-outline',
    warning: 'mdi-alert-outline',
    error: 'mdi-alert-circle-outline',
    system: 'mdi-cog-outline',
    info: 'mdi-information-outline',
    cert_issued: 'mdi-certificate-outline',
    exam_alert: 'mdi-file-document-edit-outline',
    announcement: 'mdi-bullhorn-outline'
  };
  return icons[type] || 'mdi-bell-outline';
};

const getTypeIconClass = (type: string) => {
  const classes: Record<string, string> = {
    success: 'bg-emerald-light text-emerald',
    warning: 'bg-amber-light text-amber',
    error: 'bg-red-light text-red',
    system: 'bg-slate-light text-slate-700',
    info: 'bg-indigo-light text-indigo',
    cert_issued: 'bg-emerald-light text-emerald',
    exam_alert: 'bg-amber-light text-amber',
    announcement: 'bg-red-light text-red'
  };
  return classes[type] || 'bg-slate-light text-slate-700';
};

const timeAgo = (date: string) => dayjs(date).fromNow();

const fetchNotifications = async () => {
  loading.value = true;
  try {
    const res = await api.get('/notifications');
    notifications.value = res.data || res || [];
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
  } finally {
    loading.value = false;
  }
};

const handleNotificationClick = async (n: any) => {
  if (!n.is_read) {
    try {
      await api.put(`/notifications/${n.id}/read`);
      n.is_read = true;
    } catch (err) {}
  }
  if (n.link) {
    navigateTo(n.link);
  }
};

const markAllAsRead = async () => {
  try {
    await api.put('/notifications/read-all');
    notifications.value.forEach(n => n.is_read = true);
  } catch (err) {}
};

const deleteNotification = async (id: string) => {
  try {
    await api.delete(`/notifications/${id}`);
    notifications.value = notifications.value.filter(n => n.id !== id);
  } catch (err) {
    console.error('Failed to delete notification:', err);
  }
};

const sendTestNotification = async () => {
  sendingTest.value = true;
  try {
    await api.post('/notifications/send', {
      type: 'cert_issued',
      title: 'Real-time System Test Notification',
      message: 'This is a test alert confirming that the GSFIN real-time notification engine is working smoothly!',
      link: '/dashboard/admin/qualifications'
    });
    await fetchNotifications();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to send test notification');
  } finally {
    sendingTest.value = false;
  }
};

onMounted(() => {
  fetchNotifications();
  if (socket.value) {
    socket.value.on('notification', (notif: any) => {
      notifications.value.unshift(notif);
    });
  }
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.off('notification');
  }
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
  max-width: 1000px;
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

.panel-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
}

.notif-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 18px 22px;
  display: flex;
  align-items: flex-start;
  gap: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
}
.notif-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
  border-color: rgba(227, 27, 35, 0.25);
}
.unread-card {
  border-left: 4px solid #E31B23;
  background: #FFFDFD;
}

.notif-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}
.bg-amber-light { background: rgba(245, 158, 11, 0.1); }
.bg-indigo-light { background: rgba(79, 70, 229, 0.1); }
.bg-emerald-light { background: rgba(16, 185, 129, 0.1); }
.bg-red-light { background: rgba(227, 27, 35, 0.1); }
.bg-slate-light { background: rgba(100, 116, 139, 0.1); }

.text-amber { color: #D97706; }
.text-indigo { color: #4F46E5; }
.text-emerald { color: #059669; }
.text-red { color: #E31B23; }

.notif-content { flex: 1; }
.notif-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.notif-title { font-size: 0.95rem; font-weight: 800; color: #0F172A; }
.notif-time { font-size: 0.74rem; font-weight: 600; color: #94A3B8; }
.notif-msg { font-size: 0.88rem; color: #475569; margin: 4px 0 0 0; line-height: 1.45; }

.notif-link-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.74rem;
  font-weight: 700;
  color: #E31B23;
  margin-top: 8px;
}

.notif-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unread-pill {
  padding: 2px 8px;
  border-radius: 50px;
  font-size: 0.68rem;
  font-weight: 800;
  background: rgba(227, 27, 35, 0.1);
  color: #E31B23;
  text-transform: uppercase;
}

.btn-del-icon {
  background: #F1F5F9;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  color: #64748B;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.btn-del-icon:hover { background: rgba(227, 27, 35, 0.1); color: #E31B23; }
</style>
