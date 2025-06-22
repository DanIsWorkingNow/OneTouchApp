// src/screens/admin/SystemLogsScreen.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';

export default function SystemLogsScreen() {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            📋 System Logs
          </Text>
          <Text variant="bodyLarge" style={styles.description}>
            View system activity, errors, and audit trails
          </Text>
          
          <Text variant="bodyMedium" style={styles.comingSoon}>
            🚧 Coming Soon - This screen will include:
          </Text>
          <Text variant="bodySmall" style={styles.featureList}>
            • User login/logout logs{'\n'}
            • Admin action audit trail{'\n'}
            • System error logs{'\n'}
            • Database activity logs{'\n'}
            • Export logs to file{'\n'}
            • Filter by date and type
          </Text>

          <Button 
            mode="contained" 
            style={styles.actionButton}
            onPress={() => console.log('System logs functionality coming soon')}
          >
            View Logs
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}


// Shared styles for all screens
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
  },
  welcomeCard: {
    marginBottom: 16,
    elevation: 3
  },
  card: {
    marginBottom: 16,
    elevation: 3
  },
  title: {
    color: '#1976d2',
    textAlign: 'center',
    marginBottom: 16
  },
  welcome: {
    textAlign: 'center',
    marginBottom: 8
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666'
  },
  sectionTitle: {
    color: '#1976d2',
    marginBottom: 16
  },
  roleChip: {
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: '#d32f2f'
  },
  buttonGrid: {
    gap: 12
  },
  actionButton: {
    paddingVertical: 8,
    marginBottom: 8
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap'
  },
  statItem: {
    alignItems: 'center',
    minWidth: 80
  },
  statNumber: {
    color: '#1976d2',
    fontWeight: 'bold'
  },
  statLabel: {
    color: '#666',
    textAlign: 'center'
  },
  signOutButton: {
    marginTop: 20
  },
  comingSoon: {
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#ff9800'
  },
  featureList: {
    lineHeight: 20,
    color: '#666',
    paddingLeft: 10,
    marginBottom: 20
  }
});