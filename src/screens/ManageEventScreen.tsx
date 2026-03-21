import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { Event, RootStackParamList } from '../types';
import { categoryConfig } from '../utils/mockData';
import { APP_CONFIG } from '../utils/constants';

type ManageEventRouteProp = RouteProp<RootStackParamList, 'ManageEvent'>;
type ManageEventNavProp = StackNavigationProp<RootStackParamList, 'ManageEvent'>;

const toDate = (value: any): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  return new Date(value);
};

const padTwo = (n: number) => n.toString().padStart(2, '0');

const dateToFields = (date: Date) => ({
  scheduledDate: `${padTwo(date.getDate())}/${padTwo(date.getMonth() + 1)}/${date.getFullYear()}`,
  scheduledTime: `${padTwo(date.getHours())}:${padTwo(date.getMinutes())}`,
});

const parseFields = (dateStr: string, timeStr: string): Date | null => {
  const [day, month, year] = dateStr.split('/').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  if ([day, month, year, hours, minutes].some(isNaN)) return null;
  const d = new Date(year, month - 1, day, hours, minutes);
  return isNaN(d.getTime()) ? null : d;
};

const ManageEventScreen: React.FC = () => {
  const navigation = useNavigation<ManageEventNavProp>();
  const route = useRoute<ManageEventRouteProp>();
  const { eventId } = route.params;
  const { firebaseUser } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [capacity, setCapacity] = useState(6);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const loadEvent = useCallback(async () => {
    try {
      setLoading(true);
      const data = await firestoreService.events.get(eventId);
      if (!data) {
        Alert.alert('Erro', 'Rolê não encontrado.');
        navigation.goBack();
        return;
      }

      // Guard: only creator can manage
      if (data.creatorId !== firebaseUser?.uid) {
        Alert.alert('Acesso negado', 'Apenas o criador pode gerenciar este rolê.');
        navigation.goBack();
        return;
      }

      setEvent(data);
      setTitle(data.title);
      setDescription(data.description ?? '');
      setLocationName(data.location.name);
      setCapacity(data.capacity);

      if (data.timing === 'scheduled') {
        const { scheduledDate: d, scheduledTime: t } = dateToFields(toDate(data.startAt));
        setScheduledDate(d);
        setScheduledTime(t);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o rolê.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [eventId, firebaseUser, navigation]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  // ── Validations ─────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Erro', 'O título não pode estar vazio.');
      return false;
    }
    if (!locationName.trim()) {
      Alert.alert('Erro', 'O local não pode estar vazio.');
      return false;
    }
    if (event && capacity < event.participantCount) {
      Alert.alert(
        'Erro',
        `O limite não pode ser menor que o número atual de participantes (${event.participantCount}).`,
      );
      return false;
    }
    if (event?.timing === 'scheduled') {
      if (!scheduledDate || !scheduledTime) {
        Alert.alert('Erro', 'Preencha a data e o horário.');
        return false;
      }
      if (!parseFields(scheduledDate, scheduledTime)) {
        Alert.alert('Erro', 'Data ou horário inválido. Use o formato dd/mm/aaaa e hh:mm.');
        return false;
      }
    }
    return true;
  };

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!event || !validate()) return;
    setSaving(true);
    try {
      const updates: Partial<Event> = {
        title: title.trim(),
        location: { ...event.location, name: locationName.trim() },
        capacity,
      };

      if (description.trim()) {
        updates.description = description.trim();
      } else {
        // Clear description if emptied (cast needed since Partial<Event> doesn't allow undefined in strict)
        (updates as any).description = '';
      }

      if (event.timing === 'scheduled') {
        const parsed = parseFields(scheduledDate, scheduledTime);
        if (parsed) updates.startAt = parsed;
      }

      await firestoreService.events.update(eventId, updates);
      setEvent(prev => prev ? { ...prev, ...updates } : prev);
      Alert.alert('Salvo!', 'Rolê atualizado com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  // ── Cancel event ────────────────────────────────────────────────────────────

  const handleCancelEvent = () => {
    Alert.alert(
      'Cancelar rolê',
      'Os participantes serão notificados. Tem certeza que deseja cancelar este rolê?',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar rolê',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await firestoreService.events.update(eventId, { status: 'cancelled' });
              Alert.alert('Rolê cancelado', 'O rolê foi cancelado com sucesso.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch {
              Alert.alert('Erro', 'Não foi possível cancelar o rolê.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };

  // ── Delete event ────────────────────────────────────────────────────────────

  const handleDeleteEvent = () => {
    Alert.alert(
      'Excluir rolê',
      'Esta ação é permanente. O rolê e todos os dados relacionados serão apagados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await firestoreService.events.delete(eventId);
              navigation.navigate('MainTabs', { screen: 'Roles' });
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir o rolê.');
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!event) return null;

  const category = categoryConfig[event.category] ?? { label: event.category, icon: '📌', color: '#999' };
  const spotsLeft = event.capacity - event.participantCount;
  const isCancelled = event.status === 'cancelled';

  // ── Render ───────────────────────────────────────────────────────────────────

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
        <Text style={styles.headerTitle}>Gerenciar Rolê</Text>
        <TouchableOpacity
          style={[styles.headerBtn, styles.saveBtn]}
          onPress={handleSave}
          disabled={saving || isCancelled}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FF6B35" />
          ) : (
            <Text style={[styles.saveBtnText, isCancelled && styles.saveBtnDisabled]}>
              Salvar
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Status banner */}
        {isCancelled && (
          <View style={styles.cancelledBanner}>
            <Ionicons name="close-circle" size={20} color="#E74C3C" />
            <Text style={styles.cancelledBannerText}>Este rolê foi cancelado e não pode ser editado.</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{event.participantCount}</Text>
            <Text style={styles.statLabel}>Participantes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: spotsLeft > 0 ? '#27AE60' : '#E74C3C' }]}>
              {spotsLeft > 0 ? spotsLeft : 0}
            </Text>
            <Text style={styles.statLabel}>Vagas livres</Text>
          </View>
          <View style={[styles.statCard, { borderWidth: 1.5, borderColor: category.color }]}>
            <Text style={styles.statEmoji}>{category.icon}</Text>
            <Text style={[styles.statLabel, { color: category.color }]}>{category.label}</Text>
          </View>
        </View>

        {/* Participantes → atalho */}
        <TouchableOpacity
          style={styles.participantsLink}
          onPress={() => navigation.navigate('EventParticipants', { eventId })}
          activeOpacity={0.7}
        >
          <Ionicons name="people-outline" size={20} color="#FF6B35" />
          <Text style={styles.participantsLinkText}>Ver lista de participantes</Text>
          <Ionicons name="chevron-forward" size={18} color="#CCC" />
        </TouchableOpacity>

        {/* ── EDITAR ── */}
        <Text style={styles.sectionLabel}>INFORMAÇÕES DO ROLÊ</Text>

        {/* Título */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Título</Text>
          <TextInput
            style={[styles.textInput, isCancelled && styles.inputDisabled]}
            value={title}
            onChangeText={setTitle}
            placeholder="Título do rolê"
            placeholderTextColor="#999"
            maxLength={100}
            editable={!isCancelled}
          />
        </View>

        {/* Descrição */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Descrição <Text style={styles.optional}>(opcional)</Text></Text>
          <TextInput
            style={[styles.textInput, styles.textArea, isCancelled && styles.inputDisabled]}
            value={description}
            onChangeText={setDescription}
            placeholder="Conte mais sobre o rolê..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            textAlignVertical="top"
            editable={!isCancelled}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {/* Local */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Local</Text>
          <View style={[styles.inputRow, isCancelled && styles.inputDisabled]}>
            <Ionicons name="location-outline" size={18} color="#999" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.inputRowText}
              value={locationName}
              onChangeText={setLocationName}
              placeholder="Nome do lugar"
              placeholderTextColor="#999"
              editable={!isCancelled}
            />
          </View>
        </View>

        {/* Data/hora — somente para eventos agendados */}
        {event.timing === 'scheduled' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Data e horário</Text>
            <View style={styles.dateTimeRow}>
              <View style={[styles.inputRow, styles.flex1, isCancelled && styles.inputDisabled]}>
                <Ionicons name="calendar-outline" size={18} color="#999" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.inputRowText}
                  value={scheduledDate}
                  onChangeText={setScheduledDate}
                  placeholder="dd/mm/aaaa"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  editable={!isCancelled}
                />
              </View>
              <View style={[styles.inputRow, styles.flex1, isCancelled && styles.inputDisabled]}>
                <Ionicons name="time-outline" size={18} color="#999" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.inputRowText}
                  value={scheduledTime}
                  onChangeText={setScheduledTime}
                  placeholder="hh:mm"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  editable={!isCancelled}
                />
              </View>
            </View>
          </View>
        )}

        {/* Capacidade */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Limite de participantes{' '}
            <Text style={styles.optional}>(mín. {event.participantCount})</Text>
          </Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={[styles.counterBtn, isCancelled && styles.inputDisabled]}
              onPress={() => setCapacity(c => Math.max(event.participantCount, c - 1))}
              disabled={isCancelled}
            >
              <Ionicons name="remove" size={22} color={isCancelled ? '#CCC' : '#FF6B35'} />
            </TouchableOpacity>
            <View style={styles.counterDisplay}>
              <Text style={styles.counterNumber}>{capacity}</Text>
              <Text style={styles.counterLabel}>pessoas</Text>
            </View>
            <TouchableOpacity
              style={[styles.counterBtn, isCancelled && styles.inputDisabled]}
              onPress={() => setCapacity(c => Math.min(APP_CONFIG.BUSINESS_RULES.MAX_EVENT_CAPACITY, c + 1))}
              disabled={isCancelled}
            >
              <Ionicons name="add" size={22} color={isCancelled ? '#CCC' : '#FF6B35'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── ZONA DE PERIGO ── */}
        <Text style={[styles.sectionLabel, { marginTop: 32 }]}>ZONA DE PERIGO</Text>

        <View style={styles.dangerCard}>
          {!isCancelled && (
            <>
              <TouchableOpacity
                style={styles.dangerRow}
                onPress={handleCancelEvent}
                disabled={cancelling}
                activeOpacity={0.7}
              >
                <View style={[styles.dangerIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="pause-circle-outline" size={22} color="#D97706" />
                </View>
                <View style={styles.dangerContent}>
                  <Text style={[styles.dangerTitle, { color: '#D97706' }]}>Cancelar rolê</Text>
                  <Text style={styles.dangerSubtitle}>Os participantes serão avisados</Text>
                </View>
                {cancelling
                  ? <ActivityIndicator size="small" color="#D97706" />
                  : <Ionicons name="chevron-forward" size={18} color="#CCC" />}
              </TouchableOpacity>

              <View style={styles.dangerDivider} />
            </>
          )}

          <TouchableOpacity
            style={styles.dangerRow}
            onPress={handleDeleteEvent}
            disabled={deleting}
            activeOpacity={0.7}
          >
            <View style={[styles.dangerIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="trash-outline" size={22} color="#E74C3C" />
            </View>
            <View style={styles.dangerContent}>
              <Text style={[styles.dangerTitle, { color: '#E74C3C' }]}>Excluir rolê</Text>
              <Text style={styles.dangerSubtitle}>Ação permanente e irreversível</Text>
            </View>
            {deleting
              ? <ActivityIndicator size="small" color="#E74C3C" />
              : <Ionicons name="chevron-forward" size={18} color="#CCC" />}
          </TouchableOpacity>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },

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
  headerBtn: { width: 44, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  saveBtn: { width: 64, alignItems: 'flex-end' },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FF6B35' },
  saveBtnDisabled: { color: '#CCC' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

  // Cancelled banner
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelledBannerText: { flex: 1, fontSize: 14, color: '#B91C1C', lineHeight: 20 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#FF6B35' },
  statEmoji: { fontSize: 22 },
  statLabel: { fontSize: 12, color: '#999', textAlign: 'center' },

  // Participants link
  participantsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  participantsLinkText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1A1A1A' },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginLeft: 2,
  },

  // Field groups
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginLeft: 2 },
  optional: { fontSize: 12, fontWeight: '400', color: '#AAA' },

  textInput: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A1A',
  },
  textArea: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },
  charCount: { fontSize: 12, color: '#BBB', textAlign: 'right', marginTop: 4 },

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
  inputRowText: { flex: 1, fontSize: 15, color: '#1A1A1A' },
  inputDisabled: { opacity: 0.45 },

  // Date/time
  dateTimeRow: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },

  // Capacity counter
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterDisplay: { flex: 1, alignItems: 'center' },
  counterNumber: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A' },
  counterLabel: { fontSize: 13, color: '#999', marginTop: 2 },

  // Danger zone
  dangerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  dangerIconWrap: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dangerContent: { flex: 1 },
  dangerTitle: { fontSize: 15, fontWeight: '600' },
  dangerSubtitle: { fontSize: 13, color: '#999', marginTop: 2 },
  dangerDivider: { height: 1, backgroundColor: '#FEE2E2', marginHorizontal: 16 },
});

export default ManageEventScreen;

