import React, { useEffect, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout';
import './AdminDirectory.css';
import api from '../../../services/api';
import { emitToast } from '../../../utils/toast';

const AdminDirectory = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBiz, setNewBiz] = useState({ name: '', category: 'service', description: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBiz, setEditBiz] = useState({ _id: '', name: '', category: 'service', description: '', contact: { phone: '', email: '', website: '' }, address: { street: '', city: '', postalCode: '' } });
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingBusinesses, setPendingBusinesses] = useState([]);
  const [categoriesSummary, setCategoriesSummary] = useState({});
  // Useful contacts (admin)
  const [ucats, setUCats] = useState([]);
  const [ucLoading, setUcLoading] = useState(false);
  const [ucError, setUcError] = useState('');
  const [newCat, setNewCat] = useState({ title: '', order: '' });
  const [newContact, setNewContact] = useState({ name: '', number: '', note: '', catId: '' });
  const [editingContact, setEditingContact] = useState(null); // {catId, contactId, name, number, note}

  const fetchBusinesses = async (status = 'active', params = {}) => {
    try {
      setLoading(true);
      setError('');
      const query = new URLSearchParams({ status, ...params });
      const res = await api.get(`/api/business?${query.toString()}`);
      const list = Array.isArray(res?.data?.businesses) ? res.data.businesses : [];
      setBusinesses(list);
      if (status === 'active') {
        const summary = list.reduce((acc, b) => {
          const key = b.category || 'autre';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        setCategoriesSummary(summary);
      }
    } catch (e) {
      setError("Impossible de charger les entreprises.");
    } finally {
      setLoading(false);
    }
  };

  // Seed default useful contacts (France)
  const seedUsefulDefaults = async () => {
    try {
      setUcLoading(true);
      const defaults = {
        'Urgences': [
          { name: 'SAMU', number: '15' },
          { name: 'Police', number: '17' },
          { name: 'Pompiers', number: '18' },
          { name: "Numéro d'urgence européen", number: '112' },
          { name: 'Centre antipoison', number: '01 XX XX XX XX' },
        ],
        'Services publics': [
          { name: 'Mairie de quartier', number: '01 XX XX XX XX' },
          { name: 'La Poste', number: '36 31' },
          { name: 'Centre des impôts', number: '01 XX XX XX XX' },
          { name: 'EDF (dépannage)', number: '09 XX XX XX XX' },
          { name: 'Service des eaux', number: '09 XX XX XX XX' },
        ],
        'Associations': [
          { name: 'Association des commerçants', number: '01 XX XX XX XX' },
          { name: 'Club sportif', number: '01 XX XX XX XX' },
          { name: 'Maison des jeunes', number: '01 XX XX XX XX' },
          { name: "Association d'aide aux seniors", number: '01 XX XX XX XX' },
          { name: 'Collectif environnemental', number: '01 XX XX XX XX' },
        ],
      };
      // Load existing
      const existingRes = await api.get('/api/useful-contacts');
      let existing = Array.isArray(existingRes?.data?.categories) ? existingRes.data.categories : [];
      for (const [title, contactsToAdd] of Object.entries(defaults)) {
        let cat = existing.find(c => (c.title || '').toLowerCase() === title.toLowerCase());
        if (!cat) {
          const created = await api.post('/api/useful-contacts/categories', { title });
          cat = created?.data?.category;
          if (!cat) continue;
          cat.contacts = [];
          existing.push(cat);
        }
        const current = cat.contacts || [];
        for (const ct of contactsToAdd) {
          const exists = current.find(x => (x.name || '').toLowerCase() === ct.name.toLowerCase());
          if (!exists) {
            await api.post(`/api/useful-contacts/categories/${cat._id}/contacts`, ct);
          }
        }
      }
      const refresh = await api.get('/api/useful-contacts');
      setUCats(Array.isArray(refresh?.data?.categories) ? refresh.data.categories : []);
      emitToast('Contacts utiles pré-remplis.');
    } catch (e) {
      emitToast('Pré-remplissage impossible.');
    } finally {
      setUcLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const res = await api.get('/api/business?status=pending&limit=1');
      const total = res?.data?.total ?? 0;
      setPendingCount(total);
    } catch {}
  };

  const fetchPendingBusinesses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/business?status=pending');
      const list = Array.isArray(res?.data?.businesses) ? res.data.businesses : [];
      setPendingBusinesses(list);
    } catch (e) {
      setPendingBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses('active');
    fetchPendingCount();
  }, []);

  useEffect(() => {
    if (activeTab === 'validation') {
      fetchPendingBusinesses();
    }
    if (activeTab === 'useful') {
      (async () => {
        try {
          setUcLoading(true);
          setUcError('');
          const r = await api.get('/api/useful-contacts');
          setUCats(Array.isArray(r?.data?.categories) ? r.data.categories : []);
        } catch (e) {
          setUCats([]);
          setUcError("Impossible de charger les contacts utiles.");
        } finally {
          setUcLoading(false);
        }
      })();
    }
  }, [activeTab]);

  const directoryStats = {
    totalBusinesses: businesses.length,
    pendingValidation: pendingCount,
    totalCategories: Object.keys(categoriesSummary).length,
    totalViews: 0,
  };

  const CATEGORY_META = {
    restaurant: { label: 'Restaurants', icon: '🍽️', color: '#FF6B6B' },
    commerce: { label: 'Commerces', icon: '🛍️', color: '#F6AD55' },
    service: { label: 'Services', icon: '🛠️', color: '#63B3ED' },
    sante: { label: 'Santé', icon: '🩺', color: '#48BB78' },
    education: { label: 'Éducation', icon: '🎓', color: '#9F7AEA' },
    artisan: { label: 'Artisans', icon: '🧰', color: '#ED8936' },
    autre: { label: 'Autres', icon: '📦', color: '#A0AEC0' },
  };

  const filteredBusinesses = businesses.filter(b => {
    const matchesCategory = categoryFilter === 'all' || b.category === categoryFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = q === '' || (b.name || '').toLowerCase().includes(q) || (b.description || '').toLowerCase().includes(q) || (b.address?.street || '').toLowerCase().includes(q) || (b.address?.city || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleCreateBusiness = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/business', {
        name: newBiz.name,
        category: newBiz.category,
        description: newBiz.description,
        contact: newBiz.contact || {},
        address: newBiz.address || {},
      });
      setShowAddModal(false);
      setNewBiz({ name: '', category: 'service', description: '' });
      setActiveTab('businesses');
      fetchBusinesses('active');
      fetchPendingCount();
    } catch (err) {
      const msg = err?.response?.data?.message || "Création impossible. Vérifiez vos droits (connexion admin requise).";
      emitToast(msg);
    }
  };

  const handleDeleteBusiness = async (id) => {
    if (!window.confirm('Supprimer cette entreprise ?')) return;
    try {
      await api.delete(`/api/business/${id}`);
      fetchBusinesses('active');
      fetchPendingCount();
    } catch (err) {
      const msg = err?.response?.data?.message || "Suppression impossible. Vérifiez vos droits.";
      emitToast(msg);
    }
  };

  const handleModerateBusiness = async (id, status) => {
    try {
      await api.put(`/api/business/${id}/moderate`, { status });
      // Refresh data
      await fetchPendingBusinesses();
      await fetchPendingCount();
      await fetchBusinesses('active');
    } catch (err) {
      const msg = err?.response?.data?.message || "Action de modération impossible. Vérifiez vos droits (admin/modérateur).";
      emitToast(msg);
    }
  };

  // Edit handlers
  const openEdit = (b) => {
    setEditBiz({
      _id: b._id,
      name: b.name || '',
      category: b.category || 'service',
      description: b.description || '',
      contact: {
        phone: b.contact?.phone || '',
        email: b.contact?.email || '',
        website: b.contact?.website || '',
      },
      address: {
        street: b.address?.street || '',
        city: b.address?.city || '',
        postalCode: b.address?.postalCode || '',
      },
    });
    setShowEditModal(true);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: editBiz.name.trim(),
        category: editBiz.category,
        description: editBiz.description.trim(),
        contact: {
          phone: editBiz.contact.phone.trim(),
          email: editBiz.contact.email.trim(),
          website: editBiz.contact.website.trim(),
        },
        address: {
          street: editBiz.address.street.trim(),
          city: editBiz.address.city.trim(),
          postalCode: editBiz.address.postalCode.trim(),
        },
      };
      await api.put(`/api/business/${editBiz._id}`, payload);
      setShowEditModal(false);
      await fetchBusinesses('active');
      await fetchPendingCount();
      if (activeTab === 'validation') await fetchPendingBusinesses();
      emitToast('Entreprise mise à jour');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Mise à jour impossible. Vérifiez vos droits.';
      emitToast(msg);
    }
  };

  return (
    <AdminLayout title="Gestion de l'Annuaire">
      <div className="directory-page">
          {error && (
            <div className="business-item" style={{ color: '#e53e3e', background: '#fff5f5' }}>{error}</div>
          )}

          {activeTab === 'useful' && (
            <div className="businesses-section">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <h2>Contacts utiles</h2>
                <div className="header-actions">
                  <button className="business-btn" onClick={seedUsefulDefaults} disabled={ucLoading}>Pré-remplir (France)</button>
                </div>
              </div>
              {ucError && <div className="business-item" style={{ color: '#e53e3e', background: '#fff5f5' }}>{ucError}</div>}
              <div className="business-list" style={{ padding: '1rem' }}>
                <div className="business-item" style={{ gap: 16, flexDirection: 'column', alignItems: 'stretch' }}>
                  <h3 style={{ margin: 0 }}>Nouvelle catégorie</h3>
                  <div className="search-filters">
                    <input type="text" placeholder="Titre" className="search-input" value={newCat.title} onChange={(e) => setNewCat(prev => ({ ...prev, title: e.target.value }))} />
                    <input type="number" placeholder="Ordre (optionnel)" className="filter-select" value={newCat.order} onChange={(e) => setNewCat(prev => ({ ...prev, order: e.target.value }))} />
                    <button className="btn-primary" onClick={async () => {
                      try {
                        await api.post('/api/useful-contacts/categories', { title: newCat.title, order: newCat.order ? Number(newCat.order) : undefined });
                        setNewCat({ title: '', order: '' });
                        const r = await api.get('/api/useful-contacts');
                        setUCats(Array.isArray(r?.data?.categories) ? r.data.categories : []);
                      } catch {
                        emitToast('Création de catégorie impossible');
                      }
                    }}>Créer</button>
                  </div>
                </div>

                {ucLoading && <div className="business-item">Chargement...</div>}
                {!ucLoading && ucats.length === 0 && (
                  <div className="business-item">Aucune catégorie</div>
                )}
                {!ucLoading && ucats.map(cat => (
                  <div className="business-item" key={cat._id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <h3 className="business-name" style={{ margin: 0 }}>{cat.title}</h3>
                      <div className="business-actions">
                        <button className="action-btn edit" title="Renommer" onClick={async () => {
                          const title = prompt('Nouveau titre', cat.title) || cat.title;
                          try { await api.put(`/api/useful-contacts/categories/${cat._id}`, { title });
                            const r = await api.get('/api/useful-contacts'); setUCats(r?.data?.categories || []);
                          } catch { emitToast('Mise à jour impossible'); }
                        }}>✏️</button>
                        <button className="action-btn delete" title="Supprimer" onClick={async () => {
                          if (!window.confirm('Supprimer cette catégorie ?')) return;
                          try { await api.delete(`/api/useful-contacts/categories/${cat._id}`);
                            const r = await api.get('/api/useful-contacts'); setUCats(r?.data?.categories || []);
                          } catch { emitToast('Suppression impossible'); }
                        }}>🗑️</button>
                      </div>
                    </div>
                    <div style={{ paddingLeft: 8 }}>
                      <h4 style={{ margin: '8px 0' }}>Ajouter un contact</h4>
                      <div className="search-filters">
                        <input type="text" placeholder="Nom" className="search-input" value={newContact.catId === cat._id ? newContact.name : ''}
                          onChange={(e) => setNewContact(prev => ({ ...prev, catId: cat._id, name: e.target.value }))} />
                        <input type="text" placeholder="Numéro" className="search-input" value={newContact.catId === cat._id ? newContact.number : ''}
                          onChange={(e) => setNewContact(prev => ({ ...prev, catId: cat._id, number: e.target.value }))} />
                        <input type="text" placeholder="Note (optionnel)" className="search-input" value={newContact.catId === cat._id ? newContact.note : ''}
                          onChange={(e) => setNewContact(prev => ({ ...prev, catId: cat._id, note: e.target.value }))} />
                        <button className="btn-primary" onClick={async () => {
                          try {
                            await api.post(`/api/useful-contacts/categories/${cat._id}/contacts`, { name: newContact.name, number: newContact.number, note: newContact.note });
                            setNewContact({ name: '', number: '', note: '', catId: '' });
                            const r = await api.get('/api/useful-contacts'); setUCats(r?.data?.categories || []);
                          } catch { emitToast('Ajout impossible'); }
                        }}>Ajouter</button>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        {(cat.contacts || []).map(c => (
                          <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                            {editingContact && editingContact.contactId === c._id ? (
                              <>
                                <input type="text" className="search-input" value={editingContact.name} onChange={(e) => setEditingContact(prev => ({ ...prev, name: e.target.value }))} />
                                <input type="text" className="search-input" value={editingContact.number} onChange={(e) => setEditingContact(prev => ({ ...prev, number: e.target.value }))} />
                                <input type="text" className="search-input" value={editingContact.note} onChange={(e) => setEditingContact(prev => ({ ...prev, note: e.target.value }))} />
                                <button className="btn-primary" onClick={async () => {
                                  try { await api.put(`/api/useful-contacts/categories/${cat._id}/contacts/${c._id}`, { name: editingContact.name, number: editingContact.number, note: editingContact.note });
                                    setEditingContact(null);
                                    const r = await api.get('/api/useful-contacts'); setUCats(r?.data?.categories || []);
                                  } catch { emitToast('Mise à jour impossible'); }
                                }}>Enregistrer</button>
                                <button className="btn-secondary" onClick={() => setEditingContact(null)}>Annuler</button>
                              </>
                            ) : (
                              <>
                                <div style={{ flex: 1 }}>
                                  <strong>{c.name}</strong> — {c.number} {c.note ? `· ${c.note}` : ''}
                                </div>
                                <div className="business-actions">
                                  <button className="action-btn edit" title="Modifier" onClick={() => setEditingContact({ catId: cat._id, contactId: c._id, name: c.name, number: c.number, note: c.note || '' })}>✏️</button>
                                  <button className="action-btn delete" title="Supprimer" onClick={async () => {
                                    if (!window.confirm('Supprimer ce contact ?')) return;
                                    try { await api.delete(`/api/useful-contacts/categories/${cat._id}/contacts/${c._id}`);
                                      const r = await api.get('/api/useful-contacts'); setUCats(r?.data?.categories || []);
                                    } catch { emitToast('Suppression impossible'); }
                                  }}>🗑️</button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="directory-header">
            <div className="header-title">
              <h1>Gestion de l'Annuaire</h1>
              <p className="header-subtitle">Gérez les entreprises et professionnels du quartier</p>
            </div>
            <div className="header-actions">
              <button 
                className="validation-btn"
                onClick={() => setActiveTab('validation')}
              >
                <span>🔍</span>
                <span>En attente</span>
                <span className="count-badge">{directoryStats.pendingValidation}</span>
              </button>
              <button 
                className="business-btn"
                onClick={() => { setActiveTab('businesses'); setShowAddModal(true); }}
              >
                <span>🏢</span>
                <span>Nouvelle entreprise</span>
              </button>
            </div>
          </div>

          <div className="directory-tabs">
            <button 
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Vue d'ensemble
            </button>
            <button 
              className={`tab-btn ${activeTab === 'businesses' ? 'active' : ''}`}
              onClick={() => setActiveTab('businesses')}
            >
              Entreprises
            </button>
            <button 
              className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              Catégories
            </button>
            <button 
              className={`tab-btn ${activeTab === 'validation' ? 'active' : ''}`}
              onClick={() => setActiveTab('validation')}
            >
              Validation
            </button>
            <button 
              className={`tab-btn ${activeTab === 'useful' ? 'active' : ''}`}
              onClick={() => setActiveTab('useful')}
            >
              Contacts utiles
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="stats-overview">
              <div className="stat-item">
                <span className="stat-value">{directoryStats.totalBusinesses}</span>
                <span className="stat-label">Entreprises</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{directoryStats.pendingValidation}</span>
                <span className="stat-label">En attente</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{directoryStats.totalCategories}</span>
                <span className="stat-label">Catégories</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{directoryStats.totalViews}</span>
                <span className="stat-label">Vues ce mois</span>
              </div>
            </div>
          )}

          {activeTab === 'businesses' && (
            <div className="businesses-section">
              <div className="section-header">
                <div className="search-filters">
                  <input
                    type="text"
                    placeholder="Rechercher une entreprise..."
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
                    <option value="restaurant">Restaurants</option>
                    <option value="commerce">Commerces</option>
                    <option value="service">Services</option>
                  </select>
                </div>
              </div>
              <div className="business-list">
                {loading && (
                  <div className="business-item">Chargement...</div>
                )}
                {!loading && filteredBusinesses.length === 0 && (
                  <div className="business-item">Aucune entreprise</div>
                )}
                {!loading && filteredBusinesses.map((b) => (
                  <div className="business-item" key={b._id}>
                    <div className="business-logo">🏢</div>
                    <div className="business-info">
                      <h3 className="business-name">{b.name}</h3>
                      <span className="business-category">{b.category}</span>
                      <p className="business-address">{b.address?.street || '—'} {b.address?.city ? `, ${b.address.city}` : ''}</p>
                    </div>
                    <div className="business-actions">
                      <button className="action-btn edit" title="Modifier" onClick={() => openEdit(b)}>✏️</button>
                      <button className="action-btn delete" title="Supprimer" onClick={() => handleDeleteBusiness(b._id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="categories-section">
              <div className="categories-grid">
                {Object.keys(categoriesSummary).length === 0 && (
                  <div>Aucune catégorie disponible.</div>
                )}
                {Object.entries(categoriesSummary).map(([key, count]) => {
                  const meta = CATEGORY_META[key] || CATEGORY_META.autre;
                  return (
                    <div className="category-card" key={key} style={{ borderColor: meta.color }}>
                      <div className="category-icon" style={{ backgroundColor: `${meta.color}20` }}>
                        {meta.icon}
                      </div>
                      <h3 className="category-name">{meta.label}</h3>
                      <span className="category-count">{count} {count > 1 ? 'entreprises' : 'entreprise'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="validation-section">
              <div className="validation-list">
                {loading && <div className="validation-item">Chargement...</div>}
                {!loading && pendingBusinesses.length === 0 && (
                  <div className="validation-item">Aucune demande en attente</div>
                )}
                {!loading && pendingBusinesses.map((b) => (
                  <div className="validation-item" key={b._id}>
                    <div className="validation-header">
                      <h3>{b.name}</h3>
                      <span className="pending-badge">En attente</span>
                    </div>
                    <div className="validation-details">
                      <p><strong>Catégorie:</strong> {b.category}</p>
                      <p><strong>Adresse:</strong> {b.address?.street || '—'} {b.address?.city ? `, ${b.address.city}` : ''}</p>
                      <p><strong>Téléphone:</strong> {b.contact?.phone || '—'}</p>
                    </div>
                    <div className="validation-actions">
                      <button className="btn-approve" onClick={() => handleModerateBusiness(b._id, 'active')}>Approuver</button>
                      <button className="btn-reject" onClick={() => handleModerateBusiness(b._id, 'inactive')}>Rejeter</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {showAddModal && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Nouvelle entreprise</h3>
                <form onSubmit={handleCreateBusiness}>
                  <div className="form-row">
                    <label>Nom</label>
                    <input
                      type="text"
                      value={newBiz.name}
                      onChange={(e) => setNewBiz({ ...newBiz, name: e.target.value })}
                      placeholder="Ex: Boulangerie Dupont"
                      required
                    />
                    <span className="form-hint">Le nom commercial de l'entreprise</span>
                  </div>
                  <div className="form-row">
                    <label>Catégorie</label>
                    <select
                      value={newBiz.category}
                      onChange={(e) => setNewBiz({ ...newBiz, category: e.target.value })}
                    >
                      <option value="restaurant">restaurant</option>
                      <option value="commerce">commerce</option>
                      <option value="service">service</option>
                      <option value="sante">sante</option>
                      <option value="education">education</option>
                      <option value="artisan">artisan</option>
                      <option value="autre">autre</option>
                    </select>
                    <span className="form-hint">Choisissez la catégorie la plus adaptée</span>
                  </div>
                  <div className="form-row">
                    <label>Description</label>
                    <textarea
                      rows="4"
                      value={newBiz.description}
                      onChange={(e) => setNewBiz({ ...newBiz, description: e.target.value })}
                      placeholder="Décrivez brièvement l'activité, les services proposés, etc."
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Contact</label>
                    <div className="form-2col">
                      <input type="text" placeholder="Téléphone (ex: 06 12 34 56 78)"
                        value={newBiz.contact?.phone || ''}
                        onChange={(e) => setNewBiz(prev => ({ ...prev, contact: { ...(prev.contact||{}), phone: e.target.value } }))} />
                      <input type="email" placeholder="Email (ex: contact@exemple.fr)"
                        value={newBiz.contact?.email || ''}
                        onChange={(e) => setNewBiz(prev => ({ ...prev, contact: { ...(prev.contact||{}), email: e.target.value } }))} />
                    </div>
                    <input type="text" placeholder="Site web (ex: https://exemple.fr)"
                      value={newBiz.contact?.website || ''}
                      onChange={(e) => setNewBiz(prev => ({ ...prev, contact: { ...(prev.contact||{}), website: e.target.value } }))} />
                  </div>
                  <div className="form-row">
                    <label>Adresse</label>
                    <div className="form-2col">
                      <input type="text" placeholder="Rue (ex: 12 rue de Paris)"
                        value={newBiz.address?.street || ''}
                        onChange={(e) => setNewBiz(prev => ({ ...prev, address: { ...(prev.address||{}), street: e.target.value } }))} />
                      <input type="text" placeholder="Ville (ex: Paris)"
                        value={newBiz.address?.city || ''}
                        onChange={(e) => setNewBiz(prev => ({ ...prev, address: { ...(prev.address||{}), city: e.target.value } }))} />
                    </div>
                    <input type="text" placeholder="Code postal (ex: 75000)"
                      value={newBiz.address?.postalCode || ''}
                      onChange={(e) => setNewBiz(prev => ({ ...prev, address: { ...(prev.address||{}), postalCode: e.target.value } }))} />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
                    <button type="submit" className="btn-primary">Créer</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showEditModal && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Modifier l'entreprise</h3>
                <form onSubmit={handleSubmitEdit}>
                  <div className="form-row">
                    <label>Nom</label>
                    <input
                      type="text"
                      value={editBiz.name}
                      onChange={(e) => setEditBiz(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Boulangerie Dupont"
                      required
                    />
                    <span className="form-hint">Le nom commercial de l'entreprise</span>
                  </div>
                  <div className="form-row">
                    <label>Catégorie</label>
                    <select
                      value={editBiz.category}
                      onChange={(e) => setEditBiz(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="restaurant">restaurant</option>
                      <option value="commerce">commerce</option>
                      <option value="service">service</option>
                      <option value="sante">sante</option>
                      <option value="education">education</option>
                      <option value="artisan">artisan</option>
                      <option value="autre">autre</option>
                    </select>
                    <span className="form-hint">Choisissez la catégorie la plus adaptée</span>
                  </div>
                  <div className="form-row">
                    <label>Description</label>
                    <textarea
                      rows="4"
                      value={editBiz.description}
                      onChange={(e) => setEditBiz(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Décrivez brièvement l'activité, les services proposés, etc."
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Contact</label>
                    <div className="form-2col">
                      <input type="text" placeholder="Téléphone (ex: 06 12 34 56 78)"
                        value={editBiz.contact.phone}
                        onChange={(e) => setEditBiz(prev => ({ ...prev, contact: { ...prev.contact, phone: e.target.value } }))} />
                      <input type="email" placeholder="Email (ex: contact@exemple.fr)"
                        value={editBiz.contact.email}
                        onChange={(e) => setEditBiz(prev => ({ ...prev, contact: { ...prev.contact, email: e.target.value } }))} />
                    </div>
                    <input type="text" placeholder="Site web (ex: https://exemple.fr)"
                      value={editBiz.contact.website}
                      onChange={(e) => setEditBiz(prev => ({ ...prev, contact: { ...prev.contact, website: e.target.value } }))} />
                  </div>
                  <div className="form-row">
                    <label>Adresse</label>
                    <div className="form-2col">
                      <input type="text" placeholder="Rue (ex: 12 rue de Paris)"
                        value={editBiz.address.street}
                        onChange={(e) => setEditBiz(prev => ({ ...prev, address: { ...prev.address, street: e.target.value } }))} />
                      <input type="text" placeholder="Ville (ex: Paris)"
                        value={editBiz.address.city}
                        onChange={(e) => setEditBiz(prev => ({ ...prev, address: { ...prev.address, city: e.target.value } }))} />
                    </div>
                    <input type="text" placeholder="Code postal (ex: 75000)"
                      value={editBiz.address.postalCode}
                      onChange={(e) => setEditBiz(prev => ({ ...prev, address: { ...prev.address, postalCode: e.target.value } }))} />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Annuler</button>
                    <button type="submit" className="btn-primary">Enregistrer</button>
                  </div>
                </form>
              </div>
            </div>
          )}
      </div>
    </AdminLayout>
  );
};

export default AdminDirectory;
