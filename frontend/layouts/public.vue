<template>
  <v-app>
    <!-- Light navbar for public sub-pages (privacy, terms, etc.) -->
    <v-app-bar flat height="70" style="background: rgba(255,255,255,0.95); backdrop-filter: blur(14px); border-bottom: 1px solid #E2E8F0;">
      <v-container class="d-flex align-center pa-0">
        <NuxtLink to="/" class="d-flex align-center text-decoration-none" style="gap: 10px;">
          <template v-if="appLogo">
            <img :src="fullLogoUrl" alt="Logo" style="max-height: 40px; object-fit: contain;" />
          </template>
          <template v-else>
            <span style="font-size: 1.3rem; font-weight: 800; color: #CC1F1F;">GSFIN</span>
          </template>
        </NuxtLink>
        <v-spacer></v-spacer>
        <v-btn
          to="/"
          rounded="lg"
          elevation="0"
          style="background: #CC1F1F; color: #fff; font-weight: 700; text-transform: none; letter-spacing: 0; font-size: 0.85rem; padding: 0 20px;"
        >
          ← Home
        </v-btn>
      </v-container>
    </v-app-bar>

    <v-main style="background: #F8FAFC; min-height: 60vh;">
      <slot />
    </v-main>

    <v-footer style="background: #0F172A; border-top: 1px solid rgba(255,255,255,0.07); padding: 20px 0;">
      <v-container>
        <div class="d-flex flex-wrap align-center justify-space-between" style="gap: 8px;">
          <span style="font-size: 0.75rem; color: rgba(248,250,252,0.28);">
            &copy; {{ currentYear }} GSFIN — Global Standards for Food Industries. All rights reserved.
          </span>
          <div style="display: flex; gap: 20px;">
            <NuxtLink to="/privacy-policy" style="font-size: 0.75rem; color: rgba(248,250,252,0.28); text-decoration: none;">Privacy</NuxtLink>
            <NuxtLink to="/terms-of-service" style="font-size: 0.75rem; color: rgba(248,250,252,0.28); text-decoration: none;">Terms</NuxtLink>
          </div>
        </div>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { useTheme } from 'vuetify';

const authStore = useAuthStore();
const appLogo = useState('appLogo', () => '');
const config = useRuntimeConfig();
const theme = useTheme();
const currentYear = new Date().getFullYear();

const fullLogoUrl = computed(() => {
  if (!appLogo.value) return '';
  return config.public.apiBase.replace('/api', '') + appLogo.value;
});

onMounted(async () => {
  theme.global.name.value = 'light';
  if (!authStore.isAuthenticated && typeof window !== 'undefined' && localStorage.getItem('at')) {
    await authStore.initAuth();
  }
});
</script>
