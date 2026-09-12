import { ref } from 'vue';
import { useApi } from '@/composables/useApi';

export const useProctoring = () => {
  const api = useApi();
  const attemptId = ref<string | null>(null);
  
  const isFullscreen = ref(false);
  const isDevToolsOpen = ref(false);
  
  // Violations & Warning counter
  const violationCount = ref(0);
  const maxProctoringWarnings = ref(3);
  const violationWarning = ref<{ show: boolean, message: string }>({ show: false, message: '' });
  
  const proctoringConfig = ref<any>({});
  let captureScreenshotCallback: ((type: string) => Promise<string | null>) | null = null;
  let submitCallback: ((reason: string) => void) | null = null;
  let devToolsInterval: NodeJS.Timeout;
  let authHeaders: any = {};

  const initProctoring = (
    id: string,
    onSubmit: (reason: string) => void,
    config: any = {},
    captureScreenshotFn?: (type: string) => Promise<string | null>,
    customHeaders?: any
  ) => {
    attemptId.value = id;
    submitCallback = onSubmit;
    proctoringConfig.value = config;
    maxProctoringWarnings.value = config.max_proctoring_warnings || config.max_warnings || 3;

    if (captureScreenshotFn) {
      captureScreenshotCallback = captureScreenshotFn;
    }
    if (customHeaders) {
      authHeaders = customHeaders;
    }

    // Listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', preventDefaultAction);
    document.addEventListener('copy', preventDefaultAction);
    document.addEventListener('cut', preventDefaultAction);
    document.addEventListener('paste', preventDefaultAction);
    document.addEventListener('keydown', handleKeydown);

    // DevTools detection loop every 1000ms
    devToolsInterval = setInterval(detectDevTools, 1000);
    
    // Initial Fullscreen check
    checkFullscreen();
  };

  const cleanupProctoring = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleWindowBlur);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('contextmenu', preventDefaultAction);
    document.removeEventListener('copy', preventDefaultAction);
    document.removeEventListener('cut', preventDefaultAction);
    document.removeEventListener('paste', preventDefaultAction);
    document.removeEventListener('keydown', handleKeydown);
    
    clearInterval(devToolsInterval);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(e => console.warn('Could not exit fullscreen', e));
    }
  };

  const logEvent = async (type: string, metadata: any = {}) => {
    if (!attemptId.value) return;
    try {
      // Auto-capture screenshot on violation
      if (captureScreenshotCallback) {
        const screenshotUrl = await captureScreenshotCallback(type);
        if (screenshotUrl) {
          metadata.screenshot = screenshotUrl;
        }
      }

      await api.post('/proctoring/events', {
        attempt_id: attemptId.value,
        type,
        timestamp: new Date().toISOString(),
        ...metadata
      }, { headers: authHeaders });
    } catch (e) {
      console.error('Failed to log proctoring event', e);
    }
  };

  const speakWarning = (text: string) => {
    if (proctoringConfig.value?.enable_voice_alert !== false && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const enVoice = voices.find(v => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
      }
      
      utterance.volume = 1;
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      handleViolation('tab_switch', 'You switched browser tabs. Please stay on the exam tab.');
    }
  };

  const handleWindowBlur = () => {
    if (document.visibilityState !== 'hidden') {
      handleViolation('window_blur', 'Window focus lost. Please click back inside the exam window.');
    }
  };

  const handleViolation = (type: string, customMsg?: string) => {
    violationCount.value++;
    logEvent(type, { count: violationCount.value });

    if (violationCount.value >= maxProctoringWarnings.value) {
      const msg = 'Security violation threshold reached. Your exam is being automatically submitted.';
      violationWarning.value = { show: true, message: msg };
      speakWarning(msg);
      if (submitCallback) submitCallback('tab_switch_limit_exceeded');
    } else {
      const msg = customMsg || `Warning ${violationCount.value} of ${maxProctoringWarnings.value}: Please adhere strictly to proctoring guidelines.`;
      violationWarning.value = { show: true, message: msg };
      speakWarning(msg);
    }
  };

  const handleFullscreenChange = () => {
    checkFullscreen();
    if (!isFullscreen.value && proctoringConfig.value?.enforce_fullscreen !== false) {
      logEvent('fullscreen_exit');
      const msg = 'Fullscreen mode exited. You must return to full screen to continue your exam.';
      violationWarning.value = { show: true, message: msg };
      speakWarning(msg);
    }
  };

  const checkFullscreen = () => {
    isFullscreen.value = !!document.fullscreenElement;
  };

  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      violationWarning.value.show = false;
    } catch (e) {
      console.error('Failed to enter fullscreen', e);
    }
  };

  const preventDefaultAction = (e: Event) => {
    e.preventDefault();
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
      (e.ctrlKey && (e.key === 'U' || e.key === 'u')) ||
      (e.ctrlKey && (e.key === 'S' || e.key === 's')) ||
      (e.ctrlKey && (e.key === 'A' || e.key === 'a'))
    ) {
      e.preventDefault();
      logEvent('forbidden_shortcut', { key: e.key });
      speakWarning('Shortcut blocked by proctoring lock.');
    }
  };

  const detectDevTools = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    
    if ((widthThreshold || heightThreshold) && !isDevToolsOpen.value) {
      isDevToolsOpen.value = true;
      logEvent('devtools_open');
      handleViolation('devtools_open', 'Developer tools detected. Please close console immediately.');
    } else if (!widthThreshold && !heightThreshold && isDevToolsOpen.value) {
      isDevToolsOpen.value = false;
    }
  };

  const dismissWarning = () => {
    violationWarning.value.show = false;
    if (!isFullscreen.value && proctoringConfig.value?.enforce_fullscreen !== false) {
      requestFullscreen().catch(e => console.warn('Could not re-enter fullscreen:', e));
    }
  };

  return {
    initProctoring,
    cleanupProctoring,
    requestFullscreen,
    logEvent,
    handleViolation,
    dismissWarning,
    speakWarning,
    isFullscreen,
    violationWarning,
    violationCount,
    maxProctoringWarnings
  };
};
