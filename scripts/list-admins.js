require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user.model');

(async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Erreur: MONGODB_URI non défini. Définissez la variable d\'environnement.');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const admins = await User.find({ role: 'admin' })
      .select('email status name createdAt updatedAt')
      .lean();

    if (!admins.length) {
      console.log('Aucun utilisateur avec le rôle admin trouvé.');
    } else {
      console.log('Utilisateurs admin:');
      admins.forEach((a, i) => console.log(`${i + 1}. ${a.email} | status=${a.status} | name=${a.name}`));
    }
  } catch (err) {
    console.error('Erreur list-admins:', err);
  } finally {
    await mongoose.disconnect().catch(() => {});
    process.exit(0);
  }
})();
