import React, { useEffect, useRef, useState } from 'react';
import './AdminHeader.css';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, X } from 'lucide-react';

const AdminHeader = ({ title, isCollapsed, setIsCollapsed, notificationsCount = 0 }) => {
  const [user, setUser] = useState(null);
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifItems, setNotifItems] = useState([]);
  const [notifTotal, setNotifTotal] = useState(0);
  const notifWrapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const hydrate = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.removeItem('user');
        setUser(null);
        return;
      }
      // tenter le cache
      const cached = localStorage.getItem('user');
      if (cached) {
        try { setUser(JSON.parse(cached)); } catch {}
      }
      // puis le profil serveur
      try {
        const res = await api.get('/api/auth/profile');
        if (res?.data) {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify({
            id: res.data._id || res.data.id,
            name: res.data.name,
            email: res.data.email,
            role: res.data.role,
          }));
        }
      } catch {
        // pas d'erreur bloquante
      }
    };
    hydrate();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadCount = async () => {
      try {
        const r = await api.get('/api/contact?status=new&limit=1&page=1');
        const total = Number(r?.data?.total || 0);
        if (!cancelled) {
          setNotifCount(total);
          setNotifTotal(total);
        }
      } catch {
        if (!cancelled) {
          setNotifCount(0);
          setNotifTotal(0);
        }
      }
    };
    loadCount();
    const t = setInterval(loadCount, 60000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const effectiveCount = (notificationsCount || notifCount || 0);

  useEffect(() => {
    if (!notifOpen) return;
    let cancelled = false;
    const loadLatest = async () => {
      try {
        setNotifLoading(true);
        const res = await api.get('/api/contact?status=new&limit=5&page=1');
        const arr = Array.isArray(res?.data?.contacts)
          ? res.data.contacts
          : (Array.isArray(res?.data) ? res.data : []);
        const total = Number(res?.data?.total || arr.length || 0);
        if (!cancelled) {
          setNotifItems(arr);
          setNotifTotal(total);
          setNotifCount(total);
        }
      } catch {
        if (!cancelled) {
          setNotifItems([]);
          setNotifTotal(0);
          setNotifCount(0);
        }
      } finally {
        if (!cancelled) setNotifLoading(false);
      }
    };
    loadLatest();
    return () => { cancelled = true; };
  }, [notifOpen]);

  useEffect(() => {
    if (!notifOpen) return;
    const onDocPointer = (e) => {
      const root = notifWrapRef.current;
      if (!root) return;
      if (root.contains(e.target)) return;
      setNotifOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setNotifOpen(false);
    };
    document.addEventListener('mousedown', onDocPointer);
    document.addEventListener('touchstart', onDocPointer, { passive: true });
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocPointer);
      document.removeEventListener('touchstart', onDocPointer);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [notifOpen]);

  return (
    <div className="admin-header">
      <div className="header-left">
        <button
          type="button"
          className="toggle-sidebar-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
        >
          {isCollapsed ? <Menu size={20} aria-hidden="true" /> : <X size={20} aria-hidden="true" />}
        </button>
        <h1>{title}</h1>
      </div>
      <div className="admin-profile">
        <div className="admin-notifications" ref={notifWrapRef}>
          <button
            type="button"
            className={`notif-btn ${effectiveCount > 0 ? 'has-unread' : ''}`}
            aria-label="Notifications"
            aria-haspopup="menu"
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen(v => !v)}
          >
            <Bell size={18} />
            {effectiveCount > 0 && <span className="notif-badge">{effectiveCount}</span>}
          </button>
          {notifOpen && (
            <div className="notif-dropdown" role="menu">
              <div className="notif-dropdown__header">
                <div className="notif-dropdown__title">Nouveaux messages</div>
                <button type="button" className="notif-dropdown__link" onClick={() => { setNotifOpen(false); navigate('/admin/messages'); }}>
                  Tout voir
                </button>
              </div>
              <div className="notif-dropdown__body">
                {notifLoading && <div className="notif-dropdown__empty">Chargement…</div>}
                {!notifLoading && notifItems.length === 0 && (
                  <div className="notif-dropdown__empty">
                    {notifTotal > 0
                      ? `Vous avez ${notifTotal} nouveau(x) message(s).`
                      : 'Aucun nouveau message'}
                  </div>
                )}
                {!notifLoading && notifItems.map((m) => (
                  <button
                    key={m._id}
                    type="button"
                    className="notif-item"
                    onClick={() => { setNotifOpen(false); navigate('/admin/messages'); }}
                  >
                    <div className="notif-item__title">{m.subject || 'Message'}</div>
                    <div className="notif-item__meta">{m.name || m.email || '—'}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="admin-identity">
          <span className="admin-name">{user?.name || '—'}</span>
          <span className="admin-role">{user?.role === 'admin' ? 'Administrateur' : (user?.role ? 'Membre' : '—')}</span>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
