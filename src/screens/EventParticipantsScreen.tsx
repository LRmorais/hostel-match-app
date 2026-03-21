import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { User, RootStackParamList } from '../types';

type ParticipantsRouteProp = RouteProp<RootStackParamList, 'EventParticipants'>;
type ParticipantsNavProp = StackNavigationProp<RootStackParamList, 'EventParticipants'>;

interface ParticipantWithUser {
  userId: string;
  user: User | null;
  isCreator: boolean;
}

const EventParticipantsScreen: React.FC = () => {
  const navigation = useNavigation<ParticipantsNavProp>();
  const route = useRoute<ParticipantsRouteProp>();
  const { eventId } = route.params;
  const { firebaseUser } = useAuth();

  const [participants, setParticipants] = useState<ParticipantWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadParticipants = useCallback(async () => {
    try {
      setLoading(true);

      const [eventData, participantList] = await Promise.all([
        firestoreService.events.get(eventId),
        firestoreService.participants.getByEvent(eventId),
      ]);


      const withUsers = await Promise.all(
        participantList.map(async (p) => {
          const user = await firestoreService.users.get(p.userId);
          return {
            userId: p.userId,
            user,
            isCreator: p.userId === eventData?.creatorId,
          };
        }),
      );

      // Criador sempre primeiro
      withUsers.sort((a, b) => (a.isCreator ? -1 : b.isCreator ? 1 : 0));
      setParticipants(withUsers);
    } catch (error) {
      console.error('Error loading participants:', error);
      Alert.alert('Erro', 'Não foi possível carregar os participantes.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  const renderParticipant = ({ item }: { item: ParticipantWithUser }) => {
    const { user, isCreator, userId } = item;
    const isMe = firebaseUser?.uid === userId;
    const languages = user?.languages?.join(', ') ?? '';

    return (
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {(user?.displayName ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.displayName ?? 'Usuário'}
              {isMe ? ' (você)' : ''}
            </Text>
            {isCreator && (
              <View style={styles.creatorBadge}>
                <Text style={styles.creatorBadgeText}>Criador</Text>
              </View>
            )}
          </View>
          <Text style={styles.userSubtitle} numberOfLines={1}>
            {[user?.nationality, languages].filter(Boolean).join(' • ')}
          </Text>
        </View>

        {!isMe && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => navigation.navigate('EventChat', { eventId })}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#BBBBBB" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFooter = () => (
    <View style={styles.safetyBox}>
      <Ionicons name="shield-outline" size={24} color="#3B5BDB" />
      <View style={styles.safetyContent}>
        <Text style={styles.safetyTitle}>Segurança em primeiro lugar</Text>
        <Text style={styles.safetyText}>
          Sempre encontre em locais públicos e mantenha seus pertences seguros.
          Use o chat do grupo para combinar detalhes.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Participantes</Text>
        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : (
        <FlatList
          data={participants}
          renderItem={renderParticipant}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#DDD" />
              <Text style={styles.emptyText}>Nenhum participante ainda</Text>
            </View>
          }
        />
      )}
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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  listContent: {
    padding: 20,
    gap: 10,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#27AE60',
    borderWidth: 2,
    borderColor: '#fff',
  },

  // User info
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  creatorBadge: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  creatorBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B8860B',
  },
  userSubtitle: {
    fontSize: 13,
    color: '#888',
  },

  // Chat button
  chatButton: {
    padding: 4,
  },

  // Safety box
  safetyBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    gap: 14,
    alignItems: 'flex-start',
  },
  safetyContent: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3B5BDB',
    marginBottom: 6,
  },
  safetyText: {
    fontSize: 13,
    color: '#3B5BDB',
    lineHeight: 19,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
  },
});

export default EventParticipantsScreen;
