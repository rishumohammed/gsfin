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
          
          <!-- 1. Qualifications Dropdown Menu -->
          <div class="nav-dropdown-wrapper">
            <NuxtLink
              to="/qualifications"
              class="nav-link nav-link--has-dropdown"
              :class="{ 'nav-link--active': isRouteActive('/qualifications') }"
            >
              <span>Qualifications</span>
              <i class="mdi mdi-chevron-down nav-dropdown-arrow"></i>
            </NuxtLink>

            <div class="nav-dropdown-menu mega-menu-qualifications">
              <div class="dropdown-header">
                <span class="text-xs font-black uppercase text-red-600 tracking-wider">Qualification Framework</span>
              </div>
              <div class="dropdown-grid-2col">
                <NuxtLink
                  v-for="item in navQualifications"
                  :key="item.id"
                  :to="`/qualifications/${item.slug}`"
                  class="dropdown-item"
                >
                  <div class="dropdown-icon-box" :class="item.color || 'text-red-600'">
                    <i :class="`mdi ${item.icon_name || 'mdi-certificate'}`"></i>
                  </div>
                  <div>
                    <span class="dropdown-item-title">{{ item.name }}</span>
                    <span class="dropdown-item-desc">{{ item.subtitle || item.short_description || 'International Qualification Standard' }}</span>
                  </div>
                </NuxtLink>
              </div>

              <div class="dropdown-footer-bar">
                <NuxtLink to="/qualifications" class="dropdown-footer-link">
                  <span>View All Official Qualifications</span>
                  <i class="mdi mdi-arrow-right"></i>
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- 2. Verify Certificate (Direct Link) -->
          <NuxtLink
            to="/verify"
            class="nav-link"
            :class="{ 'nav-link--active': isRouteActive('/verify') || isRouteActive('/verify-certificate') }"
          >
            Verify Certificate
          </NuxtLink>

          <!-- 3. Authorized Centers (Direct Link) -->
          <NuxtLink
            to="/partners"
            class="nav-link"
            :class="{ 'nav-link--active': isRouteActive('/partners') || isRouteActive('/authorized-centers') }"
          >
            <span>Authorized Centers</span>
          </NuxtLink>

          <!-- 4. Become a Partner Dropdown -->
          <div class="nav-dropdown-wrapper">
            <NuxtLink
              to="/become-a-partner"
              class="nav-link nav-link--has-dropdown"
              :class="{ 'nav-link--active': isRouteActive('/become-a-partner') || isRouteActive('/for-training-centers') }"
            >
              <span>Become a Partner</span>
              <i class="mdi mdi-chevron-down nav-dropdown-arrow"></i>
            </NuxtLink>

            <div class="nav-dropdown-menu">
              <NuxtLink to="/become-a-partner" class="dropdown-item">
                <div class="dropdown-icon-box text-red-600">
                  <i class="mdi mdi-domain"></i>
                </div>
                <div>
                  <span class="dropdown-item-title">Center Accreditation</span>
                  <span class="dropdown-item-desc">8-step approval &amp; audit guide</span>
                </div>
              </NuxtLink>

              <NuxtLink to="/partners" class="dropdown-item">
                <div class="dropdown-icon-box text-blue-600">
                  <i class="mdi mdi-format-list-bulleted-type"></i>
                </div>
                <div>
                  <span class="dropdown-item-title">Partner Directory</span>
                  <span class="dropdown-item-desc">Search accredited centers worldwide</span>
                </div>
              </NuxtLink>

              <NuxtLink to="/login" class="dropdown-item">
                <div class="dropdown-icon-box text-emerald-600">
                  <i class="mdi mdi-shield-account-outline"></i>
                </div>
                <div>
                  <span class="dropdown-item-title">Partner Portal Login</span>
                  <span class="dropdown-item-desc">Manage exams &amp; issue certificates</span>
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- 5. About GSFIN (Direct Link) -->
          <NuxtLink
            to="/about"
            class="nav-link"
            :class="{ 'nav-link--active': isRouteActive('/about') }"
          >
            <span>About GSFIN</span>
          </NuxtLink>

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
              to="/verify"
              class="mobile-nav-link"
              :class="{ 'active': isRouteActive('/verify') || isRouteActive('/verify-certificate') }"
              @click="mobileMenuOpen = false"
            >
              <i class="mdi mdi-qrcode-scan icon-left"></i> Verify Certificate
            </NuxtLink>
            <NuxtLink
              to="/partners"
              class="mobile-nav-link"
              :class="{ 'active': isRouteActive('/partners') || isRouteActive('/authorized-centers') }"
              @click="mobileMenuOpen = false"
            >
              <i class="mdi mdi-check-decagram-outline icon-left"></i> Authorized Centers
            </NuxtLink>
            <NuxtLink
              to="/become-a-partner"
              class="mobile-nav-link"
              :class="{ 'active': isRouteActive('/become-a-partner') || isRouteActive('/for-training-centers') }"
              @click="mobileMenuOpen = false"
            >
              <i class="mdi mdi-domain icon-left"></i> Become a Partner
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

    <!-- ═══ FLOATING QUICK CONTACT ACTION WIDGET ═══ -->
    <div class="floating-contact-widget">
      <!-- Action Speed-Dial Floating Stack -->
      <Transition name="fade-slide-up">
        <div v-if="floatingExpanded" class="floating-actions-stack">
          
          <!-- 1. WhatsApp Action Button -->
          <a
            href="https://wa.me/447911123456?text=Hello%20GSFIN%20Team%2C%20I%20would%20like%20to%20inquire%20about%20qualifications%20and%20partner%20accreditation."
            target="_blank"
            rel="noopener noreferrer"
            class="floating-action-btn btn-whatsapp"
            @click="floatingExpanded = false"
          >
            <i class="mdi mdi-whatsapp"></i>
            <span class="floating-tooltip-label">Chat on WhatsApp</span>
            <span class="online-indicator"></span>
          </a>

          <!-- 2. Phone Call Action Button -->
          <a
            href="tel:+442079460912"
            class="floating-action-btn btn-phone"
            @click="floatingExpanded = false"
          >
            <i class="mdi mdi-phone"></i>
            <span class="floating-tooltip-label">Call +44 20 7946 0912</span>
          </a>

          <!-- 3. Contact Form Modal Action Button -->
          <button
            class="floating-action-btn btn-contact-form"
            @click="openQuickContactModal"
          >
            <i class="mdi mdi-email-fast-outline"></i>
            <span class="floating-tooltip-label">Quick Contact Form</span>
          </button>

        </div>
      </Transition>

      <!-- Floating Master Toggle Button -->
      <button
        class="floating-master-toggle"
        :class="{ 'is-active': floatingExpanded }"
        @click="floatingExpanded = !floatingExpanded"
        aria-label="Contact GSFIN Quick Actions"
      >
        <i :class="floatingExpanded ? 'mdi mdi-close' : 'mdi mdi-headset'"></i>
        <span v-if="!floatingExpanded" class="floating-pulse-ring"></span>
      </button>
    </div>

    <!-- ═══ FLOATING QUICK CONTACT MODAL ═══ -->
    <Transition name="fade">
      <div v-if="showContactModal" class="modal-overlay" @click.self="showContactModal = false">
        <div class="modal-card-box">
          <button class="modal-close-btn" @click="showContactModal = false" aria-label="Close Contact Modal">
            <i class="mdi mdi-close"></i>
          </button>

          <div v-if="contactSuccess" class="p-8 text-center">
            <div class="success-icon-circle mx-auto mb-3">
              <i class="mdi mdi-check"></i>
            </div>
            <h3 class="text-2xl font-black text-slate-900 mb-2">Message Sent!</h3>
            <p class="text-slate-600 text-sm mb-6 max-w-sm mx-auto">
              Thank you for contacting GSFIN. Our support team will get back to you within 24 hours.
            </p>
            <button class="btn-red px-6 py-2.5 rounded-xl text-sm font-bold" @click="showContactModal = false; contactSuccess = false">
              Done
            </button>
          </div>

          <div v-else class="p-6 sm:p-8">
            <span class="eyebrow-red text-xs font-black uppercase tracking-wider mb-1 block">QUICK INQUIRY</span>
            <h3 class="text-xl sm:text-2xl font-black text-slate-900">Contact GSFIN</h3>
            <p class="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
              Have questions about qualifications, partner accreditation, or certificate verification? Leave us a message.
            </p>

            <div v-if="contactError" class="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <i class="mdi mdi-alert-circle"></i>
              <span>{{ contactError }}</span>
            </div>

            <form @submit.prevent="submitQuickContact" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
                <input v-model="contactForm.name" type="text" placeholder="e.g. Sarah Jenkins" class="form-input-box" required />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input v-model="contactForm.email" type="email" placeholder="sarah@example.com" class="form-input-box" required />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Phone / WhatsApp</label>
                <input v-model="contactForm.phone" type="tel" placeholder="+44 7911 123456" class="form-input-box" />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Message *</label>
                <textarea v-model="contactForm.message" rows="3" placeholder="Tell us how we can help you..." class="form-textarea-box" required></textarea>
              </div>

              <div class="pt-2 flex items-center justify-end gap-3">
                <button type="button" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50" @click="showContactModal = false">
                  Cancel
                </button>
                <button type="submit" class="btn-red px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2" :disabled="contactSubmitting">
                  <span v-if="contactSubmitting" class="spinner-sm-white"></span>
                  <span>{{ contactSubmitting ? 'Sending...' : 'Send Message' }}</span>
                </button>
              </div>
            </form>
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
import { useApi } from '@/composables/useApi';

const emit = defineEmits(['open-partner-modal']);

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const api = useApi();
const { fullLogoUrl } = usePublicConfig();

const scrolled = ref(false);
const mobileMenuOpen = ref(false);
const floatingExpanded = ref(false);
const showContactModal = ref(false);

const contactSubmitting = ref(false);
const contactSuccess = ref(false);
const contactError = ref('');

const contactForm = ref({
  name: '',
  email: '',
  phone: '',
  message: '',
});

const isRouteActive = (path: string) => {
  return route.path.startsWith(path);
};

const handleScroll = () => {
  scrolled.value = window.scrollY > 30;
};

const handleCtaClick = () => {
  mobileMenuOpen.value = false;
  emit('open-partner-modal');
  router.push('/become-a-partner');
};

const openQuickContactModal = () => {
  floatingExpanded.value = false;
  showContactModal.value = true;
  contactSuccess.value = false;
  contactError.value = '';
};

const submitQuickContact = async () => {
  if (!contactForm.value.name || !contactForm.value.email || !contactForm.value.message) {
    contactError.value = 'Please complete all required fields (*).';
    return;
  }

  contactSubmitting.value = true;
  contactError.value = '';

  try {
    const payload = {
      name: contactForm.value.name,
      email: contactForm.value.email,
      phone: contactForm.value.phone,
      subject: `Floating Widget Inquiry from ${contactForm.value.name}`,
      message: `[QUICK CONTACT WIDGET INQUIRY]\nName: ${contactForm.value.name}\nEmail: ${contactForm.value.email}\nPhone: ${contactForm.value.phone || 'N/A'}\nMessage: ${contactForm.value.message}`
    };

    await api.post('/public/contact', payload);
    contactSuccess.value = true;
    contactForm.value = {
      name: '',
      email: '',
      phone: '',
      message: '',
    };
  } catch (err: any) {
    contactError.value = err?.response?.data?.message || 'Failed to send message. Please try again.';
  } finally {
    contactSubmitting.value = false;
  }
};

const navQualifications = ref<any[]>([
  { id: '1', slug: 'codex-haccp', name: 'CODEX HACCP', subtitle: 'Level 1–4 Hazard Analysis & Control', icon_name: 'mdi-shield-check', color: 'text-red-600' },
  { id: '2', slug: 'iso-22000', name: 'ISO 22000:2018', subtitle: 'Food Safety Management Systems', icon_name: 'mdi-certificate', color: 'text-indigo-600' },
  { id: '3', slug: 'food-technology', name: 'Food Technology', subtitle: 'Microbiology & Food Processing', icon_name: 'mdi-microscope', color: 'text-emerald-600' },
  { id: '4', slug: 'brcgs', name: 'BRCGS & FSSC 22000', subtitle: 'Global Auditor Qualifications', icon_name: 'mdi-check-all', color: 'text-amber-600' },
]);

onMounted(async () => {
  window.addEventListener('scroll', handleScroll);
  try {
    const res: any = await api.get('/public/qualifications');
    if (res && Array.isArray(res.data) && res.data.length > 0) {
      const colors = ['text-red-600', 'text-indigo-600', 'text-emerald-600', 'text-amber-600', 'text-blue-600', 'text-purple-600'];
      navQualifications.value = res.data.slice(0, 6).map((q: any, i: number) => ({
        ...q,
        color: colors[i % colors.length]
      }));
    }
  } catch (err) {
    // Silent fallback to standard qualifications list
  }
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

/* ── Dropdown Mega-Menus ─────────────────────────────────── */
.nav-dropdown-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.nav-link--has-dropdown {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.nav-dropdown-arrow {
  font-size: 1.1rem;
  transition: transform 0.25s ease;
}

.nav-dropdown-wrapper:hover .nav-dropdown-arrow {
  transform: rotate(180deg);
}

.nav-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  width: 320px;
  background: #FFFFFF;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
  padding: 12px;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 1000;
}

.nav-dropdown-wrapper:hover .nav-dropdown-menu {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateX(-50%) translateY(4px);
}

.mega-menu-qualifications {
  width: 520px;
  padding: 18px;
}

.dropdown-header {
  padding: 4px 8px 10px 8px;
  border-bottom: 1px solid #F1F5F9;
  margin-bottom: 8px;
}

.dropdown-grid-2col {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.dropdown-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  text-decoration: none !important;
  transition: all 0.18s ease;
}

.dropdown-item:hover {
  background: #F8FAFC;
}

.dropdown-icon-box {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.dropdown-item:hover .dropdown-icon-box {
  background: #FEF2F2;
  color: #E31B23 !important;
}

.dropdown-item-title {
  display: block;
  font-size: 0.84rem;
  font-weight: 800;
  color: #0F172A;
  margin-bottom: 2px;
}

.dropdown-item-desc {
  display: block;
  font-size: 0.74rem;
  color: #64748B;
  line-height: 1.3;
}

.dropdown-footer-bar {
  border-top: 1px solid #F1F5F9;
  margin-top: 12px;
  padding-top: 10px;
}

.dropdown-footer-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  font-size: 0.78rem;
  font-weight: 800;
  color: #E31B23 !important;
  text-decoration: none !important;
  border-radius: 8px;
  transition: background 0.18s ease;
}

.dropdown-footer-link:hover {
  background: #FEF2F2;
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
  gap: 16px;
}

.nav-portal-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #0F172A;
  color: #FFFFFF !important;
  padding: 8px 18px;
  border-radius: 50px;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.2s;
}

.nav-portal-btn:hover {
  background: #1E293B;
}

.nav-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #E31B23 !important;
  color: #FFFFFF !important;
  text-decoration: none;
  padding: 9px 20px;
  border-radius: 50px;
  font-weight: 700;
  font-size: 0.82rem;
  box-shadow: 0 2px 8px rgba(227, 27, 35, 0.18);
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  white-space: nowrap;
}

.nav-cta-btn:hover {
  background: #C4131B !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(227, 27, 35, 0.25);
}

.nav-hamburger {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #0F172A;
  cursor: pointer;
  padding: 4px;
}

/* ── Mobile Navigation Drawer ───────────────────────────── */
.mobile-nav-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  justify-content: flex-end;
}

.mobile-nav-drawer {
  width: 300px;
  height: 100%;
  background: #FFFFFF;
  padding: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
}

.mobile-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.close-btn {
  background: #F1F5F9;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #64748B;
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

/* ── FLOATING ACTION CONTACT WIDGET ─────────────────────── */
.floating-contact-widget {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 9990;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.floating-actions-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 14px;
  margin-bottom: 14px;
}

.floating-action-btn {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF !important;
  font-size: 1.5rem;
  text-decoration: none;
  border: none;
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.2);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.floating-action-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.3);
}

/* 1. WhatsApp Button */
.btn-whatsapp {
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%) !important;
}

/* 2. Phone Call Button */
.btn-phone {
  background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%) !important;
}

/* 3. Contact Form Button */
.btn-contact-form {
  background: linear-gradient(135deg, #E31B23 0%, #991B1B 100%) !important;
}

/* Floating Tooltip Label */
.floating-tooltip-label {
  position: absolute;
  right: 64px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(10px);
  color: #FFFFFF;
  font-size: 0.76rem;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 10px;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.2s ease;
}

.floating-action-btn:hover .floating-tooltip-label {
  opacity: 1;
  transform: translateX(0);
}

.online-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #10B981;
  border: 2px solid #FFFFFF;
}

/* Master Toggle Button */
.floating-master-toggle {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
  color: #FFFFFF;
  font-size: 1.65rem;
  border: 2px solid rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.25);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.floating-master-toggle:hover {
  transform: scale(1.08);
  background: #E31B23;
  border-color: #FFFFFF;
}

.floating-master-toggle.is-active {
  background: #E31B23;
  transform: rotate(90deg);
}

/* Pulse Ring Animation */
.floating-pulse-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid rgba(227, 27, 35, 0.5);
  animation: pulseGlow 2s infinite;
  pointer-events: none;
}

@keyframes pulseGlow {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.18); opacity: 0; }
  100% { transform: scale(0.95); opacity: 0; }
}

/* ── MODAL STYLES ───────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-card-box {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  max-width: 520px;
  width: 100%;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.3);
  overflow: hidden;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #F1F5F9;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.modal-close-btn:hover {
  background: #FEF2F2;
  color: #E31B23;
}

.form-input-box, .form-textarea-box {
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  font-size: 0.86rem;
  color: #0F172A;
  outline: none;
  transition: all 0.2s ease;
}

.form-input-box:focus, .form-textarea-box:focus {
  border-color: #E31B23;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.1);
}

.eyebrow-red {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #E31B23;
}

.success-icon-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #ECFDF5;
  color: #059669;
  font-size: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-sm-white {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transitions */
.fade-slide-up-enter-active,
.fade-slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-up-enter-from,
.fade-slide-up-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.9);
}

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
