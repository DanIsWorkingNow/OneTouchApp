// src/screens/courtAdmin/CourtAdminDashboard.js
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, Chip } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../constants/firebaseConfig';
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
            <Text variant="bodyLarge" style={styles.welcome}>
              Welcome back, {userInfo?.name}!
            </Text>
            <Chip 
              icon="shield-account" 
              style={styles.roleChip}
              textStyle={{ color: 'white' }}
            >
              Court Administrator
            </Chip>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              🏟️ Quick Actions
            </Text>
            <View style={styles.buttonGrid}>
              <Button 
                mode="contained" 
                style={[styles.actionButton, { backgroundColor: '#1976d2' }]}
                onPress={() => navigation.navigate('Bookings')}
                icon="event"
              >
                Approve Bookings
              </Button>
              <Button 
                mode="contained" 
                style={[styles.actionButton, { backgroundColor: '#388e3c' }]}
                onPress={() => navigation.navigate('Courts')}
                icon="sports-soccer"
              >
                Manage Courts
              </Button>
              <Button 
                mode="contained" 
                style={[styles.actionButton, { backgroundColor: '#ff9800' }]}
                onPress={() => navigation.navigate('Reports')}
                icon="analytics"
              >
                View Reports
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              📊 Quick Stats
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statNumber}>12</Text>
                <Text variant="bodyMedium" style={styles.statLabel}>Pending Bookings</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statNumber}>8</Text>
                <Text variant="bodyMedium" style={styles.statLabel}>Active Courts</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statNumber}>156</Text>
                <Text variant="bodyMedium" style={styles.statLabel}>Total Bookings</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Button 
              mode="outlined" 
              onPress={() => signOut(auth)}
              style={styles.signOutButton}
              icon="logout"
            >
              Sign Out
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
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
  welcome: {
    textAlign: 'center',
    marginBottom: 8
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
    backgroundColor: '#1976d2'
  },
  buttonGrid: {
    gap: 12
  },
  actionButton: {
    paddingVertical: 8,
    marginBottom: 8
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap'
  },
  statItem: {
    alignItems: 'center',
    minWidth: 80
  },
  statNumber: {
    color: '#1976d2',
    fontWeight: 'bold'
  },
  statLabel: {
    color: '#666',
    textAlign: 'center'
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
    paddingLeft: 10,
    marginBottom: 20
  }
});