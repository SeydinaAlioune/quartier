import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import AdminHeader from '../../../components/AdminHeader/AdminHeader';
import './AdminProjects.css';
import api from '../../../services/api';

const AdminProjects = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/projects');
      const data = Array.isArray(res.data) ? res.data : [];
      setProjects(data);
    } catch (e) {
      setError("Impossible de charger les projets.");
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
    if (!window.confirm('Supprimer ce projet ?')) return;
    try {
      await api.delete(`/api/projects/${p._id}`);
      fetchProjects();
    } catch (e) {
      alert('Suppression impossible. Vérifiez vos droits.');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Statistiques des projets (selon status backend)
  const projectStats = {
    total: projects.length,
    enCours: projects.filter(p => p.status === 'in_progress').length,
    planifies: projects.filter(p => p.status === 'planning').length,
    termines: projects.filter(p => p.status === 'completed').length,
    enAttente: projects.filter(p => p.status === 'proposed').length
  };

  return (
    <div className="admin-page">
      <AdminSidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <div className={`admin-content ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
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
                <span>⚙️</span>
                <span>Configurer</span>
              </button>
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
            </div>
          </div>

          {/* Liste des projets */}
          <div className="projects-list">
            {loading && <div className="project-card">Chargement...</div>}
            {!loading && projects
              .filter(p => (statusFilter === 'all' || p.status === statusFilter))
              .filter(p => (categoryFilter === 'all' || p.category === categoryFilter))
              .filter(p => {
                const q = searchQuery.trim().toLowerCase();
                return q === '' || (p.title || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
              })
              .map(project => (
                <div key={project._id} className="project-card">
                  <div className="project-header">
                    <h3>{project.title}</h3>
                    <span className={`status-badge ${project.status}`}>
                      {project.status === 'in_progress' ? 'En cours'
                        : project.status === 'planning' ? 'Planifié'
                        : project.status === 'completed' ? 'Terminé'
                        : project.status === 'cancelled' ? 'Annulé'
                        : 'En attente'}
                    </span>
                  </div>
                  <div className="project-info">
                    <div className="info-group">
                      <span className="label">Catégorie:</span>
                      <span className="value">{project.category}</span>
                    </div>
                    <div className="info-group">
                      <span className="label">Budget estimé:</span>
                      <span className="value">{project.budget?.estimated != null ? `${project.budget.estimated} €` : '—'}</span>
                    </div>
                  </div>
                  <div className="project-dates">
                    <div className="date-group">
                      <span className="label">Début:</span>
                      <span className="value">{project.timeline?.startDate ? new Date(project.timeline.startDate).toLocaleDateString('fr-FR') : '—'}</span>
                    </div>
                    <div className="date-group">
                      <span className="label">Fin:</span>
                      <span className="value">{project.timeline?.endDate ? new Date(project.timeline.endDate).toLocaleDateString('fr-FR') : '—'}</span>
                    </div>
                  </div>
                  <div className="project-actions">
                    <button className="action-btn edit" title="Modifier" onClick={() => handleOpenEdit(project)}>✏️</button>
                    <button className="action-btn delete" title="Supprimer" onClick={() => handleDelete(project)}>🗑️</button>
                  </div>
                </div>
              ))}
            {!loading && projects.length === 0 && (
              <div className="project-card">Aucun projet</div>
            )}
          </div>

          {showProjectModal && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Nouveau projet</h3>
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
                    alert('Création impossible. Vérifiez vos droits.');
                  }
                }}>
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
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowProjectModal(false)}>Annuler</button>
                    <button type="submit" className="btn-primary">Créer</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {showConfigModal && (
            <div className="modal-overlay">
              <div className="modal" style={{width:'min(820px, 95vw)'}}>
                <h3>Configuration des Projets</h3>
                {configLoading && <div>Chargement...</div>}
                {configError && <div style={{color: 'crimson'}}>{configError}</div>}
                {!configLoading && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      setConfigError('');
                      await api.put('/api/projects/config', configForm);
                      setShowConfigModal(false);
                    } catch (err) {
                      setConfigError("Échec de la mise à jour. Vérifiez vos droits/valeurs.");
                    }
                  }}>
                    <div className="form-row">
                      <label>Seuils d'avancement par statut (%)</label>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(2,minmax(220px,1fr))', gap:'12px', marginTop:'8px'}}>
                        {['proposed','planning','in_progress','completed','cancelled'].map((k) => (
                          <div key={k}>
                            <div style={{fontSize:'.9rem', color:'#555', marginBottom:4}}>
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
                      <div key={idx} className="form-row">
                        <input type="text" placeholder="Question" value={item.question||''}
                          onChange={(e)=> setConfigForm(prev=> ({ ...prev, faq: prev.faq.map((x,i)=> i===idx? { ...x, question: e.target.value } : x) }))} />
                        <textarea rows="3" placeholder="Réponse" value={item.answer||''}
                          onChange={(e)=> setConfigForm(prev=> ({ ...prev, faq: prev.faq.map((x,i)=> i===idx? { ...x, answer: e.target.value } : x) }))} />
                        <div>
                          <button type="button" className="btn-secondary" onClick={()=> setConfigForm(prev=> ({ ...prev, faq: prev.faq.filter((_,i)=> i!==idx) }))}>Supprimer</button>
                        </div>
                      </div>
                    ))}
                    <div className="form-row">
                      <button type="button" className="btn-secondary" onClick={()=> setConfigForm(prev=> ({ ...prev, faq: [ ...(prev.faq||[]), { question:'', answer:'' } ] }))}>Ajouter une question</button>
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="btn-secondary" onClick={()=> setShowConfigModal(false)}>Annuler</button>
                      <button type="submit" className="btn-primary">Enregistrer</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
          {showEditModal && editProject && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Modifier le projet</h3>
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
                    alert('Mise à jour impossible.');
                  }
                }}>
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
                    <div style={{display:'flex', gap:'.5rem', flexWrap:'wrap'}}>
                      {(editProject.attachments||[]).map((att, idx)=> (
                        <div key={idx} style={{position:'relative'}}>
                          {att.type === 'image' ? <img alt="att" src={att.url} style={{width:96, height:72, objectFit:'cover', borderRadius:6, border:'1px solid #eee'}}/> : <a href={att.url} target="_blank" rel="noreferrer">Fichier</a>}
                          <button type="button" className="action-btn delete" style={{position:'absolute', top: -8, right: -8}} onClick={()=> setEditProject(prev=>({ ...prev, attachments: (prev.attachments||[]).filter((_,i)=>i!==idx) }))}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="form-row">
                    <label>Ajouter des images</label>
                    <input type="file" accept="image/*" multiple onChange={(e)=>setEditFiles(Array.from(e.target.files||[]))} />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={()=>{ setShowEditModal(false); setEditFiles([]); setEditProject(null); }}>Annuler</button>
                    <button type="submit" className="btn-primary">Enregistrer</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProjects;
