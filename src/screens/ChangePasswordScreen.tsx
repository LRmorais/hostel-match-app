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
import { authService } from '../services/authService';
import { RootStackParamList } from '../types';

type ChangePasswordNavProp = StackNavigationProp<RootStackParamList>;

const MIN_PASSWORD_LENGTH = 6;

const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation<ChangePasswordNavProp>();

  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);

  // Live validation states
  const newPasswordStrength = getStrength(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  function getStrength(pwd: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
    if (pwd.length === 0) return { level: 0, label: '', color: '#E5E5E5' };
    if (pwd.length < MIN_PASSWORD_LENGTH) return { level: 1, label: 'Fraca', color: '#E74C3C' };
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const extras = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (extras >= 2) return { level: 3, label: 'Forte', color: '#27AE60' };
    if (extras === 1) return { level: 2, label: 'Média', color: '#F39C12' };
    return { level: 1, label: 'Fraca', color: '#E74C3C' };
  }

  const validate = (): boolean => {
    if (!currentPassword) {
      Alert.alert('Erro', 'Digite sua senha atual.');
      return false;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      Alert.alert('Erro', `A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return false;
    }
    if (newPassword === currentPassword) {
      Alert.alert('Erro', 'A nova senha deve ser diferente da senha atual.');
      return false;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const result = await authService.changePassword(currentPassword, newPassword);
      if (result.success) {
        Alert.alert('Senha alterada!', 'Sua senha foi atualizada com sucesso.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Erro', result.error ?? 'Não foi possível alterar a senha.');
      }
    } catch {
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const EyeToggle = ({
    visible,
    onToggle,
  }: {
    visible: boolean;
    onToggle: () => void;
  }) => (
    <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#999" />
    </TouchableOpacity>
  );

  const StrengthBar = () => {
    if (newPassword.length === 0) return null;
    const bars = [1, 2, 3] as const;
    return (
      <View style={styles.strengthRow}>
        <View style={styles.strengthBars}>
          {bars.map(bar => (
            <View
              key={bar}
              style={[
                styles.strengthBar,
                {
                  backgroundColor:
                    bar <= newPasswordStrength.level
                      ? newPasswordStrength.color
                      : '#E5E5E5',
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.strengthLabel, { color: newPasswordStrength.color }]}>
          {newPasswordStrength.label}
        </Text>
      </View>
    );
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
        <Text style={styles.headerTitle}>Alterar senha</Text>
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
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark-outline" size={22} color="#FF6B35" />
          <Text style={styles.infoText}>
            Para sua segurança, confirme sua senha atual antes de criar uma nova.
          </Text>
        </View>

        {/* Senha atual */}
        <View style={styles.fieldGroup}>
          <Text style={styles.groupLabel}>SENHA ATUAL</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Digite sua senha atual"
              placeholderTextColor="#999"
              secureTextEntry={!showCurrent}
              returnKeyType="next"
              onSubmitEditing={() => newPasswordRef.current?.focus()}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <EyeToggle visible={showCurrent} onToggle={() => setShowCurrent(v => !v)} />
          </View>
        </View>

        {/* Nova senha */}
        <View style={styles.fieldGroup}>
          <Text style={styles.groupLabel}>NOVA SENHA</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-open-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              ref={newPasswordRef}
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
              placeholderTextColor="#999"
              secureTextEntry={!showNew}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <EyeToggle visible={showNew} onToggle={() => setShowNew(v => !v)} />
          </View>
          <StrengthBar />
        </View>

        {/* Confirmar nova senha */}
        <View style={styles.fieldGroup}>
          <Text style={styles.groupLabel}>CONFIRMAR NOVA SENHA</Text>
          <View style={[
            styles.inputRow,
            passwordsMatch && styles.inputRowSuccess,
            passwordsMismatch && styles.inputRowError,
          ]}>
            <Ionicons
              name="lock-open-outline"
              size={20}
              color={passwordsMismatch ? '#E74C3C' : passwordsMatch ? '#27AE60' : '#999'}
              style={styles.inputIcon}
            />
            <TextInput
              ref={confirmPasswordRef}
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repita a nova senha"
              placeholderTextColor="#999"
              secureTextEntry={!showConfirm}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <EyeToggle visible={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
            {passwordsMatch && (
              <Ionicons name="checkmark-circle" size={20} color="#27AE60" style={{ marginLeft: 6 }} />
            )}
          </View>
          {passwordsMismatch && (
            <Text style={styles.errorHint}>As senhas não coincidem</Text>
          )}
        </View>

        {/* Dicas */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Dicas para uma senha forte</Text>
          <Text style={styles.tipItem}>• Pelo menos {MIN_PASSWORD_LENGTH} caracteres</Text>
          <Text style={styles.tipItem}>• Misture letras maiúsculas e minúsculas</Text>
          <Text style={styles.tipItem}>• Inclua números e símbolos (!@#$)</Text>
          <Text style={styles.tipItem}>• Evite informações pessoais óbvias</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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

  // Info banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF0EB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#FFD5C2',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#CC4A1A',
    lineHeight: 20,
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

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputRowSuccess: {
    borderColor: '#27AE60',
    backgroundColor: '#F6FFF9',
  },
  inputRowError: {
    borderColor: '#E74C3C',
    backgroundColor: '#FFF6F6',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  errorHint: {
    marginTop: 6,
    marginLeft: 4,
    fontSize: 13,
    color: '#E74C3C',
  },

  // Strength bar
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },

  // Tips card
  tipsCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tipItem: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});

export default ChangePasswordScreen;

