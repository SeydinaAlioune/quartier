import React, { useState } from 'react';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import AdminHeader from '../../../components/AdminHeader/AdminHeader';
import './AdminProjects.css';

const AdminProjects = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Données simulées des projets
  const projects = [
    {
      id: 1,
      titre: "Rénovation du parc municipal",
      categorie: "Urbanisme",
      statut: "En cours",
      responsable: "Marie Dupont",
      budget: "150000€",
      progression: 65,
      dateDebut: "01/03/2024",
      dateFin: "30/09/2024",
      priorite: "Haute",
      description: "Modernisation complète du parc municipal avec nouveaux équipements",
      participants: ["Marie Dupont", "Jean Martin", "Sophie Bernard"],
      taches: [
        { nom: "Étude préliminaire", statut: "Terminé", progression: 100 },
        { nom: "Consultation publique", statut: "En cours", progression: 75 },
        { nom: "Installation équipements", statut: "À venir", progression: 0 }
      ]
    },
    {
      id: 2,
      titre: "Programme culturel estival",
      categorie: "Culture",
      statut: "Planifié",
      responsable: "Thomas Martin",
      budget: "45000€",
      progression: 25,
      dateDebut: "01/06/2024",
      dateFin: "31/08/2024",
      priorite: "Moyenne",
      description: "Organisation d'événements culturels pendant l'été",
      participants: ["Thomas Martin", "Laura Petit", "Mohamed Ali"],
      taches: [
        { nom: "Programmation", statut: "En cours", progression: 60 },
        { nom: "Communication", statut: "En cours", progression: 30 },
        { nom: "Logistique", statut: "À venir", progression: 0 }
      ]
    },
    {
      id: 3,
      titre: "Piste cyclable",
      categorie: "Transport",
      statut: "En attente",
      responsable: "Paul Dubois",
      budget: "80000€",
      progression: 0,
      dateDebut: "À définir",
      dateFin: "À définir",
      priorite: "Basse",
      description: "Création d'une piste cyclable reliant le centre-ville aux quartiers périphériques",
      participants: ["Paul Dubois", "Claire Moreau"],
      taches: [
        { nom: "Étude de faisabilité", statut: "À venir", progression: 0 },
        { nom: "Plan d'exécution", statut: "À venir", progression: 0 }
      ]
    }
  ];

  // Statistiques des projets
  const projectStats = {
    total: projects.length,
    enCours: projects.filter(p => p.statut === "En cours").length,
    planifies: projects.filter(p => p.statut === "Planifié").length,
    termines: projects.filter(p => p.statut === "Terminé").length,
    enAttente: projects.filter(p => p.statut === "En attente").length
  };

  return (
    <div className="admin-page">
      <AdminSidebar isCollapsed={isCollapsed} />
      <div className="admin-content">
        <AdminHeader 
          title="Gestion des Projets" 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
        />
        <div className="projects-page">
          {/* En-tête de la page */}
          <div className="projects-header">
            <div className="header-title">
              <h1>Gestion des Projets</h1>
              <p className="header-subtitle">Suivez et gérez les projets du quartier</p>
            </div>
            <div className="header-actions">
              <button 
                className="add-project-btn"
                onClick={() => setShowProjectModal(true)}
              >
                <span>+</span>
                <span>Nouveau projet</span>
              </button>
            </div>
          </div>

          {/* Vue d'ensemble des statistiques */}
          <div className="stats-overview">
            <div className="stat-item">
              <span className="stat-value">{projectStats.total}</span>
              <span className="stat-label">Total projets</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{projectStats.enCours}</span>
              <span className="stat-label">En cours</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{projectStats.planifies}</span>
              <span className="stat-label">Planifiés</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{projectStats.termines}</span>
              <span className="stat-label">Terminés</span>
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="projects-filters">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="en_cours">En cours</option>
                <option value="planifie">Planifié</option>
                <option value="termine">Terminé</option>
                <option value="en_attente">En attente</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">Toutes les catégories</option>
                <option value="urbanisme">Urbanisme</option>
                <option value="culture">Culture</option>
                <option value="transport">Transport</option>
                <option value="environnement">Environnement</option>
              </select>
            </div>
          </div>

          {/* Liste des projets */}
          <div className="projects-list">
            {projects.map(project => (
              <div key={project.id} className="project-card">
                <div className="project-header">
                  <h3>{project.titre}</h3>
                  <span className={`status-badge ${project.statut.toLowerCase().replace(' ', '-')}`}>
                    {project.statut}
                  </span>
                </div>
                <div className="project-info">
                  <div className="info-group">
                    <span className="label">Responsable:</span>
                    <span className="value">{project.responsable}</span>
                  </div>
                  <div className="info-group">
                    <span className="label">Catégorie:</span>
                    <span className="value">{project.categorie}</span>
                  </div>
                  <div className="info-group">
                    <span className="label">Budget:</span>
                    <span className="value">{project.budget}</span>
                  </div>
                </div>
                <div className="project-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${project.progression}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{project.progression}%</span>
                </div>
                <div className="project-dates">
                  <div className="date-group">
                    <span className="label">Début:</span>
                    <span className="value">{project.dateDebut}</span>
                  </div>
                  <div className="date-group">
                    <span className="label">Fin:</span>
                    <span className="value">{project.dateFin}</span>
                  </div>
                </div>
                <div className="project-actions">
                  <button className="action-btn edit" title="Modifier">✏️</button>
                  <button className="action-btn tasks" title="Tâches">📋</button>
                  <button className="action-btn team" title="Équipe">👥</button>
                  <button className="action-btn delete" title="Supprimer">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProjects;
