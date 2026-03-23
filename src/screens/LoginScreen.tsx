import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { authService } from '../services/authService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { TextField, Button } from '../components';

type LoginNavProp = StackNavigationProp<RootStackParamList>;

interface LoginScreenProps {}

const LoginScreen: React.FC<LoginScreenProps> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const nav = useNavigation<LoginNavProp>();



  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login(email.trim(), password);
      if (!result.success) {
        Alert.alert('Erro de Login', result.error || 'Erro ao fazer login');
      }
      // Navigation will be handled by AuthContext changes
    } catch (error: any) {
      Alert.alert('Erro', 'Erro inesperado ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    nav.navigate('ForgotPassword', { email: email.trim() });
  };

  const handleCreateAccount = () => {
    nav.navigate('Register');
  };

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    // TODO: Implement social login
    Alert.alert('Em breve', `Login com ${provider === 'google' ? 'Google' : 'Facebook'} em desenvolvimento`);
  };

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Background Image Section */}
        <View style={styles.imageSection}>
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1516640175543-849c7368499b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIweW91bmclMjB0cmF2ZWxlcnMlMjBiYWNrcGFja2Vyc3hlbnwxfHx8fDE3NzAxNjMyNDJ8MA&ixlib=rb-4.1.0&q=80&w=1080'
            }}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.2)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,1)']}
              style={styles.gradientOverlay}
              locations={[0, 0.7, 1]}
            />
          </ImageBackground>
        </View>

        {/* Content Section */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.contentContainer}
          enabled={true}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.welcomeTitle}>Bem-vindo de volta!</Text>
              <Text style={styles.welcomeSubtitle}>Entre para encontrar rolês incríveis</Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
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
                onSubmitEditing={handleLogin}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <Button
                title="Entrar"
                variant="primary"
                size="large"
                loading={loading}
                onPress={handleLogin}
                style={{ marginBottom: 24 }}
              />

              {/* Create Account */}
              <View style={styles.createAccountContainer}>
                <Text style={styles.createAccountText}>Não tem uma conta? </Text>
                <TouchableOpacity onPress={handleCreateAccount}>
                  <Text style={styles.createAccountLink}>Criar conta</Text>
                </TouchableOpacity>
              </View>

              {/* Social Login */}
              <View style={styles.socialContainer}>
                <Text style={styles.socialText}>Ou continue com</Text>

                <View style={styles.socialButtons}>
                  <Button
                    title="Google"
                    leftIcon="G"
                    variant="secondary"
                    size="medium"
                    onPress={() => handleSocialLogin('google')}
                    style={styles.socialButton}
                    iconStyle={styles.googleIcon}
                  />

                  <Button
                    title="Facebook"
                    leftIcon="f"
                    variant="secondary"
                    size="medium"
                    onPress={() => handleSocialLogin('facebook')}
                    style={styles.socialButton}
                    iconStyle={styles.facebookIcon}
                  />
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
  imageSection: {
    height: '25%', // 40% da tela para a imagem
    position: 'relative',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: -20, // Overlap ligeiro para suavizar a transição
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '500',
  },
  createAccountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  createAccountText: {
    color: '#666',
    fontSize: 16,
  },
  createAccountLink: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  socialContainer: {
    alignItems: 'center',
  },
  socialText: {
    color: '#666',
    fontSize: 16,
    marginBottom: 20,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  socialButton: {
    flex: 0.48,
  },
  googleIcon: {
    color: '#4285f4',
  },
  facebookIcon: {
    color: '#1877f2',
  },
});

export default LoginScreen;
