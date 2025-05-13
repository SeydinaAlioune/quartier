import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import Services from './pages/Services/Services';
import Forum from './pages/Forum/Forum';
import Projects from './pages/Projects/Projects';
import Dashboard from './pages/Dashboard/Dashboard';
import EspaceMembres from './pages/EspaceMembres/EspaceMembres';
import Donations from './pages/Donations/Donations';
import CreateCampaign from './pages/Donations/CreateCampaign';
import Directory from './pages/Directory/Directory';
import Security from './pages/Security/Security';
import News from './pages/News/News';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/projets" element={<Projects />} />
            <Route path="/espace-membres" element={<EspaceMembres />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dons" element={<Donations />} />
            <Route path="/dons/creer" element={<CreateCampaign />} />
            <Route path="/annuaire" element={<Directory />} />
            <Route path="/securite" element={<Security />} />
            <Route path="/actualites" element={<News />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
