import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AdminLayout from '../../../components/AdminLayout/AdminLayout';
import api from '../../../services/api';
import { emitToast } from '../../../utils/toast';
import './AdminDonations.css';

const AdminDonations = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    goal: '',
    startDate: '',
    endDate: '',
    category: 'project',
    project: '',
  });
  const [projectsList, setProjectsList] = useState([]);
  const [showDonationsModal, setShowDonationsModal] = useState(false);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [donationsError, setDonationsError] = useState('');
  const [donations, setDonations] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');
  const [stats, setStats] = useState(null);

  const [openMenuCampaignId, setOpenMenuCampaignId] = useState(null);
  const [menuPos, setMenuPos] = useState(null);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editCampaign, setEditCampaign] = useState({
    title: '',
    description: '',
    goal: '',
    startDate: '',
    endDate: '',
    category: 'project',
    project: '',
    status: 'active',
  });

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const formatFcfa = (value) => {
    const v = Number(value || 0);
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        maximumFractionDigits: 0,
      }).format(v);
    } catch (e) {
      return `${v.toLocaleString('fr-FR')} FCFA`;
    }
  };

  const closeMenu = () => {
    setOpenMenuCampaignId(null);
    setMenuPos(null);
  };

  const openMenu = (campaign, ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const btn = ev.currentTarget;
    const rect = btn.getBoundingClientRect();
    menuButtonRef.current = btn;
    setOpenMenuCampaignId(campaign._id);
    setMenuPos({
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 248),
    });
  };

  const startEditCampaign = (campaign) => {
    closeMenu();
    setEditingCampaign(campaign);
    setEditCampaign({
      title: campaign?.title || '',
      description: campaign?.description || '',
      goal: String(campaign?.goal ?? ''),
      startDate: campaign?.startDate ? String(campaign.startDate).slice(0, 10) : '',
      endDate: campaign?.endDate ? String(campaign.endDate).slice(0, 10) : '',
      category: campaign?.category || 'project',
      project: campaign?.project?._id ? String(campaign.project._id) : (campaign?.project ? String(campaign.project) : ''),
      status: campaign?.status || 'active',
    });
    setShowEditModal(true);
  };

  const handleUpdateCampaign = async (e) => {
    e.preventDefault();
    if (!editingCampaign?._id) return;
    try {
      setEditLoading(true);
      const payload = {
        title: editCampaign.title,
        description: editCampaign.description,
        goal: Number(editCampaign.goal || 0),
        startDate: editCampaign.startDate ? new Date(editCampaign.startDate) : undefined,
        endDate: editCampaign.endDate ? new Date(editCampaign.endDate) : undefined,
        category: editCampaign.category,
        project: editCampaign.category === 'project' && editCampaign.project ? editCampaign.project : undefined,
        status: editCampaign.status,
      };

      await api.put(`/api/donations/campaigns/${editingCampaign._id}`, payload);
      emitToast('Campagne mise à jour.');
      setShowEditModal(false);
      setEditingCampaign(null);
      fetchCampaigns();
      fetchStats();
    } catch (err) {
      emitToast('Mise à jour impossible.');
    } finally {
      setEditLoading(false);
    }
  };

  const updateCampaignStatus = async (campaign, status) => {
    closeMenu();
    if (!campaign?._id) return;
    try {
      await api.put(`/api/donations/campaigns/${campaign._id}`, { status });
      emitToast('Statut mis à jour.');
      fetchCampaigns();
      fetchStats();
    } catch (err) {
      emitToast('Changement de statut impossible.');
    }
  };

  const askDeleteCampaign = (campaign) => {
    closeMenu();
    setConfirmDelete(campaign);
  };

  const confirmDeleteCampaign = async () => {
    if (!confirmDelete?._id) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/api/donations/campaigns/${confirmDelete._id}`);
      emitToast('Campagne supprimée.');
      setConfirmDelete(null);
      fetchCampaigns();
      fetchStats();
      if (selectedCampaign?._id === confirmDelete._id) {
        setShowDonationsModal(false);
        setSelectedCampaign(null);
      }
    } catch (err) {
      emitToast('Suppression impossible.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const donationsTotal = useMemo(() => {
    return donations.reduce((sum, d) => sum + Number(d?.amount || 0), 0);
  }, [donations]);

  const renderPortal = (node) => {
    if (typeof document === 'undefined') return null;
    return createPortal(node, document.body);
  };

  const getProgressPct = (collected, goal) => {
    const g = Number(goal || 0);
    if (!g) return 0;
    const c = Number(collected || 0);
    const pct = (c / g) * 100;
    if (!Number.isFinite(pct)) return 0;
    return Math.max(0, Math.min(100, pct));
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'telethon':
        return 'Téléthon';
      case 'project':
        return 'Projet';
      case 'emergency':
        return 'Urgence';
      case 'community':
        return 'Communauté';
      case 'other':
        return 'Autre';
      default:
        return category || '—';
    }
  };

  const getDonationStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Payé';
      case 'pending':
        return 'En attente';
      case 'failed':
        return 'Échec';
      case 'cancelled':
        return 'Annulé';
      default:
        return status || '—';
    }
  };

  const getDonationStatusTone = (status) => {
    switch (status) {
      case 'completed':
        return 'is-success';
      case 'pending':
        return 'is-warning';
      case 'failed':
        return 'is-danger';
      case 'cancelled':
        return 'is-muted';
      default:
        return 'is-muted';
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/donations/campaigns?status=all');
      const list = Array.isArray(res.data?.campaigns) ? res.data.campaigns : (Array.isArray(res.data) ? res.data : []);
      setCampaigns(list);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const openDonations = async (campaign) => {
    setSelectedCampaign(campaign);
    setShowDonationsModal(true);
    setDonations([]);
    setDonationsError('');
    setDonationsLoading(true);
    try {
      const res = await api.get(`/api/donations/campaigns/${campaign._id}/donations`);
      const list = Array.isArray(res.data) ? res.data : [];
      setDonations(list);
    } catch (e) {
      setDonationsError("Impossible de charger les dons de cette campagne.");
    } finally {
      setDonationsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
  }, []);

  useEffect(() => {
    if (!showAddModal && !showDonationsModal && !showEditModal && !confirmDelete) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setShowDonationsModal(false);
        setShowEditModal(false);
        setConfirmDelete(null);
        closeMenu();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showAddModal, showDonationsModal, showEditModal, confirmDelete]);

  useEffect(() => {
    if (!openMenuCampaignId) return;

    const onPointerDown = (e) => {
      const menuEl = menuRef.current;
      const btnEl = menuButtonRef.current;
      if (menuEl && menuEl.contains(e.target)) return;
      if (btnEl && btnEl.contains(e.target)) return;
      closeMenu();
    };

    const onReposition = () => closeMenu();

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
  }, [openMenuCampaignId]);

  const projectsById = useMemo(() => {
    const map = new Map();
    for (const p of projectsList) map.set(String(p._id), p);
    return map;
  }, [projectsList]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError('');
      const res = await api.get('/api/donations/stats');
      setStats(res.data || null);
    } catch (e) {
      setStatsError("Impossible de charger les statistiques.");
    } finally {
      setStatsLoading(false);
    }
  };

  // Charger la liste des projets quand on ouvre la modale
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await api.get('/api/projects');
        const list = Array.isArray(res.data) ? res.data : [];
        setProjectsList(list);
      } catch (e) {}
    };
    if (showAddModal || showEditModal) loadProjects();
  }, [showAddModal, showEditModal]);

  const filtered = campaigns
    .filter(c => (statusFilter === 'all' || c.status === statusFilter))
    .filter(c => (categoryFilter === 'all' || c.category === categoryFilter))
    .filter(c => {
      const q = searchQuery.trim().toLowerCase();
      return q === '' || (c.title || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
    });

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      await api.post('/api/donations/campaigns', {
        title: newCampaign.title,
        description: newCampaign.description,
        goal: Number(newCampaign.goal || 0),
        startDate: new Date(newCampaign.startDate),
        endDate: new Date(newCampaign.endDate),
        category: newCampaign.category,
        project: newCampaign.category === 'project' && newCampaign.project ? newCampaign.project : undefined,
      });
      setShowAddModal(false);
      setNewCampaign({ title: '', description: '', goal: '', startDate: '', endDate: '', category: 'project', project: '' });
      fetchCampaigns();
      fetchStats();
    } catch (err) {
      emitToast("Création de campagne impossible.");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <AdminLayout title="Gestion des Dons">
      <div className="donations-page">
        <div className="donations-header">
          <div className="header-title">
            <h1>Campagnes de Dons</h1>
            <p className="header-subtitle">Gérez les campagnes et suivez les contributions</p>
          </div>
          <div className="header-actions">
            <button type="button" className="donations-btn donations-btn--primary" onClick={() => setShowAddModal(true)}>
              <span>Nouvelle campagne</span>
            </button>
          </div>
        </div>

          {/* Tableau de bord */}
        <div className="donations-dashboard">
            {statsLoading && (
              <div className="dashboard-card">Chargement des statistiques...</div>
            )}
            {statsError && (
              <div className="dashboard-card" style={{ background: '#fff3f3', borderColor: '#ffd5d5', color: '#7a1f1f' }}>{statsError}</div>
            )}
            {(!statsLoading && !statsError && stats) && (
              <div className="dashboard-grid">
                <div className="dashboard-card">
                  <div className="dashboard-label">Total collecté</div>
                  <div className="dashboard-value">{formatFcfa(stats.totalCollected || 0)}</div>
                </div>
                <div className="dashboard-card">
                  <div className="dashboard-label">Nombre de dons</div>
                  <div className="dashboard-value">{Number(stats.donationsCount || 0).toLocaleString('fr-FR')}</div>
                </div>
                <div className="dashboard-card">
                  <div className="dashboard-label">Top campagnes</div>
                  {Array.isArray(stats.topCampaigns) && stats.topCampaigns.length > 0 ? (
                    <div className="top-campaigns">
                      {stats.topCampaigns.slice(0, 3).map((t) => (
                        <div key={t._id || t.id} className="top-campaign">
                          <span className="top-campaign__title" title={t.title}>{t.title}</span>
                          <span className="top-campaign__value">{formatFcfa(t.collected || 0)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#64748b', fontWeight: 800, marginTop: 6 }}>—</div>
                  )}
                </div>
              </div>
            )}
          </div>

        <div className="donations-filters">
          <div className="filters-top">
            <input
              type="text"
              placeholder="Rechercher une campagne..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="button" className="filters-toggle" onClick={() => setFiltersOpen(v => !v)}>
              Filtres
            </button>
          </div>
          <div className={`filter-group ${filtersOpen ? 'is-open' : ''}`}>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
              <option value="all">Tous les statuts</option>
              <option value="active">Active</option>
              <option value="completed">Terminée</option>
              <option value="cancelled">Annulée</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="filter-select">
              <option value="all">Toutes les catégories</option>
              <option value="telethon">Téléthon</option>
              <option value="project">Projet</option>
              <option value="emergency">Urgence</option>
              <option value="community">Communauté</option>
              <option value="other">Autre</option>
            </select>
            <button
              type="button"
              className="filters-reset"
              onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); }}
            >
              Réinitialiser
            </button>
          </div>
        </div>

        <div className="donations-campaigns">
            {loading && <div className="donations-campaign-card">Chargement...</div>}
            {!loading && filtered.map(c => {
              const isActive = c.status === 'active';
              const isCompleted = c.status === 'completed';
              const isCancelled = c.status === 'cancelled';
              const pct = getProgressPct(c.collected, c.goal);
              const statusLabel = isActive ? 'Active' : (isCompleted ? 'Terminée' : 'Annulée');
              const statusClass = isActive ? 'is-active' : (isCompleted ? 'is-completed' : (isCancelled ? 'is-cancelled' : ''));
              return (
                <div key={c._id} className="donations-campaign-card">
                  <div className="campaign-head">
                    <div className="campaign-head-left">
                      <h3 className="campaign-title">{c.title || '—'}</h3>
                      <span className={`campaign-badge ${statusClass}`}>{statusLabel}</span>
                    </div>
                    <button type="button" className="campaign-menu-btn" aria-label="Actions" onClick={(e) => openMenu(c, e)}>
                      …
                    </button>
                  </div>

                  <div className="campaign-amounts">
                    <div className="campaign-amount-line">
                      <span className="campaign-amount-label">Collecté</span>
                      <span className="campaign-amount-value">{formatFcfa(c.collected || 0)}</span>
                    </div>
                    <div className="campaign-amount-line">
                      <span className="campaign-amount-label">Objectif</span>
                      <span className="campaign-amount-value">{formatFcfa(c.goal || 0)}</span>
                    </div>
                  </div>

                  <div className="campaign-progress" aria-label="Progression">
                    <div className="campaign-progress__bar" style={{ width: `${pct}%` }} />
                  </div>

                  <div className="campaign-meta">
                    <div className="campaign-meta-line">Catégorie: {getCategoryLabel(c.category)}</div>
                    {c.project && <div className="campaign-meta-line">Projet lié: {c.project?.title || c.project}</div>}
                    <div className="campaign-meta-line">Début: {c.startDate ? new Date(c.startDate).toLocaleDateString('fr-FR') : '—'}</div>
                    <div className="campaign-meta-line">Fin: {c.endDate ? new Date(c.endDate).toLocaleDateString('fr-FR') : '—'}</div>
                  </div>

                  <div className="campaign-actions">
                    <button type="button" className="donations-btn donations-btn--secondary" onClick={() => openDonations(c)}>Voir dons</button>
                  </div>
                </div>
              );
            })}
            {!loading && filtered.length === 0 && (
              <div className="donations-campaign-card">Aucune campagne</div>
            )}
          </div>

        {showAddModal && renderPortal(
          <div className="donations-modal-overlay" onMouseDown={() => setShowAddModal(false)}>
            <div className="donations-modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="donations-modal__header">
                <h3>Nouvelle campagne</h3>
                <button type="button" className="donations-icon-btn" aria-label="Fermer" onClick={() => setShowAddModal(false)}>
                  ×
                </button>
              </div>
              <div className="donations-modal__body">
                <form onSubmit={handleCreateCampaign}>
                  <div className="form-row">
                    <label>Titre</label>
                    <input type="text" value={newCampaign.title} onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <label>Description</label>
                    <textarea rows="4" value={newCampaign.description} onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <label>Objectif (FCFA)</label>
                    <input type="number" min="0" value={newCampaign.goal} onChange={(e) => setNewCampaign({ ...newCampaign, goal: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <label>Début</label>
                    <input type="date" value={newCampaign.startDate} onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <label>Fin</label>
                    <input type="date" value={newCampaign.endDate} onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <label>Catégorie</label>
                    <select value={newCampaign.category} onChange={(e) => setNewCampaign({ ...newCampaign, category: e.target.value })}>
                      <option value="telethon">Téléthon</option>
                      <option value="project">Projet</option>
                      <option value="emergency">Urgence</option>
                      <option value="community">Communauté</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  {newCampaign.category === 'project' && (
                    <div className="form-row">
                      <label>Projet lié</label>
                      <select value={newCampaign.project} onChange={(e) => setNewCampaign({ ...newCampaign, project: e.target.value })}>
                        <option value="">— Sélectionner un projet —</option>
                        {projectsList.map(p => (
                          <option key={p._id} value={p._id}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="donations-modal__footer">
                    <button type="button" className="donations-btn donations-btn--secondary" onClick={() => setShowAddModal(false)} disabled={createLoading}>Annuler</button>
                    <button type="submit" className="donations-btn donations-btn--primary" disabled={createLoading}>{createLoading ? 'Création…' : 'Créer'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showDonationsModal && renderPortal(
          <div className="donations-modal-overlay" onMouseDown={() => setShowDonationsModal(false)}>
            <div className="donations-modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="donations-modal__header">
                <h3>Dons — {selectedCampaign?.title || ''}</h3>
                <button type="button" className="donations-icon-btn" aria-label="Fermer" onClick={() => setShowDonationsModal(false)}>
                  ×
                </button>
              </div>
              <div className="donations-modal__body">
                {donationsLoading && <div>Chargement...</div>}
                {donationsError && <div style={{ color: 'crimson', fontWeight: 800 }}>{donationsError}</div>}
                {!donationsLoading && !donationsError && (
                  <>
                    {donations.length === 0 ? (
                      <div className="donations-empty">
                        <div className="donations-empty__title">Aucun don pour cette campagne</div>
                        <div className="donations-empty__subtitle">Les dons complétés apparaîtront ici dès réception.</div>
                      </div>
                    ) : (
                      <>
                        <div className="donations-summary">
                          <div className="donations-summary__item">
                            <span>Total</span>
                            <strong>{formatFcfa(donationsTotal)}</strong>
                          </div>
                          <div className="donations-summary__item">
                            <span>Dons</span>
                            <strong>{Number(donations.length || 0).toLocaleString('fr-FR')}</strong>
                          </div>
                        </div>
                        <table className="donations-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Donateur</th>
                              <th className="amount">Montant (FCFA)</th>
                              <th>Méthode</th>
                              <th>Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {donations.map((d) => (
                              <tr key={d._id}>
                                <td>{d.createdAt ? new Date(d.createdAt).toLocaleString('fr-FR') : ''}</td>
                                <td>{d.anonymous ? 'Anonyme' : (d.donor?.name || '—')}</td>
                                <td className="amount">{formatFcfa(d.amount || 0)}</td>
                                <td><span className="pill">{(d.paymentMethod || '—').toString().toUpperCase()}</span></td>
                                <td><span className={`pill ${getDonationStatusTone(d.status)}`}>{getDonationStatusLabel(d.status)}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="donations-list">
                          {donations.map((d) => (
                            <div key={d._id} className="donation-row">
                              <div className="donation-row__top">
                                <div>
                                  <div className="donation-row__who">{d.anonymous ? 'Anonyme' : (d.donor?.name || '—')}</div>
                                  <div className="donation-row__date">{d.createdAt ? new Date(d.createdAt).toLocaleString('fr-FR') : ''}</div>
                                </div>
                                <div className="donation-row__amount">{formatFcfa(d.amount || 0)}</div>
                              </div>
                              <div className="donation-row__meta">
                                <span className="pill">{(d.paymentMethod || '—').toString().toUpperCase()}</span>
                                <span className={`pill ${getDonationStatusTone(d.status)}`}>{getDonationStatusLabel(d.status)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
              <div className="donations-modal__footer">
                <button type="button" className="donations-btn donations-btn--secondary" onClick={() => setShowDonationsModal(false)}>Fermer</button>
              </div>
            </div>
          </div>
        )}

        {openMenuCampaignId && menuPos && (
          <div
            ref={menuRef}
            className="campaign-menu"
            style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 1200 }}
            role="menu"
          >
            {(() => {
              const campaign = campaigns.find((x) => x._id === openMenuCampaignId);
              if (!campaign) return null;
              const status = campaign.status;
              return (
                <>
                  <button type="button" className="campaign-menu-item" role="menuitem" onClick={() => startEditCampaign(campaign)}>
                    Modifier
                  </button>
                  <div className="campaign-menu-sep" />
                  <button
                    type="button"
                    className="campaign-menu-item"
                    role="menuitem"
                    onClick={() => updateCampaignStatus(campaign, 'active')}
                    disabled={status === 'active'}
                  >
                    Marquer active
                  </button>
                  <button
                    type="button"
                    className="campaign-menu-item"
                    role="menuitem"
                    onClick={() => updateCampaignStatus(campaign, 'completed')}
                    disabled={status === 'completed'}
                  >
                    Marquer terminée
                  </button>
                  <button
                    type="button"
                    className="campaign-menu-item"
                    role="menuitem"
                    onClick={() => updateCampaignStatus(campaign, 'cancelled')}
                    disabled={status === 'cancelled'}
                  >
                    Annuler
                  </button>
                  <div className="campaign-menu-sep" />
                  <button type="button" className="campaign-menu-item is-danger" role="menuitem" onClick={() => askDeleteCampaign(campaign)}>
                    Supprimer
                  </button>
                </>
              );
            })()}
          </div>
        )}

        {showEditModal && renderPortal(
          <div className="donations-modal-overlay" onMouseDown={() => setShowEditModal(false)}>
            <div className="donations-modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="donations-modal__header">
                <h3>Modifier la campagne</h3>
                <button type="button" className="donations-icon-btn" aria-label="Fermer" onClick={() => setShowEditModal(false)}>
                  ×
                </button>
              </div>
              <div className="donations-modal__body">
                <form onSubmit={handleUpdateCampaign}>
                  <div className="form-row">
                    <label>Titre</label>
                    <input type="text" value={editCampaign.title} onChange={(e) => setEditCampaign({ ...editCampaign, title: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <label>Description</label>
                    <textarea rows="4" value={editCampaign.description} onChange={(e) => setEditCampaign({ ...editCampaign, description: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <label>Objectif (FCFA)</label>
                    <input type="number" min="0" value={editCampaign.goal} onChange={(e) => setEditCampaign({ ...editCampaign, goal: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <label>Début</label>
                    <input type="date" value={editCampaign.startDate} onChange={(e) => setEditCampaign({ ...editCampaign, startDate: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <label>Fin</label>
                    <input type="date" value={editCampaign.endDate} onChange={(e) => setEditCampaign({ ...editCampaign, endDate: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <label>Statut</label>
                    <select value={editCampaign.status} onChange={(e) => setEditCampaign({ ...editCampaign, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="completed">Terminée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Catégorie</label>
                    <select value={editCampaign.category} onChange={(e) => setEditCampaign({ ...editCampaign, category: e.target.value })}>
                      <option value="telethon">Téléthon</option>
                      <option value="project">Projet</option>
                      <option value="emergency">Urgence</option>
                      <option value="community">Communauté</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  {editCampaign.category === 'project' && (
                    <div className="form-row">
                      <label>Projet lié</label>
                      <select value={editCampaign.project} onChange={(e) => setEditCampaign({ ...editCampaign, project: e.target.value })}>
                        <option value="">— Sélectionner un projet —</option>
                        {projectsList.map(p => (
                          <option key={p._id} value={p._id}>{p.title}</option>
                        ))}
                      </select>
                      {editCampaign.project && !projectsById.has(String(editCampaign.project)) && (
                        <div style={{ color: '#64748b', fontWeight: 800, marginTop: 6 }}>Projet indisponible</div>
                      )}
                    </div>
                  )}
                  <div className="donations-modal__footer">
                    <button type="button" className="donations-btn donations-btn--secondary" onClick={() => setShowEditModal(false)} disabled={editLoading}>Annuler</button>
                    <button type="submit" className="donations-btn donations-btn--primary" disabled={editLoading}>{editLoading ? 'Enregistrement…' : 'Enregistrer'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {confirmDelete && renderPortal(
          <div className="donations-modal-overlay" onMouseDown={() => setConfirmDelete(null)}>
            <div className="donations-modal donations-modal--sm" onMouseDown={(e) => e.stopPropagation()}>
              <div className="donations-modal__header">
                <h3>Supprimer la campagne</h3>
                <button type="button" className="donations-icon-btn" aria-label="Fermer" onClick={() => setConfirmDelete(null)}>
                  ×
                </button>
              </div>
              <div className="donations-modal__body">
                <div style={{ color: '#0f172a', fontWeight: 900 }}>Cette action est irréversible.</div>
                <div style={{ marginTop: 8, color: '#334155', fontWeight: 800 }}>
                  Campagne: <span style={{ fontWeight: 1000 }}>{confirmDelete.title || '—'}</span>
                </div>
              </div>
              <div className="donations-modal__footer">
                <button type="button" className="donations-btn donations-btn--secondary" onClick={() => setConfirmDelete(null)} disabled={deleteLoading}>Annuler</button>
                <button type="button" className="donations-btn donations-btn--primary" onClick={confirmDeleteCampaign} disabled={deleteLoading}>{deleteLoading ? 'Suppression…' : 'Supprimer'}</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminDonations;
