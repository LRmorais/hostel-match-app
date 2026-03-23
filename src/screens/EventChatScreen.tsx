import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { ChatMessage, Event, RootStackParamList } from '../types';

type EventChatRouteProp = RouteProp<RootStackParamList, 'EventChat'>;

// ─── tipos de display ──────────────────────────────────────────
type DisplayMessageType = 'system' | 'text' | 'date_separator';

interface DisplayMessage {
  id: string;
  type: DisplayMessageType;
  senderId?: string;
  senderName?: string;
  senderPhotoURL?: string;
  text?: string;
  time?: string;
  date?: string;
}

interface ParticipantAvatar {
  userId: string;
  photoURL?: string;
}

// ─── helpers ──────────────────────────────────────────────────
const formatTime = (date: Date): string =>
  `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

const formatDateLabel = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
};

const toDate = (value: any): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  return new Date(value);
};

const buildDisplayList = (
  messages: ChatMessage[],
  systemMsg?: { senderName: string },
): DisplayMessage[] => {
  const result: DisplayMessage[] = [];

  if (systemMsg) {
    result.push({
      id: 'sys-0',
      type: 'system',
      senderName: systemMsg.senderName,
      text: 'criou este rolê. Sejam bem-vindos! 🎉',
    });
  }

  let lastDateStr = '';
  for (const msg of messages) {
    const msgDate = toDate(msg.createdAt);
    const dateStr = msgDate.toDateString();

    if (dateStr !== lastDateStr) {
      result.push({
        id: `sep-${msg.id}`,
        type: 'date_separator',
        date: formatDateLabel(msgDate),
      });
      lastDateStr = dateStr;
    }

    result.push({
      id: msg.id,
      type: 'text',
      senderId: msg.senderId,
      senderName: msg.senderName,
      senderPhotoURL: msg.senderPhotoURL,
      text: msg.message,
      time: formatTime(msgDate),
    });
  }

  return result;
};

// ─── subcomponentes ──────────────────────────────────────────────
const DateSeparator = ({ date }: { date: string }) => (
  <View style={styles.dateSeparatorContainer}>
    <View style={styles.dateSeparatorPill}>
      <Text style={styles.dateSeparatorText}>{date}</Text>
    </View>
  </View>
);

const SystemMessage = ({ senderName, text }: { senderName: string; text: string }) => (
  <View style={styles.systemMessageContainer}>
    <Text style={styles.systemMessageText}>
      🎉 <Text style={styles.systemMessageName}>{senderName}</Text> {text}
    </Text>
  </View>
);

const TextMessage = ({
  message,
  isOwn,
}: {
  message: DisplayMessage;
  isOwn: boolean;
}) => (
  <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
    {!isOwn && (
      message.senderPhotoURL ? (
        <Image source={{ uri: message.senderPhotoURL }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>
            {message.senderName?.charAt(0).toUpperCase()}
          </Text>
        </View>
      )
    )}

    <View style={[styles.messageBubbleWrapper, isOwn && styles.messageBubbleWrapperOwn]}>
      {!isOwn && (
        <Text style={styles.messageSenderName}>{message.senderName}</Text>
      )}
      <View style={[styles.messageBubble, isOwn && styles.messageBubbleOwn]}>
        <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
          {message.text}
        </Text>
      </View>
      <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
        {message.time}
      </Text>
    </View>
  </View>
);

// ─── tela principal ──────────────────────────────────────────────
const EventChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<EventChatRouteProp>();
  const { eventId } = route.params;
  const { firebaseUser, user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [event, setEvent] = useState<Event | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participantAvatars, setParticipantAvatars] = useState<ParticipantAvatar[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Carrega dados do evento e avatares dos participantes
  useEffect(() => {
    const loadEventData = async () => {
      try {
        const [eventData, participantList] = await Promise.all([
          firestoreService.events.get(eventId),
          firestoreService.participants.getByEvent(eventId),
        ]);

        setEvent(eventData);

        const avatarsData = await Promise.all(
          participantList.slice(0, 3).map(async (p) => {
            const userData = await firestoreService.users.get(p.userId);
            return { userId: p.userId, photoURL: userData?.photoURL };
          }),
        );
        setParticipantAvatars(avatarsData);
      } catch (error) {
        console.error('Error loading event data:', error);
      }
    };

    loadEventData();
  }, [eventId]);

  // Escuta mensagens em tempo real
  useEffect(() => {
    setLoading(true);
    const unsubscribe = firestoreService.messages.subscribe(eventId, (newMessages) => {
      setMessages(newMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  // Lista de exibição com separadores de data + mensagem de sistema
  const displayMessages = useMemo(
    () => buildDisplayList(messages, event ? { senderName: event.creatorName } : undefined),
    [messages, event],
  );

  // Scroll para o fim ao receber novas mensagens
  useEffect(() => {
    if (displayMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [displayMessages.length]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !firebaseUser || !user || sending) return;

    setSending(true);
    setInputText('');

    try {
      await firestoreService.messages.send(
        eventId,
        firebaseUser.uid,
        user.displayName,
        text,
        user.photoURL,
      );
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  }, [inputText, firebaseUser, user, eventId, sending]);

  const renderItem = ({ item }: { item: DisplayMessage }) => {
    const isOwn = item.senderId === firebaseUser?.uid;

    switch (item.type) {
      case 'date_separator':
        return <DateSeparator date={item.date!} />;
      case 'system':
        return <SystemMessage senderName={item.senderName!} text={item.text!} />;
      case 'text':
      default:
        return <TextMessage message={item} isOwn={isOwn} />;
    }
  };

  const participantCount = event?.participantCount ?? participantAvatars.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {event?.title ?? '...'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {participantCount} participante{participantCount !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.avatarsRow}>
          {participantAvatars.slice(0, 3).map((p, i) =>
            p.photoURL ? (
              <Image
                key={p.userId}
                source={{ uri: p.photoURL }}
                style={[styles.headerAvatar, { marginLeft: i > 0 ? -10 : 0, zIndex: 3 - i }]}
              />
            ) : (
              <View
                key={p.userId}
                style={[
                  styles.headerAvatar,
                  styles.headerAvatarPlaceholder,
                  { marginLeft: i > 0 ? -10 : 0, zIndex: 3 - i },
                ]}
              >
                <Ionicons name="person" size={14} color="#fff" />
              </View>
            ),
          )}
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={displayMessages}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Escrever mensagem..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity style={styles.emojiButton}>
              <Ionicons name="happy-outline" size={22} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // ─── Header ───
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 1,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerAvatarPlaceholder: {
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Loading ───
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Messages ───
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // Date separator
  dateSeparatorContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorPill: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dateSeparatorText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },

  // System message
  systemMessageContainer: {
    backgroundColor: '#EBF4FF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  systemMessageText: {
    fontSize: 14,
    color: '#2D7DD2',
    lineHeight: 20,
  },
  systemMessageName: {
    fontWeight: '700',
    color: '#2D7DD2',
  },

  // Message row
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  messageRowOwn: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  messageBubbleWrapper: {
    maxWidth: '75%',
  },
  messageBubbleWrapperOwn: {
    alignItems: 'flex-end',
  },
  messageSenderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  messageBubbleOwn: {
    backgroundColor: '#FF6B35',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 21,
  },
  messageTextOwn: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    marginLeft: 4,
  },
  messageTimeOwn: {
    marginLeft: 0,
    marginRight: 4,
  },

  // ─── Input bar ───
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 40,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  emojiButton: {
    marginLeft: 6,
    paddingBottom: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#FFB89A',
  },
});

export default EventChatScreen;
