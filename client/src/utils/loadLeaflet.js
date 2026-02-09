const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

const hasLeaflet = () => typeof window !== 'undefined' && window.L;

const ensureCss = () => {
  if (typeof document === 'undefined') return;
  const exists = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .some((l) => String(l.getAttribute('href') || '').includes('leaflet'));
  if (exists) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = LEAFLET_CSS;
  document.head.appendChild(link);
};

const ensureScript = () => {
  if (typeof document === 'undefined') return Promise.resolve();
  const existing = Array.from(document.querySelectorAll('script'))
    .find((s) => String(s.getAttribute('src') || '').includes('leaflet'));
  if (existing) {
    if (hasLeaflet()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', resolve);
      existing.addEventListener('error', reject);
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Leaflet failed to load'));
    document.body.appendChild(script);
  });
};

const loadLeaflet = async () => {
  if (hasLeaflet()) return window.L;
  ensureCss();
  await ensureScript();
  return window.L;
};

export default loadLeaflet;
