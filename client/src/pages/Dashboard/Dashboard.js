import React, { useState } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [user] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    address: '123 Rue du Quartier',
    avatar: '/images/default-avatar.png'
  });

  const [notifications] = useState([
    {
      id: 1,
      type: 'message',
      content: 'Nouveau message de Marie concernant l\'événement du quartier',
      date: '13 mai 2024'
    },
    {
      id: 2,
      type: 'event',
      content: 'Rappel: Réunion de quartier demain à 18h',
      date: '13 mai 2024'
    }
  ]);

  const [recentActivities] = useState([
    {
      id: 1,
      type: 'forum',
      content: 'Vous avez commenté sur "Projet de rénovation"',
      date: '13 mai 2024'
    },
    {
      id: 2,
      type: 'event',
      content: 'Vous vous êtes inscrit à "Fête des voisins"',
      date: '12 mai 2024'
    }
  ]);

  const [messages] = useState([
    {
      id: 1,
      from: 'Marie Dubois',
      subject: 'Réunion de quartier',
      preview: 'Bonjour, concernant la réunion de demain...',
      date: '13 mai 2024'
    },
    {
      id: 2,
      from: 'Thomas Martin',
      subject: 'Projet jardinage',
      preview: 'Est-ce que vous seriez intéressé par...',
      date: '12 mai 2024'
    }
  ]);

  return (
    <div className="dashboard">
      <h1>Tableau de Bord</h1>
      
      <div className="dashboard-grid">
        {/* Profil utilisateur */}
        <div className="dashboard-card profile-card">
          <h2>Mon Profil</h2>
          <div className="profile-content">
            <div className="avatar">
              <img src={user.avatar} alt="Avatar" />
            </div>
            <div className="profile-info">
              <h3>{user.name}</h3>
              <p>{user.email}</p>
              <p>{user.address}</p>
              <button className="edit-profile-btn">Modifier mon profil</button>
            </div>
          </div>
        </div>

        {/* Messages privés */}
        <div className="dashboard-card messages-card">
          <h2>Messages Privés</h2>
          <div className="messages-list">
            {messages.map(message => (
              <div key={message.id} className="message-item">
                <div className="message-header">
                  <strong>{message.from}</strong>
                  <span>{message.date}</span>
                </div>
                <div className="message-subject">{message.subject}</div>
                <div className="message-preview">{message.preview}</div>
              </div>
            ))}
          </div>
          <button className="view-all-btn">Voir tous les messages</button>
        </div>

        {/* Notifications */}
        <div className="dashboard-card notifications-card">
          <h2>Notifications</h2>
          <div className="notifications-list">
            {notifications.map(notif => (
              <div key={notif.id} className="notification-item">
                <div className="notification-icon">
                  {notif.type === 'message' ? '✉️' : '🔔'}
                </div>
                <div className="notification-content">
                  <p>{notif.content}</p>
                  <span>{notif.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activités récentes */}
        <div className="dashboard-card activities-card">
          <h2>Activités Récentes</h2>
          <div className="activities-list">
            {recentActivities.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'forum' ? '💬' : '📅'}
                </div>
                <div className="activity-content">
                  <p>{activity.content}</p>
                  <span>{activity.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
