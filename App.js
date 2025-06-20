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

export default function AppStack() {
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