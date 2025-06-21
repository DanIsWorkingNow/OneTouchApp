// src/screens/app/CourtsScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, Searchbar } from 'react-native-paper';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../constants/firebaseConfig';
import { Colors } from '../../constants/Colors';

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
    // Filter courts based on search query
    const filtered = courts.filter(court =>
      court.courtNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
        
        // Sort courts by court number
        courtsData.sort((a, b) => {
          const numA = parseInt(a.courtNumber.replace('Court ', ''));
          const numB = parseInt(b.courtNumber.replace('Court ', ''));
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

  const handleBookCourt = (court) => {
  console.log('Navigating to BookCourt with:', { courtId: court.id, court: court });
  console.log('🔍 Navigation Debug - Court data:', court);
  console.log('🔍 Navigation Debug - Court ID:', court.id);
  
  // Check if court data exists
  if (!court || !court.id) {
    Alert.alert('Error', 'Court data is missing');
    return;
  }
  
  navigation.navigate('BookCourt', { 
    courtId: court.id,
    court: court 
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

  const formatPrice = (price) => {
    return `RM ${price.toFixed(2)}/hour`;
  };

  const renderCourtCard = (court) => (
    <Card key={court.id} style={styles.courtCard} mode="outlined">
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleLarge" style={styles.courtNumber}>
            {court.courtNumber}
          </Text>
          <Chip 
            mode="flat"
            style={[styles.statusChip, { backgroundColor: getStatusColor(court.status) }]}
            textStyle={styles.statusText}
          >
            {court.status.toUpperCase()}
          </Chip>
        </View>

        <Text variant="titleMedium" style={styles.price}>
          {formatPrice(court.pricePerHour)}
        </Text>

        <Text variant="bodySmall" style={styles.facilityInfo}>
          📍 One Touch Futsal, Temerloh Pahang
        </Text>

        <Text variant="bodySmall" style={styles.slotsInfo}>
          ⏰ Available from 6:00 AM to 10:00 PM
        </Text>
      </Card.Content>

      <Card.Actions style={styles.cardActions}>
        <Button 
          mode="outlined" 
          onPress={() => navigation.navigate('CourtDetails', { 
            courtId: court.id,
            court: court 
          })}
          style={styles.detailsButton}
        >
          Details
        </Button>
        // Replace the Book Now button with:
<Button 
  mode="contained" 
  onPress={() => handleBookCourt(court)}
  style={styles.bookButton}
  disabled={court.status !== 'available'}
>
  {court.status === 'available' ? 'Book Now' : 'Unavailable'}
</Button>


      </Card.Actions>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading courts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Facility Header */}
      <Card style={styles.facilityCard}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.facilityName}>
            One Touch Futsal
          </Text>
          <Text variant="bodyMedium" style={styles.facilityLocation}>
            📍 Temerloh, Pahang
          </Text>
        </Card.Content>
      </Card>

      <Searchbar
        placeholder="Search courts (e.g., Court 1, Court 2)..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            Available Courts
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {filteredCourts.filter(c => c.status === 'available').length} of {filteredCourts.length} courts available
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
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    color: Colors.onBackground,
  },
  facilityCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 3,
    backgroundColor: Colors.primary,
  },
  facilityName: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  facilityLocation: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 4,
  },
  searchBar: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 0,
  },
  title: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  subtitle: {
    color: Colors.onBackground,
    marginTop: 4,
  },
  courtCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 3,
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
    color: Colors.onSurface,
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
  price: {
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  facilityInfo: {
    color: Colors.onSurface,
    opacity: 0.7,
    marginBottom: 4,
  },
  slotsInfo: {
    color: Colors.onSurface,
    opacity: 0.7,
    marginBottom: 8,
  },
  cardActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailsButton: {
    marginRight: 8,
  },
  bookButton: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: Colors.onBackground,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: Colors.onBackground,
    textAlign: 'center',
    opacity: 0.7,
  },
});