/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './nuxt.config.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        // 宣纸系（纸张色阶）
        paper: {
          50: '#FBF7EE',
          100: '#F5EFE0',
          200: '#EDE3CC',
          300: '#DFD2B0',
          400: '#C9B889',
          500: '#A8946A',
        },
        // 墨黛系（深墨黑）
        ink: {
          50: '#F5F4F1',
          100: '#E8E5DC',
          200: '#C7C0AF',
          300: '#8A8270',
          400: '#4A4639',
          500: '#2B2820',
          600: '#1F1D17',
          700: '#171511',
          800: '#0E0D0A',
          900: '#070605',
        },
        // 朱砂系（印章红）
        cinnabar: {
          50: '#FCF1EE',
          100: '#F5D9D2',
          200: '#E8AFA0',
          300: '#D8806D',
          400: '#C45A45',
          500: '#B8403F',
          600: '#962E2E',
          700: '#7A2424',
          800: '#5C1A1A',
          900: '#3F1212',
        },
        // 茶褐系
        tea: {
          50: '#F7F1E8',
          100: '#E8D9C2',
          200: '#D2BC97',
          300: '#B89E6F',
          400: '#9A8352',
          500: '#8B6F47',
          600: '#705536',
          700: '#5A4228',
          800: '#43321E',
          900: '#2C2114',
        },
        // 竹青系
        bamboo: {
          50: '#EEF3EE',
          100: '#D4E0D5',
          200: '#A8BEAA',
          300: '#7D9C7F',
          400: '#5C8D6C',
          500: '#46714F',
          600: '#365A3E',
          700: '#28422D',
          800: '#1A2B1D',
          900: '#0F1810',
        },
        // 鎏金系
        gilt: {
          50: '#FBF6EA',
          100: '#F3E6C3',
          200: '#E5CD87',
          300: '#D2B05A',
          400: '#B89968',
          500: '#9A7E48',
          600: '#7C6438',
          700: '#5D4A28',
          800: '#3F3219',
          900: '#221A0C',
        },
      },
      fontFamily: {
        // 显示字体：思源宋体
        serif: ['"Noto Serif SC"', '"Songti SC"', '"STSong"', 'serif'],
        // 正文：霞鹜文楷
        kai: ['"LXGW WenKai"', '"Kaiti SC"', '"STKaiti"', 'serif'],
        // 拉丁衬线：Cormorant Garamond
        latin: ['"Cormorant Garamond"', '"Fraunces"', 'serif'],
        // 拉丁无衬线（小标签用）：Fraunces
        sans: ['"Noto Serif SC"', '"Songti SC"', 'serif'],
      },
      boxShadow: {
        'paper': '0 1px 0 rgba(43, 40, 32, 0.06), 0 8px 24px -12px rgba(43, 40, 32, 0.10)',
        'paper-lg': '0 1px 0 rgba(43, 40, 32, 0.06), 0 24px 60px -24px rgba(43, 40, 32, 0.18)',
        'seal': '0 0 0 1px rgba(184, 64, 63, 0.15), 0 2px 8px -2px rgba(184, 64, 63, 0.25)',
      },
      letterSpacing: {
        'editorial': '0.08em',
        'seal': '0.25em',
      },
      maxWidth: {
        'editorial': '72rem',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}
