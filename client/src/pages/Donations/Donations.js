import React, { useState, useEffect } from 'react';
import './Donations.css';
import api from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

const Donations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentCampaigns, setCurrentCampaigns] = useState([]);
  const [completedCampaigns, setCompletedCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [donateData, setDonateData] = useState({ amount: '', paymentMethod: 'wave', message: '', anonymous: false });
  const [showQr, setShowQr] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [copyMsg, setCopyMsg] = useState('');

  const calculateProgress = (collected, goal) => {
    if (!goal || goal <= 0) return 0;
    const pct = (collected / goal) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  useEffect(() => {
    let mounted = true;
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError('');
        const [activeRes, completedRes] = await Promise.all([
          api.get('/api/donations/campaigns?status=active'),
          api.get('/api/donations/campaigns?status=completed')
        ]);
        if (!mounted) return;
        const active = Array.isArray(activeRes.data?.campaigns) ? activeRes.data.campaigns : [];
        const completed = Array.isArray(completedRes.data?.campaigns) ? completedRes.data.campaigns : [];
        const base = api.defaults.baseURL || '';
        const toAbsolute = (u) => {
          if (!u) return '';
          if (u.startsWith('http')) return u;
          const sep = u.startsWith('/') ? '' : '/';
          return `${base}${sep}${u}`;
        };
        // Adapter au format UI
        setCurrentCampaigns(active.map(c => ({
          id: c._id || c.id,
          title: c.title,
          description: c.description,
          collected: c.collected || 0,
          goal: c.goal || 0,
          category: c.category,
          projectId: c.project?._id || (typeof c.project === 'string' ? c.project : ''),
          projectTitle: c.project?.title || '',
          startDate: c.startDate ? new Date(c.startDate) : null,
          endDate: c.endDate ? new Date(c.endDate) : null,
          image: (c.images && c.images[0]?.url) ? toAbsolute(c.images[0].url) : '/images/residence.png'
        })));
        setCompletedCampaigns(completed.map(c => ({
          id: c._id || c.id,
          title: c.title,
          description: c.description,
          collected: c.collected || 0,
          goal: c.goal || 0,
          category: c.category,
          projectId: c.project?._id || (typeof c.project === 'string' ? c.project : ''),
          projectTitle: c.project?.title || '',
          startDate: c.startDate ? new Date(c.startDate) : null,
          endDate: c.endDate ? new Date(c.endDate) : null,
        })));
      } catch (e) {
        if (mounted) setError("Impossible de charger les collectes.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCampaigns();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setPaid(params.get('paid') === '1');
  }, [location.search]);

  const openDonate = (campaign, method) => {
    setSelectedCampaign(campaign);
    setDonateData({ amount: '', paymentMethod: method || 'wave', message: '', anonymous: false });
    setDonateOpen(true);
  };

  // Ouvrir automatiquement la modale si ?project=<id>
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const projectId = params.get('project');
    if (projectId && currentCampaigns.length > 0) {
      const match = currentCampaigns.find(c => c.category === 'project' && c.projectId === projectId);
      if (match) {
        openDonate(match, 'wave');
      }
    }
  }, [location.search, currentCampaigns]);

  const submitDonation = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      // Auth requise
      return navigate('/login');
    }
    try {
      const payload = {
        campaign: selectedCampaign.id,
        amount: parseFloat(donateData.amount),
        paymentMethod: donateData.paymentMethod,
        message: donateData.message,
        anonymous: donateData.anonymous,
      };
      const res = await api.post('/api/donations/pay', {
        ...payload,
        returnUrl: window.location.origin + '/dons?paid=1'
      });
      const paymentUrl = res?.data?.paymentUrl;
      if (paymentUrl) {
        // Si mobile: redirection directe; sinon afficher un QR pour scanner
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = paymentUrl;
          return;
        }
        setDonateOpen(false);
        setQrUrl(paymentUrl);
        setShowQr(true);
        return;
      }
      // Feedback minimal et fermeture
      alert('Don effectué avec succès. Merci !');
      setDonateOpen(false);
    } catch (err) {
      alert("Échec du don. Réessayez plus tard.");
    }
  };

  const handleCreateCampaign = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return navigate('/login');
    if (user.role !== 'admin') return alert('Accès réservé aux administrateurs.');
    alert('Création de campagne: fonctionnalité à venir.');
  };

  const handleDonateNow = () => {
    if (currentCampaigns.length === 0) return alert('Aucune campagne active pour le moment.');
    openDonate(currentCampaigns[0], 'wave');
  };

  return (
    <div className="donations-container">
      <header className="donations-header">
        <h1>Téléthon & Collectes Solidaires</h1>
        <p>Soutenez les causes qui nous tiennent à cœur et participez à l'entraide au sein de notre quartier</p>
      </header>

      <section className="current-campaigns">
        <h2>Collectes en Cours</h2>
        {loading && <p>Chargement des collectes...</p>}
        {!loading && error && <p className="donations-error">{error}</p>}
        {!loading && !error && currentCampaigns.length === 0 && (
          <p>Aucune collecte active pour le moment.</p>
        )}
        <div className="campaigns-grid">
          {currentCampaigns.map(campaign => (
            <div key={campaign.id} className="campaign-card">
              <img src={campaign.image} alt={campaign.title} />
              <h3>{campaign.title}</h3>
              <p>{campaign.description}</p>
              <div className="campaign-meta">
                <span className={`badge ${campaign.category}`}>{campaign.category}</span>
                {campaign.projectTitle && <span className="meta">Projet: {campaign.projectTitle}</span>}
                <span className="meta">
                  {campaign.startDate ? campaign.startDate.toLocaleDateString('fr-FR') : '—'}
                  {campaign.endDate ? ` → ${campaign.endDate.toLocaleDateString('fr-FR')}` : ''}
                </span>
              </div>
              <div className="progress-container">
                <div 
                  className="progress-bar"
                  style={{ width: `${calculateProgress(campaign.collected, campaign.goal)}%` }}
                ></div>
              </div>
              <div className="campaign-stats">
                <span>{campaign.collected}€ collectés</span>
                <span>Objectif: {campaign.goal}€</span>
              </div>
              <div className="payment-methods">
                <button className="payment-btn wave" onClick={() => openDonate(campaign, 'wave')}>Wave</button>
                <button className="payment-btn orange" onClick={() => openDonate(campaign, 'orange')}>Orange Money</button>
              </div>
              {!localStorage.getItem('token') && (
                <div style={{marginTop:'0.5rem', color:'#777', fontSize:'0.9rem'}}>
                  Connectez-vous pour finaliser votre don.
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="completed-campaigns">
        <h2>Collectes Réussies</h2>
        {!loading && !error && completedCampaigns.length === 0 && (
          <p>Aucune collecte terminée.</p>
        )}
        <div className="campaigns-grid">
          {completedCampaigns.map(campaign => (
            <div key={campaign.id} className="campaign-card completed">
              <h3>{campaign.title}</h3>
              <p>{campaign.description}</p>
              <div className="campaign-meta">
                <span className={`badge ${campaign.category}`}>{campaign.category}</span>
                {campaign.projectTitle && <span className="meta">Projet: {campaign.projectTitle}</span>}
                <span className="meta">
                  {campaign.startDate ? campaign.startDate.toLocaleDateString('fr-FR') : '—'}
                  {campaign.endDate ? ` → ${campaign.endDate.toLocaleDateString('fr-FR')}` : ''}
                </span>
              </div>
              <div className="campaign-stats">
                <span>Montant collecté: {campaign.collected}€</span>
                <span>Objectif initial: {campaign.goal}€</span>
              </div>
              <button className="view-details">Voir les détails</button>
            </div>
          ))}
        </div>
      </section>

      <section className="create-campaign">
        <h2>Créer une Nouvelle Collecte</h2>
        <p>Réservé aux administrateurs et responsables d'associations reconnues</p>
        <button className="create-btn" onClick={handleCreateCampaign}>Créer une collecte</button>
      </section>

      <section className="donations-footer">
        <h2>Ensemble, nous pouvons faire la différence</h2>
        <p>Chaque don, même modeste, contribue à améliorer la vie dans notre quartier et à soutenir ceux qui en ont besoin.</p>
        <button className="donate-now-btn" onClick={handleDonateNow}>Faire un don maintenant</button>
      </section>

      {paid && (
        <div style={{maxWidth:1200, margin:'0 auto 1rem', padding:'0 2rem'}}>
          <div style={{background:'#e8f5e9', border:'1px solid #c8e6c9', color:'#256029', padding:'0.75rem 1rem', borderRadius:6}}>
            Paiement confirmé. Merci pour votre soutien !
          </div>
        </div>
      )}

      {donateOpen && selectedCampaign && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'#fff', padding:'1.5rem', borderRadius:'8px', width:'90%', maxWidth:'420px'}}>
            <h3>Faire un don — {selectedCampaign.title}</h3>
            <form onSubmit={submitDonation}>
              <div className="form-group">
                <label>Montant (€)</label>
                <input type="number" min="1" step="1" required value={donateData.amount} onChange={(e)=>setDonateData({...donateData, amount:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Méthode</label>
                <select value={donateData.paymentMethod} onChange={(e)=>setDonateData({...donateData, paymentMethod:e.target.value})}>
                  <option value="wave">Wave</option>
                  <option value="orange">Orange Money</option>
                </select>
              </div>
              <div className="form-group">
                <label>Message (optionnel)</label>
                <textarea rows="3" value={donateData.message} onChange={(e)=>setDonateData({...donateData, message:e.target.value})}></textarea>
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={donateData.anonymous} onChange={(e)=>setDonateData({...donateData, anonymous:e.target.checked})} />
                  Don anonyme
                </label>
              </div>
              <div style={{display:'flex', gap:'0.5rem', justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>setDonateOpen(false)}>Annuler</button>
                <button type="submit">Valider le don</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQr && qrUrl && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1001}}>
          <div style={{background:'#fff', padding:'1.5rem', borderRadius:'8px', width:'min(520px,95vw)'}}>
            <h3 style={{marginTop:0}}>Scanner et Payer</h3>
            <p style={{color:'#555'}}>Scannez ce QR avec votre téléphone pour ouvrir la page de paiement {donateData.paymentMethod === 'orange' ? 'Orange Money' : 'Wave'}.
              {" "}Si vous êtes déjà sur mobile, vous pouvez aussi ouvrir le lien directement.</p>
            <div style={{display:'flex', gap:'1rem', alignItems:'center', justifyContent:'center', margin:'1rem 0'}}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrUrl)}`} alt="QR paiement" style={{width:280, height:280}} />
            </div>
            <div style={{wordBreak:'break-all', background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:6, padding:8, fontSize:12, color:'#334155'}}>{qrUrl}</div>
            <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:10}}>
              <button onClick={()=>{ window.open(qrUrl, '_blank'); }} style={{background:'#e5e7eb', border:'none', borderRadius:6, padding:'8px 10px', cursor:'pointer'}}>Ouvrir</button>
              <button onClick={async()=>{ try{ await navigator.clipboard.writeText(qrUrl); setCopyMsg('Lien copié'); setTimeout(()=>setCopyMsg(''), 1200);}catch{}}} style={{background:'#e5e7eb', border:'none', borderRadius:6, padding:'8px 10px', cursor:'pointer'}}>Copier le lien</button>
              <button onClick={()=>{ const wa = `https://wa.me/?text=${encodeURIComponent('Paiement don: '+qrUrl)}`; window.open(wa, '_blank'); }} style={{background:'#25D366', color:'#fff', border:'none', borderRadius:6, padding:'8px 10px', cursor:'pointer'}}>Partager WhatsApp</button>
              <button onClick={()=>setShowQr(false)} style={{background:'#00a651', color:'#fff', border:'none', borderRadius:6, padding:'8px 10px', cursor:'pointer'}}>Fermer</button>
            </div>
            {copyMsg && <div style={{marginTop:8, color:'#16a34a'}}>{copyMsg}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Donations;
