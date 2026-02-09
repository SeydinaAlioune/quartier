const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    passwordResetTokenHash: {
        type: String,
        default: null
    },
    passwordResetExpiresAt: {
        type: Date,
        default: null
    },
    role: {
        type: String,
        enum: ['user', 'moderator', 'admin'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    profile: {
        address: String,
        phone: String,
        avatar: String,
        bio: String,
        interests: [String],
        notifications: {
            events: {
                type: Boolean,
                default: true
            },
            posts: {
                type: Boolean,
                default: true
            },
            projects: {
                type: Boolean,
                default: true
            }
        }
    },
    activity: {
        posts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post'
        }],
        events: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event'
        }],
        projects: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project'
        }]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Supprimer le password des réponses JSON
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
