import React, { useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import './Dashboard.css';

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState('utilisateurs');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Données simulées pour le tableau de bord
  const stats = {
    utilisateurs: {
      total: 254,
      nouveaux: '12 nouveaux cette semaine'
    },
    actualites: {
      total: 48,
      enAttente: '3 en attente de validation'
    },
    forum: {
      total: 1275,
      nouveaux: '85 cette semaine'
    },
    dons: {
      total: '9,450€',
      evolution: '+12% ce mois-ci'
    }
  };

  // Données simulées pour la liste des utilisateurs
  const users = [
    { 
      nom: 'Marie Dupont',
      email: 'marie.dupont@example.com',
      dateInscription: '15/11/2023',
      statut: 'Actif',
      role: 'Membre'
    },
    {
      nom: 'Thomas Martin',
      email: 'thomas.martin@example.com',
      dateInscription: '10/11/2023',
      statut: 'Actif',
      role: 'Modérateur'
    },
    {
      nom: 'Sophie Leroy',
      email: 'sophie.leroy@example.com',
      dateInscription: '05/11/2023',
      statut: 'En attente',
      role: 'Membre'
    },
    {
      nom: 'Paul Durand',
      email: 'paul.durand@example.com',
      dateInscription: '01/11/2023',
      statut: 'Inactif',
      role: 'Membre'
    }
  ];

  // Données simulées pour les rapports
  const reports = [
    {
      type: 'Tentative de connexion',
      description: '5 échecs de connexion consécutifs pour l\'utilisateur marie.dupont@example.com',
      date: '17/11/2023 14:25',
      statut: 'À examiner'
    },
    {
      type: 'Contenu signalé',
      description: 'Message inapproprié dans le forum "Nuisances sonores"',
      date: '16/11/2023 18:42',
      statut: 'En modération'
    }
  ];

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
            <span className="notification-badge">2</span>
            <span className="admin-name">Mohammed Diallo</span>
            <span className="admin-role">Administrateur</span>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon users-icon">👥</div>
            <h3>Utilisateurs</h3>
            <div className="stat-number">{stats.utilisateurs.total}</div>
            <div className="stat-detail">{stats.utilisateurs.nouveaux}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon news-icon">📰</div>
            <h3>Actualités</h3>
            <div className="stat-number">{stats.actualites.total}</div>
            <div className="stat-detail">{stats.actualites.enAttente}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon forum-icon">💬</div>
            <h3>Messages Forum</h3>
            <div className="stat-number">{stats.forum.total}</div>
            <div className="stat-detail">{stats.forum.nouveaux}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon donations-icon">💝</div>
            <h3>Dons Reçus</h3>
            <div className="stat-number">{stats.dons.total}</div>
            <div className="stat-detail">{stats.dons.evolution}</div>
          </div>
        </div>

        <div className="recent-activity">
          <h2>Activité Récente</h2>
          <div className="activity-tabs">
            <button 
              className={selectedTab === 'utilisateurs' ? 'active' : ''} 
              onClick={() => setSelectedTab('utilisateurs')}
            >
              Utilisateurs
            </button>
            <button 
              className={selectedTab === 'contenus' ? 'active' : ''} 
              onClick={() => setSelectedTab('contenus')}
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

          <div className="users-table">
            <div className="table-header">
              <input 
                type="text" 
                placeholder="Rechercher un utilisateur" 
                className="search-input"
              />
              <select className="status-filter">
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
                {users.map((user, index) => (
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
                      <button className="action-btn edit">✏️</button>
                      <button className="action-btn delete">🗑️</button>
                    </td>
                  </tr>
                ))}
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
        </div>

        <div className="reports-section">
          <h2>Derniers Rapports</h2>
          <div className="reports-tabs">
            <button className="active">Sécurité</button>
            <button>Activité</button>
            <button>Système</button>
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
              {reports.map((report, index) => (
                <tr key={index}>
                  <td>{report.type}</td>
                  <td>{report.description}</td>
                  <td>{report.date}</td>
                  <td>
                    <span className={`status-badge ${report.statut.toLowerCase().replace(' ', '-')}`}>
                      {report.statut}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn view">👁️</button>
                    <button className="action-btn resolve">✓</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
