// src/navigation/AppStack.js - FIXED VERSION
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// Import screens
import HomeScreen from '../screens/app/HomeScreen';
import CourtsScreen from '../screens/app/CourtsScreen';
import BookCourtScreen from '../screens/app/BookCourtScreen';
import MyBookingsScreen from '../screens/app/MyBookingsScreen';
import ProfileScreen from '../screens/app/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for main app screens
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Courts') {
            iconName = 'sports-soccer';
          } else if (route.name === 'MyBookings') {
            iconName = 'event';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: Colors.surface,
          elevation: 8,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'One Touch',
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Courts" 
        component={CourtsScreen}
        options={{
          title: 'Available Courts',
          tabBarLabel: 'Courts',
        }}
      />
      <Tab.Screen 
        name="MyBookings" 
        component={MyBookingsScreen}
        options={{
          title: 'My Bookings',
          tabBarLabel: 'Bookings',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

// Main Stack Navigator - FIXED FOR PROPER SCROLLVIEW LAYOUT
export default function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
          elevation: 0, // Remove shadow that can interfere with layout
          shadowOpacity: 0, // Remove iOS shadow
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        cardStyle: { 
          backgroundColor: '#f5f5f5' // Ensure consistent background
        },
        // CRITICAL FIX: Optimize for ScrollView performance
        gestureEnabled: true,
        cardOverlayEnabled: false,
        animationEnabled: true,
      }}
    >
      {/* Main tabs */}
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ 
          headerShown: false 
        }}
      />
      
      {/* Booking flow screens - FIXED FOR SCROLLVIEW */}
      <Stack.Screen 
        name="BookCourt" 
        component={BookCourtScreen}
        options={({ route }) => ({
          title: `Book ${route.params?.court?.courtNumber || 'Court'}`,
          headerBackTitle: 'Courts',
          // CRITICAL FIXES for ScrollView layout:
          headerTitleContainerStyle: {
            left: 0, // Prevent header from affecting content layout
          },
          headerStyle: {
            backgroundColor: Colors.primary,
            elevation: 2, // Minimal elevation
            shadowOpacity: 0.1,
            height: 56, // Fixed header height
          },
          // Ensure proper content area calculation
          cardStyle: { 
            backgroundColor: '#f5f5f5',
            // CRITICAL: Remove any potential flex conflicts
            flex: 1,
          },
          // Optimize screen transitions for better ScrollView performance
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
        })}
      />
      
      {/* Other screens */}
      <Stack.Screen 
        name="CourtDetails" 
        component={CourtsScreen} // Placeholder for now
        options={({ route }) => ({
          title: route.params?.court?.courtNumber || 'Court Details',
          headerBackTitle: 'Courts',
        })}
      />
    </Stack.Navigator>
  );
}

<Stack.Screen 
  name="BookCourt" 
  component={BookCourtScreen}
  options={({ route }) => ({
    title: `Book ${route.params?.court?.courtNumber || 'Court'}`,
    headerBackTitle: 'Courts',
    // ALTERNATIVE FIX: Remove header completely for this screen
    headerShown: false, // Try this if scrolling still doesn't work
  })}
/>