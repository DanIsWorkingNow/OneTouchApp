// src/navigation/SystemAdminStack.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// Import or create placeholder screens for system admin
import SystemAdminDashboard from '../screens/admin/SystemAdminDashboard';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import SystemLogsScreen from '../screens/admin/SystemLogsScreen';
import AdminCourtsScreen from '../screens/admin/AdminCourtsScreen';
import ProfileScreen from '../screens/app/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function SystemAdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Users':
              iconName = 'people';
              break;
            case 'Courts':
              iconName = 'sports-soccer';
              break;
            case 'Logs':
              iconName = 'list';
              break;
            default:
              iconName = 'home';
          }
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#d32f2f', // System admin red color
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: '#d32f2f' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={SystemAdminDashboard}
        options={{ title: 'System Dashboard' }}
      />
      <Tab.Screen 
        name="Users" 
        component={UserManagementScreen}
        options={{ title: 'User Management' }}
      />
      <Tab.Screen 
        name="Courts" 
        component={AdminCourtsScreen}
        options={{ title: 'Court Management' }}
      />
      <Tab.Screen 
        name="Logs" 
        component={SystemLogsScreen}
        options={{ title: 'System Logs' }}
      />
    </Tab.Navigator>
  );
}

export default function SystemAdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AdminTabs" 
        component={SystemAdminTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'Admin Profile',
          headerStyle: { backgroundColor: '#d32f2f' },
          headerTintColor: 'white'
        }}
      />
    </Stack.Navigator>
  );
}

// src/navigation/CourtAdminStack.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

// Import or create placeholder screens for court admin
import CourtAdminDashboard from '../screens/courtAdmin/CourtAdminDashboard';
import BookingApprovalScreen from '../screens/courtAdmin/BookingApprovalScreen';
import CourtManagementScreen from '../screens/courtAdmin/CourtManagementScreen';
import AdminReportsScreen from '../screens/courtAdmin/AdminReportsScreen';
import ProfileScreen from '../screens/app/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

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
    </Tab.Navigator>
  );
}

export default function CourtAdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="CourtAdminTabs" 
        component={CourtAdminTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'Admin Profile',
          headerStyle: { backgroundColor: '#1976d2' },
          headerTintColor: 'white'
        }}
      />
    </Stack.Navigator>
  );
}