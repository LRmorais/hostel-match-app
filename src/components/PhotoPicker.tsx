import React, { useState, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useImageUpload } from '../hooks/useImageUpload';

export interface PhotoPickerRef {
  uploadCurrentPhoto: () => Promise<string | null>;
}

interface PhotoPickerProps {
  currentPhoto?: string | null;
  onPhotoSelect: (uri: string) => void;
  onPhotoUpload?: (downloadURL: string) => void;
  autoUpload?: boolean; // New prop to control auto upload behavior
  size?: number;
}

const PhotoPicker = forwardRef<PhotoPickerRef, PhotoPickerProps>((
  {
    currentPhoto,
    onPhotoSelect,
    onPhotoUpload,
    autoUpload = false, // Default to false - no auto upload
    size = 120,
  },
  ref
) => {
  const [showOptions, setShowOptions] = useState(false);
  const { uploadImage, deleteImage, getFileIdFromUrl, uploadState } = useImageUpload();

  const handleImageSelection = async (uri: string) => {
    try {
      // Always update the local state immediately
      onPhotoSelect(uri);

      // Only upload to Firebase if autoUpload is enabled
      if (autoUpload && onPhotoUpload) {
        const downloadURL = await uploadImage(uri, 'profile-photos');
        onPhotoUpload(downloadURL);
      }
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível processar a imagem');
      // Revert to previous photo if upload fails
      onPhotoSelect(currentPhoto || '');
    }
  };

  // Method to upload current photo (to be called externally)
  const uploadCurrentPhoto = async (): Promise<string | null> => {
    if (!currentPhoto || currentPhoto.includes('appwrite') || currentPhoto.startsWith('https://cloud.appwrite.io')) {
      return currentPhoto || null; // Already uploaded or no photo
    }

    try {
      return await uploadImage(currentPhoto, 'profile-photos');
    } catch (error) {
      throw error;
    }
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    uploadCurrentPhoto,
  }));

  const requestPermissions = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraPermission.status !== 'granted' && galleryPermission.status !== 'granted') {
        Alert.alert(
            'Permissões necessárias',
            'Precisamos de acesso à câmera e galeria para que você possa adicionar uma foto de perfil.',
            [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error: any) {
      Alert.alert('Erro', `Erro ao solicitar permissões: ${error?.message || 'Erro desconhecido'}`);
      return false;
    }
  };

  const handlePhotoPress = async () => {
    const hasPermissions = await requestPermissions();
    if (hasPermissions) {
      setShowOptions(true);
    }
  };

  const pickImageFromGallery = async () => {
    setShowOptions(false);

    // KEY FIX: delay to let the modal fully close before opening the picker
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1] as [number, number],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleImageSelection(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível abrir a galeria');
    }
  };

  const takePhotoWithCamera = async () => {
    setShowOptions(false);

    // KEY FIX: delay to let the modal fully close before opening the camera
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1] as [number, number],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleImageSelection(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível abrir a câmera');
    }
  };

  const removePhoto = async () => {
    setShowOptions(false);
    Alert.alert(
      'Remover foto',
      'Tem certeza que deseja remover sua foto de perfil?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from Appwrite Storage if it's an Appwrite URL
              if (currentPhoto && currentPhoto.includes('appwrite')) {
                const fileId = getFileIdFromUrl(currentPhoto);
                if (fileId) {
                  await deleteImage(fileId);
                }
              }
              onPhotoSelect('');
            } catch (error) {
              // Even if deletion fails, clear the local state
              onPhotoSelect('');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.photoContainer, { width: size, height: size }]}
        onPress={handlePhotoPress}
        activeOpacity={0.8}
      >
        {currentPhoto ? (
          <View style={[{ width: size, height: size }]}>
            <Image
              source={{ uri: currentPhoto }}
              style={[styles.profilePhoto, { width: size, height: size }]}
            />
            {uploadState.isUploading && (
              <View style={[styles.uploadOverlay, { width: size, height: size }]}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.uploadText}>
                  {uploadState.progress < 100 ? `${uploadState.progress}%` : 'Finalizando...'}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.photoPlaceholder, { width: size, height: size }]}>
            <View style={styles.cameraIcon}>
              <Text style={styles.cameraIconText}>📷</Text>
            </View>
          </View>
        )}

        <View style={styles.addIcon}>
          <Text style={styles.addIconText}>
            {currentPhoto ? '✏️' : '📷'}
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.photoHint}>
        {uploadState.isUploading
          ? 'Fazendo upload da imagem...'
          : 'Toque para adicionar foto'
        }
      </Text>

      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsContainer}>
            <Text style={styles.optionsTitle}>Escolha uma opção</Text>

            <TouchableOpacity
              style={[styles.optionButton, uploadState.isUploading && styles.disabledButton]}
              onPress={takePhotoWithCamera}
              disabled={uploadState.isUploading}
            >
              <Text style={styles.optionIcon}>📷</Text>
              <Text style={styles.optionText}>Tirar foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, uploadState.isUploading && styles.disabledButton]}
              onPress={pickImageFromGallery}
              disabled={uploadState.isUploading}
            >
              <Text style={styles.optionIcon}>🖼️</Text>
              <Text style={styles.optionText}>Escolher da galeria</Text>
            </TouchableOpacity>

            {currentPhoto && (
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  styles.removeButton,
                  uploadState.isUploading && styles.disabledButton
                ]}
                onPress={removePhoto}
                disabled={uploadState.isUploading}
              >
                <Text style={styles.optionIcon}>🗑️</Text>
                <Text style={[styles.optionText, styles.removeText]}>Remover foto</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  photoContainer: {
    borderRadius: 60,
    position: 'relative',
    alignSelf: 'center',
  },
  photoPlaceholder: {
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  profilePhoto: {
    borderRadius: 60,
  },
  cameraIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconText: {
    fontSize: 24,
    color: '#999',
  },
  addIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addIconText: {
    fontSize: 16,
    color: '#fff',
  },
  photoHint: {
    fontSize: 14,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 24,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#e9ecef',
  },
  removeButton: {
    backgroundColor: '#ffebee',
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  removeText: {
    color: '#d32f2f',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

PhotoPicker.displayName = 'PhotoPicker';

export default PhotoPicker;
