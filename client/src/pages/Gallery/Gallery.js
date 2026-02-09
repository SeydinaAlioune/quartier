import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import './Gallery.css';

const Gallery = () => {
  const API_BASE = (() => {
    const raw = (api.defaults.baseURL || process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
    if (raw) return raw;
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      return 'https://quartier.onrender.com';
    }
    return 'http://localhost:5000';
  })();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all'); // image | video | all
  const [viewerIndex, setViewerIndex] = useState(null); // index in filtered
  const [durations, setDurations] = useState({}); // { [id]: seconds }
  const [videoThumbs, setVideoThumbs] = useState({}); // { [id]: dataUrl }

  const fetchMedia = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      params.set('status', 'approved');
      params.set('page', '1');
      params.set('limit', '100');
      if (type !== 'all') params.set('type', type);
      // Pas de recherche backend pour l'instant, on filtrera côté client sur title/description
      const res = await api.get(`/api/media?${params.toString()}`);
      const payload = res?.data;
      const list = Array.isArray(payload?.media) ? payload.media : (Array.isArray(payload) ? payload : []);
      setItems(list);
    } catch (e) {
      setError("Impossible de charger la galerie.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Heuristique MIME pour les vidéos
  const inferMime = (url = '') => {
    const lower = String(url).toLowerCase();
    if (lower.endsWith('.mp4')) return 'video/mp4';
    if (lower.endsWith('.webm')) return 'video/webm';
    if (lower.endsWith('.ogg') || lower.endsWith('.ogv')) return 'video/ogg';
    if (lower.endsWith('.mov')) return 'video/quicktime';
    return undefined;
  };

  const buildMediaUrl = (url = '') => {
    const raw = String(url || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
    return `${API_BASE}${withSlash}`;
  };

  const formatDuration = (seconds) => {
    const s = Number(seconds);
    if (!Number.isFinite(s) || s <= 0) return '';
    const total = Math.floor(s);
    const mm = Math.floor(total / 60);
    const ss = String(total % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const VideoThumb = ({ id, url, title, thumbnail }) => {
    const mediaUrl = buildMediaUrl(url);
    const thumbUrl = buildMediaUrl(thumbnail);

    useEffect(() => {
      if (!id || !mediaUrl) return;
      if (durations[id] && (thumbUrl || videoThumbs[id])) return;

      let cancelled = false;
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.muted = true;
      v.playsInline = true;
      v.crossOrigin = 'anonymous';
      v.src = mediaUrl;

      const onMeta = () => {
        if (cancelled) return;
        const d = v.duration;
        if (Number.isFinite(d) && d > 0) {
          setDurations((prev) => (prev[id] ? prev : { ...prev, [id]: d }));
        }
        try {
          v.currentTime = Math.min(0.25, Math.max(0.01, d ? d * 0.01 : 0.1));
        } catch {
        }
      };

      const onSeeked = () => {
        if (cancelled) return;
        if (thumbUrl) return;
        try {
          const canvas = document.createElement('canvas');
          const w = v.videoWidth || 640;
          const h = v.videoHeight || 360;
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(v, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          if (dataUrl && dataUrl.startsWith('data:image')) {
            setVideoThumbs((prev) => (prev[id] ? prev : { ...prev, [id]: dataUrl }));
          }
        } catch {
        }
      };

      v.addEventListener('loadedmetadata', onMeta);
      v.addEventListener('seeked', onSeeked);
      v.addEventListener('loadeddata', onSeeked);

      v.load();

      return () => {
        cancelled = true;
        try {
          v.pause();
          v.removeAttribute('src');
          v.load();
        } catch {
        }
        v.removeEventListener('loadedmetadata', onMeta);
        v.removeEventListener('seeked', onSeeked);
        v.removeEventListener('loadeddata', onSeeked);
      };
    }, [id, mediaUrl, thumbUrl]);

    const dur = formatDuration(durations[id]);
    const thumb = thumbUrl || videoThumbs[id];

    return (
      <>
        {thumb ? (
          <img loading="lazy" src={thumb} alt={title || 'vidéo'} />
        ) : (
          <div className="video-thumb" aria-hidden>
            <div className="video-thumb__icon">▶</div>
            <div className="video-thumb__label">Vidéo</div>
          </div>
        )}
        <div className="media-badges" aria-hidden>
          <span className="media-badge">VIDÉO</span>
          {dur && <span className="media-badge media-badge--soft">{dur}</span>}
        </div>
      </>
    );
  };

  useEffect(() => { fetchMedia(); /* initial */ }, []);
  useEffect(() => {
    const t = setTimeout(() => fetchMedia(), 250);
    return () => clearTimeout(t);
  }, [type]);

  const filtered = items.filter(m => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const name = (m.title || m.name || '').toLowerCase();
    const desc = (m.description || '').toLowerCase();
    return name.includes(q) || desc.includes(q);
  });

  const viewerItem = (typeof viewerIndex === 'number' && viewerIndex >= 0 && viewerIndex < filtered.length)
    ? filtered[viewerIndex]
    : null;

  // Fermer la lightbox avec ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setViewerIndex(null);
      if (viewerIndex === null) return;
      if (e.key === 'ArrowRight') setViewerIndex((i) => {
        if (typeof i !== 'number') return i;
        return Math.min(filtered.length - 1, i + 1);
      });
      if (e.key === 'ArrowLeft') setViewerIndex((i) => {
        if (typeof i !== 'number') return i;
        return Math.max(0, i - 1);
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewerIndex, filtered.length]);

  useEffect(() => {
    if (viewerIndex === null) {
      document.body.style.overflow = '';
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [viewerIndex]);

  return (
    <>
      <div className="gallery-shell">
        <div className="gallery-top">
          <div>
            <h1 className="gallery-title">Galerie</h1>
            <p className="gallery-subtitle">Photos & vidéos du quartier (contenus approuvés)</p>
          </div>
          <div className="gallery-count" aria-label="Compteur">
            {filtered.length} média{filtered.length > 1 ? 's' : ''}
          </div>
        </div>

        <div className="gallery-toolbar" role="region" aria-label="Recherche et filtres">
          <div className="gallery-search-wrap">
            <span className="gallery-search-icon" aria-hidden>⌕</span>
            <input
              className="gallery-search"
              type="text"
              placeholder="Rechercher (titre ou description)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="type-pills" aria-label="Filtre">
            <button
              type="button"
              className={`pill ${type === 'all' ? 'active' : ''}`}
              onClick={() => setType('all')}
            >
              Tous
            </button>
            <button
              type="button"
              className={`pill ${type === 'image' ? 'active' : ''}`}
              onClick={() => setType('image')}
            >
              Images
            </button>
            <button
              type="button"
              className={`pill ${type === 'video' ? 'active' : ''}`}
              onClick={() => setType('video')}
            >
              Vidéos
            </button>
          </div>
        </div>

      {loading && (
        <div className="gallery-masonry">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="gallery-item skeleton">
              <div className="media-thumb"></div>
              <div className="media-caption">
                <div className="skeleton-line" style={{width:'70%'}}></div>
                <div className="skeleton-line" style={{width:'50%', marginTop:6}}></div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && error && <p className="gallery-error">{error}</p>}
      {!loading && !error && filtered.length === 0 && <p>Aucun média.</p>}

      {!loading && (
      <div className="gallery-masonry" aria-label="Liste des médias">
        {filtered.map((m, idx) => (
          <div key={m._id} className="gallery-item">
            <button className="media-thumb media-thumb--button" onClick={() => setViewerIndex(idx)} aria-label="Voir en grand">
              {m.type === 'image' ? (
                <>
                  <img loading="lazy" src={buildMediaUrl(m.url)} alt={m.title || m.name || 'media'} />
                  <div className="media-badges" aria-hidden>
                    <span className="media-badge">PHOTO</span>
                  </div>
                </>
              ) : (
                <VideoThumb id={m._id} url={m.url} thumbnail={m.thumbnail} title={m.title || m.name || ''} />
              )}
              <div className="thumb-overlay">
                <div className="thumb-title">{m.title || m.name || '—'}</div>
              </div>
            </button>
            <div className="media-caption">
              <div className="media-title">{m.title || m.name || '—'}</div>
              {m.description && <div className="media-desc">{m.description}</div>}
            </div>
          </div>
        ))}
      </div>
      )}

      {viewerItem && (
        <div className="lightbox-overlay" onClick={() => setViewerIndex(null)}>
          <div className="lightbox-content" style={{ maxWidth: 'min(95vw, 1200px)' }} onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <div className="lightbox-header__left">
                <div className="lightbox-header__title">{viewerItem.title || viewerItem.name || ''}</div>
                <div className="lightbox-header__meta">
                  {typeof viewerIndex === 'number' ? (viewerIndex + 1) : 1}/{filtered.length}
                </div>
              </div>
              <div className="lightbox-header__right">
                <a
                  className="lightbox-download"
                  href={buildMediaUrl(viewerItem.url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Télécharger
                </a>
                <button className="lightbox-close" onClick={() => setViewerIndex(null)} aria-label="Fermer">✕</button>
              </div>
            </div>
            <button
              className="lightbox-nav lightbox-nav--prev"
              type="button"
              onClick={() => setViewerIndex((i) => (typeof i === 'number' ? Math.max(0, i - 1) : i))}
              aria-label="Précédent"
              disabled={viewerIndex === 0}
            >
              ‹
            </button>
            <button
              className="lightbox-nav lightbox-nav--next"
              type="button"
              onClick={() => setViewerIndex((i) => (typeof i === 'number' ? Math.min(filtered.length - 1, i + 1) : i))}
              aria-label="Suivant"
              disabled={viewerIndex === filtered.length - 1}
            >
              ›
            </button>
            {viewerItem.type === 'image' ? (
              <img src={buildMediaUrl(viewerItem.url)} alt={viewerItem.title || viewerItem.name || 'media'} />
            ) : (
              <video controls preload="metadata" crossOrigin="anonymous">
                <source src={buildMediaUrl(viewerItem.url)} type={inferMime(viewerItem.url)} />
              </video>
            )}
            <div className="lightbox-caption">{viewerItem.description || ''}</div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default Gallery;
