// Constants and configuration
export const APP_CONFIG = {
  // App Info
  APP_NAME: 'Hostel Match',
  VERSION: '1.0.0',

  // Firebase Collections
  COLLECTIONS: {
    USERS: 'users',
    EVENTS: 'events',
    PARTICIPANTS: 'participants',
    MESSAGES: 'messages',
    REPORTS: 'reports',
  },

  // Business Rules
  BUSINESS_RULES: {
    MIN_PASSWORD_LENGTH: 6,
    MAX_BIO_LENGTH: 150,
    MIN_EVENT_CAPACITY: 2,
    MAX_EVENT_CAPACITY: 10,
    MAX_DISTANCE_KM: 50,
    DEFAULT_SEARCH_RADIUS_KM: 5,
  },

  // Event Categories
  EVENT_CATEGORIES: [
    { key: 'comida', label: '🍕 Comida', color: '#FF6B35' },
    { key: 'drinks', label: '🍻 Drinks', color: '#F7931E' },
    { key: 'turismo', label: '🗺️ Turismo', color: '#4ECDC4' },
    { key: 'esporte', label: '⚽ Esporte', color: '#45B7D1' },
    { key: 'cultura', label: '🎭 Cultura', color: '#96CEB4' },
    { key: 'festa', label: '🎉 Festa', color: '#FFEAA7' },
    { key: 'outro', label: '➕ Outro', color: '#DDA0DD' },
  ],

  // Languages
  LANGUAGES: [
    { key: 'pt', label: 'Português' },
    { key: 'en', label: 'English' },
    { key: 'es', label: 'Español' },
    { key: 'fr', label: 'Français' },
    { key: 'de', label: 'Deutsch' },
    { key: 'it', label: 'Italiano' },
    { key: 'zh', label: '中文' },
    { key: 'ja', label: '日本語' },
    { key: 'ko', label: '한국어' },
    { key: 'ar', label: 'العربية' },
  ],

  // Nationalities (sample - can be expanded)
  NATIONALITIES: [
    'Brazilian', 'American', 'British', 'French', 'German', 'Italian',
    'Spanish', 'Portuguese', 'Australian', 'Canadian', 'Mexican',
    'Argentinian', 'Colombian', 'Chilean', 'Japanese', 'Korean',
    'Chinese', 'Indian', 'Russian', 'Other'
  ],

  // Report Reasons
  REPORT_REASONS: [
    { key: 'spam', label: 'Spam ou conteúdo comercial' },
    { key: 'harassment', label: 'Assédio ou comportamento inapropriado' },
    { key: 'fake', label: 'Perfil ou informações falsas' },
    { key: 'other', label: 'Outro motivo' },
  ],
};

// Color Palette
export const COLORS = {
  // Primary
  PRIMARY: '#007AFF',
  PRIMARY_DARK: '#0056CC',
  PRIMARY_LIGHT: '#66B3FF',

  // Secondary
  SECONDARY: '#FF6B35',
  SECONDARY_DARK: '#E55A2B',
  SECONDARY_LIGHT: '#FF8A5C',

  // Neutrals
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  GRAY_100: '#F8F9FA',
  GRAY_200: '#E9ECEF',
  GRAY_300: '#DEE2E6',
  GRAY_400: '#CED4DA',
  GRAY_500: '#ADB5BD',
  GRAY_600: '#6C757D',
  GRAY_700: '#495057',
  GRAY_800: '#343A40',
  GRAY_900: '#212529',

  // Status
  SUCCESS: '#28A745',
  WARNING: '#FFC107',
  ERROR: '#DC3545',
  INFO: '#17A2B8',

  // Background
  BACKGROUND: '#FFFFFF',
  BACKGROUND_SECONDARY: '#F8F9FA',

  // Text
  TEXT_PRIMARY: '#212529',
  TEXT_SECONDARY: '#6C757D',
  TEXT_MUTED: '#ADB5BD',
};

// Typography
export const TYPOGRAPHY = {
  // Font Sizes
  FONT_SIZE: {
    XS: 12,
    SM: 14,
    MD: 16,
    LG: 18,
    XL: 20,
    XXL: 24,
    XXXL: 32,
  },

  // Font Weights
  FONT_WEIGHT: {
    NORMAL: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700',
  },

  // Line Heights
  LINE_HEIGHT: {
    TIGHT: 1.2,
    NORMAL: 1.4,
    RELAXED: 1.6,
  },
};

// Spacing
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
};

// Screen Dimensions (will be updated with actual device dimensions)
export const SCREEN = {
  PADDING: SPACING.MD,
  BORDER_RADIUS: 8,
};
