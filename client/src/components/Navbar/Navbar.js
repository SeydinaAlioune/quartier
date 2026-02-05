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

  const closeMenu = () => setOpen(false);
  const onSubmit = (e) => {
    e.preventDefault();
    const q = (query || '').trim();
    if (!q) return;
    navigate(`/recherche?q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  return (
    <nav className={`navbar ${isHome && heroVisible ? 'navbar--hero' : 'navbar--solid'}`}>
      <div className="navbar-content">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="brand-text">QuartierConnect</span>
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
          <NavLink to="/annuaire" className={({ isActive }) => `navbar-link${isActive ? ' is-active' : ''}`}>Annuaire</NavLink>
          <NavLink to="/services" className={({ isActive }) => `navbar-link${isActive ? ' is-active' : ''}`}>Services</NavLink>
          <div className={`navbar-more ${moreOpen ? 'open' : ''}`}>
            <button type="button" className="navbar-more-btn" aria-haspopup="menu" aria-expanded={moreOpen} onClick={()=>setMoreOpen(v=>!v)}>
              Plus ▾
            </button>
            <div className="navbar-more-menu" role="menu" aria-label="Plus">
              <NavLink to="/securite" className={({ isActive }) => `navbar-link${isActive ? ' is-active' : ''}` } role="menuitem" onClick={()=>setMoreOpen(false)}>Sécurité</NavLink>
              <NavLink to="/projets" className={({ isActive }) => `navbar-link${isActive ? ' is-active' : ''}` } role="menuitem" onClick={()=>setMoreOpen(false)}>Projets</NavLink>
              <NavLink to="/galerie" className={({ isActive }) => `navbar-link${isActive ? ' is-active' : ''}` } role="menuitem" onClick={()=>setMoreOpen(false)}>Galerie</NavLink>
            </div>
          </div>
        </div>

        <div className="navbar-right">
          <form className="search-box" onSubmit={onSubmit} role="search" aria-label="Recherche">
            <input
              type="text"
              placeholder="Rechercher..."
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              aria-label="Rechercher"
            />
          </form>
          <NavLink to="/espace-membres" className={({ isActive }) => `navbar-link${isActive ? ' is-active' : ''}`}>Espace Membres</NavLink>
          <NavLink to="/dons" className={({ isActive }) => `navbar-link${isActive ? ' is-active' : ''}`}>Téléthon / Dons</NavLink>
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
          <Link to="/annuaire" className="mobile-link" onClick={closeMenu}>Annuaire</Link>
          <Link to="/services" className="mobile-link" onClick={closeMenu}>Services</Link>
          <Link to="/securite" className="mobile-link" onClick={closeMenu}>Sécurité</Link>
          <Link to="/projets" className="mobile-link" onClick={closeMenu}>Projets</Link>
          <Link to="/galerie" className="mobile-link" onClick={closeMenu}>Galerie</Link>
          <div className="mobile-sep" />
          <Link to="/espace-membres" className="mobile-link strong" onClick={closeMenu}>Espace Membres</Link>
          <Link to="/dons" className="mobile-link strong" onClick={closeMenu}>Téléthon / Dons</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
