const mongoose = require('mongoose');

const connectDB = async (uri) => {
    try {
        // Fermer toute connexion existante
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        // Créer une nouvelle connexion
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connexion MongoDB réussie!');
    } catch (error) {
        console.error('Erreur de connexion MongoDB:', error);
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
        throw error;
    }
};

const disconnectDB = async () => {
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('Déconnexion MongoDB réussie');
        }
    } catch (error) {
        console.error('Erreur lors de la déconnexion MongoDB:', error);
        if (process.env.NODE_ENV !== 'test') {
            throw error;
        }
    }
};

module.exports = {
    connectDB,
    disconnectDB
};
