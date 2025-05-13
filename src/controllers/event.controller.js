const Event = require('../models/event.model');

// Créer un nouvel événement
exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, location } = req.body;
        
        const event = new Event({
            title,
            description,
            date,
            location,
            organizer: req.user._id
        });

        const savedEvent = await event.save();
        const populatedEvent = await Event.findById(savedEvent._id)
            .populate('organizer', 'name email')
            .populate('participants', 'name email');

        res.status(201).json(populatedEvent);
    } catch (error) {
        console.error('Erreur lors de la création de l\'événement:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Obtenir tous les événements
exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find()
            .populate('organizer', 'name email')
            .populate('participants', 'name email')
            .sort({ date: 1 });
        res.json(events);
    } catch (error) {
        console.error('Erreur lors de la récupération des événements:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Obtenir un événement par son ID
exports.getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name email')
            .populate('participants', 'name email');
        
        if (!event) {
            return res.status(404).json({ message: 'Événement non trouvé' });
        }

        res.json(event);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'événement:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Mettre à jour un événement
exports.updateEvent = async (req, res) => {
    try {
        const { title, description, date, location } = req.body;
        
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Événement non trouvé' });
        }

        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        event.title = title;
        event.description = description;
        event.date = date;
        event.location = location;

        const updatedEvent = await event.save();
        const populatedEvent = await Event.findById(updatedEvent._id)
            .populate('organizer', 'name email')
            .populate('participants', 'name email');

        res.json(populatedEvent);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'événement:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Participer à un événement
exports.joinEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Événement non trouvé' });
        }

        if (event.participants.includes(req.user._id)) {
            return res.status(400).json({ message: 'Vous participez déjà à cet événement' });
        }

        event.participants.push(req.user._id);
        const updatedEvent = await event.save();
        const populatedEvent = await Event.findById(updatedEvent._id)
            .populate('organizer', 'name email')
            .populate('participants', 'name email');

        res.json(populatedEvent);
    } catch (error) {
        console.error('Erreur lors de l\'inscription à l\'événement:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Supprimer un événement
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findOneAndDelete({
            _id: req.params.id,
            organizer: req.user._id
        });
        if (!event) {
            return res.status(404).json({ message: 'Événement non trouvé ou non autorisé' });
        }
        res.json({ message: 'Événement supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'événement' });
    }
};

// Annuler sa participation
exports.cancelParticipation = async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            { $pull: { participants: req.user._id } },
            { new: true }
        );
        if (!event) {
            return res.status(404).json({ message: 'Événement non trouvé' });
        }
        const populatedEvent = await Event.findById(event._id)
            .populate('organizer', 'name email')
            .populate('participants', 'name email');
        res.json(populatedEvent);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'annulation de la participation' });
    }
};
