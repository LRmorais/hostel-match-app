// User types
export interface CurrentStay {
  hotelId: number;
  hotelName: string;
  city: string;
  country: string;
  checkIn?: string;   // YYYY-MM-DD
  checkOut?: string;  // YYYY-MM-DD
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  nationality: string;
  languages: string[];
  bio: string;
  profileStatus: 'incomplete' | 'complete';
  currentStay?: CurrentStay;
  createdAt: Date;
  updatedAt: Date;
}

// Event (Rolê) types
export interface Event {
  id: string;
  title: string;
  category: EventCategory;
  creatorId: string;
  creatorName: string;
  creatorPhotoURL?: string;
  timing: 'now' | 'scheduled';
  startAt: Date;
  location: EventLocation;
  capacity: number;
  participantCount: number;
  description?: string;
  status: EventStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type EventCategory =
  | 'food'
  | 'drinks'
  | 'outdoor'
  | 'culture'
  | 'party'
  | 'sports';

export type EventStatus = 'active' | 'cancelled' | 'full' | 'expired';

export interface EventLocation {
  name: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Participant types
export interface Participant {
  userId: string;
  eventId: string;
  role: 'creator' | 'participant';
  joinedAt: Date;
}

// Chat message types
export interface ChatMessage {
  id: string;
  eventId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  message: string;
  createdAt: Date;
}

// Navigation types
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: { email?: string } | undefined;
  OnboardingProfile: undefined;
  MainTabs: { screen?: keyof TabParamList } | undefined;
  CreateEvent: undefined;
  EventDetail: { eventId: string };
  EventParticipants: { eventId: string };
  EventChat: { eventId: string };
  Settings: undefined;
  ManageEvent: { eventId: string };
  EditProfile: undefined;
  ChangePassword: undefined;
  ReportUser: { userId: string };
  ReportEvent: { eventId: string };
  UserProfile: { userId: string };
  HostelSelection: undefined;
};

export type TabParamList = {
  Roles: undefined;
  Explorar: undefined;
  Criar: undefined;
  Perfil: undefined;
};

// Location types
export interface LocationData {
  latitude: number;
  longitude: number;
}

// Report types
export interface Report {
  id: string;
  reporterId: string;
  targetType: 'user' | 'event';
  targetId: string;
  targetName?: string;
  reason: ReportReason;
  description?: string;
  createdAt: Date;
}

export type ReportReason =
  | 'inappropriate'
  | 'spam'
  | 'dangerous'
  | 'fake'
  | 'harassment'
  | 'other';

// ─── Hotels API types ──────────────────────────────────────────

/** Hotel retornado pela API */
export interface Hotel {
  id: number;
  name: string;
  city: string;
  country: string;
  country_code: string;
  address: string;
  rating: number;       // estrelas (ex: 4, 5)
  lat: number;
  lng: number;
  amenities: string[];  // ex: ["bar", "free_wifi", "gym"]
}

/** Envelope padrão de todas as respostas da API */
export interface HotelApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string | null;
  timestamp: number;
}

export interface HotelSearchParams {
  query?: string;     // busca geral por nome/cidade
  name?: string;      // busca por nome do hotel
  city?: string;
  country?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  minRating?: number;
  amenities?: string[];
  page?: number;
  limit?: number;
}


export interface HotelApiError {
  code: string;
  message: string;
  statusCode: number;
}

export type HotelApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: HotelApiError };

