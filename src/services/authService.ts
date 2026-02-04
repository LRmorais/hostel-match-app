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
  async register(email: string, password: string): Promise<void> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create initial user document
    const userData: Partial<User> = {
      uid: user.uid,
      email: user.email!,
      displayName: '',
      nationality: '',
      languages: [],
      bio: '',
      profileStatus: 'incomplete',
      createdAt: Timestamp.now().toDate(),
      updatedAt: Timestamp.now().toDate(),
    };

    await setDoc(doc(db, 'users', user.uid), userData);
  },

  // Login user
  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
  },

  // Logout user
  async logout(): Promise<void> {
    await signOut(auth);
  },

  // Reset password
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  // Update user profile
  async updateUserProfile(displayName: string, photoURL?: string): Promise<void> {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL,
      });
    }
  },
};
