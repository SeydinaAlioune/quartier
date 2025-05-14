import React, { useState } from 'react';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import AdminHeader from '../../../components/AdminHeader/AdminHeader';
import './Directory.css';

const Directory = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="admin-page">
      <AdminSidebar isCollapsed={isCollapsed} />
      <div className="admin-content">
        <AdminHeader 
          title="Gestion de l'Annuaire" 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
        />
        <div className="directory-content">
          {/* Contenu de la page de l'annuaire */}
        </div>
      </div>
    </div>
  );
};

export default Directory;
