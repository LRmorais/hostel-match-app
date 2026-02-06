// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "your-app-id",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Validate configuration in development
if (__DEV__ && firebaseConfig.apiKey === "your-api-key") {
  console.warn(
    '🔥 Firebase não configurado!\n' +
    '1. Copie .env.example para .env\n' +
    '2. Adicione suas credenciais do Firebase\n' +
    '3. Reinicie o servidor de desenvolvimento'
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence for React Native
let auth: Auth;

if (Platform.OS === 'web') {
  // For web, use default auth
  auth = getAuth(app);
} else {
  // For React Native, try to use initializeAuth with AsyncStorage persistence
  try {
    // Dynamic import to handle version differences
    const { getReactNativePersistence } = require('firebase/auth');
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  } catch (error) {
    // Fallback to regular getAuth if initializeAuth fails or getReactNativePersistence is not available
    console.warn('Firebase Auth: Using fallback initialization without explicit persistence');
    auth = getAuth(app);
  }
}

export { auth };

// Initialize other Firebase services
export const db = getFirestore(app);

// Note: File storage is handled by Appwrite, not Firebase Storage

export default app;

