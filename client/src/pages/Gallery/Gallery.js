import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import './Gallery.css';

const Gallery = () => {
  const API_BASE = (api.defaults.baseURL || process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all'); // image | video | all
  const [viewerItem, setViewerItem] = useState(null); // {type,url,title}

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

  useEffect(() => { fetchMedia(); /* initial */ }, []);
  useEffect(() => {
    const t = setTimeout(() => fetchMedia(), 250);
    return () => clearTimeout(t);
  }, [type]);

  // Fermer la lightbox avec ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setViewerItem(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = items.filter(m => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const name = (m.title || m.name || '').toLowerCase();
    const desc = (m.description || '').toLowerCase();
    return name.includes(q) || desc.includes(q);
  });

  return (
    <div className="gallery-page">
      <header className="gallery-header">
        <h1>Galerie</h1>
        <p>Découvrez les photos et vidéos du quartier (contenus approuvés)</p>
      </header>

      <div className="gallery-controls">
        <input
          className="gallery-search"
          type="text"
          placeholder="Rechercher un média..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="type-pills">
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
        <div className="gallery-grid">
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
      <div className="gallery-grid">
        {filtered.map((m) => (
          <div key={m._id} className="gallery-item">
            <button className="media-thumb media-thumb--button" onClick={() => setViewerItem(m)} aria-label="Voir en grand">
              {m.type === 'image' ? (
                <img loading="lazy" src={`${API_BASE}${m.url}`} alt={m.title || m.name || 'media'} />
              ) : (
                <>
                  <video preload="metadata" muted playsInline crossOrigin="anonymous">
                    <source src={`${API_BASE}${m.url}`} type={inferMime(m.url)} />
                  </video>
                  <div className="play-badge" aria-hidden>▶</div>
                </>
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
        <div className="lightbox-overlay" onClick={() => setViewerItem(null)}>
          <div className="lightbox-content" style={{ maxWidth: 'min(95vw, 1200px)' }} onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setViewerItem(null)} aria-label="Fermer">✕</button>
            {viewerItem.type === 'image' ? (
              <img src={`${API_BASE}${viewerItem.url}`} alt={viewerItem.title || viewerItem.name || 'media'} />
            ) : (
              <video controls preload="metadata" crossOrigin="anonymous">
                <source src={`${API_BASE}${viewerItem.url}`} type={inferMime(viewerItem.url)} />
              </video>
            )}
            <div className="lightbox-caption">{viewerItem.title || viewerItem.name || ''}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
