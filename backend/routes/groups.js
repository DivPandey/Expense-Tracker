const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const GroupExpense = require('../models/GroupExpense');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET /api/groups
// @desc    Get all groups for user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const groups = await Group.find({
            'members.user': req.user._id,
            isActive: true
        })
            .populate('members.user', 'name email')
            .populate('creator', 'name email')
            .sort({ updatedAt: -1 });

        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        console.log('Creating group:', req.body);
        console.log('User:', req.user._id);

        const { name, description, icon } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Group name is required' });
        }

        const group = await Group.create({
            name: name.trim(),
            description: description || '',
            icon: icon || '👥',
            creator: req.user._id
        });

        console.log('Group created:', group._id);

        await group.populate('members.user', 'name email');
        await group.populate('creator', 'name email');

        res.status(201).json(group);
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ message: error.message });
    }
});


// @route   POST /api/groups/join/:code
// @desc    Join a group by invite code
// @access  Private
router.post('/join/:code', auth, async (req, res) => {
    try {
        const group = await Group.findOne({
            inviteCode: req.params.code.toUpperCase(),
            isActive: true
        });

        if (!group) {
            return res.status(404).json({ message: 'Invalid invite code' });
        }

        // Check if already a member
        const isMember = group.members.some(
            m => m.user.toString() === req.user._id.toString()
        );

        if (isMember) {
            return res.status(400).json({ message: 'Already a member of this group' });
        }

        // Add user as member
        group.members.push({
            user: req.user._id,
            role: 'member',
            joinedAt: new Date()
        });

        await group.save();
        await group.populate('members.user', 'name email');
        await group.populate('creator', 'name email');

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/groups/:id
// @desc    Get single group
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const group = await Group.findOne({
            _id: req.params.id,
            'members.user': req.user._id
        })
            .populate('members.user', 'name email')
            .populate('creator', 'name email');

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/groups/:id
// @desc    Update group
// @access  Private (admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is admin
        const member = group.members.find(
            m => m.user.toString() === req.user._id.toString()
        );

        if (!member || member.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this group' });
        }

        const { name, description, icon } = req.body;
        group.name = name || group.name;
        group.description = description !== undefined ? description : group.description;
        group.icon = icon || group.icon;

        await group.save();
        await group.populate('members.user', 'name email');

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/groups/:id/leave
// @desc    Leave a group
// @access  Private
router.delete('/:id/leave', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Remove user from members
        group.members = group.members.filter(
            m => m.user.toString() !== req.user._id.toString()
        );

        // If no members left, deactivate group
        if (group.members.length === 0) {
            group.isActive = false;
        }

        await group.save();
        res.json({ message: 'Left group successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/groups/:id/expenses
// @desc    Get group expenses
// @access  Private
router.get('/:id/expenses', auth, async (req, res) => {
    try {
        const group = await Group.findOne({
            _id: req.params.id,
            'members.user': req.user._id
        });

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const expenses = await GroupExpense.find({ group: req.params.id })
            .populate('paidBy', 'name email')
            .populate('splits.user', 'name email')
            .sort({ date: -1 });

        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/groups/:id/expenses
// @desc    Add expense to group
// @access  Private
router.post('/:id/expenses', auth, async (req, res) => {
    try {
        const group = await Group.findOne({
            _id: req.params.id,
            'members.user': req.user._id
        });

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const { amount, description, category, date, splitType, splits, selectedMembers } = req.body;

        let calculatedSplits = [];

        if (splitType === 'equal') {
            // Equal split among selected members (or all if none selected)
            const membersToSplit = selectedMembers && selectedMembers.length > 0
                ? group.members.filter(m => selectedMembers.includes(m.user.toString()))
                : group.members;

            const perPerson = amount / membersToSplit.length;
            calculatedSplits = membersToSplit.map(m => ({
                user: m.user,
                amount: parseFloat(perPerson.toFixed(2)),
                isPaid: m.user.toString() === req.user._id.toString()
            }));
        } else if (splitType === 'exact' && splits) {
            // Use provided splits
            calculatedSplits = splits.map(s => ({
                user: s.user,
                amount: s.amount,
                isPaid: s.user.toString() === req.user._id.toString()
            }));
        } else if (splitType === 'percentage' && splits) {
            // Calculate from percentages
            calculatedSplits = splits.map(s => ({
                user: s.user,
                amount: parseFloat(((amount * s.percentage) / 100).toFixed(2)),
                isPaid: s.user.toString() === req.user._id.toString()
            }));
        }


        const expense = await GroupExpense.create({
            group: req.params.id,
            paidBy: req.user._id,
            amount,
            description,
            category: category || 'Other',
            date: date || new Date(),
            splitType: splitType || 'equal',
            splits: calculatedSplits
        });

        await expense.populate('paidBy', 'name email');
        await expense.populate('splits.user', 'name email');

        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/groups/:id/balances
// @desc    Calculate who owes whom
// @access  Private
router.get('/:id/balances', auth, async (req, res) => {
    try {
        const group = await Group.findOne({
            _id: req.params.id,
            'members.user': req.user._id
        }).populate('members.user', 'name email');

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const expenses = await GroupExpense.find({ group: req.params.id })
            .populate('paidBy', 'name email')
            .populate('splits.user', 'name email');

        // Calculate net balance for each member
        const balances = {};

        group.members.forEach(m => {
            balances[m.user._id.toString()] = {
                user: m.user,
                paid: 0,
                owes: 0,
                netBalance: 0
            };
        });

        expenses.forEach(expense => {
            const payerId = expense.paidBy._id.toString();

            // Add to payer's paid amount
            if (balances[payerId]) {
                balances[payerId].paid += expense.amount;
            }

            // Add to each person's owes amount
            expense.splits.forEach(split => {
                const userId = split.user._id.toString();
                if (balances[userId] && !split.isPaid) {
                    balances[userId].owes += split.amount;
                }
            });
        });

        // Calculate net balance (positive = owed money, negative = owes money)
        Object.keys(balances).forEach(userId => {
            balances[userId].netBalance = balances[userId].paid - balances[userId].owes;
        });

        // Convert to array and calculate simplified debts
        const balanceArray = Object.values(balances);

        // Calculate who owes whom (simplified)
        const debts = [];
        const debtors = balanceArray.filter(b => b.netBalance < 0)
            .sort((a, b) => a.netBalance - b.netBalance);
        const creditors = balanceArray.filter(b => b.netBalance > 0)
            .sort((a, b) => b.netBalance - a.netBalance);

        let i = 0, j = 0;
        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];

            const amount = Math.min(-debtor.netBalance, creditor.netBalance);

            if (amount > 0.01) {
                debts.push({
                    from: debtor.user,
                    to: creditor.user,
                    amount: parseFloat(amount.toFixed(2))
                });
            }

            debtor.netBalance += amount;
            creditor.netBalance -= amount;

            if (Math.abs(debtor.netBalance) < 0.01) i++;
            if (Math.abs(creditor.netBalance) < 0.01) j++;
        }

        res.json({
            balances: balanceArray,
            debts,
            totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/groups/:id/settle
// @desc    Record a settlement between users
// @access  Private
router.post('/:id/settle', auth, async (req, res) => {
    try {
        const { toUser, amount } = req.body;

        const group = await Group.findOne({
            _id: req.params.id,
            'members.user': req.user._id
        });

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Create a settlement expense (negative for the person paying)
        const settlement = await GroupExpense.create({
            group: req.params.id,
            paidBy: req.user._id,
            amount: amount,
            description: 'Settlement',
            category: 'Settlement',
            splitType: 'exact',
            splits: [
                { user: toUser, amount: amount, isPaid: true }
            ]
        });

        await settlement.populate('paidBy', 'name email');
        await settlement.populate('splits.user', 'name email');

        res.status(201).json(settlement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/groups/:id/expenses/:expenseId/mark-paid
// @desc    Mark a split as paid
// @access  Private
router.put('/:id/expenses/:expenseId/mark-paid', auth, async (req, res) => {
    try {
        const { userId } = req.body;

        const expense = await GroupExpense.findOne({
            _id: req.params.expenseId,
            group: req.params.id
        });

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Find the split for this user and mark as paid
        const split = expense.splits.find(
            s => s.user.toString() === userId
        );

        if (!split) {
            return res.status(404).json({ message: 'Split not found for this user' });
        }

        split.isPaid = true;
        split.paidAt = new Date();

        await expense.save();
        await expense.populate('paidBy', 'name email');
        await expense.populate('splits.user', 'name email');

        res.json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/groups/:id/pending
// @desc    Get pending payments for reminders
// @access  Private
router.get('/:id/pending', auth, async (req, res) => {
    try {
        const group = await Group.findOne({
            _id: req.params.id,
            'members.user': req.user._id
        }).populate('members.user', 'name email');

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const expenses = await GroupExpense.find({
            group: req.params.id,
            'splits.isPaid': false
        })
            .populate('paidBy', 'name email')
            .populate('splits.user', 'name email');

        // Build pending payments per user
        const pendingByUser = {};

        expenses.forEach(expense => {
            expense.splits.forEach(split => {
                if (!split.isPaid && split.user._id.toString() !== expense.paidBy._id.toString()) {
                    const oderId = split.user._id.toString();
                    if (!pendingByUser[oderId]) {
                        pendingByUser[oderId] = {
                            user: split.user,
                            totalOwed: 0,
                            expenses: []
                        };
                    }
                    pendingByUser[oderId].totalOwed += split.amount;
                    pendingByUser[oderId].expenses.push({
                        expenseId: expense._id,
                        description: expense.description,
                        amount: split.amount,
                        paidBy: expense.paidBy
                    });
                }
            });
        });

        res.json(Object.values(pendingByUser));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/groups/:id/remind/:userId
// @desc    Send payment reminder to a user
// @access  Private
router.post('/:id/remind/:userId', auth, async (req, res) => {
    try {
        const Notification = require('../models/Notification');

        const group = await Group.findOne({
            _id: req.params.id,
            'members.user': req.user._id
        }).populate('members.user', 'name email');

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Get pending expenses for the user
        const expenses = await GroupExpense.find({
            group: req.params.id,
            'splits.user': req.params.userId,
            'splits.isPaid': false
        }).populate('paidBy', 'name email');

        let totalOwed = 0;
        expenses.forEach(expense => {
            expense.splits.forEach(split => {
                if (split.user.toString() === req.params.userId && !split.isPaid) {
                    totalOwed += split.amount;
                }
            });
        });

        if (totalOwed === 0) {
            return res.status(400).json({ message: 'User has no pending payments' });
        }

        // Create in-app notification
        const notification = new Notification({
            user: req.params.userId,
            type: 'payment-reminder',
            title: `Payment Reminder from ${group.name}`,
            message: `${req.user.name} is requesting payment of ₹${totalOwed.toLocaleString()} in group "${group.name}"`,
            data: {
                groupId: group._id,
                amount: totalOwed,
                fromUser: req.user._id
            }
        });

        await notification.save();

        res.json({
            message: 'Reminder sent successfully',
            notification
        });
    } catch (error) {
        console.error('Error sending reminder:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

