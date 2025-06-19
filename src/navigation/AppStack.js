// src/navigation/AppStack.js
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

// Main Stack Navigator
export default function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Main tabs */}
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
      
      {/* Booking flow screens */}
      <Stack.Screen 
        name="BookCourt" 
        component={BookCourtScreen}
        options={({ route }) => ({
          title: `Book ${route.params?.court?.courtNumber || 'Court'}`,
          headerBackTitle: 'Courts',
        })}
      />
      
      {/* Future screens (for Phase 3 & 4) */}
      <Stack.Screen 
        name="CourtDetails" 
        component={CourtsScreen} // Placeholder for now
        options={({ route }) => ({
          title: route.params?.court?.courtNumber || 'Court Details',
          headerBackTitle: 'Courts',
        })}
      />
      
      <Stack.Screen 
        name="FindOpponent" 
        component={MyBookingsScreen} // Placeholder for now
        options={{
          title: 'Find Opponent',
          headerBackTitle: 'Bookings',
        }}
      />
    </Stack.Navigator>
  );
}