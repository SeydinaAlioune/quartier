import React, { useEffect, useState } from 'react';
import './News.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import AnimatedSection from '../../components/AnimatedSection/AnimatedSection';

const News = () => {
  const API_BASE = (api.defaults.baseURL || process.env.REACT_APP_API_URL || window.location.origin).replace(/\/$/, '');
  const [announcements, setAnnouncements] = useState([]);
  const [latestArticles, setLatestArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatBadgeDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'd MMM yyyy', { locale: fr });
  };

  // Extraire la première image depuis le contenu HTML (si présent)
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

  const getTagForArticle = (article) => {
    const title = (article?.title || '').toLowerCase();
    const body = (article?.description || '').toLowerCase();
    const hay = `${title} ${body}`;

    if (/consultation|m[ée]dical|sant[ée]|docteur|hopital|vaccin/.test(hay)) return { label: 'Santé', tone: 'health' };
    if (/kermesse|journ[ée]e|tournoi|match|culturel|assiko|assico|set\s*setal|setsetal|concert|festival/.test(hay)) return { label: 'Événement', tone: 'event' };
    if (/travaux|coupure|eau|[ée]lectricit[ée]|circulation|route|signalisation|maintenance/.test(hay)) return { label: 'Info pratique', tone: 'info' };
    if (/urgence|alerte|s[ée]curit[ée]|vol|agression|incendie/.test(hay)) return { label: 'Alerte', tone: 'alert' };
    return { label: 'Actualité', tone: 'default' };
  };

  const getExcerpt = (value, max = 160) => {
    if (!value) return '';
    const plain = String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (plain.length <= max) return plain;
    return `${plain.slice(0, max).trim()}…`;
  };

  // Chargement des articles depuis l'API avec fallback silencieux
  useEffect(() => {
    let mounted = true;
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError('');
        setLatestArticles([]);
        const res = await api.get('/api/posts?status=published&sort=-createdAt&limit=20&page=1');
        if (!mounted) return;
        const payload = res.data;
        const list = Array.isArray(payload?.posts) ? payload.posts : (Array.isArray(payload) ? payload : []);
        const items = list.map((p) => {
          const fallbackFromContent = extractFirstImageFromContent(p.content);
          const raw = p.coverUrl || fallbackFromContent;
          const image = raw ? (String(raw).startsWith('http') ? raw : `${API_BASE}${raw}`) : '/images/setsetal.jpg';
          return ({
            id: p._id || p.id,
            date: p.createdAt || new Date().toISOString(),
            title: p.title,
            description: p.content,
            image,
          });
        });
        setLatestArticles(items);
      } catch (e) {
        if (mounted) setError("Impossible de charger les actualités pour le moment (serveur indisponible).");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPosts();
    return () => {
      mounted = false;
    };
  }, [API_BASE]);

  // Charger les annonces importantes dynamiques
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get('/api/announcements');
        if (!mounted) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setAnnouncements(list.map(a => ({
          id: a.id,
          type: a.title,
          description: a.description,
          buttonText: a.buttonText || '',
          link: a.link || ''
        })));
      } catch {
        setAnnouncements([]);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const [featuredArticle, ...otherArticles] = latestArticles;

  const featuredTag = featuredArticle ? getTagForArticle(featuredArticle) : null;

  return (
    <>
      <header className="news-hero" aria-label="Actualités">
        <div className="news-hero__inner">
          <div className="news-hero__left">
            <div className="news-hero__kicker">Actualités</div>
            <h1 className="news-hero__title">Actualités du quartier</h1>
            <p className="news-hero__subtitle">Les annonces et événements de la Cité Gendarmerie, mis à jour par les habitants.</p>

            <div className="news-hero__meta">
              {featuredArticle ? (
                <span className="news-hero__update">Dernière mise à jour : {formatBadgeDate(featuredArticle.date)}</span>
              ) : (
                <span className="news-hero__update">Dernière mise à jour : —</span>
              )}
              <span className="news-hero__badge">Cité Gendarmerie • QuartierConnect</span>
            </div>

            <div className="news-hero__chips" aria-label="Catégories">
              {featuredTag ? (
                <span className={`news-chip news-chip--${featuredTag.tone}`}>{featuredTag.label}</span>
              ) : (
                <span className="news-chip">Tous</span>
              )}
              <button
                type="button"
                className="news-chip news-chip--ghost"
                onClick={() => document.getElementById('news-latest')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                Toutes les actus
              </button>
              <button
                type="button"
                className="news-chip news-chip--ghost"
                onClick={() => document.getElementById('news-announcements')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                Annonces importantes
              </button>
            </div>
          </div>

          <div className="news-hero__right" aria-label="À la une">
            {loading && !featuredArticle ? (
              <div className="news-hero__featured-skel" aria-hidden="true">
                <div className="news-skeleton-img news-skeleton-img--featured shimmer" />
                <div className="news-skeleton-line news-skeleton-line--wide shimmer" />
                <div className="news-skeleton-line news-skeleton-line--mid shimmer" />
              </div>
            ) : featuredArticle ? (
              <article className="news-hero__featured">
                <Link to={`/actualites/${featuredArticle.id}`} state={{ article: featuredArticle }} className="news-hero__featured-link">
                  <div className="news-hero__featured-media">
                    <img
                      src={featuredArticle.image}
                      alt={featuredArticle.title}
                      onError={(e) => { e.currentTarget.src = '/images/setsetal.jpg'; }}
                    />
                    <span className="news-badge news-badge--featured">À la une</span>
                  </div>
                  <div className="news-hero__featured-body">
                    <div className="news-hero__featured-meta">
                      <span className="news-badge-date">{formatBadgeDate(featuredArticle.date)}</span>
                      {(() => {
                        const tag = getTagForArticle(featuredArticle);
                        return <span className={`news-tag news-tag--${tag.tone}`}>{tag.label}</span>;
                      })()}
                    </div>
                    <h2 className="news-hero__featured-title">{featuredArticle.title}</h2>
                    <p className="news-hero__featured-excerpt">{getExcerpt(featuredArticle.description, 110)}</p>
                    <div className="news-hero__featured-cta">Lire l’article →</div>
                  </div>
                </Link>
              </article>
            ) : null}
          </div>
        </div>
      </header>

      <div className="news-container">
      <p className="page-intro">Retrouve ici les temps forts du quartier : initiatives citoyennes, événements, infos pratiques et annonces importantes.</p>

      <section id="news-latest" className="latest-articles">
        <h2>Dernières actualités</h2>

        {loading && latestArticles.length === 0 && (
          <div className="news-skeleton-main" aria-hidden="true">
            <div className="news-skeleton-featured">
              <div className="news-skeleton-img news-skeleton-img--featured shimmer" />
              <div className="news-skeleton-line news-skeleton-line--wide shimmer" />
              <div className="news-skeleton-line news-skeleton-line--mid shimmer" />
            </div>
            <div className="news-skeleton-side">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="news-skeleton-row">
                  <div className="news-skeleton-thumb shimmer" />
                  <div className="news-skeleton-rowbody">
                    <div className="news-skeleton-line news-skeleton-line--wide shimmer" />
                    <div className="news-skeleton-line shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && latestArticles.length === 0 && (
          <div className="news-empty" role="status">
            <div className="news-empty__title">Aucune actualité publiée pour le moment</div>
            <div className="news-empty__text">Reviens bientôt, ou connecte-toi à l’espace admin pour publier une actualité.</div>
          </div>
        )}

        {!loading && error && (
          <div className="news-empty" role="status">
            <div className="news-empty__title">Chargement impossible</div>
            <div className="news-empty__text">Vérifie que le backend est lancé et accessible, puis réessaye.</div>
            <div className="news-empty__text" style={{ marginTop: 6 }}>
              Détail : {error}
            </div>
            <button
              type="button"
              className="news-empty__btn"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </button>
          </div>
        )}

        {latestArticles.length > 0 && (
        <div className="news-main">
          {featuredArticle && (
            <AnimatedSection delay={0} animation="fade-up">
              <article className="news-featured-card">
                <Link
                  to={`/actualites/${featuredArticle.id}`}
                  state={{ article: featuredArticle }}
                  className="news-featured-media-link"
                >
                  <div className="news-featured-media">
                    <img
                      src={featuredArticle.image}
                      alt={featuredArticle.title}
                      onError={(e) => { e.currentTarget.src = '/images/setsetal.jpg'; }}
                    />
                    <span className="news-badge news-badge--featured">À la une</span>
                  </div>
                </Link>
                <div className="news-featured-body">
                  <div className="news-featured-meta">
                    <span className="news-badge-date">{formatBadgeDate(featuredArticle.date)}</span>
                    {(() => {
                      const tag = getTagForArticle(featuredArticle);
                      return <span className={`news-tag news-tag--${tag.tone}`}>{tag.label}</span>;
                    })()}
                  </div>
                  <h3 className="news-featured-title">{featuredArticle.title}</h3>
                  <p className="news-featured-excerpt">{getExcerpt(featuredArticle.description)}</p>
                  <Link
                    to={`/actualites/${featuredArticle.id}`}
                    state={{ article: featuredArticle }}
                    className="news-featured-link"
                  >
                    Lire l’article →
                  </Link>
                </div>
              </article>
            </AnimatedSection>
          )}

          {otherArticles.length > 0 && (
            <section className="news-list" aria-label="Toutes les actualités">
              {otherArticles.map((article, idx) => (
                <AnimatedSection key={article.id || idx} delay={idx % 3} animation="fade-up">
                  <article className="news-list-card">
                    <Link
                      to={`/actualites/${article.id}`}
                      state={{ article }}
                      className="news-list-media-link"
                    >
                      <div className="news-list-media">
                        <img
                          src={article.image}
                          alt={article.title}
                          onError={(e) => { e.currentTarget.src = '/images/setsetal.jpg'; }}
                        />
                      </div>
                    </Link>
                    <div className="news-list-body">
                      <div className="news-list-meta">
                        <span className="news-badge-date">{formatBadgeDate(article.date)}</span>
                        {(() => {
                          const tag = getTagForArticle(article);
                          return <span className={`news-tag news-tag--${tag.tone}`}>{tag.label}</span>;
                        })()}
                      </div>
                      <h3 className="news-list-title">{article.title}</h3>
                      <p className="news-list-excerpt">{getExcerpt(article.description, 120)}</p>
                      <Link
                        to={`/actualites/${article.id}`}
                        state={{ article }}
                        className="news-list-link"
                      >
                        Voir l’article →
                      </Link>
                    </div>
                  </article>
                </AnimatedSection>
              ))}
            </section>
          )}
        </div>
        )}
      </section>

      {announcements.length > 0 && (
        <section id="news-announcements" className="important-announcements">
          <h2>Annonces Importantes</h2>
          <div className="announcements-grid">
            {announcements.map((announcement, idx) => (
              <AnimatedSection key={announcement.id} delay={idx} animation="scale">
                <div className="announcement-card">
                <h3>
                  <i className="icon"></i>
                  {announcement.type}
                </h3>
                <p>{announcement.description}</p>
                {announcement.buttonText && (
                  announcement.link ? (
                    <a className="announcement-button" href={announcement.link} target="_blank" rel="noreferrer">{announcement.buttonText}</a>
                  ) : (
                    <button className="announcement-button">{announcement.buttonText}</button>
                  )
                )}
              </div>
              </AnimatedSection>
            ))}
          </div>
        </section>
      )}
      </div>
    </>
  );
};

export default News;
