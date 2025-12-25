import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Dimensions
} from 'react-native';
import { useExpenses } from '../context/ExpenseContext';
import InsightCard from '../components/InsightCard';
import { CATEGORIES } from '../constants/categories';

const { width } = Dimensions.get('window');

const InsightsScreen = () => {
    const { insights, fetchInsights, loading } = useExpenses();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchInsights();
        setRefreshing(false);
    };

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
                <Text style={styles.title}>Spending Insights</Text>
                <Text style={styles.subtitle}>Understand where your money goes</Text>
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
                            <Text style={[styles.comparisonAmount, { color: '#888' }]}>
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
                                <Text style={styles.emptyIcon}>📊</Text>
                                <Text style={styles.emptyText}>No spending data yet</Text>
                            </View>
                        ) : (
                            categoryData.map((cat, index) => (
                                <View key={cat.id || index} style={styles.categoryRow}>
                                    <View style={styles.categoryInfo}>
                                        <Text style={styles.categoryIcon}>{cat.icon}</Text>
                                        <View style={styles.categoryDetails}>
                                            <Text style={styles.categoryName}>{cat.label}</Text>
                                            <Text style={styles.categoryMeta}>
                                                {cat.count} transaction{cat.count !== 1 ? 's' : ''}
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
                                </View>
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
    },
    comparisonCard: {
        backgroundColor: '#fff',
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
        backgroundColor: '#eee',
        marginHorizontal: 16,
    },
    comparisonLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 8,
    },
    comparisonAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a2e',
    },
    changeIndicator: {
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    changeUp: {
        color: '#e74c3c',
        fontSize: 14,
        fontWeight: '600',
    },
    changeDown: {
        color: '#27ae60',
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a2e',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    categoryBreakdown: {
        backgroundColor: '#fff',
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
    categoryDetails: {
        flex: 1,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1a1a2e',
    },
    categoryMeta: {
        fontSize: 12,
        color: '#888',
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
        color: '#1a1a2e',
    },
    categoryPercentage: {
        fontSize: 12,
        color: '#888',
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 3,
    },
    pieChartContainer: {
        backgroundColor: '#fff',
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
        color: '#666',
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
        color: '#888',
    },
});

export default InsightsScreen;
