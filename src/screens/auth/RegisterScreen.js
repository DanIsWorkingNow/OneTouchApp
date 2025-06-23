// src/screens/auth/RegisterScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../constants/firebaseConfig';
import { Colors } from '../../constants/Colors';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: username,
      });

      // Save user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        username: username,
        email: email,
        role: 'customer',
        createdAt: new Date(),
      });

      Alert.alert('Success', 'Account created successfully!');
      // Navigation will be handled by App.js based on auth state
    } catch (error) {
      Alert.alert('Registration Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ✅ LOGO SECTION */}
      <View style={styles.logoSection}>
        <Image 
          source={require('../../../assets/logo.png')} // ✅ Your logo
          style={styles.logo}
          resizeMode="contain"
        />
        <Text variant="headlineLarge" style={styles.appTitle}>
          OneTouch App
        </Text>
        <Text variant="bodyLarge" style={styles.appSubtitle}>
          Join the Futsal Community
        </Text>
      </View>

      {/* ✅ REGISTER CARD */}
      <Card style={styles.registerCard} mode="elevated">
        <Card.Content style={styles.cardContent}>
          <Text variant="headlineSmall" style={styles.welcomeTitle}>
            Create Account
          </Text>
          <Text variant="bodyMedium" style={styles.welcomeSubtitle}>
            Sign up to book your futsal court
          </Text>

          {/* Username Input */}
          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
            theme={{
              colors: {
                primary: Colors.primary,           // Black focus color
                outline: Colors.outline,           // Gray border
                onSurfaceVariant: Colors.onSurfaceVariant, // Gray text
              }
            }}
          />

          {/* Email Input */}
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
            theme={{
              colors: {
                primary: Colors.primary,           // Black focus color
                outline: Colors.outline,           // Gray border
                onSurfaceVariant: Colors.onSurfaceVariant, // Gray text
              }
            }}
          />

          {/* Password Input */}
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry
            left={<TextInput.Icon icon="lock" />}
            theme={{
              colors: {
                primary: Colors.primary,           // Black focus color
                outline: Colors.outline,           // Gray border
                onSurfaceVariant: Colors.onSurfaceVariant, // Gray text
              }
            }}
          />

          {/* Confirm Password Input */}
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry
            left={<TextInput.Icon icon="lock-check" />}
            theme={{
              colors: {
                primary: Colors.primary,           // Black focus color
                outline: Colors.outline,           // Gray border
                onSurfaceVariant: Colors.onSurfaceVariant, // Gray text
              }
            }}
          />

          {/* Register Button */}
          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.registerButton}
            buttonColor={Colors.primary}         // Black button
            textColor={Colors.onPrimary}         // White text
            contentStyle={styles.buttonContent}
          >
            Sign Up
          </Button>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text variant="bodyMedium" style={styles.loginText}>
              Already have an account?{' '}
            </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              textColor={Colors.primary}         // Black text
              style={styles.loginButton}
            >
              Login
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,     // Light gray background
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  
  // ✅ LOGO SECTION STYLES
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appTitle: {
    fontWeight: 'bold',
    color: Colors.primary,                  // Black title
    marginBottom: 8,
    textAlign: 'center',
  },
  appSubtitle: {
    color: Colors.onSurfaceVariant,         // Gray subtitle
    textAlign: 'center',
    marginBottom: 20,
  },

  // ✅ REGISTER CARD STYLES  
  registerCard: {
    elevation: 8,
    borderRadius: 16,
    backgroundColor: Colors.surface,        // White card
  },
  cardContent: {
    padding: 24,
  },
  welcomeTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: Colors.onSurface,               // Black title
  },
  welcomeSubtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: Colors.onSurfaceVariant,        // Gray subtitle
  },

  // ✅ INPUT STYLES
  input: {
    marginBottom: 16,
    backgroundColor: Colors.surface,        // White input background
  },

  // ✅ BUTTON STYLES
  registerButton: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 8,
    elevation: 3,
  },
  buttonContent: {
    paddingVertical: 8,
  },

  // ✅ LOGIN SECTION
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: Colors.onSurfaceVariant,        // Gray text
  },
  loginButton: {
    marginLeft: -8,
  },
});