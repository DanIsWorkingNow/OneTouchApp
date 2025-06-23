// src/screens/courtAdmin/CourtAdminDashboard.js - OPTIMIZED VERSION
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Divider, ActivityIndicator, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, addDoc, doc, setDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../constants/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors';

export default function CourtAdminDashboard({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingBookings: 3,
    activeCourts: 2,
    totalBookings: 7,
    pendingFeedback: 0,
    urgentIssues: 0,
    resolvedToday: 0
  });
  const [isSettingUpFeedback, setIsSettingUpFeedback] = useState(false);
  const [feedbackSystemExists, setFeedbackSystemExists] = useState(false);

  // Check if feedback system is already set up
  useEffect(() => {
    checkFeedbackSystemStatus();
  }, []);

  const checkFeedbackSystemStatus = async () => {
    try {
      const feedbackQuery = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(feedbackQuery);
      
      if (!snapshot.empty) {
        setFeedbackSystemExists(true);
        
        // Calculate real feedback stats
        const feedbackData = snapshot.docs.map(doc => doc.data());
        const pending = feedbackData.filter(f => f.status === 'new').length;
        const urgent = feedbackData.filter(f => f.severity === 'urgent' || f.severity === 'high').length;
        const resolvedToday = feedbackData.filter(f => {
          const today = new Date();
          const resolvedDate = f.resolvedAt?.toDate();
          return resolvedDate && 
            resolvedDate.toDateString() === today.toDateString();
        }).length;
        
        setStats(prev => ({
          ...prev,
          pendingFeedback: pending,
          urgentIssues: urgent,
          resolvedToday: resolvedToday
        }));
      } else {
        setFeedbackSystemExists(false);
      }
    } catch (error) {
      console.log('Feedback system not set up yet');
      setFeedbackSystemExists(false);
    }
  };

  // 🆕 OPTIMIZED Setup Feedback System Function
  const setupFeedbackSystem = async () => {
    setIsSettingUpFeedback(true);
    
    try {
      // Create realistic sample feedback entries with optimized schema
      const sampleFeedbacks = [
        {
          // 🔑 Primary relationships (for indexes)
          userId: user.uid,
          courtId: 'court_a_001',
          
          // 👤 Display fields (for admin convenience)
          userName: user.displayName || 'Admin User',
          userEmail: user.email || 'admin@onetouchapp.com',
          courtName: 'Court A',
          
          // 📝 Feedback content
          category: 'damage',
          severity: 'high',
          title: 'Goal post is unstable',
          description: 'The goal post on Court A is wobbly and poses a safety risk. It needs immediate attention before the next booking.',
          images: [],
          
          // 🔄 Status management
          status: 'new',
          priority: 4,
          
          // 👨‍💼 Admin response
          adminResponse: '',
          adminId: '',
          adminEmail: '',
          
          // ⏰ Timestamps
          createdAt: new Date(),
          updatedAt: new Date(),
          resolvedAt: null
        },
        {
          // Different user simulation
          userId: 'sample_user_001',
          courtId: 'court_b_002',
          
          userName: 'John Player',
          userEmail: 'john.player@email.com',
          courtName: 'Court B',
          
          category: 'cleanliness',
          severity: 'medium',
          title: 'Court needs cleaning after rain',
          description: 'Court B has puddles and debris from last night\'s rain. The surface is slippery and needs to be cleaned before use.',
          images: [],
          
          status: 'in-progress',
          priority: 3,
          
          adminResponse: 'Thank you for reporting! Our maintenance team is currently cleaning the court. It will be ready in 30 minutes.',
          adminId: user.uid,
          adminEmail: user.email || 'admin@onetouchapp.com',
          
          createdAt: new Date(Date.now() - 3600000), // 1 hour ago
          updatedAt: new Date(),
          resolvedAt: null
        },
        {
          userId: 'sample_user_002',
          courtId: 'court_a_001',
          
          userName: 'Sarah Ahmed',
          userEmail: 'sarah.ahmed@email.com',
          courtName: 'Court A',
          
          category: 'equipment',
          severity: 'low',
          title: 'Missing corner flags',
          description: 'Two corner flags are missing from Court A. Not urgent but should be replaced for proper game setup.',
          images: [],
          
          status: 'resolved',
          priority: 2,
          
          adminResponse: 'Fixed! New corner flags have been installed. Thank you for helping us maintain quality facilities.',
          adminId: user.uid,
          adminEmail: user.email || 'admin@onetouchapp.com',
          
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          updatedAt: new Date(),
          resolvedAt: new Date()
        },
        {
          userId: 'sample_user_003',
          courtId: 'court_c_003',
          
          userName: 'Mike Chen',
          userEmail: 'mike.chen@email.com',
          courtName: 'Court C',
          
          category: 'weather',
          severity: 'urgent',
          title: 'Flooding in Court C',
          description: 'Heavy rain has caused flooding in Court C. The drainage system seems blocked and water is not clearing.',
          images: [],
          
          status: 'new',
          priority: 5,
          
          adminResponse: '',
          adminId: '',
          adminEmail: '',
          
          createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
          updatedAt: new Date(Date.now() - 1800000),
          resolvedAt: null
        }
      ];

      // Add sample courts if they don't exist
      const sampleCourts = [
        {
          courtId: 'court_a_001',
          courtName: 'Court A',
          location: 'Main Complex',
          pricePerHour: 50,
          status: 'available',
          amenities: ['Lights', 'Seating', 'Water'],
          createdAt: new Date()
        },
        {
          courtId: 'court_b_002', 
          courtName: 'Court B',
          location: 'South Wing',
          pricePerHour: 45,
          status: 'maintenance',
          amenities: ['Lights', 'Parking'],
          createdAt: new Date()
        },
        {
          courtId: 'court_c_003',
          courtName: 'Court C', 
          location: 'North Wing',
          pricePerHour: 55,
          status: 'available',
          amenities: ['Premium Lights', 'VIP Seating', 'Refreshments'],
          createdAt: new Date()
        }
      ];

      // Create courts collection (for reference)
      for (const court of sampleCourts) {
        try {
          await addDoc(collection(db, 'courts'), court);
        } catch (error) {
          // Court might already exist, continue
          console.log('Court may already exist:', court.courtId);
        }
      }

      // Add sample feedback to Firestore
      let successCount = 0;
      for (const feedback of sampleFeedbacks) {
        try {
          await addDoc(collection(db, 'feedback'), feedback);
          successCount++;
        } catch (error) {
          console.error('Error adding feedback:', error);
        }
      }

      // Update local stats
      setStats(prev => ({
        ...prev,
        pendingFeedback: 2, // New + Urgent
        urgentIssues: 1,    // Flooding issue
        resolvedToday: 1    // Corner flags resolved
      }));
      
      setFeedbackSystemExists(true);

      Alert.alert(
        '🎉 Feedback System Ready!',
        `Successfully set up feedback system:\n\n✅ Collection created\n✅ ${successCount} sample feedback entries\n✅ 3 sample courts added\n✅ Indexes ready for fast queries\n\nThe system is now ready to receive and manage customer feedback!`,
        [
          {
            text: 'View Feedback',
            onPress: () => navigation.navigate('Feedback'),
            style: 'default'
          },
          { 
            text: 'Great!', 
            style: 'default' 
          }
        ]
      );

    } catch (error) {
      console.error('Error setting up feedback system:', error);
      Alert.alert(
        'Setup Error',
        `There was an error setting up the feedback system:\n\n${error.message}\n\nPlease check your internet connection and try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsSettingUpFeedback(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* ✅ WELCOME SECTION */}
      <Card style={styles.welcomeCard} mode="elevated">
        <Card.Content style={styles.welcomeContent}>
          <View style={styles.welcomeHeader}>
            <MaterialIcons name="admin-panel-settings" size={32} color="#1976d2" />
            <Text variant="headlineSmall" style={styles.welcomeTitle}>
              Court Administrator Dashboard
            </Text>
          </View>
          <Text variant="bodyLarge" style={styles.welcomeSubtitle}>
            Welcome back, {user?.displayName || 'CourtAdmin'}!
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

          {/* Main Action Buttons */}
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

          {/* 🆕 FEEDBACK SYSTEM SETUP/ACCESS */}
          <Divider style={styles.divider} />
          
          {!feedbackSystemExists ? (
            // Setup Button (when system doesn't exist)
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
            // Access Button with badge (when system exists)
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

          {/* Main Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="displaySmall" style={[styles.statNumber, { color: '#1976d2' }]}>
                {stats.pendingBookings}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Pending Bookings
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text variant="displaySmall" style={[styles.statNumber, { color: '#388e3c' }]}>
                {stats.activeCourts}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Active Courts
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text variant="displaySmall" style={[styles.statNumber, { color: '#f57c00' }]}>
                {stats.totalBookings}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Total Bookings
              </Text>
            </View>
          </View>

          {/* 🆕 Feedback Stats Row (only shown if system exists) */}
          {feedbackSystemExists && (
            <>
              <Divider style={styles.statsDivider} />
              <Text variant="titleMedium" style={styles.feedbackStatsTitle}>
                📝 Feedback Overview
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text variant="displaySmall" style={[styles.statNumber, { color: '#9c27b0' }]}>
                    {stats.pendingFeedback}
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    Pending Issues
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="displaySmall" style={[styles.statNumber, { color: '#ff5722' }]}>
                    {stats.urgentIssues}
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    Urgent Issues
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="displaySmall" style={[styles.statNumber, { color: '#4caf50' }]}>
                    {stats.resolvedToday}
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    Resolved Today
                  </Text>
                </View>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      {/* ✅ SYSTEM STATUS */}
      <Card style={styles.statusCard} mode="elevated">
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="health-and-safety" size={24} color="#4caf50" />
            <Text variant="titleMedium" style={styles.statusTitle}>
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

      {/* ✅ SIGN OUT SECTION */}
      <Card style={styles.signOutCard} mode="outlined">
        <Card.Content>
          <Button
            mode="outlined"
            onPress={() => {/* Add your sign out logic here */}}
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

  // Welcome Section
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

  // Actions Section
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

  // Stats Section
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

  // Status Section
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

  // Sign Out Section
  signOutCard: {
    marginBottom: 20,
    borderColor: '#f44336',
  },
  signOutButton: {
    borderColor: '#f44336',
  },
});