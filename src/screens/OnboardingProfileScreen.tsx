import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { TextField, Button, CountryPicker, PhotoPicker } from '../components';
import type { PhotoPickerRef } from '../components/PhotoPicker';
import { APP_CONFIG } from '../utils/constants';

const OnboardingProfileScreen: React.FC = () => {
  const { firebaseUser, refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Refs
  const photoPickerRef = useRef<PhotoPickerRef>(null);
  const bioRef = useRef<TextInput>(null);

  // Form state
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(firebaseUser?.displayName || '');
  const [nationality, setNationality] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['pt']);
  const [bio, setBio] = useState('');


  const totalSteps = 5;


  const handleLanguageToggle = (languageKey: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(languageKey)) {
        return prev.filter(lang => lang !== languageKey);
      } else {
        return [...prev, languageKey];
      }
    });
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return true; // Photo is optional
      case 2:
        if (!displayName.trim()) {
          Alert.alert('Erro', 'Por favor, digite seu nome');
          return false;
        }
        return true;
      case 3:
        if (!nationality.trim()) {
          Alert.alert('Erro', 'Por favor, selecione sua nacionalidade');
          return false;
        }
        return true;
      case 4:
        if (selectedLanguages.length === 0) {
          Alert.alert('Erro', 'Por favor, selecione pelo menos um idioma');
          return false;
        }
        return true;
      case 5:
        if (!bio.trim()) {
          Alert.alert('Erro', 'Por favor, conte um pouco sobre você');
          return false;
        }
        if (bio.trim().length < 20) {
          Alert.alert('Erro', 'A descrição deve ter pelo menos 20 caracteres');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const isCurrentStepComplete = (): boolean => {
    switch (currentStep) {
      case 1:
        return true; // Photo is optional, always allow continue
      case 2:
        return displayName.trim().length > 0;
      case 3:
        return nationality.trim().length > 0;
      case 4:
        return selectedLanguages.length > 0;
      case 5:
        return bio.trim().length >= 20;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompleteProfile();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompleteProfile = async () => {
    if (!firebaseUser) return;

    setLoading(true);
    try {
      let photoURL = profilePhoto;

      // Upload photo to Appwrite Storage if user selected one
      if (profilePhoto && !profilePhoto.includes('appwrite') && !profilePhoto.startsWith('https://cloud.appwrite.io')) {
        try {
          const uploadedURL = await photoPickerRef.current?.uploadCurrentPhoto();
          photoURL = uploadedURL || null;
        } catch (uploadError) {
          console.error('Photo upload failed:', uploadError);
          // Continue without photo if upload fails
          photoURL = null;
        }
      }

      const result = await userService.completeUserProfile(firebaseUser.uid, {
        photoURL,
        nationality: nationality.trim(),
        languages: selectedLanguages,
        bio: bio.trim(),
      });

      if (result.success) {
        // Atualiza o contexto para que hasCompleteProfile vire true e a navegação ocorra
        await refreshUser();
      } else {
        Alert.alert('Erro', result.error || 'Erro ao completar perfil');
      }
    } catch (error: any) {
      Alert.alert('Erro', 'Erro inesperado ao completar perfil');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.headerRow}>
        {currentStep > 1 ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}

        <Text style={styles.stepText}>Etapa {currentStep} de {totalSteps}</Text>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(currentStep / totalSteps) * 100}%` },
          ]}
        />
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Adicione uma foto</Text>
      <Text style={styles.stepSubtitle}>Mostre seu melhor sorriso! 😊</Text>

      <PhotoPicker
        ref={photoPickerRef}
        currentPhoto={profilePhoto}
        onPhotoSelect={setProfilePhoto}
        autoUpload={false} // Don't upload immediately
        size={120}
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Qual é o seu nome?</Text>
      <Text style={styles.stepSubtitle}>Como você gostaria de ser chamado?</Text>

      <TextField
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Seu nome"
        autoFocus
        returnKeyType="next"
        onSubmitEditing={handleNext}
      />

      <View style={styles.tipContainer}>
        <Text style={styles.tipIcon}>💡</Text>
        <Text style={styles.tipText}>
          <Text style={styles.tipBold}>Dica:</Text> Use o nome que você usa normalmente. Isso
          ajuda outros viajantes a reconhecerem você!
        </Text>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>De onde você é?</Text>
      <Text style={styles.stepSubtitle}>Sua nacionalidade</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>País</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowCountryPicker(true)}
        >
          <Text style={[
            styles.selectButtonText,
            !nationality && styles.placeholderText
          ]}>
            {nationality || 'Selecione um país'}
          </Text>
          <Text style={styles.selectButtonIcon}>▼</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Quais idiomas você fala?</Text>
      <Text style={styles.stepSubtitle}>Selecione todos que você domina</Text>

      <View style={styles.languagesGrid}>
        {APP_CONFIG.LANGUAGES.map((language) => (
          <TouchableOpacity
            key={language.key}
            style={[
              styles.languageChip,
              selectedLanguages.includes(language.key) && styles.languageChipSelected,
            ]}
            onPress={() => handleLanguageToggle(language.key)}
          >
            <Text
              style={[
                styles.languageChipText,
                selectedLanguages.includes(language.key) && styles.languageChipTextSelected,
              ]}
            >
              {language.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.selectionCount}>
        {selectedLanguages.length} idiomas selecionados
      </Text>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Conte sobre você</Text>
      <Text style={styles.stepSubtitle}>O que você gosta de fazer em viagens?</Text>

      <View style={styles.bioContainer}>
        <TextInput
          ref={bioRef}
          style={styles.bioInput}
          value={bio}
          onChangeText={setBio}
          placeholder="Ex: Adoro conhecer lugares novos, experimentar comidas locais e fazer trilhas. Sempre em busca de uma boa conversa e novas amizades!"
          placeholderTextColor="#999"
          multiline
          maxLength={500}
          textAlignVertical="top"
        />

        <Text style={styles.characterCount}>{bio.length}/500 caracteres</Text>
      </View>

      {bio.length >= 20 && (
        <View style={styles.successMessage}>
          <Text style={styles.successIcon}>✨</Text>
          <Text style={styles.successText}>
            <Text style={styles.successBold}>Ótimo!</Text> Você completou seu perfil. Agora está pronto
            para começar a explorar!
          </Text>
        </View>
      )}
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  const getButtonText = () => {
    if (currentStep === totalSteps) {
      return 'Começar a explorar!';
    }
    return 'Continuar';
  };

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container}>
        {renderProgressBar()}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderCurrentStep()}
        </ScrollView>

        <View style={styles.footer}>

          <Button
            title={getButtonText()}
            variant="primary"
            onPress={handleNext}
            loading={loading}
            disabled={!isCurrentStepComplete()}
                style={styles.nextButton}
          />
        </View>

        <CountryPicker
          visible={showCountryPicker}
          selectedCountry={nationality}
          onSelect={setNationality}
          onClose={() => setShowCountryPicker(false)}
        />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
  },
  backButtonPlaceholder: {
    width: 60,
    height: 32,
  },
  stepText: {
    fontSize: 14,
    color: '#666',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    minHeight: 500,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  tipBold: {
    fontWeight: '600',
  },
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#1565c0',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 8,
    fontWeight: '500',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  placeholderText: {
    color: '#999',
  },
  selectButtonIcon: {
    fontSize: 12,
    color: '#666',
  },
  languagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  languageChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  languageChipSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  languageChipText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  languageChipTextSelected: {
    color: '#fff',
  },
  selectionCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
  },
  bioContainer: {
    flex: 1,
  },
  bioInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  successMessage: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  successIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: '#2e7d32',
    lineHeight: 20,
  },
  successBold: {
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  nextButton: {
    width: '100%',
  },
});

export default OnboardingProfileScreen;
