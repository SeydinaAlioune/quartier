import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import './Forum.css';

const Topic = () => {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const isLoggedIn = useMemo(() => !!localStorage.getItem('token'), []);

  const load = async () => {
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
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

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
      alert("Réponse impossible (vérifiez votre connexion).");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="forum-page">
      {loading && <div>Chargement…</div>}
      {!loading && error && <div className="forum-error">{error}</div>}
      {!loading && !error && topic && (
        <>
          <header className="forum-header">
            <h1>{topic.title}</h1>
            <p>
              <span className="category-tag" style={{ marginRight: 8 }}>{topic.category}</span>
              <span style={{ color: '#e6fffb', opacity: .9 }}>Par {topic.author} — {new Date(topic.created).toLocaleDateString('fr-FR')}</span>
            </p>
          </header>

          <section className="discussions-list">
            {posts.map((p) => (
              <div key={p.id} className="discussion-card">
                <div className="discussion-main">
                  <div className="discussion-meta">
                    <span className="author">{p.author}</span>
                    <span className="date">{new Date(p.createdAt).toLocaleString('fr-FR')}</span>
                    {p.status === 'hidden' && <span className="category-tag" style={{ background:'#fff5f5', color:'#c53030' }}>Masqué</span>}
                  </div>
                  <div className="discussion-preview" style={{ whiteSpace: 'pre-wrap' }}>{p.content}</div>
                </div>
              </div>
            ))}
            {posts.length === 0 && (
              <div className="empty-state"><p>Aucun message pour le moment.</p></div>
            )}
          </section>

          <section className="annonces-section" style={{ marginTop: '1.5rem' }}>
            <h2>Répondre</h2>
            {topic?.status === 'closed' && (
              <div className="empty-state"><p>Ce sujet est fermé. Vous ne pouvez plus répondre.</p></div>
            )}
            {topic?.status !== 'closed' && !isLoggedIn ? (
              <div className="empty-state">
                <p>Vous devez être connecté pour répondre.</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to="/login" className="btn-submit" style={{ textDecoration: 'none' }}>Se connecter</Link>
                  <Link to="/register" className="btn-cancel" style={{ textDecoration: 'none' }}>Créer un compte</Link>
                </div>
              </div>
            ) : topic?.status !== 'closed' ? (
              <form className="new-discussion-form" onSubmit={handleReply}>
                <div className="form-group">
                  <label>Votre message</label>
                  <textarea rows="4" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Écrivez votre réponse…" />
                </div>
                <div className="form-actions">
                  <Link to="/forum" className="btn-cancel" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Retour</Link>
                  <button type="submit" className="btn-submit" disabled={sending}>{sending ? 'Envoi…' : 'Publier la réponse'}</button>
                </div>
              </form>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
};

export default Topic;
