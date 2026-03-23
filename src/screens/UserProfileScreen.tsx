import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { categoryConfig } from '../utils/mockData';
import { User, Event, RootStackParamList } from '../types';

type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
type UserProfileNavProp = StackNavigationProp<RootStackParamList, 'UserProfile'>;

const toDate = (value: any): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  return new Date(value);
};

const formatMemberSince = (date: any): string => {
  const d = toDate(date);
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation<UserProfileNavProp>();
  const route = useRoute<UserProfileRouteProp>();
  const { userId } = route.params;
  const { firebaseUser } = useAuth();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [createdCount, setCreatedCount] = useState(0);
  const [participatedCount, setParticipatedCount] = useState(0);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // If viewing own profile, redirect to the Profile tab
  useEffect(() => {
    if (firebaseUser?.uid === userId) {
      navigation.replace('MainTabs', { screen: 'Perfil' });
    }
  }, [firebaseUser, userId, navigation]);

  const loadProfile = useCallback(async () => {
    if (!userId || firebaseUser?.uid === userId) return;
    try {
      setLoading(true);
      const [userResult, createdResult, participatedResult, recentResult] = await Promise.allSettled([
        firestoreService.users.get(userId),
        firestoreService.events.getCreatedCountByUser(userId),
        firestoreService.participants.getParticipatedCount(userId),
        firestoreService.events.getCreatedByUser(userId, 3),
      ]);

      if (userResult.status === 'fulfilled') setProfileUser(userResult.value);
      if (createdResult.status === 'fulfilled') setCreatedCount(createdResult.value);
      if (participatedResult.status === 'fulfilled') setParticipatedCount(participatedResult.value);
      if (recentResult.status === 'fulfilled') setRecentEvents(recentResult.value);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, firebaseUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!profileUser) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.notFoundText}>Usuário não encontrado.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        {/* Report button */}
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('ReportUser', { userId })}
        >
          <Ionicons name="flag-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarWrapper}>
            {profileUser.photoURL ? (
              <Image source={{ uri: profileUser.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {profileUser.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.userName}>{profileUser.displayName}</Text>
          <Text style={styles.userNationality}>🌍 {profileUser.nationality}</Text>
        </View>

        {/* Stats card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{createdCount}</Text>
            <Text style={styles.statLabel}>Rolês criados</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.statNumberAlt]}>{participatedCount}</Text>
            <Text style={styles.statLabel}>Rolês participados</Text>
          </View>
        </View>

        {/* Sobre */}
        {!!profileUser.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre</Text>
            <Text style={styles.bioText}>{profileUser.bio}</Text>
          </View>
        )}

        {/* Informações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>

          <View style={styles.infoCard}>
            <Ionicons name="location-outline" size={22} color="#FF6B35" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nacionalidade</Text>
              <Text style={styles.infoValue}>{profileUser.nationality}</Text>
            </View>
          </View>

          {profileUser.languages.length > 0 && (
            <View style={styles.infoCard}>
              <Ionicons name="language-outline" size={22} color="#FF6B35" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Idiomas</Text>
                <Text style={styles.infoValue}>{profileUser.languages.join(', ')}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoCard}>
            <Ionicons name="calendar-outline" size={22} color="#FF6B35" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Membro desde</Text>
              <Text style={styles.infoValue}>{formatMemberSince(profileUser.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* Rolês recentes */}
        {recentEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rolês recentes</Text>
            <View style={styles.recentList}>
              {recentEvents.map((event) => {
                const cat = categoryConfig[event.category] ?? {
                  label: event.category,
                  icon: '📌',
                  color: '#999',
                };
                return (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.recentItem}
                    onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.recentTitle} numberOfLines={1}>{event.title}</Text>
                    <View style={[styles.recentBadge, { backgroundColor: cat.color }]}>
                      <Text style={styles.recentBadgeText}>{cat.icon} {cat.label}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5', gap: 16 },
  notFoundText: { fontSize: 16, color: '#666' },
  backLink: { fontSize: 15, color: '#FF6B35', fontWeight: '600' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#FF6B35',
  },
  headerButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },

  scrollContent: { paddingBottom: 20 },

  // Hero
  hero: {
    backgroundColor: '#FF8C5A',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 64,
    gap: 6,
  },
  avatarWrapper: { marginBottom: 6 },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 3, borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff',
  },
  avatarInitial: { color: '#fff', fontSize: 34, fontWeight: 'bold' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  userNationality: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },

  // Stats card
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: -36,
    paddingVertical: 20,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, height: 40, backgroundColor: '#F0F0F0' },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#FF6B35' },
  statNumberAlt: { color: '#4ECDC4' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4, textAlign: 'center' },

  // Sections
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 14 },
  bioText: { fontSize: 15, color: '#555', lineHeight: 23 },

  // Info cards
  infoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14,
    padding: 16, marginBottom: 10, gap: 14,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },

  // Recent events
  recentList: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden' },
  recentItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  recentTitle: { fontSize: 15, fontWeight: '500', color: '#1A1A1A', flex: 1, marginRight: 12 },
  recentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  recentBadgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
});

export default UserProfileScreen;

