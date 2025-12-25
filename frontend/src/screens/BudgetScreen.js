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
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../constants/categories';

const BudgetScreen = () => {
    const { logout } = useAuth();
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

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
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
                    <Text style={styles.infoIcon}>💡</Text>
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
                                        <Text style={styles.categoryEmoji}>{category.icon}</Text>
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

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutBtnText}>🚪 Logout</Text>
                </TouchableOpacity>

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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#1a1a2e',
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#e3f2fd',
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
        color: '#1565c0',
        lineHeight: 20,
    },
    budgetList: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
    },
    budgetItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
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
        color: '#1a1a2e',
    },
    budgetAmount: {
        fontSize: 13,
        color: '#4CAF50',
        marginTop: 2,
    },
    setBtn: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    setBtnText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    editContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        width: 100,
        fontSize: 14,
        marginRight: 8,
    },
    saveBtn: {
        backgroundColor: '#4CAF50',
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
        backgroundColor: '#f5f5f5',
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#999',
        fontSize: 18,
    },
    logoutBtn: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#e74c3c',
    },
    logoutBtnText: {
        fontSize: 16,
        color: '#e74c3c',
        fontWeight: '500',
    },
});

export default BudgetScreen;
