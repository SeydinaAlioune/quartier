import React, { useEffect, useState } from 'react';
import './Services.css';
import api from '../../services/api';
import SERVICE_CATEGORIES from '../../constants/serviceCategories';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [usefulCats, setUsefulCats] = useState([]);
  const [ucError, setUcError] = useState('');
  const [city, setCity] = useState(null);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityError, setCityError] = useState('');

  const categories = SERVICE_CATEGORIES;
  const SHOW_STATIC_CITY_SECTIONS = false; // Désactivé: sections désormais dynamiques via /api/city

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '50');
      params.set('status', 'active');
      params.set('approvalStatus', 'approved');
      if (search.trim()) params.set('search', search.trim());
      if (category) params.set('category', category);
      const res = await api.get(`/api/services?${params.toString()}`);
      const arr = Array.isArray(res.data?.services) ? res.data.services : [];
      setServices(arr);
    } catch (e) {
      setError('Impossible de charger les services.');
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); /* on mount */ }, []);
  useEffect(() => {
    const t = setTimeout(() => fetchServices(), 300);
    return () => clearTimeout(t);
  }, [search, category]);

  // Charger les contacts utiles (admin) pour alimenter la section "Numéros d'Urgence"
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setUcError('');
        const res = await api.get('/api/useful-contacts');
        if (!mounted) return;
        const arr = Array.isArray(res?.data?.categories) ? res.data.categories : [];
        setUsefulCats(arr);
      } catch (e) {
        if (mounted) setUcError('Impossible de charger les contacts utiles.');
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Charger la configuration de la ville (Mairie, Ordures)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setCityError('');
        setCityLoading(true);
        const res = await api.get('/api/city');
        if (!mounted) return;
        setCity(res?.data || null);
      } catch (e) {
        if (mounted) setCityError("Impossible de charger la configuration de la ville.");
      } finally {
        if (mounted) setCityLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <>
      <header
        className="services-header"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${process.env.PUBLIC_URL}/ser.jpg)`,
          backgroundPosition: 'center 35%'
        }}
      >
        <h1>Services du Quartier</h1>
      </header>

      <div className="services-page">
      <p className="page-intro">Découvrez tous les services disponibles pour faciliter votre quotidien</p>

      <section className="service-section">
        <h2>Services déclarés</h2>
        <div className="service-controls" style={{display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1rem'}}>
          <input className="service-search" type="text" placeholder="Rechercher un service..." value={search} onChange={(e)=>setSearch(e.target.value)} />
          <select className="service-category" value={category} onChange={(e)=>setCategory(e.target.value)}>
            <option value="">Toutes les catégories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {loading && <p>Chargement des services...</p>}
        {!loading && error && <p className="services-error">{error}</p>}
        {!loading && !error && services.length === 0 && (
          <p>Aucun service pour le moment. Les administrateurs pourront en ajouter prochainement.</p>
        )}
        <div className="service-cards">
          {services.map((s) => (
            <div key={s._id} className="service-card">
              <div className="card-header">
                <i className="fas fa-concierge-bell"></i>
                <h3>{s.name}</h3>
              </div>
              <ul>
                <li><strong>Catégorie:</strong> {s.category}</li>
                <li><strong>Fournisseur:</strong> {s.provider?.name || '—'}</li>
                <li><strong>Adresse:</strong> {s.location?.address || '—'}</li>
                {s.provider?.contact?.phone && (
                  <li><strong>Téléphone:</strong> {s.provider.contact.phone}</li>
                )}
                {s.provider?.contact?.email && (
                  <li><strong>Email:</strong> {s.provider.contact.email}</li>
                )}
                {s.provider?.contact?.website && (
                  <li><strong>Site:</strong> <a href={s.provider.contact.website} target="_blank" rel="noreferrer">{s.provider.contact.website}</a></li>
                )}
              </ul>
              <p style={{marginTop:'0.5rem'}}>{s.description}</p>
              <div className="contact-info">
                {s.provider?.contact?.email && (
                  <a className="btn-secondary" href={`mailto:${s.provider.contact.email}`}>Contacter par email</a>
                )}
                {s.provider?.contact?.phone && (
                  <a className="btn-primary" href={`tel:${s.provider.contact.phone}`}>Appeler</a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="service-section">
        <h2>Mairie de Quartier</h2>
        {cityLoading && <p>Chargement...</p>}
        {cityError && <p className="services-error">{cityError}</p>}
        {!cityLoading && !cityError && (
          <div className="service-cards">
            <div className="service-card">
              <div className="card-header">
                <i className="far fa-clock"></i>
                <h3>Horaires</h3>
              </div>
              <div className="contact-info">
                {(city?.mayorOffice?.hoursText || '').split('\n').filter(Boolean).length > 0 ? (
                  (city.mayorOffice.hoursText || '').split('\n').filter(Boolean).map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))
                ) : (
                  <p>Non configuré pour le moment.</p>
                )}
              </div>
            </div>

            <div className="service-card">
              <div className="card-header">
                <i className="fas fa-list-ul"></i>
                <h3>Services proposés</h3>
              </div>
              <ul>
                {(city?.mayorOffice?.services || []).length > 0 ? (
                  (city.mayorOffice.services || []).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))
                ) : (
                  <li>Non configuré pour le moment.</li>
                )}
              </ul>
            </div>

            <div className="service-card">
              <div className="card-header">
                <i className="fas fa-map-marker-alt"></i>
                <h3>Coordonnées</h3>
              </div>
              <div className="contact-info">
                <p><strong>Adresse:</strong> {city?.mayorOffice?.contact?.address || '—'}</p>
                <p><strong>Téléphone:</strong> {city?.mayorOffice?.contact?.phone || '—'}</p>
                <p><strong>Email:</strong> {city?.mayorOffice?.contact?.email || '—'}</p>
                {city?.mayorOffice?.contact?.appointmentUrl && (
                  <a className="btn-primary" href={city.mayorOffice.contact.appointmentUrl} target="_blank" rel="noreferrer">Prendre rendez-vous</a>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="service-section">
        <h2>Numéros d'Urgence</h2>
        {ucError && <p className="services-error">{ucError}</p>}
        <div className="service-cards">
          {usefulCats.length === 0 && !ucError && (
            <div className="service-card">Aucun contact utile configuré pour le moment.</div>
          )}
          {usefulCats.map(cat => (
            <div key={cat._id || cat.title} className="service-card">
              <div className="card-header">
                <i className="fas fa-phone-alt"></i>
                <h3>{cat.title}</h3>
              </div>
              <ul className="emergency-list">
                {(cat.contacts || []).map(c => (
                  <li key={c._id || c.name}>
                    <strong>{c.name}:</strong> {c.number}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="service-section">
        <h2>Gestion des Ordures</h2>
        {cityLoading && <p>Chargement...</p>}
        {cityError && <p className="services-error">{cityError}</p>}
        {!cityLoading && !cityError && (
          <div className="service-cards">
            <div className="service-card">
              <div className="card-header">
                <i className="fas fa-calendar-alt"></i>
                <h3>Collecte</h3>
              </div>
              <div className="contact-info">
                {(city?.waste?.collectionText || '').split('\n').filter(Boolean).length > 0 ? (
                  (city.waste.collectionText || '').split('\n').filter(Boolean).map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))
                ) : (
                  <p>Non configuré pour le moment.</p>
                )}
              </div>
            </div>

            <div className="service-card">
              <div className="card-header">
                <i className="fas fa-recycle"></i>
                <h3>Tri des déchets</h3>
              </div>
              <ul>
                {(city?.waste?.tri || []).length > 0 ? (
                  (city.waste.tri || []).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))
                ) : (
                  <li>Non configuré pour le moment.</li>
                )}
              </ul>
            </div>

            <div className="service-card">
              <div className="card-header">
                <i className="fas fa-trash"></i>
                <h3>Déchèterie</h3>
              </div>
              <div className="contact-info">
                <p><strong>Adresse:</strong> {city?.waste?.decheterie?.address || '—'}</p>
                <p><strong>Horaires:</strong> {city?.waste?.decheterie?.hoursText || '—'}</p>
                <p><strong>Contact:</strong> {city?.waste?.decheterie?.contact || '—'}</p>
                {city?.waste?.decheterie?.infoUrl && (
                  <a className="btn-secondary" href={city.waste.decheterie.infoUrl} target="_blank" rel="noreferrer">Plus d'infos</a>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
    </>
  );
};

export default Services;
