// Mock data para desenvolvimento e testes
import { Event, User } from '../types';

export const mockUsers: User[] = [
  {
    uid: '1',
    email: 'ana.silva@example.com',
    displayName: 'Ana Silva',
    photoURL: 'https://i.pravatar.cc/150?img=1',
    nationality: 'Brasil',
    languages: ['Português', 'Inglês'],
    bio: 'Adoro conhecer pessoas novas e explorar a cidade!',
    profileStatus: 'complete',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-02-01'),
  },
  {
    uid: '2',
    email: 'john.smith@example.com',
    displayName: 'John Smith',
    photoURL: 'https://i.pravatar.cc/150?img=12',
    nationality: 'Estados Unidos',
    languages: ['Inglês', 'Espanhol'],
    bio: 'Viajante apaixonado por cultura local e boa comida',
    profileStatus: 'complete',
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date('2026-01-25'),
  },
  {
    uid: '3',
    email: 'maria.garcia@example.com',
    displayName: 'María García',
    photoURL: 'https://i.pravatar.cc/150?img=5',
    nationality: 'Espanha',
    languages: ['Espanhol', 'Inglês', 'Português'],
    bio: 'Aventureira em busca de novas experiências',
    profileStatus: 'complete',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-02-05'),
  },
];

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Café da manhã na praia',
    category: 'food',
    creatorId: '1',
    creatorName: 'Ana Silva',
    creatorPhotoURL: 'https://i.pravatar.cc/150?img=1',
    timing: 'scheduled',
    startAt: new Date('2026-02-06T08:30:00'),
    location: {
      name: 'Café Beach House, Copacabana',
      coordinates: {
        latitude: -22.9711,
        longitude: -43.1847,
      },
    },
    capacity: 6,
    participantCount: 3,
    status: 'active',
    createdAt: new Date('2026-02-05T10:00:00'),
    updatedAt: new Date('2026-02-05T10:00:00'),
  },
  {
    id: '2',
    title: 'Happy hour no Lapa',
    category: 'drinks',
    creatorId: '2',
    creatorName: 'John Smith',
    creatorPhotoURL: 'https://i.pravatar.cc/150?img=12',
    timing: 'scheduled',
    startAt: new Date('2026-02-06T18:00:00'),
    location: {
      name: 'Bar do Zé, Lapa',
      coordinates: {
        latitude: -22.9133,
        longitude: -43.1789,
      },
    },
    capacity: 8,
    participantCount: 5,
    status: 'active',
    createdAt: new Date('2026-02-04T15:00:00'),
    updatedAt: new Date('2026-02-04T15:00:00'),
  },
  {
    id: '3',
    title: 'Trilha no Pão de Açúcar',
    category: 'sports',
    creatorId: '3',
    creatorName: 'María García',
    creatorPhotoURL: 'https://i.pravatar.cc/150?img=5',
    timing: 'scheduled',
    startAt: new Date('2026-02-06T06:00:00'),
    location: {
      name: 'Pão de Açúcar, Urca',
      coordinates: {
        latitude: -22.9487,
        longitude: -43.1566,
      },
    },
    capacity: 10,
    participantCount: 4,
    status: 'active',
    createdAt: new Date('2026-02-03T20:00:00'),
    updatedAt: new Date('2026-02-03T20:00:00'),
  },
  {
    id: '4',
    title: 'Aula de Samba',
    category: 'culture',
    creatorId: '1',
    creatorName: 'Ana Silva',
    creatorPhotoURL: 'https://i.pravatar.cc/150?img=1',
    timing: 'scheduled',
    startAt: new Date('2026-02-07T19:00:00'),
    location: {
      name: 'Casa de Samba, Centro',
      coordinates: {
        latitude: -22.9035,
        longitude: -43.2096,
      },
    },
    capacity: 12,
    participantCount: 4,
    status: 'active',
    createdAt: new Date('2026-02-05T12:00:00'),
    updatedAt: new Date('2026-02-05T12:00:00'),
  },
  {
    id: '5',
    title: 'Jogo de Vôlei na Praia',
    category: 'sports',
    creatorId: '2',
    creatorName: 'John Smith',
    creatorPhotoURL: 'https://i.pravatar.cc/150?img=12',
    timing: 'scheduled',
    startAt: new Date('2026-02-07T16:00:00'),
    location: {
      name: 'Praia de Ipanema, Posto 9',
      coordinates: {
        latitude: -22.9868,
        longitude: -43.2005,
      },
    },
    capacity: 8,
    participantCount: 2,
    status: 'active',
    createdAt: new Date('2026-02-06T09:00:00'),
    updatedAt: new Date('2026-02-06T09:00:00'),
  },
  {
    id: '6',
    title: 'Tour Gastronômico na Lapa',
    category: 'food',
    creatorId: '3',
    creatorName: 'María García',
    creatorPhotoURL: 'https://i.pravatar.cc/150?img=5',
    timing: 'scheduled',
    startAt: new Date('2026-02-08T12:00:00'),
    location: {
      name: 'Arcos da Lapa',
      coordinates: {
        latitude: -22.9133,
        longitude: -43.1789,
      },
    },
    capacity: 6,
    participantCount: 1,
    status: 'active',
    createdAt: new Date('2026-02-05T18:00:00'),
    updatedAt: new Date('2026-02-05T18:00:00'),
  },
];

// Helper para filtrar eventos por período
export const filterEventsByTime = (events: Event[], filter: 'all' | 'now' | 'today' | 'tomorrow') => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  // Eventos com timing === 'now' estão acontecendo agora, independente do startAt
  const isNowEvent = (event: Event) => event.timing === 'now';

  switch (filter) {
    case 'now':
      // Eventos com timing 'now' + agendados nas próximas 2 horas
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      return events.filter(event =>
        isNowEvent(event) ||
        (event.startAt >= now && event.startAt <= twoHoursFromNow)
      );

    case 'today':
      // Eventos 'now' + agendados para hoje
      return events.filter(event =>
        isNowEvent(event) ||
        (event.startAt >= today && event.startAt < tomorrow)
      );

    case 'tomorrow':
      // Apenas eventos agendados para amanhã
      return events.filter(event =>
        event.startAt >= tomorrow && event.startAt < dayAfterTomorrow
      );

    case 'all':
    default:
      // Eventos 'now' + todos os eventos futuros agendados
      return events.filter(event =>
        isNowEvent(event) || event.startAt >= now
      );
  }
};

// Helper para verificar se evento está acontecendo agora
export const isEventHappeningNow = (eventDate: Date): boolean => {
  const now = new Date();
  const eventTime = new Date(eventDate);
  const oneHourBefore = new Date(eventTime.getTime() - 60 * 60 * 1000);
  const oneHourAfter = new Date(eventTime.getTime() + 60 * 60 * 1000);

  return now >= oneHourBefore && now <= oneHourAfter;
};

// Helper para formatar horário
export const formatEventTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Helper para formatar data relativa
export const formatRelativeDate = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (eventDate.getTime() === today.getTime()) {
    return 'Hoje';
  } else if (eventDate.getTime() === tomorrow.getTime()) {
    return 'Amanhã';
  } else {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  }
};

// Mapa de categorias para ícones e cores
export const categoryConfig = {
  food: { label: 'Comida', icon: '🍽️', color: '#FF6B35' },
  drinks: { label: 'Drinks', icon: '🍹', color: '#8E44AD' },
  outdoor: { label: 'Turismo', icon: '🗺️', color: '#3498DB' },
  sports: { label: 'Esporte', icon: '⚽', color: '#27AE60' },
  culture: { label: 'Cultura', icon: '🎭', color: '#E74C3C' },
  party: { label: 'Festa', icon: '🎉', color: '#F39C12' },
};

