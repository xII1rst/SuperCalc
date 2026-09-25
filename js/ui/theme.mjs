const STORAGE_KEY = 'sc-theme';
const META_COLOR = { dark: '#0a0f1a', light: '#fffdf7' };

export function applyTheme(theme, { persist = true, notify = true } = {}) {
  const next = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  const button = document.getElementById('theme-switch');
  button?.setAttribute('aria-checked', String(next === 'light'));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = META_COLOR[next];
  if (persist) {
    try { localStorage.setItem(STORAGE_KEY, next); } catch (_) { /* modo privado */ }
  }
  if (notify && document.dispatchEvent) document.dispatchEvent(new Event('supercalc:themechange'));
  return next;
}

export function initTheme() {
  let theme = document.documentElement.dataset.theme;
  try { theme = localStorage.getItem(STORAGE_KEY) || theme; } catch (_) { /* modo privado */ }
  return applyTheme(theme, { persist: false, notify: false });
}

export function toggleTheme() {
  return applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
}
