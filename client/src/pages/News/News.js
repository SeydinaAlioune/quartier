import React, { useEffect, useState } from 'react';
import './News.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import AnimatedSection from '../../components/AnimatedSection/AnimatedSection';

const News = () => {
  const API_BASE = (api.defaults.baseURL || process.env.REACT_APP_API_URL || window.location.origin).replace(/\/$/, '');
  const [announcements, setAnnouncements] = useState([]);
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

  // Extraire la première image depuis le contenu HTML (si présent)
  const extractFirstImageFromContent = (content) => {
    if (!content) return null;
    try {
      const html = String(content);
      const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch && imgMatch[1]) return imgMatch[1];
      const uploadMatch = html.match(/(\/uploads\/[^"')\s>]+)/i);
      if (uploadMatch && uploadMatch[1]) return uploadMatch[1];
    } catch {}
    return null;
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
        const items = list.map((p) => {
          const fallbackFromContent = extractFirstImageFromContent(p.content);
          const raw = p.coverUrl || fallbackFromContent;
          const image = raw ? (String(raw).startsWith('http') ? raw : `${API_BASE}${raw}`) : '/images/setsetal.jpg';
          return ({
            id: p._id || p.id,
            date: p.createdAt || new Date().toISOString(),
            title: p.title,
            description: p.content,
            image,
          });
        });
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

  // Charger les annonces importantes dynamiques
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get('/api/announcements');
        if (!mounted) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setAnnouncements(list.map(a => ({
          id: a.id,
          type: a.title,
          description: a.description,
          buttonText: a.buttonText || '',
          link: a.link || ''
        })));
      } catch {
        setAnnouncements([]);
      }
    };
    load();
    return () => { mounted = false; };
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
    <>
      <header
        className="news-header"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${process.env.PUBLIC_URL}/ac.jpg)`,
          backgroundPosition: 'center 30%'
        }}
      >
        <h1>Actualités du Quartier</h1>
        <p>Restez informés des événements, annonces et nouveautés qui animent notre communauté</p>
      </header>

      <div className="news-container">

      <section className="latest-articles">
        <h2>Derniers Articles</h2>
        {loading && <p>Chargement des actualités...</p>}
        {!loading && error && <p className="news-error">{error}</p>}
        <div className="articles-grid">
          {latestArticles.map((article, idx) => (
            <AnimatedSection key={article.id} delay={idx % 3} animation="fade-up">
              <div className="article-card">
              <img src={article.image} alt={article.title} onError={(e) => { e.currentTarget.src = '/images/setsetal.jpg'; }} />
              <div className="article-content">
                <span className="article-date">{format(new Date(article.date), 'd MMMM yyyy', { locale: fr })}</span>
                <h3>{article.title}</h3>
                <p>{article.description}</p>
                <Link to={`/actualites/${article.id}`} state={{ article }} className="read-more">Lire la suite</Link>
              </div>
            </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {announcements.length > 0 && (
        <section className="important-announcements">
          <h2>Annonces Importantes</h2>
          <div className="announcements-grid">
            {announcements.map((announcement, idx) => (
              <AnimatedSection key={announcement.id} delay={idx} animation="scale">
                <div className="announcement-card">
                <h3>
                  <i className="icon"></i>
                  {announcement.type}
                </h3>
                <p>{announcement.description}</p>
                {announcement.buttonText && (
                  announcement.link ? (
                    <a className="announcement-button" href={announcement.link} target="_blank" rel="noreferrer">{announcement.buttonText}</a>
                  ) : (
                    <button className="announcement-button">{announcement.buttonText}</button>
                  )
                )}
              </div>
              </AnimatedSection>
            ))}
          </div>
        </section>
      )}
      </div>
    </>
  );
};

export default News;
