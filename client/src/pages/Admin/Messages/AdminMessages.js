import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout';
import api from '../../../services/api';
import './AdminMessages.css';

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
      await api.put(`/api/contact/${id}/status`, { status });
      await fetchMessages();
      if (selected?._id === id) setSelected({ ...selected, status });
    } catch {
      alert("Mise à jour du statut impossible");
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
      alert("Envoi de la réponse impossible");
    } finally {
      setResponding(false);
    }
  };

  // TODO: Implémenter quand les endpoints backend d'assignation seront disponibles
  const assignToMe = async () => {
    if (!selected) return;
    alert("Fonction d'assignation non disponible pour l'instant.");
  };

  const unassign = async () => {
    if (!selected) return;
    alert("Fonction de désassignation non disponible pour l'instant.");
  };

  return (
    <AdminLayout title="Messages de Contact">
      <div className="messages-page">
          <div className="toolbar">
            <input className="search" placeholder="Rechercher (nom, email, objet, message)" value={q} onChange={(e)=>setQ(e.target.value)} />
            <div className="filters">
              <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
                <option value="all">Tous statuts</option>
                <option value="new">Nouveaux</option>
                <option value="in_progress">En cours</option>
                <option value="resolved">Résolus</option>
                <option value="closed">Fermés</option>
              </select>
              <select value={categoryFilter} onChange={(e)=>setCategoryFilter(e.target.value)}>
                <option value="all">Toutes catégories</option>
                <option value="general">Général</option>
                <option value="support">Support</option>
                <option value="suggestion">Suggestion</option>
                <option value="complaint">Plainte</option>
                <option value="other">Autre</option>
              </select>
              <select value={sourceFilter} onChange={(e)=>setSourceFilter(e.target.value)}>
                <option value="all">Toutes sources</option>
                {sources.map(s=> (
                  <option key={s._id||'unknown'} value={s._id||'other'}>{s._id || 'Autre'} ({s.count})</option>
                ))}
              </select>
              <label style={{display:'flex', alignItems:'center', gap:4}}>
                <input type="checkbox" checked={mineOnly} onChange={(e)=>setMineOnly(e.target.checked)} /> A moi
              </label>
              <label style={{display:'flex', alignItems:'center', gap:4}}>
                <input type="checkbox" checked={unassignedOnly} onChange={(e)=>setUnassignedOnly(e.target.checked)} /> Non assignés
              </label>
              <button className="btn" onClick={fetchMessages}>Actualiser</button>
              <button className="btn" onClick={async()=>{ await api.post('/api/contact/mark-all-read'); await fetchMessages(); await fetchStats(); }}>Tout marquer comme lu</button>
            </div>
          </div>

          {/* Résumé */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'10px', margin:'8px 0 12px'}}>
            {statsError && <div className="card error">{statsError}</div>}
            {stats && (
              <>
                <div className="card"><div>Total</div><div style={{fontSize:'1.3rem', fontWeight:700}}>{stats.total}</div></div>
                <div className="card"><div>Nouveaux</div><div style={{fontSize:'1.3rem', fontWeight:700}}>{stats.byStatus?.new||0}</div></div>
                <div className="card"><div>En cours</div><div style={{fontSize:'1.3rem', fontWeight:700}}>{stats.byStatus?.in_progress||0}</div></div>
                <div className="card"><div>Résolus</div><div style={{fontSize:'1.3rem', fontWeight:700}}>{stats.byStatus?.resolved||0}</div></div>
                <div className="card"><div>Fermés</div><div style={{fontSize:'1.3rem', fontWeight:700}}>{stats.byStatus?.closed||0}</div></div>
                <div className="card"><div>Non assignés</div><div style={{fontSize:'1.3rem', fontWeight:700}}>{stats.assigned?.unassigned||0}</div></div>
                <div className="card"><div>Mes messages</div><div style={{fontSize:'1.3rem', fontWeight:700}}>{stats.assigned?.mineTotal||0} ({stats.assigned?.mineNew||0} nouv.)</div></div>
              </>
            )}
          </div>

          <div className="layout">
            <div className="list">
              {loading && <div className="card">Chargement...</div>}
              {!loading && error && <div className="card error">{error}</div>}
              {!loading && !error && filtered.length === 0 && (
                <div className="card">Aucun message</div>
              )}
              {!loading && !error && filtered.map(m => (
                <div key={m._id} className={`item ${selected?._id===m._id?'active':''}`} onClick={()=>openDetail(m)}>
                  <div className="item-top">
                    <div className="subject">{m.subject}</div>
                    <div className={`status ${m.status}`}>{m.status}</div>
                  </div>
                  <div className="item-bottom">
                    <span className="from">{m.name} · {m.email}</span>
                    {m.assignedTo && <span className="from">Assigné: {m.assignedTo?.name || '—'}</span>}
                    <span className="date">{m.createdAt ? new Date(m.createdAt).toLocaleString('fr-FR') : ''}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="detail">
              {!selected && <div className="placeholder">Sélectionnez un message pour afficher le détail</div>}
              {selected && (
                <div className="detail-card">
                  <div className="detail-head">
                    <h3 style={{margin:0}}>{selected.subject}</h3>
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
                    <div style={{whiteSpace:'pre-wrap'}}>{renderLinked(selected.message || '')}</div>
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
                    <button className="btn" onClick={()=>updateStatus(selected._id,'in_progress')}>Marquer en cours</button>
                    <button className="btn" onClick={()=>updateStatus(selected._id,'resolved')}>Marquer résolu</button>
                    <button className="btn" onClick={()=>updateStatus(selected._id,'closed')}>Fermer</button>
                    <button className="btn" onClick={assignToMe}>Me l'assigner</button>
                    <button className="btn" onClick={unassign}>Désassigner</button>
                  </div>
                  <form className="respond" onSubmit={respond}>
                    <textarea rows={4} placeholder="Votre réponse..." value={responseText} onChange={(e)=>setResponseText(e.target.value)} required />
                    <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
                      <button className="btn" type="submit" disabled={responding}>{responding?'Envoi...':'Envoyer la réponse'}</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMessages;
