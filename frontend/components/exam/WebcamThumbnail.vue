<template>
  <div 
    v-if="stream" 
    class="webcam-thumbnail" 
    :style="{ top: `${position.y}px`, left: `${position.x}px` }"
    @mousedown="startDrag"
  >
    <video ref="videoEl" autoplay playsinline muted></video>
    <div class="recording-indicator">
      <span class="red-dot"></span> REC
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  stream: MediaStream | null;
}>();

const emit = defineEmits(['video-ready']);

const videoEl = ref<HTMLVideoElement | null>(null);

// Make draggable
const position = ref({ x: typeof window !== 'undefined' ? window.innerWidth - 180 : 0, y: 20 });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

let hasEmittedReady = false;

watchEffect(() => {
  if (videoEl.value) {
    if (props.stream) {
      if (videoEl.value.srcObject !== props.stream) {
        videoEl.value.srcObject = props.stream;
        hasEmittedReady = false;
      }
      
      const triggerReady = () => {
        if (videoEl.value && !hasEmittedReady) {
          hasEmittedReady = true;
          videoEl.value.play().catch(() => {});
          emit('video-ready', videoEl.value);
        }
      };

      if (videoEl.value.readyState >= 1) {
        triggerReady();
      } else {
        videoEl.value.onloadedmetadata = triggerReady;
        videoEl.value.onloadeddata = triggerReady;
        videoEl.value.oncanplay = triggerReady;
      }
    } else {
      if (videoEl.value.srcObject) {
        try {
          const tracks = (videoEl.value.srcObject as MediaStream).getTracks();
          tracks.forEach(track => {
            try { track.stop(); } catch (_) {}
          });
        } catch (_) {}
        videoEl.value.srcObject = null;
      }
    }
  }
});

const startDrag = (e: MouseEvent) => {
  isDragging.value = true;
  dragOffset.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  };
  document.addEventListener('mousemove', doDrag);
  document.addEventListener('mouseup', stopDrag);
};

const doDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;
  
  let newX = e.clientX - dragOffset.value.x;
  let newY = e.clientY - dragOffset.value.y;
  
  // Bound to screen
  newX = Math.max(0, Math.min(newX, window.innerWidth - 160));
  newY = Math.max(0, Math.min(newY, window.innerHeight - 120));
  
  position.value = { x: newX, y: newY };
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', doDrag);
  document.removeEventListener('mouseup', stopDrag);
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    position.value = { x: window.innerWidth - 180, y: 20 };
    window.addEventListener('resize', () => {
      position.value.x = Math.min(position.value.x, window.innerWidth - 160);
      position.value.y = Math.min(position.value.y, window.innerHeight - 120);
    });
  }
});

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
  }
  if (videoEl.value && videoEl.value.srcObject) {
    try {
      const tracks = (videoEl.value.srcObject as MediaStream).getTracks();
      tracks.forEach(track => {
        try { track.stop(); } catch (_) {}
      });
    } catch (_) {}
    videoEl.value.srcObject = null;
  }
});
</script>

<style scoped>
.webcam-thumbnail {
  position: fixed;
  width: 160px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(255,255,255,0.1);
  background: #000;
  z-index: 9990; /* below overlay */
  cursor: grab;
}

.webcam-thumbnail:active {
  cursor: grabbing;
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1); /* mirror */
  pointer-events: none; /* so drag works on parent */
}

.recording-indicator {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;
  pointer-events: none;
}

.red-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
