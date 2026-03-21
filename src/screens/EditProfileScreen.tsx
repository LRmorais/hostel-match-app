import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { TextField, CountryPicker, PhotoPicker } from '../components';
import type { PhotoPickerRef } from '../components/PhotoPicker';
import { RootStackParamList } from '../types';
import { APP_CONFIG } from '../utils/constants';

type EditProfileNavProp = StackNavigationProp<RootStackParamList>;

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditProfileNavProp>();
  const { user, firebaseUser, refreshUser } = useAuth();

  const photoPickerRef = useRef<PhotoPickerRef>(null);
  const bioRef = useRef<TextInput>(null);

  const [saving, setSaving] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Form state — seeded from current user data
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.photoURL ?? null);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [nationality, setNationality] = useState(user?.nationality ?? '');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(user?.languages ?? []);

  const handleLanguageToggle = (key: string) => {
    setSelectedLanguages(prev =>
      prev.includes(key) ? prev.filter(l => l !== key) : [...prev, key],
    );
  };

  const validate = (): boolean => {
    if (!displayName.trim()) {
      Alert.alert('Erro', 'O nome não pode estar vazio.');
      return false;
    }
    if (!nationality.trim()) {
      Alert.alert('Erro', 'Por favor, selecione sua nacionalidade.');
      return false;
    }
    if (selectedLanguages.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos um idioma.');
      return false;
    }
    if (!bio.trim() || bio.trim().length < 20) {
      Alert.alert('Erro', 'A bio deve ter pelo menos 20 caracteres.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate() || !firebaseUser) return;

    setSaving(true);
    try {
      let photoURL = profilePhoto;

      // Upload new photo if it's a local URI (not already uploaded)
      if (
        profilePhoto &&
        !profilePhoto.startsWith('https://cloud.appwrite.io') &&
        !profilePhoto.includes('appwrite')
      ) {
        try {
          const uploaded = await photoPickerRef.current?.uploadCurrentPhoto();
          photoURL = uploaded ?? null;
        } catch {
          Alert.alert('Aviso', 'Não foi possível enviar a foto. Os outros dados serão salvos.');
          photoURL = user?.photoURL ?? null;
        }
      }

      const result = await userService.updateFullProfile(firebaseUser, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        nationality: nationality.trim(),
        languages: selectedLanguages,
        photoURL: photoURL ?? undefined,
      });

      if (result.success) {
        await refreshUser();
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Erro', result.error ?? 'Não foi possível salvar o perfil.');
      }
    } catch {
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar perfil</Text>
        <TouchableOpacity
          style={[styles.headerBtn, styles.saveBtn]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FF6B35" />
          ) : (
            <Text style={styles.saveBtnText}>Salvar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <PhotoPicker
            ref={photoPickerRef}
            currentPhoto={profilePhoto}
            onPhotoSelect={setProfilePhoto}
            autoUpload={false}
            size={100}
          />
          <Text style={styles.avatarHint}>Toque na foto para alterar</Text>
        </View>

        {/* Nome */}
        <View style={styles.fieldGroup}>
          <Text style={styles.groupLabel}>NOME</Text>
          <TextField
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Seu nome"
            returnKeyType="next"
            onSubmitEditing={() => bioRef.current?.focus()}
            leftIcon={<Ionicons name="person-outline" size={20} color="#999" />}
          />
        </View>

        {/* Bio */}
        <View style={styles.fieldGroup}>
          <Text style={styles.groupLabel}>SOBRE MIM</Text>
          <View style={styles.bioWrapper}>
            <TextInput
              ref={bioRef}
              style={styles.bioInput}
              value={bio}
              onChangeText={setBio}
              placeholder="Conte um pouco sobre você, o que você gosta de fazer em viagens…"
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.bioCount}>{bio.length}/500</Text>
          </View>
        </View>

        {/* Nacionalidade */}
        <View style={styles.fieldGroup}>
          <Text style={styles.groupLabel}>NACIONALIDADE</Text>
          <TouchableOpacity
            style={styles.selectRow}
            onPress={() => setShowCountryPicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="location-outline" size={20} color="#999" style={styles.selectIcon} />
            <Text style={[styles.selectText, !nationality && styles.selectPlaceholder]}>
              {nationality || 'Selecione seu país'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
        </View>

        {/* Idiomas */}
        <View style={styles.fieldGroup}>
          <Text style={styles.groupLabel}>IDIOMAS</Text>
          <View style={styles.languagesGrid}>
            {APP_CONFIG.LANGUAGES.map(lang => {
              const active = selectedLanguages.includes(lang.key);
              return (
                <TouchableOpacity
                  key={lang.key}
                  style={[styles.langChip, active && styles.langChipActive]}
                  onPress={() => handleLanguageToggle(lang.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.langChipText, active && styles.langChipTextActive]}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.langCount}>{selectedLanguages.length} idioma(s) selecionado(s)</Text>
        </View>

        {/* Email (read-only) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.groupLabel}>E-MAIL</Text>
          <View style={styles.readonlyRow}>
            <Ionicons name="mail-outline" size={20} color="#999" style={styles.selectIcon} />
            <Text style={styles.readonlyText}>{user?.email}</Text>
            <View style={styles.lockedBadge}>
              <Ionicons name="lock-closed" size={12} color="#999" />
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Country picker modal */}
      <CountryPicker
        visible={showCountryPicker}
        selectedCountry={nationality}
        onSelect={(country) => {
          setNationality(country);
          setShowCountryPicker(false);
        }}
        onClose={() => setShowCountryPicker(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerBtn: {
    width: 44,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveBtn: {
    width: 64,
    alignItems: 'flex-end',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Avatar section
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarHint: {
    marginTop: 10,
    fontSize: 13,
    color: '#999',
  },

  // Field groups
  fieldGroup: {
    marginBottom: 24,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
  },

  // Bio
  bioWrapper: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 14,
  },
  bioInput: {
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 100,
    lineHeight: 22,
  },
  bioCount: {
    fontSize: 12,
    color: '#BBB',
    textAlign: 'right',
    marginTop: 6,
  },

  // Select row (nationality)
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  selectIcon: {
    marginRight: 10,
  },
  selectText: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  selectPlaceholder: {
    color: '#999',
  },

  // Languages
  languagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  langChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  langChipActive: {
    backgroundColor: '#FFF0EB',
    borderColor: '#FF6B35',
  },
  langChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  langChipTextActive: {
    color: '#FF6B35',
    fontWeight: '700',
  },
  langCount: {
    marginTop: 10,
    fontSize: 13,
    color: '#999',
    marginLeft: 2,
  },

  // Read-only (email)
  readonlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  readonlyText: {
    flex: 1,
    fontSize: 15,
    color: '#999',
  },
  lockedBadge: {
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
    padding: 4,
  },
});

export default EditProfileScreen;

