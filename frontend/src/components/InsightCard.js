import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const InsightCard = ({ insight }) => {
    const getBackgroundColor = () => {
        switch (insight.type) {
            case 'success':
                return '#d4edda';
            case 'warning':
                return '#fff3cd';
            case 'danger':
                return '#f8d7da';
            case 'info':
            default:
                return '#cce5ff';
        }
    };

    const getTextColor = () => {
        switch (insight.type) {
            case 'success':
                return '#155724';
            case 'warning':
                return '#856404';
            case 'danger':
                return '#721c24';
            case 'info':
            default:
                return '#004085';
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
