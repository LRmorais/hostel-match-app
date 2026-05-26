import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Event, EventCategory } from '../types';
import { firestoreService } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import {
  filterEventsByTime,
  isEventHappeningNow,
  formatEventTime,
  formatRelativeDate,
  categoryConfig,
} from '../utils/mockData';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type FilterType = 'all' | 'now' | 'today' | 'tomorrow';

// Converte Firestore Timestamp ou Date para Date
const toDate = (value: any): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  return new Date(value);
};

// Normaliza os campos de data de um evento vindo do Firestore
const normalizeEvent = (event: Event): Event => ({
  ...event,
  startAt: toDate(event.startAt),
  expiresAt: toDate(event.expiresAt),
  createdAt: toDate(event.createdAt),
  updatedAt: toDate(event.updatedAt),
});

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const loadEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await firestoreService.events.getAllActive();
      setEvents(data.map(normalizeEvent));
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents])
  );

  // Filtrar eventos
  const filteredEvents = useMemo(() => {
    let list = filterEventsByTime(events, selectedFilter);

    if (selectedCategory !== 'all') {
      list = list.filter(event => event.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(event =>
        event.title.toLowerCase().includes(q) ||
        event.location.name.toLowerCase().includes(q),
      );
    }

    return list.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }, [events, selectedFilter, selectedCategory, searchQuery]);

  const renderEventCard = ({ item: event }: { item: Event }) => {
    const isNow = event.timing === 'now' || isEventHappeningNow(event.startAt);
    const availableSpots = event.capacity - event.participantCount;
    const category = categoryConfig[event.category] ?? { label: event.category, icon: '📌', color: '#999' };

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
        activeOpacity={0.7}
      >
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
          {isNow && (
            <View style={styles.nowBadge}>
              <Text style={styles.nowBadgeText}>Agora</Text>
            </View>
          )}
        </View>

        <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={[styles.categoryText, { color: category.color }]}>{category.label}</Text>
        </View>

        <View style={styles.eventInfo}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.eventInfoText}>
            {event.timing === 'now'
              ? `Agora • ${formatEventTime(event.startAt)}`
              : `${formatRelativeDate(event.startAt)} • ${formatEventTime(event.startAt)}`}
          </Text>
        </View>

        <View style={styles.eventInfo}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.eventInfoText} numberOfLines={1}>{event.location.name}</Text>
        </View>

        <View style={styles.eventInfo}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.eventInfoText}>
            {event.participantCount}/{event.capacity} pessoas •
            <Text style={styles.availableSpots}> {availableSpots} {availableSpots === 1 ? 'vaga' : 'vagas'}</Text>
          </Text>
        </View>

        <View style={styles.creatorInfo}>
          {event.creatorPhotoURL ? (
            <Image source={{ uri: event.creatorPhotoURL }} style={styles.creatorAvatar} />
          ) : (
            <View style={styles.creatorAvatarPlaceholder}>
              <Text style={styles.creatorAvatarInitial}>
                {event.creatorName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.creatorText}>
            Criado por <Text style={styles.creatorName}>{event.creatorName}</Text>
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.headerTitle}>Rolês</Text>
          {user?.currentStay ? (
            <TouchableOpacity
              style={styles.locationContainer}
              onPress={() => navigation.navigate('HostelSelection')}
              activeOpacity={0.7}
            >
              <Ionicons name="home-outline" size={15} color="#FF6B35" />
              <Text style={styles.locationText} numberOfLines={1}>
                {user.currentStay.hostelName}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.locationContainer}
              onPress={() => navigation.navigate('HostelSelection')}
              activeOpacity={0.7}
            >
              <Ionicons name="home-outline" size={15} color="#FF6B35" />
              <Text style={[styles.locationText, styles.locationAdd]}>Adicionar hospedagem</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowCategoryModal(true)}>
          <Ionicons name="funnel-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar rolês..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterTabs}>
        {(['all', 'now', 'today', 'tomorrow'] as FilterType[]).map((f) => {
          const labels: Record<FilterType, string> = { all: 'Todos', now: 'Agora', today: 'Hoje', tomorrow: 'Amanhã' };
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, selectedFilter === f && styles.filterTabActive]}
              onPress={() => setSelectedFilter(f)}
            >
              <Text style={[styles.filterTabText, selectedFilter === f && styles.filterTabTextActive]}>
                {labels[f]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderCategoryModal = () => {
    const categories: Array<{ key: EventCategory | 'all'; label: string }> = [
      { key: 'all', label: 'Todas' },
      { key: 'food', label: 'Comida' },
      { key: 'drinks', label: 'Drinks' },
      { key: 'outdoor', label: 'Outdoor' },
      { key: 'culture', label: 'Cultura' },
      { key: 'party', label: 'Festa' },
      { key: 'sports', label: 'Esportes' },
    ];

    return (
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Categorias</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.categoryButton, isSelected && styles.categoryButtonActive]}
                    onPress={() => { setSelectedCategory(cat.key); setShowCategoryModal(false); }}
                  >
                    <Text style={[styles.categoryButtonText, isSelected && styles.categoryButtonTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Carregando rolês...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <FlatList
        data={filteredEvents}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadEvents(true)}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#DDD" />
            <Text style={styles.emptyStateText}>Nenhum rolê encontrado</Text>
            <Text style={styles.emptyStateSubtext}>
              Tente ajustar seus filtros ou criar um novo rolê!
            </Text>
          </View>
        }
      />


      {renderCategoryModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#999',
  },
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    maxWidth: 200,
  },
  locationAdd: {
    color: '#FF6B35',
    fontWeight: '500',
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  filterTabActive: {
    backgroundColor: '#FF6B35',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  eventCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  nowBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nowBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
    gap: 6,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  eventInfoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  availableSpots: {
    color: '#27AE60',
    fontWeight: '600',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 8,
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  creatorAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorAvatarInitial: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  creatorText: {
    fontSize: 13,
    color: '#666',
  },
  creatorName: {
    fontWeight: '600',
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#BBB',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    minWidth: 100,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#FF6B35',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#FFF',
  },
});

export default HomeScreen;
