import React from 'react';
import './AdminHeader.css';

const AdminHeader = ({ title, isCollapsed, setIsCollapsed }) => {
  return (
    <div className="dashboard-header">
      <div className="header-left">
        <button className="toggle-sidebar-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? '☰' : '✕'}
        </button>
        <h1>{title}</h1>
      </div>
      <div className="admin-profile">
        <span className="notification-badge">2</span>
        <span className="admin-name">Mohammed Diallo</span>
        <span className="admin-role">Administrateur</span>
      </div>
    </div>
  );
};

export default AdminHeader;
