import React from 'react';
import './Forum.css';

const BoiteIdees = () => {
  const idees = [
    {
      id: 1,
      titre: "Installation de bancs publics",
      auteur: "Laurent S.",
      date: "Il y a 2 semaines",
      description: "Il serait pratique d'installer des bancs supplémentaires le long du parcours santé pour les personnes âgées.",
      votes: 24
    },
    {
      id: 2,
      titre: "Atelier réparation vélos",
      auteur: "Sophie T.",
      date: "Il y a 3 semaines",
      description: "Organiser un atelier mensuel d'entraide pour réparer les vélos dans le local communautaire.",
      votes: 18
    },
    {
      id: 3,
      titre: "Verger communautaire",
      auteur: "Marc D.",
      date: "Il y a 1 mois",
      description: "Transformer le terrain vague derrière l'école en verger communautaire avec des arbres fruitiers.",
      votes: 42
    }
  ];

  return (
    <section className="boite-idees-section">
      <h2>Boîte à Idées</h2>
      <div className="idees-grid">
        {idees.map(idee => (
          <div key={idee.id} className="idee-card">
            <h3>{idee.titre}</h3>
            <p className="idee-meta">
              Proposée par {idee.auteur} - {idee.date}
            </p>
            <p className="idee-description">{idee.description}</p>
            <div className="idee-votes">
              <button className="vote-btn">
                <i className="fas fa-thumbs-up"></i>
              </button>
              <span>{idee.votes} votes</span>
            </div>
          </div>
        ))}
      </div>
      <button className="new-idee-btn">
        <i className="fas fa-lightbulb"></i> Proposer une idée
      </button>
    </section>
  );
};

export default BoiteIdees;
