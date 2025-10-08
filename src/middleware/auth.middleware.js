const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Token d\'authentification requis' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'Utilisateur non trouvé' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        res.status(401).json({ message: 'Token invalide' });
    }
};

exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
    }
};

// Vérification générique des rôles
// Usage: checkRole(['admin']) ou checkRole('admin')
exports.checkRole = (roles) => {
    const allowed = Array.isArray(roles) ? roles : [roles];
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentification requise' });
            }
            if (!allowed.includes(req.user.role)) {
                return res.status(403).json({ message: `Accès refusé. Rôle requis: ${allowed.join(', ')}` });
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};
