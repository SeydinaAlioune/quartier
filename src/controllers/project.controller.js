const Project = require('../models/project.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

// Créer un nouveau projet
exports.createProject = async (req, res) => {
    try {
        const payload = req.body || {};
        const status = payload.status || 'proposed';
        const shouldApprove = status !== 'proposed' && status !== 'cancelled';

        const project = new Project({
            ...payload,
            organizer: req.user._id,
            approved: shouldApprove,
            reviewedAt: new Date(),
            reviewedBy: req.user._id,
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

// Supprimer un projet
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Projet non trouvé' });

    const isOrganizer = project.organizer.toString() === req.user._id.toString();
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'moderator';
    if (!isOrganizer && !isPrivileged) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await project.deleteOne();
    res.json({ message: 'Projet supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression projet:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du projet' });
  }
};

// Récupérer tous les projets
exports.getProjects = async (req, res) => {
    try {
        const { status, category, sort = 'createdAt' } = req.query;
        const query = {};

        // Public visibility: only approved projects and only published statuses
        query.status = { $in: ['planning', 'in_progress', 'completed'] };
        query.$or = [
          { approved: true },
          { approved: { $exists: false } },
        ];

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

// Récupérer tous les projets (admin/moderator)
exports.getProjectsAdmin = async (req, res) => {
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
    console.error('Erreur récupération projets admin:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des projets' });
  }
};

// Soumettre une idée de projet (utilisateur authentifié)
exports.submitProject = async (req, res) => {
  try {
    const title = (req.body?.title || '').trim();
    const description = (req.body?.description || '').trim();
    const category = req.body?.category;
    const location = req.body?.location;
    const attachments = Array.isArray(req.body?.attachments) ? req.body.attachments : undefined;

    if (!title) return res.status(400).json({ message: 'Le titre est requis' });
    if (!description) return res.status(400).json({ message: 'La description est requise' });
    if (!category) return res.status(400).json({ message: 'La catégorie est requise' });

    const project = new Project({
      title,
      description,
      category,
      location,
      attachments,
      status: 'proposed',
      approved: false,
      organizer: req.user._id,
    });

    await project.save();

    try {
      const admins = await User.find({ role: 'admin' }).select('_id');
      const notifTitle = 'Nouvelle proposition de projet';
      const msg = `${project.title || 'Projet'}${project.category ? `\nCatégorie: ${project.category}` : ''}`;
      await Notification.insertMany(
        admins.map((a) => ({
          recipient: a._id,
          type: 'system_notification',
          title: notifTitle,
          message: msg,
          priority: 'normal',
          link: '/admin/projects',
          metadata: { sourceType: 'project_submission', sourceId: project._id }
        })),
        { ordered: false }
      );
    } catch {}

    res.status(201).json({ message: 'Proposition envoyée', project });
  } catch (error) {
    console.error('Erreur soumission projet:', error);
    res.status(500).json({ message: 'Erreur lors de la soumission du projet' });
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

        // Public detail: only published & approved projects
        const isApproved = project.approved === true || project.approved === undefined;
        if (!isApproved || !['planning', 'in_progress', 'completed'].includes(project.status)) {
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

    // Vérifier que l'utilisateur est l'organisateur ou un admin/modérateur
    const isOrganizer = project.organizer.toString() === req.user._id.toString();
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'moderator';
    if (!isOrganizer && !isPrivileged) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const updatableFields = [
      'title', 'description', 'status', 'category',
      'location', 'budget', 'timeline', 'attachments', 'progress'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });

    // Moderation metadata: any privileged update sets review info
    if (isPrivileged) {
      project.reviewedAt = new Date();
      project.reviewedBy = req.user._id;
      if (project.status !== 'proposed' && project.status !== 'cancelled') {
        project.approved = true;
      }
    }

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
