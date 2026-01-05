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
    Share
} from 'react-native';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../constants/categories';

const GroupDetailScreen = ({ route, navigation }) => {
    const { group: initialGroup } = route.params;
    const { colors } = useTheme();
    const { user } = useAuth();
    const [group, setGroup] = useState(initialGroup);
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expenseModalVisible, setExpenseModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('expenses');

    // Expense form state
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Other');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [pendingPayments, setPendingPayments] = useState([]);
    const [splitType, setSplitType] = useState('equal'); // 'equal', 'percentage', 'exact'
    const [customSplits, setCustomSplits] = useState({}); // {userId: value}


    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [expenseRes, balanceRes, groupRes, pendingRes] = await Promise.all([
                api.get(`/groups/${group._id}/expenses`),
                api.get(`/groups/${group._id}/balances`),
                api.get(`/groups/${group._id}`),
                api.get(`/groups/${group._id}/pending`)
            ]);
            setExpenses(expenseRes.data);
            setBalances(balanceRes.data);
            setGroup(groupRes.data);
            setPendingPayments(pendingRes.data);
            // Initialize selected members to all members
            setSelectedMembers(groupRes.data.members.map(m => m.user._id));
        } catch (error) {
            console.error('Error fetching group data:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, []);

    const addExpense = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Error', 'Please enter a description');
            return;
        }
        if (selectedMembers.length === 0) {
            Alert.alert('Error', 'Please select at least one member to split with');
            return;
        }

        // Validate custom splits
        if (splitType === 'percentage') {
            const totalPercent = selectedMembers.reduce((sum, id) => sum + (parseFloat(customSplits[id]) || 0), 0);
            if (Math.abs(totalPercent - 100) > 0.01) {
                Alert.alert('Error', `Percentages must total 100%. Current: ${totalPercent.toFixed(1)}%`);
                return;
            }
        } else if (splitType === 'exact') {
            const totalExact = selectedMembers.reduce((sum, id) => sum + (parseFloat(customSplits[id]) || 0), 0);
            if (Math.abs(totalExact - parseFloat(amount)) > 0.01) {
                Alert.alert('Error', `Amounts must total ₹${amount}. Current: ₹${totalExact.toFixed(2)}`);
                return;
            }
        }

        setSaving(true);
        try {
            let splits = null;
            if (splitType === 'percentage') {
                splits = selectedMembers.map(id => ({
                    user: id,
                    percentage: parseFloat(customSplits[id]) || 0
                }));
            } else if (splitType === 'exact') {
                splits = selectedMembers.map(id => ({
                    user: id,
                    amount: parseFloat(customSplits[id]) || 0
                }));
            }

            await api.post(`/groups/${group._id}/expenses`, {
                amount: parseFloat(amount),
                description: description.trim(),
                category: selectedCategory,
                splitType: splitType,
                selectedMembers: splitType === 'equal' ? selectedMembers : undefined,
                splits: splits
            });

            await fetchData();
            setExpenseModalVisible(false);
            resetExpenseForm();
        } catch (error) {
            Alert.alert('Error', 'Failed to add expense');
        } finally {
            setSaving(false);
        }
    };

    const resetExpenseForm = () => {
        setAmount('');
        setDescription('');
        setSelectedCategory('Other');
        setSplitType('equal');
        setCustomSplits({});
    };

    const updateCustomSplit = (userId, value) => {
        setCustomSplits(prev => ({
            ...prev,
            [userId]: value
        }));
    };

    const initializeEqualSplits = () => {
        if (splitType === 'percentage' && selectedMembers.length > 0) {
            const equalPercent = (100 / selectedMembers.length).toFixed(1);
            const newSplits = {};
            selectedMembers.forEach(id => {
                newSplits[id] = equalPercent;
            });
            setCustomSplits(newSplits);
        } else if (splitType === 'exact' && selectedMembers.length > 0 && amount) {
            const equalAmount = (parseFloat(amount) / selectedMembers.length).toFixed(2);
            const newSplits = {};
            selectedMembers.forEach(id => {
                newSplits[id] = equalAmount;
            });
            setCustomSplits(newSplits);
        }
    };


    const toggleMemberSelection = (memberId) => {
        setSelectedMembers(prev => {
            if (prev.includes(memberId)) {
                return prev.filter(id => id !== memberId);
            } else {
                return [...prev, memberId];
            }
        });
    };

    const markAsPaid = async (expenseId, userId, userName) => {
        Alert.alert(
            'Mark as Paid',
            `Mark ${userName}'s payment as received?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            await api.put(`/groups/${group._id}/expenses/${expenseId}/mark-paid`, {
                                userId
                            });
                            await fetchData();
                            Alert.alert('Success', 'Payment marked as received!');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to update payment status');
                        }
                    }
                }
            ]
        );
    };

    const sendReminder = async (userInfo) => {
        try {
            const message = `Hi ${userInfo.user.name}! 👋\n\nJust a friendly reminder that you owe ₹${userInfo.totalOwed.toFixed(2)} for expenses in our "${group.name}" group.\n\nExpenses:\n${userInfo.expenses.map(e => `• ${e.description}: ₹${e.amount}`).join('\n')}\n\nPlease settle up when you can! 🙏`;

            await Share.share({
                message
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to send reminder');
        }
    };

    const handleSettle = async (debt) => {
        Alert.alert(
            'Settle Up',
            `Record payment of ₹${debt.amount} to ${debt.to.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            await api.post(`/groups/${group._id}/settle`, {
                                toUser: debt.to._id,
                                amount: debt.amount
                            });
                            await fetchData();
                            Alert.alert('Success', 'Settlement recorded!');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to record settlement');
                        }
                    }
                }
            ]
        );
    };

    const shareInviteCode = async () => {
        try {
            await Share.share({
                message: `Join my expense group "${group.name}" on PocketExpense+!\n\nInvite Code: ${group.inviteCode}`,
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to share');
        }
    };

    const leaveGroup = () => {
        Alert.alert(
            'Leave Group',
            'Are you sure you want to leave this group?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/groups/${group._id}/leave`);
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to leave group');
                        }
                    }
                }
            ]
        );
    };

    const styles = createStyles(colors);

    const renderExpenseItem = ({ item }) => {
        const isPayer = item.paidBy._id === user?._id;
        const mySplit = item.splits.find(s => s.user._id === user?._id);

        return (
            <View style={styles.expenseCard}>
                <View style={styles.expenseHeader}>
                    <Text style={styles.expenseDesc}>{item.description}</Text>
                    <Text style={styles.expenseAmount}>₹{item.amount.toLocaleString()}</Text>
                </View>
                <View style={styles.expenseDetails}>
                    <Text style={styles.expensePaidBy}>
                        {isPayer ? 'You paid' : `${item.paidBy.name} paid`}
                    </Text>
                    <Text style={styles.expenseDate}>
                        {new Date(item.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short'
                        })}
                    </Text>
                </View>
                {!isPayer && mySplit && (
                    <Text style={styles.youOwe}>
                        You owe ₹{mySplit.amount.toFixed(2)}
                    </Text>
                )}
            </View>
        );
    };

    const renderBalanceItem = ({ item }) => {
        const isMe = item.user._id === user?._id;
        const netBalance = item.netBalance;

        return (
            <View style={styles.balanceCard}>
                <View style={styles.balanceUser}>
                    <View style={styles.balanceAvatar}>
                        <Text style={styles.balanceAvatarText}>
                            {item.user.name?.charAt(0).toUpperCase() || '?'}
                        </Text>
                    </View>
                    <Text style={styles.balanceName}>
                        {isMe ? 'You' : item.user.name}
                    </Text>
                </View>
                <Text style={[
                    styles.balanceAmount,
                    netBalance > 0 && styles.balancePositive,
                    netBalance < 0 && styles.balanceNegative
                ]}>
                    {netBalance > 0 ? '+' : ''}₹{netBalance.toFixed(2)}
                </Text>
            </View>
        );
    };

    const renderDebtItem = ({ item }) => {
        const isFromMe = item.from._id === user?._id;

        return (
            <View style={styles.debtCard}>
                <View style={styles.debtInfo}>
                    <Text style={styles.debtText}>
                        {isFromMe ? 'You owe' : `${item.from.name} owes`}{' '}
                        <Text style={styles.debtAmount}>₹{item.amount}</Text>
                        {' to '}
                        {item.to._id === user?._id ? 'you' : item.to.name}
                    </Text>
                </View>
                {isFromMe && (
                    <TouchableOpacity
                        style={styles.settleBtn}
                        onPress={() => handleSettle(item)}
                    >
                        <Text style={styles.settleBtnText}>Settle</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

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
                <View style={styles.headerCenter}>
                    <Text style={styles.headerIcon}>{group.icon}</Text>
                    <Text style={styles.title}>{group.name}</Text>
                </View>
                <TouchableOpacity onPress={shareInviteCode}>
                    <Text style={styles.shareBtn}>Share</Text>
                </TouchableOpacity>
            </View>

            {/* Invite Code Banner */}
            <View style={styles.inviteBanner}>
                <Text style={styles.inviteLabel}>Invite Code</Text>
                <Text style={styles.inviteCode}>{group.inviteCode}</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'expenses' && styles.tabActive]}
                    onPress={() => setActiveTab('expenses')}
                >
                    <Text style={[styles.tabText, activeTab === 'expenses' && styles.tabTextActive]}>
                        Expenses
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'balances' && styles.tabActive]}
                    onPress={() => setActiveTab('balances')}
                >
                    <Text style={[styles.tabText, activeTab === 'balances' && styles.tabTextActive]}>
                        Balances
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'reminders' && styles.tabActive]}
                    onPress={() => setActiveTab('reminders')}
                >
                    <Text style={[styles.tabText, activeTab === 'reminders' && styles.tabTextActive]}>
                        Remind {pendingPayments.length > 0 ? `(${pendingPayments.length})` : ''}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'members' && styles.tabActive]}
                    onPress={() => setActiveTab('members')}
                >
                    <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
                        Members
                    </Text>
                </TouchableOpacity>
            </View>


            {/* Content */}
            {activeTab === 'expenses' && (
                <FlatList
                    data={expenses}
                    keyExtractor={(item) => item._id}
                    renderItem={renderExpenseItem}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📝</Text>
                            <Text style={styles.emptyText}>No expenses yet</Text>
                        </View>
                    }
                    ListHeaderComponent={
                        balances && (
                            <View style={styles.totalCard}>
                                <Text style={styles.totalLabel}>Total Expenses</Text>
                                <Text style={styles.totalAmount}>
                                    ₹{balances.totalExpenses?.toLocaleString() || 0}
                                </Text>
                            </View>
                        )
                    }
                />
            )}

            {activeTab === 'balances' && (
                <ScrollView
                    style={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    <Text style={styles.sectionTitle}>Net Balances</Text>
                    {balances?.balances?.map((item) => (
                        <View key={item.user._id}>
                            {renderBalanceItem({ item })}
                        </View>
                    ))}

                    {balances?.debts?.length > 0 && (
                        <>
                            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                                Settle Up
                            </Text>
                            {balances.debts.map((item, index) => (
                                <View key={index}>
                                    {renderDebtItem({ item })}
                                </View>
                            ))}
                        </>
                    )}

                    {balances?.debts?.length === 0 && (
                        <View style={styles.settledState}>
                            <Text style={styles.settledIcon}>✅</Text>
                            <Text style={styles.settledText}>All settled up!</Text>
                        </View>
                    )}
                </ScrollView>
            )}

            {activeTab === 'reminders' && (
                <ScrollView
                    style={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    <Text style={styles.sectionTitle}>Pending Payments</Text>

                    {pendingPayments.length === 0 ? (
                        <View style={styles.settledState}>
                            <Text style={styles.settledIcon}>🎉</Text>
                            <Text style={styles.settledText}>Everyone has paid!</Text>
                        </View>
                    ) : (
                        pendingPayments.map((pending) => (
                            <View key={pending.user._id} style={styles.pendingCard}>
                                <View style={styles.pendingHeader}>
                                    <View style={styles.pendingUser}>
                                        <View style={styles.pendingAvatar}>
                                            <Text style={styles.pendingAvatarText}>
                                                {pending.user.name?.charAt(0).toUpperCase() || '?'}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text style={styles.pendingName}>{pending.user.name}</Text>
                                            <Text style={styles.pendingEmail}>{pending.user.email}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.pendingTotal}>₹{pending.totalOwed.toFixed(2)}</Text>
                                </View>

                                <View style={styles.pendingExpenses}>
                                    {pending.expenses.map((exp, idx) => (
                                        <View key={idx} style={styles.pendingExpenseRow}>
                                            <Text style={styles.pendingExpenseDesc}>{exp.description}</Text>
                                            <View style={styles.pendingExpenseActions}>
                                                <Text style={styles.pendingExpenseAmount}>₹{exp.amount}</Text>
                                                <TouchableOpacity
                                                    style={styles.markPaidBtn}
                                                    onPress={() => markAsPaid(exp.expenseId, pending.user._id, pending.user.name)}
                                                >
                                                    <Text style={styles.markPaidText}>✓ Paid</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={styles.reminderBtn}
                                    onPress={() => sendReminder(pending)}
                                >
                                    <Text style={styles.reminderBtnText}>📩 Send Reminder</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}

            {activeTab === 'members' && (

                <ScrollView style={styles.scrollContent}>
                    <Text style={styles.sectionTitle}>
                        {group.memberCount} Member{group.memberCount !== 1 ? 's' : ''}
                    </Text>
                    {group.members?.map((member) => (
                        <View key={member.user._id} style={styles.memberCard}>
                            <View style={styles.memberAvatar}>
                                <Text style={styles.memberAvatarText}>
                                    {member.user.name?.charAt(0).toUpperCase() || '?'}
                                </Text>
                            </View>
                            <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>
                                    {member.user._id === user?._id ? 'You' : member.user.name}
                                </Text>
                                <Text style={styles.memberEmail}>{member.user.email}</Text>
                            </View>
                            {member.role === 'admin' && (
                                <View style={styles.adminBadge}>
                                    <Text style={styles.adminText}>Admin</Text>
                                </View>
                            )}
                        </View>
                    ))}

                    <TouchableOpacity
                        style={styles.leaveBtn}
                        onPress={leaveGroup}
                    >
                        <Text style={styles.leaveBtnText}>Leave Group</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}

            {/* Add Expense FAB */}
            {activeTab === 'expenses' && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setExpenseModalVisible(true)}
                >
                    <Text style={styles.fabText}>+ Add Expense</Text>
                </TouchableOpacity>
            )}

            {/* Add Expense Modal */}
            <Modal
                visible={expenseModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setExpenseModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Expense</Text>
                            <TouchableOpacity onPress={() => setExpenseModalVisible(false)}>
                                <Text style={styles.closeBtn}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>

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

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="What's this for?"
                                    placeholderTextColor={colors.textMuted}
                                    value={description}
                                    onChangeText={setDescription}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Category</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {CATEGORIES.map((cat) => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[
                                                styles.categoryBtn,
                                                selectedCategory === cat.id && styles.categoryBtnActive
                                            ]}
                                            onPress={() => setSelectedCategory(cat.id)}
                                        >
                                            <Text style={styles.categoryIcon}>{cat.icon}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Split With ({selectedMembers.length} selected)</Text>
                                <View style={styles.memberSelectGrid}>
                                    {group.members?.map((member) => (
                                        <TouchableOpacity
                                            key={member.user._id}
                                            style={[
                                                styles.memberSelectBtn,
                                                selectedMembers.includes(member.user._id) && styles.memberSelectBtnActive
                                            ]}
                                            onPress={() => toggleMemberSelection(member.user._id)}
                                        >
                                            <Text style={styles.memberSelectAvatar}>
                                                {member.user.name?.charAt(0).toUpperCase() || '?'}
                                            </Text>
                                            <Text style={[
                                                styles.memberSelectName,
                                                selectedMembers.includes(member.user._id) && styles.memberSelectNameActive
                                            ]} numberOfLines={1}>
                                                {member.user._id === user?._id ? 'You' : member.user.name?.split(' ')[0]}
                                            </Text>
                                            {selectedMembers.includes(member.user._id) && (
                                                <Text style={styles.checkMark}>✓</Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Split Type Selector */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Split Type</Text>
                                <View style={styles.splitTypeRow}>
                                    <TouchableOpacity
                                        style={[styles.splitTypeBtn, splitType === 'equal' && styles.splitTypeBtnActive]}
                                        onPress={() => setSplitType('equal')}
                                    >
                                        <Text style={[styles.splitTypeText, splitType === 'equal' && styles.splitTypeTextActive]}>
                                            Equal
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.splitTypeBtn, splitType === 'percentage' && styles.splitTypeBtnActive]}
                                        onPress={() => {
                                            setSplitType('percentage');
                                            setTimeout(initializeEqualSplits, 0);
                                        }}
                                    >
                                        <Text style={[styles.splitTypeText, splitType === 'percentage' && styles.splitTypeTextActive]}>
                                            Percentage
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.splitTypeBtn, splitType === 'exact' && styles.splitTypeBtnActive]}
                                        onPress={() => {
                                            setSplitType('exact');
                                            setTimeout(initializeEqualSplits, 0);
                                        }}
                                    >
                                        <Text style={[styles.splitTypeText, splitType === 'exact' && styles.splitTypeTextActive]}>
                                            Exact ₹
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Custom Split Inputs */}
                            {splitType !== 'equal' && selectedMembers.length > 0 && (
                                <View style={styles.formGroup}>
                                    <View style={styles.customSplitHeader}>
                                        <Text style={styles.label}>
                                            {splitType === 'percentage' ? 'Enter Percentages' : 'Enter Amounts'}
                                        </Text>
                                        <TouchableOpacity onPress={initializeEqualSplits}>
                                            <Text style={styles.equalizeBtn}>Split Equally</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {group.members?.filter(m => selectedMembers.includes(m.user._id)).map((member) => (
                                        <View key={member.user._id} style={styles.customSplitRow}>
                                            <Text style={styles.customSplitName}>
                                                {member.user._id === user?._id ? 'You' : member.user.name}
                                            </Text>
                                            <View style={styles.customSplitInputWrap}>
                                                {splitType === 'exact' && <Text style={styles.currencyPrefix}>₹</Text>}
                                                <TextInput
                                                    style={styles.customSplitInput}
                                                    placeholder="0"
                                                    placeholderTextColor={colors.textMuted}
                                                    value={customSplits[member.user._id]?.toString() || ''}
                                                    onChangeText={(val) => updateCustomSplit(member.user._id, val)}
                                                    keyboardType="decimal-pad"
                                                />
                                                {splitType === 'percentage' && <Text style={styles.percentSuffix}>%</Text>}
                                            </View>
                                        </View>
                                    ))}
                                    <View style={styles.splitTotalRow}>
                                        <Text style={styles.splitTotalLabel}>Total:</Text>
                                        <Text style={[
                                            styles.splitTotalValue,
                                            splitType === 'percentage' &&
                                            Math.abs(selectedMembers.reduce((s, id) => s + (parseFloat(customSplits[id]) || 0), 0) - 100) > 0.01
                                            && styles.splitTotalError,
                                            splitType === 'exact' && amount &&
                                            Math.abs(selectedMembers.reduce((s, id) => s + (parseFloat(customSplits[id]) || 0), 0) - parseFloat(amount)) > 0.01
                                            && styles.splitTotalError
                                        ]}>
                                            {splitType === 'percentage'
                                                ? `${selectedMembers.reduce((s, id) => s + (parseFloat(customSplits[id]) || 0), 0).toFixed(1)}%`
                                                : `₹${selectedMembers.reduce((s, id) => s + (parseFloat(customSplits[id]) || 0), 0).toFixed(2)}`
                                            }
                                            {splitType === 'percentage' && ' (should be 100%)'}
                                            {splitType === 'exact' && amount && ` (should be ₹${amount})`}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Split Info for Equal */}
                            {splitType === 'equal' && (
                                <View style={styles.splitInfo}>
                                    <Text style={styles.splitText}>
                                        Split equally among {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''}
                                    </Text>
                                    {amount && selectedMembers.length > 0 && (
                                        <Text style={styles.splitAmount}>
                                            ₹{(parseFloat(amount) / selectedMembers.length).toFixed(2)} each
                                        </Text>
                                    )}
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                                onPress={addExpense}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Add Expense</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                </View>
            </Modal>

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
        paddingBottom: 16,
        paddingHorizontal: 20,
    },
    backBtn: {
        fontSize: 16,
        color: colors.primary,
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        fontSize: 24,
        marginRight: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.headerText,
    },
    shareBtn: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    inviteBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.primary + '15',
        padding: 12,
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 8,
    },
    inviteLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    inviteCode: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
        letterSpacing: 2,
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
    },
    tabText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    tabTextActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    listContent: {
        paddingVertical: 12,
        paddingBottom: 100,
    },
    scrollContent: {
        flex: 1,
        padding: 16,
    },
    totalCard: {
        backgroundColor: colors.surface,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    totalAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: 4,
    },
    expenseCard: {
        backgroundColor: colors.surface,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 12,
    },
    expenseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    expenseDesc: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
    },
    expenseDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    expensePaidBy: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    expenseDate: {
        fontSize: 13,
        color: colors.textMuted,
    },
    youOwe: {
        fontSize: 13,
        color: colors.danger,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 12,
    },
    balanceCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    balanceUser: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    balanceAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    balanceAvatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    balanceName: {
        fontSize: 16,
        color: colors.text,
    },
    balanceAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textSecondary,
    },
    balancePositive: {
        color: colors.success,
    },
    balanceNegative: {
        color: colors.danger,
    },
    debtCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    debtInfo: {
        flex: 1,
    },
    debtText: {
        fontSize: 14,
        color: colors.text,
    },
    debtAmount: {
        fontWeight: 'bold',
        color: colors.primary,
    },
    settleBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginLeft: 12,
    },
    settleBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    settledState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    settledIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    settledText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    memberAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    memberAvatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    memberInfo: {
        flex: 1,
        marginLeft: 12,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    memberEmail: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    adminBadge: {
        backgroundColor: colors.warning + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    adminText: {
        color: colors.warning,
        fontSize: 12,
        fontWeight: '600',
    },
    leaveBtn: {
        marginTop: 24,
        padding: 16,
        alignItems: 'center',
    },
    leaveBtnText: {
        color: colors.danger,
        fontSize: 16,
        fontWeight: '500',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 28,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    fabText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
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
        maxHeight: '80%',
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
    categoryBtn: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
        marginRight: 8,
    },
    categoryBtnActive: {
        backgroundColor: colors.primary + '30',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    categoryIcon: {
        fontSize: 24,
    },
    splitInfo: {
        backgroundColor: colors.surfaceVariant,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    splitText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    splitAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
        marginTop: 4,
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
    // Member selection styles
    memberSelectGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    memberSelectBtn: {
        alignItems: 'center',
        padding: 8,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
        width: 70,
        position: 'relative',
    },
    memberSelectBtnActive: {
        backgroundColor: colors.primary + '30',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    memberSelectAvatar: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },
    memberSelectName: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 4,
    },
    memberSelectNameActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    checkMark: {
        position: 'absolute',
        top: 4,
        right: 4,
        fontSize: 12,
        color: colors.success,
        fontWeight: 'bold',
    },
    // Pending payments styles
    pendingCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    pendingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    pendingUser: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pendingAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.danger + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    pendingAvatarText: {
        color: colors.danger,
        fontSize: 16,
        fontWeight: 'bold',
    },
    pendingName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    pendingEmail: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    pendingTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.danger,
    },
    pendingExpenses: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 12,
    },
    pendingExpenseRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    pendingExpenseDesc: {
        fontSize: 14,
        color: colors.text,
        flex: 1,
    },
    pendingExpenseActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pendingExpenseAmount: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    markPaidBtn: {
        backgroundColor: colors.success + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    markPaidText: {
        color: colors.success,
        fontSize: 12,
        fontWeight: '600',
    },
    reminderBtn: {
        backgroundColor: colors.warning + '20',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    reminderBtnText: {
        color: colors.warning,
        fontSize: 14,
        fontWeight: '600',
    },
    // Split type selector styles
    splitTypeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    splitTypeBtn: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 8,
        alignItems: 'center',
    },
    splitTypeBtnActive: {
        backgroundColor: colors.primary,
    },
    splitTypeText: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    splitTypeTextActive: {
        color: '#fff',
    },
    // Custom split input styles
    customSplitHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    equalizeBtn: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    customSplitRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    customSplitName: {
        fontSize: 14,
        color: colors.text,
        flex: 1,
    },
    customSplitInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceVariant,
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    customSplitInput: {
        width: 60,
        paddingVertical: 8,
        fontSize: 16,
        color: colors.text,
        textAlign: 'center',
    },
    currencyPrefix: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    percentSuffix: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    splitTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        marginTop: 4,
    },
    splitTotalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    splitTotalValue: {
        fontSize: 14,
        color: colors.success,
        fontWeight: '600',
    },
    splitTotalError: {
        color: colors.danger,
    },
});

export default GroupDetailScreen;


