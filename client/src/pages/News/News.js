import React from 'react';
import './News.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const News = () => {
  const latestArticles = [
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

  const upcomingEvents = [
    {
      id: 1,
      date: '2023-11-25',
      title: 'Atelier de jardinage communautaire',
      time: '10h00 - 13h00',
      location: 'Jardin partagé, rue des Rosiers',
      description: 'Venez apprendre à planter et entretenir des légumes d\'hiver dans notre jardin communautaire.',
      buttonText: 'Inscription'
    },
    {
      id: 2,
      date: '2023-12-02',
      title: 'Marché de Noël du quartier',
      time: '14h00 - 20h00',
      location: 'Place centrale',
      description: 'Notre traditionnel marché de Noël revient avec des stands d\'artisanat, de gastronomie et des animations pour les enfants.',
      buttonText: 'Plus d\'infos'
    },
    {
      id: 3,
      date: '2023-12-10',
      title: 'Concert de la chorale du quartier',
      time: '19h00',
      location: 'Église Saint-Michel',
      description: 'La chorale du quartier vous propose un concert de chants de Noël traditionnels et modernes.',
      buttonText: 'Réserver'
    }
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'd MMMM yyyy', { locale: fr });
  };

  return (
    <div className="news-container">
      <header className="news-header">
        <h1>Actualités du Quartier</h1>
        <p>Restez informés des événements, annonces et nouveautés qui animent notre communauté</p>
      </header>

      <section className="latest-articles">
        <h2>Derniers Articles</h2>
        <div className="articles-grid">
          {latestArticles.map(article => (
            <div key={article.id} className="article-card">
              <img src={article.image} alt={article.title} />
              <div className="article-content">
                <span className="article-date">{format(new Date(article.date), 'd MMMM yyyy', { locale: fr })}</span>
                <h3>{article.title}</h3>
                <p>{article.description}</p>
                <button className="read-more">Lire la suite</button>
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
          {upcomingEvents.map(event => (
            <div key={event.id} className="event-card">
              <div className="event-date">
                <span className="month">{format(new Date(event.date), 'MMM', { locale: fr }).toUpperCase()}</span>
                <span className="day">{format(new Date(event.date), 'dd')}</span>
              </div>
              <div className="event-details">
                <h3>{event.title}</h3>
                <p className="event-time">
                  <i className="icon-time"></i> {event.time}
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
