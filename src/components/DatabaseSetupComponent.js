// src/components/DatabaseSetupComponent.js
// TEMPORARY COMPONENT - Remove after setup is complete
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Divider, TextInput } from 'react-native-paper';
import { 
  runFullDatabaseSetup,
  createRolesCollection,
  updateExistingUsers,
  createSystemAdmin,
  checkSetupStatus 
} from '../utils/databaseSetup';
import { Colors } from '../constants/Colors';

export default function DatabaseSetupComponent() {
  const [setupStatus, setSetupStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const status = await checkSetupStatus();
      setSetupStatus(status);
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const handleFullSetup = async () => {
    Alert.alert(
      'Confirm Database Setup',
      'This will create roles collection and update all users. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: async () => {
            setLoading(true);
            try {
              const result = await runFullDatabaseSetup();
              if (result.success) {
                Alert.alert('Success!', result.message);
                await checkStatus(); // Refresh status
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCreateRoles = async () => {
    setLoading(true);
    try {
      const result = await createRolesCollection();
      if (result.success) {
        Alert.alert('Success!', result.message);
        await checkStatus();
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsers = async () => {
    setLoading(true);
    try {
      const result = await updateExistingUsers();
      if (result.success) {
        Alert.alert('Success!', result.message);
        await checkStatus();
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!adminEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    Alert.alert(
      'Create System Admin',
      `Make ${adminEmail} a system administrator?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create Admin', 
          onPress: async () => {
            setLoading(true);
            try {
              const result = await createSystemAdmin(adminEmail.trim());
              if (result.success) {
                Alert.alert('Success!', result.message);
                setAdminEmail('');
                await checkStatus();
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            🛠️ Database Setup Tool
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Set up role-based authentication system
          </Text>
        </Card.Content>
      </Card>

      {/* Status Card */}
      {setupStatus && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              📊 Current Status
            </Text>
            
            <View style={styles.statusRow}>
              <Text>Roles Collection:</Text>
              <Text style={setupStatus.rolesCollection ? styles.success : styles.error}>
                {setupStatus.rolesCollection ? '✅ Created' : '❌ Missing'}
              </Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text>Total Users:</Text>
              <Text>{setupStatus.totalUsers}</Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text>Users with New Structure:</Text>
              <Text style={styles.success}>
                {setupStatus.usersWithNewStructure}/{setupStatus.totalUsers}
              </Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text>Setup Complete:</Text>
              <Text style={setupStatus.setupComplete ? styles.success : styles.error}>
                {setupStatus.setupComplete ? '✅ Yes' : '❌ No'}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Setup Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            🚀 Setup Actions
          </Text>
          
          <Button
            mode="contained"
            onPress={handleFullSetup}
            loading={loading}
            disabled={loading}
            style={[styles.button, { backgroundColor: Colors.primary }]}
            contentStyle={styles.buttonContent}
          >
            🎯 Run Full Setup (Recommended)
          </Button>
          
          <Divider style={styles.divider} />
          
          <Text variant="bodyMedium" style={styles.manualTitle}>
            Manual Steps:
          </Text>
          
          <Button
            mode="outlined"
            onPress={handleCreateRoles}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            1️⃣ Create Roles Collection
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleUpdateUsers}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            2️⃣ Update Existing Users
          </Button>
        </Card.Content>
      </Card>

      {/* Create System Admin */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            👑 Create System Admin
          </Text>
          <Text variant="bodyMedium" style={styles.adminNote}>
            Enter the email of an existing user to make them a system administrator:
          </Text>
          
          <TextInput
            label="Admin Email"
            value={adminEmail}
            onChangeText={setAdminEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="admin@example.com"
            left={<TextInput.Icon icon="shield-crown" />}
          />
          
          <Button
            mode="contained"
            onPress={handleCreateAdmin}
            loading={loading}
            disabled={loading || !adminEmail.trim()}
            style={[styles.button, { backgroundColor: '#d32f2f' }]}
            contentStyle={styles.buttonContent}
          >
            👑 Make System Admin
          </Button>
        </Card.Content>
      </Card>

      {/* Instructions */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            📋 Instructions
          </Text>
          
          <Text variant="bodyMedium" style={styles.instruction}>
            1. Click "Run Full Setup" to automatically create roles and update users
          </Text>
          <Text variant="bodyMedium" style={styles.instruction}>
            2. Create a system admin using an existing user's email
          </Text>
          <Text variant="bodyMedium" style={styles.instruction}>
            3. Test the system by logging in with different roles
          </Text>
          <Text variant="bodyMedium" style={styles.instruction}>
            4. Remove this component after setup is complete
          </Text>
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
    marginBottom: 8
  },
  subtitle: {
    textAlign: 'center',
    color: '#666'
  },
  sectionTitle: {
    color: Colors.primary,
    marginBottom: 16
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4
  },
  success: {
    color: '#4caf50',
    fontWeight: 'bold'
  },
  error: {
    color: '#f44336',
    fontWeight: 'bold'
  },
  button: {
    marginBottom: 12
  },
  buttonContent: {
    paddingVertical: 8
  },
  divider: {
    marginVertical: 16
  },
  manualTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#666'
  },
  input: {
    marginBottom: 16
  },
  adminNote: {
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic'
  },
  instruction: {
    marginBottom: 8,
    lineHeight: 20
  },
  bottomPadding: {
    height: 40
  }
});