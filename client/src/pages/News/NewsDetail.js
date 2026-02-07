import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../../services/api';
import './News.css';

const NewsDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [article, setArticle] = useState(location.state?.article || null);
  const [loading, setLoading] = useState(!location.state?.article);
  const [error, setError] = useState('');
  const [related, setRelated] = useState([]);
  const [shareStatus, setShareStatus] = useState('');
  const API_BASE = (api.defaults.baseURL || process.env.REACT_APP_API_URL || window.location.origin).replace(/\/$/, '');
  const extractFirstImageFromContent = (content) => {
    if (!content) return null;
    try {
      const html = String(content);
      const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch && imgMatch[1]) return imgMatch[1];
      const uploadMatch = html.match(/(\/uploads\/[^"')\s>]+)/i);
      if (uploadMatch && uploadMatch[1]) return uploadMatch[1];
    } catch {}
    return null;
  };

  const getTagForArticle = (a) => {
    const title = (a?.title || '').toLowerCase();
    const body = (a?.description || '').toLowerCase();
    const hay = `${title} ${body}`;

    if (/consultation|m[ée]dical|sant[ée]|docteur|hopital|vaccin/.test(hay)) return { label: 'Santé', tone: 'health' };
    if (/kermesse|journ[ée]e|tournoi|match|culturel|assiko|assico|set\s*setal|setsetal|concert|festival/.test(hay)) return { label: 'Événement', tone: 'event' };
    if (/travaux|coupure|eau|[ée]lectricit[ée]|circulation|route|signalisation|maintenance/.test(hay)) return { label: 'Info pratique', tone: 'info' };
    if (/urgence|alerte|s[ée]curit[ée]|vol|agression|incendie/.test(hay)) return { label: 'Alerte', tone: 'alert' };
    return { label: 'Actualité', tone: 'default' };
  };

  const getExcerpt = (value, max = 180) => {
    if (!value) return '';
    const plain = String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (plain.length <= max) return plain;
    return `${plain.slice(0, max).trim()}…`;
  };

  const estimateReadingTime = (html) => {
    const plain = String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = plain ? plain.split(' ').filter(Boolean).length : 0;
    const minutes = Math.max(1, Math.round(words / 220));
    return `${minutes} min`;
  };

  const normalizePost = (p) => {
    const fallbackFromContent = extractFirstImageFromContent(p.content);
    const raw = p.coverUrl || fallbackFromContent;
    const image = raw ? (String(raw).startsWith('http') ? raw : `${API_BASE}${raw}`) : '/images/setsetal.jpg';
    return {
      id: p._id || p.id,
      date: p.createdAt || new Date().toISOString(),
      title: p.title,
      description: p.content,
      image,
      author: p.author?.name || 'Anonyme',
    };
  };

  useEffect(() => {
    let mounted = true;
    // Si on n'a pas l'article en state (navigation directe), on va le chercher via l'API
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/api/posts/${id}`);
        if (!mounted) return;
        setArticle(normalizePost(res.data));
      } catch (e) {
        if (mounted) setError("Impossible de charger l'article.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (!article) fetchArticle();

    return () => { mounted = false; };
  }, [API_BASE, id]);

  useEffect(() => {
    let mounted = true;
    const fetchRelated = async () => {
      try {
        const res = await api.get('/api/posts?status=published&sort=-createdAt&limit=8&page=1');
        if (!mounted) return;
        const payload = res.data;
        const list = Array.isArray(payload?.posts) ? payload.posts : (Array.isArray(payload) ? payload : []);
        const items = list.map(normalizePost).filter((p) => String(p.id) !== String(id));
        setRelated(items.slice(0, 3));
      } catch {
        if (mounted) setRelated([]);
      }
    };
    fetchRelated();
    return () => { mounted = false; };
  }, [API_BASE, id]);

  if (loading) {
    return (
      <div className="news-container">
        <p>Chargement de l'article...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-container">
        <p className="news-error">{error}</p>
        <Link to="/actualites" className="read-more">← Retour aux actualités</Link>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="news-container">
        <p>Article introuvable.</p>
        <Link to="/actualites" className="read-more">← Retour aux actualités</Link>
      </div>
    );
  }

  const tag = getTagForArticle(article);
  const readingTime = estimateReadingTime(article.description);

  const handleShare = async () => {
    try {
      setShareStatus('');
      const url = window.location.href;
      const title = article?.title || 'Actualité';

      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareStatus('Lien copié');
        window.setTimeout(() => setShareStatus(''), 1800);
        return;
      }

      setShareStatus('Copie impossible');
      window.setTimeout(() => setShareStatus(''), 1800);
    } catch {
      setShareStatus('');
    }
  };

  return (
    <div className="news-detail-page">
      <header className="news-detail-hero">
        <div className="news-detail-hero__inner">
          <div className="news-detail-hero__left">
            <Link to="/actualites" className="news-detail-back">← Retour aux actualités</Link>

            <div className="news-detail-meta">
              <span className="news-badge-date">{format(new Date(article.date), 'd MMM yyyy', { locale: fr })}</span>
              <span className={`news-tag news-tag--${tag.tone}`}>{tag.label}</span>
              <span className="news-detail-author">{article.author ? `Par ${article.author}` : ' '}</span>
              <span className="news-detail-sep" aria-hidden="true">•</span>
              <span className="news-detail-reading">{readingTime} de lecture</span>
            </div>

            <h1 className="news-detail-title">{article.title}</h1>
            <p className="news-detail-dek">{getExcerpt(article.description, 200)}</p>

            <div className="news-detail-actions">
              <button type="button" className="news-detail-share" onClick={handleShare}>
                Partager
              </button>
              {shareStatus && <span className="news-detail-share-status">{shareStatus}</span>}
            </div>
          </div>

          <div className="news-detail-hero__right">
            <div className="news-detail-cover">
              <img src={article.image} alt={article.title} onError={(e) => { e.currentTarget.src = '/images/setsetal.jpg'; }} />
            </div>
          </div>
        </div>
      </header>

      <main className="news-detail-main">
        <article className="news-detail-article">
          <div
            className="news-detail-content"
            dangerouslySetInnerHTML={{ __html: String(article.description || '') }}
          />
          <div className="news-detail-bottom">
            <Link to="/actualites" className="news-detail-back news-detail-back--bottom">← Retour aux actualités</Link>
          </div>
        </article>

        {related.length > 0 && (
          <section className="news-detail-related" aria-label="À lire ensuite">
            <h2 className="news-detail-related__title">À lire ensuite</h2>
            <div className="news-detail-related__grid">
              {related.map((p) => {
                const t = getTagForArticle(p);
                return (
                  <Link key={p.id} to={`/actualites/${p.id}`} state={{ article: p }} className="news-detail-related__card">
                    <div className="news-detail-related__media">
                      <img src={p.image} alt={p.title} onError={(e) => { e.currentTarget.src = '/images/setsetal.jpg'; }} />
                    </div>
                    <div className="news-detail-related__body">
                      <div className="news-detail-related__meta">
                        <span className="news-badge-date">{format(new Date(p.date), 'd MMM yyyy', { locale: fr })}</span>
                        <span className={`news-tag news-tag--${t.tone}`}>{t.label}</span>
                      </div>
                      <div className="news-detail-related__headline">{p.title}</div>
                      <div className="news-detail-related__cta">Lire →</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default NewsDetail;
