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
  Chip,
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
  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
    <Text style={styles.badgeText}>{item.severity.toUpperCase()}</Text>
  </View>
  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
    <Text style={styles.badgeText}>{item.status.toUpperCase().replace('-', ' ')}</Text>
  </View>
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

     {/* Filter Chips - FIXED VERSION */}
<ScrollView 
  horizontal 
  showsHorizontalScrollIndicator={false}
  style={styles.filterContainer}
  contentContainerStyle={styles.filterContent}
>
  {['all', 'new', 'in-progress', 'resolved', 'urgent'].map((filterOption) => (
    <Chip
      key={filterOption}
      selected={filter === filterOption}
      onPress={() => setFilter(filterOption)}
      style={[
        styles.filterChip,
        filter === filterOption && styles.selectedFilterChip
      ]}
      textStyle={[
        styles.filterText,
        filter === filterOption && styles.selectedFilterText
      ]}
      showSelectedOverlay={false}
      mode={filter === filterOption ? "flat" : "outlined"}
    >
      {filterOption === 'all' ? 'All' : 
       filterOption === 'in-progress' ? 'In Progress' : 
       filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
    </Chip>
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

  // Stats Section (improved)
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
    fontSize: 18,  // ✅ Increased from 16
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',  // ✅ Added for better alignment
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,  // ✅ Added padding
  },
  statNumber: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 28,  // ✅ Increased from 24
  },
  statLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 14,  // ✅ Increased from 12
    textAlign: 'center',
    fontWeight: '500',  // ✅ Added weight
  },

  // Filter Section (FIXED)
  filterContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    maxHeight: 50,  // ✅ Constrain height
  },
  filterContent: {
    paddingRight: 16,
    alignItems: 'center',  // ✅ Center vertically
    paddingVertical: 8,  // ✅ Add vertical padding
  },
  filterChip: {
    marginRight: 8,
    height: 32,  // ✅ Fixed height for chips
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  selectedFilterChip: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  filterText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedFilterText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Feedback List (improved)
  feedbackList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  feedbackCard: {
    marginBottom: 16,
    backgroundColor: Colors.surface,
    elevation: 3,
    borderRadius: 12,  // ✅ Added rounded corners
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,  // ✅ Increased padding
    paddingVertical: 6,     // ✅ Increased padding
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  priorityBadge: {
    paddingHorizontal: 10,  // ✅ Better padding
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  feedbackContent: {
    marginBottom: 12,
  },
  feedbackTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,  // ✅ Larger title
    color: Colors.onSurface,
  },
  feedbackDescription: {
    color: Colors.onSurfaceVariant,
    lineHeight: 20,  // ✅ Better line height
    fontSize: 14,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  customerText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 13,
  },
  adminResponseSection: {
    marginTop: 12,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  responseDivider: {
    marginVertical: 8,
  },
  responseLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976d2',
  },
  adminResponseText: {
    color: Colors.onSurface,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    flexWrap: 'wrap',  // ✅ Allow wrapping
  },
  actionButton: {
    marginLeft: 8,
    marginTop: 4,  // ✅ Add margin for wrapped buttons
    minWidth: 100,  // ✅ Minimum width
  },

  //Feedback Badges
   feedbackBadges: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,  // Small gap between badges
  },
  
  severityBadge: {
    paddingHorizontal: 8,     // ✅ Reduced from 12
    paddingVertical: 3,       // ✅ Reduced from 6
    borderRadius: 6,          // ✅ Reduced from 16 (much less curve)
    alignSelf: 'flex-start',
    minWidth: 50,             // ✅ Consistent minimum width
    alignItems: 'center',
  },
  
  statusBadge: {
    paddingHorizontal: 8,     // ✅ Reduced from 10
    paddingVertical: 3,       // ✅ Reduced from 4
    borderRadius: 6,          // ✅ Reduced from 12 (much less curve)
    alignSelf: 'flex-start',
    minWidth: 70,             // ✅ Slightly wider for status text
    alignItems: 'center',
  },

  badgeText: {
    color: 'white',
    fontSize: 10,             // ✅ Smaller font size
    fontWeight: '600',        // ✅ Semi-bold for clarity
    letterSpacing: 0.3,       // ✅ Slight letter spacing for readability
    textAlign: 'center',
  },

  // ✅ IMPROVED FEEDBACK HEADER LAYOUT
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  feedbackTitle: {
    flex: 1,
    marginRight: 12,          // ✅ Space between title and badges
  },

  feedbackTitleText: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 16,
    color: Colors.onSurface,
  },

  feedbackCourt: {
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2,
  },

  // Empty state (improved)
  emptyCard: {
    marginTop: 40,
    backgroundColor: Colors.surface,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  emptySubtitle: {
    textAlign: 'center',
    color: Colors.onSurfaceVariant,
    paddingHorizontal: 20,
  },

  // Modal styles (improved)
  modalContainer: {
    backgroundColor: 'white',
    padding: 24,  // ✅ Increased padding
    margin: 20,
    borderRadius: 12,  // ✅ Rounded corners
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,  // ✅ Larger title
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.onSurface,
  },
  modalContent: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.onSurface,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    color: Colors.onSurfaceVariant,
  },
  responseInput: {
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,  // ✅ Space between buttons
  },

  // FAB (improved)
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1976d2',
    elevation: 8,  // ✅ Higher elevation
  },
});