import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import './Auth.css';

const ForgotPassword = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
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
      const res = await api.post('/api/auth/forgot-password', { email });
      setSuccess(res?.data?.message || 'Si un compte existe, vous recevrez un lien de réinitialisation.');
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible d'envoyer la demande. Réessayez.");
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
          <h1 className="auth-title">Mot de passe oublié</h1>
          <p className="auth-subtitle">On t'envoie un lien sécurisé valable 30 minutes.</p>

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

            {error && <div className="auth-alert is-error">{error}</div>}
            {success && <div className="auth-alert is-success">{success}</div>}

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>

            <div className="auth-row">
              <Link className="auth-link" to="/login" state={{ from: from || '/' }}>Retour à la connexion</Link>
              <Link className="auth-link" to="/register">Créer un compte</Link>
            </div>
          </form>

          <div className="auth-footnote">
            Si tu ne reçois rien, vérifie tes spams ou réessaie dans quelques minutes.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
