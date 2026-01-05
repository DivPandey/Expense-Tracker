const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');

// @route   GET /api/goals
// @desc    Get all goals for user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const goals = await Goal.find({ user: req.user._id })
            .sort({ isCompleted: 1, createdAt: -1 });
        res.json(goals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/goals
// @desc    Create a new goal
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { name, targetAmount, deadline, icon, color } = req.body;

        const goal = await Goal.create({
            user: req.user._id,
            name,
            targetAmount,
            deadline: deadline || null,
            icon: icon || '🎯',
            color: color || '#4CAF50'
        });

        res.status(201).json(goal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/goals/:id
// @desc    Get single goal
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const goal = await Goal.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        res.json(goal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/goals/:id
// @desc    Update a goal
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const goal = await Goal.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        const { name, targetAmount, deadline, icon, color } = req.body;

        goal.name = name || goal.name;
        goal.targetAmount = targetAmount || goal.targetAmount;
        goal.deadline = deadline !== undefined ? deadline : goal.deadline;
        goal.icon = icon || goal.icon;
        goal.color = color || goal.color;

        // Check if goal is now completed
        if (goal.currentAmount >= goal.targetAmount) {
            goal.isCompleted = true;
        }

        await goal.save();
        res.json(goal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/goals/:id
// @desc    Delete a goal
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const goal = await Goal.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/goals/:id/contribute
// @desc    Add a contribution to a goal
// @access  Private
router.post('/:id/contribute', auth, async (req, res) => {
    try {
        const goal = await Goal.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        const { amount, note } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Please provide a valid amount' });
        }

        // Add contribution
        goal.contributions.push({
            amount,
            note: note || '',
            date: new Date()
        });

        // Update current amount
        goal.currentAmount += amount;

        // Check if goal is completed
        if (goal.currentAmount >= goal.targetAmount) {
            goal.isCompleted = true;
        }

        await goal.save();
        res.json(goal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/goals/:id/contributions/:contributionId
// @desc    Remove a contribution
// @access  Private
router.delete('/:id/contributions/:contributionId', auth, async (req, res) => {
    try {
        const goal = await Goal.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        const contribution = goal.contributions.id(req.params.contributionId);

        if (!contribution) {
            return res.status(404).json({ message: 'Contribution not found' });
        }

        // Subtract the contribution amount
        goal.currentAmount -= contribution.amount;
        goal.currentAmount = Math.max(0, goal.currentAmount);

        // Remove the contribution
        goal.contributions.pull(req.params.contributionId);

        // Update completion status
        goal.isCompleted = goal.currentAmount >= goal.targetAmount;

        await goal.save();
        res.json(goal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/goals/stats/summary
// @desc    Get goals summary stats
// @access  Private
router.get('/stats/summary', auth, async (req, res) => {
    try {
        const goals = await Goal.find({ user: req.user._id });

        const totalGoals = goals.length;
        const completedGoals = goals.filter(g => g.isCompleted).length;
        const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
        const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

        res.json({
            totalGoals,
            completedGoals,
            activeGoals: totalGoals - completedGoals,
            totalSaved,
            totalTarget,
            overallProgress: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
