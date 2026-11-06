<template>
  <div class="kpi-card" :style="{ background: cardGradient, borderColor: cardBorder }">
    <div class="kpi-decor-bg">
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="80" cy="20" r="40" :fill="iconColor" fill-opacity="0.05" />
        <circle cx="90" cy="80" r="20" :fill="iconColor" fill-opacity="0.05" />
        <path d="M0 100 Q 50 50 100 100" :stroke="iconColor" stroke-opacity="0.05" stroke-width="2" fill="none" />
      </svg>
    </div>
    <div class="kpi-content">
      <div class="d-flex align-center mb-4">
        <div class="icon-box" :style="{ backgroundColor: iconBg }">
          <v-icon :icon="icon" :style="{ color: iconColor }" size="20"></v-icon>
        </div>
        <v-spacer></v-spacer>
        <div v-if="trendValue !== null" class="trend-badge" :class="trendPositive ? 'trend-up' : 'trend-down'">
          <v-icon :icon="trendPositive ? 'mdi-trending-up' : 'mdi-trending-down'" size="12" class="mr-1"></v-icon>
          {{ trendValue }}%
        </div>
      </div>
      <div class="kpi-label" :style="{ color: iconColor }">{{ title || label }}</div>
      <div class="kpi-value">{{ value }}</div>
      <div v-if="trendLabel || subtitle" class="kpi-subtitle">{{ trendLabel || subtitle }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title?: string;
  label?: string;
  value: string | number;
  icon: string;
  color?: string;
  // trend can be a number or an object { value, label, positive }
  trend?: number | { value: number; label?: string; positive?: boolean };
  subtitle?: string;
}>();

const colorMap: Record<string, { bg: string; text: string; gradient: string; border: string }> = {
  blue:    { bg: 'rgba(0, 122, 255, 0.12)',  text: '#007AFF', gradient: 'linear-gradient(135deg, #FFFFFF 0%, #F0F7FF 55%, #E1EFFF 100%)', border: 'rgba(0, 122, 255, 0.18)' },
  green:   { bg: 'rgba(48, 185, 77, 0.12)',  text: '#22A348', gradient: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 55%, #DCFCE7 100%)', border: 'rgba(48, 185, 77, 0.18)' },
  red:     { bg: 'rgba(255, 59, 48, 0.12)',  text: '#E31B23', gradient: 'linear-gradient(135deg, #FFFFFF 0%, #FEF2F2 55%, #FEE2E2 100%)', border: 'rgba(227, 27, 35, 0.18)' },
  orange:  { bg: 'rgba(255, 149, 0, 0.12)', text: '#D97706', gradient: 'linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 55%, #FEF3C7 100%)', border: 'rgba(255, 149, 0, 0.18)' },
  purple:  { bg: 'rgba(175, 82, 222, 0.12)', text: '#7C3AED', gradient: 'linear-gradient(135deg, #FFFFFF 0%, #FAF5FF 55%, #F3E8FF 100%)', border: 'rgba(175, 82, 222, 0.18)' },
  teal:    { bg: 'rgba(50, 173, 230, 0.12)', text: '#0D9488', gradient: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDFA 55%, #CCFBF1 100%)', border: 'rgba(50, 173, 230, 0.18)' },
  warning: { bg: 'rgba(255, 149, 0, 0.12)', text: '#D97706', gradient: 'linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 55%, #FEF3C7 100%)', border: 'rgba(255, 149, 0, 0.18)' }, 
  info:    { bg: 'rgba(0, 122, 255, 0.12)',  text: '#007AFF', gradient: 'linear-gradient(135deg, #FFFFFF 0%, #F0F7FF 55%, #E1EFFF 100%)', border: 'rgba(0, 122, 255, 0.18)' }, 
};

const iconBg = computed(() => colorMap[props.color || 'blue']?.bg || 'rgba(0, 122, 255, 0.12)');
const iconColor = computed(() => colorMap[props.color || 'blue']?.text || '#007AFF');
const cardGradient = computed(() => colorMap[props.color || 'blue']?.gradient || 'linear-gradient(135deg, #FFFFFF 0%, #F0F7FF 55%, #E1EFFF 100%)');
const cardBorder = computed(() => colorMap[props.color || 'blue']?.border || 'rgba(0, 122, 255, 0.18)');

const trendValue = computed((): number | null => {
  if (!props.trend) return null;
  if (typeof props.trend === 'number') return props.trend;
  return props.trend.value ?? null;
});

const trendPositive = computed((): boolean => {
  if (!props.trend) return true;
  if (typeof props.trend === 'number') return props.trend > 0;
  return props.trend.positive !== false;
});

const trendLabel = computed((): string | undefined => {
  if (!props.trend || typeof props.trend === 'number') return undefined;
  return props.trend.label;
});
</script>

<style scoped>
.kpi-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  padding: 20px 22px;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease;
  height: 100%;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.kpi-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
}

.kpi-decor-bg {
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  pointer-events: none;
  z-index: 0;
}

.kpi-content {
  position: relative;
  z-index: 1;
}

.icon-box {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--g4);
  margin-bottom: 6px;
}

.kpi-value {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.8px;
  line-height: 1;
  color: var(--g7);
  font-family: var(--font);
}

.kpi-subtitle {
  font-size: 11px;
  color: var(--g4);
  margin-top: 8px;
}

.trend-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--r-pill);
  background: var(--g1);
}

.trend-up   { color: var(--green); background: var(--green-l); }
.trend-down { color: var(--red);   background: var(--red-l); }
</style>
