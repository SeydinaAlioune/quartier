import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { Link } from 'react-router-dom';
import {
  Users,
  Newspaper,
  MessagesSquare,
  HeartHandshake,
  Pencil,
  Trash2,
  Eye,
  Check
} from 'lucide-react';

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState('users');
  const [reportsTab, setReportsTab] = useState('securite');
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [usersData, setUsersData] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [dashStats, setDashStats] = useState({
    utilisateurs: { total: 0, nouveaux: '—' },
    actualites: { total: 0, enAttente: '—' },
    forum: { total: '—', nouveaux: '—' },
    dons: { total: '—', evolution: '—' },
    projets: { total: '—' }
  });
  const [securityReports, setSecurityReports] = useState([]);

  // Charger profil connecté + statistiques en en-tête
  useEffect(() => {
    const hydrateUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // Pas de token => ne pas afficher d'utilisateur et nettoyer l'ancien cache
        localStorage.removeItem('user');
        return;
      }
      try {
        const res = await api.get('/api/auth/profile');
        if (res?.data) {
          // rafraîchir le cache local pour l'entête
          localStorage.setItem('user', JSON.stringify({
            id: res.data._id || res.data.id,
            name: res.data.name,
            email: res.data.email,
            role: res.data.role
          }));
        } else {
          // réponse inattendue => nettoyer
          localStorage.removeItem('user');
        }
      } catch (e) {
        // échec d'appel API => nettoyer pour éviter les faux noms
        localStorage.removeItem('user');
      }
    };
    const hydrateStats = async () => {
      try {
        const [statsRes, draftsRes, alertsRes, campaignsRes, forumStatsRes] = await Promise.all([
          api.get('/api/admin/stats'),
          api.get('/api/posts?status=draft&limit=1&page=1'),
          api.get('/api/security/alerts'),
          api.get('/api/donations/campaigns'),
          api.get('/api/forum/stats')
        ]);
        const adminStats = statsRes?.data || {};
        const draftsPayload = draftsRes?.data;
        const draftsTotal = typeof draftsPayload?.total === 'number' ? draftsPayload.total
          : (Array.isArray(draftsPayload?.posts) ? draftsPayload.posts.length
          : (Array.isArray(draftsPayload) ? draftsPayload.length : 0));
        const alerts = Array.isArray(alertsRes?.data) ? alertsRes.data : [];
        const campsRaw = campaignsRes?.data;
        const campaigns = Array.isArray(campsRaw?.campaigns) ? campsRaw.campaigns : (Array.isArray(campsRaw) ? campsRaw : []);
        const donationsSum = campaigns.reduce((sum, c) => sum + (Number(c.collected) || 0), 0);
        const forumStats = forumStatsRes?.data || {};

        setSecurityReports(alerts.slice(0, 5));
        setDashStats({
          utilisateurs: { total: Number(adminStats.users || 0), nouveaux: '—' },
          actualites: { total: Number(adminStats.posts || 0), enAttente: draftsTotal ? `${draftsTotal} en attente de validation` : '—' },
          forum: { total: typeof forumStats.posts === 'number' ? forumStats.posts : '—', nouveaux: typeof forumStats.postsLastWeek === 'number' ? `${forumStats.postsLastWeek} cette semaine` : '—' },
          dons: { total: donationsSum ? `${Math.round(donationsSum).toLocaleString('fr-FR')} FCFA` : '—', evolution: '—' },
          projets: { total: Number(adminStats.projects || 0) || '—' }
        });
      } catch (e) {
        // En cas d'erreur, conserver les valeurs par défaut
      } finally {
      }
    };
    hydrateUser();
    hydrateStats();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        setUsersError('');
        const res = await api.get('/api/admin/users');
        const arr = Array.isArray(res.data) ? res.data : [];
        const mapped = arr.map(u => ({
          nom: u.name || '-',
          email: u.email || '-',
          dateInscription: u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—',
          statut: u.status === 'inactive' ? 'Inactif' : (u.status === 'pending' ? 'En attente' : 'Actif'),
          role: u.role === 'admin' ? 'Administrateur' : 'Membre',
        }));
        setUsersData(mapped);
      } catch (e) {
        setUsersError("Impossible de charger les utilisateurs (droits requis). Aperçu indisponible.");
        setUsersData([]);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);
  const visibleReports = reportsTab === 'securite' ? securityReports : [];

  const filteredUsers = usersData
    .filter(u => userStatusFilter === 'all' || u.statut.toLowerCase() === (userStatusFilter === 'pending' ? 'en attente' : userStatusFilter))
    .filter(u => {
      const q = userSearch.trim().toLowerCase();
      return q === '' || u.nom.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  const topUsers = filteredUsers.slice(0, 5);

  return (
    <AdminLayout title="Tableau de Bord Administration" notificationsCount={securityReports.length || 0}>
      <div className="dashboard-page">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon users-icon" aria-hidden="true">
              <Users size={18} />
            </div>
            <h3>Utilisateurs</h3>
            <div className="stat-number">{dashStats.utilisateurs.total}</div>
            <div className="stat-detail">{dashStats.utilisateurs.nouveaux}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon news-icon" aria-hidden="true">
              <Newspaper size={18} />
            </div>
            <h3>Actualités</h3>
            <div className="stat-number">{dashStats.actualites.total}</div>
            <div className="stat-detail">{dashStats.actualites.enAttente}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon forum-icon" aria-hidden="true">
              <MessagesSquare size={18} />
            </div>
            <h3>Messages Forum</h3>
            <div className="stat-number">{dashStats.forum.total}</div>
            <div className="stat-detail">{dashStats.forum.nouveaux}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon donations-icon" aria-hidden="true">
              <HeartHandshake size={18} />
            </div>
            <h3>Dons Reçus</h3>
            <div className="stat-number">{dashStats.dons.total}</div>
            <div className="stat-detail">{dashStats.dons.evolution}</div>
          </div>
        </div>

        <div className="recent-activity">
          <div className="section-header">
            <h2>Activité Récente</h2>
          </div>
          <div className="activity-tabs" role="tablist" aria-label="Activité récente">
            <button
              type="button"
              className={selectedTab === 'users' ? 'active' : ''}
              onClick={() => setSelectedTab('users')}
              role="tab"
              aria-selected={selectedTab === 'users'}
            >
              Utilisateurs
            </button>
            <button
              type="button"
              className={selectedTab === 'actualites' ? 'active' : ''}
              onClick={() => setSelectedTab('actualites')}
              role="tab"
              aria-selected={selectedTab === 'actualites'}
            >
              Contenus
            </button>
            <button
              type="button"
              className={selectedTab === 'projets' ? 'active' : ''}
              onClick={() => setSelectedTab('projets')}
              role="tab"
              aria-selected={selectedTab === 'projets'}
            >
              Projets
            </button>
            <button
              type="button"
              className={selectedTab === 'dons' ? 'active' : ''}
              onClick={() => setSelectedTab('dons')}
              role="tab"
              aria-selected={selectedTab === 'dons'}
            >
              Dons
            </button>
          </div>

          {selectedTab === 'users' && (
            <div className="users-table">
              <div className="table-header">
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur"
                  className="search-input"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <select className="status-filter" value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)}>
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="pending">En attente</option>
                  <option value="inactive">Inactif</option>
                </select>
                <Link className="link-btn" to="/admin/users">Voir tout</Link>
              </div>

              <div className="table-scroll" role="region" aria-label="Aperçu utilisateurs">
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Date d'inscription</th>
                      <th>Statut</th>
                      <th>Rôle</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading && (
                      <tr>
                        <td colSpan="6" className="dashboard-page__table-empty">Chargement…</td>
                      </tr>
                    )}
                    {!usersLoading && topUsers.map((user, index) => (
                        <tr key={index}>
                          <td>{user.nom}</td>
                          <td>{user.email}</td>
                          <td>{user.dateInscription}</td>
                          <td>
                            <span className={`status-badge ${user.statut.toLowerCase()}`}>
                              {user.statut}
                            </span>
                          </td>
                          <td>{user.role}</td>
                          <td>
                            <button type="button" className="action-btn edit" aria-label="Modifier (indisponible)" title="Indisponible" disabled>
                              <Pencil size={16} aria-hidden="true" />
                            </button>
                            <button type="button" className="action-btn delete" aria-label="Supprimer (indisponible)" title="Indisponible" disabled>
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                    ))}
                    {!usersLoading && !usersError && usersData.length === 0 && (
                      <tr>
                        <td colSpan="6" className="dashboard-page__table-empty">Aucun utilisateur</td>
                      </tr>
                    )}
                    {!usersLoading && usersError && (
                      <tr>
                        <td colSpan="6" className="dashboard-page__table-empty">{usersError}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="users-cards" aria-label="Aperçu utilisateurs (mobile)">
                {usersLoading && <div className="mobile-card mobile-card--empty">Chargement…</div>}
                {!usersLoading && usersError && <div className="mobile-card mobile-card--empty">{usersError}</div>}
                {!usersLoading && !usersError && topUsers.length === 0 && <div className="mobile-card mobile-card--empty">Aucun utilisateur</div>}
                {!usersLoading && !usersError && topUsers.map((user, index) => (
                  <div key={index} className="mobile-card">
                    <div className="mobile-card__row">
                      <div className="mobile-card__label">Nom</div>
                      <div className="mobile-card__value">{user.nom}</div>
                    </div>
                    <div className="mobile-card__row">
                      <div className="mobile-card__label">Email</div>
                      <div className="mobile-card__value">{user.email}</div>
                    </div>
                    <div className="mobile-card__row">
                      <div className="mobile-card__label">Inscription</div>
                      <div className="mobile-card__value">{user.dateInscription}</div>
                    </div>
                    <div className="mobile-card__row">
                      <div className="mobile-card__label">Statut</div>
                      <div className="mobile-card__value">
                        <span className={`status-badge ${user.statut.toLowerCase()}`}>{user.statut}</span>
                      </div>
                    </div>
                    <div className="mobile-card__row">
                      <div className="mobile-card__label">Rôle</div>
                      <div className="mobile-card__value">{user.role}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {selectedTab === 'actualites' && (
            <div className="preview-panel">
              <div className="preview-meta">
                <div>
                  <div className="preview-title">Actualités</div>
                  <div className="preview-subtitle">Aperçu des contenus et validation</div>
                </div>
                <Link className="link-btn" to="/admin/news">Gérer</Link>
              </div>
              <div className="preview-grid">
                <div className="preview-card">
                  <div className="preview-label">Total</div>
                  <div className="preview-value">{dashStats.actualites.total}</div>
                </div>
                <div className="preview-card">
                  <div className="preview-label">Brouillons</div>
                  <div className="preview-value">{dashStats.actualites.enAttente}</div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'projets' && (
            <div className="preview-panel">
              <div className="preview-meta">
                <div>
                  <div className="preview-title">Projets</div>
                  <div className="preview-subtitle">Suivi des projets et mises à jour</div>
                </div>
                <Link className="link-btn" to="/admin/projects">Gérer</Link>
              </div>
              <div className="preview-grid">
                <div className="preview-card">
                  <div className="preview-label">Total</div>
                  <div className="preview-value">{dashStats.projets.total}</div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'dons' && (
            <div className="preview-panel">
              <div className="preview-meta">
                <div>
                  <div className="preview-title">Dons</div>
                  <div className="preview-subtitle">Campagnes et collecte</div>
                </div>
                <Link className="link-btn" to="/admin/donations">Gérer</Link>
              </div>
              <div className="preview-grid">
                <div className="preview-card">
                  <div className="preview-label">Total collecté</div>
                  <div className="preview-value">{dashStats.dons.total}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="reports-section">
          <div className="section-header">
            <h2>Derniers Rapports</h2>
          </div>
          <div className="reports-tabs" role="tablist" aria-label="Derniers rapports">
            <button type="button" className={reportsTab === 'securite' ? 'active' : ''} onClick={() => setReportsTab('securite')} role="tab" aria-selected={reportsTab === 'securite'}>Sécurité</button>
            <button type="button" className={reportsTab === 'activite' ? 'active' : ''} onClick={() => setReportsTab('activite')} role="tab" aria-selected={reportsTab === 'activite'}>Activité</button>
            <button type="button" className={reportsTab === 'systeme' ? 'active' : ''} onClick={() => setReportsTab('systeme')} role="tab" aria-selected={reportsTab === 'systeme'}>Système</button>
            <Link className="link-btn" to="/admin/security">Voir tout</Link>
          </div>

          <div className="table-scroll" role="region" aria-label="Aperçu rapports">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleReports.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="dashboard-page__table-empty">
                      Aucun rapport pour cet onglet.
                    </td>
                  </tr>
                ) : (
                  visibleReports.map((report, index) => {
                    const dateStr = report.date || report.createdAt;
                    const statut = report.severity === 'high' ? 'Urgent' : (report.severity === 'medium' ? 'À examiner' : 'Info');
                    return (
                      <tr key={index}>
                        <td>{report.type || 'Alerte'}</td>
                        <td>{report.message || report.description || '—'}</td>
                        <td>{dateStr ? new Date(dateStr).toLocaleString('fr-FR') : '—'}</td>
                        <td>
                          <span className={`status-badge ${statut.toLowerCase().replace(' ', '-')}`}>
                            {statut}
                          </span>
                        </td>
                        <td>
                          <button type="button" className="action-btn view" aria-label="Voir (indisponible)" title="Indisponible" disabled>
                            <Eye size={16} aria-hidden="true" />
                          </button>
                          <button type="button" className="action-btn resolve" aria-label="Résoudre (indisponible)" title="Indisponible" disabled>
                            <Check size={16} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="reports-cards" aria-label="Aperçu rapports (mobile)">
            {visibleReports.length === 0 && <div className="mobile-card mobile-card--empty">Aucun rapport pour cet onglet.</div>}
            {visibleReports.map((report, index) => {
              const dateStr = report.date || report.createdAt;
              const statut = report.severity === 'high' ? 'Urgent' : (report.severity === 'medium' ? 'À examiner' : 'Info');
              return (
                <div key={index} className="mobile-card">
                  <div className="mobile-card__row">
                    <div className="mobile-card__label">Type</div>
                    <div className="mobile-card__value">{report.type || 'Alerte'}</div>
                  </div>
                  <div className="mobile-card__row">
                    <div className="mobile-card__label">Description</div>
                    <div className="mobile-card__value">{report.message || report.description || '—'}</div>
                  </div>
                  <div className="mobile-card__row">
                    <div className="mobile-card__label">Date</div>
                    <div className="mobile-card__value">{dateStr ? new Date(dateStr).toLocaleString('fr-FR') : '—'}</div>
                  </div>
                  <div className="mobile-card__row">
                    <div className="mobile-card__label">Statut</div>
                    <div className="mobile-card__value">
                      <span className={`status-badge ${statut.toLowerCase().replace(' ', '-')}`}>{statut}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
