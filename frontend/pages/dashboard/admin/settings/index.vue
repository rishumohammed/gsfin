<template>
  <div class="gsfin-admin-page">
    <div class="settings-wrap">

      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- VIEW 1: CARD VIEW OVERVIEW HUB (DEFAULT WHEN NO CATEGORY SELECTED) -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <div v-if="!activeCategory" class="fade-in">
        
        <!-- Header Row -->
        <div class="settings-header-row">
          <div>
            <div class="control-panel-chip">
              <i class="mdi mdi-cog-outline"></i> CONTROL PANEL
            </div>
            <h1 class="settings-title">System Settings</h1>
            <p class="settings-subtitle">
              Configure branding, homepage content, governance legal text, system users, integrations, and email dispatches.
            </p>
          </div>

          <!-- Quick Search Filter Bar -->
          <div class="search-input-wrap">
            <i class="mdi mdi-magnify search-icon"></i>
            <input
              v-model="cardSearch"
              type="text"
              placeholder="Search setting modules..."
              class="settings-search-input"
            />
          </div>
        </div>

        <!-- Cards Directory Grid -->
        <div class="settings-cards-grid">
          <div
            v-for="card in filteredCards"
            :key="card.id"
            class="settings-card group"
            @click="selectCategory(card)"
          >
            <div class="card-content-top">
              <!-- Top Row: Icon & Tag -->
              <div class="card-header-row">
                <div :class="['card-icon-box', card.iconClass]">
                  <i :class="`mdi ${card.icon}`"></i>
                </div>
                <span :class="['card-badge-pill', card.badgeClass]">
                  {{ card.badge }}
                </span>
              </div>

              <!-- Title & Description -->
              <h3 class="card-title">
                <span>{{ card.title }}</span>
                <i class="mdi mdi-chevron-right card-arrow"></i>
              </h3>
              <p class="card-subtitle">
                {{ card.subtitle }}
              </p>
            </div>

            <!-- Card Bottom Link -->
            <div class="card-footer-bar">
              <span>Configure Module</span>
              <i class="mdi mdi-arrow-right card-footer-arrow"></i>
            </div>
          </div>
        </div>

      </div>


      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- VIEW 2: INNER PAGE PANEL VIEW (WHEN A CATEGORY CARD IS SELECTED)   -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <div v-else class="fade-in">
        
        <!-- Breadcrumb & Top Navigation Bar -->
        <div class="inner-header-bar">
          <div class="breadcrumb-row">
            <button class="btn-back" @click="backToOverview">
              <i class="mdi mdi-arrow-left"></i>
              <span>Back to All Settings</span>
            </button>
            <div class="breadcrumb-divider"></div>
            <div class="breadcrumb-text">
              Settings <span class="bc-slash">/</span> <span class="bc-current">{{ currentCategoryObj?.title }}</span>
            </div>
          </div>

          <!-- Quick Category Switcher Pills -->
          <div class="category-pills-row custom-scrollbar">
            <button
              v-for="c in settingsCards"
              :key="c.id"
              @click="selectCategory(c)"
              :class="['pill-btn', { 'pill-btn--active': activeCategory === c.id }]"
            >
              <i :class="`mdi ${c.icon}`"></i> {{ c.title.split(' ')[0] }}
            </button>
          </div>
        </div>

        <!-- Inner Form Container Card -->
        <div class="inner-form-card">
          <v-form @submit.prevent="save">

            <!-- 1. Branding & Identity Tab -->
            <div v-if="activeCategory === 'branding'" class="fade-in">
              <h2 class="form-section-title">
                <i class="mdi mdi-palette-outline text-red"></i> Branding &amp; Platform Identity
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
              <h2 class="form-section-title">
                <i class="mdi mdi-home-outline text-indigo"></i> Homepage Content &amp; Banner
              </h2>
              <p class="form-section-subtitle">Manage hero section titles, about paragraphs, and public homepage images.</p>

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
              <h2 class="form-section-title">
                <i class="mdi mdi-shield-lock-outline text-emerald"></i> Organization &amp; Governance Content
              </h2>
              <p class="form-section-subtitle">Manage dynamic text and policy parameters for all public governance pages.</p>
              
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
              <h2 class="form-section-title">
                <i class="mdi mdi-map-marker-outline text-amber"></i> Contact &amp; Institution Details
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
              <h2 class="form-section-title">
                <i class="mdi mdi-email-fast-outline text-blue"></i> Email Settings (Resend REST API)
              </h2>
              <p class="form-section-subtitle">Configure credentials for email dispatches via HTTPS REST API (Port 443).</p>

              <div class="info-callout mb-6">
                <div class="info-callout-title">
                  <i class="mdi mdi-information-outline me-1"></i> Resend Configuration Guide
                </div>
                <div class="info-callout-body">
                  • Get your API Key from your <a href="https://resend.com/api-keys" target="_blank" class="info-link">Resend Dashboard</a>.
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
                <button type="button" class="btn-glass" :disabled="testingEmail" @click="testEmail">
                  <i :class="['mdi', testingEmail ? 'mdi-loading spin-icon' : 'mdi-send-outline']"></i> Send Test Email
                </button>
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
            <div class="form-bottom-actions" v-if="activeCategory !== 'email_templates'">
              <button type="button" class="btn-glass" @click="fetchData">
                <i class="mdi mdi-refresh"></i> Reset Changes
              </button>
              <button type="submit" class="btn-red" :disabled="saving" @click.prevent="save">
                <i :class="['mdi', saving ? 'mdi-loading spin-icon' : 'mdi-check']"></i> {{ saving ? 'Saving...' : 'Save All Settings' }}
              </button>
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
import { ref, onMounted, computed, watch, provide } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import EmailTemplatesTab from '@/components/admin/settings/EmailTemplatesTab.vue';
import TalentHuntSettingsTab from '@/components/admin/settings/TalentHuntSettingsTab.vue';

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
    iconClass: 'card-icon-red',
    badge: 'Branding',
    badgeClass: 'badge-red'
  },
  {
    id: 'homepage',
    title: 'Homepage & Hero',
    subtitle: 'Customize public hero text, about section, bullet points, and banner images.',
    icon: 'mdi-home-outline',
    iconClass: 'card-icon-indigo',
    badge: 'Public Content',
    badgeClass: 'badge-indigo'
  },
  {
    id: 'terms_privacy',
    title: 'Organization & Governance',
    subtitle: 'Edit content for Advisory Board, Global Standards Council, Cookie Policy, Terms, and Privacy.',
    icon: 'mdi-shield-lock-outline',
    iconClass: 'card-icon-emerald',
    badge: 'Governance',
    badgeClass: 'badge-emerald'
  },
  {
    id: 'system_users',
    title: 'System Users & Roles',
    subtitle: 'Manage administrator accounts, team members, staff roles, and permissions.',
    icon: 'mdi-account-group-outline',
    iconClass: 'card-icon-purple',
    badge: 'Access Control',
    badgeClass: 'badge-purple',
    isExternalRoute: '/dashboard/admin/settings/system-users'
  },
  {
    id: 'contact',
    title: 'Contact Information',
    subtitle: 'Update institutional email addresses, phone numbers, and physical office locations.',
    icon: 'mdi-map-marker-outline',
    iconClass: 'card-icon-amber',
    badge: 'Support',
    badgeClass: 'badge-amber'
  },
  {
    id: 'email',
    title: 'Email Settings (Resend)',
    subtitle: 'Configure Resend REST API keys, From Name, From Email, and dispatch test notifications.',
    icon: 'mdi-email-fast-outline',
    iconClass: 'card-icon-blue',
    badge: 'Email Dispatch',
    badgeClass: 'badge-blue'
  },
  {
    id: 'email_templates',
    title: 'Email Templates',
    subtitle: 'Customize automated transactional email templates for registrations, exams, and credentials.',
    icon: 'mdi-email-edit-outline',
    iconClass: 'card-icon-teal',
    badge: 'Templates',
    badgeClass: 'badge-teal'
  },
  {
    id: 'talent_hunt',
    title: 'Talent Hunt Settings',
    subtitle: 'Manage competition dropdown categories, degree levels, and registration parameters.',
    icon: 'mdi-account-star-outline',
    iconClass: 'card-icon-rose',
    badge: 'Competition',
    badgeClass: 'badge-rose'
  },
  {
    id: 'faqs',
    title: 'FAQ Management',
    subtitle: 'Create, edit, reorder, and publish frequently asked questions for public and candidate help centers.',
    icon: 'mdi-help-circle-outline',
    iconClass: 'card-icon-cyan',
    badge: 'Help Center',
    badgeClass: 'badge-cyan',
    isExternalRoute: '/dashboard/admin/faqs'
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
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  background: #FAFAFD;
  color: #0F172A;
  min-height: 100vh;
  padding: 32px 36px;
  box-sizing: border-box;
}

.settings-wrap {
  max-width: 1280px;
  margin: 0 auto;
}

/* Header Row */
.settings-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.control-panel-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(227, 27, 35, 0.08);
  color: #E31B23;
  border: 1px solid rgba(227, 27, 35, 0.18);
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.settings-title {
  font-size: 1.95rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0 0 6px 0;
  letter-spacing: -0.02em;
}

.settings-subtitle {
  font-size: 0.9rem;
  color: #64748B;
  margin: 0;
  max-width: 680px;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #94A3B8;
  font-size: 1.1rem;
  pointer-events: none;
}

.settings-search-input {
  padding: 10px 14px 10px 42px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  font-size: 0.88rem;
  color: #0F172A;
  outline: none;
  width: 280px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.settings-search-input:focus {
  border-color: #E31B23;
  box-shadow: 0 4px 12px rgba(227, 27, 35, 0.12);
}

/* Settings Cards Grid */
.settings-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 40px;
}
@media (max-width: 1080px) { .settings-cards-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .settings-cards-grid { grid-template-columns: 1fr; } }

.settings-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
  cursor: pointer;
  transition: all 0.22s ease;
}
.settings-card:hover {
  transform: translateY(-3px);
  border-color: rgba(227, 27, 35, 0.3);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.07);
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  border: 1px solid transparent;
  transition: transform 0.2s ease;
}
.settings-card:hover .card-icon-box {
  transform: scale(1.05);
}

.card-icon-red { background: rgba(227, 27, 35, 0.08); color: #E31B23; border-color: rgba(227, 27, 35, 0.15); }
.card-icon-indigo { background: rgba(79, 70, 229, 0.08); color: #4F46E5; border-color: rgba(79, 70, 229, 0.15); }
.card-icon-emerald { background: rgba(16, 185, 129, 0.08); color: #059669; border-color: rgba(16, 185, 129, 0.15); }
.card-icon-purple { background: rgba(147, 51, 234, 0.08); color: #9333EA; border-color: rgba(147, 51, 234, 0.15); }
.card-icon-amber { background: rgba(245, 158, 11, 0.08); color: #D97706; border-color: rgba(245, 158, 11, 0.15); }
.card-icon-blue { background: rgba(37, 99, 235, 0.08); color: #2563EB; border-color: rgba(37, 99, 235, 0.15); }
.card-icon-teal { background: rgba(13, 148, 136, 0.08); color: #0D9488; border-color: rgba(13, 148, 136, 0.15); }
.card-icon-rose { background: rgba(225, 29, 72, 0.08); color: #E11D48; border-color: rgba(225, 29, 72, 0.15); }
.card-icon-cyan { background: rgba(6, 182, 212, 0.08); color: #0891B2; border-color: rgba(6, 182, 212, 0.15); }

.card-badge-pill {
  padding: 4px 10px;
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border: 1px solid transparent;
}
.badge-red { background: rgba(227, 27, 35, 0.08); color: #E31B23; border-color: rgba(227, 27, 35, 0.15); }
.badge-indigo { background: rgba(79, 70, 229, 0.08); color: #4F46E5; border-color: rgba(79, 70, 229, 0.15); }
.badge-emerald { background: rgba(16, 185, 129, 0.08); color: #059669; border-color: rgba(16, 185, 129, 0.15); }
.badge-purple { background: rgba(147, 51, 234, 0.08); color: #9333EA; border-color: rgba(147, 51, 234, 0.15); }
.badge-amber { background: rgba(245, 158, 11, 0.08); color: #D97706; border-color: rgba(245, 158, 11, 0.15); }
.badge-blue { background: rgba(37, 99, 235, 0.08); color: #2563EB; border-color: rgba(37, 99, 235, 0.15); }
.badge-teal { background: rgba(13, 148, 136, 0.08); color: #0D9488; border-color: rgba(13, 148, 136, 0.15); }
.badge-rose { background: rgba(225, 29, 72, 0.08); color: #E11D48; border-color: rgba(225, 29, 72, 0.15); }
.badge-cyan { background: rgba(6, 182, 212, 0.08); color: #0891B2; border-color: rgba(6, 182, 212, 0.15); }

.card-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: color 0.2s ease;
}
.settings-card:hover .card-title {
  color: #E31B23;
}
.card-arrow {
  font-size: 1.2rem;
  color: #94A3B8;
  transition: transform 0.2s ease, color 0.2s ease;
}
.settings-card:hover .card-arrow {
  color: #E31B23;
  transform: translateX(3px);
}

.card-subtitle {
  font-size: 0.84rem;
  color: #64748B;
  line-height: 1.55;
  margin: 0 0 20px 0;
}

.card-footer-bar {
  padding-top: 14px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748B;
  transition: color 0.2s ease;
}
.settings-card:hover .card-footer-bar {
  color: #E31B23;
}
.card-footer-arrow {
  transition: transform 0.2s ease;
}
.settings-card:hover .card-footer-arrow {
  transform: translateX(3px);
}

/* Inner Page Panel View */
.inner-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  flex-wrap: wrap;
}

.breadcrumb-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
  transition: all 0.2s ease;
}
.btn-back:hover {
  background: #F1F5F9;
  color: #0F172A;
}

.breadcrumb-divider {
  width: 1px;
  height: 20px;
  background: rgba(15, 23, 42, 0.15);
}

.breadcrumb-text {
  font-size: 0.84rem;
  font-weight: 700;
  color: #64748B;
}
.bc-slash { margin: 0 6px; color: #94A3B8; }
.bc-current { color: #0F172A; }

.category-pills-row {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  max-width: 100%;
  padding-bottom: 4px;
}

.pill-btn {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 6px 14px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748B;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.pill-btn:hover {
  background: #F8FAFC;
  color: #0F172A;
}
.pill-btn--active {
  background: #E31B23 !important;
  color: #FFFFFF !important;
  border-color: #E31B23 !important;
  box-shadow: 0 2px 8px rgba(227, 27, 35, 0.25);
}

.inner-form-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  padding: 32px 36px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.02);
}

.form-section-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0 0 6px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.form-section-subtitle {
  font-size: 0.88rem;
  color: #64748B;
  margin: 0 0 24px 0;
}

.text-red { color: #E31B23; }
.text-indigo { color: #4F46E5; }
.text-emerald { color: #059669; }
.text-amber { color: #D97706; }
.text-blue { color: #2563EB; }

.info-callout {
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 14px;
  padding: 16px 20px;
  color: #1E40AF;
  font-size: 0.88rem;
}
.info-callout-title {
  font-weight: 800;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}
.info-callout-body {
  font-weight: 500;
}
.info-link {
  color: #2563EB;
  font-weight: 700;
  text-decoration: underline;
}

.form-bottom-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.btn-red {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  padding: 10px 22px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.88rem;
  box-shadow: 0 3px 10px rgba(227, 27, 35, 0.2);
  transition: all 0.2s ease;
  cursor: pointer;
}
.btn-red:hover {
  background: #C4131B;
  transform: translateY(-1px);
}

.btn-glass {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #F1F5F9;
  color: #334155;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-glass:hover {
  background: #E2E8F0;
}

.fr2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 640px) { .fr2 { grid-template-columns: 1fr; } }

.fade-in { animation: fadeIn 0.25s ease-in-out; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.spin-icon { animation: spin 0.75s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.custom-scrollbar::-webkit-scrollbar { height: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
</style>
