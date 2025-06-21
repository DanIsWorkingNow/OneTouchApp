// src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../constants/firebaseConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  // Role hierarchy for permission checking
  const roleHierarchy = {
    systemAdmin: 1,
    courtAdmin: 2,
    user: 3
  };

  const fetchUserProfile = async (firebaseUser) => {
    try {
      console.log('🔍 Fetching user profile for:', firebaseUser.uid);
      console.log('📧 User email:', firebaseUser.email);
      
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        console.log('👤 User role:', userData.role);
        console.log('🔑 User permissions:', userData.permissions);
        console.log('📊 User status:', userData.status);
        
        // Merge Firebase user with Firestore user data
        const mergedUser = {
          ...firebaseUser,
          ...userData,
          uid: firebaseUser.uid,
          email: firebaseUser.email
        };

        setUser(mergedUser);
        setUserRole(userData.role || 'user');
        setUserPermissions(userData.permissions || {});

        // Update last login time
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          lastLoginAt: new Date()
        });

        console.log('✅ User profile loaded successfully');
      } else {
        console.log('⚠️ User document not found in Firestore, creating basic profile...');
        
        // Create basic user document if it doesn't exist
        const basicUserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Unknown User',
          role: 'user',
          permissions: {
            canCreateBookings: true,
            canUpdateProfile: true,
            canViewOwnBookings: true
          },
          status: 'active',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          isFirstLogin: true
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), basicUserData);
        
        setUser({ ...firebaseUser, ...basicUserData });
        setUserRole('user');
        setUserPermissions(basicUserData.permissions);
        
        console.log('✅ Basic user profile created');
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      // Set fallback user data on error
      setUser(firebaseUser);
      setUserRole('user');
      setUserPermissions({
        canCreateBookings: true,
        canUpdateProfile: true,
        canViewOwnBookings: true
      });
    }
  };

  useEffect(() => {
    console.log('🔥 Setting up Firebase auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Auth state changed');
      
      if (firebaseUser) {
        console.log('✅ User authenticated:', firebaseUser.email);
        await fetchUserProfile(firebaseUser);
      } else {
        console.log('❌ No user authenticated');
        setUser(null);
        setUserRole(null);
        setUserPermissions({});
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Permission checking functions
  const hasPermission = (permission) => {
    const result = userPermissions[permission] === true;
    console.log(`🔍 Permission check: ${permission} = ${result}`);
    return result;
  };

  const hasRole = (role) => {
    const result = userRole === role;
    console.log(`🔍 Role check: ${role} = ${result} (current: ${userRole})`);
    return result;
  };

  const hasMinimumRole = (minimumRole) => {
    if (!userRole) {
      console.log(`🔍 Minimum role check: ${minimumRole} = false (no current role)`);
      return false;
    }
    const result = roleHierarchy[userRole] <= roleHierarchy[minimumRole];
    console.log(`🔍 Minimum role check: ${minimumRole} = ${result} (${userRole} level ${roleHierarchy[userRole]} vs ${minimumRole} level ${roleHierarchy[minimumRole]})`);
    return result;
  };

  // Convenience role checking functions
  const isSystemAdmin = () => hasRole('systemAdmin');
  const isCourtAdmin = () => hasRole('courtAdmin');
  const isUser = () => hasRole('user');
  const isAdminLevel = () => hasMinimumRole('courtAdmin'); // courtAdmin or higher

  // Get user display info
  const getUserDisplayInfo = () => {
    if (!user) return null;
    
    return {
      name: user.username || user.displayName || user.email?.split('@')[0] || 'Unknown',
      email: user.email,
      role: userRole,
      roleDisplay: getRoleDisplayName(userRole),
      avatar: user.photoURL || null,
      status: user.status || 'active'
    };
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      systemAdmin: 'System Administrator',
      courtAdmin: 'Court Administrator',
      user: 'User'
    };
    return roleNames[role] || 'Unknown Role';
  };

  const getRoleIcon = (role) => {
    const roleIcons = {
      systemAdmin: 'shield-crown',
      courtAdmin: 'shield-account',
      user: 'account'
    };
    return roleIcons[role] || 'account';
  };

  const getRoleColor = (role) => {
    const roleColors = {
      systemAdmin: '#d32f2f',
      courtAdmin: '#1976d2',
      user: '#388e3c'
    };
    return roleColors[role] || '#666';
  };

  // Context value
  const value = {
    // User data
    user,
    userRole,
    userPermissions,
    loading,
    
    // Permission checking
    hasPermission,
    hasRole,
    hasMinimumRole,
    
    // Convenience role checkers
    isSystemAdmin,
    isCourtAdmin,
    isUser,
    isAdminLevel,
    
    // Utility functions
    getUserDisplayInfo,
    getRoleDisplayName,
    getRoleIcon,
    getRoleColor,
    
    // Refresh user data
    refetchUser: () => {
      if (auth.currentUser) {
        return fetchUserProfile(auth.currentUser);
      }
    }
  };

  // Debug logging
  console.log('🔄 AuthContext state:', {
    userEmail: user?.email,
    userRole,
    hasUser: !!user,
    loading,
    permissionCount: Object.keys(userPermissions).length
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};