import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import api from '../api/axios';
import {
    saveExpensesLocally,
    getLocalExpenses,
    addToPendingSync,
    getPendingSync
} from '../utils/storage';
import { syncOfflineExpenses } from '../utils/sync';
import { useAuth } from './AuthContext';
import {
    sendExpenseConfirmation,
    sendBudgetWarning,
    sendOverspendingAlert
} from '../utils/notifications';

const ExpenseContext = createContext(null);

export const ExpenseProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [insights, setInsights] = useState(null);
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);

    // Monitor network status
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const online = state.isConnected && state.isInternetReachable;
            setIsOnline(online);

            // Sync when coming back online
            if (online && isAuthenticated) {
                handleSync();
            }
        });

        return () => unsubscribe();
    }, [isAuthenticated]);

    // Load expenses when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchExpenses();
            fetchInsights();
            fetchBudgets();
            checkPendingSync();
        }
    }, [isAuthenticated]);

    const checkPendingSync = async () => {
        const pending = await getPendingSync();
        setPendingCount(pending.length);
    };

    const handleSync = async () => {
        const result = await syncOfflineExpenses();
        if (result.success && result.synced > 0) {
            fetchExpenses();
            fetchInsights();
            setPendingCount(0);
        }
        return result;
    };

    const fetchExpenses = async (filters = {}) => {
        try {
            setLoading(true);

            if (!isOnline) {
                // Load from local storage when offline
                const localExpenses = await getLocalExpenses();
                setExpenses(localExpenses);
                return;
            }

            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.category) params.append('category', filters.category);

            const response = await api.get(`/expenses?${params.toString()}`);
            setExpenses(response.data);

            // Cache locally
            await saveExpensesLocally(response.data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            // Fall back to local storage
            const localExpenses = await getLocalExpenses();
            setExpenses(localExpenses);
        } finally {
            setLoading(false);
        }
    };

    const fetchInsights = async () => {
        try {
            if (!isOnline) return;

            const response = await api.get('/expenses/insights');
            setInsights(response.data);
        } catch (error) {
            console.error('Error fetching insights:', error);
        }
    };

    const fetchBudgets = async () => {
        try {
            if (!isOnline) return;
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();
            const response = await api.get(`/budgets?month=${currentMonth}&year=${currentYear}`);
            setBudgets(response.data);
        } catch (error) {
            console.error('Error fetching budgets:', error);
        }
    };

    // Check budget after adding expense and send notifications
    const checkBudgetAfterExpense = async (category, allExpenses) => {
        try {
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            // Find budget for this category
            const budget = budgets.find(b =>
                b.category === category &&
                b.month === currentMonth &&
                b.year === currentYear
            );

            if (!budget) return;

            // Calculate total spent in this category this month
            const monthStart = new Date(currentYear, currentMonth - 1, 1);
            const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

            const categoryTotal = allExpenses
                .filter(exp => {
                    const expDate = new Date(exp.date);
                    return exp.category === category &&
                        expDate >= monthStart &&
                        expDate <= monthEnd;
                })
                .reduce((sum, exp) => sum + exp.amount, 0);

            const percentage = (categoryTotal / budget.limit) * 100;

            // Send appropriate notification
            if (percentage >= 100) {
                await sendOverspendingAlert(category, categoryTotal, budget.limit);
            } else if (percentage >= 80) {
                await sendBudgetWarning(category, categoryTotal, budget.limit);
            }
        } catch (error) {
            console.error('Error checking budget:', error);
        }
    };

    const addExpense = async (expenseData) => {
        try {
            if (!isOnline) {
                // Save locally when offline
                const pending = await addToPendingSync(expenseData);
                setPendingCount(pending.length);

                // Add to local expenses for immediate UI update
                const newExpense = {
                    ...expenseData,
                    _id: `local_${Date.now()}`,
                    createdAt: new Date().toISOString()
                };
                setExpenses(prev => [newExpense, ...prev]);

                return { success: true, offline: true };
            }

            const response = await api.post('/expenses', expenseData);
            setExpenses(prev => [response.data, ...prev]);
            fetchInsights(); // Refresh insights

            // Send expense confirmation notification
            await sendExpenseConfirmation(expenseData.amount, expenseData.category);

            // Check budget limits and send alerts
            await checkBudgetAfterExpense(expenseData.category, [...expenses, response.data]);

            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to add expense'
            };
        }
    };

    const updateExpense = async (id, expenseData) => {
        try {
            const response = await api.put(`/expenses/${id}`, expenseData);
            setExpenses(prev =>
                prev.map(exp => exp._id === id ? response.data : exp)
            );
            fetchInsights();

            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to update expense'
            };
        }
    };

    const deleteExpense = async (id) => {
        try {
            await api.delete(`/expenses/${id}`);
            setExpenses(prev => prev.filter(exp => exp._id !== id));
            fetchInsights();

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to delete expense'
            };
        }
    };

    const getAggregation = async (groupBy, startDate, endDate) => {
        try {
            const params = new URLSearchParams({ groupBy });
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await api.get(`/expenses/aggregation?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error getting aggregation:', error);
            return [];
        }
    };

    return (
        <ExpenseContext.Provider value={{
            expenses,
            insights,
            loading,
            isOnline,
            pendingCount,
            fetchExpenses,
            fetchInsights,
            addExpense,
            updateExpense,
            deleteExpense,
            getAggregation,
            handleSync
        }}>
            {children}
        </ExpenseContext.Provider>
    );
};

export const useExpenses = () => {
    const context = useContext(ExpenseContext);
    if (!context) {
        throw new Error('useExpenses must be used within an ExpenseProvider');
    }
    return context;
};

export default ExpenseContext;
