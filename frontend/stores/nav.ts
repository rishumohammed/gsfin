import { defineStore } from 'pinia';
import { useAuthStore } from './auth';
import { useApi } from '@/composables/useApi';

export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  roles: string[];
  badge?: string | number;
  section?: string;
  target?: string;
  action?: string;
}

export const useNavStore = defineStore('nav', {
  state: () => ({
    isCollapsed: false,
    navItems: [
      // MAIN
      { label: 'Dashboard', icon: 'mdi-view-dashboard-outline', route: '/admin/multi-tenant?tab=overview', roles: ['super_admin', 'main_admin', 'sub_admin'] },
      
      // PARTNER MANAGEMENT
      { label: 'Partner Centers', icon: 'mdi-office-building-outline', route: '/admin/multi-tenant?tab=subcenters', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'PARTNER MANAGEMENT' },
      { label: 'Live Batches', icon: 'mdi-layers-triple-outline', route: '/admin/multi-tenant?tab=batches', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'PARTNER MANAGEMENT' },

      // EXAMS & CERTIFICATION
      { label: 'Exam Portal', icon: 'mdi-clipboard-text-outline', route: '/dashboard/admin/public-exams', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'EXAMS & CERTIFICATION' },
      { label: 'AI Proctoring', icon: 'mdi-shield-check-outline', route: '/dashboard/admin/proctoring', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'EXAMS & CERTIFICATION' },
      { label: 'Qualifications', icon: 'mdi-certificate-outline', route: '/dashboard/admin/qualifications', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'EXAMS & CERTIFICATION' },

      // TOKEN MANAGEMENT
      { label: 'Token Packages', icon: 'mdi-package-variant-closed', route: '/admin/multi-tenant?tab=packages', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'TOKEN MANAGEMENT' },
      { label: 'Token History', icon: 'mdi-clock-outline', route: '/admin/multi-tenant?tab=audit', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'TOKEN MANAGEMENT' },

      // PARTNER PORTAL
      { label: 'Partner Portal', icon: 'mdi-school-outline', route: '/sub-center', roles: ['sub_center_staff'], section: 'PARTNER PORTAL' },

      // SETTINGS
      { label: 'Settings', icon: 'mdi-cog-outline', route: '/dashboard/admin/settings', roles: ['super_admin', 'main_admin'], section: 'SETTINGS' },
      { label: 'FAQs', icon: 'mdi-help-circle-outline', route: '/dashboard/admin/faqs', roles: ['super_admin', 'main_admin'], section: 'SETTINGS' },
      { label: 'Logout', icon: 'mdi-logout-variant', action: 'logout', roles: ['super_admin', 'main_admin', 'sub_center_staff', 'sub_admin'], section: 'SETTINGS' },
    ] as NavItem[]
  }),
  getters: {
    filteredNavItems: (state) => {
      const authStore = useAuthStore();
      const role = authStore.userRole;
      
      return state.navItems
        .filter(item => item.roles.includes(role))
        .map(item => {
          // Dynamically point "Dashboard" to the role-specific landing page
          if (item.label === 'Dashboard') {
            let roleRoute = '/admin/multi-tenant';
            if (role === 'sub_center_staff') roleRoute = '/sub-center';
            return { ...item, route: roleRoute };
          }

          // Dynamically point "Profile" to the role-specific profile page
          if (item.label === 'Profile' && item.route === '/dashboard/profile') {
            let profileRoute = '/dashboard/admin/settings';
            if (role === 'sub_center_staff') profileRoute = '/sub-center';
            return { ...item, route: profileRoute };
          }

          return item;
        });
    },
    sections(): string[] {
      // Just map from filteredNavItems instead of duplicating logic
      return [...new Set(this.filteredNavItems.map((item: any) => item.section || ''))];
    }
  },
  actions: {
    async fetchBadges() {
      const authStore = useAuthStore();
      if (!authStore.accessToken) return;

      const api = useApi();

      // Fetch Admin Q&A unanswered badge (Disabled)
      /*
      if (authStore.userRole === 'tutor') {
      }
      */
    },
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarCollapsed', String(this.isCollapsed));
      }
    },
    initSidebar() {
      this.isCollapsed = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sidebarCollapsed');
      }
    }
  }
});
