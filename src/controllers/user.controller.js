const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Inscription
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        // Hasher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Créer un nouvel utilisateur
        const user = new User({
            name,
            email,
            password: hashedPassword,
            // Permettre la définition du rôle uniquement en mode test
            role: process.env.NODE_ENV === 'test' ? (role || 'user') : 'user'
        });

        await user.save();

        // Générer le token JWT
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Retourner la réponse sans le mot de passe
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({ message: 'Erreur lors de l\'inscription' });
    }
};

// Connexion
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Tentative de connexion pour:', email);

        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ email });
        console.log('Utilisateur trouvé:', user ? 'oui' : 'non');

        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Vérifier le mot de passe
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('Mot de passe valide:', isValidPassword ? 'oui' : 'non');

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Générer le token JWT
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Retourner la réponse sans le mot de passe
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
};

// Obtenir le profil
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Mettre à jour le profil
exports.updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, email },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Obtenir les notifications
exports.getNotifications = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('notifications')
            .select('notifications');
        res.json(user.notifications);
    } catch (error) {
        console.error('Erreur notifications:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des notifications' });
    }
};

// Mettre à jour les paramètres de notification
exports.updateNotificationSettings = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { 'settings.notifications': req.body } },
            { new: true }
        ).select('settings.notifications');

        res.json(user.settings.notifications);
    } catch (error) {
        console.error('Erreur paramètres notifications:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour des paramètres de notification' });
    }
};
