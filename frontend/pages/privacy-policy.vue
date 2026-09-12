<template>
  <div class="gsfin-page">
    <PublicNavbar />

    <main class="page-wrap pt-32 pb-24 max-w-4xl mx-auto px-4 sm:px-6">
      <div class="mb-10 text-center">
        <span class="eyebrow-red text-xs font-black tracking-wider uppercase mb-2 block">LEGAL &amp; COMPLIANCE</span>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
        <p class="text-slate-500 text-sm mt-2">
          Version {{ configMap?.privacy_version || '1.0' }} — Last updated: January 2026
        </p>
      </div>

      <div class="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-sm">
        <div v-if="configMap?.privacy_content" class="whitespace-pre-line">
          {{ configMap.privacy_content }}
        </div>
        <div v-else class="space-y-6">
          <section>
            <h2 class="text-lg font-bold text-slate-900 mb-2">1. Overview &amp; Commitment</h2>
            <p>
              Global Standards for Food Industries (GSFIN) is committed to safeguarding personal data entrusted to us by candidate students, accredited partner training centers, auditors, and employers globally.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-slate-900 mb-2">2. Information We Collect</h2>
            <p>
              When registering for qualifications or accreditation services, we collect necessary professional data including name, email address, institutional affiliation, examination performance, and credential identification numbers.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-slate-900 mb-2">3. Credential Verification &amp; Public Records</h2>
            <p>
              To maintain international qualification integrity, official certificate reference numbers and recipient names may be verified through the secure GSFIN Verification Portal by authorized employers and institutions.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-slate-900 mb-2">4. Data Security &amp; Compliance</h2>
            <p>
              GSFIN employs industry-standard encryption protocols (TLS 1.3), tamper-proof QR verification hashes, and restricted access controls to prevent unauthorized access or modification of academic credentials.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-slate-900 mb-2">5. Contact Us</h2>
            <p>
              For privacy inquiries or data subject access requests, please contact the Data Protection Officer at <a href="mailto:privacy@gsfin.org" class="text-red-600 font-bold">privacy@gsfin.org</a>.
            </p>
          </section>
        </div>
      </div>
    </main>

    <PublicFooter />
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports';
import { usePublicConfig } from '@/composables/usePublicConfig';

const { configMap } = usePublicConfig();

useHead({
  title: 'Privacy Policy | GSFIN Official Governance',
  meta: [{ name: 'description', content: 'GSFIN Privacy Policy and international data protection guidelines.' }],
});
</script>

<style scoped>
.gsfin-page {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
  background: #FAFAFD;
  min-height: 100vh;
}
.eyebrow-red { color: #E31B23; }
.text-red-600 { color: #E31B23; }
</style>
