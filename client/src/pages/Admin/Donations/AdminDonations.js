import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import AdminHeader from '../../../components/AdminHeader/AdminHeader';
import api from '../../../services/api';

const AdminDonations = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/donations/campaigns?status=all');
      const list = Array.isArray(res.data?.campaigns) ? res.data.campaigns : (Array.isArray(res.data) ? res.data : []);
      setCampaigns(list);
    } catch (e) {
      setError("Impossible de charger les campagnes.");
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

  useEffect(() => { fetchCampaigns(); }, []);

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

  useEffect(() => { fetchStats(); }, []);

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
      alert("Création de campagne impossible. Vérifiez vos droits admin.");
    }
  };

  return (
    <div className="admin-page">
      <AdminSidebar isCollapsed={isCollapsed} />
      <div className="admin-content">
        <AdminHeader 
          title="Gestion des Dons" 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
        />

        <div className="donations-page">
          <div className="donations-header">
            <div className="header-title">
              <h1>Campagnes de Dons</h1>
              <p className="header-subtitle">Gérez les campagnes et suivez les contributions</p>
            </div>
            <div className="header-actions">
              <button className="add-campaign-btn" onClick={() => setShowAddModal(true)}>
                <span>+</span>
                <span>Nouvelle campagne</span>
              </button>
            </div>
          </div>

          {/* Tableau de bord */}
          <div style={{marginTop:'8px'}}>
            {statsLoading && <div style={{background:'#fff', borderRadius:8, padding:'12px 14px', boxShadow:'0 1px 3px rgba(0,0,0,.08)'}}>Chargement des statistiques...</div>}
            {statsError && <div style={{background:'#fff3f3', border:'1px solid #ffd5d5', color:'#7a1f1f', borderRadius:8, padding:'10px 12px'}}>{statsError}</div>}
            {(!statsLoading && !statsError && stats) && (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'12px', margin:'8px 0 18px'}}>
                <div style={{background:'#fff', borderRadius:8, padding:'12px 14px', boxShadow:'0 1px 3px rgba(0,0,0,.08)'}}>
                  <div style={{fontSize:'.9rem', color:'#6b7280'}}>Total collecté</div>
                  <div style={{fontSize:'1.4rem', fontWeight:700}}>{Number(stats.totalCollected||0).toLocaleString('fr-FR')} €</div>
                </div>
                <div style={{background:'#fff', borderRadius:8, padding:'12px 14px', boxShadow:'0 1px 3px rgba(0,0,0,.08)'}}>
                  <div style={{fontSize:'.9rem', color:'#6b7280'}}>Nombre de dons</div>
                  <div style={{fontSize:'1.4rem', fontWeight:700}}>{Number(stats.donationsCount||0).toLocaleString('fr-FR')}</div>
                </div>
                <div style={{background:'#fff', borderRadius:8, padding:'12px 14px', boxShadow:'0 1px 3px rgba(0,0,0,.08)'}}>
                  <div style={{fontSize:'.9rem', color:'#6b7280', marginBottom:6}}>Top campagnes</div>
                  {Array.isArray(stats.topCampaigns) && stats.topCampaigns.length>0 ? (
                    <div style={{display:'grid', gap:6}}>
                      {stats.topCampaigns.slice(0,3).map((t)=> (
                        <div key={t._id||t.id} style={{display:'flex', justifyContent:'space-between', gap:8}}>
                          <span style={{color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} title={t.title}>{t.title}</span>
                          <span style={{color:'#111827', fontWeight:600}}>{Number(t.collected||0).toLocaleString('fr-FR')} €</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{color:'#6b7280'}}>—</div>
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

          <div className="campaigns-list">
            {loading && <div className="campaign-card">Chargement...</div>}
            {!loading && filtered.map(c => (
              <div key={c._id} className="campaign-card">
                <div className="campaign-header">
                  <h3>{c.title}</h3>
                  <span className={`status-badge ${c.status}`}>{c.status === 'active' ? 'Active' : (c.status === 'completed' ? 'Terminée' : 'Annulée')}</span>
                </div>
                <div className="campaign-info">
                  <div className="info-group">
                    <span className="label">Catégorie:</span>
                    <span className="value">{c.category}</span>
                  </div>
                  {c.project && (
                    <div className="info-group">
                      <span className="label">Projet lié:</span>
                      <span className="value">{c.project?.title || c.project}</span>
                    </div>
                  )}
                  <div className="info-group">
                    <span className="label">Objectif:</span>
                    <span className="value">{c.goal} €</span>
                  </div>
                  <div className="info-group">
                    <span className="label">Collecté:</span>
                    <span className="value">{c.collected} €</span>
                  </div>
                </div>
                <div className="campaign-dates">
                  <div className="date-group">
                    <span className="label">Début:</span>
                    <span className="value">{c.startDate ? new Date(c.startDate).toLocaleDateString('fr-FR') : '—'}</span>
                  </div>
                  <div className="date-group">
                    <span className="label">Fin:</span>
                    <span className="value">{c.endDate ? new Date(c.endDate).toLocaleDateString('fr-FR') : '—'}</span>
                  </div>
                </div>
                <div style={{display:'flex', gap:'8px', marginTop:'8px'}}>
                  <button className="btn-secondary" onClick={() => openDonations(c)}>Voir dons</button>
                </div>
              </div>
            ))}
            {!loading && filtered.length === 0 && (
              <div className="campaign-card">Aucune campagne</div>
            )}
          </div>
        </div>

        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Nouvelle campagne</h3>
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
                  <label>Objectif (€)</label>
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
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
                  <button type="submit" className="btn-primary">Créer</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showDonationsModal && (
          <div className="modal-overlay">
            <div className="modal" style={{width:'min(820px,95vw)'}}>
              <h3>Dons — {selectedCampaign?.title || ''}</h3>
              {donationsLoading && <div>Chargement...</div>}
              {donationsError && <div style={{color:'crimson'}}>{donationsError}</div>}
              {!donationsLoading && !donationsError && (
                <div style={{maxHeight:'60vh', overflow:'auto'}}>
                  {donations.length === 0 ? (
                    <div>Aucun don pour cette campagne.</div>
                  ) : (
                    <table style={{width:'100%', borderCollapse:'collapse'}}>
                      <thead>
                        <tr>
                          <th style={{textAlign:'left', padding:'8px'}}>Date</th>
                          <th style={{textAlign:'left', padding:'8px'}}>Donateur</th>
                          <th style={{textAlign:'right', padding:'8px'}}>Montant (€)</th>
                          <th style={{textAlign:'left', padding:'8px'}}>Méthode</th>
                          <th style={{textAlign:'left', padding:'8px'}}>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donations.map((d)=> (
                          <tr key={d._id} style={{borderTop:'1px solid #eee'}}>
                            <td style={{padding:'8px'}}>{d.createdAt ? new Date(d.createdAt).toLocaleString('fr-FR') : ''}</td>
                            <td style={{padding:'8px'}}>{d.anonymous ? 'Anonyme' : (d.donor?.name || '—')}</td>
                            <td style={{padding:'8px', textAlign:'right'}}>{Number(d.amount||0).toLocaleString('fr-FR')}</td>
                            <td style={{padding:'8px'}}>{d.paymentMethod}</td>
                            <td style={{padding:'8px'}}>{d.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={()=>setShowDonationsModal(false)}>Fermer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDonations;
