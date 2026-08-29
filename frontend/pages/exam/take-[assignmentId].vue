<template>
  <v-container fluid class="pa-0 bg-slate-900 min-vh-100 text-white d-flex align-center justify-center">
    <v-card v-if="loading" variant="text" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary" size="64" class="mb-4"></v-progress-circular>
      <div class="text-h6 font-weight-medium">Loading Exam Session...</div>
    </v-card>

    <v-card v-else-if="error" color="surface" class="pa-8 rounded-xl max-w-600 text-center elevation-10 text-slate-900">
      <v-icon icon="mdi-alert-circle-outline" size="64" color="error" class="mb-4"></v-icon>
      <h2 class="text-h5 font-weight-bold mb-2">Exam Link Notice</h2>
      <p class="text-body-1 text-grey-darken-1 mb-6">{{ error }}</p>
      <v-btn color="primary" variant="flat" size="large" to="/">Return Home</v-btn>
    </v-card>

    <!-- PRE-START INTRO SCREEN -->
    <v-card v-else-if="!activeAttempt && !result" color="surface" class="pa-8 rounded-xl max-w-700 text-slate-900 elevation-12">
      <div class="d-flex align-center justify-space-between mb-4 border-b pb-4">
        <div>
          <span class="text-caption text-uppercase font-weight-bold text-primary">Official Certification Sitting</span>
          <h1 class="text-h4 font-weight-bold text-slate-900 mt-1">{{ details.examName }}</h1>
        </div>
        <v-chip color="indigo" variant="flat" size="large">
          {{ details.durationMinutes }} Mins
        </v-chip>
      </div>

      <v-row class="mb-6">
        <v-col cols="12" sm="6">
          <div class="bg-grey-lighten-4 pa-4 rounded-lg">
            <div class="text-caption text-grey">Candidate Name</div>
            <div class="text-subtitle-1 font-weight-bold">{{ details.studentName }}</div>
          </div>
        </v-col>
        <v-col cols="12" sm="6">
          <div class="bg-grey-lighten-4 pa-4 rounded-lg">
            <div class="text-caption text-grey">Sub-Center Authority</div>
            <div class="text-subtitle-1 font-weight-bold">{{ details.organizationName }}</div>
          </div>
        </v-col>
        <v-col cols="12" sm="6">
          <div class="bg-grey-lighten-4 pa-4 rounded-lg">
            <div class="text-caption text-grey">Attempt Count</div>
            <div class="text-subtitle-1 font-weight-bold text-indigo">{{ details.attemptsUsed }} / {{ details.maxAttempts }} Used</div>
          </div>
        </v-col>
        <v-col cols="12" sm="6">
          <div class="bg-grey-lighten-4 pa-4 rounded-lg">
            <div class="text-caption text-grey">Hard Cutoff Window</div>
            <div class="text-subtitle-1 font-weight-bold text-warning">{{ details.maxCutoffMinutes }} Mins (1.25x)</div>
          </div>
        </v-col>
      </v-row>

      <v-alert type="info" variant="tonal" class="mb-6 rounded-lg text-body-2">
        <strong>Important Instructions:</strong> Do not close or switch browser tabs. In case of unexpected connection loss or system disconnect, your sitting will signal abnormal termination and automatically grant a technical retry (up to your maximum allowed attempts).
      </v-alert>

      <div class="d-flex justify-end">
        <v-btn
          color="primary"
          size="x-large"
          variant="flat"
          class="px-8 font-weight-bold"
          prepend-icon="mdi-play"
          :loading="starting"
          @click="startSitting"
        >
          Begin Certification Exam
        </v-btn>
      </div>
    </v-card>

    <!-- ACTIVE EXAM SITTING INTERFACE -->
    <div v-else-if="activeAttempt && !result" class="w-100 min-vh-100 d-flex flex-column bg-slate-950">
      <!-- Top Sticky Header -->
      <div class="bg-slate-900 border-b border-slate-800 px-6 py-4 d-flex align-center justify-space-between">
        <div>
          <h2 class="text-h6 font-weight-bold text-white">{{ details.examName }}</h2>
          <span class="text-caption text-slate-400">Candidate: {{ details.studentName }} • {{ details.organizationName }}</span>
        </div>
        <div class="d-flex align-center gap-4">
          <v-chip color="warning" variant="flat" size="large" class="font-weight-mono font-weight-bold">
            <v-icon start icon="mdi-timer-outline"></v-icon>
            Cutoff Timer: {{ formattedTimeLeft }}
          </v-chip>
          <v-btn color="error" variant="outlined" size="small" prepend-icon="mdi-power" @click="simulateAbnormalTermination">
            Simulate Disconnect (Tech Void)
          </v-btn>
        </div>
      </div>

      <!-- Exam Body -->
      <div class="flex-grow-1 pa-8 d-flex flex-column align-center justify-center">
        <v-card color="surface" class="pa-8 rounded-xl max-w-800 w-100 text-slate-900 elevation-12">
          <h3 class="text-h5 font-weight-bold mb-4">Exam Question Sitting</h3>
          <p class="text-body-1 mb-6">
            Please answer all questions carefully before submitting. Your session is monitored for compliance.
          </p>

          <v-radio-group v-model="selectedSampleAnswer" class="mb-6">
            <v-radio label="Option A: Enforce TLS 1.3 encryption for all data in transit" value="A"></v-radio>
            <v-radio label="Option B: Use unencrypted HTTP for fast throughput" value="B"></v-radio>
            <v-radio label="Option C: Hardcode secret keys in client JavaScript" value="C"></v-radio>
            <v-radio label="Option D: Disable authentication tokens" value="D"></v-radio>
          </v-radio-group>

          <div class="d-flex justify-space-between align-center border-t pt-6">
            <v-btn color="grey" variant="text">Previous</v-btn>
            <v-btn color="success" size="large" variant="flat" class="px-6 font-weight-bold" :loading="submitting" @click="submitExam">
              Submit Final Exam
            </v-btn>
          </div>
        </v-card>
      </div>
    </div>

    <!-- RESULT / CERTIFICATE SCREEN -->
    <v-card v-else-if="result" color="surface" class="pa-8 rounded-xl max-w-650 text-slate-900 elevation-12 text-center">
      <div v-if="result.passed">
        <v-icon icon="mdi-check-circle" size="80" color="success" class="mb-4"></v-icon>
        <h2 class="text-h4 font-weight-bold text-success mb-2">Congratulations! Passed</h2>
        <p class="text-body-1 text-grey-darken-1 mb-6">
          You have successfully passed the <strong>{{ details.examName }}</strong> certification exam.
        </p>
        <v-btn
          v-if="details.certificateUrl"
          color="success"
          size="x-large"
          variant="flat"
          class="px-8 font-weight-bold mb-4"
          prepend-icon="mdi-certificate"
          :href="details.certificateUrl"
          target="_blank"
        >
          Download Uniform Certificate (PDF)
        </v-btn>
      </div>

      <div v-else>
        <v-icon icon="mdi-close-circle" size="80" color="error" class="mb-4"></v-icon>
        <h2 class="text-h4 font-weight-bold text-error mb-2">Exam Result: Not Passed</h2>
        <p class="text-body-1 text-grey-darken-1 mb-6">
          You did not meet the passing criteria for this sitting.
        </p>
      </div>

      <div class="mt-4">
        <v-btn variant="tonal" color="primary" to="/">Back to Home</v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const route = useRoute();
const config = useRuntimeConfig();
const assignmentId = computed(() => route.params.assignmentId as string);

const loading = ref(true);
const error = ref<string | null>(null);
const details = ref<any>({});

const starting = ref(false);
const activeAttempt = ref<any>(null);
const submitting = ref(false);
const result = ref<any>(null);
const selectedSampleAnswer = ref('A');

// Cutoff timer state
const secondsRemaining = ref(0);
let timerInterval: any = null;

const formattedTimeLeft = computed(() => {
  const m = Math.floor(secondsRemaining.value / 60);
  const s = secondsRemaining.value % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

onMounted(() => {
  fetchDetails();
  window.addEventListener('beforeunload', handleWindowUnload);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  window.removeEventListener('beforeunload', handleWindowUnload);
});

async function fetchDetails() {
  loading.value = true;
  try {
    details.value = await $fetch<any>(`${config.public.apiBase}/assignment-session/${assignmentId.value}/details`);
  } catch (err: any) {
    error.value = err.data?.message || 'Invalid or expired exam assignment link.';
  } finally {
    loading.value = false;
  }
}

async function startSitting() {
  starting.value = true;
  try {
    const res = await $fetch<any>(`${config.public.apiBase}/assignment-session/${assignmentId.value}/start`, {
      method: 'POST'
    });
    activeAttempt.value = res;
    // Set 1.25x duration countdown in seconds
    secondsRemaining.value = Math.floor(res.maxCutoffMinutes * 60);
    timerInterval = setInterval(() => {
      if (secondsRemaining.value > 0) {
        secondsRemaining.value--;
      } else {
        clearInterval(timerInterval);
        simulateCutoffEnd();
      }
    }, 1000);
  } catch (err: any) {
    alert(err.data?.message || 'Failed to start sitting');
  } finally {
    starting.value = false;
  }
}

async function submitExam() {
  if (!activeAttempt.value) return;
  submitting.value = true;
  try {
    const isPass = selectedSampleAnswer.value === 'A';
    const res = await $fetch<any>(`${config.public.apiBase}/assignment-session/${assignmentId.value}/submit`, {
      method: 'POST',
      body: {
        attempt_id: activeAttempt.value.attemptId,
        score: isPass ? 95 : 30,
        percentage: isPass ? 95 : 30,
        passed: isPass
      }
    });
    result.value = { passed: isPass, message: res.message };
    if (timerInterval) clearInterval(timerInterval);
    // Refresh details to fetch certificate URL if passed
    fetchDetails();
  } catch (err: any) {
    alert(err.data?.message || 'Failed to submit exam');
  } finally {
    submitting.value = false;
  }
}

async function simulateAbnormalTermination() {
  if (!activeAttempt.value) return;
  if (!confirm('Simulate technical crash/disconnect? This will signal technical_void.')) return;
  try {
    await $fetch(`${config.public.apiBase}/assignment-session/${assignmentId.value}/abnormal-terminate`, {
      method: 'POST',
      body: { attempt_id: activeAttempt.value.attemptId }
    });
    alert('Abnormal termination signal registered. Technical retry granted.');
    activeAttempt.value = null;
    fetchDetails();
  } catch (err: any) {
    alert(err.data?.message || 'Failed to signal abnormal termination');
  }
}

async function simulateCutoffEnd() {
  if (!activeAttempt.value) return;
  try {
    await $fetch(`${config.public.apiBase}/assignment-session/${assignmentId.value}/submit`, {
      method: 'POST',
      body: {
        attempt_id: activeAttempt.value.attemptId,
        score: 0,
        percentage: 0,
        passed: false
      }
    });
    alert('Hard 1.25x duration cutoff reached! Exam force ended.');
    result.value = { passed: false, message: 'Force ended due to time cutoff.' };
  } catch (err) {
    console.error(err);
  }
}

function handleWindowUnload(e: BeforeUnloadEvent) {
  if (activeAttempt.value && !result.value) {
    e.preventDefault();
    e.returnValue = '';
  }
}
</script>
