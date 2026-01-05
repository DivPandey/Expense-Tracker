import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import ExpenseCard from '../components/ExpenseCard';
import { CATEGORIES } from '../constants/categories';

const ExpenseListScreen = ({ navigation }) => {
    const { expenses, loading, fetchExpenses, deleteExpense } = useExpenses();
    const { colors } = useTheme();
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
    const styles = createStyles(colors);

    const renderViewModeButtons = () => (
        <View style={styles.viewModeSection}>
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
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryFilter}
            contentContainerStyle={styles.categoryFilterContent}
        >
            <TouchableOpacity
                style={[
                    styles.categoryChip,
                    !selectedCategory && styles.categoryChipActive,
                    !selectedCategory && { backgroundColor: colors.primary }
                ]}
                onPress={() => setSelectedCategory(null)}
            >
                <MaterialIcons
                    name="apps"
                    size={18}
                    color={!selectedCategory ? '#fff' : colors.textSecondary}
                />
                <Text style={[
                    styles.categoryChipText,
                    !selectedCategory && styles.categoryChipTextActive
                ]}>All</Text>
            </TouchableOpacity>
            {CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                    <TouchableOpacity
                        key={cat.id}
                        style={[
                            styles.categoryChip,
                            isSelected && { backgroundColor: cat.color }
                        ]}
                        onPress={() => setSelectedCategory(isSelected ? null : cat.id)}
                    >
                        <MaterialIcons
                            name={cat.icon}
                            size={18}
                            color={isSelected ? '#fff' : cat.color}
                        />
                        <Text style={[
                            styles.categoryChipText,
                            isSelected && styles.categoryChipTextActive
                        ]}>{cat.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
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
                        <MaterialIcons name="bar-chart" size={48} color={colors.textMuted} />
                        <Text style={styles.emptyText}>No expenses found</Text>
                    </View>
                }
            />
        </View>
    );
};

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.header,
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.headerText,
    },
    count: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
    },
    viewModeSection: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        gap: 8,
    },
    viewModeBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    viewModeBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    viewModeBtnText: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    viewModeBtnTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
    categoryFilter: {
        paddingVertical: 8,
        paddingBottom: 12,
    },
    categoryFilterContent: {
        paddingHorizontal: 16,
        gap: 10,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        backgroundColor: colors.surface,
        minHeight: 38,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
    },
    categoryChipActive: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginLeft: 5,
    },
    categoryChipTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
    listContent: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginHorizontal: 12,
        marginTop: 12,
        marginBottom: 4,
        backgroundColor: colors.surface,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    groupTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    groupTotal: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.primary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 12,
    },
});

export default ExpenseListScreen;

