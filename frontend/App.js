import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ExpenseProvider } from './src/context/ExpenseContext';
import AppNavigator from './src/navigation/AppNavigator';
import { requestNotificationPermissions } from './src/utils/notifications';

export default function App() {
  // Request notification permissions on app start
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <AuthProvider>
      <ExpenseProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </ExpenseProvider>
    </AuthProvider>
  );
}
