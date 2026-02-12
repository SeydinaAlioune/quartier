import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import AdminLayout from '../../../components/AdminLayout/AdminLayout';
import api from '../../../services/api';
import './AdminMessages.css';
import { emitToast } from '../../../utils/toast';
import { Check, Filter, RefreshCw, X } from 'lucide-react';

  // Linkify helper for message body
  const renderLinked = (text = '') => {
    const parts = [];
    const patterns = [
      { type: 'url', regex: /(https?:\/\/[^\s]+)/gi },
      { type: 'email', regex: /([\w.+-]+@[\w-]+\.[\w.-]+)/gi },
      { type: 'tel', regex: /(\+?[0-9][0-9\s().-]{6,}[0-9])/g },
    ];
    let lastIndex = 0;
    const matches = [];
    patterns.forEach(p => {
      let m;
      while ((m = p.regex.exec(text)) !== null) {
        matches.push({ type: p.type, index: m.index, match: m[0] });
      }
    });
    matches.sort((a,b) => a.index - b.index);
    const taken = [];
    for (const m of matches) {
      // skip overlaps
      if (taken.some(t => m.index >= t.index && m.index < t.index + t.len)) continue;
      if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index));
      if (m.type === 'url') {
        parts.push(<a key={m.index} href={m.match} target="_blank" rel="noopener noreferrer">{m.match}</a>);
      } else if (m.type === 'email') {
        parts.push(<a key={m.index} href={`mailto:${m.match}`}>{m.match}</a>);
      } else if (m.type === 'tel') {
        const href = 'tel:' + m.match.replace(/[^+0-9]/g, '');
        parts.push(<a key={m.index} href={href}>{m.match}</a>);
      }
      taken.push({ index: m.index, len: m.match.length });
      lastIndex = m.index + m.match.length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
  };

  const renderPortal = (node) => {
    if (typeof document === 'undefined') return null;
    return createPortal(node, document.body);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'new':
        return 'Nouveau';
      case 'in_progress':
        return 'En cours';
      case 'resolved':
        return 'Résolu';
      case 'closed':
        return 'Fermé';
      default:
        return status || '—';
    }
  };

  const getSourceLabel = (source) => {
    switch (source) {
      case 'contact_page':
        return 'Page contact';
      case 'espace_membres':
        return 'Espace membres';
      case 'other':
        return 'Autre';
      default:
        return source || '—';
    }
  };

const AdminMessages = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [mineOnly, setMineOnly] = useState(false);
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [responding, setResponding] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [stats, setStats] = useState(null);
  const [sources, setSources] = useState([]);
  const [statsError, setStatsError] = useState('');

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bulkMarkOpen, setBulkMarkOpen] = useState(false);
  const [bulkMarkLoading, setBulkMarkLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter && categoryFilter !== 'all') params.set('category', categoryFilter);
      if (sourceFilter && sourceFilter !== 'all') params.set('source', sourceFilter);
      if (mineOnly) params.set('mine', 'true');
      if (unassignedOnly) params.set('unassigned', 'true');
      params.set('limit', '50');
      const res = await api.get(`/api/contact?${params.toString()}`);
      const arr = Array.isArray(res.data?.contacts) ? res.data.contacts : (Array.isArray(res.data) ? res.data : []);
      setMessages(arr);
    } catch (e) {
      setError("Impossible de charger les messages.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, sourceFilter, mineOnly, unassignedOnly]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const fetchStats = async () => {
    try {
      setStatsError('');
      const [s, src] = await Promise.all([
        api.get('/api/contact/stats/summary'),
        api.get('/api/contact/stats/sources')
      ]);
      setStats(s.data || null);
      setSources(Array.isArray(src.data) ? src.data : []);
    } catch (e) {
      setStatsError("Impossible de charger les statistiques.");
    }
  };
  useEffect(() => { fetchStats(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return messages;
    return messages.filter(m =>
      (m.name||'').toLowerCase().includes(term) ||
      (m.email||'').toLowerCase().includes(term) ||
      (m.subject||'').toLowerCase().includes(term) ||
      (m.message||'').toLowerCase().includes(term)
    );
  }, [messages, q]);

  const openDetail = async (msg) => {
    try {
      setSelected({ ...msg, loading: true });
      const res = await api.get(`/api/contact/${msg._id}`);
      setSelected({ ...res.data, loading: false });
      setResponseText('');
    } catch {
      setSelected({ ...msg, loading: false });
    }
  };

  const updateStatus = async (id, status) => {
    try {
      setStatusLoading(true);
      await api.put(`/api/contact/${id}/status`, { status });
      await fetchMessages();
      if (selected?._id === id) setSelected({ ...selected, status });
      await fetchStats();
    } catch {
      emitToast("Mise à jour du statut impossible");
    } finally {
      setStatusLoading(false);
    }
  };

  const respond = async (e) => {
    e.preventDefault();
    if (!selected) return;
    try {
      setResponding(true);
      await api.post(`/api/contact/${selected._id}/respond`, { message: responseText });
      setResponseText('');
      await openDetail(selected);
      await fetchMessages();
    } catch {
      emitToast("Envoi de la réponse impossible");
    } finally {
      setResponding(false);
    }
  };

  const assignToMe = async () => {
    if (!selected) return;
    try {
      setAssignLoading(true);
      await api.put(`/api/contact/${selected._id}/assign`, { assignedTo: 'self' });
      await openDetail(selected);
      await fetchMessages();
      await fetchStats();
      emitToast('Assigné.');
    } catch {
      emitToast("Assignation impossible");
    } finally {
      setAssignLoading(false);
    }
  };

  const unassign = async () => {
    if (!selected) return;
    try {
      setAssignLoading(true);
      await api.put(`/api/contact/${selected._id}/assign`, { action: 'unassign' });
      await openDetail(selected);
      await fetchMessages();
      await fetchStats();
      emitToast('Désassigné.');
    } catch {
      emitToast("Désassignation impossible");
    } finally {
      setAssignLoading(false);
    }
  };

  const bulkMarkNewToInProgress = async () => {
    try {
      setBulkMarkLoading(true);
      await api.post('/api/contact/mark-all-read');
      setBulkMarkOpen(false);
      await fetchMessages();
      await fetchStats();
      emitToast('Nouveaux → En cours');
    } catch {
      emitToast('Action impossible');
    } finally {
      setBulkMarkLoading(false);
    }
  };

  const resultsLabel = `${filtered.length.toLocaleString('fr-FR')} / ${messages.length.toLocaleString('fr-FR')} message(s)`;

  return (
    <AdminLayout title="Messages de Contact">
      <div className="messages-page">
          <div className="messages-toolbar">
            <div className="messages-toolbar__top">
              <input
                className="messages-search"
                placeholder="Rechercher (nom, email, objet, message)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button type="button" className="messages-icon-btn" onClick={() => setFiltersOpen((v) => !v)} aria-label="Filtres">
                <Filter size={18} aria-hidden="true" />
              </button>
              <button type="button" className="messages-btn messages-btn--primary" onClick={fetchMessages} disabled={loading}>
                <RefreshCw size={18} aria-hidden="true" />
                <span>Actualiser</span>
              </button>
            </div>

            <div className="messages-toolbar__meta">{resultsLabel}</div>

            <div className={`messages-toolbar__filters ${filtersOpen ? 'is-open' : ''}`}>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="messages-select">
                <option value="all">Tous statuts</option>
                <option value="new">Nouveaux</option>
                <option value="in_progress">En cours</option>
                <option value="resolved">Résolus</option>
                <option value="closed">Fermés</option>
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="messages-select">
                <option value="all">Toutes catégories</option>
                <option value="general">Général</option>
                <option value="support">Support</option>
                <option value="suggestion">Suggestion</option>
                <option value="complaint">Plainte</option>
                <option value="other">Autre</option>
              </select>
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="messages-select">
                <option value="all">Toutes sources</option>
                {sources.map((s) => (
                  <option key={s._id || 'unknown'} value={s._id || 'other'}>
                    {getSourceLabel(s._id)} ({s.count})
                  </option>
                ))}
              </select>

              <label className="messages-toggle">
                <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
                <span>A moi</span>
              </label>
              <label className="messages-toggle">
                <input type="checkbox" checked={unassignedOnly} onChange={(e) => setUnassignedOnly(e.target.checked)} />
                <span>Non assignés</span>
              </label>

              <button type="button" className="messages-btn messages-btn--secondary" onClick={() => setBulkMarkOpen(true)}>
                <Check size={18} aria-hidden="true" />
                <span>Passer les nouveaux en cours</span>
              </button>
            </div>
          </div>

          {/* Résumé */}
          <div className="messages-stats-grid">
            {statsError && <div className="card error">{statsError}</div>}
            {stats && (
              <>
                <div className="messages-stat"><div className="messages-stat__k">Total</div><div className="messages-stat__v">{stats.total}</div></div>
                <div className="messages-stat"><div className="messages-stat__k">Nouveaux</div><div className="messages-stat__v">{stats.byStatus?.new||0}</div></div>
                <div className="messages-stat"><div className="messages-stat__k">En cours</div><div className="messages-stat__v">{stats.byStatus?.in_progress||0}</div></div>
                <div className="messages-stat"><div className="messages-stat__k">Résolus</div><div className="messages-stat__v">{stats.byStatus?.resolved||0}</div></div>
                <div className="messages-stat"><div className="messages-stat__k">Fermés</div><div className="messages-stat__v">{stats.byStatus?.closed||0}</div></div>
                <div className="messages-stat"><div className="messages-stat__k">Non assignés</div><div className="messages-stat__v">{stats.assigned?.unassigned||0}</div></div>
                <div className="messages-stat"><div className="messages-stat__k">Mes messages</div><div className="messages-stat__v">{stats.assigned?.mineTotal||0} ({stats.assigned?.mineNew||0} nouv.)</div></div>
              </>
            )}
          </div>

          <div className="messages-layout">
            <div className="messages-list">
              {loading && <div className="messages-empty">Chargement…</div>}
              {!loading && error && <div className="messages-empty messages-empty--error">{error}</div>}
              {!loading && !error && filtered.length === 0 && (
                <div className="messages-empty">Aucun message</div>
              )}
              {!loading && !error && filtered.map(m => (
                <div key={m._id} className={`messages-item ${selected?._id===m._id?'is-active':''}`} onClick={()=>openDetail(m)}>
                  <div className="messages-item__top">
                    <div className="messages-item__subject">{m.subject}</div>
                    <div className={`messages-status ${m.status}`}>{getStatusLabel(m.status)}</div>
                  </div>
                  <div className="messages-item__bottom">
                    <span className="messages-item__from">{m.name} · {m.email}</span>
                    <span className="messages-item__date">{m.createdAt ? new Date(m.createdAt).toLocaleString('fr-FR') : ''}</span>
                  </div>
                  {m.assignedTo && (
                    <div className="messages-item__assigned">Assigné: {m.assignedTo?.name || '—'}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="messages-detail">
              {!selected && <div className="messages-placeholder">Sélectionnez un message pour afficher le détail</div>}
              {selected && (
                <div className="detail-card">
                  <div className="detail-head">
                    <div className="detail-title-row">
                      <h3 className="detail-title">{selected.subject}</h3>
                      <div className={`messages-status ${selected.status}`}>{getStatusLabel(selected.status)}</div>
                    </div>
                    <div className="detail-meta">
                      <span className="contact-inline">
                        <span>{selected.name}</span>
                        {selected.email && (<>
                          <span className="sep">·</span>
                          <a href={`mailto:${selected.email}`}>{selected.email}</a>
                        </>)}
                        {selected.phone && (<>
                          <span className="sep">·</span>
                          <a href={`tel:${selected.phone}`}>{selected.phone}</a>
                        </>)}
                      </span>
                      <span>{selected.createdAt ? new Date(selected.createdAt).toLocaleString('fr-FR') : ''}</span>
                    </div>
                  </div>
                  <div className="detail-body">
                    <div className="detail-message">{renderLinked(selected.message || '')}</div>
                    {Array.isArray(selected.responses) && selected.responses.length>0 && (
                      <div className="responses">
                        <h4>Réponses</h4>
                        <ul>
                          {selected.responses.map((r,idx)=> (
                            <li key={idx}>
                              <div className="resp-meta">{r.date?new Date(r.date).toLocaleString('fr-FR'):''}</div>
                              <div className="resp-txt" style={{whiteSpace:'pre-wrap'}}>{r.message}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="detail-actions">
                    <button className="messages-btn messages-btn--secondary" onClick={()=>updateStatus(selected._id,'in_progress')} disabled={statusLoading}>Marquer en cours</button>
                    <button className="messages-btn messages-btn--secondary" onClick={()=>updateStatus(selected._id,'resolved')} disabled={statusLoading}>Marquer résolu</button>
                    <button className="messages-btn messages-btn--secondary" onClick={()=>updateStatus(selected._id,'closed')} disabled={statusLoading}>Fermer</button>
                    <button className="messages-btn messages-btn--primary" onClick={assignToMe} disabled={assignLoading}>Me l'assigner</button>
                    <button className="messages-btn messages-btn--danger" onClick={unassign} disabled={assignLoading}>Désassigner</button>
                  </div>
                  <form className="respond" onSubmit={respond}>
                    <textarea rows={4} placeholder="Votre réponse..." value={responseText} onChange={(e)=>setResponseText(e.target.value)} required />
                    <div className="respond-actions">
                      <button className="messages-btn messages-btn--primary" type="submit" disabled={responding}>{responding?'Envoi...':'Envoyer la réponse'}</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          {bulkMarkOpen && renderPortal(
            <div className="messages-modal-overlay" onMouseDown={() => setBulkMarkOpen(false)}>
              <div className="messages-modal" onMouseDown={(e) => e.stopPropagation()}>
                <div className="messages-modal__header">
                  <h3>Passer les nouveaux en cours</h3>
                  <button type="button" className="messages-icon-btn" onClick={() => setBulkMarkOpen(false)} aria-label="Fermer">
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
                <div className="messages-modal__body">
                  <div className="messages-modal__text">
                    Cette action changera le statut de tous les messages <strong>Nouveaux</strong> en <strong>En cours</strong>.
                  </div>
                </div>
                <div className="messages-modal__footer">
                  <button type="button" className="messages-btn messages-btn--secondary" onClick={() => setBulkMarkOpen(false)} disabled={bulkMarkLoading}>
                    Annuler
                  </button>
                  <button type="button" className="messages-btn messages-btn--primary" onClick={bulkMarkNewToInProgress} disabled={bulkMarkLoading}>
                    {bulkMarkLoading ? 'Mise à jour…' : 'Confirmer'}
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    </AdminLayout>
  );
};

export default AdminMessages;
