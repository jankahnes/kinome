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
      mode: 'default',
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
  nitro: {
    compressPublicAssets: true,
  },
  devtools: {
    enabled: false,
  },
  runtimeConfig: {
    gptKey: process.env.NUXT_PRIVATE_GPT_KEY,
    adminUuid: process.env.NUXT_PUBLIC_ADMIN_ID,
    bypassAuth: process.env.NUXT_PRIVATE_BYPASS_AUTH,
    agentInternalSecret: process.env.AGENT_INTERNAL_SECRET,
    agentPileOnCap: process.env.AGENT_PILE_ON_CAP,
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
  image: {
    provider: 'ipx',
    format: ['webp'],
    domains: [
      'smovbezqgvxljtvdzvhp.supabase.co',
      'img.youtube.com',
      'i.ytimg.com',
    ],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    },
  },
  fonts: {
    defaults: {
      weights: [200, 300, 400, 500, 600, 700],
      styles: ['normal', 'italic'],
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
    types: '~/types/supabase.ts',
  },
  routeRules: {
    '/recipe-analyzer': { sitemap: { priority: 1.0, changefreq: 'weekly' } },
    '/recipe/1490-hot-honey-baked-feta-salmon-pasta': {
      redirect: {
        to: '/recipe/1499-hot-honey-baked-feta-salmon-pasta',
        statusCode: 301,
      },
    },
  },
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    exclude: [
      '/community',
      '/community/**',
      '/__rq',
      '/__rq/**',
      '/admin',
      '/admin/**',
      '/account',
      '/account/**',
      '/demos',
      '/demos/**',
      '/login',
      '/login/**',
      '/onboarding',
      '/onboarding/**',
      '/overview',
      '/overview/**',
      '/foods/new',
      '/foods/new/**',
      '/foods/scan',
      '/foods/scan/**',
      '/foods/*/report',
      '/foods/*/report/**',
      '/kitchen',
      '/kitchen/recommendations',
      '/kitchen/recommendations/**',
      '/profile',
      '/profile/**',
      '/recipe/*/report',
      '/recipe/*/report/**',
      '/tracking',
      '/tracking/**',
      '/tracking/saved/**',
      '/tracking/settings/**',
      '/tracking/trends/**',
      '/logout',
      '/logout/**',
    ],
  },
});
