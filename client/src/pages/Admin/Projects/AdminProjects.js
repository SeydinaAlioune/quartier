import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout';
import './AdminProjects.css';
import api from '../../../services/api';
import { emitToast } from '../../../utils/toast';
import { MoreVertical, Plus, Settings, X } from 'lucide-react';

const AdminProjects = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [openMenuId, setOpenMenuId] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('Confirmer');
  const [confirmMessage, setConfirmMessage] = useState('');
  const confirmActionRef = useRef(null);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    category: 'infrastructure',
    status: 'proposed',
    budgetEstimated: '',
    startDate: '',
    endDate: '',
    progress: ''
  });
  const [newProjectFiles, setNewProjectFiles] = useState([]);
  const [editProject, setEditProject] = useState(null); // full project doc
  const [editFiles, setEditFiles] = useState([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState('');
  const [configForm, setConfigForm] = useState({
    progressByStatus: { proposed: 5, planning: 15, in_progress: 50, completed: 100, cancelled: 0 },
    faq: [],
  });

  const handleOverlayMouseDown = (e, onClose) => {
    if (e.target !== e.currentTarget) return;
    onClose();
  };

  const openConfirm = ({ title = 'Confirmer', message = '', onConfirm }) => {
    confirmActionRef.current = typeof onConfirm === 'function' ? onConfirm : null;
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmTitle('Confirmer');
    setConfirmMessage('');
    confirmActionRef.current = null;
  };

  const handleConfirmSubmit = async () => {
    const fn = confirmActionRef.current;
    closeConfirm();
    if (!fn) return;
    try {
      await fn();
    } catch (e) {
      emitToast('Action impossible.');
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/projects/admin');
      const data = Array.isArray(res.data) ? res.data : [];
      setProjects(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const uploadImages = async (files) => {
    const attachments = [];
    for (const file of files || []) {
      const fd = new FormData();
      fd.append('media', file);
      fd.append('title', file.name || 'image');
      fd.append('category', 'project');
      try {
        const up = await api.post('/api/media', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        const url = up?.data?.media?.url;
        if (url) attachments.push({ type: 'image', url, name: file.name });
      } catch (e) {
        // silently skip failed uploads
      }
    }
    return attachments;
  };

  const handleOpenEdit = (p) => {
    setEditProject({ ...p });
    setEditFiles([]);
    setShowEditModal(true);
  };

  const handleDelete = async (p) => {
    if (!p?._id) return;
    openConfirm({
      title: 'Supprimer le projet',
      message: 'Cette action est définitive. Voulez-vous continuer ?',
      onConfirm: async () => {
        await api.delete(`/api/projects/${p._id}`);
        setProjects(prev => prev.filter(x => x._id !== p._id));
      }
    });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;

      if (openMenuId) {
        setOpenMenuId(null);
        return;
      }
      if (confirmOpen) {
        closeConfirm();
        return;
      }
      if (showConfigModal) {
        setShowConfigModal(false);
        return;
      }
      if (showEditModal) {
        setShowEditModal(false);
        return;
      }
      if (showProjectModal) {
        setShowProjectModal(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [confirmOpen, openMenuId, showConfigModal, showEditModal, showProjectModal]);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (!openMenuId) return;
      const el = e.target;
      if (el && typeof el.closest === 'function' && el.closest('.project-header__right')) return;
      setOpenMenuId(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [openMenuId]);

  // Statistiques des projets (selon status backend)
  const projectStats = {
    total: projects.length,
    enCours: projects.filter(p => p.status === 'in_progress').length,
    planifies: projects.filter(p => p.status === 'planning').length,
    termines: projects.filter(p => p.status === 'completed').length,
    enAttente: projects.filter(p => p.status === 'proposed').length
  };

  const categoryLabel = (v) => {
    if (v === 'infrastructure') return 'Infrastructure';
    if (v === 'environnement') return 'Environnement';
    if (v === 'social') return 'Social';
    if (v === 'culture') return 'Culture';
    if (v === 'securite') return 'Sécurité';
    if (v === 'autre') return 'Autre';
    return v || '—';
  };

  const formatCurrency = (n) => {
    if (n == null || n === '') return '—';
    const num = Number(n);
    if (!Number.isFinite(num)) return '—';
    return `${new Intl.NumberFormat('fr-FR').format(num)} €`;
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '—';
    return dt.toLocaleDateString('fr-FR');
  };

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (projects || [])
      .filter(p => (statusFilter === 'all' || p.status === statusFilter))
      .filter(p => (categoryFilter === 'all' || p.category === categoryFilter))
      .filter(p => q === '' || (p.title || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
  }, [categoryFilter, projects, searchQuery, statusFilter]);

  const filtersActive = statusFilter !== 'all' || categoryFilter !== 'all' || searchQuery.trim() !== '';

  return (
    <AdminLayout title="Gestion des Projets">
      <div className="projects-page">
          {/* En-tête de la page */}
          <div className="projects-header">
            <div className="header-title">
              <h1>Gestion des Projets</h1>
              <p className="header-subtitle">Suivez et gérez les projets du quartier</p>
            </div>
            <div className="header-actions">
              <button
                className="projects-btn projects-btn--secondary"
                onClick={async () => {
                  try {
                    setConfigError('');
                    setConfigLoading(true);
                    const res = await api.get('/api/projects/config');
                    const cfg = res?.data || {};
                    setConfigForm({
                      progressByStatus: cfg.progressByStatus || { proposed: 5, planning: 15, in_progress: 50, completed: 100, cancelled: 0 },
                      faq: Array.isArray(cfg.faq) ? cfg.faq : [],
                    });
                    setShowConfigModal(true);
                  } catch (e) {
                    setConfigError("Impossible de charger la configuration projets.");
                    setShowConfigModal(true);
                  } finally {
                    setConfigLoading(false);
                  }
                }}
              >
                <Settings size={16} aria-hidden="true" />
                <span>Configurer</span>
              </button>
              <button 
                className="projects-btn projects-btn--primary"
                onClick={() => setShowProjectModal(true)}
              >
                <Plus size={16} aria-hidden="true" />
                <span>Nouveau projet</span>
              </button>
            </div>
          </div>

          {/* Vue d'ensemble des statistiques */}
          <div className="stats-overview">
            <button type="button" className="stat-item" onClick={() => setStatusFilter('all')} aria-pressed={statusFilter === 'all'}>
              <span className="stat-value">{projectStats.total}</span>
              <span className="stat-label">Total</span>
            </button>
            <button type="button" className="stat-item stat-item--in-progress" onClick={() => setStatusFilter('in_progress')} aria-pressed={statusFilter === 'in_progress'}>
              <span className="stat-value">{projectStats.enCours}</span>
              <span className="stat-label">En cours</span>
            </button>
            <button type="button" className="stat-item stat-item--planning" onClick={() => setStatusFilter('planning')} aria-pressed={statusFilter === 'planning'}>
              <span className="stat-value">{projectStats.planifies}</span>
              <span className="stat-label">Planifiés</span>
            </button>
            <button type="button" className="stat-item stat-item--completed" onClick={() => setStatusFilter('completed')} aria-pressed={statusFilter === 'completed'}>
              <span className="stat-value">{projectStats.termines}</span>
              <span className="stat-label">Terminés</span>
            </button>
          </div>

          {/* Filtres et recherche */}
          <div className="projects-filters">
            <div className="projects-filters__top">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Rechercher un projet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="filters-toggle"
                onClick={() => setFiltersOpen(v => !v)}
                aria-expanded={filtersOpen}
              >
                Filtres{filtersActive ? ' *' : ''}
              </button>
            </div>

            <div className={`filter-group ${filtersOpen ? 'is-open' : ''}`}>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="in_progress">En cours</option>
                <option value="planning">Planifié</option>
                <option value="completed">Terminé</option>
                <option value="proposed">En attente</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">Toutes les catégories</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="environnement">Environnement</option>
                <option value="social">Social</option>
                <option value="culture">Culture</option>
                <option value="securite">Sécurité</option>
                <option value="autre">Autre</option>
              </select>
              <div className="filters-meta">
                <div className="results-count">{filteredProjects.length} résultat{filteredProjects.length > 1 ? 's' : ''}</div>
                <button
                  type="button"
                  className="projects-btn projects-btn--ghost"
                  disabled={!filtersActive}
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                  }}
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          {/* Liste des projets */}
          <div className="projects-list">
            {loading && <div className="project-card">Chargement...</div>}
            {!loading && filteredProjects.map(project => (
                <div key={project._id} className="project-card">
                  <div className="project-header">
                    <h3>{project.title}</h3>
                    <div className="project-header__right">
                      <span className={`status-badge ${project.status}`}>
                        {project.status === 'in_progress' ? 'En cours'
                          : project.status === 'planning' ? 'Planifié'
                          : project.status === 'completed' ? 'Terminé'
                          : project.status === 'cancelled' ? 'Annulé'
                          : 'En attente'}
                      </span>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="Actions"
                        onClick={() => setOpenMenuId(prev => (prev === project._id ? null : project._id))}
                      >
                        <MoreVertical size={16} aria-hidden="true" />
                      </button>
                      {openMenuId === project._id && (
                        <div className="action-menu" role="menu">
                          <button type="button" className="action-menu__item" onClick={() => { setOpenMenuId(null); handleOpenEdit(project); }}>Modifier</button>
                          <button type="button" className="action-menu__item is-danger" onClick={() => { setOpenMenuId(null); handleDelete(project); }}>Supprimer</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="project-info">
                    <div className="info-group">
                      <span className="label">Catégorie:</span>
                      <span className="value">{categoryLabel(project.category)}</span>
                    </div>
                    <div className="info-group">
                      <span className="label">Budget estimé:</span>
                      <span className="value">{formatCurrency(project.budget?.estimated)}</span>
                    </div>
                  </div>
                  {typeof project.progress === 'number' && (
                    <div className="project-progress">
                      <div className="progress-bar" aria-label={`Avancement ${project.progress}%`}>
                        <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, project.progress))}%` }} />
                      </div>
                      <div className="progress-text">{Math.max(0, Math.min(100, project.progress))}%</div>
                    </div>
                  )}
                  <div className="project-dates">
                    <div className="date-group">
                      <span className="label">Début:</span>
                      <span className="value">{formatDate(project.timeline?.startDate)}</span>
                    </div>
                    <div className="date-group">
                      <span className="label">Fin:</span>
                      <span className="value">{formatDate(project.timeline?.endDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            {!loading && filteredProjects.length === 0 && (
              <div className="empty-state">
                <div className="empty-state__title">Aucun projet</div>
                <div className="empty-state__subtitle">Modifie tes filtres ou crée un nouveau projet.</div>
                <div className="empty-state__actions">
                  <button type="button" className="projects-btn projects-btn--secondary" onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                  }}>
                    Réinitialiser
                  </button>
                  <button type="button" className="projects-btn projects-btn--primary" onClick={() => setShowProjectModal(true)}>
                    <Plus size={16} aria-hidden="true" />
                    Nouveau projet
                  </button>
                </div>
              </div>
            )}
          </div>

          {showProjectModal && (
            <div className="projects-modal-overlay" onMouseDown={(e) => handleOverlayMouseDown(e, () => setShowProjectModal(false))}>
              <div className="projects-modal projects-project-modal">
                <div className="projects-modal__header">
                  <h3>Nouveau projet</h3>
                  <button type="button" className="icon-close" onClick={() => setShowProjectModal(false)} aria-label="Fermer">
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const attachments = await uploadImages(newProjectFiles);
                    await api.post('/api/projects', {
                      title: newProject.title,
                      description: newProject.description,
                      category: newProject.category,
                      status: newProject.status,
                      budget: newProject.budgetEstimated ? { estimated: Number(newProject.budgetEstimated) } : undefined,
                      timeline: {
                        startDate: newProject.startDate ? new Date(newProject.startDate) : undefined,
                        endDate: newProject.endDate ? new Date(newProject.endDate) : undefined,
                      },
                      progress: newProject.progress !== '' ? Math.max(0, Math.min(100, Number(newProject.progress))) : undefined,
                      attachments: attachments.length ? attachments : undefined,
                    });
                    setShowProjectModal(false);
                    setNewProject({ title: '', description: '', category: 'infrastructure', status: 'proposed', budgetEstimated: '', startDate: '', endDate: '', progress: '' });
                    setNewProjectFiles([]);
                    fetchProjects();
                  } catch (err) {
                    emitToast('Création impossible. Vérifiez vos droits.');
                  }
                }} id="projects-create-form">
                  <div className="projects-modal__body">
                  <div className="form-row">
                    <label>Titre</label>
                    <input
                      type="text"
                      value={newProject.title}
                      onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Description</label>
                    <textarea
                      rows="4"
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Catégorie</label>
                    <select
                      value={newProject.category}
                      onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                    >
                      <option value="infrastructure">Infrastructure</option>
                      <option value="environnement">Environnement</option>
                      <option value="social">Social</option>
                      <option value="culture">Culture</option>
                      <option value="securite">Sécurité</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Statut</label>
                    <select
                      value={newProject.status}
                      onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                    >
                      <option value="proposed">En attente</option>
                      <option value="planning">Planifié</option>
                      <option value="in_progress">En cours</option>
                      <option value="completed">Terminé</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Budget estimé (€)</label>
                    <input
                      type="number"
                      min="0"
                      value={newProject.budgetEstimated}
                      onChange={(e) => setNewProject({ ...newProject, budgetEstimated: e.target.value })}
                    />
                  </div>
                  <div className="form-row">
                    <label>Début</label>
                    <input
                      type="date"
                      value={newProject.startDate}
                      onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-row">
                    <label>Fin</label>
                    <input
                      type="date"
                      value={newProject.endDate}
                      onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                    />
                  </div>
                  <div className="form-row">
                    <label>Avancement (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newProject.progress}
                      onChange={(e) => setNewProject({ ...newProject, progress: e.target.value })}
                      placeholder="Laisser vide pour calcul automatique"
                    />
                  </div>
                  <div className="form-row">
                    <label>Images (optionnel)</label>
                    <input type="file" accept="image/*" multiple onChange={(e) => setNewProjectFiles(Array.from(e.target.files || []))} />
                  </div>
                  </div>
                </form>
                <div className="projects-modal__footer">
                  <button type="button" className="projects-btn projects-btn--secondary" onClick={() => setShowProjectModal(false)}>Annuler</button>
                  <button type="submit" className="projects-btn projects-btn--primary" form="projects-create-form">Créer</button>
                </div>
              </div>
            </div>
          )}
          {showConfigModal && (
            <div className="projects-modal-overlay" onMouseDown={(e) => handleOverlayMouseDown(e, () => setShowConfigModal(false))}>
              <div className="projects-modal projects-config-modal">
                <div className="projects-modal__header">
                  <h3>Configuration des Projets</h3>
                  <button type="button" className="icon-close" onClick={() => setShowConfigModal(false)} aria-label="Fermer">
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>

                <div className="projects-modal__body">
                  {configLoading && <div>Chargement...</div>}
                  {configError && <div className="error-banner">{configError}</div>}
                  {!configLoading && (
                    <form id="projects-config-form" onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        setConfigError('');
                        await api.put('/api/projects/config', configForm);
                        setShowConfigModal(false);
                        emitToast('Configuration mise à jour.');
                      } catch (err) {
                        setConfigError("Échec de la mise à jour. Vérifiez vos droits/valeurs.");
                      }
                    }}>
                      <div className="form-row">
                        <label>Seuils d'avancement par statut (%)</label>
                        <div className="projects-config-grid">
                          {['proposed','planning','in_progress','completed','cancelled'].map((k) => (
                            <div key={k}>
                              <div className="projects-config-grid__label">
                                {k==='proposed'?'En attente':k==='planning'?'Planifié':k==='in_progress'?'En cours':k==='completed'?'Terminé':'Annulé'}
                              </div>
                              <input type="number" min="0" max="100" value={configForm.progressByStatus?.[k] ?? ''}
                                onChange={(e)=> setConfigForm(prev=>({ ...prev, progressByStatus: { ...(prev.progressByStatus||{}), [k]: e.target.value } }))} />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="form-row">
                        <label>Questions fréquentes (FAQ)</label>
                      </div>
                      {(configForm.faq||[]).map((item, idx) => (
                        <div key={idx} className="faq-item">
                          <div className="form-row">
                            <input type="text" placeholder="Question" value={item.question||''}
                              onChange={(e)=> setConfigForm(prev=> ({ ...prev, faq: prev.faq.map((x,i)=> i===idx? { ...x, question: e.target.value } : x) }))} />
                          </div>
                          <div className="form-row">
                            <textarea rows="3" placeholder="Réponse" value={item.answer||''}
                              onChange={(e)=> setConfigForm(prev=> ({ ...prev, faq: prev.faq.map((x,i)=> i===idx? { ...x, answer: e.target.value } : x) }))} />
                          </div>
                          <div className="faq-item__actions">
                            <button
                              type="button"
                              className="projects-btn projects-btn--danger"
                              onClick={() => openConfirm({
                                title: 'Supprimer la question',
                                message: 'Voulez-vous supprimer cette question de la FAQ ?',
                                onConfirm: async () => setConfigForm(prev => ({ ...prev, faq: prev.faq.filter((_, i) => i !== idx) }))
                              })}
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}

                      <div className="form-row">
                        <button type="button" className="projects-btn projects-btn--secondary" onClick={()=> setConfigForm(prev=> ({ ...prev, faq: [ ...(prev.faq||[]), { question:'', answer:'' } ] }))}>Ajouter une question</button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="projects-modal__footer">
                  <button type="button" className="projects-btn projects-btn--secondary" onClick={()=> setShowConfigModal(false)}>Annuler</button>
                  <button type="submit" className="projects-btn projects-btn--primary" form="projects-config-form" disabled={configLoading}>Enregistrer</button>
                </div>
              </div>
            </div>
          )}
          {showEditModal && editProject && (
            <div className="projects-modal-overlay" onMouseDown={(e) => handleOverlayMouseDown(e, () => { setShowEditModal(false); setEditFiles([]); setEditProject(null); })}>
              <div className="projects-modal projects-project-modal">
                <div className="projects-modal__header">
                  <h3>Modifier le projet</h3>
                  <button type="button" className="icon-close" onClick={() => { setShowEditModal(false); setEditFiles([]); setEditProject(null); }} aria-label="Fermer">
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const newAtt = await uploadImages(editFiles);
                    const attachments = [ ...(editProject.attachments || []), ...newAtt ];
                    await api.put(`/api/projects/${editProject._id}`, {
                      title: editProject.title,
                      description: editProject.description,
                      category: editProject.category,
                      status: editProject.status,
                      budget: editProject.budget?.estimated != null ? { ...editProject.budget, estimated: Number(editProject.budget.estimated) } : editProject.budget,
                      timeline: {
                        startDate: editProject.timeline?.startDate ? new Date(editProject.timeline.startDate) : undefined,
                        endDate: editProject.timeline?.endDate ? new Date(editProject.timeline.endDate) : undefined,
                      },
                      progress: (editProject.progress !== undefined && editProject.progress !== null && editProject.progress !== '') ? Math.max(0, Math.min(100, Number(editProject.progress))) : undefined,
                      attachments,
                    });
                    setShowEditModal(false);
                    setEditFiles([]);
                    setEditProject(null);
                    fetchProjects();
                  } catch (err) {
                    emitToast('Mise à jour impossible.');
                  }
                }} id="projects-edit-form">
                  <div className="projects-modal__body">
                  <div className="form-row">
                    <label>Titre</label>
                    <input type="text" value={editProject.title} onChange={(e)=>setEditProject(prev=>({...prev, title: e.target.value}))} required />
                  </div>
                  <div className="form-row">
                    <label>Description</label>
                    <textarea rows="4" value={editProject.description} onChange={(e)=>setEditProject(prev=>({...prev, description: e.target.value}))} required />
                  </div>
                  <div className="form-row">
                    <label>Catégorie</label>
                    <select value={editProject.category} onChange={(e)=>setEditProject(prev=>({...prev, category: e.target.value}))}>
                      <option value="infrastructure">Infrastructure</option>
                      <option value="environnement">Environnement</option>
                      <option value="social">Social</option>
                      <option value="culture">Culture</option>
                      <option value="securite">Sécurité</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Statut</label>
                    <select value={editProject.status} onChange={(e)=>setEditProject(prev=>({...prev, status: e.target.value}))}>
                      <option value="proposed">En attente</option>
                      <option value="planning">Planifié</option>
                      <option value="in_progress">En cours</option>
                      <option value="completed">Terminé</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Budget estimé (€)</label>
                    <input type="number" min="0" value={editProject.budget?.estimated || ''} onChange={(e)=>setEditProject(prev=>({ ...prev, budget: { ...(prev.budget||{}), estimated: e.target.value } }))} />
                  </div>
                  <div className="form-row">
                    <label>Début</label>
                    <input type="date" value={editProject.timeline?.startDate ? new Date(editProject.timeline.startDate).toISOString().slice(0,10) : ''} onChange={(e)=>setEditProject(prev=>({ ...prev, timeline: { ...(prev.timeline||{}), startDate: e.target.value } }))} />
                  </div>
                  <div className="form-row">
                    <label>Fin</label>
                    <input type="date" value={editProject.timeline?.endDate ? new Date(editProject.timeline.endDate).toISOString().slice(0,10) : ''} onChange={(e)=>setEditProject(prev=>({ ...prev, timeline: { ...(prev.timeline||{}), endDate: e.target.value } }))} />
                  </div>
                  <div className="form-row">
                    <label>Avancement (%)</label>
                    <input type="number" min="0" max="100" value={editProject.progress ?? ''} onChange={(e)=>setEditProject(prev=>({ ...prev, progress: e.target.value }))} placeholder="Laisser vide pour calcul automatique" />
                  </div>
                  <div className="form-row">
                    <label>Pièces jointes</label>
                    <div className="attachments-grid">
                      {(editProject.attachments||[]).map((att, idx)=> (
                        <div key={idx} className="attachment-tile">
                          {att.type === 'image' ? <img alt="att" src={att.url} className="attachment-img"/> : <a href={att.url} target="_blank" rel="noreferrer">Fichier</a>}
                          <button type="button" className="attachment-remove" onClick={()=> setEditProject(prev=>({ ...prev, attachments: (prev.attachments||[]).filter((_,i)=>i!==idx) }))} aria-label="Supprimer">
                            <X size={14} aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="form-row">
                    <label>Ajouter des images</label>
                    <input type="file" accept="image/*" multiple onChange={(e)=>setEditFiles(Array.from(e.target.files||[]))} />
                  </div>
                  </div>
                </form>
                <div className="projects-modal__footer">
                  <button type="button" className="projects-btn projects-btn--secondary" onClick={()=>{ setShowEditModal(false); setEditFiles([]); setEditProject(null); }}>Annuler</button>
                  <button type="submit" className="projects-btn projects-btn--primary" form="projects-edit-form">Enregistrer</button>
                </div>
              </div>
            </div>
          )}

          {confirmOpen && (
            <div className="projects-modal-overlay" onMouseDown={(e) => handleOverlayMouseDown(e, closeConfirm)}>
              <div className="projects-modal projects-confirm-modal">
                <div className="projects-modal__header">
                  <h3>{confirmTitle}</h3>
                  <button type="button" className="icon-close" onClick={closeConfirm} aria-label="Fermer">
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
                <div className="projects-modal__body">
                  <div className="modal-subtitle">{confirmMessage}</div>
                </div>
                <div className="projects-modal__footer">
                  <button type="button" className="projects-btn projects-btn--secondary" onClick={closeConfirm}>Annuler</button>
                  <button type="button" className="projects-btn projects-btn--danger" onClick={handleConfirmSubmit}>Confirmer</button>
                </div>
              </div>
            </div>
          )}
      </div>
    </AdminLayout>
  );
};

export default AdminProjects;
