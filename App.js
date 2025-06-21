// App.js - COMPLETE MOBILE FIX (Keep Your Full Structure)
// ⚠️ CRITICAL: This import MUST be at the very top for mobile to work
import 'react-native-gesture-handler';

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { Platform, Alert } from 'react-native';

// Fixed imports for root App.js file
import { Colors } from './src/constants/Colors';
import { auth } from './src/constants/firebaseConfig';

// Import screens with correct paths
import HomeScreen from './src/screens/app/HomeScreen';
import CourtsScreen from './src/screens/app/CourtsScreen';
import BookCourtScreen from './src/screens/app/BookCourtScreen';
import MyBookingsScreen from './src/screens/app/MyBookingsScreen';
import ProfileScreen from './src/screens/app/ProfileScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import LoadingScreen from './src/components/LoadingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack for login/register
function AuthStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#f5f5f5' }
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Main Tabs Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Courts') iconName = 'sports-soccer';
          else if (route.name === 'MyBookings') iconName = 'event';
          else if (route.name === 'Profile') iconName = 'person';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'One Touch' }} />
      <Tab.Screen name="Courts" component={CourtsScreen} options={{ title: 'Available Courts' }} />
      <Tab.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'My Bookings' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// App Stack for authenticated users
function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="BookCourt" 
        component={BookCourtScreen}
        options={({ route }) => ({
          title: `Book ${route.params?.court?.courtNumber || 'Court'}`,
          headerBackTitle: 'Courts',
        })}
      />
    </Stack.Navigator>
  );
}

// Main App Component - Enhanced for Mobile Compatibility
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🎾 One Touch App - Starting...');
    console.log('📱 Platform:', Platform.OS);
    
    // Enhanced Firebase initialization check for mobile
    if (!auth) {
      console.error('❌ Firebase auth not initialized');
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Firebase Error', 
          'Firebase authentication not initialized. Please check your configuration.',
          [{ text: 'OK' }]
        );
      }
      setLoading(false);
      return;
    }

    console.log('🔥 Setting up Firebase auth listener...');
    
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('🔥 Auth state changed:', user ? `User: ${user.email}` : 'No user');
        setUser(user);
        setLoading(false);
      }, (error) => {
        console.error('🔥 Firebase auth error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // Show user-friendly error on mobile
        if (Platform.OS !== 'web') {
          Alert.alert(
            'Authentication Error',
            `Firebase error: ${error.message}`,
            [{ text: 'OK' }]
          );
        }
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Critical error setting up Firebase:', error);
      if (Platform.OS !== 'web') {
        Alert.alert(
          'App Error',
          'Failed to initialize authentication. Please restart the app.',
          [{ text: 'OK' }]
        );
      }
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <PaperProvider>
        <LoadingScreen />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <NavigationContainer>
        {user ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
    </PaperProvider>
  );
}