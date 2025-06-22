// src/screens/admin/SystemAdminDashboard.js
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, Chip } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../constants/firebaseConfig';
import { SystemAdminOnly } from '../../components/ProtectedRoute';

export default function SystemAdminDashboard({ navigation }) {
  const { getUserDisplayInfo, userPermissions } = useAuth();
  const userInfo = getUserDisplayInfo();

  return (
    <SystemAdminOnly>
      <ScrollView style={styles.container}>
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              🏛️ System Administrator Dashboard
            </Text>
            <Text variant="bodyLarge">
              Welcome back, {userInfo?.name}!
            </Text>
            <Chip 
              icon="shield-crown" 
              style={styles.roleChip}
              textStyle={{ color: 'white' }}
            >
              System Administrator
            </Chip>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              🔧 System Management
            </Text>
            <View style={styles.buttonGrid}>
              <Button 
                mode="contained" 
                style={[styles.adminButton, { backgroundColor: '#d32f2f' }]}
                onPress={() => navigation.navigate('Users')}
              >
                👥 Manage Users
              </Button>
              <Button 
                mode="contained" 
                style={[styles.adminButton, { backgroundColor: '#1976d2' }]}
                onPress={() => navigation.navigate('Courts')}
              >
                🏟️ Manage Courts
              </Button>
              <Button 
                mode="contained" 
                style={[styles.adminButton, { backgroundColor: '#388e3c' }]}
                onPress={() => navigation.navigate('Logs')}
              >
                📋 System Logs
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              🔑 Your Permissions
            </Text>
            <View style={styles.permissionGrid}>
              {Object.entries(userPermissions).map(([permission, hasIt]) => (
                <Chip 
                  key={permission}
                  style={[styles.permissionChip, { 
                    backgroundColor: hasIt ? '#4caf50' : '#f44336' 
                  }]}
                  textStyle={{ color: 'white', fontSize: 12 }}
                >
                  {hasIt ? '✅' : '❌'} {permission}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Button 
              mode="outlined" 
              onPress={() => signOut(auth)}
              style={styles.signOutButton}
            >
              Sign Out
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SystemAdminOnly>
  );
}

// src/screens/admin/UserManagementScreen.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { SystemAdminOnly } from '../../components/ProtectedRoute';

export default function UserManagementScreen() {
  return (
    <SystemAdminOnly>
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              👥 User Management
            </Text>
            <Text variant="bodyLarge" style={styles.description}>
              Manage all system users, roles, and permissions
            </Text>
            
            <Text variant="bodyMedium" style={styles.comingSoon}>
              🚧 Coming Soon - This screen will include:
            </Text>
            <Text variant="bodySmall" style={styles.featureList}>
              • View all users{'\n'}
              • Create new admin accounts{'\n'}
              • Modify user roles{'\n'}
              • Suspend/activate accounts{'\n'}
              • Reset user passwords{'\n'}
              • View user activity logs
            </Text>
          </Card.Content>
        </Card>
      </View>
    </SystemAdminOnly>
  );
}

// src/screens/courtAdmin/CourtAdminDashboard.js
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, Chip } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { CourtAdminOnly } from '../../components/ProtectedRoute';

export default function CourtAdminDashboard({ navigation }) {
  const { getUserDisplayInfo, userPermissions } = useAuth();
  const userInfo = getUserDisplayInfo();

  return (
    <CourtAdminOnly>
      <ScrollView style={styles.container}>
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              🏢 Court Administrator Dashboard
            </Text>
            <Text variant="bodyLarge">
              Welcome back, {userInfo?.name}!
            </Text>
            <Chip 
              icon="shield-account" 
              style={[styles.roleChip, { backgroundColor: '#1976d2' }]}
              textStyle={{ color: 'white' }}
            >
              Court Administrator
            </Chip>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              🏟️ Court Management
            </Text>
            <View style={styles.buttonGrid}>
              <Button 
                mode="contained" 
                style={[styles.adminButton, { backgroundColor: '#1976d2' }]}
                onPress={() => navigation.navigate('Bookings')}
              >
                📅 Approve Bookings
              </Button>
              <Button 
                mode="contained" 
                style={[styles.adminButton, { backgroundColor: '#388e3c' }]}
                onPress={() => navigation.navigate('Courts')}
              >
                🏟️ Manage Courts
              </Button>
              <Button 
                mode="contained" 
                style={[styles.adminButton, { backgroundColor: '#ff9800' }]}
                onPress={() => navigation.navigate('Reports')}
              >
                📊 View Reports
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </CourtAdminOnly>
  );
}

// src/screens/courtAdmin/BookingApprovalScreen.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { CourtAdminOnly } from '../../components/ProtectedRoute';

export default function BookingApprovalScreen() {
  return (
    <CourtAdminOnly>
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              📅 Booking Approval
            </Text>
            <Text variant="bodyLarge" style={styles.description}>
              Review and approve pending court bookings
            </Text>
            
            <Text variant="bodyMedium" style={styles.comingSoon}>
              🚧 Coming Soon - This screen will include:
            </Text>
            <Text variant="bodySmall" style={styles.featureList}>
              • View pending bookings{'\n'}
              • Approve/reject bookings{'\n'}
              • Add approval notes{'\n'}
              • Send notifications to users{'\n'}
              • View booking history{'\n'}
              • Generate booking reports
            </Text>
          </Card.Content>
        </Card>
      </View>
    </CourtAdminOnly>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
  },
  welcomeCard: {
    marginBottom: 16,
    elevation: 3
  },
  card: {
    marginBottom: 16,
    elevation: 3
  },
  title: {
    color: '#1976d2',
    textAlign: 'center',
    marginBottom: 16
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666'
  },
  sectionTitle: {
    color: '#1976d2',
    marginBottom: 16
  },
  roleChip: {
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: '#d32f2f'
  },
  buttonGrid: {
    gap: 12
  },
  adminButton: {
    paddingVertical: 8,
    marginBottom: 8
  },
  permissionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  permissionChip: {
    marginBottom: 4
  },
  signOutButton: {
    marginTop: 20
  },
  comingSoon: {
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#ff9800'
  },
  featureList: {
    lineHeight: 20,
    color: '#666',
    paddingLeft: 10
  }
});