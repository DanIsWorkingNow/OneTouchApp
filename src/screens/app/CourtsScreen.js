// src/screens/app/CourtsScreen.js - UPDATED WITH DYNAMIC PRICING & BLACK THEME
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, Searchbar } from 'react-native-paper';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../constants/firebaseConfig';

export default function CourtsScreen({ navigation }) {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCourts, setFilteredCourts] = useState([]);

  useEffect(() => {
    loadCourts();
  }, []);

  useEffect(() => {
    // Filter courts based on search query - FIXED: Added null check
    const filtered = courts.filter(court => {
      const courtNumber = court.courtNumber || court.name || 'Unknown Court';
      return courtNumber.toLowerCase().includes(searchQuery.toLowerCase());
    });
    setFilteredCourts(filtered);
  }, [courts, searchQuery]);

  const loadCourts = async () => {
    try {
      // Set up real-time listener for courts
      const courtsRef = collection(db, 'courts');
      
      const unsubscribe = onSnapshot(courtsRef, (snapshot) => {
        const courtsData = [];
        snapshot.forEach((doc) => {
          courtsData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // FIXED: Safe sorting with null checks
        courtsData.sort((a, b) => {
          // Get court numbers safely
          const courtNumberA = a.courtNumber || a.name || '';
          const courtNumberB = b.courtNumber || b.name || '';
          
          // Extract numbers safely
          const numA = parseInt(courtNumberA.replace(/\D/g, '')) || 0;
          const numB = parseInt(courtNumberB.replace(/\D/g, '')) || 0;
          
          return numA - numB;
        });
        
        setCourts(courtsData);
        setLoading(false);
        setRefreshing(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading courts:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCourts();
  };

  // FIXED: Added proper error handling and null checks
  const handleBookCourt = (court) => {
    console.log('🔍 Navigation Debug - Court data:', court);
    console.log('🔍 Navigation Debug - Court ID:', court.id);
    
    // Check if court data exists and has required fields
    if (!court || !court.id) {
      Alert.alert('Error', 'Court data is missing. Please try again.');
      return;
    }
    
    // Ensure court has necessary fields for booking
    const courtData = {
      ...court,
      courtNumber: court.courtNumber || court.name || `Court ${court.id}`,
      pricePerHour: court.pricePerHour || 50,
      facilityName: court.facilityName || 'One Touch Futsal',
      location: court.location || 'Temerloh, Pahang'
    };
    
    console.log('Navigating to BookCourt with:', { courtId: court.id, court: courtData });
    
    navigation.navigate('BookCourt', { 
      courtId: court.id,
      court: courtData 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#4CAF50';
      case 'maintenance': return '#FF9800';
      case 'occupied': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  // UPDATED: Dynamic pricing display
  const formatDynamicPricing = () => {
    return (
      <View style={styles.pricingContainer}>
        <View style={styles.pricingRow}>
          <Text style={styles.normalHoursText}>🌅 Normal Hours (08:00-18:59)</Text>
          <Text style={styles.normalPriceText}>RM 50/hour</Text>
        </View>
        <View style={styles.pricingRow}>
          <Text style={styles.nightHoursText}>🌙 Night Hours (19:00-02:00)</Text>
          <Text style={styles.nightPriceText}>RM 80/hour</Text>
        </View>
      </View>
    );
  };

  const renderCourtCard = (court) => (
    <Card key={court.id} style={styles.courtCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={styles.courtNumber}>
            {court.courtNumber || court.name || `Court ${court.id}`}
          </Text>
          <Chip
            mode="flat"
            style={[styles.statusChip, { 
              backgroundColor: getStatusColor(court.status || 'available') 
            }]}
            textStyle={styles.statusText}
          >
            {(court.status || 'available').toUpperCase()}
          </Chip>
        </View>
        
        {/* UPDATED: Dynamic pricing display */}
        {formatDynamicPricing()}
        
        <Text variant="bodySmall" style={styles.facilityInfo}>
          📍 {court.facilityName || 'One Touch Futsal'}
        </Text>
        
        <Text variant="bodySmall" style={styles.facilityInfo}>
          🌍 {court.location || 'Temerloh, Pahang'}
        </Text>
        
        <Text variant="bodySmall" style={styles.operationalHours}>
          🕐 Operational Hours: 08:00 - 02:00 (+1 day)
        </Text>
        
        {court.timeSlots && (
          <Text variant="bodySmall" style={styles.slotsInfo}>
            ⏰ {court.timeSlots.length} time slots available
          </Text>
        )}
      </Card.Content>
      
      <Card.Actions style={styles.cardActions}>
        <Button 
          mode="contained" 
          onPress={() => handleBookCourt(court)}
          style={styles.bookButton}
          disabled={court.status === 'maintenance' || court.status === 'occupied'}
        >
          {court.status === 'available' ? 'Book Now' : 'Unavailable'}
        </Button>
      </Card.Actions>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#333333" />
        <Text style={styles.loadingText}>Loading courts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Facility Header - Updated with Black Theme */}
      <Card style={styles.facilityCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.facilityName}>
            One Touch Futsal
          </Text>
          <Text variant="bodyMedium" style={styles.facilityLocation}>
            Temerloh, Pahang
          </Text>
          <Text variant="bodySmall" style={styles.facilityTagline}>
            Experience Dynamic Pricing - Better rates during normal hours
          </Text>
        </Card.Content>
      </Card>

      {/* Search Bar */}
      <Searchbar
        placeholder="Search courts..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
        iconColor="#666"
      />

      {/* Courts List */}
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            Available Courts ({filteredCourts.length})
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Select a court to make your booking
          </Text>
        </View>

        {filteredCourts.length > 0 ? (
          filteredCourts.map(renderCourtCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              {searchQuery ? 'No courts match your search' : 'No courts found'}
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'Please setup demo courts first'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Light gray background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    color: '#333333',
  },
  facilityCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 3,
    backgroundColor: '#1a1a1a', // Dark card
    borderRadius: 12,
  },
  facilityName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  facilityLocation: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  facilityTagline: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  searchBar: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  searchInput: {
    color: '#333333',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 0,
  },
  title: {
    color: '#333333',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666666',
    marginTop: 4,
  },
  courtCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 3,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courtNumber: {
    flex: 1,
    marginRight: 8,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statusChip: {
    height: 30,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // UPDATED: Dynamic pricing styles
  pricingContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  normalHoursText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '500',
  },
  normalPriceText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: 'bold',
  },
  nightHoursText: {
    color: '#FF9800',
    fontSize: 13,
    fontWeight: '500',
  },
  nightPriceText: {
    color: '#FF9800',
    fontSize: 13,
    fontWeight: 'bold',
  },
  facilityInfo: {
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  operationalHours: {
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
    fontSize: 12,
    fontStyle: 'italic',
  },
  slotsInfo: {
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  cardActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bookButton: {
    flex: 1,
    backgroundColor: '#333333',
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#666666',
    textAlign: 'center',
  },
});