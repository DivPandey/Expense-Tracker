import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ExpenseListScreen from '../screens/ExpenseListScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import InsightsScreen from '../screens/InsightsScreen';
import BudgetScreen from '../screens/BudgetScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import ExportScreen from '../screens/ExportScreen';
import GoalsScreen from '../screens/GoalsScreen';
import GroupsScreen from '../screens/GroupsScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Modern Tab Icon Component with Material Icons
const TabIcon = ({ icon, label, focused, colors }) => (
    <View style={styles.tabItem}>
        <View style={[
            styles.iconWrapper,
            focused && { backgroundColor: `${colors.primary}20` }
        ]}>
            <MaterialIcons
                name={icon}
                size={24}
                color={focused ? colors.primary : colors.textSecondary}
            />
        </View>
        <Text
            style={[
                styles.tabLabel,
                { color: focused ? colors.primary : colors.textSecondary }
            ]}
            numberOfLines={1}
        >
            {label}
        </Text>
    </View>
);

const MainTabs = () => {
    const { colors } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    ...styles.tabBar,
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                },
                tabBarShowLabel: false,
                tabBarHideOnKeyboard: true,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="home" label="Home" focused={focused} colors={colors} />
                    ),
                }}
            />
            <Tab.Screen
                name="History"
                component={ExpenseListScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="receipt-long" label="History" focused={focused} colors={colors} />
                    ),
                }}
            />
            <Tab.Screen
                name="Stats"
                component={InsightsScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="bar-chart" label="Stats" focused={focused} colors={colors} />
                    ),
                }}
            />
            <Tab.Screen
                name="Budget"
                component={BudgetScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="account-balance-wallet" label="Budget" focused={focused} colors={colors} />
                    ),
                }}
            />
            <Tab.Screen
                name="Goals"
                component={GoalsScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="flag" label="Goals" focused={focused} colors={colors} />
                    ),
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon icon="settings" label="Settings" focused={focused} colors={colors} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

const AuthStack = () => {
    const { colors } = useTheme();

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
            <Stack.Screen
                name="Templates"
                component={TemplatesScreen}
                options={{
                    presentation: 'modal',
                }}
            />
            <Stack.Screen
                name="Export"
                component={ExportScreen}
                options={{
                    presentation: 'modal',
                }}
            />
            <Stack.Screen
                name="Groups"
                component={GroupsScreen}
                options={{
                    presentation: 'modal',
                }}
            />
            <Stack.Screen
                name="GroupDetail"
                component={GroupDetailScreen}
            />
            <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{
                    presentation: 'modal',
                }}
            />
        </Stack.Navigator>
    );
};


const AppNavigator = () => {
    const { isAuthenticated, loading } = useAuth();
    const { colors, isDarkMode } = useTheme();

    // Create custom navigation theme
    const navigationTheme = {
        ...(isDarkMode ? DarkTheme : DefaultTheme),
        colors: {
            ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            primary: colors.primary,
        },
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.header }]}>
                <Text style={styles.loadingText}>💰</Text>
            </View>
        );
    }

    return (
        <NavigationContainer theme={navigationTheme}>
            {isAuthenticated ? <AppStack /> : <AuthStack />}
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 64,
    },
    tabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
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
        minWidth: 50,
        paddingHorizontal: 2,
    },
    iconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    tabIcon: {
        fontSize: 18,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
        letterSpacing: 0.2,
    },
});

export default AppNavigator;


