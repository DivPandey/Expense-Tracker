import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import GoalCard from '../components/GoalCard';

// Material Icons names for goals
const GOAL_ICONS = ['flag', 'savings', 'home', 'directions-car', 'flight', 'smartphone', 'laptop', 'school', 'favorite', 'fitness-center', 'music-note', 'menu-book'];
const GOAL_COLORS = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#E91E63', '#00BCD4', '#795548', '#607D8B'];

const GoalsScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [contributeModalVisible, setContributeModalVisible] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [deadline, setDeadline] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState('🎯');
    const [selectedColor, setSelectedColor] = useState('#4CAF50');

    // Contribute state
    const [contributeAmount, setContributeAmount] = useState('');
    const [contributeNote, setContributeNote] = useState('');

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            setLoading(true);
            const response = await api.get('/goals');
            setGoals(response.data);
        } catch (error) {
            console.error('Error fetching goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchGoals();
        setRefreshing(false);
    }, []);

    const resetForm = () => {
        setName('');
        setTargetAmount('');
        setDeadline(null);
        setSelectedIcon('flag');
        setSelectedColor('#4CAF50');
        setSelectedGoal(null);
    };

    const openModal = (goal = null) => {
        if (goal) {
            setSelectedGoal(goal);
            setName(goal.name);
            setTargetAmount(goal.targetAmount.toString());
            setDeadline(goal.deadline ? new Date(goal.deadline) : null);
            setSelectedIcon(goal.icon);
            setSelectedColor(goal.color);
        } else {
            resetForm();
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        resetForm();
    };

    const saveGoal = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a goal name');
            return;
        }
        if (!targetAmount || parseFloat(targetAmount) <= 0) {
            Alert.alert('Error', 'Please enter a valid target amount');
            return;
        }

        setSaving(true);
        try {
            const goalData = {
                name: name.trim(),
                targetAmount: parseFloat(targetAmount),
                deadline: deadline ? deadline.toISOString() : null,
                icon: selectedIcon,
                color: selectedColor
            };

            if (selectedGoal) {
                await api.put(`/goals/${selectedGoal._id}`, goalData);
            } else {
                await api.post('/goals', goalData);
            }

            await fetchGoals();
            closeModal();
        } catch (error) {
            Alert.alert('Error', 'Failed to save goal');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (goal) => {
        Alert.alert(
            'Delete Goal',
            `Are you sure you want to delete "${goal.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/goals/${goal._id}`);
                            await fetchGoals();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete goal');
                        }
                    }
                }
            ]
        );
    };

    const openContributeModal = (goal) => {
        setSelectedGoal(goal);
        setContributeAmount('');
        setContributeNote('');
        setContributeModalVisible(true);
    };

    const handleContribute = async () => {
        if (!contributeAmount || parseFloat(contributeAmount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        setSaving(true);
        try {
            await api.post(`/goals/${selectedGoal._id}/contribute`, {
                amount: parseFloat(contributeAmount),
                note: contributeNote.trim()
            });

            await fetchGoals();
            setContributeModalVisible(false);

            const updatedGoal = (await api.get(`/goals/${selectedGoal._id}`)).data;
            if (updatedGoal.isCompleted) {
                Alert.alert('🎉 Congratulations!', `You've reached your goal "${updatedGoal.name}"!`);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to add contribution');
        } finally {
            setSaving(false);
        }
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDeadline(selectedDate);
        }
    };

    const styles = createStyles(colors);

    const renderGoalModal = () => (
        <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={closeModal}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {selectedGoal ? 'Edit Goal' : 'New Savings Goal'}
                        </Text>
                        <TouchableOpacity onPress={closeModal}>
                            <Text style={styles.closeBtn}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Goal Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., New iPhone, Vacation"
                                placeholderTextColor={colors.textMuted}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Target Amount</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="50000"
                                placeholderTextColor={colors.textMuted}
                                value={targetAmount}
                                onChangeText={setTargetAmount}
                                keyboardType="decimal-pad"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Deadline (Optional)</Text>
                            <TouchableOpacity
                                style={styles.dateBtn}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={styles.dateText}>
                                    {deadline
                                        ? deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                        : 'No deadline set'}
                                </Text>
                                {deadline && (
                                    <TouchableOpacity onPress={() => setDeadline(null)}>
                                        <Text style={styles.clearDate}>✕</Text>
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={deadline || new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onDateChange}
                                    minimumDate={new Date()}
                                />
                            )}
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Icon</Text>
                            <View style={styles.iconGrid}>
                                {GOAL_ICONS.map((icon) => (
                                    <TouchableOpacity
                                        key={icon}
                                        style={[
                                            styles.iconBtn,
                                            selectedIcon === icon && styles.iconBtnActive
                                        ]}
                                        onPress={() => setSelectedIcon(icon)}
                                    >
                                        <MaterialIcons name={icon} size={24} color={selectedIcon === icon ? colors.primary : colors.textSecondary} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Color</Text>
                            <View style={styles.colorGrid}>
                                {GOAL_COLORS.map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[
                                            styles.colorBtn,
                                            { backgroundColor: color },
                                            selectedColor === color && styles.colorBtnActive
                                        ]}
                                        onPress={() => setSelectedColor(color)}
                                    />
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                            onPress={saveGoal}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveBtnText}>
                                    {selectedGoal ? 'Update Goal' : 'Create Goal'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {selectedGoal && (
                            <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={() => {
                                    closeModal();
                                    handleDelete(selectedGoal);
                                }}
                            >
                                <Text style={styles.deleteBtnText}>Delete Goal</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    const renderContributeModal = () => (
        <Modal
            visible={contributeModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setContributeModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { maxHeight: '50%' }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add Savings</Text>
                        <TouchableOpacity onPress={() => setContributeModalVisible(false)}>
                            <Text style={styles.closeBtn}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {selectedGoal && (
                        <View style={styles.contributeInfo}>
                            <Text style={styles.contributeGoalName}>
                                <MaterialIcons name={selectedGoal.icon} size={18} color={colors.text} /> {selectedGoal.name}
                            </Text>
                            <Text style={styles.contributeProgress}>
                                ₹{selectedGoal.currentAmount.toLocaleString()} / ₹{selectedGoal.targetAmount.toLocaleString()}
                            </Text>
                        </View>
                    )}

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Amount</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="1000"
                            placeholderTextColor={colors.textMuted}
                            value={contributeAmount}
                            onChangeText={setContributeAmount}
                            keyboardType="decimal-pad"
                            autoFocus
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Note (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Monthly savings"
                            placeholderTextColor={colors.textMuted}
                            value={contributeNote}
                            onChangeText={setContributeNote}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                        onPress={handleContribute}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveBtnText}>Add ₹{contributeAmount || '0'}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const activeGoals = goals.filter(g => !g.isCompleted);
    const completedGoals = goals.filter(g => g.isCompleted);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Savings Goals</Text>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => openModal()}
                >
                    <Text style={styles.addBtnText}>+ New</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={[...activeGoals, ...completedGoals]}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <GoalCard
                        goal={item}
                        onPress={openModal}
                        onContribute={openContributeModal}
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialIcons name="flag" size={64} color={colors.textMuted} />
                        <Text style={styles.emptyText}>No savings goals yet</Text>
                        <Text style={styles.emptySubtext}>
                            Start saving for something special!
                        </Text>
                        <TouchableOpacity
                            style={styles.createBtn}
                            onPress={() => openModal()}
                        >
                            <Text style={styles.createBtnText}>Create Goal</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {renderGoalModal()}
            {renderContributeModal()}
        </View>
    );
};

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.headerText,
    },
    addBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    addBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        paddingVertical: 12,
        paddingBottom: 100,
        flexGrow: 1,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 24,
    },
    createBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    createBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    closeBtn: {
        fontSize: 24,
        color: colors.textMuted,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: colors.text,
    },
    dateBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
        padding: 16,
    },
    dateText: {
        fontSize: 16,
        color: colors.text,
    },
    clearDate: {
        fontSize: 18,
        color: colors.textMuted,
        padding: 4,
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    iconBtn: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
    },
    iconBtnActive: {
        backgroundColor: colors.primary + '30',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    iconText: {
        fontSize: 24,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    colorBtnActive: {
        borderWidth: 3,
        borderColor: colors.text,
    },
    saveBtn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    saveBtnDisabled: {
        backgroundColor: colors.textMuted,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteBtn: {
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    deleteBtnText: {
        color: colors.danger,
        fontSize: 16,
        fontWeight: '500',
    },
    contributeInfo: {
        alignItems: 'center',
        marginBottom: 20,
        padding: 16,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
    },
    contributeGoalName: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    contributeProgress: {
        fontSize: 14,
        color: colors.textSecondary,
    },
});

export default GoalsScreen;
