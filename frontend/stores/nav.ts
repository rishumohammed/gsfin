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
      { label: 'Dashboard', icon: 'mdi-view-dashboard-outline', route: '/admin/multi-tenant', roles: ['super_admin', 'main_admin', 'sub_admin'] },
      
      // SUB-CENTER MANAGEMENT
      { label: 'Sub-Center Accounts', icon: 'mdi-office-building', route: '/admin/multi-tenant?tab=subcenters', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'SUB-CENTER MANAGEMENT' },
      { label: 'Live Batches Feed', icon: 'mdi-view-dashboard', route: '/admin/multi-tenant?tab=overview', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'SUB-CENTER MANAGEMENT' },

      // EXAM CATALOG
      { label: 'Certification Exam Catalog', icon: 'mdi-file-certificate', route: '/admin/multi-tenant?tab=exams', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'EXAM CATALOG' },
      { label: 'Qualifications Catalog', icon: 'mdi-certificate-outline', route: '/dashboard/admin/qualifications', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'EXAM CATALOG' },

      // TOKEN MANAGEMENT
      { label: 'Token Packages Catalog', icon: 'mdi-package-variant-closed', route: '/admin/multi-tenant?tab=packages', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'TOKEN MANAGEMENT' },
      { label: 'Token Audit Trail', icon: 'mdi-history', route: '/admin/multi-tenant?tab=audit', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'TOKEN MANAGEMENT' },

      // SUB-CENTER PORTAL (FOR SUB-CENTER STAFF)
      { label: 'Sub-Center Portal', icon: 'mdi-school', route: '/sub-center', roles: ['sub_center_staff'], section: 'SUB-CENTER PORTAL' },

      // SETTINGS
      { label: 'Manage FAQs', icon: 'mdi-frequently-asked-questions', route: '/dashboard/admin/faqs', roles: ['super_admin', 'main_admin'], section: 'SETTINGS' },
      { label: 'System Users', icon: 'mdi-account-group', route: '/dashboard/admin/settings/system-users', roles: ['super_admin', 'main_admin'], section: 'SETTINGS' },
      { label: 'Profile', icon: 'mdi-account-outline', route: '/dashboard/profile', roles: ['super_admin', 'main_admin', 'sub_center_staff', 'sub_admin'], section: 'SETTINGS' },
      { label: 'Logout', icon: 'mdi-logout', action: 'logout', roles: ['super_admin', 'main_admin', 'sub_center_staff', 'sub_admin'], section: 'SETTINGS' },
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
