// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  devServer: {
    host: '127.0.0.1',
    port: 3000
  },
  vite: {
    server: {
      watch: {
        usePolling: true
      }
    }
  },

  experimental: {
    appManifest: false
  },

  sourcemap: {
    server: false,
    client: false
  },

  modules: [
    'vuetify-nuxt-module',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@vueuse/motion/nuxt',
    'nuxt-icon',
    '@nuxtjs/google-fonts',
    '@nuxtjs/robots'
  ],
  site: {
    url: 'http://localhost:3000',
  },



  robots: {
    disallow: ['/dashboard/', '/exam/', '/learn/'],
    allow: ['/']
  },

  googleFonts: {
    families: {
      'Plus Jakarta Sans': [400, 500, 600, 700, 800],
      Inter: [400, 500, 600, 700],
      'JetBrains Mono': [400, 500, 600]
    },
    display: 'swap'
  },

  vuetify: {
    moduleOptions: {
      /* module specific options */
    },
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light',
        themes: {
          light: {
            dark: false,
            colors: {
              primary: '#2563EB',     /* 10% Electric Blue CTA */
              secondary: '#64748B',   /* Slate Muted */
              accent: '#F43F5E',      /* Coral Pink Highlight */
              background: '#F8FAFC',  /* 60% Dominant Neutral Light */
              surface: '#FFFFFF',     /* 30% Card Surface */
              error: '#F43F5E',
              success: '#10B981',
              warning: '#F59E0B',
              info: '#3B82F6'
            }
          },
          dark: {
            dark: true,
            colors: {
              primary: '#3B82F6',
              secondary: '#94A3B8',
              accent: '#F43F5E',
              background: '#0B0F17',
              surface: '#1E293B',
              error: '#F43F5E',
              success: '#10B981',
              warning: '#F59E0B',
              info: '#3B82F6'
            }
          }
        }
      },
      defaults: {
        VCard: {
          elevation: 0,
          rounded: 'lg',
        },
        VBtn: {
          elevation: 0,
          rounded: 'lg',
          style: 'text-transform: none; font-weight: 600;'
        },
        VAppBar: {
          elevation: 0
        },
        VTextField: {
          variant: 'outlined',
          density: 'comfortable',
          color: 'primary',
        },
        VSelect: {
          variant: 'outlined',
          density: 'comfortable',
          color: 'primary',
        },
        VChip: {
          rounded: 'pill',
          variant: 'flat',
          style: 'font-weight: 600; font-size: 12px;'
        }
      }
    }
  },

  css: [
    '@mdi/font/css/materialdesignicons.css',
    '@/assets/css/design-system.css',
    '@/assets/styles/base.css',
    '@/assets/styles/main.css',
    '@/assets/css/tokens.css'
  ],

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || process.env.API_BASE_URL || 'http://127.0.0.1:5002/api',
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'
    }
  },

  app: {
    head: {
      titleTemplate: '%s',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Kefta Talent Hunt' }
      ],
      link: [
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css' }
      ],
      script: [
        { src: 'https://checkout.razorpay.com/v1/checkout.js', defer: true }
      ]
    }
  }
})
