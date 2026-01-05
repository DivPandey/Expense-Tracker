import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getCategoryById, getPaymentMethodById } from '../constants/categories';

const TemplateCard = ({ template, onUse, onEdit, onDelete }) => {
    const { colors } = useTheme();
    const category = getCategoryById(template.category);
    const paymentMethod = getPaymentMethodById(template.paymentMethod);

    const styles = createStyles(colors);

    return (
        <TouchableOpacity
            style={[styles.card, { borderLeftColor: category.color }]}
            onPress={() => onUse && onUse(template)}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>{template.icon || category.icon}</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.row}>
                    <Text style={styles.name} numberOfLines={1}>{template.name}</Text>
                    <Text style={styles.amount}>₹{template.amount.toLocaleString()}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.category}>{category.label}</Text>
                    <Text style={styles.paymentMethod}>
                        {paymentMethod.icon} {paymentMethod.label}
                    </Text>
                </View>

                {template.usageCount > 0 && (
                    <Text style={styles.usageInfo}>
                        Used {template.usageCount} time{template.usageCount !== 1 ? 's' : ''}
                    </Text>
                )}
            </View>

            <View style={styles.actions}>
                {onEdit && (
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => onEdit(template)}
                    >
                        <Text style={styles.actionIcon}>✏️</Text>
                    </TouchableOpacity>
                )}
                {onDelete && (
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => onDelete(template._id)}
                    >
                        <Text style={styles.actionIcon}>🗑️</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

const createStyles = (colors) => StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
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
        backgroundColor: colors.surfaceVariant,
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
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
        marginRight: 8,
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
    },
    category: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    paymentMethod: {
        fontSize: 12,
        color: colors.textMuted,
    },
    usageInfo: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 4,
    },
    actions: {
        flexDirection: 'column',
        justifyContent: 'center',
        paddingLeft: 8,
    },
    actionBtn: {
        padding: 4,
        marginVertical: 2,
    },
    actionIcon: {
        fontSize: 16,
    },
});

export default TemplateCard;
