import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../services/firebase';
import { userService } from '../services/userService';
import { User } from '../types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasCompleteProfile: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  user: null,
  loading: true,
  isAuthenticated: false,
  hasCompleteProfile: false,
  refreshUser: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [minSplashTime, setMinSplashTime] = useState(true);

  useEffect(() => {
    // Garantir tempo mínimo de splash screen (3.5 segundos para as animações)
    const minSplashTimer = setTimeout(() => {
      setMinSplashTime(false);
    }, 3500);

    return () => clearTimeout(minSplashTimer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userResult = await userService.getUserProfile(firebaseUser.uid);
          if (userResult.success && userResult.data) {
            setUser(userResult.data);
          } else {
            console.warn('User profile not found in Firestore:', userResult.error);
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAuthenticated = !!firebaseUser;
  const hasCompleteProfile = user?.profileStatus === 'complete';

  const refreshUser = async () => {
    if (!firebaseUser) return;
    try {
      const userResult = await userService.getUserProfile(firebaseUser.uid);
      if (userResult.success && userResult.data) {
        setUser(userResult.data);
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  const value: AuthContextType = {
    firebaseUser,
    user,
    loading: loading || minSplashTime,
    isAuthenticated,
    hasCompleteProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
