import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getCategoryById, getPaymentMethodById } from '../constants/categories';

const ExpenseCard = ({ expense, onPress, onDelete }) => {
    const category = getCategoryById(expense.category);
    const paymentMethod = getPaymentMethodById(expense.paymentMethod);
    const date = new Date(expense.date);

    const formatDate = (date) => {
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <TouchableOpacity
            style={[styles.card, { borderLeftColor: category.color }]}
            onPress={() => onPress && onPress(expense)}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>{category.icon}</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.row}>
                    <Text style={styles.category}>{category.label}</Text>
                    <Text style={styles.amount}>₹{expense.amount.toLocaleString()}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.description} numberOfLines={1}>
                        {expense.description || 'No description'}
                    </Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.meta}>
                        {paymentMethod.icon} {paymentMethod.label}
                    </Text>
                    <Text style={styles.date}>{formatDate(date)}</Text>
                </View>
            </View>

            {onDelete && (
                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => onDelete(expense._id)}
                >
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 6,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    icon: {
        fontSize: 24,
    },
    content: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    category: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    amount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e74c3c',
    },
    description: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    meta: {
        fontSize: 12,
        color: '#888',
    },
    date: {
        fontSize: 12,
        color: '#888',
    },
    deleteBtn: {
        justifyContent: 'center',
        paddingLeft: 12,
    },
    deleteBtnText: {
        fontSize: 18,
    },
});

export default ExpenseCard;
