import React, { useEffect, useState } from 'react';
import './News.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const News = () => {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  // Données par défaut (fallback)
  const defaultArticles = [
    {
      id: 1,
      date: '2023-11-15',
      title: 'Journée de Set Setal',
      description: 'Participez à la grande journée de Set Setal ce samedi. Ensemble, rendons notre quartier plus propre et plus agréable. Rendez-vous à 8h devant la mairie avec vos outils de nettoyage.',
      image: '/images/setsetal.jpg'
    },
    {
      id: 2,
      date: '2023-11-05',
      title: 'Feu de joie : Assiko',
      description: 'Grande soirée Assiko autour du feu ce weekend. Venez nombreux partager un moment de convivialité avec musique traditionnelle, danse et rafraîchissements.',
      image: '/images/feu.jpg'
    },
    {
      id: 3,
      date: '2023-10-28',
      title: 'Consultation médicale gratuite',
      description: 'Une journée de consultation médicale gratuite est organisée à la cité gendarmerie. Plusieurs spécialités disponibles : pédiatrie, gynécologie et médecine générale.',
      image: '/images/consultation.jpg'
    }
  ];

  const [latestArticles, setLatestArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const importantAnnouncements = [
    {
      id: 1,
      type: 'Travaux de voirie',
      description: 'Des travaux de réfection de la chaussée auront lieu rue des Tilleuls du 20 au 25 novembre. Circulation alternée mise en place.',
      buttonText: 'Détails'
    },
    {
      id: 2,
      type: 'Coupure d\'eau programmée',
      description: 'Une coupure d\'eau est prévue le 22 novembre de 9h à 14h dans le secteur nord du quartier pour travaux de maintenance.',
      buttonText: 'Zones concernées'
    },
    {
      id: 3,
      type: 'Réunion de conseil de quartier',
      description: 'La prochaine réunion du conseil de quartier aura lieu le 28 novembre à 18h30 à la salle municipale.',
      buttonText: 'Ordre du jour'
    }
  ];
  // Événements (dynamiques)
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'd MMMM yyyy', { locale: fr });
  };

  const formatTime = (dateString) => {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '';
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    // N'afficher l'heure que si elle n'est pas minuit (valeur par défaut quand pas d'heure)
    if (hh === '00' && mm === '00') return '';
    return `${hh}h${mm}`;
  };

  // Chargement des articles depuis l'API avec fallback silencieux
  useEffect(() => {
    let mounted = true;
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/api/posts?status=published&sort=-createdAt&limit=20&page=1');
        if (!mounted) return;
        const payload = res.data;
        const list = Array.isArray(payload?.posts) ? payload.posts : (Array.isArray(payload) ? payload : []);
        const items = list.map((p) => ({
          id: p._id || p.id,
          date: p.createdAt || new Date().toISOString(),
          title: p.title,
          description: p.content,
          // Image de couverture si disponible
          image: p.coverUrl ? `${API_BASE}${p.coverUrl}` : '/images/setsetal.jpg'
        }));
        setLatestArticles(items);
      } catch (e) {
        // On conserve defaultArticles en fallback, et on log l'erreur UI minimale
        if (mounted) setError('Impossible de charger les actualités (affichage par défaut).');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPosts();
    return () => {
      mounted = false;
    };
  }, []);

  // Charger les événements à venir depuis l'API
  useEffect(() => {
    let mounted = true;
    const fetchEvents = async () => {
      try {
        setEventsLoading(true);
        setEventsError('');
        const res = await api.get('/api/events');
        if (!mounted) return;
        const list = Array.isArray(res.data) ? res.data : [];
        const now = new Date();
        const future = list.filter(ev => {
          const d = new Date(ev.date);
          return !Number.isNaN(d.getTime()) && d >= now;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
        const items = future.map(e => ({
          id: e._id || e.id,
          date: e.date,
          title: e.title,
          time: formatTime(e.date),
          location: e.location || '—',
          description: e.description,
          buttonText: 'Plus d\'infos'
        }));
        setUpcomingEvents(items.slice(0, 5));
      } catch (e) {
        if (mounted) setEventsError("Impossible de charger les événements.");
      } finally {
        if (mounted) setEventsLoading(false);
      }
    };
    fetchEvents();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="news-container">
      <header className="news-header">
        <h1>Actualités du Quartier</h1>
        <p>Restez informés des événements, annonces et nouveautés qui animent notre communauté</p>
      </header>

      <section className="latest-articles">
        <h2>Derniers Articles</h2>
        {loading && <p>Chargement des actualités...</p>}
        {!loading && error && <p className="news-error">{error}</p>}
        <div className="articles-grid">
          {latestArticles.map(article => (
            <div key={article.id} className="article-card">
              <img src={article.image} alt={article.title} />
              <div className="article-content">
                <span className="article-date">{format(new Date(article.date), 'd MMMM yyyy', { locale: fr })}</span>
                <h3>{article.title}</h3>
                <p>{article.description}</p>
                <Link to={`/actualites/${article.id}`} state={{ article }} className="read-more">Lire la suite</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="important-announcements">
        <h2>Annonces Importantes</h2>
        <div className="announcements-grid">
          {importantAnnouncements.map(announcement => (
            <div key={announcement.id} className="announcement-card">
              <h3>
                <i className="icon"></i>
                {announcement.type}
              </h3>
              <p>{announcement.description}</p>
              <button className="announcement-button">{announcement.buttonText}</button>
            </div>
          ))}
        </div>
      </section>

      <section className="upcoming-events">
        <h2>Événements à Venir</h2>
        <div className="events-list">
          {eventsLoading && <p>Chargement des événements...</p>}
          {!eventsLoading && eventsError && <p className="news-error">{eventsError}</p>}
          {!eventsLoading && !eventsError && upcomingEvents.length === 0 && (
            <p>Aucun événement à venir.</p>
          )}
          {!eventsLoading && !eventsError && upcomingEvents.map(event => (
            <div key={event.id} className="event-card">
              <div className="event-date">
                <span className="month">{format(new Date(event.date), 'MMM', { locale: fr }).toUpperCase()}</span>
                <span className="day">{format(new Date(event.date), 'dd')}</span>
              </div>
              <div className="event-details">
                <h3>{event.title}</h3>
                <p className="event-time">
                  <i className="icon-time"></i> {event.time || '—'}
                  <i className="icon-location"></i> {event.location}
                </p>
                <p className="event-description">{event.description}</p>
                <button className="event-button">{event.buttonText}</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default News;
