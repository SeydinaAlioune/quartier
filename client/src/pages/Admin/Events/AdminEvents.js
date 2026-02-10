import React, { useEffect, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout';
import api from '../../../services/api';

const AdminEvents = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', location: '' });

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

  const filtered = events
    .filter(ev => (statusFilter === 'all' || ev.status === statusFilter))
    .filter(ev => {
      const q = searchQuery.trim().toLowerCase();
      return q === '' || (ev.title || '').toLowerCase().includes(q) || (ev.description || '').toLowerCase().includes(q) || (ev.location || '').toLowerCase().includes(q);
    });

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/events', {
        title: newEvent.title,
        description: newEvent.description,
        date: new Date(newEvent.date),
        location: newEvent.location,
      });
      setShowAddModal(false);
      setNewEvent({ title: '', description: '', date: '', location: '' });
      fetchEvents();
    } catch (err) {
      alert("Création d'événement impossible. Vérifiez vos droits.");
    }
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
              <button className="add-event-btn" onClick={() => setShowAddModal(true)}>
                <span>+</span>
                <span>Nouvel événement</span>
              </button>
            </div>
          </div>

          <div className="events-filters">
            <input
              type="text"
              placeholder="Rechercher un événement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <div className="filter-group">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
                <option value="all">Tous les statuts</option>
                <option value="planned">Planifié</option>
                <option value="ongoing">En cours</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>

          <div className="events-list">
            {loading && <div className="event-card">Chargement...</div>}
            {!loading && filtered.map(ev => {
              const dateStr = ev.date ? new Date(ev.date).toLocaleString('fr-FR') : '—';
              return (
                <div key={ev._id} className="event-card">
                  <div className="event-header" style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem'}}>
                    <h3 style={{margin:0, fontSize:'1.05rem'}}>{ev.title} — {ev.location} — {dateStr}</h3>
                    <span className={`status-badge ${ev.status}`}>
                      {ev.status === 'planned' ? 'Planifié' : ev.status === 'ongoing' ? 'En cours' : ev.status === 'completed' ? 'Terminé' : 'Annulé'}
                    </span>
                  </div>
                </div>
              );
            })}
            {!loading && filtered.length === 0 && (
              <div className="event-card">Aucun événement</div>
            )}
          </div>
        </div>

        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Nouvel événement</h3>
              <form onSubmit={handleCreateEvent}>
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
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
                  <button type="submit" className="btn-primary">Créer</button>
                </div>
              </form>
            </div>
          </div>
        )}
    </AdminLayout>
  );
};

export default AdminEvents;
