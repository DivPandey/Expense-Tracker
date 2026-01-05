const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['payment-reminder', 'budget-alert', 'insight', 'group-invite', 'expense-added'],
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
    data: {
        groupId: mongoose.Schema.Types.ObjectId,
        expenseId: mongoose.Schema.Types.ObjectId,
        amount: Number,
        fromUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    read: {
        type: Boolean,
        default: false,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Index for efficient queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
