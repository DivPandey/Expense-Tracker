import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const InsightCard = ({ insight }) => {
    const { colors, isDark } = useTheme();

    const getBackgroundColor = () => {
        switch (insight.type) {
            case 'success':
                return isDark ? '#155724' + '40' : '#d4edda';
            case 'warning':
                return isDark ? '#856404' + '40' : '#fff3cd';
            case 'danger':
                return isDark ? '#721c24' + '40' : '#f8d7da';
            case 'info':
            default:
                return isDark ? '#004085' + '40' : '#cce5ff';
        }
    };

    const getTextColor = () => {
        switch (insight.type) {
            case 'success':
                return isDark ? '#75b798' : '#155724';
            case 'warning':
                return isDark ? '#ffda6a' : '#856404';
            case 'danger':
                return isDark ? '#ea868f' : '#721c24';
            case 'info':
            default:
                return isDark ? '#6ea8fe' : '#004085';
        }
    };

    const getIcon = () => {
        switch (insight.type) {
            case 'success':
                return '✅';
            case 'warning':
                return '⚠️';
            case 'danger':
                return '🚨';
            case 'info':
            default:
                return '💡';
        }
    };

    return (
        <View style={[styles.card, { backgroundColor: getBackgroundColor() }]}>
            <Text style={styles.icon}>{getIcon()}</Text>
            <View style={styles.content}>
                <Text style={[styles.message, { color: getTextColor() }]}>
                    {insight.message}
                </Text>
                {insight.value !== undefined && (
                    <Text style={[styles.value, { color: getTextColor() }]}>
                        ₹{insight.value.toLocaleString()}
                        {insight.limit && ` / ₹${insight.limit.toLocaleString()}`}
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 6,
    },
    icon: {
        fontSize: 24,
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    message: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
    },
    value: {
        fontSize: 14,
        marginTop: 4,
        fontWeight: '600',
    },
});

export default InsightCard;

