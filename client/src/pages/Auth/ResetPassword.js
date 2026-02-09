import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import './Auth.css';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = useMemo(() => String(params.get('token') || ''), [params]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Lien invalide: token manquant');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/reset-password', { token, password });
      setSuccess(res?.data?.message || 'Mot de passe mis à jour');
      window.setTimeout(() => {
        navigate('/login', { state: { flash: 'Mot de passe mis à jour. Vous pouvez vous connecter.' } });
      }, 900);
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de réinitialiser le mot de passe');
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
          <h1 className="auth-title">Nouveau mot de passe</h1>
          <p className="auth-subtitle">Choisis un mot de passe fort (min. 8 caractères).</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label>Nouveau mot de passe</label>
              <input
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label>Confirmer</label>
              <input
                className="auth-input"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            {error && <div className="auth-alert is-error">{error}</div>}
            {success && <div className="auth-alert is-success">{success}</div>}

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </button>

            <div className="auth-row">
              <Link className="auth-link" to="/login">Connexion</Link>
              <Link className="auth-link" to="/forgot-password">Renvoyer un lien</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
