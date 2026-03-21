import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { Event, User, RootStackParamList } from '../types';
import { categoryConfig } from '../utils/mockData';

type EventDetailRouteProp = RouteProp<RootStackParamList, 'EventDetail'>;
type EventDetailNavProp = StackNavigationProp<RootStackParamList, 'EventDetail'>;

const toDate = (value: any): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  return new Date(value);
};

const formatEventTime = (event: Event): string => {
  const date = toDate(event.startAt);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  if (event.timing === 'now') return `Agora • ${hours}:${minutes}`;
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month} • ${hours}:${minutes}`;
};

const EventDetailScreen: React.FC = () => {
  const navigation = useNavigation<EventDetailNavProp>();
  const route = useRoute<EventDetailRouteProp>();
  const { eventId } = route.params;
  const { firebaseUser } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [creator, setCreator] = useState<User | null>(null);
  const [participantAvatars, setParticipantAvatars] = useState<string[]>([]);
  const [isParticipant, setIsParticipant] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const loadEventData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const eventData = await firestoreService.events.get(eventId);
      if (!eventData) {
        Alert.alert('Erro', 'Rolê não encontrado.');
        navigation.goBack();
        return;
      }
      setEvent(eventData);

      const creatorData = await firestoreService.users.get(eventData.creatorId);
      setCreator(creatorData);

      if (firebaseUser) {
        const isP = await firestoreService.participants.isParticipant(eventId, firebaseUser.uid);
        setIsParticipant(isP);
      }

      const participants = await firestoreService.participants.getByEvent(eventId);
      const avatarPromises = participants.slice(0, 3).map(async (p) => {
        const userData = await firestoreService.users.get(p.userId);
        return userData?.photoURL ?? null;
      });
      const avatars = (await Promise.all(avatarPromises)).filter(Boolean) as string[];
      setParticipantAvatars(avatars);
    } catch (error) {
      console.error('Error loading event:', error);
      if (!silent) Alert.alert('Erro', 'Não foi possível carregar o rolê.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [eventId, firebaseUser, navigation]);

  // Carrega na montagem com spinner completo
  useEffect(() => {
    loadEventData(false);
  }, [loadEventData]);

  // Recarrega silenciosamente ao voltar o foco (ex: vindo do ManageEvent)
  useFocusEffect(
    useCallback(() => {
      loadEventData(true);
    }, [loadEventData]),
  );

  const handleJoin = async () => {
    if (!firebaseUser || !event) return;
    setJoining(true);
    try {
      await firestoreService.participants.join(eventId, firebaseUser.uid);
      await firestoreService.events.update(eventId, {
        participantCount: event.participantCount + 1,
      });
      setIsParticipant(true);
      setEvent(prev => prev ? { ...prev, participantCount: prev.participantCount + 1 } : prev);
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível entrar no rolê.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = () => {
    if (!firebaseUser || !event) return;
    Alert.alert(
      'Sair do rolê',
      'Tem certeza que deseja sair deste rolê?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setLeaving(true);
            try {
              await firestoreService.participants.leave(eventId, firebaseUser.uid);
              await firestoreService.events.update(eventId, {
                participantCount: Math.max(1, event.participantCount - 1),
              });
              setIsParticipant(false);
              setEvent(prev =>
                prev ? { ...prev, participantCount: Math.max(1, prev.participantCount - 1) } : prev,
              );
            } catch (error: any) {
              Alert.alert('Erro', error?.message || 'Não foi possível sair do rolê.');
            } finally {
              setLeaving(false);
            }
          },
        },
      ],
    );
  };

  const handleNavigation = () => {
    if (!event) return;
    const { coordinates, name } = event.location;
    if (coordinates) {
      const url =
        Platform.OS === 'ios'
          ? `maps:0,0?q=${coordinates.latitude},${coordinates.longitude}`
          : `geo:${coordinates.latitude},${coordinates.longitude}?q=${coordinates.latitude},${coordinates.longitude}`;
      Linking.openURL(url);
    } else {
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(name)}`);
    }
  };

  const handleShare = async () => {
    if (!event) return;
    try {
      await Share.share({
        message: `Vem no rolê "${event.title}" em ${event.location.name}! 🎉`,
      });
    } catch {}
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!event) return null;

  const category = categoryConfig[event.category] ?? { label: event.category, icon: '📌', color: '#999' };
  const availableSpots = event.capacity - event.participantCount;
  const isCreator = firebaseUser?.uid === event.creatorId;
  const isFull = event.status === 'full' || availableSpots <= 0;

  const renderFooter = () => {
    const navBtn = (
      <TouchableOpacity style={styles.navButton} onPress={handleNavigation}>
        <Ionicons name="navigate-circle" size={20} color="#FF6B35" />
        <Text style={styles.navButtonText}>Navegação</Text>
      </TouchableOpacity>
    );

    // Criador do evento
    if (isCreator) {
      return (
        <View style={styles.footer}>
          {navBtn}
          <TouchableOpacity
            style={[styles.joinButton, styles.manageButton]}
            onPress={() => navigation.navigate('ManageEvent', { eventId })}
          >
            <Text style={styles.joinButtonText}>Gerenciar Rolê</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Não é o criador e já é participante → pode sair
    if (!isCreator && isParticipant) {
      return (
        <View style={styles.footer}>
          {navBtn}
          <TouchableOpacity
            style={[styles.joinButton, styles.leaveButton]}
            onPress={handleLeave}
            disabled={leaving}
          >
            <Text style={styles.joinButtonText}>{leaving ? 'Saindo...' : 'Sair do Rolê'}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Não é o criador e não é participante → pode entrar
    return (
      <View style={styles.footer}>
        {navBtn}
        <TouchableOpacity
          style={[styles.joinButton, (isFull || joining) && styles.joinButtonDisabled]}
          onPress={handleJoin}
          disabled={isFull || joining}
        >
          <Text style={styles.joinButtonText}>
            {joining ? 'Entrando...' : isFull ? 'Rolê Lotado' : 'Entrar no Rolê'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Título */}
        <Text style={styles.eventTitle}>{event.title}</Text>

        {/* Badge de categoria */}
        <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
          <Text style={styles.categoryBadgeText}>{category.icon}  {category.label}</Text>
        </View>

        {/* Horário */}
        <View style={styles.infoCard}>
          <Ionicons name="time-outline" size={24} color="#FF6B35" />
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>Horário</Text>
            <Text style={styles.infoCardValue}>{formatEventTime(event)}</Text>
          </View>
        </View>

        {/* Local */}
        <View style={styles.infoCard}>
          <Ionicons name="location-outline" size={24} color="#FF6B35" />
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>Local</Text>
            <Text style={styles.infoCardValue}>{event.location.name}</Text>
          </View>
        </View>

        {/* Participantes */}
        <View style={styles.infoCard}>
          <Ionicons name="people-outline" size={24} color="#FF6B35" />
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>Participantes</Text>
            <View style={styles.spotsRow}>
              <Text style={styles.infoCardValue}>
                {event.participantCount}/{event.capacity} pessoas
              </Text>
              {availableSpots > 0 && (
                <Text style={styles.spotsAvailable}>
                  {' '}• {availableSpots} {availableSpots === 1 ? 'vaga' : 'vagas'}
                </Text>
              )}
              {availableSpots <= 0 && (
                <Text style={styles.spotsFull}> • Lotado</Text>
              )}
            </View>
          </View>
        </View>

        {/* Descrição */}
        {!!event.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>
        )}

        {/* Criado por */}
        {creator && (
          <View style={styles.creatorCard}>
            <Text style={styles.creatorCardLabel}>Criado por</Text>
            <View style={styles.creatorRow}>
              {creator.photoURL ? (
                <Image source={{ uri: creator.photoURL }} style={styles.creatorAvatar} />
              ) : (
                <View style={styles.creatorAvatarPlaceholder}>
                  <Text style={styles.creatorAvatarInitial}>
                    {creator.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.creatorInfo}>
                <Text style={styles.creatorName}>{creator.displayName}</Text>
                <Text style={styles.creatorVerified}>Viajante verificado ✓</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Perfil' })}>
                <Text style={styles.viewProfileText}>Ver perfil</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Ver participantes */}
        <TouchableOpacity
          style={styles.participantsCard}
          onPress={() => navigation.navigate('EventParticipants', { eventId })}
          activeOpacity={0.7}
        >
          <View style={styles.participantsAvatars}>
            {participantAvatars.length > 0 ? (
              participantAvatars.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  style={[styles.participantAvatar, index > 0 && styles.participantAvatarOverlap]}
                />
              ))
            ) : (
              <View style={styles.participantAvatarEmpty}>
                <Ionicons name="person-outline" size={18} color="#999" />
              </View>
            )}
          </View>
          <View style={styles.participantsCardContent}>
            <Text style={styles.participantsCardTitle}>Ver participantes</Text>
            <Text style={styles.participantsCardSubtitle}>
              {event.participantCount} {event.participantCount === 1 ? 'pessoa' : 'pessoas'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* Aviso de segurança */}
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            <Text style={styles.warningBold}>⚠️ Lembre-se:</Text>
            {' '}Sempre encontre em lugares públicos e avise alguém sobre seus planos.
          </Text>
        </View>

        {/* Reportar */}
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => navigation.navigate('ReportEvent', { eventId })}
        >
          <Ionicons name="flag-outline" size={16} color="#E74C3C" />
          <Text style={styles.reportButtonText}>Reportar este rolê</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {renderFooter()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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

  // Scroll
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Título e badge
  eventTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 32,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 24,
  },
  categoryBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Info cards
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 14,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
  },
  infoCardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  spotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  spotsAvailable: {
    fontSize: 15,
    fontWeight: '600',
    color: '#27AE60',
  },
  spotsFull: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E74C3C',
  },

  // Descrição
  descriptionCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },

  // Criado por
  creatorCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  creatorCardLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  creatorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  creatorAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorAvatarInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  creatorVerified: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  viewProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },

  // Ver participantes
  participantsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 14,
  },
  participantsAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
  },
  participantAvatarOverlap: {
    marginLeft: -10,
  },
  participantAvatarEmpty: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantsCardContent: {
    flex: 1,
  },
  participantsCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  participantsCardSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },

  // Aviso
  warningBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    marginTop: 6,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  warningBold: {
    fontWeight: '700',
  },

  // Reportar
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  reportButtonText: {
    fontSize: 14,
    color: '#E74C3C',
    fontWeight: '500',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 28,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF4F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#CCC',
  },
  leaveButton: {
    backgroundColor: '#E74C3C',
  },
  manageButton: {
    backgroundColor: '#333',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default EventDetailScreen;
