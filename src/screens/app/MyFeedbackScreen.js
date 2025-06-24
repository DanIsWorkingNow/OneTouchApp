import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Button,
  FAB,
  Divider,
  Badge,
  Surface,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../constants/firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  limit
} from 'firebase/firestore';
import { Colors } from '../../constants/Colors';

export default function MyFeedbackScreen({ navigation }) {
  const { user } = useAuth();
  
  const [myFeedback, setMyFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const filterOptions = [
    { value: 'all', label: 'All Feedback' },
    { value: 'new', label: 'New' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  // Set up real-time listener
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    
    const feedbackRef = collection(db, 'feedback');
    
    // Try with orderBy first, fallback if index doesn't exist
    const setupFeedbackListener = () => {
      try {
        const feedbackQuery = query(
          feedbackRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
          feedbackQuery,
          (snapshot) => {
            const feedbackData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setMyFeedback(feedbackData);
            setLoading(false);
            console.log(`💬 Loaded ${feedbackData.length} feedback items`);
          },
          (error) => {
            console.error('❌ Feedback listener error:', error);
            if (error.code === 'failed-precondition') {
              console.log('📝 Index required, using fallback query');
              setupFallbackListener();
            } else {
              setLoading(false);
            }
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error setting up feedback listener:', error);
        setupFallbackListener();
        return () => {};
      }
    };

    // Fallback listener without orderBy
    const setupFallbackListener = () => {
      const fallbackQuery = query(feedbackRef, where('userId', '==', user.uid));
      
      const unsubscribe = onSnapshot(fallbackQuery, (snapshot) => {
        const feedbackData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Manual sorting since we can't use orderBy
        feedbackData.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
          return dateB - dateA;
        });

        setMyFeedback(feedbackData);
        setLoading(false);
        console.log(`💬 Loaded ${feedbackData.length} feedback items (fallback)`);
      });

      return unsubscribe;
    };

    const unsubscribe = setupFeedbackListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    // The real-time listener will automatically refresh data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getFilteredFeedback = () => {
    if (filter === 'all') return myFeedback;
    return myFeedback.filter(feedback => feedback.status === filter);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'new': return '#FF9800';
      case 'in-progress': return '#2196F3';
      case 'resolved': return '#4CAF50';
      case 'closed': return '#9E9E9E';
      default: return '#FF9800';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'NEW';
      case 'in-progress': return 'IN PROGRESS';
      case 'resolved': return 'RESOLVED';
      case 'closed': return 'CLOSED';
      default: return status?.toUpperCase() || 'PENDING';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'maintenance': return 'build';
      case 'cleanliness': return 'cleaning-services';
      case 'facilities': return 'location-city';
      case 'booking': return 'event-busy';
      case 'staff': return 'support-agent';
      case 'suggestion': return 'lightbulb';
      default: return 'help';
    }
  };

  const formatDate = (feedback) => {
    if (!feedback.createdAt) return 'Recently';
    
    try {
      const date = feedback.createdAt.toDate ? feedback.createdAt.toDate() : new Date(feedback.createdAt);
      return date.toLocaleDateString('en-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Recently';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#FF9800';
    }
  };

  const getResponseStatus = (feedback) => {
    if (feedback.adminResponse && feedback.adminResponse.trim()) {
      return { hasResponse: true, text: 'Admin Responded' };
    }
    return { hasResponse: false, text: 'Awaiting Response' };
  };

  const handleViewDetails = (feedback) => {
    const responseStatus = getResponseStatus(feedback);
    
    Alert.alert(
      `${feedback.title}`,
      `Category: ${feedback.category}\nCourt: ${feedback.courtName || 'General'}\nPriority: ${feedback.severity}\nStatus: ${getStatusText(feedback.status)}\nSubmitted: ${formatDate(feedback)}\n\nDescription:\n${feedback.description}\n\n${
        responseStatus.hasResponse 
          ? `Admin Response:\n${feedback.adminResponse}`
          : 'No admin response yet.'
      }`,
      [
        { text: 'Close' },
        ...(responseStatus.hasResponse ? [] : [
          { 
            text: 'Submit Follow-up', 
            onPress: () => navigation.navigate('FeedbackSubmission')
          }
        ])
      ]
    );
  };

  const renderFeedbackCard = (feedback) => {
    const responseStatus = getResponseStatus(feedback);
    
    return (
      <Card 
        key={feedback.id} 
        style={styles.feedbackCard}
        onPress={() => handleViewDetails(feedback)}
      >
        <Card.Content>
          {/* Header Row */}
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <MaterialIcons 
                name={getCategoryIcon(feedback.category)} 
                size={20} 
                color={Colors.primary} 
              />
              <Text variant="titleMedium" style={styles.feedbackTitle}>
                {feedback.title}
              </Text>
            </View>
            <Chip 
              textStyle={{ fontSize: 10 }}
              style={[
                styles.statusChip, 
                { backgroundColor: getStatusColor(feedback.status) }
              ]}
            >
              {getStatusText(feedback.status)}
            </Chip>
          </View>

          {/* Court and Category Info */}
          <View style={styles.feedbackMeta}>
            <Text variant="bodySmall" style={styles.metaText}>
              {feedback.courtName || 'General'} • {feedback.category}
            </Text>
            <View style={styles.metaRight}>
              <Chip 
                textStyle={{ fontSize: 10 }}
                style={[
                  styles.severityChip,
                  { backgroundColor: getSeverityColor(feedback.severity) }
                ]}
              >
                {feedback.severity?.toUpperCase()}
              </Chip>
            </View>
          </View>

          {/* Description Preview */}
          <Text variant="bodyMedium" style={styles.descriptionPreview} numberOfLines={2}>
            {feedback.description}
          </Text>

          <Divider style={styles.divider} />

          {/* Footer Row */}
          <View style={styles.cardFooter}>
            <Text variant="bodySmall" style={styles.dateText}>
              {formatDate(feedback)}
            </Text>
            <View style={styles.responseStatus}>
              <MaterialIcons 
                name={responseStatus.hasResponse ? "check-circle" : "schedule"} 
                size={16} 
                color={responseStatus.hasResponse ? Colors.success : Colors.textSecondary} 
              />
              <Text 
                variant="bodySmall" 
                style={[
                  styles.responseText,
                  { color: responseStatus.hasResponse ? Colors.success : Colors.textSecondary }
                ]}
              >
                {responseStatus.text}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const getFilterCounts = () => {
    const counts = {};
    filterOptions.forEach(option => {
      if (option.value === 'all') {
        counts[option.value] = myFeedback.length;
      } else {
        counts[option.value] = myFeedback.filter(f => f.status === option.value).length;
      }
    });
    return counts;
  };

  const filteredFeedback = getFilteredFeedback();
  const filterCounts = getFilterCounts();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading your feedback...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Overview */}
      <Surface style={styles.statsContainer}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text variant="headlineSmall" style={styles.statNumber}>
              {myFeedback.length}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Total Submitted
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="headlineSmall" style={[styles.statNumber, { color: '#FF9800' }]}>
              {myFeedback.filter(f => f.status === 'new' || f.status === 'in-progress').length}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Pending
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="headlineSmall" style={[styles.statNumber, { color: '#4CAF50' }]}>
              {myFeedback.filter(f => f.status === 'resolved').length}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Resolved
            </Text>
          </View>
        </View>
      </Surface>

      {/* Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filterOptions.map((option) => (
          <View key={option.value} style={styles.filterChipContainer}>
            <Chip
              selected={filter === option.value}
              onPress={() => setFilter(option.value)}
              style={styles.filterChip}
              mode={filter === option.value ? "flat" : "outlined"}
            >
              {option.label}
            </Chip>
            {filterCounts[option.value] > 0 && (
              <Badge style={styles.filterBadge}>
                {filterCounts[option.value]}
              </Badge>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Feedback List */}
      <ScrollView
        style={styles.feedbackList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredFeedback.length > 0 ? (
          filteredFeedback.map(renderFeedbackCard)
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons name="inbox" size={48} color="#ccc" />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                {filter === 'all' 
                  ? 'No feedback submitted yet'
                  : `No ${filter} feedback`
                }
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                {filter === 'all' 
                  ? 'Submit your first feedback to help us improve our service'
                  : `You have no feedback with ${filter} status`
                }
              </Text>
              {filter === 'all' && (
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('FeedbackSubmission')}
                  style={styles.emptyButton}
                >
                  Submit Feedback
                </Button>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="add"
        style={styles.fab}
        onPress={() => navigation.navigate('FeedbackSubmission')}
        label="New Feedback"
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filtersContent: {
    paddingRight: 16,
  },
  filterChipContainer: {
    position: 'relative',
    marginRight: 8,
  },
  filterChip: {
    marginVertical: 4,
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -8,
    fontSize: 10,
  },
  feedbackList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  feedbackCard: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  feedbackTitle: {
    marginLeft: 8,
    fontWeight: 'bold',
    flex: 1,
  },
  statusChip: {
    height: 24,
  },
  feedbackMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityChip: {
    height: 20,
  },
  descriptionPreview: {
    marginBottom: 12,
    lineHeight: 20,
  },
  divider: {
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    color: Colors.textSecondary,
  },
  responseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  responseText: {
    marginLeft: 4,
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  emptyButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
  },
});