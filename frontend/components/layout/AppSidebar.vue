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

  const fullPath = route.fullPath;
  const currentPath = route.path;
  const targetRoute = item.route;

  // Exact query route match (e.g. /sub-center?tab=batches vs /sub-center?tab=students)
  if (targetRoute.includes('?')) {
    return fullPath === targetRoute;
  }

  // If current URL has a query string (e.g. /sub-center?tab=batches), check if another nav item matches this exact query route
  if (fullPath.includes('?')) {
    const hasQueryMatch = navStore.filteredNavItems.some(i => i.route === fullPath);
    if (hasQueryMatch) return false;
  }

  const basePath = targetRoute.split('?')[0];

  // Root landing routes match path exactly
  const rootLandingRoutes = ['/dashboard/admin', '/dashboard', '/sub-center', '/'];
  if (rootLandingRoutes.includes(basePath)) {
    return currentPath === basePath;
  }

  return currentPath === basePath || currentPath.startsWith(basePath + '/');
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
  background-color: #FFFFFF !important;
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
  position: relative !important;
  overflow: hidden !important;
  min-height: 44px !important;
  border-radius: 12px !important;
  padding: 0 14px !important;
  margin-bottom: 4px !important;
  color: #526071 !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

:deep(.gsfin-nav-item:hover) {
  background-color: #F8FAFC !important;
  color: #0F172A !important;
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
  background-color: #FEF2F2 !important;
  color: #E31B23 !important;
  box-shadow: 0 2px 8px rgba(227, 27, 35, 0.08) !important;
}

:deep(.gsfin-nav-item-active::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 4px;
  background-color: #E31B23;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
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
  background-color: #FFFFFF;
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


