import React, { useEffect, useMemo, useState } from 'react';
import './Projects.css';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import AnimatedSection from '../../components/AnimatedSection/AnimatedSection';
import { Modal, SectionHead } from '../../components/UI';

const STATUS_LABELS_FR = {
  proposed: 'en attente',
  planning: 'planifié',
  in_progress: 'en cours',
  completed: 'terminé',
  cancelled: 'annulé',
};

const CATEGORY_LABELS_FR = {
  infrastructure: 'Infrastructure',
  environnement: 'Environnement',
  social: 'Social',
  culture: 'Culture',
  securite: 'Sécurité',
  autre: 'Autre',
};

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [projConfig, setProjConfig] = useState(null);
  const [activeDonationCampaigns, setActiveDonationCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedProject, setSelectedProject] = useState(null);

  const [volunteerToast, setVolunteerToast] = useState('');

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitToast, setSubmitToast] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [supportToast, setSupportToast] = useState('');
  const [faqOpen, setFaqOpen] = useState(null);
  const [submitForm, setSubmitForm] = useState({
    title: '',
    description: '',
    category: 'infrastructure',
    location: '',
  });
  const [submitFiles, setSubmitFiles] = useState([]);

  const formatEventDate = (d) => {
    if (!d) return { day: '—', month: '—', time: '' };
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return { day: '—', month: '—', time: '' };
    const day = dt.toLocaleDateString('fr-FR', { day: '2-digit' });
    const month = dt.toLocaleDateString('fr-FR', { month: 'short' });
    const time = dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return { day, month, time };
  };

  const openSubmit = () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    setShowSubmitModal(true);
  };

  const closeSubmit = () => {
    setShowSubmitModal(false);
    setSubmitLoading(false);
  };

  const uploadSubmitImages = async (files) => {
    const attachments = [];
    for (const file of files || []) {
      const fd = new FormData();
      fd.append('media', file);
      try {
        const up = await api.post('/api/media', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        const url = up?.data?.media?.url;
        if (url) attachments.push({ type: 'image', url, name: file.name });
      } catch (e) {
        // skip failed file
      }
    }
    return attachments;
  };

  const handleSubmitIdea = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    try {
      setSubmitLoading(true);
      setSubmitToast('');
      const title = (submitForm.title || '').trim();
      const description = (submitForm.description || '').trim();
      if (!title) return;
      if (!description) return;
      const attachments = await uploadSubmitImages(submitFiles);
      await api.post('/api/projects/submit', {
        title,
        description,
        category: submitForm.category,
        location: submitForm.location ? { address: submitForm.location } : undefined,
        attachments: attachments.length ? attachments : undefined,
      });
      setSubmitToast('Merci ! Ta proposition est en cours de validation.');
      setSubmitForm({ title: '', description: '', category: 'infrastructure', location: '' });
      setSubmitFiles([]);
      window.setTimeout(() => {
        setSubmitToast('');
        closeSubmit();
      }, 1800);
    } catch (err) {
      setSubmitToast("Impossible d'envoyer la proposition. Réessaie plus tard.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = projects.length;
    const inProgress = projects.filter(p => p?.raw?.status === 'in_progress').length;
    const completed = projects.filter(p => p?.raw?.status === 'completed').length;
    return { total, inProgress, completed };
  }, [projects]);

  const volunteerForProject = async (projectId) => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    if (!projectId) return;
    try {
      setVolunteerToast('');
      await api.post(`/api/projects/${projectId}/participate`, { role: 'volunteer' });
      setVolunteerToast('Merci ! Tu es inscrit comme bénévole pour ce projet.');
      window.setTimeout(() => setVolunteerToast(''), 2000);
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message;
      if (status === 401) {
        navigate('/login');
        return;
      }
      if (msg) {
        setVolunteerToast(msg);
      } else {
        setVolunteerToast("Impossible pour le moment. Réessaie plus tard.");
      }
      window.setTimeout(() => setVolunteerToast(''), 2500);
    }
  };

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
          const statusLabels = STATUS_LABELS_FR;
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
            categoryLabel: CATEGORY_LABELS_FR[p.category] || p.category || '—',
            image: firstImage?.url ? toAbsolute(firstImage.url) : `${process.env.PUBLIC_URL}/pro.jpg`,
          };
        }));
        setEvents(evtArr.map(e => ({
          id: e._id || e.id,
          title: e.title,
          description: e.description,
          dateISO: e.date || null,
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

  useEffect(() => {
    let mounted = true;
    const fetchDonationCampaigns = async () => {
      try {
        const res = await api.get('/api/donations/campaigns?status=active');
        if (!mounted) return;
        const list = Array.isArray(res.data?.campaigns) ? res.data.campaigns : [];
        setActiveDonationCampaigns(list);
      } catch (_) {
        if (mounted) setActiveDonationCampaigns([]);
      }
    };
    fetchDonationCampaigns();
    return () => { mounted = false; };
  }, []);

  const canDonateForProject = (projectId) => {
    if (!projectId) return false;
    return activeDonationCampaigns.some(c => {
      const category = c?.category;
      const pid = c?.project?._id || (typeof c?.project === 'string' ? c.project : '');
      return category === 'project' && String(pid) === String(projectId);
    });
  };

  const handleDonateForProject = (projectId) => {
    if (!projectId) return;
    if (!canDonateForProject(projectId)) {
      setSupportToast("Aucune collecte n'est liée à ce projet pour le moment.");
      window.setTimeout(() => setSupportToast(''), 2500);
      return;
    }
    navigate(`/dons?project=${projectId}`);
  };

  const handleHelpClick = () => {
    const first = projects?.[0] || null;
    if (first) {
      setSelectedProject(first);
      return;
    }
    document.getElementById('projects-list')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="projects-page">
      <div
        className="projects-header"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${process.env.PUBLIC_URL}/pro.jpg)`,
          backgroundPosition: 'center 35%'
        }}
      >
        <div className="projects-hero-inner">
          <p className="projects-hero-kicker">Initiatives</p>
          <h1>Projets du Quartier</h1>
          <p className="projects-hero-lead">Découvrez les initiatives en cours pour améliorer notre cadre de vie.</p>
          <div className="projects-hero-actions">
            <button type="button" className="projects-hero-btn" onClick={openSubmit}>Proposer une idée</button>
            <button type="button" className="projects-hero-link" onClick={() => document.getElementById('projects-list')?.scrollIntoView({ behavior: 'smooth' })}>Voir les projets</button>
          </div>
          <div className="projects-hero-stats">
            <div className="projects-stat"><span className="v">{stats.total}</span><span className="l">projets publiés</span></div>
            <div className="projects-stat"><span className="v">{stats.inProgress}</span><span className="l">en cours</span></div>
            <div className="projects-stat"><span className="v">{stats.completed}</span><span className="l">terminés</span></div>
          </div>
        </div>
      </div>

      <section className="projects-proposer" id="proposer" aria-label="Proposer une idée">
        <div className="projects-proposer-card">
          <div>
            <h2>Proposer une idée</h2>
            <p>Une bonne idée peut changer le quartier. Les propositions sont examinées avant publication.</p>
          </div>
          <button type="button" className="projects-proposer-btn" onClick={openSubmit}>Proposer une idée</button>
        </div>
      </section>

      <section className="projects-section" id="projects-list">
        <SectionHead title="Projets en Cours" />
        {loading && <p>Chargement des projets...</p>}
        {!loading && error && <p className="projects-error">{error}</p>}
        {!loading && !error && projects.length === 0 && (
          <p>Aucun projet pour le moment. Les administrateurs pourront en ajouter prochainement.</p>
        )}
        <div className="projects-grid">
          {projects.map((project, idx) => (
            <AnimatedSection key={project.id} delay={idx % 3} animation="scale">
              <div className="project-card">
              <div className="project-media">
                <img
                  className="project-image"
                  src={project.image}
                  alt=""
                  onError={(e) => {
                    if (e.currentTarget?.dataset?.fallbackApplied) return;
                    e.currentTarget.dataset.fallbackApplied = '1';
                    e.currentTarget.src = `${process.env.PUBLIC_URL}/pro.jpg`;
                  }}
                />
                <div className="project-badges">
                  <span className="project-pill project-pill--category">{project.categoryLabel}</span>
                  <span className={`project-pill project-pill--status project-pill--${project.phase || 'unknown'}`}>{project.phaseLabel || '—'}</span>
                </div>
              </div>
              <div className="project-content">
                <h3 className="project-title">{project.title}</h3>
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
                  <button className="donate-button" type="button" onClick={() => volunteerForProject(project.id)} style={{flex:1}}>Devenir bénévole</button>
                </div>
              </div>
            </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      <section className="events-section">
        <SectionHead title="Calendrier des Événements" />
        {loading && <p>Chargement des événements...</p>}
        {!loading && error && <p className="projects-error">{error}</p>}
        {!loading && !error && events.length === 0 && (
          <p>Aucun événement planifié.</p>
        )}
        <div className="events-list">
          {events.map((event, idx) => (
            <AnimatedSection key={event.id} delay={idx % 4} animation="slide-right">
              <div className="event-row">
                <div className="event-date" aria-hidden="true">
                  <span className="d">{formatEventDate(event.dateISO).day}</span>
                  <span className="m">{formatEventDate(event.dateISO).month}</span>
                </div>
                <div className="event-card">
                  <div className="event-head">
                    <h3>{event.title}</h3>
                    <div className="event-meta">{event.location} • {formatEventDate(event.dateISO).time}</div>
                  </div>
                  {event.description && <p className="event-desc">{event.description}</p>}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      <Modal
        open={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
        overlayClassName="project-details-modal"
        cardClassName="projects-project-modal"
        ariaLabel="Détails du projet"
      >
        {selectedProject && (
          <>
            <div className="projects-project-modal__header">
              <div className="projects-project-modal__title">
                <h2>{selectedProject.title}</h2>
                <div className="projects-project-modal__badges">
                  <span className="projects-badge projects-badge--category">{CATEGORY_LABELS_FR[selectedProject.raw?.category] || selectedProject.raw?.category || '—'}</span>
                  <span className={`projects-badge projects-badge--status projects-badge--${selectedProject.raw?.status || 'unknown'}`}>{STATUS_LABELS_FR[selectedProject.raw?.status] || selectedProject.raw?.status || '—'}</span>
                </div>
              </div>
              <button type="button" className="projects-project-modal__close" onClick={() => setSelectedProject(null)} aria-label="Fermer">
                Fermer
              </button>
            </div>

            <div className="projects-project-modal__body">
              <div className="projects-project-modal__media">
                {selectedProject.image ? (
                  <img
                    src={selectedProject.image}
                    alt=""
                    className="projects-project-modal__cover"
                    onError={(e) => {
                      if (e.currentTarget?.dataset?.fallbackApplied) return;
                      e.currentTarget.dataset.fallbackApplied = '1';
                      e.currentTarget.src = `${process.env.PUBLIC_URL}/pro.jpg`;
                    }}
                  />
                ) : (
                  <div className="projects-project-modal__cover projects-project-modal__cover--placeholder" />
                )}

                <div className="projects-project-modal__cta">
                  <button className="projects-cta-primary" type="button" onClick={() => volunteerForProject(selectedProject.id)}>
                    Devenir bénévole
                  </button>
                  <button
                    className="projects-cta-secondary"
                    type="button"
                    onClick={() => handleDonateForProject(selectedProject.id)}
                    disabled={!canDonateForProject(selectedProject.id)}
                    aria-disabled={!canDonateForProject(selectedProject.id)}
                    title={!canDonateForProject(selectedProject.id) ? "Aucune collecte active liée à ce projet" : "Faire un don"}
                  >
                    Faire un don
                  </button>
                  <p className="projects-project-modal__cta-note">
                    Les projets et les dons sont indépendants.
                    {' '}
                    Le don n’est proposé ici que si une collecte est active et liée à ce projet.
                  </p>
                </div>

                {supportToast && (
                  <div className="projects-toast">{supportToast}</div>
                )}
              </div>

              <div className="projects-project-modal__content">
                {selectedProject.description && (
                  <section className="projects-project-section">
                    <h3>Résumé</h3>
                    <p className="projects-project-text">{selectedProject.description}</p>
                  </section>
                )}

                <section className="projects-project-section">
                  <h3>Informations</h3>
                  <div className="projects-project-kv">
                    <div className="k">
                      <span className="t">Période</span>
                      <span className="v">Du {selectedProject.startDate} au {selectedProject.endDate}</span>
                    </div>
                    <div className="k">
                      <span className="t">Responsable</span>
                      <span className="v">{selectedProject.raw?.organizer?.name || '—'}</span>
                    </div>
                    <div className="k">
                      <span className="t">Budget</span>
                      <span className="v">
                        {selectedProject.raw?.budget?.estimated != null ? `${selectedProject.raw.budget.estimated.toLocaleString('fr-FR')} €` : '—'}
                        {selectedProject.raw?.budget?.collected != null ? ` (collecté: ${selectedProject.raw.budget.collected.toLocaleString('fr-FR')} €)` : ''}
                      </span>
                    </div>
                  </div>
                </section>

                {Array.isArray(selectedProject.raw?.attachments) && selectedProject.raw.attachments.length > 0 && (
                  <section className="projects-project-section">
                    <h3>Pièces jointes</h3>
                    <div className="projects-attachments">
                      {selectedProject.raw.attachments.map((att, idx) => {
                        const base = api.defaults.baseURL || '';
                        const sep = att.url?.startsWith('/') ? '' : '/';
                        const url = att.url?.startsWith('http') ? att.url : `${base}${sep}${att.url}`;
                        const name = att?.name || (att?.type === 'image' ? 'Image' : 'Fichier');
                        return (
                          <a key={idx} href={url} target="_blank" rel="noreferrer">
                            {att.type === 'image' ? (
                              <img
                                src={url}
                                alt=""
                                className="projects-attachment-img"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="projects-attachment-file">{name}</span>
                            )}
                          </a>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </>
        )}
      </Modal>

      <section className="participation-section">
        <h2>Participez aux Projets du Quartier</h2>
        <p>Vous souhaitez vous impliquer dans l'amélioration de notre quartier? Rejoignez nos équipes de bénévoles ou participez aux réunions publiques!</p>
        <div className="action-buttons">
          <button type="button" className="primary-button" onClick={handleHelpClick} style={{ display: 'inline-block' }}>
            Choisir un projet
          </button>
        </div>
        {volunteerToast && (
          <div style={{marginTop:'1rem', color:'#555'}}>{volunteerToast}</div>
        )}
      </section>

      <section className="faq-section">
        <SectionHead title="Questions Fréquentes" />
        {Array.isArray(projConfig?.faq) && projConfig.faq.length > 0 ? (
          <div className="faq-accordion">
            {projConfig.faq.map((item, idx) => {
              const open = faqOpen === idx;
              return (
                <div className={`faq-acc-item ${open ? 'is-open' : ''}`} key={idx}>
                  <button
                    type="button"
                    className="faq-acc-trigger"
                    onClick={() => setFaqOpen(prev => (prev === idx ? null : idx))}
                    aria-expanded={open}
                  >
                    <span className="q">{item.question}</span>
                    <span className="i" aria-hidden="true">{open ? '—' : '+'}</span>
                  </button>
                  <div className="faq-acc-panel" style={{ display: open ? 'block' : 'none' }}>
                    <p>{item.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{marginTop:'1rem'}}>Les questions fréquentes seront bientôt disponibles.</p>
        )}
      </section>

      <Modal
        open={Boolean(showSubmitModal)}
        onClose={closeSubmit}
        overlayClassName="project-details-modal"
        cardClassName="projects-submit-modal"
        ariaLabel="Proposer une idée"
      >
        <div className="projects-submit-header">
          <div>
            <h2>Proposer une idée</h2>
            <p>Les propositions sont examinées avant publication.</p>
          </div>
          <button type="button" className="projects-submit-close" onClick={closeSubmit} aria-label="Fermer">
            Fermer
          </button>
        </div>

        <form className="projects-submit-form" onSubmit={handleSubmitIdea}>
          <label className="projects-field">
            <span>Titre</span>
            <input type="text" value={submitForm.title} onChange={(e)=>setSubmitForm(prev=>({ ...prev, title: e.target.value }))} required />
          </label>

          <label className="projects-field projects-field--full">
            <span>Description</span>
            <textarea rows="5" value={submitForm.description} onChange={(e)=>setSubmitForm(prev=>({ ...prev, description: e.target.value }))} required />
          </label>

          <label className="projects-field">
            <span>Catégorie</span>
            <select value={submitForm.category} onChange={(e)=>setSubmitForm(prev=>({ ...prev, category: e.target.value }))}>
              <option value="infrastructure">Infrastructure</option>
              <option value="environnement">Environnement</option>
              <option value="social">Social</option>
              <option value="culture">Culture</option>
              <option value="securite">Sécurité</option>
              <option value="autre">Autre</option>
            </select>
          </label>

          <label className="projects-field">
            <span>Lieu (optionnel)</span>
            <input type="text" value={submitForm.location} onChange={(e)=>setSubmitForm(prev=>({ ...prev, location: e.target.value }))} placeholder="Ex: près de la mairie" />
          </label>

          <label className="projects-field projects-field--full">
            <span>Photos (optionnel)</span>
            <input type="file" accept="image/*" multiple onChange={(e)=> setSubmitFiles(Array.from(e.target.files || []))} />
          </label>

          {submitToast && (
            <div className="projects-toast">{submitToast}</div>
          )}

          <div className="projects-submit-actions">
            <button type="submit" className="projects-submit-primary" disabled={submitLoading}>
              {submitLoading ? 'Envoi...' : 'Envoyer la proposition'}
            </button>
            <button type="button" className="projects-submit-secondary" onClick={closeSubmit}>
              Annuler
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
