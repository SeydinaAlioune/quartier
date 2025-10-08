import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import AdminHeader from '../../../components/AdminHeader/AdminHeader';
import './AdminForum.css';
import api from '../../../services/api';

const AdminForum = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [forumStats, setForumStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [recentTopics, setRecentTopics] = useState([]);
  const [reportedContent, setReportedContent] = useState([]); // à brancher plus tard si besoin
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('pending');
  const [preview, setPreview] = useState({ open: false, loading: false, error: '', data: null, report: null });
  const [pendingAds, setPendingAds] = useState([]);
  const [pendingAdsLoading, setPendingAdsLoading] = useState(false);
  const [pendingFilterType, setPendingFilterType] = useState('all');
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingSort, setPendingSort] = useState('newest'); // newest | oldest
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Topic creation & detail
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', categoryId: '' });
  const [showTopicDetail, setShowTopicDetail] = useState(false);
  const [topicDetail, setTopicDetail] = useState({ topic: null, posts: [], loading: false, error: '', newPost: '' });

  useEffect(() => {
    const loadForum = async () => {
      try {
        setLoading(true);
        setError('');
        const [statsRes, catsRes, topicsRes] = await Promise.all([
          api.get('/api/forum/stats'),
          api.get('/api/forum/categories'),
          api.get('/api/forum/topics/recent'),
        ]);
        setForumStats(statsRes?.data || null);
        setCategories(Array.isArray(catsRes?.data) ? catsRes.data : []);
        setRecentTopics(Array.isArray(topicsRes?.data) ? topicsRes.data : []);
      } catch (e) {
        setError("Impossible de charger les données du forum.");
      } finally {
        setLoading(false);
      }
    };
    loadForum();
  }, []);

  // Load reports when moderation tab is active or filter changes
  useEffect(() => {
    const loadReports = async () => {
      if (activeTab !== 'moderation') return;
      try {
        setReportsLoading(true);
        setReportsError('');
        const url = reportStatusFilter === 'all' ? '/api/forum/reports' : `/api/forum/reports?status=${reportStatusFilter}`;
        const r = await api.get(url);
        setReportedContent(Array.isArray(r?.data) ? r.data : []);
      } catch (e) {
        setReportsError('Impossible de charger les signalements.');
        setReportedContent([]);
      } finally {
        setReportsLoading(false);
      }
    };
    loadReports();
  }, [activeTab, reportStatusFilter]);

  // Load pending ads when moderation tab is active
  useEffect(() => {
    const loadPendingAds = async () => {
      if (activeTab !== 'moderation') return;
      try {
        setPendingAdsLoading(true);
        const r = await api.get('/api/forum/ads?status=pending&limit=200');
        setPendingAds(Array.isArray(r?.data) ? r.data : []);
      } catch (e) {
        setPendingAds([]);
      } finally {
        setPendingAdsLoading(false);
      }
    };
    loadPendingAds();
  }, [activeTab]);

  // reload helpers
  const reloadStats = async () => {
    try { const r = await api.get('/api/forum/stats'); setForumStats(r?.data || null); } catch {}
  };
  const reloadCategories = async () => {
    try { const r = await api.get('/api/forum/categories'); setCategories(Array.isArray(r?.data) ? r.data : []); } catch {}
  };
  const reloadRecentTopics = async () => {
    try { const r = await api.get('/api/forum/topics/recent'); setRecentTopics(Array.isArray(r?.data) ? r.data : []); } catch {}
  };
  const reloadPendingAds = async () => {
    try {
      const r = await api.get('/api/forum/ads?status=pending&limit=200');
      setPendingAds(Array.isArray(r?.data) ? r.data : []);
    } catch {}
  };
  const getPendingAdsView = () => {
    let list = [...pendingAds];
    if (pendingFilterType !== 'all') list = list.filter(ad => ad.type === pendingFilterType);
    const q = pendingSearch.trim().toLowerCase();
    if (q) list = list.filter(ad => `${ad.title || ''} ${ad.description || ''}`.toLowerCase().includes(q));
    list.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return pendingSort === 'newest' ? db - da : da - db;
    });
    return list;
  };

  // Preview handlers for reported content
  const handleOpenReportPreview = async (report) => {
    setPreview({ open: true, loading: true, error: '', data: null, report });
    try {
      let resp = null;
      if (report.targetType === 'idea') {
        resp = await api.get(`/api/forum/ideas/${report.targetId}`);
      } else if (report.targetType === 'ad') {
        resp = await api.get(`/api/forum/ads/${report.targetId}`);
      }
      setPreview(prev => ({ ...prev, loading: false, data: resp?.data || null }));
    } catch (e) {
      setPreview(prev => ({ ...prev, loading: false, error: 'Impossible de charger le contenu signalé.' }));
    }
  };

  const handleDeleteTarget = async (report) => {
    if (!window.confirm("Supprimer l'élément signalé ?")) return;
    try {
      if (report.targetType === 'idea') {
        await api.delete(`/api/forum/ideas/${report.targetId}`);
      } else if (report.targetType === 'ad') {
        await api.delete(`/api/forum/ads/${report.targetId}`);
      } else {
        alert('Suppression non prise en charge pour ce type.');
        return;
      }
      try { await api.put(`/api/forum/reports/${report.id}/status`, { status: 'resolved' }); } catch {}
      setReportedContent(prev => prev.map(r => r.id === report.id ? { ...r, status: 'resolved' } : r));
      setPreview({ open: false, loading: false, error: '', data: null, report: null });
      await reloadStats();
    } catch (e) {
      alert('Suppression impossible.');
    }
  };

  // Category actions
  const handleOpenCreateCategory = () => { setSelectedCategory(null); setShowCategoryModal(true); };
  const handleOpenEditCategory = (category) => { setSelectedCategory(category); setShowCategoryModal(true); };
  const handleSaveCategory = async ({ id, name, description }) => {
    try {
      if (!name || !name.trim()) { alert('Le nom est requis'); return; }
      if (id) {
        await api.put(`/api/forum/categories/${id}`, { name, description });
        alert('Catégorie mise à jour');
      } else {
        await api.post('/api/forum/categories', { name, description });
        alert('Catégorie créée');
      }
      setShowCategoryModal(false);
      setSelectedCategory(null);
      await reloadCategories();
      await reloadStats();
    } catch (e) {
      alert("Action impossible. Vérifiez vos droits (admin) et réessayez.");
    }
  };
  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await api.delete(`/api/forum/categories/${id}`);
      alert('Catégorie supprimée');
      await reloadCategories();
      await reloadStats();
    } catch (e) {
      alert("Suppression impossible. Vérifiez qu'aucun sujet n'existe dans cette catégorie.");
    }
  };

  // Topic actions
  const handleTogglePin = async (topic) => {
    try {
      const pinned = topic.status !== 'pinned';
      await api.put(`/api/forum/topics/${topic.id}/pin`, { pinned });
      await reloadRecentTopics();
      alert(pinned ? 'Sujet épinglé' : 'Sujet désépinglé');
    } catch (e) {
      alert("Impossible de changer l'état d'épingle (admin requis).");
    }
  };
  const handleToggleClose = async (topic) => {
    try {
      const next = topic.status === 'closed' ? 'active' : 'closed';
      await api.put(`/api/forum/topics/${topic.id}/close`, { status: next });
      await reloadRecentTopics();
      alert(next === 'closed' ? 'Sujet fermé' : 'Sujet réouvert');
    } catch (e) {
      alert("Impossible de changer le statut (admin requis).");
    }
  };
  const handleDeleteTopic = async (topic) => {
    if (!window.confirm('Supprimer ce sujet et ses messages ?')) return;
    try {
      await api.delete(`/api/forum/topics/${topic.id}`);
      await reloadRecentTopics();
      alert('Sujet supprimé');
    } catch (e) {
      alert("Suppression du sujet impossible (admin requis).");
    }
  };

  const handleOpenNewTopic = () => {
    setNewTopic({ title: '', categoryId: categories[0]?.id || '' });
    setShowTopicModal(true);
  };

  const handleSubmitNewTopic = async (e) => {
    e.preventDefault();
    try {
      if (!newTopic.title.trim() || !newTopic.categoryId) { alert('Titre et catégorie requis'); return; }
      await api.post('/api/forum/topics', { title: newTopic.title.trim(), category: newTopic.categoryId });
      setShowTopicModal(false);
      setNewTopic({ title: '', categoryId: '' });
      await reloadRecentTopics();
      alert('Sujet créé');
    } catch (e) {
      alert("Création du sujet impossible (connexion requise).");
    }
  };

  const handleOpenTopicDetail = async (topic) => {
    setTopicDetail({ topic, posts: [], loading: true, error: '', newPost: '' });
    setShowTopicDetail(true);
    try {
      const r = await api.get(`/api/forum/topics/${topic.id}/posts`);
      setTopicDetail(prev => ({ ...prev, loading: false, posts: Array.isArray(r?.data) ? r.data : [] }));
    } catch (e) {
      setTopicDetail(prev => ({ ...prev, loading: false, error: "Impossible de charger les messages." }));
    }
  };

  const handleAddPost = async () => {
    if (!topicDetail.topic) return;
    const content = topicDetail.newPost.trim();
    if (!content) return;
    try {
      await api.post('/api/forum/posts', { topic: topicDetail.topic.id, content });
      const r = await api.get(`/api/forum/topics/${topicDetail.topic.id}/posts`);
      setTopicDetail(prev => ({ ...prev, posts: Array.isArray(r?.data) ? r.data : [], newPost: '' }));
    } catch (e) {
      alert("Impossible d'ajouter le message (connexion requise).");
    }
  };

  const handleToggleHidePost = async (post) => {
    try {
      const hidden = post.status !== 'hidden';
      await api.put(`/api/forum/posts/${post.id}/hide`, { hidden });
      const r = await api.get(`/api/forum/topics/${topicDetail.topic.id}/posts`);
      setTopicDetail(prev => ({ ...prev, posts: Array.isArray(r?.data) ? r.data : prev.posts }));
    } catch (e) {
      alert("Action de modération impossible (admin requis).");
    }
  };

  const handleDeletePost = async (post) => {
    if (!window.confirm('Supprimer ce message ?')) return;
    try {
      await api.delete(`/api/forum/posts/${post.id}`);
      const r = await api.get(`/api/forum/topics/${topicDetail.topic.id}/posts`);
      setTopicDetail(prev => ({ ...prev, posts: Array.isArray(r?.data) ? r.data : prev.posts }));
    } catch (e) {
      alert("Suppression impossible (admin requis).");
    }
  };

  // Pending ads actions (moderation)
  const handleApproveAd = async (ad) => {
    try {
      await api.put(`/api/forum/ads/${ad.id}/status`, { status: 'approved' });
      setPendingAds(prev => prev.filter(x => x.id !== ad.id));
      await reloadStats();
      await reloadPendingAds();
    } catch (e) { alert('Action impossible.'); }
  };
  const handleRejectAd = async (ad) => {
    try {
      await api.put(`/api/forum/ads/${ad.id}/status`, { status: 'rejected' });
      setPendingAds(prev => prev.filter(x => x.id !== ad.id));
      await reloadStats();
      await reloadPendingAds();
    } catch (e) { alert('Action impossible.'); }
  };
  const handleDeleteAd = async (ad) => {
    if (!window.confirm('Supprimer définitivement cette annonce ?')) return;
    try {
      await api.delete(`/api/forum/ads/${ad.id}`);
      setPendingAds(prev => prev.filter(x => x.id !== ad.id));
      await reloadStats();
      await reloadPendingAds();
    } catch (e) { alert('Suppression impossible.'); }
  };

  // Nouveau composant pour les statistiques détaillées
  const DetailedStats = () => (
    <div className="detailed-stats">
      <div className="stats-row">
        <div className="stats-card trending">
          <h3>Catégories les plus actives</h3>
          <div className="trending-categories">
            {(forumStats?.topCategories || []).map((category, index) => (
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
            {(forumStats?.recentActivity || []).map((activity, index) => (
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
  const CategoryModal = ({ isOpen, onClose, category = null, onSave }) => {
    const [name, setName] = useState(category?.name || '');
    const [description, setDescription] = useState(category?.description || '');
    useEffect(() => {
      setName(category?.name || '');
      setDescription(category?.description || '');
    }, [category]);
    if (!isOpen) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h2>{category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
          <form className="category-form" onSubmit={(e) => { e.preventDefault(); onSave && onSave({ id: category?.id, name, description }); }}>
            <div className="form-group">
              <label className="form-label">Nom de la catégorie</label>
              <input 
                type="text" 
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Événements du quartier"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea 
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                <span className="count-badge">{forumStats?.reportedContent || 0}</span>
              </button>
              <button 
                className="category-btn"
                onClick={handleOpenCreateCategory}
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
              {loading && <div style={{ padding: '12px' }}>Chargement...</div>}
              {!loading && error && <div className="forum-error">{error}</div>}
              {!loading && !error && (
                <>
                  <div className="stats-overview">
                    <div className="stat-item">
                      <span className="stat-value">{forumStats?.categories ?? '—'}</span>
                      <span className="stat-label">Catégories</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{forumStats?.topics ?? '—'}</span>
                      <span className="stat-label">Sujets</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{forumStats?.posts ?? '—'}</span>
                      <span className="stat-label">Messages</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{forumStats?.activeUsers ?? '—'}</span>
                      <span className="stat-label">Utilisateurs actifs</span>
                    </div>
                  </div>
                  <DetailedStats />
                </>
              )}
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
                        <td>{category.lastActivity ? new Date(category.lastActivity).toLocaleDateString('fr-FR') : '—'}</td>
                        <td className="actions-cell">
                          <button className="action-btn edit" title="Modifier" onClick={() => handleOpenEditCategory(category)}>✏️</button>
                          <button className="action-btn delete" title="Supprimer" onClick={() => handleDeleteCategory(category.id)}>🗑️</button>
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
                <div>
                  <button className="add-btn" onClick={handleOpenNewTopic}>Nouveau sujet</button>
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
                    {recentTopics
                      .filter(t => categoryFilter === 'all' || t.category?.toLowerCase().includes(categoryFilter.toLowerCase()))
                      .map(topic => (
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
                        <td>{topic.created ? new Date(topic.created).toLocaleDateString('fr-FR') : '—'}</td>
                        <td>{topic.lastReply ? new Date(topic.lastReply).toLocaleDateString('fr-FR') : '—'}</td>
                        <td className="actions-cell">
                          <button className="action-btn view" title="Voir" onClick={() => handleOpenTopicDetail(topic)}>👁️</button>
                          <button className="action-btn pin" title="Épingler" onClick={() => handleTogglePin(topic)}>📌</button>
                          <button className="action-btn close" title="Fermer" onClick={() => handleToggleClose(topic)}>🔒</button>
                          <button className="action-btn delete" title="Supprimer" onClick={() => handleDeleteTopic(topic)}>🗑️</button>
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
                  <select className="filter-select" value={reportStatusFilter} onChange={(e) => setReportStatusFilter(e.target.value)}>
                    <option value="pending">En attente</option>
                    <option value="resolved">Traités</option>
                    <option value="all">Tous</option>
                  </select>
                </div>
              </div>
              {/* Pending ads review */}
              <div className="reports-list" style={{ marginBottom: '16px' }}>
                <div className="report-card" style={{ background: '#f8fafc' }}>
                  <h3 style={{ marginTop: 0 }}>Annonces en attente</h3>
                  <div className="moderation-filters" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <select className="filter-select" value={pendingFilterType} onChange={(e) => setPendingFilterType(e.target.value)}>
                      <option value="all">Tous les types</option>
                      <option value="vends">Vends</option>
                      <option value="recherche">Recherche</option>
                      <option value="services">Services</option>
                    </select>
                    <input className="search-input" placeholder="Rechercher..." value={pendingSearch} onChange={(e) => setPendingSearch(e.target.value)} style={{ maxWidth: 240 }} />
                    <select className="filter-select" value={pendingSort} onChange={(e) => setPendingSort(e.target.value)}>
                      <option value="newest">Plus récentes</option>
                      <option value="oldest">Plus anciennes</option>
                    </select>
                  </div>
                  {pendingAdsLoading && <div>Chargement...</div>}
                  {!pendingAdsLoading && pendingAds.length === 0 && <div>Aucune annonce en attente.</div>}
                  {!pendingAdsLoading && getPendingAdsView().map(ad => (
                    <div key={ad.id} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                        <div>
                          <div><strong>{(ad.type || '').toUpperCase()}</strong> · {ad.title}</div>
                          <div style={{ color: '#4a5568' }}>{[ad.description, ad.price].filter(Boolean).join(' — ')}</div>
                          <div style={{ color: '#718096', fontSize: '0.9rem' }}>Par {ad.author || '—'} • {ad.createdAt ? new Date(ad.createdAt).toLocaleString('fr-FR') : ''}</div>
                        </div>
                        <div className="report-actions" style={{ display: 'flex', gap: '8px' }}>
                          <button className="action-btn approve" title="Approuver" onClick={() => handleApproveAd(ad)}>✅ Approuver</button>
                          <button className="action-btn reject" title="Rejeter" onClick={() => handleRejectAd(ad)}>⛔ Rejeter</button>
                          <button className="action-btn delete" title="Supprimer" onClick={() => handleDeleteAd(ad)}>🗑️ Supprimer</button>
                          <a className="action-btn view" href={`/forum?hlType=ad&hlId=${ad.id}`} target="_blank" rel="noreferrer">🌐 Ouvrir côté public</a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="reports-list">
                {reportsLoading && <div className="report-card">Chargement...</div>}
                {!reportsLoading && reportsError && <div className="report-card">{reportsError}</div>}
                {!reportsLoading && !reportsError && reportedContent.length === 0 && (
                  <div className="report-card">Aucun signalement</div>
                )}
                {!reportsLoading && !reportsError && reportedContent.map(report => (
                  <div key={report.id} className="report-card">
                    <div className="report-header">
                      <span className={`report-type ${report.targetType}`}>
                        {report.targetType}
                      </span>
                      <span className={`report-status ${report.status}`}>
                        {report.status}
                      </span>
                    </div>
                    <div className="report-content">
                      <p>
                        Cible: <strong>{report.targetType}</strong> #{report.targetId}
                      </p>
                      {report.targetTitle && <p><strong>Titre</strong>: {report.targetTitle}</p>}
                      {report.targetSnippet && <p><strong>Aperçu</strong>: {report.targetSnippet}</p>}
                      {report.targetStatus && <p><strong>Statut</strong>: {report.targetStatus}</p>}
                      <p>Raison: {report.reason}</p>
                      {report.details && <p>Détails: {report.details}</p>}
                    </div>
                    <div className="report-meta">
                      <span>Signalé par: {report.reporter}</span>
                      <span>Date: {report.createdAt ? new Date(report.createdAt).toLocaleString('fr-FR') : ''}</span>
                    </div>
                    <div className="report-actions">
                      {(report.targetType === 'idea' || report.targetType === 'ad') && (
                        <>
                          <button className="action-btn view" onClick={() => handleOpenReportPreview(report)}>👁️ Voir</button>
                          <button className="action-btn delete" onClick={() => handleDeleteTarget(report)}>🗑️ Supprimer l'élément</button>
                          <a
                            className="action-btn view"
                            href={`/forum?hlType=${report.targetType}&hlId=${report.targetId}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Ouvrir côté public"
                          >🌐 Ouvrir côté public</a>
                          {report.targetType === 'ad' && (
                            <>
                              <button className="action-btn approve" title="Approuver l'annonce" onClick={async () => {
                                try {
                                  await api.put(`/api/forum/ads/${report.targetId}/status`, { status: 'approved' });
                                  alert('Annonce approuvée');
                                  // mettre à jour l'état affiché
                                  setReportedContent(prev => prev.map(r => r.id === report.id ? { ...r, targetStatus: 'approved' } : r));
                                } catch (e) { alert('Action impossible.'); }
                              }}>✅ Approuver</button>
                              <button className="action-btn reject" title="Rejeter l'annonce" onClick={async () => {
                                try {
                                  await api.put(`/api/forum/ads/${report.targetId}/status`, { status: 'rejected' });
                                  alert('Annonce rejetée');
                                  setReportedContent(prev => prev.map(r => r.id === report.id ? { ...r, targetStatus: 'rejected' } : r));
                                } catch (e) { alert('Action impossible.'); }
                              }}>⛔ Rejeter</button>
                            </>
                          )}
                        </>
                      )}
                      {report.status !== 'resolved' ? (
                        <button className="action-btn approve" onClick={async () => {
                          try { await api.put(`/api/forum/reports/${report.id}/status`, { status: 'resolved' });
                            setReportedContent(prev => prev.map(r => r.id === report.id ? { ...r, status: 'resolved' } : r));
                            await reloadStats();
                          } catch (e) { alert('Action impossible.'); }
                        }}>Marquer traité</button>
                      ) : (
                        <button className="action-btn reject" onClick={async () => {
                          try { await api.put(`/api/forum/reports/${report.id}/status`, { status: 'pending' });
                            setReportedContent(prev => prev.map(r => r.id === report.id ? { ...r, status: 'pending' } : r));
                            await reloadStats();
                          } catch (e) { alert('Action impossible.'); }
                        }}>Repasser en attente</button>
                      )}
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
        onSave={handleSaveCategory}
      />

      {showTopicModal && (
        <div className="modal-overlay" onClick={() => setShowTopicModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Nouveau sujet</h2>
            <form onSubmit={handleSubmitNewTopic}>
              <div className="form-group">
                <label className="form-label">Titre</label>
                <input className="form-input" value={newTopic.title} onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Catégorie</label>
                <select className="form-input" value={newTopic.categoryId} onChange={(e) => setNewTopic({ ...newTopic, categoryId: e.target.value })} required>
                  <option value="">Sélectionner...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowTopicModal(false)}>Annuler</button>
                <button type="submit" className="btn-submit">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {preview.open && (
        <div className="modal-overlay" onClick={() => setPreview({ open: false, loading: false, error: '', data: null, report: null })}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <h2>Contenu signalé</h2>
            {preview.loading && <div>Chargement...</div>}
            {!preview.loading && preview.error && <div className="forum-error">{preview.error}</div>}
            {!preview.loading && !preview.error && (
              <div>
                {preview.report?.targetType === 'idea' && preview.data && (
                  <div>
                    <p><strong>Titre</strong>: {preview.data.title}</p>
                    <p><strong>Description</strong>: {preview.data.description}</p>
                    <p><strong>Votes</strong>: {preview.data.votes}</p>
                    <p><strong>Auteur</strong>: {preview.data.author}</p>
                    <p><strong>Date</strong>: {preview.data.createdAt ? new Date(preview.data.createdAt).toLocaleString('fr-FR') : ''}</p>
                  </div>
                )}
                {preview.report?.targetType === 'ad' && preview.data && (
                  <div>
                    <p><strong>Type</strong>: {preview.data.type}</p>
                    <p><strong>Titre</strong>: {preview.data.title}</p>
                    <p><strong>Description</strong>: {preview.data.description}</p>
                    {preview.data.price && <p><strong>Prix</strong>: {preview.data.price}</p>}
                    <p><strong>Statut</strong>: {preview.data.status}</p>
                    <p><strong>Auteur</strong>: {preview.data.author}</p>
                    <p><strong>Date</strong>: {preview.data.createdAt ? new Date(preview.data.createdAt).toLocaleString('fr-FR') : ''}</p>
                  </div>
                )}
                {(preview.report?.targetType !== 'idea' && preview.report?.targetType !== 'ad') && (
                  <div>Prévisualisation non disponible pour ce type: {preview.report?.targetType}</div>
                )}
              </div>
            )}
            <div className="form-actions">
              {preview.report && (preview.report.targetType === 'idea' || preview.report.targetType === 'ad') && (
                <button className="btn-submit" onClick={() => handleDeleteTarget(preview.report)}>Supprimer l'élément</button>
              )}
              <button className="btn-secondary" onClick={() => setPreview({ open: false, loading: false, error: '', data: null, report: null })}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {showTopicDetail && (
        <div className="modal-overlay" onClick={() => setShowTopicDetail(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <h2>{topicDetail.topic?.title || 'Sujet'}</h2>
            {topicDetail.loading && <div>Chargement des messages...</div>}
            {!topicDetail.loading && topicDetail.error && <div className="forum-error">{topicDetail.error}</div>}
            {!topicDetail.loading && !topicDetail.error && (
              <div className="posts-list">
                {topicDetail.posts.length === 0 && <div>Aucun message</div>}
                {topicDetail.posts.map(p => (
                  <div className={`post-item ${p.status}`} key={p.id}>
                    <div className="post-meta">
                      <strong>{p.author}</strong>
                      <span>{new Date(p.createdAt).toLocaleString('fr-FR')}</span>
                      <span className={`status-badge ${p.status}`}>{p.status}</span>
                    </div>
                    <div className="post-content">{p.content}</div>
                    <div className="post-actions">
                      <button onClick={() => handleToggleHidePost(p)}>{p.status === 'hidden' ? 'Rendre visible' : 'Masquer'}</button>
                      <button onClick={() => handleDeletePost(p)}>Supprimer</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="new-post">
              <textarea rows="3" placeholder="Votre message..." value={topicDetail.newPost} onChange={(e) => setTopicDetail(prev => ({ ...prev, newPost: e.target.value }))} />
              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setShowTopicDetail(false)}>Fermer</button>
                <button className="btn-submit" onClick={handleAddPost}>Publier</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminForum;
