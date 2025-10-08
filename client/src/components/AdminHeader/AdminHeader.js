import React, { useEffect, useState } from 'react';
import './AdminHeader.css';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const AdminHeader = ({ title, isCollapsed, setIsCollapsed, notificationsCount = 0 }) => {
  const [user, setUser] = useState(null);
  const [notifCount, setNotifCount] = useState(0);
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
        const res = await api.get('/api/contact?status=new&limit=1');
        const total = (res?.data?.total != null) ? Number(res.data.total) : (Array.isArray(res?.data?.contacts) ? res.data.contacts.length : 0);
        if (!cancelled) setNotifCount(total || 0);
      } catch {
        // ignorer erreurs (non-admin, etc.)
      }
    };
    loadCount();
    const t = setInterval(loadCount, 60000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return (
    <div className="dashboard-header">
      <div className="header-left">
        <button className="toggle-sidebar-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? '☰' : '✕'}
        </button>
        <h1>{title}</h1>
      </div>
      <div className="admin-profile">
        <span className="notification-badge" title="Voir les nouveaux messages" onClick={() => navigate('/admin/messages')}>
          {notificationsCount || notifCount || 0}
        </span>
        <span className="admin-name">{user?.name || '—'}</span>
        <span className="admin-role">{user?.role === 'admin' ? 'Administrateur' : (user?.role ? 'Membre' : '—')}</span>
      </div>
    </div>
  );
};

export default AdminHeader;
