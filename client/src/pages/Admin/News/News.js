import React, { useState } from 'react';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import AdminHeader from '../../../components/AdminHeader/AdminHeader';
import './News.css';

const News = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="admin-page">
      <AdminSidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <div className={`admin-content ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <AdminHeader 
          title="Gestion des Actualités" 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
        />
        <div className="news-content">
          {/* Contenu de la page des actualités */}
        </div>
      </div>
    </div>
  );
};

export default News;
