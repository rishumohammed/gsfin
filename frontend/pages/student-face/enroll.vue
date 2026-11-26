<template>
  <div class="face-flow-page">
    <div class="face-flow-container">
      <!-- Brand Header -->
      <div class="brand-header">
        <div class="brand-pill">
          <i class="mdi mdi-shield-account-outline"></i>
          <span>GSFIN Biometric Enrollment</span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loadingToken" class="flow-card text-center py-12">
        <div class="spinner-red mx-auto mb-4"></div>
        <h2 class="card-title">Validating Enrollment Link...</h2>
        <p class="card-sub">Please wait while we verify your secure registration link.</p>
      </div>

      <!-- Invalid / Expired Token -->
      <div v-else-if="!tokenValid" class="flow-card text-center">
        <div class="status-icon-circle icon-red">
          <i class="mdi mdi-link-off"></i>
        </div>
        <h2 class="card-title">Link Invalid or Expired</h2>
        <p class="card-sub mb-6">{{ invalidReason || 'This face enrollment link has already been used or has expired.' }}</p>
        <div class="info-notice-box">
          <i class="mdi mdi-information-outline"></i>
          <span>Please contact your authorized GSFIN Test Center to request a fresh face enrollment email.</span>
        </div>
      </div>

      <!-- Success State -->
      <div v-else-if="enrollSuccess" class="flow-card text-center">
        <div class="status-icon-circle icon-green">
          <i class="mdi mdi-check-circle-outline"></i>
        </div>
        <span class="step-pill pill-green mb-3">Step 1 Complete</span>
        <h2 class="card-title">3 Face Photos Enrolled Successfully!</h2>
        <p class="card-sub mb-6">
          Your 3-pose biometric profile has been saved for <strong>{{ studentData?.name }}</strong>.
        </p>

        <div class="poses-preview-grid mb-6">
          <div v-for="(photo, idx) in capturedPhotos" :key="idx" class="pose-thumb-card">
            <img :src="photo.url" :alt="photo.label" class="pose-thumb-img" />
            <div class="pose-thumb-label">
              <i class="mdi mdi-check-circle text-emerald"></i>
              <span>{{ photo.label }}</span>
            </div>
          </div>
        </div>

        <div class="next-step-banner">
          <div class="next-step-icon">
            <i class="mdi mdi-email-fast-outline"></i>
          </div>
          <div class="text-left">
            <div class="next-step-title">Check Your Email for Step 2: Face Verification</div>
            <div class="next-step-desc">
              We have sent a verification link to <strong>{{ studentData?.email }}</strong>. Open that link to verify your live face and receive your final registration confirmation.
            </div>
          </div>
        </div>
      </div>

      <!-- Main 3-Pose Capture Card -->
      <div v-else class="flow-card">
        <div class="card-head-row">
          <div>
            <span class="step-pill pill-red">Step 1 of 2 &bull; 3-Pose Enrollment</span>
            <h1 class="card-title mt-2">Enroll Your Face Profile</h1>
            <p class="card-sub">
              Candidate: <strong>{{ studentData?.name }}</strong> ({{ studentData?.center_name }})
            </p>
          </div>
          <div class="pose-counter-badge">
            {{ capturedCount }} / 3 Captured
          </div>
        </div>

        <!-- 3-Pose Stepper -->
        <div class="poses-stepper">
          <div
            v-for="(pose, idx) in poseList"
            :key="pose.label"
            class="stepper-item"
            :class="{
              'is-done': !!capturedPhotos[idx]?.url,
              'is-active': currentPoseIndex === idx && !allPhotosCaptured
            }"
          >
            <div class="stepper-dot">
              <i v-if="capturedPhotos[idx]?.url" class="mdi mdi-check"></i>
              <span v-else>{{ idx + 1 }}</span>
            </div>
            <span class="stepper-label">{{ pose.label }}</span>
          </div>
        </div>

        <!-- Error Alert -->
        <div v-if="cameraError || submitError" class="alert-error-box mb-4">
          <i class="mdi mdi-alert-circle-outline"></i>
          <span>{{ cameraError || submitError }}</span>
        </div>

        <!-- Camera Capture View -->
        <div v-if="!allPhotosCaptured" class="camera-stage">
          <div class="pose-instruction-box">
            <i :class="['mdi', currentPoseInfo.icon]"></i>
            <div>
              <div class="pose-inst-title">{{ currentPoseInfo.title }}</div>
              <div class="pose-inst-sub">{{ currentPoseInfo.instruction }}</div>
            </div>
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
              :disabled="!isFaceReady || isCapturing"
              @click="captureCurrentPosePhoto"
            >
              <i class="mdi mdi-camera"></i>
              <span>{{ isCapturing ? 'Processing Face...' : currentPoseInfo.btnText }}</span>
            </button>
          </div>
        </div>

        <!-- Review & Submit 3 Captured Photos -->
        <div v-else class="review-stage">
          <div class="poses-preview-grid mb-5">
            <div v-for="(photo, idx) in capturedPhotos" :key="idx" class="pose-thumb-card">
              <img :src="photo.url" :alt="photo.label" class="pose-thumb-img" />
              <div class="pose-thumb-label">
                <i class="mdi mdi-check-circle text-emerald"></i>
                <span>{{ photo.label }}</span>
              </div>
              <button type="button" class="btn-retake-mini" @click="retakePose(idx)">
                <i class="mdi mdi-camera-retake-outline"></i> Retake
              </button>
            </div>
          </div>

          <div class="review-actions-row">
            <button type="button" class="btn-outline-slate" :disabled="submitting" @click="resetAllPhotos">
              <i class="mdi mdi-refresh"></i> Retake All 3
            </button>
            <button type="button" class="btn-red-solid flex-1" :disabled="submitting" @click="submitEnrollment">
              <i class="mdi mdi-shield-check-outline"></i>
              <span>{{ submitting ? 'Saving Face Profile...' : 'Submit 3 Face Photos' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { useFaceDetection, extractFacialDescriptor } from '@/composables/useFaceDetection';

definePageMeta({ layout: 'public' });

const route = useRoute();
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
const submitError = ref('');
let activeStream: MediaStream | null = null;

const isCapturing = ref(false);
const submitting = ref(false);
const enrollSuccess = ref(false);

const currentPoseIndex = ref(0);
const poseList = [
  {
    label: 'Front / Center',
    title: 'Pose 1 of 3: Look Directly at the Camera',
    instruction: 'Center your face inside the oval guide with even lighting.',
    icon: 'mdi-account-box-outline',
    btnText: 'Capture Photo 1 (Front Pose)'
  },
  {
    label: 'Slight Left',
    title: 'Pose 2 of 3: Turn Head Slightly Left',
    instruction: 'Turn your head slightly to the left while keeping both eyes visible.',
    icon: 'mdi-format-horizontal-align-left',
    btnText: 'Capture Photo 2 (Slight Left)'
  },
  {
    label: 'Slight Right',
    title: 'Pose 3 of 3: Turn Head Slightly Right',
    instruction: 'Turn your head slightly to the right while keeping both eyes visible.',
    icon: 'mdi-format-horizontal-align-right',
    btnText: 'Capture Photo 3 (Slight Right)'
  }
];

const currentPoseInfo = computed(() => poseList[currentPoseIndex.value] || poseList[0]);

const capturedPhotos = ref<Array<{ label: string; url: string; descriptor: number[] | null }>>([
  { label: 'Front / Center', url: '', descriptor: null },
  { label: 'Slight Left', url: '', descriptor: null },
  { label: 'Slight Right', url: '', descriptor: null }
]);

const capturedCount = computed(() => capturedPhotos.value.filter(p => !!p.url && !!p.descriptor).length);
const allPhotosCaptured = computed(() => capturedCount.value === 3);

const averagedDescriptor = computed(() => {
  const list = capturedPhotos.value.map(p => p.descriptor).filter(Boolean) as number[][];
  if (list.length === 0) return null;
  const len = list[0].length;
  const avg: number[] = new Array(len).fill(0);
  for (const d of list) {
    for (let i = 0; i < len; i++) {
      avg[i] += d[i] / list.length;
    }
  }
  return avg;
});

const isFaceReady = ref(false);
const readinessText = ref('Position your face inside the guide...');
const readinessTone = ref('tone-warn');
const readinessIcon = ref('mdi-account-search-outline');
let readinessInterval: any = null;
let isProcessingFrame = false;

function startReadinessMonitoring() {
  stopReadinessMonitoring();
  readinessInterval = setInterval(async () => {
    if (isProcessingFrame || !videoEl.value || !cameraActive.value || allPhotosCaptured.value) return;
    const video = videoEl.value;
    if (video.readyState < 2 || !video.videoWidth) return;

    isProcessingFrame = true;
    try {
      const faces = await faceDetection.estimateFaces(video, { flipHorizontal: false });
      if (faces && faces.length === 1) {
        isFaceReady.value = true;
        readinessText.value = 'Face detected — ready to capture';
        readinessTone.value = 'tone-ok';
        readinessIcon.value = 'mdi-check-circle-outline';
      } else if (faces && faces.length > 1) {
        isFaceReady.value = false;
        readinessText.value = 'Multiple faces detected — ensure only you are in frame';
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

async function captureCurrentPosePhoto() {
  if (!videoEl.value || isCapturing.value) return;
  submitError.value = '';
  try {
    isCapturing.value = true;
    const faces = await faceDetection.estimateFaces(videoEl.value, { flipHorizontal: false });
    if (!faces || faces.length !== 1) {
      submitError.value = faces && faces.length > 1
        ? 'Multiple faces detected. Please ensure only your face is visible.'
        : 'Could not detect your face clearly. Adjust lighting and try again.';
      return;
    }

    const descriptor = extractFacialDescriptor(faces[0]);
    if (!descriptor || descriptor.length === 0) {
      submitError.value = 'Facial landmarks could not be extracted. Please move closer and try again.';
      return;
    }

    const video = videoEl.value;
    const scale = Math.min(1, 400 / (video.videoWidth || 640));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round((video.videoWidth || 640) * scale);
    canvas.height = Math.round((video.videoHeight || 480) * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    const idx = currentPoseIndex.value;
    capturedPhotos.value[idx] = {
      label: poseList[idx].label,
      url: dataUrl,
      descriptor
    };

    const nextEmpty = capturedPhotos.value.findIndex(p => !p.url);
    if (nextEmpty !== -1) {
      currentPoseIndex.value = nextEmpty;
    } else {
      stopCamera();
    }
  } finally {
    isCapturing.value = false;
  }
}

function retakePose(idx: number) {
  capturedPhotos.value[idx] = { label: poseList[idx].label, url: '', descriptor: null };
  currentPoseIndex.value = idx;
  if (!cameraActive.value) startCamera();
}

function resetAllPhotos() {
  capturedPhotos.value = [
    { label: 'Front / Center', url: '', descriptor: null },
    { label: 'Slight Left', url: '', descriptor: null },
    { label: 'Slight Right', url: '', descriptor: null }
  ];
  currentPoseIndex.value = 0;
  startCamera();
}

async function submitEnrollment() {
  if (!allPhotosCaptured.value || !averagedDescriptor.value) return;
  submitting.value = true;
  submitError.value = '';
  try {
    const token = route.query.token as string;
    await api.post(`/public/student-face/enroll/${encodeURIComponent(token)}`, {
      face_photo: capturedPhotos.value[0].url,
      face_photos: capturedPhotos.value.map(p => ({ label: p.label, url: p.url })),
      face_descriptor: averagedDescriptor.value
    });
    enrollSuccess.value = true;
    stopCamera();
  } catch (err: any) {
    submitError.value = err.response?.data?.message || 'Failed to submit face enrollment. Please try again.';
  } finally {
    submitting.value = false;
  }
}

async function validateToken() {
  const token = route.query.token as string;
  if (!token) {
    loadingToken.value = false;
    tokenValid.value = false;
    invalidReason.value = 'No enrollment token was provided in the link.';
    return;
  }
  try {
    const { data } = await api.get(`/public/student-face/enroll/${encodeURIComponent(token)}`);
    if (data?.valid) {
      tokenValid.value = true;
      studentData.value = data.student;
      setTimeout(() => startCamera(), 200);
    } else {
      tokenValid.value = false;
      invalidReason.value = data?.message || 'Invalid enrollment link.';
    }
  } catch (err: any) {
    tokenValid.value = false;
    invalidReason.value = err.response?.data?.message || 'This enrollment link is invalid or has expired.';
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
  max-width: 620px;
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}
.step-pill {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
}
.pill-red {
  background: #FEF2F2;
  color: #E31B23;
  border: 1px solid rgba(227, 27, 35, 0.2);
}
.pill-green {
  background: #ECFDF5;
  color: #059669;
  border: 1px solid rgba(5, 150, 105, 0.2);
}
.pose-counter-badge {
  background: #F1F5F9;
  color: #0F172A;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 10px;
  white-space: nowrap;
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
.poses-stepper {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 18px;
}
.stepper-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border-radius: 10px;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: #64748B;
  font-size: 0.76rem;
  font-weight: 500;
}
.stepper-item.is-active {
  background: #FEF2F2;
  border-color: rgba(227, 27, 35, 0.35);
  color: #E31B23;
  font-weight: 600;
}
.stepper-item.is-done {
  background: #ECFDF5;
  border-color: rgba(5, 150, 105, 0.3);
  color: #059669;
  font-weight: 600;
}
.stepper-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #E2E8F0;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 600;
  flex-shrink: 0;
}
.is-active .stepper-dot {
  background: #E31B23;
  color: #FFFFFF;
}
.is-done .stepper-dot {
  background: #059669;
  color: #FFFFFF;
}
.pose-instruction-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  margin-bottom: 14px;
}
.pose-instruction-box i {
  font-size: 1.5rem;
  color: #E31B23;
}
.pose-inst-title {
  font-size: 0.86rem;
  font-weight: 600;
  color: #0F172A;
}
.pose-inst-sub {
  font-size: 0.76rem;
  color: #64748B;
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
  transition: background 0.15s ease;
}
.btn-red-solid:hover:not(:disabled) { background: #C8161D; }
.btn-red-solid:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-outline-slate {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #FFFFFF;
  color: #475569;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  cursor: pointer;
}
.poses-preview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.pose-thumb-card {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  padding: 8px;
  text-align: center;
}
.pose-thumb-img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 6px;
  transform: scaleX(-1);
}
.pose-thumb-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #0F172A;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.text-emerald { color: #059669; }
.btn-retake-mini {
  margin-top: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #E31B23;
  background: #FEF2F2;
  border: 1px solid rgba(227, 27, 35, 0.2);
  border-radius: 6px;
  padding: 3px 8px;
  cursor: pointer;
}
.review-actions-row {
  display: flex;
  gap: 12px;
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
  background: #EFF6FF;
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 12px;
}
.next-step-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #DBEAFE;
  color: #1D4ED8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.next-step-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1E3A8A;
  margin-bottom: 3px;
}
.next-step-desc {
  font-size: 0.78rem;
  color: #1E40AF;
  line-height: 1.45;
}
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
.flex-1 { flex: 1; }
</style>
