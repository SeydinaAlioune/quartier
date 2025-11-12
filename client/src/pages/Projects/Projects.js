import React, { useEffect, useState } from 'react';
import './Projects.css';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import AnimatedSection from '../../components/AnimatedSection/AnimatedSection';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [projConfig, setProjConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError('');
        const [prjRes, evtRes, cfgRes] = await Promise.all([
          api.get('/api/projects'),
          api.get('/api/events'),
          api.get('/api/projects/config'),
        ]);
        if (!mounted) return;
        const prjArr = Array.isArray(prjRes.data) ? prjRes.data : [];
        const evtArr = Array.isArray(evtRes.data) ? evtRes.data : [];
        const cfgObj = cfgRes?.data || null;
        setProjConfig(cfgObj);
        // Adapter les champs à l'UI existante
        const base = api.defaults.baseURL || '';
        const toAbsolute = (u) => {
          if (!u) return '';
          if (u.startsWith('http')) return u;
          const sep = u.startsWith('/') ? '' : '/';
          return `${base}${sep}${u}`;
        };
        setProjects(prjArr.map(p => {
          const firstImage = Array.isArray(p.attachments) ? p.attachments.find(a => a.type === 'image' && a.url) : null;
          const start = p?.timeline?.startDate ? new Date(p.timeline.startDate) : null;
          const end = p?.timeline?.endDate ? new Date(p.timeline.endDate) : null;
          let progress = 0;
          // 1) prioriser la valeur saisie par l'admin si présente
          if (typeof p?.progress === 'number' && !Number.isNaN(p.progress)) {
            progress = Math.max(0, Math.min(100, Math.round(p.progress)));
          } else if (p?.budget?.estimated > 0 && p?.budget?.collected > 0) {
            progress = Math.min(100, Math.max(0, Math.round((p.budget.collected / p.budget.estimated) * 100)));
          } else {
            // fallback based on status
            const map = cfgObj?.progressByStatus || { proposed: 5, planning: 15, in_progress: 50, completed: 100, cancelled: 0 };
            progress = map[p.status] != null ? Number(map[p.status]) : 0;
          }
          const statusLabels = { in_progress: 'en cours', planning: 'planifié', completed: 'terminé', proposed: 'en attente', cancelled: 'annulé' };
          return {
            id: p._id || p.id,
            raw: p,
            title: p.title,
            startDate: start ? start.toLocaleDateString('fr-FR') : '—',
            endDate: end ? end.toLocaleDateString('fr-FR') : '—',
            description: p.description,
            progress,
            phase: p.status,
            phaseLabel: statusLabels[p.status] || p.status || '',
            image: firstImage?.url ? toAbsolute(firstImage.url) : 'https://via.placeholder.com/800x400?text=Projet',
          };
        }));
        setEvents(evtArr.map(e => ({
          id: e._id || e.id,
          title: e.title,
          description: e.description,
          date: e.date ? new Date(e.date).toLocaleString('fr-FR') : '—',
          location: e.location || '—',
        })));
      } catch (e) {
        if (mounted) setError("Impossible de charger les projets/événements.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="projects-page">
      <div className="projects-header">
        <h1>Projets du Quartier</h1>
        <p>Découvrez les initiatives en cours pour améliorer notre cadre de vie</p>
      </div>

      <section className="projects-section">
        <h2>Projets en Cours</h2>
        {loading && <p>Chargement des projets...</p>}
        {!loading && error && <p className="projects-error">{error}</p>}
        {!loading && !error && projects.length === 0 && (
          <p>Aucun projet pour le moment. Les administrateurs pourront en ajouter prochainement.</p>
        )}
        <div className="projects-grid">
          {projects.map((project, idx) => (
            <AnimatedSection key={project.id} delay={idx % 3} animation="scale">
              <div className="project-card">
              <img className="project-image" src={project.image} alt="" />
              <div className="project-content">
                <h3>{project.title}</h3>
                <p className="project-dates">Du {project.startDate} au {project.endDate}</p>
                <p className="project-description">{project.description}</p>
                {project.raw?.budget?.estimated != null && (
                  <div className="project-budget">Budget estimé: {project.raw.budget.estimated.toLocaleString('fr-FR')} €</div>
                )}
                <div className="progress-container">
                  <div className="progress-bar">
                    <div className="progress" style={{width: `${project.progress}%`}}></div>
                  </div>
                  <span className="progress-text">
                    Avancement: {project.progress}% {project.phaseLabel ? `(${project.phaseLabel})` : ''}
                  </span>
                </div>
                <div style={{display:'flex', gap:'.5rem', marginTop:'.5rem'}}>
                  <button className="details-button" onClick={() => setSelectedProject(project)} style={{flex:1}}>Voir les détails</button>
                  <Link className="donate-button" to={`/dons?project=${project.id}`} style={{flex:1, textAlign:'center', textDecoration:'none'}}>Soutenir ce projet</Link>
                </div>
              </div>
            </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      <section className="events-section">
        <h2>Calendrier des Événements</h2>
        {loading && <p>Chargement des événements...</p>}
        {!loading && error && <p className="projects-error">{error}</p>}
        {!loading && !error && events.length === 0 && (
          <p>Aucun événement planifié.</p>
        )}
        <div className="timeline">
          {events.map((event, idx) => (
            <AnimatedSection key={event.id} delay={idx % 4} animation="slide-right">
              <div className="timeline-item">
              <div className="timeline-content">
                <h3>{event.title} — {event.location} — {event.date}</h3>
                {event.description && <p>{event.description}</p>}
              </div>
            </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {selectedProject && (
        <div className="project-details-modal">
          <div className="modal-content">
            <h2>{selectedProject.title}</h2>
            {selectedProject.image && (
              <div style={{marginBottom: '1rem'}}>
                <img src={selectedProject.image} alt="" style={{width:'100%', maxHeight:'280px', objectFit:'cover', borderRadius:6}} />
              </div>
            )}
            <div className="project-info">
              <div className="info-item">
                <h4>Budget:</h4>
                <p>
                  {selectedProject.raw?.budget?.estimated != null ? `${selectedProject.raw.budget.estimated.toLocaleString('fr-FR')} €` : '—'}
                  {selectedProject.raw?.budget?.collected != null ? ` (collecté: ${selectedProject.raw.budget.collected.toLocaleString('fr-FR')} €)` : ''}
                </p>
              </div>
              <div className="info-item">
                <h4>Catégorie / Statut:</h4>
                <p>{selectedProject.raw?.category || '—'} / {selectedProject.raw?.status || '—'}</p>
              </div>
              <div className="info-item">
                <h4>Responsable:</h4>
                <p>{selectedProject.raw?.organizer?.name || '—'}</p>
              </div>
              {Array.isArray(selectedProject.raw?.attachments) && selectedProject.raw.attachments.length > 0 && (
                <div className="info-item">
                  <h4>Galerie:</h4>
                  <div style={{display:'flex', gap:'.5rem', flexWrap:'wrap'}}>
                  {selectedProject.raw.attachments.map((att, idx) => {
                    const base = api.defaults.baseURL || '';
                    const sep = att.url?.startsWith('/') ? '' : '/';
                    const url = att.url?.startsWith('http') ? att.url : `${base}${sep}${att.url}`;
                    return (
                      <a key={idx} href={url} target="_blank" rel="noreferrer">
                        {att.type === 'image' ? (
                          <img src={url} alt="pièce jointe" style={{width: 96, height: 72, objectFit: 'cover', borderRadius: 6, border:'1px solid #eee'}} />
                        ) : (
                          <span>Fichier</span>
                        )}
                      </a>
                    );
                  })}
                  </div>
                </div>
              )}
            </div>
            <div style={{display:'flex', gap:'.5rem', marginTop:'.5rem'}}>
              <Link className="donate-button" to={`/dons?project=${selectedProject.id}`} style={{flex:1, textAlign:'center', textDecoration:'none'}}>Soutenir ce projet</Link>
              <button className="details-button" onClick={() => setSelectedProject(null)} style={{flex:1}}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      <section className="participation-section">
        <h2>Participez aux Projets du Quartier</h2>
        <p>Vous souhaitez vous impliquer dans l'amélioration de notre quartier? Rejoignez nos équipes de bénévoles ou participez aux réunions publiques!</p>
        <div className="action-buttons">
          <Link to="/dons" className="primary-button" style={{ textDecoration: 'none', display: 'inline-block' }}>Devenir Bénévole</Link>
        </div>
      </section>

      <section className="faq-section">
        <h2>Questions Fréquentes</h2>
        {Array.isArray(projConfig?.faq) && projConfig.faq.length > 0 ? (
          <div className="faq-grid">
            {projConfig.faq.map((item, idx) => (
              <div className="faq-item" key={idx}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{marginTop:'1rem'}}>Les questions fréquentes seront bientôt disponibles.</p>
        )}
      </section>
    </div>
  );
};

export default Projects;
