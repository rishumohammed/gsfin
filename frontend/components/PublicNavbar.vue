<template>
  <div>
    <!-- ═══ PUBLIC TOP NAVIGATION BAR ═══ -->
    <header class="gsfin-nav" :class="{ 'gsfin-nav--scrolled': scrolled }">
      <div class="nav-wrap">
        <!-- Brand Logo -->
        <NuxtLink to="/" class="nav-logo" @click="mobileMenuOpen = false">
          <img :src="fullLogoUrl || '/logo.webp'" alt="GSFIN Logo" class="nav-logo-img" />
        </NuxtLink>

        <!-- Desktop Navigation Links -->
        <nav class="nav-links d-none d-md-flex">
          <NuxtLink
            to="/qualifications"
            class="nav-link"
            :class="{ 'nav-link--active': isRouteActive('/qualifications') }"
          >
            Qualifications
          </NuxtLink>
          <NuxtLink to="/#why-gsfin" class="nav-link">For Training Centers</NuxtLink>
          <NuxtLink to="/#why-gsfin" class="nav-link">Why GSFIN</NuxtLink>
          <NuxtLink to="/#contact" class="nav-link">Contact</NuxtLink>
        </nav>

        <!-- Right Action Button & Mobile Toggle -->
        <div class="nav-right">
          <!-- Logged in state button -->
          <NuxtLink
            v-if="authStore.isAuthenticated"
            to="/dashboard"
            class="nav-portal-btn"
          >
            <i class="mdi mdi-view-dashboard-outline"></i> Dashboard
          </NuxtLink>

          <!-- Partner CTA Button -->
          <button v-else class="nav-cta-btn" @click="handleCtaClick">
            Partner with GSFIN <i class="mdi mdi-arrow-right"></i>
          </button>

          <!-- Mobile Hamburger Toggle -->
          <button
            class="nav-hamburger d-md-none"
            :aria-label="mobileMenuOpen ? 'Close Menu' : 'Open Menu'"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <i :class="mobileMenuOpen ? 'mdi mdi-close' : 'mdi mdi-menu'"></i>
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile Slide-out Drawer Overlay -->
    <Transition name="fade-slide">
      <div v-if="mobileMenuOpen" class="mobile-nav-overlay" @click.self="mobileMenuOpen = false">
        <div class="mobile-nav-drawer">
          <div class="mobile-nav-header">
            <img :src="fullLogoUrl || '/logo.webp'" alt="GSFIN" class="nav-logo-img" />
            <button class="close-btn" @click="mobileMenuOpen = false">
              <i class="mdi mdi-close"></i>
            </button>
          </div>

          <div class="mobile-nav-links">
            <NuxtLink
              to="/qualifications"
              class="mobile-nav-link"
              :class="{ 'active': isRouteActive('/qualifications') }"
              @click="mobileMenuOpen = false"
            >
              <i class="mdi mdi-certificate-outline icon-left"></i> Qualifications
            </NuxtLink>
            <NuxtLink
              to="/#why-gsfin"
              class="mobile-nav-link"
              @click="mobileMenuOpen = false"
            >
              <i class="mdi mdi-domain icon-left"></i> For Training Centers
            </NuxtLink>
            <NuxtLink
              to="/#why-gsfin"
              class="mobile-nav-link"
              @click="mobileMenuOpen = false"
            >
              <i class="mdi mdi-shield-check-outline icon-left"></i> Why GSFIN
            </NuxtLink>
            <NuxtLink
              to="/#contact"
              class="mobile-nav-link"
              @click="mobileMenuOpen = false"
            >
              <i class="mdi mdi-email-outline icon-left"></i> Contact Us
            </NuxtLink>
          </div>

          <div class="mobile-nav-footer">
            <button class="btn-red w-100" @click="handleCtaClick">
              Partner with GSFIN <i class="mdi mdi-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const emit = defineEmits(['open-partner-modal']);

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { fullLogoUrl } = usePublicConfig();

const scrolled = ref(false);
const mobileMenuOpen = ref(false);

const isRouteActive = (path: string) => {
  return route.path.startsWith(path);
};

const handleScroll = () => {
  scrolled.value = window.scrollY > 30;
};

const handleCtaClick = () => {
  mobileMenuOpen.value = false;
  emit('open-partner-modal');
  if (route.path !== '/') {
    router.push('/#contact');
  }
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
/* ── Navbar Container ───────────────────────────────────── */
.gsfin-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  transition: all 0.35s ease;
}

.gsfin-nav--scrolled {
  background: rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06) !important;
}

.nav-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.nav-logo-img {
  height: 42px;
  width: auto;
  object-fit: contain;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 28px;
}

.nav-link {
  color: #334155 !important;
  text-decoration: none !important;
  font-size: 0.86rem;
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  padding: 4px 0;
}

.nav-link:hover,
.nav-link--active {
  color: #E31B23 !important;
}

.nav-link--active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #E31B23;
  border-radius: 2px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.nav-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #E31B23 !important;
  color: #FFFFFF !important;
  text-decoration: none;
  padding: 9px 22px;
  border-radius: 50px;
  font-weight: 700;
  font-size: 0.84rem;
  border: none;
  box-shadow: 0 3px 12px rgba(227, 27, 35, 0.2);
  transition: all 0.25s ease;
  cursor: pointer;
}

.nav-cta-btn:hover {
  background: #C4131B !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(227, 27, 35, 0.28);
}

.nav-portal-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #0F172A;
  color: #FFFFFF !important;
  text-decoration: none;
  padding: 9px 20px;
  border-radius: 50px;
  font-weight: 700;
  font-size: 0.84rem;
  transition: all 0.2s ease;
}

.nav-portal-btn:hover {
  background: #1E293B;
  transform: translateY(-1px);
}

.nav-hamburger {
  background: none;
  border: none;
  font-size: 1.6rem;
  color: #0F172A;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

/* ── Mobile Navigation Drawer ───────────────────────────── */
.mobile-nav-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  justify-content: flex-end;
}

.mobile-nav-drawer {
  width: 300px;
  max-width: 85vw;
  height: 100%;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(15, 23, 42, 0.15);
  padding: 24px;
}

.mobile-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.close-btn {
  background: #F1F5F9;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1.2rem;
  color: #0F172A;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mobile-nav-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px 0;
  flex: 1;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.94rem;
  font-weight: 600;
  color: #334155;
  text-decoration: none;
  transition: all 0.2s;
}

.mobile-nav-link:hover,
.mobile-nav-link.active {
  background: rgba(227, 27, 35, 0.08);
  color: #E31B23;
}

.mobile-nav-link .icon-left {
  font-size: 1.2rem;
  color: #64748B;
}

.mobile-nav-link:hover .icon-left,
.mobile-nav-link.active .icon-left {
  color: #E31B23;
}

.mobile-nav-footer {
  padding-top: 16px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.btn-red {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #E31B23 !important;
  color: #FFFFFF !important;
  padding: 12px 24px;
  border-radius: 50px;
  font-weight: 700;
  font-size: 0.88rem;
  border: none;
  cursor: pointer;
}

/* Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
}

.fade-slide-enter-from .mobile-nav-drawer,
.fade-slide-leave-to .mobile-nav-drawer {
  transform: translateX(100%);
}
</style>
