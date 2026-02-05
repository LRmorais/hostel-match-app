import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { authService } from '../services/authService';
import { useNavigation } from '@react-navigation/native';
import { TextField, Button } from '../components';

interface RegisterScreenProps {}

const RegisterScreen: React.FC<RegisterScreenProps> = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const navigation = useNavigation();

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Erro', 'Por favor, digite seu nome completo');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor, digite seu e-mail');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erro', 'Por favor, digite um e-mail válido');
      return false;
    }

    if (!password) {
      Alert.alert('Erro', 'Por favor, digite sua senha');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return false;
    }

    if (!acceptTerms) {
      Alert.alert('Erro', 'Você deve aceitar os Termos de Uso e Política de Privacidade');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await authService.register(email, password, fullName);
      if (result.success) {
        Alert.alert(
          'Sucesso!',
          'Conta criada com sucesso! Você já está logado.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigation will be handled by AuthContext
              },
            },
          ]
        );
      } else {
        Alert.alert('Erro', result.error || 'Erro ao criar conta');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro inesperado ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.goBack();
  };

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Header Section with Gradient */}
        <View style={styles.headerSection}>
          <LinearGradient
            colors={['#FF6B35', '#FFB88C', 'rgba(255, 255, 255, 0.9)']}
            style={styles.gradientHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Criar Conta</Text>
              <Text style={styles.subtitle}>Junte-se à comunidade de viajantes</Text>
            </View>
          </LinearGradient>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formSection}>

              {/* Form */}
              <View style={styles.formContainer}>
                {/* Full Name Input */}
                <TextField
                  label="Nome completo"
                  placeholder="Seu nome"
                  leftIcon="👤"
                  value={fullName}
                  onChangeText={setFullName}
                  onSubmitEditing={() => emailRef.current?.focus()}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />

                {/* Email Input */}
                <TextField
                  ref={emailRef}
                  label="E-mail"
                  placeholder="seu@email.com"
                  leftIcon="✉️"
                  value={email}
                  onChangeText={setEmail}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />

                {/* Password Input */}
                <TextField
                  ref={passwordRef}
                  label="Senha"
                  placeholder="••••••••"
                  leftIcon="🔒"
                  rightIcon={showPassword ? '👁️' : '👁️‍🗨️'}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />

                {/* Confirm Password Input */}
                <TextField
                  ref={confirmPasswordRef}
                  label="Confirmar senha"
                  placeholder="••••••••"
                  leftIcon="🔒"
                  rightIcon={showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onSubmitEditing={handleRegister}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                />

                {/* Terms and Conditions */}
                <View style={styles.termsContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setAcceptTerms(!acceptTerms)}
                  >
                    <View style={[styles.checkboxBox, acceptTerms && styles.checkboxChecked]}>
                      {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.termsTextContainer}>
                      <Text style={styles.termsText}>
                        Eu concordo com os{' '}
                        <Text style={styles.termsLink}>Termos de Uso</Text>
                        {' '}e{' '}
                        <Text style={styles.termsLink}>Política de Privacidade</Text>
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Register Button */}
                <Button
                  title="Criar Conta"
                  variant="primary"
                  size="large"
                  loading={loading}
                  onPress={handleRegister}
                  containerStyle={{ marginBottom: 24 }}
                />

                {/* Login Link */}
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Já tem uma conta? </Text>
                  <TouchableOpacity onPress={handleLogin}>
                    <Text style={styles.loginLink}>Entrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerSection: {
    height: '25%',
    position: 'relative',
  },
  gradientHeader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  keyboardView: {
    flex: 1,
    marginTop: -30,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  formContainer: {
    width: '100%',
  },
  termsContainer: {
    marginBottom: 32,
    marginTop: 8,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#e9ecef',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  termsLink: {
    color: '#FF6B35',
    fontWeight: '500',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 16,
  },
  loginLink: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen;
