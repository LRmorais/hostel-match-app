import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { authService } from '../services/authService';
import { RootStackParamList } from '../types';

type ForgotPasswordRouteProp = RouteProp<RootStackParamList, 'ForgotPassword'>;
type ForgotPasswordNavProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordNavProp>();
  const route = useRoute<ForgotPasswordRouteProp>();

  const initialEmail = route.params?.email ?? '';
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const emailRef = useRef<TextInput>(null);

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSend = async (isResend = false) => {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Digite seu e-mail.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Atenção', 'Digite um e-mail válido.');
      return;
    }

    setSending(true);
    try {
      const result = await authService.resetPassword(email.trim().toLowerCase());
      if (result.success) {
        setSent(true);
        startCooldown();
      } else {
        Alert.alert('Erro', result.error ?? 'Não foi possível enviar o e-mail.');
      }
    } catch {
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    handleSend(true);
  };

  // ── Success state ────────────────────────────────────────────────────────────
  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Redefinir senha</Text>
          <View style={styles.headerBtn} />
        </View>

        <View style={styles.successContainer}>
          {/* Ícone animado */}
          <View style={styles.successIconWrap}>
            <View style={styles.successIconOuter}>
              <View style={styles.successIconInner}>
                <Ionicons name="mail" size={40} color="#FF6B35" />
              </View>
            </View>
          </View>

          <Text style={styles.successTitle}>E-mail enviado!</Text>
          <Text style={styles.successSubtitle}>
            Enviamos as instruções de redefinição para:
          </Text>
          <View style={styles.emailPill}>
            <Ionicons name="mail-outline" size={16} color="#FF6B35" />
            <Text style={styles.emailPillText}>{email.trim().toLowerCase()}</Text>
          </View>

          <Text style={styles.successHint}>
            Verifique sua caixa de entrada e a pasta de spam. O link expira em 1 hora.
          </Text>

          {/* Resend */}
          <TouchableOpacity
            style={[styles.resendBtn, resendCooldown > 0 && styles.resendBtnDisabled]}
            onPress={handleResend}
            disabled={resendCooldown > 0 || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color="#FF6B35" />
              : <Text style={[styles.resendText, resendCooldown > 0 && styles.resendTextDisabled]}>
                  {resendCooldown > 0
                    ? `Reenviar em ${resendCooldown}s`
                    : 'Não recebeu? Reenviar'}
                </Text>
            }
          </TouchableOpacity>

          {/* Voltar ao login */}
          <TouchableOpacity
            style={styles.backToLoginBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="arrow-back" size={16} color="#fff" />
            <Text style={styles.backToLoginText}>Voltar ao login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Input state ──────────────────────────────────────────────────────────────
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
        <Text style={styles.headerTitle}>Redefinir senha</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Ícone e texto */}
        <View style={styles.iconWrap}>
          <View style={styles.iconBg}>
            <Ionicons name="lock-open-outline" size={36} color="#FF6B35" />
          </View>
        </View>

        <Text style={styles.title}>Esqueceu sua senha?</Text>
        <Text style={styles.subtitle}>
          Sem problemas! Digite o e-mail da sua conta e enviaremos um link para redefinir sua senha.
        </Text>

        {/* Email field */}
        <Text style={styles.fieldLabel}>E-MAIL</Text>
        <View style={[styles.inputRow, !isValidEmail(email) && email.length > 0 && styles.inputRowError]}>
          <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
          <TextInput
            ref={emailRef}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            placeholderTextColor="#BBB"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            autoFocus={!initialEmail}
          />
          {isValidEmail(email) && (
            <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
          )}
        </View>
        {!isValidEmail(email) && email.length > 0 && (
          <Text style={styles.fieldError}>Digite um e-mail válido</Text>
        )}

        {/* Send button */}
        <TouchableOpacity
          style={[styles.sendBtn, (!isValidEmail(email) || sending) && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!isValidEmail(email) || sending}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={18} color="#fff" />
              <Text style={styles.sendBtnText}>Enviar link de redefinição</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Voltar ao login */}
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backLinkText}>Lembrei minha senha · Voltar ao login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },

  // Input state
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },

  iconWrap: { alignItems: 'center', marginBottom: 28 },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },

  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 4,
  },
  inputRowError: { borderColor: '#E74C3C', backgroundColor: '#FFF6F6' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#1A1A1A' },
  fieldError: { fontSize: 12, color: '#E74C3C', marginLeft: 4, marginBottom: 16 },

  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 24,
    marginBottom: 20,
  },
  sendBtnDisabled: { backgroundColor: '#FFBFA3' },
  sendBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },

  backLink: { alignItems: 'center', paddingVertical: 8 },
  backLinkText: { fontSize: 14, color: '#999' },

  // Success state
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 56,
  },

  successIconWrap: { marginBottom: 32 },
  successIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFD5C2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 14,
  },

  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF0EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 24,
  },
  emailPillText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B35',
  },

  successHint: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 36,
    paddingHorizontal: 8,
  },

  resendBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  resendBtnDisabled: { opacity: 0.5 },
  resendText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B35',
    textDecorationLine: 'underline',
  },
  resendTextDisabled: {
    color: '#999',
    textDecorationLine: 'none',
  },

  backToLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  backToLoginText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default ForgotPasswordScreen;

