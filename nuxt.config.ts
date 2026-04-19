import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-11-23',
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
    pageTransition: {
      name: 'page-slide-right',
      mode: 'out-in',
    },
  },
  site: {
    url: 'https://kinome.app',
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        '@vercel/analytics/vue',
        'vue3-apexcharts',
        '@lucide/vue',
        'pluralize', // CJS
        '@vueuse/core',
        '@supabase/supabase-js',
        '@ericblade/quagga2', // CJS
        '@supabase/postgrest-js',
      ],
    },
  },
  devtools: {
    enabled: false,
  },
  runtimeConfig: {
    gptKey: process.env.NUXT_PRIVATE_GPT_KEY,
    adminUuid: process.env.NUXT_PUBLIC_ADMIN_ID,
    bypassAuth: process.env.NUXT_PRIVATE_BYPASS_AUTH,
  },
  imports: {
    dirs: [
      'types',
      'utils/db',
      'utils/gpt',
      'utils/format',
      'utils/calculation',
      'utils/db/getters',
      'utils/helpers',
      'utils/db/setters',
      'utils/types',
      'utils/calculation',
      'utils/directives',
      'utils/constants',
      'utils/format/toHumanReadable',
      'utils/nutrition',
    ],
  },
  components: [
    {
      path: '~/components',
      pathPrefix: true,
    },
  ],
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    '@nuxt/image',
    '@nuxtjs/sitemap',
    'nuxt-lucide-icons',
    '@nuxt/content',
    '@nuxt/fonts',
    'nuxt-og-image',
  ],
  fonts: {
    defaults: {
      weights: [400, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
    },
    families: [
      { name: 'Inter', provider: 'google', global: true },
      { name: 'Fraunces', provider: 'google', global: true },
      { name: 'JetBrains Mono', provider: 'google', global: true },
    ],
  },
  lucide: {
    namePrefix: 'Icon',
  },
  supabase: {
    url: process.env.NUXT_PUBLIC_SUPABASE_URL,
    key: process.env.NUXT_PUBLIC_SUPABASE_KEY,
    secretKey: process.env.NUXT_PRIVATE_SERVICE_ROLE_KEY,
    redirect: false,
    types: 'types/supabase.ts',
  },
  routeRules: {
    '/recipe-analyzer': { sitemap: { priority: 1.0, changefreq: 'weekly' } },
  },
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    exclude: [
      '/community/**',
      '/__rq/**',
      '/admin/**',
      '/account/**',
      '/demos/**',
      '/login/**',
      '/onboarding/**',
      '/overview/**',
      '/foods/scan/**',
      '/kitchen/cookbook/**',
      '/kitchen/recommendations/**',
      '/profile/**',
      '/tracking/saved/**',
      '/tracking/settings/**',
      '/tracking/trends/**',
      '/logout/**',
    ],
  },
});
