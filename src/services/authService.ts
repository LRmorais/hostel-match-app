import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';

export const authService = {
  // Register new user
  async register(email: string, password: string, fullName: string = ''): Promise<{success: boolean, error?: string}> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name if provided
      if (fullName.trim()) {
        await updateProfile(user, {
          displayName: fullName,
        });
      }

      // Create initial user document
      const userData: Partial<User> = {
        uid: user.uid,
        email: user.email!,
        displayName: fullName,
        nationality: '',
        languages: [],
        bio: '',
        profileStatus: 'incomplete',
        createdAt: Timestamp.now().toDate(),
        updatedAt: Timestamp.now().toDate(),
      };

      await setDoc(doc(db, 'users', user.uid), userData);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Login user
  async login(email: string, password: string): Promise<{success: boolean, error?: string}> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Logout user
  async logout(): Promise<{success: boolean, error?: string}> {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<{success: boolean, error?: string}> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Update user profile
  async updateUserProfile(displayName: string, photoURL?: string): Promise<{success: boolean, error?: string}> {
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName,
          photoURL,
        });
        return { success: true };
      } else {
        return { success: false, error: 'Usuário não autenticado' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
