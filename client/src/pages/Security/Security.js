import React, { useEffect, useState } from 'react';
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

  const handleReportClick = () => {
    setShowReportForm(true);
  };

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

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/api/security/alerts');
      setAlerts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      // noop
    }
  };

  const fetchIncidents = async () => {
    try {
      const res = await api.get('/api/security/incidents');
      setIncidents(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      // noop
    }
  };

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
  }, []);

  return (
    <div className="security-container">
      <header
        className="security-header"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${process.env.PUBLIC_URL}/sec.jpg)`,
          backgroundPosition: 'center 35%'
        }}
      >
        <h1>Sécurité du Quartier</h1>
        <p>Ensemble, veillons à la tranquillité et à la sécurité de notre communauté</p>
      </header>

      <section className="report-incident">
        <h2>Signaler un Incident</h2>
        <button className="report-button" onClick={handleReportClick}>
          <i className="fas fa-exclamation-triangle"></i> Signaler un incident
        </button>
        {showReportForm && <ReportIncident onClose={handleCloseReport} onSubmit={handleSubmitIncident} />}
      </section>

      <section className="real-time-alerts">
        <h2>Alertes en Temps Réel</h2>
        {loading && <p>Chargement des alertes...</p>}
        {!loading && error && <p>{error}</p>}
        {!loading && !error && alerts.length === 0 && <p>Aucune alerte pour le moment.</p>}
        {!loading && !error && alerts.map((alert) => {
          const t = (alert.type || '').toLowerCase();
          return (
            <div key={alert._id || alert.id} className={`alert-card ${alert.severity || 'medium'}`}>
              <div className="alert-header">
                {t === 'cambriolage' && <i className="fas fa-shield-alt"></i>}
                {t === 'circulation' && <i className="fas fa-car"></i>}
                {t !== 'cambriolage' && t !== 'circulation' && <i className="fas fa-info-circle"></i>}
                <h3>Alerte {t.charAt(0).toUpperCase() + t.slice(1)} - {new Date(alert.createdAt || alert.date).toLocaleDateString('fr-FR')}</h3>
              </div>
              <p>{alert.message}</p>
            </div>
          );
        })}

        <div className="police-info">
          <i className="fas fa-police-box"></i>
          <h3>{config?.policeInfo?.title || 'Patrouilles de Police'}</h3>
          {configError && <p className="contact-info">{configError}</p>}
          {!configError && (
            <>
              <p>{config?.policeInfo?.message || '—'}</p>
              <p className="contact-info">{config?.policeInfo?.contact || ''}</p>
            </>
          )}
        </div>
      </section>

      <section className="security-incidents">
        <h2>Derniers Incidents Déclarés</h2>
        {loading && <p>Chargement des incidents...</p>}
        {!loading && !error && incidents.length === 0 && <p>Aucun incident pour le moment.</p>}
        <div className="incidents-grid">
          {incidents.map((it) => (
            <div key={it._id || it.id} className="incident-card">
              <div className="incident-header">
                <i className="fas fa-bullhorn"></i>
                <h3>{it.type}</h3>
                <span className={`status ${it.status}`}>{it.status}</span>
              </div>
              <p className="incident-date">{new Date(it.createdAt || it.date).toLocaleString('fr-FR')}</p>
              {it.location && <p><strong>Lieu:</strong> {it.location}</p>}
              <p>{it.description}</p>
              {it.locationCoords && typeof it.locationCoords.lat === 'number' && typeof it.locationCoords.lng === 'number' && (
                <p>
                  <a href={`https://www.google.com/maps?q=${it.locationCoords.lat},${it.locationCoords.lng}`} target="_blank" rel="noreferrer">Voir sur la carte</a>
                </p>
              )}
              {Array.isArray(it.attachments) && it.attachments.length > 0 && (
                <div style={{marginTop: '.5rem', display:'flex', gap:'.5rem', flexWrap:'wrap'}}>
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
              {it.contact && <p className="contact-info"><strong>Contact:</strong> {it.contact}</p>}
              {it.anonymous && <p className="contact-info">Signalement anonyme</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="security-tips">
        <h2>Conseils de Sécurité</h2>
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
