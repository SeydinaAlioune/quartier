import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AdminLogin.css';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // 1) Essayer la connexion via l'API
    try {
      const res = await api.post('/api/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });
      // Stocker le token et l'utilisateur
      if (res?.data?.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
      // Vérifier le rôle admin
      if (res?.data?.user?.role === 'admin') {
        return navigate('/admin/dashboard');
      }
      // Si l'utilisateur n'est pas admin, afficher un message
      return setError("Accès refusé: compte non administrateur");
    } catch (err) {
      setError('Email ou mot de passe incorrect');
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-box">
        <h2>Administration</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="login-button">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
