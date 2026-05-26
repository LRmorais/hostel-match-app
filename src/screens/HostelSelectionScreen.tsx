import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { TextField } from '../components';
import { RootStackParamList } from '../types';

type HostelSelectionNavProp = StackNavigationProp<RootStackParamList, 'HostelSelection'>;

// ─── helpers ──────────────────────────────────────────────────
const formatDisplayDate = (date: Date): string =>
  date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const toISODate = (date: Date): string =>
  date.toISOString().split('T')[0]; // YYYY-MM-DD

// ─── componente ───────────────────────────────────────────────
const HostelSelectionScreen: React.FC = () => {
  const navigation = useNavigation<HostelSelectionNavProp>();
  const { firebaseUser, refreshUser } = useAuth();

  const [hostelName, setHostelName] = useState('');
  const [checkIn,  setCheckIn]  = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [showCheckInPicker,  setShowCheckInPicker]  = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── ações ──────────────────────────────────────────────────
  const handleCheckInConfirm = (date: Date) => {
    setCheckIn(date);
    setShowCheckInPicker(false);
    if (checkOut && date >= checkOut) setCheckOut(null);
  };

  const handleCheckOutConfirm = (date: Date) => {
    setCheckOut(date);
    setShowCheckOutPicker(false);
  };

  const handleSkip = () => navigation.goBack();

  const handleContinue = async () => {
    if (!hostelName.trim() || !firebaseUser) return;

    setSaving(true);
    try {
      await firestoreService.users.update(firebaseUser.uid, {
        currentStay: {
          hostelName: hostelName.trim(),
          ...(checkIn  ? { checkIn:  toISODate(checkIn)  } : {}),
          ...(checkOut ? { checkOut: toISODate(checkOut) } : {}),
        },
      } as any);
      await refreshUser();
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a hospedagem. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const canContinue = hostelName.trim().length > 0;

  // ── render ─────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="home" size={28} color="#FF6B35" />
            </View>
            <Text style={styles.title}>Onde você está?</Text>
            <Text style={styles.subtitle}>
              Adicione o hostel onde está hospedado para conectar com outros viajantes
            </Text>
          </View>

          <View style={styles.divider} />

          {/* ── Form ── */}
          <View style={styles.form}>

            {/* Nome do hostel */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Nome do Hostel <Text style={styles.required}>*</Text>
              </Text>
              <TextField
                value={hostelName}
                onChangeText={setHostelName}
                placeholder="Ex: Hostel Ilha da Magia"
                leftIcon="home-outline"
                returnKeyType="done"
              />
            </View>

            {/* Check-in */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Check-in</Text>
              <TouchableOpacity
                style={styles.inputRow}
                onPress={() => setShowCheckInPicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={20} color="#999" />
                <Text style={[styles.dateText, !checkIn && styles.placeholderText]}>
                  {checkIn ? formatDisplayDate(checkIn) : 'dd/mm/aaaa'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Check-out */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Check-out</Text>
              <TouchableOpacity
                style={styles.inputRow}
                onPress={() => setShowCheckOutPicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={20} color="#999" />
                <Text style={[styles.dateText, !checkOut && styles.placeholderText]}>
                  {checkOut ? formatDisplayDate(checkOut) : 'dd/mm/aaaa'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.8}>
            <Text style={styles.skipText}>Pular</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!canContinue || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.continueText}>Continuar</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Date Pickers ── */}
      <DateTimePickerModal
        isVisible={showCheckInPicker}
        mode="date"
        minimumDate={today}
        date={checkIn ?? today}
        onConfirm={handleCheckInConfirm}
        onCancel={() => setShowCheckInPicker(false)}
        locale="pt_BR"
      />
      <DateTimePickerModal
        isVisible={showCheckOutPicker}
        mode="date"
        minimumDate={checkIn ? new Date(checkIn.getTime() + 86400000) : today}
        date={checkOut ?? (checkIn ? new Date(checkIn.getTime() + 86400000) : today)}
        onConfirm={handleCheckOutConfirm}
        onCancel={() => setShowCheckOutPicker(false)}
        locale="pt_BR"
      />
    </SafeAreaView>
  );
};

// ─── styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },

  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  scrollContent: {
    paddingBottom: 16,
  },

  // ── Header
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    lineHeight: 22,
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },

  // ── Form
  form: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    gap: 24,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  required: {
    color: '#FF6B35',
  },

  // ── Input row (shared)
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    padding: 0,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  placeholderText: {
    color: '#B0B0B0',
  },

  // ── Footer
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
    alignItems: 'center',
  },
  skipButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 50,
  },
  skipText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#FF6B35',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#FFBFA3',
  },
  continueText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default HostelSelectionScreen;

