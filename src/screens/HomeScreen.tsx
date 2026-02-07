import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, EventCategory } from '../types';
import {
  mockEvents,
  mockUsers,
  filterEventsByTime,
  isEventHappeningNow,
  formatEventTime,
  formatRelativeDate,
  categoryConfig,
} from '../utils/mockData';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type FilterType = 'all' | 'now' | 'today' | 'tomorrow';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Filtrar eventos
  const filteredEvents = useMemo(() => {
    let events = filterEventsByTime(mockEvents, selectedFilter);

    // Filtrar por categoria
    if (selectedCategory !== 'all') {
      events = events.filter(event => event.category === selectedCategory);
    }

    // Filtrar por busca
    if (searchQuery.trim()) {
      events = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return events.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }, [selectedFilter, selectedCategory, searchQuery]);

  // Obter criador do evento
  const getEventCreator = (creatorId: string) => {
    return mockUsers.find(user => user.uid === creatorId);
  };

  const renderEventCard = ({ item: event }: { item: typeof mockEvents[0] }) => {
    const creator = getEventCreator(event.creatorId);
    const isNow = isEventHappeningNow(event.startAt);
    const availableSpots = event.capacity - event.participantCount;
    const category = categoryConfig[event.category];

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
        activeOpacity={0.7}
      >
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          {isNow && (
            <View style={styles.nowBadge}>
              <Text style={styles.nowBadgeText}>Agora</Text>
            </View>
          )}
        </View>

        <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={[styles.categoryText, { color: category.color }]}>
            {category.label}
          </Text>
        </View>

        <View style={styles.eventInfo}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.eventInfoText}>
            {formatRelativeDate(event.startAt)} • {formatEventTime(event.startAt)}
          </Text>
        </View>

        <View style={styles.eventInfo}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.eventInfoText} numberOfLines={1}>
            {event.location.name}
          </Text>
        </View>

        <View style={styles.eventInfo}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.eventInfoText}>
            {event.participantCount}/{event.capacity} pessoas •
            <Text style={styles.availableSpots}> {availableSpots} vagas</Text>
          </Text>
        </View>

        {creator && (
          <View style={styles.creatorInfo}>
            <Image
              source={{ uri: creator.photoURL || 'https://i.pravatar.cc/150?img=0' }}
              style={styles.creatorAvatar}
            />
            <Text style={styles.creatorText}>
              Criado por <Text style={styles.creatorName}>{creator.displayName}</Text>
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.headerTitle}>Rolês</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.locationText}>Rio de Janeiro, Brasil</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowCategoryModal(true)}
        >
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
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterTabText, selectedFilter === 'all' && styles.filterTabTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'now' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('now')}
        >
          <Text style={[styles.filterTabText, selectedFilter === 'now' && styles.filterTabTextActive]}>
            Agora
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'today' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('today')}
        >
          <Text style={[styles.filterTabText, selectedFilter === 'today' && styles.filterTabTextActive]}>
            Hoje
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'tomorrow' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('tomorrow')}
        >
          <Text style={[styles.filterTabText, selectedFilter === 'tomorrow' && styles.filterTabTextActive]}>
            Amanhã
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategoryModal = () => {
    const categories: Array<{ key: EventCategory | 'all'; label: string }> = [
      { key: 'all', label: 'Todas' },
      { key: 'comida', label: 'Comida' },
      { key: 'drinks', label: 'Drinks' },
      { key: 'turismo', label: 'Outdoor' },
      { key: 'cultura', label: 'Cultura' },
      { key: 'festa', label: 'Festa' },
      { key: 'esporte', label: 'Esportes' },
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
                    style={[
                      styles.categoryButton,
                      isSelected && styles.categoryButtonActive
                    ]}
                    onPress={() => {
                      setSelectedCategory(cat.key);
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      isSelected && styles.categoryButtonTextActive
                    ]}>
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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateEvent')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>

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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
