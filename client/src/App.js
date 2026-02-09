import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import SearchResults from './pages/Search/SearchResults';
import News from './pages/News/News';
import Forum from './pages/Forum/Forum';
import Topic from './pages/Forum/Topic';
import Directory from './pages/Directory/Directory';
import Services from './pages/Services/Services';
import Security from './pages/Security/Security';
import Projects from './pages/Projects/Projects';
import EspaceMembres from './pages/EspaceMembres/EspaceMembres';
import Donations from './pages/Donations/Donations';
import AdminLogin from './pages/Admin/AdminLogin';
import Dashboard from './pages/Admin/Dashboard';
import Users from './pages/Admin/Users/Users';
import AdminNews from './pages/Admin/News/AdminNews';
import AdminForum from './pages/Admin/Forum/AdminForum';
import AdminDirectory from './pages/Admin/Directory/AdminDirectory';
import AdminSecurity from './pages/Admin/Security/AdminSecurity';
import AdminProjects from './pages/Admin/Projects/AdminProjects';
import AdminDonations from './pages/Admin/Donations/AdminDonations';
import AdminEvents from './pages/Admin/Events/AdminEvents';
import AdminServices from './pages/Admin/Services/AdminServices';
import AdminPaymentsConfig from './pages/Admin/Payments/AdminPaymentsConfig';
import AdminMessages from './pages/Admin/Messages/AdminMessages';
import './App.css';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import NewsDetail from './pages/News/NewsDetail';
import Gallery from './pages/Gallery/Gallery';

function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isHomeRoute = location.pathname === '/';
  const isAuthRoute = location.pathname === '/login'
    || location.pathname === '/register'
    || location.pathname === '/forgot-password'
    || location.pathname === '/reset-password';

  const [toast, setToast] = useState('');

  const flashFromState = useMemo(() => {
    const v = location.state && location.state.flash;
    return typeof v === 'string' ? v : '';
  }, [location.state]);

  useEffect(() => {
    if (isAdminRoute) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [isAdminRoute, location.pathname]);

  useEffect(() => {
    if (isAdminRoute || isAuthRoute) return;
    const p = location.pathname || '/';
    if (p === '/') return;
    try {
      localStorage.setItem('qc_last_path', p);
    } catch (e) {
      // ignore
    }
  }, [isAdminRoute, isAuthRoute, location.pathname]);

  useEffect(() => {
    if (!flashFromState) return;
    setToast(flashFromState);
    const t = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(t);
  }, [flashFromState]);

  return (
    <div className="App">
      {toast && (
        <div className="app-toast" role="status" aria-live="polite">
          <div className="app-toast__msg">{toast}</div>
          <button type="button" className="app-toast__close" onClick={() => setToast('')} aria-label="Fermer">✕</button>
        </div>
      )}
      {!isAdminRoute && <Navbar />}
      <main className={`main-content ${isAdminRoute ? 'main-content--admin' : ''} ${isHomeRoute ? 'main-content--home' : ''}`}>
        <Routes>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/news" element={<AdminNews />} />
          <Route path="/admin/forum" element={<AdminForum />} />
          <Route path="/admin/directory" element={<AdminDirectory />} />
          <Route path="/admin/security" element={<AdminSecurity />} />
          <Route path="/admin/projects" element={<AdminProjects />} />
          <Route path="/admin/events" element={<AdminEvents />} />
          <Route path="/admin/donations" element={<AdminDonations />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/payments-config" element={<AdminPaymentsConfig />} />
          <Route path="/admin/services" element={<AdminServices />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/actualites" element={<News />} />
          <Route path="/actualites/:id" element={<NewsDetail />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/topics/:id" element={<Topic />} />
          <Route path="/annuaire" element={<Directory />} />
          <Route path="/services" element={<Services />} />
          <Route path="/securite" element={<Security />} />
          <Route path="/projets" element={<Projects />} />
          <Route path="/galerie" element={<Gallery />} />
          <Route path="/recherche" element={<SearchResults />} />
          <Route path="/espace-membres" element={<EspaceMembres />} />
          <Route path="/dons" element={<Donations />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
      {!isAdminRoute && !isAuthRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
