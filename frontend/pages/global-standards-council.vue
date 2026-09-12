<template>
  <div class="gsfin-page">
    <PublicNavbar />

    <main class="page-wrap pt-32 pb-24 max-w-5xl mx-auto px-4 sm:px-6">
      <!-- Page Header -->
      <div class="mb-12 text-center">
        <span class="eyebrow-red text-xs font-black tracking-wider uppercase mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-100">
          <i class="mdi mdi-earth text-red-600"></i> INTERNATIONAL STANDARDIZATION
        </span>
        <h1 class="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          {{ configMap?.council_title || 'Global Standards Council' }}
        </h1>
        <p class="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          {{ configMap?.council_subtitle || 'Formulating, benchmarking, and maintaining globally accepted food safety qualification standards across production, processing, and hospitality sectors.' }}
        </p>
      </div>

      <!-- Main Content Card -->
      <div class="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm mb-12">
        <div v-if="configMap?.council_content" class="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line mb-8">
          {{ configMap.council_content }}
        </div>
        <div v-else class="space-y-8 text-slate-700 text-sm sm:text-base leading-relaxed">
          <section>
            <h2 class="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <i class="mdi mdi-scale-balance text-red-600"></i> Mandate &amp; Scope
            </h2>
            <p>
              The GSFIN Global Standards Council develops standardized assessment benchmarks for professional food safety qualifications. Working in close cooperation with industry partners, accredited institutions, and regulatory agencies, the Council ensures that credentials awarded by GSFIN represent true operational competence and international compliance.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <i class="mdi mdi-cog-sync-outline text-red-600"></i> Qualification Standardization Process
            </h2>
            <div class="space-y-4 mt-4">
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                <span class="w-8 h-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">1</span>
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">Gap Analysis &amp; Industry Consultation</h3>
                  <p class="text-xs text-slate-600">Identifying emerging bio-hazard vectors, FSMS requirements, and supply-chain vulnerabilities.</p>
                </div>
              </div>
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                <span class="w-8 h-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">2</span>
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">Drafting Assessment Competencies</h3>
                  <p class="text-xs text-slate-600">Defining precise cognitive and practical evaluation criteria for Levels 1 through 4 certifications.</p>
                </div>
              </div>
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                <span class="w-8 h-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">3</span>
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">Ratification &amp; Global Publication</h3>
                  <p class="text-xs text-slate-600">Official approval by the Council and dissemination across accredited training centers globally.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- Standards Council Technical Committees -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4 text-xl font-bold">
            TC-01
          </div>
          <h3 class="font-bold text-slate-900 text-lg mb-2">HACCP &amp; Preventive Controls Committee</h3>
          <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Oversees hazard analysis, Critical Control Point determination algorithms, and monitoring validation protocols for manufacturing plants.
          </p>
        </div>

        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4 text-xl font-bold">
            TC-02
          </div>
          <h3 class="font-bold text-slate-900 text-lg mb-2">ISO 22000 &amp; FSMS Committee</h3>
          <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Manages management system auditing criteria, prerequisite programs (PRPs), and Lead Auditor certification rubrics.
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
  title: 'Global Standards Council | GSFIN Official Governance',
  meta: [{ name: 'description', content: 'GSFIN Global Standards Council for food safety qualification frameworks.' }],
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
