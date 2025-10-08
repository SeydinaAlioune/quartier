import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>QuartierConnect</h3>
          <p>Une plateforme communautaire pour améliorer la vie dans notre quartier.</p>
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
          </div>
        </div>

        <div className="footer-section">
          <h3>Liens Rapides</h3>
          <ul>
            <li><Link to="/">Accueil</Link></li>
            <li><Link to="/actualites">Actualités</Link></li>
            <li><Link to="/forum">Forum</Link></li>
            <li><Link to="/annuaire">Annuaire</Link></li>
            <li><Link to="/services">Services</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Autres Pages</h3>
          <ul>
            <li><Link to="/securite">Sécurité</Link></li>
            <li><Link to="/projets">Projets</Link></li>
            <li><Link to="/espace-membres">Espace Membres</Link></li>
            <li><Link to="/dons">Téléthon / Dons</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Contact</h3>
          <ul>
            <li>Email: contact@quartierconnect.fr</li>
            <li>Téléphone: 01 XX XX XX XX</li>
            <li>Adresse: Mairie de quartier, 123 rue Principale</li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© 2023 QuartierConnect. Tous droits réservés.</p>
        <Link to="/admin" className="admin-link">Administration</Link>
      </div>
    </footer>
  );
};

export default Footer;
