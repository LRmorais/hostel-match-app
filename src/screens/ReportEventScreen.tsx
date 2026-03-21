import React, { useState, useEffect } from 'react';
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
import { ReportReason, RootStackParamList } from '../types';

type ReportEventRouteProp = RouteProp<RootStackParamList, 'ReportEvent'>;
type ReportEventNavProp = StackNavigationProp<RootStackParamList, 'ReportEvent'>;

interface ReasonOption {
  key: ReportReason;
  label: string;
}

const REASONS: ReasonOption[] = [
  { key: 'inappropriate', label: 'Conteúdo inapropriado' },
  { key: 'spam',          label: 'Spam ou enganoso' },
  { key: 'dangerous',     label: 'Local perigoso' },
  { key: 'fake',          label: 'Informações falsas' },
  { key: 'other',         label: 'Outro' },
];

const ReportEventScreen: React.FC = () => {
  const navigation = useNavigation<ReportEventNavProp>();
  const route = useRoute<ReportEventRouteProp>();
  const { eventId } = route.params;
  const { firebaseUser } = useAuth();

  const [eventTitle, setEventTitle] = useState('');
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    firestoreService.events.get(eventId).then(event => {
      setEventTitle(event?.title ?? 'Rolê');
    }).finally(() => setLoadingEvent(false));
  }, [eventId]);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Atenção', 'Selecione o motivo do reporte.');
      return;
    }
    if (!firebaseUser) return;

    setSubmitting(true);
    try {
      await firestoreService.reports.create({
        reporterId: firebaseUser.uid,
        targetType: 'event',
        targetId: eventId,
        targetName: eventTitle,
        reason: selectedReason,
        description: details.trim() || undefined,
      });

      Alert.alert(
        'Reporte enviado',
        'Obrigado! Nossa equipe irá analisar em breve.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar o reporte. Tente novamente.');
    } finally {
      setSubmitting(false);
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
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportar</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Warning banner */}
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={22} color="#E74C3C" style={styles.warningIcon} />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Reporte responsável</Text>
            <Text style={styles.warningText}>
              Reportes falsos podem resultar em suspensão da sua conta. Use este recurso apenas para violações reais das diretrizes.
            </Text>
          </View>
        </View>

        {/* Você está reportando */}
        <Text style={styles.reportingLabel}>Você está reportando o rolê:</Text>
        <View style={styles.targetCard}>
          {loadingEvent
            ? <ActivityIndicator size="small" color="#999" />
            : <Text style={styles.targetName}>{eventTitle}</Text>
          }
        </View>

        {/* Qual é o problema? */}
        <Text style={styles.sectionTitle}>Qual é o problema?</Text>

        <View style={styles.reasonsList}>
          {REASONS.map((reason, index) => {
            const isSelected = selectedReason === reason.key;
            const isLast = index === REASONS.length - 1;
            return (
              <TouchableOpacity
                key={reason.key}
                style={[
                  styles.reasonOption,
                  isSelected && styles.reasonOptionSelected,
                  !isLast && styles.reasonOptionGap,
                ]}
                onPress={() => setSelectedReason(reason.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.reasonLabel, isSelected && styles.reasonLabelSelected]}>
                  {reason.label}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color="#FF6B35" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Detalhes adicionais */}
        <Text style={styles.detailsLabel}>Detalhes adicionais <Text style={styles.optional}>(opcional)</Text></Text>
        <TextInput
          style={styles.detailsInput}
          value={details}
          onChangeText={setDetails}
          placeholder="Forneça mais informações sobre o problema..."
          placeholderTextColor="#BBB"
          multiline
          maxLength={500}
          textAlignVertical="top"
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed bottom button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (!selectedReason || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!selectedReason || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="flag" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Enviar Reporte</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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

  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },

  // Warning banner
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 12,
  },
  warningIcon: { marginTop: 2 },
  warningContent: { flex: 1 },
  warningTitle: { fontSize: 15, fontWeight: '700', color: '#E74C3C', marginBottom: 4 },
  warningText: { fontSize: 13, color: '#E74C3C', lineHeight: 19 },

  // Target card
  reportingLabel: { fontSize: 14, color: '#999', marginBottom: 8 },
  targetCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 28,
    minHeight: 48,
    justifyContent: 'center',
  },
  targetName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },

  // Reasons
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  reasonsList: { gap: 0, marginBottom: 28 },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  reasonOptionGap: { marginBottom: 10 },
  reasonOptionSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF8F6',
  },
  reasonLabel: { fontSize: 16, color: '#1A1A1A' },
  reasonLabelSelected: { fontWeight: '600', color: '#FF6B35' },

  // Details
  detailsLabel: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 10 },
  optional: { fontSize: 13, fontWeight: '400', color: '#AAA' },
  detailsInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 16,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 110,
    textAlignVertical: 'top',
  },

  // Footer button
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 28,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 18,
  },
  submitBtnDisabled: { backgroundColor: '#FFBFA3' },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
});

export default ReportEventScreen;
