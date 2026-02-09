import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const [category, setCategory] = useState('all'); // event | project | history | general | all
  const [viewerIndex, setViewerIndex] = useState(null); // index in filtered
  const [immersionOpen, setImmersionOpen] = useState(false);
  const [immSearchOpen, setImmSearchOpen] = useState(false);
  const [durations, setDurations] = useState({}); // { [id]: seconds }
  const [videoThumbs, setVideoThumbs] = useState({}); // { [id]: dataUrl }
  const immersionRefs = useRef({});

  const fetchMedia = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      params.set('status', 'approved');
      params.set('page', '1');
      params.set('limit', '100');
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
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setImmersionOpen(false);
      }
    };
    if (!immersionOpen) return;
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [immersionOpen]);

  useEffect(() => {
    if (!immersionOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [immersionOpen]);

  const categoryConfig = {
    all: {
      label: 'Tout',
      headline: 'Toute la vie du quartier, en images',
      body: "Des moments du quotidien aux grands projets, cette galerie rassemble ce que la communauté choisit de partager et de transmettre.",
    },
    history: {
      label: 'Histoire',
      headline: 'Mémoire & héritage',
      body: "Ici, on conserve les traces: lieux, visages, instants clés. Une mémoire vivante du quartier, à revisiter et à enrichir.",
    },
    project: {
      label: 'Projets',
      headline: 'Ce qu’on construit ensemble',
      body: "Chantiers, initiatives et réalisations. Des preuves, des étapes, des résultats: le quartier qui avance, concrètement.",
    },
    event: {
      label: 'Événements',
      headline: 'Temps forts & rencontres',
      body: "Célébrations, actions collectives, moments de partage. L’énergie du quartier, capturée sur le vif.",
    },
    general: {
      label: 'Vie du quartier',
      headline: 'Le quotidien qui nous rassemble',
      body: "Portraits, scènes de rue, instants simples. La beauté du vrai, racontée par celles et ceux qui y vivent.",
    },
  };

  const categories = ['all', 'history', 'project', 'event', 'general'];

  const filteredByType = items.filter((m) => {
    if (type === 'all') return true;
    return m.type === type;
  });

  const filteredByCategory = filteredByType.filter((m) => {
    if (category === 'all') return true;
    return (m.category || 'general') === category;
  });

  const filtered = filteredByCategory.filter(m => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const name = (m.title || m.name || '').toLowerCase();
    const desc = (m.description || '').toLowerCase();
    return name.includes(q) || desc.includes(q);
  });

  const totalCount = items.length;
  const photoCount = items.filter((m) => m.type === 'image').length;
  const videoCount = items.filter((m) => m.type === 'video').length;

  const catCounts = {
    all: totalCount,
    history: items.filter((m) => (m.category || 'general') === 'history').length,
    project: items.filter((m) => (m.category || 'general') === 'project').length,
    event: items.filter((m) => (m.category || 'general') === 'event').length,
    general: items.filter((m) => (m.category || 'general') === 'general').length,
  };

  const featuredItem = filtered[0] || null;
  const catText = categoryConfig[category] || categoryConfig.all;

  const buildMixedFeed = (list) => {
    const buckets = {
      history: [],
      project: [],
      event: [],
      general: [],
    };
    list.forEach((m) => {
      const c = (m.category || 'general');
      (buckets[c] || buckets.general).push(m);
    });
    const order = ['history', 'project', 'event', 'general'];
    const out = [];
    while (order.some((k) => buckets[k].length)) {
      order.forEach((k) => {
        const it = buckets[k].shift();
        if (it) out.push(it);
      });
    }
    return out;
  };

  const immersionBaseList = (type !== 'all' || category !== 'all' || search.trim()) ? filtered : items;
  const immersionFeed = useMemo(() => {
    if (category !== 'all') return immersionBaseList;
    return buildMixedFeed(immersionBaseList);
  }, [category, immersionBaseList]);

  const openImmersion = () => {
    setImmersionOpen(true);
    setImmSearchOpen(typeof window !== 'undefined' ? window.innerWidth >= 900 : false);
    requestAnimationFrame(() => {
      const el = immersionRefs.current?.['root'];
      if (el && typeof el.scrollTo === 'function') el.scrollTo({ top: 0 });
    });
  };

  useEffect(() => {
    if (!immersionOpen) return;
    const onResize = () => {
      setImmSearchOpen(window.innerWidth >= 900);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [immersionOpen]);

  useEffect(() => {
    if (!immersionOpen) return;
    const root = immersionRefs.current?.['root'];
    if (!root) return;

    const targets = Object.values(immersionRefs.current).filter(Boolean).filter((n) => n !== root);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const node = entry.target;
          const video = node?.querySelector?.('video');
          if (!video) return;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const p = video.play();
            if (p && typeof p.catch === 'function') p.catch(() => {});
          } else {
            try { video.pause(); } catch {}
          }
        });
      },
      { root, threshold: [0.15, 0.35, 0.6, 0.85] }
    );

    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [immersionOpen, immersionFeed.length]);

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
        <div className="gallery-hero" role="region" aria-label="Présentation">
          <div className="gallery-hero__inner">
            <div className="gallery-hero__copy">
              <div className="gallery-kicker">QuartierConnect</div>
              <h1 className="gallery-title">Galerie</h1>
              <p className="gallery-subtitle">Photos & vidéos du quartier (contenus approuvés)</p>

              <div className="gallery-hero__pills" aria-hidden>
                <span className="hero-pill">Médias validés</span>
                <span className="hero-pill">Qualité HD</span>
                <span className="hero-pill">Communauté</span>
              </div>

              <div className="gallery-hero__actions">
                <button
                  type="button"
                  className="hero-btn hero-btn--primary"
                  onClick={() => document.getElementById('galleryGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  Explorer
                </button>
                <button type="button" className="hero-btn" onClick={openImmersion}>
                  Immersion
                </button>
                <a className="hero-btn hero-btn--ghost" href="/espace-membres">Partager</a>
              </div>
            </div>

            <div className="gallery-hero__stats" aria-label="Statistiques">
              <div className="hero-stat">
                <div className="hero-stat__value">{totalCount}</div>
                <div className="hero-stat__label">Médias</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat__value">{photoCount}</div>
                <div className="hero-stat__label">Photos</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat__value">{videoCount}</div>
                <div className="hero-stat__label">Vidéos</div>
              </div>
              <div className="hero-stat hero-stat--soft">
                <div className="hero-stat__value">{filtered.length}</div>
                <div className="hero-stat__label">Résultats</div>
              </div>
            </div>
          </div>
        </div>

        <div className="gallery-collections" role="region" aria-label="Collections">
          <div className="collections-head">
            <div className="collections-title">Collections</div>
            <div className="collections-sub">Choisis une lecture: mémoire, projets, événements, vie du quartier.</div>
          </div>
          <div className="collections-row">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={`collection-card ${category === c ? 'active' : ''}`}
                onClick={() => setCategory(c)}
              >
                <div className="collection-card__top">
                  <div className="collection-card__label">{categoryConfig[c].label}</div>
                  <div className="collection-card__count">{catCounts[c]}</div>
                </div>
                <div className="collection-card__body">{categoryConfig[c].headline}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="gallery-narrative" role="region" aria-label="Texte narratif">
          <div className="gallery-narrative__title">{catText.headline}</div>
          <div className="gallery-narrative__body">{catText.body}</div>
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

        {featuredItem && !loading && !error && (
          <div className="gallery-featured" role="region" aria-label="À la une">
            <div className="featured-head">
              <div className="featured-kicker">À la une</div>
              <div className="featured-title">{featuredItem.title || featuredItem.name || '—'}</div>
              <div className="featured-sub">
                {(featuredItem.category && categoryConfig[featuredItem.category]?.label) ? categoryConfig[featuredItem.category].label : 'Média'}
                {featuredItem.type ? ` · ${featuredItem.type === 'video' ? 'Vidéo' : 'Photo'}` : ''}
              </div>
            </div>

            <div className="featured-card">
              <button
                type="button"
                className="featured-media"
                onClick={() => setViewerIndex(0)}
                aria-label="Ouvrir le média à la une"
              >
                {featuredItem.type === 'image' ? (
                  <img loading="lazy" src={buildMediaUrl(featuredItem.url)} alt={featuredItem.title || featuredItem.name || 'media'} />
                ) : (
                  <VideoThumb
                    id={featuredItem._id}
                    url={featuredItem.url}
                    thumbnail={featuredItem.thumbnail}
                    title={featuredItem.title || featuredItem.name || ''}
                  />
                )}
                <div className="featured-overlay" aria-hidden>
                  <div className="featured-overlay__cta">Voir en grand</div>
                </div>
              </button>

              <div className="featured-meta">
                {featuredItem.description ? (
                  <div className="featured-desc">{featuredItem.description}</div>
                ) : (
                  <div className="featured-desc">Ajoute une description lors de l’upload pour raconter ce moment.</div>
                )}
              </div>
            </div>
          </div>
        )}

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
      <div id="galleryGrid" className="gallery-masonry" aria-label="Liste des médias">
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

      {immersionOpen && (
        <div className="immersion-overlay" role="dialog" aria-label="Mode immersion" aria-modal="true">
          <div className="immersion-topbar">
            <div className="immersion-brand">Galerie · Immersion</div>
            <button type="button" className="immersion-close" onClick={() => setImmersionOpen(false)} aria-label="Quitter">✕</button>
          </div>

          <div className="immersion-controls" role="region" aria-label="Filtres immersion">
            <div className="immersion-controls__row">
              <div className="immersion-chips">
                {categories.filter((c) => c !== 'all').map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`imm-chip ${category === c ? 'active' : ''}`}
                    onClick={() => setCategory((prev) => (prev === c ? 'all' : c))}
                  >
                    {categoryConfig[c].label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="immersion-search-toggle"
                onClick={() => setImmSearchOpen((v) => !v)}
                aria-label={immSearchOpen ? 'Masquer la recherche' : 'Afficher la recherche'}
                title={immSearchOpen ? 'Masquer la recherche' : 'Rechercher'}
              >
                ⌕
              </button>
            </div>

            {immSearchOpen && (
              <input
                className="immersion-search"
                type="text"
                placeholder="Rechercher dans l'immersion"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            )}
          </div>

          <div className="immersion-feed" ref={(n) => { immersionRefs.current['root'] = n; }}>
            {immersionFeed.map((m, idx) => (
              <section
                key={m._id}
                className="immersion-card"
                ref={(n) => { immersionRefs.current[m._id] = n; }}
                aria-label={m.title || m.name || 'media'}
              >
                <div className="immersion-media" onClick={() => {
                  const inFiltered = filtered.findIndex((x) => x._id === m._id);
                  if (inFiltered >= 0) setViewerIndex(inFiltered);
                }}>
                  {m.type === 'image' ? (
                    <img src={buildMediaUrl(m.url)} alt={m.title || m.name || 'media'} loading="lazy" />
                  ) : (
                    <video
                      src={buildMediaUrl(m.url)}
                      poster={m.thumbnail ? buildMediaUrl(m.thumbnail) : undefined}
                      muted
                      playsInline
                      loop
                      preload="metadata"
                      crossOrigin="anonymous"
                    />
                  )}
                </div>

                <div className="immersion-meta" aria-hidden>
                  <div className="immersion-badges">
                    <span className="imm-badge">{categoryConfig[(m.category || 'general')]?.label || 'Média'}</span>
                    <span className="imm-badge imm-badge--soft">{m.type === 'video' ? 'VIDÉO' : 'PHOTO'}</span>
                  </div>
                  <div className="immersion-progress">{idx + 1}/{immersionFeed.length}</div>
                </div>

                <div className="immersion-story">
                  <div className="immersion-title">{m.title || m.name || '—'}</div>
                  {m.description ? (
                    <div className="immersion-text">{m.description}</div>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Gallery;
