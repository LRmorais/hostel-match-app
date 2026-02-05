import { useState } from 'react';
import { userService } from '../services/userService';
import { User } from '../types';

interface UseUserReturn {
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<Omit<User, 'uid' | 'email' | 'createdAt' | 'updatedAt'>>) => Promise<boolean>;
  completeProfile: (profileData: {
    nationality: string;
    languages: string[];
    bio: string;
  }) => Promise<boolean>;
  updateProfilePicture: (photoURL: string) => Promise<boolean>;
  validateProfile: (user: Partial<User>) => {
    isComplete: boolean;
    missingFields: string[];
  };
}

export const useUser = (uid?: string): UseUserReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (updates: Partial<Omit<User, 'uid' | 'email' | 'createdAt' | 'updatedAt'>>): Promise<boolean> => {
    if (!uid) {
      setError('User ID is required');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await userService.updateUserProfile(uid, updates);
      if (result.success) {
        return true;
      } else {
        setError(result.error || 'Erro ao atualizar perfil');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const completeProfile = async (profileData: {
    nationality: string;
    languages: string[];
    bio: string;
  }): Promise<boolean> => {
    if (!uid) {
      setError('User ID is required');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await userService.completeUserProfile(uid, profileData);
      if (result.success) {
        return true;
      } else {
        setError(result.error || 'Erro ao completar perfil');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProfilePicture = async (photoURL: string): Promise<boolean> => {
    if (!uid) {
      setError('User ID is required');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await userService.updateProfilePicture(uid, photoURL);
      if (result.success) {
        return true;
      } else {
        setError(result.error || 'Erro ao atualizar foto');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const validateProfile = (user: Partial<User>) => {
    return userService.validateProfileCompletion(user);
  };

  return {
    loading,
    error,
    updateProfile,
    completeProfile,
    updateProfilePicture,
    validateProfile,
  };
};
