<template>
  <div class="gsfin-page">
    <!-- ═══ NAVBAR ═══ -->
    <PublicNavbar @open-partner-modal="openPartnerModal()" />

    <!-- ═══ HERO ═══ -->
    <section class="qual-catalog-hero">
      <div class="hero-bg-layer" style="background-image: url('/hero-bk.png');"></div>
      <div class="hero-glass-overlay"></div>

      <div class="page-wrap catalog-hero-content">
        <span class="eyebrow-red">GLOBAL EXAMINATION FRAMEWORK</span>
        <h1 class="catalog-title">
          International Food Safety &amp; Quality <span class="text-red">Qualifications</span>
        </h1>
        <p class="catalog-sub">
          Explore our range of internationally accredited certification standards for food safety managers, auditors, micro-biologists, and quality engineers.
        </p>

        <!-- Search Panel -->
        <div class="search-panel-glass">
          <div class="search-input-wrap">
            <i class="mdi mdi-magnify search-icon"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search qualification standards (e.g. ISO 22000, HACCP, BRCGS)..."
              class="search-input"
            />
          </div>
          <select v-model="selectedCategory" class="category-select">
            <option value="All">All Categories</option>
            <option value="Food Safety">Food Safety</option>
            <option value="Quality Management">Quality Management</option>
            <option value="Food Science">Food Science</option>
          </select>
        </div>
      </div>
    </section>

    <!-- ═══ CATALOG GRID SECTION ═══ -->
    <main class="page-wrap catalog-body-section">
      <!-- Loading State -->
      <div v-if="pending" class="loading-state">
        <div class="spinner"></div>
        <p>Loading GSFIN Qualification Standards...</p>
      </div>

      <!-- No Results -->
      <div v-else-if="filteredQualifications.length === 0" class="no-results-box glass-panel">
        <i class="mdi mdi-certificate-outline icon-empty"></i>
        <h3>No Qualifications Found</h3>
        <p>Try adjusting your search criteria or category filter.</p>
        <button class="btn-glass" @click="searchQuery = ''; selectedCategory = 'All'">Reset Filters</button>
      </div>

      <!-- Grid Cards -->
      <div v-else class="catalog-cards-grid">
        <NuxtLink
          v-for="cert in filteredQualifications"
          :key="cert.id"
          :to="`/qualifications/${cert.slug}`"
          class="cert-catalog-card"
        >
          <div class="cert-img-wrap">
            <img
              :src="cert.image_url || cert.image || `/img/course-${cert.slug}.jpg`"
              :alt="cert.name"
              class="cert-card-img"
              @error="(e: Event) => { (e.target as HTMLImageElement).src = '/hero-bk.png'; }"
            />
            <div class="cert-level-badge">{{ cert.level || 'GSFIN Standard' }}</div>
          </div>

          <div class="cert-card-body">
            <div class="cert-category-text">{{ cert.category }}</div>
            <h3 class="cert-card-title">{{ cert.name }}</h3>
            <p class="cert-card-desc">{{ cert.short_description }}</p>

            <div class="cert-specs-bar">
              <div class="spec-item">
                <i class="mdi mdi-clock-outline"></i>
                <span>{{ cert.duration || '35 Hours Self-Paced + Exam' }}</span>
              </div>
              <div class="spec-item">
                <i class="mdi mdi-shield-check-outline icon-green-sm"></i>
                <span>{{ cert.validity || '3 Years International Recognition' }}</span>
              </div>
            </div>

            <div class="btn-card-learn">
              Explore Qualification Standard <i class="mdi mdi-arrow-right"></i>
            </div>
          </div>
        </NuxtLink>
      </div>
    </main>

    <!-- ═══ GLOBAL PRODUCT FOOTER ═══ -->
    <PublicFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const { fullLogoUrl } = usePublicConfig();

const scrolled = ref(false);
const searchQuery = ref('');
const selectedCategory = ref('All');

const api = useApi();
const apiQualifications = ref<any[]>([]);
const pending = ref(true);

const defaultQualifications = [
  { id: 1, slug: 'codex-haccp', image_url: '/img/course-haccp.jpg', name: 'CODEX HACCP', category: 'Food Safety Standard', level: 'Advanced Level', short_description: 'Hazard Analysis & Critical Control Points — the cornerstone of food safety management worldwide.', icon_name: 'mdi-shield-check-outline' },
  { id: 2, slug: 'iso-22000', image_url: '/img/course-iso22000.jpg', name: 'ISO 22000:2018', category: 'Quality Management', level: 'Professional Level', short_description: 'International standard for food safety management systems across the entire food supply chain.', icon_name: 'mdi-certificate-outline' },
  { id: 3, slug: 'food-safety', image_url: '/img/course-food-safety.jpg', name: 'Food Safety Management', category: 'Food Safety Standard', level: 'Intermediate Level', short_description: 'Comprehensive food safety principles, hygiene, contamination prevention and compliance.', icon_name: 'mdi-shield-outline' },
  { id: 4, slug: 'food-technology', image_url: '/img/course-food-tech.png', name: 'Food Technology', category: 'Food Science', level: 'Advanced Level', short_description: 'A blend of food science and technology principles for modern food processing and innovation.', icon_name: 'mdi-flask-outline' },
  { id: 5, slug: 'brcgs', image_url: '/img/course-brcgs.jpg', name: 'BRCGS Global Standard', category: 'Quality Management', level: 'Lead Auditor', short_description: 'Global standard for retailers, manufacturers and food service sectors.', icon_name: 'mdi-medal-outline' },
  { id: 6, slug: 'fssc-22000', image_url: '/img/course-fssc.jpg', name: 'FSSC 22000', category: 'Quality Management', level: 'Lead Auditor', short_description: 'Food Safety System Certification recognized by GFSI worldwide.', icon_name: 'mdi-check-decagram-outline' },
  { id: 7, slug: 'ghp-gmp', image_url: '/img/course-ghp-gmp.jpg', name: 'GHP & GMP Compliance', category: 'Food Safety Standard', level: 'Foundation Level', short_description: 'Good Hygiene and Manufacturing Practices for safe food production.', icon_name: 'mdi-hand-wash-outline' },
  { id: 8, slug: 'food-microbiology', image_url: '/img/course-microbiology.jpg', name: 'Food Microbiology', category: 'Food Science', level: 'Specialist Level', short_description: 'Understanding microbial hazards, hygiene practices and laboratory testing methods.', icon_name: 'mdi-microscope' }
];

const qualificationsList = computed(() => apiQualifications.value.length ? apiQualifications.value : defaultQualifications);

const fetchQualifications = async () => {
  pending.value = true;
  try {
    const res = await api.get('/public/qualifications');
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      apiQualifications.value = res.data;
    }
  } catch (err) {
    console.warn('API fetch warning on qualifications list, using defaults:', err);
  } finally {
    pending.value = false;
  }
};

useHead({
  title: 'GSFIN Qualification Standards | Global Food Safety Certifications',
  meta: [
    {
      name: 'description',
      content: 'Browse international qualification standards in food safety, HACCP, ISO 22000, BRCGS, FSSC 22000, and food microbiology.'
    }
  ]
});

const filteredQualifications = computed(() => {
  return qualificationsList.value.filter((cert) => {
    const matchesSearch =
      !searchQuery.value ||
      cert.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      cert.short_description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      cert.slug.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesCategory =
      selectedCategory.value === 'All' || cert.category === selectedCategory.value;

    return matchesSearch && matchesCategory;
  });
});

const handleScroll = () => {
  scrolled.value = window.scrollY > 40;
};

onMounted(() => {
  fetchQualifications();
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

const openPartnerModal = () => {
  navigateTo('/#contact');
};
</script>

<style scoped>
.gsfin-page {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  background: #FAFAFD; color: #0F172A; min-height: 100vh; width: 100%;
}

.page-wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; box-sizing: border-box; }

/* ── Navbar ─────────────────────────────────────────────── */
.gsfin-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 999;
  background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06); transition: all 0.35s ease;
}
.gsfin-nav--scrolled { background: rgba(255, 255, 255, 0.92) !important; box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05) !important; }
.nav-wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; height: 72px; display: flex; align-items: center; justify-content: space-between; }
.nav-logo { display: flex; align-items: center; text-decoration: none; }
.nav-logo-img { height: 42px; object-fit: contain; }
.nav-links { display: flex; align-items: center; gap: 28px; }
.nav-link { color: #334155 !important; text-decoration: none !important; font-size: 0.84rem; font-weight: 600; transition: color 0.2s; cursor: pointer; }
.nav-link:hover, .nav-link--active { color: #E31B23 !important; }
.nav-cta-btn {
  display: inline-flex; align-items: center; gap: 6px; background: #E31B23 !important; color: #FFFFFF !important;
  text-decoration: none; padding: 9px 20px; border-radius: 50px; font-weight: 700; font-size: 0.82rem; border: none;
  box-shadow: 0 2px 8px rgba(227, 27, 35, 0.18); transition: all 0.2s; cursor: pointer;
}

.eyebrow-red { font-size: 0.75rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #E31B23; }
.text-red { color: #E31B23; }

/* ── Hero ───────────────────────────────────────────────── */
.qual-catalog-hero {
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, #FFFFFF 0%, #FAFAFD 60%, #FFF5F5 100%);
  color: #0F172A;
  padding-top: 130px; padding-bottom: 70px; text-align: center; width: 100%;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}
.hero-bg-layer { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0.04; }
.hero-glass-overlay {
  position: absolute; inset: 0;
  background: radial-gradient(circle at 80% 20%, rgba(227, 27, 35, 0.06) 0%, transparent 60%);
  pointer-events: none;
}

.catalog-hero-content { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; }
.catalog-title { font-size: clamp(2.2rem, 3.8vw, 3.4rem); font-weight: 800; letter-spacing: -0.03em; color: #0F172A; line-height: 1.15; margin: 12px 0; max-width: 850px; }
.catalog-sub { font-size: 1.08rem; color: #475569; line-height: 1.6; max-width: 680px; margin-bottom: 40px; }

/* ── Search Panel ───────────────────────────────────────── */
.search-panel-glass {
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(15, 23, 42, 0.1); border-radius: 20px; padding: 12px;
  display: flex; gap: 12px; width: 100%; max-width: 720px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}
@media (max-width: 600px) { .search-panel-glass { flex-direction: column; } }

.search-input-wrap { position: relative; flex: 1; display: flex; align-items: center; }
.search-icon { position: absolute; left: 16px; color: #64748B; font-size: 1.25rem; }
.search-input {
  width: 100%; padding: 12px 16px 12px 48px; border-radius: 14px; background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08); outline: none; font-size: 0.92rem; color: #0F172A; font-family: inherit; box-sizing: border-box;
  transition: all 0.2s ease;
}
.search-input:focus {
  background: #FFFFFF; border-color: #E31B23; box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.1);
}
.category-select {
  padding: 12px 20px; border-radius: 14px; background: #F8FAFC; border: 1px solid rgba(15, 23, 42, 0.08);
  outline: none; font-size: 0.9rem; font-weight: 700; color: #0F172A; cursor: pointer;
  transition: all 0.2s ease;
}
.category-select:focus {
  background: #FFFFFF; border-color: #E31B23;
}

/* ── Catalog Body ───────────────────────────────────────── */
.catalog-body-section { padding: 64px 32px; }

.catalog-cards-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px;
}
@media (max-width: 900px) { .catalog-cards-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .catalog-cards-grid { grid-template-columns: 1fr; } }

.cert-catalog-card {
  background: #FFFFFF;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.cert-catalog-card:hover {
  transform: translateY(-5px);
  border-color: rgba(227, 27, 35, 0.25);
  box-shadow: 0 12px 28px -6px rgba(15, 23, 42, 0.08);
}

.cert-img-wrap {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: #F1F5F9;
}

.cert-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.cert-catalog-card:hover .cert-card-img {
  transform: scale(1.06);
}

.cert-level-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #FFFFFF;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 5px 12px;
  border-radius: 50px;
  text-transform: uppercase;
}

.cert-card-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.cert-category-text { font-size: 0.74rem; font-weight: 800; text-transform: uppercase; color: #E31B23; letter-spacing: 0.06em; margin-bottom: 6px; }

.cert-card-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0F172A;
  margin-bottom: 10px;
  line-height: 1.3;
  transition: color 0.2s;
}
.cert-catalog-card:hover .cert-card-title {
  color: #E31B23;
}

.cert-card-desc { font-size: 0.88rem; color: #64748B; line-height: 1.6; flex: 1; margin-bottom: 20px; }

.cert-specs-bar {
  border-top: 1px solid rgba(15, 23, 42, 0.08); padding-top: 14px; margin-bottom: 20px;
  display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem; color: #475569; font-weight: 600;
}
.spec-item { display: flex; align-items: center; gap: 5px; }
.icon-green-sm { color: #059669; }

.btn-card-learn {
  background: #F8FAFC; color: #0F172A; border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 11px 20px; border-radius: 50px; font-weight: 700; font-size: 0.84rem;
  display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.25s;
}
.cert-catalog-card:hover .btn-card-learn {
  background: #E31B23; color: #FFFFFF; border-color: #E31B23;
  box-shadow: 0 4px 12px rgba(227, 27, 35, 0.2);
}

/* ── Footer ─────────────────────────────────────────────── */
.gsfin-footer { background: #FAFAFD; border-top: 1px solid rgba(15, 23, 42, 0.06); color: #334155; }
.footer-grid { padding: 80px 32px; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; }
@media (max-width: 900px) { .footer-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 600px) { .footer-grid { grid-template-columns: 1fr; } }
.footer-col-brand { max-width: 320px; }
.footer-logo { height: 42px; width: auto; max-width: 240px; object-fit: contain; margin-bottom: 18px; display: block; }
.footer-brand-desc { font-size: 0.84rem; line-height: 1.7; color: #64748B; margin-bottom: 20px; }
.footer-socials { display: flex; gap: 10px; }
.footer-soc {
  width: 36px; height: 36px; background: #FFFFFF; border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 10px; display: flex; align-items: center; justify-content: center;
  color: #64748B !important; text-decoration: none; font-size: 1rem; transition: all 0.2s;
}
.footer-soc:hover { background: #E31B23 !important; color: #FFFFFF !important; border-color: #E31B23 !important; }
.footer-col-h { font-size: 0.78rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #0F172A; margin-bottom: 18px; }
.footer-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.footer-links a { font-size: 0.84rem; color: #64748B !important; text-decoration: none; transition: color 0.18s; }
.footer-links a:hover { color: #E31B23 !important; }
.footer-bar { border-top: 1px solid rgba(15, 23, 42, 0.06); padding: 20px 0; }
.footer-bar-inner { display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem; color: #94A3B8; }
.footer-slogan { font-weight: 600; color: #64748B; }
</style>
