import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ImageSlider from '../../components/ImageSlider/ImageSlider';
import api from '../../services/api';
import './Home.css';

const Home = () => {
  const [scrollY, setScrollY] = useState(0);

  const API_BASE = (api.defaults.baseURL || process.env.REACT_APP_API_URL || window.location.origin).replace(/\/$/, '');

  const sliderSlides = [
    {
      src: process.env.PUBLIC_URL + '/images/slider/vue-de-ciel.jpeg',
      title: 'Vue de ciel',
      alt: 'Vue de ciel de la cité'
    },
    {
      src: process.env.PUBLIC_URL + '/images/slider/equipe-de-la-cite.png',
      title: 'Équipe de la cité',
      alt: 'Équipe de la cité'
    },
    {
      src: process.env.PUBLIC_URL + '/images/slider/capi-supporter.jpeg',
      title: 'Capi supporter',
      alt: 'Supporters de la cité'
    },
    {
      src: process.env.PUBLIC_URL + '/images/slider/consultation.png',
      title: 'Consultation',
      alt: 'Consultation'
    },
    {
      src: process.env.PUBLIC_URL + '/images/slider/influenceur-cite.png',
      title: 'Influenceur cité',
      alt: 'Influenceur de la cité'
    },
    {
      src: process.env.PUBLIC_URL + '/images/slider/set-setal.png',
      title: 'Set setal',
      alt: 'Set setal'
    }
  ];

  const sectionAnim = {
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  };

  const cardsWrap = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const cardItem = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const proofItems = [
    { label: 'Membres', value: '250+' },
    { label: 'Annonces', value: '80+' },
    { label: 'Projets', value: '12' },
    { label: 'Événements', value: '25+' }
  ];

  const howSteps = [
    {
      title: 'Rejoins la communauté',
      text: 'Crée ton compte pour accéder aux annonces, au forum et aux projets.'
    },
    {
      title: 'Partage & entraide',
      text: 'Publie une annonce, pose une question, aide un voisin, ou propose une idée.'
    },
    {
      title: 'Construisons ensemble',
      text: 'Vote, participe et suis l’avancement des projets de la Cité Gendarmerie.'
    }
  ];

  const latestNews = [
    {
      title: 'Réunion de quartier : priorités 2026',
      date: 'Cette semaine',
      excerpt: 'Propreté, éclairage, sécurité et activités jeunesse : on fait le point ensemble.'
    },
    {
      title: 'Set Setal : journée citoyenne',
      date: 'Ce mois-ci',
      excerpt: 'Une initiative collective pour embellir la cité. Rejoignez l’équipe !'
    },
    {
      title: 'Nouveaux contacts utiles',
      date: 'Mis à jour',
      excerpt: 'Retrouvez les numéros essentiels et les services disponibles près de chez vous.'
    }
  ];

  const [homeNews, setHomeNews] = useState([]);
  const [homeNewsLoading, setHomeNewsLoading] = useState(false);

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

  const formatNewsBadge = (dateString) => {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  useEffect(() => {
    let mounted = true;
    const fetchHomeNews = async () => {
      try {
        setHomeNewsLoading(true);
        const res = await api.get('/api/posts?status=published&sort=-createdAt&limit=3&page=1');
        if (!mounted) return;
        const payload = res?.data;
        const list = Array.isArray(payload?.posts) ? payload.posts : (Array.isArray(payload) ? payload : []);
        const items = list.slice(0, 3).map((p) => {
          const fallbackFromContent = extractFirstImageFromContent(p.content);
          const raw = p.coverUrl || fallbackFromContent;
          const image = raw ? (String(raw).startsWith('http') ? raw : `${API_BASE}${raw}`) : '';
          const plain = p.content ? String(p.content).replace(/<[^>]*>/g, '') : '';
          return {
            id: p._id || p.id,
            date: p.createdAt || new Date().toISOString(),
            title: p.title,
            description: p.content || '',
            excerpt: p.excerpt || plain.slice(0, 140),
            image,
          };
        });
        setHomeNews(items);
      } catch {
        if (mounted) setHomeNews([]);
      } finally {
        if (mounted) setHomeNewsLoading(false);
      }
    };

    fetchHomeNews();
    return () => {
      mounted = false;
    };
  }, [API_BASE]);

  // Parallax effect on hero
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="home">
      {/* Hero Section */}
      <section 
        className="hero"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${process.env.PUBLIC_URL}/images/photo1.webp)`
        }}
      >
        <motion.div
          className="hero-content hero-content-visible"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        >
          <h1>Cité Gendarmerie</h1>
          <p>La plateforme communautaire des anciens, des familles et des voisins : actualités, entraide et projets.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="cta-button">
              Rejoindre la communauté
            </Link>
            <Link to="/forum" className="cta-button" style={{ backgroundColor: '#ff9800' }}>
              Voir les annonces
            </Link>
          </div>
        </motion.div>
      </section>

      <motion.section className="proof-band" {...sectionAnim}>
        <div className="home-inner">
          <div className="proof-grid">
            {proofItems.map((item) => (
              <div key={item.label} className="proof-item">
                <div className="proof-value">{item.value}</div>
                <div className="proof-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Slider (Vie de la cité) */}
      <motion.section className="gallery-section" {...sectionAnim}>
        <h2 style={{ marginBottom: 10, textAlign: 'center' }}>Vie de la cité</h2>
        <p style={{ textAlign: 'center', marginBottom: 18 }}>
          Un aperçu en images : événements, initiatives et moments du quotidien.
        </p>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1rem' }}>
          <ImageSlider
            slides={sliderSlides}
            autoPlay
            intervalMs={3000}
            pauseOnHover={false}
            transitionStyle="cinema"
            showProgress
          />
        </div>
      </motion.section>

      <motion.section className="how-section" {...sectionAnim}>
        <div className="home-inner">
          <h2 className="section-title">Comment ça marche</h2>
          <p className="section-subtitle">En 3 étapes, tu passes de visiteur à acteur de la cité.</p>
          <div className="how-grid">
            {howSteps.map((s, idx) => (
              <div key={s.title} className="how-card">
                <div className="how-step">0{idx + 1}</div>
                <h3 className="how-title">{s.title}</h3>
                <p className="how-text">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="memory-section" {...sectionAnim}>
        <div className="home-inner">
          <div className="memory-grid">
            <div className="memory-text">
              <h2 className="section-title">Mémoire & Transmission</h2>
              <p className="section-subtitle">
                La Cité Gendarmerie, c’est une histoire, des valeurs et des familles. Ici, on partage les souvenirs,
                on transmet, et on construit l’avenir ensemble.
              </p>
              <div className="memory-actions">
                <Link to="/galerie" className="cta-button">Découvrir la galerie</Link>
                <Link to="/actualites" className="cta-button" style={{ backgroundColor: '#111827' }}>Lire les actualités</Link>
              </div>
            </div>
            <div className="memory-card">
              <div className="memory-badge">Esprit de cité</div>
              <ul className="memory-list">
                <li>Respect et entraide</li>
                <li>Infos utiles vérifiées</li>
                <li>Projets concrets</li>
                <li>Activités & jeunesse</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section className="news-preview" {...sectionAnim}>
        <div className="home-inner">
          <div className="news-head">
            <div>
              <h2 className="section-title">Dernières actualités</h2>
              <p className="section-subtitle">Reste informé des nouveautés et des annonces importantes.</p>
            </div>
            <Link to="/actualites" className="news-more">Tout voir</Link>
          </div>
          <div className="news-grid">
            {(homeNewsLoading ? Array.from({ length: 3 }).map((_, i) => ({
              id: `loading-${i}`,
              date: 'Chargement…',
              title: 'Chargement…',
              excerpt: 'Chargement…',
              _loading: true,
            })) : (homeNews.length ? homeNews : latestNews)).map((n) => {
              const hasId = Boolean(n.id) && !String(n.id).startsWith('loading-');
              const to = hasId ? `/actualites/${n.id}` : '/actualites';
              const badge = n._loading ? n.date : (hasId ? formatNewsBadge(n.date) : n.date);

              return (
                <div key={n.id || n.title} className="news-card">
                  <div className="news-date">{badge}</div>
                  <h3 className="news-title">{n.title}</h3>
                  <p className="news-excerpt">{n.excerpt}</p>
                  <Link
                    to={to}
                    state={hasId ? { article: { id: n.id, date: n.date, title: n.title, description: n.description || n.excerpt, image: n.image } } : undefined}
                    className="news-link"
                  >
                    Lire
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Carte Interactive */}
      <motion.section className="map-section" {...sectionAnim}>
        <h2>Carte du Quartier</h2>
        <p>Explorez les points d'intérêt et les services disponibles près de chez vous</p>
        <div className="interactive-map">
          <img 
            src={`${process.env.PUBLIC_URL}/images/photo2.png`}
            alt="Carte du quartier" 
            className="map-image"
            onError={(e) => {
              console.log('Erreur chargement photo2.png depuis /images/');
              e.target.src = `${process.env.PUBLIC_URL}/photo2.png`;
            }}
            onLoad={() => console.log('Image carte chargée avec succès')}
          />
        </div>
      </motion.section>

      {/* Informations Utiles */}
      <motion.section className="useful-info" {...sectionAnim}>
        <h2>Informations Utiles</h2>
        <motion.div
          className="info-cards"
          variants={cardsWrap}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          <motion.div className="info-card" variants={cardItem}>
            <h3>Horaires des Services</h3>
            <ul>
              <li>Mairie de quartier: Lun-Ven 9h-17h</li>
              <li>Bibliothèque: Mar-Sam 10h-19h</li>
              <li>Centre médical: 7j/7 8h-20h</li>
              <li>Poste: Lun-Ven 9h-16h, Sam 9h-12h</li>
              <li>Centre sportif: Lun-Dim 7h-22h</li>
            </ul>
          </motion.div>
          <motion.div className="info-card" variants={cardItem}>
            <h3>Contacts Importants</h3>
            <ul>
              <li>Urgences: 15 / 17 / 18</li>
              <li>Mairie: 01 XX XX XX XX</li>
              <li>Police de proximité: 01 XX XX XX XX</li>
              <li>Médecin de garde: 01 XX XX XX XX</li>
              <li>Services techniques: 01 XX XX XX XX</li>
            </ul>
          </motion.div>
          <motion.div className="info-card" variants={cardItem}>
            <h3>Liens Rapides</h3>
            <ul>
              <li><Link to="/services">Services municipaux</Link></li>
              <li><Link to="/annuaire">Annuaire des commerçants</Link></li>
              <li><Link to="/actualites">Dernières actualités</Link></li>
              <li><Link to="/forum">Forum de discussion</Link></li>
              <li><Link to="/projets">Projets en cours</Link></li>
            </ul>
          </motion.div>
        </motion.div>
      </motion.section>
    </div>
  );
};

export default Home;
