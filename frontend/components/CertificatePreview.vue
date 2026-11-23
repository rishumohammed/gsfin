<template>
  <div class="cert-outer-wrapper" ref="wrapperRef">
    <div class="cert-scalable-container" :style="containerStyle">
      <div id="fit" class="cert-page-fit" :style="fitTransformStyle">
        <div class="page">
          <!-- 1. Left Vertical Banner Strip -->
          <aside class="side">
            <div class="r">
              <span>{{ displayExamTitle }}</span>
            </div>
            <div class="b">GSFIN</div>
          </aside>

          <!-- 2. Main Certificate Body -->
          <main class="main">
            <!-- Top Header: Official Logo & Certificate Number -->
            <div class="top">
              <img
                :src="logoSrc"
                alt="GSFIN – Global Standards for Food Industries"
                class="brand-logo"
              />
              <div class="no">
                CERTIFICATE NO.
                <b>{{ displayCertNumber }}</b>
              </div>
            </div>

            <!-- Body Section -->
            <div class="body">
              <div class="kind">Certificate of Completion</div>
              <div class="lead">THIS IS PROUDLY PRESENTED TO</div>
              <h1 class="name">{{ displayName }}</h1>
              <div class="rule"></div>
              <p class="txt">
                {{ narrativeText }}
              </p>
              <div class="std">{{ displayExamTitle }}</div>
            </div>

            <!-- Footer: Signatory, Official Security Seal & Registry Details -->
            <div class="foot">
              <!-- Left Signatory -->
              <div class="sig">
                <div v-if="sigImageSrc" class="sig-img-wrap">
                  <img :src="sigImageSrc" alt="Authorized Signature" class="sig-img" />
                </div>
                <i v-else>{{ displaySigName }}</i>
                <span>{{ displaySigTitle }}<br>GSFIN Examination Board</span>
              </div>

              <!-- Center: Official GSFIN Security Seal SVG (118x118) -->
              <div class="seal-container">
                <svg class="seal" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <path id="seal-text-circle" d="M 60,60 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0" />
                    <linearGradient id="sealGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#C59B27" />
                      <stop offset="50%" stop-color="#F3E5AB" />
                      <stop offset="100%" stop-color="#997316" />
                    </linearGradient>
                  </defs>
                  <!-- Outer Scalloped / Starburst Border -->
                  <circle cx="60" cy="60" r="56" fill="none" stroke="#E4202A" stroke-width="1.5" stroke-dasharray="3 2" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#1A1A1A" stroke-width="1.2" />
                  <circle cx="60" cy="60" r="49" fill="none" stroke="#E4202A" stroke-width="0.8" />
                  
                  <!-- Circular Text -->
                  <text font-family="'Hanken Grotesk', sans-serif" font-size="7.2" font-weight="700" fill="#1A1A1A" letter-spacing="0.12em">
                    <textPath href="#seal-text-circle" startOffset="50%" text-anchor="middle">
                      GLOBAL STANDARDS FOR FOOD INDUSTRIES • OFFICIAL SEAL •
                    </textPath>
                  </text>
                  
                  <!-- Inner Badge Center -->
                  <circle cx="60" cy="60" r="33" fill="#FFFFFF" stroke="#E4202A" stroke-width="1.2" />
                  <circle cx="60" cy="60" r="30" fill="none" stroke="#DCDCDC" stroke-width="0.8" />
                  
                  <!-- GSFIN Crest Shield -->
                  <g transform="translate(60, 48)">
                    <path d="M-8,-2 L0,-9 L8,-2 L5,8 L-5,8 Z" fill="#E4202A" opacity="0.12" />
                    <path d="M-6,0 L0,-6 L6,0 L4,6 L-4,6 Z" fill="none" stroke="#E4202A" stroke-width="1.2" />
                  </g>
                  <text x="60" y="65" text-anchor="middle" font-family="'Playfair Display', Georgia, serif" font-size="13" font-weight="700" fill="#E4202A" letter-spacing="0.08em">GSFIN</text>
                  <text x="60" y="73" text-anchor="middle" font-family="'Hanken Grotesk', sans-serif" font-size="5.2" font-weight="600" fill="#6B6B6B" letter-spacing="0.15em">VERIFIED</text>
                  
                  <!-- Security Stars -->
                  <text x="60" y="80" text-anchor="middle" font-size="6" fill="#E4202A">★ ★ ★</text>
                </svg>
              </div>

              <!-- Right Registry Data -->
              <div class="reg">
                <div>DATE OF ISSUANCE &nbsp;<b>{{ displayIssueDate }}</b></div>
                <div>VALID THROUGH &nbsp;<b>{{ displayValidUntil }}</b></div>
                <div>ACCREDITED CENTER &nbsp;<b>{{ displayCenterName }}</b></div>
                <div>VERIFICATION &nbsp;<b>{{ displayVerifyUrl }}</b></div>
              </div>
            </div>

            <!-- Bottom Anti-Counterfeit Bar -->
            <div class="tag">
              <span>GSFIN / GLOBAL STANDARDS FOR FOOD INDUSTRIES &bull; CODEX ALIMENTARIUS COMPLIANT</span>
              <em>Doc. Ref. {{ displayDocRef }} &bull; Security Hash: {{ displayHash }}</em>
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRuntimeConfig } from '#imports';

interface Props {
  candidateName?: string;
  examTitle?: string;
  certificateNumber?: string;
  issueDate?: string | Date;
  validUntil?: string | Date;
  centerName?: string;
  verifyUrl?: string;
  docRef?: string;
  securityHash?: string;
  config?: any;
}

const props = withDefaults(defineProps<Props>(), {
  candidateName: 'Rishu Mohammed',
  examTitle: 'Codex HACCP',
  certificateNumber: 'GSFIN-2026-HACCP-0842',
  issueDate: '',
  validUntil: '',
  centerName: 'London Academy of Food Safety',
  verifyUrl: 'verify.gsfin.org/c/0842',
  docRef: '',
  securityHash: '',
  config: () => ({})
});

const runtimeConfig = useRuntimeConfig();
const baseUrl = computed(() => (runtimeConfig.public?.apiBase || '/api').replace(/\/api\/?$/, ''));

const wrapperRef = ref<HTMLElement | null>(null);
const scale = ref(1);

const updateScale = () => {
  if (!wrapperRef.value) return;
  const parentWidth = wrapperRef.value.clientWidth;
  if (parentWidth > 0) {
    scale.value = Math.min(1, parentWidth / 1123);
  }
};

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  updateScale();
  if (wrapperRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => updateScale());
    resizeObserver.observe(wrapperRef.value);
  }
  window.addEventListener('resize', updateScale);
});

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  window.removeEventListener('resize', updateScale);
});

const containerStyle = computed(() => ({
  width: `${1123 * scale.value}px`,
  height: `${794 * scale.value}px`,
  position: 'relative' as const,
  overflow: 'hidden' as const
}));

const fitTransformStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left'
}));

const displayName = computed(() => props.candidateName || 'Candidate');
const displayExamTitle = computed(() => props.examTitle || 'Codex HACCP');
const displayCertNumber = computed(() => props.certificateNumber || 'GSFIN-2026-HACCP-0842');
const displayCenterName = computed(() => props.centerName || 'Authorized Testing Center');

const formatDate = (val?: string | Date, fallback: string = '24 October 2026') => {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (_) {
    return String(val);
  }
};

const displayIssueDate = computed(() => formatDate(props.issueDate, '24 October 2026'));
const displayValidUntil = computed(() => {
  if (props.validUntil) return formatDate(props.validUntil);
  if (props.issueDate) {
    try {
      const d = new Date(props.issueDate);
      d.setFullYear(d.getFullYear() + 3);
      d.setDate(d.getDate() - 1);
      return formatDate(d);
    } catch (_) {}
  }
  return '23 October 2029';
});

const displayVerifyUrl = computed(() => {
  if (props.verifyUrl) return props.verifyUrl.replace(/^https?:\/\//, '');
  const num = displayCertNumber.value.replace(/[^a-zA-Z0-9]/g, '').slice(-4);
  return `verify.gsfin.org/c/${num || '0842'}`;
});

const displayDocRef = computed(() => {
  if (props.docRef) return props.docRef;
  const num = displayCertNumber.value.replace(/[^a-zA-Z0-9]/g, '').slice(-4);
  return `GSFIN-CX-${num || '842'}-A`;
});

const displayHash = computed(() => {
  if (props.securityHash) return props.securityHash;
  return 'e4a8…7c19';
});

const narrativeText = computed(() => {
  return 'for successfully completing the prescribed examination and demonstrating professional competence in accordance with the Global Standards for Food Industries.';
});

const displaySigName = computed(() => {
  return props.config?.certificate_sig1_name || 'A. Al-Mansoor';
});

const displaySigTitle = computed(() => {
  return props.config?.certificate_sig1_title || 'Director of Certification';
});

const sigImageSrc = computed(() => {
  const p = props.config?.certificate_sig1_image;
  if (!p) return null;
  if (p.startsWith('http') || p.startsWith('data:')) return p;
  return `${baseUrl.value}${p.startsWith('/') ? p : '/' + p}`;
});

const logoSrc = computed(() => {
  const custom = props.config?.certificate_logo;
  if (custom) {
    if (custom.startsWith('http') || custom.startsWith('data:')) return custom;
    return `${baseUrl.value}${custom.startsWith('/') ? custom : '/' + custom}`;
  }
  return '/assets/images/logo.png';
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Hanken+Grotesk:wght@400;500;600&display=swap');

:root {
  --red: #E4202A;
  --ink: #1a1a1a;
  --mute: #6b6b6b;
  --line: #dcdcdc;
  --paper: #fff;
  --stage: #ececec;
  --serif: "Playfair Display", Georgia, serif;
  --sans: "Hanken Grotesk", system-ui, sans-serif;
}

.cert-outer-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cert-scalable-container {
  display: block;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}

.cert-page-fit {
  width: 1123px;
  height: 794px;
  position: absolute;
  top: 0;
  left: 0;
}

.page {
  position: relative;
  width: 1123px;
  height: 794px;
  background: #ffffff;
  display: grid;
  grid-template-columns: 168px 1fr;
  overflow: hidden;
  box-sizing: border-box;
  font-family: "Hanken Grotesk", system-ui, -apple-system, sans-serif;
  color: #1a1a1a;
  text-align: left;
}

/* Left Vertical Strip */
.side {
  display: grid;
  grid-template-rows: 1fr 150px;
}

.side .r {
  background: #E4202A;
  position: relative;
  overflow: hidden;
}

.side .r span {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) rotate(-90deg);
  white-space: nowrap;
  font-family: "Playfair Display", Georgia, serif;
  font-weight: 700;
  font-size: 76px;
  line-height: 1;
  color: #ffffff;
  letter-spacing: 0.01em;
}

.side .b {
  background: #000000;
  display: grid;
  place-items: center;
  color: #ffffff;
  font-family: "Playfair Display", Georgia, serif;
  font-weight: 700;
  font-size: 34px;
  letter-spacing: 0.04em;
}

/* Main Certificate Surface */
.main {
  padding: 52px 72px 40px 80px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.brand-logo {
  height: 62px;
  display: block;
  object-fit: contain;
}

.no {
  text-align: right;
  font-size: 12px;
  color: #6b6b6b;
  line-height: 1.5;
  letter-spacing: 0.05em;
}

.no b {
  display: block;
  font-family: "Hanken Grotesk", system-ui, sans-serif;
  font-weight: 600;
  font-size: 15px;
  color: #1a1a1a;
  letter-spacing: 0.04em;
  margin-top: 2px;
}

.body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: 10px;
}

.kind {
  font-family: "Playfair Display", Georgia, serif;
  font-weight: 500;
  font-style: italic;
  font-size: 22px;
  color: #E4202A;
  margin-bottom: 24px;
}

.lead {
  font-size: 13.5px;
  color: #6b6b6b;
  margin-bottom: 8px;
  letter-spacing: 0.06em;
  font-weight: 500;
}

.name {
  font-family: "Playfair Display", Georgia, serif;
  font-weight: 500;
  font-size: 80px;
  line-height: 1.02;
  letter-spacing: -0.01em;
  color: #1a1a1a;
  margin: 0;
}

.rule {
  width: 96px;
  height: 3px;
  background: #E4202A;
  margin: 26px 0 22px;
}

.txt {
  font-size: 15px;
  line-height: 1.6;
  color: #6b6b6b;
  max-width: 540px;
  margin: 0;
}

.std {
  font-family: "Playfair Display", Georgia, serif;
  font-weight: 700;
  font-size: 38px;
  line-height: 1.1;
  color: #1a1a1a;
  margin: 10px 0 6px;
}

/* Footer Section */
.foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-top: 20px;
}

.sig {
  width: 220px;
  font-size: 12px;
  color: #6b6b6b;
  line-height: 1.4;
}

.sig i {
  display: block;
  font-family: "Playfair Display", Georgia, serif;
  font-style: italic;
  font-weight: 500;
  font-size: 26px;
  color: #1a1a1a;
  padding-bottom: 4px;
  border-bottom: 1px solid #1a1a1a;
  margin-bottom: 6px;
}

.sig-img-wrap {
  height: 42px;
  margin-bottom: 6px;
  border-bottom: 1px solid #1a1a1a;
  display: flex;
  align-items: flex-end;
}

.sig-img {
  max-height: 38px;
  max-width: 190px;
  object-fit: contain;
}

.seal-container {
  width: 118px;
  height: 118px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.seal {
  width: 118px;
  height: 118px;
}

.reg {
  text-align: right;
  font-size: 11.5px;
  color: #6b6b6b;
  line-height: 1.65;
  letter-spacing: 0.02em;
}

.reg b {
  color: #1a1a1a;
  font-weight: 600;
}

.tag {
  margin-top: 22px;
  padding-top: 14px;
  border-top: 1px solid #dcdcdc;
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: #6b6b6b;
}

.tag em {
  font-family: "Playfair Display", Georgia, serif;
  font-style: italic;
  font-weight: 500;
  font-size: 13px;
  color: #1a1a1a;
}

@media print {
  @page {
    size: 297mm 210mm;
    margin: 0;
  }
  html, body {
    background: #ffffff;
    padding: 0;
    margin: 0;
  }
  .cert-scalable-container {
    box-shadow: none !important;
    border-radius: 0 !important;
  }
  .cert-page-fit {
    transform: none !important;
    width: 297mm !important;
    height: 210mm !important;
  }
  .page {
    width: 297mm !important;
    height: 210mm !important;
    box-shadow: none !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
