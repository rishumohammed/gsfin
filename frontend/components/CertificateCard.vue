<template>
  <div class="certificate-card-wrapper position-relative" id="certificate-print-area">
    <CertificatePreview
      :candidate-name="cert.student_name || cert.candidate_name"
      :exam-title="cert.course_name || cert.exam_name || cert.qualification_title"
      :certificate-number="cert.cert_number || cert.certificate_number"
      :issue-date="cert.issued_at || cert.created_at"
      :center-name="cert.org_name || cert.center_name"
      :verify-url="verificationUrl"
    />
    
    <!-- Status Watermark if Revoked -->
    <div v-if="cert.status === 'revoked'" class="revoked-watermark">
      REVOKED
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CertificatePreview from '@/components/CertificatePreview.vue'

const props = defineProps({
  cert: {
    type: Object,
    required: true
  }
})

const verificationUrl = computed(() => {
  if (process.client) {
    const num = props.cert?.cert_number || props.cert?.certificate_number || props.cert?.id
    return `${window.location.origin}/verify?code=${num}`
  }
  return ''
})
</script>

<style scoped>
.certificate-card-wrapper {
  max-width: 1123px;
  margin: 0 auto;
}

.revoked-watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 110px;
  font-weight: 700;
  color: rgba(228, 32, 42, 0.25);
  border: 10px solid rgba(228, 32, 42, 0.25);
  padding: 16px 50px;
  pointer-events: none;
  z-index: 10;
  letter-spacing: 0.1em;
}

@media print {
  body * {
    visibility: hidden;
  }
  #certificate-print-area, #certificate-print-area * {
    visibility: visible;
  }
  #certificate-print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}
</style>
