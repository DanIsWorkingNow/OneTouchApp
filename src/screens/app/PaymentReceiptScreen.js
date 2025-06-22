// src/screens/app/PaymentReceiptScreen.js
// Complete payment receipt upload system

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { 
  Text, Card, Button, RadioButton, ActivityIndicator,
  Portal, Modal, TextInput, Divider
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../constants/firebaseConfig';
import { Colors } from '../../constants/Colors';

export default function PaymentReceiptScreen({ route, navigation }) {
  const { bookingId, bookingData } = route.params;
  
  const [booking, setBooking] = useState(bookingData || null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [receiptImage, setReceiptImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(!bookingData);
  const [notes, setNotes] = useState('');

  const paymentMethods = [
    { value: 'fpx', label: 'Online Banking (FPX)', icon: '🏦' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: '💰' },
    { value: 'ewallet', label: 'E-Wallet (GrabPay/Touch n Go)', icon: '📱' },
    { value: 'cash', label: 'Cash Payment at Counter', icon: '💵' }
  ];

  useEffect(() => {
    if (!bookingData) {
      loadBookingData();
    }
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload receipts!');
    }
  };

  const loadBookingData = async () => {
    try {
      setLoading(true);
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      if (bookingDoc.exists()) {
        setBooking(bookingDoc.data());
      }
    } catch (error) {
      console.error('Error loading booking:', error);
      Alert.alert('Error', 'Failed to load booking data');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setReceiptImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setReceiptImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo: ' + error.message);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Upload Receipt',
      'Choose how to upload your payment receipt',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const uploadReceipt = async () => {
    if (!paymentMethod) {
      Alert.alert('Missing Information', 'Please select a payment method');
      return;
    }

    if (!receiptImage && paymentMethod !== 'cash') {
      Alert.alert('Missing Receipt', 'Please upload a payment receipt');
      return;
    }

    try {
      setUploading(true);
      let receiptUrl = null;

      // Upload image to Firebase Storage (if not cash payment)
      if (receiptImage) {
        const response = await fetch(receiptImage.uri);
        const blob = await response.blob();
        
        const filename = `receipts/${bookingId}_${Date.now()}.jpg`;
        const storageRef = ref(storage, filename);
        
        console.log('Uploading receipt image...');
        await uploadBytes(storageRef, blob);
        receiptUrl = await getDownloadURL(storageRef);
        console.log('Receipt uploaded successfully:', receiptUrl);
      }

      // Update booking with receipt information
      const updateData = {
        paymentMethod: paymentMethod,
        paymentReceiptUrl: receiptUrl,
        receiptUploadedAt: new Date(),
        paymentNotes: notes,
        updatedAt: new Date(),
        // Keep status as pending for admin approval
        status: 'pending',
        paymentStatus: 'under_review'
      };

      await updateDoc(doc(db, 'bookings', bookingId), updateData);

      Alert.alert(
        '✅ Receipt Uploaded!',
        'Your payment receipt has been submitted for review. You will be notified once your booking is approved.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MyBookings')
          }
        ]
      );

    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', 'Failed to upload receipt: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading booking details...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <Text>Booking not found</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Booking Summary */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>Booking Summary</Text>
          <Text variant="bodyMedium">Court: {booking.courtName}</Text>
          <Text variant="bodyMedium">Date: {booking.date}</Text>
          <Text variant="bodyMedium">Time: {booking.timeSlot}</Text>
          <Text variant="bodyMedium">Duration: {booking.duration} hour(s)</Text>
          <Text variant="titleMedium" style={styles.totalAmount}>
            Total: RM {booking.totalAmount}
          </Text>
        </Card.Content>
      </Card>

      {/* Payment Method Selection */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            💳 Payment Method
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Select how you paid for this booking
          </Text>
          
          {paymentMethods.map((method) => (
            <View key={method.value} style={styles.radioItem}>
              <RadioButton
                value={method.value}
                status={paymentMethod === method.value ? 'checked' : 'unchecked'}
                onPress={() => setPaymentMethod(method.value)}
              />
              <Text style={styles.radioLabel}>
                {method.icon} {method.label}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Receipt Upload */}
      {paymentMethod && paymentMethod !== 'cash' && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              📄 Payment Receipt
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              Upload a clear photo of your payment receipt
            </Text>

            {receiptImage ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: receiptImage.uri }} style={styles.receiptImage} />
                <Button 
                  mode="outlined" 
                  onPress={showImageOptions}
                  style={styles.changeImageButton}
                >
                  Change Image
                </Button>
              </View>
            ) : (
              <Button
                mode="contained"
                onPress={showImageOptions}
                icon="camera"
                style={styles.uploadButton}
              >
                Upload Receipt
              </Button>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Cash Payment Instructions */}
      {paymentMethod === 'cash' && (
        <Card style={styles.instructionsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              💵 Cash Payment Instructions
            </Text>
            <Text variant="bodyMedium">
              Please pay at the counter before your booking time:
            </Text>
            <Text variant="bodySmall" style={styles.instructions}>
              • Show this booking confirmation to staff{'\n'}
              • Pay RM {booking.totalAmount} in cash{'\n'}
              • Get a receipt from the counter{'\n'}
              • Your booking will be confirmed after payment
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Additional Notes */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            📝 Additional Notes (Optional)
          </Text>
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Any additional information about your payment..."
            value={notes}
            onChangeText={setNotes}
            style={styles.notesInput}
          />
        </Card.Content>
      </Card>

      {/* Submit Button */}
      <Button
        mode="contained"
        onPress={uploadReceipt}
        loading={uploading}
        disabled={uploading || !paymentMethod}
        style={styles.submitButton}
        icon="check"
      >
        {uploading ? 'Submitting...' : 'Submit for Review'}
      </Button>

      <View style={styles.bottomSpacing} />
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  summaryCard: {
    margin: 16,
    backgroundColor: Colors.primary + '15',
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  instructionsCard: {
    margin: 16,
    marginTop: 8,
    backgroundColor: '#e8f5e8',
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    marginBottom: 12,
  },
  totalAmount: {
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  radioLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  receiptImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  changeImageButton: {
    marginTop: 8,
  },
  uploadButton: {
    marginTop: 12,
  },
  instructions: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    lineHeight: 20,
  },
  notesInput: {
    marginTop: 8,
  },
  submitButton: {
    margin: 16,
    marginTop: 24,
    paddingVertical: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});