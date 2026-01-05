import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const GoalCard = ({ goal, onPress, onContribute }) => {
    const { colors } = useTheme();
    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    const remaining = goal.targetAmount - goal.currentAmount;

    const styles = createStyles(colors, goal.color);

    const formatDate = (date) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getDaysRemaining = () => {
        if (!goal.deadline) return null;
        const today = new Date();
        const deadline = new Date(goal.deadline);
        const diffTime = deadline - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(diffDays, 0);
    };

    const daysLeft = getDaysRemaining();

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress && onPress(goal)}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <MaterialIcons name={goal.icon} size={24} color={goal.color} />
                </View>
                <View style={styles.titleContainer}>
                    <Text style={styles.name} numberOfLines={1}>{goal.name}</Text>
                    {daysLeft !== null && (
                        <Text style={[
                            styles.deadline,
                            daysLeft <= 7 && styles.deadlineUrgent
                        ]}>
                            {daysLeft === 0 ? 'Due today!' : `${daysLeft} days left`}
                        </Text>
                    )}
                </View>
                {goal.isCompleted && (
                    <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>✓</Text>
                    </View>
                )}
            </View>

            <View style={styles.amountRow}>
                <Text style={styles.currentAmount}>₹{goal.currentAmount.toLocaleString()}</Text>
                <Text style={styles.targetAmount}>/ ₹{goal.targetAmount.toLocaleString()}</Text>
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${progress}%` }
                        ]}
                    />
                </View>
                <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
            </View>

            {!goal.isCompleted && remaining > 0 && (
                <View style={styles.footer}>
                    <Text style={styles.remainingText}>
                        ₹{remaining.toLocaleString()} more to go
                    </Text>
                    <TouchableOpacity
                        style={styles.contributeBtn}
                        onPress={(e) => {
                            e.stopPropagation();
                            onContribute && onContribute(goal);
                        }}
                    >
                        <Text style={styles.contributeBtnText}>+ Add</Text>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );
};

const createStyles = (colors, goalColor) => StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: goalColor + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    icon: {
        fontSize: 24,
    },
    titleContainer: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    deadline: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    deadlineUrgent: {
        color: colors.danger,
        fontWeight: '600',
    },
    completedBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    completedText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    currentAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: goalColor,
    },
    targetAmount: {
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: 4,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 4,
        overflow: 'hidden',
        marginRight: 10,
    },
    progressFill: {
        height: '100%',
        backgroundColor: goalColor,
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        width: 35,
        textAlign: 'right',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    remainingText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    contributeBtn: {
        backgroundColor: goalColor,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    contributeBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default GoalCard;
