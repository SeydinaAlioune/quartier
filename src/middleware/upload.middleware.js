const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Limite de taille configurable (en Mo) via la variable d'env MEDIA_MAX_FILE_MB
// Par défaut: 300 Mo
const MAX_FILE_MB = Number(process.env.MEDIA_MAX_FILE_MB || 300);

const getUploadDir = () => {
    const fromEnv = process.env.UPLOAD_DIR;
    if (typeof fromEnv === 'string' && fromEnv.trim()) {
        return path.resolve(fromEnv.trim());
    }
    return path.resolve('public/uploads');
};

// Configuration du stockage local
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = getUploadDir();
        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Générer un nom de fichier unique
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtrer les types de fichiers
const fileFilter = (req, file, cb) => {
    const allowedTypes = {
        'image/jpeg': true,
        'image/png': true,
        'image/gif': true,
        'image/webp': true,
        'video/mp4': true,
        'video/quicktime': true, // .mov
        'video/webm': true,
        'video/ogg': true
    };

    if (allowedTypes[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error('Format de fichier non supporté'), false);
    }
};

// Configuration de Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: MAX_FILE_MB * 1024 * 1024,
        files: 5 // Maximum 5 fichiers à la fois
    }
});

// Middleware pour gérer les erreurs d'upload
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: `Fichier trop volumineux. Taille maximum: ${MAX_FILE_MB}MB`
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                message: 'Trop de fichiers. Maximum: 5 fichiers'
            });
        }
    }
    if (err.message === 'Format de fichier non supporté') {
        return res.status(400).json({
            message: 'Format de fichier non supporté. Formats acceptés: JPG, PNG, GIF, WEBP, MP4, MOV, WEBM, OGG'
        });
    }
    next(err);
};

// Fonction pour supprimer un fichier
const deleteFile = async (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erreur suppression fichier:', error);
        return false;
    }
};

module.exports = {
    upload,
    handleUploadError,
    deleteFile
};
