// src/components/ProtectedRoute.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../constants/firebaseConfig';
import { Colors } from '../constants/Colors';

// Generic protected route component
export const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  requiredPermission,
  fallbackComponent,
  showAccessDenied = true
}) => {
  const { hasRole, hasPermission, hasMinimumRole, userRole, getUserDisplayInfo } = useAuth();

  const checkAccess = () => {
    console.log('🛡️ ProtectedRoute - Checking access');
    console.log('Required role:', requiredRole);
    console.log('Required permission:', requiredPermission);
    console.log('Current user role:', userRole);
    
    // Check role requirement
    if (requiredRole && !hasRole(requiredRole) && !hasMinimumRole(requiredRole)) {
      console.log('❌ Access denied: insufficient role');
      return false;
    }
    
    // Check permission requirement
    if (requiredPermission && !hasPermission(requiredPermission)) {
      console.log('❌ Access denied: missing permission');
      return false;
    }
    
    console.log('✅ Access granted');
    return true;
  };

  const hasAccess = checkAccess();

  if (!hasAccess) {
    if (fallbackComponent) {
      return fallbackComponent;
    }

    if (!showAccessDenied) {
      return null;
    }

    const userInfo = getUserDisplayInfo();

    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="headlineSmall" style={styles.title}>
              🚫 Access Restricted
            </Text>
            
            <Text variant="bodyLarge" style={styles.message}>
              You don't have permission to access this feature.
            </Text>
            
            <View style={styles.detailsContainer}>
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Required:
              </Text>
              <Text variant="bodyMedium" style={styles.detailValue}>
                {requiredRole ? `${requiredRole} role` : ''}
                {requiredPermission ? `${requiredPermission} permission` : ''}
              </Text>
              
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Your Role:
              </Text>
              <Text variant="bodyMedium" style={[styles.detailValue, { color: userInfo ? Colors.primary : '#f44336' }]}>
                {userInfo?.roleDisplay || 'No role assigned'}
              </Text>
            </View>
            
            <View style={styles.buttonContainer}>
              <Button 
                mode="outlined" 
                onPress={() => console.log('Navigate back')}
                style={styles.backButton}
              >
                Go Back
              </Button>
              
              <Button 
                mode="contained" 
                onPress={() => signOut(auth)}
                style={styles.signOutButton}
                buttonColor="#d32f2f"
              >
                Switch Account
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return children;
};

// Specific role-based protectors
export const SystemAdminOnly = ({ children, fallback, showAccessDenied = true }) => (
  <ProtectedRoute 
    requiredRole="systemAdmin" 
    fallbackComponent={fallback}
    showAccessDenied={showAccessDenied}
  >
    {children}
  </ProtectedRoute>
);

export const CourtAdminOnly = ({ children, fallback, showAccessDenied = true }) => (
  <ProtectedRoute 
    requiredRole="courtAdmin" 
    fallbackComponent={fallback}
    showAccessDenied={showAccessDenied}
  >
    {children}
  </ProtectedRoute>
);

export const AdminsOnly = ({ children, fallback, showAccessDenied = true }) => (
  <ProtectedRoute 
    requiredRole="courtAdmin" 
    fallbackComponent={fallback}
    showAccessDenied={showAccessDenied}
  >
    {children}
  </ProtectedRoute>
);

// Permission-based protectors
export const RequirePermission = ({ permission, children, fallback, showAccessDenied = true }) => (
  <ProtectedRoute 
    requiredPermission={permission} 
    fallbackComponent={fallback}
    showAccessDenied={showAccessDenied}
  >
    {children}
  </ProtectedRoute>
);

// Component to show content only to specific roles (without blocking)
export const ShowToRole = ({ role, children }) => {
  const { hasRole, hasMinimumRole } = useAuth();
  
  if (hasRole(role) || hasMinimumRole(role)) {
    return children;
  }
  
  return null;
};

// Component to show content only if user has permission
export const ShowWithPermission = ({ permission, children }) => {
  const { hasPermission } = useAuth();
  
  if (hasPermission(permission)) {
    return children;
  }
  
  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  card: {
    width: '100%',
    maxWidth: 400,
    elevation: 4
  },
  cardContent: {
    alignItems: 'center',
    padding: 24
  },
  title: {
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center'
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 22
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 24
  },
  detailLabel: {
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333'
  },
  detailValue: {
    color: '#666',
    marginBottom: 4
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  backButton: {
    flex: 1
  },
  signOutButton: {
    flex: 1
  }
});