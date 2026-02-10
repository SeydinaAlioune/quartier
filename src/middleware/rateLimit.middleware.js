const store = new Map();

const nowMs = () => Date.now();

let lastSweepAt = 0;
const SWEEP_INTERVAL_MS = 60_000;

const sweepExpired = () => {
    const now = nowMs();
    if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
    lastSweepAt = now;
    for (const [key, entry] of store.entries()) {
        if (!entry || typeof entry.resetAt !== 'number' || entry.resetAt <= now) {
            store.delete(key);
        }
    }
};

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
            sweepExpired();
            const ip = getClientIp(req);
            const routeKey = `${req.method}:${req.originalUrl}`;
            const key = `${ip}|${routeKey}`;

            const existing = store.get(key);
            cleanupIfNeeded(key, existing);

            const now = nowMs();
            const entry = store.get(key) || { count: 0, resetAt: now + windowMs };
            entry.count += 1;
            store.set(key, entry);

            const remaining = Math.max(0, max - entry.count);
            const resetMs = Math.max(0, entry.resetAt - now);
            const resetSec = Math.ceil(resetMs / 1000);
            res.setHeader('X-RateLimit-Limit', String(max));
            res.setHeader('X-RateLimit-Remaining', String(remaining));
            res.setHeader('X-RateLimit-Reset', String(resetSec));

            if (entry.count > max) {
                res.setHeader('Retry-After', String(resetSec));
                return res.status(429).json({ message });
            }

            return next();
        } catch (err) {
            return next(err);
        }
    };
};
