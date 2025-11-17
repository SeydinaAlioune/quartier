import React, { useEffect, useMemo, useState } from 'react';
import './Directory.css';
import api from '../../services/api';
import AnimatedSection from '../../components/AnimatedSection/AnimatedSection';

const Directory = () => {
  // Données dynamiques pour les commerçants (annuaire) depuis l'API
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/api/business');
        if (!mounted) return;
        const arr = Array.isArray(res.data?.businesses) ? res.data.businesses : [];
        setBusinesses(arr);
      } catch (e) {
        if (mounted) setError("Impossible de charger l'annuaire (commerçants).");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchBusinesses();
    return () => { mounted = false; };
  }, []);
  const [healthServices, setHealthServices] = useState([]);
  const [usefulCats, setUsefulCats] = useState([]);
  const SHOW_USEFUL_CONTACTS = false; // Masquer pour éviter le doublon avec la page Services
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  useEffect(() => {
    // Mettre à jour les services de santé à partir des commerces chargés
    setHealthServices(businesses.filter(b => b.category === 'sante'));
  }, [businesses]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let mounted = true;
    const loadUsefulContacts = async () => {
      try {
        const res = await api.get('/api/useful-contacts');
        if (!mounted) return;
        const cats = Array.isArray(res?.data?.categories) ? res.data.categories : [];
        setUsefulCats(cats);
      } catch (e) {
        // laisser la section vide en cas d'erreur
        setUsefulCats([]);
      }
    };
    if (SHOW_USEFUL_CONTACTS) loadUsefulContacts();
    return () => { mounted = false; };
  }, []);

  // Liste des villes disponibles (dérivée)
  const availableCities = useMemo(() => {
    const set = new Set();
    businesses.forEach(b => { if (b.address?.city) set.add(b.address.city); });
    return Array.from(set);
  }, [businesses]);

  // Filtrage
  const filteredBusinesses = useMemo(() => {
    let list = businesses.filter(b => b.category !== 'sante');
    if (categoryFilter !== 'all') list = list.filter(b => b.category === categoryFilter);
    if (cityFilter.trim()) list = list.filter(b => (b.address?.city || '').toLowerCase() === cityFilter.toLowerCase());
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(b => (
        (b.name || '').toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q) ||
        (b.address?.street || '').toLowerCase().includes(q) ||
        (b.address?.city || '').toLowerCase().includes(q) ||
        (b.contact?.phone || '').toLowerCase().includes(q)
      ));
    }
    return list;
  }, [businesses, categoryFilter, cityFilter, search]);

  // eslint-disable-next-line no-unused-vars
  const [activeCategory, setActiveCategory] = useState('all');
  
  // eslint-disable-next-line no-unused-vars
  const filterBusinesses = (category) => {
    setActiveCategory(category);
  };

  return (
    <>
      <header
        className="directory-header"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${process.env.PUBLIC_URL}/an.jpg)`
        }}
      >
        <h1>Annuaire Local</h1>
        <p>Découvrez les commerces, services et professionnels de votre quartier</p>
      </header>

      <div className="directory-container">

      <section className="local-businesses">
        <h2>Commerçants Locaux</h2>
        <div className="directory-filters">
          <input
            type="text"
            className="dir-search-input"
            placeholder="Rechercher (nom, adresse, téléphone)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="dir-filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">Toutes catégories</option>
            <option value="restaurant">restaurant</option>
            <option value="commerce">commerce</option>
            <option value="service">service</option>
            <option value="education">education</option>
            <option value="artisan">artisan</option>
            <option value="autre">autre</option>
          </select>
          <select className="dir-filter-select" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
            <option value="">Toutes les villes</option>
            {availableCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        {loading && <p>Chargement de l'annuaire...</p>}
        {!loading && error && <p className="directory-error">{error}</p>}
        {!loading && !error && filteredBusinesses.length === 0 && (
          <p>Aucun commerce pour le moment. Un administrateur pourra en ajouter prochainement.</p>
        )}
        <div className="business-grid">
          {filteredBusinesses.map((business, idx) => (
            <AnimatedSection key={business._id} delay={idx % 4} animation="fade-up">
              <div className="business-card">
              <h3>{business.name}</h3>
              <p className="address">
                {business.address?.street || ''}
                {business.address?.city ? `, ${business.address.city}` : ''}
              </p>
              <p className="phone"> {business.contact?.phone || '—'}</p>
              {business.contact?.email && (
                <p className="phone">{business.contact.email}</p>
              )}
              {business.contact?.website && (
                <p className="phone"><a href={business.contact.website} target="_blank" rel="noreferrer">{business.contact.website}</a></p>
              )}
              <p className="description">{business.description}</p>
            </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      <section className="health-services">
        <h2>Services de Santé</h2>
        <div className="business-grid">
          {healthServices.map((service, idx) => (
            <AnimatedSection key={service._id} delay={idx % 4} animation="slide-left">
              <div className="business-card">
              <h3>{service.name}</h3>
              <p className="address">{service.address?.street || ''}{service.address?.city ? `, ${service.address.city}` : ''}</p>
              <p className="phone">{service.contact?.phone || '—'}</p>
              <p className="description">{service.description}</p>
            </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {SHOW_USEFUL_CONTACTS && (
        <section className="useful-contacts">
          <h2>Contacts Utiles</h2>
          <div className="contacts-grid">
            {usefulCats.map(cat => (
              <div key={cat._id} className="contact-category">
                <h3>{cat.title}</h3>
                <ul>
                  {(cat.contacts || []).map(c => (
                    <li key={c._id}>
                      <span className="contact-name">{c.name}:</span>
                      <span className="contact-number">{c.number}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
    </>
  );
};

export default Directory;
