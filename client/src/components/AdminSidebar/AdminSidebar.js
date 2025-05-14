import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminSidebar.css';

const AdminSidebar = ({ isCollapsed }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="header-content">
          <h2>QuartierConnect</h2>
        </div>
      </div>

      <nav className="sidebar-nav">
        <Link to="/admin/dashboard" className={`nav-item ${isActive('/admin/dashboard') ? 'active' : ''}`}>
          <div className="nav-icon">📊</div>
          <span className="nav-text">Tableau de bord</span>
        </Link>
        <Link to="/admin/users" className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}>
          <div className="nav-icon">👥</div>
          <span className="nav-text">Utilisateurs</span>
        </Link>
        <Link to="/admin/news" className={`nav-item ${isActive('/admin/news') ? 'active' : ''}`}>
          <div className="nav-icon">📰</div>
          <span className="nav-text">Actualités</span>
        </Link>
        <Link to="/admin/forum" className={`nav-item ${isActive('/admin/forum') ? 'active' : ''}`}>
          <div className="nav-icon">💬</div>
          <span className="nav-text">Forum</span>
        </Link>
        <Link to="/admin/directory" className={`nav-item ${isActive('/admin/directory') ? 'active' : ''}`}>
          <div className="nav-icon">📘</div>
          <span className="nav-text">Annuaire</span>
        </Link>
        <Link to="/admin/security" className={`nav-item ${isActive('/admin/security') ? 'active' : ''}`}>
          <div className="nav-icon">🛡️</div>
          <span className="nav-text">Sécurité</span>
        </Link>
        <Link to="/admin/projects" className={`nav-item ${isActive('/admin/projects') ? 'active' : ''}`}>
          <div className="nav-icon">📋</div>
          <span className="nav-text">Projets</span>
        </Link>
      </nav>
    </div>
  );
};

export default AdminSidebar;
