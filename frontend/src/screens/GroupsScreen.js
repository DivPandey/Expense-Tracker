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
    ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';

// Material Icons names for groups
const GROUP_ICONS = ['group', 'home', 'flight', 'restaurant', 'celebration', 'work', 'school', 'fitness-center', 'directions-car', 'shopping-cart', 'favorite', 'family-restroom'];

const GroupsScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [joinModalVisible, setJoinModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('👥');
    const [inviteCode, setInviteCode] = useState('');

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const response = await api.get('/groups');
            setGroups(response.data);
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchGroups();
        setRefreshing(false);
    }, []);

    const resetForm = () => {
        setName('');
        setDescription('');
        setSelectedIcon('group');
        setInviteCode('');
    };

    const createGroup = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a group name');
            return;
        }

        setSaving(true);
        try {
            await api.post('/groups', {
                name: name.trim(),
                description: description.trim(),
                icon: selectedIcon
            });

            await fetchGroups();
            setModalVisible(false);
            resetForm();
        } catch (error) {
            Alert.alert('Error', 'Failed to create group');
        } finally {
            setSaving(false);
        }
    };

    const joinGroup = async () => {
        if (!inviteCode.trim()) {
            Alert.alert('Error', 'Please enter an invite code');
            return;
        }

        setSaving(true);
        try {
            await api.post(`/groups/join/${inviteCode.trim()}`);
            await fetchGroups();
            setJoinModalVisible(false);
            resetForm();
            Alert.alert('Success', 'Joined group successfully!');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to join group');
        } finally {
            setSaving(false);
        }
    };

    const styles = createStyles(colors);

    const renderGroupCard = ({ item }) => (
        <TouchableOpacity
            style={styles.groupCard}
            onPress={() => navigation.navigate('GroupDetail', { group: item })}
        >
            <View style={styles.groupIcon}>
                <MaterialIcons name={item.icon} size={24} color={colors.primary} />
            </View>
            <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupMembers}>
                    {item.memberCount} member{item.memberCount !== 1 ? 's' : ''}
                </Text>
            </View>
            <Text style={styles.groupArrow}>›</Text>
        </TouchableOpacity>
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
                <Text style={styles.title}>Groups</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={styles.joinBtn}
                        onPress={() => setJoinModalVisible(true)}
                    >
                        <Text style={styles.joinBtnText}>Join</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={styles.addBtnText}>+ New</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={groups}
                keyExtractor={(item) => item._id}
                renderItem={renderGroupCard}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialIcons name="group" size={64} color={colors.textMuted} />
                        <Text style={styles.emptyText}>No groups yet</Text>
                        <Text style={styles.emptySubtext}>
                            Create a group to split expenses with friends
                        </Text>
                        <View style={styles.emptyButtons}>
                            <TouchableOpacity
                                style={styles.createBtn}
                                onPress={() => setModalVisible(true)}
                            >
                                <Text style={styles.createBtnText}>Create Group</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.joinGroupBtn}
                                onPress={() => setJoinModalVisible(true)}
                            >
                                <Text style={styles.joinGroupBtnText}>Join with Code</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }
            />

            {/* Create Group Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create Group</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeBtn}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Group Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Trip to Goa"
                                placeholderTextColor={colors.textMuted}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Description (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="What's this group for?"
                                placeholderTextColor={colors.textMuted}
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Icon</Text>
                            <View style={styles.iconGrid}>
                                {GROUP_ICONS.map((icon) => (
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

                        <TouchableOpacity
                            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                            onPress={createGroup}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveBtnText}>Create Group</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Join Group Modal */}
            <Modal
                visible={joinModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setJoinModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '40%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Join Group</Text>
                            <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
                                <Text style={styles.closeBtn}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Invite Code</Text>
                            <TextInput
                                style={[styles.input, styles.codeInput]}
                                placeholder="ABCD1234"
                                placeholderTextColor={colors.textMuted}
                                value={inviteCode}
                                onChangeText={setInviteCode}
                                autoCapitalize="characters"
                                maxLength={8}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                            onPress={joinGroup}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveBtnText}>Join Group</Text>
                            )}
                        </TouchableOpacity>
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
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.headerText,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    joinBtn: {
        borderWidth: 1,
        borderColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    joinBtnText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
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
    groupCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 12,
    },
    groupIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    groupIconText: {
        fontSize: 24,
    },
    groupInfo: {
        flex: 1,
        marginLeft: 12,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    groupMembers: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    groupArrow: {
        fontSize: 24,
        color: colors.textMuted,
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
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    emptyButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    createBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    createBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    joinGroupBtn: {
        borderWidth: 1,
        borderColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    joinGroupBtnText: {
        color: colors.primary,
        fontSize: 14,
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
        maxHeight: '70%',
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
    codeInput: {
        textAlign: 'center',
        fontSize: 24,
        letterSpacing: 4,
        fontWeight: 'bold',
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
});

export default GroupsScreen;
