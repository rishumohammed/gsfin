<template>
  <div class="gsfin-page">

    <!-- ═══ NAVBAR ═══ -->
    <PublicNavbar @open-partner-modal="openPartnerModal()" />

    <!-- ═══ HERO ═══ -->
    <section class="hero">
      <!-- Full-Bleed Fluid Background Layer from uploaded branding (Left to Right) -->
      <div class="hero-bg-animated-layer" style="background-image: url('/hero-bk.png');"></div>
      <div class="hero-glass-overlay"></div>

      <!-- Ambient Soft Lighting Orbs -->
      <div class="hero-blur hero-blur-1"></div>
      <div class="hero-blur hero-blur-2"></div>

      <div class="hero-wrap">
        <!-- Left Column -->
        <div class="hero-content">
          <div class="hero-eyebrow">
            GLOBALLY ACCREDITED CERTIFICATION FRAMEWORK
          </div>

          <h1 class="hero-title">
            <span class="hero-title-top">Food Safety &amp; Quality</span><br />
            <span class="text-red">Certifications</span>
          </h1>

          <p class="hero-body">
            GSFIN is an independent international standards body conducting globally recognized qualification exams in food safety and related disciplines — delivered through a network of authorized partner centers worldwide.
          </p>

          <div class="hero-actions">
            <button class="btn-red" @click="openPartnerModal()">
              Partner with GSFIN <i class="mdi mdi-arrow-right"></i>
            </button>
            <a href="#certifications" class="btn-glass" @click.prevent="scrollTo('certifications')">
              Explore Qualifications
            </a>
          </div>

          <!-- Micro-Trust Floating Dark Glass Strip -->
          <div class="hero-trust-row glass-panel-dark">
            <div class="hero-trust-item">
              <i class="mdi mdi-earth"></i>
              <span>Global<br />Recognition</span>
            </div>
            <div class="hero-trust-item">
              <i class="mdi mdi-shield-check-outline"></i>
              <span>Trusted<br />Assessments</span>
            </div>
            <div class="hero-trust-item">
              <i class="mdi mdi-file-document-outline"></i>
              <span>Industry Aligned<br />Standards</span>
            </div>
            <div class="hero-trust-item">
              <i class="mdi mdi-account-group-outline"></i>
              <span>Worldwide<br />Partner Network</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ CERTIFICATIONS ═══ -->
    <section id="certifications" class="section certs-section">
      <div class="page-wrap">
        <div class="certs-header-row">
          <div>
            <div class="eyebrow-red">GLOBAL QUALIFICATIONS</div>
            <h2 class="section-title">Globally Recognized <span class="text-red">Standards</span></h2>
          </div>
          <NuxtLink to="/qualifications" class="link-view-all">
            Explore All Programs <i class="mdi mdi-arrow-right"></i>
          </NuxtLink>
        </div>

        <!-- 2x4 Certifications Grid (Solid/Flat Cards for Maximum Legibility) -->
        <div class="certs-grid">
          <NuxtLink
            v-for="cert in certifications"
            :key="cert.id"
            :to="`/qualifications/${cert.slug}`"
            class="cert-card cursor-pointer block no-underline text-inherit"
          >
            <div class="cert-img-wrap border-0">
              <img :src="cert.image" :alt="cert.name" class="cert-card-img" />
              <div class="cert-badge-tag">GSFIN Standard</div>
            </div>
            <div class="cert-card-content">
              <h3 class="cert-title">
                <span class="text-slate-900 hover:text-red transition-colors">
                  {{ cert.name }}
                </span>
              </h3>
              <p class="cert-desc">{{ cert.desc }}</p>
              <span class="cert-link-more">
                Learn More <i class="mdi mdi-arrow-right"></i>
              </span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ═══ HOW IT WORKS ═══ -->
    <section id="how-it-works" class="section steps-section">
      <div class="page-wrap">
        <div class="section-head">
          <div class="eyebrow-red">HOW IT WORKS</div>
          <h2 class="section-title">The GSFIN Qualification Process</h2>
          <p class="section-sub">Delivered through our authorized training centers</p>
        </div>

        <div class="steps-track">
          <div class="steps-line"></div>
          <div class="steps-line-active"></div>

          <div class="steps-grid">
            <div
              v-for="(step, index) in steps"
              :key="step.step"
              class="step-col"
              :class="`step-node-${index + 1}`"
            >
              <div class="step-node-glass">
                <i :class="['mdi', step.icon]"></i>
              </div>
              <div class="step-num">{{ step.step }}</div>
              <h3 class="step-title">{{ step.title }}</h3>
              <p class="step-desc">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ WHY PARTNER WITH GSFIN ═══ -->
    <section id="why-gsfin" class="section why-section">
      <div class="page-wrap why-split-grid">
        <!-- Left Content -->
        <div class="why-left">
          <div class="eyebrow-red">WHY PARTNER WITH GSFIN</div>
          <h2 class="section-title why-main-title">More Value for<br />Your Organization</h2>
          <p class="why-body">
            Partner with an international standards authority that adds global credibility to your institution and empowers your students with accredited credentials.
          </p>
          <button class="btn-red" @click="openPartnerModal()">
            Partner with GSFIN <i class="mdi mdi-arrow-right"></i>
          </button>
        </div>

        <!-- Right 6 Glass Cards Grid -->
        <div class="why-cards-grid">
          <div v-for="feat in whyFeatures" :key="feat.title" class="why-feat-card glass-panel">
            <div class="why-icon-box">
              <i :class="['mdi', feat.icon]"></i>
            </div>
            <h3 class="why-feat-title">{{ feat.title }}</h3>
            <p class="why-feat-desc">{{ feat.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ TESTIMONIALS ═══ -->
    <section class="section testimonials-section">
      <div class="page-wrap">
        <div class="testi-header-row">
          <div>
            <div class="eyebrow-red">TRUSTED BY OUR PARTNERS</div>
            <h2 class="section-title">Voices from Our Global Network</h2>
          </div>
          <div class="testi-arrows">
            <button class="testi-arrow-btn" aria-label="Previous"><i class="mdi mdi-chevron-left"></i></button>
            <button class="testi-arrow-btn" aria-label="Next"><i class="mdi mdi-chevron-right"></i></button>
          </div>
        </div>

        <div class="testi-grid">
          <div v-for="t in testimonials" :key="t.name" class="testi-card glass-panel">
            <p class="testi-text">{{ t.text }}</p>
            <div class="testi-author">
              <div class="testi-avatar-img">
                <i class="mdi mdi-account-circle-outline"></i>
              </div>
              <div class="testi-info">
                <div class="testi-name">{{ t.name }}</div>
                <div class="testi-role">{{ t.role }}</div>
                <div class="testi-stars">★★★★★</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ JOIN OUR GLOBAL NETWORK CTA BANNER ═══ -->
    <section class="section cta-section">
      <div class="page-wrap">
        <div class="cta-glass-banner">
          <div class="cta-bg-image" style="background-image: url('/gsfin-hero-bg.jpg');"></div>
          <div class="cta-left">
            <div class="eyebrow-red cta-eyebrow">JOIN OUR GLOBAL NETWORK</div>
            <h2 class="cta-title">Become an Authorized Training Center</h2>
            <p class="cta-sub">Expand your opportunities. Offer globally recognized certifications.</p>
            <div class="cta-actions">
              <button class="btn-red" @click="openPartnerModal()">
                Apply to Become a Partner <i class="mdi mdi-arrow-right"></i>
              </button>
              <button class="btn-glass-secondary" @click="openPartnerModal()">
                Contact Us
              </button>
            </div>
          </div>
          <div class="cta-right">
            <div class="cta-slogan-box">
              <div class="cta-slogan-line">Safer Food</div>
              <div class="cta-slogan-line">Stronger People</div>
              <div class="cta-slogan-line text-slate">Brighter Tomorrow</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ GLOBAL PRODUCT FOOTER ═══ -->
    <PublicFooter />

    <!-- ═══ PARTNER APPLICATION MODAL ═══ -->
    <Transition name="modal-fade">
      <div v-if="showPartnerModal" class="modal-overlay" @click.self="closePartnerModal">
        <div class="modal-card glass-modal">
          <button class="modal-close-btn" @click="closePartnerModal" aria-label="Close">
            <i class="mdi mdi-close"></i>
          </button>

          <div v-if="!partnerSuccess" class="modal-body-wrap">
            <div class="modal-header">
              <div class="eyebrow-red">JOIN OUR GLOBAL NETWORK</div>
              <h2 class="modal-title">Become an Authorized Training Center</h2>
              <p class="modal-sub">
                Partner with GSFIN to offer globally recognized food safety certification exams and empower your students with international qualifications.
              </p>
            </div>

            <form @submit.prevent="submitPartnerApplication" class="partner-form">
              <div v-if="partnerError" class="form-alert error">
                <i class="mdi mdi-alert-circle-outline"></i> {{ partnerError }}
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Organization / Center Name <span class="req">*</span></label>
                  <input
                    v-model="partnerForm.organizationName"
                    type="text"
                    class="form-input"
                    placeholder="e.g. Global Food Safety Institute"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Contact Person Name <span class="req">*</span></label>
                  <input
                    v-model="partnerForm.contactName"
                    type="text"
                    class="form-input"
                    placeholder="e.g. Dr. Rajeev Menon"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Official Email Address <span class="req">*</span></label>
                  <input
                    v-model="partnerForm.email"
                    type="email"
                    class="form-input"
                    placeholder="e.g. partner@institution.com"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Phone / WhatsApp <span class="req">*</span></label>
                  <input
                    v-model="partnerForm.phone"
                    type="tel"
                    class="form-input"
                    placeholder="e.g. +91 98765 43210"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Country / Region</label>
                  <input
                    v-model="partnerForm.country"
                    type="text"
                    class="form-input"
                    placeholder="e.g. United Arab Emirates, India, UK"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Institution Type</label>
                  <select v-model="partnerForm.institutionType" class="form-select">
                    <option value="Authorized Training Center">Training Center / Academy</option>
                    <option value="College / University">College / University</option>
                    <option value="Testing & Inspection Body">Testing / Inspection Body</option>
                    <option value="Corporate Enterprise">Corporate Enterprise</option>
                    <option value="Government Agency">Government Agency</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Additional Details / Message</label>
                <textarea
                  v-model="partnerForm.message"
                  rows="3"
                  class="form-textarea"
                  placeholder="Tell us briefly about your center, current student volume, or questions..."
                ></textarea>
              </div>

              <div class="form-actions-wrap">
                <button type="button" class="btn-glass-secondary" @click="closePartnerModal">Cancel</button>
                <button type="submit" class="btn-red" :disabled="partnerSubmitting">
                  <span v-if="partnerSubmitting">
                    <i class="mdi mdi-loading mdi-spin"></i> Submitting Application...
                  </span>
                  <span v-else>
                    Submit Application <i class="mdi mdi-arrow-right"></i>
                  </span>
                </button>
              </div>
            </form>
          </div>

          <!-- Success View -->
          <div v-else class="modal-success-wrap">
            <div class="success-icon-box">
              <i class="mdi mdi-check-circle-outline"></i>
            </div>
            <h3 class="success-title">Application Submitted!</h3>
            <p class="success-text">
              Thank you for applying to become an Authorized GSFIN Partner Center. Our partnership director will review your details and contact you within 24 hours.
            </p>
            <button class="btn-red" @click="closePartnerModal">
              Close &amp; Return to Website
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

definePageMeta({ layout: false });

// ── State ───────────────────────────────────────────────────────
const scrolled        = ref(false);
const mobileMenu      = ref(false);
const appLogo         = useState('appLogo',         () => '');
const contactPhone    = useState('contactPhone',    () => '');
const contactEmail    = useState('contactEmail',    () => '');
const contactWhatsapp = useState('contactWhatsapp', () => '');
const contactAddress  = useState('contactAddress',  () => '');
const runtimeCfg      = useRuntimeConfig();
const api             = useApi();
const currentYear     = new Date().getFullYear();

// ── Partner Modal State ──────────────────────────────────────────
const showPartnerModal  = ref(false);
const partnerSubmitting = ref(false);
const partnerSuccess    = ref(false);
const partnerError      = ref('');

const partnerForm = ref({
  organizationName: '',
  contactName: '',
  email: '',
  phone: '',
  country: '',
  institutionType: 'Authorized Training Center',
  message: '',
});

const openPartnerModal = () => {
  showPartnerModal.value = true;
  partnerSuccess.value    = false;
  partnerError.value      = '';
};

const closePartnerModal = () => {
  showPartnerModal.value = false;
};

const submitPartnerApplication = async () => {
  if (!partnerForm.value.organizationName || !partnerForm.value.contactName || !partnerForm.value.email || !partnerForm.value.phone) {
    partnerError.value = 'Please complete all required fields (*).';
    return;
  }

  partnerSubmitting.value = true;
  partnerError.value      = '';

  try {
    const payload = {
      name: partnerForm.value.contactName,
      email: partnerForm.value.email,
      phone: partnerForm.value.phone,
      subject: `Partner Application: ${partnerForm.value.organizationName} (${partnerForm.value.country || 'Global'})`,
      message: `[AUTHORIZED PARTNER APPLICATION]\nOrganization Name: ${partnerForm.value.organizationName}\nContact Person: ${partnerForm.value.contactName}\nEmail: ${partnerForm.value.email}\nPhone: ${partnerForm.value.phone}\nCountry: ${partnerForm.value.country || 'N/A'}\nInstitution Type: ${partnerForm.value.institutionType}\nAdditional Message: ${partnerForm.value.message || 'N/A'}`
    };

    await api.post('/public/contact', payload);
    partnerSuccess.value = true;
    partnerForm.value = {
      organizationName: '',
      contactName: '',
      email: '',
      phone: '',
      country: '',
      institutionType: 'Authorized Training Center',
      message: '',
    };
  } catch (err: any) {
    partnerError.value = err?.response?.data?.message || 'Failed to submit application. Please try again.';
  } finally {
    partnerSubmitting.value = false;
  }
};

// ── Computed ────────────────────────────────────────────────────
const fullLogoUrl = computed(() => {
  if (!appLogo.value) return '/logo.webp';
  return runtimeCfg.public.apiBase.replace('/api', '') + appLogo.value;
});

const whatsappHref = computed(() => {
  if (!contactWhatsapp.value) return '#';
  return 'https://wa.me/' + contactWhatsapp.value.replace(/\D/g, '');
});

// ── Lifecycle ───────────────────────────────────────────────────
const onScroll = () => { scrolled.value = window.scrollY > 64; };

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  api.get('/public/config').then(({ data }: any) => {
    if (data?.contact_phone)    contactPhone.value    = data.contact_phone;
    if (data?.contact_email)    contactEmail.value    = data.contact_email;
    if (data?.contact_whatsapp) contactWhatsapp.value = data.contact_whatsapp;
    if (data?.contact_address)  contactAddress.value  = data.contact_address;
    if (data?.logo_url)         appLogo.value         = data.logo_url;
  }).catch(() => {});
});

onUnmounted(() => window.removeEventListener('scroll', onScroll));

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  mobileMenu.value = false;
};

// ── Data Arrays ─────────────────────────────────────────────────
const certifications = [
  { id: 1, slug: 'codex-haccp',       image: '/img/course-haccp.jpg',        name: 'CODEX HACCP',       desc: 'Hazard Analysis & Critical Control Points — the cornerstone of food safety management.' },
  { id: 2, slug: 'iso-22000',          image: '/img/course-iso22000.jpg',     name: 'ISO 22000:2018',    desc: 'International standard for food safety management systems.' },
  { id: 3, slug: 'food-safety',        image: '/img/course-food-safety.jpg',  name: 'Food Safety',       desc: 'Comprehensive food safety principles, hygiene, contamination prevention and compliance.' },
  { id: 4, slug: 'food-technology',    image: '/img/course-food-tech.png',    name: 'Food Technology',   desc: 'A blend of food science and technology principles for modern food processing and innovation.' },
  { id: 5, slug: 'brcgs',              image: '/img/course-brcgs.jpg',        name: 'BRCGS',             desc: 'Global standard for retailers and foodservice sectors.' },
  { id: 6, slug: 'fssc-22000',         image: '/img/course-fssc.jpg',         name: 'FSSC 22000',        desc: 'Food Safety System Certification recognized by GSFI worldwide.' },
  { id: 7, slug: 'ghp-gmp',            image: '/img/course-ghp-gmp.jpg',      name: 'GHP & GMP',         desc: 'Good Hygiene and Manufacturing Practices for safe food production.' },
  { id: 8, slug: 'food-microbiology',  image: '/img/course-microbiology.jpg', name: 'Food Microbiology', desc: 'Understanding microbial hazards, hygiene practices and testing methods.' },
];

const whyFeatures = [
  { icon: 'mdi-earth',                   title: 'Global Credibility',       desc: 'Enhance your institutional prestige with GSFIN accreditation.' },
  { icon: 'mdi-chart-areaspline',        title: 'Grow Your Reach',          desc: 'Attract more students with internationally recognized credentials.' },
  { icon: 'mdi-laptop',                  title: 'Easy Partner Portal',      desc: 'Simple registration and batch management.' },
  { icon: 'mdi-headset',                 title: 'Dedicated Support',        desc: 'Training resources and ongoing assistance.' },
  { icon: 'mdi-bullhorn-outline',        title: 'Marketing Support',        desc: 'Co-branded resources to promote your center.' },
  { icon: 'mdi-leaf',                    title: 'Be Part of a Safer World', desc: 'Contribute to higher food safety standards globally.' },
];

const steps = [
  { step: '01', icon: 'mdi-shield-check-outline',        title: 'Become an Authorized Center', desc: 'Organizations apply and get approved as GSFIN training partners.' },
  { step: '02', icon: 'mdi-account-group-outline',       title: 'Register Your Students',       desc: 'Authorize and register student batches for GSFIN exams through the partner portal.' },
  { step: '03', icon: 'mdi-file-document-edit-outline',  title: 'Students Take Exams',          desc: 'Students appear for secure online exams on the GSFIN platform.' },
  { step: '04', icon: 'mdi-certificate-outline',        title: 'Get Certified',                desc: 'Successful candidates receive globally recognized GSFIN certificates.' },
];

const testimonials = [
  { name: 'Rajeev Menon',  role: 'Director, Food Safety Institute, India', text: 'Partnering with GSFIN has added enormous value to our training programs. Their qualification framework is highly respected in the industry.' },
  { name: 'Priya Sharma', role: 'Training Manager, Kerala, India',        text: 'The GSFIN credential gives our students a global advantage and strengthens our position as a trusted training provider.' },
  { name: 'Dr. Anees K.', role: 'Academic Director, UAE',                  text: 'A professional and well-structured assessment process. Our students value the global recognition.' },
];
</script>


<style scoped>
/* ═══════════════════════════════════════════════════════════
   APPLE SF PRO & MINIMALIST GLASSMORPHISM DESIGN SYSTEM
══════════════════════════════════════════════════════════ */
.gsfin-page {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Inter", "Plus Jakarta Sans", system-ui, sans-serif;
  background: #FFFFFF;
  color: #0F172A;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  letter-spacing: -0.011em;
}

/* ── Shared Utilities ─────────────────────────────────────── */
.page-wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
.section   { padding: 100px 0; position: relative; }

/* ── Minimal Brand Crimson Red Palette ───────────────────── */
.text-red { color: #E31B23 !important; font-weight: 700; }
.eyebrow-red {
  font-size: 0.72rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
  color: #E31B23; margin-bottom: 12px;
}

/* ── Shared Glassmorphism Utilities ────────────────────── */
.glass-panel {
  background: rgba(255, 255, 255, 0.72) !important;
  backdrop-filter: blur(12px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.85) !important;
  border-radius: 18px !important;
  box-shadow: 0 4px 16px 0 rgba(15, 23, 42, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.9) !important;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.glass-panel:hover {
  background: rgba(255, 255, 255, 0.92) !important;
  border-color: rgba(227, 27, 35, 0.3) !important;
  box-shadow: 0 8px 24px -4px rgba(15, 23, 42, 0.07), inset 0 1px 0 0 #FFFFFF !important;
  transform: translateY(-4px);
}

.glass-panel-dark {
  background: rgba(15, 23, 42, 0.78) !important;
  backdrop-filter: blur(24px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  border-radius: 20px !important;
  box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.14), inset 0 1px 0 0 rgba(255, 255, 255, 0.15) !important;
  color: #FFFFFF !important;
}

/* ── Buttons ────────────────────────────────────────────── */
.btn-red {
  display: inline-flex !important; align-items: center !important; gap: 8px;
  background: #E31B23 !important; color: #FFFFFF !important;
  text-decoration: none; padding: 12px 26px; border-radius: 12px;
  font-weight: 700; font-size: 0.88rem; border: 1px solid #E31B23 !important;
  box-shadow: 0 2px 8px rgba(227, 27, 35, 0.18);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; white-space: nowrap;
}
.btn-red:hover {
  background: #C4131B !important; border-color: #C4131B !important; color: #FFFFFF !important;
  transform: translateY(-1px); box-shadow: 0 5px 14px rgba(227, 27, 35, 0.25);
}

.btn-glass {
  display: inline-flex !important; align-items: center !important; gap: 8px;
  background: rgba(248, 250, 252, 0.8) !important; color: #0F172A !important;
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(15, 23, 42, 0.1) !important; text-decoration: none;
  padding: 12px 26px; border-radius: 12px; font-weight: 600; font-size: 0.88rem;
  transition: all 0.25s ease; cursor: pointer; white-space: nowrap;
}
.btn-glass:hover {
  background: rgba(255, 255, 255, 1) !important; border-color: #0F172A !important;
  transform: translateY(-2px);
}

.btn-glass-white {
  display: inline-flex !important; align-items: center !important; gap: 8px;
  background: rgba(255, 255, 255, 0.12) !important; color: #FFFFFF !important;
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.25) !important; text-decoration: none;
  padding: 12px 26px; border-radius: 12px; font-weight: 600; font-size: 0.88rem;
  transition: all 0.25s ease; cursor: pointer; white-space: nowrap;
}
.btn-glass-white:hover {
  background: rgba(255, 255, 255, 0.25) !important; border-color: #FFFFFF !important;
}

/* ── Section Headings ───────────────────────────────────── */
.section-head { text-align: center; margin-bottom: 56px; }
.section-title {
  font-size: clamp(1.8rem, 3vw, 2.5rem); font-weight: 800;
  line-height: 1.2; letter-spacing: -0.03em; color: #0F172A; margin-bottom: 12px;
}
.section-sub { font-size: 1rem; color: #64748B; max-width: 520px; margin: 0 auto; line-height: 1.6; }

/* ═══════════════════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════════════════ */
.gsfin-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 999;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06); transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.gsfin-nav--scrolled {
  background: rgba(255, 255, 255, 0.72) !important;
  backdrop-filter: blur(16px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.4) !important;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05) !important;
}
.nav-wrap {
  max-width: 1200px; margin: 0 auto; padding: 0 32px;
  height: 72px; display: flex; align-items: center; justify-content: space-between;
}
.nav-logo { display: flex; align-items: center; text-decoration: none; }
.nav-logo-img { height: 42px; object-fit: contain; }
.nav-logo-text { font-size: 1.4rem; font-weight: 800; color: #0F172A !important; letter-spacing: -0.02em; }
.nav-links { display: flex; align-items: center; gap: 28px; }
@media (max-width: 900px) { .nav-links { display: none; } }
.nav-link {
  color: #334155 !important; text-decoration: none !important;
  font-size: 0.84rem; font-weight: 600; transition: color 0.2s; cursor: pointer;
}
.nav-link:hover { color: #E31B23 !important; }
.nav-right { display: flex; align-items: center; gap: 16px; }
.nav-search-btn {
  background: none; border: none; font-size: 1.25rem; color: #475569;
  cursor: pointer; padding: 6px; display: flex; align-items: center; transition: color 0.2s;
}
.nav-search-btn:hover { color: #0F172A; }
.nav-cta-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: #E31B23 !important; color: #FFFFFF !important;
  text-decoration: none; padding: 9px 20px; border-radius: 50px;
  font-weight: 700; font-size: 0.82rem;
  box-shadow: 0 2px 8px rgba(227, 27, 35, 0.18); transition: all 0.2s; white-space: nowrap;
}
.nav-cta-btn:hover { background: #C4131B !important; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(227, 27, 35, 0.25); }
@media (max-width: 900px) { .nav-cta-btn { display: none; } }

.nav-hamburger {
  display: none; flex-direction: column; justify-content: space-between;
  width: 22px; height: 16px; background: none; border: none; cursor: pointer; padding: 0;
}
@media (max-width: 900px) { .nav-hamburger { display: flex; } }
.nav-hamburger span { display: block; height: 2px; background: #0F172A; border-radius: 2px; }
.nav-drawer {
  max-height: 0; overflow: hidden; background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px); border-top: 1px solid rgba(15, 23, 42, 0.06); transition: max-height 0.3s ease;
}
.nav-drawer--open { max-height: 340px; }
.nav-drawer-link {
  display: block; padding: 12px 32px; color: #0F172A !important;
  text-decoration: none; font-weight: 600; font-size: 0.88rem; border-bottom: 1px solid rgba(15, 23, 42, 0.04);
}
.nav-drawer-cta-wrap { padding: 16px 32px; }

/* ═══════════════════════════════════════════════════════════
   HERO SECTION (Full-Bleed Animated Fluid Background)
══════════════════════════════════════════════════════════ */
.hero {
  position: relative; overflow: hidden; background: #F8FAFC;
  padding-top: 120px; padding-bottom: 80px; min-height: 88vh; display: flex; align-items: center;
  width: 100%;
}

.hero-bg-animated-layer {
  position: absolute; top: -6%; left: -6%; right: -6%; bottom: -6%;
  background-size: contain; background-position: right center; background-repeat: no-repeat;
  opacity: 1; pointer-events: none; z-index: 0;
  animation: heroFluidPan 25s ease-in-out infinite alternate;
  filter: contrast(1.05) saturate(1.1);
}

@keyframes heroFluidPan {
  0% { transform: scale(1) translate(0%, 0%) rotate(0deg); }
  50% { transform: scale(1.04) translate(-1%, -0.8%) rotate(0.2deg); }
  100% { transform: scale(1.01) translate(0.5%, -1%) rotate(-0.2deg); }
}

.hero-glass-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.88) 42%, rgba(255, 255, 255, 0.25) 65%, rgba(255, 255, 255, 0) 90%);
  pointer-events: none; z-index: 0;
}

.hero-blur { position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; opacity: 0.35; z-index: 0; }
.hero-blur-1 { width: 500px; height: 500px; background: rgba(227, 27, 35, 0.06); top: -100px; right: -50px; }
.hero-blur-2 { width: 400px; height: 400px; background: rgba(56, 189, 248, 0.05); bottom: 0; left: -80px; }

.hero-wrap {
  max-width: 1200px; margin: 0 auto; padding: 0 32px; width: 100%;
  display: flex; flex-direction: column; justify-content: center; position: relative; z-index: 1;
}

.hero-content { max-width: 580px; }

.hero-eyebrow {
  font-size: 0.72rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;
  color: #E31B23; margin-bottom: 16px;
}
.hero-title {
  font-size: clamp(2.1rem, 3.8vw, 3.1rem); font-weight: 800; line-height: 1.15;
  letter-spacing: -0.035em; color: #0F172A; margin-bottom: 20px;
}
.hero-title-top { display: inline-block; white-space: nowrap; }
.hero-body { font-size: 0.98rem; line-height: 1.68; color: #475569; margin-bottom: 32px; max-width: 500px; }
.hero-actions { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 48px; }

.hero-trust-row {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
  padding: 20px 24px !important; margin-top: 36px; border-top: none;
  max-width: 530px; border-radius: 18px !important;
}
@media (max-width: 600px) { .hero-trust-row { grid-template-columns: repeat(2, 1fr); gap: 16px; } }
.hero-trust-item { display: flex; align-items: center; gap: 10px; }
.hero-trust-item .mdi { font-size: 1.4rem; color: #FF4D55; flex-shrink: 0; }
.hero-trust-item span { font-size: 0.72rem; font-weight: 600; color: #F1F5F9; line-height: 1.3; }





/* ═══════════════════════════════════════════════════════════
   CERTIFICATIONS SECTION
══════════════════════════════════════════════════════════ */
.certs-section { background: #FFFFFF; }
.certs-header-row { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 48px; }
.link-view-all {
  color: #E31B23 !important; text-decoration: none; font-size: 0.85rem; font-weight: 700;
  display: inline-flex; align-items: center; gap: 4px; transition: gap 0.2s;
}
.link-view-all:hover { gap: 8px; }

.certs-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
@media (max-width: 1024px) { .certs-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px)  { .certs-grid { grid-template-columns: 1fr; } }

.cert-card {
  padding: 0 !important; border-radius: 20px !important; overflow: hidden !important;
  display: flex; flex-direction: column; height: 100%;
  background: #FFFFFF !important;
  border: 1px solid rgba(15, 23, 42, 0.08) !important;
  box-shadow: 0 2px 10px 0 rgba(15, 23, 42, 0.03) !important;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.cert-card:hover {
  border-color: rgba(227, 27, 35, 0.25) !important;
  box-shadow: 0 6px 20px -4px rgba(15, 23, 42, 0.07) !important;
  transform: translateY(-4px);
}

.cert-img-wrap {
  position: relative; width: 100%; height: 170px; overflow: hidden;
  background: #F1F5F9;
}
.cert-card-img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.cert-card:hover .cert-card-img {
  transform: scale(1.06);
}

.cert-badge-tag {
  position: absolute; top: 12px; right: 12px;
  background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(10px);
  color: #FFFFFF; font-size: 0.65rem; font-weight: 800; letter-spacing: 0.05em;
  padding: 4px 10px; border-radius: 50px; text-transform: uppercase;
}

.cert-card-content {
  padding: 24px; display: flex; flex-direction: column; flex-grow: 1;
}
.cert-title { font-size: 1.08rem; font-weight: 800; color: #0F172A; margin-bottom: 8px; }
.cert-desc { font-size: 0.83rem; line-height: 1.6; color: #64748B; margin-bottom: 20px; flex-grow: 1; }
.cert-link-more {
  display: inline-flex; align-items: center; gap: 4px;
  color: #E31B23 !important; text-decoration: none; font-size: 0.82rem; font-weight: 700;
  margin-top: auto; transition: gap 0.2s;
}
.cert-card:hover .cert-link-more { gap: 8px; }

/* ═══════════════════════════════════════════════════════════
   HOW IT WORKS (CLEAN DESIGN + NOTICEABLE ANIMATION)
══════════════════════════════════════════════════════════ */
.steps-section { background: #F8FAFC; position: relative; overflow: hidden; }
.steps-section::before {
  content: ""; position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(227, 27, 35, 0.03) 0%, rgba(248, 250, 252, 0) 75%);
  pointer-events: none; z-index: 0;
}

.steps-track { position: relative; margin-top: 36px; padding: 10px 0; }

.steps-line {
  position: absolute; top: 32px; left: 10%; right: 10%; height: 4px;
  background: rgba(15, 23, 42, 0.08); border-radius: 4px; z-index: 0;
}

.steps-line-active {
  position: absolute; top: 31px; left: 10%; height: 6px; width: 180px;
  background: linear-gradient(90deg, rgba(227, 27, 35, 0) 0%, #E31B23 50%, #FF6B6B 85%, #FFFFFF 100%);
  border-radius: 4px; filter: drop-shadow(0 0 10px rgba(227, 27, 35, 0.85));
  z-index: 1; pointer-events: none;
  animation: stepLaserFlow 6.5s ease-in-out infinite;
}

@keyframes stepLaserFlow {
  0% { left: 8%; opacity: 0; width: 50px; }
  15% { opacity: 1; width: 160px; }
  85% { opacity: 1; width: 160px; }
  100% { left: 78%; opacity: 0; width: 50px; }
}

@media (max-width: 768px) {
  .steps-line, .steps-line-active { display: none; }
}

.steps-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;
  position: relative; z-index: 2;
}
@media (max-width: 768px) { .steps-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .steps-grid { grid-template-columns: 1fr; } }

.step-col {
  text-align: center; display: flex; flex-direction: column; align-items: center;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer;
}
.step-col:hover { transform: translateY(-4px); }
.step-col:hover .step-title { color: #E31B23; }

.step-node-glass {
  width: 64px; height: 64px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.55) !important;
  backdrop-filter: blur(10px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(10px) saturate(180%) !important;
  border: 2px solid #0F172A;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem; color: #0F172A; margin-bottom: 14px; position: relative; z-index: 2;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  animation: nodeGlowPulse 6.5s ease-in-out infinite;
}

.step-node-1 .step-node-glass { animation-delay: 0.4s; }
.step-node-2 .step-node-glass { animation-delay: 1.9s; }
.step-node-3 .step-node-glass { animation-delay: 3.4s; }
.step-node-4 .step-node-glass { animation-delay: 4.9s; }

@keyframes nodeGlowPulse {
  0%, 100% {
    transform: scale(1);
    border-color: #0F172A;
    color: #0F172A;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  }
  15% {
    transform: scale(1.16);
    border-color: #E31B23;
    background: #FFFFFF;
    color: #E31B23;
    box-shadow: 0 0 0 6px rgba(227, 27, 35, 0.15), 0 6px 18px rgba(227, 27, 35, 0.2);
  }
  30% {
    transform: scale(1);
    border-color: #0F172A;
    color: #0F172A;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  }
}

.step-col:hover .step-node-glass {
  transform: translateY(-4px) scale(1.15) !important;
  background: #E31B23 !important; color: #FFFFFF !important;
  box-shadow: 0 6px 18px rgba(227, 27, 35, 0.3) !important;
  border-color: #E31B23 !important;
}

.step-num { font-size: 0.75rem; font-weight: 800; color: #0F172A; margin-bottom: 6px; letter-spacing: 0.05em; }
.step-title { font-size: 0.98rem; font-weight: 700; color: #0F172A; margin-bottom: 6px; transition: color 0.2s ease; }
.step-desc { font-size: 0.8rem; line-height: 1.55; color: #64748B; max-width: 220px; }

/* ═══════════════════════════════════════════════════════════
   WHY PARTNER WITH GSFIN
══════════════════════════════════════════════════════════ */
.why-section {
  background: #FFFFFF; position: relative; overflow: hidden;
}
.why-section::before {
  content: ""; position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(227, 27, 35, 0.03) 0%, rgba(255, 255, 255, 0) 80%);
  pointer-events: none; z-index: 0;
}

.why-split-grid { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 1.3fr; gap: 64px; align-items: center; }
@media (max-width: 900px) { .why-split-grid { grid-template-columns: 1fr; gap: 40px; } }

.why-main-title { margin-bottom: 18px; }
.why-body { font-size: 0.96rem; line-height: 1.7; color: #475569; margin-bottom: 32px; }

.why-cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
@media (max-width: 1024px) { .why-cards-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px)  { .why-cards-grid { grid-template-columns: 1fr; } }

.why-feat-card {
  padding: 24px 20px !important;
  border-radius: 18px !important;
  background: linear-gradient(
    135deg,
    rgba(255, 240, 240, 0.65),
    rgba(255, 255, 255, 0.5)
  ) !important;
  backdrop-filter: blur(12px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.8) !important;
  box-shadow: 0 3px 12px 0 rgba(15, 23, 42, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.9) !important;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.why-feat-card:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 235, 235, 0.85),
    rgba(255, 255, 255, 0.7)
  ) !important;
  border-color: rgba(227, 27, 35, 0.25) !important;
  box-shadow: 0 8px 22px -4px rgba(15, 23, 42, 0.07), inset 0 1px 0 0 #FFFFFF !important;
  transform: translateY(-4px);
}

.why-icon-box {
  width: 40px; height: 40px; background: rgba(254, 242, 242, 0.8);
  border: 1px solid rgba(254, 202, 202, 0.8); border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.25rem; color: #E31B23; margin-bottom: 14px;
}
.why-feat-title { font-size: 0.95rem; font-weight: 700; color: #0F172A; margin-bottom: 6px; }
.why-feat-desc { font-size: 0.8rem; line-height: 1.5; color: #64748B; }

/* ═══════════════════════════════════════════════════════════
   TESTIMONIALS
══════════════════════════════════════════════════════════ */
.testimonials-section {
  background: #F8FAFC; position: relative; overflow: hidden;
}
.testimonials-section::before {
  content: ""; position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(227, 27, 35, 0.04) 0%, rgba(248, 250, 252, 0) 75%);
  pointer-events: none; z-index: 0;
}
.testimonials-section .page-wrap { position: relative; z-index: 1; }

.testi-header-row { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 40px; }
.testi-arrows { display: flex; gap: 8px; }
.testi-arrow-btn {
  width: 38px; height: 38px; border-radius: 50%;
  background: #FFFFFF; border: 1px solid rgba(15, 23, 42, 0.1);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; color: #0F172A; cursor: pointer; transition: all 0.2s;
}
.testi-arrow-btn:hover { background: #0F172A; color: #FFFFFF; }

.testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
@media (max-width: 900px) { .testi-grid { grid-template-columns: 1fr; } }

.testi-card {
  padding: 28px !important; border-radius: 20px !important;
  display: flex; flex-direction: column; justify-content: space-between;
  background: linear-gradient(
    135deg,
    rgba(255, 240, 240, 0.6),
    rgba(255, 255, 255, 0.4)
  ) !important;
  backdrop-filter: blur(12px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.7) !important;
  box-shadow: 0 3px 12px 0 rgba(15, 23, 42, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.9) !important;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.testi-card:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 235, 235, 0.85),
    rgba(255, 255, 255, 0.7)
  ) !important;
  border-color: rgba(227, 27, 35, 0.25) !important;
  box-shadow: 0 8px 22px -4px rgba(15, 23, 42, 0.07) !important;
  transform: translateY(-4px);
}
.testi-text { font-size: 0.88rem; line-height: 1.75; color: #334155; margin-bottom: 24px; font-style: italic; }
.testi-author { display: flex; align-items: center; gap: 12px; }
.testi-avatar-img { font-size: 2.2rem; color: #94A3B8; display: flex; align-items: center; }
.testi-name { font-size: 0.88rem; font-weight: 700; color: #0F172A; }
.testi-role { font-size: 0.75rem; color: #64748B; margin-top: 1px; }
.testi-stars { color: #F59E0B; font-size: 0.75rem; margin-top: 3px; letter-spacing: 2px; }

/* ═══════════════════════════════════════════════════════════
   CTA BANNER
══════════════════════════════════════════════════════════ */
.cta-section { background: #FFFFFF; padding: 60px 0 100px 0; }
.cta-glass-banner {
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(241, 245, 249, 0.88) 100%);
  backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(227, 27, 35, 0.15);
  border-radius: 28px; padding: 56px 64px; color: #0F172A;
  display: flex; align-items: center; justify-content: space-between; gap: 48px;
  box-shadow: 0 6px 24px -4px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
}
@media (max-width: 900px) { .cta-glass-banner { flex-direction: column; text-align: center; padding: 40px 28px; } }

.cta-bg-image {
  position: absolute; top: 0; right: 0; bottom: 0; width: 45%;
  background-size: cover; background-position: center right;
  opacity: 0.12; mix-blend-mode: multiply; pointer-events: none;
  mask-image: linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%);
  -webkit-mask-image: linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%);
}

.cta-left { position: relative; z-index: 2; max-width: 580px; }
.cta-eyebrow { color: #E31B23 !important; font-weight: 800; font-size: 0.75rem; letter-spacing: 0.12em; margin-bottom: 12px; }
.cta-title { font-size: clamp(1.8rem, 3.2vw, 2.5rem); font-weight: 800; color: #0F172A !important; margin-bottom: 12px; line-height: 1.2; letter-spacing: -0.03em; }
.cta-sub { font-size: 0.98rem; color: #475569 !important; margin-bottom: 32px; font-weight: 500; }
.cta-actions { display: flex; gap: 16px; flex-wrap: wrap; }
@media (max-width: 900px) { .cta-actions { justify-content: center; } }

.btn-glass-secondary {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 13px 26px; border-radius: 50px; font-weight: 700; font-size: 0.88rem;
  background: rgba(255, 255, 255, 0.85); color: #0F172A !important;
  border: 1px solid rgba(15, 23, 42, 0.15); backdrop-filter: blur(12px);
  text-decoration: none; transition: all 0.22s ease; cursor: pointer;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
}
.btn-glass-secondary:hover {
  background: #FFFFFF; color: #E31B23 !important; border-color: rgba(227, 27, 35, 0.3);
  transform: translateY(-1px); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.cta-right { flex-shrink: 0; position: relative; z-index: 2; }
.cta-slogan-box { border-left: 3px solid #E31B23; padding-left: 24px; }
@media (max-width: 900px) { .cta-slogan-box { border-left: none; border-top: 3px solid #E31B23; padding-left: 0; padding-top: 18px; } }
.cta-slogan-line { font-size: clamp(1.4rem, 2.4vw, 2rem); font-weight: 800; color: #0F172A !important; line-height: 1.25; letter-spacing: -0.025em; }
.cta-slogan-line.text-slate { color: #64748B !important; font-weight: 600; }

/* ═══════════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════════ */
.gsfin-footer { background: #FAFAFD; border-top: 1px solid rgba(15, 23, 42, 0.06); color: #334155; }
.footer-grid { padding: 80px 32px; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; }
@media (max-width: 900px) { .footer-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 600px) { .footer-grid { grid-template-columns: 1fr; } }

.footer-logo { height: 40px; object-fit: contain; margin-bottom: 16px; display: block; }
.footer-logo-txt { font-size: 1.4rem; font-weight: 800; color: #0F172A; margin-bottom: 16px; }
.footer-brand-desc { font-size: 0.84rem; line-height: 1.7; color: #64748B; margin-bottom: 24px; max-width: 300px; }
.footer-socials { display: flex; gap: 10px; }
.footer-soc {
  width: 36px; height: 36px; background: #FFFFFF; border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 10px; display: flex; align-items: center; justify-content: center;
  color: #64748B !important; text-decoration: none; font-size: 1rem; transition: all 0.2s;
}
.footer-soc:hover { background: #E31B23 !important; color: #FFFFFF !important; border-color: #E31B23 !important; transform: translateY(-2px); }

.footer-col-h { font-size: 0.78rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #0F172A; margin-bottom: 18px; }
.footer-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.footer-links a { font-size: 0.84rem; color: #64748B !important; text-decoration: none; transition: color 0.18s; cursor: pointer; }
.footer-links a:hover { color: #E31B23 !important; }

.footer-bar { border-top: 1px solid rgba(15, 23, 42, 0.06); padding: 20px 0; }
.footer-bar-inner { display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem; color: #94A3B8; }
.footer-slogan { font-weight: 600; color: #64748B; }

/* ═══════════════════════════════════════════════════════════
   PARTNER APPLICATION MODAL (Apple Glassmorphism)
══════════════════════════════════════════════════════════ */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.glass-modal {
  width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(28px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(28px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.9) !important;
  border-radius: 28px !important;
  padding: 40px !important; position: relative;
  box-shadow: 0 12px 36px -8px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(227, 27, 35, 0.08) !important;
}

.modal-close-btn {
  position: absolute; top: 20px; right: 20px;
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(15, 23, 42, 0.05); border: none;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; color: #475569; cursor: pointer; transition: all 0.2s;
}
.modal-close-btn:hover { background: #E31B23; color: #FFFFFF; }

.modal-header { margin-bottom: 24px; }
.modal-title { font-size: 1.6rem; font-weight: 800; color: #0F172A; margin-bottom: 6px; line-height: 1.2; letter-spacing: -0.02em; }
.modal-sub { font-size: 0.88rem; color: #64748B; line-height: 1.55; }

.partner-form { display: flex; flex-direction: column; gap: 16px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 0.76rem; font-weight: 700; color: #334155; }
.req { color: #E31B23; }

.form-input, .form-select, .form-textarea {
  width: 100%; padding: 11px 14px; border-radius: 12px;
  background: rgba(248, 250, 252, 0.85);
  border: 1px solid rgba(15, 23, 42, 0.12);
  font-size: 0.86rem; color: #0F172A; font-family: inherit;
  transition: all 0.2s ease; outline: none; box-sizing: border-box;
}
.form-input:focus, .form-select:focus, .form-textarea:focus {
  background: #FFFFFF; border-color: #E31B23;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.12);
}

.form-alert {
  padding: 10px 14px; border-radius: 10px; font-size: 0.82rem; font-weight: 600;
  display: flex; align-items: center; gap: 8px;
}
.form-alert.error { background: #FEF2F2; color: #991B1B; border: 1px solid #FCA5A5; }

.form-actions-wrap { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }

.modal-success-wrap { text-align: center; padding: 24px 12px; }
.success-icon-box {
  width: 64px; height: 64px; border-radius: 50%; background: #DCFCE7;
  color: #166534; display: flex; align-items: center; justify-content: center;
  font-size: 2.2rem; margin: 0 auto 18px auto;
}
.success-title { font-size: 1.4rem; font-weight: 800; color: #0F172A; margin-bottom: 10px; }
.success-text { font-size: 0.9rem; color: #475569; max-width: 440px; margin: 0 auto 24px auto; line-height: 1.6; }
</style>
