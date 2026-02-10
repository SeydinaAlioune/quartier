import React, { useState } from 'react';
import AdminSidebar from '../AdminSidebar/AdminSidebar';
import AdminHeader from '../AdminHeader/AdminHeader';
import './AdminLayout.css';

const AdminLayout = ({ title, notificationsCount = 0, children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="admin-shell">
      <AdminSidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <div className={`admin-shell__content ${isCollapsed ? 'admin-shell__content--collapsed' : ''}`}>
        <AdminHeader
          title={title}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          notificationsCount={notificationsCount}
        />
        <div className="admin-shell__body">{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
