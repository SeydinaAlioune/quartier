import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../../services/api';
import './News.css';

const NewsDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [article, setArticle] = useState(location.state?.article || null);
  const [loading, setLoading] = useState(!location.state?.article);
  const [error, setError] = useState('');
  const API_BASE = (api.defaults.baseURL || process.env.REACT_APP_API_URL || window.location.origin).replace(/\/$/, '');

  useEffect(() => {
    let mounted = true;
    // Si on n'a pas l'article en state (navigation directe), on va le chercher via l'API
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/api/posts/${id}`);
        if (!mounted) return;
        const p = res.data;
        setArticle({
          id: p._id || p.id,
          date: p.createdAt || new Date().toISOString(),
          title: p.title,
          description: p.content,
          image: p.coverUrl
            ? (String(p.coverUrl).startsWith('http') ? p.coverUrl : `${API_BASE}${p.coverUrl}`)
            : '/images/setsetal.jpg',
          author: p.author?.name || 'Anonyme',
        });
      } catch (e) {
        if (mounted) setError("Impossible de charger l'article.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (!article) fetchArticle();

    return () => { mounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="news-container">
        <p>Chargement de l'article...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-container">
        <p className="news-error">{error}</p>
        <Link to="/actualites" className="read-more">← Retour aux actualités</Link>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="news-container">
        <p>Article introuvable.</p>
        <Link to="/actualites" className="read-more">← Retour aux actualités</Link>
      </div>
    );
  }

  return (
    <div className="news-container">
      <header className="news-header">
        <h1>{article.title}</h1>
        <p>
          Publié le {format(new Date(article.date), 'd MMMM yyyy', { locale: fr })}
          {article.author ? ` • Par ${article.author}` : ''}
        </p>
      </header>

      <section className="news-detail">
        <div className="article-card">
          <img src={article.image} alt={article.title} />
          <div className="article-content">
            <p>{article.description}</p>
          </div>
        </div>
        <Link to="/actualites" className="read-more">← Retour aux actualités</Link>
      </section>
    </div>
  );
};

export default NewsDetail;
