// src/navigation/CourtAdminStack.js - FIXED VERSION
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// Import screens
import CourtAdminDashboard from '../screens/courtAdmin/CourtAdminDashboard';
import FeedbackManagementScreen from '../screens/courtAdmin/FeedbackManagementScreen';
import BookingApprovalScreen from '../screens/courtAdmin/BookingApprovalScreen';
import CourtManagementScreen from '../screens/courtAdmin/CourtManagementScreen';
import AdminReportsScreen from '../screens/courtAdmin/AdminReportScreen';
import ProfileScreen from '../screens/app/ProfileScreen';

// SINGLE DECLARATION - Fix for redeclaration errors  
const CourtStack = createStackNavigator();
const CourtTab = createBottomTabNavigator();

// Court Admin Tab Navigator
function CourtAdminTabs() {
  return (
    <CourtTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Bookings':
              iconName = 'event-note';
              break;
            case 'Courts':
              iconName = 'sports';
              break;
              case 'Feedback':          // 🆕 ADD THIS CASE
              iconName = 'rate-review';
              break;
            case 'Reports':
              iconName = 'bar-chart';
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
      <CourtTab.Screen 
        name="Dashboard" 
        component={CourtAdminDashboard}
        options={{ title: 'Court Admin' }}
      />
<CourtTab.Screen 
  name="Feedback" 
  component={FeedbackManagementScreen}  // 🆕 This connects the screen
  options={{ 
    title: 'Court Feedback',
    tabBarBadge: 2  // Optional: shows pending count
  }}
/>
      <CourtTab.Screen 
        name="Bookings" 
        component={BookingApprovalScreen}
        options={{ title: 'Approve Bookings' }}
      />
      <CourtTab.Screen 
        name="Courts" 
        component={CourtManagementScreen}
        options={{ title: 'Manage Courts' }}
      />
      <CourtTab.Screen 
        name="Reports" 
        component={AdminReportsScreen}
        options={{ title: 'Reports' }}
      />
    </CourtTab.Navigator>
  );
}

// Main Court Admin Stack Navigator
export default function CourtAdminStack() {
  return (
    <CourtStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1976d2' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <CourtStack.Screen 
        name="CourtAdminTabs" 
        component={CourtAdminTabs}
        options={{ headerShown: false }}
      />
      <CourtStack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'Admin Profile',
          headerStyle: { backgroundColor: '#1976d2' },
          headerTintColor: 'white'
        }}
      />
    </CourtStack.Navigator>
  );
}