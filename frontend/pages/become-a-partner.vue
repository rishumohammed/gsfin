<template>
  <div class="gsfin-page">

    <!-- ═══ NAVBAR ═══ -->
    <PublicNavbar @open-partner-modal="openPartnerModal()" />

    <!-- ═══ HERO SECTION ═══ -->
    <section class="partner-hero">
      <div class="hero-bg-layer" style="background-image: url('/hero-bk.png');"></div>
      <div class="hero-glass-overlay"></div>

      <!-- Ambient Glass Blur Glows -->
      <div class="partner-hero-blur blur-1"></div>
      <div class="partner-hero-blur blur-2"></div>

      <div class="page-wrap partner-hero-container">
        <!-- Left Column: Copy & Actions -->
        <div class="partner-hero-left">
          <span class="eyebrow-red mb-3">
            <i class="mdi mdi-domain me-1"></i> INSTITUTIONAL ACCREDITATION
          </span>

          <h1 class="partner-hero-title">
            Become an Approved <br />
            <span class="text-red">GSFIN Training Center</span>
          </h1>

          <p class="partner-hero-sub">
            Are you passionate about educating others in the field of food technology and safety? Join our global network of authorized training partners and play a vital role in shaping the future of the food industry. Apply now to become a certified GSFIN training center and gain access to our comprehensive course materials, examination portal, and international certification support.
          </p>

          <div class="partner-hero-actions">
            <button class="btn-red" @click="scrollTo('apply-form')">
              Apply for Accreditation <i class="mdi mdi-arrow-right"></i>
            </button>
            <NuxtLink to="/qualifications" class="btn-outline-dark">
              Explore Qualifications
            </NuxtLink>
          </div>

          <!-- Micro-Trust Metric Grid -->
          <div class="trust-grid-card">
            <div class="trust-metric-item">
              <div class="metric-icon-circle bg-red-light">
                <i class="mdi mdi-earth text-red"></i>
              </div>
              <div>
                <span class="metric-heading">Global Network</span>
                <span class="metric-label">50+ Countries</span>
              </div>
            </div>

            <div class="trust-metric-item">
              <div class="metric-icon-circle bg-blue-light">
                <i class="mdi mdi-book-open-page-variant text-blue"></i>
              </div>
              <div>
                <span class="metric-heading">Turnkey Curriculum</span>
                <span class="metric-label">Codex &amp; ISO Aligned</span>
              </div>
            </div>

            <div class="trust-metric-item">
              <div class="metric-icon-circle bg-emerald-light">
                <i class="mdi mdi-certificate-outline text-emerald"></i>
              </div>
              <div>
                <span class="metric-heading">Automated Certs</span>
                <span class="metric-label">QR Code Verification</span>
              </div>
            </div>

            <div class="trust-metric-item">
              <div class="metric-icon-circle bg-amber-light">
                <i class="mdi mdi-headset text-amber"></i>
              </div>
              <div>
                <span class="metric-heading">Dedicated Support</span>
                <span class="metric-label">Expert Lead Evaluators</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Visual Hero Composition -->
        <div class="partner-hero-right">
          <div class="hero-image-wrapper">
            <img
              src="/training-center-hero.jpg"
              alt="GSFIN Approved Training Center Classroom & Lab"
              class="hero-main-img"
              @error="(e: Event) => { (e.target as HTMLImageElement).src = '/hero-bk.png'; }"
            />
            <div class="hero-img-border-overlay"></div>

            <!-- Floating Translucent Glass Badges -->
            <div class="floating-badge badge-top-left">
              <div class="f-badge-icon bg-emerald-100 text-emerald-600">
                <i class="mdi mdi-shield-check"></i>
              </div>
              <div>
                <div class="f-badge-title">Authorized Partner</div>
                <div class="f-badge-sub">Official Exam Center</div>
              </div>
            </div>

            <div class="floating-badge badge-bottom-right">
              <div class="f-badge-icon bg-red-100 text-red-600">
                <i class="mdi mdi-school-outline"></i>
              </div>
              <div>
                <div class="f-badge-title">Verified Standards</div>
                <div class="f-badge-sub">Global Credibility</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ APPROVAL PROCEDURE SECTION (8-STEP TIMELINE) ═══ -->
    <section class="section-procedure">
      <!-- Ambient Glass Glows -->
      <div class="proc-blur blur-proc-1"></div>
      <div class="proc-blur blur-proc-2"></div>

      <div class="page-wrap relative z-10">
        <div class="section-header-center">
          <span class="eyebrow-red mb-2">STEP-BY-STEP AUTHORIZATION</span>
          <h2 class="section-main-title">
            Center Approval Procedure
          </h2>
          <p class="section-main-sub">
            Our streamlined 8-step accreditation process ensures quality assurance, regulatory compliance, and seamless onboarding for your institution.
          </p>
        </div>

        <!-- 8-Step Timeline Cards Grid -->
        <div class="steps-flow-grid">
          <div
            v-for="(step, idx) in approvalSteps"
            :key="step.number"
            class="step-card"
          >
            <div class="step-card-header">
              <span class="step-badge-num">{{ step.number }}</span>
              <div class="step-icon-circle" :class="step.colorClass">
                <i :class="['mdi', step.icon]"></i>
              </div>
            </div>
            <h3 class="step-card-title">{{ step.title }}</h3>
            <p class="step-card-desc">{{ step.description }}</p>
            <div class="step-footer-bar"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ WHY PARTNER WITH GSFIN (BENEFITS GRID) ═══ -->
    <section class="section-benefits">
      <div class="page-wrap">
        <div class="section-header-center">
          <span class="eyebrow-red mb-2">PARTNER ADVANTAGES</span>
          <h2 class="section-main-title">
            Why Become a GSFIN Partner Center?
          </h2>
          <p class="section-main-sub">
            Empower your students and organization with world-class food safety credentials backed by robust technology and global standards.
          </p>
        </div>

        <div class="benefits-grid">
          <div class="benefit-card">
            <div class="benefit-icon bg-red-light text-red">
              <i class="mdi mdi-certificate"></i>
            </div>
            <h3 class="benefit-title">Global Credibility</h3>
            <p class="benefit-desc">
              Deliver internationally recognized qualifications that open doors for your students across food manufacturing, hospitality, and regulatory compliance.
            </p>
          </div>

          <div class="benefit-card">
            <div class="benefit-icon bg-blue-light text-blue">
              <i class="mdi mdi-book-open-page-variant"></i>
            </div>
            <h3 class="benefit-title">Comprehensive Courseware</h3>
            <p class="benefit-desc">
              Gain access to standardized presentation decks, student manuals, case studies, and practical lab assessment guides.
            </p>
          </div>

          <div class="benefit-card">
            <div class="benefit-icon bg-purple-light text-purple">
              <i class="mdi mdi-laptop"></i>
            </div>
            <h3 class="benefit-title">Online Exam Portal</h3>
            <p class="benefit-desc">
              Manage student registrations, conduct secure online examinations, and track progress effortlessly through the GSFIN Partner Portal.
            </p>
          </div>

          <div class="benefit-card">
            <div class="benefit-icon bg-emerald-light text-emerald">
              <i class="mdi mdi-qrcode-scan"></i>
            </div>
            <h3 class="benefit-title">Instant QR Verification</h3>
            <p class="benefit-desc">
              Issued certificates feature dynamic QR codes and unique verification IDs allowing employers to verify authenticity in real-time.
            </p>
          </div>

          <div class="benefit-card">
            <div class="benefit-icon bg-amber-light text-amber">
              <i class="mdi mdi-bullhorn-outline"></i>
            </div>
            <h3 class="benefit-title">Marketing &amp; Branding Support</h3>
            <p class="benefit-desc">
              Receive official GSFIN Authorized Center branding badges, listing on our global website, and co-branded marketing assets.
            </p>
          </div>

          <div class="benefit-card">
            <div class="benefit-icon bg-teal-light text-teal">
              <i class="mdi mdi-account-group"></i>
            </div>
            <h3 class="benefit-title">Dedicated Account Manager</h3>
            <p class="benefit-desc">
              Work alongside a dedicated lead evaluator and support team to assist with center audits, trainer onboarding, and exam schedules.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ APPLICATION FORM SECTION ═══ -->
    <section id="apply-form" class="section-application">
      <div class="page-wrap">
        <div class="app-glass-card">
          <div class="app-card-grid">

            <!-- Form Left Info -->
            <div class="app-left-info">
              <span class="eyebrow-red mb-2">APPLY TODAY</span>
              <h2 class="app-main-title">
                Apply for Training Center Accreditation
              </h2>
              <p class="app-main-sub">
                Take the first step toward becoming an authorized GSFIN training partner. Fill out the application form and our accreditation team will contact you within 24–48 hours.
              </p>

              <div class="app-perks-list">
                <div class="app-perk-item">
                  <div class="perk-icon"><i class="mdi mdi-check-circle"></i></div>
                  <div>
                    <strong class="text-slate-900 block text-sm">Fast-Track Processing</strong>
                    <span class="text-xs text-slate-500">Fast document evaluation and preliminary approval</span>
                  </div>
                </div>
                <div class="app-perk-item">
                  <div class="perk-icon"><i class="mdi mdi-check-circle"></i></div>
                  <div>
                    <strong class="text-slate-900 block text-sm">Full Curriculum Access</strong>
                    <span class="text-xs text-slate-500">Access CODEX HACCP, ISO 22000 &amp; Food Safety packages</span>
                  </div>
                </div>
                <div class="app-perk-item">
                  <div class="perk-icon"><i class="mdi mdi-check-circle"></i></div>
                  <div>
                    <strong class="text-slate-900 block text-sm">Official Certification Pack</strong>
                    <span class="text-xs text-slate-500">Authorized Center Certificate &amp; Digital Badges</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Form Right Fields -->
            <div class="app-right-form">
              <div v-if="formSuccess" class="form-success-box">
                <div class="success-icon-circle mx-auto mb-3">
                  <i class="mdi mdi-check"></i>
                </div>
                <h3 class="text-2xl font-black text-slate-900 mb-2">Application Submitted!</h3>
                <p class="text-slate-600 text-sm mb-6">
                  Thank you for submitting your application. Our accreditation team will review your details and reach out to you shortly.
                </p>
                <button class="btn-red w-full justify-center" @click="formSuccess = false">
                  Submit Another Application
                </button>
              </div>

              <form v-else @submit.prevent="submitApplication" class="space-y-4">
                <div v-if="formError" class="form-error-alert">
                  <i class="mdi mdi-alert-circle me-1"></i> {{ formError }}
                </div>

                <div>
                  <label class="form-label">Organization / Training Center Name *</label>
                  <input v-model="form.organizationName" type="text" placeholder="e.g. Apex Institute of Food Technology" class="form-input-box" required />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="form-label">Contact Person Name *</label>
                    <input v-model="form.contactName" type="text" placeholder="e.g. Prof. David Miller" class="form-input-box" required />
                  </div>
                  <div>
                    <label class="form-label">Country *</label>
                    <input v-model="form.country" type="text" placeholder="e.g. United Arab Emirates" class="form-input-box" required />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="form-label">Email Address *</label>
                    <input v-model="form.email" type="email" placeholder="david@apexfood.edu" class="form-input-box" required />
                  </div>
                  <div>
                    <label class="form-label">Phone / WhatsApp *</label>
                    <input v-model="form.phone" type="tel" placeholder="+971 50 123 4567" class="form-input-box" required />
                  </div>
                </div>

                <div>
                  <label class="form-label">Institution Type *</label>
                  <select v-model="form.institutionType" class="form-select-box">
                    <option value="Authorized Training Center">Authorized Training Center</option>
                    <option value="University / Higher Education">University / Higher Education</option>
                    <option value="Corporate / Food Industry Processor">Corporate / Food Industry Processor</option>
                    <option value="Independent Assessment Center">Independent Assessment Center</option>
                  </select>
                </div>

                <div>
                  <label class="form-label">Additional Message / Facility Details</label>
                  <textarea v-model="form.message" rows="3" placeholder="Tell us about your facility, student volume, or current courses..." class="form-textarea-box"></textarea>
                </div>

                <button type="submit" class="btn-red w-full justify-center py-3 text-base" :disabled="formSubmitting">
                  <span v-if="formSubmitting" class="spinner-sm-white"></span>
                  <span>{{ formSubmitting ? 'Submitting Application...' : 'Submit Application' }}</span>
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </section>

    <!-- ═══ GLOBAL PRODUCT FOOTER ═══ -->
    <PublicFooter />

    <!-- ═══ MODAL ═══ -->
    <Transition name="fade">
      <div v-if="showPartnerModal" class="modal-overlay" @click.self="closePartnerModal">
        <div class="modal-card-box">
          <button class="modal-close-btn" @click="closePartnerModal" aria-label="Close Modal">
            <i class="mdi mdi-close"></i>
          </button>
          <div class="p-6 sm:p-8">
            <span class="eyebrow-red text-xs font-black uppercase mb-1 block">BECOME AN AUTHORIZED CENTER</span>
            <h3 class="text-xl sm:text-2xl font-black text-slate-900 mb-4">Apply for Partner Accreditation</h3>
            <p class="text-slate-600 text-sm mb-6">
              Complete your institution details below and our team will get in touch with you.
            </p>
            <button class="btn-red w-full justify-center" @click="closePartnerModal(); scrollTo('apply-form')">
              Proceed to Application Form <i class="mdi mdi-arrow-right ms-2"></i>
            </button>
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
  title: 'Become an Approved GSFIN Training Center | Partner Accreditation',
  meta: [
    {
      name: 'description',
      content: 'Become an authorized GSFIN Training Center. Learn about our 8-step center approval procedure, partner benefits, curriculum access, and accreditation process.',
    },
  ],
});

const api = useApi();
const fullLogoUrl = useState('fullLogoUrl', () => '');
const currentYear = new Date().getFullYear();

const showPartnerModal = ref(false);
const formSubmitting = ref(false);
const formSuccess = ref(false);
const formError = ref('');

const form = ref({
  organizationName: '',
  contactName: '',
  email: '',
  phone: '',
  country: '',
  institutionType: 'Authorized Training Center',
  message: '',
});

const approvalSteps = [
  {
    number: '01',
    title: 'Application Submission',
    description: 'Complete the online application form with your institution details and center information.',
    icon: 'mdi-file-document-edit-outline',
    colorClass: 'bg-red-light text-red',
  },
  {
    number: '02',
    title: 'Documentation Review',
    description: 'Our accreditation committee assesses your application and verifies submitted organization credentials.',
    icon: 'mdi-file-search-outline',
    colorClass: 'bg-blue-light text-blue',
  },
  {
    number: '03',
    title: 'Approval Notification',
    description: 'Receive official notification confirming preliminary approval of your center application.',
    icon: 'mdi-email-check-outline',
    colorClass: 'bg-indigo-light text-indigo',
  },
  {
    number: '04',
    title: 'Initial Application Fee',
    description: 'Process the initial application fee to proceed with the authorization and verification process.',
    icon: 'mdi-credit-card-outline',
    colorClass: 'bg-purple-light text-purple',
  },
  {
    number: '05',
    title: 'Training Material Access',
    description: 'Gain access to GSFIN comprehensive courseware, lecture slides, and examination syllabus.',
    icon: 'mdi-folder-text-outline',
    colorClass: 'bg-teal-light text-teal',
  },
  {
    number: '06',
    title: 'Session Observation',
    description: 'Conduct a demo training session observed and evaluated by a designated GSFIN lead evaluator.',
    icon: 'mdi-eye-check-outline',
    colorClass: 'bg-amber-light text-amber',
  },
  {
    number: '07',
    title: 'Evaluation & Feedback',
    description: 'Receive formal feedback and comprehensive evaluation results from our quality assessment team.',
    icon: 'mdi-chart-box-check-outline',
    colorClass: 'bg-emerald-light text-emerald',
  },
  {
    number: '08',
    title: 'Authorization Granted',
    description: 'Upon successful evaluation and payment, receive official GSFIN Authorized Center certification.',
    icon: 'mdi-certificate-outline',
    colorClass: 'bg-red-light text-red',
  },
];

const openPartnerModal = () => {
  showPartnerModal.value = true;
};

const closePartnerModal = () => {
  showPartnerModal.value = false;
};

const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
};

const submitApplication = async () => {
  if (!form.value.organizationName || !form.value.contactName || !form.value.email || !form.value.phone || !form.value.country) {
    formError.value = 'Please complete all required fields (*).';
    return;
  }

  formSubmitting.value = true;
  formError.value = '';

  try {
    const payload = {
      name: form.value.contactName,
      email: form.value.email,
      phone: form.value.phone,
      subject: `Training Center Accreditation: ${form.value.organizationName} (${form.value.country})`,
      message: `[GSFIN TRAINING CENTER ACCREDITATION APPLICATION]\nOrganization Name: ${form.value.organizationName}\nContact Person: ${form.value.contactName}\nEmail: ${form.value.email}\nPhone: ${form.value.phone}\nCountry: ${form.value.country}\nInstitution Type: ${form.value.institutionType}\nAdditional Message: ${form.value.message || 'N/A'}`
    };

    await api.post('/public/contact', payload);
    formSuccess.value = true;
    form.value = {
      organizationName: '',
      contactName: '',
      email: '',
      phone: '',
      country: '',
      institutionType: 'Authorized Training Center',
      message: '',
    };
  } catch (err: any) {
    formError.value = err?.response?.data?.message || 'Failed to submit application. Please try again.';
  } finally {
    formSubmitting.value = false;
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

/* Typography & Colors */
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

.bg-red-light { background-color: rgba(254, 242, 242, 0.9); }
.bg-blue-light { background-color: rgba(239, 246, 255, 0.9); }
.bg-emerald-light { background-color: rgba(236, 253, 245, 0.9); }
.bg-amber-light { background-color: rgba(255, 251, 235, 0.9); }
.bg-purple-light { background-color: rgba(243, 232, 255, 0.9); }
.bg-teal-light { background-color: rgba(240, 253, 244, 0.9); }
.bg-indigo-light { background-color: rgba(238, 242, 255, 0.9); }

/* ── Hero Section with Refractive Glassmorphism ─────────────── */
.partner-hero {
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

.partner-hero-blur {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  z-index: 1;
}

.blur-1 {
  top: 15%;
  left: 20%;
  width: 380px;
  height: 380px;
  background: rgba(227, 27, 35, 0.12);
}

.blur-2 {
  bottom: 10%;
  right: 25%;
  width: 340px;
  height: 340px;
  background: rgba(79, 70, 229, 0.1);
}

.partner-hero-container {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 48px;
  align-items: center;
}

@media (max-width: 960px) {
  .partner-hero-container {
    grid-template-columns: 1fr;
    text-align: center;
  }
}

.partner-hero-left {
  max-width: 680px;
}

.partner-hero-title {
  font-size: clamp(2.2rem, 3.8vw, 3.4rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0F172A;
  line-height: 1.15;
  margin: 12px 0 16px 0;
}

.partner-hero-sub {
  font-size: 1.02rem;
  color: #475569;
  line-height: 1.75;
  margin-bottom: 32px;
}

.partner-hero-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 36px;
  flex-wrap: wrap;
}

@media (max-width: 960px) {
  .partner-hero-actions {
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

/* Right Column Visual Box */
.partner-hero-right {
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

/* Floating Glass Badges */
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

.badge-top-left { top: 18px; left: 18px; }
.badge-bottom-right { bottom: 18px; right: 18px; }

.f-badge-icon {
  width: 32px; height: 32px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; flex-shrink: 0;
}

.bg-emerald-100 { background: rgba(236, 253, 245, 0.85); }
.text-emerald-600 { color: #059669; }
.bg-red-100 { background: rgba(254, 242, 242, 0.85); }
.text-red-600 { color: #E31B23; }

.f-badge-title { font-size: 0.78rem; font-weight: 800; color: #0F172A; line-height: 1.2; }
.f-badge-sub { font-size: 0.7rem; color: #475569; font-weight: 600; }

/* ── 8-Step Procedure Timeline ──────────────────────────────── */
.section-procedure {
  padding: 96px 0;
  background: radial-gradient(circle at 20% 50%, rgba(227, 27, 35, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 50%, rgba(79, 70, 229, 0.08) 0%, transparent 50%),
              linear-gradient(180deg, #FAFAFD 0%, #F1F5F9 100%);
  position: relative;
  overflow: hidden;
}

.proc-blur {
  position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none;
}

.blur-proc-1 { top: 10%; left: 10%; width: 400px; height: 400px; background: rgba(227, 27, 35, 0.12); }
.blur-proc-2 { bottom: 10%; right: 10%; width: 400px; height: 400px; background: rgba(79, 70, 229, 0.12); }

.section-header-center {
  text-align: center; max-width: 800px; margin: 0 auto 60px auto; position: relative; z-index: 10;
}

.section-main-title {
  font-size: clamp(2rem, 3.2vw, 2.75rem); font-weight: 800; color: #0F172A;
  letter-spacing: -0.02em; margin: 8px 0 16px 0;
}

.section-main-sub { font-size: 1.05rem; color: #64748B; line-height: 1.65; }

.steps-flow-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

@media (max-width: 1024px) {
  .steps-flow-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .steps-flow-grid { grid-template-columns: 1fr; }
}

.step-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.68) 0%, rgba(255, 255, 255, 0.42) 100%);
  backdrop-filter: blur(20px) saturate(190%);
  -webkit-backdrop-filter: blur(20px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-top: 1px solid rgba(255, 255, 255, 0.95);
  border-left: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.step-card:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.65) 100%);
  transform: translateY(-5px);
  box-shadow: 0 20px 42px rgba(15, 23, 42, 0.09);
  border-color: rgba(227, 27, 35, 0.3);
}

.step-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.step-badge-num {
  font-size: 0.85rem;
  font-weight: 800;
  color: #E31B23;
  background: rgba(254, 242, 242, 0.9);
  padding: 4px 12px;
  border-radius: 50px;
  letter-spacing: 0.05em;
  border: 1px solid rgba(227, 27, 35, 0.15);
}

.step-icon-circle {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
}

.step-card-title {
  font-size: 1.12rem;
  font-weight: 800;
  color: #0F172A;
  margin-bottom: 10px;
  line-height: 1.3;
}

.step-card-desc {
  font-size: 0.86rem;
  color: #64748B;
  line-height: 1.65;
  flex: 1;
  margin: 0;
}

.step-footer-bar {
  height: 3px;
  width: 36px;
  background: rgba(227, 27, 35, 0.2);
  border-radius: 2px;
  margin-top: 18px;
  transition: width 0.3s ease;
}

.step-card:hover .step-footer-bar {
  width: 100%;
  background: #E31B23;
}

/* ── Benefits Section ────────────────────────────────────────── */
.section-benefits {
  padding: 96px 0;
  background: radial-gradient(circle at 50% 30%, rgba(227, 27, 35, 0.05) 0%, transparent 60%), #FFFFFF;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

@media (max-width: 992px) { .benefits-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .benefits-grid { grid-template-columns: 1fr; } }

.benefit-card {
  background: linear-gradient(135deg, rgba(250, 250, 253, 0.75) 0%, rgba(241, 245, 249, 0.45) 100%);
  backdrop-filter: blur(20px) saturate(190%);
  -webkit-backdrop-filter: blur(20px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-top: 1px solid rgba(255, 255, 255, 0.98);
  border-left: 1px solid rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  padding: 32px;
  transition: all 0.35s ease;
  display: flex; flex-direction: column;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.9);
}

.benefit-card:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.65) 100%);
  border-color: rgba(227, 27, 35, 0.3);
  transform: translateY(-5px);
  box-shadow: 0 20px 42px rgba(15, 23, 42, 0.09);
}

.benefit-icon {
  width: 50px; height: 50px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; margin-bottom: 20px; flex-shrink: 0;
  backdrop-filter: blur(10px);
}

.benefit-title { font-size: 1.2rem; font-weight: 800; color: #0F172A; margin-bottom: 12px; }
.benefit-desc { font-size: 0.88rem; color: #64748B; line-height: 1.7; flex: 1; margin: 0; }

/* ── Application Form Section ────────────────────────────────── */
.section-application {
  padding: 80px 0 100px 0;
  background: linear-gradient(180deg, #FFFFFF 0%, #FAFAFD 100%);
}

.app-glass-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(254, 242, 242, 0.65) 100%);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid rgba(227, 27, 35, 0.25);
  border-top: 1px solid rgba(255, 255, 255, 0.95);
  border-left: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 32px;
  padding: 56px;
  box-shadow: 0 24px 50px rgba(15, 23, 42, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.95);
}

@media (max-width: 900px) {
  .app-glass-card { padding: 32px 24px; }
}

.app-card-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 48px;
}

@media (max-width: 900px) {
  .app-card-grid { grid-template-columns: 1fr; }
}

.app-left-info { max-width: 480px; }
.app-main-title { font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 800; color: #0F172A; margin-bottom: 12px; }
.app-main-sub { font-size: 0.96rem; color: #475569; line-height: 1.65; margin-bottom: 32px; }

.app-perks-list { display: flex; flex-direction: column; gap: 20px; }
.app-perk-item { display: flex; align-items: flex-start; gap: 14px; }
.perk-icon { font-size: 1.4rem; color: #059669; flex-shrink: 0; margin-top: 2px; }

.app-right-form {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  border-radius: 24px;
  padding: 36px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

@media (max-width: 600px) { .app-right-form { padding: 24px; } }

.form-label { display: block; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 6px; }

.form-input-box, .form-select-box, .form-textarea-box {
  width: 100%; padding: 12px 16px; border-radius: 12px;
  border: 1px solid #E2E8F0; background: #FFFFFF;
  font-size: 0.88rem; color: #0F172A; transition: all 0.2s ease; outline: none;
}

.form-input-box:focus, .form-select-box:focus, .form-textarea-box:focus {
  border-color: #E31B23; box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.1);
}

.form-error-alert {
  padding: 12px 16px; border-radius: 12px; background: #FEF2F2;
  border: 1px solid #FEE2E2; color: #DC2626; font-size: 0.82rem; font-weight: 600;
}

.form-success-box { text-align: center; padding: 32px 16px; }

.success-icon-circle {
  width: 64px; height: 64px; border-radius: 50%;
  background: #ECFDF5; color: #059669; font-size: 2rem;
  display: flex; align-items: center; justify-content: center;
}

.spinner-sm-white {
  width: 18px; height: 18px; border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF; border-radius: 50%; animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Buttons */
.btn-red {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 26px; border-radius: 50px;
  background: #E31B23 !important; color: #FFFFFF !important;
  font-weight: 700; font-size: 0.92rem; border: none; cursor: pointer;
  box-shadow: 0 4px 14px rgba(227, 27, 35, 0.25); transition: all 0.25s ease; text-decoration: none;
}

.btn-red:hover {
  background: #C8141B !important; transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(227, 27, 35, 0.35);
}

.btn-outline-dark {
  display: inline-flex; align-items: center;
  padding: 12px 26px; border-radius: 50px;
  background: #FFFFFF; border: 1px solid rgba(15, 23, 42, 0.18);
  color: #0F172A !important; font-weight: 700; font-size: 0.92rem;
  transition: all 0.25s ease; text-decoration: none; cursor: pointer;
}

.btn-outline-dark:hover { background: #F1F5F9; border-color: #0F172A; }

/* Footer */
.gsfin-footer { background: #FAFAFD; border-top: 1px solid rgba(15, 23, 42, 0.08); color: #334155; }
.footer-grid { padding: 72px 32px 48px 32px; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; }
@media (max-width: 900px) { .footer-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 600px) { .footer-grid { grid-template-columns: 1fr; } }
.footer-col-brand { max-width: 320px; }
.footer-logo { height: 42px !important; width: auto !important; max-width: 220px !important; object-fit: contain !important; margin-bottom: 18px; display: block; }
.footer-brand-desc { font-size: 0.84rem; line-height: 1.7; color: #64748B; margin-bottom: 20px; }
.footer-socials { display: flex; gap: 10px; }
.footer-soc { width: 36px; height: 36px; background: #FFFFFF; border: 1px solid rgba(15, 23, 42, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #64748B !important; text-decoration: none; font-size: 1rem; transition: all 0.2s; }
.footer-soc:hover { background: #E31B23 !important; color: #FFFFFF !important; border-color: #E31B23 !important; }
.footer-col-h { font-size: 0.78rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #0F172A; margin-bottom: 18px; }
.footer-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.footer-links a { font-size: 0.84rem; color: #64748B !important; text-decoration: none; transition: color 0.18s; }
.footer-links a:hover { color: #E31B23 !important; }
.footer-bar { border-top: 1px solid rgba(15, 23, 42, 0.06); padding: 20px 0; }
.footer-bar-inner { display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem; color: #94A3B8; }
.footer-slogan { font-weight: 600; color: #64748B; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(10px) saturate(180%); -webkit-backdrop-filter: blur(10px) saturate(180%);
  z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px;
}

.modal-card-box {
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 24px;
  max-width: 580px; width: 100%; position: relative; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.3);
  overflow: hidden; max-height: 90vh; overflow-y: auto;
}

.modal-close-btn {
  position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border-radius: 50%;
  background: #F1F5F9; color: #64748B; display: flex; align-items: center; justify-content: center;
  font-size: 20px; border: none; cursor: pointer; transition: all 0.2s ease; z-index: 10;
}
.modal-close-btn:hover { background: #FEF2F2; color: #E31B23; }
</style>
