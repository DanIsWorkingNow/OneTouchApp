import React from 'react';
import { View, Alert } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { createSamplePendingBookings } from '../utils/createPendingBookings';

export default function DevTools() {
  const runScript = async () => {
    try {
      const result = await createSamplePendingBookings();
      Alert.alert(
        result.success ? '✅ Success' : '❌ Error',
        result.success ? result.message : result.error
      );
    } catch (error) {
      Alert.alert('❌ Error', error.message);
    }
  };

  return (
    <Card style={{ margin: 16, backgroundColor: '#fff3cd' }}>
      <Card.Content>
        <Text variant="titleMedium">🛠️ Development Tools</Text>
        <Button
          mode="contained"
          onPress={runScript}
          style={{ marginTop: 10 }}
        >
          Create Sample Pending Bookings
        </Button>
      </Card.Content>
    </Card>
  );
}