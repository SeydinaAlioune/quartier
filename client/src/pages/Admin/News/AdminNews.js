import React, { useCallback, useEffect, useRef, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout';
import './AdminNews.css';
import api from '../../../services/api';
import { emitToast } from '../../../utils/toast';
import {
  Archive,
  Check,
  Eye,
  Film,
  Folder,
  Heart,
  MessageSquare,
  Megaphone,
  Pause,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';

const AdminNews = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [loading, setLoading] = useState(false);
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
  const [pendingUploadFile, setPendingUploadFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', category: 'general' });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadNotice, setUploadNotice] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [commentsList, setCommentsList] = useState([]);
  const [commentsFilter, setCommentsFilter] = useState('all'); // all|approved|pending|rejected
  const [commentsTotal, setCommentsTotal] = useState(0);
  // Annonces importantes (admin)
  const [annList, setAnnList] = useState([]);
  const [annLoading, setAnnLoading] = useState(false);
  const [annError, setAnnError] = useState('');
  const [annForm, setAnnForm] = useState({ title: '', description: '', buttonText: '', link: '', status: 'active', startsAt: '', endsAt: '' });
  const [annEditing, setAnnEditing] = useState(null); // { id, ...fields }
  const [annModalOpen, setAnnModalOpen] = useState(false);
  const [annActiveCount, setAnnActiveCount] = useState(0);
  const [annInactiveCount, setAnnInactiveCount] = useState(0);
  const fileInputRef = useRef(null);
  const API_BASE = (api.defaults.baseURL || process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');
  // Quand on clique "Choisir dans la bibliothèque" depuis un formulaire, on marque la cible
  // { mode: 'create' } ou { mode: 'edit', id }
  const [chooseCoverFor, setChooseCoverFor] = useState(null);
  // Modal sélecteur de média (au-dessus des autres modales)
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const pickerFileRef = useRef(null);

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
        emitToast("Upload terminé, mais le média n'a pas pu être utilisé.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Échec de l'upload.";
      emitToast(msg);
    } finally {
      e.target.value = '';
    }
  };

  // Compteurs de posts par statut
  const fetchPostCounts = useCallback(async () => {
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
  }, []);

  // Charger les posts depuis l'API
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [currentPage, fetchPostCounts, pageSize, searchQuery, statusFilter]);

  // Médias: liste + upload
  const fetchMedia = useCallback(async () => {
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
  }, [mediaTypeFilter]);

  const handleFileSelected = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setPendingUploadFile(file);
    setUploadForm((prev) => ({
      ...prev,
      title: prev.title || file.name,
    }));
    setUploadNotice('');
    setUploadProgress(0);
    e.target.value = '';
  };

  const submitPendingUpload = async () => {
    if (!pendingUploadFile) return;
    try {
      setUploading(true);
      setUploadNotice('');
      setUploadProgress(0);

      const form = new FormData();
      form.append('media', pendingUploadFile);
      form.append('title', uploadForm.title || pendingUploadFile.name);
      form.append('description', uploadForm.description || '');
      form.append('category', uploadForm.category || 'general');

      await api.post('/api/media', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          const total = evt?.total;
          const loaded = evt?.loaded;
          if (typeof total === 'number' && total > 0 && typeof loaded === 'number') {
            const pct = Math.max(0, Math.min(100, Math.round((loaded / total) * 100)));
            setUploadProgress(pct);
          }
        }
      });

      setUploadNotice('Import terminé. Le média apparaît dans la bibliothèque (statut en attente si modération).');
      setPendingUploadFile(null);
      setUploadForm({ title: '', description: '', category: 'general' });
      setUploadProgress(100);
      await fetchMedia();
    } catch (err) {
      const msg = err?.response?.data?.message || "Échec de l'import.";
      setUploadNotice(msg);
    } finally {
      setUploading(false);
    }
  };

  // Comments API
  const fetchComments = useCallback(async () => {
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
    } finally {
      setCommentsLoading(false);
    }
  }, [commentsFilter]);

  // ====== Annonces Importantes (Admin) ======
  const fetchAnnouncements = useCallback(async () => {
    try {
      setAnnLoading(true);
      setAnnError('');
      const res = await api.get('/api/announcements/all');
      const list = Array.isArray(res.data) ? res.data : [];
      setAnnList(list);
    } catch (e) {
      setAnnError("Impossible de charger les annonces importantes.");
      setAnnList([]);
    } finally {
      setAnnLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // lorsque la recherche change, on repart page 1 et on refetch
  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1);
      fetchPosts();
    }, 300);
    return () => clearTimeout(t);
  }, [fetchPosts, searchQuery]);

  // Charger les médias au montage et à l'ouverture de la lib
  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);
  useEffect(() => {
    if (showMediaLibrary) fetchMedia();
  }, [fetchMedia, showMediaLibrary]);
  // Rafraîchir quand le type change
  useEffect(() => {
    if (showMediaLibrary) fetchMedia();
  }, [fetchMedia, mediaTypeFilter, showMediaLibrary]);
  useEffect(() => {
    if (showComments) fetchComments();
  }, [fetchComments, showComments]);
  // Charger les annonces importantes quand la section est ouverte
  useEffect(() => {
    if (showAnnouncements) fetchAnnouncements();
  }, [fetchAnnouncements, showAnnouncements]);

  // Compteur temps réel des annonces actives/inactives
  useEffect(() => {
    let cancelled = false;
    const fetchActiveCount = async () => {
      try {
        const res = await api.get('/api/announcements');
        if (!cancelled) setAnnActiveCount(Array.isArray(res.data) ? res.data.length : 0);
      } catch {
        if (!cancelled) setAnnActiveCount(0);
      }
    };
    const fetchInactiveCount = async () => {
      try {
        const res = await api.get('/api/announcements/all?status=inactive');
        if (!cancelled) setAnnInactiveCount(Array.isArray(res.data) ? res.data.length : 0);
      } catch {
        if (!cancelled) setAnnInactiveCount(0);
      }
    };
    fetchActiveCount();
    fetchInactiveCount();
    const t1 = setInterval(fetchActiveCount, 30000);
    const t2 = setInterval(fetchInactiveCount, 45000);
    return () => { cancelled = true; clearInterval(t1); clearInterval(t2); };
  }, []);
  // Ouvrir le picker déclenchera aussi un rafraîchissement des médias
  useEffect(() => {
    if (showMediaPicker) fetchMedia();
  }, [fetchMedia, showMediaPicker]);

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
      emitToast("Impossible de créer l'article. Vérifiez vos droits et réessayez.");
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
      emitToast("Échec de la modification. Vérifiez vos droits.");
    }
  };

  const handleModerateComment = async (commentId, status) => {
    try {
      await api.put(`/api/posts/comments/${commentId}/moderate`, { status });
      fetchComments();
    } catch (e) {
      emitToast('Action impossible. Vérifiez vos droits (admin).');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Supprimer ce commentaire ?')) return;
    try {
      await api.delete(`/api/posts/comments/${commentId}`);
      fetchComments();
    } catch (e) {
      emitToast('Suppression impossible.');
    }
  };

  const handleReplyToPost = async (postId) => {
    const content = window.prompt('Votre réponse');
    if (!content || !content.trim()) return;
    try {
      await api.post(`/api/posts/${postId}/comments`, { content });
      emitToast('Réponse publiée');
      if (showComments) fetchComments();
    } catch (e) {
      emitToast("Impossible de répondre (connexion requise).");
    }
  };

  // Media moderation (approve/reject)
  const handleModerateMediaStatus = async (mediaId, status) => {
    try {
      await api.put(`/api/media/${mediaId}/moderate`, { status });
      await fetchMedia();
    } catch (e) {
      emitToast('Action impossible. Rôle admin/moderator requis.');
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!window.confirm('Supprimer ce média ? Cette action est définitive.')) return;
    try {
      await api.delete(`/api/media/${mediaId}`);
      await fetchMedia();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Suppression impossible.';
      emitToast(msg);
    }
  };

  const toggleStatus = async (p) => {
    try {
      const next = p.status === 'published' ? 'draft' : 'published';
      await api.put(`/api/posts/${p._id}/status`, { status: next });
      fetchPosts();
    } catch (err) {
      emitToast("Impossible de changer le statut. Vérifiez vos droits.");
    }
  };

  const renderMediaLibrary = () => (
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

      {(pendingUploadFile || uploading || uploadNotice) && (
        <div className="media-upload-panel" role="region" aria-label="Importer un média">
          <div className="media-upload-panel__row">
            <div className="media-upload-file">
              <div className="media-upload-file__label">Fichier</div>
              <div className="media-upload-file__name">{pendingUploadFile ? pendingUploadFile.name : '—'}</div>
              {pendingUploadFile && (
                <button type="button" className="media-upload-cancel" onClick={() => { if (!uploading) { setPendingUploadFile(null); setUploadNotice(''); setUploadProgress(0); } }} disabled={uploading}>
                  Annuler
                </button>
              )}
            </div>

            <div className="media-upload-fields">
              <input
                className="media-upload-input"
                type="text"
                placeholder="Titre (ex: Tournoi interquartiers)"
                value={uploadForm.title}
                onChange={(e) => setUploadForm((p) => ({ ...p, title: e.target.value }))}
                disabled={uploading}
              />
              <textarea
                className="media-upload-textarea"
                placeholder="Description (1-2 phrases pour raconter le moment)"
                value={uploadForm.description}
                onChange={(e) => setUploadForm((p) => ({ ...p, description: e.target.value }))}
                disabled={uploading}
              />
              <select
                className="media-upload-select"
                value={uploadForm.category}
                onChange={(e) => setUploadForm((p) => ({ ...p, category: e.target.value }))}
                disabled={uploading}
              >
                <option value="general">Vie du quartier</option>
                <option value="event">Événements</option>
                <option value="project">Projets</option>
                <option value="history">Histoire</option>
              </select>
              <button
                type="button"
                className="media-upload-submit"
                onClick={submitPendingUpload}
                disabled={uploading || !pendingUploadFile}
              >
                {uploading ? `Import… ${uploadProgress}%` : 'Importer maintenant'}
              </button>
            </div>
          </div>

          {uploading && (
            <div className="media-upload-progress" aria-label="Progression">
              <div className="media-upload-progress__bar" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}

          {uploadNotice && <div className="media-upload-notice">{uploadNotice}</div>}
        </div>
      )}

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
                <div className="video-preview" aria-label="Vidéo">
                  <Film size={22} aria-hidden="true" />
                </div>
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

  const openCreateAnn = () => {
    setAnnForm({ title: '', description: '', buttonText: '', link: '', status: 'active', startsAt: '', endsAt: '' });
    setAnnEditing(null);
    setAnnModalOpen(true);
  };

  const openEditAnn = (a) => {
    setAnnEditing(a);
    setAnnForm({
      title: a.title || '',
      description: a.description || '',
      buttonText: a.buttonText || '',
      link: a.link || '',
      status: a.status || 'inactive',
      startsAt: a.startsAt ? String(a.startsAt).slice(0, 16) : '',
      endsAt: a.endsAt ? String(a.endsAt).slice(0, 16) : '',
    });
    setAnnModalOpen(true);
  };

  const saveAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: annForm.title,
        description: annForm.description,
        buttonText: annForm.buttonText,
        link: annForm.link,
        status: annForm.status,
        startsAt: annForm.startsAt ? new Date(annForm.startsAt).toISOString() : undefined,
        endsAt: annForm.endsAt ? new Date(annForm.endsAt).toISOString() : undefined,
      };
      if (annEditing?.id) {
        await api.put(`/api/announcements/${annEditing.id}`, payload);
      } else {
        await api.post('/api/announcements', payload);
      }
      setAnnModalOpen(false);
      await fetchAnnouncements();
      // refresh compteurs
      try {
        const [r1, r2] = await Promise.all([
          api.get('/api/announcements'),
          api.get('/api/announcements/all?status=inactive')
        ]);
        setAnnActiveCount(Array.isArray(r1.data)?r1.data.length:0);
        setAnnInactiveCount(Array.isArray(r2.data)?r2.data.length:0);
      } catch {}
    } catch (err) {
      emitToast("Enregistrement impossible. Vérifiez vos droits.");
    }
  };

  const toggleAnnStatus = async (a) => {
    try {
      const next = a.status === 'active' ? 'inactive' : 'active';
      await api.put(`/api/announcements/${a.id}`, { status: next });
      await fetchAnnouncements();
      try {
        const [r1, r2] = await Promise.all([
          api.get('/api/announcements'),
          api.get('/api/announcements/all?status=inactive')
        ]);
        setAnnActiveCount(Array.isArray(r1.data)?r1.data.length:0);
        setAnnInactiveCount(Array.isArray(r2.data)?r2.data.length:0);
      } catch {}
    } catch {
      emitToast("Changement de statut impossible");
    }
  };

  const deleteAnn = async (a) => {
    if (!window.confirm('Supprimer cette annonce ?')) return;
    try {
      await api.delete(`/api/announcements/${a.id}`);
      await fetchAnnouncements();
      try { const r = await api.get('/api/announcements'); setAnnActiveCount(Array.isArray(r.data)?r.data.length:0);} catch {}
    } catch {
      emitToast('Suppression impossible');
    }
  };

  const renderAnnouncementsSection = () => (
    <div className="announcements-admin">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem'}}>
        <h3>Annonces Importantes</h3>
        <button className="add-news-btn" type="button" onClick={openCreateAnn}>
          <Plus size={18} aria-hidden="true" />
          <span>Nouvelle annonce</span>
        </button>
      </div>
      {annLoading && <div>Chargement…</div>}
      {!annLoading && annError && <div className="media-error">{annError}</div>}
      {!annLoading && !annError && annList.length === 0 && <div>Aucune annonce</div>}
      {!annLoading && !annError && annList.length > 0 && (
        <>
        <div className="articles-table announcements-table--desktop">
          <table>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Statut</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {annList.map(a => (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td><span className={`status-badge ${a.status}`}>{a.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                  <td>{a.startsAt ? new Date(a.startsAt).toLocaleString('fr-FR') : '—'}</td>
                  <td>{a.endsAt ? new Date(a.endsAt).toLocaleString('fr-FR') : '—'}</td>
                  <td className="actions-cell">
                    <button className="action-btn edit" type="button" title="Modifier" aria-label="Modifier" onClick={() => openEditAnn(a)}>
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button
                      className="action-btn"
                      type="button"
                      title={a.status==='active'?'Désactiver':'Activer'}
                      aria-label={a.status==='active'?'Désactiver':'Activer'}
                      onClick={() => toggleAnnStatus(a)}
                    >
                      {a.status==='active' ? <Pause size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                    </button>
                    <button className="action-btn delete" type="button" title="Supprimer" aria-label="Supprimer" onClick={() => deleteAnn(a)}>
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="news-mobile-cards announcements-cards--mobile" role="list" aria-label="Annonces importantes">
          {annList.map((a) => (
            <div className="news-mobile-card" key={a.id} role="listitem">
              <div className="news-mobile-card__top">
                <div className="news-mobile-card__title">{a.title}</div>
                <div className="news-mobile-card__meta">
                  <span className={`status-badge ${a.status}`}>{a.status === 'active' ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              <div className="news-mobile-card__grid">
                <div className="news-mobile-card__field">
                  <div className="news-mobile-card__label">Début</div>
                  <div className="news-mobile-card__value">{a.startsAt ? new Date(a.startsAt).toLocaleString('fr-FR') : '—'}</div>
                </div>
                <div className="news-mobile-card__field">
                  <div className="news-mobile-card__label">Fin</div>
                  <div className="news-mobile-card__value">{a.endsAt ? new Date(a.endsAt).toLocaleString('fr-FR') : '—'}</div>
                </div>
              </div>
              <div className="news-mobile-card__actions" aria-label="Actions">
                <button className="action-btn edit" type="button" title="Modifier" aria-label="Modifier" onClick={() => openEditAnn(a)}>
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button
                  className="action-btn"
                  type="button"
                  title={a.status==='active'?'Désactiver':'Activer'}
                  aria-label={a.status==='active'?'Désactiver':'Activer'}
                  onClick={() => toggleAnnStatus(a)}
                >
                  {a.status==='active' ? <Pause size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                </button>
                <button className="action-btn delete" type="button" title="Supprimer" aria-label="Supprimer" onClick={() => deleteAnn(a)}>
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {annModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{annEditing? 'Modifier l\'annonce' : 'Créer une annonce'}</h3>
            <form onSubmit={saveAnnouncement}>
              <div className="form-row">
                <label>Titre</label>
                <input type="text" value={annForm.title} onChange={(e) => setAnnForm((p) => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className="form-row">
                <label>Description</label>
                <textarea rows="4" value={annForm.description} onChange={(e) => setAnnForm((p) => ({ ...p, description: e.target.value }))} required />
              </div>
              <div className="form-row">
                <label>Texte du bouton</label>
                <input type="text" value={annForm.buttonText} onChange={(e) => setAnnForm((p) => ({ ...p, buttonText: e.target.value }))} />
              </div>
              <div className="form-row">
                <label>Lien (URL)</label>
                <input type="url" value={annForm.link} onChange={(e) => setAnnForm((p) => ({ ...p, link: e.target.value }))} placeholder="https://…" />
              </div>
              <div className="form-row" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem'}}>
                <div>
                  <label>Début (optionnel)</label>
                  <input type="datetime-local" value={annForm.startsAt} onChange={(e) => setAnnForm((p) => ({ ...p, startsAt: e.target.value }))} />
                </div>
                <div>
                  <label>Fin (optionnel)</label>
                  <input type="datetime-local" value={annForm.endsAt} onChange={(e) => setAnnForm((p) => ({ ...p, endsAt: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <label>Statut</label>
                <select value={annForm.status} onChange={(e) => setAnnForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={()=>setAnnModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
            <button onClick={() => setViewerMedia(null)} className="btn-secondary" style={{ background:'#fff', border:'none', padding:'6px 10px', borderRadius: '6px', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'0.35rem' }}>
              <X size={16} aria-hidden="true" />
              Fermer
            </button>
          </div>
          <div style={{ maxHeight: '80vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {viewerMedia.type === 'image' ? (
              <img src={`${API_BASE}${viewerMedia.url}`} alt={viewerMedia.title || viewerMedia.name || 'media'} style={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain' }} />
            ) : (
              <video controls preload="metadata" style={{ width:'100%', height:'auto', maxHeight:'78vh' }} crossOrigin="anonymous">
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
              <button className="approve-btn" type="button" onClick={() => handleModerateComment(comment.id, 'approved')}>
                <Check size={16} aria-hidden="true" />
                Approuver
              </button>
              <button className="reject-btn" type="button" onClick={() => handleModerateComment(comment.id, 'rejected')}>
                <Archive size={16} aria-hidden="true" />
                Rejeter
              </button>
              <button className="reply-btn" type="button" onClick={() => handleReplyToPost(comment.postId)}>
                <RefreshCw size={16} aria-hidden="true" />
                Répondre
              </button>
              <button className="delete-btn" type="button" onClick={() => handleDeleteComment(comment.id)}>
                <Trash2 size={16} aria-hidden="true" />
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <AdminLayout title="Gestion des Actualités">
      <div className="news-page">
          <div className="news-header">
            <div className="header-title">
              <h1>Articles</h1>
              <p className="header-subtitle">Gérez vos articles, médias et commentaires</p>
            </div>
            <div className="header-actions">
              <button
                className="media-btn"
                type="button"
                onClick={() => {
                  setShowMediaLibrary((v) => !v);
                  setShowComments(false);
                  setShowAnnouncements(false);
                }}
              >
                <Folder size={18} aria-hidden="true" />
                <span>Médias</span>
                <span className="count-badge">{mediaTotal}</span>
              </button>
              <button
                className="comments-btn"
                type="button"
                onClick={() => {
                  setShowComments((v) => !v);
                  setShowMediaLibrary(false);
                  setShowAnnouncements(false);
                }}
              >
                <MessageSquare size={18} aria-hidden="true" />
                <span>Commentaires</span>
                <span className="count-badge">{commentsTotal || '—'}</span>
              </button>
              <button
                className="comments-btn"
                type="button"
                onClick={() => {
                  setShowAnnouncements((v) => !v);
                  setShowMediaLibrary(false);
                  setShowComments(false);
                }}
              >
                <Megaphone size={18} aria-hidden="true" />
                <span>Annonces</span>
                <span className={`count-badge ${annActiveCount>0?'active':''}`}>{annActiveCount}</span>
                {annInactiveCount>0 && (
                  <span className={`count-badge ${annInactiveCount>0?'inactive':''}`} title="Inactives à modérer">{annInactiveCount}</span>
                )}
              </button>
              <button className="add-news-btn" type="button" onClick={() => setShowAddModal(true)}>
                <Plus size={18} aria-hidden="true" />
                <span>Créer un article</span>
              </button>
            </div>
          </div>

          {showMediaLibrary && renderMediaLibrary()}
          {showComments && <CommentsSection />}
          {showAnnouncements && renderAnnouncementsSection()}
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
                    <span className="stat-icon" aria-hidden="true"><Eye size={18} /></span>
                    <span className="stat-value">—</span>
                    <span className="stat-label">Vues</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon" aria-hidden="true"><Heart size={18} /></span>
                    <span className="stat-value">—</span>
                    <span className="stat-label">Likes</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon" aria-hidden="true"><MessageSquare size={18} /></span>
                    <span className="stat-value">—</span>
                    <span className="stat-label">Commentaires</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon" aria-hidden="true"><RefreshCw size={18} /></span>
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

            <div className="articles-table articles-table--desktop">
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
                          <span className={`status-badge ${p.status === 'published' ? 'publié' : 'brouillon'}`}>
                            {p.status === 'published' ? 'Publié' : 'Brouillon'}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button className="action-btn view" type="button" title="Voir" aria-label="Voir">
                            <Eye size={16} aria-hidden="true" />
                          </button>
                          <button className="action-btn edit" type="button" title="Modifier" aria-label="Modifier" onClick={() => handleOpenEdit(p)}>
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                          <button
                            className="action-btn"
                            type="button"
                            title={p.status === 'published' ? 'Passer en brouillon' : 'Publier'}
                            aria-label={p.status === 'published' ? 'Passer en brouillon' : 'Publier'}
                            onClick={() => toggleStatus(p)}
                          >
                            {p.status === 'published' ? <Pause size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                          </button>
                          <button
                            className="action-btn delete"
                            title="Supprimer"
                            aria-label="Supprimer"
                            type="button"
                            onClick={async () => {
                              try {
                                if (window.confirm('Supprimer cet article ?')) {
                                  await api.delete(`/api/posts/${p._id}`);
                                }
                              } catch {
                                emitToast('Suppression impossible.');
                              }
                              fetchPosts();
                            }}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
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

            <div className="news-mobile-cards articles-cards--mobile" role="list" aria-label="Articles">
              {!loading && posts
                .filter(p =>
                  (statusFilter === 'all' || p.status === statusFilter) &&
                  (searchQuery.trim() === '' || (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (p.content || '').toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map((p) => (
                  <div className="news-mobile-card" key={p._id} role="listitem">
                    <div className="news-mobile-card__top">
                      <div className="news-mobile-card__title">{p.title}</div>
                      <div className="news-mobile-card__meta">
                        <span className={`status-badge ${p.status === 'published' ? 'publié' : 'brouillon'}`}>
                          {p.status === 'published' ? 'Publié' : 'Brouillon'}
                        </span>
                      </div>
                    </div>
                    <div className="news-mobile-card__grid">
                      <div className="news-mobile-card__field">
                        <div className="news-mobile-card__label">Auteur</div>
                        <div className="news-mobile-card__value">{p.author?.name || '—'}</div>
                      </div>
                      <div className="news-mobile-card__field">
                        <div className="news-mobile-card__label">Création</div>
                        <div className="news-mobile-card__value">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : '—'}</div>
                      </div>
                    </div>
                    <div className="news-mobile-card__actions" aria-label="Actions">
                      <button className="action-btn view" type="button" title="Voir" aria-label="Voir">
                        <Eye size={16} aria-hidden="true" />
                      </button>
                      <button className="action-btn edit" type="button" title="Modifier" aria-label="Modifier" onClick={() => handleOpenEdit(p)}>
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                      <button
                        className="action-btn"
                        type="button"
                        title={p.status === 'published' ? 'Passer en brouillon' : 'Publier'}
                        aria-label={p.status === 'published' ? 'Passer en brouillon' : 'Publier'}
                        onClick={() => toggleStatus(p)}
                      >
                        {p.status === 'published' ? <Pause size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                      </button>
                      <button
                        className="action-btn delete"
                        title="Supprimer"
                        aria-label="Supprimer"
                        type="button"
                        onClick={async () => {
                          try {
                            if (window.confirm('Supprimer cet article ?')) {
                              await api.delete(`/api/posts/${p._id}`);
                            }
                          } catch {
                            emitToast('Suppression impossible.');
                          }
                          fetchPosts();
                        }}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}

              {!loading && posts.length === 0 && (
                <div className="news-mobile-cards__empty">Aucun article</div>
              )}

              {loading && (
                <div className="news-mobile-cards__empty">Chargement...</div>
              )}
            </div>

            <div className="pagination">
              <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>{'<'}</button>
              <span style={{ padding: '0 8px' }}>Page {currentPage} / {totalPages}</span>
              <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>{'>'}</button>
            </div>
          </div>
      </div>
    </AdminLayout>
  );

};

export default AdminNews;
