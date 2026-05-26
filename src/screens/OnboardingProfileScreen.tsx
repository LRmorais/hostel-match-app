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
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { firestoreService } from '../services/firestoreService';
import { TextField, Button, CountryPicker, PhotoPicker } from '../components';
import type { PhotoPickerRef } from '../components/PhotoPicker';
import { APP_CONFIG } from '../utils/constants';

const formatDisplayDate = (date: Date): string =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const toISODate = (date: Date): string => date.toISOString().split('T')[0];

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

  // Step 6 — Hostel
  const [hostelName, setHostelName] = useState('');
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);

  const totalSteps = 6;


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
      case 6:
        return true; // Hostel is optional
      default:
        return true;
    }
  };

  const isCurrentStepComplete = (): boolean => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return displayName.trim().length > 0;
      case 3:
        return nationality.trim().length > 0;
      case 4:
        return selectedLanguages.length > 0;
      case 5:
        return bio.trim().length >= 20;
      case 6:
        return true; // Hostel is optional
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
        // Save hostel if entered in step 6
        if (hostelName.trim()) {
          try {
            await firestoreService.users.update(firebaseUser.uid, {
              currentStay: {
                hostelName: hostelName.trim(),
                ...(checkIn  ? { checkIn:  toISODate(checkIn)  } : {}),
                ...(checkOut ? { checkOut: toISODate(checkOut) } : {}),
              },
            } as any);
          } catch (hostelError) {
            console.warn('Could not save hostel info:', hostelError);
          }
        }
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
            <Text style={styles.successBold}>Ótimo!</Text> Quase lá! Só mais um passo.
          </Text>
        </View>
      )}
    </View>
  );

  const renderStep6 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Onde você está hospedado?</Text>
      <Text style={styles.stepSubtitle}>
        Conecte-se com viajantes do mesmo hostel 🏨
      </Text>

      <TextField
        value={hostelName}
        onChangeText={setHostelName}
        placeholder="Ex: Hostel Ilha da Magia"
        leftIcon="home-outline"
        returnKeyType="done"
      />

      {/* Date pickers */}
      <View style={styles.datesRow}>
        <TouchableOpacity
          style={styles.dateField}
          onPress={() => setShowCheckInPicker(true)}
        >
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={[styles.dateText, !checkIn && styles.datePlaceholder]}>
            {checkIn ? formatDisplayDate(checkIn) : 'Check-in'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.dateArrow}>→</Text>
        <TouchableOpacity
          style={[styles.dateField, !checkIn && styles.dateFieldDisabled]}
          onPress={() => checkIn && setShowCheckOutPicker(true)}
        >
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={[styles.dateText, !checkOut && styles.datePlaceholder]}>
            {checkOut ? formatDisplayDate(checkOut) : 'Check-out'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipContainer}>
        <Text style={styles.tipIcon}>💡</Text>
        <Text style={styles.tipText}>
          <Text style={styles.tipBold}>Esta etapa é opcional.</Text> Você pode adicionar ou
          alterar sua hospedagem a qualquer momento no seu perfil.
        </Text>
      </View>

      <DateTimePickerModal
        isVisible={showCheckInPicker}
        mode="date"
        minimumDate={new Date()}
        onConfirm={(date) => {
          setCheckIn(date);
          setShowCheckInPicker(false);
          if (checkOut && date >= checkOut) setCheckOut(null);
        }}
        onCancel={() => setShowCheckInPicker(false)}
      />
      <DateTimePickerModal
        isVisible={showCheckOutPicker}
        mode="date"
        minimumDate={checkIn ? new Date(checkIn.getTime() + 86400000) : new Date()}
        onConfirm={(date) => {
          setCheckOut(date);
          setShowCheckOutPicker(false);
        }}
        onCancel={() => setShowCheckOutPicker(false)}
      />
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
      case 6:
        return renderStep6();
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

  // Step 6 — Hostel
  hostelSearchWrapper: {
    marginBottom: 16,
    zIndex: 10,
  },
  hostelInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 56,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 10,
  },
  hostelInputRowSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF8F5',
  },
  hostelTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  hostelDropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  hostelDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    gap: 10,
  },
  hostelDropdownInfo: {
    flex: 1,
  },
  hostelDropdownName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  hostelDropdownCity: {
    fontSize: 13,
    color: '#999',
    marginTop: 1,
  },
  selectedHostelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FAF4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  selectedHostelIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedHostelInfo: {
    flex: 1,
  },
  selectedHostelName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  selectedHostelCity: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dateField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 8,
  },
  dateFieldDisabled: {
    opacity: 0.5,
  },
  dateText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  datePlaceholder: {
    color: '#B0B0B0',
    fontWeight: '400',
  },
  dateArrow: {
    fontSize: 16,
    color: '#999',
  },
});

export default OnboardingProfileScreen;
