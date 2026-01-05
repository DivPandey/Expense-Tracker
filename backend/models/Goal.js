const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    note: {
        type: String,
        default: ''
    }
});

const goalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please provide a goal name'],
        trim: true,
        maxlength: 50
    },
    targetAmount: {
        type: Number,
        required: [true, 'Please provide a target amount'],
        min: 1
    },
    currentAmount: {
        type: Number,
        default: 0
    },
    deadline: {
        type: Date,
        default: null
    },
    icon: {
        type: String,
        default: '🎯'
    },
    color: {
        type: String,
        default: '#4CAF50'
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    contributions: [contributionSchema]
}, {
    timestamps: true
});

// Virtual for progress percentage
goalSchema.virtual('progress').get(function () {
    return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function () {
    if (!this.deadline) return null;
    const today = new Date();
    const deadline = new Date(this.deadline);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
});

// Ensure virtuals are included in JSON
goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

// Index for faster queries
goalSchema.index({ user: 1, isCompleted: 1 });

module.exports = mongoose.model('Goal', goalSchema);
