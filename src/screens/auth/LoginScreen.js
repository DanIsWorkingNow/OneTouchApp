import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../constants/firebaseConfig';
import { Colors } from '../../constants/Colors';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Navigation is handled by AuthContext
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message);
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
          Book Your Futsal Court
        </Text>
      </View>

      {/* ✅ LOGIN CARD */}
      <Card style={styles.loginCard} mode="elevated">
        <Card.Content style={styles.cardContent}>
          <Text variant="headlineSmall" style={styles.welcomeTitle}>
            Welcome Back!
          </Text>
          <Text variant="bodyMedium" style={styles.welcomeSubtitle}>
            Hype the futsal again
          </Text>

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
            secureTextEntry
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            theme={{
              colors: {
                primary: Colors.primary,           // Black focus color
                outline: Colors.outline,           // Gray border
                onSurfaceVariant: Colors.onSurfaceVariant, // Gray text
              }
            }}
          />

          {/* Login Button */}
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
            buttonColor={Colors.primary}         // Black button
            textColor={Colors.onPrimary}         // White text
            contentStyle={styles.buttonContent}
          >
            Login
          </Button>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text variant="bodyMedium" style={styles.signupText}>
              Don't have an account?{' '}
            </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Register')}
              textColor={Colors.primary}         // Black text
              style={styles.signupButton}
            >
              Sign Up
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
    marginTop: 40,
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
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

  // ✅ LOGIN CARD STYLES  
  loginCard: {
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
  loginButton: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 8,
    elevation: 3,
  },
  buttonContent: {
    paddingVertical: 8,
  },

  // ✅ SIGNUP SECTION
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: Colors.onSurfaceVariant,        // Gray text
  },
  signupButton: {
    marginLeft: -8,
  },
});