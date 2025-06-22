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