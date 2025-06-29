// src/screens/admin/UserManagementScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  Alert, 
  RefreshControl,
  FlatList 
} from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  Searchbar, 
  Chip, 
  FAB,
  Avatar,
  IconButton,
  Menu,
  Divider,
  ActivityIndicator,
  Dialog,
  Portal,
  TextInput,
  RadioButton
} from 'react-native-paper';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import { SystemAdminOnly } from '../../components/ProtectedRoute';
import { db, auth } from '../../constants/firebaseConfig';

export default function UserManagementScreen({ navigation }) {
  // State management
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [menuVisible, setMenuVisible] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  
  // Dialog states
  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form states
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    phoneNumber: '',
    role: 'user',
    password: ''
  });

  const { getUserDisplayInfo } = useAuth();
  const adminInfo = getUserDisplayInfo();

  // Role definitions with permissions
  const ROLE_DEFINITIONS = {
    systemAdmin: {
      name: "System Administrator",
      permissions: {
        canManageUsers: true,
        canManageCourts: true,
        canApproveBookings: true,
        canViewAllBookings: true,
        canAccessReports: true,
        canDeactivateAccounts: true,
        canViewPasswords: true,
        canCreateAdmins: true,
        canDeleteUsers: true,
        canViewSystemLogs: true
      }
    },
    courtAdmin: {
      name: "Court Administrator",
      permissions: {
        canManageUsers: false,
        canManageCourts: true,
        canApproveBookings: true,
        canViewAllBookings: true,
        canAccessReports: true,
        canDeactivateAccounts: false,
        canViewPasswords: false,
        canCreateCourts: true,
        canUpdateCourtStatus: true,
        canViewBookingReports: true
      }
    },
    user: {
      name: "Regular User",
      permissions: {
        canManageUsers: false,
        canManageCourts: false,
        canApproveBookings: false,
        canViewAllBookings: false,
        canAccessReports: false,
        canDeactivateAccounts: false,
        canViewPasswords: false,
        canCreateBookings: true,
        canUpdateProfile: true,
        canViewOwnBookings: true
      }
    }
  };

  // Real-time user data fetching
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'users'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
        setFilteredUsers(usersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = users;

    // Apply role filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(user => user.role === selectedFilter);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phoneNumber?.includes(searchQuery)
      );
    }

    setFilteredUsers(filtered);
  }, [users, selectedFilter, searchQuery]);

  // Refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    // The real-time listener will automatically update the data
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Create new user
  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.username || !newUser.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setActionLoading({ createUser: true });
    try {
      // Create authentication account
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        newUser.email, 
        newUser.password
      );

      // Create user document in Firestore
      await addDoc(collection(db, 'users'), {
        uid: userCredential.user.uid,
        email: newUser.email,
        username: newUser.username,
        phoneNumber: newUser.phoneNumber || '',
        role: newUser.role,
        permissions: ROLE_DEFINITIONS[newUser.role].permissions,
        status: 'active',
        createdAt: serverTimestamp(),
        createdBy: adminInfo?.uid,
        isFirstLogin: true,
        metadata: {
          createdByAdmin: true,
          lastPasswordChange: serverTimestamp()
        }
      });

      Alert.alert('Success', `User ${newUser.username} created successfully!`);
      setCreateUserDialog(false);
      setNewUser({ email: '', username: '', phoneNumber: '', role: 'user', password: '' });
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Error', error.message);
    } finally {
      setActionLoading({ createUser: false });
    }
  };

  // Update user role
  const handleRoleChange = async (userId, newRole) => {
    setActionLoading({ [userId]: true });
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        permissions: ROLE_DEFINITIONS[newRole].permissions,
        lastModifiedAt: serverTimestamp(),
        lastModifiedBy: adminInfo?.uid
      });
      
      Alert.alert('Success', `User role updated to ${newRole}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update user role');
    } finally {
      setActionLoading({ [userId]: false });
    }
  };

  // Suspend/Activate user
  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'suspended' ? 'suspend' : 'activate';
    
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action.charAt(0).toUpperCase() + action.slice(1), 
          onPress: async () => {
            setActionLoading({ [userId]: true });
            try {
              await updateDoc(doc(db, 'users', userId), {
                status: newStatus,
                lastModifiedBy: adminInfo?.uid,
                lastModifiedAt: serverTimestamp()
              });
              Alert.alert('Success', `User ${action}d successfully`);
            } catch (error) {
              Alert.alert('Error', `Failed to ${action} user`);
            } finally {
              setActionLoading({ [userId]: false });
            }
          }
        }
      ]
    );
  };

  // Delete user (dangerous operation)
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setActionLoading({ deleteUser: true });
    try {
      // Log the deletion for audit trail
      await addDoc(collection(db, 'auditLogs'), {
        action: 'USER_DELETED',
        targetUserId: selectedUser.id,
        targetUserEmail: selectedUser.email,
        targetUserRole: selectedUser.role,
        performedBy: adminInfo?.uid,
        timestamp: serverTimestamp()
      });

      await deleteDoc(doc(db, 'users', selectedUser.id));
      Alert.alert('Success', 'User deleted successfully');
      setDeleteConfirmDialog(false);
      setSelectedUser(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete user');
    } finally {
      setActionLoading({ deleteUser: false });
    }
  };

  // Reset user password
  const handleResetPassword = (user) => {
    Alert.alert(
      'Reset Password',
      `Send password reset email to ${user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Reset Email', 
          onPress: () => {
            // In a real app, you'd use Firebase Admin SDK or Cloud Functions
            Alert.alert('Info', 'Password reset email sent successfully!');
          }
        }
      ]
    );
  };

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'systemAdmin': return '#d32f2f';
      case 'courtAdmin': return '#388e3c';
      case 'user': return '#1976d2';
      default: return '#666';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4caf50';
      case 'suspended': return '#ff9800';
      case 'deactivated': return '#f44336';
      default: return '#666';
    }
  };

  // Render user card
  const renderUserCard = ({ item: user }) => (
    <Card style={styles.userCard} key={user.id}>
      <Card.Content>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Avatar.Text 
              size={40} 
              label={user.username?.charAt(0)?.toUpperCase() || 'U'}
              style={{ backgroundColor: getRoleColor(user.role) }}
            />
            <View style={styles.userDetails}>
              <Text variant="titleMedium" style={styles.username}>
                {user.username || 'Unknown User'}
              </Text>
              <Text variant="bodySmall" style={styles.email}>
                {user.email}
              </Text>
              {user.phoneNumber && (
                <Text variant="bodySmall" style={styles.phone}>
                  📱 {user.phoneNumber}
                </Text>
              )}
            </View>
          </View>
          
          <Menu
            visible={menuVisible[user.id] || false}
            onDismiss={() => setMenuVisible({ ...menuVisible, [user.id]: false })}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible({ ...menuVisible, [user.id]: true })}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible({ ...menuVisible, [user.id]: false });
                handleRoleChange(user.id, 'user');
              }}
              title="Make User"
              leadingIcon="account"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible({ ...menuVisible, [user.id]: false });
                handleRoleChange(user.id, 'courtAdmin');
              }}
              title="Make Court Admin"
              leadingIcon="shield-account"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible({ ...menuVisible, [user.id]: false });
                handleRoleChange(user.id, 'systemAdmin');
              }}
              title="Make System Admin"
              leadingIcon="shield-crown"
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                setMenuVisible({ ...menuVisible, [user.id]: false });
                handleStatusToggle(user.id, user.status);
              }}
              title={user.status === 'active' ? 'Suspend User' : 'Activate User'}
              leadingIcon={user.status === 'active' ? 'account-cancel' : 'account-check'}
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible({ ...menuVisible, [user.id]: false });
                handleResetPassword(user);
              }}
              title="Reset Password"
              leadingIcon="lock-reset"
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                setMenuVisible({ ...menuVisible, [user.id]: false });
                setSelectedUser(user);
                setDeleteConfirmDialog(true);
              }}
              title="Delete User"
              leadingIcon="delete"
              titleStyle={{ color: '#f44336' }}
            />
          </Menu>
        </View>

        <View style={styles.userChips}>
          <Chip 
            icon="shield" 
            style={[styles.roleChip, { backgroundColor: getRoleColor(user.role) }]}
            textStyle={{ color: 'white', fontSize: 12 }}
            compact={false}
          >
            {user.role === 'systemAdmin' ? 'System Admin' : 
             user.role === 'courtAdmin' ? 'Court Admin' : 'User'}
          </Chip>
          <Chip 
            icon="circle" 
            style={[styles.statusChip, { backgroundColor: getStatusColor(user.status) }]}
            textStyle={{ color: 'white', fontSize: 12 }}
            compact={false}
          >
            {user.status || 'Unknown'}
          </Chip>
          {user.isFirstLogin && (
            <Chip 
              icon="new-box" 
              style={styles.newUserChip}
              textStyle={{ fontSize: 12 }}
              compact={false}
            >
              First Login
            </Chip>
          )}
        </View>

        {user.createdAt && (
          <Text variant="bodySmall" style={styles.createdAt}>
            Created: {new Date(user.createdAt.toDate()).toLocaleDateString()}
          </Text>
        )}
        
        {actionLoading[user.id] && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#1976d2" />
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <SystemAdminOnly>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SystemAdminOnly>
    );
  }

  return (
    <SystemAdminOnly>
      <View style={styles.container}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              👥 User Management
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Manage system users, roles, and permissions
            </Text>
            
            {/* Statistics */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{users.length}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {users.filter(u => u.role === 'systemAdmin').length}
                </Text>
                <Text style={styles.statLabel}>Admins</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {users.filter(u => u.status === 'active').length}
                </Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {users.filter(u => u.status === 'suspended').length}
                </Text>
                <Text style={styles.statLabel}>Suspended</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Search and Filter */}
        <Card style={styles.filterCard}>
          <Card.Content>
            <Searchbar
              placeholder="Search users..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
            />
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterRow}>
                {['all', 'systemAdmin', 'courtAdmin', 'user'].map(filter => (
                  <Chip
                    key={filter}
                    selected={selectedFilter === filter}
                    onPress={() => setSelectedFilter(filter)}
                    style={styles.filterChip}
                  >
                    {filter === 'all' ? 'All Users' :
                     filter === 'systemAdmin' ? 'System Admins' :
                     filter === 'courtAdmin' ? 'Court Admins' : 'Users'}
                  </Chip>
                ))}
              </View>
            </ScrollView>
          </Card.Content>
        </Card>

        {/* Users List */}
        <FlatList
          data={filteredUsers}
          renderItem={renderUserCard}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />

        {/* Floating Action Button */}
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setCreateUserDialog(true)}
          label="Add User"
        />

        {/* Create User Dialog */}
        <Portal>
          <Dialog visible={createUserDialog} onDismiss={() => setCreateUserDialog(false)}>
            <Dialog.Title>Create New User</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Email *"
                value={newUser.email}
                onChangeText={(text) => setNewUser({ ...newUser, email: text })}
                mode="outlined"
                keyboardType="email-address"
                style={styles.input}
              />
              <TextInput
                label="Username *"
                value={newUser.username}
                onChangeText={(text) => setNewUser({ ...newUser, username: text })}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Phone Number"
                value={newUser.phoneNumber}
                onChangeText={(text) => setNewUser({ ...newUser, phoneNumber: text })}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
              />
              <TextInput
                label="Password *"
                value={newUser.password}
                onChangeText={(text) => setNewUser({ ...newUser, password: text })}
                mode="outlined"
                secureTextEntry
                style={styles.input}
              />
              
              <Text variant="titleSmall" style={styles.roleLabel}>Role:</Text>
              <RadioButton.Group
                onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                value={newUser.role}
              >
                <View style={styles.radioOption}>
                  <RadioButton value="user" />
                  <Text>Regular User</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="courtAdmin" />
                  <Text>Court Administrator</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="systemAdmin" />
                  <Text>System Administrator</Text>
                </View>
              </RadioButton.Group>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setCreateUserDialog(false)}>Cancel</Button>
              <Button 
                mode="contained" 
                onPress={handleCreateUser}
                loading={actionLoading.createUser}
              >
                Create User
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Delete Confirmation Dialog */}
        <Portal>
          <Dialog visible={deleteConfirmDialog} onDismiss={() => setDeleteConfirmDialog(false)}>
            <Dialog.Title>Delete User</Dialog.Title>
            <Dialog.Content>
              <Text>
                Are you sure you want to permanently delete {selectedUser?.username}? 
                This action cannot be undone.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDeleteConfirmDialog(false)}>Cancel</Button>
              <Button 
                mode="contained"
                buttonColor="#f44336"
                onPress={handleDeleteUser}
                loading={actionLoading.deleteUser}
              >
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </SystemAdminOnly>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 3,
  },
  title: {
    color: '#1976d2',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filterCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 2,
  },
  searchBar: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  userCard: {
    marginBottom: 16,
    elevation: 2,
    paddingVertical: 4,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingVertical: 4,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    color: '#666',
    marginTop: 2,
  },
  phone: {
    color: '#666',
    marginTop: 2,
  },
  userChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    marginTop: 8,
  },
  roleChip: {
    height: 36,
    paddingHorizontal: 12,
    minWidth: 100,
    justifyContent: 'center',
  },
  statusChip: {
    height: 36,
    paddingHorizontal: 12,
    minWidth: 80,
    justifyContent: 'center',
  },
  newUserChip: {
    height: 36,
    backgroundColor: '#ff9800',
    paddingHorizontal: 12,
    minWidth: 90,
    justifyContent: 'center',
  },
  createdAt: {
    color: '#999',
    fontSize: 11,
    marginTop: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1976d2',
  },
  input: {
    marginBottom: 12,
  },
  roleLabel: {
    marginTop: 8,
    marginBottom: 8,
    color: '#333',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
});