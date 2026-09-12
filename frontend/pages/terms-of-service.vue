<template>
  <div class="gsfin-page">
    <PublicNavbar />

    <main class="page-wrap pt-32 pb-24 max-w-4xl mx-auto px-4 sm:px-6">
      <div class="mb-10 text-center">
        <span class="eyebrow-red text-xs font-black tracking-wider uppercase mb-2 block">GOVERNANCE &amp; ACCREDITATION</span>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
        <p class="text-slate-500 text-sm mt-2">
          Version {{ configMap?.terms_version || '1.0' }} — Last updated: January 2026
        </p>
      </div>

      <div class="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-sm">
        <div v-if="configMap?.terms_content" class="whitespace-pre-line">
          {{ configMap.terms_content }}
        </div>
        <div v-else class="space-y-6">
          <section>
            <h2 class="text-lg font-bold text-slate-900 mb-2">1. Scope of Accreditation</h2>
            <p>
              These Terms of Service govern the use of GSFIN examination systems, qualification frameworks, accredited center authorizations, and official credential verification services worldwide.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-slate-900 mb-2">2. Training Center Authorization Regulations</h2>
            <p>
              Accredited training centers must maintain compliance with GSFIN quality standards, audit criteria, examination proctoring regulations, and curriculum delivery protocols as established by the Global Advisory Board.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-slate-900 mb-2">3. Intellectual Property &amp; Co-Branding</h2>
            <p>
              All qualification titles, examination materials, syllabi, logos, and certification marks remain the exclusive intellectual property of GSFIN. Authorized partners are granted a non-exclusive license during active accreditation status.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-slate-900 mb-2">4. Anti-Fraud &amp; Revocation</h2>
            <p>
              GSFIN reserves the right to revoke qualifications or partner center accreditations in the event of examination misconduct, unauthorized certificate alteration, or failure to meet audit compliance.
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
  title: 'Terms of Service | GSFIN Official Governance',
  meta: [{ name: 'description', content: 'GSFIN Terms of Service and partner accreditation regulations.' }],
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
