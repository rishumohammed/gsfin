import { useAuthStore } from '@/stores/auth';

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();
  const role = authStore.userRole;

  const adminRoles = ['super_admin', 'main_admin', 'sub_admin', 'sub_center_staff'];

  if (to.path === '/dashboard') {
    if (['super_admin', 'main_admin', 'sub_admin'].includes(role)) return navigateTo('/dashboard/admin');
    if (role === 'sub_center_staff') return navigateTo('/sub-center');
    return navigateTo('/dashboard/admin');
  }

  // Check if route has metadata role restrictions (supports both singular 'role' and plural 'roles')
  const allowedRoles = (to.meta.role || to.meta.roles) as string[] | undefined;
  if (allowedRoles && !allowedRoles.includes(role)) {
    console.warn(`User role '${role}' is not allowed to access path '${to.path}'. Redirecting to /dashboard.`);
    return navigateTo('/dashboard');
  }

  // Basic role-based route protection
  const pathParts = to.path.split('/');
  if (pathParts[2] === 'admin' && !adminRoles.includes(role)) {
    return navigateTo('/dashboard');
  }
});
