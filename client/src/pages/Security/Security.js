import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './Security.css';
import ReportIncident from './ReportIncident';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const Security = () => {
  const navigate = useNavigate();
  // Données dynamiques
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [config, setConfig] = useState({
    policeInfo: { title: 'Patrouilles de Police', message: '', contact: '' },
    tips: [],
  });
  const [configError, setConfigError] = useState('');

  const [showReportForm, setShowReportForm] = useState(false);
  const [landmark, setLandmark] = useState('');

  const handleCloseReport = () => {
    setShowReportForm(false);
  };

  const handleSubmitIncident = async (data) => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    try {
      // Basic validations (client-side)
      const typeStr = (data.type || '').trim();
      const descStr = (data.description || '').trim();
      const locStr = (data.location || '').trim();
      if (!typeStr) { alert('Le type est requis.'); return; }
      if (!descStr) { alert('La description est requise.'); return; }
      if (typeStr.length > 100) { alert('Le type est trop long (max 100 caractères).'); return; }
      if (descStr.length > 2000) { alert('La description est trop longue (max 2000 caractères).'); return; }
      if (locStr.length > 300) { alert('Le lieu est trop long (max 300 caractères).'); return; }
      const occurredAt = data.date ? new Date(`${data.date}${data.time ? 'T' + data.time : ''}`) : undefined;
      // Upload attachments if any
      let attachments = [];
      if (Array.isArray(data.files) && data.files.length > 0) {
        for (const file of data.files) {
          const fd = new FormData();
          fd.append('media', file);
          try {
            const up = await api.post('/api/media', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            const url = up?.data?.media?.url;
            if (url) attachments.push({ url, type: 'image' });
          } catch (e) {
            // Ignore failed file and continue with others
          }
        }
      }
      const payload = {
        type: typeStr,
        description: descStr,
        location: locStr,
        contact: data.contact || '',
        anonymous: !!data.anonymous,
        date: occurredAt ? occurredAt.toISOString() : undefined,
        attachments: attachments.length ? attachments : undefined,
        locationCoords: data.coords && (data.coords.lat || data.coords.lng) ? {
          lat: Number(data.coords.lat),
          lng: Number(data.coords.lng),
        } : undefined,
      };
      await api.post('/api/security/incidents', payload);
      // recharger incidents
      await fetchIncidents();
    } catch (e) {
      alert("Échec de l'envoi. Réessayez plus tard.");
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openReport = () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    setShowReportForm(true);
  };

  const formatRelativeTime = (d) => {
    try {
      const date = new Date(d);
      const diff = Date.now() - date.getTime();
      if (!Number.isFinite(diff)) return '';
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "à l'instant";
      if (mins < 60) return `il y a ${mins} min`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `il y a ${hours} h`;
      const days = Math.floor(hours / 24);
      return `il y a ${days} j`;
    } catch {
      return '';
    }
  };

  const statusLabel = (s) => {
    const v = String(s || '').toLowerCase();
    if (v === 'nouveau') return 'Nouveau';
    if (v === 'en_cours') return 'En cours';
    if (v === 'resolu') return 'Résolu';
    return s || '';
  };

  const severityLabel = (s) => {
    const v = String(s || '').toLowerCase();
    if (v === 'high') return 'Élevée';
    if (v === 'low') return 'Faible';
    return 'Moyenne';
  };

  const filteredAlerts = useMemo(() => {
    const lm = String(landmark || '').trim().toLowerCase();
    if (!lm) return alerts;
    return (alerts || []).filter((a) => {
      const hay = [a.type, a.message, a.zone].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(lm);
    });
  }, [alerts, landmark]);

  const filteredIncidents = useMemo(() => {
    const lm = String(landmark || '').trim().toLowerCase();
    if (!lm) return incidents;
    return (incidents || []).filter((i) => {
      const hay = [i.type, i.description, i.location].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(lm);
    });
  }, [incidents, landmark]);

  const heroStats = useMemo(() => {
    const activeAlerts = (alerts || []).length;
    const last24h = (incidents || []).filter((i) => {
      const d = i.createdAt || i.date;
      if (!d) return false;
      const t = new Date(d).getTime();
      return Number.isFinite(t) && (Date.now() - t) <= 24 * 60 * 60 * 1000;
    }).length;
    const mostRecent = [...(alerts || []), ...(incidents || [])]
      .map(x => x.createdAt || x.date)
      .filter(Boolean)
      .map(d => new Date(d).getTime())
      .filter(t => Number.isFinite(t))
      .sort((a, b) => b - a)[0];
    const recentLabel = (() => {
      if (!mostRecent) return 'Récent';
      const diff = Date.now() - mostRecent;
      if (Number.isFinite(diff) && diff > 45 * 24 * 60 * 60 * 1000) {
        return new Date(mostRecent).toLocaleDateString('fr-FR');
      }
      return formatRelativeTime(mostRecent);
    })();
    return { activeAlerts, last24h, recentLabel };
  }, [alerts, incidents]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.get('/api/security/alerts');
      setAlerts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      // noop
    }
  }, []);

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await api.get('/api/security/incidents');
      setIncidents(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      // noop
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        await Promise.all([fetchAlerts(), fetchIncidents()]);
        // Charger la config sécurité
        try {
          const c = await api.get('/api/security/config');
          if (mounted) setConfig(c?.data || { policeInfo: { title: 'Patrouilles de Police', message: '', contact: '' }, tips: [] });
        } catch (e) {
          if (mounted) setConfigError("Impossible de charger les conseils et informations police.");
        }
      } catch (e) {
        if (mounted) setError('Impossible de charger les données de sécurité.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    // Real-time subscriptions (SSE)
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
  }, [fetchAlerts, fetchIncidents]);

  return (
    <div className="security-container">
      <header
        className="security-header"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${process.env.PUBLIC_URL}/sec.jpg)`,
          backgroundPosition: 'center 35%'
        }}
      >
        <div className="security-hero-inner">
          <p className="security-hero-kicker">Cité Gendarmerie</p>
          <h1>Sécurité du quartier</h1>
          <p className="security-hero-lead">Alertes en temps réel, signalements et informations utiles — pour protéger notre communauté.</p>
          <div className="security-hero-actions">
            <button type="button" className="security-hero-btn" onClick={openReport}>Signaler un incident</button>
            <button type="button" className="security-hero-link" onClick={() => scrollToSection('security-alerts')}>Voir les alertes</button>
          </div>
          <div className="security-hero-stats" aria-label="Résumé sécurité">
            <div className="security-stat"><span className="v">{heroStats.activeAlerts}</span><span className="l">alertes actives</span></div>
            <div className="security-stat"><span className="v">{heroStats.last24h}</span><span className="l">signalements (24h)</span></div>
            <div className="security-stat"><span className="v">{heroStats.recentLabel}</span><span className="l">mise à jour</span></div>
          </div>
          <p className="security-hero-note">Les signalements sont modérés avant publication. En cas d’urgence, privilégie un appel.</p>
        </div>
      </header>

      <div className="security-landmarks" aria-label="Repères du quartier">
        <button type="button" className={`security-chip ${landmark === 'mairie' ? 'active' : ''}`} onClick={() => setLandmark(v => (v === 'mairie' ? '' : 'mairie'))}>Mairie</button>
        <button type="button" className={`security-chip ${landmark === 'marche' ? 'active' : ''}`} onClick={() => setLandmark(v => (v === 'marche' ? '' : 'marche'))}>Marché</button>
        <button type="button" className={`security-chip ${landmark === 'ecole' ? 'active' : ''}`} onClick={() => setLandmark(v => (v === 'ecole' ? '' : 'ecole'))}>École</button>
        <button type="button" className={`security-chip ${landmark === 'mosquee' ? 'active' : ''}`} onClick={() => setLandmark(v => (v === 'mosquee' ? '' : 'mosquee'))}>Mosquée</button>
      </div>

      <section className="security-urgent" aria-label="Urgence">
        <div className="security-section-head">
          <div className="security-section-title">
            <h2>Urgence immédiate ?</h2>
            <p className="security-section-sub">Si quelqu’un est en danger, appelle un service d’urgence.</p>
          </div>
        </div>
        <div className="security-urgent-actions">
          <a className="security-urgent-btn" href="tel:17">Police</a>
          <a className="security-urgent-btn" href="tel:18">Pompiers</a>
          <a className="security-urgent-btn" href="tel:15">SAMU / Urgences</a>
        </div>
        <p className="security-urgent-note">Si ce n’est pas urgent, fais un signalement pour prévenir le quartier.</p>
      </section>

      <section className="report-incident" id="security-report">
        <div className="security-section-head">
          <div className="security-section-title">
            <h2>Faire un signalement</h2>
            <p className="security-section-sub">Décris ce qui s’est passé, ajoute une photo si besoin, et indique le lieu.</p>
          </div>
        </div>
        <div className="security-points">
          <div className="security-point">Anonyme si tu le souhaites</div>
          <div className="security-point">Photo + localisation GPS (optionnel)</div>
          <div className="security-point">Traitement et modération avant publication</div>
        </div>
        <button className="report-button" onClick={openReport}>
          <i className="fas fa-exclamation-triangle"></i> Signaler un incident
        </button>
        {showReportForm && <ReportIncident onClose={handleCloseReport} onSubmit={handleSubmitIncident} />}
      </section>

      <section className="real-time-alerts" id="security-alerts">
        <div className="security-section-head">
          <div className="security-section-title">
            <h2>Alertes en temps réel</h2>
            <p className="security-section-sub">Infos courtes et utiles pour rester vigilant dans le quartier.</p>
          </div>
          <div className="security-section-meta">
            <span className="security-results">{filteredAlerts.length} alertes</span>
          </div>
        </div>
        {loading && <p>Chargement des alertes...</p>}
        {!loading && error && <p>{error}</p>}
        {!loading && !error && filteredAlerts.length === 0 && (
          <div className="security-empty">
            <div className="security-empty-title">Aucune alerte pour le moment</div>
            <div className="security-empty-sub">Bonne nouvelle. Reste quand même vigilant et signale en cas de besoin.</div>
          </div>
        )}
        {!loading && !error && filteredAlerts.map((alert) => {
          const t = (alert.type || '').toLowerCase();
          const sev = String(alert.severity || 'medium').toLowerCase();
          const when = alert.createdAt || alert.date;
          return (
            <div key={alert._id || alert.id} className={`alert-card alert-${sev}`}>
              <div className="alert-top">
                <div className="alert-title">
                  <span className="alert-type">{t ? (t.charAt(0).toUpperCase() + t.slice(1)) : 'Alerte'}</span>
                  <span className={`alert-badge badge-${sev}`}>{severityLabel(sev)}</span>
                </div>
                <div className="alert-meta">
                  {alert.zone ? <span className="alert-zone">{alert.zone}</span> : <span className="alert-zone">Quartier</span>}
                  {when ? <span className="alert-time">{formatRelativeTime(when)}</span> : null}
                </div>
              </div>
              <p className="alert-message">{alert.message}</p>
            </div>
          );
        })}

        <div className="police-info" aria-label="Infos officielles">
          <h3>Infos officielles</h3>
          {configError && <p className="contact-info">{configError}</p>}
          {!configError && !config?.policeInfo?.message && !config?.policeInfo?.contact && (
            <div className="police-empty">
              <div className="police-empty-title">Aucune info publiée</div>
              <div className="police-empty-sub">Cette section sera mise à jour par l’administration du quartier.</div>
            </div>
          )}
          {!configError && (config?.policeInfo?.message || config?.policeInfo?.contact) && (
            <>
              {config?.policeInfo?.message && <p className="police-message">{config.policeInfo.message}</p>}
              {config?.policeInfo?.contact && <p className="contact-info">{config.policeInfo.contact}</p>}
            </>
          )}
        </div>
      </section>

      <section className="security-incidents">
        <div className="security-section-head">
          <div className="security-section-title">
            <h2>Signalements récents</h2>
            <p className="security-section-sub">Historique des incidents signalés par les membres du quartier.</p>
          </div>
          <div className="security-section-meta">
            <span className="security-results">{filteredIncidents.length} signalements</span>
          </div>
        </div>
        {loading && <p>Chargement des incidents...</p>}
        {!loading && !error && filteredIncidents.length === 0 && (
          <div className="security-empty">
            <div className="security-empty-title">Aucun signalement récent</div>
            <div className="security-empty-sub">Si tu constates un problème, tu peux faire un signalement en 2 minutes.</div>
            <button type="button" className="security-empty-cta" onClick={openReport}>Faire un signalement</button>
          </div>
        )}
        <div className="incidents-grid">
          {filteredIncidents.map((it) => (
            <div key={it._id || it.id} className="incident-card">
              <div className="incident-header">
                <div className="incident-title">{it.type || 'Signalement'}</div>
                <span className={`incident-badge status-${String(it.status || '').toLowerCase()}`}>{statusLabel(it.status)}</span>
              </div>
              <div className="incident-meta">
                <span className="incident-time">{formatRelativeTime(it.createdAt || it.date)}</span>
                {it.location && <span className="incident-loc">{it.location}</span>}
              </div>
              <p className="incident-desc">{it.description}</p>
              {Array.isArray(it.attachments) && it.attachments.length > 0 && (
                <div className="incident-att">
                  {it.attachments.map((att, idx) => (
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
              {it.locationCoords && typeof it.locationCoords.lat === 'number' && typeof it.locationCoords.lng === 'number' && (
                <div className="incident-actions">
                  <a className="incident-link" href={`https://www.google.com/maps?q=${it.locationCoords.lat},${it.locationCoords.lng}`} target="_blank" rel="noreferrer">Voir sur la carte</a>
                </div>
              )}
              {it.contact && <p className="contact-info"><strong>Contact:</strong> {it.contact}</p>}
              {it.anonymous && <p className="contact-info">Signalement anonyme</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="security-tips">
        <div className="security-section-head">
          <div className="security-section-title">
            <h2>Conseils de sécurité</h2>
            <p className="security-section-sub">Gestes simples, bons réflexes et prévention.</p>
          </div>
        </div>
        {!configError && (!Array.isArray(config?.tips) || config.tips.length === 0) && (
          <div className="security-empty">
            <div className="security-empty-title">Conseils bientôt disponibles</div>
            <div className="security-empty-sub">L’administration ajoutera des recommandations adaptées au quartier.</div>
          </div>
        )}
        <div className="tips-grid">
          {(config?.tips || []).map((category, index) => (
            <div key={index} className="tip-card">
              <h3>{category.title}</h3>
              <ul>
                {(category.items || []).map((tip, tipIndex) => (
                  <li key={tipIndex}>
                    <i className="fas fa-check"></i>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Security;
