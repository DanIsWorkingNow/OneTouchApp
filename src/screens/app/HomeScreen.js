// src/screens/app/HomeScreen.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { signOut } from 'firebase/auth';
import { auth } from '../../constants/firebaseConfig';
import { Colors } from '../../constants/Colors';

export default function HomeScreen() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const user = auth.currentUser;

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        ONE TOUCH APP
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Welcome, {user?.displayName || user?.email}!
      </Text>
      <Text variant="bodyMedium" style={styles.description}>
        🎉 Congratulations! Your app is working perfectly.
      </Text>
      <Text variant="bodyMedium" style={styles.description}>
        Next: We'll add court booking features.
      </Text>
      
      <Button 
        mode="outlined" 
        onPress={handleLogout}
        style={styles.button}
      >
        Logout
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  title: {
    marginBottom: 20,
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    marginBottom: 10,
    textAlign: 'center',
    color: Colors.onBackground,
  },
  button: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
});