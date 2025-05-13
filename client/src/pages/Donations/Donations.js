// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import './Donations.css';

const Donations = () => {
  // eslint-disable-next-line no-unused-vars
  const [currentCampaigns, setCurrentCampaigns] = useState([
    {
      id: 1,
      title: 'Téléthon 2023',
      description: 'Participez à la grande collecte annuelle pour soutenir la recherche sur les maladies génétiques rares.',
      collected: 3750,
      goal: 5000,
      image: '/images/residence.png'
    },
    {
      id: 2,
      title: 'Rénovation de l\'aire de jeux',
      description: 'Aidez-nous à financer la rénovation de l\'aire de jeux du parc central pour offrir un espace sûr et agréable aux enfants du quartier.',
      collected: 1200,
      goal: 3000,
      image: '/images/Cyclables.png'
    }
  ]);

  // eslint-disable-next-line no-unused-vars
  const [completedCampaigns, setCompletedCampaigns] = useState([
    {
      id: 3,
      title: 'Réaménagement du jardin partagé',
      description: 'Grâce à votre générosité, le jardin partagé a été entièrement réaménagé.',
      collected: 4500,
      goal: 4000,
      period: 'Janvier - Mars 2023'
    }
  ]);

  const calculateProgress = (collected, goal) => {
    return (collected / goal) * 100;
  };

  return (
    <div className="donations-container">
      <header className="donations-header">
        <h1>Téléthon & Collectes Solidaires</h1>
        <p>Soutenez les causes qui nous tiennent à cœur et participez à l'entraide au sein de notre quartier</p>
      </header>

      <section className="current-campaigns">
        <h2>Collectes en Cours</h2>
        <div className="campaigns-grid">
          {currentCampaigns.map(campaign => (
            <div key={campaign.id} className="campaign-card">
              <img src={campaign.image} alt={campaign.title} />
              <h3>{campaign.title}</h3>
              <p>{campaign.description}</p>
              <div className="progress-container">
                <div 
                  className="progress-bar"
                  style={{ width: `${calculateProgress(campaign.collected, campaign.goal)}%` }}
                ></div>
              </div>
              <div className="campaign-stats">
                <span>{campaign.collected}€ collectés</span>
                <span>Objectif: {campaign.goal}€</span>
              </div>
              <div className="payment-methods">
                <button className="payment-btn wave">Wave</button>
                <button className="payment-btn orange">Orange Money</button>
                <button className="payment-btn paypal">PayPal</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="completed-campaigns">
        <h2>Collectes Réussies</h2>
        <div className="campaigns-grid">
          {completedCampaigns.map(campaign => (
            <div key={campaign.id} className="campaign-card completed">
              <h3>{campaign.title}</h3>
              <p>{campaign.description}</p>
              <div className="campaign-stats">
                <span>Montant collecté: {campaign.collected}€</span>
                <span>Objectif initial: {campaign.goal}€</span>
                <span>Période: {campaign.period}</span>
              </div>
              <button className="view-details">Voir les détails</button>
            </div>
          ))}
        </div>
      </section>

      <section className="create-campaign">
        <h2>Créer une Nouvelle Collecte</h2>
        <p>Réservé aux administrateurs et responsables d'associations reconnues</p>
        <button className="create-btn">Créer une collecte</button>
      </section>

      <section className="donations-footer">
        <h2>Ensemble, nous pouvons faire la différence</h2>
        <p>Chaque don, même modeste, contribue à améliorer la vie dans notre quartier et à soutenir ceux qui en ont besoin.</p>
        <button className="donate-now-btn">Faire un don maintenant</button>
      </section>
    </div>
  );
};

export default Donations;
