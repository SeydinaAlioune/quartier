const { DonationCampaign, Donation } = require('../models/donation.model');
const { createPaymentSession } = require('../services/payment.service');

// Créer une campagne de dons
exports.createCampaign = async (req, res) => {
    try {
        const campaign = new DonationCampaign({
            ...req.body,
            organizer: req.user._id
        });
        await campaign.save();
        res.status(201).json({
            message: 'Campagne créée avec succès',
            campaign
        });
    } catch (error) {
        console.error('Erreur création campagne:', error);
        res.status(500).json({ message: 'Erreur lors de la création de la campagne' });
    }
};

// Récupérer le statut d'une donation (donateur ou admin)
exports.getDonationStatus = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id).populate('donor', 'id role');
        if (!donation) return res.status(404).json({ message: 'Donation introuvable' });
        const isOwner = donation.donor && (String(donation.donor._id || donation.donor.id) === String(req.user._id));
        const isAdmin = req.user && req.user.role === 'admin';
        if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Non autorisé' });
        res.json({ id: donation._id, status: donation.status, updatedAt: donation.updatedAt, amount: donation.amount, method: donation.paymentMethod });
    } catch (error) {
        console.error('Erreur getDonationStatus:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du statut de la donation' });
    }
};

// Statistiques globales pour Admin Dons
exports.getStats = async (req, res) => {
    try {
        // Nombre de dons complétés
        const donationsCount = await Donation.countDocuments({ status: 'completed' });
        // Somme totale collectée (basée sur les dons complétés)
        const sumAgg = await Donation.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, sum: { $sum: '$amount' } } }
        ]);
        const totalCollected = sumAgg?.[0]?.sum || 0;

        // Top campagnes par montant collecté (champ maintenu via post-save)
        const topCampaigns = await DonationCampaign.find({})
            .select('title collected goal category startDate endDate')
            .sort({ collected: -1 })
            .limit(5)
            .lean();

        // Répartition par catégorie (campagnes)
        const categoryAgg = await DonationCampaign.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 }, collected: { $sum: '$collected' } } }
        ]);

        res.json({
            donationsCount,
            totalCollected,
            topCampaigns,
            byCategory: categoryAgg
        });
    } catch (error) {
        console.error('Erreur getStats dons:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
    }
};

// --- Paiement réel (flux simulé/mokable) ---

// 1) Initier un paiement chez un prestataire (Wave / Orange)
exports.initiatePayment = async (req, res) => {
    try {
        const { campaign: campaignId, amount, paymentMethod, message, anonymous, returnUrl } = req.body || {};
        const method = String(paymentMethod || '').toLowerCase();
        if (!['wave', 'orange'].includes(method)) {
            return res.status(400).json({ message: 'Méthode de paiement non supportée' });
        }

        const campaign = await DonationCampaign.findById(campaignId);
        if (!campaign) return res.status(404).json({ message: 'Campagne non trouvée' });
        if (campaign.status !== 'active') return res.status(400).json({ message: 'Cette campagne n\'accepte plus les dons' });

        const amt = Number(amount);
        if (!Number.isFinite(amt) || amt < 1) return res.status(400).json({ message: 'Montant invalide' });

        // Créer la donation en statut pending
        const donation = new Donation({
            campaign: campaign._id,
            donor: req.user._id,
            amount: amt,
            paymentMethod: method,
            message: message,
            anonymous: !!anonymous,
            status: 'pending',
            transactionId: 'PENDING_' + Date.now()
        });
        await donation.save();

        // Créer une session chez le prestataire (ou mock si non configuré)
        const { paymentUrl } = await createPaymentSession(method, {
            donationId: donation._id,
            amount: amt,
            returnUrl: returnUrl || '',
            req
        });
        return res.json({ paymentUrl, donationId: donation._id });
    } catch (error) {
        console.error('Erreur initiatePayment:', error);
        const msg = String(error?.message || '');
        if (msg.toLowerCase().includes('paiement non configuré')) {
            return res.status(400).json({ message: msg });
        }
        res.status(500).json({ message: 'Erreur lors de l\'initialisation du paiement' });
    }
};

// 2) Page de paiement simulée
exports.mockCheckout = async (req, res) => {
    try {
        const { donation: donationId, method = 'wave', amount = '0', returnUrl = '' } = req.query;
        const amountStr = (() => {
          const n = Number(amount);
          if (!Number.isFinite(n)) return String(amount);
          try { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n); } catch (_) { return `${n} €`; }
        })();
        const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Paiement ${method}</title>
    <style>
      :root{--accent:#00a651; --danger:#b71c1c; --bg:#f4f7f6; --text:#1b1e23}
      *{box-sizing:border-box}
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu; background:linear-gradient(135deg,#eef2f3,#dfe9f3); color:var(--text); display:flex; align-items:center; justify-content:center; min-height:100vh; padding:24px;}
      .card{background:#fff; padding:28px; border-radius:14px; box-shadow:0 12px 32px rgba(0,0,0,.12); max-width:520px; width:100%;}
      .title{margin:0 0 8px; font-size:1.25rem; color:#0f5132}
      .subtitle{margin:0 0 16px; color:#5f6b7a}
      .amount{font-size:2rem; font-weight:700; color:#0b5d1e; margin:6px 0 4px}
      .muted{color:#6b7280; font-size:.9rem}
      .row{margin:12px 0}
      .actions{display:flex; gap:10px; margin-top:18px}
      button{padding:12px 16px; border:none; border-radius:8px; cursor:pointer; font-weight:600}
      .ok{background:var(--accent); color:#fff}
      .ok:hover{filter:brightness(0.95)}
      .ko{background:var(--danger); color:#fff}
      .ko:hover{filter:brightness(0.95)}
    </style>
  </head>
  <body>
    <div class="card">
      <h3 class="title">Paiement — ${method.toUpperCase()}</h3>
      <p class="subtitle">Veuillez confirmer votre paiement sécurisé</p>
      <div class="row amount">${amountStr}</div>
      <div class="row muted">Référence: <code>${donationId}</code></div>
      <div class="row muted" id="status"></div>
      <div class="actions">
        <button class="ok" onclick="pay(true)">Payer maintenant</button>
        <button class="ko" onclick="pay(false)">Annuler</button>
      </div>
    </div>
    <script>
      async function pay(success){
        const res = await fetch('/api/donations/webhook/${method}', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ donationId: '${donationId}', success })
        });
        const data = await res.json().catch(()=>({}));
        document.getElementById('status').textContent = data.message || (success? 'Paiement confirmé' : 'Paiement annulé');
        const ret = ${JSON.stringify(returnUrl)};
        if (ret) setTimeout(()=> { window.location = ret; }, 700);
      }
    </script>
  </body>
</html>`;
        res.status(200).send(html);
    } catch (error) {
        console.error('Erreur mockCheckout:', error);
        res.status(500).send('Erreur mock checkout');
    }
};

async function completeDonation(donationId, provider) {
    const donation = await Donation.findById(donationId);
    if (!donation) return null;
    donation.status = 'completed';
    donation.transactionId = `${provider.toUpperCase()}_${Date.now()}`;
    await donation.save();
    return donation;
}

// 3) Webhook Wave
exports.webhookWave = async (req, res) => {
    try {
        const { donationId, success } = req.body || {};
        if (!donationId) return res.status(400).json({ message: 'donationId manquant' });
        if (!success) {
            // marquer en failed
            const d = await Donation.findByIdAndUpdate(donationId, { status: 'failed', transactionId: 'WAVE_FAIL_' + Date.now() }, { new: true });
            return res.json({ message: 'Paiement Wave échoué', donation: d });
        }
        const d = await completeDonation(donationId, 'wave');
        if (!d) return res.status(404).json({ message: 'Donation introuvable' });
        res.json({ message: 'Paiement Wave confirmé', donation: d });
    } catch (error) {
        console.error('Erreur webhook Wave:', error);
        res.status(500).json({ message: 'Erreur webhook Wave' });
    }
};

// 4) Webhook Orange Money
exports.webhookOrange = async (req, res) => {
    try {
        const { donationId, success } = req.body || {};
        if (!donationId) return res.status(400).json({ message: 'donationId manquant' });
        if (!success) {
            const d = await Donation.findByIdAndUpdate(donationId, { status: 'failed', transactionId: 'ORANGE_FAIL_' + Date.now() }, { new: true });
            return res.json({ message: 'Paiement Orange Money échoué', donation: d });
        }
        const d = await completeDonation(donationId, 'orange');
        if (!d) return res.status(404).json({ message: 'Donation introuvable' });
        res.json({ message: 'Paiement Orange Money confirmé', donation: d });
    } catch (error) {
        console.error('Erreur webhook Orange:', error);
        res.status(500).json({ message: 'Erreur webhook Orange' });
    }
};

// 5) Webhook PayDunya (sandbox/live)
exports.webhookPaydunya = async (req, res) => {
    try {
        const body = req.body || {};
        // Extraire donationId depuis custom_data (plusieurs formats possibles)
        const donationId = (
            body?.invoice?.custom_data?.donationId ||
            body?.custom_data?.donationId ||
            body?.data?.custom_data?.donationId ||
            body?.data?.invoice?.custom_data?.donationId ||
            body?.donationId
        );
        if (!donationId) return res.status(400).json({ message: 'donationId manquant' });

        // Déterminer le succès (réponse sandbox varie selon intégration)
        const status = String(body?.invoice?.status || body?.status || body?.data?.status || '').toLowerCase();
        const responseCode = body?.response_code || body?.code || body?.result_code;
        const success = (status === 'completed' || status === 'approved' || status === 'success' || responseCode === '00' || responseCode === 200 || body?.success === true);

        if (!success) {
            const d = await Donation.findByIdAndUpdate(donationId, { status: 'failed', transactionId: 'PAYDUNYA_FAIL_' + Date.now() }, { new: true });
            return res.json({ message: 'Paiement PayDunya échoué', donation: d });
        }

        const d = await completeDonation(donationId, 'paydunya');
        if (!d) return res.status(404).json({ message: 'Donation introuvable' });
        res.json({ message: 'Paiement PayDunya confirmé', donation: d });
    } catch (error) {
        console.error('Erreur webhook PayDunya:', error);
        res.status(500).json({ message: 'Erreur webhook PayDunya' });
    }
};

// Obtenir toutes les campagnes
exports.getCampaigns = async (req, res) => {
    try {
        const {
            status = 'active',
            category,
            sort = '-createdAt',
            page = 1,
            limit = 20
        } = req.query;

        const query = {};
        if (status && status !== 'all') query.status = status;
        if (category) query.category = category;

        const campaigns = await DonationCampaign.find(query)
            .populate('organizer', 'name')
            .populate('project', 'title attachments')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await DonationCampaign.countDocuments(query);

        res.json({
            campaigns,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error('Erreur récupération campagnes:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des campagnes' });
    }
};

// Obtenir une campagne spécifique
exports.getCampaign = async (req, res) => {
    try {
        const campaign = await DonationCampaign.findById(req.params.id)
            .populate('organizer', 'name')
            .populate('project', 'title');

        if (!campaign) {
            return res.status(404).json({ message: 'Campagne non trouvée' });
        }

        res.json(campaign);
    } catch (error) {
        console.error('Erreur récupération campagne:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération de la campagne' });
    }
};

// Mettre à jour une campagne
exports.updateCampaign = async (req, res) => {
    try {
        const campaign = await DonationCampaign.findById(req.params.id);

        if (!campaign) {
            return res.status(404).json({ message: 'Campagne non trouvée' });
        }

        // Vérifier les droits
        if (campaign.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const updatableFields = [
            'title', 'description', 'goal', 'endDate',
            'category', 'status', 'images'
        ];

        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                campaign[field] = req.body[field];
            }
        });

        await campaign.save();
        res.json({
            message: 'Campagne mise à jour avec succès',
            campaign
        });
    } catch (error) {
        console.error('Erreur mise à jour campagne:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la campagne' });
    }
};

// Ajouter une mise à jour à la campagne
exports.addCampaignUpdate = async (req, res) => {
    try {
        const campaign = await DonationCampaign.findById(req.params.id);

        if (!campaign) {
            return res.status(404).json({ message: 'Campagne non trouvée' });
        }

        // Vérifier les droits
        if (campaign.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        campaign.updates.push({
            content: req.body.content,
            author: req.user._id
        });

        await campaign.save();
        res.json({
            message: 'Mise à jour ajoutée avec succès',
            campaign
        });
    } catch (error) {
        console.error('Erreur ajout mise à jour:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout de la mise à jour' });
    }
};

// Faire un don
exports.makeDonation = async (req, res) => {
    try {
        const campaign = await DonationCampaign.findById(req.body.campaign);

        if (!campaign) {
            return res.status(404).json({ message: 'Campagne non trouvée' });
        }

        if (campaign.status !== 'active') {
            return res.status(400).json({ message: 'Cette campagne n\'accepte plus les dons' });
        }

        const amount = Number(req.body.amount);
        if (!Number.isFinite(amount) || amount < 1) {
            return res.status(400).json({ message: 'Montant invalide' });
        }

        const donation = new Donation({
            campaign: campaign._id,
            donor: req.user._id,
            amount,
            paymentMethod: req.body.paymentMethod,
            message: req.body.message,
            anonymous: req.body.anonymous
        });

        // Ici, vous devriez implémenter la logique de paiement réelle
        // Pour l'instant, on simule un paiement réussi
        donation.status = 'completed';
        donation.transactionId = 'SIMULATED_' + Date.now();

        await donation.save();

        res.status(201).json({
            message: 'Don effectué avec succès',
            donation
        });
    } catch (error) {
        console.error('Erreur don:', error);
        res.status(500).json({ message: 'Erreur lors du don' });
    }
};

// Obtenir l'historique des dons d'un utilisateur
exports.getUserDonations = async (req, res) => {
    try {
        const donations = await Donation.find({ donor: req.user._id })
            .populate('campaign', 'title')
            .sort('-createdAt');

        res.json(donations);
    } catch (error) {
        console.error('Erreur historique dons:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique des dons' });
    }
};

// Obtenir les dons d'une campagne
exports.getCampaignDonations = async (req, res) => {
    try {
        const campaign = await DonationCampaign.findById(req.params.id);

        if (!campaign) {
            return res.status(404).json({ message: 'Campagne non trouvée' });
        }

        // Vérifier les droits
        if (campaign.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const donations = await Donation.find({
            campaign: campaign._id,
            status: 'completed'
        })
            .populate('donor', 'name')
            .sort('-createdAt');

        res.json(donations);
    } catch (error) {
        console.error('Erreur récupération dons:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des dons' });
    }
};
