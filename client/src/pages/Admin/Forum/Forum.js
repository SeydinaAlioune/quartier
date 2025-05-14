import React, { useState } from 'react';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import AdminHeader from '../../../components/AdminHeader/AdminHeader';
import './Forum.css';

const Forum = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="admin-page">
      <AdminSidebar isCollapsed={isCollapsed} />
      <div className="admin-content">
        <AdminHeader 
          title="Gestion du Forum" 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
        />
        <div className="forum-content">
          {/* Contenu de la page du forum */}
        </div>
      </div>
    </div>
  );
};

export default Forum;
