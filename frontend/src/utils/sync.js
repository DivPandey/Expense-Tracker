import api from '../api/axios';
import { getPendingSync, clearPendingSync } from './storage';

// Sync pending offline expenses to server
export const syncOfflineExpenses = async () => {
    try {
        const pendingExpenses = await getPendingSync();

        if (pendingExpenses.length === 0) {
            return { synced: 0, success: true };
        }

        // Send all pending expenses to backend
        const response = await api.post('/expenses/sync', { expenses: pendingExpenses });

        // Clear pending queue after successful sync
        await clearPendingSync();

        return {
            synced: response.data.length,
            success: true,
            expenses: response.data
        };
    } catch (error) {
        console.error('Error syncing offline expenses:', error);
        return {
            synced: 0,
            success: false,
            error: error.message
        };
    }
};
