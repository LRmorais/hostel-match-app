import { useState } from 'react';
import { storage, appwriteConfigValues, generateId } from '../services/appwrite';
import { useAuth } from '../contexts/AuthContext';

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export const useImageUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const { firebaseUser } = useAuth();

  const uploadImage = async (uri: string, folder: string = 'profile-photos'): Promise<string> => {
    if (!firebaseUser) {
      throw new Error('Usuário não autenticado');
    }

    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
    });

    try {
      // Convert URI to File/Blob for upload
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create unique filename
      const timestamp = Date.now();
      const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const filename = `${folder}/${firebaseUser.uid}_${timestamp}.${extension}`;

      setUploadState(prev => ({ ...prev, progress: 30 }));

      // Create File object for Appwrite
      const file = new File([blob], filename, { type: `image/${extension}` });

      setUploadState(prev => ({ ...prev, progress: 60 }));

      // Upload to Appwrite Storage
      const uploadedFile = await storage.createFile(
        appwriteConfigValues.storageId,
        generateId(),
        file
      );

      setUploadState(prev => ({ ...prev, progress: 90 }));

      // Get file URL
      const fileUrl = storage.getFileView(
        appwriteConfigValues.storageId,
        uploadedFile.$id
      );

      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
      });

      return fileUrl.toString();
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao fazer upload da imagem';
      setUploadState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }
  };

  const deleteImage = async (fileId: string): Promise<void> => {
    try {
      await storage.deleteFile(appwriteConfigValues.storageId, fileId);
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw error for delete operations
    }
  };

  const getFileIdFromUrl = (url: string): string | null => {
    try {
      // Extract file ID from Appwrite URL
      const urlParts = url.split('/files/');
      if (urlParts.length > 1) {
        const fileIdPart = urlParts[1].split('/')[0];
        return fileIdPart;
      }
      return null;
    } catch {
      return null;
    }
  };

  return {
    uploadImage,
    deleteImage,
    getFileIdFromUrl,
    uploadState,
  };
};
