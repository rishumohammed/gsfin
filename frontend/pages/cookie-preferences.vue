<template>
  <div class="gsfin-page">
    <PublicNavbar />

    <main class="page-wrap pt-32 pb-24 max-w-4xl mx-auto px-4 sm:px-6">
      <!-- Page Header -->
      <div class="mb-10 text-center">
        <span class="eyebrow-red text-xs font-black tracking-wider uppercase mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-100">
          <i class="mdi mdi-cookie-outline text-red-600"></i> PRIVACY &amp; CONSENT
        </span>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Cookie Preferences</h1>
        <p class="text-slate-500 text-sm max-w-xl mx-auto">
          Manage your privacy settings and customize how GSFIN collects and uses cookie data across our platforms.
        </p>
      </div>

      <!-- Interactive Cookie Consent Controls Card -->
      <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm mb-10">
        <h2 class="text-lg font-bold text-slate-900 mb-6 flex items-center justify-between">
          <span>Manage Cookie Categories</span>
          <span v-if="savedSuccess" class="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <i class="mdi mdi-check-circle me-1"></i> Preferences Saved
          </span>
        </h2>

        <div class="space-y-6">
          <!-- Essential Cookies (Always Active) -->
          <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-bold text-slate-900 text-sm">Essential &amp; System Cookies</h3>
                <span class="text-[10px] font-extrabold uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded">Strictly Required</span>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed">
                Necessary for secure candidate authentication, certificate verification lookup, and core site navigation. Cannot be disabled.
              </p>
            </div>
            <div class="pt-1">
              <input type="checkbox" checked disabled class="w-5 h-5 accent-red-600 rounded cursor-not-allowed opacity-60" />
            </div>
          </div>

          <!-- Analytics Cookies -->
          <div class="p-5 rounded-2xl bg-white border border-slate-200/80 flex items-start justify-between gap-4">
            <div>
              <h3 class="font-bold text-slate-900 text-sm mb-1">Performance &amp; Analytics Cookies</h3>
              <p class="text-xs text-slate-600 leading-relaxed">
                Allows us to collect anonymized telemetry on page performance, verification usage, and portal navigation speed.
              </p>
            </div>
            <div class="pt-1">
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="cookiePreferences.analytics" class="sr-only peer" />
                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>

          <!-- Functional Cookies -->
          <div class="p-5 rounded-2xl bg-white border border-slate-200/80 flex items-start justify-between gap-4">
            <div>
              <h3 class="font-bold text-slate-900 text-sm mb-1">Functional &amp; Preference Cookies</h3>
              <p class="text-xs text-slate-600 leading-relaxed">
                Remembers your language preferences, region selection, and portal layout choices for future visits.
              </p>
            </div>
            <div class="pt-1">
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="cookiePreferences.functional" class="sr-only peer" />
                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="pt-4 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100">
            <button @click="acceptAll" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition">
              Accept All
            </button>
            <button @click="savePreferences" class="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm">
              Save Preferences
            </button>
          </div>
        </div>
      </div>

      <!-- Dynamic Cookie Policy Body Text from Admin Panel -->
      <div class="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900 mb-4">Cookie Policy Notice</h2>
        <div v-if="configMap?.cookie_policy_content" class="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-line">
          {{ configMap.cookie_policy_content }}
        </div>
        <div v-else class="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            GSFIN uses cookies and similar cryptographic session tokens to authenticate user requests, prevent malicious proctoring tampering during online examinations, and ensure secure certificate lookup operations.
          </p>
          <p>
            You can modify your browser settings to reject non-essential cookies at any time. For questions regarding our data privacy compliance under GDPR and international standards, please contact our Data Protection Officer at <a href="mailto:privacy@gsfin.org" class="text-red-600 font-bold">privacy@gsfin.org</a>.
          </p>
        </div>
      </div>
    </main>

    <PublicFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useHead } from '#imports';
import { usePublicConfig } from '@/composables/usePublicConfig';

const { configMap } = usePublicConfig();

const savedSuccess = ref(false);
const cookiePreferences = ref({
  essential: true,
  analytics: true,
  functional: true,
});

onMounted(() => {
  const saved = localStorage.getItem('gsfin_cookie_prefs');
  if (saved) {
    try {
      cookiePreferences.value = { ...cookiePreferences.value, ...JSON.parse(saved) };
    } catch (e) { /* fallback */ }
  }
});

const savePreferences = () => {
  localStorage.setItem('gsfin_cookie_prefs', JSON.stringify(cookiePreferences.value));
  savedSuccess.value = true;
  setTimeout(() => { savedSuccess.value = false; }, 3000);
};

const acceptAll = () => {
  cookiePreferences.value.analytics = true;
  cookiePreferences.value.functional = true;
  savePreferences();
};

useHead({
  title: 'Cookie Preferences | GSFIN Official Governance',
  meta: [{ name: 'description', content: 'Manage GSFIN cookie preferences and data privacy settings.' }],
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
.bg-red-600 { background-color: #E31B23; }
.hover\:bg-red-700:hover { background-color: #C8141B; }
</style>
