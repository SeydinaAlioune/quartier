import React, { useState } from 'react';
import './ReportIncident.css';

const ReportIncident = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    type: '',
    location: '',
    description: '',
    date: '',
    time: '',
    contact: '',
    anonymous: false,
    files: [],
    coords: { lat: '', lng: '' },
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

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, files }));
  };

  const handleCoordsChange = (e) => {
    const { name, value } = e.target; // name = lat | lng
    setFormData(prev => ({ ...prev, coords: { ...prev.coords, [name]: value } }));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData(prev => ({ ...prev, coords: { lat: latitude, lng: longitude } }));
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Retourner les données au parent pour un ajout local
    try {
      if (onSubmit) {
        onSubmit({ ...formData });
      }
    } finally {
      onClose();
    }
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

          <div className="form-group">
            <label>Pièces jointes (photos)</label>
            <input type="file" accept="image/*" multiple onChange={handleFilesChange} />
          </div>

          <div className="form-group">
            <label>Localisation GPS (optionnel)</label>
            <div className="form-row">
              <input type="text" name="lat" placeholder="Latitude" value={formData.coords.lat} onChange={handleCoordsChange} />
              <input type="text" name="lng" placeholder="Longitude" value={formData.coords.lng} onChange={handleCoordsChange} />
            </div>
            <div style={{marginTop: '.5rem'}}>
              <button type="button" className="cancel-button" onClick={handleUseMyLocation}>Utiliser ma position</button>
            </div>
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
