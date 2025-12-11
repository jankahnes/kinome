import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-11-23',
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      link: [
        {
          rel: 'preload',
          href: '/fonts/LibertinusSans-Regular.woff2',
          as: 'font',
          type: 'font/woff2',
          crossorigin: '',
        },
        {
          rel: 'preload',
          href: '/fonts/LibertinusSans-Bold.woff2',
          as: 'font',
          type: 'font/woff2',
          crossorigin: '',
        },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
    pageTransition: {
      name: 'page-slide-right',
      mode: 'out-in',
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  devtools: {
    enabled: false,
  },
  runtimeConfig: {
    gptKey: process.env.NUXT_PRIVATE_GPT_KEY,
    adminUuid: process.env.NUXT_PUBLIC_ADMIN_ID,
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
  ],
  lucide: {
    namePrefix: 'Icon',
  },
  supabase: {
    url: process.env.NUXT_PUBLIC_SUPABASE_URL,
    key: process.env.NUXT_PUBLIC_SUPABASE_KEY,
    serviceKey: process.env.NUXT_PRIVATE_SERVICE_ROLE_KEY,
    redirect: false,
    types: 'types/supabase.ts',
  },
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    exclude: [],
  },
});
