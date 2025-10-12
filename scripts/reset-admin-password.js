require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/user.model');

(async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const email = process.env.ADMIN_EMAIL;
    const newPassword = process.env.NEW_PASSWORD;

    if (!uri) throw new Error('MONGODB_URI manquant');
    if (!email) throw new Error('ADMIN_EMAIL manquant');
    if (!newPassword) throw new Error('NEW_PASSWORD manquant');

    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      console.error('Aucun admin avec cet email.');
      process.exit(2);
    }

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    console.log(`Mot de passe réinitialisé pour ${email}`);
  } catch (err) {
    console.error('Erreur reset-admin-password:', err.message || err);
    process.exit(1);
  } finally {
    try { await mongoose.disconnect(); } catch {}
    process.exit(0);
  }
})();
