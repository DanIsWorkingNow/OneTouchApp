// src/navigation/SystemAdminStack.js - FIXED VERSION
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// Import screens
import SystemAdminDashboard from '../screens/admin/SystemAdminDashboard';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import SystemLogsScreen from '../screens/admin/SystemLogsScreen';
import AdminCourtsScreen from '../screens/admin/AdminCourtsScreen';
import ProfileScreen from '../screens/app/ProfileScreen';

// SINGLE DECLARATION - Fix for redeclaration errors
const AdminStack = createStackNavigator();
const AdminTab = createBottomTabNavigator();

// System Admin Tab Navigator
function SystemAdminTabs() {
  return (
    <AdminTab.Navigator
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
              iconName = 'sports';
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
      <AdminTab.Screen 
        name="Dashboard" 
        component={SystemAdminDashboard}
        options={{ title: 'System Dashboard' }}
      />
      <AdminTab.Screen 
        name="Users" 
        component={UserManagementScreen}
        options={{ title: 'User Management' }}
      />
     
      <AdminTab.Screen 
        name="Logs" 
        component={SystemLogsScreen}
        options={{ title: 'System Logs' }}
      />
    </AdminTab.Navigator>
  );
}

// Main System Admin Stack Navigator
export default function SystemAdminStack() {
  return (
    <AdminStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#d32f2f' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <AdminStack.Screen 
        name="AdminTabs" 
        component={SystemAdminTabs}
        options={{ headerShown: false }}
      />
      <AdminStack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'Admin Profile',
          headerStyle: { backgroundColor: '#d32f2f' },
          headerTintColor: 'white'
        }}
      />
    </AdminStack.Navigator>
  );
}