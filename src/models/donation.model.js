const mongoose = require('mongoose');

const donationCampaignSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    goal: {
        type: Number,
        required: true,
        min: 0
    },
    collected: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    category: {
        type: String,
        enum: ['telethon', 'project', 'emergency', 'community', 'other'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    images: [{
        url: String,
        caption: String
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
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const donationSchema = new mongoose.Schema({
    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DonationCampaign',
        required: true
    },
    donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'bank_transfer', 'paypal'],
        required: true
    },
    transactionId: String,
    anonymous: {
        type: Boolean,
        default: false
    },
    message: String,
    receiptSent: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Mise à jour du montant collecté après chaque don
donationSchema.post('save', async function(doc) {
    if (doc.status === 'completed') {
        await mongoose.model('DonationCampaign').findByIdAndUpdate(
            doc.campaign,
            { $inc: { collected: doc.amount } }
        );
    }
});

const DonationCampaign = mongoose.model('DonationCampaign', donationCampaignSchema);
const Donation = mongoose.model('Donation', donationSchema);

module.exports = { DonationCampaign, Donation };
