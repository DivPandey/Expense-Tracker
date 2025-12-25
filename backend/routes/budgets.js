const express = require('express');
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/budgets
// @desc    Get all budgets for user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { month, year } = req.query;

        let query = { user: req.user._id };

        if (month) query.month = parseInt(month);
        if (year) query.year = parseInt(year);

        const budgets = await Budget.find(query);
        res.json(budgets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/budgets
// @desc    Create or update budget
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { category, limit, month, year } = req.body;

        // Check if budget exists for this category/month/year
        let budget = await Budget.findOne({
            user: req.user._id,
            category,
            month,
            year
        });

        if (budget) {
            // Update existing
            budget.limit = limit;
            await budget.save();
        } else {
            // Create new
            budget = await Budget.create({
                user: req.user._id,
                category,
                limit,
                month,
                year
            });
        }

        res.status(201).json(budget);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/budgets/:id
// @desc    Delete budget
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        await budget.deleteOne();
        res.json({ message: 'Budget removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
