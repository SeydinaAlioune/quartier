import React, { useState } from 'react';
import './Projects.css';

const Projects = () => {
  const [projects] = useState([
    {
      id: 1,
      title: "Rénovation du jardin d'enfant",
      startDate: "15 novembre 2023",
      endDate: "15 mars 2024",
      description: "Rénovation complète du jardin d'enfants avec installation de nouveaux équipements de jeux, création d'espaces verts et mise en place d'un environnement sécurisé pour les enfants.",
      progress: 25,
      image: "/images/Central.png"
    },
    {
      id: 2,
      title: "Rénovation case des tout petits",
      startDate: "En cours",
      endDate: "31 décembre 2023",
      description: "Réhabilitation de la case des tout petits pour améliorer l'accueil des jeunes enfants. Rénovation des salles d'activités, mise aux normes des installations et création d'espaces adaptés aux activités éducatives.",
      progress: 70,
      image: "/images/residence.png"
    },
    {
      id: 3,
      title: "Rénovation mosque de la cite gendarmerie",
      startDate: "1er février 2024",
      endDate: "30 juin 2024",
      description: "Travaux de rénovation de la mosquée incluant la réfection de la toiture, la peinture des murs, l'amélioration du système de ventilation et la rénovation des espaces d'ablution.",
      progress: 10,
      phase: "Phase de préparation",
      image: "/images/Cyclables.png"
    }
  ]);

  const [events] = useState([
    {
      title: "Réunion Publique - Parc Central",
      description: "Présentation du projet de rénovation du parc central et consultation des habitants.",
      date: "25 novembre 2023, 18h30",
      location: "Salle municipale"
    },
    {
      title: "Atelier Participatif - Pistes Cyclables",
      description: "Atelier de réflexion sur le parcours idéal des futures pistes cyclables.",
      date: "12 décembre 2023, 17h00",
      location: "Centre culturel"
    },
    {
      title: "Clôture du Programme de Rénovation Énergétique",
      description: "Bilan du programme et présentation des résultats obtenus.",
      date: "15 janvier 2024, 18h00",
      location: "Mairie de quartier"
    },
    {
      title: "Inauguration de la Première Phase du Parc Central",
      description: "Ouverture de l'aire de jeux pour enfants rénovée.",
      date: "1er mars 2024, 11h00",
      location: "Parc Central"
    }
  ]);

  const [selectedProject, setSelectedProject] = useState(null);

  return (
    <div className="projects-page">
      <div className="projects-header">
        <h1>Projets du Quartier</h1>
        <p>Découvrez les initiatives en cours pour améliorer notre cadre de vie</p>
      </div>

      <section className="projects-section">
        <h2>Projets en Cours</h2>
        <div className="projects-grid">
          {projects.map(project => (
            <div key={project.id} className="project-card" onClick={() => setSelectedProject(project)}>
              <div 
                className="project-image" 
                style={{
                  backgroundImage: `url(${project.image})`
                }}
              />
              <div className="project-content">
                <h3>{project.title}</h3>
                <p className="project-dates">Du {project.startDate} au {project.endDate}</p>
                <p className="project-description">{project.description}</p>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div className="progress" style={{width: `${project.progress}%`}}></div>
                  </div>
                  <span className="progress-text">
                    Avancement: {project.progress}% {project.phase ? `(${project.phase})` : ''}
                  </span>
                </div>
                <button className="details-button">Voir les détails</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="events-section">
        <h2>Calendrier des Événements</h2>
        <div className="timeline">
          {events.map((event, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-content">
                <h3>{event.title}</h3>
                <p>{event.description}</p>
                <div className="event-details">
                  {event.date} - {event.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedProject && (
        <div className="project-details-modal">
          <div className="modal-content">
            <h2>{selectedProject.title}</h2>
            <div className="project-info">
              <div className="info-item">
                <h4>Budget:</h4>
                <p>350 000 €</p>
              </div>
              <div className="info-item">
                <h4>Financement:</h4>
                <p>Budget municipal (60%), Subvention régionale (30%), Participation citoyenne (10%)</p>
              </div>
              <div className="info-item">
                <h4>Responsable:</h4>
                <p>Service des Espaces Verts - Mme Dupont</p>
              </div>
            </div>
            <button onClick={() => setSelectedProject(null)}>Fermer</button>
          </div>
        </div>
      )}

      <section className="participation-section">
        <h2>Participez aux Projets du Quartier</h2>
        <p>Vous souhaitez vous impliquer dans l'amélioration de notre quartier? Rejoignez nos équipes de bénévoles ou participez aux réunions publiques!</p>
        <div className="action-buttons">
          <button className="primary-button">Devenir Bénévole</button>
          <button className="secondary-button">Proposer un Projet</button>
        </div>
      </section>

      <section className="faq-section">
        <h2>Questions Fréquentes</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>Comment sont choisis les projets du quartier?</h3>
            <p>Les projets sont sélectionnés selon un processus participatif qui combine les propositions des habitants, les priorités définies par le conseil de quartier et les...</p>
          </div>
          <div className="faq-item">
            <h3>Comment puis-je proposer un nouveau projet?</h3>
            <p>Vous pouvez soumettre vos idées via le formulaire en ligne, lors des réunions publiques ou directement auprès de la mairie de quartier. Chaque proposition est...</p>
          </div>
          <div className="faq-item">
            <h3>Comment sont financés les projets?</h3>
            <p>Les projets sont financés par le budget municipal, des subventions régionales ou nationales, et parfois par des partenariats public-privé ou des campagnes de...</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Projects;
