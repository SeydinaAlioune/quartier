const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');

const escapeRegExp = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getResendClient = () => {
    const key = process.env.RESEND_API_KEY;
    if (!key) return null;
    return new Resend(key);
};

const buildFrontendUrl = () => {
    const base = (process.env.FRONTEND_URL || '').trim().replace(/\/$/, '');
    return base;
};

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

// Suppression du compte (soft-delete + anonymisation)
exports.deleteMe = async (req, res) => {
    try {
        const password = String(req.body?.password || '');
        if (!password) {
            return res.status(400).json({ message: 'Mot de passe requis' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            return res.status(401).json({ message: 'Mot de passe incorrect' });
        }

        const now = new Date();
        user.status = 'inactive';
        user.deletedAt = now;
        user.name = 'Utilisateur supprimé';
        user.email = `deleted+${String(user._id)}@example.invalid`;
        user.passwordResetTokenHash = null;
        user.passwordResetExpiresAt = null;

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), salt);

        await user.save();

        return res.json({ message: 'Compte supprimé' });
    } catch (error) {
        console.error('Erreur suppression compte:', error);
        return res.status(500).json({ message: 'Erreur lors de la suppression du compte' });
    }
};

// Mot de passe oublié (envoie un lien de reset)
exports.forgotPassword = async (req, res) => {
    try {
        const email = String(req.body?.email || '').trim().toLowerCase();
        if (!email) {
            return res.status(400).json({ message: "Email requis" });
        }

        console.log('[forgotPassword] request', { email });

        let user = await User.findOne({ email }).collation({ locale: 'en', strength: 2 });
        if (!user) {
            const rx = new RegExp(`^${escapeRegExp(email)}$`, 'i');
            user = await User.findOne({ email: rx });
        }
        if (!user) {
            console.log('[forgotPassword] user not found', { email });
            return res.json({ message: "Si un compte existe, vous recevrez un lien de réinitialisation." });
        }

        console.log('[forgotPassword] user found', { email, userId: String(user._id) });

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        user.passwordResetTokenHash = tokenHash;
        user.passwordResetExpiresAt = expiresAt;
        await user.save();

        const frontendUrl = buildFrontendUrl();
        if (!frontendUrl) {
            return res.status(500).json({ message: "FRONTEND_URL n'est pas configurée" });
        }

        const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
        const resend = getResendClient();
        if (!resend) {
            return res.status(500).json({ message: "RESEND_API_KEY n'est pas configurée" });
        }

        const fromEmail = (process.env.FROM_EMAIL || 'onboarding@resend.dev').trim();

        const sendRes = await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: 'Réinitialisation du mot de passe — QuartierConnect',
            text: `Bonjour,\n\nPour réinitialiser votre mot de passe, cliquez sur ce lien (valide 30 minutes) :\n${resetUrl}\n\nSi vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.\n`,
            html: `
                <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height:1.5; color:#0f172a;">
                  <h2 style="margin:0 0 12px;">Réinitialisation du mot de passe</h2>
                  <p style="margin:0 0 16px;">Vous avez demandé à réinitialiser votre mot de passe QuartierConnect.</p>
                  <p style="margin:0 0 16px;">
                    <a href="${resetUrl}" style="display:inline-block; padding:12px 16px; border-radius:12px; background:#00a651; color:#fff; text-decoration:none; font-weight:800;">
                      Réinitialiser mon mot de passe
                    </a>
                  </p>
                  <p style="margin:0 0 8px; color:rgba(15,23,42,.75);">Ce lien expire dans 30 minutes.</p>
                  <p style="margin:0; color:rgba(15,23,42,.75);">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
                </div>
            `
        });

        console.log('[forgotPassword] resend send ok', { email, sendRes });

        return res.json({ message: "Si un compte existe, vous recevrez un lien de réinitialisation." });
    } catch (error) {
        console.error('Erreur forgot password:', error);
        return res.status(500).json({ message: 'Erreur lors de la demande de réinitialisation' });
    }
};

// Réinitialiser le mot de passe via token
exports.resetPassword = async (req, res) => {
    try {
        const token = String(req.body?.token || '').trim();
        const password = String(req.body?.password || '');

        if (!token || !password) {
            return res.status(400).json({ message: 'Token et mot de passe requis' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            passwordResetTokenHash: tokenHash,
            passwordResetExpiresAt: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Lien invalide ou expiré' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        user.passwordResetTokenHash = null;
        user.passwordResetExpiresAt = null;
        await user.save();

        return res.json({ message: 'Mot de passe mis à jour' });
    } catch (error) {
        console.error('Erreur reset password:', error);
        return res.status(500).json({ message: 'Erreur lors de la réinitialisation du mot de passe' });
    }
};

// Connexion
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        if (user.status !== 'active') {
            return res.status(403).json({ message: 'Compte non activé ou supprimé' });
        }

        // Vérifier le mot de passe
        const isValidPassword = await bcrypt.compare(password, user.password);

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
