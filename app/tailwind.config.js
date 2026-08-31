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
      // ── 页面底色（宣纸色系） ──
      colors: {
        surface: {
          50:  '#FAFAF7',  // 页面底色（宣纸白）
          100: '#F5F4EF',  // 卡片/面板背景（生宣）
          200: '#EDECE6',  // 输入框/分隔区域（熟宣）
          300: '#E0DFD8',  // 边框、分割线
          800: '#3A3833',  // 深色卡片背景（淡浓墨）
          900: '#2D2B26',  // 深色页面底色（淡墨）
          950: '#252320',  // 深色最底层
        },

        // ── 主色：朱砂红 ──
        primary: {
          50:  '#FEF2F0',
          100: '#FDDDD8',
          200: '#FABAAC',
          300: '#F59080',
          400: '#E8645A',
          500: '#C23B22',  // 朱砂红
          600: '#A9321D',
          700: '#8F2918',
          800: '#752113',
          900: '#5C190E',
        },

        // ── 辅色：石青 ──
        secondary: {
          50:  '#F0F6FA',
          100: '#D8E8F2',
          200: '#B1D1E5',
          300: '#8AB9D8',
          400: '#5A9CC0',
          500: '#2C5F7C',  // 石青
          600: '#244D65',
          700: '#1C3B4E',
          800: '#142937',
          900: '#0C1720',
        },

        // ── 强调色：藤黄 ──
        accent: {
          50:  '#FDF8EB',
          100: '#FAEEC8',
          200: '#F5DD91',
          300: '#EFC94A',
          400: '#E8B804',
          500: '#E8B004',  // 藤黄
          600: '#C49403',
          700: '#A07803',
          800: '#7C5C02',
          900: '#584001',
        },

        // ── 语义色 ──
        success: {
          50:  '#F0F7F3',
          100: '#D4EDE0',
          500: '#3B7A57',  // 松花绿
          600: '#2F6347',
          700: '#244C37',
        },
        warning: {
          50:  '#FDF3EE',
          100: '#F9DFD3',
          500: '#D4652F',  // 琥珀橙
          600: '#B55426',
          700: '#8F411D',
        },
        error: {
          50:  '#FEF0F2',
          100: '#FDD4DA',
          500: '#E84057',  // 胭脂
          600: '#C9354A',
          700: '#A52A3B',
        },

        // ── 暖棕：赭石 ──
        earth: {
          50:  '#FBF6F1',  // 微暖背景
          100: '#F0E4D8',  // 选中/高亮背景
          200: '#DEC8AD',  // 边框强调
          300: '#C9AA82',  // 次要边框
          400: '#B08D5C',  // 图标/装饰
          500: '#955539',  // 赭石主色
          600: '#7A4430',  // 深色变体
          700: '#5E3425',  // 文字/图标深色
        },
      },

      // ── 渐变（仅保留水墨晕染） ──
      backgroundImage: {
        'wash-xuan': 'linear-gradient(135deg, #FAFAF7 0%, #F5F4EF 50%, #EDECE6 100%)',
        'wash-xuan-dark': 'linear-gradient(135deg, #2D2B26 0%, #3A3833 50%, #252320 100%)',
      },

      // ── 字体 ──
      fontFamily: {
        heading: ['"Noto Serif SC"', '"STSong"', '"SimSun"', 'serif'],
        body: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },

      // ── 阴影（减轻） ──
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'none': 'none',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}
