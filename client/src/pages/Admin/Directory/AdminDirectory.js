import React, { useState } from 'react';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import './AdminDirectory.css';

const AdminDirectory = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Données simulées
  const directoryStats = {
    totalBusinesses: 248,
    pendingValidation: 12,
    totalCategories: 15,
    totalViews: 1567
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="directory-page">
          <div className="directory-header">
            <div className="header-title">
              <h1>Gestion de l'Annuaire</h1>
              <p className="header-subtitle">Gérez les entreprises et professionnels du quartier</p>
            </div>
            <div className="header-actions">
              <button 
                className="validation-btn"
                onClick={() => setActiveTab('validation')}
              >
                <span>🔍</span>
                <span>En attente</span>
                <span className="count-badge">{directoryStats.pendingValidation}</span>
              </button>
              <button 
                className="business-btn"
                onClick={() => setActiveTab('businesses')}
              >
                <span>🏢</span>
                <span>Nouvelle entreprise</span>
              </button>
            </div>
          </div>

          <div className="directory-tabs">
            <button 
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Vue d'ensemble
            </button>
            <button 
              className={`tab-btn ${activeTab === 'businesses' ? 'active' : ''}`}
              onClick={() => setActiveTab('businesses')}
            >
              Entreprises
            </button>
            <button 
              className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              Catégories
            </button>
            <button 
              className={`tab-btn ${activeTab === 'validation' ? 'active' : ''}`}
              onClick={() => setActiveTab('validation')}
            >
              Validation
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="stats-overview">
              <div className="stat-item">
                <span className="stat-value">{directoryStats.totalBusinesses}</span>
                <span className="stat-label">Entreprises</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{directoryStats.pendingValidation}</span>
                <span className="stat-label">En attente</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{directoryStats.totalCategories}</span>
                <span className="stat-label">Catégories</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{directoryStats.totalViews}</span>
                <span className="stat-label">Vues ce mois</span>
              </div>
            </div>
          )}

          {activeTab === 'businesses' && (
            <div className="businesses-section">
              <div className="section-header">
                <div className="search-filters">
                  <input
                    type="text"
                    placeholder="Rechercher une entreprise..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Toutes les catégories</option>
                    <option value="restaurant">Restaurants</option>
                    <option value="commerce">Commerces</option>
                    <option value="service">Services</option>
                  </select>
                </div>
              </div>
              <div className="business-list">
                <div className="business-item">
                  <div className="business-logo">🍽️</div>
                  <div className="business-info">
                    <h3 className="business-name">Café du Coin</h3>
                    <span className="business-category">Restaurant</span>
                    <p className="business-address">15 rue de la Paix</p>
                  </div>
                  <div className="business-actions">
                    <button className="action-btn edit">✏️</button>
                    <button className="action-btn delete">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="categories-section">
              <div className="categories-grid">
                <div className="category-card" style={{ borderColor: "#FF6B6B" }}>
                  <div className="category-icon" style={{ backgroundColor: "#FF6B6B20" }}>
                    🍽️
                  </div>
                  <h3 className="category-name">Restaurants</h3>
                  <span className="category-count">45 entreprises</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="validation-section">
              <div className="validation-list">
                <div className="validation-item">
                  <div className="validation-header">
                    <h3>Nouveau Restaurant</h3>
                    <span className="pending-badge">En attente</span>
                  </div>
                  <div className="validation-details">
                    <p><strong>Catégorie:</strong> Restaurant</p>
                    <p><strong>Adresse:</strong> 25 rue des Fleurs</p>
                    <p><strong>Téléphone:</strong> 01 23 45 67 89</p>
                  </div>
                  <div className="validation-actions">
                    <button className="btn-approve">Approuver</button>
                    <button className="btn-reject">Rejeter</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDirectory;
