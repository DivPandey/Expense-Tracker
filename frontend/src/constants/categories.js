export const CATEGORIES = [
    { id: 'Food', label: 'Food', icon: '🍔', color: '#FF6B6B' },
    { id: 'Transport', label: 'Transport', icon: '🚗', color: '#4ECDC4' },
    { id: 'Shopping', label: 'Shopping', icon: '🛍️', color: '#45B7D1' },
    { id: 'Bills', label: 'Bills', icon: '📄', color: '#96CEB4' },
    { id: 'Entertainment', label: 'Entertainment', icon: '🎬', color: '#DDA0DD' },
    { id: 'Health', label: 'Health', icon: '💊', color: '#98D8C8' },
    { id: 'Other', label: 'Other', icon: '📦', color: '#F7DC6F' }
];

export const PAYMENT_METHODS = [
    { id: 'Cash', label: 'Cash', icon: '💵' },
    { id: 'Card', label: 'Card', icon: '💳' },
    { id: 'UPI', label: 'UPI', icon: '📱' },
    { id: 'NetBanking', label: 'Net Banking', icon: '🏦' }
];

export const getCategoryById = (id) => {
    return CATEGORIES.find(cat => cat.id === id) || CATEGORIES[6];
};

export const getPaymentMethodById = (id) => {
    return PAYMENT_METHODS.find(pm => pm.id === id) || PAYMENT_METHODS[0];
};
