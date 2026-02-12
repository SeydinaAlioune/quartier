import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout/AdminLayout';
import api from '../../../services/api';
import './AdminPaymentsConfig.css';
import { emitToast } from '../../../utils/toast';

const SecretField = ({ label, maskedValue, revealedValue, onReveal, onCopy, onEditChange }) => {
  const display = revealedValue != null && revealedValue !== '' ? revealedValue : (maskedValue || '—');
  return (
    <div className="payments-config__secret">
      <div className="payments-config__secret-head">
        <div className="payments-config__secret-label">{label}</div>
        <div className="payments-config__secret-actions">
          <button className="payments-config__btn" type="button" onClick={onReveal}>Afficher</button>
          <button className="payments-config__btn" type="button" onClick={onCopy}>Copier</button>
          <button className="payments-config__btn" type="button" onClick={() => onEditChange(true)}>Modifier</button>
        </div>
      </div>
      <div className="payments-config__secret-value" title={display}>{display}</div>
    </div>
  );
};

const SecretEditor = ({ label, value, onChange, onCancel }) => (
  <div className="payments-config__secret-edit">
    <label className="payments-config__label">{label}</label>
    <input
      className="payments-config__input"
      type="password"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`Saisir une nouvelle valeur pour ${label}`}
      autoComplete="off"
    />
    <div className="payments-config__secret-edit-actions">
      <button className="payments-config__btn" type="button" onClick={onCancel}>Annuler</button>
    </div>
  </div>
);

const AdminPaymentsConfig = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const [revealConfirmOpen, setRevealConfirmOpen] = useState(false);
  const [revealInFlight, setRevealInFlight] = useState(false);

  const [config, setConfig] = useState({
    appName: '',
    description: '',
    websiteUrl: '',
    mode: 'test',
    services: { invoicePaymentEnabled: true },
  });

  const [masked, setMasked] = useState({
    masterKey: '',
    testPublicKey: '',
    testPrivateKey: '',
    testToken: '',
    livePublicKey: '',
    livePrivateKey: '',
    liveToken: '',
  });
  const [revealed, setRevealed] = useState(null); // secrets en clair (après "Afficher")

  const [editSecrets, setEditSecrets] = useState({}); // champs secrets en édition

  const getUnlockToken = useCallback(() => {
    try {
      return localStorage.getItem('qc_payments_config_unlock') || '';
    } catch {
      return '';
    }
  }, []);

  const setUnlockToken = (token) => {
    try {
      if (!token) localStorage.removeItem('qc_payments_config_unlock');
      else localStorage.setItem('qc_payments_config_unlock', token);
    } catch {
      // ignore
    }
  };

  const authedHeaders = useCallback(() => {
    const t = getUnlockToken();
    return t ? { 'X-Payments-Config-Token': t } : {};
  }, [getUnlockToken]);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/payments/config', { headers: authedHeaders() });
      const data = res.data || {};
      setConfig({
        appName: data.appName || '',
        description: data.description || '',
        websiteUrl: data.websiteUrl || '',
        mode: data.mode || 'test',
        services: { invoicePaymentEnabled: data.services?.invoicePaymentEnabled !== false },
      });
      setMasked({
        masterKey: data.masterKey || '',
        testPublicKey: data.testPublicKey || '',
        testPrivateKey: data.testPrivateKey || '',
        testToken: data.testToken || '',
        livePublicKey: data.livePublicKey || '',
        livePrivateKey: data.livePrivateKey || '',
        liveToken: data.liveToken || '',
      });
      setRevealed(null);
      setEditSecrets({});
      setLocked(false);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 423) {
        setLocked(true);
        setError('');
        return;
      }
      setError("Impossible de charger la configuration.");
    } finally {
      setLoading(false);
    }
  }, [authedHeaders]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const revealSecrets = async () => {
    try {
      setRevealInFlight(true);
      const res = await api.get('/api/payments/config?reveal=1', { headers: authedHeaders() });
      const d = res.data || {};
      setRevealed({
        masterKey: d.masterKey || '',
        testPublicKey: d.testPublicKey || '',
        testPrivateKey: d.testPrivateKey || '',
        testToken: d.testToken || '',
        livePublicKey: d.livePublicKey || '',
        livePrivateKey: d.livePrivateKey || '',
        liveToken: d.liveToken || '',
      });
      window.setTimeout(() => {
        setRevealed(null);
      }, 60_000);
    } catch {
      emitToast("Impossible d'afficher les clés");
    } finally {
      setRevealInFlight(false);
    }
  };

  const copyText = async (txt) => {
    try { await navigator.clipboard.writeText(txt); emitToast('Copié'); } catch {}
  };

  const save = async () => {
    try {
      setSaving(true);
      const payload = {
        appName: config.appName,
        description: config.description,
        websiteUrl: config.websiteUrl,
        mode: config.mode,
        services: { invoicePaymentEnabled: !!config.services.invoicePaymentEnabled },
      };
      // Ajouter uniquement les secrets réellement édités
      Object.entries(editSecrets).forEach(([k, v]) => {
        if (typeof v === 'string' && v.trim() !== '') payload[k] = v.trim();
      });
      await api.put('/api/payments/config', payload, { headers: authedHeaders() });
      emitToast('Configuration mise à jour');
      await fetchConfig();
    } catch {
      emitToast('Échec de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const unlock = async () => {
    try {
      setUnlocking(true);
      const res = await api.post('/api/payments/config/unlock', { pin });
      const token = res?.data?.token;
      if (!token) {
        emitToast('Échec du déverrouillage');
        return;
      }
      setUnlockToken(token);
      setPin('');
      await fetchConfig();
    } catch (e) {
      const msg = e?.response?.data?.message;
      emitToast(typeof msg === 'string' && msg ? msg : 'Code incorrect');
    } finally {
      setUnlocking(false);
    }
  };

  const sec = useMemo(()=>({
    masterKey: { label: 'Clé Principale' },
    testPublicKey: { label: 'Clé Publique (Test)' },
    testPrivateKey: { label: 'Clé Privée (Test)' },
    testToken: { label: 'Token (Test)' },
    livePublicKey: { label: 'Clé Publique (Production)' },
    livePrivateKey: { label: 'Clé Privée (Production)' },
    liveToken: { label: 'Token (Production)' },
  }), []);

  return (
    <AdminLayout title="Configuration Paiements">
      <div className="payments-config-page">
        {loading && <div className="payments-config__card">Chargement…</div>}
        {error && <div className="payments-config__card payments-config__card--error">{error}</div>}

        {locked && !loading && (
          <div className="payments-config__lock">
            <div className="payments-config__card">
              <h3 className="payments-config__h3">Accès protégé</h3>
              <p className="payments-config__muted">
                Cette page contient des informations sensibles. Entrez le code PIN à 4 chiffres pour continuer.
              </p>
              <div className="payments-config__lock-row">
                <input
                  className="payments-config__input payments-config__pin"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  aria-label="Code PIN"
                />
                <button
                  className="payments-config__btn payments-config__btn--primary"
                  type="button"
                  disabled={unlocking || pin.length !== 4}
                  onClick={unlock}
                >
                  {unlocking ? 'Vérification…' : 'Déverrouiller'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && !locked && (
          <>
            {revealConfirmOpen && (
              <div className="payments-config__modal" role="dialog" aria-modal="true">
                <div className="payments-config__modal-backdrop" onClick={() => setRevealConfirmOpen(false)} />
                <div className="payments-config__modal-card">
                  <div className="payments-config__modal-title">Afficher les clés ?</div>
                  <div className="payments-config__modal-body">
                    Vous êtes sur le point d’afficher des clés sensibles. Assurez-vous que personne ne regarde votre écran.
                  </div>
                  <div className="payments-config__modal-actions">
                    <button className="payments-config__btn" type="button" onClick={() => setRevealConfirmOpen(false)}>Annuler</button>
                    <button
                      className="payments-config__btn payments-config__btn--primary"
                      type="button"
                      disabled={revealInFlight}
                      onClick={async () => {
                        setRevealConfirmOpen(false);
                        await revealSecrets();
                      }}
                    >
                      {revealInFlight ? 'Affichage…' : 'Afficher'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="payments-config__grid">
              <div className="payments-config__card">
                <h3 className="payments-config__h3">Informations sur l'application</h3>

                <div className="payments-config__form-row">
                  <label className="payments-config__label">Nom de l'application</label>
                  <input className="payments-config__input" type="text" value={config.appName} onChange={(e) => setConfig({ ...config, appName: e.target.value })} />
                </div>

                <div className="payments-config__form-row">
                  <label className="payments-config__label">Description</label>
                  <textarea className="payments-config__input" rows={3} value={config.description} onChange={(e) => setConfig({ ...config, description: e.target.value })} />
                </div>

                <div className="payments-config__form-row">
                  <label className="payments-config__label">URL du site Web</label>
                  <input className="payments-config__input" type="url" value={config.websiteUrl} onChange={(e) => setConfig({ ...config, websiteUrl: e.target.value })} />
                </div>

                <div className="payments-config__form-row">
                  <label className="payments-config__label">Environnement</label>
                  <select className="payments-config__input" value={config.mode} onChange={(e) => setConfig({ ...config, mode: e.target.value })}>
                    <option value="test">Test (transactions simulées)</option>
                    <option value="live">Production (transactions réelles)</option>
                  </select>
                </div>

                <div className="payments-config__form-row">
                  <label className="payments-config__label">Services</label>
                  <label className="payments-config__check">
                    <input type="checkbox" checked={!!config.services.invoicePaymentEnabled} onChange={(e) => setConfig({ ...config, services: { ...config.services, invoicePaymentEnabled: e.target.checked } })} />
                    <span>Envoi de facture de paiement</span>
                    <span className={`payments-config__badge ${config.services.invoicePaymentEnabled ? 'is-on' : 'is-off'}`}>{config.services.invoicePaymentEnabled ? 'Activé' : 'Désactivé'}</span>
                  </label>
                </div>
              </div>

              <div className="payments-config__card">
                <div className="payments-config__card-head">
                  <h3 className="payments-config__h3">Clés API</h3>
                  <button
                    className="payments-config__btn"
                    type="button"
                    onClick={() => setRevealConfirmOpen(true)}
                    disabled={revealInFlight}
                  >
                    {revealed ? 'Clés visibles (auto-masquage 60s)' : 'Révéler'}
                  </button>
                </div>

                <div className="payments-config__secrets">
                  {Object.entries(sec).map(([key, meta]) => (
                    <div key={key} className="payments-config__secret-block">
                      {editSecrets[key] === undefined && (
                        <SecretField
                          label={meta.label}
                          maskedValue={masked[key]}
                          revealedValue={revealed?.[key]}
                          onReveal={() => setRevealConfirmOpen(true)}
                          onCopy={() => {
                            const txt = (revealed?.[key] || '').trim();
                            if (!txt) return emitToast('Affichez la clé avant de copier');
                            copyText(txt);
                          }}
                          onEditChange={() => setEditSecrets((s) => ({ ...s, [key]: '' }))}
                        />
                      )}
                      {editSecrets[key] !== undefined && (
                        <SecretEditor
                          label={meta.label}
                          value={editSecrets[key]}
                          onChange={(val) => setEditSecrets((s) => ({ ...s, [key]: val }))}
                          onCancel={() => setEditSecrets((s) => {
                            const n = { ...s };
                            delete n[key];
                            return n;
                          })}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="payments-config__footer">
                  <button className="payments-config__btn payments-config__btn--primary" disabled={saving} onClick={save}>
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPaymentsConfig;
