import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Forum.css';
import api from '../../services/api';

const Annonces = () => {
  const navigate = useNavigate();
  const [annonces, setAnnonces] = useState({ vends: [], recherche: [], services: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [myAds, setMyAds] = useState([]);
  const [myLoading, setMyLoading] = useState(false);
  const [myError, setMyError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAd, setEditAd] = useState({ id: '', type: 'vends', titre: '', description: '', prix: '' });

  const [showModal, setShowModal] = useState(false);
  const [newAnnonce, setNewAnnonce] = useState({ type: 'vends', titre: '', description: '', prix: '' });
  const hlDoneRef = useRef(false);

  // Charger depuis l'API
  const fetchAds = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/forum/ads?status=approved&limit=50');
      const list = Array.isArray(res?.data) ? res.data : [];
      const vends = list.filter(a => a.type === 'vends').map(a => ({ id: a.id, titre: a.title, description: a.description, prix: a.price || '—' }));
      const recherche = list.filter(a => a.type === 'recherche').map(a => ({ id: a.id, titre: a.title, description: a.description }));
      const services = list.filter(a => a.type === 'services').map(a => ({ id: a.id, titre: a.title, description: a.description }));
      setAnnonces({ vends, recherche, services });
    } catch (e) {
      setError("Impossible de charger les annonces.");
      setAnnonces({ vends: [], recherche: [], services: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAds(); }, []);

  // Charger mes annonces si connecté
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return; // seulement si connecté
    fetchMyAds();
  }, []);

  const fetchMyAds = async () => {
    try {
      setMyLoading(true);
      setMyError('');
      const r = await api.get('/api/forum/ads/mine');
      setMyAds(Array.isArray(r?.data) ? r.data : []);
    } catch (e) {
      setMyError("Impossible de charger vos annonces.");
    } finally {
      setMyLoading(false);
    }
  };

  // Applique un surlignage si on vient de l'admin avec hlType=ad&hlId=
  useEffect(() => {
    if (hlDoneRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('hlType') === 'ad') {
      const id = params.get('hlId');
      if (id) {
        // attendre que la liste soit rendue
        const el = document.getElementById(`ad-${id}`);
        if (el) {
          hlDoneRef.current = true;
          el.classList.add('highlight');
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => el.classList.remove('highlight'), 4000);
        }
      }
    }
  }, [annonces]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    try {
      const payload = {
        type: newAnnonce.type,
        title: newAnnonce.titre.trim(),
        description: newAnnonce.description.trim(),
        price: newAnnonce.type === 'vends' ? (newAnnonce.prix || '') : ''
      };
      await api.post('/api/forum/ads', payload);
      setShowModal(false);
      setNewAnnonce({ type: 'vends', titre: '', description: '', prix: '' });
      await fetchAds();
      if (localStorage.getItem('token')) { await fetchMyAds(); }
      alert("Annonce envoyée pour approbation par un administrateur.");
    } catch (err) {
      alert("Publication impossible (connexion requise).");
    }
  };

  const handleReport = async (ad) => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    const reason = window.prompt('Raison du signalement (ex: spam, offensif, inexact, autre)', 'autre');
    if (!reason) return;
    try {
      await api.post('/api/forum/reports', { targetType: 'ad', targetId: ad.id, reason });
      alert('Signalement envoyé. Merci.');
    } catch (e) {
      alert('Signalement impossible.');
    }
  };

  return (
    <section className="annonces-section">
      <h2>Petites Annonces</h2>
      {/* Mes annonces (si connecté) */}
      {localStorage.getItem('token') && (
        <div className="annonce-category" style={{ marginBottom: '1.5rem' }}>
          <h3><i className="fas fa-user"></i> Mes annonces</h3>
          {myLoading && <div>Chargement...</div>}
          {!myLoading && myError && <div className="forum-error">{myError}</div>}
          {!myLoading && !myError && myAds.length === 0 && (
            <div>Aucune annonce pour le moment.</div>
          )}
          {!myLoading && !myError && myAds.length > 0 && (
            <ul>
              {myAds.map(ad => (
                <li key={ad.id}>
                  <strong>{(ad.type || '').toUpperCase()}</strong> · {ad.title}
                  {ad.description ? ` — ${ad.description}` : ''}
                  {ad.price ? ` — ${ad.price}` : ''}
                  <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 12, fontSize: 12, background: ad.status === 'approved' ? '#c6f6d5' : ad.status === 'rejected' ? '#fed7d7' : '#fefcbf', color: '#2d3748' }}>
                    {ad.status}
                  </span>
                  <span style={{ marginLeft: 8, color: '#718096' }}>
                    {ad.createdAt ? new Date(ad.createdAt).toLocaleDateString('fr-FR') : ''}
                  </span>
                  <span style={{ marginLeft: 8 }}>
                    <button className="link-like" onClick={() => {
                      setEditAd({ id: ad.id, type: ad.type, titre: ad.title, description: ad.description || '', prix: ad.price || '' });
                      setShowEditModal(true);
                    }}>Modifier</button>
                    <button className="link-like" style={{ marginLeft: 8 }} onClick={async () => {
                      if (!window.confirm('Supprimer cette annonce ?')) return;
                      try {
                        await api.delete(`/api/forum/ads/mine/${ad.id}`);
                        await fetchMyAds();
                        await fetchAds();
                        alert('Annonce supprimée');
                      } catch (e) { alert('Suppression impossible.'); }
                    }}>Supprimer</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="annonces-grid">
        <div className="annonce-category">
          <h3><i className="fas fa-tag"></i> Vends</h3>
          {loading && <div>Chargement...</div>}
          {!loading && error && <div className="forum-error">{error}</div>}
          {!loading && !error && (
            <div className="ad-list">
              {annonces.vends.map(item => (
                <div className="ad-card" id={`ad-${item.id}`} key={item.id}>
                  <div className="ad-card-header">
                    <span className="ad-title">{item.titre}</span>
                    {item.prix && <span className="ad-price">{item.prix}</span>}
                  </div>
                  {item.description && (<p className="ad-desc">{item.description}</p>)}
                  <div className="ad-actions">
                    <button className="link-like" onClick={() => handleReport(item)}>Signaler</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="annonce-category">
          <h3><i className="fas fa-search"></i> Recherche</h3>
          {loading && <div>Chargement...</div>}
          {!loading && !error && (
            <div className="ad-list">
              {annonces.recherche.map(item => (
                <div className="ad-card" id={`ad-${item.id}`} key={item.id}>
                  <div className="ad-card-header">
                    <span className="ad-title">{item.titre}</span>
                  </div>
                  {item.description && (<p className="ad-desc">{item.description}</p>)}
                  <div className="ad-actions">
                    <button className="link-like" onClick={() => handleReport(item)}>Signaler</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="annonce-category">
          <h3><i className="fas fa-hands-helping"></i> Services</h3>
          {loading && <div>Chargement...</div>}
          {!loading && !error && (
            <div className="ad-list">
              {annonces.services.map(item => (
                <div className="ad-card" id={`ad-${item.id}`} key={item.id}>
                  <div className="ad-card-header">
                    <span className="ad-title">{item.titre}</span>
                  </div>
                  {item.description && (<p className="ad-desc">{item.description}</p>)}
                  <div className="ad-actions">
                    <button className="link-like" onClick={() => handleReport(item)}>Signaler</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <button className="new-annonce-btn" onClick={() => setShowModal(true)}>
        <i className="fas fa-plus"></i> Publier une annonce
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="new-discussion-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Publier une annonce</h2>
            <form className="new-discussion-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={newAnnonce.type}
                  onChange={(e) => setNewAnnonce({ ...newAnnonce, type: e.target.value })}
                >
                  <option value="vends">Vends</option>
                  <option value="recherche">Recherche</option>
                  <option value="services">Services</option>
                </select>
              </div>
              <div className="form-group">
                <label>Titre</label>
                <input
                  type="text"
                  placeholder="Ex: Table basse en bois"
                  value={newAnnonce.titre}
                  onChange={(e) => setNewAnnonce({ ...newAnnonce, titre: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Quelques détails utiles..."
                  rows="4"
                  value={newAnnonce.description}
                  onChange={(e) => setNewAnnonce({ ...newAnnonce, description: e.target.value })}
                  required
                ></textarea>
              </div>
              {newAnnonce.type === 'vends' && (
                <div className="form-group">
                  <label>Prix (optionnel)</label>
                  <input
                    type="text"
                    placeholder="Ex: 50€"
                    value={newAnnonce.prix}
                    onChange={(e) => setNewAnnonce({ ...newAnnonce, prix: e.target.value })}
                  />
                </div>
              )}
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-submit">Publier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Modifier mon annonce</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const token = localStorage.getItem('token');
              if (!token) return navigate('/login');
              try {
                const payload = {
                  type: editAd.type,
                  title: editAd.titre.trim(),
                  description: editAd.description.trim(),
                  price: editAd.type === 'vends' ? (editAd.prix || '') : ''
                };
                await api.put(`/api/forum/ads/mine/${editAd.id}`, payload);
                setShowEditModal(false);
                await fetchMyAds();
                await fetchAds();
                alert("Modifications enregistrées (l'annonce repasse en attente d'approbation).");
              } catch (err) {
                alert('Mise à jour impossible.');
              }
            }}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-input" value={editAd.type} onChange={(e) => setEditAd(prev => ({ ...prev, type: e.target.value }))}>
                  <option value="vends">Vends</option>
                  <option value="recherche">Recherche</option>
                  <option value="services">Services</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Titre</label>
                <input className="form-input" value={editAd.titre} onChange={(e) => setEditAd(prev => ({ ...prev, titre: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows="3" className="form-input" value={editAd.description} onChange={(e) => setEditAd(prev => ({ ...prev, description: e.target.value }))} required />
              </div>
              {editAd.type === 'vends' && (
                <div className="form-group">
                  <label className="form-label">Prix</label>
                  <input className="form-input" value={editAd.prix} onChange={(e) => setEditAd(prev => ({ ...prev, prix: e.target.value }))} placeholder="Ex: 50€" />
                </div>
              )}
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Annuler</button>
                <button type="submit" className="btn-submit">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Annonces;
