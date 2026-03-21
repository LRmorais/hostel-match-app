import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { updateProfile, User as FirebaseAuthUser } from 'firebase/auth';
import { db } from './firebase';
import { User } from '../types';
import { APP_CONFIG } from '../utils/constants';

interface UserServiceResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export const userService = {
  // Create user profile in Firestore
  async createUserProfile(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<UserServiceResponse> {
    try {
      await setDoc(doc(db, APP_CONFIG.COLLECTIONS.USERS, userData.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error creating user profile:', error);
      return { success: false, error: 'Erro ao criar perfil do usuário' };
    }
  },

  // Get user profile
  async getUserProfile(uid: string): Promise<UserServiceResponse> {
    try {
      const docSnap = await getDoc(doc(db, APP_CONFIG.COLLECTIONS.USERS, uid));

      if (docSnap.exists()) {
        const userData = docSnap.data();
        // Convert Firestore timestamps to Date objects
        const user: User = {
          ...userData as User,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
        };
        return { success: true, data: user };
      } else {
        return { success: false, error: 'Perfil não encontrado' };
      }
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      return { success: false, error: 'Erro ao buscar perfil do usuário' };
    }
  },

  // Update user profile
  async updateUserProfile(uid: string, updates: Partial<Omit<User, 'uid' | 'email' | 'createdAt' | 'updatedAt'>>): Promise<UserServiceResponse> {
    try {
      await updateDoc(doc(db, APP_CONFIG.COLLECTIONS.USERS, uid), {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      return { success: false, error: 'Erro ao atualizar perfil do usuário' };
    }
  },

  // Full profile update: syncs Firebase Auth + Firestore + propagates to events
  async updateFullProfile(
    firebaseUser: FirebaseAuthUser,
    updates: {
      displayName?: string;
      photoURL?: string | null;
      bio?: string;
      nationality?: string;
      languages?: string[];
    },
  ): Promise<UserServiceResponse> {
    try {
      const uid = firebaseUser.uid;

      // 1. Update Firebase Auth profile (displayName / photoURL)
      const authUpdates: { displayName?: string; photoURL?: string | null } = {};
      if (updates.displayName !== undefined) authUpdates.displayName = updates.displayName;
      if (updates.photoURL !== undefined) authUpdates.photoURL = updates.photoURL;

      if (Object.keys(authUpdates).length > 0) {
        await updateProfile(firebaseUser, authUpdates);
      }

      // 2. Build Firestore user-doc update
      const firestoreUpdates: Record<string, any> = { updatedAt: serverTimestamp() };
      if (updates.displayName !== undefined) firestoreUpdates.displayName = updates.displayName;
      if (updates.photoURL !== undefined && updates.photoURL !== null) firestoreUpdates.photoURL = updates.photoURL;
      if (updates.bio !== undefined) firestoreUpdates.bio = updates.bio;
      if (updates.nationality !== undefined) firestoreUpdates.nationality = updates.nationality;
      if (updates.languages !== undefined) firestoreUpdates.languages = updates.languages;

      await updateDoc(doc(db, APP_CONFIG.COLLECTIONS.USERS, uid), firestoreUpdates);

      // 3. Propagate displayName / photoURL to events created by this user
      const needsEventPropagation = updates.displayName !== undefined || updates.photoURL !== undefined;
      if (needsEventPropagation) {
        try {
          const eventsQuery = query(
            collection(db, APP_CONFIG.COLLECTIONS.EVENTS),
            where('creatorId', '==', uid),
          );
          const snapshot = await getDocs(eventsQuery);

          if (!snapshot.empty) {
            const batch = writeBatch(db);
            const eventUpdates: Record<string, any> = { updatedAt: serverTimestamp() };
            if (updates.displayName !== undefined) eventUpdates.creatorName = updates.displayName;
            if (updates.photoURL !== undefined && updates.photoURL !== null) {
              eventUpdates.creatorPhotoURL = updates.photoURL;
            }

            snapshot.docs.forEach(eventDoc => {
              batch.update(eventDoc.ref, eventUpdates);
            });

            await batch.commit();
          }
        } catch (propagationError) {
          // Non-fatal: log but don't fail the whole update
          console.warn('Could not propagate profile changes to events:', propagationError);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating full profile:', error);
      return { success: false, error: 'Erro ao atualizar perfil' };
    }
  },

  // Complete user profile (mark as complete)
  async completeUserProfile(uid: string, profileData: {
    photoURL?: string | null;
    nationality: string;
    languages: string[];
    bio: string;
  }): Promise<UserServiceResponse> {
    try {
      const updateData: any = {
        nationality: profileData.nationality,
        languages: profileData.languages,
        bio: profileData.bio,
        profileStatus: 'complete',
        updatedAt: serverTimestamp(),
      };

      // Only add photoURL if it's provided
      if (profileData.photoURL) {
        updateData.photoURL = profileData.photoURL;
      }

      await updateDoc(doc(db, APP_CONFIG.COLLECTIONS.USERS, uid), updateData);

      return { success: true };
    } catch (error: any) {
      console.error('Error completing user profile:', error);
      return { success: false, error: 'Erro ao completar perfil do usuário' };
    }
  },

  // Update profile picture
  async updateProfilePicture(uid: string, photoURL: string): Promise<UserServiceResponse> {
    try {
      await updateDoc(doc(db, APP_CONFIG.COLLECTIONS.USERS, uid), {
        photoURL,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error updating profile picture:', error);
      return { success: false, error: 'Erro ao atualizar foto do perfil' };
    }
  },

  // Validate profile completion
  validateProfileCompletion(user: Partial<User>): {
    isComplete: boolean;
    missingFields: string[];
  } {
    const requiredFields = ['displayName', 'nationality', 'bio'];
    const missingFields: string[] = [];

    requiredFields.forEach(field => {
      if (!user[field as keyof User] || (user[field as keyof User] as string).trim() === '') {
        missingFields.push(field);
      }
    });

    // Check if languages array has at least one language
    if (!user.languages || user.languages.length === 0) {
      missingFields.push('languages');
    }

    return {
      isComplete: missingFields.length === 0,
      missingFields
    };
  },

  // Get user's blocked users (for future implementation)
  async getBlockedUsers(uid: string): Promise<UserServiceResponse> {
    try {
      // This would fetch from a subcollection or array field
      // For now, return empty array
      return { success: true, data: [] };
    } catch (error: any) {
      console.error('Error getting blocked users:', error);
      return { success: false, error: 'Erro ao buscar usuários bloqueados' };
    }
  },

  // Block a user (for future implementation)
  async blockUser(uid: string, targetUid: string): Promise<UserServiceResponse> {
    try {
      // This would add to a subcollection or array field
      // Implementation depends on chosen data structure
      return { success: true };
    } catch (error: any) {
      console.error('Error blocking user:', error);
      return { success: false, error: 'Erro ao bloquear usuário' };
    }
  },
};
