// src/screens/app/NotificationsScreen.js
// COMPLETE FIXED VERSION: Safe text rendering and comprehensive error handling

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

// Import matchmaking service for opponent search responses
import { respondToOpponentSearch } from '../../services/matchmakingService';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [processingResponse, setProcessingResponse] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Use real-time listener for notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        try {
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
        } catch (error) {
          console.error('Error processing notifications:', error);
          setLoading(false);
        }
      }, (error) => {
        console.error('Error listening to notifications:', error);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up notifications listener:', error);
      setLoading(false);
    }
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

  // 🔧 FIXED: Enhanced opponent response with safe data handling
  const handleOpponentResponse = async (notification) => {
    try {
      // Safe date formatting with error handling
      const formatDate = (dateString) => {
        try {
          if (!dateString) return 'Date not specified';
          const date = new Date(dateString);
          return date.toLocaleDateString('en-MY', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        } catch (error) {
          return dateString || 'Date not specified';
        }
      };

      // Safe duration display
      const getDurationText = (duration) => {
        try {
          if (!duration || isNaN(duration)) return "Duration not specified";
          return duration === 1 ? "1 hour" : `${duration} hours`;
        } catch (error) {
          return "Duration not specified";
        }
      };

      // 🔧 FIXED: Safe data access with fallbacks
      const searchingUserName = notification.searchingUserName || notification.searchingUserEmail || 'A player';
      const courtName = notification.courtName || 'Court location';
      const date = notification.date || 'Date TBD';
      const timeSlot = notification.timeSlot || 'Time TBD';
      const duration = notification.duration || 1;

      // 🎯 COMPLETE ALERT with all details safely rendered
      const alertMessage = `Do you want to play with ${searchingUserName}?

📍 Court: ${courtName}
📅 Date: ${formatDate(date)}
⏰ Time: ${timeSlot}
⏱️ Duration: ${getDurationText(duration)}`;

      Alert.alert(
        '⚽ Join Game?',
        alertMessage,
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
                    `We've let ${searchingUserName} know you're interested. They'll receive your response!`,
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
    } catch (error) {
      console.error('Error in handleOpponentResponse:', error);
      Alert.alert('❌ Error', 'Unable to process response at this time.');
    }
  };

  const handleNotificationPress = async (notification) => {
    try {
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
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  // Enhanced notification icons for different types
  const getNotificationIcon = (type, status) => {
    try {
      // Existing booking update icons
      if (type === 'booking_update') {
        switch (status) {
          case 'approved': return '✅';
          case 'rejected': return '❌';
          case 'cancelled': return '🚫';
          default: return '📋';
        }
      }
      
      // Matchmaking notification icons
      if (type === 'opponent_search') return '⚽';
      if (type === 'match_response') return '🤝';
      
      return '📢';
    } catch (error) {
      return '📢';
    }
  };

  // Enhanced notification colors for different types
  const getNotificationColor = (type, status) => {
    try {
      // Existing booking update colors
      if (type === 'booking_update') {
        switch (status) {
          case 'approved': return '#4CAF50';
          case 'rejected': return '#F44336';
          case 'cancelled': return '#757575';
          default: return '#FF9800';
        }
      }
      
      // Matchmaking notification colors
      if (type === 'opponent_search') return '#FF6B35';
      if (type === 'match_response') return '#4CAF50';
      
      return Colors.primary;
    } catch (error) {
      return Colors.primary;
    }
  };

  const formatTime = (timestamp) => {
    try {
      if (!timestamp) return '';
      
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    } catch (error) {
      return 'Unknown time';
    }
  };

  // 🔧 FIXED: Safer notification rendering with comprehensive error handling
  const renderNotification = (notification) => {
    try {
      const cardStyle = [
        styles.notificationCard,
        !notification.read && styles.unreadCard
      ];

      // Safe data extraction with fallbacks
      const title = notification.title || 'Notification';
      const message = notification.message || 'No message';
      const type = notification.type || 'general';
      const status = notification.status || '';
      const isUnread = !notification.read;
      const hasResponded = notification.responded;

      return (
        <Card key={notification.id} style={cardStyle}>
          <Card.Content>
            <View style={styles.notificationHeader}>
              <View style={styles.avatarContainer}>
                <Avatar.Text 
                  size={40} 
                  label={getNotificationIcon(type, status)}
                  style={[
                    styles.avatar, 
                    { backgroundColor: getNotificationColor(type, status) }
                  ]}
                />
                {isUnread && (
                  <View style={styles.unreadDot} />
                )}
              </View>
              
              <View style={styles.notificationContent}>
                <Text variant="bodyMedium" style={styles.notificationTitle}>
                  {title}
                </Text>
                <Text variant="bodySmall" style={styles.notificationMessage}>
                  {message}
                </Text>
                <Text variant="bodySmall" style={styles.timeText}>
                  {formatTime(notification.createdAt)}
                </Text>
              </View>
              
              <IconButton
                icon="close"
                size={16}
                onPress={() => deleteNotification(notification.id)}
                style={styles.deleteButton}
              />
            </View>

            {/* 🎾 ENHANCED: Matchmaking action buttons with safe rendering */}
            {type === 'opponent_search' && !hasResponded && (
              <View style={styles.actionButtons}>
                <Button
                  mode="contained"
                  onPress={() => handleOpponentResponse(notification)}
                  style={styles.interestButton}
                  disabled={processingResponse === notification.id}
                  loading={processingResponse === notification.id}
                >
                  <Text style={{ color: 'white' }}>⚽ I'm Interested!</Text>
                </Button>
                
                <Button
                  mode="outlined"
                  onPress={() => markAsRead(notification.id)}
                  style={styles.dismissButton}
                  disabled={processingResponse !== null}
                >
                  <Text>Not This Time</Text>
                </Button>
              </View>
            )}

            {/* Show response status for matchmaking */}
            {hasResponded && type === 'opponent_search' && (
              <View style={styles.responseStatus}>
                <Chip icon="check" style={styles.respondedChip} textStyle={styles.respondedText}>
                  <Text style={styles.respondedText}>✓ You Responded</Text>
                </Chip>
              </View>
            )}
            
            {/* 🔧 ENHANCED: Show booking details safely */}
            {(notification.courtName || notification.date || notification.timeSlot) && (
              <View style={styles.additionalInfo}>
                <Divider style={styles.divider} />
                <Text variant="bodySmall" style={styles.bookingInfo}>
                  📍 {notification.courtName || notification.data?.courtName || 'Court'} • 
                  📅 {notification.date || notification.data?.date || 'Date TBD'} • 
                  ⏰ {notification.timeSlot || notification.data?.timeSlot || 'Time TBD'}
                  {notification.duration && (
                    <Text> • ⏱️ {notification.duration === 1 ? '1 hour' : `${notification.duration} hours`}</Text>
                  )}
                </Text>
              </View>
            )}

            {/* Matchmaking specific info with safe rendering */}
            {(type === 'opponent_search' || type === 'match_response') && (
              <View style={styles.matchDetails}>
                {type === 'match_response' && (
                  <Text variant="bodySmall" style={styles.matchInfo}>
                    🎉 Contact {notification.respondingUserName || 'the interested player'} to confirm match details
                  </Text>
                )}
              </View>
            )}
          </Card.Content>
        </Card>
      );
    } catch (error) {
      console.error('Error rendering notification:', error);
      // Fallback notification card for errors
      return (
        <Card key={notification.id || Math.random()} style={styles.notificationCard}>
          <Card.Content>
            <Text style={styles.notificationTitle}>Error Loading Notification</Text>
            <Text style={styles.notificationMessage}>Unable to display this notification</Text>
          </Card.Content>
        </Card>
      );
    }
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
            <Text>Mark all read</Text>
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
          notifications.map(renderNotification)
        ) : (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              📭 No notifications yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              You'll see booking updates and match invitations here
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    color: Colors.primary,
  },
  headerBadge: {
    marginLeft: 8,
    backgroundColor: '#FF5722',
  },
  markAllButton: {
    borderColor: Colors.primary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  notificationCard: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: 'white',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    // Avatar styles handled by component
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF5722',
    borderWidth: 2,
    borderColor: 'white',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  notificationMessage: {
    color: '#666',
    lineHeight: 18,
  },
  timeText: {
    color: '#999',
    marginTop: 4,
  },
  deleteButton: {
    margin: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  interestButton: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  dismissButton: {
    flex: 1,
    borderColor: '#999',
  },
  responseStatus: {
    marginTop: 8,
  },
  respondedChip: {
    backgroundColor: '#E8F5E8',
    alignSelf: 'flex-start',
  },
  respondedText: {
    color: '#4CAF50',
    fontSize: 12,
  },
  additionalInfo: {
    marginTop: 8,
  },
  divider: {
    marginBottom: 8,
  },
  bookingInfo: {
    color: '#666',
    fontStyle: 'italic',
  },
  matchDetails: {
    marginTop: 8,
  },
  matchInfo: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#999',
    textAlign: 'center',
  },
});