import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const SyncIndicator = ({ isOnline, pendingCount, onSync }) => {
    const { colors } = useTheme();

    if (isOnline && pendingCount === 0) {
        return null;
    }

    const styles = createStyles(colors);

    return (
        <View style={[
            styles.container,
            isOnline ? styles.syncing : styles.offline
        ]}>
            <Text style={styles.icon}>
                {isOnline ? '🔄' : '📴'}
            </Text>
            <Text style={styles.text}>
                {isOnline
                    ? `${pendingCount} expense(s) to sync`
                    : 'Offline mode - expenses saved locally'}
            </Text>
            {isOnline && pendingCount > 0 && (
                <TouchableOpacity style={styles.syncBtn} onPress={onSync}>
                    <Text style={styles.syncBtnText}>Sync Now</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const createStyles = (colors) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 8,
    },
    offline: {
        backgroundColor: colors.danger + '20',
    },
    syncing: {
        backgroundColor: colors.warning + '40',
    },
    icon: {
        fontSize: 18,
        marginRight: 8,
    },
    text: {
        flex: 1,
        fontSize: 13,
        color: colors.text,
    },
    syncBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    syncBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default SyncIndicator;

