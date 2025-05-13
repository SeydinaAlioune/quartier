const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['proposed', 'planning', 'in_progress', 'completed', 'cancelled'],
        default: 'proposed'
    },
    category: {
        type: String,
        required: true,
        enum: ['infrastructure', 'environnement', 'social', 'culture', 'securite', 'autre']
    },
    location: {
        address: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    budget: {
        estimated: Number,
        collected: {
            type: Number,
            default: 0
        }
    },
    timeline: {
        startDate: Date,
        endDate: Date,
        milestones: [{
            title: String,
            date: Date,
            status: {
                type: String,
                enum: ['pending', 'completed', 'delayed'],
                default: 'pending'
            }
        }]
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['volunteer', 'donor', 'supporter'],
            default: 'supporter'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    updates: [{
        content: String,
        date: {
            type: Date,
            default: Date.now
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    votes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        type: {
            type: String,
            enum: ['up', 'down']
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    attachments: [{
        type: {
            type: String,
            enum: ['image', 'document', 'video']
        },
        url: String,
        name: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Mise à jour de la date de modification
projectSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
