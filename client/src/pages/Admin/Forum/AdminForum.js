import React, { useState } from 'react';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import AdminHeader from '../../../components/AdminHeader/AdminHeader';
import './AdminForum.css';

const AdminForum = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Données simulées
  const forumStats = {
    categories: 8,
    topics: 156,
    posts: 2345,
    activeUsers: 89,
    reportedContent: 5,
    topCategories: [
      { name: "Événements", posts: 789, percentage: 35 },
      { name: "Projets", posts: 567, percentage: 25 },
      { name: "Discussions", posts: 456, percentage: 20 },
      { name: "Annonces", posts: 345, percentage: 15 }
    ],
    recentActivity: [
      { type: 'topic', action: 'created', user: 'Marie Dupont', content: 'Nouvelle fête de quartier', time: '5 min ago' },
      { type: 'reply', action: 'posted', user: 'Jean Martin', content: 'Re: Projet jardinage', time: '15 min ago' },
      { type: 'moderation', action: 'closed', user: 'Admin', content: 'Sujet: Question parking', time: '1 hour ago' }
    ]
  };

  const categories = [
    {
      id: 1,
      name: "Annonces officielles",
      description: "Communications importantes de l'administration",
      topics: 12,
      posts: 167,
      lastActivity: "2023-11-15"
    },
    {
      id: 2,
      name: "Événements du quartier",
      description: "Discussions sur les événements à venir",
      topics: 34,
      posts: 456,
      lastActivity: "2023-11-16"
    },
    {
      id: 3,
      name: "Projets communautaires",
      description: "Propositions et suivi des projets",
      topics: 23,
      posts: 289,
      lastActivity: "2023-11-14"
    }
  ];

  const recentTopics = [
    {
      id: 1,
      title: "Organisation de la fête de quartier",
      category: "Événements",
      author: "Marie Dupont",
      replies: 23,
      views: 234,
      status: "actif",
      created: "2023-11-15",
      lastReply: "2023-11-16"
    },
    {
      id: 2,
      title: "Proposition : Jardin communautaire",
      category: "Projets",
      author: "Thomas Martin",
      replies: 45,
      views: 567,
      status: "épinglé",
      created: "2023-11-14",
      lastReply: "2023-11-16"
    }
  ];

  const reportedContent = [
    {
      id: 1,
      type: "message",
      content: "Contenu inapproprié...",
      reporter: "Jean Dupuis",
      reason: "Spam",
      date: "2023-11-16",
      status: "en attente"
    },
    {
      id: 2,
      type: "sujet",
      content: "Titre inapproprié...",
      reporter: "Marie Lambert",
      reason: "Hors sujet",
      date: "2023-11-15",
      status: "traité"
    }
  ];

  // Nouveau composant pour les statistiques détaillées
  const DetailedStats = () => (
    <div className="detailed-stats">
      <div className="stats-row">
        <div className="stats-card trending">
          <h3>Catégories les plus actives</h3>
          <div className="trending-categories">
            {forumStats.topCategories.map((category, index) => (
              <div key={index} className="trending-item">
                <div className="trending-info">
                  <span className="trending-name">{category.name}</span>
                  <span className="trending-posts">{category.posts} posts</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="stats-card activity">
          <h3>Activité récente</h3>
          <div className="activity-list">
            {forumStats.recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className={`activity-icon ${activity.type}`}>
                  {activity.type === 'topic' ? '📝' : activity.type === 'reply' ? '💬' : '🔧'}
                </div>
                <div className="activity-details">
                  <p className="activity-text">
                    <strong>{activity.user}</strong> {activity.action} {activity.content}
                  </p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Nouveau composant modal pour la création/modification de catégorie
  const CategoryModal = ({ isOpen, onClose, category = null }) => {
    if (!isOpen) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h2>{category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
          <form className="category-form">
            <div className="form-group">
              <label className="form-label">Nom de la catégorie</label>
              <input 
                type="text" 
                className="form-input"
                defaultValue={category?.name || ''}
                placeholder="Ex: Événements du quartier"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea 
                className="form-input"
                defaultValue={category?.description || ''}
                placeholder="Description de la catégorie..."
                rows="3"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Permissions</label>
              <div className="permissions-grid">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked /> Lecture publique
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked /> Écriture membres
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" /> Modération requise
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Annuler
              </button>
              <button type="submit" className="btn-submit">
                {category ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-page">
      <AdminSidebar isCollapsed={isCollapsed} />
      <div className="admin-content">
        <AdminHeader 
          title="Gestion du Forum" 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
        />
        <div className="forum-page">
          {/* Header */}
          <div className="forum-header">
            <div className="header-title">
              <h1>Gestion du Forum</h1>
              <p className="header-subtitle">Gérez les catégories, sujets et modération</p>
            </div>
            <div className="header-actions">
              <button 
                className="reports-btn" 
                onClick={() => setActiveTab('moderation')}
              >
                <span>🚨</span>
                <span>Signalements</span>
                <span className="count-badge">{forumStats.reportedContent}</span>
              </button>
              <button 
                className="category-btn"
                onClick={() => setShowCategoryModal(true)}
              >
                <span>📁</span>
                <span>Nouvelle catégorie</span>
              </button>
            </div>
          </div>

          {/* Navigation des onglets */}
          <div className="forum-tabs">
            <button 
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Vue d'ensemble
            </button>
            <button 
              className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              Catégories
            </button>
            <button 
              className={`tab-btn ${activeTab === 'topics' ? 'active' : ''}`}
              onClick={() => setActiveTab('topics')}
            >
              Sujets
            </button>
            <button 
              className={`tab-btn ${activeTab === 'moderation' ? 'active' : ''}`}
              onClick={() => setActiveTab('moderation')}
            >
              Modération
            </button>
          </div>

          {activeTab === 'overview' && (
            <>
              <div className="stats-overview">
                <div className="stat-item">
                  <span className="stat-value">{forumStats.categories}</span>
                  <span className="stat-label">Catégories</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{forumStats.topics}</span>
                  <span className="stat-label">Sujets</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{forumStats.posts}</span>
                  <span className="stat-label">Messages</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{forumStats.activeUsers}</span>
                  <span className="stat-label">Utilisateurs actifs</span>
                </div>
              </div>
              <DetailedStats />
            </>
          )}

          {activeTab === 'categories' && (
            <div className="categories-section">
              <div className="section-header">
                <h2>Gestion des catégories</h2>
                <button className="add-btn" onClick={() => setShowCategoryModal(true)}>
                  Ajouter une catégorie
                </button>
              </div>
              <div className="categories-table">
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Description</th>
                      <th>Sujets</th>
                      <th>Messages</th>
                      <th>Dernière activité</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(category => (
                      <tr key={category.id}>
                        <td>{category.name}</td>
                        <td>{category.description}</td>
                        <td>{category.topics}</td>
                        <td>{category.posts}</td>
                        <td>{category.lastActivity}</td>
                        <td className="actions-cell">
                          <button className="action-btn edit" title="Modifier">✏️</button>
                          <button className="action-btn delete" title="Supprimer">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'topics' && (
            <div className="topics-section">
              <div className="section-header">
                <h2>Gestion des sujets</h2>
                <div className="topics-filters">
                  <input
                    type="text"
                    placeholder="Rechercher un sujet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Toutes les catégories</option>
                    <option value="events">Événements</option>
                    <option value="projects">Projets</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actifs</option>
                    <option value="pinned">Épinglés</option>
                    <option value="closed">Fermés</option>
                  </select>
                </div>
              </div>
              <div className="topics-table">
                <table>
                  <thead>
                    <tr>
                      <th>Titre</th>
                      <th>Catégorie</th>
                      <th>Auteur</th>
                      <th>Réponses</th>
                      <th>Vues</th>
                      <th>Statut</th>
                      <th>Créé le</th>
                      <th>Dernier message</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTopics.map(topic => (
                      <tr key={topic.id}>
                        <td>{topic.title}</td>
                        <td>
                          <span className="category-badge">{topic.category}</span>
                        </td>
                        <td>{topic.author}</td>
                        <td>{topic.replies}</td>
                        <td>{topic.views}</td>
                        <td>
                          <span className={`status-badge ${topic.status}`}>
                            {topic.status}
                          </span>
                        </td>
                        <td>{topic.created}</td>
                        <td>{topic.lastReply}</td>
                        <td className="actions-cell">
                          <button className="action-btn view" title="Voir">👁️</button>
                          <button className="action-btn pin" title="Épingler">📌</button>
                          <button className="action-btn close" title="Fermer">🔒</button>
                          <button className="action-btn delete" title="Supprimer">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="moderation-section">
              <div className="section-header">
                <h2>Modération du contenu</h2>
                <div className="moderation-filters">
                  <select className="filter-select">
                    <option value="all">Tous les signalements</option>
                    <option value="pending">En attente</option>
                    <option value="resolved">Traités</option>
                  </select>
                </div>
              </div>
              <div className="reports-list">
                {reportedContent.map(report => (
                  <div key={report.id} className="report-card">
                    <div className="report-header">
                      <span className={`report-type ${report.type}`}>
                        {report.type === 'message' ? '💬' : '📝'} {report.type}
                      </span>
                      <span className={`report-status ${report.status}`}>
                        {report.status}
                      </span>
                    </div>
                    <div className="report-content">
                      <p>{report.content}</p>
                    </div>
                    <div className="report-meta">
                      <span>Signalé par: {report.reporter}</span>
                      <span>Raison: {report.reason}</span>
                      <span>Date: {report.date}</span>
                    </div>
                    <div className="report-actions">
                      <button className="action-btn approve">✓ Approuver</button>
                      <button className="action-btn reject">✕ Rejeter</button>
                      <button className="action-btn ban">🚫 Bannir l'auteur</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <CategoryModal 
        isOpen={showCategoryModal} 
        onClose={() => setShowCategoryModal(false)}
        category={selectedCategory}
      />
    </div>
  );
};

export default AdminForum;
