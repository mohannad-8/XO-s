// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-10-10',

  modules: ['@nuxt/fonts'],

  css: ['~/assets/css/main.css'],

  fonts: {
    families: [
      { name: 'IBM Plex Sans Arabic', provider: 'google', weights: [400, 500, 700] },
    ],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'ar', dir: 'rtl' },
      title: 'XO؟',
      meta: [
        { name: 'description', content: 'لعبة XO تقليدية... إلا أن الغش فيها مسموح. العبوا ضد الجهاز، وجهًا لوجه على نفس الهاتف، أو أونلاين مع صديق.' },
        { name: 'color-scheme', content: 'light dark' },
      ],
      // يقرأ الثيم المحفوظ قبل أول رسم لتفادي "فلاش" الثيم الخاطئ
      script: [
        {
          innerHTML: "try{const t=localStorage.getItem('xo-theme');if(t)document.documentElement.dataset.theme=t;}catch{}",
          tagPosition: 'head',
        },
      ],
    },
  },

  nitro: {
    experimental: {
      websocket: true,
    },
  },
})
