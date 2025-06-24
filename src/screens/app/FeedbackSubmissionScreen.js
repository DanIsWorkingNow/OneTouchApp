import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Chip,
  RadioButton,
  Divider,
  HelperText,
  Snackbar,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../constants/firebaseConfig';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Colors } from '../../constants/Colors';

export default function FeedbackSubmissionScreen({ navigation, route }) {
  const { user } = useAuth();
  const { courtId, courtName } = route.params || {};

  // Form state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contactMethod, setContactMethod] = useState('email');
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Available courts for selection
  const [courts, setCourts] = useState([]);
  const [selectedCourtId, setSelectedCourtId] = useState(courtId || '');
  const [selectedCourtName, setSelectedCourtName] = useState(courtName || '');

  const categories = [
    { id: 'maintenance', label: 'Court Maintenance', icon: 'build' },
    { id: 'cleanliness', label: 'Cleanliness', icon: 'cleaning-services' },
    { id: 'facilities', label: 'Facilities', icon: 'location-city' },
    { id: 'booking', label: 'Booking Issues', icon: 'event-busy' },
    { id: 'staff', label: 'Staff Service', icon: 'support-agent' },
    { id: 'suggestion', label: 'Suggestion', icon: 'lightbulb' },
    { id: 'other', label: 'Other', icon: 'help' },
  ];

  const severityLevels = [
    { value: 'low', label: 'Low Priority', color: '#4CAF50', description: 'Minor issue, no urgency' },
    { value: 'medium', label: 'Medium Priority', color: '#FF9800', description: 'Normal issue requiring attention' },
    { value: 'high', label: 'High Priority', color: '#F44336', description: 'Urgent issue affecting service' },
  ];

  // Load courts on component mount
  useEffect(() => {
    loadCourts();
  }, []);

  const loadCourts = async () => {
    try {
      const courtsQuery = query(collection(db, 'courts'));
      const courtsSnapshot = await getDocs(courtsQuery);
      const courtsData = courtsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCourts(courtsData);
    } catch (error) {
      console.error('Error loading courts:', error);
    }
  };

  const showSnackbarMessage = (message) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
  };

  const validateForm = () => {
    if (!selectedCategory) {
      showSnackbarMessage('Please select a feedback category');
      return false;
    }
    if (!title.trim()) {
      showSnackbarMessage('Please enter a title for your feedback');
      return false;
    }
    if (!description.trim()) {
      showSnackbarMessage('Please describe your feedback');
      return false;
    }
    if (selectedCategory !== 'suggestion' && !selectedCourtId) {
      showSnackbarMessage('Please select which court this feedback is about');
      return false;
    }
    return true;
  };

  const handleSubmitFeedback = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const feedbackData = {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'User',
        userEmail: user.email,
        category: selectedCategory,
        severity,
        title: title.trim(),
        description: description.trim(),
        status: 'new',
        priority: severity === 'high' ? 1 : severity === 'medium' ? 2 : 3,
        contactMethod,
        adminResponse: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add court information if selected
      if (selectedCourtId && selectedCourtName) {
        feedbackData.courtId = selectedCourtId;
        feedbackData.courtName = selectedCourtName;
      }

      await addDoc(collection(db, 'feedback'), feedbackData);

      Alert.alert(
        '✅ Feedback Submitted',
        'Thank you for your feedback! We\'ll review it and get back to you soon.',
        [
          {
            text: 'View My Feedback',
            onPress: () => navigation.navigate('MyFeedback')
          },
          {
            text: 'Go Home',
            onPress: () => navigation.navigate('Home')
          }
        ]
      );

      // Reset form
      setSelectedCategory('');
      setTitle('');
      setDescription('');
      setSeverity('medium');
      setSelectedCourtId(courtId || '');
      setSelectedCourtName(courtName || '');

    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert(
        '❌ Error',
        'Failed to submit feedback. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.icon : 'help';
  };

  const getSeverityColor = (level) => {
    const severityLevel = severityLevels.find(s => s.value === level);
    return severityLevel ? severityLevel.color : '#FF9800';
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerContent}>
              <MaterialIcons name="feedback" size={24} color={Colors.primary} />
              <Text variant="titleLarge" style={styles.headerTitle}>
                Submit Feedback
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              Help us improve by sharing your experience
            </Text>
          </Card.Content>
        </Card>

        {/* Category Selection */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Feedback Category
            </Text>
            <Text variant="bodySmall" style={styles.sectionSubtitle}>
              What is your feedback about?
            </Text>
            
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  icon={category.icon}
                  selected={selectedCategory === category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category.id && styles.selectedCategoryChip
                  ]}
                  textStyle={selectedCategory === category.id && styles.selectedCategoryText}
                >
                  {category.label}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Court Selection (if not suggestion) */}
        {selectedCategory && selectedCategory !== 'suggestion' && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Which Court?
              </Text>
              <Text variant="bodySmall" style={styles.sectionSubtitle}>
                Select the court this feedback is about
              </Text>
              
              <View style={styles.courtGrid}>
                {courts.map((court) => (
                  <Chip
                    key={court.id}
                    selected={selectedCourtId === court.id}
                    onPress={() => {
                      setSelectedCourtId(court.id);
                      setSelectedCourtName(court.courtNumber || `Court ${court.number}`);
                    }}
                    style={[
                      styles.courtChip,
                      selectedCourtId === court.id && styles.selectedCourtChip
                    ]}
                  >
                    {court.courtNumber || `Court ${court.number}`}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Priority Level */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Priority Level
            </Text>
            <Text variant="bodySmall" style={styles.sectionSubtitle}>
              How urgent is this issue?
            </Text>
            
            <RadioButton.Group
              onValueChange={setSeverity}
              value={severity}
            >
              {severityLevels.map((level) => (
                <View key={level.value} style={styles.severityOption}>
                  <RadioButton
                    value={level.value}
                    color={level.color}
                  />
                  <View style={styles.severityContent}>
                    <Text style={[styles.severityLabel, { color: level.color }]}>
                      {level.label}
                    </Text>
                    <Text style={styles.severityDescription}>
                      {level.description}
                    </Text>
                  </View>
                </View>
              ))}
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {/* Feedback Details */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Feedback Details
            </Text>
            
            <TextInput
              label="Title"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
              placeholder="Brief summary of your feedback"
              maxLength={100}
            />
            <HelperText type="info">
              {title.length}/100 characters
            </HelperText>
            
            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={6}
              style={[styles.input, styles.textArea]}
              placeholder="Please provide details about your feedback..."
              maxLength={500}
            />
            <HelperText type="info">
              {description.length}/500 characters
            </HelperText>
          </Card.Content>
        </Card>

        {/* Contact Preference */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Response Preference
            </Text>
            <Text variant="bodySmall" style={styles.sectionSubtitle}>
              How would you like us to respond?
            </Text>
            
            <RadioButton.Group
              onValueChange={setContactMethod}
              value={contactMethod}
            >
              <View style={styles.contactOption}>
                <RadioButton value="email" />
                <Text style={styles.contactLabel}>Email notification</Text>
              </View>
              <View style={styles.contactOption}>
                <RadioButton value="app" />
                <Text style={styles.contactLabel}>In-app notification only</Text>
              </View>
              <View style={styles.contactOption}>
                <RadioButton value="none" />
                <Text style={styles.contactLabel}>No response needed</Text>
              </View>
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {/* Submit Button */}
        <Card style={styles.submitCard}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleSubmitFeedback}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
              buttonColor={Colors.primary}
              icon="send"
            >
              Submit Feedback
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    marginLeft: 12,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: Colors.textSecondary,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    marginBottom: 8,
  },
  selectedCategoryChip: {
    backgroundColor: Colors.primary,
  },
  selectedCategoryText: {
    color: 'white',
  },
  courtGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  courtChip: {
    marginBottom: 8,
  },
  selectedCourtChip: {
    backgroundColor: Colors.primary,
  },
  severityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  severityContent: {
    marginLeft: 8,
    flex: 1,
  },
  severityLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  severityDescription: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  input: {
    marginBottom: 8,
  },
  textArea: {
    minHeight: 120,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  submitCard: {
    marginBottom: 32,
  },
  submitButton: {
    borderRadius: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});