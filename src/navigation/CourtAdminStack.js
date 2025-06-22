// src/navigation/CourtAdminStack.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// Import your existing screens (reuse where possible)
import ProfileScreen from '../screens/app/ProfileScreen';

// Import or create court admin specific screens
// You can create these as placeholder screens initially
import CourtAdminDashboard from '../screens/courtAdmin/CourtAdminDashboard';
import BookingApprovalScreen from '../screens/courtAdmin/BookingApprovalScreen';
import CourtManagementScreen from '../screens/courtAdmin/CourtManagementScreen';
import AdminReportsScreen from '../screens/courtAdmin/AdminReportsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Court Admin Tab Navigator
function CourtAdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Bookings':
              iconName = 'event';
              break;
            case 'Courts':
              iconName = 'sports-soccer';
              break;
            case 'Reports':
              iconName = 'analytics';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'home';
          }
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1976d2', // Court admin blue color
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: '#1976d2' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={CourtAdminDashboard}
        options={{ title: 'Court Admin' }}
      />
      <Tab.Screen 
        name="Bookings" 
        component={BookingApprovalScreen}
        options={{ title: 'Approve Bookings' }}
      />
      <Tab.Screen 
        name="Courts" 
        component={CourtManagementScreen}
        options={{ title: 'Manage Courts' }}
      />
      <Tab.Screen 
        name="Reports" 
        component={AdminReportsScreen}
        options={{ title: 'Reports' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Main Court Admin Stack Navigator
export default function CourtAdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1976d2' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="CourtAdminTabs" 
        component={CourtAdminTabs}
        options={{ headerShown: false }}
      />
      {/* Add any additional court admin screens here */}
    </Stack.Navigator>
  );
}