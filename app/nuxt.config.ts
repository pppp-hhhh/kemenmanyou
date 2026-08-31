// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/logo3.png' },
      ],
    },
  },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
  ],

  // 运行时配置（本地数据库模式：数据由 app/server/utils/local-db.ts 管理，不再直连 Supabase）
  runtimeConfig: {
    pythonBackendUrl: process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8001',
    AUTH_SECRET: process.env.AUTH_SECRET || process.env.INVITE_CODE_SECRET || '',
    public: {},
  },

  routeRules: {
    '/workspace': { appMiddleware: ['auth'] },
    '/profile': { appMiddleware: ['auth'] },
    '/my-works': { appMiddleware: ['auth'] },
    '/admin/**': { appMiddleware: ['admin'] },
  },

  typescript: {
    strict: true,
  },

  vite: {
    server: {
      allowedHosts: true,
    },
  },
})
