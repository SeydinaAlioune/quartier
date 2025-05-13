const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: [
            'post_comment',
            'post_like',
            'event_reminder',
            'project_update',
            'donation_received',
            'service_rating',
            'message_received',
            'system_notification'
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    link: String,
    read: {
        type: Boolean,
        default: false
    },
    readAt: Date,
    priority: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal'
    },
    metadata: {
        sourceType: String,
        sourceId: mongoose.Schema.Types.ObjectId,
        additionalData: mongoose.Schema.Types.Mixed
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 30 * 24 * 60 * 60 // Expire après 30 jours
    }
});

// Index pour améliorer les performances des requêtes
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
