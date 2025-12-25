import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, Platform } from 'react-native';

import { useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ExpenseListScreen from '../screens/ExpenseListScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import InsightsScreen from '../screens/InsightsScreen';
import BudgetScreen from '../screens/BudgetScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Modern Tab Icon Component - Myntra/Zepto style
const TabIcon = ({ icon, label, focused }) => (
    <View style={styles.tabItem}>
        <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
            <Text style={styles.tabIcon}>{icon}</Text>
        </View>
        <Text
            style={[styles.tabLabel, focused && styles.tabLabelActive]}
            numberOfLines={1}
        >
            {label}
        </Text>
    </View>
);

const MainTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: false,
                tabBarHideOnKeyboard: true,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="🏠" label="Home" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Expenses"
                component={ExpenseListScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="📋" label="History" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Insights"
                component={InsightsScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="📊" label="Stats" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Budget"
                component={BudgetScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="⚙️" label="Settings" focused={focused} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

const AuthStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
};

const AppStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
                name="AddExpense"
                component={AddExpenseScreen}
                options={{
                    presentation: 'modal',
                }}
            />
        </Stack.Navigator>
    );
};

const AppNavigator = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>💰</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? <AppStack /> : <AuthStack />}
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
    },
    loadingText: {
        fontSize: 64,
    },
    tabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        height: Platform.OS === 'ios' ? 85 : 65,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 25 : 8,
        paddingHorizontal: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 15,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 60,
        paddingHorizontal: 4,
    },
    iconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    iconWrapperActive: {
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
    },
    tabIcon: {
        fontSize: 20,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: '#999',
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    tabLabelActive: {
        color: '#4CAF50',
        fontWeight: '700',
    },
});

export default AppNavigator;

