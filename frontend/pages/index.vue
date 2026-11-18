<template>
  <div class="gsfin-landing-root" :data-theme="currentTheme">


  <!-- SVG SYMBOL SPRITE -->
  <svg style="display:none;" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Shield Check -->
      <g id="v-shield-check">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" />
        <path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round" />
      </g>
      <!-- Scale of Justice / Impartiality -->
      <g id="v-scale">
        <path d="m16 16 3-8 3 8a3 3 0 0 1-6 0zM2 16l3-8 3 8a3 3 0 0 1-6 0zM7 21h10M12 3v18M3 7h18" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <!-- Target / Psychometrics -->
      <g id="v-target">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" />
        <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="2" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </g>
      <!-- Globe / Global Portability -->
      <g id="v-globe">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
          fill="none" stroke="currentColor" stroke-width="2" />
      </g>
      <!-- Checklist -->
      <g id="v-checklist">
        <path d="M9 11l3 3L22 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" />
      </g>
      <!-- Fingerprint / Biometric -->
      <g id="v-fingerprint">
        <path
          d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4M14 13.12c0 2.38 0 6.38-1 8.88M2 12a10 10 0 0 1 18-6M2 16a14 14 0 0 1 4-10M16 17a14 14 0 0 1-2 5M10 20a10 10 0 0 0 2-8 2 2 0 0 1 4 0 7 7 0 0 1-.36 2.22"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </g>
      <!-- CCTV Camera -->
      <g id="v-camera">
        <path d="M2 10h15a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H2l3-8z" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" />
        <path d="M7 10v6M12 10v6M17 13l5-3v8l-5-3M7 21h4M9 18v3" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" />
      </g>
      <!-- Lock / Offline Encrypted -->
      <g id="v-lock">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" stroke-width="2" />
      </g>
      <!-- Acoustic Barrier -->
      <g id="v-sound">
        <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <!-- Award / Gold Seal -->
      <g id="v-award">
        <circle cx="12" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2" />
        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <!-- Search Magnifier -->
      <g id="v-search">
        <circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" stroke-width="2" />
        <path d="m21 21-4.35-4.35" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </g>
      <!-- QR Code Vector -->
      <g id="v-qr">
        <rect x="3" y="3" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2" />
        <rect x="14" y="3" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2" />
        <rect x="3" y="14" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2" />
        <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 21h3M21 14v3" fill="none" stroke="currentColor" stroke-width="2" />
      </g>
      <!-- Sun -->
      <g id="v-sun">
        <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2" />
        <path
          d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </g>
      <!-- Moon -->
      <g id="v-moon">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <!-- Arrow Up -->
      <g id="v-arrow-up">
        <path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
          stroke-linejoin="round" />
      </g>
      <!-- Arrow Right -->
      <g id="v-arrow-right">
        <path d="M5 12h14M12 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round" />
      </g>
      <!-- Flask / Laboratory -->
      <g id="v-flask">
        <path d="M10 2v5.5L4.4 18.2A2 2 0 0 0 6.1 21h11.8a2 2 0 0 0 1.7-2.8L14 7.5V2" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M8.5 2h7M7 16h10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </g>
    </defs>
  </svg>

  <!-- HEADER & NAVBAR (ONE-PAGE SCROLL) -->
  <header>
    <div class="w nav-container">
      <a href="#hero" class="logo-group" aria-label="GSFIN home">
        <img class="brand-img" :src="logoSrc" alt="GSFIN Logo">
      </a>

      <nav id="nav" :class="{ 'o': mobileNavOpen }">
        <a href="#hero" :class="['nav-link', { on: activeSection === 'hero' }]" @click.prevent="scrollToSection('hero'); mobileNavOpen = false">Home</a>
        <a href="#about" :class="['nav-link', { on: activeSection === 'about' }]" @click.prevent="scrollToSection('about'); mobileNavOpen = false">About Us</a>
        <a href="#schemes" :class="['nav-link', { on: activeSection === 'schemes' }]" @click.prevent="scrollToSection('schemes'); mobileNavOpen = false">Certifications</a>
        <a href="#process" :class="['nav-link', { on: activeSection === 'process' }]" @click.prevent="scrollToSection('process'); mobileNavOpen = false">How It Works</a>
        <a href="#verify" :class="['nav-link', { on: activeSection === 'verify' }]" @click.prevent="scrollToSection('verify'); mobileNavOpen = false">Verify Certificate</a>
        <div class="mobile-only-actions">
          <button type="button" class="btn p" @click="openPartnerModal(); mobileNavOpen = false">Apply Now</button>
          <NuxtLink to="/login" class="btn sm" @click="mobileNavOpen = false">Partner Login</NuxtLink>
        </div>
      </nav>

      <div class="nav-actions">
        <button class="icon-btn" id="theme-btn" @click="toggleTheme" aria-label="Toggle theme">
          <svg id="theme-icon" width="18" height="18" viewBox="0 0 24 24">
            <use :href="'#v-' + (currentTheme === 'dark' ? 'sun' : 'moon')" />
          </svg>
        </button>
        <button type="button" class="btn p hb" @click="openPartnerModal()">Apply Now</button>
        <NuxtLink to="/login" class="btn sm hb" style="margin-left: 10px;">Partner Login</NuxtLink>
        <button class="icon-btn menu-btn" @click="mobileNavOpen = !mobileNavOpen"
          aria-label="Open menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  </header>

  <main>
    <!-- ================== SECTION 1: HERO ================== -->
    <section class="hero-section" id="hero">
      <div class="w hero-grid">
        <div>
          <div class="eyebrow">
            <span class="eyebrow-line"></span>
            GLOBAL STANDARDS & CERTIFICATION FRAMEWORK
          </div>
          <h1 class="hero-title">{{ heroTitle }}</h1>
          <p class="lead" v-if="heroSubtitle">{{ heroSubtitle }}</p>

          <div class="row">
            <a class="btn p" href="#schemes">
              Explore Certifications
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

        </div>

        <!-- Hero Visual with Modern Food Safety Facility & Floating Badges -->
        <div class="hero-visual-card">
          <div class="hero-image-wrap">
            <img :src="heroImgSrc"
              :alt="heroTitle">
            <div class="floating-pill">
              <span class="live-dot"></span>
              <span>Certification Assessment In Progress</span>
            </div>
          </div>
          <div class="floating-card-bottom">
            <div class="seal-icon">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <use href="#v-shield-check" />
              </svg>
            </div>
            <div>
              <h5>Verified Personnel Certification</h5>
              <p>Conformity Assessment &bull; Active Standard</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================== SECTION 2: VALUE PILLARS & SECTORS ================== -->
    <section class="s alt bordered" id="pillars">
      <div class="w">
        <div class="section-head">
          <div class="eyebrow"><span class="eyebrow-line"></span>Core Foundations</div>
          <h2>The GSFIN Value Pillars</h2>
          <p>Committed to fair assessments, practical industry standards, and internationally respected credentials.</p>
        </div>
        <div class="grid grid-3">
          <div class="card">
            <div class="card-vector-icon">
              <svg width="26" height="26" viewBox="0 0 24 24">
                <use href="#v-scale" />
              </svg>
            </div>
            <h3>Pillar 1: Impartial &amp; Transparent</h3>
            <p>Our certification decisions are made independently of training delivery, ensuring a fair,
              objective evaluation of each candidate’s demonstrated capability.</p>
          </div>
          <div class="card">
            <div class="card-vector-icon">
              <svg width="26" height="26" viewBox="0 0 24 24">
                <use href="#v-target" />
              </svg>
            </div>
            <h3>Pillar 2: Practical Competence Focus</h3>
            <p>Assessments are built around real-world industry tasks, core regulatory requirements, and
              established workplace standards to verify applied knowledge.</p>
          </div>
          <div class="card">
            <div class="card-vector-icon">
              <svg width="26" height="26" viewBox="0 0 24 24">
                <use href="#v-globe" />
              </svg>
            </div>
            <h3>Pillar 3: Professional Portability</h3>
            <p>Structured to reflect international conformity assessment best practices, providing clear
              evidence of capability recognized by employers and clients across borders.</p>
          </div>
        </div>

        <!-- Critical Sectors -->
        <div class="section-head" style="margin-top: 76px;">
          <div class="eyebrow"><span class="eyebrow-line"></span>Industry Impact</div>
          <h2>Focus Industry Sectors</h2>
          <p>Setting competency benchmarks for professionals across vital global operations.</p>
        </div>
        <div class="grid grid-4">
          <div class="card sector-card">
            <div class="sector-thumb">
              <img src="/assets/images/sector_food_safety.jpg"
                alt="Food Chain Safety and Automated Bottling Facility Inspection">
              <span class="sector-badge">ISO 22000</span>
            </div>
            <div class="sector-body">
              <h3>Food Chain Safety &amp; Processing</h3>
              <p>Validating the competence of professionals who design, implement, and verify food safety
                management systems, HACCP plans, and hygiene controls across the supply chain.
              </p>
            </div>
          </div>

          <div class="card sector-card">
            <div class="sector-thumb">
              <img src="/assets/images/lab_testing.jpg" alt="Quality Control and Microbiology Laboratory Testing">
              <span class="sector-badge">ISO 9001 / 17025</span>
            </div>
            <div class="sector-body">
              <h3>Quality &amp; Technical compliance</h3>
              <p>Certifying practitioners responsible for internal auditing, continuous quality verification,
                and management system conformance across industrial environments.</p>
            </div>
          </div>

          <div class="card sector-card">
            <div class="sector-thumb">
              <img src="/assets/images/sector_health_safety.jpg"
                alt="Occupational Plant Health and Safety Officer Inspection">
              <span class="sector-badge">ISO 45001</span>
            </div>
            <div class="sector-body">
              <h3>Workplace Health &amp; Industrial Safety</h3>
              <p>Verification of competencies in plant safety, hazard mitigation, and environmental compliance
                governance.</p>
            </div>
          </div>

          <div class="card sector-card">
            <div class="sector-thumb">
              <img src="/assets/images/sector_industrial_hygiene.jpg"
                alt="Industrial Hygiene Swab Testing and Sanitation Audit">
              <span class="sector-badge">ISO 19011</span>
            </div>
            <div class="sector-body">
              <h3>Hospitality &amp; Commercial Catering</h3>
              <p>Standardizing hygiene protocols, kitchen safety verification, and operational compliance for
                hospitality and institutional food service providers.</p>
            </div>
          </div>
        </div>

        <!-- Institutional Impartiality Statement Shield -->
        <div class="shield-banner" style="margin-top: 56px;">
          <div class="shield-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24">
              <use href="#v-shield-check" />
            </svg>
          </div>
          <div class="shield-content">
            <h3>Institutional Impartiality Commitment</h3>
            <p>GSFIN structures its personnel certification governance, schemes, and assessment procedures in
              alignment with international conformity assessment standards and personnel certification principles. GSFIN does not deliver preparatory
              training courses, does not require completion of specific commercial training programs as a mandatory
              prerequisite for certification, and does not state or imply that certification can be simplified,
              expedited, or guaranteed through any third-party training vendor.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================== SECTION 3: ABOUT US ================== -->
    <section class="s" id="about">
      <div class="w">
        <!-- 1. Institutional Mandate (About GSFIN) -->
        <div class="section-head">
          <div class="eyebrow"><span class="eyebrow-line"></span>About GSFIN</div>
          <h2>{{ aboutTitle }}</h2>
          <p>{{ aboutDescription }}</p>
        </div>

        <!-- Governance Showcase Feature -->
        <div class="gov-showcase">
          <div class="gov-content">
            <span class="portal-badge">
              <span class="live-dot"></span>
              Institutional Mandate
            </span>
            <h3>{{ aboutTitle }}</h3>
            <p>{{ aboutDescription }}</p>

            <ul class="gov-points">
              <li v-for="(bullet, bIdx) in aboutBullets" :key="bIdx">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <use :href="'#v-' + getBulletIcon(bIdx)" />
                </svg>
                <span>{{ bullet }}</span>
              </li>
            </ul>
          </div>

          <div class="gov-visual">
            <img :src="aboutImgSrc" :alt="aboutTitle">
            <div class="gov-badge">
              <span>Personnel Certification Body</span>
              <span style="color: var(--gold); font-weight: 600;">100% Impartial</span>
            </div>
          </div>
        </div>

        <!-- 2. Governance Architecture (The Neutrality Structure) -->
        <div style="margin-top: 52px; margin-bottom: 24px;">
          <div class="eyebrow"><span class="eyebrow-line"></span>The Neutrality Structure</div>
          <h2 style="font-size: 28px; margin-top: 6px; margin-bottom: 10px;">Governance Architecture</h2>
          <p style="color: var(--mu); font-size: 15px; max-width: 680px;">A robust multi-tier neutrality structure guaranteeing complete operational separation between governance, standards development, examination delivery, and certification awards.</p>
        </div>

        <div class="grid grid-4">
          <div class="card" style="display: flex; flex-direction: column;">
            <div class="card-vector-icon">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <use href="#v-scale" />
              </svg>
            </div>
            <div class="step-subtext" style="margin-bottom: 10px;">Strategic Oversight</div>
            <h3 style="font-size: 17px; margin-bottom: 8px;">Governing Body</h3>
            <p style="font-size: 13.5px; color: var(--mu); line-height: 1.6; margin: 0; flex-grow: 1;">Guides strategic resources and legal compliance without involvement in technical exam decisions.</p>
          </div>

          <div class="card" style="display: flex; flex-direction: column;">
            <div class="card-vector-icon">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <use href="#v-shield-check" />
              </svg>
            </div>
            <div class="step-subtext" style="margin-bottom: 10px;">Clause 4.3</div>
            <h3 style="font-size: 17px; margin-bottom: 8px;">Independent Impartiality Committee</h3>
            <p style="font-size: 13.5px; color: var(--mu); line-height: 1.6; margin: 0; flex-grow: 1;">A balanced panel of external industry practitioners and regulatory stakeholders that oversees assessment neutrality and conflict-of-interest safeguards (Clause 4.3).</p>
          </div>

          <div class="card" style="display: flex; flex-direction: column;">
            <div class="card-vector-icon">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <use href="#v-checklist" />
              </svg>
            </div>
            <div class="step-subtext" style="margin-bottom: 10px;">Clause 8</div>
            <h3 style="font-size: 17px; margin-bottom: 8px;">Scheme Committees</h3>
            <p style="font-size: 13.5px; color: var(--mu); line-height: 1.6; margin: 0; flex-grow: 1;">Technical committees responsible for defining prerequisites, job role competencies, and exam blueprints without commercial vendor influence (Clause 8).</p>
          </div>

          <div class="card" style="display: flex; flex-direction: column;">
            <div class="card-vector-icon">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <use href="#v-award" />
              </svg>
            </div>
            <div class="step-subtext" style="margin-bottom: 10px;">Clause 9.5</div>
            <h3 style="font-size: 17px; margin-bottom: 8px;">Independent Decision Unit</h3>
            <p style="font-size: 13.5px; color: var(--mu); line-height: 1.6; margin: 0; flex-grow: 1;">Authorized evaluators making final certification determinations completely separate from test administration or training activities (Clause 9.5).</p>
          </div>
        </div>

        <!-- 3. Commitment to Impartiality Public Declaration -->
        <div class="shield-banner" style="margin-top: 40px;">
          <div class="shield-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24">
              <use href="#v-shield-check" />
            </svg>
          </div>
          <div class="shield-content">
            <div class="eyebrow" style="color: var(--ac); margin-bottom: 6px;"><span class="eyebrow-line" style="background: var(--ac);"></span>Public Declaration</div>
            <h3 style="font-size: 22px; margin-bottom: 10px;">Commitment to Impartiality</h3>
            <p style="font-size: 15.5px; line-height: 1.7; color: var(--tx); font-weight: 500;">
              &ldquo;GSFIN management understands the critical importance of impartiality in carrying out personnel certification. We ensure open access to all qualified applicants, prevent conflicts of interest, and maintain strict operational separation from external training programs.&rdquo;
            </p>
          </div>
        </div>

        <!-- Due Process: Appeals & Complaints -->
        <div class="grid grid-2" style="margin-top: 32px;">
          <div class="card">
            <div class="card-vector-icon">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <use href="#v-scale" />
              </svg>
            </div>
            <h3>Appeals Procedure</h3>
            <p>Any applicant or certified professional may formally challenge an adverse decision (e.g., examination
              failure, suspension, or denial of eligibility). Appeals are investigated by an independent ad-hoc tribunal
              with zero prior involvement in the evaluation.</p>
            <div style="margin-top: 18px;">
              <button class="btn sm"
                onclick="alert('GSFIN-POL-APP-04 Appeals Procedure (PDF) documentation placeholder.')">
                Download Appeal Procedure (PDF)
              </button>
            </div>
          </div>

          <div class="card">
            <div class="card-vector-icon">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <use href="#v-shield-check" />
              </svg>
            </div>
            <h3>Complaints Handling</h3>
            <p>Any stakeholder may file a complaint regarding the ethical conduct of a GSFIN-certified person or the
              operational standards of our personnel. All complaints trigger a documented, confidential inquiry tracked
              to formal resolution.</p>
            <div style="margin-top: 18px;">
              <button class="btn sm" onclick="alert('Opening GSFIN Secure Ethics Submission Portal')">
                Access Ethics Submission Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================== SECTION 4: CERTIFICATIONS ================== -->
    <section class="s alt bordered" id="schemes">
      <div class="w">
        <div class="section-head">
          <div class="eyebrow"><span class="eyebrow-line"></span>Professional Certifications</div>
          <h2>Our Certification Programs</h2>
          <p>Industry-recognized personnel certification schemes covering food safety, HACCP, ISO management systems,
            and laboratory conformity, governed under international personnel certification standards.</p>
        </div>

        <div class="grid grid-4">
          <div
            v-for="scheme in displaySchemes"
            :key="scheme.id"
            class="card program-card"
          >
            <NuxtLink :to="'/qualifications/' + scheme.slug" class="program-thumb" style="display: block; text-decoration: none;">
              <img :src="getSchemeImage(scheme)" :alt="scheme.name">
              <span class="program-thumb-badge">{{ scheme.badge_tag || 'Standard' }}</span>
            </NuxtLink>
            <div class="program-body">
              <div>
                <NuxtLink :to="'/qualifications/' + scheme.slug" style="text-decoration: none; color: inherit;">
                  <h3>{{ scheme.name }}</h3>
                </NuxtLink>
                <div class="program-sub">{{ scheme.subtitle || scheme.name }}</div>
                <p class="program-desc">{{ scheme.short_description }}</p>
                <div class="program-tags" v-if="scheme.tags && scheme.tags.length">
                  <span v-for="(tag, tIdx) in scheme.tags" :key="tIdx">{{ tag }}</span>
                </div>
              </div>
              <NuxtLink :to="'/qualifications/' + scheme.slug" class="program-footer">
                <span>View Standard Specification</span>
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <use href="#v-arrow-right" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 44px;">
          <NuxtLink to="/qualifications" class="btn p" style="display: inline-flex; align-items: center; gap: 8px;">
            <span>Browse Full Qualifications Directory</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ================== SECTION 5: HOW IT WORKS ================== -->
    <section class="s" id="process">
      <div class="w">
        <div class="section-head">
          <div class="eyebrow"><span class="eyebrow-line"></span>Step-by-Step Guide</div>
          <h2>How Certification Works</h2>
          <p>A simple, transparent 4-stage journey from application review to ongoing recertification.
          </p>
        </div>

        <!-- 4-Stage Workflow -->
        <div class="steps-container" style="margin-top: 0; margin-bottom: 36px;">
          <div class="step-box">
            <div class="step-number"><span>STAGE 01</span><svg class="step-vector" width="18" height="18"
                viewBox="0 0 24 24">
                <use href="#v-checklist" />
              </svg></div>
            <b>Application &amp; Eligibility Review</b>
            <div class="step-subtext">Governed by Clause 9.1</div>
            <p class="step-desc">Candidates submit verifiable documentation of their educational background,
              professional experience, and signed commitment to the GSFIN Code of Ethics. Applications undergo an
              objective desk review against published scheme prerequisites to confirm eligibility.</p>
          </div>
          <div class="step-box">
            <div class="step-number"><span>STAGE 02</span><svg class="step-vector" width="18" height="18"
                viewBox="0 0 24 24">
                <use href="#v-camera" />
              </svg></div>
            <b>Standardized Examination</b>
            <div class="step-subtext">Governed by Clauses 9.2 &amp; 9.3</div>
            <p class="step-desc">Eligible candidates sit for fair, structured examinations administered at Approved
              Assessment Centers under secure invigilation. Assessments test theoretical knowledge and practical
              workplace application against established scheme benchmarks.</p>
          </div>
          <div class="step-box">
            <div class="step-number"><span>STAGE 03</span><svg class="step-vector" width="18" height="18"
                viewBox="0 0 24 24">
                <use href="#v-scale" />
              </svg></div>
            <b>Independent Certification Decision</b>
            <div class="step-subtext">Governed by Clause 9.5</div>
            <p class="step-desc">Assessment results and candidate portfolios are evaluated by authorized certification
              decision-makers who were not involved in test administration or training delivery, ensuring a completely
              impartial determination.</p>
          </div>
          <div class="step-box">
            <div class="step-number"><span>STAGE 04</span><svg class="step-vector" width="18" height="18"
                viewBox="0 0 24 24">
                <use href="#v-award" />
              </svg></div>
            <b>Maintenance &amp; Recertification</b>
            <div class="step-subtext">Governed by Clause 9.6</div>
            <p class="step-desc">Certified practitioners maintain their active standing through ongoing professional
              practice, structured Continuing Professional Development (CPD) logging, and periodic recertification at
              the end of each 3-year cycle.</p>
          </div>
        </div>

        <div class="grid grid-2">
          <div class="card">
            <div class="card-vector-icon"><svg width="22" height="22" viewBox="0 0 24 24">
                <use href="#v-shield-check" />
              </svg></div>
            <h3>Special Accommodations</h3>
            <p>GSFIN provides reasonable, verified testing accommodations for candidates with documented medical or
              learning requirements without compromising the security or psychometric validity of the examination.</p>
          </div>
          <div class="card">
            <div class="card-vector-icon"><svg width="22" height="22" viewBox="0 0 24 24">
                <use href="#v-scale" />
              </svg></div>
            <h3>Disciplinary Code of Ethics</h3>
            <p>All certified personnel must adhere strictly to professional standards. Falsification of audit findings,
              conflict concealment, or criminal negligence triggers immediate suspension or revocation.</p>
          </div>
        </div>
      </div>
    </section>
    <!-- ================== SECTION 6: VERIFY CERTIFICATE ================== -->
    <section class="s alt bordered" id="verify">
      <div class="w" style="max-width: 960px;">
        <div class="section-head" style="text-align: center; margin: 0 auto 36px;">
          <div class="eyebrow" style="justify-content: center;"><span class="eyebrow-line"></span>Official Registry
          </div>
          <h2>Verify a Certificate</h2>
          <p>Instant online verification to confirm the active status and authenticity of any certificate.</p>
        </div>

        <!-- Official Verification Portal Gateway Card -->
        <div class="portal-card">
          <div class="portal-grid">
            <div class="portal-content">
              <span class="portal-badge">
                <span class="live-dot"></span>
                Official Registry Portal
              </span>
              <h3>Centralized Credential Verification</h3>
              <p>GSFIN provides a dedicated, official online portal where employers, certification bodies, and
                regulatory agencies can directly validate certified personnel credentials in real time.</p>

              <ul class="portal-features">
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <use href="#v-shield-check" />
                  </svg>
                  <span>Instant lookup using Certificate Number or QR code</span>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <use href="#v-checklist" />
                  </svg>
                  <span>Direct confirmation of active status, validity, and scope</span>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <use href="#v-lock" />
                  </svg>
                  <span>Cryptographically verified under international conformity assessment standards</span>
                </li>
              </ul>

              <div style="margin-top: 24px;">
                <NuxtLink class="btn p lg" to="/verify">
                  <span>Go to Verification Portal</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </NuxtLink>
              </div>

              <div class="portal-meta-note">
                <svg width="15" height="15" viewBox="0 0 24 24">
                  <use href="#v-lock" />
                </svg>
                <span>Direct portal link: <NuxtLink to="/verify">https://exam.gsfin.uk/verify-certificate/</NuxtLink></span>
              </div>
            </div>

            <div class="portal-preview">
              <img src="/assets/images/credential_badge.jpg" alt="GSFIN Verified Credential Security Badge">
              <div class="portal-preview-overlay"></div>
              <div class="portal-preview-caption">
                <span style="font-weight: 600;">Secure Portal Gateway</span>
                <span style="color: var(--gold); font-weight: 600;">256-Bit SSL Encrypted</span>
              </div>
            </div>
          </div>

          <!-- Integrated Credential Security Notice -->
          <div class="portal-security-bar">
            <svg width="18" height="18" viewBox="0 0 24 24" style="color: var(--ac); flex-shrink: 0;">
              <use href="#v-shield-check" />
            </svg>
            <span>All official GSFIN certificates embed encrypted QR tokens and unique IDs. For authenticity inquiries
              or discrepancies, contact <strong>{{ contactEmail }}</strong>.</span>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- FLOATING BACK TO TOP BUTTON -->
  <button :class="['back-to-top', { visible: showBackToTop }]" id="backToTop" @click="scrollToTop"
    aria-label="Back to top">
    <svg width="20" height="20" viewBox="0 0 24 24">
      <use href="#v-arrow-up" />
    </svg>
  </button>

  <!-- FOOTER -->
  <footer>
    <div class="w">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="logo-group">
            <img class="brand-img" :src="logoSrc" alt="GSFIN Logo">
          </div>
          <p>{{ footerText }}</p>
        </div>

        <div class="footer-col">
          <h4>Navigation</h4>
          <a href="#hero">Home</a>
          <a href="#about">About Us</a>
          <a href="#schemes">Certifications</a>
          <NuxtLink to="/qualifications">Qualifications Directory</NuxtLink>
          <a href="#process">How It Works</a>
          <a href="#verify">Verify Certificate</a>
        </div>

        <div class="footer-col">
          <h4>Governance &amp; Trust</h4>
          <a href="#about">Impartiality Policy</a>
          <a href="#about">Appeals &amp; Complaints</a>
          <a href="#process">Code of Professional Ethics</a>
          <a href="#verify">Verify Certificate</a>
          <a href="#about">Special Accommodations</a>
        </div>

        <div class="footer-col">
          <h4>Certification Standards</h4>
          <p style="font-size: 13px; color: var(--mu); line-height: 1.6; margin-bottom: 8px;">Operating pursuant to
            international conformity standards:</p>
          <p style="font-size: 13px; color: var(--tx); line-height: 1.6; font-weight: 600; margin-bottom: 6px;">Personnel Conformity Assessment</p>
          <p style="font-size: 13px; color: var(--mu); line-height: 1.5;">Objective benchmarks and independent requirements for bodies operating
            certification of persons.</p>
        </div>
      </div>

      <div class="footer-bottom">
        <div>&copy; 2026 Global Standards for Food Industries (GSFIN). All rights reserved.</div>
        <div style="display: flex; gap: 20px;">
          <a href="#hero">Privacy Policy</a>
          <a href="#hero">Terms of Registration</a>
          <a href="#verify">Registry Access</a>
        </div>
      </div>
    </div>
  </footer>

  <!-- SCRIPT: SMOOTH SCROLLSPY, THEME -->
  



  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

definePageMeta({ layout: false });

useHead({
  title: 'GSFIN | Global Standards for Food Industries',
  meta: [
    {
      name: 'description',
      content: 'Global Standards for Food Industries (GSFIN) is an autonomous personnel conformity assessment body operating under international personnel certification standards for food safety, HACCP, and compliance auditors.'
    }
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600&family=Inter:wght@400;500;600&display=swap' }
  ]
});

// ── Theme State ──
const currentTheme = ref('light');

function toggleTheme() {
  currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark';
  if (process.client) {
    document.documentElement.setAttribute('data-theme', currentTheme.value);
    localStorage.setItem('gsfin_theme', currentTheme.value);
  }
}

// ── Navigation & Scroll State ──
const mobileNavOpen = ref(false);
const showBackToTop = ref(false);
const activeSection = ref('hero');
const sectionIds = ['hero', 'pillars', 'about', 'schemes', 'process', 'verify'];

function onScroll() {
  if (!process.client) return;
  const scrollPos = window.scrollY + 120;
  showBackToTop.value = window.scrollY > 350;

  for (const id of sectionIds) {
    const el = document.getElementById(id);
    if (el) {
      const top = el.offsetTop;
      const height = el.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        activeSection.value = id;
        break;
      }
    }
  }
}

function scrollToSection(id: string) {
  mobileNavOpen.value = false;
  if (!process.client) return;
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

function scrollToTop() {
  if (process.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ── API & Dynamic CMS State ──
const api = useApi();
const runtimeConfig = useRuntimeConfig();
const baseUrl = computed(() => {
  const base = runtimeConfig.public.apiBase || '';
  return base.replace(/\/api\/?$/, '');
});

const publicConfig = ref<Record<string, any>>({});
const qualifications = ref<any[]>([]);
const loadingConfig = ref(true);

const logoSrc = computed(() => {
  const logo = publicConfig.value?.app_logo;
  if (logo) {
    return logo.startsWith('http') ? logo : `${baseUrl.value}${logo.startsWith('/') ? '' : '/'}${logo}`;
  }
  return '/assets/images/logo.png';
});

const heroTitle = computed(() => {
  return publicConfig.value?.homepage_title || 'Validating Professional Competence. Establishing Global Trust';
});

const heroSubtitle = computed(() => {
  return publicConfig.value?.homepage_subtitle || 'GSFIN delivers independent third-party personnel certification in strict conformance with international conformity assessment standards. We establish objective competency benchmarks that empower food safety practitioners and safeguard industry integrity.';
});

const heroImgSrc = computed(() => {
  const custom = publicConfig.value?.homepage_hero_image_url || publicConfig.value?.homepage_hero_image;
  if (custom) {
    return custom.startsWith('http') ? custom : `${baseUrl.value}${custom.startsWith('/') ? '' : '/'}${custom}`;
  }
  return '/assets/images/hero_auditor.jpg';
});

const aboutTitle = computed(() => {
  return publicConfig.value?.homepage_about_title || 'Institutional Mandate';
});

const aboutDescription = computed(() => {
  return publicConfig.value?.homepage_about_description || 'GSFIN operates as an independent Personnel Certification Body establishing objective competency benchmarks and administering standardized assessments to validate professionals across vital technical industries.';
});

const aboutImgSrc = computed(() => {
  const custom = publicConfig.value?.homepage_about_image_url || publicConfig.value?.homepage_about_image;
  if (custom) {
    return custom.startsWith('http') ? custom : `${baseUrl.value}${custom.startsWith('/') ? '' : '/'}${custom}`;
  }
  return '/assets/images/about_governance.jpg';
});

const aboutBullets = computed(() => {
  const raw = publicConfig.value?.homepage_bullets;
  if (raw && typeof raw === 'string') {
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) return lines;
  }
  return [
    'Objective, empirical competency benchmarks aligned with international personnel certification standards',
    'Standardized, psychometrically validated assessments across technical industries',
    'Complete operational separation with zero commercial training interests'
  ];
});

function getBulletIcon(index: number) {
  const icons = ['scale', 'target', 'shield-check', 'checklist', 'award', 'globe'];
  return icons[index % icons.length];
}

const footerText = computed(() => {
  return publicConfig.value?.homepage_footer_text || 'Global Standards for Food Industries operates as an autonomous Personnel Certification Body governed under international personnel certification standards.';
});

const contactEmail = computed(() => {
  return publicConfig.value?.contact_email || 'ethics@gsfin.org';
});

const contactPhone = computed(() => {
  return publicConfig.value?.contact_phone || '+44 20 7946 0912';
});

const appName = computed(() => {
  return publicConfig.value?.app_name || 'Global Standards for Food Industries (GSFIN)';
});

// ── Default Schemes Fallback ──
const defaultSchemes = [
  {
    id: 'qual-gmp-007',
    slug: 'ghp-gmp',
    name: 'GMP & GHP',
    subtitle: 'Good Manufacturing & Hygiene Practices',
    badge_tag: 'Prerequisite',
    short_description: 'Validates personnel competency in facility sanitation, prerequisite programs (PRPs), personal hygiene controls, and contamination prevention protocols.',
    tags: ['Sanitary Controls', 'PRP Compliance', 'Hygiene Audits']
  },
  {
    id: 'qual-haccp-001',
    slug: 'codex-haccp',
    name: 'HACCP',
    subtitle: 'Hazard Analysis Critical Control Points',
    badge_tag: 'Hazard Control',
    short_description: 'Certification of practitioners leading hazard identification, critical control point (CCP) determination, monitoring systems, and validation procedures.',
    tags: ['Hazard Analysis', 'CCP Monitoring', 'Codex Principles']
  },
  {
    id: 'qual-iso22000-002',
    slug: 'iso-22000',
    name: 'ISO 22000:2018',
    subtitle: 'Food Safety Management Systems',
    badge_tag: 'Management Systems',
    short_description: 'International qualification for lead auditors and system implementers governing food chain safety, interactive communication, and prerequisite programs.',
    tags: ['FSMS Auditing', 'Traceability', 'ISO 19011']
  },
  {
    id: 'qual-safety-003',
    slug: 'food-safety',
    name: 'Food Safety',
    subtitle: 'Food Safety & Quality Assurance',
    badge_tag: 'Core Defense',
    short_description: 'Comprehensive evaluation of food safety officers managing biological, chemical, and physical risk mitigation across food processing and manufacturing.',
    tags: ['Risk Mitigation', 'Quality Assurance', 'Facility Safety']
  },
  {
    id: 'qual-iso17025-009',
    slug: 'iso-17025',
    name: 'ISO 17025:2017',
    subtitle: 'Testing & Calibration Laboratories',
    badge_tag: 'Laboratory',
    short_description: 'Validates technical competence for laboratory analysts, calibration specialists, and quality managers ensuring empirical measurement accuracy and testing integrity.',
    tags: ['Testing Accuracy', 'Calibration', 'Method Validation']
  },
  {
    id: 'qual-iso9001-010',
    slug: 'iso-9001',
    name: 'ISO 9001:2026',
    subtitle: 'Quality Management Systems',
    badge_tag: 'Quality Systems',
    short_description: 'Verification of competencies in organizational quality management, process optimization, risk-based thinking, and continuous conformity improvement.',
    tags: ['QMS Auditing', 'Process Control', 'Continuous Improvement']
  },
  {
    id: 'qual-fssc-006',
    slug: 'fssc-22000',
    name: 'FSSC 22000',
    subtitle: 'Food Safety System Certification',
    badge_tag: 'GFSI Benchmark',
    short_description: 'Rigorous credential for lead auditors and food industry professionals operating under GFSI-benchmarked requirements for processing and packaging.',
    tags: ['GFSI Benchmark', 'Scheme Integrity', 'Food Defense']
  },
  {
    id: 'qual-brcgs-005',
    slug: 'brcgs',
    name: 'BRCGS',
    subtitle: 'Brand Reputation Compliance Global Standard',
    badge_tag: 'Global Standard',
    short_description: 'Competency certification for specialists implementing and auditing benchmarked global standards for food safety, packaging materials, and storage logistics.',
    tags: ['BRCGS Standards', 'Packaging & Storage', 'Supplier Integrity']
  }
];

const displaySchemes = computed(() => {
  if (qualifications.value && qualifications.value.length > 0) {
    return qualifications.value.map(q => ({
      id: q.id,
      slug: q.slug,
      name: q.name,
      subtitle: q.subtitle || q.name,
      badge_tag: q.badge_tag || q.category || 'Standard',
      short_description: q.short_description || q.full_description || '',
      image_url: q.image_url,
      tags: (Array.isArray(q.key_modules) && q.key_modules.length)
        ? q.key_modules.slice(0, 3)
        : (Array.isArray(q.prerequisites) && q.prerequisites.length)
          ? q.prerequisites.slice(0, 3)
          : ['Conformity Standard', 'Auditing', 'Competency']
    }));
  }
  return defaultSchemes;
});

function getSchemeImage(scheme: any) {
  const schemeImageMap: Record<string, string> = {
    'codex-haccp': '/assets/images/scheme_haccp.jpg',
    'iso-22000': '/assets/images/scheme_fsms.jpg',
    'food-safety': '/assets/images/prog_food_safety.jpg',
    'food-technology': '/assets/images/prog_gmp.jpg',
    'brcgs': '/assets/images/prog_brcgs.jpg',
    'fssc-22000': '/assets/images/prog_fssc22000.jpg',
    'ghp-gmp': '/assets/images/prog_gmp.jpg',
    'food-microbiology': '/assets/images/lab_testing.jpg',
    'iso-17025': '/assets/images/prog_iso17025.jpg',
    'iso-9001': '/assets/images/prog_iso9001.jpg',
  };

  if (scheme.slug && schemeImageMap[scheme.slug]) {
    return schemeImageMap[scheme.slug];
  }
  if (scheme.image_url) {
    if (scheme.image_url.startsWith('http')) return scheme.image_url;
    if (scheme.image_url.startsWith('/uploads/')) return `${baseUrl.value}${scheme.image_url}`;
    return scheme.image_url;
  }
  return '/assets/images/hero_auditor.jpg';
}

async function fetchPublicData() {
  try {
    const [cfgRes, qualRes] = await Promise.all([
      api.get('/public/config').catch(() => ({ data: {} })),
      api.get('/public/qualifications').catch(() => ({ data: [] }))
    ]);
    if (cfgRes?.data) {
      publicConfig.value = cfgRes.data;
    }
    if (Array.isArray(qualRes?.data)) {
      qualifications.value = qualRes.data;
    }
  } catch (err) {
    console.error('Failed to load public home page configuration:', err);
  } finally {
    loadingConfig.value = false;
  }
}

// ── Partner Modal State & Form ──
const showPartnerModal = ref(false);
const partnerSubmitting = ref(false);
const partnerSuccess = ref(false);
const partnerError = ref('');

const partnerForm = ref({
  organizationName: '',
  contactName: '',
  email: '',
  phone: '',
  country: '',
  city: '',
  programs: [] as string[],
  institutionType: 'Authorized Training Center',
  message: ''
});

const availablePrograms = [
  { id: 'ISO 22000', label: 'ISO 22000 FSMS' },
  { id: 'CODEX HACCP', label: 'CODEX HACCP' },
  { id: 'GMP', label: 'GMP & GHP' },
  { id: 'BRCGS', label: 'BRCGS Standards' },
  { id: 'FSSC 22000', label: 'FSSC 22000' },
  { id: 'ISO 17025', label: 'ISO 17025 Testing' }
];

function toggleProgram(progId: string) {
  const index = partnerForm.value.programs.indexOf(progId);
  if (index > -1) {
    partnerForm.value.programs.splice(index, 1);
  } else {
    partnerForm.value.programs.push(progId);
  }
}

function openPartnerModal() {
  showPartnerModal.value = true;
  partnerSuccess.value = false;
  partnerError.value = '';
}

function closePartnerModal() {
  showPartnerModal.value = false;
}

async function submitPartnerInquiry() {
  if (partnerForm.value.programs.length === 0) {
    partnerError.value = 'Please select at least one accreditation program.';
    return;
  }
  partnerSubmitting.value = true;
  partnerError.value = '';
  try {
    await api.post('/public/inquiries', {
      type: 'partner',
      organization_name: partnerForm.value.organizationName,
      contact_name: partnerForm.value.contactName,
      email: partnerForm.value.email,
      phone: partnerForm.value.phone,
      country: partnerForm.value.country,
      city: partnerForm.value.city,
      institution_type: partnerForm.value.institutionType,
      programs: partnerForm.value.programs,
      message: partnerForm.value.message
    });
    partnerSuccess.value = true;
  } catch (err: any) {
    partnerError.value = err.response?.data?.message || err.message || 'Failed to submit application.';
  } finally {
    partnerSubmitting.value = false;
  }
}

onMounted(() => {
  fetchPublicData();
  if (process.client) {
    const savedTheme = localStorage.getItem('gsfin_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    currentTheme.value = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
});

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('scroll', onScroll);
  }
});
</script>

<style>
@import '~/assets/css/landing.css';


</style>
