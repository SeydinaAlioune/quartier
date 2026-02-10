const mongoose = require('mongoose');

const normalizeText = (v) => String(v || '').replace(/\s+/g, ' ').trim();
const normalizeMultiline = (v) => String(v || '').replace(/\r\n/g, '\n').trim();

const normalizeEmail = (v) => String(v || '').trim().toLowerCase();

const isEmail = (email) => {
    const v = String(email || '');
    if (!v) return false;
    if (v.length > 254) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
};

const isObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

const safeJsonParse = (raw) => {
    if (raw === undefined || raw === null || raw === '') return undefined;
    if (typeof raw === 'object') return raw;
    const s = String(raw);
    return JSON.parse(s);
};

exports.validateContactSubmit = (req, res, next) => {
    try {
        const name = normalizeText(req.body?.name);
        const email = normalizeEmail(req.body?.email);
        const phone = normalizeText(req.body?.phone);
        const subject = normalizeText(req.body?.subject);
        const message = normalizeMultiline(req.body?.message);
        const category = normalizeText(req.body?.category || 'general');
        const source = normalizeText(req.body?.source || 'other');

        const allowedCategories = ['general', 'support', 'suggestion', 'complaint', 'other'];
        const allowedSources = ['espace_membres', 'contact_page', 'other'];

        if (!name || name.length < 2 || name.length > 80) {
            return res.status(400).json({ message: 'Nom invalide' });
        }
        if (!isEmail(email)) {
            return res.status(400).json({ message: 'Email invalide' });
        }
        if (phone && phone.length > 32) {
            return res.status(400).json({ message: 'Téléphone invalide' });
        }
        if (!subject || subject.length < 2 || subject.length > 120) {
            return res.status(400).json({ message: 'Sujet invalide' });
        }
        if (!message || message.length < 10 || message.length > 2000) {
            return res.status(400).json({ message: 'Message invalide' });
        }
        if (category && !allowedCategories.includes(category)) {
            return res.status(400).json({ message: 'Catégorie invalide' });
        }
        if (source && !allowedSources.includes(source)) {
            return res.status(400).json({ message: 'Source invalide' });
        }

        req.body.name = name;
        req.body.email = email;
        if (phone) req.body.phone = phone;
        req.body.subject = subject;
        req.body.message = message;
        req.body.category = category;
        req.body.source = source;
        return next();
    } catch (err) {
        return next(err);
    }
};

exports.validateForumTopicCreate = (req, res, next) => {
    try {
        const title = normalizeText(req.body?.title);
        const category = String(req.body?.category || '').trim();

        if (!title || title.length < 3 || title.length > 120) {
            return res.status(400).json({ message: 'Titre invalide' });
        }
        if (!category || !isObjectId(category)) {
            return res.status(400).json({ message: 'Catégorie invalide' });
        }

        req.body.title = title;
        req.body.category = category;
        return next();
    } catch (err) {
        return next(err);
    }
};

exports.validateForumPostCreate = (req, res, next) => {
    try {
        const topic = String(req.body?.topic || '').trim();
        const content = normalizeMultiline(req.body?.content);

        if (!topic || !isObjectId(topic)) {
            return res.status(400).json({ message: 'Sujet invalide' });
        }
        if (!content || content.length < 2 || content.length > 4000) {
            return res.status(400).json({ message: 'Contenu invalide' });
        }

        req.body.topic = topic;
        req.body.content = content;
        return next();
    } catch (err) {
        return next(err);
    }
};

exports.validateForumAdCreate = (req, res, next) => {
    try {
        const type = normalizeText(req.body?.type);
        const title = normalizeText(req.body?.title);
        const description = normalizeMultiline(req.body?.description);
        const price = normalizeText(req.body?.price);
        const imageUrl = String(req.body?.imageUrl || '').trim();
        const images = Array.isArray(req.body?.images) ? req.body.images : [];

        const allowedTypes = ['vends', 'recherche', 'services'];

        if (!type || !allowedTypes.includes(type)) {
            return res.status(400).json({ message: 'Type invalide' });
        }
        if (!title || title.length < 3 || title.length > 120) {
            return res.status(400).json({ message: 'Titre invalide' });
        }
        if (!description || description.length < 10 || description.length > 4000) {
            return res.status(400).json({ message: 'Description invalide' });
        }
        if (price && price.length > 40) {
            return res.status(400).json({ message: 'Prix invalide' });
        }
        if (imageUrl && imageUrl.length > 512) {
            return res.status(400).json({ message: 'Image invalide' });
        }
        const imgs = images
            .filter(Boolean)
            .map((u) => String(u).trim())
            .filter((u) => u && u.length <= 512);

        req.body.type = type;
        req.body.title = title;
        req.body.description = description;
        if (price) req.body.price = price;
        req.body.imageUrl = imageUrl;
        req.body.images = imgs;
        return next();
    } catch (err) {
        return next(err);
    }
};

exports.validateForumIdeaCreate = (req, res, next) => {
    try {
        const title = normalizeText(req.body?.title);
        const description = normalizeMultiline(req.body?.description);

        if (!title || title.length < 3 || title.length > 120) {
            return res.status(400).json({ message: 'Titre invalide' });
        }
        if (!description || description.length < 10 || description.length > 4000) {
            return res.status(400).json({ message: 'Description invalide' });
        }

        req.body.title = title;
        req.body.description = description;
        return next();
    } catch (err) {
        return next(err);
    }
};

exports.validateForumReportCreate = (req, res, next) => {
    try {
        const targetType = normalizeText(req.body?.targetType);
        const targetId = String(req.body?.targetId || '').trim();
        const reason = normalizeText(req.body?.reason || 'autre');
        const details = normalizeMultiline(req.body?.details || '');

        const allowedTypes = ['ad', 'idea', 'topic', 'post'];
        const allowedReasons = ['spam', 'offensif', 'inexact', 'autre'];

        if (!targetType || !allowedTypes.includes(targetType)) {
            return res.status(400).json({ message: 'Type de cible invalide' });
        }
        if (!targetId || !isObjectId(targetId)) {
            return res.status(400).json({ message: 'Cible invalide' });
        }
        if (!allowedReasons.includes(reason)) {
            return res.status(400).json({ message: 'Raison invalide' });
        }
        if (details && details.length > 2000) {
            return res.status(400).json({ message: 'Détails invalides' });
        }

        req.body.targetType = targetType;
        req.body.targetId = targetId;
        req.body.reason = reason;
        req.body.details = details;
        return next();
    } catch (err) {
        return next(err);
    }
};

exports.validateMediaUploadMeta = (req, res, next) => {
    try {
        const title = normalizeText(req.body?.title);
        const description = normalizeMultiline(req.body?.description);
        const category = normalizeText(req.body?.category || 'project');

        if (title && title.length > 120) {
            return res.status(400).json({ message: 'Titre invalide' });
        }
        if (description && description.length > 2000) {
            return res.status(400).json({ message: 'Description invalide' });
        }
        if (category && category.length > 32) {
            return res.status(400).json({ message: 'Catégorie invalide' });
        }

        // Validate JSON fields if present so controller's JSON.parse won't throw.
        if (req.body?.tags !== undefined) {
            const parsed = safeJsonParse(req.body.tags);
            if (parsed !== undefined && !Array.isArray(parsed)) {
                return res.status(400).json({ message: 'Tags invalides' });
            }
            req.body.tags = JSON.stringify(parsed || []);
        }
        if (req.body?.metadata !== undefined) {
            const parsed = safeJsonParse(req.body.metadata);
            if (parsed !== undefined && (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed))) {
                return res.status(400).json({ message: 'Metadata invalide' });
            }
            req.body.metadata = JSON.stringify(parsed || {});
        }

        if (title) req.body.title = title;
        if (description) req.body.description = description;
        req.body.category = category;
        return next();
    } catch (err) {
        return res.status(400).json({ message: 'Payload invalide' });
    }
};
