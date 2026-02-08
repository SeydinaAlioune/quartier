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
  const [toast, setToast] = useState('');

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

        const getCampaignImage = (c) => {
          const direct = (c.images && c.images[0]?.url) ? toAbsolute(c.images[0].url) : '';
          if (direct) return direct;
          const projAttachments = Array.isArray(c?.project?.attachments) ? c.project.attachments : [];
          const projImage = projAttachments.find(a => a?.type === 'image' && a?.url)?.url;
          if (projImage) return toAbsolute(projImage);
          return `${process.env.PUBLIC_URL}/pro.jpg`;
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
          image: getCampaignImage(c)
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
      setToast('');
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
      setToast('Merci ! Ton don a été enregistré.');
      setDonateOpen(false);
    } catch (err) {
      setToast("Échec du don. Réessaie plus tard.");
    }
  };

  const handleCreateCampaign = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return navigate('/login');
    if (user.role !== 'admin') {
      setToast('Accès réservé aux administrateurs.');
      window.setTimeout(() => setToast(''), 2000);
      return;
    }
    setToast('Création de collecte: utilisez le panneau Admin (à intégrer).');
    window.setTimeout(() => setToast(''), 2200);
  };

  const handleDonateNow = () => {
    if (currentCampaigns.length === 0) {
      setToast('Aucune collecte active pour le moment.');
      window.setTimeout(() => setToast(''), 2000);
      return;
    }
    openDonate(currentCampaigns[0], 'wave');
  };

  const stats = (() => {
    const active = currentCampaigns.length;
    const totalCollected = currentCampaigns.reduce((acc, c) => acc + (Number(c.collected) || 0), 0);
    const totalGoal = currentCampaigns.reduce((acc, c) => acc + (Number(c.goal) || 0), 0);
    return { active, totalCollected, totalGoal };
  })();

  const labels = {
    telethon: 'Téléthon',
    project: 'Projet',
    emergency: 'Urgence',
    community: 'Communauté',
    other: 'Autre',
  };

  return (
    <div className="donations-container">
      <header
        className="donations-hero"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${process.env.PUBLIC_URL}/pro.jpg)`,
          backgroundPosition: 'center 35%'
        }}
      >
        <div className="donations-hero-inner">
          <p className="donations-hero-kicker">Solidarité</p>
          <h1>Téléthon & Collectes</h1>
          <p className="donations-hero-lead">Aide les personnes et les causes du quartier. Les dons sont indépendants des projets, mais certaines collectes peuvent être liées à un projet.</p>
          <div className="donations-hero-actions">
            <button type="button" className="donations-hero-btn" onClick={handleDonateNow}>Faire un don</button>
            <button type="button" className="donations-hero-link" onClick={() => document.getElementById('donations-active')?.scrollIntoView({ behavior: 'smooth' })}>Voir les collectes</button>
          </div>
          <div className="donations-hero-stats">
            <div className="donations-stat"><span className="v">{stats.active}</span><span className="l">collectes actives</span></div>
            <div className="donations-stat"><span className="v">{stats.totalCollected.toLocaleString('fr-FR')}€</span><span className="l">collectés</span></div>
            <div className="donations-stat"><span className="v">{stats.totalGoal.toLocaleString('fr-FR')}€</span><span className="l">objectif total</span></div>
          </div>
        </div>
      </header>

      {toast && (
        <div className="donations-toast" role="status">{toast}</div>
      )}

      <section className="current-campaigns" id="donations-active">
        <h2>Collectes en Cours</h2>
        {loading && <p>Chargement des collectes...</p>}
        {!loading && error && <p className="donations-error">{error}</p>}
        {!loading && !error && currentCampaigns.length === 0 && (
          <p>Aucune collecte active pour le moment.</p>
        )}
        <div className="campaigns-grid">
          {currentCampaigns.map(campaign => (
            <div key={campaign.id} className="campaign-card">
              <div className="campaign-media">
                <img
                  src={campaign.image}
                  alt={campaign.title}
                  onError={(e) => {
                    if (e.currentTarget?.dataset?.fallbackApplied) return;
                    e.currentTarget.dataset.fallbackApplied = '1';
                    e.currentTarget.src = `${process.env.PUBLIC_URL}/pro.jpg`;
                  }}
                />
                <div className="campaign-badges">
                  <span className={`badge ${campaign.category}`}>{labels[campaign.category] || campaign.category}</span>
                  {campaign.projectTitle && <span className="campaign-pill">Projet: {campaign.projectTitle}</span>}
                </div>
              </div>
              <h3 className="campaign-title">{campaign.title}</h3>
              <p className="campaign-desc">{campaign.description}</p>
              <div className="campaign-meta">
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
                <span>{Number(campaign.collected || 0).toLocaleString('fr-FR')}€ collectés</span>
                <span>Objectif: {Number(campaign.goal || 0).toLocaleString('fr-FR')}€</span>
              </div>
              <div className="payment-methods">
                <button className="payment-btn wave" onClick={() => openDonate(campaign, 'wave')}>Wave</button>
                <button className="payment-btn orange" onClick={() => openDonate(campaign, 'orange')}>Orange Money</button>
              </div>
              {!localStorage.getItem('token') && (
                <div className="donations-auth-hint">
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
        <div className="donations-paid">
          Paiement confirmé. Merci pour votre soutien !
        </div>
      )}

      {donateOpen && selectedCampaign && (
        <div className="donations-modal" role="dialog" aria-label="Faire un don">
          <div className="donations-modal-card">
            <div className="donations-modal-head">
              <div>
                <h3>Faire un don</h3>
                <p>{selectedCampaign.title}</p>
              </div>
              <button type="button" className="donations-modal-close" onClick={()=>setDonateOpen(false)}>Fermer</button>
            </div>

            <form className="donations-form" onSubmit={submitDonation}>
              <label className="donations-field">
                <span>Montant (€)</span>
                <input type="number" min="1" step="1" required value={donateData.amount} onChange={(e)=>setDonateData({...donateData, amount:e.target.value})} />
              </label>
              <label className="donations-field">
                <span>Méthode</span>
                <select value={donateData.paymentMethod} onChange={(e)=>setDonateData({...donateData, paymentMethod:e.target.value})}>
                  <option value="wave">Wave</option>
                  <option value="orange">Orange Money</option>
                </select>
              </label>
              <label className="donations-field donations-field--full">
                <span>Message (optionnel)</span>
                <textarea rows="3" value={donateData.message} onChange={(e)=>setDonateData({...donateData, message:e.target.value})}></textarea>
              </label>
              <label className="donations-check donations-field--full">
                <input type="checkbox" checked={donateData.anonymous} onChange={(e)=>setDonateData({...donateData, anonymous:e.target.checked})} />
                <span>Don anonyme</span>
              </label>
              <div className="donations-actions">
                <button type="button" className="donations-btn-secondary" onClick={()=>setDonateOpen(false)}>Annuler</button>
                <button type="submit" className="donations-btn-primary">Valider le don</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQr && qrUrl && (
        <div className="donations-modal" role="dialog" aria-label="Scanner et payer">
          <div className="donations-qr-card">
            <div className="donations-modal-head">
              <div>
                <h3>Scanner et payer</h3>
                <p>Ouvre la page de paiement {donateData.paymentMethod === 'orange' ? 'Orange Money' : 'Wave'} depuis ton téléphone.</p>
              </div>
              <button type="button" className="donations-modal-close" onClick={()=>setShowQr(false)}>Fermer</button>
            </div>
            <div className="donations-qr-body">
              <img className="donations-qr-img" src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrUrl)}`} alt="QR paiement" />
              <div className="donations-qr-url">{qrUrl}</div>
              <div className="donations-qr-actions">
                <button type="button" className="donations-btn-secondary" onClick={()=>{ window.open(qrUrl, '_blank'); }}>Ouvrir</button>
                <button type="button" className="donations-btn-secondary" onClick={async()=>{ try{ await navigator.clipboard.writeText(qrUrl); setCopyMsg('Lien copié'); setTimeout(()=>setCopyMsg(''), 1200);}catch{}}}>Copier</button>
                <button type="button" className="donations-btn-whatsapp" onClick={()=>{ const wa = `https://wa.me/?text=${encodeURIComponent('Paiement don: '+qrUrl)}`; window.open(wa, '_blank'); }}>WhatsApp</button>
              </div>
              {copyMsg && <div className="donations-copy">{copyMsg}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donations;
