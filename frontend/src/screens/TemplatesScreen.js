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
    ActivityIndicator
} from 'react-native';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import { useExpenses } from '../context/ExpenseContext';
import TemplateCard from '../components/TemplateCard';
import CategoryPicker from '../components/CategoryPicker';
import { PAYMENT_METHODS } from '../constants/categories';

const TemplatesScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { fetchExpenses, fetchInsights } = useExpenses();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Food');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [description, setDescription] = useState('');

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/templates');
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchTemplates();
        setRefreshing(false);
    }, []);

    const resetForm = () => {
        setName('');
        setAmount('');
        setCategory('Food');
        setPaymentMethod('Cash');
        setDescription('');
        setEditingTemplate(null);
    };

    const openModal = (template = null) => {
        if (template) {
            setEditingTemplate(template);
            setName(template.name);
            setAmount(template.amount.toString());
            setCategory(template.category);
            setPaymentMethod(template.paymentMethod);
            setDescription(template.description || '');
        } else {
            resetForm();
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        resetForm();
    };

    const saveTemplate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a template name');
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        setSaving(true);
        try {
            const templateData = {
                name: name.trim(),
                amount: parseFloat(amount),
                category,
                paymentMethod,
                description: description.trim()
            };

            if (editingTemplate) {
                await api.put(`/templates/${editingTemplate._id}`, templateData);
            } else {
                await api.post('/templates', templateData);
            }

            await fetchTemplates();
            closeModal();
        } catch (error) {
            Alert.alert('Error', 'Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Template',
            'Are you sure you want to delete this template?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/templates/${id}`);
                            await fetchTemplates();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete template');
                        }
                    }
                }
            ]
        );
    };

    const handleUse = async (template) => {
        Alert.alert(
            'Use Template',
            `Create expense from "${template.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Create Expense',
                    onPress: async () => {
                        try {
                            await api.post(`/templates/${template._id}/use`);
                            await fetchTemplates();
                            await fetchExpenses();
                            await fetchInsights();
                            Alert.alert('Success', 'Expense created from template!');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to create expense');
                        }
                    }
                }
            ]
        );
    };

    const styles = createStyles(colors);

    const renderModal = () => (
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
                            {editingTemplate ? 'Edit Template' : 'New Template'}
                        </Text>
                        <TouchableOpacity onPress={closeModal}>
                            <Text style={styles.closeBtn}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Template Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Daily Coffee"
                                placeholderTextColor={colors.textMuted}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Amount</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="decimal-pad"
                            />
                        </View>

                        <CategoryPicker selected={category} onSelect={setCategory} />

                        <View style={styles.formGroup}>
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
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Description (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Description"
                                placeholderTextColor={colors.textMuted}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={2}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                            onPress={saveTemplate}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveBtnText}>
                                    {editingTemplate ? 'Update Template' : 'Create Template'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Templates</Text>
                <TouchableOpacity onPress={() => openModal()}>
                    <Text style={styles.addBtn}>+ Add</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={templates}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <TemplateCard
                        template={item}
                        onUse={handleUse}
                        onEdit={openModal}
                        onDelete={handleDelete}
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyText}>No templates yet</Text>
                        <Text style={styles.emptySubtext}>
                            Create templates for recurring expenses
                        </Text>
                        <TouchableOpacity
                            style={styles.createBtn}
                            onPress={() => openModal()}
                        >
                            <Text style={styles.createBtnText}>Create Template</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {renderModal()}
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
    backBtn: {
        fontSize: 16,
        color: colors.primary,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.headerText,
    },
    addBtn: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: '600',
    },
    listContent: {
        paddingVertical: 12,
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
    textArea: {
        minHeight: 60,
        textAlignVertical: 'top',
    },
    paymentMethods: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    paymentBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: colors.surfaceVariant,
        marginHorizontal: 4,
    },
    paymentBtnActive: {
        backgroundColor: colors.primary,
    },
    paymentIcon: {
        fontSize: 24,
    },
    saveBtn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 20,
    },
    saveBtnDisabled: {
        backgroundColor: colors.textMuted,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default TemplatesScreen;
