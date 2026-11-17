<template>
  <v-container class="py-12 px-4" style="max-width: 900px;">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-16">
      <v-progress-circular indeterminate color="#E31B23" size="64" width="5"></v-progress-circular>
      <p class="text-sm font-semibold text-slate-500 mt-4">Evaluating your exam submission...</p>
    </div>

    <div v-else-if="result" class="thank-you-wrap">
      <!-- Success / Pass Header Banner -->
      <div :class="['result-banner', result.passed ? 'banner-pass' : 'banner-fail']">
        <div class="banner-icon-box">
          <i :class="['mdi', result.passed ? 'mdi-trophy-award' : 'mdi-clipboard-text-clock-outline']"></i>
        </div>

        <h1 class="banner-title">
          {{ result.passed ? 'Congratulations, ' + result.guest_name + '!' : 'Exam Submitted, ' + result.guest_name }}
        </h1>
        <p class="banner-subtitle">
          {{ result.passed
            ? 'You have successfully passed the ' + result.exam_name + ' examination standard.'
            : 'Your attempt has been submitted. Review your performance breakdown below.'
          }}
        </p>
      </div>

      <!-- Score & Credentials Summary Card -->
      <div class="summary-card">
        <div class="summary-grid">
          <div class="summary-metric">
            <span class="metric-label">SCORE ACHIEVED</span>
            <span class="metric-value text-slate-900">{{ result.score }} / {{ result.total_marks }}</span>
            <span class="metric-sub">{{ result.correct_answers }} Correct Responses</span>
          </div>

          <div class="summary-metric">
            <span class="metric-label">PERCENTAGE</span>
            <span :class="['metric-value', result.passed ? 'text-emerald-600' : 'text-amber-600']">
              {{ result.percentage }}%
            </span>
            <span class="metric-sub">Passing Mark: {{ result.passing_marks }}%</span>
          </div>

          <div class="summary-metric">
            <span class="metric-label">RESULT STATUS</span>
            <span :class="['status-pill', result.passed ? 'status-pass' : 'status-fail']">
              <i :class="['mdi', result.passed ? 'mdi-check-decagram' : 'mdi-alert-circle-outline']"></i>
              {{ result.passed ? 'Certified' : 'Did Not Pass' }}
            </span>
            <span class="metric-sub">{{ result.passed ? 'Personnel Competence Standard' : 'Review Areas for Improvement' }}</span>
          </div>
        </div>

        <!-- Proctoring Audit Notice (if held) -->
        <div v-if="result.passed && result.enable_proctoring && result.proctoring_status === 'pending_review'" class="audit-callout">
          <i class="mdi mdi-shield-search text-amber-600 text-xl"></i>
          <div>
            <h4 class="font-semibold text-amber-900 text-sm">Proctoring Audit Verification Pending</h4>
            <p class="text-xs text-amber-800 mt-0.5 leading-relaxed">
              Your passing score has been securely registered. Because this is an AI Proctored certification exam, your webcam and browser integrity logs are held for administrative verification. Your official certificate will be automatically issued upon verification.
            </p>
          </div>
        </div>

        <!-- Certificate Ready Callout (if passed and available) -->
        <div v-else-if="result.passed && result.enable_certificate" class="certificate-callout">
          <div class="cert-callout-icon">
            <i class="mdi mdi-certificate text-2xl text-emerald-600"></i>
          </div>
          <div class="flex-grow">
            <h4 class="font-semibold text-emerald-950 text-sm">Official GSFIN Certificate Issued</h4>
            <p class="text-xs text-emerald-800 mt-0.5 leading-relaxed">
              {{ result.certificate_number ? 'Certificate No: ' + result.certificate_number + ' • ' : '' }}
              Your verified Certificate of Personnel Competence has been generated and registered in the public credential registry.
            </p>
          </div>
          <button type="button" class="btn-cert-download" @click="downloadCertificate">
            <i class="mdi mdi-download"></i>
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      <!-- Action Buttons Row -->
      <div class="actions-row">
        <NuxtLink
          :to="`/public-exams/${examSlug}/result/${route.params.id}`"
          class="btn-glass flex items-center gap-2"
        >
          <i class="mdi mdi-chart-box-outline"></i>
          <span>View Detailed Scorecard</span>
        </NuxtLink>

        <button
          v-if="result.passed && result.enable_certificate && result.proctoring_status !== 'pending_review'"
          type="button"
          class="btn-red flex items-center gap-2"
          @click="downloadCertificate"
        >
          <i class="mdi mdi-certificate-outline"></i>
          <span>Download Certificate</span>
        </button>

        <NuxtLink
          to="/public-exams"
          class="btn-glass flex items-center gap-2"
        >
          <i class="mdi mdi-view-grid-outline"></i>
          <span>Catalog</span>
        </NuxtLink>

        <NuxtLink
          v-if="result.certificate_number"
          :to="`/verify-certificate?code=${result.certificate_number}`"
          class="btn-glass flex items-center gap-2"
        >
          <i class="mdi mdi-shield-check-outline"></i>
          <span>Verify Credential</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Error State -->
    <v-card v-else class="text-center py-16 px-4 border rounded-2xl" flat>
      <v-icon size="64" color="error" class="mb-4">mdi-alert-circle-outline</v-icon>
      <h3 class="text-lg font-semibold text-slate-900 mb-2">Evaluation Error</h3>
      <p class="text-sm text-slate-500 mb-6">We could not retrieve details for this exam attempt.</p>
      <v-btn color="#E31B23" rounded="lg" to="/public-exams" class="px-6 text-capitalize text-white font-semibold">
        Back to Portal
      </v-btn>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';
import confetti from 'canvas-confetti';

definePageMeta({
  layout: 'public'
});

const route = useRoute();
const api = useApi();

const result = ref<any>(null);
const loading = ref(true);

const examSlug = computed(() => {
  return (route.params.slug as string) || result.value?.exam_slug || 'exam';
});

async function fetchResultDetails() {
  loading.value = true;
  try {
    const { data } = await api.get(`/public/exams/attempts/${route.params.id}/result`);
    result.value = data;
    if (data.passed) {
      triggerConfetti();
    }
  } catch (err) {
    console.error('Failed to load result details:', err);
  } finally {
    loading.value = false;
  }
}

function triggerConfetti() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 }
  });
}

function downloadCertificate() {
  const url = result.value?.certificate_url 
    ? (result.value.certificate_url.startsWith('http') ? result.value.certificate_url : `/api${result.value.certificate_url.startsWith('/') ? '' : '/'}${result.value.certificate_url}`)
    : `/api/public/exams/attempts/${route.params.id}/certificate`;
  window.open(url, '_blank');
}

onMounted(() => {
  fetchResultDetails();
});
</script>

<style scoped>
.thank-you-wrap {
  width: 100%;
}

.result-banner {
  padding: 32px 24px;
  border-radius: 20px;
  text-align: center;
  margin-bottom: 24px;
  color: #FFFFFF;
}

.banner-pass {
  background: linear-gradient(135deg, #059669 0%, #10B981 100%);
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.25);
}

.banner-fail {
  background: linear-gradient(135deg, #334155 0%, #475569 100%);
  box-shadow: 0 10px 25px rgba(51, 65, 85, 0.2);
}

.banner-icon-box {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px auto;
  font-size: 2rem;
}

.banner-title {
  font-size: 1.65rem;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.banner-subtitle {
  font-size: 0.95rem;
  opacity: 0.95;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.5;
}

.summary-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
  margin-bottom: 24px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 640px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

.summary-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px;
  background: #F8FAFC;
  border-radius: 14px;
  border: 1px solid #E2E8F0;
}

.metric-label {
  font-size: 0.70rem;
  font-weight: 600;
  color: #64748B;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.metric-value {
  font-size: 1.6rem;
  font-weight: 600;
  line-height: 1.2;
}

.metric-sub {
  font-size: 0.75rem;
  color: #64748B;
  font-weight: 500;
  margin-top: 4px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-pass {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.status-fail {
  background: rgba(239, 68, 68, 0.12);
  color: #DC2626;
}

.audit-callout {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  border-radius: 12px;
  margin-top: 20px;
}

.certificate-callout {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #ECFDF5;
  border: 1px solid #A7F3D0;
  border-radius: 14px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.cert-callout-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #D1FAE5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-cert-download {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: #059669;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
  margin-left: auto;
}

.btn-cert-download:hover {
  background: #047857;
  transform: translateY(-1px);
}

.actions-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-glass {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  color: #334155;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-glass:hover {
  background: #F8FAFC;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.25);
}

.btn-red {
  display: inline-flex;
  align-items: center;
  padding: 10px 22px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(227, 27, 35, 0.25);
}

.btn-red:hover {
  background: #C41219;
  transform: translateY(-1px);
}
</style>
