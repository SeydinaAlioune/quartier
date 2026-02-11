import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout';
import api from '../../../services/api';
import './AdminEvents.css';
import { emitToast } from '../../../utils/toast';
import { MoreVertical, Pencil, Plus, Trash2, X } from 'lucide-react';

const AdminEvents = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_asc');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [openMenuId, setOpenMenuId] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('Confirmer');
  const [confirmMessage, setConfirmMessage] = useState('');
  const confirmActionRef = useRef(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', location: '' });
  const [editEvent, setEditEvent] = useState(null);

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

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/events');
      const data = Array.isArray(res.data) ? res.data : [];
      setEvents(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

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
      if (showEditModal) {
        setShowEditModal(false);
        setEditEvent(null);
        return;
      }
      if (showCreateModal) {
        setShowCreateModal(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [confirmOpen, openMenuId, showCreateModal, showEditModal]);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (!openMenuId) return;
      const el = e.target;
      if (el && typeof el.closest === 'function' && el.closest('.event-header__right')) return;
      setOpenMenuId(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [openMenuId]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const arr = (events || [])
      .filter(ev => (statusFilter === 'all' || ev.status === statusFilter))
      .filter(ev => q === '' || (ev.title || '').toLowerCase().includes(q) || (ev.description || '').toLowerCase().includes(q) || (ev.location || '').toLowerCase().includes(q));

    const getTs = (d) => {
      const dt = d ? new Date(d) : null;
      const t = dt ? dt.getTime() : NaN;
      return Number.isFinite(t) ? t : 0;
    };

    const sorted = [...arr];
    if (sortBy === 'date_desc') sorted.sort((a, b) => getTs(b.date) - getTs(a.date));
    else sorted.sort((a, b) => getTs(a.date) - getTs(b.date));
    return sorted;
  }, [events, searchQuery, sortBy, statusFilter]);

  const filtersActive = statusFilter !== 'all' || searchQuery.trim() !== '' || sortBy !== 'date_asc';

  const formatEventDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '—';
    const date = dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${date} • ${time}`;
  };

  const statusLabel = (s) => {
    if (s === 'planned') return 'Planifié';
    if (s === 'ongoing') return 'En cours';
    if (s === 'completed') return 'Terminé';
    if (s === 'cancelled') return 'Annulé';
    return 'Statut';
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      await api.post('/api/events', {
        title: newEvent.title,
        description: newEvent.description,
        date: new Date(newEvent.date),
        location: newEvent.location,
      });
      setShowCreateModal(false);
      setNewEvent({ title: '', description: '', date: '', location: '' });
      emitToast('Événement créé.');
      fetchEvents();
    } catch (err) {
      emitToast("Création impossible. Vérifiez vos droits.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = (ev) => {
    setEditEvent({ ...ev });
    const v = ev?.date ? new Date(ev.date) : null;
    const iso = v && !Number.isNaN(v.getTime())
      ? new Date(v.getTime() - v.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : '';
    setEditEvent(prev => ({ ...prev, _dateInput: iso }));
    setShowEditModal(true);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!editEvent?._id) return;
    try {
      setEditLoading(true);
      await api.put(`/api/events/${editEvent._id}`, {
        title: editEvent.title,
        description: editEvent.description,
        date: editEvent._dateInput ? new Date(editEvent._dateInput) : editEvent.date,
        location: editEvent.location,
      });
      setShowEditModal(false);
      setEditEvent(null);
      emitToast('Événement mis à jour.');
      fetchEvents();
    } catch (err) {
      emitToast('Mise à jour impossible.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteEvent = (ev) => {
    if (!ev?._id) return;
    openConfirm({
      title: "Supprimer l'événement",
      message: 'Cette action est définitive. Voulez-vous continuer ?',
      onConfirm: async () => {
        await api.delete(`/api/events/${ev._id}/force`);
        setEvents(prev => prev.filter(x => x._id !== ev._id));
        emitToast('Événement supprimé.');
      }
    });
  };

  return (
    <AdminLayout title="Gestion des Événements">
      <div className="events-page">
          <div className="events-header">
            <div className="header-title">
              <h1>Événements</h1>
              <p className="header-subtitle">Créez et suivez les événements du quartier</p>
            </div>
            <div className="header-actions">
              <button className="events-btn events-btn--primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} aria-hidden="true" />
                <span>Nouvel événement</span>
              </button>
            </div>
          </div>

          <div className="events-filters">
            <div className="events-filters__top">
              <input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="button" className="filters-toggle" onClick={() => setFiltersOpen(v => !v)} aria-expanded={filtersOpen}>
                Filtres{filtersActive ? ' *' : ''}
              </button>
            </div>
            <div className={`filter-group ${filtersOpen ? 'is-open' : ''}`}>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
                <option value="all">Tous les statuts</option>
                <option value="planned">Planifié</option>
                <option value="ongoing">En cours</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
                <option value="date_asc">Date (croissante)</option>
                <option value="date_desc">Date (décroissante)</option>
              </select>
              <div className="filters-meta">
                <div className="results-count">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</div>
                <button
                  type="button"
                  className="events-btn events-btn--ghost"
                  disabled={!filtersActive}
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setSortBy('date_asc');
                  }}
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          <div className="events-list">
            {loading && <div className="event-card">Chargement...</div>}
            {!loading && filtered.map(ev => (
              <div key={ev._id} className="event-card">
                <div className="event-header">
                  <h3 className="event-title">{ev.title || '—'}</h3>
                  <div className="event-header__right">
                    <span className={`status-badge ${ev.status || ''}`}>{statusLabel(ev.status)}</span>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Actions"
                      onClick={() => setOpenMenuId(prev => (prev === ev._id ? null : ev._id))}
                    >
                      <MoreVertical size={16} aria-hidden="true" />
                    </button>
                    {openMenuId === ev._id && (
                      <div className="action-menu" role="menu">
                        <button type="button" className="action-menu__item" onClick={() => { setOpenMenuId(null); handleOpenEdit(ev); }}>
                          <Pencil size={16} aria-hidden="true" />
                          <span>Modifier</span>
                        </button>
                        <div className="action-menu__divider" role="separator" />
                        <button type="button" className="action-menu__item is-danger" onClick={() => { setOpenMenuId(null); handleDeleteEvent(ev); }}>
                          <Trash2 size={16} aria-hidden="true" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="event-meta">
                  <div className="meta-line">
                    <span className="meta-label">Lieu:</span>
                    <span className="meta-value">{ev.location || '—'}</span>
                  </div>
                  <div className="meta-line">
                    <span className="meta-label">Date:</span>
                    <span className="meta-value">{formatEventDate(ev.date)}</span>
                  </div>
                </div>
              </div>
            ))}

            {!loading && filtered.length === 0 && (
              <div className="empty-state">
                <div className="empty-state__title">Aucun événement</div>
                <div className="empty-state__subtitle">Modifie tes filtres ou crée un nouvel événement.</div>
                <div className="empty-state__actions">
                  <button type="button" className="events-btn events-btn--secondary" onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setSortBy('date_asc');
                  }}>
                    Réinitialiser
                  </button>
                  <button type="button" className="events-btn events-btn--primary" onClick={() => setShowCreateModal(true)}>
                    <Plus size={16} aria-hidden="true" />
                    Nouvel événement
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showCreateModal && (
          <div className="events-modal-overlay" onMouseDown={(e) => handleOverlayMouseDown(e, () => setShowCreateModal(false))}>
            <div className="events-modal">
              <div className="events-modal__header">
                <h3>Nouvel événement</h3>
                <button type="button" className="icon-close" onClick={() => setShowCreateModal(false)} aria-label="Fermer">
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <form id="events-create-form" onSubmit={handleCreateEvent}>
                <div className="events-modal__body">
                  <div className="form-row">
                    <label>Titre</label>
                    <input type="text" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <label>Description</label>
                    <textarea rows="4" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <label>Date</label>
                    <input type="datetime-local" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <label>Lieu</label>
                    <input type="text" value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} required />
                  </div>
                </div>
              </form>
              <div className="events-modal__footer">
                <button type="button" className="events-btn events-btn--secondary" onClick={() => setShowCreateModal(false)} disabled={createLoading}>
                  Annuler
                </button>
                <button type="submit" className="events-btn events-btn--primary" form="events-create-form" disabled={createLoading}>
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && editEvent && (
          <div className="events-modal-overlay" onMouseDown={(e) => handleOverlayMouseDown(e, () => { setShowEditModal(false); setEditEvent(null); })}>
            <div className="events-modal">
              <div className="events-modal__header">
                <h3>Modifier l'événement</h3>
                <button type="button" className="icon-close" onClick={() => { setShowEditModal(false); setEditEvent(null); }} aria-label="Fermer">
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <form id="events-edit-form" onSubmit={handleUpdateEvent}>
                <div className="events-modal__body">
                  <div className="form-row">
                    <label>Titre</label>
                    <input type="text" value={editEvent.title || ''} onChange={(e) => setEditEvent(prev => ({ ...prev, title: e.target.value }))} required />
                  </div>
                  <div className="form-row">
                    <label>Description</label>
                    <textarea rows="4" value={editEvent.description || ''} onChange={(e) => setEditEvent(prev => ({ ...prev, description: e.target.value }))} required />
                  </div>
                  <div className="form-row">
                    <label>Date</label>
                    <input type="datetime-local" value={editEvent._dateInput || ''} onChange={(e) => setEditEvent(prev => ({ ...prev, _dateInput: e.target.value }))} required />
                  </div>
                  <div className="form-row">
                    <label>Lieu</label>
                    <input type="text" value={editEvent.location || ''} onChange={(e) => setEditEvent(prev => ({ ...prev, location: e.target.value }))} required />
                  </div>
                </div>
              </form>
              <div className="events-modal__footer">
                <button type="button" className="events-btn events-btn--secondary" onClick={() => { setShowEditModal(false); setEditEvent(null); }} disabled={editLoading}>
                  Annuler
                </button>
                <button type="submit" className="events-btn events-btn--primary" form="events-edit-form" disabled={editLoading}>
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmOpen && (
          <div className="events-modal-overlay" onMouseDown={(e) => handleOverlayMouseDown(e, closeConfirm)}>
            <div className="events-modal events-confirm-modal">
              <div className="events-modal__header">
                <h3>{confirmTitle}</h3>
                <button type="button" className="icon-close" onClick={closeConfirm} aria-label="Fermer">
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <div className="events-modal__body">
                <div className="modal-subtitle">{confirmMessage}</div>
              </div>
              <div className="events-modal__footer">
                <button type="button" className="events-btn events-btn--secondary" onClick={closeConfirm}>Annuler</button>
                <button type="button" className="events-btn events-btn--danger" onClick={handleConfirmSubmit}>Confirmer</button>
              </div>
            </div>
          </div>
        )}
    </AdminLayout>
  );
};

export default AdminEvents;
