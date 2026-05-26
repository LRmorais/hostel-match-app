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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { categoryConfig } from '../utils/mockData';
import { Event, RootStackParamList } from '../types';

type ProfileNavProp = StackNavigationProp<RootStackParamList>;

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

const formatStayDate = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const BADGES = [
  { id: 'ativo', label: 'Ativo', emoji: '🔥', color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'criador', label: 'Criador', emoji: '⭐', color: '#10B981', bg: '#D1FAE5' },
  { id: 'explorador', label: 'Explorador', emoji: '🌍', color: '#8B5CF6', bg: '#EDE9FE' },
];

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileNavProp>();
  const { user, firebaseUser } = useAuth();

  const [createdCount, setCreatedCount] = useState(0);
  const [participatedCount, setParticipatedCount] = useState(0);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      setLoading(true);
      const [createdResult, participatedResult, recentResult] = await Promise.allSettled([
        firestoreService.events.getCreatedCountByUser(firebaseUser.uid),
        firestoreService.participants.getParticipatedCount(firebaseUser.uid),
        firestoreService.events.getCreatedByUser(firebaseUser.uid, 3),
      ]);

      if (createdResult.status === 'fulfilled') setCreatedCount(createdResult.value);
      if (participatedResult.status === 'fulfilled') setParticipatedCount(participatedResult.value);
      if (recentResult.status === 'fulfilled') setRecentEvents(recentResult.value);
    } catch (error) {
      console.error('Error loading profile stats:', error);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (!user) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarWrapper}>
            {user.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {user.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.userName}>{user.displayName}</Text>
        </View>

        {/* Stats card */}
        <View style={styles.statsCard}>
          {loading ? (
            <ActivityIndicator color="#FF6B35" />
          ) : (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{createdCount}</Text>
                <Text style={styles.statLabel}>Rolês criados</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, styles.statNumberAlt]}>{participatedCount}</Text>
                <Text style={styles.statLabel}>Rolês participados</Text>
              </View>
            </>
          )}
        </View>

        {/* Sobre mim */}
        {!!user.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre mim</Text>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        )}

        {/* Informações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>

          <View style={styles.infoCard}>
            <Ionicons name="location-outline" size={22} color="#FF6B35" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nacionalidade</Text>
              <Text style={styles.infoValue}>{user.nationality}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="language-outline" size={22} color="#FF6B35" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Idiomas</Text>
              <Text style={styles.infoValue}>{user.languages.join(', ')}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="calendar-outline" size={22} color="#FF6B35" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Membro desde</Text>
              <Text style={styles.infoValue}>{formatMemberSince(user.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* Minha Hospedagem */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minha Hospedagem</Text>
          {user.currentStay ? (
            <View style={styles.hostelCard}>
              <View style={styles.hostelIconWrap}>
                <Ionicons name="home" size={20} color="#fff" />
              </View>
              <View style={styles.hostelCardInfo}>
                <Text style={styles.hostelCardName} numberOfLines={1}>{user.currentStay.hostelName}</Text>
                {(user.currentStay.checkIn || user.currentStay.checkOut) && (
                  <Text style={styles.hostelCardDates}>
                    {user.currentStay.checkIn ? formatStayDate(user.currentStay.checkIn) : '—'}
                    {' → '}
                    {user.currentStay.checkOut ? formatStayDate(user.currentStay.checkOut) : '—'}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('HostelSelection')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="create-outline" size={22} color="#FF6B35" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addHostelButton}
              onPress={() => navigation.navigate('HostelSelection')}
              activeOpacity={0.7}
            >
              <Ionicons name="home-outline" size={20} color="#FF6B35" />
              <Text style={styles.addHostelText}>Adicionar hospedagem</Text>
              <Ionicons name="chevron-forward" size={18} color="#FF6B35" />
            </TouchableOpacity>
          )}
        </View>

        {/* Rolês recentes */}
        {recentEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rolês recentes</Text>
            <View style={styles.recentList}>
              {recentEvents.map((event) => {
                const cat = categoryConfig[event.category] ?? { label: event.category, icon: '📌', color: '#999' };
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

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgesRow}>
            {BADGES.map((badge) => (
              <View key={badge.id} style={[styles.badgeCard, { backgroundColor: badge.bg }]}>
                <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                <Text style={[styles.badgeLabel, { color: badge.color }]}>{badge.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // Header (sobre o hero)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#FF6B35',
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
    color: '#fff',
  },

  scrollContent: {
    paddingBottom: 20,
  },

  // Hero
  hero: {
    backgroundColor: '#FF8C5A',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 64,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 34,
    fontWeight: 'bold',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#27AE60',
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Stats card (flutua sobre o hero)
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
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#F0F0F0',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  statNumberAlt: {
    color: '#4ECDC4',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 14,
  },
  bioText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 23,
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
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // Recent events
  recentList: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 12,
  },
  recentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },

  // Badges
  badgesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  badgeCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Hostel card
  hostelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F5',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFD5C2',
    gap: 12,
  },
  hostelIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostelCardInfo: {
    flex: 1,
  },
  hostelCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  hostelCardCity: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  hostelCardDates: {
    fontSize: 12,
    color: '#FF6B35',
    marginTop: 4,
    fontWeight: '600',
  },
  addHostelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F5',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FFD5C2',
    borderStyle: 'dashed',
    gap: 12,
  },
  addHostelText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B35',
  },
});

export default ProfileScreen;
