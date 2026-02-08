import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';

  useEffect(() => {
    const computeHeroVisible = () => {
      if (!isHome) {
        setHeroVisible(false);
        return;
      }

      const hero = document.querySelector('.hero');
      if (!hero) {
        setHeroVisible(false);
        return;
      }

      // Progression du style navbar sur le hero.
      // 0 = tout en haut (très transparent + légère teinte), 1 = fin du hero (plus sombre).
      const nav = document.querySelector('.navbar');
      if (nav) {
        const navHeight = 70;
        const heroHeight = hero.offsetHeight || window.innerHeight;
        const max = Math.max(1, heroHeight - navHeight);
        const p = clamp01(window.scrollY / max);

        // Valeurs "raisonnables" (pro):
        // - alpha sombre augmente avec p
        // - teinte verte diminue avec p
        const alpha = 0.12 + 0.68 * p; // 0.12 -> 0.80
        const tint = 0.14 * (1 - p);  // 0.14 -> 0
        nav.style.setProperty('--nav-alpha', String(alpha));
        nav.style.setProperty('--nav-tint-alpha', String(tint));
      }

      const rect = hero.getBoundingClientRect();
      // Navbar height ~60px. Tant qu'on est dans la zone hero, on garde le style "hero".
      const navHeight = 70;
      setHeroVisible(rect.bottom > navHeight);
    };

    computeHeroVisible();
    window.addEventListener('scroll', computeHeroVisible, { passive: true });
    window.addEventListener('resize', computeHeroVisible);
    return () => {
      window.removeEventListener('scroll', computeHeroVisible);
      window.removeEventListener('resize', computeHeroVisible);
    };
  }, [isHome]);

  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

  const closeMenu = () => setOpen(false);
  const onSubmit = (e) => {
    e.preventDefault();
    const q = (query || '').trim();
    if (!q) return;
    navigate(`/recherche?q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  const pathname = location.pathname || '/';
  const isForum = pathname === '/forum' || pathname.startsWith('/forum/');
  const isNews = pathname === '/actualites' || pathname.startsWith('/actualites/');
  const isProjects = pathname === '/projets' || pathname.startsWith('/projets/');

  const cta = (() => {
    if (isForum) return { label: 'Nouveau sujet', to: '/forum?compose=1' };
    if (isNews) return { label: 'Voir les annonces', to: '/actualites#news-announcements' };
    if (isProjects) return { label: 'Proposer un projet', to: '/projets#proposer' };
    return { label: 'Explorer', to: '/actualites' };
  })();

  return (
    <nav className={`navbar ${isHome && heroVisible ? 'navbar--hero' : 'navbar--solid'}`}>
      <div className="navbar-content">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="brand-text">QuartierConnect</span>
          <span className="brand-badge" aria-label="Quartier">Cité Gendarmerie</span>
        </Link>

        <button
          className="navbar-toggle"
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>

        <div className="navbar-links">
          <NavLink to="/actualites" className={({ isActive }) => `navbar-link${isActive ? ' is-active' : ''}`}>Actualités</NavLink>
          <NavLink to="/forum" className={({ isActive }) => `navbar-link${isActive ? ' is-active' : ''}`}>Forum</NavLink>
          <NavLink to="/services" className={({ isActive }) => `navbar-link${isActive ? ' is-active' : ''}`}>Services</NavLink>
          <div className={`navbar-more ${moreOpen ? 'open' : ''}`}>
            <button type="button" className="navbar-more-btn" aria-haspopup="menu" aria-expanded={moreOpen} onClick={()=>setMoreOpen(v=>!v)}>
              Plus ▾
            </button>
            <div className="navbar-more-menu" role="menu" aria-label="Plus">
              <div className="navbar-more-group" role="presentation">
                <div className="navbar-more-title">Vie du quartier</div>
                <NavLink to="/annuaire" className={({ isActive }) => `navbar-link${isActive ? ' is-active' : ''}` } role="menuitem" onClick={()=>setMoreOpen(false)}>Annuaire</NavLink>
                <NavLink to="/securite" className={({ isActive }) => `navbar-link${isActive ? ' is-active' : ''}` } role="menuitem" onClick={()=>setMoreOpen(false)}>Sécurité</NavLink>
              </div>
              <div className="navbar-more-group" role="presentation">
                <div className="navbar-more-title">Initiatives</div>
                <NavLink to="/projets" className={({ isActive }) => `navbar-link${isActive ? ' is-active' : ''}` } role="menuitem" onClick={()=>setMoreOpen(false)}>Projets</NavLink>
                <NavLink to="/dons" className={({ isActive }) => `navbar-link${isActive ? ' is-active' : ''}` } role="menuitem" onClick={()=>setMoreOpen(false)}>Dons</NavLink>
              </div>
              <div className="navbar-more-group" role="presentation">
                <div className="navbar-more-title">Médias</div>
                <NavLink to="/galerie" className={({ isActive }) => `navbar-link${isActive ? ' is-active' : ''}` } role="menuitem" onClick={()=>setMoreOpen(false)}>Galerie</NavLink>
              </div>
            </div>
          </div>
        </div>

        <div className="navbar-right">
          <button type="button" className="navbar-search" aria-label="Recherche" onClick={() => navigate('/recherche')}>
            ⌕
          </button>
          <button type="button" className="navbar-cta" onClick={() => navigate(cta.to)}>
            {cta.label}
          </button>
          <NavLink to="/espace-membres" className={({ isActive }) => `navbar-link${isActive ? ' is-active' : ''}`}>Espace Membres</NavLink>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="mobile-menu" role="dialog" aria-label="Menu">
          <form className="mobile-search" onSubmit={onSubmit} role="search" aria-label="Recherche mobile">
            <input
              type="text"
              placeholder="Rechercher..."
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              aria-label="Rechercher"
            />
          </form>
          <Link to="/actualites" className="mobile-link" onClick={closeMenu}>Actualités</Link>
          <Link to="/forum" className="mobile-link" onClick={closeMenu}>Forum</Link>
          <Link to="/services" className="mobile-link" onClick={closeMenu}>Services</Link>
          <Link to="/annuaire" className="mobile-link" onClick={closeMenu}>Annuaire</Link>
          <Link to="/securite" className="mobile-link" onClick={closeMenu}>Sécurité</Link>
          <Link to="/projets" className="mobile-link" onClick={closeMenu}>Projets</Link>
          <Link to="/dons" className="mobile-link" onClick={closeMenu}>Dons</Link>
          <Link to="/galerie" className="mobile-link" onClick={closeMenu}>Galerie</Link>
          <div className="mobile-sep" />
          <Link to="/espace-membres" className="mobile-link strong" onClick={closeMenu}>Espace Membres</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
