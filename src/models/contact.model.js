const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['general', 'support', 'suggestion', 'complaint', 'other'],
        default: 'general'
    },
    source: {
        type: String,
        enum: ['espace_membres', 'contact_page', 'other'],
        default: 'other'
    },
    status: {
        type: String,
        enum: ['new', 'in_progress', 'resolved', 'closed'],
        default: 'new'
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    responses: [{
        message: String,
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        date: {
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
contactSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const emergencyContactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['police', 'medical', 'fire', 'municipal', 'utility', 'other'],
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    alternatePhone: String,
    email: String,
    address: {
        street: String,
        city: String,
        postalCode: String
    },
    description: String,
    available24h: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: true
    }
});

const Contact = mongoose.model('Contact', contactSchema);
const EmergencyContact = mongoose.model('EmergencyContact', emergencyContactSchema);

module.exports = { Contact, EmergencyContact };
