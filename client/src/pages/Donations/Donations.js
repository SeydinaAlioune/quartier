import React, { useState, useEffect } from 'react';
import './Donations.css';
import api from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal, Badge, Card, SectionHead } from '../../components/UI';
import useSeo from '../../hooks/useSeo';

const Donations = () => {
  useSeo({
    title: 'Dons',
    description: 'Soutenez les projets et initiatives du quartier. Participez à une collecte en cours en toute simplicité.',
  });

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

  const isAdmin = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      return u && u.role === 'admin';
    } catch {
      return false;
    }
  })();

  const formatXof = (n) => {
    const v = Number(n || 0);
    return `${v.toLocaleString('fr-FR')} FCFA`;
  };

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
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      if (status === 401) {
        setToast('Session expirée. Reconnecte-toi puis réessaie.');
        return;
      }
      if (typeof serverMsg === 'string' && serverMsg.trim()) {
        setToast(serverMsg);
        return;
      }
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

  const featuredCampaign = (() => {
    if (!currentCampaigns.length) return null;
    const byUrgency = (c) => {
      const goal = Number(c.goal) || 0;
      const collected = Number(c.collected) || 0;
      const remaining = Math.max(0, goal - collected);
      const hasEnd = c.endDate instanceof Date;
      const daysLeft = hasEnd ? Math.max(0, (c.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 9999;
      const categoryBoost = c.category === 'emergency' ? -1000 : 0;
      return (daysLeft * 10) + (remaining > 0 ? 1 : 5000) + categoryBoost;
    };
    const candidates = [...currentCampaigns].sort((a, b) => byUrgency(a) - byUrgency(b));
    return candidates[0] || null;
  })();

  const [quickAmount, setQuickAmount] = useState(5000);

  const labels = {
    telethon: 'Téléthon',
    project: 'Projet',
    emergency: 'Urgence',
    community: 'Communauté',
    other: 'Autre',
  };

  const WaveIcon = ({ className }) => (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M2 15.5C4.5 15.5 5.5 8.5 8 8.5C10.5 8.5 11 20 13.5 20C16 20 16.5 4 19 4C21.5 4 22 15.5 22 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const OrangeIcon = ({ className }) => (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 2.5c4.8 3.1 7.6 7 7.6 10.8 0 4.3-3.4 8-7.6 8s-7.6-3.7-7.6-8C4.4 9.5 7.2 5.6 12 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M12 21.3V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div className="donations-container">
      <header
        className="donations-hero"
      >
        <div className="donations-hero-inner">
          <div className="donations-hero-grid">
            <div className="donations-hero-left">
              <p className="donations-hero-kicker">Solidarité</p>
              <h1>Un don, une action réelle dans le quartier</h1>
              <p className="donations-hero-lead">Chaque contribution finance des actions visibles: urgences, projets, entraide. Donne en quelques secondes et suis l'impact.</p>
              <div className="donations-hero-actions">
                <button type="button" className="donations-hero-btn" onClick={handleDonateNow}>Faire un don</button>
                <button type="button" className="donations-hero-link" onClick={() => document.getElementById('donations-active')?.scrollIntoView({ behavior: 'smooth' })}>Voir les collectes</button>
              </div>
              <div className="donations-hero-stats">
                <div className="donations-stat"><span className="v">{stats.active}</span><span className="l">collectes actives</span></div>
                <div className="donations-stat"><span className="v">{formatXof(stats.totalCollected)}</span><span className="l">collectés</span></div>
                <div className="donations-stat"><span className="v">{formatXof(stats.totalGoal)}</span><span className="l">objectif total</span></div>
              </div>
              <div className="donations-hero-trust" aria-label="Confiance">
                <span className="trust-pill">Paiement sécurisé</span>
                <span className="trust-pill">Suivi automatique</span>
                <span className="trust-pill">Historique</span>
                <span className="trust-pill">Support</span>
              </div>
            </div>

            <aside className="donations-hero-right" aria-label="Don rapide">
              <div className="donations-quick">
                <div className="donations-quick-head">
                  <div className="t">Don rapide</div>
                  <div className="s">{featuredCampaign ? `Collecte à soutenir: ${featuredCampaign.title}` : 'Choisis une collecte ci-dessous'}</div>
                </div>
                {featuredCampaign && (
                  <div className="donations-quick-featured">
                    <div className="line">
                      <span className="k">Objectif</span>
                      <span className="v">{formatXof(featuredCampaign.goal)}</span>
                    </div>
                    <div className="line">
                      <span className="k">Déjà collectés</span>
                      <span className="v">{formatXof(featuredCampaign.collected)}</span>
                    </div>
                    <div className="line">
                      <span className="k">Reste</span>
                      <span className="v">{formatXof(Math.max(0, (Number(featuredCampaign.goal) || 0) - (Number(featuredCampaign.collected) || 0)))}</span>
                    </div>
                  </div>
                )}

                <div className="donations-quick-amounts" role="group" aria-label="Montants rapides">
                  {[1000, 2000, 5000, 10000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`donations-preset${quickAmount === v ? ' is-active' : ''}`}
                      onClick={() => setQuickAmount(v)}
                    >
                      {v.toLocaleString('fr-FR')} FCFA
                    </button>
                  ))}
                </div>

                <div className="donations-quick-actions">
                  <button
                    type="button"
                    className="pay-cta pay-cta--wave"
                    disabled={!featuredCampaign}
                    onClick={() => {
                      if (!featuredCampaign) return;
                      setDonateData((d) => ({ ...d, amount: String(quickAmount), paymentMethod: 'wave' }));
                      openDonate(featuredCampaign, 'wave');
                    }}
                  >
                    <WaveIcon className="pay-cta__icon" />
                    <span>Wave</span>
                  </button>
                  <button
                    type="button"
                    className="pay-cta pay-cta--orange"
                    disabled={!featuredCampaign}
                    onClick={() => {
                      if (!featuredCampaign) return;
                      setDonateData((d) => ({ ...d, amount: String(quickAmount), paymentMethod: 'orange' }));
                      openDonate(featuredCampaign, 'orange');
                    }}
                  >
                    <OrangeIcon className="pay-cta__icon" />
                    <span>Orange</span>
                  </button>
                </div>
                <div className="donations-quick-note">En cliquant, tu confirmes le montant et tu finalises dans la fenêtre de paiement.</div>
              </div>
            </aside>
          </div>
        </div>
      </header>

      <section className="donations-trust" aria-label="Transparence">
        <div className="donations-trust-inner">
          <div className="donations-trust-item">
            <div className="k">Paiement sécurisé</div>
            <div className="v">Wave et Orange Money via PayDunya (dès validation KYC).</div>
          </div>
          <div className="donations-trust-item">
            <div className="k">Suivi & preuve</div>
            <div className="v">Historique accessible depuis votre compte, statut du don mis à jour automatiquement.</div>
          </div>
          <div className="donations-trust-item">
            <div className="k">Besoin d'aide ?</div>
            <div className="v">En cas de problème de paiement, contactez l'administrateur via la page Contact.</div>
          </div>
        </div>
      </section>

      {toast && (
        <div className="donations-toast" role="status">{toast}</div>
      )}

      <section className="current-campaigns" id="donations-active">
        <SectionHead title="Collectes en Cours" />
        {loading && <p>Chargement des collectes...</p>}
        {!loading && error && <p className="donations-error">{error}</p>}
        {!loading && !error && currentCampaigns.length === 0 && (
          <p>Aucune collecte active pour le moment.</p>
        )}
        <div className="campaigns-grid">
          {currentCampaigns.map(campaign => (
            <Card key={campaign.id} className="campaign-card">
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
                  <Badge className={`badge ${campaign.category}`}>{labels[campaign.category] || campaign.category}</Badge>
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
                <span>{formatXof(campaign.collected)} collectés</span>
                <span>Objectif: {formatXof(campaign.goal)}</span>
              </div>
              <div className="payment-methods">
                <button className="pay-cta pay-cta--wave" type="button" onClick={() => openDonate(campaign, 'wave')}>
                  <WaveIcon className="pay-cta__icon" />
                  <span>Wave</span>
                </button>
                <button className="pay-cta pay-cta--orange" type="button" onClick={() => openDonate(campaign, 'orange')}>
                  <OrangeIcon className="pay-cta__icon" />
                  <span>Orange Money</span>
                </button>
              </div>
              {!localStorage.getItem('token') && (
                <div className="donations-auth-hint">
                  Connectez-vous pour finaliser votre don.
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section className="completed-campaigns">
        <SectionHead title="Collectes Réussies" />
        {!loading && !error && completedCampaigns.length === 0 && (
          <p>Aucune collecte terminée.</p>
        )}
        <div className="campaigns-grid">
          {completedCampaigns.map(campaign => (
            <Card key={campaign.id} className="campaign-card completed">
              <h3>{campaign.title}</h3>
              <p>{campaign.description}</p>
              <div className="campaign-meta">
                <Badge className={`badge ${campaign.category}`}>{labels[campaign.category] || campaign.category}</Badge>
                {campaign.projectTitle && <span className="meta">Projet: {campaign.projectTitle}</span>}
                <span className="meta">
                  {campaign.startDate ? campaign.startDate.toLocaleDateString('fr-FR') : '—'}
                  {campaign.endDate ? ` → ${campaign.endDate.toLocaleDateString('fr-FR')}` : ''}
                </span>
              </div>
              <div className="campaign-stats">
                <span>Montant collecté: {formatXof(campaign.collected)}</span>
                <span>Objectif initial: {formatXof(campaign.goal)}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {isAdmin && (
        <section className="create-campaign">
          <h2>Créer une Nouvelle Collecte</h2>
          <p>Réservé aux administrateurs et responsables d'associations reconnues</p>
          <button className="create-btn" onClick={handleCreateCampaign}>Créer une collecte</button>
        </section>
      )}

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

      <Modal
        open={Boolean(donateOpen && selectedCampaign)}
        onClose={() => setDonateOpen(false)}
        overlayClassName="donations-modal"
        cardClassName="donations-modal-card"
        ariaLabel="Faire un don"
      >
        {selectedCampaign && (
          <>
            <div className="donations-modal-head">
              <div>
                <h3>Faire un don</h3>
                <p>{selectedCampaign.title}</p>
              </div>
              <button type="button" className="donations-modal-close" onClick={()=>setDonateOpen(false)}>Fermer</button>
            </div>

            <form className="donations-form" onSubmit={submitDonation}>
              <div className="donations-field donations-field--full">
                <span>Montants rapides</span>
                <div className="donations-amount-presets" role="group" aria-label="Montants rapides">
                  {[1000, 2000, 5000, 10000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`donations-preset${String(donateData.amount) === String(v) ? ' is-active' : ''}`}
                      onClick={() => setDonateData({ ...donateData, amount: String(v) })}
                    >
                      {v.toLocaleString('fr-FR')} FCFA
                    </button>
                  ))}
                </div>
              </div>
              <label className="donations-field">
                <span>Montant (FCFA)</span>
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
          </>
        )}
      </Modal>

      <Modal
        open={Boolean(showQr && qrUrl)}
        onClose={() => setShowQr(false)}
        overlayClassName="donations-modal"
        cardClassName="donations-qr-card"
        ariaLabel="Scanner et payer"
      >
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
      </Modal>
    </div>
  );
};

export default Donations;
