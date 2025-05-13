import React, { useState } from 'react';
import './ReportIncident.css';

const ReportIncident = ({ onClose }) => {
  const [formData, setFormData] = useState({
    type: '',
    location: '',
    description: '',
    date: '',
    time: '',
    contact: '',
    anonymous: false
  });

  const incidentTypes = [
    'Cambriolage',
    'Vandalisme',
    'Agression',
    'Comportement suspect',
    'Nuisance sonore',
    'Problème de circulation',
    'Autre'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ici nous ajouterons la logique pour envoyer le rapport
    console.log('Rapport d\'incident:', formData);
    onClose();
  };

  return (
    <div className="report-modal">
      <div className="report-modal-content">
        <button className="close-button" onClick={onClose}>&times;</button>
        <h2>Signaler un Incident</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="type">Type d'incident *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
            >
              <option value="">Sélectionnez le type d'incident</option>
              {incidentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="location">Localisation *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Adresse ou lieu de l'incident"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="time">Heure</label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description détaillée *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Décrivez l'incident avec le plus de détails possible"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact">Contact</label>
            <input
              type="text"
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleInputChange}
              placeholder="Votre numéro de téléphone ou email"
            />
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="anonymous"
                checked={formData.anonymous}
                onChange={handleInputChange}
              />
              Je souhaite rester anonyme
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="submit-button">
              Envoyer le rapport
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIncident;
