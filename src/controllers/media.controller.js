const Media = require('../models/media.model');
const { deleteFile } = require('../middleware/upload.middleware');
const path = require('path');
const fs = require('fs');
let cloudinary;
try {
    cloudinary = require('cloudinary').v2;
} catch (e) {
    cloudinary = null;
}
let ffmpeg;
let ffmpegPath;
try {
    ffmpeg = require('fluent-ffmpeg');
    ffmpegPath = require('ffmpeg-static');
    if (ffmpegPath) {
        ffmpeg.setFfmpegPath(ffmpegPath);
    }
} catch (e) {
    ffmpeg = null;
    ffmpegPath = null;
}

const generateVideoThumbnail = async (inputAbsolutePath, outputAbsolutePath) => {
    if (!ffmpeg || !ffmpegPath) return false;
    return new Promise((resolve) => {
        try {
            const outDir = path.dirname(outputAbsolutePath);
            if (!fs.existsSync(outDir)) {
                fs.mkdirSync(outDir, { recursive: true });
            }
            ffmpeg(inputAbsolutePath)
                .on('end', () => resolve(true))
                .on('error', () => resolve(false))
                .screenshots({
                    timestamps: ['10%'],
                    filename: path.basename(outputAbsolutePath),
                    folder: outDir,
                    size: '640x?'
                });
        } catch (err) {
            resolve(false);
        }
    });
};

const mediaUrlToAbsolutePath = (mediaUrl = '') => {
    const relative = String(mediaUrl || '').replace(/^[\/\\]+/, '');
    return path.resolve(path.join('public', relative));
};

const normalizeCloudinaryUrl = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (raw.startsWith('CLOUDINARY_URL=')) return raw.replace(/^CLOUDINARY_URL=/, '').trim();
    return raw;
};

const isCloudinaryEnabled = () => {
    const flag = String(process.env.USE_CLOUDINARY || '').trim();
    if (flag !== '1') return false;
    if (!cloudinary) return false;
    const hasUrl = Boolean(normalizeCloudinaryUrl(process.env.CLOUDINARY_URL));
    const hasKeys = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
    return hasUrl || hasKeys;
};

const hasCloudinaryCredentials = () => {
    if (!cloudinary) return false;
    const hasUrl = Boolean(normalizeCloudinaryUrl(process.env.CLOUDINARY_URL));
    const hasKeys = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
    return hasUrl || hasKeys;
};

const initCloudinary = () => {
    if (!cloudinary) return;
    const normalizedUrl = normalizeCloudinaryUrl(process.env.CLOUDINARY_URL);
    if (normalizedUrl) {
        process.env.CLOUDINARY_URL = normalizedUrl;
        cloudinary.config({ cloudinary_url: normalizedUrl, secure: true });
        return;
    }
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
};

const cloudinaryVideoThumb = (publicId) => {
    if (!cloudinary || !publicId) return '';
    try {
        return cloudinary.url(publicId, {
            resource_type: 'video',
            format: 'jpg',
            secure: true,
            transformation: [{ so: 0 }]
        });
    } catch {
        return '';
    }
};

// Ajouter un média
exports.uploadMedia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier uploadé' });
        }

        console.log('[media] uploadMedia', {
            useCloudinary: String(process.env.USE_CLOUDINARY || ''),
            cloudinaryEnabled: isCloudinaryEnabled(),
            hasCloudinaryUrl: Boolean(normalizeCloudinaryUrl(process.env.CLOUDINARY_URL)),
            hasCloudinaryKeys: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
        });

        const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
        const originalName = req.file.originalname ? path.parse(req.file.originalname).name : 'media';
        const safeTitle = (req.body.title && String(req.body.title).trim()) || originalName;
        const safeCategory = req.body.category || 'project';

        let fileUrl = `/uploads/${req.file.filename}`;
        let thumbnailUrl = undefined;
        let storageProvider = 'local';
        let cloudinaryPublicId = '';
        let cloudinaryResourceType = fileType;

        if (isCloudinaryEnabled()) {
            initCloudinary();
            const folder = String(process.env.CLOUDINARY_FOLDER || 'quartier').trim();
            const uploadRes = await cloudinary.uploader.upload(req.file.path, {
                folder,
                resource_type: 'auto',
                use_filename: false,
                unique_filename: true
            });

            storageProvider = 'cloudinary';
            cloudinaryPublicId = uploadRes?.public_id || '';
            cloudinaryResourceType = uploadRes?.resource_type || fileType;
            fileUrl = uploadRes?.secure_url || uploadRes?.url || fileUrl;

            if (cloudinaryResourceType === 'video') {
                thumbnailUrl = cloudinaryVideoThumb(cloudinaryPublicId) || undefined;
            }

            await deleteFile(req.file.path);
        }

        if (!isCloudinaryEnabled() && fileType === 'video') {
            const uploadedAbs = path.resolve(req.file.path);
            const thumbFilename = `thumb-${path.parse(req.file.filename).name}.jpg`;
            const thumbAbs = path.resolve(path.join(path.dirname(req.file.path), thumbFilename));
            const ok = await generateVideoThumbnail(uploadedAbs, thumbAbs);
            if (ok) {
                thumbnailUrl = `/uploads/${thumbFilename}`;
            }
        }

        const media = new Media({
            title: safeTitle,
            description: req.body.description,
            type: fileType,
            url: fileUrl,
            thumbnail: thumbnailUrl,
            storageProvider,
            cloudinaryPublicId,
            cloudinaryResourceType,
            category: safeCategory,
            tags: req.body.tags ? JSON.parse(req.body.tags) : [],
            metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {},
            uploadedBy: req.user._id
        });

        await media.save();
        res.status(201).json({
            message: 'Média ajouté avec succès',
            media
        });
    } catch (error) {
        // En cas d'erreur, supprimer le fichier uploadé
        if (req.file) {
            await deleteFile(req.file.path);
        }
        console.error('Erreur upload média:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout du média' });
    }
};

// Récupérer tous les médias
exports.getMedia = async (req, res) => {
    try {
        const {
            type,
            category,
            status = 'approved',
            sort = '-createdAt',
            page = 1,
            limit = 20
        } = req.query;

        // Par défaut (sans paramètre) on filtre sur 'approved' pour le public.
        // Si le client passe status=all, on n'ajoute PAS de filtre de statut.
        const query = {};
        if (status && status !== 'all') query.status = status;
        if (type) query.type = type;
        if (category) query.category = category;

        const media = await Media.find(query)
            .populate('uploadedBy', 'name')
            .populate('metadata.event', 'title')
            .populate('metadata.project', 'title')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Media.countDocuments(query);

        res.json({
            media,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error('Erreur récupération médias:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des médias' });
    }
};

// Récupérer un média spécifique
exports.getOneMedia = async (req, res) => {
    try {
        const media = await Media.findById(req.params.id)
            .populate('uploadedBy', 'name')
            .populate('metadata.event', 'title')
            .populate('metadata.project', 'title');

        if (!media) {
            return res.status(404).json({ message: 'Média non trouvé' });
        }

        res.json(media);
    } catch (error) {
        console.error('Erreur récupération média:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du média' });
    }
};

// Mettre à jour un média
exports.updateMedia = async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).json({ message: 'Média non trouvé' });
        }

        // Vérifier les droits
        if (media.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const updatableFields = [
            'title', 'description', 'category',
            'tags', 'metadata', 'status'
        ];

        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                media[field] = req.body[field];
            }
        });

        await media.save();
        res.json({
            message: 'Média mis à jour avec succès',
            media
        });
    } catch (error) {
        console.error('Erreur mise à jour média:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du média' });
    }
};

// Supprimer un média
exports.deleteMedia = async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).json({ message: 'Média non trouvé' });
        }

        // Vérifier les droits
        if (media.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        if (media.storageProvider === 'cloudinary' && media.cloudinaryPublicId && hasCloudinaryCredentials()) {
            initCloudinary();
            try {
                await cloudinary.uploader.destroy(String(media.cloudinaryPublicId), { resource_type: media.cloudinaryResourceType || 'image' });
            } catch (e) {}
        } else {
            // Supprimer le fichier physique
            // media.url commence généralement par '/uploads/...', il faut le rendre relatif
            const relativeUrl = (media.url || '').replace(/^[\/\\]+/, '');
            const filePath = path.join('public', relativeUrl);
            await deleteFile(filePath);

            if (media.thumbnail) {
                const relThumb = (media.thumbnail || '').replace(/^[\/\\]+/, '');
                const thumbPath = path.join('public', relThumb);
                await deleteFile(thumbPath);
            }
        }

        // Mongoose 7: remove() is deprecated on documents
        await media.deleteOne();
        res.json({ message: 'Média supprimé avec succès' });
    } catch (error) {
        console.error('Erreur suppression média:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du média' });
    }
};

// Approuver ou rejeter un média
exports.moderateMedia = async (req, res) => {
    try {
        const { status } = req.body;
        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).json({ message: 'Média non trouvé' });
        }

        media.status = status;
        await media.save();

        res.json({
            message: 'Statut du média mis à jour avec succès',
            media
        });
    } catch (error) {
        console.error('Erreur modération média:', error);
        res.status(500).json({ message: 'Erreur lors de la modération du média' });
    }
};

// Admin: régénérer les thumbnails manquants (vidéos)
exports.rebuildThumbnails = async (req, res) => {
    try {
        if (!ffmpeg || !ffmpegPath) {
            return res.status(400).json({ message: "FFmpeg n'est pas disponible sur le serveur" });
        }

        const limit = Math.max(1, Math.min(200, Number(req.body?.limit || 50)));

        const candidates = await Media.find({
            type: 'video',
            $or: [{ thumbnail: { $exists: false } }, { thumbnail: null }, { thumbnail: '' }]
        }).sort('-createdAt').limit(limit);

        let processed = 0;
        let generated = 0;
        let failed = 0;
        const failures = [];

        for (const m of candidates) {
            processed += 1;
            try {
                const videoAbs = mediaUrlToAbsolutePath(m.url);
                const thumbFilename = `thumb-${m._id}.jpg`;
                const thumbAbs = path.resolve(path.join('public', 'uploads', thumbFilename));

                const ok = await generateVideoThumbnail(videoAbs, thumbAbs);
                if (!ok) {
                    failed += 1;
                    failures.push({ id: String(m._id), reason: 'ffmpeg_failed' });
                    continue;
                }

                m.thumbnail = `/uploads/${thumbFilename}`;
                await m.save();
                generated += 1;
            } catch (err) {
                failed += 1;
                failures.push({ id: String(m._id), reason: 'exception' });
            }
        }

        return res.json({
            message: 'Rebuild thumbnails terminé',
            limit,
            found: candidates.length,
            processed,
            generated,
            failed,
            failures
        });
    } catch (error) {
        console.error('Erreur rebuild thumbnails:', error);
        res.status(500).json({ message: 'Erreur lors du rebuild thumbnails' });
    }
};
