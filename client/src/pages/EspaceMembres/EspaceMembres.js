import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import './EspaceMembres.css';

const EspaceMembres = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout: authLogout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  const [accountOpen, setAccountOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const isAuthed = isAuthenticated;

  useEffect(() => {
    // Pré-remplir depuis le user connecté si disponible
    if (user) {
      setForm(prev => ({ ...prev, name: user.name || prev.name, email: user.email || prev.email }));
    }
  }, [user]);

  const logout = () => {
    authLogout();
    navigate('/', { state: { flash: 'Vous êtes déconnecté' } });
  };

  const openDelete = () => {
    setDeleteError('');
    setDeletePassword('');
    setDeleteConfirm('');
    setDeleteOpen(true);
  };

  const doDelete = async () => {
    setDeleteError('');
    if (deleteConfirm.trim().toUpperCase() !== 'SUPPRIMER') {
      setDeleteError('Tapez SUPPRIMER pour confirmer');
      return;
    }
    if (!deletePassword) {
      setDeleteError('Mot de passe requis');
      return;
    }

    setDeleteLoading(true);
    try {
      await api.delete('/api/users/me', { data: { password: deletePassword } });
      authLogout();
      navigate('/', { state: { flash: 'Compte supprimé' } });
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Impossible de supprimer le compte');
    } finally {
      setDeleteLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      setSending(true);
      setError('');
      setSuccess('');
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: form.subject || 'Support Espace Membres',
        message: form.message,
        category: 'support',
        source: 'espace_membres'
      };
      await api.post('/api/contact/submit', payload);
      setSuccess('Message envoyé. Nous vous répondrons rapidement.');
      setForm({ name: form.name, email: form.email, phone: '', subject: '', message: '' });
      // Fermer après un court délai
      setTimeout(() => { setShowModal(false); setSuccess(''); }, 1200);
    } catch (err) {
      setError("Impossible d'envoyer le message. Réessayez plus tard.");
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="espace-membres">
      <div className="header-section">
        <h1>Espace Membres</h1>
        <p>Rejoignez notre communauté pour participer pleinement à la vie du quartier</p>
      </div>

      <div className="login-options">
        {/* Option Connexion */}
        <div className="option-card">
          <div className="icon">
            <i className="fas fa-sign-in-alt"></i>
          </div>
          <h2>Déjà Membre ?</h2>
          <p>Connectez-vous pour accéder à votre espace personnel</p>
          <Link to="/login" state={{ from: '/espace-membres' }} className="action-button green">Se Connecter</Link>
        </div>

        {/* Option Inscription */}
        <div className="option-card">
          <div className="icon">
            <i className="fas fa-user-plus"></i>
          </div>
          <h2>Nouveau sur QuartierConnect ?</h2>
          <p>Créez votre compte en quelques minutes pour rejoindre notre communauté</p>
          <Link to="/register" state={{ from: '/espace-membres' }} className="action-button orange">Créer un Compte</Link>
        </div>
      </div>

      <div className="features-section">
        <h2>Fonctionnalités de l'Espace Membres</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Forum Privé</h3>
            <p>Participez aux discussions réservées aux membres et échangez directement avec vos voisins</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Notifications Personnalisées</h3>
            <p>Recevez des alertes sur les sujets qui vous intéressent (sécurité, événements, projets)</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Événements Exclusifs</h3>
            <p>Inscrivez-vous aux événements du quartier et recevez des invitations spéciales</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h3>Participation Citoyenne</h3>
            <p>Votez pour les projets du quartier et proposez vos propres idées d'amélioration</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Groupes Thématiques</h3>
            <p>Rejoignez des groupes selon vos centres d'intérêt (jardinage, sport, culture, entraide)</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">↔️</div>
            <h3>Échange de Services</h3>
            <p>Proposez ou recherchez des services entre voisins (garde d'enfants, bricolage, covoiturage)</p>
          </div>
        </div>
      </div>

      <div className="help-section">
        <h2>Besoin d'Aide ?</h2>
        <p>Notre équipe est à votre disposition pour vous accompagner dans la création de votre compte ou pour toute autre question.</p>
        <div className="contact-info">
          <div>
            <strong>Email:</strong> support@quartierconnect.fr
          </div>
          <div>
            <strong>Téléphone:</strong> 01 XX XX XX XX (du lundi au vendredi, 9h-18h)
          </div>
        </div>
        <button className="contact-button" onClick={() => setShowModal(true)}>Envoyer un message</button>
      </div>

      {isAuthed && (
        <div className="account-section">
          <h2>Compte</h2>
          <p>Gérez votre session et vos données personnelles.</p>
          <div className="account-actions">
            <button type="button" className="account-btn" onClick={() => setAccountOpen(v => !v)}>
              {accountOpen ? 'Masquer' : 'Options de compte'}
            </button>
          </div>

          {accountOpen && (
            <div className="account-panel">
              <button type="button" className="account-btn secondary" onClick={logout}>Se déconnecter</button>
              <button type="button" className="account-btn danger" onClick={openDelete}>Supprimer mon compte</button>
            </div>
          )}
        </div>
      )}

      {deleteOpen && (
        <div className="modal-overlay" role="dialog" aria-label="Supprimer mon compte" onClick={() => setDeleteOpen(false)}>
          <div className="modal danger-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Supprimer votre compte ?</h3>
            <p className="danger-text">Cette action est irréversible. Vos informations seront supprimées et votre compte sera désactivé.</p>

            <div className="form-row">
              <label>Confirmer (tapez SUPPRIMER)</label>
              <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="SUPPRIMER" />
            </div>

            <div className="form-row">
              <label>Mot de passe</label>
              <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
            </div>

            {deleteError && <div className="form-error">{deleteError}</div>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setDeleteOpen(false)}>Annuler</button>
              <button type="button" className="btn-primary danger" disabled={deleteLoading} onClick={doDelete}>
                {deleteLoading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Envoyer un message</h3>
            <form onSubmit={submit}>
              <div className="form-row">
                <label>Nom</label>
                <input type="text" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} required />
              </div>
              <div className="form-row">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} required />
              </div>
              <div className="form-row">
                <label>Téléphone</label>
                <input type="tel" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} placeholder="Optionnel" />
              </div>
              <div className="form-row">
                <label>Objet</label>
                <input type="text" value={form.subject} onChange={(e)=>setForm({...form, subject:e.target.value})} placeholder="Support Espace Membres" />
              </div>
              <div className="form-row">
                <label>Message</label>
                <textarea rows="4" value={form.message} onChange={(e)=>setForm({...form, message:e.target.value})} required />
              </div>
              {error && <div className="form-error">{error}</div>}
              {success && <div className="form-success">{success}</div>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={()=>setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={sending}>{sending ? 'Envoi...' : 'Envoyer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EspaceMembres;
