import React, { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import AdminHeader from '../../../components/AdminHeader/AdminHeader';
import api from '../../../services/api';
import './AdminPaymentsConfig.css';

const SecretField = ({ label, maskedValue, revealedValue, onReveal, onCopy, onEditChange, isEditing }) => {
  const display = revealedValue != null && revealedValue !== '' ? revealedValue : (maskedValue || '—');
  return (
    <div className="secret-row">
      <div className="secret-label">{label}</div>
      <div className="secret-value">{display}</div>
      <div className="secret-actions">
        <button className="btn" type="button" onClick={onReveal}>Afficher</button>
        <button className="btn" type="button" onClick={onCopy}>Copier</button>
        <button className="btn" type="button" onClick={()=>onEditChange(true)}>Modifier</button>
      </div>
    </div>
  );
};

const SecretEditor = ({ label, value, onChange, onCancel }) => (
  <div className="secret-edit">
    <label>{label}</label>
    <input type="text" value={value} onChange={(e)=>onChange(e.target.value)} placeholder={`Saisir une nouvelle valeur pour ${label}`} />
    <div className="secret-edit-actions">
      <button className="btn" type="button" onClick={onCancel}>Annuler</button>
    </div>
  </div>
);

const AdminPaymentsConfig = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/payments/config');
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
    } catch (e) {
      setError("Impossible de charger la configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  const revealSecrets = async () => {
    try {
      const res = await api.get('/api/payments/config?reveal=1');
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
    } catch {
      alert("Impossible d'afficher les clés (droits admin requis)");
    }
  };

  const copyText = async (txt) => {
    try { await navigator.clipboard.writeText(txt); alert('Copié'); } catch {}
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
      await api.put('/api/payments/config', payload);
      alert('Configuration mise à jour');
      await fetchConfig();
    } catch {
      alert('Échec de la mise à jour');
    } finally {
      setSaving(false);
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
    <div className="admin-page">
      <AdminSidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <div className={`admin-content ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <AdminHeader title="Configuration Paiements" isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        <div className="payments-config">
          {loading && <div className="card">Chargement…</div>}
          {error && <div className="card error">{error}</div>}

          {!loading && !error && (
            <>
              <div className="grid">
                <div className="card">
                  <h3>Informations sur l'application</h3>
                  <div className="form-row">
                    <label>Nom de l'application</label>
                    <input type="text" value={config.appName} onChange={(e)=>setConfig({...config, appName:e.target.value})} />
                  </div>
                  <div className="form-row">
                    <label>Description</label>
                    <textarea rows={3} value={config.description} onChange={(e)=>setConfig({...config, description:e.target.value})} />
                  </div>
                  <div className="form-row">
                    <label>URL du site Web</label>
                    <input type="url" value={config.websiteUrl} onChange={(e)=>setConfig({...config, websiteUrl:e.target.value})} />
                  </div>
                  <div className="form-row">
                    <label>Statut de l'application</label>
                    <select value={config.mode} onChange={(e)=>setConfig({...config, mode:e.target.value})}>
                      <option value="test">Mode test</option>
                      <option value="live">Mode production</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Services</label>
                    <label style={{display:'flex', alignItems:'center', gap:6}}>
                      <input type="checkbox" checked={!!config.services.invoicePaymentEnabled} onChange={(e)=>setConfig({...config, services:{...config.services, invoicePaymentEnabled:e.target.checked}})} />
                      Envoi de facture de paiement (activé)
                    </label>
                  </div>
                </div>

                <div className="card">
                  <h3>Clés API</h3>
                  <div className="secrets">
                    {Object.entries(sec).map(([key, meta]) => (
                      <div key={key} className="secret-block">
                        {!editSecrets[key] && (
                          <SecretField
                            label={meta.label}
                            maskedValue={masked[key]}
                            revealedValue={revealed?.[key]}
                            onReveal={revealSecrets}
                            onCopy={()=>copyText((revealed?.[key] || '').trim() || '—')}
                            onEditChange={(v)=> setEditSecrets(s=> ({...s, [key]: ''})) }
                          />
                        )}
                        {editSecrets[key] !== undefined && (
                          <SecretEditor
                            label={meta.label}
                            value={editSecrets[key]}
                            onChange={(val)=> setEditSecrets(s=> ({...s, [key]: val}))}
                            onCancel={()=> setEditSecrets(s=> { const n={...s}; delete n[key]; return n; })}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex', justifyContent:'flex-end'}}>
                    <button className="btn primary" disabled={saving} onClick={save}>{saving?'Enregistrement…':'Enregistrer'}</button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentsConfig;
