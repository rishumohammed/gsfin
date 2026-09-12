<template>
  <footer id="contact" class="gsfin-footer">
    <!-- Top Footer Main Grid -->
    <div class="footer-wrap footer-grid">
      
      <!-- Col 1: Brand & Global Authority -->
      <div class="footer-col-brand">
        <NuxtLink to="/" class="footer-brand-logo-link">
          <img :src="fullLogoUrl || '/logo.webp'" alt="GSFIN Logo" class="footer-logo" />
        </NuxtLink>

        <p class="footer-brand-desc">
          Global Standards for Food Industries — an independent international standards authority delivering world-class food safety qualifications, auditor accreditations, and institutional center benchmarking worldwide.
        </p>

        <div class="footer-authority-badge">
          <i class="mdi mdi-shield-check text-red-600 me-1.5"></i>
          <span>Official International Certification Authority</span>
        </div>

        <div class="footer-socials">
          <a href="#" class="footer-soc" aria-label="LinkedIn" title="LinkedIn"><i class="mdi mdi-linkedin"></i></a>
          <a href="#" class="footer-soc" aria-label="YouTube" title="YouTube"><i class="mdi mdi-youtube"></i></a>
          <a href="#" class="footer-soc" aria-label="Instagram" title="Instagram"><i class="mdi mdi-instagram"></i></a>
          <a href="#" class="footer-soc" aria-label="Facebook" title="Facebook"><i class="mdi mdi-facebook"></i></a>
          <a href="#" class="footer-soc" aria-label="Twitter / X" title="Twitter / X"><i class="mdi mdi-twitter"></i></a>
        </div>
      </div>

      <!-- Col 2: Qualifications & Frameworks -->
      <div class="footer-col">
        <h4 class="footer-col-h">Qualifications</h4>
        <ul class="footer-links">
          <li v-for="q in qualifications" :key="q.id">
            <NuxtLink :to="`/qualifications/${q.slug}`">{{ q.name }}</NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Col 3: Accreditation & Partners -->
      <div class="footer-col">
        <h4 class="footer-col-h">Accreditation</h4>
        <ul class="footer-links">
          <li><NuxtLink to="/become-a-partner">Become an Accredited Partner</NuxtLink></li>
          <li><NuxtLink to="/partners">Authorized Training Centers</NuxtLink></li>
          <li><NuxtLink to="/become-a-partner">8-Step Approval Process</NuxtLink></li>
          <li><NuxtLink to="/become-a-partner">Center Audit Regulations</NuxtLink></li>
          <li><NuxtLink to="/login">Partner Portal Login</NuxtLink></li>
          <li><NuxtLink to="/login-employer">Employer Verification Portal</NuxtLink></li>
        </ul>
      </div>

      <!-- Col 4: Verification & Trust -->
      <div class="footer-col">
        <h4 class="footer-col-h">Verification &amp; Trust</h4>
        <ul class="footer-links">
          <li><NuxtLink to="/verify">Verify Student Certificate</NuxtLink></li>
          <li><NuxtLink to="/partners">Verify Center Accreditation</NuxtLink></li>
          <li><NuxtLink to="/verify">Tamper-Proof Seal Regs</NuxtLink></li>
          <li><NuxtLink to="/verify">Digital Badge Lookup</NuxtLink></li>
          <li><NuxtLink to="/about">Quality Assurance Framework</NuxtLink></li>
        </ul>
      </div>

      <!-- Col 5: Organization & Legal -->
      <div class="footer-col">
        <h4 class="footer-col-h">Organization</h4>
        <ul class="footer-links">
          <li><NuxtLink to="/about">About GSFIN Authority</NuxtLink></li>
          <li><NuxtLink to="/advisory-board">Advisory Board &amp; Panel</NuxtLink></li>
          <li><NuxtLink to="/global-standards-council">Global Standards Council</NuxtLink></li>
          <li><NuxtLink to="/privacy-policy">Privacy Policy</NuxtLink></li>
          <li><NuxtLink to="/terms-of-service">Terms of Service</NuxtLink></li>
          <li><NuxtLink to="/cookie-preferences">Cookie Preferences</NuxtLink></li>
        </ul>
      </div>

    </div>

    <!-- Bottom Footer Sub-Bar -->
    <div class="footer-bar">
      <div class="footer-wrap footer-bar-inner">
        <div class="footer-copyright">
          <span>© {{ currentYear }} GSFIN. All rights reserved.</span>
          <span class="dot-separator">•</span>
          <span class="footer-slogan">Safer Food. Stronger Tomorrow.</span>
        </div>

        <div class="footer-region-select">
          <i class="mdi mdi-earth text-slate-500 me-1"></i>
          <span>Global (English)</span>
          <i class="mdi mdi-chevron-down text-slate-500 ms-1"></i>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePublicConfig } from '@/composables/usePublicConfig';
import { useApi } from '@/composables/useApi';

const { fullLogoUrl } = usePublicConfig();
const api = useApi();
const currentYear = new Date().getFullYear();

const qualifications = ref<any[]>([
  { id: '1', slug: 'codex-haccp', name: 'CODEX HACCP' },
  { id: '2', slug: 'iso-22000', name: 'ISO 22000:2018 FSMS' },
  { id: '3', slug: 'food-safety', name: 'Food Safety Management' },
  { id: '4', slug: 'food-technology', name: 'Food Technology & Bio' },
  { id: '5', slug: 'brcgs', name: 'BRCGS Global Standards' },
  { id: '6', slug: 'fssc-22000', name: 'FSSC 22000 Lead Auditor' },
  { id: '7', slug: 'ghp-gmp', name: 'GHP & Hygiene Practice' },
]);

onMounted(async () => {
  try {
    const res: any = await api.get('/public/qualifications');
    if (res && Array.isArray(res.data) && res.data.length > 0) {
      qualifications.value = res.data.slice(0, 7);
    }
  } catch (err) {
    // Silent fallback to standard qualifications list
  }
});
</script>

<style scoped>
.gsfin-footer {
  background: #FAFAFD;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  color: #334155;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", sans-serif;
}

.footer-wrap {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 32px;
  box-sizing: border-box;
}

.footer-grid {
  padding: 72px 32px 48px 32px;
  display: grid;
  grid-template-columns: 2.2fr 1fr 1fr 1fr 1fr;
  gap: 40px;
}

@media (max-width: 1024px) {
  .footer-grid {
    grid-template-columns: 2fr 1fr 1fr;
    gap: 32px;
  }
}

@media (max-width: 640px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 28px;
    padding: 48px 20px 32px 20px;
  }
}

.footer-col-brand {
  max-width: 340px;
}

.footer-brand-logo-link {
  display: inline-block;
  margin-bottom: 16px;
}

.footer-logo {
  height: 42px !important;
  width: auto !important;
  max-width: 220px !important;
  object-fit: contain !important;
  display: block;
}

.footer-brand-desc {
  font-size: 0.84rem;
  line-height: 1.65;
  color: #64748B;
  margin-bottom: 18px;
}

.footer-authority-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 50px;
  background: rgba(227, 27, 35, 0.06);
  border: 1px solid rgba(227, 27, 35, 0.15);
  font-size: 0.72rem;
  font-weight: 800;
  color: #E31B23;
  margin-bottom: 20px;
}

.text-red-600 {
  color: #E31B23 !important;
}

.footer-socials {
  display: flex;
  gap: 8px;
}

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
  transition: all 0.2s ease;
}

.footer-soc:hover {
  background: #E31B23 !important;
  color: #FFFFFF !important;
  border-color: #E31B23 !important;
  transform: translateY(-2px);
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
  transition: color 0.18s ease;
}

.footer-links a:hover {
  color: #E31B23 !important;
}

.footer-bar {
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  padding: 20px 0;
  background: #FAFAFD;
}

.footer-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
  color: #94A3B8;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-copyright {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot-separator {
  color: #CBD5E1;
}

.footer-slogan {
  font-weight: 600;
  color: #64748B;
}

.footer-region-select {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 50px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  font-size: 0.76rem;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s ease;
}

.footer-region-select:hover {
  background: #F1F5F9;
  border-color: #0F172A;
}
</style>
