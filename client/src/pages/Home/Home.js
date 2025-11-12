import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import useScrollReveal from '../../hooks/useScrollReveal';
import './Home.css';

const Home = () => {
  const images = [
    {
      src: process.env.PUBLIC_URL + '/images/residence.png',
      title: 'Résidences typiques',
      alt: 'Résidence'
    },
    {
      src: process.env.PUBLIC_URL + '/images/terrain.jpg',
      title: 'Terrain de sport',
      alt: 'Terrain'
    },
    {
      src: process.env.PUBLIC_URL + '/images/paronamique.jpg',
      title: 'Vue panoramique',
      alt: 'Vue panoramique'
    },
    {
      src: process.env.PUBLIC_URL + '/images/communautaire.jpg',
      title: 'Vie communautaire',
      alt: 'Activité communautaire'
    }
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState(1);
  const [scrollY, setScrollY] = useState(0);

  // Refs pour scroll reveal
  const heroContentRef = useRef(null);
  const mapTitleRef = useScrollReveal({ once: true });
  const mapImageRef = useScrollReveal({ once: true });
  const galleryTitleRef = useScrollReveal({ once: true });
  const infoTitleRef = useScrollReveal({ once: true });
  const card1Ref = useScrollReveal({ once: true, threshold: 0.2 });
  const card2Ref = useScrollReveal({ once: true, threshold: 0.2 });
  const card3Ref = useScrollReveal({ once: true, threshold: 0.2 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const newIndex = (prevIndex + 2) % images.length;
        return newIndex;
      });
      setNextImageIndex((prevIndex) => {
        const newIndex = (prevIndex + 2) % images.length;
        return newIndex;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [images.length]);

  // Parallax effect on hero
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hero content entrance animation
  useEffect(() => {
    if (heroContentRef.current) {
      setTimeout(() => {
        heroContentRef.current.classList.add('hero-content-visible');
      }, 100);
    }
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
        <div 
          ref={heroContentRef}
          className="hero-content"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        >
          <h1>Bienvenue dans notre quartier la Cité gendarmerie</h1>
          <p>Une plateforme communautaire pour connecter et améliorer la vie des résidents de notre quartier</p>
          <Link to="/register" className="cta-button">
            Rejoindre la communauté
          </Link>
        </div>
      </section>

      {/* Carte Interactive */}
      <section className="map-section">
        <h2 ref={mapTitleRef}>Carte du Quartier</h2>
        <p ref={mapImageRef}>Explorez les points d'intérêt et les services disponibles près de chez vous</p>
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
      </section>

      {/* Notre Quartier en Images */}
      <section className="gallery-section">
        <h2 ref={galleryTitleRef} className="reveal">Notre Quartier en Images</h2>
        <p className="reveal reveal-delay-1">Découvrez la beauté et la diversité de notre quartier à travers ces images</p>
        <div className="gallery">
          <div className={`gallery-item ${currentImageIndex === 0 || currentImageIndex === 2 ? 'active' : ''}`}>
            <img src={images[currentImageIndex].src} alt={images[currentImageIndex].alt} />
            <p>{images[currentImageIndex].title}</p>
          </div>
          <div className={`gallery-item ${nextImageIndex === 1 || nextImageIndex === 3 ? 'active' : ''}`}>
            <img src={images[nextImageIndex].src} alt={images[nextImageIndex].alt} />
            <p>{images[nextImageIndex].title}</p>
          </div>
        </div>
      </section>

      {/* Informations Utiles */}
      <section className="useful-info">
        <h2 ref={infoTitleRef} className="reveal">Informations Utiles</h2>
        <div className="info-cards">
          <div ref={card1Ref} className="info-card reveal reveal-card">
            <h3>Horaires des Services</h3>
            <ul>
              <li>Mairie de quartier: Lun-Ven 9h-17h</li>
              <li>Bibliothèque: Mar-Sam 10h-19h</li>
              <li>Centre médical: 7j/7 8h-20h</li>
              <li>Poste: Lun-Ven 9h-16h, Sam 9h-12h</li>
              <li>Centre sportif: Lun-Dim 7h-22h</li>
            </ul>
          </div>
          <div ref={card2Ref} className="info-card reveal reveal-card reveal-delay-1">
            <h3>Contacts Importants</h3>
            <ul>
              <li>Urgences: 15 / 17 / 18</li>
              <li>Mairie: 01 XX XX XX XX</li>
              <li>Police de proximité: 01 XX XX XX XX</li>
              <li>Médecin de garde: 01 XX XX XX XX</li>
              <li>Services techniques: 01 XX XX XX XX</li>
            </ul>
          </div>
          <div ref={card3Ref} className="info-card reveal reveal-card reveal-delay-2">
            <h3>Liens Rapides</h3>
            <ul>
              <li><Link to="/services">Services municipaux</Link></li>
              <li><Link to="/annuaire">Annuaire des commerçants</Link></li>
              <li><Link to="/actualites">Dernières actualités</Link></li>
              <li><Link to="/forum">Forum de discussion</Link></li>
              <li><Link to="/projets">Projets en cours</Link></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
