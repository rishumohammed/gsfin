<template>
  <div class="gsfin-page">
    <PublicNavbar />

    <main class="page-wrap pt-32 pb-24 max-w-5xl mx-auto px-4 sm:px-6">
      <!-- Page Header -->
      <div class="mb-12 text-center">
        <span class="eyebrow-red text-xs font-black tracking-wider uppercase mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-100">
          <i class="mdi mdi-shield-account text-red-600"></i> GOVERNANCE &amp; LEADERSHIP
        </span>
        <h1 class="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          {{ configMap?.advisory_board_title || 'Advisory Board & Panel' }}
        </h1>
        <p class="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          {{ configMap?.advisory_board_subtitle || 'Independent international experts, food safety scientists, and regulatory authorities guiding GSFIN qualification frameworks worldwide.' }}
        </p>
      </div>

      <!-- Main Dynamic Content / Standard Framework -->
      <div class="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm mb-12">
        <div v-if="configMap?.advisory_board_content" class="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line mb-8">
          {{ configMap.advisory_board_content }}
        </div>
        <div v-else class="space-y-8 text-slate-700 text-sm sm:text-base leading-relaxed">
          <section>
            <h2 class="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <i class="mdi mdi-compass-outline text-red-600"></i> Charter &amp; Objective
            </h2>
            <p>
              The GSFIN Advisory Board serves as an autonomous governing council comprising distinguished academics, certified lead auditors, food defense strategists, and industrial QA directors. Their primary objective is to maintain strict alignment between GSFIN qualifications and emerging international Codex Alimentarius standards.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <i class="mdi mdi-clipboard-check-outline text-red-600"></i> Core Governance Functions
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 class="font-bold text-slate-900 mb-1 text-sm">Syllabus Standard Review</h3>
                <p class="text-xs text-slate-600">Annual audit and updates of ISO 22000, HACCP, and GHP examination domains.</p>
              </div>
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 class="font-bold text-slate-900 mb-1 text-sm">Center Accreditation Audit</h3>
                <p class="text-xs text-slate-600">Evaluating institutional compliance and proctoring protocols for training centers.</p>
              </div>
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 class="font-bold text-slate-900 mb-1 text-sm">Ethics &amp; Integrity Oversight</h3>
                <p class="text-xs text-slate-600">Investigating compliance violations and ensuring tamper-proof credential integrity.</p>
              </div>
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 class="font-bold text-slate-900 mb-1 text-sm">Global Regulatory Alignment</h3>
                <p class="text-xs text-slate-600">Synchronizing certifications with FDA, EFSA, and regional food safety legislations.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- Advisory Panel Pillars -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center">
          <div class="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl">
            <i class="mdi mdi-microscope"></i>
          </div>
          <h3 class="font-bold text-slate-900 text-base mb-2">Scientific Committee</h3>
          <p class="text-xs text-slate-600 leading-relaxed">
            Microbiologists and toxicologists reviewing hazard analysis, CCP thresholds, and food safety risk assessment criteria.
          </p>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center">
          <div class="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl">
            <i class="mdi mdi-certificate"></i>
          </div>
          <h3 class="font-bold text-slate-900 text-base mb-2">Audit &amp; Accreditation Panel</h3>
          <p class="text-xs text-slate-600 leading-relaxed">
            Senior GFSI lead auditors inspecting partner institutions and validating candidate examination rigors.
          </p>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center">
          <div class="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl">
            <i class="mdi mdi-earth"></i>
          </div>
          <h3 class="font-bold text-slate-900 text-base mb-2">International Liaisons</h3>
          <p class="text-xs text-slate-600 leading-relaxed">
            Representatives ensuring global harmonization across 45+ participating jurisdictions and trade bodies.
          </p>
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
  title: 'Advisory Board & Panel | GSFIN Official Governance',
  meta: [{ name: 'description', content: 'GSFIN International Advisory Board and Governance Committee.' }],
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
