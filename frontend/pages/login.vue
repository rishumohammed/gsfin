<template>
  <div class="login-page">
    <div class="login-card-wrap">
      <!-- GSFIN Brand Logo Header -->
      <NuxtLink to="/" class="login-brand">
        <img :src="fullLogoUrl || '/logo.webp'" alt="GSFIN Logo" class="login-logo-img" />
      </NuxtLink>

      <!-- Glassmorphic Login Card -->
      <div class="login-card">
        <div class="login-card-header">
          <h1 class="login-title">Welcome Back</h1>
          <p class="login-sub">Sign in to GSFIN Partner &amp; Admin Portal</p>

          <!-- Quick Demo Credential Chips -->
          <div class="demo-chips-wrap mt-3">
            <button
              type="button"
              class="demo-chip"
              @click="email = 'admin@aems.local'; password = 'Admin@1234'"
            >
              <i class="mdi mdi-shield-account"></i> System Admin
            </button>
            <button
              type="button"
              class="demo-chip"
              @click="email = 'mainadmin@certification.org'; password = 'Password123!'"
            >
              <i class="mdi mdi-domain"></i> Main Admin
            </button>
            <button
              type="button"
              class="demo-chip"
              @click="email = 'staff@apexcenter.com'; password = 'Password123!'"
            >
              <i class="mdi mdi-office-building"></i> Partner Center
            </button>
          </div>
        </div>

        <form @submit.prevent="handleLogin">
          <div class="form-group mb-4">
            <label class="form-label">Email Address</label>
            <div class="input-wrap">
              <i class="mdi mdi-email-outline input-icon"></i>
              <input
                v-model="email"
                type="email"
                required
                placeholder="admin@gsfin.org"
                class="form-input"
                :disabled="loading"
              />
            </div>
          </div>

          <div class="form-group mb-4">
            <label class="form-label">Password</label>
            <div class="input-wrap">
              <i class="mdi mdi-lock-outline input-icon"></i>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
                class="form-input"
                :disabled="loading"
              />
              <button
                type="button"
                class="toggle-pw-btn"
                @click="showPassword = !showPassword"
                aria-label="Toggle password visibility"
              >
                <i :class="['mdi', showPassword ? 'mdi-eye-off' : 'mdi-eye']"></i>
              </button>
            </div>
          </div>

          <div class="form-row-remember mb-6">
            <label class="remember-label">
              <input type="checkbox" v-model="rememberMe" class="custom-checkbox" />
              <span>Remember me</span>
            </label>
            <NuxtLink to="/forgot-password" class="forgot-link">Forgot password?</NuxtLink>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="btn-submit-red" :disabled="loading">
            <span v-if="!loading">Sign In to Portal <i class="mdi mdi-arrow-right ml-1"></i></span>
            <span v-else class="spinner-sm"></span>
          </button>
        </form>

        <!-- Error Alert -->
        <Transition name="fade">
          <div v-if="error" class="login-error-alert">
            <i class="mdi mdi-alert-circle-outline alert-icon"></i>
            <span>{{ error }}</span>
          </div>
        </Transition>

        <div class="login-footer-text">
          Interested in becoming an Authorized Partner Center?
          <NuxtLink to="/#contact" class="partner-link">Contact GSFIN</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

definePageMeta({
  layout: false
});

const authStore = useAuthStore();
const { fullLogoUrl } = usePublicConfig();

const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  if (!email.value || !password.value) return;
  loading.value = true;
  error.value = '';
  try {
    await authStore.login({ email: email.value, password: password.value });
    navigateTo('/dashboard');
  } catch (err: any) {
    if (err.code === 'ERR_NETWORK') {
      error.value = 'Cannot connect to server. Please check network connection.';
    } else {
      error.value = err.response?.data?.message || 'Invalid email or password. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #FFFFFF 0%, #FAFAFD 50%, #FFF5F5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box;
}

.login-card-wrap {
  width: 100%;
  max-width: 440px;
}

.login-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
  text-decoration: none;
}

.login-logo-img {
  height: 52px;
  width: auto;
  object-fit: contain;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(227, 27, 35, 0.12);
  border-radius: 24px;
  padding: 40px 36px;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
}

.login-card-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.demo-chips-wrap {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 14px;
}

.demo-chip {
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 50px;
  padding: 5px 12px;
  font-size: 0.74rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.demo-chip:hover {
  background: #E31B23;
  color: #FFFFFF;
  border-color: #E31B23;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #334155;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  color: #94A3B8;
  font-size: 1.2rem;
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 13px 16px 13px 46px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #F8FAFC;
  font-size: 0.94rem;
  color: #0F172A;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.form-input:focus {
  background: #FFFFFF;
  border-color: #E31B23;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.12);
}

.toggle-pw-btn {
  position: absolute;
  right: 14px;
  background: none;
  border: none;
  color: #94A3B8;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.toggle-pw-btn:hover {
  color: #334155;
}

.form-row-remember {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.remember-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.84rem;
  color: #475569;
  cursor: pointer;
  font-weight: 500;
}

.custom-checkbox {
  accent-color: #E31B23;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.forgot-link {
  font-size: 0.84rem;
  font-weight: 700;
  color: #E31B23;
  text-decoration: none;
  transition: color 0.2s;
}
.forgot-link:hover {
  color: #C4131B;
  text-decoration: underline;
}

.btn-submit-red {
  width: 100%;
  padding: 14px 24px;
  border-radius: 14px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  font-size: 0.94rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(227, 27, 35, 0.25);
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-submit-red:hover {
  background: #C4131B;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(227, 27, 35, 0.32);
}

.btn-submit-red:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

@keyframes spin { to { transform: rotate(360deg); } }
.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  display: inline-block;
}

.login-error-alert {
  margin-top: 20px;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #DC2626;
  font-size: 0.86rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}
.alert-icon {
  font-size: 1.1rem;
}

.login-footer-text {
  text-align: center;
  font-size: 0.82rem;
  color: #64748B;
  margin-top: 28px;
  line-height: 1.5;
}

.partner-link {
  display: block;
  margin-top: 4px;
  color: #E31B23;
  font-weight: 700;
  text-decoration: none;
}
.partner-link:hover {
  text-decoration: underline;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
