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
      { label: 'Dashboard', icon: 'mdi-view-dashboard-outline', route: '/dashboard/admin', roles: ['super_admin', 'main_admin', 'sub_admin', 'sub_center_staff'] },
      { label: 'Inquiries', icon: 'mdi-email-outline', route: '/dashboard/admin/inquiries', roles: ['super_admin', 'main_admin', 'sub_admin'] },
      
      // PARTNERS
      { label: 'Partners', icon: 'mdi-office-building-outline', route: '/admin/multi-tenant', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'PARTNERS' },

      // EXAMS & CERTIFICATES
      { label: 'Exams', icon: 'mdi-clipboard-text-outline', route: '/dashboard/admin/public-exams', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'EXAMS & CERTIFICATES' },
      { label: 'Categories', icon: 'mdi-shape-outline', route: '/dashboard/admin/public-exams/categories', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'EXAMS & CERTIFICATES' },
      { label: 'Certificates', icon: 'mdi-file-certificate-outline', route: '/dashboard/admin/certificates', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'EXAMS & CERTIFICATES' },
      { label: 'Proctoring', icon: 'mdi-shield-check-outline', route: '/dashboard/admin/proctoring', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'EXAMS & CERTIFICATES' },
      { label: 'Certifications', icon: 'mdi-certificate-outline', route: '/dashboard/admin/qualifications', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'EXAMS & CERTIFICATES' },

      // TOKENS
      { label: 'Requests', icon: 'mdi-ticket-percent-outline', route: '/admin/multi-tenant?tab=requests', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'TOKENS' },
      { label: 'Packages', icon: 'mdi-package-variant-closed', route: '/admin/multi-tenant?tab=packages', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'TOKENS' },
      { label: 'Transactions', icon: 'mdi-clock-outline', route: '/admin/multi-tenant?tab=audit', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'TOKENS' },

      // REPORTS
      { label: 'Reports', icon: 'mdi-chart-bar', route: '/dashboard/admin/reports', roles: ['super_admin', 'main_admin', 'sub_admin'], section: 'REPORTS' },

      // PARTNER PORTAL (Exclusive to Partner Center Staff)
      { label: 'Batches', icon: 'mdi-subtitles-outline', route: '/sub-center?tab=batches', roles: ['sub_center_staff'], section: 'PARTNER PORTAL' },
      { label: 'Students', icon: 'mdi-account-group-outline', route: '/sub-center?tab=students', roles: ['sub_center_staff'], section: 'PARTNER PORTAL' },
      { label: 'Certificates', icon: 'mdi-file-certificate-outline', route: '/sub-center?tab=certificates', roles: ['sub_center_staff'], section: 'PARTNER PORTAL' },
      { label: 'Wallet', icon: 'mdi-wallet-outline', route: '/sub-center?tab=wallet', roles: ['sub_center_staff'], section: 'PARTNER PORTAL' },

      // SETTINGS
      { label: 'Profile', icon: 'mdi-cog-outline', route: '/sub-center?tab=profile', roles: ['sub_center_staff'], section: 'SETTINGS' },
      { label: 'Settings', icon: 'mdi-cog-outline', route: '/dashboard/admin/settings', roles: ['super_admin', 'main_admin'], section: 'SETTINGS' },
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
            let roleRoute = '/dashboard/admin';
            if (role === 'sub_center_staff') roleRoute = '/sub-center?tab=dashboard';
            return { ...item, route: roleRoute };
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

      if (['super_admin', 'main_admin', 'sub_admin'].includes(authStore.userRole)) {
        try {
          const { data } = await api.get('/main-admin/token-requests?status=pending');
          const count = data?.counts?.pending || 0;
          const reqItem = this.navItems.find(i => i.label === 'Requests' && i.section === 'TOKENS');
          if (reqItem) {
            reqItem.badge = count > 0 ? String(count) : undefined;
          }
        } catch (e) {
          // ignore error
        }
      }
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
