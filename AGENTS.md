# GSFIN Developer & AI Agent Guidelines

## 1. UI/UX Design System & Styling Architecture

### The Core Styling Rule
- This Nuxt 3 project uses **Vuetify 3** and custom GSFIN scoped CSS design tokens located in `frontend/assets/css/design-system.css`.
- **CRITICAL:** Do NOT rely on Tailwind CSS compiling arbitrary utilities. Always write explicit, scoped CSS (`<style scoped>`) for page-level components or use the verified layout utilities in `design-system.css`.

### Visual Design Tokens
- **Primary Brand Accent:** `#E31B23` (GSFIN Red)
  - Soft Red Tint: `rgba(227, 27, 35, 0.08)` / `#FEF2F2`
  - Red Border: `rgba(227, 27, 35, 0.25)`
  - Active Button: `.btn-red` (`background: #E31B23; color: #FFFFFF; font-weight: 600;`)
- **Neutrals & Typography:**
  - Page Background: `#F8FAFC`
  - Surface Cards: `#FFFFFF`
  - Main Heading / Text: `#0F172A` (Slate-900)
  - Muted Subtitle / Labels: `#64748B` (Slate-500)
  - Subtle Borders: `1px solid rgba(15, 23, 42, 0.08)`
  - Card Radii: `16px - 20px`
  - Card Shadows: `0 4px 16px rgba(15, 23, 42, 0.02)`
- **Typography Standards:**
  - Font weights must be strictly **$\le 600$** (Semi-Bold max). Avoid heavy bold (`font-black`, 800, 900).
- **Icons (`@mdi/font`):**
  - Always verify icon names against `@mdi/font` v7.4.47.
  - E.g., use `mdi-calendar-start` / `mdi-calendar-end` (not invalid names like `mdi-door-open`).

---

## 2. Multi-Tenant Role & Route Protection
- Every sub-center route (`/sub-center/*`) MUST declare:
  ```typescript
  definePageMeta({
    layout: 'dashboard',
    middleware: ['auth', 'role'],
    role: ['super_admin', 'sub_center_staff']
  });
  ```
- All batch and student database queries must strictly isolate `org_id` to enforce multi-tenant separation.
