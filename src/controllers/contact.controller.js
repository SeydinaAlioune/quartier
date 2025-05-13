const { Contact, EmergencyContact } = require('../models/contact.model');
const { createSystemNotification } = require('./notification.controller');

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

// Obtenir tous les messages de contact
exports.getContacts = async (req, res) => {
    try {
        const {
            status,
            category,
            sort = '-createdAt',
            page = 1,
            limit = 20
        } = req.query;

        const query = {};
        if (status) query.status = status;
        if (category) query.category = category;

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
