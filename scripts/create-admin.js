require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
    try {
        // Connexion à la base de données
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Vérifier si un admin existe déjà
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Un administrateur existe déjà dans la base de données.');
            process.exit(0);
        }

        // Créer le compte admin
        const adminData = {
            name: 'Admin QuartierConnect',
            email: 'admin@quartierconnect.com',
            password: await bcrypt.hash('Admin@2024', 10), // À changer en production
            role: 'admin',
            status: 'active',
            profile: {
                bio: 'Administrateur principal de QuartierConnect',
                notifications: {
                    events: true,
                    posts: true,
                    projects: true
                }
            }
        };

        const admin = new User(adminData);
        await admin.save();

        console.log('Compte administrateur créé avec succès!');
        console.log('Email:', adminData.email);
        console.log('Mot de passe: Admin@2024'); // À changer en production
        
    } catch (error) {
        console.error('Erreur lors de la création du compte admin:', error);
    } finally {
        await mongoose.disconnect();
    }
};

createAdmin();
