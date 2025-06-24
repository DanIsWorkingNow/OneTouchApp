// src/screens/app/NotificationsScreen.js
// Enhanced notifications system with BOTH court admin approval AND matchmaking features

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { 
  Text, Card, Button, Chip, ActivityIndicator, 
  Avatar, Divider, IconButton, Badge
} from 'react-native-paper';
import { 
  collection, query, where, orderBy, getDocs, onSnapshot,
  doc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { auth, db } from '../../constants/firebaseConfig';
import { Colors } from '../../constants/Colors';

// IMPORT matchmaking service for opponent search responses
import { respondToOpponentSearch } from '../../services/matchmakingService';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [processingResponse, setProcessingResponse] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Use real-time listener for both booking updates AND matchmaking notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNotifications(notificationsData);
      
      // Count unread notifications
      const unread = notificationsData.filter(notif => !notif.read).length;
      setUnreadCount(unread);
      
      console.log(`📬 Loaded ${notificationsData.length} notifications (${unread} unread)`);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Real-time listener will automatically refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: new Date()
      });
      
      // Local state update handled by real-time listener
      console.log('✅ Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notif => !notif.read);
      
      for (const notif of unreadNotifications) {
        await updateDoc(doc(db, 'notifications', notif.id), {
          read: true,
          readAt: new Date()
        });
      }
      
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      console.log('✅ Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // NEW: Handle opponent search responses
  const handleOpponentResponse = async (notification) => {
    Alert.alert(
      '🎾 Join Game?',
      `Do you want to play with ${notification.searchingUserName}?\n\nCourt: ${notification.courtName}\nTime: ${notification.timeSlot}`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { 
          text: 'Yes, I\'m Interested!',
          onPress: async () => {
            setProcessingResponse(notification.id);
            
            try {
              // Use the matchmaking service
              const result = await respondToOpponentSearch(
                notification.id,
                notification.searchingUserId,
                auth.currentUser
              );

              if (result.success) {
                Alert.alert(
                  '🎉 Response Sent!',
                  `We've let ${notification.searchingUserName} know you're interested. They'll receive your response!`,
                  [{ text: 'Great!' }]
                );
              } else {
                Alert.alert('❌ Error', result.error || 'Failed to send response');
              }
              
            } catch (error) {
              console.error('❌ Error responding to opponent search:', error);
              Alert.alert('❌ Error', 'Failed to send response. Please try again.');
            } finally {
              setProcessingResponse(null);
            }
          }
        }
      ]
    );
  };

  const handleNotificationPress = async (notification) => {
    // Mark as read when pressed
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'booking_update' && notification.data?.bookingId) {
      navigation.navigate('MyBookings');
    } else if (notification.type === 'match_response') {
      // Could navigate to a matches screen in the future
      Alert.alert('Match Response', 'Someone is interested in playing with you! Contact them to confirm details.');
    }
  };

  // ENHANCED: Support both booking updates AND matchmaking notifications
  const getNotificationIcon = (type, status) => {
    // Existing booking update icons
    if (type === 'booking_update') {
      switch (status) {
        case 'approved': return '✅';
        case 'rejected': return '❌';
        case 'cancelled': return '🚫';
        default: return '📋';
      }
    }
    
    // NEW: Matchmaking notification icons
    if (type === 'opponent_search') return '🎾';
    if (type === 'match_response') return '🤝';
    
    return '📢';
  };

  // ENHANCED: Support both booking updates AND matchmaking notifications
  const getNotificationColor = (type, status) => {
    // Existing booking update colors
    if (type === 'booking_update') {
      switch (status) {
        case 'approved': return '#4CAF50';
        case 'rejected': return '#F44336';
        case 'cancelled': return '#757575';
        default: return '#FF9800';
      }
    }
    
    // NEW: Matchmaking notification colors
    if (type === 'opponent_search') return '#FF6B35';
    if (type === 'match_response') return '#4CAF50';
    
    return Colors.primary;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-MY', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderNotificationCard = (notification) => {
    const isUnread = !notification.read;
    const status = notification.data?.status;
    
    return (
      <Card 
        key={notification.id} 
        style={[
          styles.notificationCard,
          isUnread && styles.unreadCard
        ]}
        onPress={() => handleNotificationPress(notification)}
      >
        <Card.Content>
          <View style={styles.notificationHeader}>
            <View style={styles.notificationMain}>
              <View style={styles.iconContainer}>
                <Text style={[
                  styles.notificationIcon,
                  { color: getNotificationColor(notification.type, status) }
                ]}>
                  {getNotificationIcon(notification.type, status)}
                </Text>
                {isUnread && <Badge style={styles.unreadBadge} />}
              </View>
              
              <View style={styles.notificationContent}>
                <Text 
                  variant="titleSmall" 
                  style={[
                    styles.notificationTitle,
                    isUnread && styles.unreadText
                  ]}
                >
                  {notification.title}
                </Text>
                <Text 
                  variant="bodyMedium" 
                  style={styles.notificationMessage}
                >
                  {notification.message}
                </Text>
                <Text 
                  variant="bodySmall" 
                  style={styles.notificationTime}
                >
                  {formatTime(notification.createdAt)}
                </Text>
              </View>
            </View>
            
            <IconButton
              icon="close"
              size={16}
              onPress={() => deleteNotification(notification.id)}
              style={styles.deleteButton}
            />
          </View>
          
          {/* NEW: Opponent Search Response Buttons */}
          {notification.type === 'opponent_search' && !notification.responded && (
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={() => handleOpponentResponse(notification)}
                style={styles.respondButton}
                loading={processingResponse === notification.id}
                disabled={processingResponse !== null}
                icon="tennis"
              >
                I'm Interested! 🎾
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => markAsRead(notification.id)}
                style={styles.dismissButton}
                disabled={processingResponse !== null}
              >
                Not This Time
              </Button>
            </View>
          )}

          {/* Show response status for matchmaking */}
          {notification.responded && notification.type === 'opponent_search' && (
            <View style={styles.responseStatus}>
              <Chip icon="check" style={styles.respondedChip} textStyle={styles.respondedText}>
                You Responded
              </Chip>
            </View>
          )}
          
          {/* EXISTING: Additional booking info for court admin approvals */}
          {notification.data && (
            <View style={styles.additionalInfo}>
              <Divider style={styles.divider} />
              <Text variant="bodySmall" style={styles.bookingInfo}>
                📍 {notification.data.courtName || notification.courtName} • 📅 {notification.data.date || notification.date} • ⏰ {notification.data.timeSlot || notification.timeSlot}
              </Text>
            </View>
          )}

          {/* NEW: Matchmaking specific info */}
          {(notification.type === 'opponent_search' || notification.type === 'match_response') && (
            <View style={styles.matchDetails}>
              {notification.type === 'match_response' && (
                <Text variant="bodySmall" style={styles.matchInfo}>
                  🎉 Contact {notification.respondingUserName} to confirm match details
                </Text>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with actions */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="titleLarge" style={styles.title}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Badge style={styles.headerBadge}>{unreadCount}</Badge>
          )}
        </View>
        {unreadCount > 0 && (
          <Button
            mode="outlined"
            compact
            onPress={markAllAsRead}
            style={styles.markAllButton}
          >
            Mark all read
          </Button>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length > 0 ? (
          <View style={styles.notificationsList}>
            {notifications.map(renderNotificationCard)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No notifications yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              You'll receive notifications for booking approvals and opponent searches
            </Text>
            
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Courts')}
              style={styles.testButton}
              icon="tennis"
            >
              Book a Court to Test
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  headerBadge: {
    backgroundColor: Colors.primary,
  },
  markAllButton: {
    borderColor: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  notificationsList: {
    padding: 16,
  },
  notificationCard: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: 'white',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    backgroundColor: '#f8f9ff',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notificationMain: {
    flexDirection: 'row',
    flex: 1,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  notificationIcon: {
    fontSize: 24,
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    backgroundColor: Colors.primary,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  unreadText: {
    color: Colors.primary,
  },
  notificationMessage: {
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    color: '#666',
  },
  deleteButton: {
    margin: 0,
  },
  
  // NEW: Matchmaking specific styles
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  respondButton: {
    flex: 1,
    backgroundColor: '#4caf50',
  },
  dismissButton: {
    flex: 1,
  },
  responseStatus: {
    marginTop: 8,
  },
  respondedChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f5e8',
  },
  respondedText: {
    color: '#2e7d32',
  },
  matchDetails: {
    marginTop: 8,
  },
  matchInfo: {
    color: '#666',
    fontStyle: 'italic',
  },
  
  // EXISTING: Court admin styles
  additionalInfo: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 8,
  },
  bookingInfo: {
    color: '#666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  emptySubtitle: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
    marginBottom: 24,
  },
  testButton: {
    borderColor: Colors.primary,
  },
});