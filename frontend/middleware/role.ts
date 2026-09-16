import { useAuthStore } from '@/stores/auth';

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();
  const role = authStore.userRole;

  const adminRoles = ['super_admin', 'main_admin', 'sub_center_staff', 'sub_admin', 'lms_user', 'placement_coordinator', 'finance_staff'];

  if (to.path === '/dashboard') {
    if (['super_admin', 'main_admin', 'sub_admin'].includes(role)) return navigateTo('/dashboard/admin');
    if (role === 'sub_center_staff') return navigateTo('/sub-center');
    if (role === 'tutor') return navigateTo('/dashboard/tutor');
    if (role === 'student') return navigateTo('/dashboard/student');
    return navigateTo('/dashboard/admin');
  }

  // Check if route has metadata role restrictions
  const allowedRoles = to.meta.role as string[] | undefined;
  if (allowedRoles && !allowedRoles.includes(role)) {
    console.warn(`User role '${role}' is not allowed to access path '${to.path}'. Redirecting to /dashboard.`);
    return navigateTo('/dashboard');
  }

  // Basic role-based route protection
  const pathParts = to.path.split('/');
  if (pathParts[2] === 'admin' && !adminRoles.includes(role)) {
    // Tutors are allowed to manage certificates, proctoring, and exams
    if (role === 'tutor' && (pathParts[3] === 'certificates' || pathParts[3] === 'proctoring' || pathParts[3] === 'exams')) {
      return;
    }
    return navigateTo('/dashboard');
  }
  if (pathParts[2] === 'leads' && !['super_admin', 'crm_agent'].includes(role)) {
    return navigateTo('/dashboard');
  }
});
