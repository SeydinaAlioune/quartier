import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const from = useMemo(() => {
    const v = location.state && location.state.from;
    return typeof v === 'string' ? v : '';
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', { name, email, password });
      setSession({ token: res.data.token, user: res.data.user });
      const finalName = (res.data?.user?.name || name || '').trim();
      const msg = finalName ? `Compte créé. Bienvenue, ${finalName}` : 'Compte créé. Bienvenue';
      const dest = from || '/';
      setSuccess(msg);
      window.setTimeout(() => {
        navigate(dest, { state: { flash: msg } });
      }, 750);
    } catch (err) {
      setError(err?.response?.data?.message || "Échec de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-card__top">
          <div className="auth-brand">
            <div className="auth-brand__name">QuartierConnect</div>
            <div className="auth-brand__badge">Cité Gendarmerie</div>
          </div>
        </div>
        <div className="auth-card__body">
          <h1 className="auth-title">Créer un compte</h1>
          <p className="auth-subtitle">Rejoignez la communauté en quelques secondes.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label>Nom</label>
              <input className="auth-input" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="auth-field">
              <label>Email</label>
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                inputMode="email"
                required
              />
            </div>

            <div className="auth-field">
              <label>Mot de passe</label>
              <input className="auth-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {success && <div className="auth-alert is-success">{success}</div>}
            {error && <div className="auth-alert is-error">{error}</div>}

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Création...' : "Créer mon compte"}
            </button>

            <div className="auth-row">
              <Link className="auth-link" to="/login" state={{ from: from || '/' }}>Se connecter</Link>
              <Link className="auth-link" to="/forgot-password">Mot de passe oublié</Link>
            </div>
          </form>

          <div className="auth-footnote">
            Déjà un compte ? <Link className="auth-link" to="/login" state={{ from: from || '/' }}>Se connecter</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
