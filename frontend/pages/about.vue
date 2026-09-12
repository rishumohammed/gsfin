<template>
  <div class="gsfin-page">

    <!-- ═══ NAVBAR ═══ -->
    <PublicNavbar @open-partner-modal="openPartnerModal()" />

    <!-- ═══ HERO SECTION (GSFIN LIGHT 2-COLUMN DESIGN SYSTEM) ═══ -->
    <section class="about-hero">
      <div class="hero-bg-layer" style="background-image: url('/hero-bk.png');"></div>
      <div class="hero-glass-overlay"></div>

      <!-- Ambient Glass Blur Glows -->
      <div class="about-hero-blur about-blur-1"></div>
      <div class="about-hero-blur about-blur-2"></div>

      <div class="page-wrap about-hero-container">
        <!-- Left Column: Content & Actions -->
        <div class="about-hero-left">
          <span class="eyebrow-red mb-3">
            <i class="mdi mdi-shield-check-outline me-1"></i> GLOBAL ACCREDITATION AUTHORITY
          </span>

          <h1 class="about-hero-title">
            About <span class="text-red">GSFIN</span>
          </h1>

          <p class="about-hero-sub">
            At GSFIN, we are dedicated to setting global standards in the food industry. GSFIN is a leading accreditation and certification body for individuals seeking to excel in the dynamic field of food industries. With our comprehensive framework and rigorous certification process, we aim to empower professionals to demonstrate their knowledge and skills with confidence.
          </p>

          <div class="about-hero-actions">
            <button class="btn-red" @click="openPartnerModal()">
              Partner with GSFIN <i class="mdi mdi-arrow-right"></i>
            </button>
            <NuxtLink to="/qualifications" class="btn-outline-dark">
              Explore Qualifications
            </NuxtLink>
          </div>

          <!-- Micro-Trust Metric Strip -->
          <div class="trust-grid-card">
            <div class="trust-metric-item">
              <div class="metric-icon-circle bg-red-light">
                <i class="mdi mdi-earth text-red"></i>
              </div>
              <div>
                <span class="metric-heading">Global</span>
                <span class="metric-label">Recognition</span>
              </div>
            </div>

            <div class="trust-metric-item">
              <div class="metric-icon-circle bg-blue-light">
                <i class="mdi mdi-shield-check-outline text-blue"></i>
              </div>
              <div>
                <span class="metric-heading">Accredited</span>
                <span class="metric-label">Standards</span>
              </div>
            </div>

            <div class="trust-metric-item">
              <div class="metric-icon-circle bg-emerald-light">
                <i class="mdi mdi-chart-timeline-variant text-emerald"></i>
              </div>
              <div>
                <span class="metric-heading">Progressive</span>
                <span class="metric-label">Levels</span>
              </div>
            </div>

            <div class="trust-metric-item">
              <div class="metric-icon-circle bg-amber-light">
                <i class="mdi mdi-account-group-outline text-amber"></i>
              </div>
              <div>
                <span class="metric-heading">Expert-Led</span>
                <span class="metric-label">Training</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Hero Visual Composition -->
        <div class="about-hero-right">
          <div class="hero-image-wrapper">
            <img
              src="/about-hero.jpg"
              alt="GSFIN Food Safety Assessment Laboratory"
              class="hero-main-img"
              @error="(e: Event) => { (e.target as HTMLImageElement).src = '/hero-bk.png'; }"
            />
            <div class="hero-img-border-overlay"></div>

            <!-- Floating Micro Badges -->
            <div class="floating-badge badge-top-left">
              <div class="f-badge-icon bg-emerald-100 text-emerald-600">
                <i class="mdi mdi-check-circle"></i>
              </div>
              <div>
                <div class="f-badge-title">100% Accredited</div>
                <div class="f-badge-sub">Global Certification Body</div>
              </div>
            </div>

            <div class="floating-badge badge-bottom-right">
              <div class="f-badge-icon bg-red-100 text-red-600">
                <i class="mdi mdi-shield-check"></i>
              </div>
              <div>
                <div class="f-badge-title">Verified Standards</div>
                <div class="f-badge-sub">Codex &amp; ISO Aligned</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ═══ MISSION & VISION SECTION ═══ -->
    <section class="section-mv-bg">
      <!-- Ambient Color Glows for Glass Refraction -->
      <div class="mv-blur mv-blur-1"></div>
      <div class="mv-blur mv-blur-2"></div>

      <div class="page-wrap relative z-10">
        <div class="mv-grid">
          
          <!-- Our Mission Card -->
          <div class="mv-card">
            <div class="mv-card-top-bar bg-red"></div>
            <div class="mv-card-body">
              <div class="mv-header-row">
                <div class="mv-icon-badge bg-red-subtle">
                  <i class="mdi mdi-target text-red"></i>
                </div>
                <div>
                  <span class="mv-eyebrow text-red">CORE PURPOSE</span>
                  <h2 class="mv-title">Our Mission</h2>
                </div>
              </div>

              <p class="mv-text">
                Our mission is to establish a benchmark of excellence in food technology and safety through innovative assessment methods and comprehensive training programs. We strive to ensure that individuals across the globe are equipped with the necessary expertise to uphold the highest standards of quality and safety in the food industry.
              </p>

              <div class="mv-footer-tag text-red">
                <span>Empowering Excellence Worldwide</span>
                <i class="mdi mdi-arrow-right"></i>
              </div>
            </div>
          </div>

          <!-- Our Vision Card -->
          <div class="mv-card">
            <div class="mv-card-top-bar bg-indigo"></div>
            <div class="mv-card-body">
              <div class="mv-header-row">
                <div class="mv-icon-badge bg-indigo-subtle">
                  <i class="mdi mdi-eye-outline text-indigo"></i>
                </div>
                <div>
                  <span class="mv-eyebrow text-indigo">FUTURE OUTLOOK</span>
                  <h2 class="mv-title">Our Vision</h2>
                </div>
              </div>

              <p class="mv-text">
                Our vision is to foster a culture of continuous improvement and excellence in food technology and safety practices worldwide. By providing accessible training and certification opportunities, we aspire to create a global network of skilled professionals who are committed to enhancing food quality, safety, and innovation.
              </p>

              <div class="mv-footer-tag text-indigo">
                <span>Global Culture of Continuous Improvement</span>
                <i class="mdi mdi-arrow-right"></i>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ═══ GSFIN GLOBAL FOOD INDUSTRY STANDARDS PILLARS ═══ -->
    <section class="section-pillars">
      <!-- Ambient Color Glows for Pillars Glass -->
      <div class="pillar-blur pillar-blur-1"></div>
      <div class="pillar-blur pillar-blur-2"></div>
      <div class="page-wrap">
        
        <!-- Section Title Header -->
        <div class="section-header-center">
          <span class="eyebrow-red mb-2">ACCREDITATION &amp; CREDIBILITY</span>
          <h2 class="section-main-title">
            GSFIN — Global Food Industry Standards
          </h2>
          <p class="section-main-sub">
            Empowering food safety professionals with accredited, progressive, and industry-recognized qualifications designed for real-world regulatory compliance and career growth.
          </p>
        </div>

        <!-- 6-Grid Feature System -->
        <div class="pillars-grid">

          <!-- 1. Comply with Food Standards -->
          <div class="pillar-box">
            <div class="pillar-icon bg-red-light text-red">
              <i class="mdi mdi-shield-check"></i>
            </div>
            <h3 class="pillar-title">Comply with Food Standards</h3>
            <p class="pillar-desc">
              Qualify for food industry roles by adhering to global regulatory standards. Our tailored qualifications are designed to support your industry with due diligence defense, ensuring you meet essential requirements. Advance your career by aligning with globally recognized standards in the food sector.
            </p>
          </div>

          <!-- 2. Global Recognition -->
          <div class="pillar-box">
            <div class="pillar-icon bg-blue-light text-blue">
              <i class="mdi mdi-earth"></i>
            </div>
            <h3 class="pillar-title">Global Recognition</h3>
            <p class="pillar-desc">
              GSFIN certifications are acknowledged worldwide, enhancing your professional credibility and opening doors to international career opportunities in food technology and safety.
            </p>
          </div>

          <!-- 3. Qualification Framework -->
          <div class="pillar-box">
            <div class="pillar-icon bg-purple-light text-purple">
              <i class="mdi mdi-layers-triple"></i>
            </div>
            <h3 class="pillar-title">Qualification Framework</h3>
            <p class="pillar-desc">
              Our qualification pack encompasses a wide range of topics, ensuring a comprehensive understanding of the food industry, global regulations, and the latest technological advancements. This framework is designed to equip you with the necessary skills and knowledge to excel in various roles within the food sector.
            </p>
          </div>

          <!-- 4. Progressive Levels -->
          <div class="pillar-box">
            <div class="pillar-icon bg-emerald-light text-emerald">
              <i class="mdi mdi-chart-timeline-variant"></i>
            </div>
            <h3 class="pillar-title">Progressive Levels</h3>
            <p class="pillar-desc">
              GSFIN offers progressive certification levels, allowing you to build upon your knowledge and skills systematically, from fundamental principles to advanced practices.
            </p>
          </div>

          <!-- 5. Industry-Relevant Skills -->
          <div class="pillar-box">
            <div class="pillar-icon bg-amber-light text-amber">
              <i class="mdi mdi-briefcase-check"></i>
            </div>
            <h3 class="pillar-title">Industry-Relevant Skills</h3>
            <p class="pillar-desc">
              Develop skills that are in high demand. Our certifications prepare you for real-world challenges, making you a valuable asset to any food industry employer.
            </p>
          </div>

          <!-- 6. Expert Led Training -->
          <div class="pillar-box">
            <div class="pillar-icon bg-teal-light text-teal">
              <i class="mdi mdi-account-group-outline"></i>
            </div>
            <h3 class="pillar-title">Expert Led Training</h3>
            <p class="pillar-desc">
              Learn from industry experts. Our trainers are seasoned professionals with extensive experience, ensuring you receive education that's both practical and cutting-edge.
            </p>
          </div>

        </div>
      </div>
    </section>

    <!-- ═══ CTA INSTITUTIONAL PARTNERSHIP BANNER ═══ -->
    <section class="cta-section">
      <div class="page-wrap">
        <div class="cta-glass-banner">
          <div class="cta-left">
            <span class="eyebrow-red cta-eyebrow mb-2">BECOME AN AUTHORIZED CENTER</span>
            <h2 class="cta-title">
              Ready to Partner with <span class="text-red">GSFIN</span>?
            </h2>
            <p class="cta-sub">
              Join a global network of accredited training centers and empower your students with internationally recognized food safety and technology qualifications.
            </p>
            <div class="cta-actions">
              <button class="btn-red" @click="openPartnerModal()">
                Partner with GSFIN <i class="mdi mdi-arrow-right"></i>
              </button>
              <NuxtLink to="/qualifications" class="btn-outline-dark">
                Explore All Qualifications
              </NuxtLink>
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

    <!-- ═══ AUTHORIZED PARTNER APPLICATION MODAL ═══ -->
    <Transition name="fade">
      <div v-if="showPartnerModal" class="modal-overlay" @click.self="closePartnerModal">
        <div class="modal-card-box">
          <button class="modal-close-btn" @click="closePartnerModal" aria-label="Close Modal">
            <i class="mdi mdi-close"></i>
          </button>

          <div v-if="partnerSuccess" class="p-8 text-center">
            <div class="success-icon-circle">
              <i class="mdi mdi-check"></i>
            </div>
            <h3 class="text-2xl font-black text-slate-900 mb-2">Application Submitted!</h3>
            <p class="text-slate-600 text-sm mb-6 max-w-sm mx-auto">
              Thank you for your interest in becoming a GSFIN Authorized Partner. Our accreditation team will review your application and contact you shortly.
            </p>
            <button class="btn-red px-6 py-2.5 rounded-xl font-bold text-sm" @click="closePartnerModal">
              Done
            </button>
          </div>

          <div v-else class="p-6 sm:p-8">
            <div class="mb-6">
              <span class="eyebrow-red text-xs font-black uppercase tracking-wider mb-1 block">PARTNER WITH GSFIN</span>
              <h3 class="text-xl sm:text-2xl font-black text-slate-900">Apply for Center Accreditation</h3>
              <p class="text-xs sm:text-sm text-slate-500 mt-1">
                Fill out the form below to apply as an Authorized Training / Examination Partner.
              </p>
            </div>

            <div v-if="partnerError" class="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <i class="mdi mdi-alert-circle"></i>
              <span>{{ partnerError }}</span>
            </div>

            <form @submit.prevent="submitPartnerApplication" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Organization / Center Name *</label>
                <input v-model="partnerForm.organizationName" type="text" placeholder="e.g. Global Food Safety Institute" class="form-input-box" required />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Contact Person Name *</label>
                  <input v-model="partnerForm.contactName" type="text" placeholder="e.g. Dr. Sarah Jenkins" class="form-input-box" required />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Country *</label>
                  <input v-model="partnerForm.country" type="text" placeholder="e.g. United Kingdom" class="form-input-box" required />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input v-model="partnerForm.email" type="email" placeholder="sarah@institute.org" class="form-input-box" required />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Phone / WhatsApp *</label>
                  <input v-model="partnerForm.phone" type="tel" placeholder="+44 7911 123456" class="form-input-box" required />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Institution Type</label>
                <select v-model="partnerForm.institutionType" class="form-select-box">
                  <option value="Authorized Training Center">Authorized Training Center</option>
                  <option value="University / Higher Education">University / Higher Education</option>
                  <option value="Corporate / Food Processor">Corporate / Food Processor</option>
                  <option value="Independent Assessment Center">Independent Assessment Center</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Message / Additional Details</label>
                <textarea v-model="partnerForm.message" class="form-textarea-box" rows="3" placeholder="Tell us about your institution..."></textarea>
              </div>

              <div class="pt-2 flex items-center justify-end gap-3">
                <button type="button" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50" @click="closePartnerModal">
                  Cancel
                </button>
                <button type="submit" class="btn-red px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2" :disabled="partnerSubmitting">
                  <span v-if="partnerSubmitting" class="spinner-sm-white"></span>
                  <span>{{ partnerSubmitting ? 'Submitting...' : 'Submit Application' }}</span>
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
import { ref } from 'vue';
import { useHead, useState } from '#imports';
import { useApi } from '@/composables/useApi';

useHead({
  title: 'About Us | GSFIN - Global Food Industry Standards',
  meta: [
    {
      name: 'description',
      content: 'Learn about GSFIN, a leading global accreditation and certification body dedicated to setting standards in food technology, safety, and quality.',
    },
  ],
});

const api = useApi();
const fullLogoUrl = useState('fullLogoUrl', () => '');
const currentYear = new Date().getFullYear();

// Partner Modal State
const showPartnerModal = ref(false);
const partnerSubmitting = ref(false);
const partnerSuccess = ref(false);
const partnerError = ref('');

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
  partnerSuccess.value = false;
  partnerError.value = '';
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
  partnerError.value = '';

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
</script>

<style scoped>
/* Page Layout */
.gsfin-page {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", sans-serif;
  background-color: #FAFAFD;
  color: #0F172A;
}

.page-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
  box-sizing: border-box;
}

/* Common Typography & Color Helpers */
.eyebrow-red {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #E31B23;
  display: inline-block;
}

.text-red { color: #E31B23 !important; }
.text-blue { color: #2563EB !important; }
.text-emerald { color: #059669 !important; }
.text-amber { color: #D97706 !important; }
.text-indigo { color: #4F46E5 !important; }
.text-purple { color: #9333EA !important; }
.text-teal { color: #0D9488 !important; }

.bg-red-light { background-color: #FEF2F2; }
.bg-blue-light { background-color: #EFF6FF; }
.bg-emerald-light { background-color: #ECFDF5; }
.bg-amber-light { background-color: #FFFBEB; }
.bg-purple-light { background-color: #F3E8FF; }
.bg-teal-light { background-color: #F0FDF4; }

.bg-red-subtle { background-color: #FEF2F2; border: 1px solid #FEE2E2; }
.bg-indigo-subtle { background-color: #EEF2FF; border: 1px solid #E0E7FF; }
.bg-red { background: #E31B23; }
.bg-indigo { background: #4F46E5; }

/* ── Hero Section (Light 2-Column Theme with Glassmorphism) ─── */
.about-hero {
  position: relative;
  overflow: hidden;
  background: radial-gradient(circle at 85% 20%, rgba(227, 27, 35, 0.08) 0%, transparent 45%),
              radial-gradient(circle at 15% 85%, rgba(79, 70, 229, 0.08) 0%, transparent 45%),
              linear-gradient(135deg, #FFFFFF 0%, #FAFAFD 60%, #FFF5F5 100%);
  color: #0F172A;
  padding-top: 140px;
  padding-bottom: 80px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.hero-bg-layer {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0.06;
  pointer-events: none;
}

.hero-glass-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 60% 40%, rgba(227, 27, 35, 0.07) 0%, transparent 60%);
  pointer-events: none;
}

/* Vibrant Ambient Glass Blur Glow Orbs */
.about-hero-blur {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  z-index: 1;
}

.about-blur-1 {
  top: 15%;
  left: 20%;
  width: 380px;
  height: 380px;
  background: rgba(227, 27, 35, 0.12);
}

.about-blur-2 {
  bottom: 10%;
  right: 25%;
  width: 340px;
  height: 340px;
  background: rgba(79, 70, 229, 0.1);
}

.about-hero-container {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 48px;
  align-items: center;
}

@media (max-width: 960px) {
  .about-hero-container {
    grid-template-columns: 1fr;
    text-align: center;
  }
}

.about-hero-left {
  max-width: 680px;
}

.about-hero-title {
  font-size: clamp(2.2rem, 3.8vw, 3.4rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0F172A;
  line-height: 1.15;
  margin: 12px 0 16px 0;
}

.about-hero-sub {
  font-size: 1.05rem;
  color: #475569;
  line-height: 1.75;
  margin-bottom: 32px;
}

.about-hero-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 36px;
  flex-wrap: wrap;
}

@media (max-width: 960px) {
  .about-hero-actions {
    justify-content: center;
  }
}

/* Micro-Trust Glass Metric Grid Card */
.trust-grid-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.68) 0%, rgba(255, 255, 255, 0.42) 100%);
  backdrop-filter: blur(20px) saturate(190%);
  -webkit-backdrop-filter: blur(20px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-top: 1px solid rgba(255, 255, 255, 0.95);
  border-left: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 18px 22px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  transition: all 0.3s ease;
}

.trust-grid-card:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.65) 100%);
  transform: translateY(-2px);
  box-shadow: 0 20px 42px rgba(15, 23, 42, 0.09);
}

.trust-metric-item {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.metric-icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
}

.metric-heading {
  display: block;
  font-size: 0.85rem;
  font-weight: 800;
  color: #0F172A;
  line-height: 1.2;
}

.metric-label {
  font-size: 0.74rem;
  color: #64748B;
  font-weight: 600;
}

/* Right Column: Hero Visual Image Box with Glass Borders */
.about-hero-right {
  position: relative;
  display: flex;
  justify-content: center;
}

.hero-image-wrapper {
  position: relative;
  width: 100%;
  max-width: 480px;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 28px 56px rgba(15, 23, 42, 0.16);
  border: 4px solid rgba(255, 255, 255, 0.9);
}

.hero-main-img {
  width: 100%;
  height: 380px;
  object-fit: cover;
  display: block;
  transition: transform 0.5s ease;
}

.hero-image-wrapper:hover .hero-main-img {
  transform: scale(1.03);
}

.hero-img-border-overlay {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  pointer-events: none;
}

/* Floating Translucent Glass Badges Over Photo */
.floating-badge {
  position: absolute;
  background: rgba(255, 255, 255, 0.58) !important;
  backdrop-filter: blur(20px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(200%) !important;
  border: 1px solid rgba(255, 255, 255, 0.75) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.95) !important;
  border-left: 1px solid rgba(255, 255, 255, 0.95) !important;
  padding: 10px 16px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.9) !important;
  z-index: 10;
  transition: transform 0.3s ease;
}

.floating-badge:hover {
  transform: translateY(-3px) scale(1.02);
  background: rgba(255, 255, 255, 0.72) !important;
}

.badge-top-left {
  top: 18px;
  left: 18px;
}

.badge-bottom-right {
  bottom: 18px;
  right: 18px;
}

.f-badge-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.bg-emerald-100 { background: rgba(236, 253, 245, 0.85); }
.text-emerald-600 { color: #059669; }
.bg-red-100 { background: rgba(254, 242, 242, 0.85); }
.text-red-600 { color: #E31B23; }

.f-badge-title {
  font-size: 0.78rem;
  font-weight: 800;
  color: #0F172A;
  line-height: 1.2;
}

.f-badge-sub {
  font-size: 0.7rem;
  color: #475569;
  font-weight: 600;
}

/* ── Mission & Vision Section (Refractive Glass Cards) ────────── */
.section-mv-bg {
  padding: 90px 0;
  background: radial-gradient(circle at 20% 50%, rgba(227, 27, 35, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 50%, rgba(79, 70, 229, 0.08) 0%, transparent 50%),
              linear-gradient(180deg, #FAFAFD 0%, #F1F5F9 100%);
  position: relative;
  overflow: hidden;
}

.mv-blur {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
}

.mv-blur-1 {
  top: 10%;
  left: 10%;
  width: 400px;
  height: 400px;
  background: rgba(227, 27, 35, 0.12);
}

.mv-blur-2 {
  bottom: 10%;
  right: 10%;
  width: 400px;
  height: 400px;
  background: rgba(79, 70, 229, 0.12);
}

.mv-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32px;
}

@media (max-width: 900px) {
  .mv-grid {
    grid-template-columns: 1fr;
  }
}

.mv-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.38) 100%);
  backdrop-filter: blur(24px) saturate(190%);
  -webkit-backdrop-filter: blur(24px) saturate(190%);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-top: 1px solid rgba(255, 255, 255, 0.95);
  border-left: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06), inset 0 1px 2px rgba(255, 255, 255, 0.95), inset 0 -1px 2px rgba(15, 23, 42, 0.03);
  position: relative;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

.mv-card:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.58) 100%);
  transform: translateY(-5px);
  box-shadow: 0 24px 50px rgba(15, 23, 42, 0.1);
  border-color: rgba(227, 27, 35, 0.25);
}

.mv-card-top-bar {
  height: 5px;
  width: 100%;
}

.mv-card-body {
  padding: 36px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.mv-header-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.mv-icon-badge {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
}

.mv-eyebrow {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  display: block;
  margin-bottom: 2px;
}

.mv-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
  line-height: 1.2;
}

.mv-text {
  font-size: 1rem;
  color: #475569;
  line-height: 1.75;
  flex: 1;
  margin-bottom: 28px;
}

.mv-footer-tag {
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  padding-top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  font-weight: 700;
}

/* ── Pillars 6-Grid Section (Refractive Glass Cards) ─────────── */
.section-pillars {
  padding: 96px 0;
  background: radial-gradient(circle at 50% 30%, rgba(227, 27, 35, 0.05) 0%, transparent 60%), #FFFFFF;
  position: relative;
  overflow: hidden;
}

.pillar-blur {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
}

.pillar-blur-1 {
  top: 20%;
  right: 15%;
  width: 350px;
  height: 350px;
  background: rgba(37, 99, 235, 0.08);
}

.pillar-blur-2 {
  bottom: 20%;
  left: 15%;
  width: 350px;
  height: 350px;
  background: rgba(5, 150, 105, 0.08);
}

.section-header-center {
  text-align: center;
  max-width: 800px;
  margin: 0 auto 60px auto;
  position: relative;
  z-index: 10;
}

.section-main-title {
  font-size: clamp(2rem, 3.2vw, 2.75rem);
  font-weight: 800;
  color: #0F172A;
  letter-spacing: -0.02em;
  margin: 8px 0 16px 0;
}

.section-main-sub {
  font-size: 1.05rem;
  color: #64748B;
  line-height: 1.65;
}

.pillars-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
  position: relative;
  z-index: 10;
}

@media (max-width: 992px) {
  .pillars-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .pillars-grid { grid-template-columns: 1fr; }
}

.pillar-box {
  background: linear-gradient(135deg, rgba(250, 250, 253, 0.75) 0%, rgba(241, 245, 249, 0.45) 100%);
  backdrop-filter: blur(20px) saturate(190%);
  -webkit-backdrop-filter: blur(20px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-top: 1px solid rgba(255, 255, 255, 0.98);
  border-left: 1px solid rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  padding: 32px;
  transition: all 0.35s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.9);
}

.pillar-box:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.65) 100%);
  border-color: rgba(227, 27, 35, 0.3);
  transform: translateY(-5px);
  box-shadow: 0 20px 42px rgba(15, 23, 42, 0.09);
}

.pillar-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 20px;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
}

.pillar-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0F172A;
  margin-bottom: 12px;
  line-height: 1.3;
}

.pillar-desc {
  font-size: 0.88rem;
  color: #64748B;
  line-height: 1.7;
  flex: 1;
  margin: 0;
}

/* ── CTA Banner (Glassmorphism Light Theme) ─────────────────── */
.cta-section {
  background: linear-gradient(180deg, #FFFFFF 0%, #FAFAFD 100%);
  padding: 60px 0 100px 0;
}

.cta-glass-banner {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.78) 0%, rgba(254, 242, 242, 0.65) 100%);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid rgba(227, 27, 35, 0.25);
  border-top: 1px solid rgba(255, 255, 255, 0.95);
  border-left: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 28px;
  padding: 56px 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  box-shadow: 0 24px 50px rgba(15, 23, 42, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.95);
}

@media (max-width: 900px) {
  .cta-glass-banner {
    flex-direction: column;
    text-align: center;
    padding: 40px 28px;
  }
}

.cta-left {
  position: relative;
  z-index: 2;
  max-width: 580px;
}

.cta-eyebrow {
  color: #E31B23 !important;
  font-weight: 800;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  margin-bottom: 12px;
  display: block;
}

.cta-title {
  font-size: clamp(1.8rem, 3.2vw, 2.5rem);
  font-weight: 800;
  color: #0F172A !important;
  margin-bottom: 12px;
  line-height: 1.2;
  letter-spacing: -0.03em;
}

.cta-sub {
  font-size: 0.98rem;
  color: #475569 !important;
  margin-bottom: 32px;
  font-weight: 500;
  line-height: 1.65;
}

.cta-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

@media (max-width: 900px) {
  .cta-actions {
    justify-content: center;
  }
}

.cta-right {
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.cta-slogan-box {
  border-left: 3px solid #E31B23;
  padding-left: 24px;
}

@media (max-width: 900px) {
  .cta-slogan-box {
    border-left: none;
    border-top: 3px solid #E31B23;
    padding-left: 0;
    padding-top: 18px;
  }
}

.cta-slogan-line {
  font-size: clamp(1.4rem, 2.4vw, 2rem);
  font-weight: 800;
  color: #0F172A !important;
  line-height: 1.25;
  letter-spacing: -0.025em;
}

.cta-slogan-line.text-slate {
  color: #64748B !important;
  font-weight: 600;
}

/* ── Buttons & UI Controls ───────────────────────────────────── */
.btn-red {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 26px;
  border-radius: 50px;
  background: #E31B23 !important;
  color: #FFFFFF !important;
  font-weight: 700;
  font-size: 0.92rem;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(227, 27, 35, 0.25);
  transition: all 0.25s ease;
  text-decoration: none;
}

.btn-red:hover {
  background: #C8141B !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(227, 27, 35, 0.35);
}

.btn-outline-dark {
  display: inline-flex;
  align-items: center;
  padding: 12px 26px;
  border-radius: 50px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.18);
  color: #0F172A !important;
  font-weight: 700;
  font-size: 0.92rem;
  transition: all 0.25s ease;
  text-decoration: none;
  cursor: pointer;
}

.btn-outline-dark:hover {
  background: #F1F5F9;
  border-color: #0F172A;
}

/* ── Footer Corrected CSS ────────────────────────────────────── */
.gsfin-footer {
  background: #FAFAFD;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  color: #334155;
}

.footer-grid {
  padding: 72px 32px 48px 32px;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 48px;
}

@media (max-width: 900px) { .footer-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 600px) { .footer-grid { grid-template-columns: 1fr; } }

.footer-col-brand { max-width: 320px; }

.footer-logo {
  height: 42px !important;
  width: auto !important;
  max-width: 220px !important;
  object-fit: contain !important;
  margin-bottom: 18px;
  display: block;
}

.footer-brand-desc {
  font-size: 0.84rem;
  line-height: 1.7;
  color: #64748B;
  margin-bottom: 20px;
}

.footer-socials { display: flex; gap: 10px; }

.footer-soc {
  width: 36px;
  height: 36px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748B !important;
  text-decoration: none;
  font-size: 1rem;
  transition: all 0.2s;
}

.footer-soc:hover {
  background: #E31B23 !important;
  color: #FFFFFF !important;
  border-color: #E31B23 !important;
}

.footer-col-h {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0F172A;
  margin-bottom: 18px;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-links a {
  font-size: 0.84rem;
  color: #64748B !important;
  text-decoration: none;
  transition: color 0.18s;
}

.footer-links a:hover { color: #E31B23 !important; }

.footer-bar {
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  padding: 20px 0;
}

.footer-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
  color: #94A3B8;
}

.footer-slogan {
  font-weight: 600;
  color: #64748B;
}

/* ── Modal Styling with Glassmorphism ────────────────────────── */
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
  max-width: 580px;
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

.success-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #ECFDF5;
  color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 16px auto;
  border: 1px solid #A7F3D0;
}

.form-input-box,
.form-select-box,
.form-textarea-box {
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid #CBD5E1;
  font-size: 0.875rem;
  color: #0F172A;
  background: #F8FAFC;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.form-input-box:focus,
.form-select-box:focus,
.form-textarea-box:focus {
  outline: none;
  border-color: #E31B23;
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.12);
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

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
