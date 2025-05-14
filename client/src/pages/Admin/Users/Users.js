import React, { useState } from 'react';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import AdminHeader from '../../../components/AdminHeader/AdminHeader';
import './Users.css';

const Users = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Données simulées des utilisateurs
  const users = [
    {
      nom: 'Marie Dupont',
      email: 'marie.dupont@example.com',
      telephone: '06 XX XX XX XX',
      dateInscription: '15/11/2023',
      statut: 'Actif',
      role: 'Membre'
    },
    {
      nom: 'Thomas Martin',
      email: 'thomas.martin@example.com',
      telephone: '06 XX XX XX XX',
      dateInscription: '10/11/2023',
      statut: 'Actif',
      role: 'Modérateur'
    },
    {
      nom: 'Sophie Leroy',
      email: 'sophie.leroy@example.com',
      telephone: '06 XX XX XX XX',
      dateInscription: '05/11/2023',
      statut: 'En attente',
      role: 'Membre'
    },
    {
      nom: 'Mohammed Diallo',
      email: 'mohammed.diallo@example.com',
      telephone: '06 XX XX XX XX',
      dateInscription: '15/10/2023',
      statut: 'Actif',
      role: 'Administrateur'
    }
  ];

  // Statistiques des utilisateurs
  const stats = {
    roles: {
      Membres: 215,
      Modérateurs: 28,
      Admins: 11
    },
    activite: {
      nouveauxUtilisateurs: 37,
      connexionsAujourdhui: 124,
      comptesDesactives: 5,
      tauxRetention: '87%'
    },
    dernieresInscriptions: [
      { nom: 'Marie Dupont', date: '15/11/2023' },
      { nom: 'Thomas Martin', date: '10/11/2023' },
      { nom: 'Sophie Leroy', date: '05/11/2023' },
      { nom: 'Paul Durand', date: '01/11/2023' }
    ]
  };

  return (
    <div className="admin-page">
      <AdminSidebar isCollapsed={isCollapsed} />
      <div className="admin-content">
        <AdminHeader 
          title="Gestion des Utilisateurs" 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
        />
        <div className="users-page">
          <div className="users-header">
            <h1>Gestion des Utilisateurs</h1>
            <button className="add-user-btn">
              <span>+</span> Ajouter un utilisateur
            </button>
          </div>

          <div className="users-section">
            <h2>Liste des Utilisateurs</h2>
            <div className="users-filters">
              <input
                type="text"
                placeholder="Rechercher par nom, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <div className="filter-group">
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tous les rôles</option>
                  <option value="member">Membre</option>
                  <option value="moderator">Modérateur</option>
                  <option value="admin">Administrateur</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="pending">En attente</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
            </div>

            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
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
                      <td>{user.telephone}</td>
                      <td>{user.dateInscription}</td>
                      <td>
                        <span className={`status-badge ${user.statut.toLowerCase()}`}>
                          {user.statut}
                        </span>
                      </td>
                      <td>{user.role}</td>
                      <td className="actions-cell">
                        <button className="action-btn edit" title="Modifier">✏️</button>
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
              <button>10</button>
            </div>
          </div>

          <div className="stats-section">
            <h2>Statistiques d'Utilisateurs</h2>
            <div className="stats-grid">
              <div className="stats-card roles-chart">
                <h3>Répartition par rôle</h3>
                <div className="chart-container">
                  <div className="bar-chart">
                    <div className="bar membres" style={{ height: '100%' }}>
                      <span className="bar-value">215</span>
                      <span className="bar-label">Membres</span>
                    </div>
                    <div className="bar moderateurs" style={{ height: '40%' }}>
                      <span className="bar-value">28</span>
                      <span className="bar-label">Modérateurs</span>
                    </div>
                    <div className="bar admins" style={{ height: '20%' }}>
                      <span className="bar-value">11</span>
                      <span className="bar-label">Admins</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="stats-card activity">
                <h3>Activité récente</h3>
                <div className="activity-stats">
                  <div className="stat-item">
                    <span className="stat-label">Nouveaux utilisateurs (ce mois)</span>
                    <span className="stat-value">{stats.activite.nouveauxUtilisateurs}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Connexions (aujourd'hui)</span>
                    <span className="stat-value">{stats.activite.connexionsAujourdhui}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Comptes désactivés (ce mois)</span>
                    <span className="stat-value">{stats.activite.comptesDesactives}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Taux de rétention</span>
                    <span className="stat-value">{stats.activite.tauxRetention}</span>
                  </div>
                </div>
              </div>

              <div className="stats-card recent-signups">
                <h3>Dernières inscriptions</h3>
                <ul className="signup-list">
                  {stats.dernieresInscriptions.map((inscription, index) => (
                    <li key={index}>
                      <span className="user-name">{inscription.nom}</span>
                      <span className="signup-date">{inscription.date}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
