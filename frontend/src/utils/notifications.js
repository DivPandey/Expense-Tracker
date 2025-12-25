import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Request notification permissions (local notifications only)
export const requestNotificationPermissions = async () => {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Notification permissions not granted');
            return false;
        }

        // Set up Android notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('budget-alerts', {
                name: 'Budget Alerts',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF6B6B',
            });
        }

        return true;
    } catch (error) {
        console.log('Error requesting notification permissions:', error);
        return false;
    }
};

// Send budget warning notification (80% reached)
export const sendBudgetWarning = async (category, spent, limit) => {
    try {
        const percentage = ((spent / limit) * 100).toFixed(0);

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '⚠️ Budget Warning',
                body: `You've used ${percentage}% of your ${category} budget (₹${spent.toFixed(0)} of ₹${limit})`,
                data: { type: 'budget_warning', category },
                sound: true,
            },
            trigger: null, // Send immediately
        });
    } catch (error) {
        console.log('Error sending budget warning:', error);
    }
};

// Send overspending alert notification (100%+ reached)
export const sendOverspendingAlert = async (category, spent, limit) => {
    try {
        const overspent = spent - limit;

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🚨 Budget Exceeded!',
                body: `You've exceeded your ${category} budget by ₹${overspent.toFixed(0)}`,
                data: { type: 'overspending', category },
                sound: true,
            },
            trigger: null,
        });
    } catch (error) {
        console.log('Error sending overspending alert:', error);
    }
};

// Send expense added confirmation
export const sendExpenseConfirmation = async (amount, category) => {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '✅ Expense Added',
                body: `₹${amount} added to ${category}`,
                data: { type: 'expense_added' },
            },
            trigger: null,
        });
    } catch (error) {
        console.log('Error sending expense confirmation:', error);
    }
};

// Send daily spending summary
export const sendDailySummary = async (totalSpent) => {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '📊 Daily Summary',
                body: `You spent ₹${totalSpent.toFixed(0)} today. Keep tracking!`,
                data: { type: 'daily_summary' },
            },
            trigger: null,
        });
    } catch (error) {
        console.log('Error sending daily summary:', error);
    }
};

// Check budgets and send alerts if needed
export const checkBudgetsAndNotify = async (expenses, budgets) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Filter current month's budgets
    const activesBudgets = budgets.filter(
        b => b.month === currentMonth && b.year === currentYear
    );

    // Calculate category totals for current month
    const categoryTotals = {};
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    expenses.forEach(exp => {
        const expDate = new Date(exp.date);
        if (expDate >= monthStart && expDate <= monthEnd) {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        }
    });

    // Check each budget and notify
    for (const budget of activesBudgets) {
        const spent = categoryTotals[budget.category] || 0;
        const percentage = (spent / budget.limit) * 100;

        if (percentage >= 100) {
            await sendOverspendingAlert(budget.category, spent, budget.limit);
        } else if (percentage >= 80) {
            await sendBudgetWarning(budget.category, spent, budget.limit);
        }
    }
};
