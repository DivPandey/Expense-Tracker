import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import { CATEGORIES } from '../constants/categories';

const BudgetScreen = () => {
    const { colors } = useTheme();
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editValue, setEditValue] = useState('');

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        fetchBudgets();
    }, []);

    const fetchBudgets = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/budgets?month=${currentMonth}&year=${currentYear}`);
            setBudgets(response.data);
        } catch (error) {
            console.error('Error fetching budgets:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveBudget = async (category) => {
        const limit = parseFloat(editValue);
        if (isNaN(limit) || limit <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        try {
            setSaving(true);
            await api.post('/budgets', {
                category,
                limit,
                month: currentMonth,
                year: currentYear
            });

            await fetchBudgets();
            setEditingCategory(null);
            setEditValue('');
        } catch (error) {
            Alert.alert('Error', 'Failed to save budget');
        } finally {
            setSaving(false);
        }
    };

    const getBudgetForCategory = (categoryId) => {
        return budgets.find(b => b.category === categoryId);
    };

    const styles = createStyles(colors);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Budget Settings</Text>
                <Text style={styles.subtitle}>
                    {new Date().toLocaleString('default', { month: 'long' })} {currentYear}
                </Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.infoCard}>
                    <MaterialIcons name="lightbulb" size={24} color="#FFC107" style={styles.infoIcon} />
                    <Text style={styles.infoText}>
                        Set monthly spending limits for each category. You'll get alerts when approaching or exceeding limits.
                    </Text>
                </View>

                <View style={styles.budgetList}>
                    {CATEGORIES.map((category) => {
                        const budget = getBudgetForCategory(category.id);
                        const isEditing = editingCategory === category.id;

                        return (
                            <View key={category.id} style={styles.budgetItem}>
                                <View style={styles.categoryRow}>
                                    <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                                        <MaterialIcons name={category.icon} size={24} color={category.color} />
                                    </View>
                                    <View style={styles.categoryInfo}>
                                        <Text style={styles.categoryName}>{category.label}</Text>
                                        {budget && !isEditing && (
                                            <Text style={styles.budgetAmount}>
                                                Limit: ₹{budget.limit.toLocaleString()}
                                            </Text>
                                        )}
                                    </View>

                                    {isEditing ? (
                                        <View style={styles.editContainer}>
                                            <TextInput
                                                style={styles.editInput}
                                                placeholder="Amount"
                                                placeholderTextColor={colors.textMuted}
                                                value={editValue}
                                                onChangeText={setEditValue}
                                                keyboardType="decimal-pad"
                                                autoFocus
                                            />
                                            <TouchableOpacity
                                                style={styles.saveBtn}
                                                onPress={() => saveBudget(category.id)}
                                                disabled={saving}
                                            >
                                                <Text style={styles.saveBtnText}>
                                                    {saving ? '...' : '✓'}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.cancelBtn}
                                                onPress={() => {
                                                    setEditingCategory(null);
                                                    setEditValue('');
                                                }}
                                            >
                                                <Text style={styles.cancelBtnText}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.setBtn}
                                            onPress={() => {
                                                setEditingCategory(category.id);
                                                setEditValue(budget ? budget.limit.toString() : '');
                                            }}
                                        >
                                            <Text style={styles.setBtnText}>
                                                {budget ? 'Edit' : 'Set'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        );
                    })}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.header,
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.headerText,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: colors.info + '20',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    infoIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: colors.info,
        lineHeight: 20,
    },
    budgetList: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
    },
    budgetItem: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    categoryIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    categoryEmoji: {
        fontSize: 24,
    },
    categoryInfo: {
        flex: 1,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text,
    },
    budgetAmount: {
        fontSize: 13,
        color: colors.primary,
        marginTop: 2,
    },
    setBtn: {
        backgroundColor: colors.surfaceVariant,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    setBtnText: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    editContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editInput: {
        backgroundColor: colors.surfaceVariant,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        width: 100,
        fontSize: 14,
        marginRight: 8,
        color: colors.text,
    },
    saveBtn: {
        backgroundColor: colors.primary,
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 18,
    },
    cancelBtn: {
        backgroundColor: colors.surfaceVariant,
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnText: {
        color: colors.textMuted,
        fontSize: 18,
    },
});

export default BudgetScreen;

