// 🧪 TEMPORARY: Create src/screens/app/TestNotificationsScreen.js
// Use this instead of NotificationsScreen to test if the issue is in your NotificationsScreen component

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function TestNotificationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 Test Notifications Screen</Text>
      <Text style={styles.subtitle}>If you can see this, the tab is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

// ========================================
// Then update your AppStack.js import:
// ========================================
// Change this line:
// import NotificationsScreen from '../screens/app/NotificationsScreen';
// 
// To this:
// import TestNotificationsScreen from '../screens/app/TestNotificationsScreen';
//
// And change the component in Tab.Screen:
// component={TestNotificationsScreen}