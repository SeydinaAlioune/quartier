import React, { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout';
import './AdminSecurity.css';
import api from '../../../services/api';
import loadLeaflet from '../../../utils/loadLeaflet';
import { emitToast } from '../../../utils/toast';
import { MapPin, MoreVertical, Paperclip, Plus, Settings, X } from 'lucide-react';

const AdminSecurity = () => {
  const [activeTab, setActiveTab] = useState('alertes');

  const [alerts, setAlerts] = useState([]);

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters state
  const [alertTypeFilter, setAlertTypeFilter] = useState('');
  const [alertSeverityFilter, setAlertSeverityFilter] = useState('');
  const [alertZoneFilter, setAlertZoneFilter] = useState('');

  const [incidentTypeFilter, setIncidentTypeFilter] = useState('');
  const [incidentStatusFilter, setIncidentStatusFilter] = useState('');
  const [incidentFrom, setIncidentFrom] = useState('');
  const [incidentTo, setIncidentTo] = useState('');

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [openIncidentMenuId, setOpenIncidentMenuId] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('Confirmer');
  const [confirmMessage, setConfirmMessage] = useState('');
  const confirmActionRef = useRef(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItem, setViewerItem] = useState(null); // {type, url, title}

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

  const API_BASE = (api.defaults.baseURL || process.env.REACT_APP_API_URL || window.location.origin).replace(/\/$/, '');

  const toAbsoluteUrl = (url = '') => {
    const raw = String(url || '').trim();
    if (!raw) return '';
    const fixedProto = raw.replace(/^https\//i, 'https://').replace(/^http\//i, 'http://');
    if (/^https?:\/\//i.test(fixedProto)) return fixedProto;
    if (fixedProto.startsWith('/')) return `${API_BASE}${fixedProto}`;
    return `${API_BASE}/${fixedProto}`;
  };

  const handleOverlayMouseDown = (e, onClose) => {
    if (e.target !== e.currentTarget) return;
    onClose();
  };

  const openConfirm = ({ title = 'Confirmer', message = '', onConfirm }) => {
    confirmActionRef.current = typeof onConfirm === 'function' ? onConfirm : null;
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmTitle('Confirmer');
    setConfirmMessage('');
    confirmActionRef.current = null;
  };

  const handleConfirmSubmit = async () => {
    const fn = confirmActionRef.current;
    closeConfirm();
    if (!fn) return;
    try {
      await fn();
    } catch (e) {
      emitToast('Action impossible.');
    }
  };

  const openViewer = (item) => {
    if (!item?.url) return;
    try {
      const el = document.querySelector('.admin-security .viewer-body');
      if (el) delete el.dataset.previewError;
    } catch {}
    setViewerItem(item);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewerItem(null);
  };

  const closeMenu = () => setOpenMenuId(null);
  const closeIncidentMenu = () => setOpenIncidentMenuId(null);

  const statusLabel = (v) => {
    if (v === 'en_cours') return 'En cours';
    if (v === 'resolu') return 'Résolu';
    return 'Nouveau';
  };

  useEffect(() => {
    const shouldLock = Boolean(showConfig || showAlertModal || confirmOpen || viewerOpen || showMap);
    if (!shouldLock) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const prevBodyPosition = document.body.style.position;
    const prevBodyTop = document.body.style.top;
    const prevBodyLeft = document.body.style.left;
    const prevBodyRight = document.body.style.right;
    const prevBodyWidth = document.body.style.width;
    const sidebarEl = document.querySelector('.admin-sidebar');
    const prevSidebarOverflowY = sidebarEl ? sidebarEl.style.overflowY : '';
    const prevSidebarOverscroll = sidebarEl ? sidebarEl.style.overscrollBehavior : '';
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    const scrollY = window.scrollY || window.pageYOffset || 0;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    if (sidebarEl) {
      sidebarEl.style.overflowY = 'hidden';
      sidebarEl.style.overscrollBehavior = 'contain';
    }
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    const onTouchMove = (e) => {
      const target = e.target;
      if (!target || typeof target.closest !== 'function') {
        e.preventDefault();
        return;
      }

      const inModalScrollable = Boolean(target.closest('.modal__body'));
      if (!inModalScrollable) {
        e.preventDefault();
      }
    };

    const onWheel = (e) => {
      const target = e.target;
      if (!target || typeof target.closest !== 'function') {
        e.preventDefault();
        return;
      }
      const inModalScrollable = Boolean(target.closest('.modal__body'));
      if (!inModalScrollable) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('wheel', onWheel);
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.paddingRight = prevPaddingRight;

      document.body.style.position = prevBodyPosition;
      document.body.style.top = prevBodyTop;
      document.body.style.left = prevBodyLeft;
      document.body.style.right = prevBodyRight;
      document.body.style.width = prevBodyWidth;
      if (sidebarEl) {
        sidebarEl.style.overflowY = prevSidebarOverflowY;
        sidebarEl.style.overscrollBehavior = prevSidebarOverscroll;
      }

      window.scrollTo(0, scrollY);
    };
  }, [confirmOpen, showAlertModal, showConfig, showMap, viewerOpen]);

  useEffect(() => {
    const fetchSecurity = async () => {
      try {
        setLoading(true);
        const [aRes, iRes] = await Promise.all([
          api.get('/api/security/alerts'),
          api.get('/api/security/incidents'),
        ]);
        setAlerts(Array.isArray(aRes.data) ? aRes.data : []);
        setIncidents(Array.isArray(iRes.data) ? iRes.data : []);
      } catch (e) {
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

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;

      if (openMenuId) {
        closeMenu();
        return;
      }
      if (openIncidentMenuId) {
        closeIncidentMenu();
        return;
      }
      if (confirmOpen) {
        closeConfirm();
        return;
      }
      if (viewerOpen) {
        closeViewer();
        return;
      }
      if (showMap) {
        setShowMap(false);
        return;
      }
      if (showAlertModal) {
        setShowAlertModal(false);
        return;
      }
      if (showConfig) {
        setShowConfig(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [confirmOpen, openIncidentMenuId, openMenuId, showAlertModal, showConfig, showMap, viewerOpen]);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (!openMenuId) return;
      const el = e.target;
      if (el && typeof el.closest === 'function' && el.closest('.alert-header__right')) return;
      setOpenMenuId(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [openMenuId]);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (!openIncidentMenuId) return;
      const el = e.target;
      if (el && typeof el.closest === 'function' && el.closest('.incident-header__right')) return;
      setOpenIncidentMenuId(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [openIncidentMenuId]);

  const handleDeleteIncident = async (id) => {
    openConfirm({
      title: 'Supprimer l\'incident',
      message: 'Cette action est définitive. Voulez-vous continuer ?',
      onConfirm: async () => {
        await api.delete(`/api/security/incidents/${id}`);
        setIncidents(prev => prev.filter(i => i._id !== id));
      }
    });
  };

  // Initialize Leaflet map when modal opens
  useEffect(() => {
    if (!showMap || !mapCoords || !mapContainerRef.current) return;

    let map;
    const run = async () => {
      const L = await loadLeaflet();
      if (!L) return;

      // Clear previous map instance if any
      if (mapContainerRef.current._leaflet_id) {
        try { mapContainerRef.current._leaflet_id = null; } catch {}
      }

      map = L.map(mapContainerRef.current).setView([mapCoords.lat, mapCoords.lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);
      L.marker([mapCoords.lat, mapCoords.lng]).addTo(map);
    };

    run();

    return () => {
      try { map && map.remove(); } catch {}
    };
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
    openConfirm({
      title: 'Supprimer l\'alerte',
      message: 'Cette action est définitive. Voulez-vous continuer ?',
      onConfirm: async () => {
        await api.delete(`/api/security/alerts/${id}`);
        setAlerts(prev => prev.filter(a => a._id !== id));
      }
    });
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
      emitToast("Mise à jour du statut impossible.");
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

  const filteredAlerts = alerts
    .filter(a => !alertTypeFilter || (a.type || '').toLowerCase().includes(alertTypeFilter.toLowerCase()))
    .filter(a => !alertSeverityFilter || a.severity === alertSeverityFilter)
    .filter(a => !alertZoneFilter || (a.zone || '').toLowerCase().includes(alertZoneFilter.toLowerCase()));

  const filteredIncidents = incidents
    .filter(i => !incidentTypeFilter || (i.type || '').toLowerCase().includes(incidentTypeFilter.toLowerCase()))
    .filter(i => !incidentStatusFilter || i.status === incidentStatusFilter)
    .filter(i => {
      const d = new Date(i.date || i.createdAt);
      if (incidentFrom) {
        const from = new Date(incidentFrom);
        if (d < from) return false;
      }
      if (incidentTo) {
        const to = new Date(incidentTo);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
      return true;
    });

  return (
    <AdminLayout title="Gestion de la Sécurité">
      <div className="admin-security">
        <div className="security-topbar">
          <button className="config-btn" onClick={openConfig} type="button">
            <Settings size={16} aria-hidden="true" />
            <span>Configurer</span>
          </button>
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
              <button className="add-btn" onClick={openNewAlert} type="button">
                <Plus size={16} aria-hidden="true" />
                <span>Nouvelle Alerte</span>
              </button>
            </div>
            <div className="filters-toolbar">
              <button type="button" className="filters-toggle" onClick={() => setFiltersOpen(v => !v)} aria-expanded={filtersOpen}>
                Filtres
              </button>
              <div className={`filters ${filtersOpen ? 'is-open' : ''}`}>
                <input type="text" placeholder="Type" value={alertTypeFilter} onChange={(e)=>setAlertTypeFilter(e.target.value)} />
                <select value={alertSeverityFilter} onChange={(e)=>setAlertSeverityFilter(e.target.value)}>
                  <option value="">Sévérité (toutes)</option>
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Élevée</option>
                </select>
                <input type="text" placeholder="Zone" value={alertZoneFilter} onChange={(e)=>setAlertZoneFilter(e.target.value)} />
              </div>
            </div>
            <div className="alerts-list">
              {loading && <div className="admin-security__empty">Chargement…</div>}
              {!loading && filteredAlerts.length === 0 && (
                <div className="admin-security__empty">Aucune alerte</div>
              )}
              {!loading && filteredAlerts.map(alert => (
                <div key={alert._id} className={`alert-card severity-${alert.severity}`}>
                  <div className="alert-header">
                    <span className="alert-type">{alert.type}</span>
                    <div className="alert-header__right">
                      <span className="alert-date">{new Date(alert.date || alert.createdAt).toLocaleDateString('fr-FR')}</span>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="Actions"
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === alert._id}
                        onClick={() => setOpenMenuId(openMenuId === alert._id ? null : alert._id)}
                      >
                        <MoreVertical size={16} aria-hidden="true" />
                      </button>

                      {openMenuId === alert._id && (
                        <div className="action-menu" role="menu">
                          <button type="button" className="action-menu__item" onClick={() => { closeMenu(); openEditAlert(alert); }}>Modifier</button>
                          <button type="button" className="action-menu__item is-danger" onClick={() => { closeMenu(); handleDeleteAlert(alert._id); }}>Supprimer</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="alert-content">
                    <p className="alert-message">{alert.message}</p>
                    <span className="alert-zone">Zone: {alert.zone}</span>
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
            <div className="filters-toolbar">
              <button type="button" className="filters-toggle" onClick={() => setFiltersOpen(v => !v)} aria-expanded={filtersOpen}>
                Filtres
              </button>
              <div className={`filters ${filtersOpen ? 'is-open' : ''}`}>
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
            </div>
            <div className="incidents-list">
              {loading && <div className="admin-security__empty">Chargement…</div>}
              {!loading && filteredIncidents.length === 0 && (
                <div className="admin-security__empty">Aucun incident</div>
              )}
              {!loading && filteredIncidents.map(incident => (
                <div key={incident._id} className="incident-card">
                  <div className="incident-header">
                    <span className="incident-type">{incident.type}</span>
                    <div className="incident-header__right">
                      <span className="incident-date">{incident.date ? new Date(incident.date).toLocaleDateString('fr-FR') : ''}</span>
                      <span className={`incident-status-badge status-${incident.status || 'nouveau'}`}>{statusLabel(incident.status)}</span>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="Actions"
                        aria-haspopup="menu"
                        aria-expanded={openIncidentMenuId === incident._id}
                        onClick={() => setOpenIncidentMenuId(openIncidentMenuId === incident._id ? null : incident._id)}
                      >
                        <MoreVertical size={16} aria-hidden="true" />
                      </button>

                      {openIncidentMenuId === incident._id && (
                        <div className="action-menu" role="menu">
                          <button type="button" className="action-menu__item is-danger" onClick={() => { closeIncidentMenu(); handleDeleteIncident(incident._id); }}>Supprimer</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="incident-content">
                    <p className="incident-description">{incident.description}</p>
                    {incident.location && <span className="incident-reporter">Lieu: {incident.location}</span>}
                    {incident.contact && <span className="incident-reporter">Contact: {incident.contact}</span>}
                    {incident.anonymous && <span className="incident-reporter">Signalement anonyme</span>}
                    {Array.isArray(incident.attachments) && incident.attachments.length > 0 && (
                      <div className="incident-attachments" aria-label="Pièces jointes">
                        {incident.attachments.map((att, idx) => {
                          const abs = toAbsoluteUrl(att?.url || '');
                          const title = att?.name || att?.filename || 'Pièce jointe';
                          const type = att?.type || '';
                          const isImg = type === 'image' || /\.(png|jpe?g|webp|gif)$/i.test(abs);
                          if (!abs) return null;

                          return (
                            <button
                              key={idx}
                              type="button"
                              className="attachment-item"
                              onClick={() => {
                                if (isImg) {
                                  openViewer({ type: 'image', url: abs, title });
                                } else {
                                  window.open(abs, '_blank', 'noopener,noreferrer');
                                }
                              }}
                            >
                              {isImg ? (
                                <img
                                  src={abs}
                                  alt={title}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) parent.dataset.previewError = '1';
                                  }}
                                />
                              ) : (
                                <span className="attachment-file">
                                  <Paperclip size={16} aria-hidden="true" />
                                  <span>Fichier</span>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {incident.locationCoords && typeof incident.locationCoords.lat === 'number' && typeof incident.locationCoords.lng === 'number' && (
                      <div className="incident-map-action">
                        <button className="btn-secondary" type="button" onClick={() => openMapForIncident(incident)}>
                          <MapPin size={16} aria-hidden="true" />
                          Voir sur la carte
                        </button>
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
        {showConfig && (
          <div className="modal-overlay" onMouseDown={(e) => handleOverlayMouseDown(e, () => setShowConfig(false))}>
            <div className="modal security-config-modal">
              <div className="modal__header">
                <h3>Configuration Sécurité</h3>
                <button type="button" className="icon-close" onClick={() => setShowConfig(false)} aria-label="Fermer">
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="modal__body">
                {configLoading && <div className="admin-security__empty">Chargement…</div>}
                {configError && <div className="error-banner">{configError}</div>}
                {!configLoading && (
                  <form id="security-config-form" onSubmit={saveConfig}>
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
                        <div className="tip-add-row">
                          <input type="text" placeholder="Ajouter un conseil" value={t.newItem || ''} onChange={(e)=> setConfigForm(prev => ({ ...prev, tips: prev.tips.map((x,i)=> i===idx ? { ...x, newItem: e.target.value } : x) }))} />
                          <button type="button" className="btn-secondary" onClick={() => setConfigForm(prev => ({ ...prev, tips: prev.tips.map((x,i)=> i===idx ? { ...x, itemsText: (x.itemsText? x.itemsText+"\n" : '') + (x.newItem||'').trim(), newItem: '' } : x) }))}>Ajouter</button>
                        </div>
                        {t.itemsText && (
                          <ul className="tip-items">
                            {t.itemsText.split('\n').filter(s=>s.trim()).map((line, li) => (
                              <li key={li} className="tip-item">
                                <span>{line}</span>
                                <button
                                  type="button"
                                  className="tip-remove"
                                  onClick={() => setConfigForm(prev => ({
                                    ...prev,
                                    tips: prev.tips.map((x, i) => {
                                      if (i !== idx) return x;
                                      const next = (x.itemsText || '').split('\n').map(s => s.trim()).filter(Boolean).filter((_, k) => k !== li);
                                      return { ...x, itemsText: next.join('\n') };
                                    })
                                  }))}
                                  aria-label="Supprimer"
                                >
                                  <X size={14} aria-hidden="true" />
                                </button>
                              </li>
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
                  </form>
                )}
              </div>

              <div className="modal__footer">
                <button type="button" className="btn-secondary" onClick={() => setShowConfig(false)}>Annuler</button>
                <button type="submit" className="btn-primary" form="security-config-form">Enregistrer</button>
              </div>
            </div>
          </div>
        )}

        {showAlertModal && (
          <div className="modal-overlay" onMouseDown={(e) => handleOverlayMouseDown(e, () => setShowAlertModal(false))}>
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
          <div className="modal-overlay" onMouseDown={(e) => handleOverlayMouseDown(e, () => setShowMap(false))}>
            <div className="modal security-map-modal">
              <h3>Localisation de l'incident</h3>
              <div ref={mapContainerRef} className="security-map-container" />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowMap(false)}>Fermer</button>
              </div>
            </div>
          </div>
        )}

        {confirmOpen && (
          <div className="modal-overlay" onMouseDown={(e) => handleOverlayMouseDown(e, closeConfirm)}>
            <div className="modal">
              <h3>{confirmTitle}</h3>
              <div className="modal-subtitle">{confirmMessage}</div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeConfirm}>Annuler</button>
                <button type="button" className="btn-primary" onClick={handleConfirmSubmit}>Confirmer</button>
              </div>
            </div>
          </div>
        )}

        {viewerOpen && viewerItem && (
          <div className="modal-overlay" onMouseDown={(e) => handleOverlayMouseDown(e, closeViewer)}>
            <div className="modal security-viewer-modal">
              <div className="viewer-topbar">
                <div className="viewer-title">{viewerItem.title || 'Pièce jointe'}</div>
                <button type="button" className="icon-close" onClick={closeViewer} aria-label="Fermer">
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <div className="viewer-body">
                {viewerItem.type === 'image' ? (
                  <img
                    className="viewer-image"
                    src={viewerItem.url}
                    alt={viewerItem.title || 'pièce jointe'}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) parent.dataset.previewError = '1';
                    }}
                  />
                ) : (
                  <div className="viewer-file">
                    <Paperclip size={18} aria-hidden="true" />
                    <a href={viewerItem.url} target="_blank" rel="noreferrer">Ouvrir le fichier</a>
                  </div>
                )}

                {viewerItem.type === 'image' && (
                  <div className="viewer-file" data-preview-fallback>
                    <Paperclip size={18} aria-hidden="true" />
                    <a href={viewerItem.url} target="_blank" rel="noreferrer">Ouvrir le fichier</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSecurity;
