<template>
  <div class="gsfin-admin-page min-h-screen bg-slate-50/50 py-8 px-4 sm:px-8">
    <div class="max-w-7xl mx-auto">

      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- VIEW 1: CARD VIEW OVERVIEW HUB (DEFAULT WHEN NO CATEGORY SELECTED) -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <div v-if="!activeCategory" class="fade-in">
        
        <!-- Header Banner -->
        <div class="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 text-xs font-black uppercase tracking-wider">
                <i class="mdi mdi-cog-outline me-1"></i> CONTROL PANEL
              </span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
            <p class="text-slate-500 text-sm mt-1">
              Configure branding, homepage content, governance legal text, system users, integrations, and email dispatches.
            </p>
          </div>

          <!-- Quick Search Filter Bar -->
          <div class="relative w-full md:w-80">
            <i class="mdi mdi-magnify absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none"></i>
            <input
              v-model="cardSearch"
              type="text"
              placeholder="Search setting modules..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/10 transition shadow-2xs"
            />
          </div>
        </div>

        <!-- Cards Directory Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div
            v-for="card in filteredCards"
            :key="card.id"
            class="group bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs hover:shadow-md hover:border-red-200 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            @click="selectCategory(card)"
          >
            <div>
              <!-- Top Row: Icon & Tag -->
              <div class="flex items-center justify-between mb-4">
                <div :class="['w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border transition group-hover:scale-105', card.iconBg]">
                  <i :class="`mdi ${card.icon}`"></i>
                </div>
                <span :class="['px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border', card.badgeColor]">
                  {{ card.badge }}
                </span>
              </div>

              <!-- Title & Description -->
              <h3 class="text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors mb-2 flex items-center gap-1">
                <span>{{ card.title }}</span>
                <i class="mdi mdi-chevron-right text-slate-400 group-hover:text-red-600 group-hover:translate-x-1 transition-transform"></i>
              </h3>
              <p class="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6">
                {{ card.subtitle }}
              </p>
            </div>

            <!-- Card Bottom Link -->
            <div class="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600 group-hover:text-red-600">
              <span>Configure Module</span>
              <i class="mdi mdi-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </div>
          </div>
        </div>

      </div>


      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- VIEW 2: INNER PAGE PANEL VIEW (WHEN A CATEGORY CARD IS SELECTED)   -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <div v-else class="fade-in">
        
        <!-- Breadcrumb & Top Bar -->
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div class="flex items-center gap-3">
            <button
              @click="backToOverview"
              class="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <i class="mdi mdi-arrow-left text-base"></i>
              <span>Back to All Settings</span>
            </button>
            <div class="h-5 w-px bg-slate-300 hidden sm:block"></div>
            <div class="text-xs font-bold text-slate-500">
              Settings <span class="mx-1.5 text-slate-400">/</span> <span class="text-slate-900">{{ currentCategoryObj?.title }}</span>
            </div>
          </div>

          <!-- Quick Category Switcher Pills -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
            <button
              v-for="c in settingsCards"
              :key="c.id"
              @click="selectCategory(c)"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border',
                activeCategory === c.id
                  ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              ]"
            >
              <i :class="`mdi ${c.icon} me-1`"></i> {{ c.title.split(' ')[0] }}
            </button>
          </div>
        </div>

        <!-- Inner Form Container -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-10">
          <v-form @submit.prevent="save">

            <!-- 1. Branding & Identity Tab -->
            <div v-if="activeCategory === 'branding'" class="fade-in">
              <h2 class="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <i class="mdi mdi-palette-outline text-red-600"></i> Branding &amp; Platform Identity
              </h2>
              
              <!-- Logo & Favicon Upload -->
              <v-row class="mb-8">
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="pa-4 rounded-xl d-flex flex-column align-center justify-center text-center">
                    <div class="mb-3">
                      <img v-if="form.app_logo" :src="baseUrl + form.app_logo" alt="Logo Preview" style="max-height: 60px; max-width: 100%; object-fit: contain;" />
                      <v-icon v-else size="48" color="grey-lighten-1">mdi-image-outline</v-icon>
                    </div>
                    <div class="text-subtitle-2 font-weight-bold mb-1">Platform Logo</div>
                    <div class="text-caption text-secondary mb-3">Recommended: 400x100px PNG/SVG</div>
                    <v-file-input
                      v-model="logoFile"
                      accept="image/*"
                      label="Upload new logo"
                      variant="outlined"
                      density="compact"
                      prepend-icon=""
                      prepend-inner-icon="mdi-camera"
                      hide-details
                      class="w-100"
                      @change="uploadBranding"
                    ></v-file-input>
                  </v-card>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="pa-4 rounded-xl d-flex flex-column align-center justify-center text-center">
                    <div class="mb-3">
                      <img v-if="form.app_favicon" :src="baseUrl + form.app_favicon" alt="Favicon Preview" style="max-height: 48px; max-width: 48px; border-radius: 8px; object-fit: cover;" />
                      <v-icon v-else size="48" color="grey-lighten-1">mdi-web</v-icon>
                    </div>
                    <div class="text-subtitle-2 font-weight-bold mb-1">Favicon</div>
                    <div class="text-caption text-secondary mb-3">Recommended: 64x64px ICO/PNG</div>
                    <v-file-input
                      v-model="faviconFile"
                      accept="image/*,.ico"
                      label="Upload new favicon"
                      variant="outlined"
                      density="compact"
                      prepend-icon=""
                      prepend-inner-icon="mdi-camera"
                      hide-details
                      class="w-100"
                      @change="uploadBranding"
                    ></v-file-input>
                  </v-card>
                </v-col>
              </v-row>

              <v-divider class="mb-8"></v-divider>

              <div class="fr2 mb-4">
                <AppInput v-model="form.institute_name" label="Institution Name" placeholder="GSFIN Authority" large />
                <AppInput v-model="form.tagline" label="Tagline" placeholder="Safer Food. Stronger Tomorrow." large />
              </div>
              <div class="fr2">
                <AppInput v-model="form.brand_primary_color" label="Primary Color" type="color" large />
                <AppInput v-model="form.brand_secondary_color" label="Secondary Color" type="color" large />
              </div>
            </div>

            <!-- 2. Homepage Content Tab -->
            <div v-if="activeCategory === 'homepage'" class="fade-in">
              <h2 class="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                <i class="mdi mdi-home-outline text-indigo-600"></i> Homepage Content &amp; Banner
              </h2>
              <p class="text-sm text-slate-500 mb-6">Manage hero section titles, about paragraphs, and public homepage images.</p>

              <v-card variant="outlined" class="rounded-xl pa-6 mb-6">
                <h3 class="text-subtitle-1 font-weight-bold mb-4">Text Content</h3>
                
                <div class="mb-4">
                  <AppInput v-model="form.homepage_title" label="Main Title" placeholder="KEFTA National Food Tech Talent Hunt 2026" large />
                </div>
                <div class="mb-4">
                  <v-textarea v-model="form.homepage_subtitle" label="Subtitle" placeholder="Discovering, motivating, and supporting emerging food science talents across the nation." variant="outlined" auto-grow rows="2" />
                </div>
                <div class="mb-4">
                  <AppInput v-model="form.homepage_about_title" label="About Section Title" placeholder="About the Competition" large />
                </div>
                <div class="mb-4">
                  <v-textarea v-model="form.homepage_about_description" label="About Section Description" placeholder="Enter paragraph text here..." variant="outlined" auto-grow rows="4" />
                </div>
                <div class="mb-4">
                  <v-textarea v-model="form.homepage_bullets" label="About Section Bullets (One per line)" placeholder="Promote scientific temperament..." variant="outlined" auto-grow rows="4" />
                </div>
                <div class="mb-4">
                  <AppInput v-model="form.homepage_footer_text" label="Footer Text" placeholder="All assessments will be conducted..." large />
                </div>
              </v-card>

              <!-- Hero Image Upload -->
              <v-card variant="outlined" class="rounded-xl pa-6 mb-6">
                <div class="d-flex align-center mb-4">
                  <v-avatar color="primary" size="40" class="mr-3">
                    <v-icon color="white" size="20">mdi-image-area</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">Hero Section Image</div>
                    <div class="text-caption text-secondary">Shown on the right side of the main hero banner</div>
                  </div>
                </div>

                <div v-if="form.homepage_hero_image" class="mb-4">
                  <img
                    :src="form.homepage_hero_image?.startsWith('/') ? (baseUrl + form.homepage_hero_image) : form.homepage_hero_image"
                    alt="Hero Image Preview"
                    style="width:100%; max-height:200px; object-fit:cover; border-radius:12px; border:1px solid rgba(0,0,0,0.08);"
                  />
                </div>
                <div v-else class="mb-4 pa-6 rounded-xl d-flex align-center justify-center" style="background:#f8f9fc; border:1px dashed rgba(0,0,0,0.12); min-height:120px;">
                  <div class="text-center text-secondary">
                    <v-icon size="40" color="grey-lighten-2" class="mb-2">mdi-image-outline</v-icon>
                    <div class="text-caption">No image set — using default</div>
                  </div>
                </div>

                <v-row>
                  <v-col cols="12" md="6">
                    <v-file-input
                      v-model="heroImageFile"
                      accept="image/*"
                      label="Upload new hero image"
                      variant="outlined"
                      density="compact"
                      prepend-icon=""
                      prepend-inner-icon="mdi-upload"
                      hide-details
                      class="mb-3"
                    />
                    <v-btn color="primary" variant="tonal" rounded="lg" size="small" :loading="saving" @click="uploadHomepageImages" class="text-none">
                      <v-icon start>mdi-cloud-upload</v-icon> Upload Hero Image
                    </v-btn>
                  </v-col>
                  <v-col cols="12" md="6">
                    <AppInput
                      v-model="form.homepage_hero_image_url"
                      label="Or paste image URL"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </v-col>
                </v-row>
              </v-card>
            </div>

            <!-- 3. Organization & Legal Tab -->
            <div v-if="activeCategory === 'terms_privacy'" class="fade-in">
              <h2 class="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                <i class="mdi mdi-shield-lock-outline text-emerald-600"></i> Organization &amp; Governance Content
              </h2>
              <p class="text-sm text-slate-500 mb-6">Manage dynamic text and policy parameters for all public governance pages.</p>
              
              <!-- Section 1: Advisory Board & Panel -->
              <v-card variant="outlined" class="rounded-xl pa-6 mb-6">
                <h3 class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center gap-2">
                  <v-icon color="red-darken-1" size="20">mdi-shield-account-outline</v-icon>
                  Advisory Board &amp; Panel Page
                </h3>
                <div class="fr2 mb-4">
                  <AppInput v-model="form.advisory_board_title" label="Page Title" placeholder="Advisory Board & Panel" large />
                  <AppInput v-model="form.advisory_board_subtitle" label="Subtitle" placeholder="Independent international experts..." large />
                </div>
                <v-textarea v-model="form.advisory_board_content" label="Main Body Content (Overrides Default)" rows="5" variant="outlined" auto-grow placeholder="Enter custom overview content for the Advisory Board page..." />
              </v-card>

              <!-- Section 2: Global Standards Council -->
              <v-card variant="outlined" class="rounded-xl pa-6 mb-6">
                <h3 class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center gap-2">
                  <v-icon color="red-darken-1" size="20">mdi-earth</v-icon>
                  Global Standards Council Page
                </h3>
                <div class="fr2 mb-4">
                  <AppInput v-model="form.council_title" label="Page Title" placeholder="Global Standards Council" large />
                  <AppInput v-model="form.council_subtitle" label="Subtitle" placeholder="Formulating and benchmarking qualification standards..." large />
                </div>
                <v-textarea v-model="form.council_content" label="Main Body Content (Overrides Default)" rows="5" variant="outlined" auto-grow placeholder="Enter custom overview content for the Global Standards Council page..." />
              </v-card>

              <!-- Section 3: Cookie Preferences & Policy -->
              <v-card variant="outlined" class="rounded-xl pa-6 mb-6">
                <h3 class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center gap-2">
                  <v-icon color="red-darken-1" size="20">mdi-cookie-outline</v-icon>
                  Cookie Preferences Policy Text
                </h3>
                <v-textarea v-model="form.cookie_policy_content" label="Cookie Policy Notice Content" rows="4" variant="outlined" auto-grow placeholder="Enter details regarding cookie usage..." />
              </v-card>

              <!-- Section 4: Terms of Service & Privacy Policy -->
              <v-card variant="outlined" class="rounded-xl pa-6 mb-6">
                <h3 class="text-subtitle-1 font-weight-bold mb-4 d-flex align-center gap-2">
                  <v-icon color="red-darken-1" size="20">mdi-scale-balance</v-icon>
                  Terms of Service &amp; Privacy Policy
                </h3>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-textarea v-model="form.terms_content" label="Terms &amp; Conditions Content" rows="6" variant="outlined" auto-grow class="mb-3" placeholder="Enter terms content..." />
                    <AppInput v-model="form.terms_version" label="Terms &amp; Conditions Version" placeholder="1.0" large />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-textarea v-model="form.privacy_content" label="Privacy Policy Content" rows="6" variant="outlined" auto-grow class="mb-3" placeholder="Enter privacy policy content..." />
                    <AppInput v-model="form.privacy_version" label="Privacy Policy Version" placeholder="1.0" large />
                  </v-col>
                </v-row>
              </v-card>
            </div>

            <!-- 4. Contact Info Tab -->
            <div v-if="activeCategory === 'contact'" class="fade-in">
              <h2 class="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <i class="mdi mdi-map-marker-outline text-amber-600"></i> Contact &amp; Institution Details
              </h2>
              <div class="fr2 mb-4">
                <AppInput v-model="form.contact_email" label="Contact Email" placeholder="contact@gsfin.org" large />
                <AppInput v-model="form.contact_phone" label="Contact Phone" placeholder="+44 20 7946 0912" large />
              </div>
              <div class="mb-6">
                <AppInput v-model="form.contact_address" label="Institution Address" placeholder="123 International Standards Avenue, London, UK" large />
              </div>
            </div>

            <!-- 5. Email (Resend) Tab -->
            <div v-if="activeCategory === 'email'" class="fade-in">
              <h2 class="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                <i class="mdi mdi-email-fast-outline text-blue-600"></i> Email Settings (Resend REST API)
              </h2>
              <p class="text-xs text-slate-500 mb-6">Configure credentials for email dispatches via HTTPS REST API (Port 443).</p>

              <div class="pa-4 rounded-xl mb-6 text-body-2" style="background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af;">
                <div class="d-flex align-center gap-2 mb-1 font-weight-bold">
                  <v-icon icon="mdi-information-outline" size="18" color="primary" class="me-1"></v-icon>
                  Resend Configuration Guide
                </div>
                <div>
                  • Get your API Key from your <a href="https://resend.com/api-keys" target="_blank" class="text-primary font-weight-bold" style="text-decoration: underline;">Resend Dashboard</a>.
                </div>
              </div>

              <div class="mb-4">
                <AppInput
                  v-model="form.resend_api_key"
                  label="Resend API Key"
                  type="password"
                  placeholder="re_123456789..."
                  large
                />
              </div>

              <div class="fr2 mb-6">
                <AppInput
                  v-model="form.smtp_from_name"
                  label="From Name"
                  placeholder="GSFIN International Authority"
                  large
                />
                <AppInput
                  v-model="form.smtp_from_email"
                  label="From Email Address"
                  placeholder="noreply@gsfin.org"
                  large
                />
              </div>

              <v-divider class="my-6" />

              <div class="d-flex align-center justify-space-between flex-wrap gap-4">
                <div>
                  <div class="text-subtitle-2 font-weight-bold">Test Email Delivery</div>
                  <div class="text-caption text-secondary">Send a test notification to verify your credentials.</div>
                </div>
                <AppButton variant="g" icon="mdi-send-outline" :loading="testingEmail" @click="testEmail">
                  Send Test Email
                </AppButton>
              </div>
            </div>

            <!-- 6. Email Templates Tab -->
            <div v-if="activeCategory === 'email_templates'" class="fade-in">
              <EmailTemplatesTab />
            </div>

            <!-- 7. Talent Hunt Tab -->
            <div v-if="activeCategory === 'talent_hunt'" class="fade-in">
              <TalentHuntSettingsTab />
            </div>

            <!-- Bottom Action Controls -->
            <div class="d-flex justify-end gap-3 mt-10 pt-6 border-t" v-if="activeCategory !== 'email_templates'">
              <AppButton variant="g" size="lg" icon="mdi-refresh" @click="fetchData">
                Reset Changes
              </AppButton>
              <AppButton type="submit" :loading="saving" size="lg" icon="mdi-check" @click.prevent="save">
                Save All Settings
              </AppButton>
            </div>

          </v-form>
        </div>

      </div>

    </div>

    <!-- Notification Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="lg" timeout="3000">
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import EmailTemplatesTab from '@/components/admin/settings/EmailTemplatesTab.vue';
import TalentHuntSettingsTab from '@/components/admin/settings/TalentHuntSettingsTab.vue';
import { provide } from 'vue';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'main_admin']
});

const route = useRoute();
const router = useRouter();
const api = useApi();
const config = useRuntimeConfig();
const baseUrl = computed(() => config.public.apiBase.replace('/api', ''));

const activeCategory = ref<string | null>(null);
const cardSearch = ref('');
const saving = ref(false);
const testingEmail = ref(false);
const form = ref<any>({});
provide('configForm', form);

const logoFile = ref(null);
const faviconFile = ref(null);
const heroImageFile = ref(null);

const snackbar = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref('success');

// 8 Settings Module Cards Grid Definition
const settingsCards = [
  {
    id: 'branding',
    title: 'Branding & Identity',
    subtitle: 'Manage platform logos, favicons, primary/secondary brand colors, and institution details.',
    icon: 'mdi-palette-outline',
    iconBg: 'bg-red-50 text-red-600 border-red-200',
    badge: 'Branding',
    badgeColor: 'bg-red-50 text-red-600 border-red-200'
  },
  {
    id: 'homepage',
    title: 'Homepage & Hero',
    subtitle: 'Customize public hero text, about section, bullet points, and banner images.',
    icon: 'mdi-home-outline',
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    badge: 'Public Content',
    badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-200'
  },
  {
    id: 'terms_privacy',
    title: 'Organization & Governance',
    subtitle: 'Edit content for Advisory Board, Global Standards Council, Cookie Policy, Terms, and Privacy.',
    icon: 'mdi-shield-lock-outline',
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    badge: 'Governance',
    badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200'
  },
  {
    id: 'system_users',
    title: 'System Users & Roles',
    subtitle: 'Manage administrator accounts, team members, staff roles, and permissions.',
    icon: 'mdi-account-group-outline',
    iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
    badge: 'Access Control',
    badgeColor: 'bg-purple-50 text-purple-600 border-purple-200',
    isExternalRoute: '/dashboard/admin/settings/system-users'
  },
  {
    id: 'contact',
    title: 'Contact Information',
    subtitle: 'Update institutional email addresses, phone numbers, and physical office locations.',
    icon: 'mdi-map-marker-outline',
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    badge: 'Support',
    badgeColor: 'bg-amber-50 text-amber-600 border-amber-200'
  },
  {
    id: 'email',
    title: 'Email Settings (Resend)',
    subtitle: 'Configure Resend REST API keys, From Name, From Email, and dispatch test notifications.',
    icon: 'mdi-email-fast-outline',
    iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
    badge: 'Email Dispatch',
    badgeColor: 'bg-blue-50 text-blue-600 border-blue-200'
  },
  {
    id: 'email_templates',
    title: 'Email Templates',
    subtitle: 'Customize automated transactional email templates for registrations, exams, and credentials.',
    icon: 'mdi-email-edit-outline',
    iconBg: 'bg-teal-50 text-teal-600 border-teal-200',
    badge: 'Templates',
    badgeColor: 'bg-teal-50 text-teal-600 border-teal-200'
  },
  {
    id: 'talent_hunt',
    title: 'Talent Hunt Settings',
    subtitle: 'Manage competition dropdown categories, degree levels, and registration parameters.',
    icon: 'mdi-account-star-outline',
    iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
    badge: 'Competition',
    badgeColor: 'bg-rose-50 text-rose-600 border-rose-200'
  }
];

const filteredCards = computed(() => {
  if (!cardSearch.value.trim()) return settingsCards;
  const q = cardSearch.value.toLowerCase().trim();
  return settingsCards.filter(c => 
    c.title.toLowerCase().includes(q) || 
    c.subtitle.toLowerCase().includes(q) ||
    c.badge.toLowerCase().includes(q)
  );
});

const currentCategoryObj = computed(() => {
  return settingsCards.find(c => c.id === activeCategory.value);
});

const selectCategory = (card: any) => {
  if (card.isExternalRoute) {
    router.push(card.isExternalRoute);
    return;
  }
  activeCategory.value = card.id;
  router.replace({ query: { tab: card.id } });
};

const backToOverview = () => {
  activeCategory.value = null;
  router.replace({ query: {} });
};

const fetchData = async () => {
  try {
    const { data } = await api.get('/admin/config');
    const configMap: any = {};
    data.forEach((item: any) => {
      configMap[item.key] = item.value;
    });
    form.value = configMap;
  } catch (err) {
    console.error('Failed to fetch config');
  }
};

const uploadBranding = async () => {
  if (!logoFile.value && !faviconFile.value) return;
  saving.value = true;
  const formData = new FormData();
  const logo = Array.isArray(logoFile.value) ? logoFile.value[0] : logoFile.value;
  const favicon = Array.isArray(faviconFile.value) ? faviconFile.value[0] : faviconFile.value;
  if (logo) formData.append('logo', logo);
  if (favicon) formData.append('favicon', favicon);

  try {
    const { data } = await api.post('/admin/config/branding/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (data.updates.app_logo) form.value.app_logo = data.updates.app_logo;
    if (data.updates.app_favicon) form.value.app_favicon = data.updates.app_favicon;
    snackbarMessage.value = 'Branding assets uploaded successfully';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (err) {
    snackbarMessage.value = 'Failed to upload images';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    saving.value = false;
  }
};

const uploadHomepageImages = async () => {
  if (!heroImageFile.value) return;
  saving.value = true;
  const formData = new FormData();
  const hero = Array.isArray(heroImageFile.value) ? heroImageFile.value[0] : heroImageFile.value;
  if (hero) formData.append('hero_image', hero);

  try {
    const { data } = await api.post('/admin/config/branding/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (data.updates.homepage_hero_image) form.value.homepage_hero_image = data.updates.homepage_hero_image;
    snackbarMessage.value = 'Homepage image uploaded successfully';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (err) {
    snackbarMessage.value = 'Failed to upload image';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    saving.value = false;
  }
};

const save = async () => {
  saving.value = true;
  try {
    await api.put('/admin/config', form.value);
    snackbarMessage.value = 'Settings saved successfully!';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (err) {
    snackbarMessage.value = 'Failed to save settings';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    saving.value = false;
  }
};

const testEmail = async () => {
  try {
    testingEmail.value = true;
    const { data } = await api.post('/admin/config/test-email');
    snackbarMessage.value = data?.message || 'Test email dispatched successfully!';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (err: any) {
    snackbarMessage.value = err.response?.data?.message || 'Failed to send test email.';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    testingEmail.value = false;
  }
};

onMounted(() => {
  fetchData();
  if (route.query.tab) {
    activeCategory.value = String(route.query.tab);
  }
});

watch(
  () => route.query.tab,
  (newTab) => {
    activeCategory.value = newTab ? String(newTab) : null;
  }
);
</script>

<style scoped>
.gsfin-admin-page {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
}
.fr2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 640px) { .fr2 { grid-template-columns: 1fr; } }
.fade-in { animation: fadeIn 0.25s ease-in-out; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.custom-scrollbar::-webkit-scrollbar { height: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
</style>
