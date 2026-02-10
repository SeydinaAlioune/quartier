import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout';
import './AdminForum.css';
import api from '../../../services/api';
import { emitToast } from '../../../utils/toast';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileText,
  FolderPlus,
  Pencil,
  Globe,
  Lock,
  MessageCircle,
  MoreVertical,
  Pin,
  Trash2,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';

const AdminForum = () => {
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
  const [openTopicMenuId, setOpenTopicMenuId] = useState(null);
  const topicMenuRef = useRef(null);

  useEffect(() => {
    if (!openTopicMenuId) return;
    const onDown = (e) => {
      if (!topicMenuRef.current) return;
      if (!topicMenuRef.current.contains(e.target)) setOpenTopicMenuId(null);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenTopicMenuId(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openTopicMenuId]);

  const topicStatusMeta = (s) => {
    const v = String(s || '').toLowerCase();
    if (v === 'pinned') return { key: 'pinned', label: 'Épinglé' };
    if (v === 'closed') return { key: 'closed', label: 'Fermé' };
    if (v === 'active') return { key: 'active', label: 'Actif' };
    return { key: 'unknown', label: String(s || '—') };
  };

  const filteredTopics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (Array.isArray(recentTopics) ? recentTopics : [])
      .filter((t) => {
        if (categoryFilter === 'all') return true;
        const c = (t?.categoryName || t?.category?.name || t?.category || '').toString();
        return c.toLowerCase() === String(categoryFilter).toLowerCase();
      })
      .filter((t) => {
        if (statusFilter === 'all') return true;
        return String(t?.status || '').toLowerCase() === String(statusFilter).toLowerCase();
      })
      .filter((t) => {
        if (!q) return true;
        const hay = `${t?.title || ''} ${t?.author || ''} ${t?.categoryName || t?.category?.name || t?.category || ''}`.toLowerCase();
        return hay.includes(q);
      });
  }, [recentTopics, categoryFilter, statusFilter, searchQuery]);

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
        emitToast('Suppression non prise en charge pour ce type.');
        return;
      }
      try { await api.put(`/api/forum/reports/${report.id}/status`, { status: 'resolved' }); } catch {}
      setReportedContent(prev => prev.map(r => r.id === report.id ? { ...r, status: 'resolved' } : r));
      setPreview({ open: false, loading: false, error: '', data: null, report: null });
      await reloadStats();
    } catch (e) {
      emitToast('Suppression impossible.');
    }
  };

  // Category actions
  const handleOpenCreateCategory = () => { setSelectedCategory(null); setShowCategoryModal(true); };
  const handleOpenEditCategory = (category) => { setSelectedCategory(category); setShowCategoryModal(true); };
  const handleSaveCategory = async ({ id, name, description }) => {
    try {
      if (!name || !name.trim()) { emitToast('Le nom est requis'); return; }
      if (id) {
        await api.put(`/api/forum/categories/${id}`, { name, description });
        emitToast('Catégorie mise à jour');
      } else {
        await api.post('/api/forum/categories', { name, description });
        emitToast('Catégorie créée');
      }
      setShowCategoryModal(false);
      setSelectedCategory(null);
      await reloadCategories();
      await reloadStats();
    } catch (e) {
      emitToast("Action impossible. Vérifiez vos droits (admin) et réessayez.");
    }
  };
  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await api.delete(`/api/forum/categories/${id}`);
      emitToast('Catégorie supprimée');
      await reloadCategories();
      await reloadStats();
    } catch (e) {
      emitToast("Suppression impossible. Vérifiez qu'aucun sujet n'existe dans cette catégorie.");
    }
  };

  // Topic actions
  const handleTogglePin = async (topic) => {
    try {
      const pinned = topic.status !== 'pinned';
      await api.put(`/api/forum/topics/${topic.id}/pin`, { pinned });
      await reloadRecentTopics();
      emitToast(pinned ? 'Sujet épinglé' : 'Sujet désépinglé');
    } catch (e) {
      emitToast("Impossible de changer l'état d'épingle (admin requis).");
    }
  };
  const handleToggleClose = async (topic) => {
    try {
      const next = topic.status === 'closed' ? 'active' : 'closed';
      await api.put(`/api/forum/topics/${topic.id}/close`, { status: next });
      await reloadRecentTopics();
      emitToast(next === 'closed' ? 'Sujet fermé' : 'Sujet réouvert');
    } catch (e) {
      emitToast("Impossible de changer le statut (admin requis).");
    }
  };
  const handleDeleteTopic = async (topic) => {
    if (!window.confirm('Supprimer ce sujet et ses messages ?')) return;
    try {
      await api.delete(`/api/forum/topics/${topic.id}`);
      await reloadRecentTopics();
      emitToast('Sujet supprimé');
    } catch (e) {
      emitToast("Suppression du sujet impossible (admin requis).");
    }
  };

  const handleOpenNewTopic = () => {
    setNewTopic({ title: '', categoryId: categories[0]?.id || '' });
    setShowTopicModal(true);
  };

  const handleSubmitNewTopic = async (e) => {
    e.preventDefault();
    try {
      if (!newTopic.title.trim() || !newTopic.categoryId) { emitToast('Titre et catégorie requis'); return; }
      await api.post('/api/forum/topics', { title: newTopic.title.trim(), category: newTopic.categoryId });
      setShowTopicModal(false);
      setNewTopic({ title: '', categoryId: '' });
      await reloadRecentTopics();
      emitToast('Sujet créé');
    } catch (e) {
      emitToast("Création du sujet impossible (connexion requise).");
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
    if (!topicDetail.topic || !topicDetail.newPost.trim()) return;
    try {
      await api.post(`/api/forum/topics/${topicDetail.topic.id}/posts`, { content: topicDetail.newPost.trim() });
      const r = await api.get(`/api/forum/topics/${topicDetail.topic.id}/posts`);
      setTopicDetail(prev => ({ ...prev, posts: Array.isArray(r?.data) ? r.data : [], newPost: '' }));
    } catch (e) {
      emitToast("Impossible d'ajouter le message (connexion requise).");
    }
  };

  const handleToggleHidePost = async (post) => {
    try {
      const hidden = post.status !== 'hidden';
      await api.put(`/api/forum/posts/${post.id}/hide`, { hidden });
      const r = await api.get(`/api/forum/topics/${topicDetail.topic.id}/posts`);
      setTopicDetail(prev => ({ ...prev, posts: Array.isArray(r?.data) ? r.data : prev.posts }));
    } catch (e) {
      emitToast("Action de modération impossible (admin requis).");
    }
  };

  const handleDeletePost = async (post) => {
    if (!window.confirm('Supprimer ce message ?')) return;
    if (!topicDetail.topic) return;
    try {
      await api.delete(`/api/forum/posts/${post.id}`);
      const r = await api.get(`/api/forum/topics/${topicDetail.topic.id}/posts`);
      setTopicDetail(prev => ({ ...prev, posts: Array.isArray(r?.data) ? r.data : prev.posts }));
    } catch (e) {
      emitToast("Suppression impossible (admin requis).");
    }
  };

  // Pending ads actions (moderation)
  const handleApproveAd = async (ad) => {
    try {
      await api.put(`/api/forum/ads/${ad.id}/status`, { status: 'approved' });
      setPendingAds(prev => prev.filter(x => x.id !== ad.id));
      await reloadStats();
      await reloadPendingAds();
    } catch (e) { emitToast('Action impossible.'); }
  };
  const handleRejectAd = async (ad) => {
    try {
      await api.put(`/api/forum/ads/${ad.id}/status`, { status: 'rejected' });
      setPendingAds(prev => prev.filter(x => x.id !== ad.id));
      await reloadStats();
      await reloadPendingAds();
    } catch (e) { emitToast('Action impossible.'); }
  };
  const handleDeleteAd = async (ad) => {
    if (!window.confirm('Supprimer définitivement cette annonce ?')) return;
    try {
      await api.delete(`/api/forum/ads/${ad.id}`);
      setPendingAds(prev => prev.filter(x => x.id !== ad.id));
      await reloadStats();
      await reloadPendingAds();
    } catch (e) { emitToast('Suppression impossible.'); }
  };

  // Nouveau composant pour les statistiques détaillées
  const DetailedStats = () => (
    <div className="detailed-stats">
      <div className="stats-row">
        <div className="stats-card trending">
          <h3>Catégories les plus actives</h3>
          <div className="trending-categories" aria-label="Top catégories">
            {(forumStats?.topCategories || []).slice(0, 5).map((category, index) => (
              <div key={index} className="trending-item">
                <div className="trending-row">
                  <div className="trending-left">
                    <span className="trending-rank">#{index + 1}</span>
                    <span className="trending-name">{category.name}</span>
                  </div>
                  <span className="trending-count">{category.posts} messages</span>
                </div>
                <div className="progress-bar" aria-hidden="true">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.max(0, Math.min(100, Number(category.percentage) || 0))}%` }}
                  />
                </div>
              </div>
            ))}
            {(forumStats?.topCategories || []).length === 0 && (
              <div className="empty-muted">Aucune donnée.</div>
            )}
          </div>
        </div>
        <div className="stats-card activity">
          <h3>Activité récente</h3>
          <div className="activity-list">
            {(forumStats?.recentActivity || []).slice(0, 6).map((activity, index) => (
              <div key={index} className="activity-item">
                <div className={`activity-icon ${activity.type}`} aria-hidden="true">
                  {activity.type === 'topic' ? (
                    <FileText size={16} aria-hidden="true" />
                  ) : activity.type === 'reply' ? (
                    <MessageCircle size={16} aria-hidden="true" />
                  ) : (
                    <Wrench size={16} aria-hidden="true" />
                  )}
                </div>
                <div className="activity-details">
                  <div className="activity-line">
                    <span className="activity-user">{activity.user}</span>
                    <span className="activity-action">{activity.action}</span>
                    <span className="activity-content">{activity.content}</span>
                  </div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              </div>
            ))}
            {(forumStats?.recentActivity || []).length === 0 && (
              <div className="empty-muted">Aucune activité récente.</div>
            )}
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
          <div className="modal-header">
            <h2>{category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
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
    <AdminLayout title="Gestion du Forum">
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
                <AlertTriangle size={18} aria-hidden="true" />
                <span>Signalements</span>
                <span className="count-badge">{forumStats?.reportedContent || 0}</span>
              </button>
              <button 
                className="category-btn"
                onClick={handleOpenCreateCategory}
              >
                <FolderPlus size={18} aria-hidden="true" />
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
              <div className="categories-table table-wrapper">
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
                          <button className="action-btn edit" title="Modifier" onClick={() => handleOpenEditCategory(category)} aria-label="Modifier">
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                          <button className="action-btn delete" title="Supprimer" onClick={() => handleDeleteCategory(category.id)} aria-label="Supprimer">
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mobile-cards" aria-label="Catégories">
                {categories.map((category) => (
                  <div key={category.id} className="mobile-card">
                    <div className="mobile-card__top">
                      <div className="mobile-card__title">{category.name}</div>
                      <div className="mobile-card__actions">
                        <button className="action-btn edit" title="Modifier" onClick={() => handleOpenEditCategory(category)} aria-label="Modifier">
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button className="action-btn delete" title="Supprimer" onClick={() => handleDeleteCategory(category.id)} aria-label="Supprimer">
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {category.description && (
                      <div className="mobile-card__desc">{category.description}</div>
                    )}

                    <div className="mobile-card__meta">
                      <div className="mobile-meta">
                        <span className="mobile-meta__label">Sujets</span>
                        <span className="mobile-meta__value">{category.topics}</span>
                      </div>
                      <div className="mobile-meta">
                        <span className="mobile-meta__label">Messages</span>
                        <span className="mobile-meta__value">{category.posts}</span>
                      </div>
                      <div className="mobile-meta">
                        <span className="mobile-meta__label">Dernière activité</span>
                        <span className="mobile-meta__value">{category.lastActivity ? new Date(category.lastActivity).toLocaleDateString('fr-FR') : '—'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'topics' && (
            <div className="topics-section">
              <div className="section-header">
                <h2>Gestion des sujets</h2>
                <div className="section-actions">
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
                      {categories.map((c) => (
                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="active">Actif</option>
                      <option value="pinned">Épinglé</option>
                      <option value="closed">Fermé</option>
                    </select>
                  </div>
                  <button className="add-btn" onClick={handleOpenNewTopic}>Nouveau sujet</button>
                </div>
              </div>
              <div className="topics-table table-wrapper">
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
                    {filteredTopics.map(topic => (
                      <tr key={topic.id}>
                        <td>{topic.title}</td>
                        <td>
                          <span className="category-badge">{topic.category}</span>
                        </td>
                        <td>{topic.author}</td>
                        <td>{topic.replies}</td>
                        <td>{topic.views}</td>
                        <td>
                          {(() => {
                            const st = topicStatusMeta(topic.status);
                            return (
                              <span className={`status-badge status-${st.key}`}>
                                {st.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td>{topic.created ? new Date(topic.created).toLocaleDateString('fr-FR') : '—'}</td>
                        <td>{topic.lastReply ? new Date(topic.lastReply).toLocaleDateString('fr-FR') : '—'}</td>
                        <td className="actions-cell">
                          <button className="action-btn view" title="Voir" onClick={() => handleOpenTopicDetail(topic)} aria-label="Voir">
                            <Eye size={16} aria-hidden="true" />
                          </button>
                          <button className="action-btn pin" title="Épingler" onClick={() => handleTogglePin(topic)} aria-label="Épingler">
                            <Pin size={16} aria-hidden="true" />
                          </button>
                          <button className="action-btn close" title="Fermer" onClick={() => handleToggleClose(topic)} aria-label="Fermer">
                            <Lock size={16} aria-hidden="true" />
                          </button>
                          <button className="action-btn delete" title="Supprimer" onClick={() => handleDeleteTopic(topic)} aria-label="Supprimer">
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mobile-cards" aria-label="Sujets">
                {filteredTopics.map((topic) => {
                  const st = topicStatusMeta(topic.status);
                  return (
                    <div key={topic.id} className="mobile-card">
                      <div className="mobile-card__top">
                        <div className="mobile-card__title">{topic.title}</div>
                        <div className="mobile-card__actions">
                          <button className="action-btn view action-btn--primary" title="Voir" onClick={() => handleOpenTopicDetail(topic)} aria-label="Voir">
                            <Eye size={16} aria-hidden="true" />
                            Voir
                          </button>
                          <div className="menu" ref={openTopicMenuId === topic.id ? topicMenuRef : null}>
                            <button
                              className="action-btn"
                              aria-label="Actions"
                              title="Actions"
                              onClick={() => setOpenTopicMenuId((prev) => (prev === topic.id ? null : topic.id))}
                            >
                              <MoreVertical size={16} aria-hidden="true" />
                            </button>
                            {openTopicMenuId === topic.id && (
                              <div className="menu__panel" role="menu">
                                <button className="menu__item" role="menuitem" onClick={() => { setOpenTopicMenuId(null); handleTogglePin(topic); }}>
                                  <Pin size={16} aria-hidden="true" />
                                  Épingler / Désépingler
                                </button>
                                <button className="menu__item" role="menuitem" onClick={() => { setOpenTopicMenuId(null); handleToggleClose(topic); }}>
                                  <Lock size={16} aria-hidden="true" />
                                  Fermer / Réouvrir
                                </button>
                                <button className="menu__item menu__item--danger" role="menuitem" onClick={() => { setOpenTopicMenuId(null); handleDeleteTopic(topic); }}>
                                  <Trash2 size={16} aria-hidden="true" />
                                  Supprimer
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mobile-card__chips">
                        <span className="category-badge">{topic.category}</span>
                        <span className={`status-badge status-${st.key}`}>{st.label}</span>
                      </div>

                      <div className="mobile-card__meta">
                        <div className="mobile-meta">
                          <span className="mobile-meta__label">Auteur</span>
                          <span className="mobile-meta__value">{topic.author}</span>
                        </div>
                        <div className="mobile-meta">
                          <span className="mobile-meta__label">Réponses</span>
                          <span className="mobile-meta__value">{topic.replies}</span>
                        </div>
                        <div className="mobile-meta">
                          <span className="mobile-meta__label">Dernier message</span>
                          <span className="mobile-meta__value">{topic.lastReply ? new Date(topic.lastReply).toLocaleDateString('fr-FR') : '—'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
              <div className="reports-list reports-list--pending">
                <div className="report-card report-card--pending">
                  <h3 className="report-card__title">Annonces en attente</h3>
                  <div className="moderation-filters moderation-filters--pending">
                    <select className="filter-select" value={pendingFilterType} onChange={(e) => setPendingFilterType(e.target.value)}>
                      <option value="all">Tous les types</option>
                      <option value="vends">Vends</option>
                      <option value="recherche">Recherche</option>
                      <option value="services">Services</option>
                    </select>
                    <input className="search-input" placeholder="Rechercher..." value={pendingSearch} onChange={(e) => setPendingSearch(e.target.value)} />
                    <select className="filter-select" value={pendingSort} onChange={(e) => setPendingSort(e.target.value)}>
                      <option value="newest">Plus récentes</option>
                      <option value="oldest">Plus anciennes</option>
                    </select>
                  </div>
                  {pendingAdsLoading && <div>Chargement...</div>}
                  {!pendingAdsLoading && pendingAds.length === 0 && <div>Aucune annonce en attente.</div>}
                  {!pendingAdsLoading && getPendingAdsView().map(ad => (
                    <div key={ad.id} className="pending-ad">
                      <div className="pending-ad__row">
                        <div className="pending-ad__main">
                          <div className="pending-ad__title"><strong>{(ad.type || '').toUpperCase()}</strong> · {ad.title}</div>
                          <div className="pending-ad__desc">{[ad.description, ad.price].filter(Boolean).join(' — ')}</div>
                          <div className="pending-ad__meta">Par {ad.author || '—'} • {ad.createdAt ? new Date(ad.createdAt).toLocaleString('fr-FR') : ''}</div>
                        </div>
                        <div className="report-actions report-actions--pending">
                          <button className="action-btn approve" title="Approuver" onClick={() => handleApproveAd(ad)}>
                            <CheckCircle2 size={16} aria-hidden="true" />
                            Approuver
                          </button>
                          <button className="action-btn reject" title="Rejeter" onClick={() => handleRejectAd(ad)}>
                            <XCircle size={16} aria-hidden="true" />
                            Rejeter
                          </button>
                          <button className="action-btn delete" title="Supprimer" onClick={() => handleDeleteAd(ad)}>
                            <Trash2 size={16} aria-hidden="true" />
                            Supprimer
                          </button>
                          <a className="action-btn view" href={`/forum?hlType=ad&hlId=${ad.id}`} target="_blank" rel="noreferrer">
                            <Globe size={16} aria-hidden="true" />
                            Ouvrir côté public
                          </a>
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
                          <button className="action-btn view" onClick={() => handleOpenReportPreview(report)}>
                            <Eye size={16} aria-hidden="true" />
                            Voir
                          </button>
                          <button className="action-btn delete" onClick={() => handleDeleteTarget(report)}>
                            <Trash2 size={16} aria-hidden="true" />
                            Supprimer l'élément
                          </button>
                          <a
                            className="action-btn view"
                            href={`/forum?hlType=${report.targetType}&hlId=${report.targetId}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Ouvrir côté public"
                          >
                            <Globe size={16} aria-hidden="true" />
                            Ouvrir côté public
                          </a>
                          {report.targetType === 'ad' && (
                            <>
                              <button className="action-btn approve" title="Approuver l'annonce" onClick={async () => {
                                try {
                                  await api.put(`/api/forum/ads/${report.targetId}/status`, { status: 'approved' });
                                  emitToast('Annonce approuvée');
                                  // mettre à jour l'état affiché
                                  setReportedContent(prev => prev.map(r => r.id === report.id ? { ...r, targetStatus: 'approved' } : r));
                                } catch (e) { emitToast('Action impossible.'); }
                              }}>
                                <CheckCircle2 size={16} aria-hidden="true" />
                                Approuver
                              </button>
                              <button className="action-btn reject" title="Rejeter l'annonce" onClick={async () => {
                                try {
                                  await api.put(`/api/forum/ads/${report.targetId}/status`, { status: 'rejected' });
                                  emitToast('Annonce rejetée');
                                  setReportedContent(prev => prev.map(r => r.id === report.id ? { ...r, targetStatus: 'rejected' } : r));
                                } catch (e) { emitToast('Action impossible.'); }
                              }}>
                                <XCircle size={16} aria-hidden="true" />
                                Rejeter
                              </button>
                            </>
                          )}
                        </>
                      )}
                      {report.status !== 'resolved' ? (
                        <button className="action-btn approve" onClick={async () => {
                          try { await api.put(`/api/forum/reports/${report.id}/status`, { status: 'resolved' });
                            setReportedContent(prev => prev.map(r => r.id === report.id ? { ...r, status: 'resolved' } : r));
                            await reloadStats();
                          } catch (e) { emitToast('Action impossible.'); }
                        }}>Marquer traité</button>
                      ) : (
                        <button className="action-btn reject" onClick={async () => {
                          try { await api.put(`/api/forum/reports/${report.id}/status`, { status: 'pending' });
                            setReportedContent(prev => prev.map(r => r.id === report.id ? { ...r, status: 'pending' } : r));
                            await reloadStats();
                          } catch (e) { emitToast('Action impossible.'); }
                        }}>Repasser en attente</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            <div className="modal-header">
              <h2>Nouveau sujet</h2>
              <button type="button" className="modal-close" onClick={() => setShowTopicModal(false)} aria-label="Fermer">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
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
            <div className="modal-header">
              <h2>Contenu signalé</h2>
              <button type="button" className="modal-close" onClick={() => setPreview({ open: false, loading: false, error: '', data: null, report: null })} aria-label="Fermer">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
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
            <div className="modal-header">
              <h2>{topicDetail.topic?.title || 'Sujet'}</h2>
              <button type="button" className="modal-close" onClick={() => setShowTopicDetail(false)} aria-label="Fermer">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
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
    </AdminLayout>
  );
};

export default AdminForum;
