const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    type: {
        type: String,
        enum: ['image', 'video'],
        required: true
    },
    url: {
        type: String,
        required: true
    },
    thumbnail: String,
    category: {
        type: String,
        enum: ['event', 'project', 'history', 'general'],
        default: 'general'
    },
    tags: [String],
    metadata: {
        date: Date,
        location: String,
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event'
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project'
        }
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index pour la recherche
mediaSchema.index({
    title: 'text',
    description: 'text',
    tags: 'text'
});

// Mise à jour de la date de modification
mediaSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Media = mongoose.model('Media', mediaSchema);

module.exports = Media;
