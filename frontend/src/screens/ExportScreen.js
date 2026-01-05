import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { useTheme } from '../context/ThemeContext';
import { CATEGORIES } from '../constants/categories';
import api from '../api/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ExportScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState(null);

    const allCategories = [{ id: 'All', label: 'All Categories', icon: 'apps', color: colors.primary }, ...CATEGORIES];

    useEffect(() => {
        fetchSummary();
    }, [startDate, endDate, selectedCategory]);

    const fetchSummary = async () => {
        try {
            const params = new URLSearchParams();
            params.append('startDate', startDate.toISOString());
            params.append('endDate', endDate.toISOString());
            if (selectedCategory !== 'All') {
                params.append('category', selectedCategory);
            }

            const response = await api.get(`/exports/summary?${params.toString()}`);
            setSummary(response.data);
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    const handleExport = async (format) => {
        if (!summary || summary.count === 0) {
            Alert.alert('No Data', 'No expenses found for the selected criteria');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const params = new URLSearchParams();
            params.append('startDate', startDate.toISOString());
            params.append('endDate', endDate.toISOString());
            if (selectedCategory !== 'All') {
                params.append('category', selectedCategory);
            }

            const baseUrl = api.defaults.baseURL || 'http://localhost:5000/api';
            const exportUrl = `${baseUrl}/exports/${format}?${params.toString()}`;

            // Generate filename with date
            const dateStr = new Date().toISOString().split('T')[0];
            const filename = `expenses_${dateStr}.${format}`;
            const fileUri = FileSystem.documentDirectory + filename;

            // Download file with auth headers
            const downloadResult = await FileSystem.downloadAsync(
                exportUrl,
                fileUri,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (downloadResult.status === 200) {
                // Check if sharing is available
                const canShare = await Sharing.isAvailableAsync();

                if (canShare) {
                    await Sharing.shareAsync(downloadResult.uri, {
                        mimeType: format === 'pdf' ? 'application/pdf' : 'text/csv',
                        dialogTitle: `Save ${format.toUpperCase()} Export`,
                        UTI: format === 'pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text'
                    });
                    Alert.alert('Success', `${format.toUpperCase()} file ready to share!`);
                } else {
                    Alert.alert('Success', `File saved to: ${downloadResult.uri}`);
                }
            } else {
                throw new Error('Download failed');
            }
        } catch (error) {
            console.error('Export error:', error);
            Alert.alert('Error', 'Failed to export data. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    const onStartDateChange = (event, selectedDate) => {
        setShowStartPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setStartDate(selectedDate);
        }
    };

    const onEndDateChange = (event, selectedDate) => {
        setShowEndPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setEndDate(selectedDate);
        }
    };

    const styles = createStyles(colors);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Export Data</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Date Range Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Date Range</Text>
                    <View style={styles.dateRow}>
                        <TouchableOpacity
                            style={styles.dateBtn}
                            onPress={() => setShowStartPicker(true)}
                        >
                            <Text style={styles.dateLabel}>From</Text>
                            <Text style={styles.dateValue}>
                                {startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.dateSeparator}>→</Text>

                        <TouchableOpacity
                            style={styles.dateBtn}
                            onPress={() => setShowEndPicker(true)}
                        >
                            <Text style={styles.dateLabel}>To</Text>
                            <Text style={styles.dateValue}>
                                {endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {showStartPicker && (
                        <DateTimePicker
                            value={startDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onStartDateChange}
                            maximumDate={endDate}
                        />
                    )}

                    {showEndPicker && (
                        <DateTimePicker
                            value={endDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onEndDateChange}
                            minimumDate={startDate}
                            maximumDate={new Date()}
                        />
                    )}
                </View>

                {/* Category Filter */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {allCategories.map((cat) => {
                            const isSelected = selectedCategory === cat.id;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.categoryBtn,
                                        isSelected && styles.categoryBtnActive
                                    ]}
                                    onPress={() => setSelectedCategory(cat.id)}
                                >
                                    <MaterialIcons
                                        name={cat.icon}
                                        size={18}
                                        color={isSelected ? '#fff' : cat.color}
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text style={[
                                        styles.categoryLabel,
                                        isSelected && styles.categoryLabelActive
                                    ]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Summary Preview */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Export Summary</Text>
                    <View style={styles.summaryCard}>
                        {summary ? (
                            <>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Total Expenses</Text>
                                    <Text style={styles.summaryValue}>{summary.count}</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Total Amount</Text>
                                    <Text style={styles.summaryAmount}>₹{summary.total?.toLocaleString() || 0}</Text>
                                </View>
                                {summary.byCategory && Object.keys(summary.byCategory).length > 0 && (
                                    <View style={styles.categoryBreakdown}>
                                        <Text style={styles.breakdownTitle}>By Category:</Text>
                                        {Object.entries(summary.byCategory).map(([cat, amount]) => (
                                            <View key={cat} style={styles.breakdownRow}>
                                                <Text style={styles.breakdownLabel}>{cat}</Text>
                                                <Text style={styles.breakdownValue}>₹{amount.toLocaleString()}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </>
                        ) : (
                            <ActivityIndicator color={colors.primary} />
                        )}
                    </View>
                </View>

                {/* Export Buttons */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Export Format</Text>

                    <TouchableOpacity
                        style={[styles.exportBtn, styles.csvBtn]}
                        onPress={() => handleExport('csv')}
                        disabled={loading}
                    >
                        <Text style={styles.exportIcon}>📄</Text>
                        <View style={styles.exportInfo}>
                            <Text style={styles.exportTitle}>CSV Spreadsheet</Text>
                            <Text style={styles.exportDesc}>Open in Excel, Google Sheets</Text>
                        </View>
                        <Text style={styles.exportArrow}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.exportBtn, styles.pdfBtn]}
                        onPress={() => handleExport('pdf')}
                        disabled={loading}
                    >
                        <Text style={styles.exportIcon}>📑</Text>
                        <View style={styles.exportInfo}>
                            <Text style={styles.exportTitle}>PDF Report</Text>
                            <Text style={styles.exportDesc}>Formatted document for sharing</Text>
                        </View>
                        <Text style={styles.exportArrow}>→</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Preparing export...</Text>
                </View>
            )}
        </View>
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
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    backBtn: {
        fontSize: 16,
        color: colors.primary,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.headerText,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 12,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateBtn: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
    },
    dateLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    dateValue: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text,
    },
    dateSeparator: {
        fontSize: 20,
        color: colors.textMuted,
        marginHorizontal: 12,
    },
    categoryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginRight: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    categoryBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    categoryIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    categoryLabel: {
        fontSize: 13,
        color: colors.text,
    },
    categoryLabelActive: {
        color: '#fff',
        fontWeight: '600',
    },
    summaryCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    summaryAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },
    categoryBreakdown: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    breakdownTitle: {
        fontSize: 12,
        color: colors.textMuted,
        marginBottom: 8,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    breakdownLabel: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    breakdownValue: {
        fontSize: 13,
        color: colors.text,
    },
    exportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    exportIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    exportInfo: {
        flex: 1,
    },
    exportTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    exportDesc: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    exportArrow: {
        fontSize: 20,
        color: colors.primary,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 12,
        fontSize: 16,
    },
});

export default ExportScreen;
