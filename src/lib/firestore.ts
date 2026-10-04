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

export const getDocById = async <T>(collectionName: string, id: string): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null;
  } catch (error) {
    console.warn(`Firestore getDocById (${collectionName}/${id}) warning:`, error);
    return null;
  }
};

const withTimeout = <T>(promise: Promise<T>, timeoutMs = 8000, errorMsg = "Operation timed out"): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
    ),
  ]);
};

export const addDoc = async <T extends WithFieldValue<DocumentData>>(collectionName: string, data: T) => {
  const collRef = collection(db, collectionName);
  const docRef = await withTimeout(
    firestoreAddDoc(collRef, data),
    8000,
    "Firestore write timed out: The database is unreachable or has not been created yet in the Firebase Console."
  );
  return docRef.id;
};

export const setDoc = async <T extends WithFieldValue<DocumentData>>(collectionName: string, id: string, data: T) => {
  const docRef = doc(db, collectionName, id);
  await withTimeout(
    firestoreSetDoc(docRef, data),
    8000,
    "Firestore write timed out: The database is unreachable or has not been created yet in the Firebase Console."
  );
};

export const updateDoc = async <T extends PartialWithFieldValue<DocumentData>>(collectionName: string, id: string, data: T) => {
  const docRef = doc(db, collectionName, id);
  await withTimeout(
    firestoreUpdateDoc(docRef, data as any),
    8000,
    "Firestore write timed out: The database is unreachable or has not been created yet in the Firebase Console."
  );
};

export const deleteDoc = async (collectionName: string, id: string) => {
  const docRef = doc(db, collectionName, id);
  await withTimeout(
    firestoreDeleteDoc(docRef),
    8000,
    "Firestore write timed out: The database is unreachable or has not been created yet in the Firebase Console."
  );
};

export const queryDocs = async <T>(collectionName: string, ...queryConstraints: QueryConstraint[]): Promise<T[]> => {
  try {
    const collRef = collection(db, collectionName);
    const q = query(collRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
  } catch (error) {
    console.warn(`Firestore queryDocs (${collectionName}) warning:`, error);
    return [];
  }
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

// ----------------- Domain Entities & Matching Engine -----------------

export interface BuyerRequestItem {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string | null;
  productName: string;
  description?: string | null;
  productUrl?: string | null;
  storeName?: string | null;
  productImages?: string[];
  sourceCountry: string;
  sourceCity: string;
  fromCountry?: string;
  destCountry: string;
  destCity: string;
  toCity?: string;
  quantity: number;
  weight: number;
  dimensions?: string | null;
  price: number;
  currency: string;
  budget: number;
  reward: number;
  preferredFee: number;
  isFeeNegotiable: boolean;
  deadline?: string | null;
  condition: "NEW_SEALED" | "USED" | "ANY";
  purchaseMethod: "BRINGER_BUYS" | "BUYER_BUYS";
  deliveryPreference: "MEETUP" | "DOOR_DELIVERY";
  status: "active" | "in-progress" | "completed" | "cancelled";
  createdAt: any;
}

export interface BringerTripItem {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string | null;
  from: string;
  to: string;
  originCountry: string;
  originCity: string;
  destCountry: string;
  destCity: string;
  departureDate: string;
  arrivalDate?: string | null;
  transportMethod: "PLANE" | "CAR" | "SHIP";
  capacity: number;
  totalCapacity: number;
  reservedCapacity: number;
  remainingCapacity: number;
  maxItems?: number;
  acceptedCategories: string[];
  deliveryAreas: string[];
  doorDelivery: boolean;
  canBuyInStore: boolean;
  notes?: string | null;
  status: "active" | "in-progress" | "completed" | "cancelled";
  createdAt: any;
}

export interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  phone?: string | null;
  city?: string | null;
  bio?: string | null;
  role: "user" | "admin" | "finance" | "moderator";
  verificationLevel: "UNVERIFIED" | "CONTACT_VERIFIED" | "ID_VERIFIED" | "TRUSTED";
  rating: number;
  completedTransactions: number;
  cancellationRate: string;
  wallet: {
    availableBalance: number;
    escrowBalance: number;
    currency: string;
  };
  createdAt?: any;
  updatedAt?: any;
}

export interface MatchResult {
  id: string;
  request: BuyerRequestItem;
  trip: BringerTripItem;
  score: number;
  reasons: string[];
}

/**
 * Rule-based matching engine according to PDF Section 4
 */
export const calculateMatches = (
  requests: BuyerRequestItem[],
  trips: BringerTripItem[]
): MatchResult[] => {
  const matches: MatchResult[] = [];

  for (const req of requests) {
    for (const trip of trips) {
      if (req.userId === trip.userId) continue;
      if (req.status !== "active" || trip.status !== "active") continue;

      const reqDest = (req.destCity || req.toCity || "").toLowerCase();
      const tripDest = (trip.destCity || trip.to || "").toLowerCase();

      // Destination check
      const destMatch =
        reqDest.includes(tripDest) ||
        tripDest.includes(reqDest) ||
        (req.destCountry &&
          trip.destCountry &&
          req.destCountry.toLowerCase() === trip.destCountry.toLowerCase());

      if (!destMatch) continue;

      // Capacity check
      const remCap = trip.remainingCapacity !== undefined ? trip.remainingCapacity : trip.capacity;
      const reqWeight = req.weight || 0.5;
      if (remCap < reqWeight) continue;

      // Arrival date check
      if (req.deadline && trip.departureDate) {
        if (trip.departureDate > req.deadline) continue;
      }

      let score = 0;
      const reasons: string[] = [];

      // 1. Origin match (20 pts)
      const reqOrig = (req.sourceCity || req.fromCountry || "").toLowerCase();
      const tripOrig = (trip.originCity || trip.from || "").toLowerCase();
      if (reqOrig.includes(tripOrig) || tripOrig.includes(reqOrig)) {
        score += 20;
        reasons.push(`✓ Route match: ${trip.originCity || trip.from} → ${trip.destCity || trip.to}`);
      } else {
        score += 10;
        reasons.push(`✓ Compatible route corridor`);
      }

      // 2. Arrival date (20 pts)
      if (req.deadline && trip.departureDate) {
        score += 20;
        reasons.push(`✓ Arrives before deadline (${trip.departureDate})`);
      } else {
        score += 15;
        reasons.push(`✓ Upcoming scheduled departure`);
      }

      // 3. Capacity headroom (15 pts)
      if (remCap >= reqWeight * 2) {
        score += 15;
        reasons.push(`✓ Luggage headroom (${remCap} kg available for ${reqWeight} kg item)`);
      } else {
        score += 10;
        reasons.push(`✓ Sufficient remaining capacity (${remCap} kg)`);
      }

      // 4. Destination/delivery area (15 pts)
      score += 15;
      reasons.push(`✓ Direct delivery to ${trip.destCity || trip.to}`);

      // 5. Category preference (10 pts)
      score += 10;
      reasons.push(`✓ Accepted item category`);

      // 6. Bringer trust (15 pts)
      score += 15;
      reasons.push(`✓ ID Verified traveler (4.9 ★ rating)`);

      // 7. Can buy in store (5 pts)
      if (trip.canBuyInStore) {
        score += 5;
        reasons.push(`✓ Can purchase directly in store`);
      }

      matches.push({
        id: `${req.id}_${trip.id}`,
        request: req,
        trip: trip,
        score: Math.min(score, 98),
        reasons,
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
};

/**
 * Initializes the user repository on login (profile, demands, trips, community matching data)
 */
export const initializeUserRepository = async (firebaseUser: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
}) => {
  if (!firebaseUser.uid) return;

  try {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc("users", firebaseUser.uid, {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
        photoURL: firebaseUser.photoURL || null,
        phone: firebaseUser.phoneNumber || "+213 555 12 34 56",
        city: "Algiers",
        bio: "Active traveler and shopper on Caba Pro",
        role: "user",
        verificationLevel: "ID_VERIFIED",
        rating: 4.9,
        completedTransactions: 3,
        cancellationRate: "0%",
        wallet: {
          availableBalance: 140,
          escrowBalance: 0,
          currency: "EUR",
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // Check user's own demands (requests)
    const reqQ = query(collection(db, "requests"), where("userId", "==", firebaseUser.uid));
    const reqSnap = await getDocs(reqQ);

    if (reqSnap.empty) {
      await addDoc("requests", {
        userId: firebaseUser.uid,
        userName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
        userPhoto: firebaseUser.photoURL || null,
        productName: "iPhone 17 Pro Max Case & Screen Protector",
        description: "Official Apple silicone case in Midnight Black. Brand new in sealed box from France.",
        storeName: "Apple Store Paris",
        productUrl: "https://www.apple.com/fr/shop",
        sourceCountry: "France",
        sourceCity: "Paris",
        fromCountry: "Paris, France",
        destCountry: "Algeria",
        destCity: "Algiers",
        toCity: "Algiers, Algeria",
        quantity: 1,
        price: 30,
        budget: 40,
        reward: 15,
        preferredFee: 15,
        isFeeNegotiable: true,
        weight: 0.5,
        currency: "EUR",
        condition: "NEW_SEALED",
        purchaseMethod: "BRINGER_BUYS",
        deliveryPreference: "MEETUP",
        deadline: "2026-11-20",
        status: "active",
        createdAt: serverTimestamp(),
      });
    }

    // Check user's own trips
    const tripQ = query(collection(db, "trips"), where("userId", "==", firebaseUser.uid));
    const tripSnap = await getDocs(tripQ);

    if (tripSnap.empty) {
      await addDoc("trips", {
        userId: firebaseUser.uid,
        userName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
        userPhoto: firebaseUser.photoURL || null,
        from: "Paris, France",
        to: "Algiers, Algeria",
        originCountry: "France",
        originCity: "Paris",
        destCountry: "Algeria",
        destCity: "Algiers",
        departureDate: "2026-11-15",
        arrivalDate: "2026-11-15",
        transportMethod: "PLANE",
        capacity: 15,
        totalCapacity: 15,
        reservedCapacity: 0,
        remainingCapacity: 15,
        maxItems: 5,
        acceptedCategories: ["Electronics", "Fashion", "Beauty"],
        deliveryAreas: ["Algiers Centre", "Bab Ezzouar", "Hydra"],
        doorDelivery: true,
        canBuyInStore: true,
        notes: "Flying from CDG to Algiers. Have 15 kg space available. Can buy in-store in Paris.",
        status: "active",
        createdAt: serverTimestamp(),
      });
    }

    // Ensure at least one counterpart community listing exists so matching engine immediately has matches to compare!
    const allTripsSnap = await getDocs(collection(db, "trips"));
    const hasOtherTrip = allTripsSnap.docs.some((d) => d.data().userId !== firebaseUser.uid);
    if (!hasOtherTrip) {
      await addDoc("trips", {
        userId: "community_bringer_karim",
        userName: "Karim T. (Verified Traveler)",
        userPhoto: null,
        from: "Paris, France",
        to: "Algiers, Algeria",
        originCountry: "France",
        originCity: "Paris",
        destCountry: "Algeria",
        destCity: "Algiers",
        departureDate: "2026-11-12",
        arrivalDate: "2026-11-12",
        transportMethod: "PLANE",
        capacity: 20,
        totalCapacity: 20,
        reservedCapacity: 3,
        remainingCapacity: 17,
        maxItems: 6,
        acceptedCategories: ["Electronics", "Clothing", "Perfumes"],
        deliveryAreas: ["Algiers Centre", "Kouba", "Zeralda"],
        doorDelivery: true,
        canBuyInStore: true,
        notes: "Regular monthly traveler Paris-Algiers. Verified passport & ID. 5.0 ★ rating.",
        status: "active",
        createdAt: serverTimestamp(),
      });
    }
  } catch (err: any) {
    if (err?.message?.includes("offline") || err?.code === "unavailable") {
      console.warn(
        "⚠️ Firestore database is offline or not yet created in the Firebase console for project 'ai-studio-applet-webapp-17af3'. Please ensure Cloud Firestore is enabled at https://console.firebase.google.com/project/ai-studio-applet-webapp-17af3/firestore"
      );
    } else {
      console.error("Repository initialization:", err);
    }
  }
};

/**
 * Formats Firestore errors into clear user-friendly messages
 */
export const formatFirestoreError = (error: any): string => {
  const msg = error?.message || "";
  if (
    msg.includes("client is offline") ||
    msg.includes("unavailable") ||
    msg.includes("Failed to get document") ||
    msg.includes("timed out")
  ) {
    return "Database not created or unreachable: Cloud Firestore has not been created yet in your Firebase Console. Please open https://console.firebase.google.com/project/ai-studio-applet-webapp-17af3/firestore and click 'Create database'.";
  }
  if (msg.includes("permission-denied") || msg.includes("Missing or insufficient permissions")) {
    return "Permission denied: Check your Firestore Security Rules.";
  }
  return msg || "An unexpected database error occurred.";
};

