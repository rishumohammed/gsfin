<template>
  <v-app-bar
    elevation="0"
    id="app-header"
    height="56"
  >
    <div class="header-content d-flex align-center px-6 w-100">

      <div class="d-flex align-center ml-2">
        <div class="logo-box d-flex align-center justify-center" :style="{ width: appLogo ? 'auto' : '32px', height: '32px' }">
          <img v-if="appLogo" :src="fullLogoUrl" alt="Logo" style="max-height: 32px; object-fit: contain;" />
          <v-icon v-else icon="mdi-orbit" color="primary" size="32" class="logo-icon"></v-icon>
        </div>
        <div v-if="!appLogo" class="ml-3 d-none d-sm-block">
          <div class="wordmark font-weight-black text-uppercase">{{ instituteName }}</div>
          <div class="version-label">PRODUCTION v1.0</div>
        </div>
      </div>
      
      <v-spacer></v-spacer>

      <div v-if="canSearch" class="search-pill d-none d-md-flex align-center px-3 mr-4">
        <v-icon icon="mdi-magnify" size="18" color="grey-darken-1" class="mr-2"></v-icon>
        <input type="text" v-model="searchQuery" placeholder="Search anything..." class="search-input" @keyup.enter="handleSearch" />
      </div>

      <div class="header-actions d-flex align-center">
        <v-btn variant="flat" color="#E31B23" class="mr-4 d-none d-sm-flex text-none font-weight-bold text-white shadow-xs" rounded="lg" size="small" href="/" target="_blank">
          <v-icon icon="mdi-open-in-new" start size="16"></v-icon>
          View Website
        </v-btn>

        <div class="mr-2">
          <NotificationBell />
        </div>
        
        <v-btn icon class="action-btn mr-4 d-none d-sm-flex" @click="supportModalRef?.open()">
          <v-icon icon="mdi-help-circle-outline" size="20"></v-icon>
        </v-btn>

        <v-menu location="bottom end" offset="10" transition="slide-y-transition" :scrim="false">
          <template v-slot:activator="{ props }">
            <v-avatar size="36" class="user-pill-avatar" v-bind="props">
              <span class="text-caption font-weight-bold text-red-700">{{ userInitials }}</span>
            </v-avatar>
          </template>
          
          <v-card width="250" rounded="xl" class="mt-2 border border-slate-200/80 shadow-xl overflow-hidden bg-white user-dropdown-card">
            <div class="pa-4 bg-slate-50/80 border-b border-slate-100">
              <div class="text-sm font-semibold text-slate-900 leading-tight mb-0.5">{{ authStore.user?.name || 'User Account' }}</div>
              <div class="text-[11px] font-semibold text-red-600 uppercase tracking-wider">{{ authStore.userRole }}</div>
            </div>
            <div class="user-dropdown-menu">
              <NuxtLink :to="profileLink" class="user-dropdown-item">
                <i class="mdi mdi-account-circle-outline user-dropdown-icon"></i>
                <span class="user-dropdown-text">My Profile</span>
              </NuxtLink>

              <NuxtLink v-if="settingsLink" :to="settingsLink" class="user-dropdown-item">
                <i class="mdi mdi-cog-outline user-dropdown-icon"></i>
                <span class="user-dropdown-text">Settings</span>
              </NuxtLink>

              <div class="user-dropdown-divider"></div>

              <button type="button" class="user-dropdown-item user-dropdown-logout" @click="handleLogout">
                <i class="mdi mdi-logout user-dropdown-logout-icon"></i>
                <span class="user-dropdown-logout-text">Logout</span>
              </button>
            </div>
          </v-card>
        </v-menu>
      </div>
    </div>
    <SupportModal ref="supportModalRef" />
  </v-app-bar>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { useNavStore } from '@/stores/nav';
import { useSocket } from '@/composables/useSocket';
import NotificationBell from './NotificationBell.vue';
import SupportModal from './SupportModal.vue';
import { useDisplay } from 'vuetify';

const authStore = useAuthStore();
const uiStore = useUIStore();
const navStore = useNavStore();
const { mobile } = useDisplay();
const { connect, disconnect } = useSocket();

const supportModalRef = ref<any>(null);
const searchQuery = ref('');
const instituteName = useState('instituteName', () => '');
const appLogo = useState('appLogo', () => '');
const config = useRuntimeConfig();

const fullLogoUrl = computed(() => {
  if (!appLogo.value) return '';
  const baseUrl = config.public.apiBase.replace('/api', '');
  return `${baseUrl}${appLogo.value}`;
});

const canSearch = computed(() => {
  const role = authStore.userRole;
  return role === 'super_admin' || role === 'main_admin';
});

const userInitials = computed(() => {
  if (!authStore.user?.name) return '??';
  return authStore.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
});

const profileLink = computed(() => {
  const role = authStore.userRole;
  if (role === 'sub_center_staff') return '/sub-center?tab=profile';
  return '/dashboard/profile';
});

const settingsLink = computed(() => {
  const role = authStore.userRole;
  if (role === 'sub_center_staff') return null;
  return '/dashboard/admin/settings';
});

onMounted(() => {
  if (authStore.isAuthenticated) connect();
});

onUnmounted(() => {
  disconnect();
});

const handleLogout = async () => {
  await authStore.logout();
};

const handleSearch = () => {
  if (!searchQuery.value) return;
  // Implement search logic or navigate to search results
  console.log('Searching for:', searchQuery.value);
};
</script>

<style scoped>
#app-header {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
  z-index: 1100; /* Above sidebar overlay but below sidebar rail */
  position: fixed !important;
  top: 0;
  right: 0;
  left: 0;
}

.header-content {
  height: 64px; /* Explicit height matching sidebar header */
  display: flex;
  align-items: center;
}

.logo-icon {
  filter: drop-shadow(0 4px 10px rgba(99, 102, 241, 0.3));
}

.wordmark {
  font-size: 16px;
  letter-spacing: 0.5px;
  color: #1e293b;
  line-height: 1;
}

.version-label {
  font-size: 9px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 1px;
  margin-top: 2px;
}

.search-pill {
  width: 280px;
  height: 36px;
  background: #F1F5F9;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.search-pill:focus-within {
  background: white;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.search-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 13px;
  color: var(--g6);
  outline: none;
}

.action-btn {
  width: 36px !important;
  height: 36px !important;
  background: #F1F5F9 !important;
  border-radius: 10px !important;
  border: 1px solid rgba(0, 0, 0, 0.04) !important;
  color: var(--g5) !important;
  transition: all 0.2s ease !important;
}

.action-btn:hover {
  background: #E2E8F0 !important;
  color: var(--g7) !important;
}

.user-pill-avatar {
  background: #f1f5f9;
  color: #1d1d1f;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.user-dropdown-card {
  background: #ffffff !important;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12) !important;
  font-family: inherit !important;
}

.user-dropdown-menu {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: #ffffff;
}

.user-dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  color: #1E293B !important;
  text-decoration: none !important;
  background: transparent;
  border: none;
  width: 100%;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  text-align: left;
}

.user-dropdown-icon {
  font-size: 1.15rem;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-dropdown-text {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1E293B;
  line-height: 1.2;
}

.user-dropdown-item:hover {
  background: #F1F5F9 !important;
}

.user-dropdown-item:hover .user-dropdown-icon {
  color: #0F172A;
}

.user-dropdown-item:hover .user-dropdown-text {
  color: #0F172A !important;
}

.user-dropdown-divider {
  height: 1px;
  background: rgba(15, 23, 42, 0.08);
  margin: 4px 6px;
}

.user-dropdown-logout-icon {
  font-size: 1.15rem;
  color: #DC2626;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-dropdown-logout-text {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #DC2626;
  line-height: 1.2;
}

.user-dropdown-logout:hover {
  background: #FEF2F2 !important;
}
</style>
