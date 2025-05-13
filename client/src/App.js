import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import News from './pages/News/News';
import Forum from './pages/Forum/Forum';
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
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/news" element={<AdminNews />} />
            <Route path="/admin/forum" element={<AdminForum />} />
            <Route path="/admin/directory" element={<AdminDirectory />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/actualites" element={<News />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/annuaire" element={<Directory />} />
            <Route path="/services" element={<Services />} />
            <Route path="/securite" element={<Security />} />
            <Route path="/projets" element={<Projects />} />
            <Route path="/espace-membres" element={<EspaceMembres />} />
            <Route path="/dons" element={<Donations />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
