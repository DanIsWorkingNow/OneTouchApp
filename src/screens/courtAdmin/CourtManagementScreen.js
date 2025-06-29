// src/screens/courtAdmin/CourtManagementScreen.js
// ENHANCED: Full court management interface for admins

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { 
  Text, Card, Button, Chip, ActivityIndicator, 
  FAB, Portal, Modal, TextInput, SegmentedButtons,
  List, IconButton, Divider, Avatar
} from 'react-native-paper';
import { 
  collection, query, orderBy, getDocs, 
  doc, updateDoc, deleteDoc, addDoc
} from 'firebase/firestore';
import { auth, db } from '../../constants/firebaseConfig';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';

export default function CourtManagementScreen({ navigation }) {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [courtName, setCourtName] = useState('');
  const [location, setLocation] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');

  const { userPermissions } = useAuth();

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'available', label: 'Open' },
    { value: 'closed', label: 'Closed' },
    { value: 'maintenance', label: 'Maintenance' }
  ];

  useEffect(() => {
    loadCourts();
  }, []);

  const loadCourts = async () => {
    try {
      setLoading(true);
      console.log('📡 Loading courts...');
      
      const q = query(
        collection(db, 'courts'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const courtsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCourts(courtsData);
      console.log(`✅ Loaded ${courtsData.length} courts`);
    } catch (error) {
      console.error('Error loading courts:', error);
      Alert.alert('Error', 'Failed to load courts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourts();
    setRefreshing(false);
  };

  const getFilteredCourts = () => {
    if (statusFilter === 'all') {
      return courts;
    }
    return courts.filter(court => court.status === statusFilter);
  };

  const resetForm = () => {
    setCourtName('');
    setLocation('');
    setPricePerHour('');
    setDescription('');
    setCapacity('');
  };

  const validateForm = () => {
    if (!courtName.trim()) {
      Alert.alert('Validation Error', 'Court name is required');
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Validation Error', 'Location is required');
      return false;
    }
    if (!pricePerHour || isNaN(parseFloat(pricePerHour))) {
      Alert.alert('Validation Error', 'Valid price per hour is required');
      return false;
    }
    return true;
  };

  const handleAddCourt = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      const courtData = {
        courtName: courtName.trim(),
        courtNumber: courtName.trim(), // For compatibility
        location: location.trim(),
        pricePerHour: parseFloat(pricePerHour),
        description: description.trim(),
        capacity: capacity ? parseInt(capacity) : 10,
        status: 'available',
        createdAt: new Date(),
        createdBy: auth.currentUser.uid,
        lastUpdated: new Date(),
        facilityName: 'Sports Complex',
        amenities: ['Lighting', 'Scoreboard'], // Default amenities
        operatingHours: {
          start: '08:00',
          end: '23:00'
        }
      };

      await addDoc(collection(db, 'courts'), courtData);
      
      Alert.alert('✅ Success', 'Court added successfully!');
      setShowAddModal(false);
      resetForm();
      loadCourts();
    } catch (error) {
      console.error('Error adding court:', error);
      Alert.alert('❌ Error', 'Failed to add court');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCourt = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      const updateData = {
        courtName: courtName.trim(),
        courtNumber: courtName.trim(),
        location: location.trim(),
        pricePerHour: parseFloat(pricePerHour),
        description: description.trim(),
        capacity: capacity ? parseInt(capacity) : selectedCourt.capacity,
        lastUpdated: new Date(),
        updatedBy: auth.currentUser.uid
      };

      await updateDoc(doc(db, 'courts', selectedCourt.id), updateData);
      
      Alert.alert('✅ Success', 'Court updated successfully!');
      setShowEditModal(false);
      resetForm();
      setSelectedCourt(null);
      loadCourts();
    } catch (error) {
      console.error('Error updating court:', error);
      Alert.alert('❌ Error', 'Failed to update court');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (court, newStatus) => {
    const statusLabels = {
      available: 'open',
      closed: 'close',
      maintenance: 'put under maintenance'
    };
    
    Alert.alert(
      'Change Court Status',
      `Are you sure you want to ${statusLabels[newStatus]} ${court.courtName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => processStatusChange(court, newStatus)
        }
      ]
    );
  };

  const processStatusChange = async (court, newStatus) => {
    try {
      setSubmitting(true);
      
      await updateDoc(doc(db, 'courts', court.id), {
        status: newStatus,
        lastUpdated: new Date(),
        statusChangedBy: auth.currentUser.uid,
        statusChangedAt: new Date()
      });

      Alert.alert('✅ Success', `Court status updated to ${newStatus}`);
      loadCourts();
    } catch (error) {
      console.error('Error updating court status:', error);
      Alert.alert('❌ Error', 'Failed to update court status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourt = async (court) => {
    Alert.alert(
      '⚠️ Delete Court',
      `Are you sure you want to permanently delete "${court.courtName}"? This action cannot be undone and will affect existing bookings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => processDeleteCourt(court)
        }
      ]
    );
  };

  const processDeleteCourt = async (court) => {
    try {
      setSubmitting(true);
      
      await deleteDoc(doc(db, 'courts', court.id));
      
      Alert.alert('✅ Success', 'Court deleted successfully');
      loadCourts();
    } catch (error) {
      console.error('Error deleting court:', error);
      Alert.alert('❌ Error', 'Failed to delete court');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (court) => {
    setSelectedCourt(court);
    setCourtName(court.courtName || court.courtNumber || '');
    setLocation(court.location || '');
    setPricePerHour(court.pricePerHour?.toString() || '');
    setDescription(court.description || '');
    setCapacity(court.capacity?.toString() || '');
    setShowEditModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return Colors.success;
      case 'closed':
        return Colors.error;
      case 'maintenance':
        return Colors.warning;
      default:
        return Colors.outline;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return 'check-circle';
      case 'closed':
        return 'close-circle';
      case 'maintenance':
        return 'wrench';
      default:
        return 'help-circle';
    }
  };

  const renderCourtCard = (court) => (
    <Card key={court.id} style={styles.courtCard}>
      <Card.Content>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.courtInfo}>
            <Text variant="titleMedium" style={styles.courtName}>
              🏟️ {court.courtName || court.courtNumber}
            </Text>
            <Chip 
              mode="flat"
              icon={getStatusIcon(court.status)}
              textStyle={{ fontSize: 12 }}
              style={[styles.statusChip, { backgroundColor: getStatusColor(court.status) + '20' }]}
            >
              {court.status?.toUpperCase()}
            </Chip>
          </View>
        </View>

        {/* Court Details */}
        <View style={styles.courtDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍 Location:</Text>
            <Text style={styles.detailValue}>{court.location || 'Not specified'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>💰 Price/Hour:</Text>
            <Text style={styles.detailValue}>RM {court.pricePerHour?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>👥 Capacity:</Text>
            <Text style={styles.detailValue}>{court.capacity || 10} players</Text>
          </View>
          {court.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>📝 Description:</Text>
              <Text style={styles.detailValue}>{court.description}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {/* Status Change Buttons */}
          {court.status !== 'available' && (
            <Button
              mode="outlined"
              style={[styles.actionButton, { borderColor: Colors.success }]}
              onPress={() => handleStatusChange(court, 'available')}
              icon="check-circle"
              disabled={submitting}
              compact
            >
              Open
            </Button>
          )}
          
          {court.status !== 'closed' && (
            <Button
              mode="outlined"
              style={[styles.actionButton, { borderColor: Colors.error }]}
              onPress={() => handleStatusChange(court, 'closed')}
              icon="close-circle"
              disabled={submitting}
              compact
            >
              Close
            </Button>
          )}
          
          {court.status !== 'maintenance' && (
            <Button
              mode="outlined"
              style={[styles.actionButton, { borderColor: Colors.warning }]}
              onPress={() => handleStatusChange(court, 'maintenance')}
              icon="wrench"
              disabled={submitting}
              compact
            >
              Maintenance
            </Button>
          )}
        </View>

        {/* Management Buttons */}
        <View style={styles.managementButtons}>
          <Button
            mode="outlined"
            style={styles.actionButton}
            onPress={() => openEditModal(court)}
            icon="pencil"
            disabled={submitting}
          >
            Edit
          </Button>
          
          <Button
            mode="outlined"
            style={[styles.actionButton, { borderColor: Colors.error }]}
            onPress={() => handleDeleteCourt(court)}
            icon="delete"
            disabled={submitting}
            textColor={Colors.error}
          >
            Delete
          </Button>
        </View>

        {/* Created Date */}
        <View style={styles.metaInfo}>
          <Text variant="bodySmall" style={styles.createdDate}>
            Created: {new Date(court.createdAt?.toDate() || court.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  // Permission check
  if (!userPermissions?.canManageCourts) {
    return (
      <View style={styles.noPermissionContainer}>
        <Text variant="titleLarge" style={styles.noPermissionText}>
          Access Denied
        </Text>
        <Text variant="bodyMedium" style={styles.noPermissionSubtext}>
          You don't have permission to manage courts.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <SegmentedButtons
        value={statusFilter}
        onValueChange={setStatusFilter}
        buttons={filterOptions}
        style={styles.filterButtons}
      />

      {/* Court Count */}
      <View style={styles.countContainer}>
        <Text variant="bodyMedium" style={styles.countText}>
          {loading ? 'Loading...' : `${getFilteredCourts().length} court${getFilteredCourts().length !== 1 ? 's' : ''} found`}
        </Text>
      </View>

      {/* Courts List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Loading courts...</Text>
          </View>
        ) : getFilteredCourts().length > 0 ? (
          getFilteredCourts().map(renderCourtCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No {statusFilter === 'all' ? '' : statusFilter + ' '}courts found
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              {statusFilter === 'all' 
                ? 'Add your first court using the + button below'
                : 'Try selecting a different filter to see other courts'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Court FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          resetForm();
          setShowAddModal(true);
        }}
        label="Add Court"
        color="white"
        labelStyle={{ color: 'white' }}
      />

      {/* Add Court Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>Add New Court</Text>
          
          <TextInput
            label="Court Name *"
            value={courtName}
            onChangeText={setCourtName}
            style={styles.input}
            mode="outlined"
            placeholder="e.g., Court 1, Main Court"
          />
          
          <TextInput
            label="Location *"
            value={location}
            onChangeText={setLocation}
            style={styles.input}
            mode="outlined"
            placeholder="e.g., Building A, Level 2"
          />
          
          <TextInput
            label="Price per Hour (RM) *"
            value={pricePerHour}
            onChangeText={setPricePerHour}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
            placeholder="e.g., 80.00"
          />
          
          <TextInput
            label="Capacity (players)"
            value={capacity}
            onChangeText={setCapacity}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
            placeholder="e.g., 10"
          />
          
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Optional description..."
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowAddModal(false)}
              style={styles.modalButton}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddCourt}
              style={styles.modalButton}
              loading={submitting}
              disabled={submitting}
            >
              Add Court
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Edit Court Modal */}
      <Portal>
        <Modal
          visible={showEditModal}
          onDismiss={() => setShowEditModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>Edit Court</Text>
          
          <TextInput
            label="Court Name *"
            value={courtName}
            onChangeText={setCourtName}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="Location *"
            value={location}
            onChangeText={setLocation}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="Price per Hour (RM) *"
            value={pricePerHour}
            onChangeText={setPricePerHour}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
          />
          
          <TextInput
            label="Capacity (players)"
            value={capacity}
            onChangeText={setCapacity}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
          />
          
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowEditModal(false)}
              style={styles.modalButton}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleEditCourt}
              style={styles.modalButton}
              loading={submitting}
              disabled={submitting}
            >
              Update Court
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterButtons: {
    margin: 16,
    marginBottom: 8,
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  countText: {
    color: Colors.onSurfaceVariant,
  },
  scrollView: {
    flex: 1,
  },
  courtCard: {
    margin: 8,
    marginHorizontal: 16,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 12,
  },
  courtInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courtName: {
    fontWeight: 'bold',
    color: Colors.primary,
    flex: 1,
  },
  statusChip: {
    borderRadius: 12,
  },
  courtDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.onSurface,
    flex: 1,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 8,
    marginBottom: 8,
    gap: 6,
    flexWrap: 'wrap',
  },
  managementButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    minWidth: 80,
  },
  metaInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.outline + '30',
  },
  createdDate: {
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    color: Colors.onSurfaceVariant,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
    color: Colors.onSurfaceVariant,
  },
  emptySubtext: {
    textAlign: 'center',
    color: Colors.onSurfaceVariant,
    opacity: 0.7,
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noPermissionText: {
    marginBottom: 16,
    textAlign: 'center',
    color: Colors.error,
  },
  noPermissionSubtext: {
    textAlign: 'center',
    color: Colors.onSurfaceVariant,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.primary,
  },
  input: {
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});