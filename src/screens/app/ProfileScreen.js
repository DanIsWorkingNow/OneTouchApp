// src/screens/app/ProfileScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, Card, Button, List, Avatar, Divider,
  Portal, Modal, TextInput
} from 'react-native-paper';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../constants/firebaseConfig';
import { Colors } from '../../constants/Colors';

export default function ProfileScreen() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const user = auth.currentUser;

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: performLogout }
      ]
    );
  };

  const performLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleEditProfile = () => {
    setNewDisplayName(user?.displayName || '');
    setShowEditModal(true);
  };

  const saveProfile = async () => {
    if (!newDisplayName.trim()) {
      Alert.alert('Error', 'Please enter a valid name');
      return;
    }

    setLoading(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: newDisplayName.trim(),
      });

      // Update Firestore user document
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          username: newDisplayName.trim(),
        });
      }

      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatJoinDate = (user) => {
    if (user?.metadata?.creationTime) {
      return new Date(user.metadata.creationTime).toLocaleDateString('en-MY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return 'Unknown';
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text 
              size={80} 
              label={getInitials(user?.displayName || user?.email)} 
              style={styles.avatar}
              color="white"
              backgroundColor={Colors.primary}
            />
            <Text variant="headlineSmall" style={styles.userName}>
              {user?.displayName || 'User'}
            </Text>
            <Text variant="bodyMedium" style={styles.userEmail}>
              {user?.email}
            </Text>
            <Text variant="bodySmall" style={styles.joinDate}>
              Member since {formatJoinDate(user)}
            </Text>
          </Card.Content>
        </Card>

        {/* Account Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Account Settings
            </Text>
          </Card.Content>
          
          <List.Item
            title="Edit Profile"
            description="Update your name and information"
            left={props => <List.Icon {...props} icon="account-edit" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleEditProfile}
          />
          
          <Divider />
          
          <List.Item
            title="Change Password"
            description="Update your account password"
            left={props => <List.Icon {...props} icon="lock-reset" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available in the next update')}
          />
          
          <Divider />
          
          <List.Item
            title="Email Verified"
            description={user?.emailVerified ? "Your email is verified" : "Email not verified"}
            left={props => <List.Icon {...props} icon={user?.emailVerified ? "check-circle" : "alert-circle"} />}
            right={props => !user?.emailVerified && <List.Icon {...props} icon="chevron-right" />}
            onPress={() => !user?.emailVerified && Alert.alert('Coming Soon', 'Email verification will be available soon')}
          />
        </Card>

        {/* App Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              App Settings
            </Text>
          </Card.Content>
          
          <List.Item
            title="Notifications"
            description="Manage push notifications"
            left={props => <List.Icon {...props} icon="bell" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon')}
          />
          
          <Divider />
          
          <List.Item
            title="Privacy Policy"
            description="Read our privacy policy"
            left={props => <List.Icon {...props} icon="shield-account" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Privacy Policy', 'Our privacy policy ensures your data is protected and used responsibly.')}
          />
          
          <Divider />
          
          <List.Item
            title="Terms of Service"
            description="Review terms and conditions"
            left={props => <List.Icon {...props} icon="file-document" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Terms of Service', 'By using this app, you agree to our terms and conditions.')}
          />
          
          <Divider />
          
          <List.Item
            title="About"
            description="App version and information"
            left={props => <List.Icon {...props} icon="information" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('About One Touch', 'Version 1.0.0\n\nFutsal Court Management System\n\nDeveloped with ❤️ for futsal players')}
          />
        </Card>

        {/* Logout Section */}
        <Card style={styles.logoutCard}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleLogout}
              style={styles.logoutButton}
              buttonColor="#F44336"
              textColor="white"
              icon="logout"
            >
              Logout
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Portal>
        <Modal
          visible={showEditModal}
          onDismiss={() => setShowEditModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Edit Profile
          </Text>
          
          <TextInput
            label="Display Name"
            value={newDisplayName}
            onChangeText={setNewDisplayName}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
          />
          
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowEditModal(false)}
              style={styles.modalButton}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={saveProfile}
              style={styles.modalButton}
              loading={loading}
              disabled={loading}
            >
              Save
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
    backgroundColor: Colors.background,
  },
  profileCard: {
    margin: 16,
    elevation: 4,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    marginBottom: 16,
  },
  userName: {
    color: Colors.onSurface,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: Colors.onSurface,
    opacity: 0.7,
    marginBottom: 8,
  },
  joinDate: {
    color: Colors.onSurface,
    opacity: 0.5,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  logoutCard: {
    margin: 16,
    marginBottom: 32,
    elevation: 2,
  },
  logoutButton: {
    paddingVertical: 8,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});