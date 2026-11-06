<template>
  <div class="education-levels-tab">
    <!-- Header Card -->
    <div class="intro-banner mb-6">
      <div class="flex items-center gap-4">
        <div class="icon-avatar-lg bg-red-light text-red">
          <i class="mdi mdi-school-outline"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-slate-900 m-0">Candidate Education Levels</h3>
          <p class="text-xs text-slate-500 font-medium m-0 mt-0.5">
            Configure the educational qualifications available in Partner Portals when centers register candidate students for examinations.
          </p>
        </div>
      </div>
    </div>

    <!-- Quick Add Input Bar -->
    <div class="add-level-card mb-6">
      <div class="flex items-center gap-3">
        <div class="relative flex-1">
          <i class="mdi mdi-plus-circle-outline input-left-icon"></i>
          <input
            v-model="newLevelName"
            type="text"
            placeholder="Type new education level (e.g. Plus Two, Undergraduate, Diploma)..."
            class="add-level-input"
            @keyup.enter="addLevel"
          />
        </div>
        <button
          type="button"
          class="btn-red flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs"
          :disabled="!newLevelName.trim()"
          @click="addLevel"
        >
          <i class="mdi mdi-plus"></i> Add Level
        </button>
      </div>
    </div>

    <!-- Levels Roster List -->
    <div class="levels-container">
      <div class="levels-header-bar flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Configured Levels ({{ levels.length }})
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn-reset-default text-xs text-slate-500 font-semibold hover:text-red flex items-center gap-1.5"
            @click="resetToDefaults"
          >
            <i class="mdi mdi-restore"></i> Reset Defaults
          </button>
        </div>
      </div>

      <div v-if="levels.length === 0" class="empty-state py-12 text-center">
        <i class="mdi mdi-school text-4xl text-slate-300 block mb-2"></i>
        <div class="font-semibold text-slate-700 text-sm">No education levels configured</div>
        <div class="text-xs text-slate-400 mt-1">Add your first education level using the field above.</div>
      </div>

      <div v-else class="space-y-2.5">
        <div
          v-for="(level, idx) in levels"
          :key="idx"
          class="level-item-row"
        >
          <div class="level-left flex items-center gap-3">
            <span class="level-index-badge">{{ idx + 1 }}</span>
            <span v-if="editingIdx !== idx" class="level-title-text font-semibold text-sm text-slate-900">
              {{ level }}
            </span>
            <input
              v-else
              v-model="editingValue"
              type="text"
              class="edit-level-inline-input"
              @keyup.enter="saveEdit(idx)"
              @keyup.esc="cancelEdit"
            />
          </div>

          <div class="level-actions flex items-center gap-1.5">
            <!-- Edit / Save Buttons -->
            <template v-if="editingIdx === idx">
              <button
                type="button"
                class="btn-icon-action btn-icon-save"
                title="Save changes"
                @click="saveEdit(idx)"
              >
                <i class="mdi mdi-check"></i>
              </button>
              <button
                type="button"
                class="btn-icon-action btn-icon-cancel"
                title="Cancel"
                @click="cancelEdit"
              >
                <i class="mdi mdi-close"></i>
              </button>
            </template>
            <template v-else>
              <!-- Move Up -->
              <button
                type="button"
                class="btn-icon-action"
                title="Move up"
                :disabled="idx === 0"
                @click="moveUp(idx)"
              >
                <i class="mdi mdi-arrow-up"></i>
              </button>
              <!-- Move Down -->
              <button
                type="button"
                class="btn-icon-action"
                title="Move down"
                :disabled="idx === levels.length - 1"
                @click="moveDown(idx)"
              >
                <i class="mdi mdi-arrow-down"></i>
              </button>
              <!-- Edit -->
              <button
                type="button"
                class="btn-icon-action btn-icon-edit"
                title="Edit name"
                @click="startEdit(idx, level)"
              >
                <i class="mdi mdi-pencil-outline"></i>
              </button>
              <!-- Delete -->
              <button
                type="button"
                class="btn-icon-action btn-icon-delete"
                title="Remove level"
                @click="removeLevel(idx)"
              >
                <i class="mdi mdi-trash-can-outline"></i>
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Action Footer -->
    <div class="save-footer mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
      <div class="text-xs text-slate-500 font-medium">
        Changes apply instantly to the Partner Portal student registration form.
      </div>
      <button
        type="button"
        class="btn-red flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs"
        :disabled="saving"
        @click="saveEducationLevels"
      >
        <i :class="['mdi', saving ? 'mdi-loading spin-icon' : 'mdi-check-decagram']"></i>
        {{ saving ? 'Saving Changes...' : 'Save Education Levels' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue';
import { useApi } from '@/composables/useApi';

const api = useApi();
const configForm = inject<any>('configForm', ref({}));

const levels = ref<string[]>([
  'SSLC / 10th Standard',
  'Plus Two / 12th Standard',
  'Diploma',
  'Undergraduate / Bachelor Degree',
  'Postgraduate / Master Degree',
  'Doctorate / PhD',
  'Other / Professional'
]);

const newLevelName = ref('');
const editingIdx = ref<number | null>(null);
const editingValue = ref('');
const saving = ref(false);

const DEFAULT_LEVELS = [
  'SSLC / 10th Standard',
  'Plus Two / 12th Standard',
  'Diploma',
  'Undergraduate / Bachelor Degree',
  'Postgraduate / Master Degree',
  'Doctorate / PhD',
  'Other / Professional'
];

onMounted(async () => {
  await loadLevels();
});

async function loadLevels() {
  try {
    const { data } = await api.get('/admin/config');
    let rawValue = null;
    if (Array.isArray(data)) {
      const item = data.find((c: any) => c.key === 'education_levels');
      if (item) rawValue = item.value;
    } else if (data && data.education_levels) {
      rawValue = data.education_levels;
    }

    if (rawValue) {
      const parsed = typeof rawValue === 'string'
        ? JSON.parse(rawValue)
        : rawValue;
      if (Array.isArray(parsed) && parsed.length > 0) {
        levels.value = parsed;
      }
    }
  } catch (err) {
    console.error('Error fetching education levels from config:', err);
  }
}

function addLevel() {
  const val = newLevelName.value.trim();
  if (!val) return;
  if (!levels.value.includes(val)) {
    levels.value.push(val);
  }
  newLevelName.value = '';
}

function startEdit(idx: number, currentVal: string) {
  editingIdx.value = idx;
  editingValue.value = currentVal;
}

function saveEdit(idx: number) {
  const val = editingValue.value.trim();
  if (val) {
    levels.value[idx] = val;
  }
  editingIdx.value = null;
  editingValue.value = '';
}

function cancelEdit() {
  editingIdx.value = null;
  editingValue.value = '';
}

function removeLevel(idx: number) {
  if (confirm(`Remove "${levels.value[idx]}" from candidate education levels?`)) {
    levels.value.splice(idx, 1);
  }
}

function moveUp(idx: number) {
  if (idx <= 0) return;
  const item = levels.value.splice(idx, 1)[0];
  levels.value.splice(idx - 1, 0, item);
}

function moveDown(idx: number) {
  if (idx >= levels.value.length - 1) return;
  const item = levels.value.splice(idx, 1)[0];
  levels.value.splice(idx + 1, 0, item);
}

function resetToDefaults() {
  if (confirm('Reset education levels to standard default qualifications?')) {
    levels.value = [...DEFAULT_LEVELS];
  }
}

async function saveEducationLevels() {
  saving.value = true;
  try {
    await api.put('/admin/config', {
      education_levels: JSON.stringify(levels.value)
    });
    alert('Education levels updated successfully!');
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Failed to save education levels');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.intro-banner {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 18px 22px;
}

.icon-avatar-lg {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.bg-red-light {
  background: rgba(227, 27, 35, 0.08);
}
.text-red {
  color: #E31B23;
}

.add-level-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.02);
}

.add-level-input {
  width: 100%;
  padding: 10px 14px 10px 38px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  font-size: 0.88rem;
  font-weight: 500;
  color: #0F172A;
  outline: none;
  background: #FAFAFD;
  transition: all 0.2s;
  box-sizing: border-box;
}
.add-level-input:focus {
  background: #FFFFFF;
  border-color: #E31B23;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.1);
}

.input-left-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  font-size: 1.15rem;
  pointer-events: none;
}

.level-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  transition: all 0.18s ease;
}
.level-item-row:hover {
  border-color: rgba(227, 27, 35, 0.25);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
  transform: translateX(2px);
}

.level-index-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #F1F5F9;
  color: #64748B;
  font-size: 0.72rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.edit-level-inline-input {
  padding: 4px 10px;
  border: 1px solid #E31B23;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #0F172A;
  outline: none;
  background: #FFFDFD;
}

.btn-icon-action {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #FFFFFF;
  color: #64748B;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.15s ease;
}
.btn-icon-action:hover:not(:disabled) {
  background: #F8FAFC;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.2);
}
.btn-icon-action:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-icon-edit:hover {
  background: #EFF6FF !important;
  color: #2563EB !important;
  border-color: rgba(37, 99, 235, 0.3) !important;
}
.btn-icon-delete:hover {
  background: #FEF2F2 !important;
  color: #DC2626 !important;
  border-color: rgba(220, 38, 38, 0.3) !important;
}
.btn-icon-save {
  background: #ECFDF5;
  color: #059669;
  border-color: rgba(16, 185, 129, 0.3);
}
.btn-icon-cancel {
  background: #F1F5F9;
  color: #64748B;
}

.btn-red {
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  cursor: pointer;
  transition: all 0.18s ease;
}
.btn-red:hover:not(:disabled) {
  background: #C41219;
}
.btn-red:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-reset-default {
  background: none;
  border: none;
  cursor: pointer;
}

.spin-icon {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
