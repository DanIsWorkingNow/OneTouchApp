// CourtAdminDashboard.js - FIXED VERSION WITH WORKING SIGN OUT

// Add these imports at the top of your file
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, Card, Button, Chip, Divider 
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
// ✅ ADD THESE FIREBASE IMPORTS
import { signOut } from 'firebase/auth';
import { auth } from '../../constants/firebaseConfig';
import { Colors } from '../../constants/Colors';

export default function CourtAdminDashboard({ navigation }) {
  const [stats, setStats] = useState({
    pendingBookings: 3,
    activeCourts: 2,
    totalBookings: 7,
    pendingFeedback: 3,
    urgentIssues: 2,
    resolvedToday: 1
  });
  
  const [feedbackSystemExists, setFeedbackSystemExists] = useState(true);
  const [isSettingUpFeedback, setIsSettingUpFeedback] = useState(false);

  // ✅ ADD SIGN OUT FUNCTIONS
  const handleSignOut = () => {
    Alert.alert(
      'Confirm Sign Out',
      'Are you sure you want to sign out?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: performSignOut 
        }
      ]
    );
  };

  const performSignOut = async () => {
    try {
      console.log('🚪 Signing out user...');
      await signOut(auth);
      console.log('✅ User signed out successfully');
      // Navigation will be handled automatically by AuthContext
    } catch (error) {
      console.error('❌ Sign out error:', error);
      Alert.alert(
        'Sign Out Error', 
        'Failed to sign out. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const setupFeedbackSystem = async () => {
    setIsSettingUpFeedback(true);
    // Simulate setup process
    setTimeout(() => {
      setIsSettingUpFeedback(false);
      setFeedbackSystemExists(true);
      Alert.alert('Success', 'Feedback system has been set up successfully!');
    }, 2000);
  };

  return (
    <ScrollView style={styles.container}>
      {/* ✅ WELCOME SECTION */}
      <Card style={styles.welcomeCard} mode="elevated">
        <Card.Content style={styles.welcomeContent}>
          <View style={styles.welcomeHeader}>
            <MaterialIcons name="admin-panel-settings" size={32} color="#1976d2" />
            <Text variant="headlineSmall" style={styles.welcomeTitle}>
              Welcome, Admin!
            </Text>
          </View>
          <Text variant="bodyMedium" style={styles.welcomeSubtitle}>
            Manage your court operations efficiently
          </Text>
          <View style={styles.roleTag}>
            <Text variant="labelMedium" style={styles.roleText}>
              Court Administrator
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* ✅ QUICK ACTIONS SECTION */}
      <Card style={styles.actionsCard} mode="elevated">
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="flash-on" size={24} color="#ff9800" />
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Quick Actions
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={() => navigation.navigate('Bookings')}
            style={[styles.actionButton, { backgroundColor: '#1976d2' }]}
            textColor="white"
            icon="calendar-check"
            contentStyle={styles.buttonContent}
          >
            Approve Bookings
          </Button>

          <Button
            mode="contained"
            onPress={() => navigation.navigate('Courts')}
            style={[styles.actionButton, { backgroundColor: '#388e3c' }]}
            textColor="white"
            icon="sports-soccer"
            contentStyle={styles.buttonContent}
          >
            Manage Courts
          </Button>

          <Button
            mode="contained"
            onPress={() => navigation.navigate('Reports')}
            style={[styles.actionButton, { backgroundColor: '#f57c00' }]}
            textColor="white"
            icon="bar-chart"
            contentStyle={styles.buttonContent}
          >
            View Reports
          </Button>

          <Divider style={styles.divider} />
          
          {!feedbackSystemExists ? (
            <Button
              mode="contained"
              onPress={setupFeedbackSystem}
              loading={isSettingUpFeedback}
              disabled={isSettingUpFeedback}
              style={[styles.actionButton, { backgroundColor: '#9c27b0' }]}
              textColor="white"
              icon={isSettingUpFeedback ? "sync" : "build"}
              contentStyle={styles.buttonContent}
            >
              {isSettingUpFeedback ? 'Setting Up Feedback System...' : '🚀 Setup Feedback System'}
            </Button>
          ) : (
            <View>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Feedback')}
                style={[styles.actionButton, { backgroundColor: '#9c27b0' }]}
                textColor="white"
                icon="feedback"
                contentStyle={styles.buttonContent}
              >
                Manage Court Feedback
              </Button>
              {stats.pendingFeedback > 0 && (
                <View style={styles.badgeContainer}>
                  <Chip 
                    icon="priority-high" 
                    style={styles.urgentBadge}
                    textStyle={styles.badgeText}
                  >
                    {stats.pendingFeedback} Pending
                  </Chip>
                </View>
              )}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* ✅ QUICK STATS SECTION */}
      <Card style={styles.statsCard} mode="elevated">
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="bar-chart" size={24} color="#4caf50" />
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Quick Stats
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="displaySmall" style={[styles.statNumber, { color: '#1976d2' }]}>
                {stats.pendingBookings}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Pending Bookings
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="displaySmall" style={[styles.statNumber, { color: '#388e3c' }]}>
                {stats.activeCourts}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Active Courts
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="displaySmall" style={[styles.statNumber, { color: '#f57c00' }]}>
                {stats.totalBookings}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Total Bookings
              </Text>
            </View>
          </View>

          <Divider style={styles.statsDivider} />
          
          <Text variant="titleMedium" style={styles.feedbackStatsTitle}>
            📝 Feedback Overview
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="displaySmall" style={[styles.statNumber, { color: '#9c27b0' }]}>
                {stats.pendingFeedback}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Pending Issues
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="displaySmall" style={[styles.statNumber, { color: '#f44336' }]}>
                {stats.urgentIssues}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Urgent Issues
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="displaySmall" style={[styles.statNumber, { color: '#4caf50' }]}>
                {stats.resolvedToday}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Resolved Today
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* ✅ SYSTEM STATUS SECTION */}
      <Card style={styles.statusCard} mode="elevated">
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="verified-user" size={24} color="#4caf50" />
            <Text variant="titleLarge" style={styles.statusTitle}>
              System Status
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <MaterialIcons name="check-circle" size={20} color="#4caf50" />
            <Text style={styles.statusText}>Booking System: Online</Text>
          </View>
          
          <View style={styles.statusItem}>
            <MaterialIcons name="check-circle" size={20} color="#4caf50" />
            <Text style={styles.statusText}>User Management: Active</Text>
          </View>
          
          <View style={styles.statusItem}>
            <MaterialIcons 
              name={feedbackSystemExists ? "check-circle" : "cancel"} 
              size={20} 
              color={feedbackSystemExists ? "#4caf50" : "#f44336"} 
            />
            <Text style={styles.statusText}>
              Feedback System: {feedbackSystemExists ? 'Ready & Operational' : 'Not Configured'}
            </Text>
          </View>
          
          {feedbackSystemExists && (
            <View style={styles.statusItem}>
              <MaterialIcons name="speed" size={20} color="#2196f3" />
              <Text style={styles.statusText}>Performance: Optimized with Indexes</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* ✅ FIXED SIGN OUT SECTION */}
      <Card style={styles.signOutCard} mode="outlined">
        <Card.Content>
          <Button
            mode="outlined"
            onPress={handleSignOut}  // ✅ NOW CONNECTED TO REAL FUNCTION
            style={styles.signOutButton}
            textColor="#f44336"
            icon="logout"
          >
            Sign Out
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  welcomeCard: {
    marginBottom: 16,
    backgroundColor: Colors.surface,
    elevation: 4,
  },
  welcomeContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcomeTitle: {
    marginLeft: 12,
    fontWeight: 'bold',
    color: Colors.onSurface,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    color: Colors.onSurfaceVariant,
    marginBottom: 12,
  },
  roleTag: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: 'white',
    fontWeight: '600',
  },
  actionsCard: {
    marginBottom: 16,
    backgroundColor: Colors.surface,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 8,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 8,
  },
  badgeContainer: {
    position: 'absolute',
    top: -8,
    right: 8,
    zIndex: 1,
  },
  urgentBadge: {
    backgroundColor: '#ff5722',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
  },
  statsCard: {
    marginBottom: 16,
    backgroundColor: Colors.surface,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  statsDivider: {
    marginVertical: 16,
  },
  feedbackStatsTitle: {
    fontWeight: '600',
    color: Colors.onSurface,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusCard: {
    marginBottom: 16,
    backgroundColor: Colors.surface,
    elevation: 4,
  },
  statusTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: Colors.onSurface,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 8,
    color: Colors.onSurface,
  },
  signOutCard: {
    marginBottom: 20,
    borderColor: '#f44336',
  },
  signOutButton: {
    borderColor: '#f44336',
  },
});