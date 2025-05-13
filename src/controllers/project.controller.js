const Project = require('../models/project.model');

// Créer un nouveau projet
exports.createProject = async (req, res) => {
    try {
        const project = new Project({
            ...req.body,
            organizer: req.user._id
        });

        await project.save();
        res.status(201).json({
            message: 'Projet créé avec succès',
            project
        });
    } catch (error) {
        console.error('Erreur création projet:', error);
        res.status(500).json({ message: 'Erreur lors de la création du projet' });
    }
};

// Récupérer tous les projets
exports.getProjects = async (req, res) => {
    try {
        const { status, category, sort = 'createdAt' } = req.query;
        const query = {};

        if (status) query.status = status;
        if (category) query.category = category;

        const projects = await Project.find(query)
            .populate('organizer', 'name')
            .sort({ [sort]: -1 });

        res.json(projects);
    } catch (error) {
        console.error('Erreur récupération projets:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des projets' });
    }
};

// Récupérer un projet spécifique
exports.getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('organizer', 'name')
            .populate('participants.user', 'name')
            .populate('updates.author', 'name')
            .populate('votes.user', 'name');

        if (!project) {
            return res.status(404).json({ message: 'Projet non trouvé' });
        }

        res.json(project);
    } catch (error) {
        console.error('Erreur récupération projet:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du projet' });
    }
};

// Mettre à jour un projet
exports.updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Projet non trouvé' });
        }

        // Vérifier que l'utilisateur est l'organisateur ou un admin
        if (project.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const updatableFields = [
            'title', 'description', 'status', 'category',
            'location', 'budget', 'timeline'
        ];

        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                project[field] = req.body[field];
            }
        });

        await project.save();
        res.json({
            message: 'Projet mis à jour avec succès',
            project
        });
    } catch (error) {
        console.error('Erreur mise à jour projet:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du projet' });
    }
};

// Participer à un projet
exports.participateProject = async (req, res) => {
    try {
        const { role = 'supporter' } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Projet non trouvé' });
        }

        // Vérifier si l'utilisateur participe déjà
        const existingParticipant = project.participants.find(
            p => p.user.toString() === req.user._id.toString()
        );

        if (existingParticipant) {
            return res.status(400).json({ message: 'Vous participez déjà à ce projet' });
        }

        project.participants.push({
            user: req.user._id,
            role,
            joinedAt: new Date()
        });

        await project.save();
        res.json({
            message: 'Participation enregistrée avec succès',
            project
        });
    } catch (error) {
        console.error('Erreur participation projet:', error);
        res.status(500).json({ message: 'Erreur lors de l\'enregistrement de la participation' });
    }
};

// Voter pour un projet
exports.voteProject = async (req, res) => {
    try {
        const { type } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Projet non trouvé' });
        }

        // Vérifier si l'utilisateur a déjà voté
        const existingVote = project.votes.find(
            v => v.user.toString() === req.user._id.toString()
        );

        if (existingVote) {
            existingVote.type = type;
        } else {
            project.votes.push({
                user: req.user._id,
                type,
                date: new Date()
            });
        }

        await project.save();
        res.json({
            message: 'Vote enregistré avec succès',
            project
        });
    } catch (error) {
        console.error('Erreur vote projet:', error);
        res.status(500).json({ message: 'Erreur lors de l\'enregistrement du vote' });
    }
};

// Ajouter une mise à jour au projet
exports.addProjectUpdate = async (req, res) => {
    try {
        const { content } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Projet non trouvé' });
        }

        // Vérifier que l'utilisateur est l'organisateur ou un participant actif
        const isOrganizer = project.organizer.toString() === req.user._id.toString();
        const isParticipant = project.participants.some(
            p => p.user.toString() === req.user._id.toString()
        );

        if (!isOrganizer && !isParticipant && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        project.updates.push({
            content,
            author: req.user._id,
            date: new Date()
        });

        await project.save();
        res.json({
            message: 'Mise à jour ajoutée avec succès',
            project
        });
    } catch (error) {
        console.error('Erreur ajout mise à jour:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout de la mise à jour' });
    }
};
