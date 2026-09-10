import { ref, computed, onMounted } from 'vue';
import { useRuntimeConfig, useState } from '#imports';
import { useApi } from './useApi';

export function usePublicConfig() {
  const appLogo = useState('appLogo', () => '');
  const configMap = useState<Record<string, any>>('publicConfigMap', () => ({}));
  const runtimeCfg = useRuntimeConfig();
  const api = useApi();
  const loaded = useState('publicConfigLoaded', () => false);

  const fullLogoUrl = computed(() => {
    if (!appLogo.value) return '/logo.webp';
    return runtimeCfg.public.apiBase.replace('/api', '') + appLogo.value;
  });

  const fetchConfig = async () => {
    if (loaded.value) return;
    try {
      const { data } = await api.get('/public/config');
      if (data) {
        configMap.value = data;
        if (data.logo_url) {
          appLogo.value = data.logo_url;
        }
        loaded.value = true;
      }
    } catch (e) {
      console.error('Failed to load public config:', e);
    }
  };

  onMounted(() => {
    fetchConfig();
  });

  return {
    appLogo,
    configMap,
    fullLogoUrl,
    fetchConfig
  };
}
