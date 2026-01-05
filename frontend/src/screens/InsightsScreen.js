import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Dimensions,
    TouchableOpacity,
    Modal,
    FlatList
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import InsightCard from '../components/InsightCard';
import ExpenseCard from '../components/ExpenseCard';
import { CATEGORIES } from '../constants/categories';


const { width } = Dimensions.get('window');

const InsightsScreen = ({ navigation }) => {
    const { insights, expenses, fetchInsights, loading } = useExpenses();
    const { colors } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchInsights();
        setRefreshing(false);
    };

    const handleCategoryPress = (category) => {
        setSelectedCategory(category);
        setModalVisible(true);
    };

    const getCategoryExpenses = () => {
        if (!selectedCategory || !expenses) return [];

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return exp.category === selectedCategory.id &&
                expDate.getMonth() === currentMonth &&
                expDate.getFullYear() === currentYear;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const filteredExpenses = getCategoryExpenses();

    const currentMonth = insights?.currentMonth;
    const previousMonth = insights?.previousMonth;
    const insightsList = insights?.insights || [];

    // Calculate total and percentage for each category
    const categoryData = currentMonth?.byCategory?.map(cat => {
        const categoryInfo = CATEGORIES.find(c => c.id === cat._id) || CATEGORIES[6];
        const percentage = currentMonth?.total > 0
            ? ((cat.total / currentMonth.total) * 100).toFixed(1)
            : 0;
        return {
            ...cat,
            ...categoryInfo,
            percentage
        };
    }) || [];

    // Sort by amount descending
    categoryData.sort((a, b) => b.total - a.total);

    const styles = createStyles(colors);

    const renderProgressBar = (percentage, color) => (
        <View style={styles.progressBarContainer}>
            <View
                style={[
                    styles.progressBar,
                    { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }
                ]}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Spending Insights</Text>
                    <Text style={styles.subtitle}>Understand where your money goes</Text>
                </View>
                <TouchableOpacity
                    style={styles.exportBtn}
                    onPress={() => navigation.navigate('Export')}
                >
                    <Text style={styles.exportBtnText}>📊 Export</Text>
                </TouchableOpacity>
            </View>


            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Monthly Comparison */}
                <View style={styles.comparisonCard}>
                    <Text style={styles.sectionTitle}>Monthly Comparison</Text>
                    <View style={styles.comparisonRow}>
                        <View style={styles.comparisonItem}>
                            <Text style={styles.comparisonLabel}>This Month</Text>
                            <Text style={styles.comparisonAmount}>
                                ₹{(currentMonth?.total || 0).toLocaleString()}
                            </Text>
                        </View>
                        <View style={styles.comparisonDivider} />
                        <View style={styles.comparisonItem}>
                            <Text style={styles.comparisonLabel}>Last Month</Text>
                            <Text style={[styles.comparisonAmount, { color: colors.textSecondary }]}>
                                ₹{(previousMonth?.total || 0).toLocaleString()}
                            </Text>
                        </View>
                    </View>

                    {previousMonth?.total > 0 && (
                        <View style={styles.changeIndicator}>
                            {currentMonth?.total > previousMonth?.total ? (
                                <Text style={styles.changeUp}>
                                    ↑ {((currentMonth.total - previousMonth.total) / previousMonth.total * 100).toFixed(1)}% increase
                                </Text>
                            ) : (
                                <Text style={styles.changeDown}>
                                    ↓ {((previousMonth.total - currentMonth.total) / previousMonth.total * 100).toFixed(1)}% decrease
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Smart Insights */}
                {insightsList.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Smart Insights</Text>
                        {insightsList.map((insight, index) => (
                            <InsightCard key={index} insight={insight} />
                        ))}
                    </View>
                )}

                {/* Category Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Category Breakdown</Text>
                    <View style={styles.categoryBreakdown}>
                        {categoryData.length === 0 ? (
                            <View style={styles.emptyState}>
                                <MaterialIcons name="pie-chart" size={48} color={colors.textMuted} />
                                <Text style={styles.emptyText}>No spending data yet</Text>
                            </View>
                        ) : (

                            categoryData.map((cat, index) => (
                                <TouchableOpacity
                                    key={cat.id || index}
                                    style={styles.categoryRow}
                                    onPress={() => handleCategoryPress(cat)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.categoryInfo}>
                                        <View style={[styles.categoryIconContainer, { backgroundColor: cat.color + '20' }]}>
                                            <MaterialIcons name={cat.icon} size={24} color={cat.color} />
                                        </View>
                                        <View style={styles.categoryDetails}>
                                            <Text style={styles.categoryName}>{cat.label}</Text>
                                            <Text style={styles.categoryMeta}>
                                                {cat.count} transaction{cat.count !== 1 ? 's' : ''} • Tap to view
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.categoryStats}>
                                        <Text style={styles.categoryAmount}>
                                            ₹{cat.total.toLocaleString()}
                                        </Text>
                                        <Text style={styles.categoryPercentage}>{cat.percentage}%</Text>
                                    </View>
                                    {renderProgressBar(cat.percentage, cat.color)}
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </View>

                {/* Pie Chart Visualization (Simple) */}
                {categoryData.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Visual Breakdown</Text>
                        <View style={styles.pieChartContainer}>
                            <View style={styles.legendContainer}>
                                {categoryData.slice(0, 5).map((cat, index) => (
                                    <View key={index} style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                                        <Text style={styles.legendText}>
                                            {cat.label} ({cat.percentage}%)
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                <View style={{ height: 100 }} />

            </ScrollView>

            {/* Category Transactions Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    <View style={styles.modalHeader}>
                        <View style={styles.modalHeaderContent}>
                            {selectedCategory && (
                                <View style={[styles.modalIcon, { backgroundColor: selectedCategory.color + '20' }]}>
                                    <MaterialIcons name={selectedCategory.icon} size={24} color={selectedCategory.color} />
                                </View>
                            )}
                            <View>
                                <Text style={styles.modalTitle}>{selectedCategory?.label} Expenses</Text>
                                <Text style={styles.modalSubtitle}>This Month</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            style={styles.closeBtn}
                        >
                            <MaterialIcons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={filteredExpenses}
                        keyExtractor={item => item._id}
                        renderItem={({ item }) => (
                            <ExpenseCard
                                expense={item}
                                onPress={() => {
                                    setModalVisible(false);
                                    navigation.navigate('AddExpense', { expense: item });
                                }}
                            />
                        )}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyList}>
                                <Text style={styles.emptyListText}>No transactions found</Text>
                            </View>
                        }
                    />
                </View>
            </Modal>
        </View >
    );
};

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    exportBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    exportBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },

    comparisonCard: {
        backgroundColor: colors.surface,
        margin: 16,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    comparisonRow: {
        flexDirection: 'row',
        marginTop: 16,
    },
    comparisonItem: {
        flex: 1,
        alignItems: 'center',
    },
    comparisonDivider: {
        width: 1,
        backgroundColor: colors.border,
        marginHorizontal: 16,
    },
    comparisonLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    comparisonAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    changeIndicator: {
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    changeUp: {
        color: colors.danger,
        fontSize: 14,
        fontWeight: '600',
    },
    changeDown: {
        color: colors.success,
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    categoryBreakdown: {
        backgroundColor: colors.surface,
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 16,
    },
    categoryRow: {
        marginBottom: 20,
    },
    categoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    categoryIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    categoryDetails: {
        flex: 1,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text,
    },
    categoryMeta: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    categoryStats: {
        position: 'absolute',
        right: 0,
        top: 0,
        alignItems: 'flex-end',
    },
    categoryAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    categoryPercentage: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 3,
    },
    pieChartContainer: {
        backgroundColor: colors.surface,
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 20,
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '50%',
        marginVertical: 6,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    modalSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    closeBtn: {
        padding: 8,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 20,
    },
    listContent: {
        paddingVertical: 12,
    },
    emptyList: {
        padding: 40,
        alignItems: 'center',
    },
    emptyListText: {
        color: colors.textSecondary,
    }
});

export default InsightsScreen;

