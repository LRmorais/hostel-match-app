import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
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
