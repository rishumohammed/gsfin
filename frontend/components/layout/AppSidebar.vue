<template>
  <v-navigation-drawer
    permanent
    :scrim="false"
    elevation="0"
    id="app-sidebar"
    :width="navStore.isCollapsed ? 80 : 280"
    class="sidebar-drawer"
  >

    <!-- Navigation Content -->
    <div class="nav-content custom-scrollbar py-3">
      <div v-for="section in navStore.sections" :key="section" class="nav-section mb-4">
        <v-fade-transition>
          <div v-if="!navStore.isCollapsed && section" class="section-label px-6 mb-2">
            {{ section }}
          </div>
        </v-fade-transition>

        <v-list density="compact" nav class="pa-0 px-3">
          <v-list-item
            v-for="item in navStore.filteredNavItems.filter(i => (i.section || '') === section)"
            :key="item.label + (item.route || '')"
            link
            class="gsfin-nav-item"
            :class="{ 'gsfin-nav-item-active': isItemActive(item) }"
            @click="handleItemClick(item)"
          >
            <template v-slot:prepend>
              <div class="icon-box">
                <v-icon :icon="item.icon" size="20"></v-icon>
              </div>
            </template>

            <v-list-item-title v-if="!navStore.isCollapsed" class="nav-title">
              {{ item.label }}
            </v-list-item-title>

            <template v-slot:append v-if="!navStore.isCollapsed && item.badge && Number(item.badge) > 0">
              <span class="nav-badge">{{ item.badge }}</span>
            </template>

            <!-- Tooltip for Collapsed Mode -->
            <client-only>
              <v-tooltip
                v-if="navStore.isCollapsed"
                activator="parent"
                location="right"
                offset="12"
              >
                <span class="font-bold text-xs">{{ item.label }}</span>
              </v-tooltip>
            </client-only>
          </v-list-item>
        </v-list>
      </div>
    </div>

    <!-- Sidebar Bottom User Quick Strip -->
    <div v-if="!navStore.isCollapsed && authStore.user" class="sidebar-footer p-4 border-t">
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-3">
          <div class="user-avatar-circle">
            {{ userInitials }}
          </div>
          <div class="d-flex flex-column text-truncate" style="max-width: 140px;">
            <span class="user-name text-truncate">{{ authStore.user.name }}</span>
            <span class="user-email text-truncate">{{ authStore.user.email }}</span>
          </div>
        </div>
        <v-btn icon variant="text" size="small" color="grey-darken-1" @click="authStore.logout()" title="Sign Out">
          <v-icon icon="mdi-logout" size="18"></v-icon>
        </v-btn>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useNavStore } from '@/stores/nav';
import { useUIStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { useDisplay } from 'vuetify';
import { computed, onMounted, watch } from 'vue';

const route = useRoute();
const router = useRouter();
const navStore = useNavStore();
const uiStore = useUIStore();
const authStore = useAuthStore();
const display = useDisplay();

const roleDisplayName = computed(() => {
  const role = authStore.userRole;
  if (role === 'super_admin') return 'Super Administrator';
  if (role === 'main_admin') return 'Main Administrator';
  if (role === 'sub_center_staff') return 'Sub-Center Staff';
  return 'System User';
});

const userInitials = computed(() => {
  if (!authStore.user?.name) return 'A';
  return authStore.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
});

const isItemActive = (item: any) => {
  if (!item.route) return false;

  if (item.route.includes('?')) {
    return route.fullPath === item.route;
  }

  if (route.fullPath.includes('?') && route.path === item.route.split('?')[0]) {
    return false;
  }

  if (item.route === '/dashboard' || item.route === '/') {
    return route.path === item.route;
  }

  return route.path === item.route || route.path.startsWith(item.route + '/');
};

const handleItemClick = (item: any) => {
  if (item.action === 'logout') {
    authStore.logout();
    return;
  }
  if (item.route) {
    router.push(item.route);
  }
  if (display.mobile.value) {
    uiStore.isSidebarOpen = false;
  }
};

onMounted(() => {
  navStore.initSidebar();
  navStore.fetchBadges();
});

watch(
  () => authStore.accessToken,
  (newToken) => {
    if (newToken) {
      navStore.fetchBadges();
    }
  }
);
</script>

<style scoped>
.sidebar-drawer {
  background-color: #F5F5F8 !important;
  border-right: 1px solid #E2E8F0 !important;
  z-index: 1000 !important;
  display: flex !important;
  flex-direction: column !important;
  height: 100vh !important;
}

.section-label {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8E9AA8;
  margin-top: 14px;
  margin-bottom: 6px;
  padding-left: 20px !important;
}

/* Nav Content */
.nav-content {
  flex: 1;
  overflow-y: auto;
}

/* Nav Item Styling matching reference image */
:deep(.gsfin-nav-item) {
  min-height: 44px !important;
  border-radius: 12px !important;
  padding: 0 14px !important;
  margin-bottom: 4px !important;
  color: #526071 !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

:deep(.gsfin-nav-item:hover) {
  background-color: #FFFFFF !important;
  color: #0F172A !important;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04) !important;
}

:deep(.gsfin-nav-item .icon-box) {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748B;
  transition: all 0.2s ease;
  margin-right: 12px;
}

:deep(.gsfin-nav-item:hover .icon-box) {
  color: #E31B23;
}

:deep(.gsfin-nav-item .nav-title) {
  font-size: 0.875rem !important;
  font-weight: 600 !important;
  color: inherit !important;
  line-height: 1.2 !important;
}

/* Active State matching reference styling */
:deep(.gsfin-nav-item-active) {
  background-color: #FFFFFF !important;
  color: #E31B23 !important;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06) !important;
  border-left: 3.5px solid #E31B23 !important;
}

:deep(.gsfin-nav-item-active .nav-title) {
  font-weight: 800 !important;
  color: #E31B23 !important;
}

:deep(.gsfin-nav-item-active .icon-box) {
  color: #E31B23 !important;
}

/* Pill badge matching reference image (e.g. 323 red badge) */
.nav-badge {
  background-color: #FF2D55;
  color: #FFFFFF;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 2px 9px;
  border-radius: 50px;
  box-shadow: 0 2px 6px rgba(255, 45, 85, 0.25);
  line-height: 1.3;
}

.sidebar-footer {
  border-top: 1px solid #E2E8F0;
  background-color: #F5F5F8;
}

.user-avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #FEF2F2;
  color: #E31B23;
  border: 1px solid #FCA5A5;
  font-weight: 900;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: #0F172A;
}

.user-email {
  font-size: 0.68rem;
  font-weight: 500;
  color: #64748B;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #E2E8F0;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #CBD5E1;
}
</style>


