// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      title: '课文漫游 · 画册',
      htmlAttrs: { lang: 'zh-CN' },
      link: [
        { rel: 'icon', type: 'image/png', href: '/logo3.png' },
        // 思源宋体（显示标题）
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;700;900&display=swap',
        },
        // 拉丁衬线（数字、英文）
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Fraunces:ital,wght@0,400;0,600;1,400&display=swap',
        },
        // 霞鹜文楷（正文）
        {
          rel: 'stylesheet',
          href: 'https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css',
        },
      ],
    },
  },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
  ],

  // 运行时配置
  runtimeConfig: {
    supabaseKey: process.env.SUPABASE_KEY || 'sb_publishable_p8dfH6Su7mQ13TeQfqvCRg_dKdQHWqz',
    public: {
      supabaseUrl: 'https://sxxngtcljzwhvajubwno.supabase.co',
    },
  },

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
