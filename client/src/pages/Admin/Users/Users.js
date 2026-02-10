import React, { useEffect, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout';
import './Users.css';
import api from '../../../services/api';
import { emitToast } from '../../../utils/toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const Users = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });

  const handleChangeRole = async (user, newRole) => {
    if (!user?.id) return;
    try {
      await api.put(`/api/admin/users/${user.id}/role`, { role: newRole });
      await reloadUsers();
    } catch (err) {
      emitToast("Impossible de modifier le rôle. Vérifiez vos droits.", 'error');
    }
  };

  const handleToggleStatus = async (user) => {
    if (!user?.id) return;
    const nextStatus = user.statusCode === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/api/admin/users/${user.id}/status`, { status: nextStatus });
      await reloadUsers();
    } catch (err) {
      emitToast("Impossible de modifier le statut. Vérifiez vos droits.", 'error');
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/api/admin/users');
        if (!mounted) return;
        const arr = Array.isArray(res.data) ? res.data : [];
        if (arr.length > 0) {
          const mapped = arr.map((u) => ({
            id: u._id || u.id,
            nom: u.name || '-',
            email: u.email || '-',
            telephone: u?.profile?.phone || '—',
            dateInscription: u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—',
            createdAtRaw: u.createdAt || null,
            statut: (u.status === 'active' ? 'Actif' : (u.status === 'inactive' ? 'Inactif' : '—')),
            statusCode: u.status || 'active',
            role: u.role === 'admin' ? 'Administrateur' : (u.role === 'moderator' ? 'Modérateur' : 'Membre'),
            roleCode: u.role || 'user',
          }));
          setUsersData(mapped);
        } else {
          setUsersData([]);
        }
      } catch (e) {
        // 401/403 probable si non-admin: on garde le fallback et on informe discrètement
        setError("Accès refusé ou indisponible. Connectez-vous avec un compte administrateur.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchUsers();
    return () => { mounted = false; };
  }, []);

  // Fonction utilitaire pour recharger la liste (après création)
  const reloadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/admin/users');
      const arr = Array.isArray(res.data) ? res.data : [];
      if (arr.length > 0) {
        const mapped = arr.map((u) => ({
          id: u._id || u.id,
          nom: u.name || '-',
          email: u.email || '-',
          telephone: u?.profile?.phone || '—',
          dateInscription: u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—',
          createdAtRaw: u.createdAt || null,
          statut: (u.status === 'active' ? 'Actif' : (u.status === 'inactive' ? 'Inactif' : '—')),
          statusCode: u.status || 'active',
          role: u.role === 'admin' ? 'Administrateur' : (u.role === 'moderator' ? 'Modérateur' : 'Membre'),
          roleCode: u.role || 'user',
        }));
        setUsersData(mapped);
      } else {
        setUsersData([]);
      }
    } catch (e) {
      setError("Accès refusé ou indisponible. Affichage des données de démonstration.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAdd = () => setShowAddModal(false);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      // 1) Créer l'utilisateur via /api/auth/register (rôle user par défaut côté serveur)
      const regRes = await api.post('/api/auth/register', {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
      });
      const created = regRes?.data?.user;
      if (!created?.id) {
        throw new Error('Création utilisateur échouée');
      }
      // 2) Si rôle demandé != user, promouvoir via /api/admin/users/:id/role
      if (newUser.role !== 'user') {
        await api.put(`/api/admin/users/${created.id}/role`, { role: newUser.role });
      }
      // 3) Rafraîchir la liste et fermer la modale
      await reloadUsers();
      setShowAddModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      emitToast("Utilisateur créé.", 'success');
    } catch (err) {
      emitToast("Impossible de créer l'utilisateur. Vérifiez vos droits admin et réessayez.", 'error');
    }
  };

  const filteredUsers = usersData
    .filter((u) => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') return u.statusCode === 'active';
      if (statusFilter === 'inactive') return u.statusCode === 'inactive';
      if (statusFilter === 'pending') return u.statusCode === 'pending';
      return true;
    })
    .filter((u) => {
      if (roleFilter === 'all') return true;
      if (roleFilter === 'admin') return u.roleCode === 'admin';
      if (roleFilter === 'moderator') return u.roleCode === 'moderator';
      if (roleFilter === 'member') return u.roleCode === 'user';
      return true;
    })
    .filter((u) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (u.nom || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    });

  // Statistiques dynamiques dérivées de usersData
  const computeStats = () => {
    const rolesCount = usersData.reduce((acc, u) => {
      const key = u.role || 'Membre';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    // Nouveaux ce mois (approximation si createdAtRaw présent)
    const now = new Date();
    const nouveauxCeMois = usersData.filter(u => {
      if (!u.createdAtRaw) return false;
      const d = new Date(u.createdAtRaw);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    // Dernières inscriptions (tri par createdAtRaw desc, fallback par dateInscription string)
    const sorted = [...usersData].sort((a, b) => {
      if (a.createdAtRaw && b.createdAtRaw) return new Date(b.createdAtRaw) - new Date(a.createdAtRaw);
      return 0;
    });
    const dernieres = sorted.slice(0, 4).map(u => ({ nom: u.nom, date: u.dateInscription }));
    return {
      roles: {
        Membres: rolesCount['Membre'] || 0,
        Modérateurs: rolesCount['Modérateur'] || 0,
        Admins: rolesCount['Administrateur'] || 0,
      },
      activite: {
        nouveauxUtilisateurs: nouveauxCeMois,
        connexionsAujourdhui: '—',
        comptesDesactives: usersData.filter(u => u.statut === 'Inactif').length,
        tauxRetention: '—',
      },
      dernieresInscriptions: dernieres,
    };
  };
  const stats = computeStats();

  return (
    <AdminLayout title="Gestion des Utilisateurs">
      <div className="users-page">
          <div className="users-header">
            <h1>Gestion des Utilisateurs</h1>
            <button className="add-user-btn" type="button" onClick={() => setShowAddModal(true)}>
              <Plus size={18} aria-hidden="true" />
              Ajouter un utilisateur
            </button>
          </div>

          {showAddModal && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Ajouter un utilisateur</h3>
                <form onSubmit={handleCreateUser}>
                  <div className="form-row">
                    <label>Nom</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Mot de passe</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Rôle</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="user">Membre</option>
                      <option value="moderator">Modérateur</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={handleCloseAdd}>Annuler</button>
                    <button type="submit" className="btn-primary">Créer</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="users-section">
            <h2>Liste des Utilisateurs</h2>
            {loading && <div className="users-loading">Chargement des utilisateurs...</div>}
            {!loading && error && <div className="users-error">{error}</div>}
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
              <div className="table-scroll" role="region" aria-label="Liste des utilisateurs">
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
                    {filteredUsers.map((user, index) => (
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
                          {user.id ? (
                            <>
                              <button
                                type="button"
                                className="action-btn"
                                title={user.statusCode === 'active' ? 'Désactiver' : 'Activer'}
                                aria-label={user.statusCode === 'active' ? 'Désactiver' : 'Activer'}
                                onClick={() => handleToggleStatus(user)}
                              >
                                {user.statusCode === 'active' ? 'Désactiver' : 'Activer'}
                              </button>
                              <select
                                className="filter-select"
                                value={user.roleCode}
                                onChange={(e) => handleChangeRole(user, e.target.value)}
                                title="Changer le rôle"
                                aria-label="Changer le rôle"
                              >
                                <option value="user">Membre</option>
                                <option value="moderator">Modérateur</option>
                                <option value="admin">Administrateur</option>
                              </select>
                            </>
                          ) : (
                            <>
                              <button type="button" className="action-btn edit" aria-label="Modifier (indisponible)" title="Indisponible" disabled>
                                <Pencil size={16} aria-hidden="true" />
                              </button>
                              <button type="button" className="action-btn delete" aria-label="Supprimer (indisponible)" title="Indisponible" disabled>
                                <Trash2 size={16} aria-hidden="true" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!loading && !error && filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center' }}>Aucun utilisateur</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="users-cards" aria-label="Liste des utilisateurs (mobile)">
                {filteredUsers.map((user, index) => (
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
                      <div className="mobile-card__label">Téléphone</div>
                      <div className="mobile-card__value">{user.telephone}</div>
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
                    {user.id && (
                      <div className="mobile-card__actions">
                        <button
                          type="button"
                          className="action-btn"
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.statusCode === 'active' ? 'Désactiver' : 'Activer'}
                        </button>
                        <select
                          className="filter-select"
                          value={user.roleCode}
                          onChange={(e) => handleChangeRole(user, e.target.value)}
                          aria-label="Changer le rôle"
                        >
                          <option value="user">Membre</option>
                          <option value="moderator">Modérateur</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))}
                {!loading && !error && filteredUsers.length === 0 && (
                  <div className="mobile-card mobile-card--empty">Aucun utilisateur</div>
                )}
              </div>
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
                    {(() => {
                      const membres = stats.roles.Membres || 0;
                      const moderateurs = stats.roles['Modérateurs'] || 0;
                      const admins = stats.roles.Admins || 0;
                      const maxVal = Math.max(membres, moderateurs, admins, 1);
                      const h = (v) => `${Math.round((v / maxVal) * 100)}%`;
                      return (
                        <>
                          <div className="bar membres" style={{ height: h(membres) }}>
                            <span className="bar-value">{membres}</span>
                            <span className="bar-label">Membres</span>
                          </div>
                          <div className="bar moderateurs" style={{ height: h(moderateurs) }}>
                            <span className="bar-value">{moderateurs}</span>
                            <span className="bar-label">Modérateurs</span>
                          </div>
                          <div className="bar admins" style={{ height: h(admins) }}>
                            <span className="bar-value">{admins}</span>
                            <span className="bar-label">Admins</span>
                          </div>
                        </>
                      );
                    })()}
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
    </AdminLayout>
  );
};

export default Users;
