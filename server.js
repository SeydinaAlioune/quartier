require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const { ensureAdminUser } = require('./src/utils/seedAdmin');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connexion à la base de données
        await connectDB(process.env.MONGODB_URI || 'mongodb://localhost:27017/quartier-connect');

        // Créer/promouvoir un compte admin si nécessaire (via variables d'env)
        await ensureAdminUser();

        // Démarrage du serveur
        app.listen(PORT, () => {
            console.log(`🚀 Serveur démarré sur le port ${PORT}`);
        });
    } catch (error) {
        console.error('Erreur au démarrage du serveur:', error);
        process.exit(1);
    }
};

startServer();
