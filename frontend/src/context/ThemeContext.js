import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext(null);

// Light theme colors
export const lightTheme = {
    background: '#f8f9fa',
    surface: '#ffffff',
    surfaceVariant: '#f5f5f5',
    primary: '#4CAF50',
    primaryDark: '#388E3C',
    secondary: '#2196F3',
    accent: '#FF6B6B',
    text: '#1a1a2e',
    textSecondary: '#666666',
    textMuted: '#888888',
    border: '#eeeeee',
    borderDark: '#dddddd',
    header: '#1a1a2e',
    headerText: '#ffffff',
    card: '#ffffff',
    success: '#4CAF50',
    warning: '#FFC107',
    danger: '#F44336',
    info: '#2196F3',
    overlay: 'rgba(0, 0, 0, 0.5)',
    statusBar: 'dark-content',
};

// Dark theme colors (GitHub-style)
export const darkTheme = {
    background: '#0d1117',
    surface: '#161b22',
    surfaceVariant: '#21262d',
    primary: '#4CAF50',
    primaryDark: '#388E3C',
    secondary: '#58a6ff',
    accent: '#FF6B6B',
    text: '#f0f6fc',
    textSecondary: '#8b949e',
    textMuted: '#6e7681',
    border: '#30363d',
    borderDark: '#21262d',
    header: '#161b22',
    headerText: '#f0f6fc',
    card: '#161b22',
    success: '#3fb950',
    warning: '#d29922',
    danger: '#f85149',
    info: '#58a6ff',
    overlay: 'rgba(0, 0, 0, 0.7)',
    statusBar: 'light-content',
};

const THEME_STORAGE_KEY = '@PocketExpense:theme';

export const ThemeProvider = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [themeMode, setThemeMode] = useState('light'); // 'light', 'dark', 'system'
    const [loading, setLoading] = useState(true);

    // Load saved theme preference on mount
    useEffect(() => {
        loadThemePreference();
    }, []);

    // Update theme when system preference changes (if using system mode)
    useEffect(() => {
        if (themeMode === 'system') {
            setIsDarkMode(systemColorScheme === 'dark');
        }
    }, [systemColorScheme, themeMode]);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme) {
                const { mode } = JSON.parse(savedTheme);
                setThemeMode(mode);
                if (mode === 'system') {
                    setIsDarkMode(systemColorScheme === 'dark');
                } else {
                    setIsDarkMode(mode === 'dark');
                }
            }
        } catch (error) {
            console.error('Error loading theme preference:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveThemePreference = async (mode) => {
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ mode }));
        } catch (error) {
            console.error('Error saving theme preference:', error);
        }
    };

    const toggleTheme = () => {
        const newMode = isDarkMode ? 'light' : 'dark';
        setThemeMode(newMode);
        setIsDarkMode(!isDarkMode);
        saveThemePreference(newMode);
    };

    const setTheme = (mode) => {
        setThemeMode(mode);
        if (mode === 'system') {
            setIsDarkMode(systemColorScheme === 'dark');
        } else {
            setIsDarkMode(mode === 'dark');
        }
        saveThemePreference(mode);
    };

    const colors = isDarkMode ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider value={{
            isDarkMode,
            themeMode,
            colors,
            toggleTheme,
            setTheme,
            loading,
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
