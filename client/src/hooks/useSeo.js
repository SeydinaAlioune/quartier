import { useEffect } from 'react';

const upsertMeta = (selector, attrs) => {
  if (typeof document === 'undefined') return null;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    Object.entries(attrs.identity || {}).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  }
  Object.entries(attrs.set || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    el.setAttribute(k, String(v));
  });
  return el;
};

const upsertLink = (selector, attrs) => {
  if (typeof document === 'undefined') return null;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('link');
    Object.entries(attrs.identity || {}).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  }
  Object.entries(attrs.set || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    el.setAttribute(k, String(v));
  });
  return el;
};

const toAbsoluteUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : '';
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  return base ? `${base}${withSlash}` : withSlash;
};

const stripHtml = (value) => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export default function useSeo({
  title,
  description,
  image,
  url,
  canonical,
  siteName = 'QuartierConnect',
} = {}) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const pageTitle = title ? `${title} — ${siteName}` : siteName;
    document.title = pageTitle;

    const desc = description ? stripHtml(description).slice(0, 200) : '';
    if (desc) {
      upsertMeta('meta[name="description"]', {
        identity: { name: 'description' },
        set: { content: desc },
      });
    }

    const absoluteUrl = url ? toAbsoluteUrl(url) : (typeof window !== 'undefined' ? window.location.href : '');
    const absoluteCanonical = canonical ? toAbsoluteUrl(canonical) : absoluteUrl;
    const absoluteImage = image ? toAbsoluteUrl(image) : toAbsoluteUrl('/logo192.png');

    upsertLink('link[rel="canonical"]', {
      identity: { rel: 'canonical' },
      set: { href: absoluteCanonical },
    });

    upsertMeta('meta[property="og:site_name"]', {
      identity: { property: 'og:site_name' },
      set: { content: siteName },
    });

    upsertMeta('meta[property="og:title"]', {
      identity: { property: 'og:title' },
      set: { content: pageTitle },
    });

    if (desc) {
      upsertMeta('meta[property="og:description"]', {
        identity: { property: 'og:description' },
        set: { content: desc },
      });
    }

    if (absoluteUrl) {
      upsertMeta('meta[property="og:url"]', {
        identity: { property: 'og:url' },
        set: { content: absoluteUrl },
      });
    }

    if (absoluteImage) {
      upsertMeta('meta[property="og:image"]', {
        identity: { property: 'og:image' },
        set: { content: absoluteImage },
      });
    }

    upsertMeta('meta[name="twitter:card"]', {
      identity: { name: 'twitter:card' },
      set: { content: 'summary_large_image' },
    });

    upsertMeta('meta[name="twitter:title"]', {
      identity: { name: 'twitter:title' },
      set: { content: pageTitle },
    });

    if (desc) {
      upsertMeta('meta[name="twitter:description"]', {
        identity: { name: 'twitter:description' },
        set: { content: desc },
      });
    }

    if (absoluteImage) {
      upsertMeta('meta[name="twitter:image"]', {
        identity: { name: 'twitter:image' },
        set: { content: absoluteImage },
      });
    }
  }, [canonical, description, image, siteName, title, url]);
}
