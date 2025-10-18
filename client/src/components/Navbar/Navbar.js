import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => setOpen(false);
  const onSubmit = (e) => {
    e.preventDefault();
    const q = (query || '').trim();
    if (!q) return;
    navigate(`/recherche?q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  return (
    <nav className="navbar">
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
          <Link to="/actualites" className="navbar-link">Actualités</Link>
          <Link to="/forum" className="navbar-link">Forum</Link>
          <Link to="/annuaire" className="navbar-link">Annuaire</Link>
          <Link to="/services" className="navbar-link">Services</Link>
          <div className={`navbar-more ${moreOpen ? 'open' : ''}`}>
            <button type="button" className="navbar-more-btn" aria-haspopup="menu" aria-expanded={moreOpen} onClick={()=>setMoreOpen(v=>!v)}>
              Plus ▾
            </button>
            <div className="navbar-more-menu" role="menu" aria-label="Plus">
              <Link to="/securite" className="navbar-link" role="menuitem" onClick={()=>setMoreOpen(false)}>Sécurité</Link>
              <Link to="/projets" className="navbar-link" role="menuitem" onClick={()=>setMoreOpen(false)}>Projets</Link>
              <Link to="/galerie" className="navbar-link" role="menuitem" onClick={()=>setMoreOpen(false)}>Galerie</Link>
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
          <Link to="/espace-membres" className="navbar-link">Espace Membres</Link>
          <Link to="/dons" className="navbar-link">Téléthon / Dons</Link>
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
