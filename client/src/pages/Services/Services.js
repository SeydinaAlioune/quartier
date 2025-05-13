import React from 'react';
import './Services.css';

const Services = () => {
  return (
    <div className="services-page">
      <header className="services-header">
        <h1>Services du Quartier</h1>
        <p>Découvrez tous les services disponibles pour faciliter votre quotidien</p>
      </header>

      <section className="service-section">
        <h2>Mairie de Quartier</h2>
        <div className="service-cards">
          <div className="service-card">
            <div className="card-header">
              <i className="far fa-clock"></i>
              <h3>Horaires d'ouverture</h3>
            </div>
            <ul>
              <li>Lundi: 9h - 17h</li>
              <li>Mardi: 9h - 17h</li>
              <li>Mercredi: 9h - 17h</li>
              <li>Jeudi: 9h - 19h (nocturne)</li>
              <li>Vendredi: 9h - 16h</li>
              <li>Samedi: 9h - 12h (1er et 3ème du mois)</li>
            </ul>
          </div>

          <div className="service-card">
            <div className="card-header">
              <i className="fas fa-list-ul"></i>
              <h3>Services proposés</h3>
            </div>
            <ul>
              <li>Démarches administratives</li>
              <li>État civil (naissances, mariages, décès)</li>
              <li>Inscriptions scolaires</li>
              <li>Urbanisme et logement</li>
              <li>Aide sociale (CCAS)</li>
            </ul>
          </div>

          <div className="service-card">
            <div className="card-header">
              <i className="fas fa-map-marker-alt"></i>
              <h3>Coordonnées</h3>
            </div>
            <div className="contact-info">
              <p>Adresse: 123 rue Principale</p>
              <p>Téléphone: 01 XX XX XX XX</p>
              <p>Email: mairie-quartier@ville.fr</p>
              <button className="btn-primary">Prendre rendez-vous</button>
            </div>
          </div>
        </div>
      </section>

      <section className="service-section">
        <h2>Numéros d'Urgence</h2>
        <div className="service-cards">
          <div className="service-card">
            <div className="card-header">
              <i className="fas fa-ambulance"></i>
              <h3>Services d'Urgence</h3>
            </div>
            <ul className="emergency-list">
              <li><strong>SAMU:</strong> 15</li>
              <li><strong>Police:</strong> 17</li>
              <li><strong>Pompiers:</strong> 18</li>
              <li><strong>Numéro d'urgence européen:</strong> 112</li>
              <li><strong>Personnes sourdes et malentendantes:</strong> 114 (SMS)</li>
            </ul>
          </div>

          <div className="service-card">
            <div className="card-header">
              <i className="fas fa-user-md"></i>
              <h3>Services Médicaux</h3>
            </div>
            <ul className="emergency-list">
              <li><strong>Centre antipoison:</strong> 01 XX XX XX XX</li>
              <li><strong>SOS Médecins:</strong> 36 24</li>
              <li><strong>Médecin de garde:</strong> 01 XX XX XX XX</li>
              <li><strong>Pharmacie de garde:</strong> 32 37</li>
            </ul>
          </div>

          <div className="service-card">
            <div className="card-header">
              <i className="fas fa-exclamation-triangle"></i>
              <h3>Autres Urgences</h3>
            </div>
            <ul className="emergency-list">
              <li><strong>EDF (coupure électricité):</strong> 09 XX XX XX XX</li>
              <li><strong>GDF (fuite de gaz):</strong> 08 XX XX XX XX</li>
              <li><strong>Service des eaux (fuite):</strong> 09 XX XX XX XX</li>
              <li><strong>Fourrière:</strong> 01 XX XX XX XX</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="service-section">
        <h2>Gestion des Ordures</h2>
        <div className="service-cards">
          <div className="service-card">
            <div className="card-header">
              <i className="fas fa-calendar-alt"></i>
              <h3>Jours de collecte</h3>
            </div>
            <ul>
              <li>Ordures ménagères: Lundi et Jeudi</li>
              <li>Recyclables: Mercredi</li>
              <li>Déchets verts: Mardi (Avril à Novembre)</li>
              <li>Encombrants: 1er vendredi du mois</li>
            </ul>
          </div>

          <div className="service-card">
            <div className="card-header">
              <i className="fas fa-recycle"></i>
              <h3>Tri des déchets</h3>
            </div>
            <ul>
              <li>Bac gris: déchets non recyclables</li>
              <li>Bac jaune: papier, carton, plastique, métal</li>
              <li>Bac vert: verre</li>
              <li>Bac marron: déchets biodégradables</li>
            </ul>
          </div>

          <div className="service-card">
            <div className="card-header">
              <i className="fas fa-trash"></i>
              <h3>Déchèterie</h3>
            </div>
            <div className="contact-info">
              <p><strong>Adresse:</strong> Zone industrielle, Route de la Forêt</p>
              <p><strong>Horaires:</strong> Du lundi au samedi de 9h à 18h, Dimanche de 9h à 12h</p>
              <p><strong>Contact:</strong> 01 XX XX XX XX</p>
              <button className="btn-secondary">Plus d'infos</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
