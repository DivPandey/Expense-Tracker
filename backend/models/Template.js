const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please provide a template name'],
        trim: true,
        maxlength: 50
    },
    amount: {
        type: Number,
        required: [true, 'Please provide an amount']
    },
    category: {
        type: String,
        required: [true, 'Please select a category'],
        enum: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other']
    },
    paymentMethod: {
        type: String,
        required: [true, 'Please select a payment method'],
        enum: ['Cash', 'Card', 'UPI', 'NetBanking']
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    icon: {
        type: String,
        default: '📋'
    },
    usageCount: {
        type: Number,
        default: 0
    },
    lastUsed: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries by user
templateSchema.index({ user: 1, usageCount: -1 });

module.exports = mongoose.model('Template', templateSchema);
