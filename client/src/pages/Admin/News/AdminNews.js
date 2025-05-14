import React, { useState } from 'react';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import AdminHeader from '../../../components/AdminHeader/AdminHeader';
import './AdminNews.css';

const AdminNews = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Données simulées des articles
  const articles = [
    {
      titre: "Rénovation du parc central",
      categorie: "Travaux",
      auteur: "Marie Dupont",
      datePublication: "15/11/2023",
      datePlanifiee: "20/11/2023",
      statut: "Planifié",
      vues: 245,
      likes: 23,
      commentaires: 12,
      tags: ["urbanisme", "environnement"],
      image: "parc.jpg"
    },
    {
      titre: "Festival de quartier ce weekend",
      categorie: "Événements",
      auteur: "Thomas Martin",
      datePublication: "14/11/2023",
      statut: "Publié",
      vues: 189,
      likes: 15,
      commentaires: 8,
      tags: ["culture", "loisirs"],
      image: "festival.jpg"
    },
    {
      titre: "Nouvelle collecte des déchets",
      categorie: "Informations",
      auteur: "Sophie Leroy",
      datePublication: "13/11/2023",
      statut: "En attente",
      vues: 0,
      likes: 0,
      commentaires: 0,
      tags: ["environnement", "service"],
      image: null
    },
    {
      titre: "Réunion du conseil de quartier",
      categorie: "Réunions",
      auteur: "Mohammed Diallo",
      datePublication: "12/11/2023",
      statut: "Brouillon",
      vues: 0,
      likes: 0,
      commentaires: 0,
      tags: ["politique", "quartier"],
      image: null
    }
  ];

  // Données simulées des médias
  const medias = [
    { id: 1, type: "image", url: "parc.jpg", name: "Parc central", size: "2.4 MB" },
    { id: 2, type: "image", url: "festival.jpg", name: "Festival 2023", size: "1.8 MB" },
    { id: 3, type: "video", url: "reunion.mp4", name: "Réunion conseil", size: "15.6 MB" }
  ];

  // Données simulées des commentaires
  const comments = [
    {
      id: 1,
      article: "Rénovation du parc central",
      auteur: "Jean Dupuis",
      contenu: "Excellente initiative !",
      date: "16/11/2023",
      statut: "approuvé"
    },
    {
      id: 2,
      article: "Festival de quartier ce weekend",
      auteur: "Marie Lambert",
      contenu: "À quelle heure commence l'événement ?",
      date: "15/11/2023",
      statut: "en attente"
    }
  ];

  const MediaLibrary = () => (
    <div className="media-library">
      <div className="media-header">
        <h3>Bibliothèque de médias</h3>
        <div className="media-actions">
          <button className="upload-btn">
            <span>+</span> Importer des médias
          </button>
          <button className="organize-btn">Organiser</button>
        </div>
      </div>
      <div className="media-filters">
        <select className="media-type-filter">
          <option value="all">Tous les types</option>
          <option value="image">Images</option>
          <option value="video">Vidéos</option>
          <option value="document">Documents</option>
        </select>
        <input type="text" placeholder="Rechercher un média..." className="media-search" />
      </div>
      <div className="media-grid">
        {medias.map((media) => (
          <div key={media.id} className="media-item">
            <div className="media-preview">
              {media.type === "image" ? (
                <img src={media.url} alt={media.name} />
              ) : (
                <div className="video-preview">🎥</div>
              )}
            </div>
            <div className="media-info">
              <span className="media-name">{media.name}</span>
              <span className="media-size">{media.size}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const CommentsSection = () => (
    <div className="comments-section">
      <div className="comments-header">
        <h3>Gestion des commentaires</h3>
        <div className="comments-filters">
          <select className="status-filter">
            <option value="all">Tous les statuts</option>
            <option value="approved">Approuvés</option>
            <option value="pending">En attente</option>
            <option value="spam">Spam</option>
          </select>
        </div>
      </div>
      <div className="comments-list">
        {comments.map((comment) => (
          <div key={comment.id} className="comment-item">
            <div className="comment-header">
              <span className="comment-author">{comment.auteur}</span>
              <span className="comment-date">{comment.date}</span>
            </div>
            <div className="comment-content">{comment.contenu}</div>
            <div className="comment-article">Sur : {comment.article}</div>
            <div className="comment-actions">
              <button className="approve-btn">✓ Approuver</button>
              <button className="reject-btn">✕ Rejeter</button>
              <button className="reply-btn">↩ Répondre</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="admin-page">
      <AdminSidebar isCollapsed={isCollapsed} />
      <div className="admin-content">
        <AdminHeader 
          title="Gestion des Actualités" 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
        />
        <div className="news-page">
          <div className="news-header">
            <div className="header-title">
              <h1>Gestion des Actualités</h1>
              <p className="header-subtitle">Gérez vos articles, médias et commentaires</p>
            </div>
            <div className="header-actions">
              <button className="media-btn" onClick={() => setShowMediaLibrary(!showMediaLibrary)}>
                <span>📁</span>
                <span>Médias</span>
                <span className="count-badge">3</span>
              </button>
              <button className="comments-btn" onClick={() => setShowComments(!showComments)}>
                <span>💬</span>
                <span>Commentaires</span>
                <span className="count-badge">5</span>
              </button>
              <button className="add-news-btn">
                <span>+</span>
                <span>Créer un article</span>
              </button>
            </div>
          </div>

          {showMediaLibrary && <MediaLibrary />}
          {showComments && <CommentsSection />}

          <div className="stats-section">
            <div className="stats-grid">
              <div className="stats-card">
                <h3>Vue d'ensemble</h3>
                <div className="stats-overview">
                  <div className="stat-item">
                    <span className="stat-value">48</span>
                    <span className="stat-label">Articles total</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">42</span>
                    <span className="stat-label">Publiés</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">4</span>
                    <span className="stat-label">Brouillons</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">2</span>
                    <span className="stat-label">En attente</span>
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <h3>Engagement</h3>
                <div className="engagement-stats">
                  <div className="stat-item">
                    <span className="stat-icon">👁️</span>
                    <span className="stat-value">12.5K</span>
                    <span className="stat-label">Vues</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">❤️</span>
                    <span className="stat-value">856</span>
                    <span className="stat-label">Likes</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">💬</span>
                    <span className="stat-value">234</span>
                    <span className="stat-label">Commentaires</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">🔄</span>
                    <span className="stat-value">89</span>
                    <span className="stat-label">Partages</span>
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <h3>Catégories</h3>
                <div className="categories-chart">
                  <div className="category-bar">
                    <div className="category-info">
                      <span className="category-name">Événements</span>
                      <span className="category-count">15</span>
                    </div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill"
                        style={{ width: "31.25%" }}
                      />
                    </div>
                  </div>
                  <div className="category-bar">
                    <div className="category-info">
                      <span className="category-name">Informations</span>
                      <span className="category-count">12</span>
                    </div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill"
                        style={{ width: "25%" }}
                      />
                    </div>
                  </div>
                  <div className="category-bar">
                    <div className="category-info">
                      <span className="category-name">Travaux</span>
                      <span className="category-count">8</span>
                    </div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill"
                        style={{ width: "16.67%" }}
                      />
                    </div>
                  </div>
                  <div className="category-bar">
                    <div className="category-info">
                      <span className="category-name">Réunions</span>
                      <span className="category-count">7</span>
                    </div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill"
                        style={{ width: "14.58%" }}
                      />
                    </div>
                  </div>
                  <div className="category-bar">
                    <div className="category-info">
                      <span className="category-name">Autres</span>
                      <span className="category-count">6</span>
                    </div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill"
                        style={{ width: "12.5%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="articles-section">
            <div className="articles-header">
              <h2>Liste des Articles</h2>
              <div className="articles-filters">
                <input
                  type="text"
                  placeholder="Rechercher un article..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <div className="filter-group">
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Toutes les catégories</option>
                    <option value="events">Événements</option>
                    <option value="info">Informations</option>
                    <option value="works">Travaux</option>
                    <option value="meetings">Réunions</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="published">Publié</option>
                    <option value="draft">Brouillon</option>
                    <option value="pending">En attente</option>
                    <option value="scheduled">Planifié</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="articles-table">
              <table>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Titre</th>
                    <th>Catégorie</th>
                    <th>Tags</th>
                    <th>Auteur</th>
                    <th>Publication</th>
                    <th>Statut</th>
                    <th>Engagement</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article, index) => (
                    <tr key={index}>
                      <td>
                        <div className="article-image">
                          {article.image ? (
                            <img src={article.image} alt={article.titre} />
                          ) : (
                            <div className="no-image">📄</div>
                          )}
                        </div>
                      </td>
                      <td>{article.titre}</td>
                      <td>
                        <span className="category-badge">{article.categorie}</span>
                      </td>
                      <td>
                        <div className="tags-list">
                          {article.tags.map((tag, i) => (
                            <span key={i} className="tag-badge">{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td>{article.auteur}</td>
                      <td>
                        {article.statut === "Planifié" ? (
                          <div className="publication-date">
                            <span className="scheduled-date">🕒 {article.datePlanifiee}</span>
                          </div>
                        ) : (
                          article.datePublication
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${article.statut.toLowerCase()}`}>
                          {article.statut}
                        </span>
                      </td>
                      <td>
                        <div className="engagement-stats">
                          <span title="Vues">👁️ {article.vues}</span>
                          <span title="Likes">❤️ {article.likes}</span>
                          <span title="Commentaires">💬 {article.commentaires}</span>
                        </div>
                      </td>
                      <td className="actions-cell">
                        <button className="action-btn view" title="Voir">👁️</button>
                        <button className="action-btn edit" title="Modifier">✏️</button>
                        <button className="action-btn schedule" title="Planifier">🕒</button>
                        <button className="action-btn delete" title="Supprimer">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button className="active">1</button>
              <button>2</button>
              <button>3</button>
              <span>...</span>
              <button>5</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNews;
