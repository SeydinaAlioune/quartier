import React, { useEffect, useState } from 'react';
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

  const [selectedCategory, setSelectedCategory] = useState("Toutes les catégories");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({ title: '', categoryId: '', content: '' });

  // Charger catégories et sujets récents
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [catRes, topicsRes] = await Promise.all([
          api.get('/api/forum/categories'),
          api.get('/api/forum/topics/recent'),
        ]);
        if (!mounted) return;
        const cats = Array.isArray(catRes.data) ? catRes.data : [];
        setCategories([{ id: 'all', name: 'Toutes les catégories' }, ...cats.map(c => ({ id: c.id || c._id, name: c.name }))]);
        const list = Array.isArray(topicsRes.data) ? topicsRes.data : [];
        setTopics(list);
      } catch (e) {
        if (mounted) setError('Impossible de charger le forum.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleNewDiscussionSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      return navigate('/login');
    }
    try {
      const payload = { title: newDiscussion.title, category: newDiscussion.categoryId };
      await api.post('/api/forum/topics', payload);
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

  return (
    <>
      <header
        className="forum-header"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${process.env.PUBLIC_URL}/for.jpg)`
        }}
      >
        <h1>Forum Communautaire</h1>
        <p>Échangez, partagez et connectez-vous avec vos voisins</p>
      </header>

      <div className="forum-page">
      <div className="forum-controls">
        <div className="search-filters">
          <input
            type="text"
            placeholder="Rechercher une discussion..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
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
        {!loading && !error && filteredTopics.map(t => (
          <div key={t.id} className="discussion-card">
            <div className="discussion-main">
              <h3>{t.title}</h3>
              <div className="discussion-meta">
                <span className="category-tag">{t.category}</span>
                <span className="author">Par {t.author}</span>
                <span className="date">{new Date(t.created).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            <div className="discussion-stats">
              <span className="replies">
                <i className="far fa-comment"></i>
                {t.replies} réponses
              </span>
              <button className="view-discussion" onClick={() => navigate(`/forum/topics/${t.id}`)} title="Voir la discussion">Voir la discussion</button>
            </div>
          </div>
        ))}
      </section>

      <Annonces />
      <BoiteIdees />

      {showNewDiscussion && (
        <div className="modal-overlay">
          <div className="new-discussion-modal">
            <h2>Créer une Nouvelle Discussion</h2>
            <form className="new-discussion-form" onSubmit={handleNewDiscussionSubmit}>
              <div className="form-group">
                <label>Titre</label>
                <input
                  type="text"
                  placeholder="Le sujet de votre discussion"
                  value={newDiscussion.title}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Catégorie</label>
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
              </div>
              <div className="form-group">
                <label>Contenu</label>
                <textarea
                  placeholder="Détaillez votre message ici..."
                  rows="5"
                  value={newDiscussion.content}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                  required
                ></textarea>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowNewDiscussion(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-submit">
                  Publier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Forum;
