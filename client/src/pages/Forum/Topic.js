import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import './Forum.css';
import useSeo from '../../hooks/useSeo';
import { emitToast } from '../../utils/toast';

const Topic = () => {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const isLoggedIn = useMemo(() => !!localStorage.getItem('token'), []);

  useSeo({
    title: topic?.title ? String(topic.title) : 'Discussion',
    description: topic?.content ? String(topic.content) : 'Discussion du forum QuartierConnect.',
    canonical: typeof window !== 'undefined' ? `${window.location.origin}/forum/topics/${encodeURIComponent(id)}` : undefined,
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [tRes, pRes] = await Promise.all([
        api.get(`/api/forum/topics/${id}`),
        api.get(`/api/forum/topics/${id}/posts`),
      ]);
      setTopic(tRes.data || null);
      setPosts(Array.isArray(pRes.data) ? pRes.data : []);
    } catch (e) {
      setError("Impossible de charger la discussion.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) return;
    if (!reply.trim()) return;
    try {
      setSending(true);
      await api.post('/api/forum/posts', { topic: id, content: reply.trim() });
      setReply('');
      await load();
    } catch (err) {
      emitToast("Réponse impossible (vérifiez votre connexion).");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="forum-page topic-page">
      {loading && <div className="forum-muted">Chargement…</div>}
      {!loading && error && <div className="forum-error">{error}</div>}
      {!loading && !error && topic && (
        <>
          <header className="topic-header">
            <div className="topic-breadcrumb">
              <Link to="/forum" className="link-like" style={{ textDecoration: 'none' }}>
                <i className="fas fa-arrow-left" aria-hidden="true"></i> Retour au forum
              </Link>
            </div>

            <div className="topic-hero">
              <div className="topic-title-row">
                <h1 className="topic-title">{topic.title}</h1>
                {topic.status && topic.status !== 'active' && (
                  <span className={`topic-status is-${topic.status}`}>{topic.status}</span>
                )}
              </div>
              <div className="topic-meta">
                <span className="category-tag">{topic.category}</span>
                <span className="topic-meta-item">Créé par <strong>{topic.author}</strong></span>
                <span className="topic-meta-item">{new Date(topic.created).toLocaleDateString('fr-FR')}</span>
                <span className="topic-meta-item">{Math.max(0, (posts?.length || 0) - 1)} réponses</span>
              </div>
            </div>
          </header>

          <section className="topic-posts" aria-label="Messages">
            {posts.length === 0 && (
              <div className="empty-state"><p>Aucun message pour le moment.</p></div>
            )}
            {posts.map((p, idx) => {
              const initials = (p.author || '—').trim().slice(0, 1).toUpperCase();
              return (
                <article key={p.id} className={`post-card ${idx === 0 ? 'is-first' : ''} ${p.status === 'hidden' ? 'is-hidden' : ''}`}>
                  <div className="post-left">
                    <div className="post-avatar" aria-hidden="true">{initials}</div>
                  </div>
                  <div className="post-body">
                    <div className="post-head">
                      <div className="post-author">
                        <span className="post-author-name">{p.author}</span>
                        {idx === 0 && <span className="post-badge">Message initial</span>}
                        {p.status === 'hidden' && <span className="post-badge danger">Masqué</span>}
                      </div>
                      <time className="post-time">{new Date(p.createdAt).toLocaleString('fr-FR')}</time>
                    </div>
                    <div className="post-content" style={{ whiteSpace: 'pre-wrap' }}>{p.content}</div>
                  </div>
                </article>
              );
            })}
          </section>

          <div className="topic-compose-spacer" aria-hidden="true" />

          <section className="topic-compose" aria-label="Répondre">
            {topic?.status === 'closed' && (
              <div className="compose-locked">
                <div className="compose-locked-title">Sujet fermé</div>
                <div className="compose-locked-desc">Vous ne pouvez plus répondre à cette discussion.</div>
              </div>
            )}

            {topic?.status !== 'closed' && !isLoggedIn && (
              <div className="compose-login">
                <div className="compose-login-title">Connectez-vous pour répondre</div>
                <div className="compose-login-actions">
                  <Link to="/login" className="btn-submit" style={{ textDecoration: 'none' }}>Se connecter</Link>
                  <Link to="/register" className="btn-cancel" style={{ textDecoration: 'none' }}>Créer un compte</Link>
                </div>
              </div>
            )}

            {topic?.status !== 'closed' && isLoggedIn && (
              <form className="compose-form" onSubmit={handleReply}>
                <textarea
                  className="compose-textarea"
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Écrivez une réponse utile et respectueuse…"
                />
                <div className="compose-actions">
                  <Link to="/forum" className="btn-cancel" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Retour</Link>
                  <button type="submit" className="btn-submit" disabled={sending || !reply.trim()}>
                    {sending ? 'Envoi…' : 'Publier'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default Topic;
