const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
    date: {
        type: Date,
        required: true,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
