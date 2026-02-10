import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import './SearchResults.css';

const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

const SearchResults = () => {
  const qs = useQuery();
  const term = (qs.get('q') || '').trim();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [posts, setPosts] = useState([]);
  const [ads, setAds] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [businesses, setBusinesses] = useState([]);

  useEffect(() => {
    const run = async () => {
      if (!term) { setPosts([]); setAds([]); setIdeas([]); setBusinesses([]); return; }
      try {
        setLoading(true); setError('');
        const [p, a, i, b] = await Promise.all([
          api.get(`/api/posts?search=${encodeURIComponent(term)}&page=1&limit=10`).catch(()=>({data:{posts:[]}})),
          api.get('/api/forum/ads?status=approved&limit=50').catch(()=>({data:[]})),
          api.get('/api/forum/ideas').catch(()=>({data:[]})),
          api.get('/api/business').catch(()=>({data:{businesses:[]}})),
        ]);
        const postList = Array.isArray(p?.data?.posts) ? p.data.posts : (Array.isArray(p?.data) ? p.data : []);
        const adsList = Array.isArray(a?.data) ? a.data : [];
        const ideasList = Array.isArray(i?.data) ? i.data : [];
        const bizList = Array.isArray(b?.data?.businesses) ? b.data.businesses : [];
        const t = term.toLowerCase();
        setPosts(postList.filter(x => (
          (x.title||'').toLowerCase().includes(t) || (x.content||'').toLowerCase().includes(t)
        )));
        setAds(adsList.filter(x => (
          (x.title||'').toLowerCase().includes(t) || (x.description||'').toLowerCase().includes(t)
        )));
        setIdeas(ideasList.filter(x => (
          (x.title||'').toLowerCase().includes(t) || (x.description||'').toLowerCase().includes(t)
        )));
        setBusinesses(bizList.filter(x => (
          (x.name||'').toLowerCase().includes(t) || (x.description||'').toLowerCase().includes(t) ||
          (x.address?.street||'').toLowerCase().includes(t) || (x.address?.city||'').toLowerCase().includes(t)
        )));
      } catch(e) {
        setError("Recherche impossible pour le moment.");
        setPosts([]); setAds([]); setIdeas([]); setBusinesses([]);
      } finally { setLoading(false); }
    };
    run();
  }, [term]);

  return (
    <section className="search-results">
      <h2>Résultats de recherche</h2>
      <div className="search-results__meta">Terme: <strong>{term || '—'}</strong></div>
      {loading && (<div className="card">Recherche en cours…</div>)}
      {!loading && error && (<div className="card error">{error}</div>)}
      {!loading && !error && term && (
        <>
          <div className="search-results__kpis">
            <div className="card"><div>Articles</div><div className="search-results__kpi-value">{posts.length}</div></div>
            <div className="card"><div>Annonces</div><div className="search-results__kpi-value">{ads.length}</div></div>
            <div className="card"><div>Idées</div><div className="search-results__kpi-value">{ideas.length}</div></div>
            <div className="card"><div>Annuaire</div><div className="search-results__kpi-value">{businesses.length}</div></div>
          </div>

          <div className="search-results__sections">
            <div>
              <h3>Articles</h3>
              {posts.length===0 ? <div>Aucun article. <Link to="/actualites">Voir les actualités</Link></div> : (
                <ul>
                  {posts.map(p => (
                    <li key={p._id || p.id}>
                      <Link to={`/actualites/${p._id || p.id}`}>{p.title}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3>Annonces</h3>
              {ads.length===0 ? <div>Aucune annonce. <Link to="/forum">Publier une annonce</Link></div> : (
                <ul>
                  {ads.map(a => (
                    <li key={a.id || a._id}>
                      <Link to={`/forum?hlType=ad&hlId=${a.id || a._id}`}>{a.title} {a.price?`· ${a.price}`:''}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3>Idées</h3>
              {ideas.length===0 ? <div>Aucune idée. <Link to="/forum">Proposer une idée</Link></div> : (
                <ul>
                  {ideas.map(i => (
                    <li key={i.id || i._id}>
                      <Link to={`/forum?hlType=idea&hlId=${i.id || i._id}`}>{i.title}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3>Annuaire</h3>
              {businesses.length===0 ? <div>Aucun résultat. <Link to="/annuaire">Voir l'annuaire</Link></div> : (
                <ul>
                  {businesses.map(b => (
                    <li key={b._id || (b.id || b.name)}>
                      <Link to="/annuaire">{b.name} {b.address?.city?`· ${b.address.city}`:''}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
      {!loading && !error && !term && (
        <div>Entrez un terme de recherche dans la barre en haut.</div>
      )}
    </section>
  );
};

export default SearchResults;
