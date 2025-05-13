import React, { useState } from 'react';
import './CreateCampaign.css';

const CreateCampaign = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal: '',
    duration: '30',
    image: null,
    paymentMethods: {
      wave: true,
      orangeMoney: true,
      paypal: true
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handlePaymentMethodChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        [name]: checked
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ici, nous ajouterons la logique pour envoyer les données au backend
    console.log('Données du formulaire:', formData);
  };

  return (
    <div className="create-campaign-container">
      <h2>Créer une Nouvelle Collecte</h2>
      <p className="subtitle">Réservé aux administrateurs et responsables d'associations reconnues</p>

      <form onSubmit={handleSubmit} className="campaign-form">
        <div className="form-group">
          <label htmlFor="title">Titre de la collecte</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Titre concis et explicite"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Décrivez l'objectif de la collecte et comment seront utilisés les fonds..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="goal">Objectif (€)</label>
          <input
            type="number"
            id="goal"
            name="goal"
            value={formData.goal}
            onChange={handleInputChange}
            placeholder="Montant à atteindre"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="image">Image d'illustration</label>
          <input
            type="file"
            id="image"
            name="image"
            onChange={handleImageChange}
            accept="image/jpeg,image/png"
          />
          <small>Format recommandé: JPG ou PNG, minimum 600x400px</small>
        </div>

        <div className="form-group">
          <label htmlFor="duration">Durée de la collecte</label>
          <select
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
          >
            <option value="30">30 jours</option>
            <option value="60">60 jours</option>
            <option value="90">90 jours</option>
          </select>
        </div>

        <div className="form-group payment-methods">
          <label>Méthodes de paiement acceptées</label>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                name="wave"
                checked={formData.paymentMethods.wave}
                onChange={handlePaymentMethodChange}
              />
              Wave
            </label>
            <label>
              <input
                type="checkbox"
                name="orangeMoney"
                checked={formData.paymentMethods.orangeMoney}
                onChange={handlePaymentMethodChange}
              />
              Orange Money
            </label>
            <label>
              <input
                type="checkbox"
                name="paypal"
                checked={formData.paymentMethods.paypal}
                onChange={handlePaymentMethodChange}
              />
              PayPal
            </label>
          </div>
        </div>

        <button type="submit" className="submit-btn">Créer la collecte</button>
      </form>
    </div>
  );
};

export default CreateCampaign;
