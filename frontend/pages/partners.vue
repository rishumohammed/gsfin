<template>
  <div class="gsfin-page">

    <!-- ═══ NAVBAR ═══ -->
    <PublicNavbar @open-partner-modal="openPartnerModal()" />

    <!-- ═══ HERO HEADER ═══ -->
    <section class="partners-hero">
      <div class="hero-bg-layer" style="background-image: url('/hero-bk.png');"></div>
      <div class="hero-glass-overlay"></div>

      <!-- Ambient Glass Blur Glow Orbs -->
      <div class="hero-blur blur-1"></div>
      <div class="hero-blur blur-2"></div>

      <div class="page-wrap hero-container">
        <div class="hero-center-content">
          <span class="eyebrow-red mb-2">
            <i class="mdi mdi-check-decagram-outline me-1"></i> GLOBAL ACCREDITATION DIRECTORY
          </span>

          <h1 class="hero-title">
            Authorized GSFIN <span class="text-red">Partner Centers</span>
          </h1>

          <p class="hero-sub">
            Search and verify accredited training centers, universities, and examination authorities worldwide. Every authorized center undergoes rigorous audit evaluation to deliver official GSFIN qualifications.
          </p>

          <!-- Micro-Trust Bar -->
          <div class="hero-trust-bar">
            <div class="trust-pill">
              <i class="mdi mdi-domain text-red"></i>
              <span><strong>{{ filteredPartners.length }}</strong> Accredited Centers</span>
            </div>
            <div class="trust-pill">
              <i class="mdi mdi-earth text-blue"></i>
              <span><strong>14+</strong> Countries</span>
            </div>
            <div class="trust-pill">
              <i class="mdi mdi-qrcode-scan text-emerald"></i>
              <span><strong>100%</strong> QR Verified</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ MAIN DIRECTORY & FILTERS SECTION ═══ -->
    <section class="section-directory">
      <div class="page-wrap">

        <!-- Search & Filter Glass Bar -->
        <div class="filter-glass-bar">
          
          <!-- Top Row: Search Input & Main Category -->
          <div class="filter-top-row">
            
            <!-- Search Box -->
            <div class="search-input-wrap">
              <i class="mdi mdi-magnify search-icon"></i>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by center name, city, country, or center code (e.g. GSFIN-ATC-102)..."
                class="search-input"
              />
              <button v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''" title="Clear Search">
                <i class="mdi mdi-close"></i>
              </button>
            </div>

            <!-- Country Dropdown (Hidden if empty) -->
            <div v-if="availableCountries.length > 0" class="select-wrap">
              <i class="mdi mdi-map-marker-outline select-icon"></i>
              <select v-model="selectedCountry" class="filter-select">
                <option value="">All Countries ({{ availableCountries.length }})</option>
                <option v-for="c in availableCountries" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>

          </div>

          <!-- Bottom Row: Institution Type, Program, Sort, Clear -->
          <div class="filter-bottom-row">

            <!-- Institution Type (Hidden if empty) -->
            <div v-if="availableTypes.length > 0" class="select-wrap">
              <i class="mdi mdi-school-outline select-icon"></i>
              <select v-model="selectedType" class="filter-select">
                <option value="">All Institution Types ({{ availableTypes.length }})</option>
                <option v-for="t in availableTypes" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>

            <!-- Qualification Program Filter (Hidden if empty) -->
            <div v-if="availablePrograms.length > 0" class="select-wrap">
              <i class="mdi mdi-certificate-outline select-icon"></i>
              <select v-model="selectedProgram" class="filter-select">
                <option value="">All Qualification Programs ({{ availablePrograms.length }})</option>
                <option v-for="pr in availablePrograms" :key="pr" :value="pr">{{ pr }}</option>
              </select>
            </div>

            <!-- Sort By -->
            <div class="select-wrap">
              <i class="mdi mdi-sort-variant select-icon"></i>
              <select v-model="sortBy" class="filter-select">
                <option value="name-asc">Name (A – Z)</option>
                <option value="name-desc">Name (Z – A)</option>
                <option value="country">Country</option>
                <option value="code">Center Code</option>
              </select>
            </div>

            <!-- Reset Button -->
            <button
              v-if="hasActiveFilters"
              class="btn-reset-filters"
              @click="resetFilters"
            >
              <i class="mdi mdi-refresh"></i> Reset Filters
            </button>

          </div>

          <!-- Active Filter Chips Bar -->
          <div v-if="hasActiveFilters" class="active-chips-row">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Filters:</span>
            
            <span v-if="searchQuery" class="filter-chip">
              Search: "{{ searchQuery }}"
              <i class="mdi mdi-close" @click="searchQuery = ''"></i>
            </span>

            <span v-if="selectedCountry" class="filter-chip">
              Country: {{ selectedCountry }}
              <i class="mdi mdi-close" @click="selectedCountry = ''"></i>
            </span>

            <span v-if="selectedType" class="filter-chip">
              Type: {{ selectedType }}
              <i class="mdi mdi-close" @click="selectedType = ''"></i>
            </span>

            <span v-if="selectedProgram" class="filter-chip">
              Program: {{ selectedProgram }}
              <i class="mdi mdi-close" @click="selectedProgram = ''"></i>
            </span>
          </div>

        </div>

        <!-- Results Counter & Status Summary -->
        <div class="results-header-row">
          <div class="results-count">
            Showing <span class="font-black text-slate-900">{{ filteredPartners.length }}</span> of {{ partners.length }} Authorized Partner Centers
          </div>
          <div class="verified-tag-legend">
            <span class="legend-dot bg-emerald-500"></span>
            <span class="text-xs text-slate-600 font-semibold">All listed centers are active &amp; audit-verified</span>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredPartners.length === 0" class="empty-state-box">
          <div class="empty-icon-circle">
            <i class="mdi mdi-domain-off"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-2">No Partner Centers Found</h3>
          <p class="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            We couldn't find any accredited training centers matching your search criteria. Try clearing your filters or searching for a different country.
          </p>
          <button class="btn-red px-6 py-2.5 rounded-xl font-bold text-sm" @click="resetFilters">
            Clear All Filters
          </button>
        </div>

        <!-- Partner Cards Directory Grid -->
        <div v-else class="partners-grid">
          <div
            v-for="partner in filteredPartners"
            :key="partner.id"
            class="partner-card"
          >
            <!-- Card Top Bar Accent -->
            <div class="partner-card-accent"></div>

            <div class="partner-card-body">
              
              <!-- Header Row: Verification Badge & Center ID -->
              <div class="card-header-row">
                <span class="center-id-badge">
                  <i class="mdi mdi-pound"></i> {{ partner.centerCode }}
                </span>
                <span class="verified-status-badge">
                  <i class="mdi mdi-check-decagram text-emerald-500 me-1"></i> Verified
                </span>
              </div>

              <!-- Center Name -->
              <h3 class="partner-name">
                {{ partner.name }}
              </h3>

              <!-- Location & Type -->
              <div class="partner-meta-row">
                <div class="meta-item">
                  <i class="mdi mdi-map-marker-outline text-red me-1"></i>
                  <span>{{ partner.city }}, <strong>{{ partner.country }}</strong></span>
                </div>
                <div class="meta-item">
                  <i class="mdi mdi-school-outline text-blue me-1"></i>
                  <span>{{ partner.institutionType }}</span>
                </div>
              </div>

              <hr class="card-divider" />

              <!-- Accredited Qualification Badges -->
              <div class="programs-section">
                <span class="programs-label">Approved Qualifications:</span>
                <div class="program-badges-wrap">
                  <span
                    v-for="prog in partner.programs"
                    :key="prog"
                    class="prog-badge"
                  >
                    {{ prog }}
                  </span>
                </div>
              </div>

              <!-- Footer Actions -->
              <div class="card-footer-row">
                <button class="btn-card-details" @click="openCenterModal(partner)">
                  Center Details <i class="mdi mdi-chevron-right ms-1"></i>
                </button>
                <button class="btn-card-contact" @click="openContactPartner(partner)">
                  <i class="mdi mdi-email-outline me-1"></i> Contact
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ═══ CTA SECTION ═══ -->
    <section class="cta-section">
      <div class="page-wrap">
        <div class="cta-glass-banner">
          <div class="cta-left">
            <span class="eyebrow-red mb-2">BECOME AN AUTHORIZED CENTER</span>
            <h2 class="cta-title">
              Want to list your institution with <span class="text-red">GSFIN</span>?
            </h2>
            <p class="cta-sub">
              Join our growing global directory of accredited training partners. Offer internationally recognized qualifications in CODEX HACCP, ISO 22000, and Food Safety.
            </p>
            <div class="cta-actions">
              <NuxtLink to="/become-a-partner" class="btn-red">
                Apply for Accreditation <i class="mdi mdi-arrow-right"></i>
              </NuxtLink>
              <NuxtLink to="/qualifications" class="btn-outline-dark">
                View Qualification Packs
              </NuxtLink>
            </div>
          </div>
          <div class="cta-right">
            <div class="cta-slogan-box">
              <div class="cta-slogan-line">Safer Food</div>
              <div class="cta-slogan-line">Stronger People</div>
              <div class="cta-slogan-line text-slate">Brighter Tomorrow</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ GLOBAL PRODUCT FOOTER ═══ -->
    <PublicFooter />

    <!-- ═══ PARTNER DETAILS MODAL ═══ -->
    <Transition name="fade">
      <div v-if="selectedPartnerModal" class="modal-overlay" @click.self="selectedPartnerModal = null">
        <div class="modal-card-box">
          <button class="modal-close-btn" @click="selectedPartnerModal = null" aria-label="Close Modal">
            <i class="mdi mdi-close"></i>
          </button>

          <div class="p-6 sm:p-8">

            <!-- Modal Header -->
            <div class="flex items-center justify-between mb-4">
              <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black flex items-center gap-1">
                <i class="mdi mdi-check-decagram"></i> Official GSFIN Partner
              </span>
              <span class="text-xs font-mono font-bold text-slate-500">
                Center ID: {{ selectedPartnerModal.centerCode }}
              </span>
            </div>

            <h3 class="text-2xl font-black text-slate-900 mb-2">
              {{ selectedPartnerModal.name }}
            </h3>

            <p class="text-xs sm:text-sm text-slate-500 mb-6 flex items-center gap-4">
              <span><i class="mdi mdi-map-marker text-red-500"></i> {{ selectedPartnerModal.city }}, {{ selectedPartnerModal.country }}</span>
              <span><i class="mdi mdi-school text-blue-500"></i> {{ selectedPartnerModal.institutionType }}</span>
            </p>

            <!-- Details Section -->
            <div class="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 mb-6">
              
              <div>
                <span class="block text-xs font-bold text-slate-500 uppercase">Accreditation Status</span>
                <span class="text-sm font-extrabold text-emerald-600">Active &amp; Audit Compliant</span>
              </div>

              <div>
                <span class="block text-xs font-bold text-slate-500 uppercase mb-1">Approved Qualification Programs</span>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="p in selectedPartnerModal.programs"
                    :key="p"
                    class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs"
                  >
                    {{ p }}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span class="block font-bold text-slate-500">Official Email</span>
                  <span class="text-slate-800 font-semibold">{{ selectedPartnerModal.email || 'accreditation@gsfin.org' }}</span>
                </div>
                <div>
                  <span class="block font-bold text-slate-500">Phone / WhatsApp</span>
                  <span class="text-slate-800 font-semibold">{{ selectedPartnerModal.phone || '+44 20 7946 0912' }}</span>
                </div>
              </div>

            </div>

            <!-- Modal Action Buttons -->
            <div class="flex items-center justify-end gap-3">
              <button class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50" @click="selectedPartnerModal = null">
                Close
              </button>
              <NuxtLink to="/become-a-partner" class="btn-red px-6 py-2.5 rounded-xl font-bold text-sm" @click="selectedPartnerModal = null">
                Become a Partner
              </NuxtLink>
            </div>

          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useHead, useState } from '#imports';
import { useApi } from '@/composables/useApi';

useHead({
  title: 'Authorized Partner Centers Directory | GSFIN',
  meta: [
    {
      name: 'description',
      content: 'Search and verify authorized GSFIN training centers, universities, and examination authorities worldwide. Filter by country, qualification program, and accreditation status.',
    },
  ],
});

const api = useApi();
const fullLogoUrl = useState('fullLogoUrl', () => '');
const currentYear = new Date().getFullYear();

// Search & Filter State
const searchQuery = ref('');
const selectedCountry = ref('');
const selectedType = ref('');
const selectedProgram = ref('');
const sortBy = ref('name-asc');
const selectedPartnerModal = ref<any>(null);

// Initial Database of Accredited GSFIN Partner Centers
const partners = ref<any[]>([
  {
    id: 1,
    centerCode: 'GSFIN-ATC-101',
    name: 'Global Food Safety Academy',
    country: 'United Kingdom',
    city: 'London',
    institutionType: 'Authorized Training Center',
    programs: ['CODEX HACCP', 'ISO 22000', 'Food Safety'],
    email: 'london@foodsafetyacademy.uk',
    phone: '+44 20 7946 0111',
  },
  {
    id: 2,
    centerCode: 'GSFIN-ATC-102',
    name: 'Emirates Institute of Food Technology',
    country: 'United Arab Emirates',
    city: 'Dubai',
    institutionType: 'University / Higher Education',
    programs: ['CODEX HACCP', 'ISO 22000', 'Food Technology', 'FSSC 22000'],
    email: 'accreditation@emiratesfood.ae',
    phone: '+971 4 312 4500',
  },
  {
    id: 3,
    centerCode: 'GSFIN-ATC-103',
    name: 'National Food Hygiene Training Center',
    country: 'India',
    city: 'Mumbai',
    institutionType: 'Authorized Training Center',
    programs: ['CODEX HACCP', 'Food Safety', 'BRCGS'],
    email: 'mumbai@foodhygiene.in',
    phone: '+91 22 2847 9000',
  },
  {
    id: 4,
    centerCode: 'GSFIN-ATC-104',
    name: 'Gulf Standards & Quality Center',
    country: 'Saudi Arabia',
    city: 'Riyadh',
    institutionType: 'Corporate Facility',
    programs: ['ISO 22000', 'CODEX HACCP', 'Food Safety'],
    email: 'info@gulfstandards.sa',
    phone: '+966 11 480 2211',
  },
  {
    id: 5,
    centerCode: 'GSFIN-ATC-105',
    name: 'ASEAN Food Safety Excellence Hub',
    country: 'Singapore',
    city: 'Singapore',
    institutionType: 'University / Higher Education',
    programs: ['CODEX HACCP', 'ISO 22000', 'Food Technology', 'FSSC 22000'],
    email: 'contact@aseanfoodhub.sg',
    phone: '+65 6779 8811',
  },
  {
    id: 6,
    centerCode: 'GSFIN-ATC-106',
    name: 'Qatar Center for Food Quality & Assessment',
    country: 'Qatar',
    city: 'Doha',
    institutionType: 'Assessment Center',
    programs: ['CODEX HACCP', 'ISO 22000', 'Food Safety'],
    email: 'doha@qatarfoodquality.qa',
    phone: '+974 4412 8899',
  },
  {
    id: 7,
    centerCode: 'GSFIN-ATC-107',
    name: 'Euro-Tech Food Safety Institute',
    country: 'Germany',
    city: 'Munich',
    institutionType: 'Authorized Training Center',
    programs: ['ISO 22000', 'FSSC 22000', 'BRCGS'],
    email: 'munich@eurotechfood.de',
    phone: '+49 89 2018 7766',
  },
  {
    id: 8,
    centerCode: 'GSFIN-ATC-108',
    name: 'Pacific Rim Hygiene & HACCP Institute',
    country: 'Malaysia',
    city: 'Kuala Lumpur',
    institutionType: 'Authorized Training Center',
    programs: ['CODEX HACCP', 'Food Safety', 'Food Technology'],
    email: 'kl@pacificrimfood.my',
    phone: '+60 3 2145 9900',
  },
  {
    id: 9,
    centerCode: 'GSFIN-ATC-109',
    name: 'Oman International Food Safety Academy',
    country: 'Oman',
    city: 'Muscat',
    institutionType: 'Authorized Training Center',
    programs: ['CODEX HACCP', 'ISO 22000'],
    email: 'info@omanfoodacademy.om',
    phone: '+968 24 698 123',
  },
  {
    id: 10,
    centerCode: 'GSFIN-ATC-110',
    name: 'North American Food Safety Council',
    country: 'United States',
    city: 'Chicago',
    institutionType: 'Corporate Facility',
    programs: ['CODEX HACCP', 'ISO 22000', 'BRCGS', 'FSSC 22000'],
    email: 'chicago@nafoodsafety.org',
    phone: '+1 312 555 0199',
  },
]);

// Dynamic Computed Options from Active Partner Records (Managed via Admin Panel)
const availableCountries = computed(() => {
  const list = partners.value.map(p => p.country).filter(Boolean);
  return Array.from(new Set(list)).sort();
});

const availableTypes = computed(() => {
  const list = partners.value.map(p => p.institutionType).filter(Boolean);
  return Array.from(new Set(list)).sort();
});

const availablePrograms = computed(() => {
  const list = partners.value.flatMap(p => p.programs || []).filter(Boolean);
  return Array.from(new Set(list)).sort();
});

// Computed Active Filters Check
const hasActiveFilters = computed(() => {
  return searchQuery.value !== '' || selectedCountry.value !== '' || selectedType.value !== '' || selectedProgram.value !== '';
});

// Reset Filters Action
const resetFilters = () => {
  searchQuery.value = '';
  selectedCountry.value = '';
  selectedType.value = '';
  selectedProgram.value = '';
  sortBy.value = 'name-asc';
};

// Filtered & Sorted Partners List
const filteredPartners = computed(() => {
  return partners.value.filter(p => {
    // Search Query (matches name, centerCode, city, country)
    if (searchQuery.value.trim() !== '') {
      const q = searchQuery.value.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCode = p.centerCode.toLowerCase().includes(q);
      const matchCity = p.city.toLowerCase().includes(q);
      const matchCountry = p.country.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchCity && !matchCountry) return false;
    }

    // Country Filter
    if (selectedCountry.value && p.country !== selectedCountry.value) {
      return false;
    }

    // Institution Type Filter
    if (selectedType.value && p.institutionType !== selectedType.value) {
      return false;
    }

    // Program Filter
    if (selectedProgram.value) {
      const matchProg = p.programs.some((pr: string) => pr.toLowerCase().includes(selectedProgram.value.toLowerCase()));
      if (!matchProg) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy.value === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy.value === 'name-desc') return b.name.localeCompare(a.name);
    if (sortBy.value === 'country') return a.country.localeCompare(b.country);
    if (sortBy.value === 'code') return a.centerCode.localeCompare(b.centerCode);
    return 0;
  });
});

const openPartnerModal = () => {
  // Navigation partner modal fallback
  window.location.href = '/become-a-partner';
};

const openCenterModal = (partner: any) => {
  selectedPartnerModal.value = partner;
};

const openContactPartner = (partner: any) => {
  selectedPartnerModal.value = partner;
};

// Fetch Backend Partners on Mount
onMounted(async () => {
  try {
    const res: any = await api.get('/public/partners');
    if (res && Array.isArray(res.data) && res.data.length > 0) {
      partners.value = res.data;
    }
  } catch (err) {
    // Silent fallback to initial database
  }
});
</script>

<style scoped>
/* Base Layout */
.gsfin-page {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", sans-serif;
  background-color: #FAFAFD;
  color: #0F172A;
}

.page-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
  box-sizing: border-box;
}

/* Helpers */
.eyebrow-red {
  font-size: 0.75rem; font-weight: 800; letter-spacing: 0.12em;
  text-transform: uppercase; color: #E31B23; display: inline-block;
}

.text-red { color: #E31B23 !important; }
.text-blue { color: #2563EB !important; }
.text-emerald { color: #059669 !important; }

.bg-red-light { background-color: rgba(254, 242, 242, 0.9); }
.bg-blue-light { background-color: rgba(239, 246, 255, 0.9); }
.bg-emerald-light { background-color: rgba(236, 253, 245, 0.9); }
.bg-amber-light { background-color: rgba(255, 251, 235, 0.9); }

/* ── Hero Section ────────────────────────────────────────────── */
.partners-hero {
  position: relative; overflow: hidden;
  background: radial-gradient(circle at 85% 20%, rgba(227, 27, 35, 0.08) 0%, transparent 45%),
              radial-gradient(circle at 15% 85%, rgba(79, 70, 229, 0.08) 0%, transparent 45%),
              linear-gradient(135deg, #FFFFFF 0%, #FAFAFD 60%, #FFF5F5 100%);
  color: #0F172A; padding-top: 140px; padding-bottom: 70px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.hero-bg-layer { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0.05; pointer-events: none; }
.hero-glass-overlay { position: absolute; inset: 0; background: radial-gradient(circle at 50% 30%, rgba(227, 27, 35, 0.06) 0%, transparent 60%); pointer-events: none; }

.hero-blur { position: absolute; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 1; }
.blur-1 { top: 15%; left: 20%; width: 380px; height: 380px; background: rgba(227, 27, 35, 0.12); }
.blur-2 { bottom: 10%; right: 25%; width: 340px; height: 340px; background: rgba(79, 70, 229, 0.1); }

.hero-container { position: relative; z-index: 10; display: flex; justify-content: center; }
.hero-center-content { max-width: 780px; text-align: center; }

.hero-title {
  font-size: clamp(2.2rem, 3.8vw, 3.4rem); font-weight: 800; letter-spacing: -0.03em;
  color: #0F172A; line-height: 1.15; margin: 12px 0 16px 0;
}

.hero-sub { font-size: 1.05rem; color: #475569; line-height: 1.7; margin-bottom: 32px; }

.hero-trust-bar {
  display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap;
}

.trust-pill {
  background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 50px;
  padding: 8px 18px; display: inline-flex; align-items: center; gap: 8px;
  font-size: 0.84rem; color: #475569; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}

/* ── Filter Glass Bar ────────────────────────────────────────── */
.section-directory { padding: 60px 0 100px 0; }

.filter-glass-bar {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(254, 242, 242, 0.65) 100%);
  backdrop-filter: blur(24px) saturate(200%); -webkit-backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid rgba(227, 27, 35, 0.2); border-top: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 28px; padding: 28px; margin-bottom: 36px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.9);
}

.filter-top-row {
  display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 16px;
}

@media (max-width: 768px) { .filter-top-row { grid-template-columns: 1fr; } }

.search-input-wrap {
  position: relative; display: flex; align-items: center; width: 100%;
}

.search-icon {
  position: absolute; left: 16px; font-size: 1.25rem; color: #94A3B8; pointer-events: none;
}

.search-input {
  width: 100%; padding: 14px 44px 14px 44px; border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.12); background: rgba(255, 255, 255, 0.95);
  font-size: 0.9rem; color: #0F172A; outline: none; transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #E31B23; box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.12);
}

.clear-search-btn {
  position: absolute; right: 14px; background: #F1F5F9; border: none;
  width: 24px; height: 24px; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; color: #64748B; cursor: pointer;
}

.filter-bottom-row {
  display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 16px; align-items: center;
}

@media (max-width: 900px) { .filter-bottom-row { grid-template-columns: 1fr 1fr; } }
@media (max-width: 600px) { .filter-bottom-row { grid-template-columns: 1fr; } }

.select-wrap {
  position: relative; display: flex; align-items: center;
}

.select-icon {
  position: absolute; left: 14px; font-size: 1.1rem; color: #64748B; pointer-events: none;
}

.filter-select {
  width: 100%; padding: 12px 14px 12px 40px; border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.12); background: rgba(255, 255, 255, 0.95);
  font-size: 0.85rem; font-weight: 600; color: #334155; outline: none; transition: all 0.2s ease;
  cursor: pointer; appearance: none;
}

.filter-select:focus {
  border-color: #E31B23; box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.1);
}

.btn-reset-filters {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 12px 20px; border-radius: 14px; background: rgba(254, 242, 242, 0.9);
  border: 1px solid rgba(227, 27, 35, 0.2); color: #E31B23;
  font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-reset-filters:hover { background: #FEF2F2; transform: translateY(-1px); }

/* Active Chips */
.active-chips-row {
  margin-top: 18px; padding-top: 16px; border-top: 1px solid rgba(15, 23, 42, 0.06);
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}

.filter-chip {
  background: #FFFFFF; border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 50px; padding: 4px 12px; font-size: 0.76rem; font-weight: 700;
  color: #334155; display: inline-flex; align-items: center; gap: 6px; shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.filter-chip i { cursor: pointer; color: #94A3B8; }
.filter-chip i:hover { color: #E31B23; }

/* Summary Row */
.results-header-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px; padding: 0 8px; flex-wrap: wrap; gap: 12px;
}

.results-count { font-size: 0.9rem; color: #64748B; }

.verified-tag-legend {
  display: flex; align-items: center; gap: 8px; background: #FFFFFF;
  padding: 6px 14px; border-radius: 50px; border: 1px solid rgba(15, 23, 42, 0.08);
}

.legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

/* Empty State */
.empty-state-box {
  background: #FFFFFF; border-radius: 24px; border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 64px 32px; text-align: center; margin: 32px 0;
}

.empty-icon-circle {
  width: 64px; height: 64px; border-radius: 50%; background: #FEF2F2;
  color: #E31B23; font-size: 2rem; display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px auto;
}

/* ── Partners Directory Grid ─────────────────────────────────── */
.partners-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
}

@media (max-width: 1024px) { .partners-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .partners-grid { grid-template-columns: 1fr; } }

.partner-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(250, 250, 253, 0.65) 100%);
  backdrop-filter: blur(20px) saturate(190%); -webkit-backdrop-filter: blur(20px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.8); border-top: 1px solid rgba(255, 255, 255, 0.98);
  border-left: 1px solid rgba(255, 255, 255, 0.98);
  border-radius: 24px; overflow: hidden; position: relative;
  display: flex; flex-direction: column;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.9);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.partner-card:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%);
  border-color: rgba(227, 27, 35, 0.3); transform: translateY(-5px);
  box-shadow: 0 20px 42px rgba(15, 23, 42, 0.09);
}

.partner-card-accent { height: 4px; background: linear-gradient(90deg, #E31B23 0%, #2563EB 100%); width: 100%; }

.partner-card-body { padding: 24px; display: flex; flex-direction: column; flex: 1; }

.card-header-row {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;
}

.center-id-badge {
  font-size: 0.72rem; font-family: monospace; font-weight: 800;
  color: #475569; background: rgba(241, 245, 249, 0.9);
  padding: 3px 10px; border-radius: 6px; border: 1px solid rgba(15, 23, 42, 0.08);
}

.verified-status-badge {
  font-size: 0.72rem; font-weight: 800; color: #059669;
  background: rgba(236, 253, 245, 0.9); padding: 3px 10px; border-radius: 50px;
  border: 1px solid rgba(5, 150, 105, 0.2); display: flex; align-items: center;
}

.partner-name {
  font-size: 1.15rem; font-weight: 800; color: #0F172A;
  line-height: 1.35; margin-bottom: 12px;
}

.partner-meta-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }

.meta-item { font-size: 0.82rem; color: #475569; display: flex; align-items: center; }

.card-divider { border: 0; border-top: 1px solid rgba(15, 23, 42, 0.06); margin: 12px 0 16px 0; }

.programs-section { flex: 1; margin-bottom: 20px; }

.programs-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #94A3B8; display: block; margin-bottom: 8px; }

.program-badges-wrap { display: flex; flex-wrap: wrap; gap: 6px; }

.prog-badge {
  font-size: 0.72rem; font-weight: 700; color: #1E293B;
  background: #FFFFFF; border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 3px 9px; border-radius: 8px;
}

.card-footer-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }

.btn-card-details {
  background: rgba(15, 23, 42, 0.05); border: none; border-radius: 12px;
  padding: 8px 14px; font-size: 0.78rem; font-weight: 700; color: #0F172A;
  cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center;
}

.btn-card-details:hover { background: #0F172A; color: #FFFFFF; }

.btn-card-contact {
  background: transparent; border: 1px solid rgba(227, 27, 35, 0.3); border-radius: 12px;
  padding: 8px 14px; font-size: 0.78rem; font-weight: 700; color: #E31B23;
  cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center;
}

.btn-card-contact:hover { background: #FEF2F2; border-color: #E31B23; }

/* ── CTA Banner ─────────────────────────────────────────────── */
.cta-section { background: linear-gradient(180deg, #FFFFFF 0%, #FAFAFD 100%); padding: 60px 0 100px 0; }

.cta-glass-banner {
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.78) 0%, rgba(254, 242, 242, 0.65) 100%);
  backdrop-filter: blur(24px) saturate(200%); -webkit-backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid rgba(227, 27, 35, 0.25); border-top: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 28px; padding: 56px 64px; display: flex; align-items: center;
  justify-content: space-between; gap: 40px; box-shadow: 0 24px 50px rgba(15, 23, 42, 0.08);
}

@media (max-width: 900px) { .cta-glass-banner { flex-direction: column; text-align: center; padding: 40px 28px; } }

.cta-left { max-width: 580px; }
.cta-title { font-size: clamp(1.8rem, 3.2vw, 2.5rem); font-weight: 800; color: #0F172A !important; margin-bottom: 12px; line-height: 1.2; }
.cta-sub { font-size: 0.98rem; color: #475569 !important; margin-bottom: 32px; line-height: 1.65; }
.cta-actions { display: flex; gap: 16px; flex-wrap: wrap; }
@media (max-width: 900px) { .cta-actions { justify-content: center; } }
.cta-slogan-box { border-left: 3px solid #E31B23; padding-left: 24px; }
@media (max-width: 900px) { .cta-slogan-box { border-left: none; border-top: 3px solid #E31B23; padding-left: 0; padding-top: 18px; } }
.cta-slogan-line { font-size: clamp(1.4rem, 2.4vw, 2rem); font-weight: 800; color: #0F172A !important; line-height: 1.25; }
.cta-slogan-line.text-slate { color: #64748B !important; }

/* Buttons */
.btn-red {
  display: inline-flex; align-items: center; gap: 8px; padding: 12px 26px; border-radius: 50px;
  background: #E31B23 !important; color: #FFFFFF !important; font-weight: 700; font-size: 0.92rem;
  border: none; cursor: pointer; box-shadow: 0 4px 14px rgba(227, 27, 35, 0.25); transition: all 0.25s ease; text-decoration: none;
}
.btn-red:hover { background: #C8141B !important; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(227, 27, 35, 0.35); }

.btn-outline-dark {
  display: inline-flex; align-items: center; padding: 12px 26px; border-radius: 50px;
  background: #FFFFFF; border: 1px solid rgba(15, 23, 42, 0.18); color: #0F172A !important;
  font-weight: 700; font-size: 0.92rem; transition: all 0.25s ease; text-decoration: none; cursor: pointer;
}
.btn-outline-dark:hover { background: #F1F5F9; border-color: #0F172A; }

/* Footer */
.gsfin-footer { background: #FAFAFD; border-top: 1px solid rgba(15, 23, 42, 0.08); color: #334155; }
.footer-grid { padding: 72px 32px 48px 32px; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; }
@media (max-width: 900px) { .footer-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 600px) { .footer-grid { grid-template-columns: 1fr; } }
.footer-col-brand { max-width: 320px; }
.footer-logo { height: 42px !important; width: auto !important; max-width: 220px !important; object-fit: contain !important; margin-bottom: 18px; display: block; }
.footer-brand-desc { font-size: 0.84rem; line-height: 1.7; color: #64748B; margin-bottom: 20px; }
.footer-socials { display: flex; gap: 10px; }
.footer-soc { width: 36px; height: 36px; background: #FFFFFF; border: 1px solid rgba(15, 23, 42, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #64748B !important; text-decoration: none; font-size: 1rem; transition: all 0.2s; }
.footer-soc:hover { background: #E31B23 !important; color: #FFFFFF !important; border-color: #E31B23 !important; }
.footer-col-h { font-size: 0.78rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #0F172A; margin-bottom: 18px; }
.footer-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.footer-links a { font-size: 0.84rem; color: #64748B !important; text-decoration: none; transition: color 0.18s; }
.footer-links a:hover { color: #E31B23 !important; }
.footer-bar { border-top: 1px solid rgba(15, 23, 42, 0.06); padding: 20px 0; }
.footer-bar-inner { display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem; color: #94A3B8; }
.footer-slogan { font-weight: 600; color: #64748B; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(10px) saturate(180%); -webkit-backdrop-filter: blur(10px) saturate(180%);
  z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px;
}
.modal-card-box {
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 24px;
  max-width: 580px; width: 100%; position: relative; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.3);
  overflow: hidden; max-height: 90vh; overflow-y: auto;
}
.modal-close-btn {
  position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border-radius: 50%;
  background: #F1F5F9; color: #64748B; display: flex; align-items: center; justify-content: center;
  font-size: 20px; border: none; cursor: pointer; transition: all 0.2s ease; z-index: 10;
}
.modal-close-btn:hover { background: #FEF2F2; color: #E31B23; }
</style>
