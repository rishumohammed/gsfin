import { ref, shallowRef } from 'vue';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export const useObjectDetection = () => {
  const model = shallowRef<cocoSsd.ObjectDetection | null>(null);
  const isModelLoading = ref(false);
  const objectDetectionError = ref('');
  const lastWarningTime = ref(0);
  
  let detectionInterval: NodeJS.Timeout | null = null;
  let cellPhoneCounter = 0;

  const loadModel = async () => {
    try {
      isModelLoading.value = true;
      objectDetectionError.value = '';
      model.value = await cocoSsd.load();
    } catch (err: any) {
      console.error('Object detection model failed to load', err);
      objectDetectionError.value = 'Failed to load object detection model.';
    } finally {
      isModelLoading.value = false;
    }
  };

  const startDetection = (videoElement: HTMLVideoElement, logEventCallback: (type: string, meta?: any) => void, warningCallback: (msg: string) => void) => {
    if (!model.value) return;

    // Run every 800ms
    detectionInterval = setInterval(async () => {
      if (videoElement.readyState === 4 && model.value) {
        try {
          const predictions = await model.value.detect(videoElement);
          
          const phonePrediction = predictions.find(p => p.class === 'cell phone' && p.score > 0.5);
          
          if (phonePrediction) {
            cellPhoneCounter++;
            if (cellPhoneCounter >= 1) {
              logEventCallback('mobile_phone_detected', { object: 'cell phone', score: phonePrediction.score.toFixed(2) });
              
              if (Date.now() - lastWarningTime.value > 5000) {
                warningCallback('Mobile phone detected! Please put away all secondary devices.');
                lastWarningTime.value = Date.now();
              }
              cellPhoneCounter = 0;
            }
          } else {
            cellPhoneCounter = 0;
          }
        } catch (e) {
          console.warn('Object estimation error', e);
        }
      }
    }, 800);
  };

  const stopDetection = () => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
      detectionInterval = null;
    }
  };

  return {
    loadModel,
    startDetection,
    stopDetection,
    isModelLoading,
    objectDetectionError
  };
};
