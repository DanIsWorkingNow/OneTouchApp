// src/components/RoleTestComponent.js
// TEMPORARY COMPONENT - For testing AuthContext functionality
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Chip, Divider } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { SystemAdminOnly, CourtAdminOnly, ShowToRole, ShowWithPermission } from './ProtectedRoute';
import { signOut } from 'firebase/auth';
import { auth } from '../constants/firebaseConfig';
import { Colors } from '../constants/Colors';

export default function RoleTestComponent() {
  const { 
    user, 
    userRole, 
    userPermissions, 
    isSystemAdmin, 
    isCourtAdmin, 
    isUser,
    isAdminLevel,
    hasPermission,
    getUserDisplayInfo,
    getRoleDisplayName,
    getRoleIcon,
    getRoleColor
  } = useAuth();

  const userInfo = getUserDisplayInfo();

  return (
    <ScrollView style={styles.container}>
      {/* User Info Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            👤 User Information
          </Text>
          
          <View style={styles.infoRow}>
            <Text variant="bodyLarge" style={styles.label}>Email:</Text>
            <Text variant="bodyLarge">{user?.email || 'Not logged in'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text variant="bodyLarge" style={styles.label}>Name:</Text>
            <Text variant="bodyLarge">{userInfo?.name || 'Unknown'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text variant="bodyLarge" style={styles.label}>Role:</Text>
            <Chip 
              icon={getRoleIcon(userRole)}
              style={[styles.roleChip, { backgroundColor: getRoleColor(userRole) }]}
              textStyle={{ color: 'white' }}
            >
              {getRoleDisplayName(userRole)}
            </Chip>
          </View>
          
          <View style={styles.infoRow}>
            <Text variant="bodyLarge" style={styles.label}>Status:</Text>
            <Text variant="bodyLarge">{user?.status || 'Unknown'}</Text>
          </View>
        </Card.Content>
      </Card>

     

      {/* Permissions Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            🔑 Permissions
          </Text>
          
          {Object.entries(userPermissions).length > 0 ? (
            Object.entries(userPermissions).map(([permission, hasIt]) => (
              <View key={permission} style={styles.permissionRow}>
                <Text style={styles.permissionName}>{permission}</Text>
                <Text style={hasIt ? styles.success : styles.error}>
                  {hasIt ? '✅' : '❌'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noPermissions}>No permissions found</Text>
          )}
        </Card.Content>
      </Card>

      {/* Protected Content Tests */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            🛡️ Protected Content Tests
          </Text>
          
          <SystemAdminOnly>
            <View style={[styles.protectedBox, { backgroundColor: '#ffebee' }]}>
              <Text style={styles.protectedText}>
                🏛️ System Admin Only Content - You can see this!
              </Text>
            </View>
          </SystemAdminOnly>
          
          <CourtAdminOnly>
            <View style={[styles.protectedBox, { backgroundColor: '#e3f2fd' }]}>
              <Text style={styles.protectedText}>
                🏢 Court Admin Only Content - You can see this!
              </Text>
            </View>
          </CourtAdminOnly>
          
          <ShowToRole role="user">
            <View style={[styles.protectedBox, { backgroundColor: '#e8f5e8' }]}>
              <Text style={styles.protectedText}>
                👤 User Content - You can see this!
              </Text>
            </View>
          </ShowToRole>
          
          <ShowWithPermission permission="canManageUsers">
            <View style={[styles.protectedBox, { backgroundColor: '#fff3e0' }]}>
              <Text style={styles.protectedText}>
                👥 Can Manage Users - You have this permission!
              </Text>
            </View>
          </ShowWithPermission>
          
          <ShowWithPermission permission="canCreateBookings">
            <View style={[styles.protectedBox, { backgroundColor: '#f3e5f5' }]}>
              <Text style={styles.protectedText}>
                📅 Can Create Bookings - You have this permission!
              </Text>
            </View>
          </ShowWithPermission>
        </Card.Content>
      </Card>

      {/* Test Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            🧪 Test Actions
          </Text>
          
          <Button
            mode="outlined"
            onPress={() => {
              console.log('🧪 Permission Test: canManageUsers =', hasPermission('canManageUsers'));
              console.log('🧪 Permission Test: canCreateBookings =', hasPermission('canCreateBookings'));
              console.log('🧪 Role Test: isSystemAdmin =', isSystemAdmin());
            }}
            style={styles.testButton}
          >
            Test Permission Functions
          </Button>
          
          <Button
            mode="contained"
            onPress={() => signOut(auth)}
            style={[styles.testButton, { backgroundColor: '#d32f2f' }]}
          >
            Sign Out & Test Different Role
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
  },
  card: {
    marginBottom: 16,
    elevation: 3
  },
  title: {
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 16
  },
  sectionTitle: {
    color: Colors.primary,
    marginBottom: 16
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4
  },
  label: {
    fontWeight: 'bold',
    flex: 1
  },
  roleChip: {
    flex: 1,
    marginLeft: 8
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 2
  },
  permissionName: {
    flex: 1,
    fontSize: 14
  },
  success: {
    color: '#4caf50',
    fontWeight: 'bold'
  },
  error: {
    color: '#f44336',
    fontWeight: 'bold'
  },
  noPermissions: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic'
  },
  protectedBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  protectedText: {
    textAlign: 'center',
    fontWeight: 'bold'
  },
  testButton: {
    marginBottom: 12
  },
  bottomPadding: {
    height: 40
  }
});