import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert
} from 'react-native';
import { useExpenses } from '../context/ExpenseContext';
import ExpenseCard from '../components/ExpenseCard';
import { CATEGORIES } from '../constants/categories';

const ExpenseListScreen = ({ navigation }) => {
    const { expenses, loading, fetchExpenses, deleteExpense } = useExpenses();
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [viewMode, setViewMode] = useState('all'); // 'all', 'daily', 'monthly'

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchExpenses();
        setRefreshing(false);
    }, []);

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Expense',
            'Are you sure you want to delete this expense?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await deleteExpense(id);
                        if (!result.success) {
                            Alert.alert('Error', result.error);
                        }
                    }
                }
            ]
        );
    };

    // Filter and group expenses
    const getFilteredExpenses = () => {
        let filtered = [...expenses];

        if (selectedCategory) {
            filtered = filtered.filter(exp => exp.category === selectedCategory);
        }

        if (viewMode === 'daily') {
            // Group by date
            const grouped = {};
            filtered.forEach(exp => {
                const dateKey = new Date(exp.date).toDateString();
                if (!grouped[dateKey]) {
                    grouped[dateKey] = [];
                }
                grouped[dateKey].push(exp);
            });
            return Object.entries(grouped).map(([date, items]) => ({
                title: date,
                data: items,
                total: items.reduce((sum, exp) => sum + exp.amount, 0)
            }));
        }

        if (viewMode === 'monthly') {
            // Group by month
            const grouped = {};
            filtered.forEach(exp => {
                const date = new Date(exp.date);
                const monthKey = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
                if (!grouped[monthKey]) {
                    grouped[monthKey] = [];
                }
                grouped[monthKey].push(exp);
            });
            return Object.entries(grouped).map(([month, items]) => ({
                title: month,
                data: items,
                total: items.reduce((sum, exp) => sum + exp.amount, 0)
            }));
        }

        return filtered;
    };

    const filteredExpenses = getFilteredExpenses();

    const renderViewModeButtons = () => (
        <View style={styles.viewModeContainer}>
            {['all', 'daily', 'monthly'].map(mode => (
                <TouchableOpacity
                    key={mode}
                    style={[
                        styles.viewModeBtn,
                        viewMode === mode && styles.viewModeBtnActive
                    ]}
                    onPress={() => setViewMode(mode)}
                >
                    <Text style={[
                        styles.viewModeBtnText,
                        viewMode === mode && styles.viewModeBtnTextActive
                    ]}>
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderCategoryFilter = () => (
        <View style={styles.categoryFilter}>
            <TouchableOpacity
                style={[
                    styles.categoryChip,
                    !selectedCategory && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(null)}
            >
                <Text style={[
                    styles.categoryChipText,
                    !selectedCategory && styles.categoryChipTextActive
                ]}>All</Text>
            </TouchableOpacity>
            {CATEGORIES.map(cat => (
                <TouchableOpacity
                    key={cat.id}
                    style={[
                        styles.categoryChip,
                        selectedCategory === cat.id && { backgroundColor: cat.color, borderColor: cat.color }
                    ]}
                    onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                >
                    <Text style={[
                        styles.categoryChipText,
                        selectedCategory === cat.id && styles.categoryChipTextActive
                    ]}>{cat.icon}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderGroupHeader = (title, total) => (
        <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>{title}</Text>
            <Text style={styles.groupTotal}>₹{total.toLocaleString()}</Text>
        </View>
    );

    const renderItem = ({ item }) => {
        if (viewMode !== 'all' && item.title) {
            return (
                <View>
                    {renderGroupHeader(item.title, item.total)}
                    {item.data.map(expense => (
                        <ExpenseCard
                            key={expense._id}
                            expense={expense}
                            onPress={() => navigation.navigate('AddExpense', { expense })}
                            onDelete={handleDelete}
                        />
                    ))}
                </View>
            );
        }

        return (
            <ExpenseCard
                expense={item}
                onPress={() => navigation.navigate('AddExpense', { expense: item })}
                onDelete={handleDelete}
            />
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>All Expenses</Text>
                <Text style={styles.count}>{expenses.length} transactions</Text>
            </View>

            {renderViewModeButtons()}
            {renderCategoryFilter()}

            <FlatList
                data={viewMode === 'all' ? filteredExpenses : filteredExpenses}
                keyExtractor={(item, index) => item._id || item.title || index.toString()}
                renderItem={renderItem}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📊</Text>
                        <Text style={styles.emptyText}>No expenses found</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#1a1a2e',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    count: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    viewModeContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    viewModeBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
        marginHorizontal: 4,
        backgroundColor: '#f5f5f5',
    },
    viewModeBtnActive: {
        backgroundColor: '#4CAF50',
    },
    viewModeBtnText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    viewModeBtnTextActive: {
        color: '#fff',
    },
    categoryFilter: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    categoryChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
    },
    categoryChipActive: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    categoryChipText: {
        fontSize: 14,
    },
    categoryChipTextActive: {
        color: '#fff',
    },
    listContent: {
        paddingVertical: 12,
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#f0f0f0',
        marginTop: 8,
    },
    groupTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    groupTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
    },
});

export default ExpenseListScreen;
