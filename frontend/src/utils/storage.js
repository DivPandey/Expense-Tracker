import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPENSES_KEY = 'offline_expenses';
const PENDING_SYNC_KEY = 'pending_sync';

// Save expenses locally
export const saveExpensesLocally = async (expenses) => {
    try {
        await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
    } catch (error) {
        console.error('Error saving expenses locally:', error);
    }
};

// Get expenses from local storage
export const getLocalExpenses = async () => {
    try {
        const expenses = await AsyncStorage.getItem(EXPENSES_KEY);
        return expenses ? JSON.parse(expenses) : [];
    } catch (error) {
        console.error('Error getting local expenses:', error);
        return [];
    }
};

// Add expense to pending sync queue
export const addToPendingSync = async (expense) => {
    try {
        const pending = await AsyncStorage.getItem(PENDING_SYNC_KEY);
        const pendingList = pending ? JSON.parse(pending) : [];
        pendingList.push({ ...expense, localId: Date.now().toString() });
        await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pendingList));
        return pendingList;
    } catch (error) {
        console.error('Error adding to pending sync:', error);
        return [];
    }
};

// Get pending sync items
export const getPendingSync = async () => {
    try {
        const pending = await AsyncStorage.getItem(PENDING_SYNC_KEY);
        return pending ? JSON.parse(pending) : [];
    } catch (error) {
        console.error('Error getting pending sync:', error);
        return [];
    }
};

// Clear pending sync items
export const clearPendingSync = async () => {
    try {
        await AsyncStorage.removeItem(PENDING_SYNC_KEY);
    } catch (error) {
        console.error('Error clearing pending sync:', error);
    }
};

// Save user token
export const saveToken = async (token) => {
    try {
        await AsyncStorage.setItem('token', token);
    } catch (error) {
        console.error('Error saving token:', error);
    }
};

// Get user token
export const getToken = async () => {
    try {
        return await AsyncStorage.getItem('token');
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
};

// Save user data
export const saveUser = async (user) => {
    try {
        await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
        console.error('Error saving user:', error);
    }
};

// Get user data
export const getUser = async () => {
    try {
        const user = await AsyncStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
};

// Clear all auth data
export const clearAuthData = async () => {
    try {
        await AsyncStorage.multiRemove(['token', 'user']);
    } catch (error) {
        console.error('Error clearing auth data:', error);
    }
};
