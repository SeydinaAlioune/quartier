// Service d'intégration prestataires (Wave / Orange Money)
// Stratégie: si les variables d'environnement du prestataire sont disponibles,
// on prépare une session de paiement en appelant l'API; sinon on revient à un checkout mock.
const os = require('os');
const PaymentConfig = require('../models/paymentConfig.model');

function getLanIP() {
  try {
    const ifaces = os.networkInterfaces();
    const candidates = [];
    for (const name of Object.keys(ifaces)) {
      for (const info of ifaces[name] || []) {
        if (info && info.family === 'IPv4' && !info.internal) {
          candidates.push(info.address);
        }
      }
    }
    // Prioriser les IP privées classiques
    const preferred = candidates.find(ip => /^192\.168\./.test(ip) || /^10\./.test(ip) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip));
    return preferred || candidates[0] || '';
  } catch {
    return '';
  }
}

function absoluteBase(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL;
  const proto = (req.headers['x-forwarded-proto'] || '').split(',')[0] || req.protocol || 'http';
  let host = req.get('host') || 'localhost';
  const needsLan = /^(localhost|127\.0\.0\.1|\[?::1\]?)/i.test(host);
  if (needsLan) {
    const lan = process.env.PUBLIC_LAN_IP || getLanIP();
    if (lan) {
      host = host.replace(/^(localhost|127\.0\.0\.1|\[?::1\]?)/i, lan);
    }
  }
  return `${proto}://${host}`;
}

async function createMockCheckout({ donationId, method, amount, returnUrl, req }) {
  const base = absoluteBase(req);
  const qs = new URLSearchParams({
    donation: String(donationId),
    method,
    amount: String(amount),
    returnUrl: returnUrl || ''
  }).toString();
  return { paymentUrl: `${base}/api/donations/mock-checkout?${qs}` };
}

async function loadPaymentConfig() {
  try {
    const cfg = await PaymentConfig.findOne().lean();
    return cfg || null;
  } catch {
    return null;
  }
}

// PayDunya (sandbox/live)
async function initPayDunyaPayment({ donationId, amount, returnUrl, req }) {
  const cfg = await loadPaymentConfig();
  if (!cfg) return null;
  const mode = (cfg.mode === 'live') ? 'live' : 'test';
  const publicKey = mode === 'live' ? cfg.livePublicKey : cfg.testPublicKey;
  const privateKey = mode === 'live' ? cfg.livePrivateKey : cfg.testPrivateKey;
  const token = mode === 'live' ? cfg.liveToken : cfg.testToken;
  const masterKey = cfg.masterKey;
  if (!publicKey || !privateKey || !token || !masterKey) return null;

  const url = 'https://app.paydunya.com/api/v1/checkout-invoice/create';
  if (typeof fetch !== 'function') return null;
  try {
    const payload = {
      invoice: {
        items: [
          { name: `Don ${donationId}`, quantity: 1, unit_price: amount, total_amount: amount }
        ],
        total_amount: amount,
        description: `Don ${donationId}`,
        callback_url: absoluteBase(req) + '/api/donations/webhook/paydunya',
        return_url: returnUrl || absoluteBase(req),
        cancel_url: returnUrl || absoluteBase(req),
        custom_data: { donationId: String(donationId) }
      },
      store: {
        name: cfg.appName || 'QuartierConnect',
        website_url: cfg.websiteUrl || absoluteBase(req)
      }
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': masterKey,
        'PAYDUNYA-PRIVATE-KEY': privateKey,
        'PAYDUNYA-PUBLIC-KEY': publicKey,
        'PAYDUNYA-TOKEN': token
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(()=>({}));
    const code = data?.response_code || data?.code;
    const paymentUrl = data?.response_body?.checkout_url || data?.checkout_url || data?.url;
    if ((code === '00' || code === 200 || res.ok) && paymentUrl) {
      return { paymentUrl };
    }
  } catch (e) {
    // ignore
  }
  return null;
}

// Wave
async function initWavePayment({ donationId, amount, returnUrl, req }) {
  const url = process.env.WAVE_CHECKOUT_URL;
  const key = process.env.WAVE_API_KEY;
  if (url && key && typeof fetch === 'function') {
    try {
      const payload = {
        amount,
        currency: process.env.PAYMENT_CURRENCY || 'EUR',
        reference: String(donationId),
        callback_url: absoluteBase(req) + '/api/donations/webhook/wave',
        return_url: returnUrl || absoluteBase(req)
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(()=>({}));
      const paymentUrl = data.checkout_url || data.payment_url || data.redirect_url || data.url;
      if (paymentUrl) return { paymentUrl };
    } catch (e) {
      // fallback to mock
    }
  }
  return createMockCheckout({ donationId, method: 'wave', amount, returnUrl, req });
}

// Orange Money
async function initOrangePayment({ donationId, amount, returnUrl, req }) {
  const url = process.env.ORANGE_CHECKOUT_URL;
  const key = process.env.ORANGE_API_KEY;
  if (url && key && typeof fetch === 'function') {
    try {
      const payload = {
        amount,
        currency: process.env.PAYMENT_CURRENCY || 'EUR',
        reference: String(donationId),
        callback_url: absoluteBase(req) + '/api/donations/webhook/orange',
        return_url: returnUrl || absoluteBase(req)
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(()=>({}));
      const paymentUrl = data.checkout_url || data.payment_url || data.redirect_url || data.url;
      if (paymentUrl) return { paymentUrl };
    } catch (e) {
      // fallback to mock
    }
  }
  return createMockCheckout({ donationId, method: 'orange', amount, returnUrl, req });
}

async function createPaymentSession(provider, { donationId, amount, returnUrl, req }) {
  // 1) Tenter PayDunya si configuré (sandbox/live) pour centraliser Wave/Orange
  const paydunya = await initPayDunyaPayment({ donationId, amount, returnUrl, req });
  if (paydunya && paydunya.paymentUrl) return paydunya;

  // 2) Sinon fallback vers intégration directe Wave/Orange
  if (provider === 'wave') {
    return initWavePayment({ donationId, amount, returnUrl, req });
  }
  if (provider === 'orange') {
    return initOrangePayment({ donationId, amount, returnUrl, req });
  }
  throw new Error('Provider non supporté');
}

module.exports = { createPaymentSession, initWavePayment, initOrangePayment };
