import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import News from './pages/News/News';
import Forum from './pages/Forum/Forum';
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
        <Routes>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/news" element={<AdminNews />} />
          <Route path="/admin/forum" element={<AdminForum />} />
          <Route path="/admin/directory" element={<AdminDirectory />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/" element={
            <>
              <Home />
              <News />
              <Forum />
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
