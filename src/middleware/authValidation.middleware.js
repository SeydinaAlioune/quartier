const normalizeEmail = (v) => String(v || '').trim().toLowerCase();

const isEmail = (email) => {
    const v = String(email || '');
    if (!v) return false;
    if (v.length > 254) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
};

const hasMinLen = (s, n) => String(s || '').length >= n;

exports.validateRegister = (req, res, next) => {
    try {
        const name = String(req.body?.name || '').trim();
        const email = normalizeEmail(req.body?.email);
        const password = String(req.body?.password || '');

        if (!name || name.length < 2) {
            return res.status(400).json({ message: 'Nom invalide' });
        }
        if (!isEmail(email)) {
            return res.status(400).json({ message: 'Email invalide' });
        }
        if (!hasMinLen(password, 8)) {
            return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
        }

        req.body.name = name;
        req.body.email = email;
        return next();
    } catch (err) {
        return next(err);
    }
};

exports.validateLogin = (req, res, next) => {
    try {
        const email = normalizeEmail(req.body?.email);
        const password = String(req.body?.password || '');

        if (!isEmail(email)) {
            return res.status(400).json({ message: 'Email invalide' });
        }
        if (!password) {
            return res.status(400).json({ message: 'Mot de passe requis' });
        }

        req.body.email = email;
        return next();
    } catch (err) {
        return next(err);
    }
};

exports.validateForgotPassword = (req, res, next) => {
    try {
        const email = normalizeEmail(req.body?.email);
        if (!isEmail(email)) {
            return res.status(400).json({ message: 'Email invalide' });
        }
        req.body.email = email;
        return next();
    } catch (err) {
        return next(err);
    }
};

exports.validateResetPassword = (req, res, next) => {
    try {
        const token = String(req.body?.token || '').trim();
        const password = String(req.body?.password || '');

        if (!token) {
            return res.status(400).json({ message: 'Token requis' });
        }
        if (!hasMinLen(password, 8)) {
            return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
        }

        req.body.token = token;
        return next();
    } catch (err) {
        return next(err);
    }
};
