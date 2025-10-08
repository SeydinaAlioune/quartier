import React, { useEffect, useState, useRef } from 'react';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import './AdminSecurity.css';
import api from '../../../services/api';

const AdminSecurity = () => {
  const [activeTab, setActiveTab] = useState('alertes');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [alerts, setAlerts] = useState([]);

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters state
  const [alertTypeFilter, setAlertTypeFilter] = useState('');
  const [alertSeverityFilter, setAlertSeverityFilter] = useState('');
  const [alertZoneFilter, setAlertZoneFilter] = useState('');

  const [incidentTypeFilter, setIncidentTypeFilter] = useState('');
  const [incidentStatusFilter, setIncidentStatusFilter] = useState('');
  const [incidentFrom, setIncidentFrom] = useState('');
  const [incidentTo, setIncidentTo] = useState('');

  // Map modal state
  const [showMap, setShowMap] = useState(false);
  const [mapCoords, setMapCoords] = useState(null); // {lat,lng}
  const mapContainerRef = useRef(null);

  // Security config modal state
  const [showConfig, setShowConfig] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState('');
  const [configForm, setConfigForm] = useState({
    policeInfo: { title: 'Patrouilles de Police', message: '', contact: '' },
    tips: [
      { title: '', itemsText: '' },
    ],
  });

  // Alert create/edit modal state
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertEditingId, setAlertEditingId] = useState(null);
  const [alertError, setAlertError] = useState('');
  const [alertForm, setAlertForm] = useState({ type: '', message: '', zone: '', severity: 'low', date: '' });

  useEffect(() => {
    const fetchSecurity = async () => {
      try {
        setLoading(true);
        setError('');
        const [aRes, iRes] = await Promise.all([
          api.get('/api/security/alerts'),
          api.get('/api/security/incidents'),
        ]);
        setAlerts(Array.isArray(aRes.data) ? aRes.data : []);
        setIncidents(Array.isArray(iRes.data) ? iRes.data : []);
      } catch (e) {
        setError("Impossible de charger les données de sécurité.");
      } finally {
        setLoading(false);
      }
    };
    fetchSecurity();
    // SSE subscriptions for realtime updates
    let mounted = true;
    const origin = window.location.origin;
    const alertsSrc = new EventSource(`${origin}/api/security/alerts/stream`);
    alertsSrc.addEventListener('alert:create', (ev) => {
      try { const data = JSON.parse(ev.data); mounted && setAlerts(prev => [data, ...prev]); } catch {}
    });
    alertsSrc.addEventListener('alert:update', (ev) => {
      try { const data = JSON.parse(ev.data); mounted && setAlerts(prev => prev.map(a => (a._id === data._id ? data : a))); } catch {}
    });
    alertsSrc.addEventListener('alert:delete', (ev) => {
      try { const data = JSON.parse(ev.data); mounted && setAlerts(prev => prev.filter(a => a._id !== data._id)); } catch {}
    });

    const incidentsSrc = new EventSource(`${origin}/api/security/incidents/stream`);
    incidentsSrc.addEventListener('incident:create', (ev) => {
      try { const data = JSON.parse(ev.data); mounted && setIncidents(prev => [data, ...prev]); } catch {}
    });
    incidentsSrc.addEventListener('incident:update', (ev) => {
      try { const data = JSON.parse(ev.data); mounted && setIncidents(prev => prev.map(i => (i._id === data._id ? data : i))); } catch {}
    });
    incidentsSrc.addEventListener('incident:delete', (ev) => {
      try { const data = JSON.parse(ev.data); mounted && setIncidents(prev => prev.filter(i => i._id !== data._id)); } catch {}
    });
    return () => { mounted = false; alertsSrc.close(); incidentsSrc.close(); };
  }, []);

  // Initialize Leaflet map when modal opens
  useEffect(() => {
    if (showMap && mapCoords && mapContainerRef.current && window.L) {
      // Clear previous map instance if any
      if (mapContainerRef.current._leaflet_id) {
        try { mapContainerRef.current._leaflet_id = null; } catch {}
      }
      const map = window.L.map(mapContainerRef.current).setView([mapCoords.lat, mapCoords.lng], 15);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);
      window.L.marker([mapCoords.lat, mapCoords.lng]).addTo(map);
    }
  }, [showMap, mapCoords]);

  const openMapForIncident = (incident) => {
    const c = incident?.locationCoords;
    if (!c || typeof c.lat !== 'number' || typeof c.lng !== 'number') return;
    setMapCoords({ lat: c.lat, lng: c.lng });
    setShowMap(true);
  };

  const openNewAlert = () => {
    setAlertEditingId(null);
    setAlertForm({ type: '', message: '', zone: '', severity: 'low', date: '' });
    setAlertError('');
    setShowAlertModal(true);
  };

  const openEditAlert = (a) => {
    setAlertEditingId(a._id);
    const d = a.date || a.createdAt;
    const dateStr = d ? new Date(d).toISOString().slice(0, 10) : '';
    setAlertForm({ type: a.type || '', message: a.message || '', zone: a.zone || '', severity: a.severity || 'low', date: dateStr });
    setAlertError('');
    setShowAlertModal(true);
  };

  const saveAlert = async (e) => {
    e.preventDefault();
    try {
      setAlertError('');
      const payload = {
        type: alertForm.type,
        message: alertForm.message,
        zone: alertForm.zone,
        severity: alertForm.severity,
      };
      if (alertForm.date) payload.date = new Date(alertForm.date).toISOString();
      if (alertEditingId) {
        const res = await api.put(`/api/security/alerts/${alertEditingId}`, payload);
        setAlerts(prev => prev.map(a => a._id === alertEditingId ? res.data : a));
      } else {
        const res = await api.post('/api/security/alerts', payload);
        setAlerts(prev => [res.data, ...prev]);
      }
      setShowAlertModal(false);
      setAlertEditingId(null);
    } catch (e) {
      setAlertError("Enregistrement impossible. Vérifiez vos droits et les champs.");
    }
  };

  const handleDeleteAlert = async (id) => {
    if (!window.confirm('Supprimer cette alerte ?')) return;
    try {
      await api.delete(`/api/security/alerts/${id}`);
      setAlerts(prev => prev.filter(a => a._id !== id));
    } catch (e) {
      alert("Suppression impossible (droit administrateur requis).");
    }
  };

  const handleUpdateIncidentStatus = async (id, newStatus) => {
    const target = incidents.find(i => i._id === id);
    if (!target) return;
    const prev = target.status;
    setIncidents(incidents.map(incident => incident._id === id ? { ...incident, status: newStatus } : incident));
    try {
      await api.put(`/api/security/incidents/${id}`, { status: newStatus });
    } catch (e) {
      // revert on error
      setIncidents(incidents.map(incident => incident._id === id ? { ...incident, status: prev } : incident));
      alert("Mise à jour du statut impossible.");
    }
  };

  // Config handlers
  const openConfig = async () => {
    try {
      setConfigError('');
      setConfigLoading(true);
      const res = await api.get('/api/security/config');
      const cfg = res?.data || {};
      const tips = Array.isArray(cfg.tips) ? cfg.tips.map(t => ({ title: t.title || '', itemsText: (t.items || []).join('\n'), newItem: '' })) : [{ title: '', itemsText: '', newItem: '' }];
      setConfigForm({
        policeInfo: {
          title: cfg?.policeInfo?.title || 'Patrouilles de Police',
          message: cfg?.policeInfo?.message || '',
          contact: cfg?.policeInfo?.contact || '',
        },
        tips,
      });
      setShowConfig(true);
    } catch (e) {
      setConfigError("Impossible de charger la configuration sécurité.");
    } finally {
      setConfigLoading(false);
    }
  };

  const addTipCategory = () => {
    setConfigForm(prev => ({ ...prev, tips: [...prev.tips, { title: '', itemsText: '', newItem: '' }] }));
  };

  const removeTipCategory = (idx) => {
    setConfigForm(prev => ({ ...prev, tips: prev.tips.filter((_, i) => i !== idx) }));
  };

  const saveConfig = async (e) => {
    e.preventDefault();
    try {
      setConfigError('');
      const payload = {
        policeInfo: { ...configForm.policeInfo },
        tips: configForm.tips.map(t => ({ title: t.title, items: (t.itemsText || '').split('\n').map(s => s.trim()).filter(Boolean) })),
      };
      await api.put('/api/security/config', payload);
      setShowConfig(false);
    } catch (e) {
      setConfigError("Impossible d'enregistrer la configuration.");
    }
  };

  return (
    <div className="admin-page">
      <AdminSidebar isCollapsed={isCollapsed} />
      <div className="admin-security">
        <div className="dashboard-header">
          <div className="header-left">
            <button className="toggle-sidebar-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
              {isCollapsed ? '☰' : '✕'}
            </button>
            <h1>Gestion de la Sécurité</h1>
          </div>
          <div className="header-actions">
            <button className="config-btn" onClick={openConfig}>Configurer</button>
          </div>
          <div className="admin-profile">
            <span className="notification-badge">2</span>
            <span className="admin-name">Mohammed Diallo</span>
            <span className="admin-role">Administrateur</span>
          </div>
        </div>

        <div className="security-tabs">
          <button
            className={`tab-btn ${activeTab === 'alertes' ? 'active' : ''}`}
            onClick={() => setActiveTab('alertes')}
          >
            Alertes
          </button>
          <button
            className={`tab-btn ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidents')}
          >
            Incidents
          </button>
        </div>

        {activeTab === 'alertes' && (
          <div className="alerts-section">
            <div className="section-header">
              <h3>Alertes de Sécurité</h3>
              <button className="add-btn" onClick={openNewAlert}>Nouvelle Alerte</button>
            </div>
            <div className="filters" style={{display:'flex', gap:'.5rem', flexWrap:'wrap', marginBottom:'1rem'}}>
              <input type="text" placeholder="Type" value={alertTypeFilter} onChange={(e)=>setAlertTypeFilter(e.target.value)} />
              <select value={alertSeverityFilter} onChange={(e)=>setAlertSeverityFilter(e.target.value)}>
                <option value="">Sévérité (toutes)</option>
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Élevée</option>
              </select>
              <input type="text" placeholder="Zone" value={alertZoneFilter} onChange={(e)=>setAlertZoneFilter(e.target.value)} />
            </div>
            <div className="alerts-list">
              {loading && <div>Chargement...</div>}
              {!loading && alerts
                .filter(a => !alertTypeFilter || (a.type||'').toLowerCase().includes(alertTypeFilter.toLowerCase()))
                .filter(a => !alertSeverityFilter || a.severity === alertSeverityFilter)
                .filter(a => !alertZoneFilter || (a.zone||'').toLowerCase().includes(alertZoneFilter.toLowerCase()))
                .map(alert => (
                <div key={alert._id} className={`alert-card severity-${alert.severity}`}>
                  <div className="alert-header">
                    <span className="alert-type">{alert.type}</span>
                    <span className="alert-date">{new Date(alert.date || alert.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="alert-content">
                    <p className="alert-message">{alert.message}</p>
                    <span className="alert-zone">Zone: {alert.zone}</span>
                  </div>
                  <div className="alert-actions">
                    <button className="edit-btn" onClick={() => openEditAlert(alert)}>Modifier</button>
                    <button className="delete-btn" onClick={() => handleDeleteAlert(alert._id)}>Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="incidents-section">
            <div className="section-header">
              <h3>Incidents Signalés</h3>
            </div>
            <div className="filters" style={{display:'flex', gap:'.5rem', flexWrap:'wrap', marginBottom:'1rem'}}>
              <input type="text" placeholder="Type" value={incidentTypeFilter} onChange={(e)=>setIncidentTypeFilter(e.target.value)} />
              <select value={incidentStatusFilter} onChange={(e)=>setIncidentStatusFilter(e.target.value)}>
                <option value="">Statut (tous)</option>
                <option value="nouveau">Nouveau</option>
                <option value="en_cours">En cours</option>
                <option value="resolu">Résolu</option>
              </select>
              <input type="date" value={incidentFrom} onChange={(e)=>setIncidentFrom(e.target.value)} />
              <input type="date" value={incidentTo} onChange={(e)=>setIncidentTo(e.target.value)} />
            </div>
            <div className="incidents-list">
              {loading && <div>Chargement...</div>}
              {!loading && incidents
                .filter(i => !incidentTypeFilter || (i.type||'').toLowerCase().includes(incidentTypeFilter.toLowerCase()))
                .filter(i => !incidentStatusFilter || i.status === incidentStatusFilter)
                .filter(i => {
                  const d = new Date(i.date || i.createdAt);
                  if (incidentFrom) { const from = new Date(incidentFrom); if (d < from) return false; }
                  if (incidentTo) { const to = new Date(incidentTo); to.setHours(23,59,59,999); if (d > to) return false; }
                  return true;
                })
                .map(incident => (
                <div key={incident._id} className="incident-card">
                  <div className="incident-header">
                    <span className="incident-type">{incident.type}</span>
                    <span className="incident-date">{incident.date ? new Date(incident.date).toLocaleDateString('fr-FR') : ''}</span>
                  </div>
                  <div className="incident-content">
                    <p className="incident-description">{incident.description}</p>
                    {incident.location && <span className="incident-reporter">Lieu: {incident.location}</span>}
                    {incident.contact && <span className="incident-reporter">Contact: {incident.contact}</span>}
                    {incident.anonymous && <span className="incident-reporter">Signalement anonyme</span>}
                    {Array.isArray(incident.attachments) && incident.attachments.length > 0 && (
                      <div style={{marginTop: '.5rem', display:'flex', gap:'.5rem', flexWrap:'wrap'}}>
                        {incident.attachments.map((att, idx) => (
                          <a key={idx} href={att.url} target="_blank" rel="noreferrer">
                            {att.type === 'image' ? (
                              <img src={att.url} alt="pièce jointe" style={{width: 96, height: 72, objectFit: 'cover', borderRadius: 6, border:'1px solid #eee'}} />
                            ) : (
                              <span>Fichier</span>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                    {incident.locationCoords && typeof incident.locationCoords.lat === 'number' && typeof incident.locationCoords.lng === 'number' && (
                      <div style={{marginTop: '.5rem'}}>
                        <button className="btn-secondary" type="button" onClick={() => openMapForIncident(incident)}>Voir sur la carte</button>
                      </div>
                    )}
                    <span className="incident-reporter">Signalé par: {incident.reporter || '—'}</span>
                  </div>
                  <div className="incident-status">
                    <select 
                      value={incident.status}
                      onChange={(e) => handleUpdateIncidentStatus(incident._id, e.target.value)}
                    >
                      <option value="nouveau">Nouveau</option>
                      <option value="en_cours">En cours</option>
                      <option value="resolu">Résolu</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {showConfig && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Configuration Sécurité</h3>
            {configLoading && <div>Chargement...</div>}
            {configError && <div className="error-banner">{configError}</div>}
            {!configLoading && (
              <form onSubmit={saveConfig}>
                <div className="form-row">
                  <label>Titre (Patrouilles de Police)</label>
                  <input type="text" value={configForm.policeInfo.title} onChange={(e) => setConfigForm(prev => ({ ...prev, policeInfo: { ...prev.policeInfo, title: e.target.value } }))} />
                </div>
                <div className="form-row">
                  <label>Message</label>
                  <textarea rows="3" value={configForm.policeInfo.message} onChange={(e) => setConfigForm(prev => ({ ...prev, policeInfo: { ...prev.policeInfo, message: e.target.value } }))} />
                </div>
                <div className="form-row">
                  <label>Contact</label>
                  <input type="text" value={configForm.policeInfo.contact} onChange={(e) => setConfigForm(prev => ({ ...prev, policeInfo: { ...prev.policeInfo, contact: e.target.value } }))} />
                </div>

                <div className="form-row">
                  <label>Conseils (catégories)</label>
                </div>
                {configForm.tips.map((t, idx) => (
                  <div className="form-row" key={idx}>
                    <input type="text" placeholder="Titre (ex: Protection du Domicile)" value={t.title} onChange={(e) => setConfigForm(prev => ({ ...prev, tips: prev.tips.map((x, i) => i === idx ? { ...x, title: e.target.value } : x) }))} />
                    <textarea rows="4" placeholder={'Un conseil par ligne'} value={t.itemsText} onChange={(e) => setConfigForm(prev => ({ ...prev, tips: prev.tips.map((x, i) => i === idx ? { ...x, itemsText: e.target.value } : x) }))} />
                    <div style={{display:'flex', gap:'.5rem', alignItems:'center'}}>
                      <input type="text" placeholder="Ajouter un conseil" value={t.newItem || ''} onChange={(e)=> setConfigForm(prev => ({ ...prev, tips: prev.tips.map((x,i)=> i===idx ? { ...x, newItem: e.target.value } : x) }))} />
                      <button type="button" className="btn-secondary" onClick={() => setConfigForm(prev => ({ ...prev, tips: prev.tips.map((x,i)=> i===idx ? { ...x, itemsText: (x.itemsText? x.itemsText+"\n" : '') + (x.newItem||'').trim(), newItem: '' } : x) }))}>Ajouter</button>
                    </div>
                    {t.itemsText && (
                      <ul style={{marginTop:'.5rem', paddingLeft:'1rem'}}>
                        {t.itemsText.split('\n').filter(s=>s.trim()).map((line, li) => (
                          <li key={li} style={{fontSize:'.95rem'}}>{line}</li>
                        ))}
                      </ul>
                    )}
                    <div>
                      <button type="button" className="btn-secondary" onClick={() => removeTipCategory(idx)}>Supprimer cette catégorie</button>
                    </div>
                  </div>
                ))}
                <div className="form-row">
                  <button type="button" className="btn-secondary" onClick={addTipCategory}>Ajouter une catégorie</button>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowConfig(false)}>Annuler</button>
                  <button type="submit" className="btn-primary">Enregistrer</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {showAlertModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{alertEditingId ? 'Modifier une alerte' : 'Nouvelle alerte'}</h3>
            {alertError && <div className="error-banner">{alertError}</div>}
            <form onSubmit={saveAlert}>
              <div className="form-row">
                <label>Type</label>
                <input type="text" value={alertForm.type} onChange={(e) => setAlertForm(prev => ({ ...prev, type: e.target.value }))} required />
              </div>
              <div className="form-row">
                <label>Message</label>
                <textarea rows="3" value={alertForm.message} onChange={(e) => setAlertForm(prev => ({ ...prev, message: e.target.value }))} required />
              </div>
              <div className="form-row two-col">
                <input type="text" placeholder="Zone (ex: Nord, Centre, Sud)" value={alertForm.zone} onChange={(e) => setAlertForm(prev => ({ ...prev, zone: e.target.value }))} />
                <select value={alertForm.severity} onChange={(e) => setAlertForm(prev => ({ ...prev, severity: e.target.value }))}>
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Élevée</option>
                </select>
              </div>
              <div className="form-row">
                <label>Date (optionnelle)</label>
                <input type="date" value={alertForm.date} onChange={(e) => setAlertForm(prev => ({ ...prev, date: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAlertModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showMap && (
        <div className="modal-overlay">
          <div className="modal" style={{width:'min(720px, 92vw)'}}>
            <h3>Localisation de l'incident</h3>
            <div ref={mapContainerRef} style={{height: '380px', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb'}} />
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowMap(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSecurity;
