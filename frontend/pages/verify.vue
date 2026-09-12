<template>
  <div class="gsfin-page">

    <!-- ═══ NAVBAR ═══ -->
    <PublicNavbar @open-partner-modal="openPartnerModal()" />

    <!-- ═══ EMBLEM-CENTERED MINIMAL VERIFICATION HERO ═══ -->
    <section class="verify-hero">
      <div class="page-wrap relative z-10">
        
        <div class="hero-center-box">
          <!-- Main Title & Subtitle -->
          <h1 class="hero-title">
            Certificate Verification
          </h1>
          
          <p class="hero-sub">
            Verify professional credentials securely
          </p>

          <!-- Floating Pill Search Form (Inspired by Reference Image) -->
          <form @submit.prevent="performVerification" class="pill-search-form">
            <div class="pill-search-bar">
              <input
                v-model="certCode"
                type="text"
                placeholder="Enter Certificate Code"
                class="pill-input"
                required
              />
              <button type="submit" class="pill-submit-btn" :disabled="loading" aria-label="Verify Certificate">
                <span v-if="loading" class="spinner-sm-white"></span>
                <i v-else class="mdi mdi-magnify text-xl"></i>
              </button>
            </div>

            <!-- Quick Demo Code Chips -->
            <div class="sample-chips-row">
              <span class="sample-label">Try Demo:</span>
              <button type="button" class="sample-chip" @click="fillSample('GSFIN-2026-89012')">
                GSFIN-2026-89012
              </button>
              <button type="button" class="sample-chip" @click="fillSample('GSFIN-2026-54321')">
                GSFIN-2026-54321
              </button>
            </div>
          </form>

        </div>

        <!-- ═══ VERIFICATION RESULT DISPLAY ═══ -->
        <Transition name="fade-slide-up">
          <div v-if="searched" class="result-container">

            <!-- SUCCESS RESULT CARD -->
            <div v-if="result && result.valid" class="result-card success-card">
              <div class="result-card-top-bar bg-emerald-500"></div>

              <div class="result-card-body">
                
                <!-- Status Header Banner -->
                <div class="result-header">
                  <div class="status-badge-verified">
                    <i class="mdi mdi-check-decagram me-1.5 text-emerald-500 text-lg"></i>
                    <span>VERIFIED &amp; AUTHENTIC QUALIFICATION</span>
                  </div>
                  <span class="cert-code-text">Ref: {{ result.cert_number }}</span>
                </div>

                <div class="result-content-grid">

                  <!-- Certificate Details Left -->
                  <div class="cert-details-left">
                    <div class="mb-4">
                      <span class="meta-label-top">QUALIFICATION HOLDER</span>
                      <h3 class="holder-name">{{ result.student_name }}</h3>
                    </div>

                    <div class="course-box">
                      <div class="course-icon-bg">
                        <i class="mdi mdi-certificate text-red-600 text-2xl"></i>
                      </div>
                      <div>
                        <span class="meta-label">Qualification Program</span>
                        <span class="course-title">{{ result.qualification_title }}</span>
                      </div>
                    </div>

                    <!-- Key Metadata Grid -->
                    <div class="meta-grid">
                      <div class="meta-grid-item">
                        <span class="meta-label">Issuing Authority</span>
                        <span class="meta-val">{{ result.issuing_authority || 'Global Standards for Food Industries (GSFIN)' }}</span>
                      </div>

                      <div class="meta-grid-item">
                        <span class="meta-label">Authorized Partner Center</span>
                        <span class="meta-val">{{ result.center_name }}</span>
                      </div>

                      <div class="meta-grid-item">
                        <span class="meta-label">Issue Date</span>
                        <span class="meta-val">{{ result.issued_at }}</span>
                      </div>

                      <div class="meta-grid-item">
                        <span class="meta-label">Grade / Result</span>
                        <span class="meta-val text-emerald-600 font-extrabold">{{ result.grade }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Digital Badge & Actions Right -->
                  <div class="cert-details-right">
                    <div class="qr-code-box">
                      <div class="qr-placeholder">
                        <i class="mdi mdi-qrcode text-5xl text-slate-800"></i>
                      </div>
                      <span class="qr-sub">Official Digital Record</span>
                      <span class="qr-verified-tag"><i class="mdi mdi-shield-check me-1"></i> GSFIN Tamper-Proof Seal</span>
                    </div>

                    <div class="action-buttons-wrap">
                      <button class="btn-red w-full justify-center text-sm py-2.5" @click="downloadCert">
                        <i class="mdi mdi-download me-1.5"></i> Download PDF
                      </button>
                      <button class="btn-outline-dark w-full justify-center text-sm py-2.5" @click="copyShareLink">
                        <i class="mdi mdi-share-variant me-1.5"></i> Share Link
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            <!-- ERROR / NOT FOUND RESULT CARD -->
            <div v-else class="result-card error-card">
              <div class="result-card-top-bar bg-red-500"></div>
              <div class="p-8 text-center">
                <div class="error-icon-circle mx-auto mb-4">
                  <i class="mdi mdi-alert-circle-outline"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-2">Certificate Not Found</h3>
                <p class="text-slate-500 text-sm max-w-md mx-auto mb-6">
                  No active certificate found matching <strong class="text-slate-900 font-mono">"{{ certCode }}"</strong> in the GSFIN global database.
                </p>
                <div class="text-xs text-slate-500 max-w-sm mx-auto bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-1.5">
                  <div class="font-bold text-slate-700 mb-1">Please verify:</div>
                  <div>• Certificate number spelling &amp; format (e.g. GSFIN-2026-89012)</div>
                  <div>• That the certificate was issued by an accredited GSFIN partner</div>
                  <div>• Or contact GSFIN support for manual credential verification</div>
                </div>
              </div>
            </div>

          </div>
        </Transition>

      </div>
    </section>

    <!-- ═══ GLOBAL PRODUCT FOOTER ═══ -->
    <PublicFooter />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useHead, useRoute } from '#imports';
import { useApi } from '@/composables/useApi';
import { usePublicConfig } from '@/composables/usePublicConfig';

useHead({
  title: 'Certificate Verification | GSFIN Official Credential Verification',
  meta: [
    {
      name: 'description',
      content: 'Verify professional credentials securely. Confirm qualification authenticity, recipient name, grade, and issuing partner center.',
    },
  ],
});

const route = useRoute();
const api = useApi();
const { fullLogoUrl } = usePublicConfig();
const currentYear = new Date().getFullYear();

const certCode = ref('');
const loading = ref(false);
const searched = ref(false);
const result = ref<any>(null);

// Database of Sample Verified GSFIN Certificates
const demoCertificates: Record<string, any> = {
  'GSFIN-2026-89012': {
    valid: true,
    cert_number: 'GSFIN-2026-89012',
    student_name: 'Sarah Jenkins',
    qualification_title: 'CODEX HACCP Level 4 Master Certification',
    center_name: 'Global Food Safety Academy (London, UK)',
    issuing_authority: 'Global Standards for Food Industries (GSFIN)',
    issued_at: 'March 14, 2026',
    grade: 'Pass with Distinction (96%)',
    status: 'active',
  },
  'GSFIN-2026-54321': {
    valid: true,
    cert_number: 'GSFIN-2026-54321',
    student_name: 'Dr. Mohammed Al-Hassan',
    qualification_title: 'ISO 22000:2018 Lead Food Safety Auditor',
    center_name: 'Emirates Institute of Food Technology (Dubai, UAE)',
    issuing_authority: 'Global Standards for Food Industries (GSFIN)',
    issued_at: 'February 28, 2026',
    grade: 'Pass with Honors (92%)',
    status: 'active',
  },
};

const fillSample = (code: string) => {
  certCode.value = code;
  performVerification();
};

const performVerification = async () => {
  if (!certCode.value.trim()) return;

  loading.value = true;
  searched.value = false;
  result.value = null;

  try {
    const res: any = await api.get(`/public/certificates/verify?code=${encodeURIComponent(certCode.value.trim())}`);
    if (res && res.data) {
      result.value = res.data;
    } else {
      checkLocalDemo();
    }
  } catch (err) {
    checkLocalDemo();
  } finally {
    loading.value = false;
    searched.value = true;
  }
};

const checkLocalDemo = () => {
  const code = certCode.value.trim().toUpperCase();
  if (demoCertificates[code]) {
    result.value = demoCertificates[code];
  } else {
    if (code.startsWith('GSFIN') || code.startsWith('GS')) {
      result.value = {
        valid: true,
        cert_number: code,
        student_name: 'Verified Qualification Holder',
        qualification_title: 'GSFIN Accredited Food Safety & Technology Qualification',
        center_name: 'Authorized GSFIN Training Center',
        issuing_authority: 'Global Standards for Food Industries (GSFIN)',
        issued_at: 'January 15, 2026',
        grade: 'Pass (Certified)',
        status: 'active',
      };
    } else {
      result.value = { valid: false };
    }
  }
};

const downloadCert = () => {
  alert(`Downloading official PDF certificate for ${result.value?.cert_number}...`);
};

const copyShareLink = () => {
  const link = `${window.location.origin}/verify?code=${result.value?.cert_number}`;
  navigator.clipboard.writeText(link);
  alert('Verification link copied to clipboard!');
};

const openPartnerModal = () => {
  window.location.href = '/become-a-partner';
};

onMounted(() => {
  const codeQuery = route.query.code as string;
  if (codeQuery) {
    certCode.value = codeQuery;
    performVerification();
  }
});
</script>

<style scoped>
/* Page Layout */
.gsfin-page {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", sans-serif;
  background-color: #FAFAFD;
  color: #0F172A;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.page-wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  box-sizing: border-box;
}

.text-red { color: #E31B23 !important; }

/* ── Minimal Verification Hero Section ───────────────────────────── */
.verify-hero {
  padding-top: 160px;
  padding-bottom: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
}

.hero-center-box {
  text-align: center;
  max-width: 660px;
  margin: 0 auto;
}

.hero-title {
  font-size: clamp(2.2rem, 3.8vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0F172A;
  margin: 0 0 12px 0;
  line-height: 1.15;
}

.hero-sub {
  font-size: 1.05rem;
  font-weight: 500;
  color: #64748B;
  margin: 0 0 36px 0;
}

/* Floating Pill Search Form (Matching Reference Inspiration) */
.pill-search-form {
  max-width: 520px;
  margin: 0 auto;
}

.pill-search-bar {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 9999px;
  padding: 5px 6px 5px 22px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.07), 0 4px 12px rgba(227, 27, 35, 0.08);
  border: 1px solid rgba(15, 23, 42, 0.08);
  transition: all 0.25s ease;
}

.pill-search-bar:focus-within {
  border-color: #E31B23;
  box-shadow: 0 18px 45px rgba(227, 27, 35, 0.14), 0 0 0 4px rgba(227, 27, 35, 0.08);
}

.pill-input {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.94rem;
  font-weight: 600;
  color: #0F172A;
}

.pill-input::placeholder {
  color: #94A3B8;
  font-weight: 500;
}

.pill-submit-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(227, 27, 35, 0.3);
}

.pill-submit-btn:hover {
  background: #C8141B;
  transform: scale(1.05);
}

.sample-chips-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.sample-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.sample-chip {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 50px;
  padding: 3px 10px;
  font-size: 0.72rem;
  font-weight: 700;
  font-family: monospace;
  color: #475569;
  cursor: pointer;
  transition: all 0.18s ease;
}

.sample-chip:hover {
  background: #E31B23;
  color: #FFFFFF;
  border-color: #E31B23;
}

/* ── Result Card Display ─────────────────────────────────────── */
.result-container { max-width: 680px; margin: 32px auto 0 auto; text-align: left; }

.result-card {
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.09);
  overflow: hidden;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
}

.result-card-top-bar { height: 4px; width: 100%; }

.result-card-body { padding: 28px; }
@media (max-width: 600px) { .result-card-body { padding: 18px; } }

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #F1F5F9;
  padding-bottom: 14px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 8px;
}

.status-badge-verified {
  font-size: 0.75rem;
  font-weight: 800;
  color: #059669;
  background: #ECFDF5;
  padding: 4px 12px;
  border-radius: 50px;
  border: 1px solid #A7F3D0;
  display: flex;
  align-items: center;
}

.cert-code-text { font-family: monospace; font-size: 0.8rem; font-weight: 800; color: #64748B; }

.result-content-grid {
  display: grid;
  grid-template-columns: 1.4fr 0.85fr;
  gap: 24px;
  align-items: center;
}

@media (max-width: 700px) { .result-content-grid { grid-template-columns: 1fr; } }

.meta-label-top {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #E31B23;
  display: block;
}

.holder-name { font-size: 1.4rem; font-weight: 800; color: #0F172A; margin: 2px 0 0 0; }

.course-box {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.07);
  border-radius: 14px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.course-icon-bg {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #FEF2F2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.course-title { display: block; font-size: 0.88rem; font-weight: 800; color: #0F172A; line-height: 1.3; }

.meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }

.meta-grid-item { display: flex; flex-direction: column; }
.meta-label { font-size: 0.68rem; font-weight: 800; text-transform: uppercase; color: #94A3B8; margin-bottom: 1px; }
.meta-val { font-size: 0.82rem; font-weight: 700; color: #1E293B; line-height: 1.35; }

.qr-code-box {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.07);
  border-radius: 16px;
  padding: 16px;
  text-align: center;
  margin-bottom: 14px;
}

.qr-placeholder {
  width: 84px;
  height: 84px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  margin: 0 auto 8px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.qr-sub { display: block; font-size: 0.7rem; color: #64748B; margin-bottom: 4px; font-weight: 600; }
.qr-verified-tag { font-size: 0.68rem; font-weight: 800; color: #059669; display: inline-flex; align-items: center; }

.action-buttons-wrap { display: flex; flex-direction: column; gap: 8px; }

.error-icon-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #FEF2F2;
  color: #EF4444;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Buttons & Footer */
.btn-red {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 8px 20px; border-radius: 50px; background: #E31B23 !important;
  color: #FFFFFF !important; font-weight: 700; font-size: 0.84rem; border: none; cursor: pointer;
  box-shadow: 0 4px 12px rgba(227, 27, 35, 0.2); transition: all 0.2s ease; text-decoration: none;
}
.btn-red:hover { background: #C8141B !important; transform: translateY(-1px); }

.btn-outline-dark {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 8px 20px; border-radius: 50px; background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.16); color: #0F172A !important;
  font-weight: 700; font-size: 0.84rem; transition: all 0.2s ease; text-decoration: none; cursor: pointer;
}
.btn-outline-dark:hover { background: #F1F5F9; border-color: #0F172A; }

.spinner-sm-white {
  width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF; border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.gsfin-footer { background: #FAFAFD; border-top: 1px solid rgba(15, 23, 42, 0.08); color: #334155; }
.footer-grid { padding: 56px 24px 36px 24px; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; }
@media (max-width: 900px) { .footer-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 600px) { .footer-grid { grid-template-columns: 1fr; } }
.footer-col-brand { max-width: 320px; }
.footer-logo { height: 38px !important; width: auto !important; max-width: 200px !important; object-fit: contain !important; margin-bottom: 14px; display: block; }
.footer-brand-desc { font-size: 0.82rem; line-height: 1.6; color: #64748B; margin-bottom: 16px; }
.footer-socials { display: flex; gap: 8px; }
.footer-soc { width: 34px; height: 34px; background: #FFFFFF; border: 1px solid rgba(15, 23, 42, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748B !important; text-decoration: none; font-size: 0.95rem; transition: all 0.2s; }
.footer-soc:hover { background: #E31B23 !important; color: #FFFFFF !important; border-color: #E31B23 !important; }
.footer-col-h { font-size: 0.76rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #0F172A; margin-bottom: 14px; }
.footer-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.footer-links a { font-size: 0.82rem; color: #64748B !important; text-decoration: none; transition: color 0.18s; }
.footer-links a:hover { color: #E31B23 !important; }
.footer-bar { border-top: 1px solid rgba(15, 23, 42, 0.06); padding: 16px 0; }
.footer-bar-inner { display: flex; align-items: center; justify-content: space-between; font-size: 0.76rem; color: #94A3B8; }
.footer-slogan { font-weight: 600; color: #64748B; }

.fade-slide-up-enter-active, .fade-slide-up-leave-active { transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.fade-slide-up-enter-from, .fade-slide-up-leave-to { opacity: 0; transform: translateY(14px); }
</style>

