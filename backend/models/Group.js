const mongoose = require('mongoose');
const crypto = require('crypto');

const memberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
});

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a group name'],
        trim: true,
        maxlength: 50
    },
    description: {
        type: String,
        trim: true,
        maxlength: 200,
        default: ''
    },
    icon: {
        type: String,
        default: '👥'
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [memberSchema],
    inviteCode: {
        type: String,
        default: function () {
            return crypto.randomBytes(4).toString('hex').toUpperCase();
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Add creator as admin member on creation
groupSchema.pre('save', function () {
    if (this.isNew && this.members.length === 0 && this.creator) {
        this.members.push({
            user: this.creator,
            role: 'admin',
            joinedAt: new Date()
        });
    }
});


// Virtual for member count
groupSchema.virtual('memberCount').get(function () {
    return this.members.length;
});

// Ensure virtuals are included
groupSchema.set('toJSON', { virtuals: true });
groupSchema.set('toObject', { virtuals: true });

// Index for member queries only (inviteCode already has unique index)
groupSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Group', groupSchema);

