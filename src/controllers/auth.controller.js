const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '24h'
    });
};

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        // Créer un nouvel utilisateur
        const user = new User({
            name,
            email,
            password
        });

        await user.save();

        // Générer le token
        const token = generateToken(user._id);

        res.status(201).json({
            message: 'Inscription réussie',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({ message: 'Erreur lors de l\'inscription' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Trouver l'utilisateur
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Vérifier le mot de passe
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Vérifier le statut
        if (user.status !== 'active') {
            return res.status(403).json({ message: 'Compte non activé ou bloqué' });
        }

        // Générer le token
        const token = generateToken(user._id);

        res.json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erreur connexion:', error);
        res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error('Erreur profil:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
    }
};
