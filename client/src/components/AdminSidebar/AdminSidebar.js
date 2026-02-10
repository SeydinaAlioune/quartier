import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Newspaper,
  MessageSquare,
  BookOpen,
  Briefcase,
  Shield,
  FolderKanban,
  Calendar,
  HeartHandshake,
  Mail,
  CreditCard,
} from 'lucide-react';
import './AdminSidebar.css';

const AdminSidebar = ({ isCollapsed, onToggle }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const renderNavLink = ({ to, label, Icon }) => (
    <Link
      to={to}
      className={`nav-item ${isActive(to) ? 'active' : ''}`}
      title={label}
      aria-label={label}
    >
      <div className="nav-icon" aria-hidden="true">
        <Icon size={18} />
      </div>
      <span className="nav-text">{label}</span>
    </Link>
  );

  return (
    <>
    <div className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="header-content">
          <h2>QuartierConnect</h2>
          <button
            type="button"
            className="close-sidebar-btn"
            onClick={onToggle}
            aria-label={isCollapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
          >
            {isCollapsed ? '☰' : '✕'}
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group">
          <div className="nav-group__label">Général</div>
          {renderNavLink({ to: '/admin/dashboard', label: 'Tableau de bord', Icon: LayoutDashboard })}
        </div>

        <div className="nav-group">
          <div className="nav-group__label">Contenu</div>
          {renderNavLink({ to: '/admin/news', label: 'Actualités', Icon: Newspaper })}
          {renderNavLink({ to: '/admin/forum', label: 'Forum', Icon: MessageSquare })}
        </div>

        <div className="nav-group">
          <div className="nav-group__label">Communauté</div>
          {renderNavLink({ to: '/admin/users', label: 'Utilisateurs', Icon: Users })}
          {renderNavLink({ to: '/admin/directory', label: 'Annuaire', Icon: BookOpen })}
          {renderNavLink({ to: '/admin/services', label: 'Services', Icon: Briefcase })}
        </div>

        <div className="nav-group">
          <div className="nav-group__label">Sécurité</div>
          {renderNavLink({ to: '/admin/security', label: 'Sécurité', Icon: Shield })}
        </div>

        <div className="nav-group">
          <div className="nav-group__label">Projets</div>
          {renderNavLink({ to: '/admin/projects', label: 'Projets', Icon: FolderKanban })}
          {renderNavLink({ to: '/admin/events', label: 'Événements', Icon: Calendar })}
        </div>

        <div className="nav-group">
          <div className="nav-group__label">Finances</div>
          {renderNavLink({ to: '/admin/donations', label: 'Dons', Icon: HeartHandshake })}
          {renderNavLink({ to: '/admin/payments-config', label: 'Paiements', Icon: CreditCard })}
        </div>

        <div className="nav-group">
          <div className="nav-group__label">Support</div>
          {renderNavLink({ to: '/admin/messages', label: 'Messages', Icon: Mail })}
        </div>
      </nav>
    </div>
    {/* Mobile backdrop to close the sidebar when tapping outside */}
    {onToggle && !isCollapsed && (
      <div className="sidebar-backdrop" onClick={onToggle} />
    )}
    </>
  );
};

export default AdminSidebar;
