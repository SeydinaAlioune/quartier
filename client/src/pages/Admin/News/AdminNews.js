import React, { useEffect, useRef, useState } from 'react';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import AdminHeader from '../../../components/AdminHeader/AdminHeader';
import './AdminNews.css';
import api from '../../../services/api';

const AdminNews = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [posts, setPosts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [editing, setEditing] = useState(null); // { id, title, content, status }
  const [totalArticles, setTotalArticles] = useState(0);
  const [publishedTotal, setPublishedTotal] = useState(null);
  const [draftTotal, setDraftTotal] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [mediaTotal, setMediaTotal] = useState(0);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all'); // all|image|video|document (doc not used yet)
  const [mediaSearch, setMediaSearch] = useState('');
  const [viewerMedia, setViewerMedia] = useState(null); // {type, url, title}
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [commentsList, setCommentsList] = useState([]);
  const [commentsFilter, setCommentsFilter] = useState('all'); // all|approved|pending|rejected
  const [commentsTotal, setCommentsTotal] = useState(0);
  const fileInputRef = useRef(null);
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  // Quand on clique "Choisir dans la bibliothèque" depuis un formulaire, on marque la cible
  // { mode: 'create' } ou { mode: 'edit', id }
  const [chooseCoverFor, setChooseCoverFor] = useState(null);
  // Modal sélecteur de média (au-dessus des autres modales)
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const pickerFileRef = useRef(null);

  // Charger les posts depuis l'API
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim() !== '') params.set('search', searchQuery.trim());
      params.set('page', String(currentPage));
      params.set('limit', String(pageSize));
      const res = await api.get(`/api/posts?${params.toString()}`);
      const payload = res?.data;
      const data = Array.isArray(payload?.posts) ? payload.posts : (Array.isArray(payload) ? payload : []);
      setPosts(data);
      if (payload?.totalPages) setTotalPages(Number(payload.totalPages));
      if (typeof payload?.total === 'number') setTotalArticles(Number(payload.total));
      // rafraîchir les compteurs publiés/brouillons
      fetchPostCounts();
    } catch (e) {
      setError("Impossible de charger les articles.");
    } finally {
      setLoading(false);
    }
  };

  // Appliquer l'URL donnée en tant que couverture, selon la cible (create/edit)
  const applyMediaAsCover = (url) => {
    if (chooseCoverFor?.mode === 'create') {
      setNewPost(prev => ({ ...prev, coverUrl: url }));
    } else if (chooseCoverFor?.mode === 'edit') {
      setEditing(prev => prev ? ({ ...prev, coverUrl: url }) : prev);
    }
    setChooseCoverFor(null);
    setShowMediaPicker(false);
  };

  // Upload direct depuis le PC dans le picker, puis utiliser comme couverture
  const handlePickerFileSelected = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const form = new FormData();
      form.append('media', file);
      form.append('title', file.name);
      const res = await api.post('/api/media', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const created = res?.data?.media;
      if (created?.url) {
        // On utilise immédiatement le média comme couverture (qu'il soit pending ou pas)
        applyMediaAsCover(created.url);
      } else {
        alert("Upload terminé, mais le média n'a pas pu être utilisé.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Échec de l'upload.";
      alert(msg);
    } finally {
      e.target.value = '';
    }
  };

  // Compteurs de posts par statut
  const fetchPostCounts = async () => {
    try {
      const [pubRes, draftRes] = await Promise.all([
        api.get('/api/posts?status=published&limit=1&page=1'),
        api.get('/api/posts?status=draft&limit=1&page=1')
      ]);
      setPublishedTotal(typeof pubRes?.data?.total === 'number' ? pubRes.data.total : null);
      setDraftTotal(typeof draftRes?.data?.total === 'number' ? draftRes.data.total : null);
    } catch (e) {
      setPublishedTotal(null);
      setDraftTotal(null);
    }
  };

  // Médias: liste + upload
  const fetchMedia = async () => {
    try {
      setMediaLoading(true);
      setMediaError('');
      const qs = new URLSearchParams();
      qs.set('status', 'all');
      qs.set('page', '1');
      qs.set('limit', '50');
      if (mediaTypeFilter !== 'all') qs.set('type', mediaTypeFilter);
      const res = await api.get(`/api/media?${qs.toString()}`);
      const payload = res?.data;
      const list = Array.isArray(payload?.media) ? payload.media : (Array.isArray(payload) ? payload : []);
      setMediaList(list);
      setMediaTotal(Number(payload?.total || list.length || 0));
    } catch (e) {
      setMediaError("Impossible de charger les médias.");
      setMediaList([]);
      setMediaTotal(0);
    } finally {
      setMediaLoading(false);
    }
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const form = new FormData();
      form.append('media', file);
      form.append('title', file.name);
      await api.post('/api/media', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchMedia();
      alert('Média importé');
    } catch (err) {
      const msg = err?.response?.data?.message || "Échec de l'import.";
      alert(msg);
    } finally {
      e.target.value = '';
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage, statusFilter]);

  // lorsque la recherche change, on repart page 1 et on refetch
  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1);
      fetchPosts();
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Charger les médias au montage et à l'ouverture de la lib
  useEffect(() => {
    fetchMedia();
  }, []);
  useEffect(() => {
    if (showMediaLibrary) fetchMedia();
  }, [showMediaLibrary]);
  // Rafraîchir quand le type change
  useEffect(() => {
    if (showMediaLibrary) fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaTypeFilter]);
  useEffect(() => {
    if (showComments) fetchComments();
  }, [showComments, commentsFilter]);
  // Ouvrir le picker déclenchera aussi un rafraîchissement des médias
  useEffect(() => {
    if (showMediaPicker) fetchMedia();
  }, [showMediaPicker]);

  const handleCloseAdd = () => setShowAddModal(false);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/posts', {
        title: newPost.title,
        content: newPost.content,
        coverUrl: newPost.coverUrl || ''
      });
      setNewPost({ title: '', content: '' });
      setShowAddModal(false);
      fetchPosts();
    } catch (err) {
      alert("Impossible de créer l'article. Vérifiez vos droits et réessayez.");
    }
  };

  const handleOpenEdit = (p) => {
    setEditing({ id: p._id, title: p.title, content: p.content, status: p.status, coverUrl: p.coverUrl || '' });
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await api.put(`/api/posts/${editing.id}`, { title: editing.title, content: editing.content, coverUrl: editing.coverUrl || '' });
      setEditing(null);
      fetchPosts();
    } catch (err) {
      alert("Échec de la modification. Vérifiez vos droits.");
    }
  };

  // Comments API
  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      setCommentsError('');
      const url = commentsFilter === 'all' ? '/api/posts/comments' : `/api/posts/comments?status=${commentsFilter}`;
      const res = await api.get(url);
      const payload = res?.data;
      setCommentsList(Array.isArray(payload?.comments) ? payload.comments : []);
      setCommentsTotal(Number(payload?.total || 0));
    } catch (e) {
      setCommentsError('Impossible de charger les commentaires.');
      setCommentsList([]);
      setCommentsTotal(0);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleModerateComment = async (commentId, status) => {
    try {
      await api.put(`/api/posts/comments/${commentId}/moderate`, { status });
      fetchComments();
    } catch (e) {
      alert('Action impossible. Vérifiez vos droits (admin).');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Supprimer ce commentaire ?')) return;
    try {
      await api.delete(`/api/posts/comments/${commentId}`);
      fetchComments();
    } catch (e) {
      alert('Suppression impossible.');
    }
  };

  const handleReplyToPost = async (postId) => {
    const content = window.prompt('Votre réponse');
    if (!content || !content.trim()) return;
    try {
      await api.post(`/api/posts/${postId}/comments`, { content });
      alert('Réponse publiée');
      if (showComments) fetchComments();
    } catch (e) {
      alert("Impossible de répondre (connexion requise).");
    }
  };

  // Media moderation (approve/reject)
  const handleModerateMediaStatus = async (mediaId, status) => {
    try {
      await api.put(`/api/media/${mediaId}/moderate`, { status });
      await fetchMedia();
    } catch (e) {
      alert('Action impossible. Rôle admin/moderator requis.');
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!window.confirm('Supprimer ce média ? Cette action est définitive.')) return;
    try {
      await api.delete(`/api/media/${mediaId}`);
      await fetchMedia();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Suppression impossible.';
      alert(msg);
    }
  };

  const toggleStatus = async (p) => {
    try {
      const next = p.status === 'published' ? 'draft' : 'published';
      await api.put(`/api/posts/${p._id}/status`, { status: next });
      fetchPosts();
    } catch (err) {
      alert("Impossible de changer le statut. Vérifiez vos droits.");
    }
  };

  // Commentaires: non branché pour l'instant (placeholder vide)
  const comments = [];

  const MediaLibrary = () => (
    <div className="media-library">
      <div className="media-header">
        <h3>Bibliothèque de médias</h3>
        <div className="media-actions">
          <button className="upload-btn" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
            <span>+</span> Importer des médias
          </button>
          <button className="organize-btn" onClick={() => fetchMedia()}>Organiser</button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*" onChange={handleFileSelected} />
        </div>
      </div>
      <div className="media-filters">
        <select className="media-type-filter" value={mediaTypeFilter} onChange={(e) => setMediaTypeFilter(e.target.value)}>
          <option value="all">Tous les types</option>
          <option value="image">Images</option>
          <option value="video">Vidéos</option>
        </select>
        <input type="text" placeholder="Rechercher un média..." className="media-search" value={mediaSearch} onChange={(e) => setMediaSearch(e.target.value)} />
      </div>
      <div className="media-grid">
        {mediaLoading && <div>Chargement des médias...</div>}
        {!mediaLoading && mediaError && <div className="media-error">{mediaError}</div>}
        {!mediaLoading && !mediaError && mediaList.length === 0 && <div>Aucun média</div>}
        {!mediaLoading && !mediaError && mediaList
          .filter(m => mediaTypeFilter === 'all' || m.type === mediaTypeFilter)
          .filter(m => {
            const q = mediaSearch.trim().toLowerCase();
            if (!q) return true;
            const name = (m.title || m.name || '').toLowerCase();
            return name.includes(q);
          })
          .map((media) => (
          <div key={media._id} className="media-item">
            <button className="media-preview" style={{cursor:'pointer', border:'none', background:'transparent', padding:0}} onClick={() => setViewerMedia(media)} title="Aperçu">
              {media.type === 'image' ? (
                <img src={`${API_BASE}${media.url}`} alt={media.title || media.name || 'media'} />
              ) : (
                <div className="video-preview">🎥</div>
              )}
            </button>
            <div className="media-info">
              <span className="media-name">{media.title || media.name || '—'}</span>
              <span className="media-size">{media.metadata?.size || ''}</span>
              <span className={`media-status status-${media.status || 'pending'}`}>{media.status || 'pending'}</span>
            </div>
            <div className="media-actions" style={{display:'flex', gap:'0.5rem', marginTop:'0.25rem', flexWrap:'wrap'}}>
              <button className="approve-btn" onClick={() => setViewerMedia(media)}>Prévisualiser</button>
              {media.status !== 'approved' && (
                <button className="approve-btn" onClick={() => handleModerateMediaStatus(media._id, 'approved')}>Approuver</button>
              )}
              {media.status !== 'rejected' && (
                <button className="reject-btn" onClick={() => handleModerateMediaStatus(media._id, 'rejected')}>Rejeter</button>
              )}
              <button className="delete-btn" onClick={() => handleDeleteMedia(media._id)}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Heuristique pour déterminer le MIME type vidéo depuis l'extension
  const inferMime = (url = '') => {
    const lower = url.toLowerCase();
    if (lower.endsWith('.mp4')) return 'video/mp4';
    if (lower.endsWith('.webm')) return 'video/webm';
    if (lower.endsWith('.ogg') || lower.endsWith('.ogv')) return 'video/ogg';
    if (lower.endsWith('.mov')) return 'video/quicktime';
    return undefined;
  };

  const MediaViewer = () => (
    !viewerMedia ? null : (
      <div className="modal-overlay" style={{ zIndex: 1200, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewerMedia(null)}>
        <div className="modal" style={{ width: '900px', maxWidth: '95vw', background: '#000', borderRadius: '12px', padding: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px', background: '#111' }}>
            <button onClick={() => setViewerMedia(null)} className="btn-secondary" style={{ background:'#fff', border:'none', padding:'6px 10px', borderRadius: '6px', cursor:'pointer' }}>Fermer ✕</button>
          </div>
          <div style={{ maxHeight: '80vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {viewerMedia.type === 'image' ? (
              <img src={`${API_BASE}${viewerMedia.url}`} alt={viewerMedia.title || viewerMedia.name || 'media'} style={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain' }} />
            ) : (
              <video controls autoPlay style={{ width:'100%', height:'auto', maxHeight:'78vh' }} crossOrigin="anonymous">
                <source src={`${API_BASE}${viewerMedia.url}`} type={inferMime(viewerMedia.url)} />
              </video>
            )}
          </div>
          <div style={{ color:'#fff', padding:'8px 12px', background:'#111' }}>{viewerMedia.title || viewerMedia.name || ''}</div>
        </div>
      </div>
    )
  );

  // Media Picker modal (au-dessus des autres modales) pour choisir une couverture
  const MediaPicker = () => (
    !showMediaPicker ? null : (
      <div className="modal-overlay" style={{ zIndex: 1100, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="modal" style={{ width: '900px', maxWidth: '95vw', background: '#fff', borderRadius: '12px', padding: '16px' }}>
          <h3>Sélectionner une image de couverture</h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button className="upload-btn" onClick={() => pickerFileRef.current && pickerFileRef.current.click()}>Téléverser depuis l'ordinateur</button>
            <input type="file" ref={pickerFileRef} style={{ display: 'none' }} accept="image/*" onChange={handlePickerFileSelected} />
            <button className="btn-secondary" onClick={() => { setShowMediaPicker(false); setChooseCoverFor(null); }}>Fermer</button>
          </div>
          <div className="media-grid" style={{ maxHeight: '60vh', overflow: 'auto' }}>
            {mediaLoading && <div>Chargement des médias...</div>}
            {!mediaLoading && mediaError && <div className="media-error">{mediaError}</div>}
            {!mediaLoading && !mediaError && mediaList.filter(m => m.type === 'image').length === 0 && <div>Aucune image</div>}
            {!mediaLoading && !mediaError && mediaList.filter(m => m.type === 'image').map((media) => (
              <div key={media._id} className="media-item" style={{ cursor: 'pointer' }} onClick={() => applyMediaAsCover(media.url)}>
                <div className="media-preview">
                  <img src={`${API_BASE}${media.url}`} alt={media.title || media.name || 'media'} />
                </div>
                <div className="media-info">
                  <span className="media-name">{media.title || media.name || '—'}</span>
                  <span className={`media-status status-${media.status || 'pending'}`}>{media.status || 'pending'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  );

  const CommentsSection = () => (
    <div className="comments-section">
      <div className="comments-header">
        <h3>Gestion des commentaires</h3>
        <div className="comments-filters">
          <select className="status-filter" value={commentsFilter} onChange={(e) => setCommentsFilter(e.target.value)}>
            <option value="all">Tous les statuts</option>
            <option value="approved">Approuvés</option>
            <option value="pending">En attente</option>
            <option value="rejected">Rejetés</option>
          </select>
        </div>
      </div>
      <div className="comments-list">
        {commentsLoading && <div>Chargement des commentaires...</div>}
        {!commentsLoading && commentsError && <div className="comments-error">{commentsError}</div>}
        {!commentsLoading && !commentsError && commentsList.length === 0 && <div>Aucun commentaire</div>}
        {!commentsLoading && !commentsError && commentsList.map((comment) => (
          <div key={comment.id} className={`comment-item ${comment.status}`}>
            <div className="comment-header">
              <span className="comment-author">{comment.author}</span>
              <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="comment-content">{comment.content}</div>
            <div className="comment-article">Sur : {comment.postTitle}</div>
            <div className="comment-actions">
              <button className="approve-btn" onClick={() => handleModerateComment(comment.id, 'approved')}>✓ Approuver</button>
              <button className="reject-btn" onClick={() => handleModerateComment(comment.id, 'rejected')}>✕ Rejeter</button>
              <button className="reply-btn" onClick={() => handleReplyToPost(comment.postId)}>↩ Répondre</button>
              <button className="delete-btn" onClick={() => handleDeleteComment(comment.id)}>🗑️ Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="admin-page">
      <AdminSidebar isCollapsed={isCollapsed} />
      <div className="admin-content">
        <AdminHeader 
          title="Gestion des Actualités" 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
        />
        <div className="news-page">
          <div className="news-header">
            <div className="header-title">
              <h1>Gestion des Actualités</h1>
              <p className="header-subtitle">Gérez vos articles, médias et commentaires</p>
            </div>
            <div className="header-actions">
              <button className="media-btn" onClick={() => setShowMediaLibrary(!showMediaLibrary)}>
                <span>📁</span>
                <span>Médias</span>
                <span className="count-badge">{mediaTotal}</span>
              </button>
              <button className="comments-btn" onClick={() => setShowComments(!showComments)}>
                <span>💬</span>
                <span>Commentaires</span>
                <span className="count-badge">{commentsTotal || '—'}</span>
              </button>
              <button className="add-news-btn" onClick={() => setShowAddModal(true)}>
                <span>+</span>
                <span>Créer un article</span>
              </button>
            </div>
          </div>

          {showMediaLibrary && <MediaLibrary />}
          {showComments && <CommentsSection />}
          <MediaPicker />
          <MediaViewer />

          {editing && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Modifier l'article</h3>
                <form onSubmit={handleSubmitEdit}>
                  <div className="form-row">
                    <label>Titre</label>
                    <input
                      type="text"
                      value={editing.title}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Contenu</label>
                    <textarea
                      rows="6"
                      value={editing.content}
                      onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Image de couverture (URL)</label>
                    <div style={{display:'flex', gap:'0.5rem'}}>
                      <input
                        type="text"
                        value={editing.coverUrl || ''}
                        onChange={(e) => setEditing({ ...editing, coverUrl: e.target.value })}
                        placeholder="/uploads/monfichier.jpg"
                      />
                      <button type="button" onClick={() => { setChooseCoverFor({ mode: 'edit', id: editing.id }); setShowMediaLibrary(false); setShowMediaPicker(true); }}>Choisir dans la bibliothèque</button>
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Annuler</button>
                    <button type="submit" className="btn-primary">Enregistrer</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showAddModal && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Créer un article</h3>
                <form onSubmit={handleCreatePost}>
                  <div className="form-row">
                    <label>Titre</label>
                    <input
                      type="text"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Contenu</label>
                    <textarea
                      rows="6"
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Image de couverture (URL)</label>
                    <div style={{display:'flex', gap:'0.5rem'}}>
                      <input
                        type="text"
                        value={newPost.coverUrl || ''}
                        onChange={(e) => setNewPost({ ...newPost, coverUrl: e.target.value })}
                        placeholder="/uploads/monfichier.jpg"
                      />
                      <button type="button" onClick={() => { setChooseCoverFor({ mode: 'create' }); setShowMediaLibrary(false); setShowMediaPicker(true); }}>Choisir dans la bibliothèque</button>
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={handleCloseAdd}>Annuler</button>
                    <button type="submit" className="btn-primary">Publier</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="stats-section">
            <div className="stats-grid">
              <div className="stats-card">
                <h3>Vue d'ensemble</h3>
                <div className="stats-overview">
                  <div className="stat-item">
                    <span className="stat-value">{totalArticles}</span>
                    <span className="stat-label">Articles total</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{publishedTotal ?? '—'}</span>
                    <span className="stat-label">Publiés</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{draftTotal ?? '—'}</span>
                    <span className="stat-label">Brouillons</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">—</span>
                    <span className="stat-label">En attente</span>
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <h3>Engagement</h3>
                <div className="engagement-stats">
                  <div className="stat-item">
                    <span className="stat-icon">👁️</span>
                    <span className="stat-value">—</span>
                    <span className="stat-label">Vues</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">❤️</span>
                    <span className="stat-value">—</span>
                    <span className="stat-label">Likes</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">💬</span>
                    <span className="stat-value">—</span>
                    <span className="stat-label">Commentaires</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">🔄</span>
                    <span className="stat-value">—</span>
                    <span className="stat-label">Partages</span>
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <h3>Catégories</h3>
                <div className="categories-chart">—</div>
              </div>
            </div>
          </div>

          <div className="articles-section">
            <div className="articles-header">
              <h2>Liste des Articles</h2>
              <div className="articles-filters">
                <input
                  type="text"
                  placeholder="Rechercher un article..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <div className="filter-group">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="published">Publié</option>
                    <option value="draft">Brouillon</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="articles-table">
              <table>
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Auteur</th>
                    <th>Création</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center' }}>Chargement...</td>
                    </tr>
                  )}
                  {!loading && posts
                    .filter(p =>
                      (statusFilter === 'all' || p.status === statusFilter) &&
                      (searchQuery.trim() === '' || (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (p.content || '').toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((p) => (
                      <tr key={p._id}>
                        <td>{p.title}</td>
                        <td>{p.author?.name || '—'}</td>
                        <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                        <td>
                          <span className={`status-badge ${p.status}`}>
                            {p.status === 'published' ? 'Publié' : 'Brouillon'}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button className="action-btn view" title="Voir">👁️</button>
                          <button className="action-btn edit" title="Modifier" onClick={() => handleOpenEdit(p)}>✏️</button>
                          <button className="action-btn" title={p.status === 'published' ? 'Passer en brouillon' : 'Publier'} onClick={() => toggleStatus(p)}>
                            {p.status === 'published' ? '⏸️' : '✅'}
                          </button>
                          <button className="action-btn delete" title="Supprimer" onClick={async () => {
                            try {
                              // Tentative suppression admin
                              await api.delete(`/api/posts/${p._id}/force`);
                            } catch (e1) {
                              try {
                                // Fallback: suppression par auteur
                                await api.delete(`/api/posts/${p._id}`);
                              } catch (e2) {
                                alert('Suppression impossible. Vérifiez vos droits.');
                                return;
                              }
                            }
                            fetchPosts();
                          }}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  {!loading && posts.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center' }}>Aucun article</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>{'<'}</button>
              <span style={{ padding: '0 8px' }}>Page {currentPage} / {totalPages}</span>
              <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>{'>'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

};

export default AdminNews;
