import React, { useEffect, useRef, useState } from 'react';
import './AdminHeader.css';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';

const AdminHeader = ({
  title,
  isMobile,
  isDesktopCollapsed,
  isMobileOpen,
  onToggleDesktop,
  onToggleMobile,
  notificationsCount = 0
}) => {
  const [user, setUser] = useState(null);
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifItems, setNotifItems] = useState([]);
  const notifWrapRef = useRef(null);
  const countInFlightRef = useRef(false);
  const navigate = useNavigate();

  const resolveNotifLink = (n) => {
    const link = String(n?.link || '').trim();
    if (link) return link;
    const sourceType = String(n?.metadata?.sourceType || '').trim();
    if (sourceType === 'security_incident') return '/admin/security';
    if (n?.metadata?.contactId) return '/admin/messages';
    return '/admin/messages';
  };

  const markNotifRead = async (id) => {
    if (!id) return;
    try {
      await api.put(`/api/notifications/${id}/read`);
    } catch {}
  };

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
      if (countInFlightRef.current) return;
      countInFlightRef.current = true;
      try {
        const r = await api.get('/api/notifications?read=false&limit=1&page=1');
        const total = Number(r?.data?.unreadCount || 0);
        if (!cancelled) {
          setNotifCount(total);
        }
      } catch {
        if (!cancelled) {
          setNotifCount(0);
        }
      } finally {
        countInFlightRef.current = false;
      }
    };
    loadCount();

    const onFocus = () => loadCount();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') loadCount();
    };

    // Plus réactif que 60s: on rafraîchit plus souvent, mais sans spammer.
    const t = setInterval(loadCount, 15000);

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      clearInterval(t);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const effectiveCount = (notificationsCount || notifCount || 0);

  useEffect(() => {
    if (!notifOpen) return;
    let cancelled = false;
    const loadLatest = async () => {
      try {
        setNotifLoading(true);
        const res = await api.get('/api/notifications?read=false&limit=5&page=1');
        const arr = Array.isArray(res?.data?.notifications)
          ? res.data.notifications
          : (Array.isArray(res?.data) ? res.data : []);
        const total = Number(res?.data?.unreadCount || 0);
        if (!cancelled) {
          setNotifItems(arr);
          setNotifCount(total);
        }
      } catch {
        if (!cancelled) {
          setNotifItems([]);
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
          onClick={isMobile ? onToggleMobile : onToggleDesktop}
          aria-label={isMobile
            ? (isMobileOpen ? 'Fermer le menu' : 'Ouvrir le menu')
            : (isDesktopCollapsed ? 'Agrandir le menu' : 'Réduire le menu')}
        >
          {isMobile
            ? (isMobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />)
            : (isDesktopCollapsed ? <PanelLeftOpen size={20} aria-hidden="true" /> : <PanelLeftClose size={20} aria-hidden="true" />)}
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
            onClick={() => {
              const next = !notifOpen;
              setNotifOpen(next);
              if (next) {
                // Rafraîchir immédiatement le compteur au clic (au lieu d'attendre le timer)
                try {
                  api.get('/api/notifications?read=false&limit=1&page=1').then((r) => {
                    const total = Number(r?.data?.unreadCount || 0);
                    setNotifCount(total);
                  }).catch(() => {});
                } catch {}
              }
            }}
          >
            <Bell size={18} />
            {effectiveCount > 0 && <span className="notif-badge">{effectiveCount}</span>}
          </button>
          {notifOpen && (
            <div className="notif-dropdown" role="menu">
              <div className="notif-dropdown__header">
                <div className="notif-dropdown__title">Notifications</div>
                <button type="button" className="notif-dropdown__link" onClick={() => { setNotifOpen(false); navigate('/admin/notifications'); }}>
                  Tout voir
                </button>
              </div>
              <div className="notif-dropdown__body">
                {notifLoading && <div className="notif-dropdown__empty">Chargement…</div>}
                {!notifLoading && notifItems.length === 0 && (
                  <div className="notif-dropdown__empty">
                    Aucune notification
                  </div>
                )}
                {!notifLoading && notifItems.map((m) => (
                  <button
                    key={m._id}
                    type="button"
                    className="notif-item"
                    onClick={async () => {
                      const to = resolveNotifLink(m);
                      setNotifOpen(false);
                      await markNotifRead(m._id);
                      setNotifCount((v) => Math.max(0, Number(v || 0) - 1));
                      navigate(to);
                    }}
                  >
                    <div className="notif-item__title">{m.title || 'Notification'}</div>
                    <div className="notif-item__meta">{m.message || '—'}</div>
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
