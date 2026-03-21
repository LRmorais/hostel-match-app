import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebase';
import { userService } from './userService';
import { User } from '../types';

interface AuthResponse {
  success: boolean;
  error?: string;
  user?: User;
}

export const authService = {
  // Register new user
  async register(email: string, password: string, fullName: string = ''): Promise<AuthResponse> {
    try {
      // Normalize email to lowercase to prevent case sensitivity issues
      const normalizedEmail = email.trim().toLowerCase();

      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const firebaseUser = userCredential.user;

      // Update display name if provided
      if (fullName.trim()) {
        await updateProfile(firebaseUser, {
          displayName: fullName,
        });
      }

      // Create initial user document in Firestore
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: fullName,
        nationality: '',
        languages: [],
        bio: '',
        profileStatus: 'incomplete',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createProfileResult = await userService.createUserProfile(userData);
      if (!createProfileResult.success) {
        // If Firestore creation fails, we should consider rolling back the Firebase Auth user
        // For now, we'll log the error and continue
        console.error('Failed to create user profile in Firestore:', createProfileResult.error);
      }

      return { success: true, user: userData };
    } catch (error: any) {
      return {
        success: false,
        error: this.getAuthErrorMessage(error.code)
      };
    }
  },

  // Login user
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Basic validation
      if (!email || !email.trim()) {
        return {
          success: false,
          error: 'Por favor, digite seu e-mail'
        };
      }

      if (!password || !password.trim()) {
        return {
          success: false,
          error: 'Por favor, digite sua senha'
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return {
          success: false,
          error: 'Por favor, digite um e-mail válido'
        };
      }

      const emailToUse = email.trim().toLowerCase();

      await signInWithEmailAndPassword(auth, emailToUse, password);
      return { success: true };
    } catch (error: any) {

      return {
        success: false,
        error: this.getAuthErrorMessage(error.code)
      };
    }
  },

  // Logout user
  async logout(): Promise<AuthResponse> {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: this.getAuthErrorMessage(error.code)
      };
    }
  },

  // Update user profile
  async updateUserProfile(displayName: string, photoURL?: string): Promise<AuthResponse> {
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
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  },

  // Change password — requires current password for re-authentication
  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      // Re-authenticate before changing password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: this.getAuthErrorMessage(error.code),
      };
    }
  },

  // Get current Firebase user
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  // Get user ID
  getCurrentUserId(): string | null {
    return auth.currentUser?.uid || null;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  },


  // Helper function to translate Firebase auth error codes to Portuguese
  getAuthErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      // Registration errors
      'auth/email-already-in-use': 'Este e-mail já está sendo usado por outra conta',
      'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres',
      'auth/invalid-email': 'O e-mail informado não é válido',

      // Login errors
      'auth/user-not-found': 'Nenhuma conta encontrada com este e-mail',
      'auth/wrong-password': 'Senha incorreta',
      'auth/invalid-credential': 'E-mail ou senha incorretos',
      'auth/user-disabled': 'Esta conta foi bloqueada',
      'auth/too-many-requests': 'Muitas tentativas de login. Tente novamente mais tarde',
      'auth/invalid-login-credentials': 'E-mail ou senha incorretos',

      // General errors
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
      'auth/operation-not-allowed': 'Operação não permitida',
      'auth/requires-recent-login': 'Esta operação requer autenticação recente',
    };

    return errorMessages[errorCode] || 'Erro inesperado. Tente novamente';
  },
};
