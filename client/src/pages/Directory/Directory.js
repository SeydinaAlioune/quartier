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
  const [usefulCats, setUsefulCats] = useState([]);
  const SHOW_USEFUL_CONTACTS = false; // Masquer pour éviter le doublon avec la page Services
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [landmark, setLandmark] = useState('');

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
  }, [SHOW_USEFUL_CONTACTS]);

  // Liste des villes disponibles (dérivée)
  const availableCities = useMemo(() => {
    const set = new Set();
    businesses.forEach(b => { if (b.address?.city) set.add(b.address.city); });
    return Array.from(set);
  }, [businesses]);

  const availableCategories = useMemo(() => {
    const set = new Set();
    businesses.forEach(b => {
      if (b.category && b.category !== 'sante') set.add(b.category);
    });
    return Array.from(set);
  }, [businesses]);

  // Filtrage
  const filteredBusinesses = useMemo(() => {
    let list = businesses.filter(b => b.category !== 'sante');
    if (categoryFilter !== 'all') list = list.filter(b => b.category === categoryFilter);
    if (cityFilter.trim()) list = list.filter(b => (b.address?.city || '').toLowerCase() === cityFilter.toLowerCase());
    const q = search.trim().toLowerCase();
    const lm = landmark.trim().toLowerCase();
    const q2 = [q, lm].filter(Boolean).join(' ').trim();
    if (q2) {
      list = list.filter(b => {
        const hay = [
          b.name,
          b.description,
          b.address?.street,
          b.address?.city,
          b.contact?.phone,
          b.contact?.email,
          b.contact?.website,
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q2) || hay.includes(q) || hay.includes(lm);
      });
    }
    return list;
  }, [businesses, categoryFilter, cityFilter, search, landmark]);

  const filteredHealthServices = useMemo(() => {
    let list = businesses.filter(b => b.category === 'sante');
    if (cityFilter.trim()) list = list.filter(b => (b.address?.city || '').toLowerCase() === cityFilter.toLowerCase());
    const q = search.trim().toLowerCase();
    const lm = landmark.trim().toLowerCase();
    const q2 = [q, lm].filter(Boolean).join(' ').trim();
    if (q2) {
      list = list.filter(b => {
        const hay = [
          b.name,
          b.description,
          b.address?.street,
          b.address?.city,
          b.contact?.phone,
          b.contact?.email,
          b.contact?.website,
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q2) || hay.includes(q) || hay.includes(lm);
      });
    }
    return list;
  }, [businesses, cityFilter, search, landmark]);

  const featuredBusinesses = useMemo(() => {
    const list = businesses.filter(b => b.category !== 'sante');
    return list.slice(0, 3);
  }, [businesses]);

  const heroStats = useMemo(() => {
    const count = businesses.length;
    const cats = new Set();
    businesses.forEach(b => { if (b.category) cats.add(b.category); });
    const catCount = cats.size;
    return { count, catCount };
  }, [businesses]);

  const scrollToResults = () => {
    const el = document.getElementById('directory-search');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setCityFilter('');
    setLandmark('');
  };

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
          backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${process.env.PUBLIC_URL}/an.jpg)`
        }}
      >
        <div className="directory-hero-inner">
          <p className="directory-hero-kicker">Cité Gendarmerie</p>
          <h1>Annuaire du quartier</h1>
          <p className="directory-hero-lead">Commerces, artisans et services de proximité — trouvez vite, contactez direct.</p>
          <div className="directory-hero-actions">
            <button type="button" className="directory-hero-btn" onClick={scrollToResults}>Trouver un commerce</button>
          </div>
          <div className="directory-hero-stats" aria-label="Résumé de l'annuaire">
            <div className="directory-stat"><span className="v">{heroStats.count}</span><span className="l">adresses</span></div>
            <div className="directory-stat"><span className="v">{heroStats.catCount}</span><span className="l">catégories</span></div>
            <div className="directory-stat"><span className="v">Récent</span><span className="l">mise à jour</span></div>
          </div>
        </div>
      </header>

      <div className="directory-container">
      <p className="page-intro">Le guide local de Cité Gendarmerie. Astuce: tape un nom, une rue ou un numéro pour aller vite.</p>

      <div className="directory-landmarks" aria-label="Repères du quartier">
        <button type="button" className={`directory-chip ${landmark === 'mairie' ? 'active' : ''}`} onClick={() => setLandmark(v => (v === 'mairie' ? '' : 'mairie'))}>Mairie</button>
        <button type="button" className={`directory-chip ${landmark === 'marche' ? 'active' : ''}`} onClick={() => setLandmark(v => (v === 'marche' ? '' : 'marche'))}>Marché</button>
        <button type="button" className={`directory-chip ${landmark === 'ecole' ? 'active' : ''}`} onClick={() => setLandmark(v => (v === 'ecole' ? '' : 'ecole'))}>École</button>
        <button type="button" className={`directory-chip ${landmark === 'mosquee' ? 'active' : ''}`} onClick={() => setLandmark(v => (v === 'mosquee' ? '' : 'mosquee'))}>Mosquée</button>
      </div>

      <section className="directory-search" id="directory-search">
        <div className="directory-section-head">
          <div className="directory-section-title">
            <h2>Rechercher</h2>
            <p className="directory-section-sub">Filtre par catégorie, ville ou repère — puis contacte en 1 clic.</p>
          </div>
          <div className="directory-section-meta">
            <span className="directory-results">{activeTab === 'sante' ? filteredHealthServices.length : filteredBusinesses.length} résultats</span>
            <button type="button" className="directory-reset" onClick={resetFilters} disabled={!search && categoryFilter === 'all' && !cityFilter && !landmark}>Réinitialiser</button>
          </div>
        </div>

        <div className="directory-toolbar">
          <div className="directory-controls">
            <div className="directory-control">
              <label>Recherche</label>
              <input
                type="text"
                className="dir-search-input"
                placeholder="Nom, rue, numéro…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="directory-control">
              <label>Catégorie</label>
              <select className="dir-filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} disabled={activeTab === 'sante'}>
                <option value="all">Toutes</option>
                {availableCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="directory-control">
              <label>Ville</label>
              <select className="dir-filter-select" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
                <option value="">Toutes</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="directory-tabs" role="tablist" aria-label="Sections de l'annuaire">
          <button type="button" role="tab" aria-selected={activeTab === 'all'} className={`directory-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>Tous</button>
          <button type="button" role="tab" aria-selected={activeTab === 'sante'} className={`directory-tab ${activeTab === 'sante' ? 'active' : ''}`} onClick={() => setActiveTab('sante')}>Santé</button>
        </div>
      </section>

      {!loading && !error && featuredBusinesses.length > 0 && (
        <section className="directory-featured" aria-label="Mis en avant">
          <div className="directory-section-head">
            <div className="directory-section-title">
              <h2>Mis en avant cette semaine</h2>
              <p className="directory-section-sub">Quelques adresses utiles à garder sous la main.</p>
            </div>
          </div>
          <div className="directory-featured-grid">
            {featuredBusinesses.map((b) => (
              <div key={b._id || b.name} className="directory-featured-card">
                <div className="directory-card-top">
                  <div className="directory-card-title">{b.name}</div>
                  {b.category && <span className="directory-pill">{b.category}</span>}
                </div>
                <div className="directory-card-meta">
                  {b.address?.street || ''}{b.address?.city ? `, ${b.address.city}` : ''}
                </div>
                <div className="directory-card-actions">
                  {b.contact?.phone ? (
                    <a className="directory-action primary" href={`tel:${String(b.contact.phone).replace(/\s+/g, '')}`}>Appeler</a>
                  ) : (
                    <span className="directory-action disabled">Appeler</span>
                  )}
                  {b.contact?.website ? (
                    <a className="directory-action" href={b.contact.website} target="_blank" rel="noreferrer">Site</a>
                  ) : (
                    <span className="directory-action disabled">Site</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="local-businesses">
        <div className="directory-section-head">
          <div className="directory-section-title">
            <h2>{activeTab === 'sante' ? 'Services de Santé' : 'Commerçants & services'}</h2>
            <p className="directory-section-sub">{activeTab === 'sante' ? 'Médecins, pharmacies, urgences de proximité.' : 'Tape un nom, une rue ou un numéro.'}</p>
          </div>
        </div>
        {loading && <p>Chargement de l'annuaire...</p>}
        {!loading && error && <p className="directory-error">{error}</p>}
        {!loading && !error && activeTab === 'all' && filteredBusinesses.length === 0 && (
          <div className="directory-empty">
            <div className="directory-empty-title">Aucune adresse trouvée</div>
            <div className="directory-empty-sub">Essaie un autre mot-clé ou réinitialise les filtres.</div>
            <button type="button" className="directory-empty-cta" onClick={resetFilters}>Réinitialiser</button>
          </div>
        )}
        {!loading && !error && activeTab === 'sante' && filteredHealthServices.length === 0 && (
          <div className="directory-empty">
            <div className="directory-empty-title">Aucun service de santé</div>
            <div className="directory-empty-sub">Aucun résultat avec les filtres actuels.</div>
            <button type="button" className="directory-empty-cta" onClick={resetFilters}>Réinitialiser</button>
          </div>
        )}

        <div className="business-grid">
          {(activeTab === 'sante' ? filteredHealthServices : filteredBusinesses).map((business, idx) => (
            <AnimatedSection key={business._id} delay={idx % 4} animation="fade-up">
              <div className="business-card premium">
                <div className="business-card-head">
                  <div className="business-card-title">{business.name}</div>
                  <div className="business-card-tags">
                    {business.category && <span className="directory-pill">{business.category}</span>}
                    {activeTab === 'sante' && <span className="directory-pill subtle">Santé</span>}
                  </div>
                </div>

                <div className="business-card-meta">
                  <div className="business-meta-line">{business.address?.street || ''}{business.address?.city ? `, ${business.address.city}` : ''}</div>
                  {business.contact?.phone && <div className="business-meta-line">{business.contact.phone}</div>}
                </div>

                <div className="business-card-actions">
                  {business.contact?.phone ? (
                    <a className="directory-action primary" href={`tel:${String(business.contact.phone).replace(/\s+/g, '')}`}>Appeler</a>
                  ) : (
                    <span className="directory-action disabled">Appeler</span>
                  )}
                  {business.contact?.email ? (
                    <a className="directory-action" href={`mailto:${business.contact.email}`}>Email</a>
                  ) : (
                    <span className="directory-action disabled">Email</span>
                  )}
                  {business.contact?.website ? (
                    <a className="directory-action" href={business.contact.website} target="_blank" rel="noreferrer">Site</a>
                  ) : (
                    <span className="directory-action disabled">Site</span>
                  )}
                </div>

                {business.description && <p className="description">{business.description}</p>}
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      <section className="directory-callout" aria-label="Proposer une adresse">
        <div className="directory-callout-inner">
          <div className="directory-callout-title">Tu connais un commerce à ajouter ?</div>
          <div className="directory-callout-sub">Aide le quartier: propose une adresse, on l'ajoutera à l'annuaire.</div>
          <button type="button" className="directory-callout-cta" onClick={scrollToResults}>Proposer un commerce</button>
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
