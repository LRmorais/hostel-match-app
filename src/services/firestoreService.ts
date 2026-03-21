import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { userService } from './userService';
import { Event, User, Participant, ChatMessage, Report } from '../types';
import { APP_CONFIG } from '../utils/constants';

export const firestoreService = {
  // User operations - delegated to userService
  users: {
    async create(uid: string, userData: Partial<User>): Promise<void> {
      const result = await userService.createUserProfile({
        uid,
        email: userData.email || '',
        displayName: userData.displayName || '',
        nationality: userData.nationality || '',
        languages: userData.languages || [],
        bio: userData.bio || '',
        profileStatus: userData.profileStatus || 'incomplete',
      });
      if (!result.success) {
        throw new Error(result.error);
      }
    },

    async update(uid: string, updates: Partial<User>): Promise<void> {
      const result = await userService.updateUserProfile(uid, updates);
      if (!result.success) {
        throw new Error(result.error);
      }
    },

    async get(uid: string): Promise<User | null> {
      const result = await userService.getUserProfile(uid);
      return result.success ? result.data : null;
    },
  },

  // Event operations
  events: {
    async create(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
      const docRef = await addDoc(collection(db, APP_CONFIG.COLLECTIONS.EVENTS), {
        ...eventData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },

    async update(eventId: string, updates: Partial<Event>): Promise<void> {
      await updateDoc(doc(db, APP_CONFIG.COLLECTIONS.EVENTS, eventId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    },

    async get(eventId: string): Promise<Event | null> {
      const docSnap = await getDoc(doc(db, APP_CONFIG.COLLECTIONS.EVENTS, eventId));
      return docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } as Event : null;
    },

    async getActive(limitCount: number = 20): Promise<Event[]> {
      const now = Timestamp.now();
      const q = query(
        collection(db, APP_CONFIG.COLLECTIONS.EVENTS),
        where('status', '==', 'active'),
        where('startAt', '>', now),
        orderBy('startAt', 'asc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Event[];
    },

    async getAllActive(limitCount: number = 50): Promise<Event[]> {
      const q = query(
        collection(db, APP_CONFIG.COLLECTIONS.EVENTS),
        where('status', '==', 'active'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Event[];
    },

    async delete(eventId: string): Promise<void> {
      await deleteDoc(doc(db, APP_CONFIG.COLLECTIONS.EVENTS, eventId));
    },
  },

  // Participant operations
  participants: {
    async join(eventId: string, userId: string): Promise<void> {
      const participantData: Omit<Participant, 'joinedAt'> = {
        userId,
        eventId,
        role: 'participant',
      };

      await addDoc(collection(db, APP_CONFIG.COLLECTIONS.EVENTS, eventId, APP_CONFIG.COLLECTIONS.PARTICIPANTS), {
        ...participantData,
        joinedAt: serverTimestamp(),
      });
    },

    async leave(eventId: string, userId: string): Promise<void> {
      const q = query(
        collection(db, APP_CONFIG.COLLECTIONS.EVENTS, eventId, APP_CONFIG.COLLECTIONS.PARTICIPANTS),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      querySnapshot.docs.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
    },

    async getByEvent(eventId: string): Promise<Participant[]> {
      const querySnapshot = await getDocs(
        collection(db, APP_CONFIG.COLLECTIONS.EVENTS, eventId, APP_CONFIG.COLLECTIONS.PARTICIPANTS)
      );

      return querySnapshot.docs.map(doc => doc.data()) as Participant[];
    },

    async isParticipant(eventId: string, userId: string): Promise<boolean> {
      const q = query(
        collection(db, APP_CONFIG.COLLECTIONS.EVENTS, eventId, APP_CONFIG.COLLECTIONS.PARTICIPANTS),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    },
  },

  // Chat operations
  messages: {
    async send(eventId: string, senderId: string, senderName: string, message: string): Promise<string> {
      const messageData: Omit<ChatMessage, 'id' | 'createdAt'> = {
        eventId,
        senderId,
        senderName,
        message,
      };

      const docRef = await addDoc(
        collection(db, APP_CONFIG.COLLECTIONS.EVENTS, eventId, APP_CONFIG.COLLECTIONS.MESSAGES),
        {
          ...messageData,
          createdAt: serverTimestamp(),
        }
      );

      return docRef.id;
    },

    async getByEvent(eventId: string, limitCount: number = 50): Promise<ChatMessage[]> {
      const q = query(
        collection(db, APP_CONFIG.COLLECTIONS.EVENTS, eventId, APP_CONFIG.COLLECTIONS.MESSAGES),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as ChatMessage[];
    },
  },

  // Report operations
  reports: {
    async create(reportData: Omit<Report, 'id' | 'createdAt'>): Promise<string> {
      const docRef = await addDoc(collection(db, APP_CONFIG.COLLECTIONS.REPORTS), {
        ...reportData,
        createdAt: serverTimestamp(),
      });

      return docRef.id;
    },
  },
};
