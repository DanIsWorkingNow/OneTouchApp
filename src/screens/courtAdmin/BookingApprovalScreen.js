// Example: src/screens/admin/SystemAdminDashboard.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../constants/firebaseConfig';

export default function SystemAdminDashboard() {
  const { getUserDisplayInfo } = useAuth();
  const userInfo = getUserDisplayInfo();

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            🏛️ System Administrator Dashboard
          </Text>
          <Text variant="bodyLarge">
            Welcome, {userInfo?.name}!
          </Text>
          <Text variant="bodyMedium" style={styles.placeholder}>
            🚧 Dashboard coming soon...
          </Text>
          <Button 
            mode="outlined" 
            onPress={() => signOut(auth)}
            style={styles.button}
          >
            Sign Out
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
  },
  card: {
    elevation: 3
  },
  title: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16
  },
  placeholder: {
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
    color: '#666'
  },
  button: {
    marginTop: 20
  }
});