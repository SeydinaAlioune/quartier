import React, { useEffect, useState } from 'react';
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
    if (!showAddModal && !showDonationsModal) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setShowDonationsModal(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showAddModal, showDonationsModal]);

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
    if (showAddModal) loadProjects();
  }, [showAddModal]);

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
    } catch (err) {
      emitToast("Création de campagne impossible.");
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
            <input
              type="text"
              placeholder="Rechercher une campagne..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <div className="filter-group">
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
                    <h3 className="campaign-title">{c.title || '—'}</h3>
                    <span className={`campaign-badge ${statusClass}`}>{statusLabel}</span>
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
        </div>

        {showAddModal && (
          <div className="donations-modal-overlay" onMouseDown={() => setShowAddModal(false)}>
            <div className="donations-modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="donations-modal__header">
                <h3>Nouvelle campagne</h3>
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
                    <select value={newCampaign.project} onChange={(e)=> setNewCampaign({ ...newCampaign, project: e.target.value })}>
                      <option value="">— Sélectionner un projet —</option>
                      {projectsList.map(p => (
                        <option key={p._id} value={p._id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="donations-modal__footer">
                  <button type="button" className="donations-btn donations-btn--secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
                  <button type="submit" className="donations-btn donations-btn--primary">Créer</button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}
        {showDonationsModal && (
          <div className="donations-modal-overlay" onMouseDown={() => setShowDonationsModal(false)}>
            <div className="donations-modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="donations-modal__header">
                <h3>Dons — {selectedCampaign?.title || ''}</h3>
              </div>
              <div className="donations-modal__body">
                {donationsLoading && <div>Chargement...</div>}
                {donationsError && <div style={{ color: 'crimson', fontWeight: 800 }}>{donationsError}</div>}
                {!donationsLoading && !donationsError && (
                  <>
                    {donations.length === 0 ? (
                      <div>Aucun don pour cette campagne.</div>
                    ) : (
                      <>
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
    </AdminLayout>
  );
};

export default AdminDonations;
