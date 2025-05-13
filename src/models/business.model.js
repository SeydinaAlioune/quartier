const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'restaurant', 'commerce', 'service',
            'sante', 'education', 'artisan',
            'autre'
        ]
    },
    description: {
        type: String,
        required: true
    },
    contact: {
        phone: String,
        email: String,
        website: String
    },
    address: {
        street: String,
        city: String,
        postalCode: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    hours: [{
        day: {
            type: String,
            enum: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
        },
        open: String,
        close: String,
        closed: {
            type: Boolean,
            default: false
        }
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    images: [{
        url: String,
        caption: String
    }],
    status: {
        type: String,
        enum: ['active', 'pending', 'inactive'],
        default: 'pending'
    },
    ratings: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        score: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    features: [String],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Calcul de la moyenne des notes
businessSchema.pre('save', function(next) {
    if (this.ratings && this.ratings.length > 0) {
        const sum = this.ratings.reduce((acc, rating) => acc + rating.score, 0);
        this.averageRating = sum / this.ratings.length;
    }
    this.updatedAt = Date.now();
    next();
});

// Index pour la recherche
businessSchema.index({
    name: 'text',
    description: 'text',
    'address.street': 'text',
    'address.city': 'text'
});

const Business = mongoose.model('Business', businessSchema);

module.exports = Business;
