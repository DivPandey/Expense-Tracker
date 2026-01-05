import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ExpenseCard from '../components/ExpenseCard';
import InsightCard from '../components/InsightCard';
import SyncIndicator from '../components/SyncIndicator';
import NotificationBell from '../components/NotificationBell';
import { CATEGORIES } from '../constants/categories';
import api from '../api/axios';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { colors } = useTheme();
    const {
        expenses,
        insights,
        loading,
        isOnline,
        pendingCount,
        fetchExpenses,
        fetchInsights,
        handleSync
    } = useExpenses();

    const [refreshing, setRefreshing] = useState(false);
    const [frequentTemplates, setFrequentTemplates] = useState([]);

    useEffect(() => {
        fetchFrequentTemplates();
    }, []);

    const fetchFrequentTemplates = async () => {
        try {
            const response = await api.get('/templates/frequent');
            setFrequentTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleQuickAdd = async (template) => {
        Alert.alert(
            'Quick Add',
            `Add ₹${template.amount} for ${template.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Add',
                    onPress: async () => {
                        try {
                            await api.post(`/templates/${template._id}/use`);
                            await fetchExpenses();
                            await fetchInsights();
                            await fetchFrequentTemplates();
                            Alert.alert('Success', 'Expense added!');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to add expense');
                        }
                    }
                }
            ]
        );
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchExpenses();
        await fetchInsights();
        await fetchFrequentTemplates();
        setRefreshing(false);
    }, []);

    // Get recent expenses (last 5)
    const recentExpenses = expenses.slice(0, 5);

    // Calculate totals
    const todayTotal = expenses
        .filter(exp => {
            const expDate = new Date(exp.date).toDateString();
            const today = new Date().toDateString();
            return expDate === today;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);

    const monthTotal = insights?.currentMonth?.total || 0;

    const styles = createStyles(colors);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'User'} 👋</Text>
                    <Text style={styles.date}>
                        {new Date().toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                        })}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <NotificationBell navigation={navigation} />
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate('AddExpense')}
                    >
                        <Text style={styles.addButtonText}>+ Add</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <SyncIndicator
                    isOnline={isOnline}
                    pendingCount={pendingCount}
                    onSync={handleSync}
                />

                {/* Quick Add Templates */}
                {frequentTemplates.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Quick Add</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Templates')}>
                                <Text style={styles.seeAll}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {frequentTemplates.map((template) => {
                                const categoryInfo = CATEGORIES.find(c => c.id === template.category) || CATEGORIES[6];
                                return (
                                    <TouchableOpacity
                                        key={template._id}
                                        style={[styles.quickAddCard, { borderColor: categoryInfo.color }]}
                                        onPress={() => handleQuickAdd(template)}
                                    >
                                        <MaterialIcons name={template.icon || categoryInfo.icon} size={28} color={categoryInfo.color} />
                                        <Text style={styles.quickAddName} numberOfLines={1}>{template.name}</Text>
                                        <Text style={styles.quickAddAmount}>₹{template.amount}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}


                {/* Summary Cards */}
                <View style={styles.summaryContainer}>
                    <View style={[styles.summaryCard, styles.todayCard]}>
                        <Text style={styles.summaryLabel}>Today's Spending</Text>
                        <Text style={styles.summaryAmount}>₹{todayTotal.toLocaleString()}</Text>
                    </View>
                    <View style={[styles.summaryCard, styles.monthCard]}>
                        <Text style={styles.summaryLabel}>This Month</Text>
                        <Text style={styles.summaryAmount}>₹{monthTotal.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Quick Category View */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Category Breakdown</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {insights?.currentMonth?.byCategory?.map((cat, index) => {
                            const categoryInfo = CATEGORIES.find(c => c.id === cat._id) || CATEGORIES[6];
                            return (
                                <View
                                    key={cat._id || index}
                                    style={[styles.categoryCard, { borderColor: categoryInfo.color }]}
                                >
                                    <MaterialIcons name={categoryInfo.icon} size={32} color={categoryInfo.color} />
                                    <Text style={styles.categoryName}>{cat._id}</Text>
                                    <Text style={styles.categoryAmount}>₹{cat.total.toLocaleString()}</Text>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Insights */}
                {insights?.insights?.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Spending Insights</Text>
                        {insights.insights.slice(0, 3).map((insight, index) => (
                            <InsightCard key={index} insight={insight} />
                        ))}
                    </View>
                )}

                {/* Recent Expenses */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Expenses</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {recentExpenses.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="receipt-long" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyText}>No expenses yet</Text>
                            <Text style={styles.emptySubtext}>Tap + Add to record your first expense</Text>
                        </View>
                    ) : (
                        recentExpenses.map((expense) => (
                            <ExpenseCard
                                key={expense._id}
                                expense={expense}
                                onPress={() => navigation.navigate('AddExpense', { expense })}
                            />
                        ))
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.header,
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.headerText,
    },
    date: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
    },
    addButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    content: {
        flex: 1,
        marginTop: -10,
    },
    summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    summaryCard: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
        marginHorizontal: 6,
    },
    todayCard: {
        backgroundColor: colors.primary,
    },
    monthCard: {
        backgroundColor: colors.secondary,
    },
    summaryLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 8,
    },
    summaryAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    section: {
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    seeAll: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '500',
    },
    categoryCard: {
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 12,
        marginLeft: 16,
        width: 100,
        alignItems: 'center',
        borderWidth: 2,
    },
    categoryIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    categoryAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        marginHorizontal: 20,
        backgroundColor: colors.surface,
        borderRadius: 16,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    quickAddCard: {
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 12,
        marginLeft: 16,
        width: 110,
        alignItems: 'center',
        borderWidth: 2,
    },
    quickAddIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    quickAddName: {
        fontSize: 12,
        color: colors.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    quickAddAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
});

export default HomeScreen;


