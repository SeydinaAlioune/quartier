import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import AdminHeader from '../../../components/AdminHeader/AdminHeader';
import api from '../../../services/api';
import './AdminServices.css';
import SERVICE_CATEGORIES from '../../../constants/serviceCategories';

const AdminServices = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editService, setEditService] = useState(null);
  const [showCityModal, setShowCityModal] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityError, setCityError] = useState('');
  const [cityForm, setCityForm] = useState({
    mayorOffice: {
      hoursText: '',
      servicesText: '',
      contact: { address: '', phone: '', email: '', appointmentUrl: '' },
    },
    waste: {
      collectionText: '',
      triText: '',
      decheterie: { address: '', hoursText: '', contact: '', infoUrl: '' },
    },
  });
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    category: 'Municipal',
    providerName: '',
    providerEmail: '',
    providerPhone: '',
    providerWebsite: '',
    locationAddress: '',
  });

  // Simple validations
  const isValidHttpsUrl = (val) => !val || /^https:\/\/.+/i.test((val || '').trim());
  const isValidPhone = (val) => !val || /^[+0-9 ()\-.]{6,}$/.test((val || '').trim());

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/services?approvalStatus=all&limit=200');
      const list = res?.data?.services || res?.data || [];
      setServices(Array.isArray(list) ? list : []);
    } catch (e) {
      setError("Impossible de charger les services.");
    } finally {
      setLoading(false);
    }
  };

  // City config handlers
  const openCityModal = async () => {
    try {
      setCityError('');
      setCityLoading(true);
      const res = await api.get('/api/city');
      const cfg = res?.data || {};
      setCityForm({
        mayorOffice: {
          hoursText: cfg?.mayorOffice?.hoursText || '',
          servicesText: Array.isArray(cfg?.mayorOffice?.services) ? cfg.mayorOffice.services.join('\n') : '',
          contact: {
            address: cfg?.mayorOffice?.contact?.address || '',
            phone: cfg?.mayorOffice?.contact?.phone || '',
            email: cfg?.mayorOffice?.contact?.email || '',
            appointmentUrl: cfg?.mayorOffice?.contact?.appointmentUrl || '',
          },
        },
        waste: {
          collectionText: cfg?.waste?.collectionText || '',
          triText: Array.isArray(cfg?.waste?.tri) ? cfg.waste.tri.join('\n') : '',
          decheterie: {
            address: cfg?.waste?.decheterie?.address || '',
            hoursText: cfg?.waste?.decheterie?.hoursText || '',
            contact: cfg?.waste?.decheterie?.contact || '',
            infoUrl: cfg?.waste?.decheterie?.infoUrl || '',
          },
        },
      });
      setShowCityModal(true);
    } catch (err) {
      const msg = err?.response?.data?.message || "Impossible de charger la configuration de la ville.";
      setCityError(msg);
    } finally {
      setCityLoading(false);
    }
  };

  const handleSaveCity = async (e) => {
    e.preventDefault();
    try {
      setCityError('');
      const payload = {
        mayorOffice: {
          hoursText: cityForm.mayorOffice.hoursText,
          services: (cityForm.mayorOffice.servicesText || '').split('\n').map(s => s.trim()).filter(Boolean),
          contact: { ...cityForm.mayorOffice.contact },
        },
        waste: {
          collectionText: cityForm.waste.collectionText,
          tri: (cityForm.waste.triText || '').split('\n').map(s => s.trim()).filter(Boolean),
          decheterie: { ...cityForm.waste.decheterie },
        },
      };
      await api.put('/api/city', payload);
      setShowCityModal(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Sauvegarde impossible.";
      setCityError(msg);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const filtered = services
    .filter(s => (statusFilter === 'all' || s.status === statusFilter))
    .filter(s => (approvalFilter === 'all' || s.approvalStatus === approvalFilter))
    .filter(s => (categoryFilter === 'all' || s.category === categoryFilter))
    .filter(s => {
      const q = searchQuery.trim().toLowerCase();
      return q === '' || (s.name || '').toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q) || (s.provider?.name || '').toLowerCase().includes(q);
    });

  const handleApprove = async (service) => {
    try {
      await api.put(`/api/services/${service._id}/approval`, { approvalStatus: 'approved' });
      await fetchServices();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Validation impossible.';
      alert(msg);
    }
  };

  const handleReject = async (service) => {
    const note = window.prompt('Motif du rejet (optionnel)', '');
    try {
      await api.put(`/api/services/${service._id}/approval`, { approvalStatus: 'rejected', reviewNote: note || undefined });
      await fetchServices();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Rejet impossible.';
      alert(msg);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Supprimer ce service ?')) return;
    try {
      await api.delete(`/api/services/${id}`);
      await fetchServices();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Suppression impossible. Vérifiez vos droits admin.';
      alert(msg);
    }
  };

  const handleToggleStatus = async (service) => {
    const current = service.status || 'active';
    const next = current === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/api/services/${service._id}`, { status: next });
      await fetchServices();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Changement de statut impossible.';
      alert(msg);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      if (!isValidHttpsUrl(newService.providerWebsite)) {
        alert('Le site web du fournisseur doit commencer par https://');
        return;
      }
      if (!isValidPhone(newService.providerPhone)) {
        alert('Numéro de téléphone invalide. Utilisez des chiffres, espaces, +, -, . (min 6 caractères).');
        return;
      }
      await api.post('/api/services', {
        name: newService.name,
        description: newService.description,
        category: newService.category,
        provider: {
          name: newService.providerName,
          contact: {
            email: newService.providerEmail || undefined,
            phone: newService.providerPhone || undefined,
            website: newService.providerWebsite || undefined,
          }
        },
        location: {
          address: newService.locationAddress,
        },
      });
      setShowAddModal(false);
      setNewService({ name: '', description: '', category: 'Municipal', providerName: '', providerEmail: '', providerPhone: '', providerWebsite: '', locationAddress: '' });
      fetchServices();
    } catch (err) {
      alert("Création de service impossible. Vérifiez vos droits admin.");
    }
  };

  const openEdit = (s) => {
    setEditService({
      _id: s._id,
      name: s.name || '',
      description: s.description || '',
      category: s.category || SERVICE_CATEGORIES[0],
      status: s.status || 'active',
      providerName: s.provider?.name || '',
      providerEmail: s.provider?.contact?.email || '',
      providerPhone: s.provider?.contact?.phone || '',
      providerWebsite: s.provider?.contact?.website || '',
      locationAddress: s.location?.address || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    if (!editService) return;
    try {
      if (!isValidHttpsUrl(editService.providerWebsite)) {
        alert('Le site web du fournisseur doit commencer par https://');
        return;
      }
      if (!isValidPhone(editService.providerPhone)) {
        alert('Numéro de téléphone invalide. Utilisez des chiffres, espaces, +, -, . (min 6 caractères).');
        return;
      }
      const payload = {
        name: editService.name,
        description: editService.description,
        category: editService.category,
        status: editService.status,
        provider: {
          name: editService.providerName,
          contact: {
            email: editService.providerEmail || undefined,
            phone: editService.providerPhone || undefined,
            website: editService.providerWebsite || undefined,
          },
        },
        location: {
          address: editService.locationAddress,
        },
      };
      await api.put(`/api/services/${editService._id}`, payload);
      setShowEditModal(false);
      setEditService(null);
      await fetchServices();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Mise à jour impossible.';
      alert(msg);
    }
  };

  return (
    <div className="admin-page">
      <AdminSidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <div className={`admin-content ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <AdminHeader 
          title="Gestion des Services" 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
        />

        <div className="services-page">
          <div className="services-header">
            <div className="header-title">
              <h1>Services</h1>
              <p className="header-subtitle">Créez et gérez les services disponibles</p>
            </div>
            <div className="header-actions">
              <button className="add-service-btn" onClick={() => setShowAddModal(true)}>
                <span>+</span>
                <span>Nouveau service</span>
              </button>
              <button className="city-config-btn" onClick={openCityModal}>
                <span>🏙️</span>
                <span>Configurer la ville</span>
              </button>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="services-filters">
            <input
              type="text"
              placeholder="Rechercher un service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <div className="filter-group">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="temporaire">Temporaire</option>
              </select>
              <select value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)} className="filter-select">
                <option value="all">Toutes les validations</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvé</option>
                <option value="rejected">Rejeté</option>
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="filter-select">
                <option value="all">Toutes les catégories</option>
                {SERVICE_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="services-list">
            {loading && <div className="service-card">Chargement...</div>}
            {!loading && filtered.map(s => (
              <div key={s._id} className="service-card">
                <div className="service-header">
                  <h3>{s.name}</h3>
                  <span className={`status-badge ${s.status}`}>{s.status || '—'}</span>
                </div>
                <div className="service-approval">
                  <span className={`approval-badge ${s.approvalStatus || 'pending'}`}>{s.approvalStatus || 'pending'}</span>
                </div>
                <div className="service-info">
                  <div className="info-group">
                    <span className="label">Catégorie:</span>
                    <span className="value">{s.category}</span>
                  </div>
                  <div className="info-group">
                    <span className="label">Fournisseur:</span>
                    <span className="value">{s.provider?.name || '—'}</span>
                  </div>
                  <div className="info-group">
                    <span className="label">Adresse:</span>
                    <span className="value">{s.location?.address || '—'}</span>
                  </div>
                </div>
                <div className="card-actions">
                  {(s.approvalStatus || 'pending') === 'pending' && (
                    <>
                      <button className="btn btn-approve" onClick={() => handleApprove(s)}>Approuver</button>
                      <button className="btn btn-reject" onClick={() => handleReject(s)}>Rejeter</button>
                    </>
                  )}
                  <button className="btn btn-toggle" onClick={() => handleToggleStatus(s)}>
                    {s.status === 'active' ? 'Désactiver' : 'Activer'}
                  </button>
                  <button className="btn btn-edit" onClick={() => openEdit(s)}>Éditer</button>
                  <button className="btn btn-delete" onClick={() => handleDeleteService(s._id)}>Supprimer</button>
                </div>
              </div>
            ))}
            {!loading && filtered.length === 0 && (
              <div className="service-card">Aucun service</div>
            )}
          </div>
        </div>

        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Nouveau service</h3>
              <form onSubmit={handleCreateService}>
                <div className="form-row">
                  <label>Nom</label>
                  <input type="text" placeholder="Ex: Maison de quartier" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} required />
                </div>
                <div className="form-row">
                  <label>Description</label>
                  <textarea rows="4" placeholder="Décrivez le service, les bénéficiaires, etc." value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} required />
                </div>
                <div className="form-row">
                  <label>Catégorie</label>
                  <select value={newService.category} onChange={(e) => setNewService({ ...newService, category: e.target.value })}>
                    {SERVICE_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label>Fournisseur</label>
                  <input type="text" placeholder="Nom du fournisseur (ex: Mairie)" value={newService.providerName} onChange={(e) => setNewService({ ...newService, providerName: e.target.value })} required />
                </div>
                <div className="form-row">
                  <label>Contact</label>
                  <div className="two-col">
                    <input type="email" placeholder="Email (ex: contact@ville.fr)" value={newService.providerEmail} onChange={(e) => setNewService({ ...newService, providerEmail: e.target.value })} />
                    <input type="text" placeholder="Téléphone (ex: 01 23 45 67 89)" value={newService.providerPhone} onChange={(e) => setNewService({ ...newService, providerPhone: e.target.value })} />
                  </div>
                  <input type="text" placeholder="Site web (ex: https://exemple.fr)" value={newService.providerWebsite} onChange={(e) => setNewService({ ...newService, providerWebsite: e.target.value })} />
                </div>
                <div className="form-row">
                  <label>Adresse</label>
                  <input type="text" placeholder="Ex: 12 rue de Paris, 75000 Paris" value={newService.locationAddress} onChange={(e) => setNewService({ ...newService, locationAddress: e.target.value })} required />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
                  <button type="submit" className="btn-primary">Créer</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showCityModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Configuration de la ville</h3>
              {cityLoading && <div>Chargement...</div>}
              {cityError && <div className="error-banner">{cityError}</div>}
              {!cityLoading && (
                <form onSubmit={handleSaveCity}>
                  <div className="form-row">
                    <label>Horaires de la Mairie (texte, lignes)</label>
                    <textarea rows="4" value={cityForm.mayorOffice.hoursText} onChange={(e) => setCityForm(prev => ({ ...prev, mayorOffice: { ...prev.mayorOffice, hoursText: e.target.value } }))} />
                  </div>
                  <div className="form-row">
                    <label>Services Mairie (une ligne par service)</label>
                    <textarea rows="4" value={cityForm.mayorOffice.servicesText} onChange={(e) => setCityForm(prev => ({ ...prev, mayorOffice: { ...prev.mayorOffice, servicesText: e.target.value } }))} />
                  </div>
                  <div className="form-row">
                    <label>Coordonnées Mairie</label>
                    <input type="text" placeholder="Adresse" value={cityForm.mayorOffice.contact.address} onChange={(e) => setCityForm(prev => ({ ...prev, mayorOffice: { ...prev.mayorOffice, contact: { ...prev.mayorOffice.contact, address: e.target.value } } }))} />
                    <div className="two-col" style={{marginTop: '.5rem'}}>
                      <input type="text" placeholder="Téléphone" value={cityForm.mayorOffice.contact.phone} onChange={(e) => setCityForm(prev => ({ ...prev, mayorOffice: { ...prev.mayorOffice, contact: { ...prev.mayorOffice.contact, phone: e.target.value } } }))} />
                      <input type="email" placeholder="Email" value={cityForm.mayorOffice.contact.email} onChange={(e) => setCityForm(prev => ({ ...prev, mayorOffice: { ...prev.mayorOffice, contact: { ...prev.mayorOffice.contact, email: e.target.value } } }))} />
                    </div>
                    <input type="text" placeholder="URL prise de RDV (https://...)" value={cityForm.mayorOffice.contact.appointmentUrl} onChange={(e) => setCityForm(prev => ({ ...prev, mayorOffice: { ...prev.mayorOffice, contact: { ...prev.mayorOffice.contact, appointmentUrl: e.target.value } } }))} />
                  </div>

                  <div className="form-row">
                    <label>Collecte des ordures (texte, lignes)</label>
                    <textarea rows="4" value={cityForm.waste.collectionText} onChange={(e) => setCityForm(prev => ({ ...prev, waste: { ...prev.waste, collectionText: e.target.value } }))} />
                  </div>
                  <div className="form-row">
                    <label>Tri des déchets (une ligne par item)</label>
                    <textarea rows="4" value={cityForm.waste.triText} onChange={(e) => setCityForm(prev => ({ ...prev, waste: { ...prev.waste, triText: e.target.value } }))} />
                  </div>
                  <div className="form-row">
                    <label>Déchèterie</label>
                    <input type="text" placeholder="Adresse" value={cityForm.waste.decheterie.address} onChange={(e) => setCityForm(prev => ({ ...prev, waste: { ...prev.waste, decheterie: { ...prev.waste.decheterie, address: e.target.value } } }))} />
                    <input type="text" placeholder="Horaires" value={cityForm.waste.decheterie.hoursText} onChange={(e) => setCityForm(prev => ({ ...prev, waste: { ...prev.waste, decheterie: { ...prev.waste.decheterie, hoursText: e.target.value } } }))} />
                    <input type="text" placeholder="Contact" value={cityForm.waste.decheterie.contact} onChange={(e) => setCityForm(prev => ({ ...prev, waste: { ...prev.waste, decheterie: { ...prev.waste.decheterie, contact: e.target.value } } }))} />
                    <input type="text" placeholder="URL d'information (https://...)" value={cityForm.waste.decheterie.infoUrl} onChange={(e) => setCityForm(prev => ({ ...prev, waste: { ...prev.waste, decheterie: { ...prev.waste.decheterie, infoUrl: e.target.value } } }))} />
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowCityModal(false)}>Annuler</button>
                    <button type="submit" className="btn-primary">Enregistrer</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
        {showEditModal && editService && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Éditer le service</h3>
              <form onSubmit={handleUpdateService}>
                <div className="form-row">
                  <label>Nom</label>
                  <input type="text" value={editService.name} onChange={(e) => setEditService(prev => ({ ...prev, name: e.target.value }))} required />
                </div>
                <div className="form-row">
                  <label>Description</label>
                  <textarea rows="4" value={editService.description} onChange={(e) => setEditService(prev => ({ ...prev, description: e.target.value }))} required />
                </div>
                <div className="form-row">
                  <label>Catégorie</label>
                  <select value={editService.category} onChange={(e) => setEditService(prev => ({ ...prev, category: e.target.value }))}>
                    {SERVICE_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label>Statut</label>
                  <select value={editService.status} onChange={(e) => setEditService(prev => ({ ...prev, status: e.target.value }))}>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="temporaire">Temporaire</option>
                  </select>
                </div>
                <div className="form-row">
                  <label>Fournisseur</label>
                  <input type="text" value={editService.providerName} onChange={(e) => setEditService(prev => ({ ...prev, providerName: e.target.value }))} required />
                </div>
                <div className="form-row">
                  <label>Contact</label>
                  <div className="two-col">
                    <input type="email" placeholder="Email" value={editService.providerEmail} onChange={(e) => setEditService(prev => ({ ...prev, providerEmail: e.target.value }))} />
                    <input type="text" placeholder="Téléphone" value={editService.providerPhone} onChange={(e) => setEditService(prev => ({ ...prev, providerPhone: e.target.value }))} />
                  </div>
                  <input type="text" placeholder="Site web (ex: https://exemple.fr)" value={editService.providerWebsite} onChange={(e) => setEditService(prev => ({ ...prev, providerWebsite: e.target.value }))} />
                </div>
                <div className="form-row">
                  <label>Adresse</label>
                  <input type="text" value={editService.locationAddress} onChange={(e) => setEditService(prev => ({ ...prev, locationAddress: e.target.value }))} required />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => { setShowEditModal(false); setEditService(null); }}>Annuler</button>
                  <button type="submit" className="btn-primary">Enregistrer</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminServices;
