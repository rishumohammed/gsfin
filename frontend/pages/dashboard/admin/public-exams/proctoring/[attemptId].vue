<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div class="d-flex align-center gap-4">
        <v-btn icon="mdi-arrow-left" variant="text" @click="router.back()"></v-btn>
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Public Exam Proctoring Audit Review</h1>
          <p class="text-subtitle-1 text-medium-emphasis mb-0">Attempt ID: {{ attemptId }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="d-flex gap-2 flex-wrap">
        <v-btn
          color="success"
          variant="flat"
          prepend-icon="mdi-certificate"
          class="rounded-lg font-weight-bold"
          :loading="actionLoading"
          @click="approveCertificate"
        >
          Approve &amp; Issue Certificate
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          prepend-icon="mdi-flag-outline"
          class="rounded-lg font-weight-bold"
          :loading="actionLoading"
          @click="flagAttempt"
        >
          Flag Attempt
        </v-btn>
        <v-btn
          color="warning"
          variant="tonal"
          prepend-icon="mdi-check-all"
          class="rounded-lg font-weight-bold"
          :loading="actionLoading"
          @click="clearViolations"
        >
          Clear Violations
        </v-btn>
        <v-btn
          color="error"
          variant="outlined"
          prepend-icon="mdi-delete-outline"
          class="rounded-lg font-weight-bold"
          :loading="actionLoading"
          @click="deleteLogs"
        >
          Delete Data
        </v-btn>
      </div>
    </div>

    <!-- Proxy Candidate Alert Banner -->
    <v-alert
      v-if="hasProxyMismatch"
      type="error"
      variant="tonal"
      prominent
      class="mb-6 rounded-xl border-error"
      icon="mdi-account-alert"
    >
      <div class="font-weight-bold text-h6">High Risk Proxy Candidate Alert</div>
      <div>
        Facial geometry mismatch detected (`proxy_mismatch`). The candidate's live face vector deviated from their registered baseline selfie. Carefully inspect snapshot evidence before issuing a certificate.
      </div>
    </v-alert>

    <v-row v-if="!loading">
      <!-- Session & Biometric Summary -->
      <v-col cols="12" md="4">
        <div class="apple-card pa-5 mb-6">
          <h3 class="text-h6 font-weight-bold mb-4 d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-card-account-details</v-icon>
            Candidate Biometric Baseline
          </h3>

          <div v-if="details?.reference_selfie_url" class="mb-4 text-center">
            <p class="text-caption text-secondary font-weight-bold mb-1">Registered Selfie Baseline</p>
            <v-img
              :src="backendUrl(details.reference_selfie_url)"
              height="180"
              class="rounded-xl border bg-grey-lighten-3 mx-auto"
              style="max-width: 220px;"
              cover
            ></v-img>
          </div>

          <v-list density="compact" class="bg-transparent pa-0">
            <v-list-item class="px-0">
              <template v-slot:prepend><v-icon color="grey">mdi-account</v-icon></template>
              <v-list-item-title class="font-weight-bold">{{ details?.candidate_name || 'Candidate' }}</v-list-item-title>
              <v-list-item-subtitle>{{ details?.candidate_email || 'No email' }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item class="px-0">
              <template v-slot:prepend><v-icon color="grey">mdi-file-document-outline</v-icon></template>
              <v-list-item-title class="font-weight-bold">{{ details?.exam_title || 'Public Exam' }}</v-list-item-title>
              <v-list-item-subtitle>Exam Title</v-list-item-subtitle>
            </v-list-item>

            <v-list-item class="px-0">
              <template v-slot:prepend><v-icon color="grey">mdi-shield-check</v-icon></template>
              <v-list-item-title>
                <v-chip :color="getStatusColor(details?.proctoring_status)" size="small" label class="font-weight-bold text-uppercase">
                  {{ details?.proctoring_status || 'pending_review' }}
                </v-chip>
              </v-list-item-title>
              <v-list-item-subtitle>Proctoring Status</v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-divider class="my-4"></v-divider>

          <div class="d-flex justify-space-between align-center text-center">
            <div class="pa-2 bg-grey-lighten-4 rounded-lg flex-grow-1 mr-2">
              <div class="text-h5 font-weight-black text-primary">{{ events.length }}</div>
              <div class="text-caption text-secondary">Logged Events</div>
            </div>
            <div class="pa-2 bg-grey-lighten-4 rounded-lg flex-grow-1">
              <div class="text-h5 font-weight-black text-error">{{ highSeverityCount }}</div>
              <div class="text-caption text-secondary">High Severity</div>
            </div>
          </div>
        </div>
      </v-col>

      <!-- Security Events & Lightweight Snapshot Evidence Gallery -->
      <v-col cols="12" md="8">
        <div class="apple-card d-flex flex-column h-100">
          <div class="pa-4 border-b d-flex align-center justify-space-between">
            <div class="font-weight-bold d-flex align-center">
              <v-icon color="warning" class="mr-2">mdi-shield-alert</v-icon> Violation Events &amp; Snapshot Evidence
            </div>
            <v-btn-toggle v-model="viewMode" mandatory density="compact" color="primary">
              <v-btn value="timeline" size="small" prepend-icon="mdi-timeline">Timeline View</v-btn>
              <v-btn value="grid" size="small" prepend-icon="mdi-grid">Snapshot Gallery</v-btn>
            </v-btn-toggle>
          </div>

          <div class="pa-5 flex-grow-1 overflow-y-auto" style="max-height: 650px;">
            <!-- Timeline View -->
            <v-timeline v-if="viewMode === 'timeline'" density="compact" side="end">
              <v-timeline-item
                v-for="event in events"
                :key="event.id"
                :dot-color="getEventColor(event.type)"
                size="small"
              >
                <div class="d-flex flex-column">
                  <div class="d-flex align-center gap-2">
                    <strong class="text-body-1 font-weight-bold">{{ formatType(event.type) }}</strong>
                    <v-chip :color="getEventColor(event.type)" size="x-small" label class="text-uppercase font-weight-bold">
                      {{ getSeverityLabel(event.type) }}
                    </v-chip>
                  </div>
                  <span class="text-caption text-secondary mb-2">{{ new Date(event.created_at).toLocaleString() }}</span>
                  
                  <div v-if="event.metadata_json && event.metadata_json.screenshot" class="cursor-pointer" @click="openPreview(event.metadata_json.screenshot)">
                    <v-img :src="backendUrl(event.metadata_json.screenshot)" height="140" width="220" class="rounded-xl border bg-black shadow-sm" cover></v-img>
                    <span class="text-caption text-primary font-weight-bold mt-1 d-inline-block">Click to zoom snapshot</span>
                  </div>
                  <div v-else-if="event.metadata_json && Object.keys(event.metadata_json).length > 0" class="text-caption bg-grey-lighten-4 pa-2 rounded-lg" style="max-width: 400px;">
                    <pre style="margin:0; white-space: pre-wrap; font-family: monospace;">{{ JSON.stringify(event.metadata_json, null, 2) }}</pre>
                  </div>
                </div>
              </v-timeline-item>

              <v-timeline-item v-if="events.length === 0" dot-color="green" size="small">
                <strong class="text-success">Clean Session</strong>
                <div class="text-caption text-secondary">Zero security violations logged during this exam attempt.</div>
              </v-timeline-item>
            </v-timeline>

            <!-- Snapshot Gallery Grid View -->
            <v-row v-else-if="viewMode === 'grid'">
              <v-col v-for="event in eventsWithScreenshots" :key="event.id" cols="12" sm="6" md="4">
                <v-card class="rounded-xl border cursor-pointer overflow-hidden elevation-1" @click="openPreview(event.metadata_json.screenshot)">
                  <v-img :src="backendUrl(event.metadata_json.screenshot)" height="130" cover class="bg-black"></v-img>
                  <div class="pa-3 bg-white">
                    <div class="text-caption font-weight-bold text-truncate text-error">{{ formatType(event.type) }}</div>
                    <div class="text-caption text-secondary">{{ new Date(event.created_at).toLocaleTimeString() }}</div>
                  </div>
                </v-card>
              </v-col>
              <v-col v-if="eventsWithScreenshots.length === 0" cols="12" class="text-center py-16 text-secondary">
                <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-camera-off</v-icon>
                <div>No violation snapshot images captured for this session.</div>
              </v-col>
            </v-row>
          </div>
        </div>
      </v-col>
    </v-row>

    <div v-else class="d-flex justify-center align-center py-16">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
    </div>

    <!-- Image Preview Dialog -->
    <v-dialog v-model="showPreviewDialog" max-width="800">
      <v-card class="rounded-xl overflow-hidden bg-black position-relative">
        <v-btn icon="mdi-close" color="white" variant="flat" class="position-absolute opacity-80" style="top: 12px; right: 12px; z-index: 10;" @click="showPreviewDialog = false"></v-btn>
        <v-img :src="previewImageUrl" class="w-100" contain max-height="600"></v-img>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

definePageMeta({ 
  layout: 'dashboard', 
  middleware: ['auth', 'role'], 
  role: ['super_admin', 'main_admin', 'lms_user'] 
});

const route = useRoute();
const router = useRouter();
const api = useApi();
const attemptId = route.params.attemptId as string;

const loading = ref(true);
const actionLoading = ref(false);
const details = ref<any>(null);
const events = ref<any[]>([]);
const viewMode = ref<'timeline' | 'grid'>('timeline');

const showPreviewDialog = ref(false);
const previewImageUrl = ref('');

const hasProxyMismatch = computed(() => {
  return events.value.some(e => e.type === 'proxy_mismatch');
});

const highSeverityCount = computed(() => {
  const highTypes = ['proxy_mismatch', 'multiple_faces', 'face_absent', 'devtools_open', 'mobile_phone_detected', 'camera_disabled'];
  return events.value.filter(e => highTypes.includes(e.type)).length;
});

const eventsWithScreenshots = computed(() => {
  return events.value.filter(e => e.metadata_json && e.metadata_json.screenshot);
});

const openPreview = (url: string) => {
  previewImageUrl.value = backendUrl(url);
  showPreviewDialog.value = true;
};

const backendUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const config = useRuntimeConfig();
  return `${config.public.apiBase.replace('/api', '')}${path}`;
};

onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await api.get(`/proctoring/admin/${attemptId}`);
    details.value = data.details || null;
    events.value = data.events || [];
  } catch (err) {
    console.error('Failed to load proctoring data', err);
  } finally {
    loading.value = false;
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case 'proxy_mismatch': return 'error';
    case 'multiple_faces': return 'error';
    case 'mobile_phone_detected': return 'error';
    case 'devtools_open': return 'error';
    case 'face_absent': return 'warning';
    case 'tab_switch': return 'warning';
    case 'window_blur': return 'warning';
    case 'fullscreen_exit': return 'error';
    case 'gaze_deviation': return 'blue';
    default: return 'grey';
  }
};

const getSeverityLabel = (type: string) => {
  const highTypes = ['proxy_mismatch', 'multiple_faces', 'face_absent', 'devtools_open', 'mobile_phone_detected'];
  const medTypes = ['tab_switch', 'window_blur', 'fullscreen_exit', 'gaze_deviation'];
  if (highTypes.includes(type)) return 'High';
  if (medTypes.includes(type)) return 'Medium';
  return 'Low';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'success';
    case 'flagged': return 'error';
    case 'pending_review': return 'warning';
    default: return 'grey';
  }
};

const formatType = (type: string) => {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const approveCertificate = async () => {
  actionLoading.value = true;
  try {
    await api.post(`/proctoring/admin/${attemptId}/approve-certificate`);
    await loadData();
    alert('Attempt approved! Certificate issued successfully.');
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to approve certificate');
  } finally {
    actionLoading.value = false;
  }
};

const flagAttempt = async () => {
  const reason = prompt('Enter reason for flagging this attempt:', 'High severity security violation');
  if (reason === null) return;
  actionLoading.value = true;
  try {
    await api.post(`/proctoring/admin/${attemptId}/flag-attempt`, { reason });
    await loadData();
    alert('Attempt marked as FLAGGED.');
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to flag attempt');
  } finally {
    actionLoading.value = false;
  }
};

const clearViolations = async () => {
  if (!confirm('Are you sure you want to clear violations? This action cannot be undone.')) return;
  actionLoading.value = true;
  try {
    await api.post(`/proctoring/admin/${attemptId}/clear-violations`);
    await loadData();
  } catch (err) {
    alert('Failed to clear violations');
  } finally {
    actionLoading.value = false;
  }
};

const deleteLogs = async () => {
  if (!confirm('Completely delete all proctoring logs for this attempt? This action cannot be undone.')) return;
  actionLoading.value = true;
  try {
    await api.delete(`/proctoring/admin/attempt/${attemptId}`);
    router.back();
  } catch (err) {
    alert('Failed to delete proctoring data');
  } finally {
    actionLoading.value = false;
  }
};
</script>

<style scoped>
.apple-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
}

.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
