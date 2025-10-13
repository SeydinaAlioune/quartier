const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

async function ensureAdminUser() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || 'Administrateur';

    if (!email || !password) {
      console.log('[seedAdmin] ADMIN_EMAIL ou ADMIN_PASSWORD manquant(s). Aucun seed effectué.');
      return;
    }

    let user = await User.findOne({ email });
    if (!user) {
      const hash = await bcrypt.hash(password, 10);
      user = await User.create({ name, email, password: hash, role: 'admin', status: 'active' });
      console.log(`[seedAdmin] Compte admin créé: ${email}`);
      return;
    }

    let updated = false;
    if (user.role !== 'admin') { user.role = 'admin'; updated = true; }
    if (user.status !== 'active') { user.status = 'active'; updated = true; }
    // Optionnel: forcer la mise à jour du mot de passe
    const force = (process.env.ADMIN_FORCE_PASSWORD === 'true' || process.env.ADMIN_RESET_PASSWORD === 'true');
    if (force && password) {
      user.password = await bcrypt.hash(password, 10);
      updated = true;
      console.log('[seedAdmin] Mot de passe admin mis à jour (ADMIN_FORCE_PASSWORD=true).');
    }
    if (updated) {
      await user.save();
      console.log(`[seedAdmin] Compte existant promu admin/activé: ${email}`);
    } else {
      console.log(`[seedAdmin] Compte admin déjà présent: ${email}`);
    }
  } catch (err) {
    console.error('[seedAdmin] Erreur:', err);
  }
}

module.exports = { ensureAdminUser };
