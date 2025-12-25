const express = require('express');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/expenses
// @desc    Get all expenses for user with filters
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { startDate, endDate, category, paymentMethod } = req.query;

        let query = { user: req.user._id };

        // Date filtering
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // Category filtering
        if (category) query.category = category;

        // Payment method filtering
        if (paymentMethod) query.paymentMethod = paymentMethod;

        const expenses = await Expense.find(query).sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/expenses
// @desc    Create new expense
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { amount, category, paymentMethod, description, date } = req.body;

        const expense = await Expense.create({
            user: req.user._id,
            amount,
            category,
            paymentMethod,
            description,
            date: date || Date.now()
        });

        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/expenses/sync
// @desc    Sync multiple expenses from offline storage
// @access  Private
router.post('/sync', auth, async (req, res) => {
    try {
        const { expenses } = req.body;
        const results = [];

        for (const exp of expenses) {
            const expense = await Expense.create({
                user: req.user._id,
                amount: exp.amount,
                category: exp.category,
                paymentMethod: exp.paymentMethod,
                description: exp.description,
                date: exp.date || Date.now()
            });
            results.push(expense);
        }

        res.status(201).json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        const { amount, category, paymentMethod, description, date } = req.body;

        expense.amount = amount || expense.amount;
        expense.category = category || expense.category;
        expense.paymentMethod = paymentMethod || expense.paymentMethod;
        expense.description = description !== undefined ? description : expense.description;
        expense.date = date || expense.date;

        await expense.save();
        res.json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        await expense.deleteOne();
        res.json({ message: 'Expense removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/expenses/insights
// @desc    Get spending insights
// @access  Private
router.get('/insights', auth, async (req, res) => {
    try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Current month start/end
        const currentMonthStart = new Date(currentYear, currentMonth, 1);
        const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

        // Previous month start/end
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const prevMonthStart = new Date(prevYear, prevMonth, 1);
        const prevMonthEnd = new Date(prevYear, prevMonth + 1, 0, 23, 59, 59);

        // Get current month expenses by category
        const currentMonthExpenses = await Expense.aggregate([
            {
                $match: {
                    user: req.user._id,
                    date: { $gte: currentMonthStart, $lte: currentMonthEnd }
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get previous month expenses by category
        const prevMonthExpenses = await Expense.aggregate([
            {
                $match: {
                    user: req.user._id,
                    date: { $gte: prevMonthStart, $lte: prevMonthEnd }
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' }
                }
            }
        ]);

        // Calculate totals
        const currentTotal = currentMonthExpenses.reduce((sum, cat) => sum + cat.total, 0);
        const prevTotal = prevMonthExpenses.reduce((sum, cat) => sum + cat.total, 0);

        // Generate insights
        const insights = [];

        // Overall comparison
        if (prevTotal > 0) {
            const percentChange = ((currentTotal - prevTotal) / prevTotal * 100).toFixed(1);
            if (currentTotal > prevTotal) {
                insights.push({
                    type: 'warning',
                    message: `You spent ${Math.abs(percentChange)}% more this month compared to last month`,
                    value: currentTotal - prevTotal
                });
            } else if (currentTotal < prevTotal) {
                insights.push({
                    type: 'success',
                    message: `Great! You saved ${Math.abs(percentChange)}% this month compared to last month`,
                    value: prevTotal - currentTotal
                });
            }
        }

        // Category comparisons
        const prevExpenseMap = {};
        prevMonthExpenses.forEach(e => { prevExpenseMap[e._id] = e.total; });

        currentMonthExpenses.forEach(cat => {
            const prevCatTotal = prevExpenseMap[cat._id] || 0;
            if (prevCatTotal > 0) {
                const percentChange = ((cat.total - prevCatTotal) / prevCatTotal * 100).toFixed(1);
                if (cat.total > prevCatTotal && percentChange > 10) {
                    insights.push({
                        type: 'info',
                        message: `You spent ${Math.abs(percentChange)}% more on ${cat._id} this month`,
                        category: cat._id,
                        value: cat.total - prevCatTotal
                    });
                }
            }
        });

        // Highest spending category
        if (currentMonthExpenses.length > 0) {
            const highest = currentMonthExpenses.reduce((max, cat) =>
                cat.total > max.total ? cat : max, currentMonthExpenses[0]);
            insights.push({
                type: 'info',
                message: `${highest._id} is your highest expense category this month`,
                category: highest._id,
                value: highest.total
            });
        }

        // Budget warnings
        const budgets = await Budget.find({
            user: req.user._id,
            month: currentMonth + 1,
            year: currentYear
        });

        budgets.forEach(budget => {
            const categoryExpense = currentMonthExpenses.find(e => e._id === budget.category);
            const spent = categoryExpense ? categoryExpense.total : 0;
            const percentage = (spent / budget.limit * 100).toFixed(1);

            if (spent >= budget.limit) {
                insights.push({
                    type: 'danger',
                    message: `You've exceeded your ${budget.category} budget by ₹${(spent - budget.limit).toFixed(2)}`,
                    category: budget.category,
                    value: spent,
                    limit: budget.limit
                });
            } else if (percentage >= 80) {
                insights.push({
                    type: 'warning',
                    message: `You've used ${percentage}% of your ${budget.category} budget`,
                    category: budget.category,
                    value: spent,
                    limit: budget.limit
                });
            }
        });

        res.json({
            currentMonth: {
                total: currentTotal,
                byCategory: currentMonthExpenses
            },
            previousMonth: {
                total: prevTotal,
                byCategory: prevMonthExpenses
            },
            insights
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/expenses/aggregation
// @desc    Get expense aggregation by date/category
// @access  Private
router.get('/aggregation', auth, async (req, res) => {
    try {
        const { groupBy, startDate, endDate } = req.query;

        let matchQuery = { user: req.user._id };

        if (startDate || endDate) {
            matchQuery.date = {};
            if (startDate) matchQuery.date.$gte = new Date(startDate);
            if (endDate) matchQuery.date.$lte = new Date(endDate);
        }

        let groupId;
        if (groupBy === 'day') {
            groupId = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
        } else if (groupBy === 'month') {
            groupId = { $dateToString: { format: '%Y-%m', date: '$date' } };
        } else if (groupBy === 'category') {
            groupId = '$category';
        } else {
            groupId = '$category'; // default
        }

        const aggregation = await Expense.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: groupId,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(aggregation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
