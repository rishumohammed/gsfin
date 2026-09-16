<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="modal-overlay" @click.self="visible = false">
        <div class="modal-card">
          
          <!-- Header (Fixed Top) -->
          <div class="modal-header">
            <div class="header-title-flex">
              <div class="header-icon-box">
                <i class="mdi mdi-headset"></i>
              </div>
              <div>
                <h3 class="modal-title">Help &amp; Support</h3>
                <p class="modal-subtitle">24/7 Global Student &amp; Center Assistance</p>
              </div>
            </div>
            <button class="modal-close-btn" @click="visible = false" aria-label="Close dialog">
              <i class="mdi mdi-close"></i>
            </button>
          </div>

          <!-- Body (Scrollable Center) -->
          <div class="modal-body space-y-4">
            <p class="intro-desc">
              Need assistance with your qualification exams, certificate verification, or platform access? Select a channel below:
            </p>

            <!-- Support Channels -->
            <div class="channels-stack">
              <NuxtLink to="/dashboard/admin/faqs" @click="visible = false" class="channel-card">
                <div class="channel-icon bg-blue-light text-blue">
                  <i class="mdi mdi-book-open-variant-outline"></i>
                </div>
                <div class="channel-info">
                  <span class="channel-name">Knowledge Base &amp; FAQs</span>
                  <span class="channel-sub">Guides, examination rules &amp; regulations</span>
                </div>
                <i class="mdi mdi-chevron-right channel-arrow"></i>
              </NuxtLink>

              <a href="https://wa.me/447911123456" target="_blank" @click="visible = false" class="channel-card">
                <div class="channel-icon bg-emerald-light text-emerald">
                  <i class="mdi mdi-whatsapp"></i>
                </div>
                <div class="channel-info">
                  <span class="channel-name">Live Chat (WhatsApp)</span>
                  <span class="channel-sub">Instant response from support team</span>
                </div>
                <i class="mdi mdi-chevron-right channel-arrow"></i>
              </a>

              <a href="mailto:support@gsfin.org" @click="visible = false" class="channel-card">
                <div class="channel-icon bg-red-light text-red">
                  <i class="mdi mdi-email-fast-outline"></i>
                </div>
                <div class="channel-info">
                  <span class="channel-name">Email Support</span>
                  <span class="channel-sub">Official response within 24 hours</span>
                </div>
                <i class="mdi mdi-chevron-right channel-arrow"></i>
              </a>
            </div>

            <!-- Popular Topics -->
            <div>
              <span class="section-label">Popular Topics</span>
              <div class="topics-flex">
                <button
                  v-for="link in links"
                  :key="link"
                  class="topic-chip"
                  @click="handleTopicClick(link)"
                >
                  {{ link }}
                </button>
              </div>
            </div>

            <!-- Pro Tip Banner -->
            <div class="protip-banner">
              <div class="protip-icon">
                <i class="mdi mdi-lightbulb-on-outline"></i>
              </div>
              <div class="protip-content">
                <span class="protip-title">Verification Pro Tip</span>
                <p class="protip-msg">
                  You can verify any student certificate or partner center 24/7 on the public 
                  <NuxtLink to="/verify" target="_blank" class="protip-link">Verification Portal</NuxtLink>.
                </p>
              </div>
            </div>
          </div>

          <!-- Footer (Fixed Bottom) -->
          <div class="modal-footer">
            <button class="btn-red w-full justify-center" @click="visible = false">
              Got it, thanks!
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const visible = ref(false);

const links = ['Reset Password', 'Payment Issues', 'Certificate Help', 'Course Access', 'Exam Retakes'];

const open = () => {
  visible.value = true;
};

const handleTopicClick = (topic: string) => {
  visible.value = false;
  if (topic === 'Reset Password') {
    window.location.href = '/reset-password';
  } else if (topic === 'Certificate Help') {
    window.location.href = '/verify';
  } else {
    window.location.href = 'mailto:support@gsfin.org?subject=' + encodeURIComponent(topic);
  }
};

defineExpose({ open });
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  box-sizing: border-box;
}

.modal-card {
  background: #FFFFFF;
  border-radius: 24px;
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 48px);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  margin: auto;
}

@keyframes modalPop {
  from { opacity: 0; transform: scale(0.96) translateY(12px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: #FFFFFF;
}

.header-title-flex {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: rgba(227, 27, 35, 0.1);
  color: #E31B23;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
  line-height: 1.2;
}

.modal-subtitle {
  font-size: 0.74rem;
  font-weight: 600;
  color: #64748B;
  margin-top: 2px;
}

.modal-close-btn {
  background: #F1F5F9;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #64748B;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.modal-close-btn:hover {
  background: rgba(227, 27, 35, 0.1);
  color: #E31B23;
}

.modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.intro-desc {
  font-size: 0.84rem;
  color: #475569;
  line-height: 1.45;
  margin: 0 0 12px 0;
}

.channels-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.channel-card {
  padding: 10px 14px;
  border-radius: 14px;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.07);
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  transition: all 0.2s ease;
}
.channel-card:hover {
  background: #FFFFFF;
  border-color: rgba(227, 27, 35, 0.3);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
  transform: translateY(-1px);
}

.channel-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  margin-right: 12px;
  flex-shrink: 0;
}

.bg-blue-light { background: rgba(59, 130, 246, 0.1); }
.bg-emerald-light { background: rgba(16, 185, 129, 0.1); }
.bg-red-light { background: rgba(227, 27, 35, 0.1); }

.text-blue { color: #2563EB; }
.text-emerald { color: #059669; }
.text-red { color: #E31B23; }

.channel-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.channel-name {
  font-size: 0.86rem;
  font-weight: 800;
  color: #0F172A;
}

.channel-sub {
  font-size: 0.72rem;
  font-weight: 500;
  color: #64748B;
  margin-top: 1px;
}

.channel-arrow {
  color: #94A3B8;
  font-size: 1rem;
  transition: transform 0.2s;
}
.channel-card:hover .channel-arrow {
  color: #E31B23;
  transform: translateX(3px);
}

.section-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 800;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 12px 0 6px 0;
}

.topics-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.topic-chip {
  padding: 5px 12px;
  border-radius: 50px;
  background: #F1F5F9;
  border: 1px solid rgba(15, 23, 42, 0.06);
  color: #334155;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.topic-chip:hover {
  background: rgba(227, 27, 35, 0.1);
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.3);
}

.protip-banner {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 12px;
}

.protip-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #D97706;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.protip-title {
  font-size: 0.76rem;
  font-weight: 800;
  color: #92400E;
  display: block;
}

.protip-msg {
  font-size: 0.74rem;
  color: #78350F;
  margin: 2px 0 0 0;
  line-height: 1.35;
}

.protip-link {
  color: #92400E;
  font-weight: 800;
  text-decoration: underline;
}

.modal-footer {
  padding: 14px 20px;
  background: #FAFAFD;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  flex-shrink: 0;
}

.btn-red {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.86rem;
  box-shadow: 0 3px 10px rgba(227, 27, 35, 0.2);
  transition: all 0.2s ease;
  cursor: pointer;
}
.btn-red:hover { background: #C4131B; transform: translateY(-1px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
