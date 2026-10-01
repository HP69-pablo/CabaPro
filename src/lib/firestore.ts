import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc as firestoreAddDoc, 
  setDoc as firestoreSetDoc,
  updateDoc as firestoreUpdateDoc, 
  deleteDoc as firestoreDeleteDoc,
  query,
  QueryConstraint,
  DocumentData,
  WithFieldValue,
  PartialWithFieldValue,
  CollectionReference,
  onSnapshot,
  serverTimestamp,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';

export const createCollection = <T = DocumentData>(collectionName: string) => {
  return collection(db, collectionName) as CollectionReference<T>;
};

export const collections = {
  users: createCollection('users'),
  requests: createCollection('requests'),
  trips: createCollection('trips'),
  conversations: createCollection('conversations'),
  transactions: createCollection('transactions'),
};

export const getDocById = async <T>(collectionName: string, id: string) => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null;
};

export const addDoc = async <T extends WithFieldValue<DocumentData>>(collectionName: string, data: T) => {
  const collRef = collection(db, collectionName);
  const docRef = await firestoreAddDoc(collRef, data);
  return docRef.id;
};

export const setDoc = async <T extends WithFieldValue<DocumentData>>(collectionName: string, id: string, data: T) => {
  const docRef = doc(db, collectionName, id);
  await firestoreSetDoc(docRef, data);
};

export const updateDoc = async <T extends PartialWithFieldValue<DocumentData>>(collectionName: string, id: string, data: T) => {
  const docRef = doc(db, collectionName, id);
  await firestoreUpdateDoc(docRef, data as any);
};

export const deleteDoc = async (collectionName: string, id: string) => {
  const docRef = doc(db, collectionName, id);
  await firestoreDeleteDoc(docRef);
};

export const queryDocs = async <T>(collectionName: string, ...queryConstraints: QueryConstraint[]) => {
  const collRef = collection(db, collectionName);
  const q = query(collRef, ...queryConstraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
};

// ----------------- Chat & Messaging Helpers -----------------

export interface ConversationItem {
  id: string;
  participants: string[];
  participantDetails: {
    [uid: string]: {
      name: string;
      photoURL?: string | null;
      email?: string | null;
    };
  };
  requestId?: string | null;
  requestTitle?: string | null;
  tripId?: string | null;
  tripRoute?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: any;
  createdAt?: any;
}

export interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  type?: 'text' | 'offer' | 'system';
  offer?: {
    productPrice: number;
    reward: number;
    currency: string;
    status: 'pending' | 'accepted' | 'declined';
  };
  createdAt?: any;
}

/**
 * Find or create a conversation between two users (e.g. for a request or trip)
 */
export const getOrCreateConversation = async (
  currentUser: { uid: string; displayName?: string | null; photoURL?: string | null; email?: string | null },
  targetUser: { uid: string; displayName?: string | null; photoURL?: string | null; email?: string | null },
  context?: { requestId?: string; requestTitle?: string; tripId?: string; tripRoute?: string }
): Promise<string> => {
  if (currentUser.uid === targetUser.uid) {
    throw new Error("Cannot start conversation with yourself");
  }

  // Look for existing conversation with these participants
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', currentUser.uid)
  );
  const snap = await getDocs(q);
  
  const existing = snap.docs.find(doc => {
    const data = doc.data();
    const parts: string[] = data.participants || [];
    const hasTarget = parts.includes(targetUser.uid);
    // If context request provided, match requestId
    if (context?.requestId && data.requestId) {
      return hasTarget && data.requestId === context.requestId;
    }
    // If context trip provided, match tripId
    if (context?.tripId && data.tripId) {
      return hasTarget && data.tripId === context.tripId;
    }
    return hasTarget;
  });

  if (existing) {
    return existing.id;
  }

  // Create new conversation
  const newConv = {
    participants: [currentUser.uid, targetUser.uid],
    participantDetails: {
      [currentUser.uid]: {
        name: currentUser.displayName || currentUser.email?.split('@')[0] || "User",
        photoURL: currentUser.photoURL || null,
        email: currentUser.email || null,
      },
      [targetUser.uid]: {
        name: targetUser.displayName || targetUser.email?.split('@')[0] || "User",
        photoURL: targetUser.photoURL || null,
        email: targetUser.email || null,
      }
    },
    requestId: context?.requestId || null,
    requestTitle: context?.requestTitle || null,
    tripId: context?.tripId || null,
    tripRoute: context?.tripRoute || null,
    lastMessage: "Conversation started",
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  const docRef = await firestoreAddDoc(collection(db, 'conversations'), newConv);
  return docRef.id;
};

/**
 * Subscribe to user conversations
 */
export const subscribeToConversations = (
  userId: string,
  callback: (conversations: ConversationItem[]) => void
) => {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const list: ConversationItem[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ConversationItem));

    // Client-side sort by lastMessageAt descending
    list.sort((a, b) => {
      const timeA = a.lastMessageAt?.toMillis?.() || 0;
      const timeB = b.lastMessageAt?.toMillis?.() || 0;
      return timeB - timeA;
    });

    callback(list);
  });
};

/**
 * Subscribe to messages in a conversation
 */
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: MessageItem[]) => void
) => {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const list: MessageItem[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MessageItem));
    callback(list);
  });
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (
  conversationId: string,
  message: {
    senderId: string;
    senderName: string;
    text: string;
    type?: 'text' | 'offer' | 'system';
    offer?: {
      productPrice: number;
      reward: number;
      currency: string;
      status: 'pending' | 'accepted' | 'declined';
    };
  }
) => {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const convRef = doc(db, 'conversations', conversationId);

  await firestoreAddDoc(messagesRef, {
    ...message,
    type: message.type || 'text',
    createdAt: serverTimestamp(),
  });

  const summary = message.type === 'offer' 
    ? `Offer: €${message.offer?.productPrice} + €${message.offer?.reward}`
    : message.text;

  await firestoreUpdateDoc(convRef, {
    lastMessage: summary,
    lastMessageAt: serverTimestamp(),
  });
};

/**
 * Update offer status in a message
 */
export const updateOfferStatus = async (
  conversationId: string,
  messageId: string,
  status: 'accepted' | 'declined'
) => {
  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  await firestoreUpdateDoc(messageRef, {
    'offer.status': status,
  });

  // Post system announcement
  await sendMessage(conversationId, {
    senderId: 'system',
    senderName: 'Caba Pro',
    type: 'system',
    text: status === 'accepted' ? '🎉 Offer accepted by both parties!' : '❌ Offer was declined.',
  });
};
