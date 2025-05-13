const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    status: {
        type: String,
        enum: ['active', 'unsubscribed'],
        default: 'active'
    },
    subscriptionDate: {
        type: Date,
        default: Date.now
    },
    categories: [{
        type: String,
        enum: ['events', 'projects', 'news', 'all']
    }],
    lastEmailSent: Date,
    unsubscribeToken: String
});

const newsletterSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['events', 'projects', 'news', 'all'],
        default: 'all'
    },
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'sent'],
        default: 'draft'
    },
    scheduledDate: Date,
    sentDate: Date,
    sentTo: [{
        email: String,
        status: {
            type: String,
            enum: ['sent', 'failed', 'opened'],
            default: 'sent'
        },
        sentAt: Date,
        openedAt: Date
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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

// Mise à jour de la date de modification
newsletterSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Subscriber = mongoose.model('Subscriber', subscriberSchema);
const Newsletter = mongoose.model('Newsletter', newsletterSchema);

module.exports = { Subscriber, Newsletter };
