const store = new Map();

const nowMs = () => Date.now();

const getClientIp = (req) => {
    const xf = req.headers['x-forwarded-for'];
    if (typeof xf === 'string' && xf.trim()) {
        return xf.split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || 'unknown';
};

const cleanupIfNeeded = (key, entry) => {
    if (!entry) return;
    if (entry.resetAt <= nowMs()) {
        store.delete(key);
    }
};

exports.rateLimit = ({ windowMs = 60_000, max = 10, message = 'Trop de tentatives. Réessayez plus tard.' } = {}) => {
    return (req, res, next) => {
        try {
            const ip = getClientIp(req);
            const routeKey = `${req.method}:${req.originalUrl}`;
            const key = `${ip}|${routeKey}`;

            const existing = store.get(key);
            cleanupIfNeeded(key, existing);

            const entry = store.get(key) || { count: 0, resetAt: nowMs() + windowMs };
            entry.count += 1;
            store.set(key, entry);

            if (entry.count > max) {
                return res.status(429).json({ message });
            }

            return next();
        } catch (err) {
            return next(err);
        }
    };
};
