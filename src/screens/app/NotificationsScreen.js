// src/screens/app/NotificationsScreen.js
// Complete notifications system for booking updates

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { 
  Text, Card, Button, Chip, ActivityIndicator, 
  Avatar, Divider, IconButton, Badge
} from 'react-native-paper';
import { 
  collection, query, where, orderBy, getDocs, 
  doc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { auth, db } from '../../constants/firebaseConfig';
import { Colors } from '../../constants/Colors';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setNotifications([]);
        return;
      }

      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNotifications(notificationsData);
      
      // Count unread notifications
      const unread = notificationsData.filter(notif => !notif.read).length;
      setUnreadCount(unread);
      
      console.log(`📬 Loaded ${notificationsData.length} notifications (${unread} unread)`);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: new Date()
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true, readAt: new Date() }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
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
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true, readAt: new Date() }))
      );
      setUnreadCount(0);
      
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      
      const deletedNotif = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      if (deletedNotif && !deletedNotif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationPress = async (notification) => {
    // Mark as read when pressed
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'booking_update' && notification.data?.bookingId) {
      navigation.navigate('MyBookings');
    }
  };

  const getNotificationIcon = (type, status) => {
    if (type === 'booking_update') {
      switch (status) {
        case 'approved': return '✅';
        case 'rejected': return '❌';
        case 'cancelled': return '🚫';
        default: return '📋';
      }
    }
    return '📢';
  };

  const getNotificationColor = (type, status) => {
    if (type === 'booking_update') {
      switch (status) {
        case 'approved': return '#4CAF50';
        case 'rejected': return '#F44336';
        case 'cancelled': return '#757575';
        default: return '#FF9800';
      }
    }
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
          
          {/* Additional booking info if available */}
          {notification.data && (
            <View style={styles.additionalInfo}>
              <Divider style={styles.divider} />
              <Text variant="bodySmall" style={styles.bookingInfo}>
                📍 {notification.data.courtName} • 📅 {notification.data.date} • ⏰ {notification.data.timeSlot}
              </Text>
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
              You'll receive notifications when your booking status changes
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
  },
});