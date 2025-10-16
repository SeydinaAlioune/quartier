import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
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
import NewsDetail from './pages/News/NewsDetail';
import Gallery from './pages/Gallery/Gallery';

function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="App">
      {!isAdminRoute && <Navbar />}
      <main className={`main-content ${isAdminRoute ? 'main-content--admin' : ''}`}>
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
          <Route path="/espace-membres" element={<EspaceMembres />} />
          <Route path="/dons" element={<Donations />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
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
