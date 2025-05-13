import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          QuartierConnect
        </Link>
        
        <div className="navbar-links">
          <Link to="/actualites" className="navbar-link">Actualités</Link>
          <Link to="/forum" className="navbar-link">Forum</Link>
          <Link to="/annuaire" className="navbar-link">Annuaire</Link>
          <Link to="/services" className="navbar-link">Services</Link>
          <Link to="/securite" className="navbar-link">Sécurité</Link>
          <Link to="/projets" className="navbar-link">Projets</Link>
        </div>

        <div className="navbar-right">
          <div className="search-box">
            <input type="text" placeholder="Rechercher..." />
          </div>
          <Link to="/espace-membres" className="navbar-link">Espace Membres</Link>
          <Link to="/dons" className="navbar-link">Téléthon / Dons</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
