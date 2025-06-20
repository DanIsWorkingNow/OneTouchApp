// src/navigation/AppStack.js - FIXED FOR SCROLLVIEW COMPATIBILITY
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
        headerStyle: { 
          backgroundColor: Colors.primary,
          elevation: 0, // Remove shadow for better ScrollView performance
          shadowOpacity: 0, // Remove iOS shadow
        },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: 'bold' },
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

// Main Stack Navigator - OPTIMIZED FOR SCROLLVIEW
export default function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
          elevation: 0, // Remove shadow that can interfere with ScrollView
          shadowOpacity: 0, // Remove iOS shadow that can affect layout
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        // CRITICAL: Ensure consistent background and no layout conflicts
        cardStyle: { 
          backgroundColor: '#f5f5f5'
        },
        // Optimize for smooth ScrollView performance
        gestureEnabled: true,
        cardOverlayEnabled: false,
        animationEnabled: true,
        // Prevent header from interfering with ScrollView
        headerTransparent: false,
        headerMode: 'screen',
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
      
      {/* BookCourt screen with SIMPLIFIED navigation options */}
      <Stack.Screen 
        name="BookCourt" 
        component={BookCourtScreen}
        options={({ route }) => ({
          title: `Book ${route.params?.court?.courtNumber || 'Court'}`,
          headerBackTitle: 'Courts',
          // SIMPLIFIED header configuration to prevent layout conflicts
          headerStyle: {
            backgroundColor: Colors.primary,
            elevation: 0, // No shadow
            shadowOpacity: 0, // No iOS shadow
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          // Remove any custom card styling that might interfere
          cardStyle: {
            backgroundColor: '#f5f5f5',
          },
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