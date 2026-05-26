import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { RootStackParamList } from '../types';

type SettingsNavProp = StackNavigationProp<RootStackParamList>;

const APP_VERSION = '1.0.0';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsNavProp>();
  const { user } = useAuth();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [shareLocation, setShareLocation] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            const result = await authService.logout();
            if (!result.success) {
              Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
              setSigningOut(false);
            }
          },
        },
      ],
    );
  };

  const handleChangePassword = () => {
    if (!user?.email) return;
    Alert.alert(
      'Alterar senha',
      `Enviaremos um link de redefinição para ${user.email}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            const result = await authService.resetPassword(user.email);
            if (result.success) {
              Alert.alert('Enviado!', 'Verifique seu e-mail para redefinir a senha.');
            } else {
              Alert.alert('Erro', result.error);
            }
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'Esta ação é permanente e não pode ser desfeita. Todos os seus dados serão apagados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => Alert.alert('Em breve', 'Esta funcionalidade estará disponível em breve.') },
      ],
    );
  };

  const comingSoon = () => Alert.alert('Em breve', 'Esta funcionalidade estará disponível em breve.');

  // --- Componentes reutilizáveis ---

  const SettingsRow = ({
    icon,
    label,
    onPress,
    rightElement,
    danger,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress}
    >
      <Ionicons name={icon} size={22} color={danger ? '#E74C3C' : '#666'} style={styles.rowIcon} />
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {rightElement ?? (
        onPress ? <Ionicons name="chevron-forward" size={18} color="#CCC" /> : null
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const Card = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.card}>{children}</View>
  );

  const Divider = () => <View style={styles.divider} />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* CONTA */}
        <SectionHeader title="CONTA" />
        <Card>
          <SettingsRow icon="person-outline" label="Editar perfil" onPress={() => navigation.navigate('EditProfile')} />
          <Divider />
          <SettingsRow icon="home-outline" label="Minha hospedagem" onPress={() => navigation.navigate('HostelSelection')} />
          <Divider />
          <SettingsRow icon="lock-closed-outline" label="Alterar senha" onPress={() => navigation.navigate('ChangePassword')} />
          <Divider />
          <SettingsRow icon="eye-outline" label="Privacidade" onPress={comingSoon} />
        </Card>

        {/* NOTIFICAÇÕES */}
        <SectionHeader title="NOTIFICAÇÕES" />
        <Card>
          <SettingsRow
            icon="notifications-outline"
            label="Notificações push"
            rightElement={
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: '#E5E5E5', true: '#FF6B35' }}
                thumbColor="#fff"
              />
            }
          />
        </Card>

        {/* PRIVACIDADE E SEGURANÇA */}
        <SectionHeader title="PRIVACIDADE E SEGURANÇA" />
        <Card>
          <SettingsRow icon="shield-outline" label="Usuários bloqueados" onPress={comingSoon} />
          <Divider />
          <SettingsRow
            icon="globe-outline"
            label="Compartilhar localização"
            rightElement={
              <Switch
                value={shareLocation}
                onValueChange={setShareLocation}
                trackColor={{ false: '#E5E5E5', true: '#FF6B35' }}
                thumbColor="#fff"
              />
            }
          />
        </Card>

        {/* SUPORTE */}
        <SectionHeader title="SUPORTE" />
        <Card>
          <SettingsRow icon="help-circle-outline" label="Central de ajuda" onPress={comingSoon} />
          <Divider />
          <SettingsRow icon="shield-checkmark-outline" label="Diretrizes da comunidade" onPress={comingSoon} />
        </Card>

        {/* ZONA DE PERIGO */}
        <SectionHeader title="ZONA DE PERIGO" />
        <View style={styles.dangerCard}>
          <SettingsRow
            icon="trash-outline"
            label="Excluir conta"
            onPress={handleDeleteAccount}
            danger
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerAppName}>Hostel Match</Text>
          <Text style={styles.footerVersion}>Versão {APP_VERSION}</Text>
          <TouchableOpacity onPress={comingSoon}>
            <Text style={styles.footerLinks}>Termos de Uso • Política de Privacidade</Text>
          </TouchableOpacity>
        </View>

        {/* Espaço para o botão fixo */}
        <View style={{ height: 96 }} />
      </ScrollView>

      {/* Botão fixo: Sair da conta */}
      <View style={styles.signOutContainer}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.85}
        >
          {signingOut ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.signOutText}>Sair da conta</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  headerButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Section header
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  dangerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowIcon: {
    marginRight: 14,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  rowLabelDanger: {
    color: '#E74C3C',
  },

  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginLeft: 52,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 32,
    gap: 6,
  },
  footerAppName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  footerVersion: {
    fontSize: 13,
    color: '#BBB',
  },
  footerLinks: {
    fontSize: 12,
    color: '#CCC',
    textDecorationLine: 'underline',
  },

  // Fixed sign out button
  signOutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 28,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E74C3C',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SettingsScreen;
