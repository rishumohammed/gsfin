<template>
  <div class="face-flow-page">
    <div class="face-flow-container">
      <!-- Brand Header -->
      <div class="brand-header">
        <div class="brand-pill">
          <i class="mdi mdi-face-recognition"></i>
          <span>GSFIN Biometric Verification</span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loadingToken" class="flow-card text-center py-12">
        <div class="spinner-red mx-auto mb-4"></div>
        <h2 class="card-title">Validating Verification Link...</h2>
        <p class="card-sub">Please wait while we load your biometric profile.</p>
      </div>

      <!-- Invalid / Expired Token -->
      <div v-else-if="!tokenValid" class="flow-card text-center">
        <div class="status-icon-circle icon-red">
          <i class="mdi mdi-link-off"></i>
        </div>
        <h2 class="card-title">Link Invalid or Already Completed</h2>
        <p class="card-sub mb-6">{{ invalidReason || 'This face verification link is invalid or has already been completed.' }}</p>
        <div class="info-notice-box">
          <i class="mdi mdi-information-outline"></i>
          <span>If you already verified your face, check your email for your Registration Confirmation. Otherwise, contact your test center for a new link.</span>
        </div>
      </div>

      <!-- Verification Successful & Registration Complete -->
      <div v-else-if="verifySuccess" class="flow-card text-center">
        <div class="status-icon-circle icon-green">
          <i class="mdi mdi-check-decagram"></i>
        </div>
        <span class="step-pill pill-green mb-3">Registration Successful</span>
        <h2 class="card-title">Face Verified &amp; Registration Complete!</h2>
        <p class="card-sub mb-6">
          Your live face matched your enrolled 3-pose biometric profile
          <span v-if="confidenceScore">({{ confidenceScore }}% confidence)</span>.
        </p>

        <div class="next-step-banner banner-green">
          <div class="next-step-icon icon-green-box">
            <i class="mdi mdi-email-check-outline"></i>
          </div>
          <div class="text-left">
            <div class="next-step-title title-green">Registration Confirmation Email Sent</div>
            <div class="next-step-desc desc-green">
              We have dispatched your official registration confirmation and exam access credentials to <strong>{{ studentData?.email }}</strong>.
            </div>
          </div>
        </div>
      </div>

      <!-- Live Face Verification Stage -->
      <div v-else class="flow-card">
        <div class="card-head-row">
          <div>
            <span class="step-pill pill-blue">Step 2 of 2 &bull; Live Face Check</span>
            <h1 class="card-title mt-2">Verify Your Enrolled Face</h1>
            <p class="card-sub">
              Candidate: <strong>{{ studentData?.name }}</strong> ({{ studentData?.center_name }})
            </p>
          </div>
        </div>

        <p class="verify-lead">
          Look directly into the camera to test and confirm that your enrolled 3-pose face profile matches accurately.
        </p>

        <!-- Mismatch / Retry Alert -->
        <div v-if="verifyError" class="mismatch-box mb-4">
          <div class="mismatch-head">
            <i class="mdi mdi-alert-circle-outline"></i>
            <span>{{ verifyError }}</span>
          </div>
          <div class="mismatch-actions">
            <button type="button" class="btn-reenroll-link" :disabled="reEnrolling" @click="requestReEnroll">
              <i class="mdi mdi-camera-retake-outline"></i>
              <span>{{ reEnrolling ? 'Preparing Re-Enrollment...' : 'Re-Enroll 3 Face Photos Instead' }}</span>
            </button>
          </div>
        </div>

        <div v-if="cameraError" class="alert-error-box mb-4">
          <i class="mdi mdi-alert-circle-outline"></i>
          <span>{{ cameraError }}</span>
        </div>

        <div class="video-frame-wrap">
          <video ref="videoEl" autoplay playsinline muted class="live-video"></video>
          <div class="face-oval-guide" :class="{ 'guide-ready': isFaceReady }"></div>
          <div class="readiness-pill" :class="readinessTone">
            <i :class="['mdi', readinessIcon]"></i>
            <span>{{ readinessText }}</span>
          </div>
        </div>

        <div class="camera-actions-bar">
          <button
            v-if="!cameraActive"
            type="button"
            class="btn-red-solid w-full"
            :disabled="isCameraLoading"
            @click="startCamera"
          >
            <i class="mdi mdi-camera-outline"></i>
            <span>{{ isCameraLoading ? 'Starting Camera...' : 'Enable Camera' }}</span>
          </button>
          <button
            v-else
            type="button"
            class="btn-red-solid w-full"
            :disabled="!isFaceReady || verifying"
            @click="verifyLiveFace"
          >
            <i class="mdi mdi-face-recognition"></i>
            <span>{{ verifying ? 'Verifying Face Match...' : 'Verify My Face' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { useFaceDetection, extractFacialDescriptor } from '@/composables/useFaceDetection';

definePageMeta({ layout: 'public' });

const route = useRoute();
const router = useRouter();
const api = useApi();
const faceDetection = useFaceDetection();

const loadingToken = ref(true);
const tokenValid = ref(false);
const invalidReason = ref('');
const studentData = ref<any>(null);

const videoEl = ref<HTMLVideoElement | null>(null);
const cameraActive = ref(false);
const isCameraLoading = ref(false);
const cameraError = ref('');
let activeStream: MediaStream | null = null;

const verifying = ref(false);
const verifySuccess = ref(false);
const verifyError = ref('');
const confidenceScore = ref<number | null>(null);
const reEnrolling = ref(false);

const isFaceReady = ref(false);
const readinessText = ref('Position your face inside the guide...');
const readinessTone = ref('tone-warn');
const readinessIcon = ref('mdi-account-search-outline');
let readinessInterval: any = null;
let isProcessingFrame = false;

function startReadinessMonitoring() {
  stopReadinessMonitoring();
  readinessInterval = setInterval(async () => {
    if (isProcessingFrame || !videoEl.value || !cameraActive.value || verifySuccess.value) return;
    const video = videoEl.value;
    if (video.readyState < 2 || !video.videoWidth) return;

    isProcessingFrame = true;
    try {
      const faces = await faceDetection.estimateFaces(video, { flipHorizontal: false });
      if (faces && faces.length === 1) {
        isFaceReady.value = true;
        readinessText.value = 'Face detected — ready to verify';
        readinessTone.value = 'tone-ok';
        readinessIcon.value = 'mdi-check-circle-outline';
      } else if (faces && faces.length > 1) {
        isFaceReady.value = false;
        readinessText.value = 'Multiple faces detected — only you should be visible';
        readinessTone.value = 'tone-err';
        readinessIcon.value = 'mdi-account-multiple-remove-outline';
      } else {
        isFaceReady.value = false;
        readinessText.value = 'No face detected — look clearly at camera';
        readinessTone.value = 'tone-warn';
        readinessIcon.value = 'mdi-account-search-outline';
      }
    } catch (_) {
    } finally {
      isProcessingFrame = false;
    }
  }, 250);
}

function stopReadinessMonitoring() {
  if (readinessInterval) {
    clearInterval(readinessInterval);
    readinessInterval = null;
  }
}

function stopCamera() {
  stopReadinessMonitoring();
  isFaceReady.value = false;
  if (activeStream) {
    activeStream.getTracks().forEach(t => { try { t.stop(); } catch (_) {} });
    activeStream = null;
  }
  if (videoEl.value) videoEl.value.srcObject = null;
  cameraActive.value = false;
}

async function startCamera() {
  isCameraLoading.value = true;
  cameraError.value = '';
  try {
    activeStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    });
    cameraActive.value = true;
    await faceDetection.loadModel();
    await nextTick();
    setTimeout(() => {
      if (videoEl.value && activeStream) {
        videoEl.value.srcObject = activeStream;
        videoEl.value.play().catch(() => {});
        startReadinessMonitoring();
      }
    }, 150);
  } catch (err: any) {
    cameraError.value = 'Camera access was denied or unavailable. Please allow camera permission and retry.';
    cameraActive.value = false;
  } finally {
    isCameraLoading.value = false;
  }
}

async function verifyLiveFace() {
  if (!videoEl.value || verifying.value) return;
  verifying.value = true;
  verifyError.value = '';
  try {
    const faces = await faceDetection.estimateFaces(videoEl.value, { flipHorizontal: false });
    if (!faces || faces.length !== 1) {
      verifyError.value = 'Please ensure exactly one face is clearly visible in the camera.';
      return;
    }

    const descriptor = extractFacialDescriptor(faces[0]);
    if (!descriptor || descriptor.length === 0) {
      verifyError.value = 'Could not extract facial landmarks. Adjust lighting and try again.';
      return;
    }

    const token = route.query.token as string;
    const { data } = await api.post(`/public/student-face/verify/${encodeURIComponent(token)}`, {
      live_descriptor: descriptor
    });

    if (data?.matched) {
      confidenceScore.value = data.confidence || 95;
      verifySuccess.value = true;
      stopCamera();
    } else {
      verifyError.value = data?.message || 'Face verification failed. Please retry or re-enroll your 3 face photos.';
    }
  } catch (err: any) {
    verifyError.value = err.response?.data?.message || 'Face verification failed. Please retry in good lighting or re-enroll your 3 face photos.';
  } finally {
    verifying.value = false;
  }
}

async function requestReEnroll() {
  reEnrolling.value = true;
  try {
    const token = route.query.token as string;
    const { data } = await api.post(`/public/student-face/re-enroll/${encodeURIComponent(token)}`);
    if (data?.enroll_token) {
      stopCamera();
      await router.push(`/student-face/enroll?token=${encodeURIComponent(data.enroll_token)}`);
    }
  } catch (err: any) {
    verifyError.value = err.response?.data?.message || 'Could not start re-enrollment.';
  } finally {
    reEnrolling.value = false;
  }
}

async function validateToken() {
  const token = route.query.token as string;
  if (!token) {
    loadingToken.value = false;
    tokenValid.value = false;
    invalidReason.value = 'No verification token was provided in the link.';
    return;
  }
  try {
    const { data } = await api.get(`/public/student-face/verify/${encodeURIComponent(token)}`);
    if (data?.valid) {
      tokenValid.value = true;
      studentData.value = data.student;
      setTimeout(() => startCamera(), 200);
    } else {
      tokenValid.value = false;
      invalidReason.value = data?.message || 'Invalid verification link.';
    }
  } catch (err: any) {
    tokenValid.value = false;
    invalidReason.value = err.response?.data?.message || 'This verification link is invalid or has already been used.';
  } finally {
    loadingToken.value = false;
  }
}

onMounted(() => validateToken());
onBeforeUnmount(() => stopCamera());
</script>

<style scoped>
.face-flow-page {
  min-height: 100vh;
  background: #F8FAFC;
  padding: 36px 16px 60px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
.face-flow-container {
  max-width: 580px;
  margin: 0 auto;
}
.brand-header {
  text-align: center;
  margin-bottom: 20px;
}
.brand-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: #FEF2F2;
  color: #E31B23;
  border: 1px solid rgba(227, 27, 35, 0.2);
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
}
.flow-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 28px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
}
.card-head-row {
  margin-bottom: 12px;
}
.step-pill {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
}
.pill-blue {
  background: #EFF6FF;
  color: #1D4ED8;
  border: 1px solid rgba(37, 99, 235, 0.2);
}
.pill-green {
  background: #ECFDF5;
  color: #059669;
  border: 1px solid rgba(5, 150, 105, 0.2);
}
.card-title {
  font-size: 1.35rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0 0 4px 0;
}
.card-sub {
  font-size: 0.86rem;
  color: #64748B;
  margin: 0;
  line-height: 1.5;
}
.verify-lead {
  font-size: 0.84rem;
  color: #475569;
  line-height: 1.5;
  margin: 0 0 16px 0;
}
.video-frame-wrap {
  position: relative;
  background: #0F172A;
  border-radius: 14px;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  margin-bottom: 16px;
}
.live-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}
.face-oval-guide {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -52%);
  width: 190px;
  height: 240px;
  border: 2.5px dashed rgba(255, 255, 255, 0.65);
  border-radius: 50%;
  pointer-events: none;
  transition: border-color 0.2s ease;
}
.face-oval-guide.guide-ready {
  border-color: #10B981;
  border-style: solid;
}
.readiness-pill {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  backdrop-filter: blur(6px);
}
.tone-ok { background: rgba(16, 185, 129, 0.9); color: #FFFFFF; }
.tone-warn { background: rgba(15, 23, 42, 0.8); color: #F8FAFC; }
.tone-err { background: rgba(227, 27, 35, 0.92); color: #FFFFFF; }

.btn-red-solid {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #E31B23;
  color: #FFFFFF;
  font-weight: 600;
  font-size: 0.88rem;
  padding: 12px 20px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
}
.btn-red-solid:hover:not(:disabled) { background: #C8161D; }
.btn-red-solid:disabled { opacity: 0.55; cursor: not-allowed; }

.mismatch-box {
  background: #FEF2F2;
  border: 1px solid rgba(227, 27, 35, 0.25);
  border-radius: 12px;
  padding: 12px 14px;
}
.mismatch-head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #B91C1C;
}
.mismatch-actions {
  margin-top: 10px;
}
.btn-reenroll-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #FFFFFF;
  color: #E31B23;
  border: 1px solid rgba(227, 27, 35, 0.3);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}
.alert-error-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #FEF2F2;
  color: #B91C1C;
  border: 1px solid rgba(227, 27, 35, 0.25);
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 500;
}
.status-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}
.icon-red { background: #FEF2F2; color: #E31B23; }
.icon-green { background: #ECFDF5; color: #059669; }
.info-notice-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  font-size: 0.8rem;
  color: #475569;
  text-align: left;
}
.next-step-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
}
.banner-green {
  background: #ECFDF5;
  border: 1px solid rgba(5, 150, 105, 0.2);
}
.next-step-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.icon-green-box { background: #D1FAE5; color: #059669; }
.title-green { font-size: 0.86rem; font-weight: 600; color: #065F46; margin-bottom: 3px; }
.desc-green { font-size: 0.78rem; color: #047857; line-height: 1.45; }
.spinner-red {
  width: 38px;
  height: 38px;
  border: 3px solid rgba(227, 27, 35, 0.15);
  border-top-color: #E31B23;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.w-full { width: 100%; }
</style>
