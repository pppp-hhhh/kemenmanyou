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

  // 运行时配置
  runtimeConfig: {
    supabaseKey: process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2aGpjcW5zdnJuamVqd2dkcmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5OTQ4MjIsImV4cCI6MjA5MzU3MDgyMn0.7Fb_w64OvFjkhqGde8fPk_w2Qv446RBZXJCues0SdB4',
    public: {
      supabaseUrl: 'https://yvhjcqnsvrnjejwgdrlr.supabase.co',
    },
  },

  // API 代理配置 - 已禁用，改用 server routes 直接调用
  // nitro: {
  //   routeRules: {
  //     '/api/**': { proxy: 'http://localhost:8000/**' },
  //     '/static/**': { proxy: 'http://localhost:8000/**' },
  //   },
  // },

  // 路由规则
  routeRules: {
    '/workspace': { appMiddleware: ['auth'] },
    '/profile': { appMiddleware: ['auth'] },
    '/my-works': { appMiddleware: ['auth'] },
    '/admin/**': { appMiddleware: ['admin'] },
  },

  // TypeScript 严格模式
  typescript: {
    strict: true,
  },
})
