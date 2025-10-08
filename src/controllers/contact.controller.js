const { Contact, EmergencyContact } = require('../models/contact.model');
const { createSystemNotification } = require('./notification.controller');
const User = require('../models/user.model');

// Envoyer un message de contact
exports.submitContact = async (req, res) => {
    try {
        const contact = new Contact({
            ...req.body,
            status: 'new'
        });
        await contact.save();

        // Notifier les administrateurs
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            await createSystemNotification(
                admin._id,
                'Nouveau message de contact',
                `De: ${contact.name}\nSujet: ${contact.subject}`,
                { contactId: contact._id }
            );
        }

        res.status(201).json({
            message: 'Message envoyé avec succès',
            contact
        });
    } catch (error) {
        console.error('Erreur envoi message:', error);
        res.status(500).json({ message: 'Erreur lors de l\'envoi du message' });
    }
};

// Assigner / libérer un message
exports.assignContact = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) return res.status(404).json({ message: 'Message non trouvé' });
        const { action, assignedTo } = req.body || {};
        if (action === 'unassign') {
            contact.assignedTo = undefined;
        } else {
            if (assignedTo === 'self' || !assignedTo) {
                contact.assignedTo = req.user._id;
            } else {
                contact.assignedTo = assignedTo;
            }
        }
        await contact.save();
        res.json({ message: 'Assignation mise à jour', contact });
    } catch (error) {
        console.error('Erreur assignation contact:', error);
        res.status(500).json({ message: 'Erreur lors de l\'assignation' });
    }
};

// Obtenir tous les messages de contact
exports.getContacts = async (req, res) => {
    try {
        const {
            status,
            category,
            source,
            mine,
            unassigned,
            assignedTo,
            sort = '-createdAt',
            page = 1,
            limit = 20
        } = req.query;

        const query = {};
        if (status) query.status = status;
        if (category) query.category = category;
        if (source) query.source = source;
        if (mine === 'true') {
            query.assignedTo = req.user?._id;
        } else if (unassigned === 'true') {
            query.$or = [{ assignedTo: { $exists: false } }, { assignedTo: null }];
        } else if (assignedTo) {
            query.assignedTo = assignedTo;
        }

        const contacts = await Contact.find(query)
            .populate('assignedTo', 'name')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Contact.countDocuments(query);

        res.json({
            contacts,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error('Erreur récupération messages:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des messages' });
    }
};

// Statistiques agrégées pour les messages de contact
exports.getContactStats = async (req, res) => {
    try {
        const byStatusAgg = await Contact.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const bySourceAgg = await Contact.aggregate([
            { $group: { _id: '$source', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        const mapStatus = byStatusAgg.reduce((acc, cur) => { acc[cur._id || 'unknown'] = cur.count; return acc; }, {});
        const total = Object.values(mapStatus).reduce((a,b)=>a+b,0);
        const unassignedCount = await Contact.countDocuments({ $or: [{ assignedTo: { $exists: false } }, { assignedTo: null }] });
        const mineFilter = req.user?._id ? { assignedTo: req.user._id } : {};
        const mineTotal = req.user?._id ? await Contact.countDocuments(mineFilter) : 0;
        const mineNew = req.user?._id ? await Contact.countDocuments({ ...mineFilter, status: 'new' }) : 0;
        res.json({
            total,
            byStatus: {
                new: mapStatus.new || 0,
                in_progress: mapStatus.in_progress || 0,
                resolved: mapStatus.resolved || 0,
                closed: mapStatus.closed || 0
            },
            bySource: bySourceAgg,
            assigned: {
                unassigned: unassignedCount,
                mineTotal,
                mineNew
            }
        });
    } catch (error) {
        console.error('Erreur stats contacts:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
    }
};

// Sources distinctes
exports.getContactSources = async (req, res) => {
    try {
        const agg = await Contact.aggregate([
            { $group: { _id: '$source', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        res.json(agg);
    } catch (error) {
        console.error('Erreur sources contacts:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des sources' });
    }
};

// Marquer tous les nouveaux comme "en cours" (mark as read)
exports.markAllRead = async (req, res) => {
    try {
        const r = await Contact.updateMany({ status: 'new' }, { $set: { status: 'in_progress' } });
        res.json({ updated: r.modifiedCount || r.nModified || 0 });
    } catch (error) {
        console.error('Erreur markAllRead:', error);
        res.status(500).json({ message: 'Erreur lors du marquage en lu' });
    }
};

// Obtenir un message spécifique
exports.getContact = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id)
            .populate('assignedTo', 'name')
            .populate('responses.sender', 'name');

        if (!contact) {
            return res.status(404).json({ message: 'Message non trouvé' });
        }

        res.json(contact);
    } catch (error) {
        console.error('Erreur récupération message:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du message' });
    }
};

// Mettre à jour le statut d'un message
exports.updateContactStatus = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({ message: 'Message non trouvé' });
        }

        contact.status = req.body.status;
        if (req.body.assignedTo) {
            contact.assignedTo = req.body.assignedTo;
        }

        await contact.save();
        res.json({
            message: 'Statut mis à jour avec succès',
            contact
        });
    } catch (error) {
        console.error('Erreur mise à jour statut:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du statut' });
    }
};

// Répondre à un message
exports.respondToContact = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({ message: 'Message non trouvé' });
        }

        contact.responses.push({
            message: req.body.message,
            sender: req.user._id
        });

        contact.status = 'in_progress';
        await contact.save();

        // Envoyer un email de réponse ici
        // Pour l'instant, on simule juste l'envoi

        res.json({
            message: 'Réponse envoyée avec succès',
            contact
        });
    } catch (error) {
        console.error('Erreur envoi réponse:', error);
        res.status(500).json({ message: 'Erreur lors de l\'envoi de la réponse' });
    }
};

// Gérer les contacts d'urgence
// Créer un contact d'urgence
exports.createEmergencyContact = async (req, res) => {
    try {
        const emergencyContact = new EmergencyContact(req.body);
        await emergencyContact.save();
        res.status(201).json({
            message: 'Contact d\'urgence créé avec succès',
            emergencyContact
        });
    } catch (error) {
        console.error('Erreur création contact urgence:', error);
        res.status(500).json({ message: 'Erreur lors de la création du contact d\'urgence' });
    }
};

// Obtenir tous les contacts d'urgence
exports.getEmergencyContacts = async (req, res) => {
    try {
        const { category, active = true } = req.query;

        const query = { active };
        if (category) query.category = category;

        const contacts = await EmergencyContact.find(query)
            .sort('order');

        res.json(contacts);
    } catch (error) {
        console.error('Erreur récupération contacts urgence:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des contacts d\'urgence' });
    }
};

// Mettre à jour un contact d'urgence
exports.updateEmergencyContact = async (req, res) => {
    try {
        const emergencyContact = await EmergencyContact.findById(req.params.id);

        if (!emergencyContact) {
            return res.status(404).json({ message: 'Contact d\'urgence non trouvé' });
        }

        Object.assign(emergencyContact, req.body);
        await emergencyContact.save();

        res.json({
            message: 'Contact d\'urgence mis à jour avec succès',
            emergencyContact
        });
    } catch (error) {
        console.error('Erreur mise à jour contact urgence:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du contact d\'urgence' });
    }
};
