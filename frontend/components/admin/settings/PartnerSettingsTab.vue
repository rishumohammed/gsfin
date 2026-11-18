<template>
  <div class="partner-settings-tab">
    <!-- Header Banner -->
    <div class="intro-banner mb-6">
      <div class="flex items-center gap-4">
        <div class="icon-avatar-lg bg-red-light text-red">
          <i class="mdi mdi-handshake-outline"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-slate-900 m-0">Partner Centers &amp; Accreditation Settings</h3>
          <p class="text-xs text-slate-500 font-medium m-0 mt-0.5">
            Configure the authorized countries and approved training programs available in dropdowns when creating or editing Partner Centers.
          </p>
        </div>
      </div>
    </div>

    <!-- Active Section Selector -->
    <div class="section-tabs-bar mb-6 flex items-center gap-2 border-b border-slate-200 pb-3">
      <button
        type="button"
        :class="['section-tab-btn', { 'section-tab-btn--active': activeSubSection === 'countries' }]"
        @click="activeSubSection = 'countries'"
      >
        <i class="mdi mdi-earth mr-1.5"></i>
        <span>Authorized Countries</span>
        <span class="count-pill ml-1.5">{{ countries.length }}</span>
      </button>

      <button
        type="button"
        :class="['section-tab-btn', { 'section-tab-btn--active': activeSubSection === 'programs' }]"
        @click="activeSubSection = 'programs'"
      >
        <i class="mdi mdi-certificate-outline mr-1.5"></i>
        <span>Approved Training Programs</span>
        <span class="count-pill ml-1.5">{{ programs.length }}</span>
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- SECTION 1: AUTHORIZED PARTNER COUNTRIES                             -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-show="activeSubSection === 'countries'" class="fade-in">
      <!-- Quick Add Bar -->
      <div class="add-card mb-6">
        <div class="flex items-center gap-3">
          <div class="relative flex-1">
            <i class="mdi mdi-plus-circle-outline input-left-icon"></i>
            <input
              v-model="newCountry"
              type="text"
              placeholder="Type new partner country (e.g. United Arab Emirates, India, Saudi Arabia)..."
              class="add-input"
              @keyup.enter="addCountry"
            />
          </div>
          <button
            type="button"
            class="btn-red flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs"
            :disabled="!newCountry.trim()"
            @click="addCountry"
          >
            <i class="mdi mdi-plus"></i> Add Country
          </button>
        </div>
      </div>

      <!-- Countries Roster List -->
      <div class="items-container">
        <div class="items-header-bar flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Configured Countries ({{ countries.length }})
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn-reset-default text-xs text-slate-500 font-semibold hover:text-red flex items-center gap-1.5"
              @click="resetCountriesToDefault"
            >
              <i class="mdi mdi-restore"></i> Reset Defaults
            </button>
          </div>
        </div>

        <div v-if="countries.length === 0" class="empty-state py-12 text-center">
          <i class="mdi mdi-earth text-4xl text-slate-300 block mb-2"></i>
          <div class="font-semibold text-slate-700 text-sm">No countries configured</div>
          <div class="text-xs text-slate-400 mt-1">Add your first partner country using the field above or reset defaults.</div>
        </div>

        <div v-else class="space-y-2.5">
          <div
            v-for="(country, idx) in countries"
            :key="idx"
            class="item-row"
          >
            <div class="item-left flex items-center gap-3">
              <span class="item-index-badge">{{ idx + 1 }}</span>
              <span v-if="editingCountryIdx !== idx" class="item-title-text font-semibold text-sm text-slate-900">
                {{ country }}
              </span>
              <input
                v-else
                v-model="editingCountryValue"
                type="text"
                class="edit-inline-input"
                @keyup.enter="saveCountryEdit(idx)"
                @keyup.esc="cancelCountryEdit"
              />
            </div>

            <div class="item-actions flex items-center gap-1.5">
              <template v-if="editingCountryIdx === idx">
                <button
                  type="button"
                  class="btn-icon-action btn-icon-save"
                  title="Save changes"
                  @click="saveCountryEdit(idx)"
                >
                  <i class="mdi mdi-check"></i>
                </button>
                <button
                  type="button"
                  class="btn-icon-action btn-icon-cancel"
                  title="Cancel"
                  @click="cancelCountryEdit"
                >
                  <i class="mdi mdi-close"></i>
                </button>
              </template>
              <template v-else>
                <button
                  type="button"
                  class="btn-icon-action"
                  title="Move up"
                  :disabled="idx === 0"
                  @click="moveCountryUp(idx)"
                >
                  <i class="mdi mdi-arrow-up"></i>
                </button>
                <button
                  type="button"
                  class="btn-icon-action"
                  title="Move down"
                  :disabled="idx === countries.length - 1"
                  @click="moveCountryDown(idx)"
                >
                  <i class="mdi mdi-arrow-down"></i>
                </button>
                <button
                  type="button"
                  class="btn-icon-action btn-icon-edit"
                  title="Edit name"
                  @click="startCountryEdit(idx, country)"
                >
                  <i class="mdi mdi-pencil-outline"></i>
                </button>
                <button
                  type="button"
                  class="btn-icon-action btn-icon-delete"
                  title="Remove country"
                  @click="removeCountry(idx)"
                >
                  <i class="mdi mdi-trash-can-outline"></i>
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- SECTION 2: APPROVED TRAINING PROGRAMS                              -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-show="activeSubSection === 'programs'" class="fade-in">
      <!-- Info Callout -->
      <div class="callout-card mb-6 flex items-start gap-3 p-4 rounded-xl bg-blue-50/70 border border-blue-200/60">
        <i class="mdi mdi-information-outline text-blue-600 text-lg mt-0.5"></i>
        <div class="text-xs text-blue-900 font-medium leading-relaxed">
          <strong>Smart Catalog Sync:</strong> When creating or editing partner centers, this list is automatically combined with all active standards from your <NuxtLink to="/dashboard/admin/qualifications" class="text-blue-700 underline font-semibold">Certifications Catalog</NuxtLink>. You can define additional custom industry curriculums here.
        </div>
      </div>

      <!-- Quick Add Bar -->
      <div class="add-card mb-6">
        <div class="flex items-center gap-3">
          <div class="relative flex-1">
            <i class="mdi mdi-plus-circle-outline input-left-icon"></i>
            <input
              v-model="newProgram"
              type="text"
              placeholder="Type new training program (e.g. CODEX HACCP, ISO 22000, Food Safety Manager)..."
              class="add-input"
              @keyup.enter="addProgram"
            />
          </div>
          <button
            type="button"
            class="btn-red flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs"
            :disabled="!newProgram.trim()"
            @click="addProgram"
          >
            <i class="mdi mdi-plus"></i> Add Program
          </button>
        </div>
      </div>

      <!-- Programs Roster List -->
      <div class="items-container">
        <div class="items-header-bar flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Configured Programs ({{ programs.length }})
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn-reset-default text-xs text-slate-500 font-semibold hover:text-red flex items-center gap-1.5"
              @click="resetProgramsToDefault"
            >
              <i class="mdi mdi-restore"></i> Reset Defaults
            </button>
          </div>
        </div>

        <div v-if="programs.length === 0" class="empty-state py-12 text-center">
          <i class="mdi mdi-certificate text-4xl text-slate-300 block mb-2"></i>
          <div class="font-semibold text-slate-700 text-sm">No training programs configured</div>
          <div class="text-xs text-slate-400 mt-1">Add your first approved training program using the field above or reset defaults.</div>
        </div>

        <div v-else class="space-y-2.5">
          <div
            v-for="(prog, idx) in programs"
            :key="idx"
            class="item-row"
          >
            <div class="item-left flex items-center gap-3">
              <span class="item-index-badge">{{ idx + 1 }}</span>
              <span v-if="editingProgramIdx !== idx" class="item-title-text font-semibold text-sm text-slate-900">
                {{ prog }}
              </span>
              <input
                v-else
                v-model="editingProgramValue"
                type="text"
                class="edit-inline-input"
                @keyup.enter="saveProgramEdit(idx)"
                @keyup.esc="cancelProgramEdit"
              />
            </div>

            <div class="item-actions flex items-center gap-1.5">
              <template v-if="editingProgramIdx === idx">
                <button
                  type="button"
                  class="btn-icon-action btn-icon-save"
                  title="Save changes"
                  @click="saveProgramEdit(idx)"
                >
                  <i class="mdi mdi-check"></i>
                </button>
                <button
                  type="button"
                  class="btn-icon-action btn-icon-cancel"
                  title="Cancel"
                  @click="cancelProgramEdit"
                >
                  <i class="mdi mdi-close"></i>
                </button>
              </template>
              <template v-else>
                <button
                  type="button"
                  class="btn-icon-action"
                  title="Move up"
                  :disabled="idx === 0"
                  @click="moveProgramUp(idx)"
                >
                  <i class="mdi mdi-arrow-up"></i>
                </button>
                <button
                  type="button"
                  class="btn-icon-action"
                  title="Move down"
                  :disabled="idx === programs.length - 1"
                  @click="moveProgramDown(idx)"
                >
                  <i class="mdi mdi-arrow-down"></i>
                </button>
                <button
                  type="button"
                  class="btn-icon-action btn-icon-edit"
                  title="Edit name"
                  @click="startProgramEdit(idx, prog)"
                >
                  <i class="mdi mdi-pencil-outline"></i>
                </button>
                <button
                  type="button"
                  class="btn-icon-action btn-icon-delete"
                  title="Remove program"
                  @click="removeProgram(idx)"
                >
                  <i class="mdi mdi-trash-can-outline"></i>
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Action Footer -->
    <div class="save-footer mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
      <div class="text-xs text-slate-500 font-medium">
        Changes apply instantly to the Partner Center dropdowns and registration forms.
      </div>
      <button
        type="button"
        class="btn-red flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs"
        :disabled="saving"
        @click="saveAllPartnerSettings"
      >
        <i :class="['mdi', saving ? 'mdi-loading spin-icon' : 'mdi-check-decagram']"></i>
        {{ saving ? 'Saving Changes...' : 'Save Partner Settings' }}
      </button>
    </div>

    <!-- Feedback Snackbar / Toast -->
    <div
      v-if="toastMessage"
      class="toast-notification"
      :class="toastType === 'error' ? 'toast-error' : 'toast-success'"
    >
      <i :class="['mdi', toastType === 'error' ? 'mdi-alert-circle' : 'mdi-check-circle']"></i>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue';
import { useApi } from '@/composables/useApi';

const api = useApi();
const configForm = inject<any>('configForm', ref({}));

const activeSubSection = ref<'countries' | 'programs'>('countries');

// Default presets
const DEFAULT_COUNTRIES = [
  'India',
  'United Arab Emirates',
  'Saudi Arabia',
  'Qatar',
  'Oman',
  'Kuwait',
  'Bahrain',
  'United Kingdom',
  'United States',
  'Singapore',
  'Malaysia',
  'Australia',
  'Canada',
  'Germany',
  'Egypt',
  'South Africa',
  'Nigeria',
  'Kenya',
  'Philippines',
  'Sri Lanka',
  'Pakistan',
  'Bangladesh',
  'Indonesia'
];

const DEFAULT_PROGRAMS = [
  'CODEX HACCP',
  'ISO 22000 Food Safety',
  'Food Safety Manager',
  'Halal Audit Certification',
  'BRCGS Global Standard',
  'FSSC 22000 Lead Auditor',
  'Food Science & Technology',
  'GHP & GMP Foundation'
];

// Reactive states
const countries = ref<string[]>([...DEFAULT_COUNTRIES]);
const programs = ref<string[]>([...DEFAULT_PROGRAMS]);

const newCountry = ref('');
const editingCountryIdx = ref<number | null>(null);
const editingCountryValue = ref('');

const newProgram = ref('');
const editingProgramIdx = ref<number | null>(null);
const editingProgramValue = ref('');

const saving = ref(false);
const toastMessage = ref('');
const toastType = ref<'success' | 'error'>('success');
let toastTimer: any = null;

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = msg;
  toastType.value = type;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 3500);
}

onMounted(async () => {
  await loadSettings();
});

async function loadSettings() {
  try {
    const { data } = await api.get('/admin/config');
    let rawCountries: any = null;
    let rawPrograms: any = null;

    if (Array.isArray(data)) {
      const cItem = data.find((c: any) => c.key === 'partner_countries');
      if (cItem) rawCountries = cItem.value;
      const pItem = data.find((c: any) => c.key === 'partner_training_programs');
      if (pItem) rawPrograms = pItem.value;
    } else if (data && typeof data === 'object') {
      rawCountries = data.partner_countries;
      rawPrograms = data.partner_training_programs;
    }

    if (rawCountries) {
      const parsedC = typeof rawCountries === 'string' ? JSON.parse(rawCountries) : rawCountries;
      if (Array.isArray(parsedC) && parsedC.length > 0) {
        countries.value = parsedC;
      }
    }

    if (rawPrograms) {
      const parsedP = typeof rawPrograms === 'string' ? JSON.parse(rawPrograms) : rawPrograms;
      if (Array.isArray(parsedP) && parsedP.length > 0) {
        programs.value = parsedP;
      }
    }
  } catch (err) {
    console.error('Failed to load partner settings:', err);
  }
}

// Country methods
function addCountry() {
  const val = newCountry.value.trim();
  if (!val) return;
  if (!countries.value.includes(val)) {
    countries.value.push(val);
  }
  newCountry.value = '';
}

function startCountryEdit(idx: number, currentVal: string) {
  editingCountryIdx.value = idx;
  editingCountryValue.value = currentVal;
}

function saveCountryEdit(idx: number) {
  const val = editingCountryValue.value.trim();
  if (val) {
    countries.value[idx] = val;
  }
  cancelCountryEdit();
}

function cancelCountryEdit() {
  editingCountryIdx.value = null;
  editingCountryValue.value = '';
}

function removeCountry(idx: number) {
  countries.value.splice(idx, 1);
}

function moveCountryUp(idx: number) {
  if (idx <= 0) return;
  const item = countries.value.splice(idx, 1)[0];
  countries.value.splice(idx - 1, 0, item);
}

function moveCountryDown(idx: number) {
  if (idx >= countries.value.length - 1) return;
  const item = countries.value.splice(idx, 1)[0];
  countries.value.splice(idx + 1, 0, item);
}

function resetCountriesToDefault() {
  if (confirm('Reset partner countries list to default global countries?')) {
    countries.value = [...DEFAULT_COUNTRIES];
  }
}

// Program methods
function addProgram() {
  const val = newProgram.value.trim();
  if (!val) return;
  if (!programs.value.includes(val)) {
    programs.value.push(val);
  }
  newProgram.value = '';
}

function startProgramEdit(idx: number, currentVal: string) {
  editingProgramIdx.value = idx;
  editingProgramValue.value = currentVal;
}

function saveProgramEdit(idx: number) {
  const val = editingProgramValue.value.trim();
  if (val) {
    programs.value[idx] = val;
  }
  cancelProgramEdit();
}

function cancelProgramEdit() {
  editingProgramIdx.value = null;
  editingProgramValue.value = '';
}

function removeProgram(idx: number) {
  programs.value.splice(idx, 1);
}

function moveProgramUp(idx: number) {
  if (idx <= 0) return;
  const item = programs.value.splice(idx, 1)[0];
  programs.value.splice(idx - 1, 0, item);
}

function moveProgramDown(idx: number) {
  if (idx >= programs.value.length - 1) return;
  const item = programs.value.splice(idx, 1)[0];
  programs.value.splice(idx + 1, 0, item);
}

function resetProgramsToDefault() {
  if (confirm('Reset approved training programs list to defaults?')) {
    programs.value = [...DEFAULT_PROGRAMS];
  }
}

// Save all to database
async function saveAllPartnerSettings() {
  saving.value = true;
  try {
    const payload = {
      partner_countries: JSON.stringify(countries.value),
      partner_training_programs: JSON.stringify(programs.value)
    };
    await api.put('/admin/config', payload);

    if (configForm.value) {
      configForm.value.partner_countries = JSON.stringify(countries.value);
      configForm.value.partner_training_programs = JSON.stringify(programs.value);
    }

    showToast('Partner countries and programs saved successfully!', 'success');
  } catch (err: any) {
    showToast(err.response?.data?.message || 'Failed to save partner settings', 'error');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.partner-settings-tab {
  font-family: inherit;
}

.intro-banner {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 20px 24px;
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
  background: #FEF2F2;
}

.text-red {
  color: #E31B23;
}

.section-tab-btn {
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748B;
  background: transparent;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.section-tab-btn:hover {
  background: #F1F5F9;
  color: #0F172A;
}

.section-tab-btn--active {
  background: #FEF2F2;
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.2);
}

.count-pill {
  padding: 2px 7px;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.06);
  font-size: 0.72rem;
  font-weight: 600;
}

.section-tab-btn--active .count-pill {
  background: #E31B23;
  color: #FFFFFF;
}

.add-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.09);
  border-radius: 16px;
  padding: 12px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.input-left-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.25rem;
  color: #94A3B8;
  pointer-events: none;
}

.add-input {
  width: 100%;
  padding: 10px 14px 10px 42px;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 500;
  color: #0F172A;
  outline: none;
  transition: all 0.18s ease;
}

.add-input:focus {
  background: #FFFFFF;
  border-color: #E31B23;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.1);
}

.items-container {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  padding: 18px 20px;
}

.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 12px;
  transition: all 0.15s ease;
}

.item-row:hover {
  background: #F1F5F9;
  border-color: rgba(15, 23, 42, 0.12);
}

.item-index-badge {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: #E2E8F0;
  color: #64748B;
  font-size: 0.72rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.edit-inline-input {
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

.fade-in {
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 0.84rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 9999;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.25s ease-out;
}

.toast-success {
  background: #064E3B;
  color: #ECFDF5;
  border: 1px solid #059669;
}

.toast-error {
  background: #7F1D1D;
  color: #FEF2F2;
  border: 1px solid #DC2626;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
