import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions
} from 'react-native';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import ExpenseCard from '../components/ExpenseCard';
import InsightCard from '../components/InsightCard';
import SyncIndicator from '../components/SyncIndicator';
import { CATEGORIES } from '../constants/categories';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const { user } = useAuth();
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

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchExpenses();
        await fetchInsights();
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
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AddExpense')}
                >
                    <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
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
                                    <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
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
                            <Text style={styles.emptyIcon}>📝</Text>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    date: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 4,
    },
    addButton: {
        backgroundColor: '#4CAF50',
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
        backgroundColor: '#4CAF50',
    },
    monthCard: {
        backgroundColor: '#2196F3',
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
        color: '#1a1a2e',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    seeAll: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '500',
    },
    categoryCard: {
        backgroundColor: '#fff',
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
        color: '#666',
        marginBottom: 4,
    },
    categoryAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        marginHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#888',
    },
});

export default HomeScreen;
