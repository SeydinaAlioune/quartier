import React, { useEffect, useState } from 'react';
import AdminSidebar from '../AdminSidebar/AdminSidebar';
import AdminHeader from '../AdminHeader/AdminHeader';
import './AdminLayout.css';

const AdminLayout = ({ title, notificationsCount = 0, children }) => {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 768px)');

    const sync = () => {
      const mobileNow = !!mq.matches;
      setIsMobile(mobileNow);
      if (!mobileNow) setIsMobileOpen(false);
    };
    sync();

    if (mq.addEventListener) mq.addEventListener('change', sync);
    else mq.addListener(sync);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', sync);
      else mq.removeListener(sync);
    };
  }, []);

  return (
    <div className="admin-shell">
      <AdminSidebar
        isDesktopCollapsed={isDesktopCollapsed}
        isMobile={isMobile}
        isMobileOpen={isMobileOpen}
        onToggleDesktop={() => setIsDesktopCollapsed((v) => !v)}
        onCloseMobile={() => setIsMobileOpen(false)}
      />
      <div className={`admin-shell__content ${isDesktopCollapsed ? 'admin-shell__content--collapsed' : ''}`}>
        <AdminHeader
          title={title}
          isMobile={isMobile}
          isDesktopCollapsed={isDesktopCollapsed}
          isMobileOpen={isMobileOpen}
          onToggleDesktop={() => setIsDesktopCollapsed((v) => !v)}
          onToggleMobile={() => setIsMobileOpen((v) => !v)}
          notificationsCount={notificationsCount}
        />
        <div className="admin-shell__body">{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
