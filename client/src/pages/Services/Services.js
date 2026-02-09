import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Services.css';
import api from '../../services/api';
import SERVICE_CATEGORIES from '../../constants/serviceCategories';

const Services = () => {
  const navigate = useNavigate();
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

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [showOptionalContact, setShowOptionalContact] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '' });
  const [modalDragY, setModalDragY] = useState(0);
  const [isDraggingModal, setIsDraggingModal] = useState(false);

  const modalRef = useRef(null);
  const dragStartYRef = useRef(0);
  const dragActiveRef = useRef(false);
  const [submitForm, setSubmitForm] = useState({
    name: '',
    description: '',
    category: 'Municipal',
    providerName: '',
    providerEmail: '',
    providerPhone: '',
    providerWebsite: '',
    locationAddress: '',
  });

  const categories = SERVICE_CATEGORIES;

  const scrollToDeclared = () => {
    const el = document.getElementById('services-declares');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openSubmit = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setSubmitError('');
    setSubmitSuccess('');
    setShowOptionalContact(false);
    setModalDragY(0);
    setIsDraggingModal(false);
    setShowSubmitModal(true);
  };

  const closeSubmit = () => {
    setShowSubmitModal(false);
    setModalDragY(0);
    setIsDraggingModal(false);
  };

  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(() => setToast({ open: false, message: '' }), 4000);
    return () => clearTimeout(t);
  }, [toast.open]);

  const handleSubmitService = async (e) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      setSubmitError('');
      setSubmitSuccess('');

      await api.post('/api/services/submit', {
        name: submitForm.name,
        description: submitForm.description,
        category: submitForm.category,
        provider: {
          name: submitForm.providerName,
          contact: {
            email: submitForm.providerEmail || undefined,
            phone: submitForm.providerPhone || undefined,
            website: submitForm.providerWebsite || undefined,
          },
        },
        location: {
          address: submitForm.locationAddress,
        },
      });

      setSubmitSuccess('Merci ! Votre service a été envoyé et sera validé par un administrateur.');
      setToast({ open: true, message: 'Proposition envoyée. Merci !' });
      setTimeout(() => closeSubmit(), 1400);
      setSubmitForm({
        name: '',
        description: '',
        category: 'Municipal',
        providerName: '',
        providerEmail: '',
        providerPhone: '',
        providerWebsite: '',
        locationAddress: '',
      });
    } catch (err) {
      setSubmitError(err?.response?.data?.message || "Envoi impossible. Réessayez plus tard.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const fetchServices = useCallback(async () => {
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
  }, [category, search]);

  useEffect(() => { fetchServices(); /* on mount */ }, [fetchServices]);
  useEffect(() => {
    const t = setTimeout(() => fetchServices(), 300);
    return () => clearTimeout(t);
  }, [category, fetchServices, search]);

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
        <div className="services-hero-inner">
          <p className="services-hero-kicker">Guide pratique</p>
          <h1>Services du Quartier</h1>
          <p className="services-hero-lead">Contacts utiles, horaires, démarches et infos de proximité — tout au même endroit.</p>
          <div className="services-hero-actions">
            <button type="button" className="services-hero-btn primary" onClick={scrollToDeclared}>Explorer les services</button>
            <button type="button" className="services-hero-link" onClick={openSubmit}>Proposer un service</button>
          </div>
        </div>
      </header>

      <div className="services-page">
      <p className="page-intro">Découvrez les services essentiels du quartier, et proposez ceux qui manquent.</p>

      <section className="service-section" id="services-declares">
        <div className="service-section-head">
          <div className="service-section-title">
            <h2>Services déclarés</h2>
            <p className="service-section-subtitle">Commerces, associations, municipal, santé… tout ce qui simplifie le quotidien.</p>
          </div>
          <button type="button" className="services-cta" onClick={openSubmit}>Proposer un service</button>
        </div>

        <div className="service-toolbar">
          <div className="service-controls">
            <input className="service-search" type="text" placeholder="Rechercher (ex: pharmacie, transport…)" value={search} onChange={(e)=>setSearch(e.target.value)} />
            <select className="service-category" value={category} onChange={(e)=>setCategory(e.target.value)}>
              <option value="">Toutes les catégories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        {loading && <p>Chargement des services...</p>}
        {!loading && error && <p className="services-error">{error}</p>}
        {!loading && !error && services.length === 0 && (
          <div className="services-empty">
            <div className="services-empty-title">Aucun service publié</div>
            <div className="services-empty-sub">Soyez le premier à proposer un service. Il sera validé avant publication.</div>
            <button type="button" className="services-empty-cta" onClick={openSubmit}>Proposer le premier service</button>
          </div>
        )}
        <div className="service-cards">
          {services.map((s) => (
            <div key={s._id} className="service-card">
              <div className="card-header">
                <i className="fas fa-concierge-bell"></i>
                <div className="card-header-main">
                  <h3>{s.name}</h3>
                  <div className="service-meta">
                    <span className="service-pill">{s.category}</span>
                    <span className="service-pill subtle">Validé</span>
                  </div>
                </div>
              </div>
              <ul>
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
              <p className="service-description">{s.description}</p>
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
        <div className="service-section-head">
          <div className="service-section-title">
            <h2>Mairie de Quartier</h2>
            <p className="service-section-subtitle">Horaires, services, et coordonnées pour vos démarches.</p>
          </div>
        </div>
        {cityLoading && <p>Chargement...</p>}
        {cityError && <p className="services-error">{cityError}</p>}
        {!cityLoading && !cityError && (
          <div className="service-cards">
            <div className="service-card featured">
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
          </div>
        )}
      </section>

      <section className="service-section">
        <div className="service-section-head">
          <div className="service-section-title">
            <h2>Numéros d'Urgence</h2>
            <p className="service-section-subtitle">Contacts rapides à appeler en cas de besoin.</p>
          </div>
        </div>
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
                    <span className="emergency-name">{c.name}</span>
                    <a className="emergency-number" href={`tel:${String(c.number || '').replace(/\s+/g, '')}`}>
                      {c.number}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="service-section">
        <div className="service-section-head">
          <div className="service-section-title">
            <h2>Gestion des Ordures</h2>
            <p className="service-section-subtitle">Calendrier de collecte, tri, et infos déchèterie.</p>
          </div>
        </div>
        {cityLoading && <p>Chargement...</p>}
        {cityError && <p className="services-error">{cityError}</p>}
        {!cityLoading && !cityError && (
          <div className="service-cards">
            <div className="service-card featured">
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
          </div>
        )}
      </section>
    </div>

    {showSubmitModal && (
      <div className="services-modal-overlay" onMouseDown={() => closeSubmit()}>
        <div
          ref={modalRef}
          className={`services-modal ${isDraggingModal ? 'dragging' : ''}`}
          style={{ transform: modalDragY ? `translateY(${modalDragY}px)` : undefined }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => {
            const el = modalRef.current;
            if (!el) return;
            if (el.scrollTop > 0) return;
            if (!e.touches || e.touches.length !== 1) return;
            dragActiveRef.current = true;
            dragStartYRef.current = e.touches[0].clientY;
            setIsDraggingModal(true);
          }}
          onTouchMove={(e) => {
            if (!dragActiveRef.current) return;
            if (!e.touches || e.touches.length !== 1) return;
            const delta = e.touches[0].clientY - dragStartYRef.current;
            if (delta <= 0) {
              setModalDragY(0);
              return;
            }
            setModalDragY(Math.min(delta, 320));
            e.preventDefault();
          }}
          onTouchEnd={() => {
            if (!dragActiveRef.current) return;
            dragActiveRef.current = false;
            setIsDraggingModal(false);
            if (modalDragY > 120) {
              closeSubmit();
              return;
            }
            setModalDragY(0);
          }}
        >
          <div className="services-modal-head">
            <h3>Proposer un service</h3>
            <button type="button" className="services-modal-close" onClick={() => closeSubmit()}>✕</button>
          </div>

          <p className="services-modal-sub">Votre proposition sera vérifiée par un administrateur avant publication.</p>

          <form onSubmit={handleSubmitService} className="services-modal-form">
            <div className="services-form-grid">
              <div className="services-form-row">
                <label>Nom</label>
                <input placeholder="Ex: Pharmacie Centrale" value={submitForm.name} onChange={(e) => setSubmitForm({ ...submitForm, name: e.target.value })} required />
              </div>
              <div className="services-form-row">
                <label>Catégorie</label>
                <select value={submitForm.category} onChange={(e) => setSubmitForm({ ...submitForm, category: e.target.value })}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="services-form-row">
              <label>Adresse</label>
              <input placeholder="Ex: Rue X, près du marché" value={submitForm.locationAddress} onChange={(e) => setSubmitForm({ ...submitForm, locationAddress: e.target.value })} required />
            </div>

            <div className="services-form-row">
              <label>Description</label>
              <textarea rows="3" placeholder="Que propose ce service ? Pour qui ? Horaires, infos utiles…" value={submitForm.description} onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })} required />
            </div>

            <div className="services-form-row">
              <label>Organisme / Fournisseur</label>
              <input placeholder="Ex: Mairie / Association / Boutique" value={submitForm.providerName} onChange={(e) => setSubmitForm({ ...submitForm, providerName: e.target.value })} required />
            </div>

            <button
              type="button"
              className="services-optional-toggle"
              onClick={() => setShowOptionalContact(v => !v)}
              aria-expanded={showOptionalContact}
            >
              {showOptionalContact ? 'Masquer les infos de contact' : 'Ajouter des infos de contact (optionnel)'}
            </button>

            {showOptionalContact && (
              <div className="services-optional-panel">
                <div className="services-form-grid">
                  <div className="services-form-row">
                    <label>Téléphone</label>
                    <input placeholder="Ex: 77 123 45 67" value={submitForm.providerPhone} onChange={(e) => setSubmitForm({ ...submitForm, providerPhone: e.target.value })} />
                  </div>
                  <div className="services-form-row">
                    <label>Email</label>
                    <input type="email" placeholder="Ex: contact@exemple.sn" value={submitForm.providerEmail} onChange={(e) => setSubmitForm({ ...submitForm, providerEmail: e.target.value })} />
                  </div>
                </div>
                <div className="services-form-row">
                  <label>Site web</label>
                  <input placeholder="https://" value={submitForm.providerWebsite} onChange={(e) => setSubmitForm({ ...submitForm, providerWebsite: e.target.value })} />
                </div>
              </div>
            )}

            {submitError && <div className="services-form-error">{submitError}</div>}
            {submitSuccess && <div className="services-form-success">{submitSuccess}</div>}

            <div className="services-modal-actions">
              <button type="button" className="btn-secondary" onClick={() => closeSubmit()}>Fermer</button>
              <button type="submit" className="btn-primary" disabled={submitLoading}>
                {submitLoading ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {toast.open && (
      <div className="services-toast" role="status" aria-live="polite">
        <span className="services-toast-dot" />
        <span className="services-toast-text">{toast.message}</span>
        <button type="button" className="services-toast-close" onClick={() => setToast({ open: false, message: '' })}>✕</button>
      </div>
    )}
    </>
  );
};

export default Services;
