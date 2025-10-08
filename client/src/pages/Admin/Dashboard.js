import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import './Dashboard.css';
import AdminDirectory from './Directory/AdminDirectory';
import AdminNews from './News/AdminNews';
import AdminForum from './Forum/AdminForum';
import Users from './Users/Users';
import AdminSecurity from './Security/AdminSecurity';
import AdminProjects from './Projects/AdminProjects';
import AdminDonations from './Donations/AdminDonations';
import api from '../../services/api';

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState('users');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [reportsTab, setReportsTab] = useState('securite');
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [usersData, setUsersData] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [dashStats, setDashStats] = useState({
    utilisateurs: { total: 0, nouveaux: '—' },
    actualites: { total: 0, enAttente: '—' },
    forum: { total: '—', nouveaux: '—' },
    dons: { total: '—', evolution: '—' }
  });
  const [securityReports, setSecurityReports] = useState([]);
  const [dashLoading, setDashLoading] = useState(false);

  // Charger profil connecté + statistiques en en-tête
  useEffect(() => {
    const hydrateUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // Pas de token => ne pas afficher d'utilisateur et nettoyer l'ancien cache
        localStorage.removeItem('user');
        setCurrentUser(null);
        return;
      }
      try {
        const res = await api.get('/api/auth/profile');
        if (res?.data) {
          setCurrentUser(res.data);
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
          setCurrentUser(null);
        }
      } catch (e) {
        // échec d'appel API => nettoyer pour éviter les faux noms
        localStorage.removeItem('user');
        setCurrentUser(null);
      }
    };
    const hydrateStats = async () => {
      try {
        setDashLoading(true);
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
          dons: { total: donationsSum ? donationsSum.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '—', evolution: '—' }
        });
      } catch (e) {
        // En cas d'erreur, conserver les valeurs par défaut
      } finally {
        setDashLoading(false);
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

  return (
    <div className="admin-dashboard">
      <AdminSidebar isCollapsed={isCollapsed} />
      <div className="admin-content">
        <div className="dashboard-header">
          <div className="header-left">
            <button className="toggle-sidebar-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
              {isCollapsed ? '☰' : '✕'}
            </button>
            <h1>Tableau de Bord Administration</h1>
          </div>
          <div className="admin-profile">
            <span className="notification-badge">{securityReports.length || 0}</span>
            <span className="admin-name">{currentUser?.name || '—'}</span>
            <span className="admin-role">{currentUser?.role === 'admin' ? 'Administrateur' : (currentUser?.role ? 'Membre' : '—')}</span>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon users-icon">👥</div>
            <h3>Utilisateurs</h3>
            <div className="stat-number">{dashStats.utilisateurs.total}</div>
            <div className="stat-detail">{dashStats.utilisateurs.nouveaux}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon news-icon">📰</div>
            <h3>Actualités</h3>
            <div className="stat-number">{dashStats.actualites.total}</div>
            <div className="stat-detail">{dashStats.actualites.enAttente}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon forum-icon">💬</div>
            <h3>Messages Forum</h3>
            <div className="stat-number">{dashStats.forum.total}</div>
            <div className="stat-detail">{dashStats.forum.nouveaux}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon donations-icon">💝</div>
            <h3>Dons Reçus</h3>
            <div className="stat-number">{dashStats.dons.total}</div>
            <div className="stat-detail">{dashStats.dons.evolution}</div>
          </div>
        </div>

        <div className="recent-activity">
          <h2>Activité Récente</h2>
          <div className="activity-tabs">
            <button
              className={selectedTab === 'users' ? 'active' : ''}
              onClick={() => setSelectedTab('users')}
            >
              Utilisateurs
            </button>
            <button
              className={selectedTab === 'actualites' ? 'active' : ''}
              onClick={() => setSelectedTab('actualites')}
            >
              Contenus
            </button>
            <button
              className={selectedTab === 'projets' ? 'active' : ''}
              onClick={() => setSelectedTab('projets')}
            >
              Projets
            </button>
            <button
              className={selectedTab === 'dons' ? 'active' : ''}
              onClick={() => setSelectedTab('dons')}
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
              </div>

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
                      <td colSpan="6" style={{ textAlign: 'center' }}>Chargement...</td>
                    </tr>
                  )}
                  {!usersLoading && usersData
                    .filter(u => userStatusFilter === 'all' || u.statut.toLowerCase() === (userStatusFilter === 'pending' ? 'en attente' : userStatusFilter))
                    .filter(u => {
                      const q = userSearch.trim().toLowerCase();
                      return q === '' || u.nom.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
                    })
                    .slice(0, 5)
                    .map((user, index) => (
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
                          <button className="action-btn edit" disabled>✏️</button>
                          <button className="action-btn delete" disabled>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  {!usersLoading && !usersError && usersData.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center' }}>Aucun utilisateur</td>
                    </tr>
                  )}
                  {!usersLoading && usersError && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center' }}>{usersError}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="pagination">
                <button className="active">1</button>
                <button>2</button>
                <button>3</button>
                <span>...</span>
                <button>10</button>
              </div>
            </div>
          )}

          {selectedTab === 'actualites' && <AdminNews />}
          {selectedTab === 'annuaire' && <AdminDirectory />}
          {selectedTab === 'securite' && <AdminSecurity />}
          {selectedTab === 'projets' && <AdminProjects />}
          {selectedTab === 'dons' && <AdminDonations />}
        </div>

        <div className="reports-section">
          <h2>Derniers Rapports</h2>
          <div className="reports-tabs">
            <button className={reportsTab === 'securite' ? 'active' : ''} onClick={() => setReportsTab('securite')}>Sécurité</button>
            <button className={reportsTab === 'activite' ? 'active' : ''} onClick={() => setReportsTab('activite')}>Activité</button>
            <button className={reportsTab === 'systeme' ? 'active' : ''} onClick={() => setReportsTab('systeme')}>Système</button>
          </div>

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
                  <td colSpan="5" style={{ textAlign: 'center', padding: '12px 0' }}>
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
                        <button className="action-btn view">👁️</button>
                        <button className="action-btn resolve">✓</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
