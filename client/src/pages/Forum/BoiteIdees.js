import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Forum.css';
import api from '../../services/api';
import AnimatedSection from '../../components/AnimatedSection/AnimatedSection';

const BoiteIdees = () => {
  const navigate = useNavigate();
  const [idees, setIdees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [newIdea, setNewIdea] = useState({ titre: '', description: '' });
  const hlDoneRef = useRef(false);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/forum/ideas');
      const list = Array.isArray(res?.data) ? res.data : [];
      const items = list.map(i => ({
        id: i.id,
        titre: i.title,
        description: i.description,
        auteur: i.author || '—',
        dateISO: i.createdAt,
        votes: i.votes || 0,
      }));
      setIdees(items);
    } catch (e) {
      setError("Impossible de charger les idées.");
      setIdees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIdeas(); }, []);

  // Surbrillance si on arrive avec hlType=idea&hlId=
  useEffect(() => {
    if (hlDoneRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('hlType') === 'idea') {
      const id = params.get('hlId');
      if (id) {
        const el = document.getElementById(`idea-${id}`);
        if (el) {
          hlDoneRef.current = true;
          el.classList.add('highlight');
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => el.classList.remove('highlight'), 4000);
        }
      }
    }
  }, [idees]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    try {
      await api.post('/api/forum/ideas', { title: newIdea.titre.trim(), description: newIdea.description.trim() });
      setShowModal(false);
      setNewIdea({ titre: '', description: '' });
      await fetchIdeas();
    } catch (err) {
      alert('Publication impossible (connexion requise).');
    }
  };

  const handleVote = async (idea) => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    try {
      const r = await api.post(`/api/forum/ideas/${idea.id}/vote`);
      const votes = typeof r?.data?.votes === 'number' ? r.data.votes : idea.votes;
      setIdees(prev => prev.map(i => i.id === idea.id ? { ...i, votes } : i));
    } catch (e) {
      alert('Vote impossible.');
    }
  };

  const handleReport = async (idea) => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    const reason = window.prompt('Raison du signalement (ex: spam, offensif, inexact, autre)', 'autre');
    if (!reason) return;
    try {
      await api.post('/api/forum/reports', { targetType: 'idea', targetId: idea.id, reason });
      alert('Signalement envoyé. Merci.');
    } catch (e) {
      alert('Signalement impossible.');
    }
  };

  return (
    <section className="boite-idees-section">
      <div className="section-head">
        <div>
          <h2>Boîte à Idées</h2>
          <p className="section-subtitle">Proposez des améliorations concrètes pour le quartier et votez pour celles qui vous inspirent.</p>
        </div>
        <button className="new-idee-btn" onClick={() => setShowModal(true)}>
          <i className="fas fa-lightbulb"></i> Proposer une idée
        </button>
      </div>

      <div className="idees-grid">
        {loading && <div className="forum-muted">Chargement...</div>}
        {!loading && error && <div className="forum-error">{error}</div>}
        {!loading && !error && idees.length === 0 && (
          <div className="idee-card">
            <h3>Aucune idée pour le moment</h3>
            <p className="idee-description">Soyez le premier à proposer une amélioration pour le quartier.</p>
            <div className="idee-votes">
              <button className="btn-submit" onClick={() => setShowModal(true)}>
                <i className="fas fa-lightbulb"></i> Proposer une idée
              </button>
            </div>
          </div>
        )}
        {!loading && !error && idees.map((idee, idx) => (
          <AnimatedSection key={idee.id} delay={idx % 4} animation="scale">
            <div id={`idea-${idee.id}`} className="idee-card">
            <h3>{idee.titre}</h3>
            <p className="idee-meta">
              Proposée par {idee.auteur} • {idee.dateISO ? new Date(idee.dateISO).toLocaleDateString('fr-FR') : ''}
            </p>
            <p className="idee-description">{idee.description}</p>
            <div className="idee-votes">
              <button className="vote-btn v2" onClick={() => handleVote(idee)}>
                <i className="fas fa-thumbs-up" aria-hidden="true"></i>
                <span>Vote</span>
              </button>
              <span className="votes-pill">{idee.votes} votes</span>
              <button className="link-like" onClick={() => handleReport(idee)}>Signaler</button>
            </div>
          </div>
          </AnimatedSection>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="new-discussion-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Proposer une idée</h2>
            <form className="new-discussion-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Titre</label>
                <input
                  type="text"
                  placeholder="Ex: Aire de jeux inclusive"
                  value={newIdea.titre}
                  onChange={(e) => setNewIdea({ ...newIdea, titre: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Expliquez votre idée..."
                  rows="4"
                  value={newIdea.description}
                  onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                  required
                ></textarea>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-submit">Publier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default BoiteIdees;
