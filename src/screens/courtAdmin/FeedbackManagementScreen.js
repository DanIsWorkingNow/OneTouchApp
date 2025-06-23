// src/screens/courtAdmin/FeedbackManagementScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  Divider, 
  Modal, 
  Portal,
  TextInput,
  FAB
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  where 
} from 'firebase/firestore';
import { db } from '../../constants/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors';

export default function FeedbackManagementScreen() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [filteredFeedback, setFilteredFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, new, in-progress, resolved
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0
  });

  // Load feedback data
  useEffect(() => {
    const feedbackQuery = query(
      collection(db, 'feedback'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(feedbackQuery, (snapshot) => {
      const feedbackData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setFeedback(feedbackData);
      setLoading(false);
      setRefreshing(false);

      // Calculate stats
      const newStats = {
        total: feedbackData.length,
        new: feedbackData.filter(f => f.status === 'new').length,
        inProgress: feedbackData.filter(f => f.status === 'in-progress').length,
        resolved: feedbackData.filter(f => f.status === 'resolved').length,
        urgent: feedbackData.filter(f => f.severity === 'urgent' || f.severity === 'high').length
      };
      setStats(newStats);
    });

    return unsubscribe;
  }, []);

  // Filter feedback based on selected filter
  useEffect(() => {
    let filtered = feedback;
    
    switch (filter) {
      case 'new':
        filtered = feedback.filter(f => f.status === 'new');
        break;
      case 'in-progress':
        filtered = feedback.filter(f => f.status === 'in-progress');
        break;
      case 'resolved':
        filtered = feedback.filter(f => f.status === 'resolved');
        break;
      case 'urgent':
        filtered = feedback.filter(f => f.severity === 'urgent' || f.severity === 'high');
        break;
      default:
        filtered = feedback;
    }
    
    setFilteredFeedback(filtered);
  }, [feedback, filter]);

  // Update feedback status
  const updateFeedbackStatus = async (feedbackId, newStatus) => {
    try {
      const feedbackRef = doc(db, 'feedback', feedbackId);
      const updateData = {
        status: newStatus,
        updatedAt: new Date(),
      };

      // Add resolved timestamp if marking as resolved
      if (newStatus === 'resolved') {
        updateData.resolvedAt = new Date();
      }

      await updateDoc(feedbackRef, updateData);
      
      Alert.alert('Success', `Feedback marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating feedback:', error);
      Alert.alert('Error', 'Failed to update feedback status');
    }
  };

  // Submit admin response
  const submitAdminResponse = async () => {
    if (!adminResponse.trim()) {
      Alert.alert('Error', 'Please enter a response');
      return;
    }

    try {
      const feedbackRef = doc(db, 'feedback', selectedFeedback.id);
      await updateDoc(feedbackRef, {
        adminResponse: adminResponse,
        adminId: user.uid,
        adminEmail: user.email,
        updatedAt: new Date(),
        status: 'in-progress' // Auto-update to in-progress when admin responds
      });

      setShowResponseModal(false);
      setAdminResponse('');
      setSelectedFeedback(null);
      
      Alert.alert('Success', 'Response sent to customer');
    } catch (error) {
      console.error('Error submitting response:', error);
      Alert.alert('Error', 'Failed to send response');
    }
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'urgent': return '#d32f2f';
      case 'high': return '#f57c00';
      case 'medium': return '#fbc02d';
      case 'low': return '#388e3c';
      default: return '#666666';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return '#2196f3';
      case 'in-progress': return '#ff9800';
      case 'resolved': return '#4caf50';
      case 'closed': return '#666666';
      default: return '#666666';
    }
  };

  // Refresh data
  const onRefresh = () => {
    setRefreshing(true);
    // Data will refresh automatically through the listener
  };

  const renderFeedbackCard = (item) => (
    <Card key={item.id} style={styles.feedbackCard} mode="outlined">
      <Card.Content>
        {/* Header */}
        <View style={styles.feedbackHeader}>
          <View style={styles.feedbackTitle}>
            <Text variant="titleMedium" style={styles.feedbackTitleText}>
              {item.title}
            </Text>
            <Text variant="bodySmall" style={styles.feedbackCourt}>
              {item.courtName} • {item.userName}
            </Text>
          </View>
          <View style={styles.feedbackBadges}>
            <Button
              mode="contained"
              style={[styles.severityChip, { backgroundColor: getSeverityColor(item.severity) }]}
              textColor="white"
              compact
              labelStyle={styles.chipText}
              contentStyle={styles.chipContentStyle}
            >
              {item.severity.toUpperCase()}
            </Button>
            <Button
              mode="contained"
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
              textColor="white"
              compact
              labelStyle={styles.chipText}
              contentStyle={styles.chipContentStyle}
            >
              {item.status.toUpperCase().replace('-', ' ')}
            </Button>
          </View>
        </View>

        {/* Description */}
        <Text variant="bodyMedium" style={styles.feedbackDescription}>
          {item.description}
        </Text>

        {/* Customer Info */}
        <View style={styles.customerInfo}>
          <MaterialIcons name="person" size={16} color="#666" />
          <Text variant="bodySmall" style={styles.customerText}>
            {item.userEmail} • {new Date(item.createdAt.seconds * 1000).toLocaleDateString()}
          </Text>
        </View>

        {/* Admin Response */}
        {item.adminResponse && (
          <View style={styles.adminResponseSection}>
            <Divider style={styles.responseDivider} />
            <Text variant="labelMedium" style={styles.responseLabel}>
              Admin Response:
            </Text>
            <Text variant="bodyMedium" style={styles.adminResponseText}>
              {item.adminResponse}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {item.status === 'new' && (
            <>
              <Button
                mode="contained"
                onPress={() => updateFeedbackStatus(item.id, 'in-progress')}
                style={[styles.actionButton, { backgroundColor: '#ff9800' }]}
                textColor="white"
                compact
              >
                Start Work
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  setSelectedFeedback(item);
                  setAdminResponse(item.adminResponse || '');
                  setShowResponseModal(true);
                }}
                style={styles.actionButton}
                textColor="#1976d2"
                compact
              >
                Respond
              </Button>
            </>
          )}
          
          {item.status === 'in-progress' && (
            <Button
              mode="contained"
              onPress={() => updateFeedbackStatus(item.id, 'resolved')}
              style={[styles.actionButton, { backgroundColor: '#4caf50' }]}
              textColor="white"
              compact
            >
              Mark Resolved
            </Button>
          )}
          
          {item.status !== 'new' && (
            <Button
              mode="outlined"
              onPress={() => {
                setSelectedFeedback(item);
                setAdminResponse(item.adminResponse || '');
                setShowResponseModal(true);
              }}
              style={styles.actionButton}
              textColor="#1976d2"
              compact
            >
              Update Response
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      <Card style={styles.statsCard} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.statsTitle}>
            📊 Feedback Overview
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={[styles.statNumber, { color: '#2196f3' }]}>
                {stats.new}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>New</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={[styles.statNumber, { color: '#ff9800' }]}>
                {stats.inProgress}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={[styles.statNumber, { color: '#4caf50' }]}>
                {stats.resolved}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>Resolved</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={[styles.statNumber, { color: '#f44336' }]}>
                {stats.urgent}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>Urgent</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {['all', 'new', 'in-progress', 'resolved', 'urgent'].map((filterOption) => (
          <Button
            key={filterOption}
            mode={filter === filterOption ? "contained" : "outlined"}
            onPress={() => setFilter(filterOption)}
            style={[
              styles.filterButton,
              filter === filterOption ? styles.selectedFilterButton : styles.unselectedFilterButton
            ]}
            textColor={filter === filterOption ? "white" : "#666"}
            buttonColor={filter === filterOption ? "#1976d2" : "transparent"}
            compact
          >
            {filterOption === 'all' ? 'All' : 
             filterOption === 'in-progress' ? 'In Progress' : 
             filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </Button>
        ))}
      </ScrollView>

      {/* Feedback List */}
      <ScrollView
        style={styles.feedbackList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredFeedback.length > 0 ? (
          filteredFeedback.map(renderFeedbackCard)
        ) : (
          <Card style={styles.emptyCard} mode="outlined">
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons name="inbox" size={48} color="#ccc" />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No feedback found
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                {filter === 'all' 
                  ? 'No customer feedback has been submitted yet.'
                  : `No ${filter} feedback at the moment.`
                }
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Admin Response Modal */}
      <Portal>
        <Modal
          visible={showResponseModal}
          onDismiss={() => setShowResponseModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Admin Response
          </Text>
          
          {selectedFeedback && (
            <View style={styles.modalFeedbackInfo}>
              <Text variant="bodyMedium" style={styles.modalFeedbackTitle}>
                {selectedFeedback.title}
              </Text>
              <Text variant="bodySmall" style={styles.modalFeedbackDetails}>
                From: {selectedFeedback.userName} ({selectedFeedback.userEmail})
              </Text>
            </View>
          )}

          <TextInput
            label="Your response to customer"
            value={adminResponse}
            onChangeText={setAdminResponse}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.responseInput}
            placeholder="Enter your response to help resolve this issue..."
          />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowResponseModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={submitAdminResponse}
              style={styles.modalButton}
            >
              Send Response
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Floating Action Button for Quick Actions */}
      <FAB
        icon="refresh"
        style={styles.fab}
        onPress={onRefresh}
        color="white"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Stats Section
  statsCard: {
    margin: 16,
    backgroundColor: Colors.surface,
    elevation: 4,
  },
  statsTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: Colors.onSurface,
    fontSize: 16,  // ✅ Larger title
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 24,  // ✅ Larger numbers
  },
  statLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 12,  // ✅ Readable label size
    textAlign: 'center',
  },

  // Filter Section
  filterContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  filterContent: {
    paddingRight: 16,
  },
  filterChip: {
    marginRight: 8,
  },
  filterText: {
    color: Colors.onSurfaceVariant,
  },
  selectedFilterText: {
    color: Colors.onPrimary,
  },

  // Feedback List
  feedbackList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 80,  // ✅ Space for FAB
  },
  feedbackCard: {
    marginBottom: 16,  // ✅ More space between cards
    backgroundColor: Colors.surface,
    elevation: 3,  // ✅ Better shadow
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  feedbackTitle: {
    flex: 1,
    marginRight: 12,  // ✅ More space from badges
  },
  feedbackTitleText: {
    fontWeight: 'bold',
    color: Colors.onSurface,
    fontSize: 16,  // ✅ Larger title
  },
  feedbackCourt: {
    color: Colors.onSurfaceVariant,
    marginTop: 4,  // ✅ Better spacing
    fontSize: 13,  // ✅ Readable size
  },
  feedbackBadges: {
    flexDirection: 'column',  // ✅ Stack badges vertically for more space
    gap: 4,
    alignItems: 'flex-end',  // ✅ Align to right
  },
  severityChip: {
    height: 24,
    minWidth: 50,
    borderRadius: 12,
    elevation: 0,  // ✅ Remove shadow
  },
  statusChip: {
    height: 24,
    minWidth: 70,
    borderRadius: 12,
    elevation: 0,  // ✅ Remove shadow
  },
  chipText: {
    fontSize: 9,  // ✅ Smaller to ensure fit
    fontWeight: 'bold',
    lineHeight: 10,  // ✅ Tight line height
  },
  
  // Chip content styles
  chipContentStyle: {
    height: 24,
    paddingHorizontal: 4,
    minWidth: 'auto',
  },
  feedbackDescription: {
    color: Colors.onSurface,
    marginBottom: 12,
    lineHeight: 20,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: Colors.surfaceVariant,  // ✅ Light background
    padding: 8,  // ✅ Padding
    borderRadius: 6,  // ✅ Rounded corners
  },
  customerText: {
    marginLeft: 6,
    color: Colors.onSurfaceVariant,
    fontSize: 12,  // ✅ Readable size
  },

  // Admin Response Section
  adminResponseSection: {
    marginTop: 8,
  },
  responseDivider: {
    marginBottom: 8,
  },
  responseLabel: {
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  adminResponseText: {
    color: Colors.onSurface,
    fontStyle: 'italic',
    backgroundColor: Colors.surfaceVariant,
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 10,  // ✅ More space between buttons
    flexWrap: 'wrap',
    marginTop: 8,  // ✅ Space from content above
  },
  actionButton: {
    flex: 1,
    minWidth: 120,  // ✅ Minimum button width
    height: 36,  // ✅ Consistent height
  },

  // Empty State
  emptyCard: {
    marginTop: 40,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: Colors.onSurface,
  },
  emptySubtitle: {
    textAlign: 'center',
    color: Colors.onSurfaceVariant,
  },

  // Modal
  modalContent: {
    backgroundColor: Colors.surface,
    padding: 24,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.onSurface,
  },
  modalFeedbackInfo: {
    backgroundColor: Colors.surfaceVariant,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalFeedbackTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalFeedbackDetails: {
    color: Colors.onSurfaceVariant,
  },
  responseInput: {
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalButton: {
    minWidth: 80,
  },

  // FAB
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
  },
});