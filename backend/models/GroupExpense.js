const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paidAt: {
        type: Date,
        default: null
    }
});

const groupExpenseSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Please provide an amount'],
        min: 0.01
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        trim: true
    },
    category: {
        type: String,
        default: 'Other'
    },
    date: {
        type: Date,
        default: Date.now
    },
    splitType: {
        type: String,
        enum: ['equal', 'exact', 'percentage'],
        default: 'equal'
    },
    splits: [splitSchema]
}, {
    timestamps: true
});

// Indexes
groupExpenseSchema.index({ group: 1, date: -1 });
groupExpenseSchema.index({ paidBy: 1 });

module.exports = mongoose.model('GroupExpense', groupExpenseSchema);
