// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
  vite: {
    plugins: [
        tailwindcss(),
    ],
  },
  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    'shadcn-nuxt',
    '@pinia/nuxt',
    '@nuxtjs/color-mode'
  ],
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui'
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000'
    }
  },

  colorMode: {
    classSuffix: ''
  },

  ssr: true
})