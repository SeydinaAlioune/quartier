const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
    },
    openTime: String,
    closeTime: String,
    closed: {
        type: Boolean,
        default: false
    }
});

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Municipal', 'Commercial', 'Santé', 'Education', 'Transport', 'Loisirs', 'Autre']
    },
    provider: {
        name: {
            type: String,
            required: true
        },
        contact: {
            email: String,
            phone: String,
            website: String
        }
    },
    location: {
        address: {
            type: String,
            required: true
        },
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    schedule: [scheduleSchema],
    images: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'temporaire'],
        default: 'active'
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
    features: [{
        type: String
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
serviceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Calcul de la moyenne des notes
serviceSchema.methods.calculateAverageRating = function() {
    if (this.ratings.length === 0) return 0;
    
    const sum = this.ratings.reduce((acc, rating) => acc + rating.score, 0);
    this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10;
    return this.averageRating;
};

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
