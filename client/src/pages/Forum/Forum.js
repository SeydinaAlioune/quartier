import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Annonces from './Annonces';
import BoiteIdees from './BoiteIdees';
import './Forum.css';
import api from '../../services/api';

const Forum = () => {
  const navigate = useNavigate();
  // Données dynamiques depuis l'API du forum
  const [topics, setTopics] = useState([]); // {id,title,category,author,replies,created,lastReply}
  const [categories, setCategories] = useState([{ id: 'all', name: 'Toutes les catégories' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forumStats, setForumStats] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState("Toutes les catégories");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({ title: '', categoryId: '', content: '' });
  const isLoggedIn = useMemo(() => !!localStorage.getItem('token'), []);

  const TITLE_MAX = 80;
  const CONTENT_MAX = 900;
  const titleCount = (newDiscussion.title || '').length;
  const contentCount = (newDiscussion.content || '').length;
  const canSubmit = !!(newDiscussion.title || '').trim() && !!newDiscussion.categoryId && !!(newDiscussion.content || '').trim();

  // Charger catégories et sujets récents
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [catRes, topicsRes, statsRes] = await Promise.all([
          api.get('/api/forum/categories'),
          api.get('/api/forum/topics/recent'),
          api.get('/api/forum/stats'),
        ]);
        if (!mounted) return;
        const cats = Array.isArray(catRes.data) ? catRes.data : [];
        setCategories([{ id: 'all', name: 'Toutes les catégories' }, ...cats.map(c => ({ id: c.id || c._id, name: c.name }))]);
        const list = Array.isArray(topicsRes.data) ? topicsRes.data : [];
        setTopics(list);
        setForumStats(statsRes?.data || null);
      } catch (e) {
        if (mounted) setError('Impossible de charger le forum.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!showNewDiscussion) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowNewDiscussion(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showNewDiscussion]);

  const openNewDiscussionWithSuggestion = (suggestedTitle) => {
    setShowNewDiscussion(true);
    setNewDiscussion(prev => ({ ...prev, title: suggestedTitle || prev.title }));
    setTimeout(() => {
      const el = document.querySelector('.new-discussion-modal input[type="text"]');
      if (el) el.focus();
    }, 50);
  };

  const handleNewDiscussionSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      return navigate('/login');
    }
    try {
      const title = (newDiscussion.title || '').trim();
      const content = (newDiscussion.content || '').trim();
      if (!title || !newDiscussion.categoryId || !content) {
        alert('Titre, catégorie et contenu requis.');
        return;
      }

      const payload = { title, category: newDiscussion.categoryId };
      const created = await api.post('/api/forum/topics', payload);
      const topicId = created?.data?._id || created?.data?.id;
      if (topicId) {
        await api.post('/api/forum/posts', { topic: topicId, content });
      }
      setShowNewDiscussion(false);
      setNewDiscussion({ title: '', categoryId: '', content: '' });
      // recharger
      const topicsRes = await api.get('/api/forum/topics/recent');
      setTopics(Array.isArray(topicsRes.data) ? topicsRes.data : []);
    } catch (err) {
      alert("Impossible de créer la discussion (connexion requise).");
    }
  };

  const filteredTopics = topics.filter(t => {
    const matchesCategory = selectedCategory === 'Toutes les catégories' || t.category === selectedCategory;
    const matchesSearch = (t.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatShortDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <>
      <header
        className="forum-header"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${process.env.PUBLIC_URL}/for.jpg)`,
          backgroundPosition: 'center 35%'
        }}
      >
        <h1>Forum Communautaire</h1>
      </header>

      <div className="forum-page">
      <p className="page-intro">Échangez, partagez et connectez-vous avec vos voisins</p>

      <section className="forum-hub" aria-label="Accueil du forum">
        <div className="forum-hub-top">
          <div className="forum-hub-copy">
            <h2 className="forum-hub-title">Bienvenue sur le Forum</h2>
            <p className="forum-hub-subtitle">Un espace pour demander, aider, proposer et faire avancer la vie du quartier.</p>
            <div className="forum-quick-actions">
              <button className="quick-action" onClick={() => openNewDiscussionWithSuggestion('Question : ')}>
                <span className="qa-icon"><i className="far fa-question-circle" aria-hidden="true"></i></span>
                <span className="qa-text">
                  <span className="qa-title">Poser une question</span>
                  <span className="qa-desc">Obtenez des réponses rapides</span>
                </span>
              </button>
              <button className="quick-action" onClick={() => openNewDiscussionWithSuggestion('Info : ')}>
                <span className="qa-icon"><i className="far fa-bell" aria-hidden="true"></i></span>
                <span className="qa-text">
                  <span className="qa-title">Partager une info</span>
                  <span className="qa-desc">Événements, travaux, alertes</span>
                </span>
              </button>
              <button className="quick-action" onClick={() => openNewDiscussionWithSuggestion('Je cherche : ')}>
                <span className="qa-icon"><i className="far fa-handshake" aria-hidden="true"></i></span>
                <span className="qa-text">
                  <span className="qa-title">Demander un service</span>
                  <span className="qa-desc">Covoiturage, garde, aide…</span>
                </span>
              </button>
            </div>
          </div>

          <div className="forum-hub-stats" aria-label="Statistiques du forum">
            <div className="hub-stat">
              <div className="hub-stat-value">{forumStats?.topics ?? '—'}</div>
              <div className="hub-stat-label">Sujets</div>
            </div>
            <div className="hub-stat">
              <div className="hub-stat-value">{forumStats?.posts ?? '—'}</div>
              <div className="hub-stat-label">Messages</div>
            </div>
            <div className="hub-stat">
              <div className="hub-stat-value">{forumStats?.activeUsers ?? '—'}</div>
              <div className="hub-stat-label">Actifs (30j)</div>
            </div>
            <div className="hub-stat">
              <div className="hub-stat-value">{forumStats?.postsLastWeek ?? '—'}</div>
              <div className="hub-stat-label">Cette semaine</div>
            </div>
          </div>
        </div>

        {Array.isArray(forumStats?.recentActivity) && forumStats.recentActivity.length > 0 && (
          <div className="forum-hub-activity" aria-label="Activité récente">
            <div className="activity-title">Activité récente</div>
            <div className="activity-list">
              {forumStats.recentActivity.slice(0, 5).map((a, idx) => (
                <div key={`${a.type}-${idx}`} className="activity-item">
                  <span className="activity-time">{a.time}</span>
                  <span className="activity-main">
                    <span className="activity-user">{a.user}</span>
                    <span className="activity-action">{a.type === 'topic' ? 'a créé' : 'a répondu à'}</span>
                    <span className="activity-content">{a.content}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="forum-controls">
        <div className="search-filters">
          <div className="search-input-wrap">
            <i className="fas fa-search" aria-hidden="true"></i>
            <input
              type="text"
              placeholder="Rechercher une discussion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            {categories.map(category => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>
        </div>
        <button 
          className="new-discussion-btn"
          onClick={() => setShowNewDiscussion(true)}
        >
          <i className="fas fa-plus"></i> Nouvelle Discussion
        </button>
      </div>

      <section className="discussions-list">
        {loading && <div>Chargement du forum...</div>}
        {!loading && error && (
          <div className="empty-state"><p>{error}</p></div>
        )}
        {!loading && !error && filteredTopics.length === 0 && (
          <div className="empty-state">
            <p>Aucune discussion pour le moment. Soyez le premier à en créer une !</p>
          </div>
        )}
        {!loading && !error && (
          <div className="discussions-grid">
            {filteredTopics.map(t => {
              const initials = (t.author || '—').trim().slice(0, 1).toUpperCase();
              const lastAt = t.lastReplyAt || t.lastReply;
              const lastDate = formatShortDate(lastAt);
              const lastTime = formatTime(lastAt);
              return (
                <div
                  key={t.id}
                  className={`discussion-card v2 ${t.status ? `is-${t.status}` : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/forum/topics/${t.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') navigate(`/forum/topics/${t.id}`);
                  }}
                >
                  <div className="discussion-left">
                    <div className="discussion-avatar" aria-hidden="true">{initials}</div>
                    <div className="discussion-body">
                      <div className="discussion-title-row">
                        <h3 className="discussion-title">{t.title}</h3>
                        {t.status && t.status !== 'active' && (
                          <span className={`topic-status is-${t.status}`}>{t.status}</span>
                        )}
                      </div>
                      {t.lastPostPreview ? (
                        <p className="discussion-preview">{t.lastPostPreview}</p>
                      ) : (
                        <p className="discussion-preview">Cliquez pour ouvrir la discussion.</p>
                      )}
                      <div className="discussion-meta v2">
                        <span className="category-tag">{t.category}</span>
                        <span className="author">Par {t.author}</span>
                        {lastDate && (
                          <span className="last">
                            <span className="last-label">Dernière activité</span>
                            <span className="last-value">
                              {lastDate}{lastTime ? ` · ${lastTime}` : ''}{t.lastReplyBy ? ` · ${t.lastReplyBy}` : ''}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="discussion-right">
                    <div className="discussion-kpis">
                      <span className="replies">
                        <i className="far fa-comment" aria-hidden="true"></i>
                        {t.replies}
                      </span>
                    </div>
                    <div className="open-arrow" aria-hidden="true">
                      <i className="fas fa-chevron-right"></i>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Annonces />
      <BoiteIdees />

      <button
        className="forum-fab"
        onClick={() => setShowNewDiscussion(true)}
        aria-label="Nouvelle discussion"
        type="button"
      >
        <i className="fas fa-plus" aria-hidden="true"></i>
        Nouvelle discussion
      </button>

      {showNewDiscussion && (
        <div className="modal-overlay" onClick={() => setShowNewDiscussion(false)}>
          <div className="new-discussion-modal premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-head-left">
                <div className="modal-icon" aria-hidden="true"><i className="far fa-comment-dots"></i></div>
                <div>
                  <h2>Nouvelle discussion</h2>
                  <p className="modal-subtitle">Pose une question, partage une info ou lance une idée pour le quartier.</p>
                </div>
              </div>
              <button className="modal-close" type="button" onClick={() => setShowNewDiscussion(false)} aria-label="Fermer">
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>

            {!isLoggedIn ? (
              <div className="modal-cta">
                <div className="modal-cta-title">Connexion requise</div>
                <div className="modal-cta-desc">Pour publier dans le forum, connecte-toi (ou crée un compte en quelques secondes).</div>
                <div className="modal-cta-actions">
                  <button type="button" className="btn-submit" onClick={() => navigate('/login')}>Se connecter</button>
                  <button type="button" className="btn-cancel" onClick={() => navigate('/register')}>Créer un compte</button>
                </div>
              </div>
            ) : (
              <form className="new-discussion-form" onSubmit={handleNewDiscussionSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <div className="label-row">
                      <label>Titre</label>
                      <span className={`char-count ${titleCount > TITLE_MAX ? 'is-over' : ''}`}>{titleCount}/{TITLE_MAX}</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Ex: Question : Où trouver un plombier fiable ?"
                      value={newDiscussion.title}
                      maxLength={TITLE_MAX + 50}
                      onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                      required
                    />
                    <div className="field-help">Un bon titre aide les voisins à comprendre en 2 secondes.</div>
                  </div>

                  <div className="form-group">
                    <div className="label-row">
                      <label>Catégorie</label>
                      <span className="field-chip">Obligatoire</span>
                    </div>
                    <select
                      value={newDiscussion.categoryId}
                      onChange={(e) => setNewDiscussion({ ...newDiscussion, categoryId: e.target.value })}
                      required
                    >
                      <option value="">Sélectionnez une catégorie</option>
                      {categories.filter(c => c.id !== 'all').map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    <div className="field-help">Choisis la catégorie pour que la discussion soit bien classée.</div>
                  </div>

                  <div className="form-group span-2">
                    <div className="label-row">
                      <label>Message</label>
                      <span className={`char-count ${contentCount > CONTENT_MAX ? 'is-over' : ''}`}>{contentCount}/{CONTENT_MAX}</span>
                    </div>
                    <textarea
                      placeholder="Explique ton besoin, le contexte (lieu/heure) et ce que tu attends comme réponse…"
                      rows="6"
                      value={newDiscussion.content}
                      maxLength={CONTENT_MAX + 200}
                      onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                      required
                    ></textarea>
                    <div className="field-help">Conseil : un message clair = plus de réponses utiles.</div>
                  </div>
                </div>

                <div className="form-actions premium">
                  <button type="button" className="btn-cancel" onClick={() => setShowNewDiscussion(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-submit" disabled={!canSubmit || titleCount > TITLE_MAX || contentCount > CONTENT_MAX}>
                    Publier
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Forum;
