import React, { useState } from 'react';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import './AdminSecurity.css';

const AdminSecurity = () => {
  const [activeTab, setActiveTab] = useState('alertes');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const alerts = [
    {
      id: 1,
      type: 'Cambriolage',
      message: 'Plusieurs cambriolages signalés dans le secteur nord',
      date: '2023-11-18',
      severity: 'high',
      zone: 'Nord'
    },
    {
      id: 2,
      type: 'Circulation',
      message: 'Travaux rue des Tilleuls - Circulation difficile',
      date: '2023-11-20',
      severity: 'medium',
      zone: 'Centre'
    }
  ];

  const [incidents, setIncidents] = useState([
    {
      id: 1,
      type: 'vandalisme',
      date: '2023-11-15',
      status: 'en_cours',
      description: 'Tags sur le mur de l\'école',
      reporter: 'Jean Dupont'
    }
  ]);

  const [selectedTab, setSelectedTab] = useState('alerts');

  const handleAddAlert = () => {
    // TODO: Implémenter l'ajout d'alerte
  };

  const handleDeleteAlert = (id) => {
    // TODO: Implémenter la suppression d'alerte
  };

  const handleUpdateIncidentStatus = (id, newStatus) => {
    setIncidents(incidents.map(incident => 
      incident.id === id ? { ...incident, status: newStatus } : incident
    ));
  };

  return (
    <div className="admin-page">
      <AdminSidebar isCollapsed={isCollapsed} />
      <div className="admin-security">
        <div className="dashboard-header">
          <div className="header-left">
            <button className="toggle-sidebar-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
              {isCollapsed ? '☰' : '✕'}
            </button>
            <h1>Gestion de la Sécurité</h1>
          </div>
          <div className="admin-profile">
            <span className="notification-badge">2</span>
            <span className="admin-name">Mohammed Diallo</span>
            <span className="admin-role">Administrateur</span>
          </div>
        </div>

      <div className="security-tabs">
        <button
          className={`tab-btn ${activeTab === 'alertes' ? 'active' : ''}`}
          onClick={() => setActiveTab('alertes')}
        >
          Alertes
        </button>
        <button
          className={`tab-btn ${activeTab === 'incidents' ? 'active' : ''}`}
          onClick={() => setActiveTab('incidents')}
        >
          Incidents
        </button>
      </div>

      {activeTab === 'alertes' && (
        <div className="alerts-section">
          <div className="section-header">
            <h3>Alertes de Sécurité</h3>
            <button className="add-btn" onClick={handleAddAlert}>Nouvelle Alerte</button>
          </div>
          <div className="alerts-list">
            {alerts.map(alert => (
              <div key={alert.id} className={`alert-card severity-${alert.severity}`}>
                <div className="alert-header">
                  <span className="alert-type">{alert.type}</span>
                  <span className="alert-date">{new Date(alert.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="alert-content">
                  <p className="alert-message">{alert.message}</p>
                  <span className="alert-zone">Zone: {alert.zone}</span>
                </div>
                <div className="alert-actions">
                  <button className="edit-btn">Modifier</button>
                  <button className="delete-btn" onClick={() => handleDeleteAlert(alert.id)}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTab === 'incidents' && (
        <div className="incidents-section">
          <div className="section-header">
            <h3>Incidents Signalés</h3>
          </div>
          <div className="incidents-list">
            {incidents.map(incident => (
              <div key={incident.id} className="incident-card">
                <div className="incident-header">
                  <span className="incident-type">{incident.type}</span>
                  <span className="incident-date">{incident.date}</span>
                </div>
                <div className="incident-content">
                  <p className="incident-description">{incident.description}</p>
                  <span className="incident-reporter">Signalé par: {incident.reporter}</span>
                </div>
                <div className="incident-status">
                  <select 
                    value={incident.status}
                    onChange={(e) => handleUpdateIncidentStatus(incident.id, e.target.value)}
                  >
                    <option value="nouveau">Nouveau</option>
                    <option value="en_cours">En cours</option>
                    <option value="resolu">Résolu</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminSecurity;
