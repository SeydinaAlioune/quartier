import React from 'react';
import './Forum.css';

const Annonces = () => {
  const annonces = {
    vends: [
      { id: 1, titre: "Canapé d'angle en cuir noir", description: "excellent état", prix: "300€" },
      { id: 2, titre: "Table basse en verre et bois", description: "", prix: "50€" },
      { id: 3, titre: "Vélo enfant 6-8 ans", description: "", prix: "40€" },
      { id: 4, titre: "Livres de cuisine", description: "lot de 10", prix: "25€" }
    ],
    recherche: [
      { id: 1, titre: "Professeur de guitare", description: "pour enfant débutant" },
      { id: 2, titre: "Petite étagère murale", description: "pour cuisine" },
      { id: 3, titre: "Covoiturage quotidien", description: "vers la gare centrale" },
      { id: 4, titre: "Jardinier", description: "pour entretien ponctuel" }
    ],
    services: [
      { id: 1, titre: "Cours d'anglais", description: "pour tous niveaux" },
      { id: 2, titre: "Aide aux devoirs", description: "collège/lycée" },
      { id: 3, titre: "Petit bricolage", description: "à domicile" },
      { id: 4, titre: "Garde d'animaux", description: "pendant les vacances" }
    ]
  };

  return (
    <section className="annonces-section">
      <h2>Petites Annonces</h2>
      <div className="annonces-grid">
        <div className="annonce-category">
          <h3><i className="fas fa-tag"></i> Vends</h3>
          <ul>
            {annonces.vends.map(item => (
              <li key={item.id}>
                {item.titre}, {item.description && `${item.description}, `}{item.prix}
              </li>
            ))}
          </ul>
        </div>

        <div className="annonce-category">
          <h3><i className="fas fa-search"></i> Recherche</h3>
          <ul>
            {annonces.recherche.map(item => (
              <li key={item.id}>
                {item.titre} {item.description && `- ${item.description}`}
              </li>
            ))}
          </ul>
        </div>

        <div className="annonce-category">
          <h3><i className="fas fa-hands-helping"></i> Services</h3>
          <ul>
            {annonces.services.map(item => (
              <li key={item.id}>
                {item.titre} {item.description && `- ${item.description}`}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button className="new-annonce-btn">
        <i className="fas fa-plus"></i> Publier une annonce
      </button>
    </section>
  );
};

export default Annonces;
