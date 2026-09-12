import { ref, shallowRef } from 'vue';
import * as faceDetection from '@tensorflow-models/face-detection';
import '@tensorflow/tfjs';

export const useFaceDetection = () => {
  const model = shallowRef<faceDetection.FaceDetector | null>(null);
  const isModelLoading = ref(false);
  const faceDetectionError = ref('');
  const lastFaceWarningTime = ref(0);
  const baselineVector = ref<number[] | null>(null);

  let detectionInterval: NodeJS.Timeout | null = null;
  let consecutiveNoFaceSeconds = 0;
  let consecutiveMultipleFaceSeconds = 0;
  let consecutiveProxyMismatchCount = 0;
  let consecutiveGazeDeviationCount = 0;

  const loadModel = async () => {
    try {
      isModelLoading.value = true;
      faceDetectionError.value = '';
      
      const detectorConfig: faceDetection.MediaPipeFaceDetectorTfjsModelConfig = {
        runtime: 'tfjs',
        maxFaces: 5,
      };
      
      model.value = await faceDetection.createDetector(
        faceDetection.SupportedModels.MediaPipeFaceDetector,
        detectorConfig
      );
    } catch (err: any) {
      console.error('Face detection model failed to load', err);
      faceDetectionError.value = 'Failed to load face detection model.';
    } finally {
      isModelLoading.value = false;
    }
  };

  // Helper to extract keypoints from face detection landmarks
  const extractKeypoints = (face: faceDetection.Face) => {
    if (!face.keypoints || face.keypoints.length < 4) return null;
    
    // MediaPipe face detector keypoints: 0: rightEye, 1: leftEye, 2: noseTip, 3: mouthCenter, 4: rightEar, 5: leftEar
    const keypointMap: Record<string, { x: number, y: number }> = {};
    face.keypoints.forEach(kp => {
      if (kp.name) keypointMap[kp.name] = { x: kp.x, y: kp.y };
    });

    const leftEye = keypointMap['leftEye'] || face.keypoints[1] || face.keypoints[0];
    const rightEye = keypointMap['rightEye'] || face.keypoints[0] || face.keypoints[1];
    const nose = keypointMap['noseTip'] || face.keypoints[2];
    const mouth = keypointMap['mouthCenter'] || face.keypoints[3];

    if (!leftEye || !rightEye || !nose || !mouth) return null;
    return { leftEye, rightEye, nose, mouth };
  };

  // Calculate 5D spatial keypoint ratio vector
  const calculate5DVector = (kp: { leftEye: { x: number, y: number }, rightEye: { x: number, y: number }, nose: { x: number, y: number }, mouth: { x: number, y: number } }) => {
    const interEyeDist = Math.hypot(kp.leftEye.x - kp.rightEye.x, kp.leftEye.y - kp.rightEye.y) || 1;
    
    const leftEyeToNose = Math.hypot(kp.leftEye.x - kp.nose.x, kp.leftEye.y - kp.nose.y) / interEyeDist;
    const rightEyeToNose = Math.hypot(kp.rightEye.x - kp.nose.x, kp.rightEye.y - kp.nose.y) / interEyeDist;
    const noseToMouth = Math.hypot(kp.nose.x - kp.mouth.x, kp.nose.y - kp.mouth.y) / interEyeDist;
    const leftEyeToMouth = Math.hypot(kp.leftEye.x - kp.mouth.x, kp.leftEye.y - kp.mouth.y) / interEyeDist;
    const rightEyeToMouth = Math.hypot(kp.rightEye.x - kp.mouth.x, kp.rightEye.y - kp.mouth.y) / interEyeDist;

    return [leftEyeToNose, rightEyeToNose, noseToMouth, leftEyeToMouth, rightEyeToMouth];
  };

  // Calculate Euclidean distance between two 5D vectors
  const calculateEuclideanDistance = (v1: number[], v2: number[]) => {
    let sumSq = 0;
    for (let i = 0; i < 5; i++) {
      sumSq += Math.pow((v1[i] || 0) - (v2[i] || 0), 2);
    }
    return Math.sqrt(sumSq);
  };

  // Register 3 selfie frames to calculate baseline 5D vector
  const registerSelfieBaseline = async (videoElement: HTMLVideoElement): Promise<number[] | null> => {
    if (!model.value || videoElement.readyState !== 4) return null;
    
    const vectors: number[][] = [];
    for (let i = 0; i < 3; i++) {
      try {
        const faces = await model.value.estimateFaces(videoElement, { flipHorizontal: false });
        if (faces.length === 1) {
          const kp = extractKeypoints(faces[0]);
          if (kp) {
            vectors.push(calculate5DVector(kp));
          }
        }
      } catch (e) {
        console.warn('Selfie sample capture error:', e);
      }
      await new Promise(res => setTimeout(res, 300));
    }

    if (vectors.length === 0) return null;

    // Average the vectors
    const avgVector = [0, 0, 0, 0, 0];
    for (const vec of vectors) {
      for (let j = 0; j < 5; j++) {
        avgVector[j] += vec[j] / vectors.length;
      }
    }

    baselineVector.value = avgVector;
    return avgVector;
  };

  const setSelfieBaseline = (vector: number[]) => {
    baselineVector.value = vector;
  };

  const startDetection = (
    videoElement: HTMLVideoElement,
    logEventCallback: (type: string, meta?: any) => void,
    warningCallback: (msg: string) => void,
    config: any = {}
  ) => {
    if (!model.value) return;

    const threshold = config.face_missing_threshold || 3;
    const enableFaceDetection = config.face_detection !== false;
    const enableMultipleFacesAlert = config.multiple_faces_alert !== false;
    const enableFaceMissingAlert = config.face_missing_alert !== false;

    if (!enableFaceDetection) return;

    consecutiveNoFaceSeconds = 0;
    consecutiveMultipleFaceSeconds = 0;
    consecutiveProxyMismatchCount = 0;
    consecutiveGazeDeviationCount = 0;

    // Detection loop runs every 1000ms
    detectionInterval = setInterval(async () => {
      if (videoElement.readyState === 4 && model.value) {
        try {
          const faces = await model.value.estimateFaces(videoElement, { flipHorizontal: false });
          
          if (faces.length === 0) {
            consecutiveNoFaceSeconds++;
            consecutiveMultipleFaceSeconds = 0;
            consecutiveProxyMismatchCount = 0;
            consecutiveGazeDeviationCount = 0;

            if (consecutiveNoFaceSeconds >= threshold) {
              logEventCallback('face_absent');
              
              if (enableFaceMissingAlert && Date.now() - lastFaceWarningTime.value > 3000) {
                warningCallback('Please ensure your face is visible to the camera.');
                lastFaceWarningTime.value = Date.now();
              }
              consecutiveNoFaceSeconds = 0;
            }
          } else if (faces.length > 1) {
            consecutiveMultipleFaceSeconds++;
            consecutiveNoFaceSeconds = 0;
            consecutiveProxyMismatchCount = 0;
            consecutiveGazeDeviationCount = 0;

            // Throttle log multiple faces every 3 seconds
            logEventCallback('multiple_faces', { count: faces.length });
            if (enableMultipleFacesAlert && Date.now() - lastFaceWarningTime.value > 3000) {
              warningCallback('Multiple faces detected. Ensure you are alone.');
              lastFaceWarningTime.value = Date.now();
            }
          } else {
            // Exactly 1 face
            consecutiveNoFaceSeconds = 0;
            consecutiveMultipleFaceSeconds = 0;
            const singleFace = faces[0];
            const kp = extractKeypoints(singleFace);

            if (kp) {
              // 1. Biometric Proxy Matching
              if (baselineVector.value) {
                const liveVector = calculate5DVector(kp);
                const distance = calculateEuclideanDistance(liveVector, baselineVector.value);
                
                if (distance > 0.22) {
                  consecutiveProxyMismatchCount++;
                  if (consecutiveProxyMismatchCount >= 3) {
                    logEventCallback('proxy_mismatch', { distance: distance.toFixed(4) });
                    warningCallback('Facial mismatch detected. Please ensure registered candidate is taking the exam.');
                    consecutiveProxyMismatchCount = 0;
                  }
                } else {
                  consecutiveProxyMismatchCount = 0;
                }
              }

              // 2. 3D Head Pose & Gaze Deviation Tracking
              const leftEyeNoseDist = Math.hypot(kp.leftEye.x - kp.nose.x, kp.leftEye.y - kp.nose.y) || 1;
              const rightEyeNoseDist = Math.hypot(kp.rightEye.x - kp.nose.x, kp.rightEye.y - kp.nose.y) || 1;
              const yawRatio = leftEyeNoseDist / rightEyeNoseDist;

              const eyeToNoseY = Math.abs((kp.leftEye.y + kp.rightEye.y) / 2 - kp.nose.y);
              const noseToMouthY = Math.abs(kp.nose.y - kp.mouth.y) || 1;
              const pitchRatio = eyeToNoseY / noseToMouthY;

              const isYawFlagged = yawRatio < 0.45 || yawRatio > 2.2;
              const isPitchFlagged = pitchRatio > 1.65 || noseToMouthY < 9 || pitchRatio < 0.38;

              if (isYawFlagged || isPitchFlagged) {
                consecutiveGazeDeviationCount++;
                if (consecutiveGazeDeviationCount >= 2) {
                  logEventCallback('gaze_deviation', { yawRatio: yawRatio.toFixed(2), pitchRatio: pitchRatio.toFixed(2) });
                  if (Date.now() - lastFaceWarningTime.value > 5000) {
                    warningCallback('Please look directly at your exam screen.');
                    lastFaceWarningTime.value = Date.now();
                  }
                  consecutiveGazeDeviationCount = 0;
                }
              } else {
                consecutiveGazeDeviationCount = 0;
              }
            }
          }
        } catch (e) {
          console.warn('Face estimation error', e);
        }
      }
    }, 1000);
  };

  const stopDetection = () => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
      detectionInterval = null;
    }
  };

  return {
    loadModel,
    registerSelfieBaseline,
    setSelfieBaseline,
    startDetection,
    stopDetection,
    isModelLoading,
    faceDetectionError,
    baselineVector
  };
};
