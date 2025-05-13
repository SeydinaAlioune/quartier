import React, { useState } from 'react';
import Annonces from './Annonces';
import BoiteIdees from './BoiteIdees';
import './Forum.css';

const Forum = () => {
  const [discussions, setDiscussions] = useState([
    {
      id: 1,
      title: "Nuisances sonores le weekend",
      category: "Vie quotidienne",
      content: "Bonjour à tous, je voulais savoir si d'autres personnes sont gênées par les bruits de travaux le dimanche matin dans la rue des Lilas...",
      author: "Marie D.",
      date: "Il y a 2 heures",
      replies: 15,
      isSticky: false
    },
    {
      id: 2,
      title: "Recherche babysitter pour janvier",
      category: "Services",
      content: "Nous recherchons une personne sérieuse pour garder nos deux enfants (4 et 6 ans) les mercredis après-midi à partir de janvier...",
      author: "Thomas L.",
      date: "Il y a 1 jour",
      replies: 8,
      isSticky: false
    },
    {
      id: 3,
      title: "Covoiturage vers le centre commercial",
      category: "Transport",
      content: "Je me rends au centre commercial tous les samedis matin. Si certains veulent partager le trajet pour économiser et réduire notre impact environnemental...",
      author: "Julie M.",
      date: "Il y a 3 jours",
      replies: 12,
      isSticky: false
    }
  ]);

  const [categories] = useState([
    "Toutes les catégories",
    "Vie quotidienne",
    "Services",
    "Transport",
    "Événements",
    "Projets",
    "Annonces"
  ]);

  const [selectedCategory, setSelectedCategory] = useState("Toutes les catégories");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({
    title: "",
    category: "Vie quotidienne",
    content: ""
  });

  const handleNewDiscussionSubmit = (e) => {
    e.preventDefault();
    const discussion = {
      id: discussions.length + 1,
      ...newDiscussion,
      author: "Utilisateur",
      date: "À l'instant",
      replies: 0,
      isSticky: false
    };
    setDiscussions([discussion, ...discussions]);
    setNewDiscussion({ title: "", category: "Vie quotidienne", content: "" });
    setShowNewDiscussion(false);
  };

  const filteredDiscussions = discussions.filter(discussion => {
    const matchesCategory = selectedCategory === "Toutes les catégories" || discussion.category === selectedCategory;
    const matchesSearch = discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         discussion.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="forum-page">
      <header className="forum-header">
        <h1>Forum Communautaire</h1>
        <p>Échangez, partagez et connectez-vous avec vos voisins</p>
      </header>

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
              <option key={category} value={category}>{category}</option>
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
        {filteredDiscussions.map(discussion => (
          <div key={discussion.id} className="discussion-card">
            <div className="discussion-main">
              <h3>{discussion.title}</h3>
              <p className="discussion-preview">{discussion.content}</p>
              <div className="discussion-meta">
                <span className="category-tag">{discussion.category}</span>
                <span className="author">Par {discussion.author}</span>
                <span className="date">{discussion.date}</span>
              </div>
            </div>
            <div className="discussion-stats">
              <span className="replies">
                <i className="far fa-comment"></i>
                {discussion.replies} réponses
              </span>
              <button className="view-discussion">Voir la discussion</button>
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
                  onChange={(e) => setNewDiscussion({...newDiscussion, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Catégorie</label>
                <select
                  value={newDiscussion.category}
                  onChange={(e) => setNewDiscussion({...newDiscussion, category: e.target.value})}
                >
                  {categories.slice(1).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Contenu</label>
                <textarea
                  placeholder="Détaillez votre message ici..."
                  rows="5"
                  value={newDiscussion.content}
                  onChange={(e) => setNewDiscussion({...newDiscussion, content: e.target.value})}
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
  );
};

export default Forum;
