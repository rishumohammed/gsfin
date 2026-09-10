<template>
  <div class="gsfin-page">

    <!-- ═══ NAVBAR ═══ -->
    <PublicNavbar @open-partner-modal="openPartnerModal()" />

    <!-- ═══ LOADING STATE ═══ -->
    <div v-if="pending" class="loading-state">
      <div class="spinner"></div>
      <p>Loading Qualification Standard...</p>
    </div>

    <!-- ═══ NOT FOUND STATE ═══ -->
    <div v-else-if="error || !item" class="not-found-state">
      <div class="not-found-card">
        <i class="mdi mdi-certificate-outline icon-red"></i>
        <h2>{{ error?.response?.status === 404 || error?.statusCode === 404 ? 'Qualification Not Found' : 'Unable to Load' }}</h2>
        <p v-if="error?.response?.status === 404 || error?.statusCode === 404">
          The certification standard <strong>"{{ route.params.slug }}"</strong> could not be found or may have been removed.
        </p>
        <p v-else-if="error">
          Could not connect to the server. Please check your connection and try again.
        </p>
        <p v-else>This qualification standard is not available.</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:8px;">
          <button v-if="error && error?.response?.status !== 404" class="retry-btn" @click="fetchQualification()">
            <i class="mdi mdi-refresh"></i> Try Again
          </button>
          <NuxtLink to="/qualifications" class="btn-red">
            <i class="mdi mdi-arrow-left"></i> View All Qualifications
          </NuxtLink>
        </div>
      </div>
    </div>


    <!-- ═══ QUALIFICATION DETAIL CONTENT ═══ -->
    <div v-else class="qual-detail-wrapper">

      <!-- ── HERO HEADER ────────────────────────────────────── -->
      <section class="qual-hero">
        <div class="hero-bg-layer" style="background-image: url('/hero-bk.png');"></div>
        <div class="hero-glass-overlay"></div>

        <div class="page-wrap hero-container">
          <NuxtLink to="/qualifications" class="back-link">
            <i class="mdi mdi-arrow-left"></i> All GSFIN Qualifications
          </NuxtLink>

          <div class="hero-two-col">
            <!-- Left: Text Content -->
            <div class="hero-text-col">
              <div class="hero-badges-row">
                <span v-if="item?.category" class="badge-red">{{ item.category }}</span>
                <span v-if="item?.level" class="badge-glass">{{ item.level.includes('Level') ? item.level : `${item.level} Level` }}</span>
                <span v-if="item?.badge_tag" class="badge-glass-highlight">{{ item.badge_tag }}</span>
              </div>

              <h1 class="hero-qual-title">
                {{ item?.name || item?.title || 'Qualification Standard' }}
              </h1>

              <p v-if="item?.subtitle || item?.short_description" class="hero-qual-sub">
                {{ item.subtitle || item.short_description }}
              </p>

              <!-- Quick Specs Cards Row -->
              <div class="specs-grid">
                <div class="spec-card">
                  <i class="mdi mdi-clock-outline spec-icon"></i>
                  <div class="spec-content">
                    <span class="spec-label">Duration</span>
                    <span class="spec-val">{{ item?.duration || 'Flexible / 40 Hours' }}</span>
                  </div>
                </div>

                <div class="spec-card">
                  <i class="mdi mdi-file-document-edit-outline spec-icon"></i>
                  <div class="spec-content">
                    <span class="spec-label">Assessment</span>
                    <span class="spec-val">{{ item?.assessment_type || 'Online Examination' }}</span>
                  </div>
                </div>

                <div class="spec-card">
                  <i class="mdi mdi-shield-check-outline spec-icon"></i>
                  <div class="spec-content">
                    <span class="spec-label">Validity</span>
                    <span class="spec-val">{{ item?.validity || 'Lifetime Verification' }}</span>
                  </div>
                </div>

                <div class="spec-card">
                  <i class="mdi mdi-earth spec-icon"></i>
                  <div class="spec-content">
                    <span class="spec-label">Recognition</span>
                    <span class="spec-val">Global Standard</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Qualification Image -->
            <div class="hero-image-col">
              <div class="hero-img-frame">
                <img
                  v-if="item?.image_url"
                  :src="item.image_url"
                  :alt="item?.name || 'Qualification'"
                  class="hero-qual-img"
                />
                <div v-else class="hero-img-placeholder">
                  <i class="mdi mdi-certificate-outline hero-img-icon"></i>
                  <span>{{ item?.name || 'GSFIN Certification Standard' }}</span>
                </div>
                <!-- Category badge overlay -->
                <div v-if="item?.category" class="hero-img-badge">
                  <i class="mdi mdi-shield-star-outline"></i>
                  {{ item.category }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── BODY SECTION ───────────────────────────────────── -->
      <section class="qual-body-section">
        <div class="page-wrap detail-split-layout">

          <!-- Left Main Content Column -->
          <div class="detail-main-col">

            <!-- Executive Overview -->
            <div class="glass-section-box">
              <div class="box-head">
                <i class="mdi mdi-text-box-search-outline box-icon"></i>
                <h2>Executive Overview</h2>
              </div>
              <p class="overview-text">
                {{ item.full_description || item.short_description }}
              </p>
            </div>

            <!-- Key Learning Modules -->
            <div v-if="item.key_modules && item.key_modules.length" class="glass-section-box">
              <div class="box-head">
                <i class="mdi mdi-book-open-page-variant-outline box-icon"></i>
                <h2>Key Learning Modules</h2>
              </div>

              <div class="modules-stack">
                <div
                  v-for="(mod, idx) in item.key_modules"
                  :key="idx"
                  class="module-item-card"
                >
                  <div class="module-number">{{ String(Number(idx) + 1).padStart(2, '0') }}</div>
                  <div class="module-title-text">{{ mod }}</div>
                </div>
              </div>
            </div>

            <!-- Target Audience -->
            <div v-if="item.who_should_attend && item.who_should_attend.length" class="glass-section-box">
              <div class="box-head">
                <i class="mdi mdi-account-group-outline box-icon"></i>
                <h2>Target Audience &amp; Who Should Attend</h2>
              </div>

              <div class="audience-grid">
                <div v-for="(aud, idx) in item.who_should_attend" :key="idx" class="audience-card">
                  <i class="mdi mdi-check-circle-outline icon-check"></i>
                  <span>{{ aud }}</span>
                </div>
              </div>
            </div>

            <!-- Benefits -->
            <div v-if="item.benefits && item.benefits.length" class="glass-section-box">
              <div class="box-head">
                <i class="mdi mdi-star-outline box-icon"></i>
                <h2>Benefits &amp; Career Impact</h2>
              </div>

              <div class="benefits-grid">
                <div v-for="(ben, idx) in item.benefits" :key="idx" class="benefit-card">
                  <i class="mdi mdi-shield-star-outline benefit-icon"></i>
                  <span>{{ ben }}</span>
                </div>
              </div>
            </div>

            <!-- Prerequisites -->
            <div v-if="item.prerequisites && item.prerequisites.length" class="glass-section-box">
              <div class="box-head">
                <i class="mdi mdi-clipboard-text-search-outline box-icon"></i>
                <h2>Entry Requirements &amp; Prerequisites</h2>
              </div>

              <div class="prereq-list">
                <div v-for="(pre, idx) in item.prerequisites" :key="idx" class="prereq-item">
                  <i class="mdi mdi-shield-alert-outline prereq-icon"></i>
                  <span>{{ pre }}</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Right Sidebar Column -->
          <div class="detail-sidebar-col">
            
            <!-- Sticky Action Box -->
            <div class="sidebar-action-box">
              <div class="action-head text-center">
                <i class="mdi mdi-certificate action-badge-icon"></i>
                <h3>Offer This Standard</h3>
                <p>Authorized training centers can conduct examinations for candidates worldwide.</p>
              </div>

              <div class="sidebar-btn-group">
                <button class="btn-red w-full justify-center" @click="openPartnerModal()">
                  <i class="mdi mdi-handshake-outline mr-1"></i> Become Authorized Center
                </button>
                <button class="btn-glass w-full justify-center" @click="openPartnerModal()">
                  <i class="mdi mdi-email-outline mr-1"></i> Inquire as Candidate
                </button>
              </div>

              <div class="sidebar-features-list">
                <div class="sidebar-feat">
                  <i class="mdi mdi-security icon-green"></i>
                  <span>Official Anti-Counterfeit Digital Verification</span>
                </div>
                <div class="sidebar-feat">
                  <i class="mdi mdi-file-certificate-outline icon-red-sm"></i>
                  <span>Global QR-Coded Transcript &amp; Certificate</span>
                </div>
                <div class="sidebar-feat">
                  <i class="mdi mdi-monitor-account icon-indigo"></i>
                  <span>AI &amp; Human Proctored Assessment</span>
                </div>
              </div>
            </div>

            <!-- Support Box -->
            <div class="sidebar-support-box">
              <h4 class="support-title">
                <i class="mdi mdi-help-circle-outline icon-red-sm"></i> Need Guidance?
              </h4>
              <p class="support-desc">
                Our international certification advisors can assist your institution in mapping standard curricula.
              </p>
              <a href="mailto:support@gsfin.org" class="support-link">
                Contact Certification Desk <i class="mdi mdi-arrow-right"></i>
              </a>
            </div>

          </div>

        </div>
      </section>

      <!-- ── CTA BANNER ─────────────────────────────────────── -->
      <section class="qual-cta-section">
        <div class="page-wrap">
          <div class="cta-glass-card">
            <div class="cta-left-box">
              <span class="eyebrow-red">PARTNER WITH GSFIN</span>
              <h2 class="cta-main-title">Elevate Your Training Center Credentials</h2>
              <p class="cta-desc">
                Join our global network of accredited centers delivering GSFIN qualifications to professionals across 150+ countries.
              </p>
            </div>
            <button class="btn-red cta-btn-large" @click="openPartnerModal()">
              Apply for Partnership <i class="mdi mdi-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>

    </div>

    <!-- ═══ FOOTER ═══ -->
    <footer class="gsfin-footer">
      <div class="page-wrap footer-grid">
        <div class="footer-col-brand">
          <img :src="fullLogoUrl || '/logo.webp'" alt="GSFIN" class="footer-logo" />
          <p class="footer-brand-desc">
            Global Standards in Food &amp; Nutrition (GSFIN) is an international accreditation body setting standards in food safety and quality management.
          </p>
          <div class="footer-socials">
            <a href="#" class="footer-soc"><i class="mdi mdi-linkedin"></i></a>
            <a href="#" class="footer-soc"><i class="mdi mdi-twitter"></i></a>
            <a href="#" class="footer-soc"><i class="mdi mdi-facebook"></i></a>
          </div>
        </div>

        <div>
          <h4 class="footer-col-h">Qualifications</h4>
          <ul class="footer-links">
            <li><NuxtLink to="/qualifications/codex-haccp">CODEX HACCP</NuxtLink></li>
            <li><NuxtLink to="/qualifications/iso-22000">ISO 22000:2018</NuxtLink></li>
            <li><NuxtLink to="/qualifications/food-safety">Food Safety Management</NuxtLink></li>
            <li><NuxtLink to="/qualifications">All Standards</NuxtLink></li>
          </ul>
        </div>

        <div>
          <h4 class="footer-col-h">Organization</h4>
          <ul class="footer-links">
            <li><NuxtLink to="/#why-gsfin">Why GSFIN</NuxtLink></li>
            <li><NuxtLink to="/#contact">Contact</NuxtLink></li>
            <li><NuxtLink to="/dashboard">Center Login</NuxtLink></li>
          </ul>
        </div>

        <div>
          <h4 class="footer-col-h">Legal &amp; Compliance</h4>
          <ul class="footer-links">
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Standard</a></li>
            <li><a href="#">Verification Portal</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bar">
        <div class="page-wrap footer-bar-inner">
          <div>&copy; {{ new Date().getFullYear() }} GSFIN. All Rights Reserved.</div>
          <div class="footer-slogan">International Food Safety Qualification Framework</div>
        </div>
      </div>
    </footer>

    <!-- ═══ PARTNER MODAL ═══ -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="partnerModalOpen" class="modal-overlay" @click.self="partnerModalOpen = false">
          <div class="glass-modal">
            <button class="modal-close-btn" @click="partnerModalOpen = false">
              <i class="mdi mdi-close"></i>
            </button>

            <div v-if="!modalSubmitted" class="modal-body">
              <div class="modal-header">
                <span class="eyebrow-red">Institutional Accreditation</span>
                <h3 class="modal-title">Partner with GSFIN</h3>
                <p class="modal-sub">Apply to become an Authorized GSFIN Exam Center for <strong>{{ item?.name || 'Qualifications' }}</strong>.</p>
              </div>

              <form @submit.prevent="submitPartnerForm" class="partner-form">
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Institution / Center Name <span class="req">*</span></label>
                    <input v-model="partnerForm.institution_name" type="text" class="form-input" required placeholder="e.g. Apex Safety Institute" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Country <span class="req">*</span></label>
                    <input v-model="partnerForm.country" type="text" class="form-input" required placeholder="e.g. United Arab Emirates" />
                  </div>
                </div>

                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Contact Person Name <span class="req">*</span></label>
                    <input v-model="partnerForm.contact_name" type="text" class="form-input" required placeholder="Full Name" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Official Email <span class="req">*</span></label>
                    <input v-model="partnerForm.email" type="email" class="form-input" required placeholder="admin@center.com" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Phone / WhatsApp</label>
                  <input v-model="partnerForm.phone" type="tel" class="form-input" placeholder="+971 50 000 0000" />
                </div>

                <div class="form-group">
                  <label class="form-label">Brief Notes / Qualifications Interested In</label>
                  <textarea v-model="partnerForm.message" class="form-textarea" rows="3" placeholder="Tell us about your institution..."></textarea>
                </div>

                <div v-if="partnerError" class="form-alert error">
                  <i class="mdi mdi-alert-circle-outline"></i> {{ partnerError }}
                </div>

                <div class="form-actions-wrap">
                  <button type="button" class="btn-glass text-sm" @click="partnerModalOpen = false">Cancel</button>
                  <button type="submit" class="btn-red text-sm px-6" :disabled="submittingPartner">
                    {{ submittingPartner ? 'Submitting...' : 'Submit Application' }}
                  </button>
                </div>
              </form>
            </div>

            <div v-else class="modal-success-wrap">
              <div class="success-icon-box">
                <i class="mdi mdi-check-circle-outline"></i>
              </div>
              <h3 class="success-title">Application Submitted!</h3>
              <p class="success-text">
                Thank you for applying. Our institutional partnership team will contact <strong>{{ partnerForm.email }}</strong> within 24 hours.
              </p>
              <button class="btn-red" @click="partnerModalOpen = false; modalSubmitted = false">Done</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const { configMap, fullLogoUrl } = usePublicConfig();

const scrolled = ref(false);
const partnerModalOpen = ref(false);
const submittingPartner = ref(false);
const partnerError = ref<string | null>(null);
const modalSubmitted = ref(false);

const partnerForm = ref({
  institution_name: '',
  country: '',
  contact_name: '',
  email: '',
  phone: '',
  message: ''
});

const api = useApi();
const slug = computed(() => String(route.params.slug || ''));
const item = ref<any>(null);
const pending = ref(true);
const error = ref<any>(null);

// All qualification content is managed via the Admin Panel
// Admin: /dashboard/admin/qualifications → Create / Edit / Delete qualifications
const fetchQualification = async () => {
  pending.value = true;
  error.value = null;
  try {
    const res = await api.get(`/public/qualifications/${slug.value}`);
    if (res.data && res.data.id) {
      // Parse JSON fields returned as strings by the API
      const d = res.data;
      item.value = {
        ...d,
        key_modules:      Array.isArray(d.key_modules)      ? d.key_modules      : tryParse(d.key_modules),
        who_should_attend: Array.isArray(d.who_should_attend) ? d.who_should_attend : tryParse(d.who_should_attend),
        benefits:         Array.isArray(d.benefits)         ? d.benefits         : tryParse(d.benefits),
        prerequisites:    Array.isArray(d.prerequisites)    ? d.prerequisites    : tryParse(d.prerequisites),
      };
    } else {
      error.value = { statusCode: 404, message: 'Qualification not found' };
    }
  } catch (err: any) {
    error.value = err;
  } finally {
    pending.value = false;
  }
};

const tryParse = (v: any) => {
  if (!v) return [];
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return []; }
};

onMounted(() => {
  fetchQualification();
});

useHead({
  title: () => item.value ? `${item.value.name} | GSFIN Qualifications` : 'GSFIN Qualification Standard',
  meta: [
    {
      name: 'description',
      content: () => item.value?.short_description || 'GSFIN International Qualification Standard for Food Safety and Quality Management.'
    }
  ]
});

const handleScroll = () => {
  scrolled.value = window.scrollY > 40;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

const openPartnerModal = () => {
  partnerError.value = null;
  modalSubmitted.value = false;
  partnerModalOpen.value = true;
};

const submitPartnerForm = async () => {
  submittingPartner.value = true;
  partnerError.value = null;
  try {
    await $fetch('/api/public/contact', {
      method: 'POST',
      body: {
        name: partnerForm.value.contact_name,
        email: partnerForm.value.email,
        phone: partnerForm.value.phone,
        subject: `Partner Application for ${item.value?.name || 'Qualification'} - ${partnerForm.value.institution_name}`,
        message: `Institution: ${partnerForm.value.institution_name}\nCountry: ${partnerForm.value.country}\nNotes: ${partnerForm.value.message}`
      }
    });
    modalSubmitted.value = true;
  } catch (err: any) {
    partnerError.value = err.data?.message || 'Failed to submit application. Please try again.';
  } finally {
    submittingPartner.value = false;
  }
};
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════
   GSFIN GLOBAL STYLING SYSTEM (Matching index.vue)
══════════════════════════════════════════════════════════ */
.gsfin-page {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  background: #FAFAFD;
  color: #0F172A;
  min-height: 100vh;
  width: 100%;
}

/* ── Loading State ───────────────────────────────────────── */
.loading-state {
  min-height: 60vh; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 18px; padding: 80px 32px; text-align: center;
}
.loading-state p { font-size: 0.94rem; color: #64748B; font-weight: 600; margin: 0; }

@keyframes spin { to { transform: rotate(360deg); } }
.spinner {
  width: 48px; height: 48px; border: 3px solid rgba(227, 27, 35, 0.15);
  border-top-color: #E31B23; border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

/* ── Not Found / Error State ─────────────────────────────── */
.not-found-state {
  min-height: 60vh; display: flex; align-items: center; justify-content: center;
  padding: 80px 32px; padding-top: 140px;
}
.not-found-card {
  max-width: 520px; width: 100%; text-align: center; padding: 56px 40px;
  background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,245,245,0.85));
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(227, 27, 35, 0.12); border-radius: 28px;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.06);
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.not-found-card .icon-red { font-size: 4rem; color: #E31B23; margin-bottom: 4px; }
.not-found-card h2 { font-size: 1.5rem; font-weight: 800; color: #0F172A; margin: 0; }
.not-found-card p { font-size: 0.92rem; color: #64748B; line-height: 1.6; margin: 0 0 8px; max-width: 380px; }
.not-found-card .retry-btn {
  background: none; border: 1px solid rgba(15, 23, 42, 0.15);
  color: #64748B; padding: 8px 20px; border-radius: 10px;
  font-size: 0.84rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
  display: inline-flex; align-items: center; gap: 6px;
}
.not-found-card .retry-btn:hover { border-color: #E31B23; color: #E31B23; }


.page-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
  box-sizing: border-box;
}

/* ── Navbar ─────────────────────────────────────────────── */
.gsfin-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 999;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06); transition: all 0.35s ease;
}
.gsfin-nav--scrolled {
  background: rgba(255, 255, 255, 0.92) !important;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05) !important;
}
.nav-wrap {
  max-width: 1200px; margin: 0 auto; padding: 0 32px;
  height: 72px; display: flex; align-items: center; justify-content: space-between;
}
.nav-logo { display: flex; align-items: center; text-decoration: none; }
.nav-logo-img { height: 42px; object-fit: contain; }
.nav-links { display: flex; align-items: center; gap: 28px; }
.nav-link {
  color: #334155 !important; text-decoration: none !important;
  font-size: 0.84rem; font-weight: 600; transition: color 0.2s; cursor: pointer;
}
.nav-link:hover, .nav-link--active { color: #E31B23 !important; }
.nav-cta-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: #E31B23 !important; color: #FFFFFF !important;
  text-decoration: none; padding: 9px 20px; border-radius: 50px;
  font-weight: 700; font-size: 0.82rem; border: none;
  box-shadow: 0 2px 8px rgba(227, 27, 35, 0.18); transition: all 0.2s; cursor: pointer;
}
.nav-cta-btn:hover { background: #C4131B !important; transform: translateY(-1px); }

/* ── Buttons ────────────────────────────────────────────── */
.btn-red {
  display: inline-flex; align-items: center; gap: 8px;
  background: #E31B23 !important; color: #FFFFFF !important;
  text-decoration: none; padding: 12px 24px; border-radius: 12px;
  font-weight: 700; font-size: 0.88rem; border: 1px solid #E31B23 !important;
  box-shadow: 0 3px 10px rgba(227, 27, 35, 0.2); transition: all 0.25s ease; cursor: pointer;
}
.btn-red:hover {
  background: #C4131B !important; border-color: #C4131B !important;
  transform: translateY(-1px); box-shadow: 0 5px 16px rgba(227, 27, 35, 0.25);
}

.btn-glass {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(248, 250, 252, 0.85) !important; color: #0F172A !important;
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(15, 23, 42, 0.12) !important; text-decoration: none;
  padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 0.88rem;
  transition: all 0.25s ease; cursor: pointer;
}
.btn-glass:hover {
  background: #FFFFFF !important; border-color: #E31B23 !important; color: #E31B23 !important;
  transform: translateY(-2px);
}

.eyebrow-red {
  font-size: 0.75rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #E31B23;
}

/* ── Hero Section ───────────────────────────────────────── */
.qual-hero {
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, #FFFFFF 0%, #FAFAFD 60%, #FFF5F5 100%);
  color: #0F172A;
  padding-top: 88px; padding-bottom: 32px; width: 100%;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.hero-bg-layer {
  position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0.04;
}

.hero-glass-overlay {
  position: absolute; inset: 0;
  background: radial-gradient(circle at 80% 20%, rgba(227, 27, 35, 0.05) 0%, transparent 60%);
  pointer-events: none;
}

/* Hero two-column layout */
.hero-two-col {
  display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 36px; align-items: center;
}
@media (max-width: 900px) { .hero-two-col { grid-template-columns: 1fr; gap: 24px; } }

.hero-text-col { display: flex; flex-direction: column; }

/* Hero image */
.hero-image-col { display: flex; justify-content: flex-end; align-items: center; }
@media (max-width: 900px) { .hero-image-col { order: -1; justify-content: center; } }

.hero-img-frame {
  position: relative; width: 100%; max-width: 330px;
  border-radius: 18px; overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.1);
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.06);
  background: #FFFFFF;
  aspect-ratio: 4/3;
}

.hero-qual-img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  transition: transform 0.6s ease;
}
.hero-img-frame:hover .hero-qual-img { transform: scale(1.03); }

.hero-img-placeholder {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, rgba(227,27,35,0.06) 0%, rgba(248,250,252,0.95) 100%);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 20px; text-align: center;
}
.hero-img-icon { font-size: 3rem; color: #E31B23; }
.hero-img-placeholder span { font-size: 0.85rem; font-weight: 700; color: #334155; line-height: 1.3; }

.hero-img-badge {
  position: absolute; bottom: 10px; left: 10px;
  background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(15, 23, 42, 0.1); border-radius: 50px;
  padding: 4px 10px; font-size: 0.68rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.08em; color: #0F172A;
  display: flex; align-items: center; gap: 5px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
}

.hero-container {
  position: relative; z-index: 10;
}

.back-link {
  display: inline-flex; align-items: center; gap: 5px;
  color: #64748B; font-size: 0.8rem; font-weight: 600; text-decoration: none;
  margin-bottom: 12px; transition: color 0.2s;
}
.back-link:hover { color: #E31B23; }

.hero-badges-row {
  display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;
}

.badge-red {
  background: rgba(227, 27, 35, 0.08); color: #E31B23; border: 1px solid rgba(227, 27, 35, 0.2);
  padding: 3px 12px; border-radius: 50px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
}

.badge-glass {
  background: rgba(15, 23, 42, 0.05); color: #334155; border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 3px 12px; border-radius: 50px; font-size: 0.7rem; font-weight: 700;
}

.badge-glass-highlight {
  background: rgba(245, 158, 11, 0.12); color: #D97706; border: 1px solid rgba(245, 158, 11, 0.25);
  padding: 3px 12px; border-radius: 50px; font-size: 0.7rem; font-weight: 700;
}

.hero-qual-title {
  font-size: clamp(1.75rem, 3vw, 2.35rem); font-weight: 800; line-height: 1.15;
  letter-spacing: -0.02em; color: #0F172A; max-width: 800px; margin-bottom: 8px;
}

.hero-qual-sub {
  font-size: 0.96rem; color: #475569; max-width: 720px; line-height: 1.5; margin-bottom: 18px;
}

/* ── Specs Grid ─────────────────────────────────────────── */
.specs-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 14px;
}
@media (max-width: 500px) { .specs-grid { grid-template-columns: 1fr; } }

.spec-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(15, 23, 42, 0.08); border-radius: 12px;
  padding: 10px 14px; display: flex; align-items: center; gap: 10px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
}

.spec-icon { font-size: 1.6rem; color: #E31B23; }

.spec-content { display: flex; flex-direction: column; }
.spec-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748B; }
.spec-val { font-size: 0.85rem; font-weight: 700; color: #0F172A; margin-top: 1px; }

/* ── Body Layout ────────────────────────────────────────── */
.qual-body-section { padding: 36px 0; }

.detail-split-layout {
  display: grid; grid-template-columns: 2.2fr 1fr; gap: 40px; align-items: start;
}
@media (max-width: 900px) { .detail-split-layout { grid-template-columns: 1fr; } }

.detail-main-col { display: flex; flex-direction: column; gap: 32px; }

/* Glass Section Box */
.glass-section-box {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(255, 245, 245, 0.7));
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 24px; padding: 36px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}

.box-head { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.box-head h2 { font-size: 1.4rem; font-weight: 800; color: #0F172A; letter-spacing: -0.02em; margin: 0; }
.box-icon { font-size: 1.8rem; color: #E31B23; }

.overview-text { font-size: 1.02rem; line-height: 1.75; color: #334155; white-space: pre-line; margin: 0; }

/* Modules Stack */
.modules-stack { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }

.module-item-card {
  background: #FFFFFF; border: 1px solid rgba(15, 23, 42, 0.08); border-radius: 16px;
  padding: 18px 22px; display: flex; align-items: center; gap: 18px; transition: all 0.2s ease;
}
.module-item-card:hover {
  border-color: rgba(227, 27, 35, 0.25); transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(227, 27, 35, 0.05);
}

.module-number {
  font-size: 1.1rem; font-weight: 900; color: #E31B23;
  background: rgba(227, 27, 35, 0.08); width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.module-title-text { font-weight: 700; color: #0F172A; font-size: 0.96rem; }

/* Audience & Benefits Grids */
.audience-grid, .benefits-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 16px;
}
@media (max-width: 600px) { .audience-grid, .benefits-grid { grid-template-columns: 1fr; } }

.audience-card {
  background: #FFFFFF; border: 1px solid rgba(15, 23, 42, 0.08); border-radius: 14px;
  padding: 14px 18px; display: flex; align-items: center; gap: 10px;
  font-size: 0.9rem; font-weight: 600; color: #334155;
}
.icon-check { font-size: 1.25rem; color: #E31B23; flex-shrink: 0; }

.benefit-card {
  background: #FFFFFF; border: 1px solid rgba(15, 23, 42, 0.08); border-radius: 16px;
  padding: 16px 20px; display: flex; align-items: center; gap: 12px;
  font-size: 0.92rem; font-weight: 700; color: #0F172A;
}
.benefit-icon { font-size: 1.5rem; color: #E31B23; flex-shrink: 0; }

/* Prerequisites */
.prereq-list { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
.prereq-item {
  display: flex; align-items: flex-start; gap: 10px; font-size: 0.92rem; color: #334155; font-weight: 500;
}
.prereq-icon { font-size: 1.3rem; color: #D97706; flex-shrink: 0; margin-top: 1px; }

/* ── Sidebar ────────────────────────────────────────────── */
.detail-sidebar-col { display: flex; flex-direction: column; gap: 24px; position: sticky; top: 96px; }

.sidebar-action-box {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 240, 240, 0.75));
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(227, 27, 35, 0.15); border-radius: 24px; padding: 32px;
  box-shadow: 0 6px 20px rgba(227, 27, 35, 0.05);
}

.action-badge-icon { font-size: 3rem; color: #E31B23; margin-bottom: 8px; }
.action-head h3 { font-size: 1.3rem; font-weight: 800; color: #0F172A; margin-bottom: 6px; }
.action-head p { font-size: 0.84rem; color: #64748B; margin-bottom: 24px; line-height: 1.5; }

.sidebar-btn-group { display: flex; flex-direction: column; gap: 12px; }

.sidebar-features-list {
  border-top: 1px solid rgba(15, 23, 42, 0.08); margin-top: 24px; padding-top: 20px;
  display: flex; flex-direction: column; gap: 12px;
}

.sidebar-feat { display: flex; align-items: center; gap: 10px; font-size: 0.8rem; color: #475569; font-weight: 600; }
.icon-green { color: #059669; font-size: 1.2rem; }
.icon-red-sm { color: #E31B23; font-size: 1.2rem; }
.icon-indigo { color: #4F46E5; font-size: 1.2rem; }

.sidebar-support-box {
  background: linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,245,245,0.8));
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(227, 27, 35, 0.15); border-radius: 20px; padding: 24px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}
.support-title { font-size: 1rem; font-weight: 800; display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: #0F172A; }
.support-desc { font-size: 0.82rem; color: #64748B; line-height: 1.5; margin-bottom: 16px; }
.support-link { color: #E31B23; font-weight: 700; font-size: 0.82rem; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
.support-link:hover { color: #C4131B; text-decoration: underline; }

/* ── CTA Banner ─────────────────────────────────────────── */
.qual-cta-section { padding-bottom: 80px; }

.cta-glass-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 240, 240, 0.85));
  backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(227, 27, 35, 0.15); border-radius: 28px; padding: 48px 56px;
  display: flex; align-items: center; justify-content: space-between; gap: 36px;
  box-shadow: 0 6px 24px rgba(15, 23, 42, 0.05);
}
@media (max-width: 900px) { .cta-glass-card { flex-direction: column; text-align: center; padding: 36px 28px; } }

.cta-left-box { max-width: 600px; }
.cta-main-title { font-size: clamp(1.6rem, 3vw, 2.3rem); font-weight: 800; color: #0F172A; margin: 8px 0; line-height: 1.25; }
.cta-desc { font-size: 0.96rem; color: #475569; margin: 0; line-height: 1.6; }
.cta-btn-large { padding: 14px 32px !important; font-size: 0.94rem !important; flex-shrink: 0; }

/* ── Footer ─────────────────────────────────────────────── */
.gsfin-footer { background: #FAFAFD; border-top: 1px solid rgba(15, 23, 42, 0.06); color: #334155; }
.footer-grid { padding: 80px 32px; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; }
@media (max-width: 900px) { .footer-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 600px) { .footer-grid { grid-template-columns: 1fr; } }

.footer-col-brand { max-width: 320px; }
.footer-logo { height: 42px; width: auto; max-width: 240px; object-fit: contain; margin-bottom: 18px; display: block; }
.footer-brand-desc { font-size: 0.84rem; line-height: 1.7; color: #64748B; margin-bottom: 20px; }
.footer-socials { display: flex; gap: 10px; }
.footer-soc {
  width: 36px; height: 36px; background: #FFFFFF; border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 10px; display: flex; align-items: center; justify-content: center;
  color: #64748B !important; text-decoration: none; font-size: 1rem; transition: all 0.2s;
}
.footer-soc:hover { background: #E31B23 !important; color: #FFFFFF !important; border-color: #E31B23 !important; }

.footer-col-h { font-size: 0.78rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #0F172A; margin-bottom: 18px; }
.footer-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.footer-links a { font-size: 0.84rem; color: #64748B !important; text-decoration: none; transition: color 0.18s; }
.footer-links a:hover { color: #E31B23 !important; }

.footer-bar { border-top: 1px solid rgba(15, 23, 42, 0.06); padding: 20px 0; }
.footer-bar-inner { display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem; color: #94A3B8; }
.footer-slogan { font-weight: 600; color: #64748B; }

/* ── Modal ──────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999;
  background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.glass-modal {
  width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto;
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 28px; padding: 40px; position: relative;
  box-shadow: 0 12px 40px -8px rgba(15, 23, 42, 0.14);
}
.modal-close-btn {
  position: absolute; top: 20px; right: 20px; width: 36px; height: 36px; border-radius: 50%;
  background: rgba(15, 23, 42, 0.05); border: none; display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; color: #475569; cursor: pointer; transition: all 0.2s;
}
.modal-close-btn:hover { background: #E31B23; color: #FFFFFF; }
.modal-header { margin-bottom: 24px; }
.modal-title { font-size: 1.6rem; font-weight: 800; color: #0F172A; margin-bottom: 6px; }
.modal-sub { font-size: 0.88rem; color: #64748B; }
.partner-form { display: flex; flex-direction: column; gap: 16px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 0.76rem; font-weight: 700; color: #334155; }
.req { color: #E31B23; }
.form-input, .form-textarea {
  width: 100%; padding: 11px 14px; border-radius: 12px; background: rgba(248, 250, 252, 0.85);
  border: 1px solid rgba(15, 23, 42, 0.12); font-size: 0.86rem; color: #0F172A; font-family: inherit;
  outline: none; box-sizing: border-box;
}
.form-input:focus, .form-textarea:focus { background: #FFFFFF; border-color: #E31B23; }
.form-alert { padding: 10px 14px; border-radius: 10px; font-size: 0.82rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.form-alert.error { background: #FEF2F2; color: #991B1B; border: 1px solid #FCA5A5; }
.form-actions-wrap { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
.modal-success-wrap { text-align: center; padding: 24px 12px; }
.success-icon-box {
  width: 64px; height: 64px; border-radius: 50%; background: #DCFCE7; color: #166534;
  display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin: 0 auto 18px auto;
}
.success-title { font-size: 1.4rem; font-weight: 800; color: #0F172A; margin-bottom: 10px; }
.success-text { font-size: 0.9rem; color: #475569; max-width: 440px; margin: 0 auto 24px auto; }
</style>
