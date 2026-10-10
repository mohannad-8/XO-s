export function useTheme() {
  function toggle() {
    const root = document.documentElement
    const dark = (root.dataset.theme || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light')) === 'dark'
    root.dataset.theme = dark ? 'light' : 'dark'
    try {
      localStorage.setItem('xo-theme', root.dataset.theme)
    }
    catch {
      // بعض المتصفحات تمنع localStorage (وضع التصفح الخاص)؛ تبديل الثيم ما زال يعمل لهذه الجلسة
    }
  }

  return { toggle }
}
