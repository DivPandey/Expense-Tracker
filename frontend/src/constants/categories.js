// Material Icons names - use with @expo/vector-icons MaterialIcons
export const CATEGORIES = [
    { id: 'Food', label: 'Food', icon: 'restaurant', color: '#FF6B6B' },
    { id: 'Transport', label: 'Transport', icon: 'directions-car', color: '#4ECDC4' },
    { id: 'Shopping', label: 'Shopping', icon: 'shopping-bag', color: '#45B7D1' },
    { id: 'Bills', label: 'Bills', icon: 'receipt', color: '#96CEB4' },
    { id: 'Entertainment', label: 'Entertainment', icon: 'movie', color: '#DDA0DD' },
    { id: 'Health', label: 'Health', icon: 'local-hospital', color: '#98D8C8' },
    { id: 'Other', label: 'Other', icon: 'category', color: '#F7DC6F' }
];

export const PAYMENT_METHODS = [
    { id: 'Cash', label: 'Cash', icon: 'payments' },
    { id: 'Card', label: 'Card', icon: 'credit-card' },
    { id: 'UPI', label: 'UPI', icon: 'smartphone' },
    { id: 'NetBanking', label: 'Net Banking', icon: 'account-balance' }
];

export const getCategoryById = (id) => {
    return CATEGORIES.find(cat => cat.id === id) || CATEGORIES[6];
};

export const getPaymentMethodById = (id) => {
    return PAYMENT_METHODS.find(pm => pm.id === id) || PAYMENT_METHODS[0];
};
