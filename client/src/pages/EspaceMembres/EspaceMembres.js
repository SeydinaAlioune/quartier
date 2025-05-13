import React from 'react';
import { Link } from 'react-router-dom';
import './EspaceMembres.css';

const EspaceMembres = () => {
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
          <Link to="/login" className="action-button green">Se Connecter</Link>
        </div>

        {/* Option Inscription */}
        <div className="option-card">
          <div className="icon">
            <i className="fas fa-user-plus"></i>
          </div>
          <h2>Nouveau sur QuartierConnect ?</h2>
          <p>Créez votre compte en quelques minutes pour rejoindre notre communauté</p>
          <Link to="/register" className="action-button orange">Créer un Compte</Link>
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
          <div>
            <strong>En personne:</strong> Permanence à la mairie de quartier les mardis de 14h à 16h
          </div>
        </div>
        <button className="contact-button">Envoyer un message</button>
      </div>
    </div>
  );
};

export default EspaceMembres;
