import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import CategoryPicker from '../components/CategoryPicker';
import { PAYMENT_METHODS } from '../constants/categories';
import api from '../api/axios';

const AddExpenseScreen = ({ navigation, route }) => {
    const { addExpense, updateExpense, isOnline } = useExpenses();
    const { colors } = useTheme();
    const existingExpense = route.params?.expense;
    const isEditing = !!existingExpense;

    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Food');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (existingExpense) {
            setAmount(existingExpense.amount.toString());
            setCategory(existingExpense.category);
            setPaymentMethod(existingExpense.paymentMethod);
            setDescription(existingExpense.description || '');
            setDate(new Date(existingExpense.date));
        }
    }, [existingExpense]);

    const handleSave = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        setLoading(true);

        const expenseData = {
            amount: parseFloat(amount),
            category,
            paymentMethod,
            description: description.trim(),
            date: date.toISOString()
        };

        let result;
        if (isEditing) {
            result = await updateExpense(existingExpense._id, expenseData);
        } else {
            result = await addExpense(expenseData);
        }

        setLoading(false);

        if (result.success) {
            if (result.offline) {
                Alert.alert(
                    'Saved Offline',
                    'Expense saved locally and will sync when online',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                navigation.goBack();
            }
        } else {
            Alert.alert('Error', result.error);
        }
    };

    const handleSaveAsTemplate = () => {
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount to save as template');
            return;
        }

        Alert.prompt(
            'Save as Template',
            'Enter a name for this template (e.g., "Daily Coffee")',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Save',
                    onPress: async (templateName) => {
                        if (!templateName?.trim()) {
                            Alert.alert('Error', 'Please enter a template name');
                            return;
                        }
                        try {
                            await api.post('/templates', {
                                name: templateName.trim(),
                                amount: parseFloat(amount),
                                category,
                                paymentMethod,
                                description: description.trim()
                            });
                            Alert.alert('Success', 'Template saved successfully!');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to save template');
                        }
                    }
                }
            ],
            'plain-text',
            description || `${category} expense`
        );
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const styles = createStyles(colors);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelBtn}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{isEditing ? 'Edit Expense' : 'Add Expense'}</Text>
                <View style={{ width: 60 }} />
            </View>

            {!isOnline && (
                <View style={styles.offlineBanner}>
                    <Text style={styles.offlineText}>📴 Offline - will sync when connected</Text>
                </View>
            )}

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                {/* Amount Input */}
                <View style={styles.amountContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                        style={styles.amountInput}
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="decimal-pad"
                        autoFocus={!isEditing}
                    />
                </View>

                {/* Category Picker */}
                <CategoryPicker selected={category} onSelect={setCategory} />

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.label}>Payment Method</Text>
                    <View style={styles.paymentMethods}>
                        {PAYMENT_METHODS.map((method) => {
                            const isActive = paymentMethod === method.id;
                            return (
                                <TouchableOpacity
                                    key={method.id}
                                    style={[
                                        styles.paymentBtn,
                                        isActive && styles.paymentBtnActive
                                    ]}
                                    onPress={() => setPaymentMethod(method.id)}
                                >
                                    <MaterialIcons
                                        name={method.icon}
                                        size={20}
                                        color={isActive ? '#fff' : colors.textSecondary}
                                    />
                                    <Text style={[
                                        styles.paymentLabel,
                                        isActive && styles.paymentLabelActive
                                    ]}>
                                        {method.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.label}>Description (Optional)</Text>
                    <TextInput
                        style={styles.descriptionInput}
                        placeholder="What was this expense for?"
                        placeholderTextColor={colors.textMuted}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={2}
                    />
                </View>

                {/* Date Picker */}
                <View style={styles.section}>
                    <Text style={styles.label}>Date</Text>
                    <TouchableOpacity
                        style={styles.dateBtn}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <MaterialIcons name="calendar-today" size={20} color={colors.primary} style={styles.dateIcon} />
                        <Text style={styles.dateText}>
                            {date.toLocaleDateString('en-IN', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })}
                        </Text>
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDateChange}
                        maximumDate={new Date()}
                    />
                )}

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>
                            {isEditing ? 'Update Expense' : 'Save Expense'}
                        </Text>
                    )}
                </TouchableOpacity>

                {/* Save as Template Button */}
                {!isEditing && (
                    <TouchableOpacity
                        style={styles.templateBtn}
                        onPress={handleSaveAsTemplate}
                    >
                        <Text style={styles.templateBtnText}>📋 Save as Template</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
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
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: colors.header,
    },
    cancelBtn: {
        fontSize: 16,
        color: colors.primary,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.headerText,
    },
    offlineBanner: {
        backgroundColor: colors.warning,
        padding: 10,
        alignItems: 'center',
    },
    offlineText: {
        fontSize: 13,
        color: '#856404',
    },
    form: {
        flex: 1,
        padding: 20,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginBottom: 24,
    },
    currencySymbol: {
        fontSize: 40,
        fontWeight: '300',
        color: colors.text,
        marginRight: 8,
    },
    amountInput: {
        fontSize: 48,
        fontWeight: '600',
        color: colors.text,
        minWidth: 100,
        textAlign: 'center',
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 12,
    },
    paymentMethods: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    paymentBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.surfaceVariant,
        marginHorizontal: 4,
    },
    paymentBtnActive: {
        backgroundColor: colors.primary,
    },
    paymentIcon: {
        fontSize: 24,
        marginBottom: 6,
    },
    paymentLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    paymentLabelActive: {
        color: '#fff',
        fontWeight: '600',
    },
    descriptionInput: {
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: colors.text,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    dateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
        padding: 16,
    },
    dateIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    dateText: {
        fontSize: 16,
        color: colors.text,
    },
    saveBtn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginTop: 24,
    },
    saveBtnDisabled: {
        backgroundColor: colors.textMuted,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    templateBtn: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginTop: 12,
    },
    templateBtnText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '500',
    },
});

export default AddExpenseScreen;


