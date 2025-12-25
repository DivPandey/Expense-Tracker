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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useExpenses } from '../context/ExpenseContext';
import CategoryPicker from '../components/CategoryPicker';
import { PAYMENT_METHODS } from '../constants/categories';

const AddExpenseScreen = ({ navigation, route }) => {
    const { addExpense, updateExpense, isOnline } = useExpenses();
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

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

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
                        placeholderTextColor="#999"
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
                        {PAYMENT_METHODS.map((method) => (
                            <TouchableOpacity
                                key={method.id}
                                style={[
                                    styles.paymentBtn,
                                    paymentMethod === method.id && styles.paymentBtnActive
                                ]}
                                onPress={() => setPaymentMethod(method.id)}
                            >
                                <Text style={styles.paymentIcon}>{method.icon}</Text>
                                <Text style={[
                                    styles.paymentLabel,
                                    paymentMethod === method.id && styles.paymentLabelActive
                                ]}>
                                    {method.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.label}>Description (Optional)</Text>
                    <TextInput
                        style={styles.descriptionInput}
                        placeholder="What was this expense for?"
                        placeholderTextColor="#999"
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
                        <Text style={styles.dateIcon}>📅</Text>
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

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: '#1a1a2e',
    },
    cancelBtn: {
        fontSize: 16,
        color: '#4CAF50',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    offlineBanner: {
        backgroundColor: '#fff3cd',
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
        borderBottomColor: '#eee',
        marginBottom: 24,
    },
    currencySymbol: {
        fontSize: 40,
        fontWeight: '300',
        color: '#1a1a2e',
        marginRight: 8,
    },
    amountInput: {
        fontSize: 48,
        fontWeight: '600',
        color: '#1a1a2e',
        minWidth: 100,
        textAlign: 'center',
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a2e',
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
        backgroundColor: '#f5f5f5',
        marginHorizontal: 4,
    },
    paymentBtnActive: {
        backgroundColor: '#4CAF50',
    },
    paymentIcon: {
        fontSize: 24,
        marginBottom: 6,
    },
    paymentLabel: {
        fontSize: 12,
        color: '#666',
    },
    paymentLabelActive: {
        color: '#fff',
        fontWeight: '600',
    },
    descriptionInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#333',
        minHeight: 80,
        textAlignVertical: 'top',
    },
    dateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
    },
    dateIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    dateText: {
        fontSize: 16,
        color: '#333',
    },
    saveBtn: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginTop: 24,
    },
    saveBtnDisabled: {
        backgroundColor: '#aaa',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default AddExpenseScreen;
