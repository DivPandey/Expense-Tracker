import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

const NotificationsScreen = ({ navigation }) => {
    const {
        notifications,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotifications();
    const { colors } = useTheme();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleNotificationPress = async (notification) => {
        // Mark as read
        if (!notification.read) {
            await markAsRead(notification._id);
        }

        // Navigate based on notification type
        if (notification.type === 'payment-reminder' && notification.data?.groupId) {
            navigation.navigate('GroupDetail', { groupId: notification.data.groupId });
        }
    };

    const handleDelete = (notificationId) => {
        Alert.alert(
            'Delete Notification',
            'Are you sure you want to delete this notification?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteNotification(notificationId)
                }
            ]
        );
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'payment-reminder':
                return 'payment';
            case 'budget-alert':
                return 'warning';
            case 'insight':
                return 'lightbulb';
            case 'group-invite':
                return 'group-add';
            case 'expense-added':
                return 'receipt';
            default:
                return 'notifications';
        }
    };

    const renderNotification = ({ item }) => {
        const styles = createStyles(colors);
        const isUnread = !item.read;

        return (
            <TouchableOpacity
                style={[styles.notificationCard, isUnread && styles.unreadCard]}
                onPress={() => handleNotificationPress(item)}
            >
                <View style={[styles.iconContainer, { backgroundColor: item.type === 'payment-reminder' ? colors.primary + '20' : colors.surfaceVariant }]}>
                    <MaterialIcons
                        name={getNotificationIcon(item.type)}
                        size={24}
                        color={item.type === 'payment-reminder' ? colors.primary : colors.textSecondary}
                    />
                </View>

                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={[styles.title, isUnread && styles.unreadTitle]}>
                            {item.title}
                        </Text>
                        <TouchableOpacity
                            onPress={() => handleDelete(item._id)}
                            style={styles.deleteBtn}
                        >
                            <MaterialIcons name="close" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                    <Text style={styles.time}>
                        {new Date(item.createdAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
                </View>

                {isUnread && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
        );
    };

    const styles = createStyles(colors);

    return (
        <View style={styles.container}>
            <View style={styles.screenHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.headerText} />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Notifications</Text>
                {notifications.some(n => !n.read) && (
                    <TouchableOpacity onPress={markAllAsRead}>
                        <Text style={styles.markAllRead}>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={notifications}
                keyExtractor={item => item._id}
                renderItem={renderNotification}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchNotifications} />
                }
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialIcons name="notifications-none" size={64} color={colors.textMuted} />
                        <Text style={styles.emptyText}>No notifications</Text>
                        <Text style={styles.emptySubtext}>You're all caught up!</Text>
                    </View>
                }
            />
        </View>
    );
};

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    screenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.header,
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    screenTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.headerText,
        flex: 1,
        marginLeft: 16,
    },
    markAllRead: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    unreadCard: {
        backgroundColor: colors.primary + '08',
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
    },
    unreadTitle: {
        fontWeight: '700',
    },
    deleteBtn: {
        padding: 4,
    },
    message: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 8,
        lineHeight: 20,
    },
    time: {
        fontSize: 12,
        color: colors.textMuted,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        position: 'absolute',
        right: 16,
        top: '50%',
        marginTop: -4,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
    },
});

export default NotificationsScreen;
