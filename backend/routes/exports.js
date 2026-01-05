const express = require('express');
const router = express.Router();
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

// @route   GET /api/exports/csv
// @desc    Export expenses as CSV
// @access  Private
router.get('/csv', auth, async (req, res) => {
    try {
        const { startDate, endDate, category } = req.query;

        // Build query
        const query = { user: req.user._id };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        if (category && category !== 'All') {
            query.category = category;
        }

        const expenses = await Expense.find(query).sort({ date: -1 });

        if (expenses.length === 0) {
            return res.status(404).json({ message: 'No expenses found for the selected criteria' });
        }

        // Format data for CSV
        const csvData = expenses.map(exp => ({
            Date: new Date(exp.date).toLocaleDateString('en-IN'),
            Category: exp.category,
            Amount: exp.amount,
            'Payment Method': exp.paymentMethod,
            Description: exp.description || '',
        }));

        // Calculate total
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        csvData.push({
            Date: '',
            Category: '',
            Amount: '',
            'Payment Method': '',
            Description: `TOTAL: ₹${total.toLocaleString()}`
        });

        const parser = new Parser({
            fields: ['Date', 'Category', 'Amount', 'Payment Method', 'Description']
        });
        const csv = parser.parse(csvData);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
        res.send(csv);
    } catch (error) {
        console.error('CSV Export Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/exports/pdf
// @desc    Export expenses as PDF
// @access  Private
router.get('/pdf', auth, async (req, res) => {
    try {
        const { startDate, endDate, category } = req.query;

        // Build query
        const query = { user: req.user._id };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        if (category && category !== 'All') {
            query.category = category;
        }

        const expenses = await Expense.find(query).sort({ date: -1 });

        if (expenses.length === 0) {
            return res.status(404).json({ message: 'No expenses found for the selected criteria' });
        }

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=expenses.pdf');

        // Pipe to response
        doc.pipe(res);

        // Header
        doc.fontSize(24).fillColor('#4CAF50').text('PocketExpense+', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(16).fillColor('#333').text('Expense Report', { align: 'center' });
        doc.moveDown(0.3);

        // Date range
        const dateRangeText = startDate || endDate
            ? `${startDate ? new Date(startDate).toLocaleDateString('en-IN') : 'Start'} - ${endDate ? new Date(endDate).toLocaleDateString('en-IN') : 'Present'}`
            : 'All Time';
        doc.fontSize(10).fillColor('#666').text(`Period: ${dateRangeText}`, { align: 'center' });
        if (category && category !== 'All') {
            doc.text(`Category: ${category}`, { align: 'center' });
        }
        doc.moveDown(1);

        // Summary
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        doc.fontSize(14).fillColor('#1a1a2e').text(`Total Expenses: ₹${total.toLocaleString()}`, { align: 'center' });
        doc.fontSize(10).fillColor('#666').text(`${expenses.length} transaction(s)`, { align: 'center' });
        doc.moveDown(1);

        // Separator line
        doc.strokeColor('#ddd').lineWidth(1)
            .moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);

        // Table header
        const tableTop = doc.y;
        const colWidths = [80, 90, 80, 80, 170];
        const headers = ['Date', 'Category', 'Amount', 'Payment', 'Description'];

        doc.fontSize(10).fillColor('#1a1a2e').font('Helvetica-Bold');
        let xPos = 50;
        headers.forEach((header, i) => {
            doc.text(header, xPos, tableTop, { width: colWidths[i] });
            xPos += colWidths[i];
        });

        doc.moveDown(0.5);
        doc.strokeColor('#ddd').lineWidth(0.5)
            .moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        // Table rows
        doc.font('Helvetica').fillColor('#333');

        expenses.forEach((exp, index) => {
            // Check if we need a new page
            if (doc.y > 700) {
                doc.addPage();
            }

            const y = doc.y;
            xPos = 50;

            const rowData = [
                new Date(exp.date).toLocaleDateString('en-IN'),
                exp.category,
                `₹${exp.amount.toLocaleString()}`,
                exp.paymentMethod,
                exp.description || '-'
            ];

            rowData.forEach((text, i) => {
                doc.text(text, xPos, y, { width: colWidths[i], ellipsis: true });
                xPos += colWidths[i];
            });

            doc.moveDown(0.3);
        });

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).fillColor('#888')
            .text(`Generated on ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
        doc.text('PocketExpense+ - Track your spending smartly', { align: 'center' });

        // Finalize PDF
        doc.end();
    } catch (error) {
        console.error('PDF Export Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/exports/summary
// @desc    Get export summary data
// @access  Private
router.get('/summary', auth, async (req, res) => {
    try {
        const { startDate, endDate, category } = req.query;

        const query = { user: req.user._id };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        if (category && category !== 'All') {
            query.category = category;
        }

        const expenses = await Expense.find(query);

        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const byCategory = {};

        expenses.forEach(exp => {
            if (!byCategory[exp.category]) {
                byCategory[exp.category] = 0;
            }
            byCategory[exp.category] += exp.amount;
        });

        res.json({
            count: expenses.length,
            total,
            byCategory
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
