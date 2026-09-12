import { ref, shallowRef } from 'vue';
import { useApi } from '@/composables/useApi';

export const useWebcamRecorder = () => {
  const api = useApi();
  const stream = shallowRef<MediaStream | null>(null);
  const mediaRecorder = shallowRef<MediaRecorder | null>(null);
  const isRecording = ref(false);
  const cameraError = ref('');
  
  let attemptIdRef = '';
  let authHeadersRef: any = null;

  // Screenshot cooldown and cap tracking
  const lastScreenshotTimeMap = new Map<string, number>();
  const totalScreenshotsCaptured = ref(0);
  const MAX_SCREENSHOTS_PER_ATTEMPT = 15;
  const SCREENSHOT_COOLDOWN_MS = 10000;

  const requestCamera = async (): Promise<boolean> => {
    try {
      cameraError.value = '';
      stream.value = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, frameRate: 15 },
        audio: false
      });
      return true;
    } catch (err: any) {
      console.error('Camera access denied or failed', err);
      cameraError.value = 'Camera access is required for proctored exams. Please allow permissions and try again.';
      return false;
    }
  };

  // Continuous full video stream recording disabled to optimize server bandwidth & storage
  const startRecording = (attemptId: string, recordFullVideo: boolean = false, customHeaders?: any) => {
    attemptIdRef = attemptId;
    authHeadersRef = customHeaders;
    totalScreenshotsCaptured.value = 0;
    lastScreenshotTimeMap.clear();

    // Continuous video chunk streaming explicitly turned off to save bandwidth & disk storage
    isRecording.value = false;
  };

  const captureScreenshot = async (attemptId: string, eventType: string = 'general', customHeaders?: any): Promise<string | null> => {
    if (!stream.value) return null;
    
    // Check maximum cap limit (max 15 screenshots per attempt)
    if (totalScreenshotsCaptured.value >= MAX_SCREENSHOTS_PER_ATTEMPT) {
      console.warn('Maximum screenshot cap reached for this attempt');
      return null;
    }

    // Check 10s cooldown per event type
    const now = Date.now();
    const lastTime = lastScreenshotTimeMap.get(eventType) || 0;
    if (now - lastTime < SCREENSHOT_COOLDOWN_MS) {
      return null;
    }

    const videoEl = document.querySelector('video');
    if (!videoEl) return null;

    try {
      lastScreenshotTimeMap.set(eventType, now);
      totalScreenshotsCaptured.value++;

      // Downscale max width to 480px while maintaining aspect ratio
      const rawWidth = videoEl.videoWidth || 640;
      const rawHeight = videoEl.videoHeight || 480;
      const targetWidth = Math.min(480, rawWidth);
      const targetHeight = Math.round((targetWidth / rawWidth) * rawHeight);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(videoEl, 0, 0, targetWidth, targetHeight);

      return new Promise((resolve) => {
        // Compress JPEG to 0.60 quality (~20-30KB lightweight file size)
        canvas.toBlob(async (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const formData = new FormData();
          formData.append('attempt_id', attemptId);
          formData.append('image', blob, `violation-${Date.now()}.jpg`);

          try {
            const requestHeaders = customHeaders ? { 'Content-Type': 'multipart/form-data', ...customHeaders } : { 'Content-Type': 'multipart/form-data' };
            const res = await api.post('/proctoring/violation-screenshot', formData, {
              headers: requestHeaders
            });
            resolve(res.data?.url || null);
          } catch (err) {
            console.error('Failed to upload screenshot', err);
            resolve(null);
          }
        }, 'image/jpeg', 0.60);
      });
    } catch (e) {
      console.error('Error in captureScreenshot', e);
      return null;
    }
  };

  const uploadReferenceSelfie = async (attemptId: string, baselineVector: number[] | null, customHeaders?: any): Promise<string | null> => {
    if (!stream.value) return null;
    const videoEl = document.querySelector('video');
    if (!videoEl) return null;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(videoEl, 0, 0, 480, 360);

      return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) return resolve(null);
          const formData = new FormData();
          formData.append('attempt_id', attemptId);
          formData.append('image', blob, 'reference-selfie.jpg');
          if (baselineVector) {
            formData.append('baseline_vector', JSON.stringify(baselineVector));
          }

          try {
            const requestHeaders = customHeaders ? { 'Content-Type': 'multipart/form-data', ...customHeaders } : { 'Content-Type': 'multipart/form-data' };
            const res = await api.post('/proctoring/reference-selfie', formData, {
              headers: requestHeaders
            });
            resolve(res.data?.selfieUrl || null);
          } catch (err) {
            console.error('Failed to upload reference selfie', err);
            resolve(null);
          }
        }, 'image/jpeg', 0.85);
      });
    } catch (e) {
      console.error('Error in uploadReferenceSelfie', e);
      return null;
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
      mediaRecorder.value.stop();
    }
    isRecording.value = false;
  };

  const releaseCamera = () => {
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop());
      stream.value = null;
    }
  };

  return {
    stream,
    cameraError,
    isRecording,
    totalScreenshotsCaptured,
    requestCamera,
    startRecording,
    captureScreenshot,
    uploadReferenceSelfie,
    stopRecording,
    releaseCamera
  };
};
