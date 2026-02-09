import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const flash = useMemo(() => {
    const v = location.state && location.state.flash;
    return typeof v === 'string' ? v : '';
  }, [location.state]);

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
      const res = await api.post('/api/auth/login', { email, password });
      setSession({ token: res.data.token, user: res.data.user });
      const name = (res.data?.user?.name || '').trim();
      const msg = name ? `Bienvenue, ${name}` : 'Connexion réussie';

      const dest = from || '/';
      setSuccess(msg);
      window.setTimeout(() => {
        navigate(dest, { state: { flash: msg } });
      }, 700);
    } catch (err) {
      setError(err?.response?.data?.message || "Échec de la connexion");
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
          <h1 className="auth-title">Connexion</h1>
          <p className="auth-subtitle">Heureux de vous revoir.</p>

          <form onSubmit={handleSubmit} className="auth-form">
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
              <input
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {flash && <div className="auth-alert is-success">{flash}</div>}
            {success && <div className="auth-alert is-success">{success}</div>}
            {error && <div className="auth-alert is-error">{error}</div>}

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>

            <div className="auth-row">
              <Link className="auth-link" to="/forgot-password">Mot de passe oublié ?</Link>
              <Link className="auth-link" to="/register" state={{ from: from || '/' }}>Créer un compte</Link>
            </div>
          </form>

          <div className="auth-footnote">
            Pas de compte ? <Link className="auth-link" to="/register" state={{ from: from || '/' }}>Créer un compte</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
