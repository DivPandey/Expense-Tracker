const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

// @route   GET /api/templates
// @desc    Get all templates for user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const templates = await Template.find({ user: req.user._id })
            .sort({ usageCount: -1, createdAt: -1 });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/templates
// @desc    Create a new template
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { name, amount, category, paymentMethod, description, icon } = req.body;

        const template = await Template.create({
            user: req.user._id,
            name,
            amount,
            category,
            paymentMethod,
            description,
            icon: icon || '📋'
        });

        res.status(201).json(template);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/templates/:id
// @desc    Update a template
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const template = await Template.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        const { name, amount, category, paymentMethod, description, icon } = req.body;

        template.name = name || template.name;
        template.amount = amount || template.amount;
        template.category = category || template.category;
        template.paymentMethod = paymentMethod || template.paymentMethod;
        template.description = description !== undefined ? description : template.description;
        template.icon = icon || template.icon;

        await template.save();
        res.json(template);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/templates/:id
// @desc    Delete a template
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const template = await Template.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/templates/:id/use
// @desc    Create an expense from a template
// @access  Private
router.post('/:id/use', auth, async (req, res) => {
    try {
        const template = await Template.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Create expense from template
        const expense = await Expense.create({
            user: req.user._id,
            amount: req.body.amount || template.amount,
            category: template.category,
            paymentMethod: template.paymentMethod,
            description: req.body.description || template.description,
            date: req.body.date || new Date()
        });

        // Update template usage stats
        template.usageCount += 1;
        template.lastUsed = new Date();
        await template.save();

        res.status(201).json({
            expense,
            template: {
                _id: template._id,
                usageCount: template.usageCount,
                lastUsed: template.lastUsed
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/templates/frequent
// @desc    Get most frequently used templates (top 5)
// @access  Private
router.get('/frequent', auth, async (req, res) => {
    try {
        const templates = await Template.find({
            user: req.user._id,
            usageCount: { $gt: 0 }
        })
            .sort({ usageCount: -1 })
            .limit(5);
        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
