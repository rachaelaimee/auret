import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { adminDb } from './firebase-admin';

// Types
export interface CraftRoom {
  id: string;
  hostId: string;
  title: string;
  description?: string;
  tags?: string[];
  maxParticipants: number;
  isPublic: boolean;
  requiresApproval: boolean;
  status: 'active' | 'paused' | 'ended';
  dailyRoomName?: string;
  dailyRoomUrl?: string;
  scheduledStartAt?: Timestamp;
  actualStartedAt?: Timestamp;
  endedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CraftRoomParticipant {
  id: string;
  roomId: string;
  userId: string;
  role: 'host' | 'moderator' | 'participant';
  joinedAt: Timestamp;
  leftAt?: Timestamp;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isBanned: boolean;
}

export interface CraftRoomMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'system' | 'media';
  metadata?: {
    replyToId?: string;
    mediaUrl?: string;
    mediaType?: string;
  };
  isDeleted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Collections
const CRAFT_ROOMS_COLLECTION = 'craftRooms';
const CRAFT_ROOM_PARTICIPANTS_COLLECTION = 'craftRoomParticipants';
const CRAFT_ROOM_MESSAGES_COLLECTION = 'craftRoomMessages';

// Helper function to generate room ID
function generateRoomId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Room Management Functions
export async function createCraftRoom(
  hostId: string,
  roomData: {
    title: string;
    description?: string;
    tags?: string[];
    maxParticipants?: number;
    isPublic?: boolean;
    requiresApproval?: boolean;
    scheduledStartAt?: Date;
  }
): Promise<CraftRoom> {
  const roomId = generateRoomId();
  const dailyRoomName = `craft-room-${roomId}`;
  const dailyRoomUrl = `https://auret.daily.co/${dailyRoomName}`;

  const room: Omit<CraftRoom, 'id'> = {
    hostId,
    title: roomData.title,
    description: roomData.description,
    tags: roomData.tags || [],
    maxParticipants: roomData.maxParticipants || 8,
    isPublic: roomData.isPublic ?? true,
    requiresApproval: roomData.requiresApproval ?? false,
    status: 'active',
    dailyRoomName,
    dailyRoomUrl,
    scheduledStartAt: roomData.scheduledStartAt ? Timestamp.fromDate(roomData.scheduledStartAt) : undefined,
    actualStartedAt: serverTimestamp() as Timestamp,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  // Create room document
  const docRef = await addDoc(collection(db, CRAFT_ROOMS_COLLECTION), room);
  
  // Add host as first participant
  await addDoc(collection(db, CRAFT_ROOM_PARTICIPANTS_COLLECTION), {
    roomId: docRef.id,
    userId: hostId,
    role: 'host',
    joinedAt: serverTimestamp(),
    isVideoEnabled: true,
    isAudioEnabled: true,
    isBanned: false,
  });

  return {
    id: docRef.id,
    ...room,
  } as CraftRoom;
}

export async function getCraftRooms(limit = 20): Promise<CraftRoom[]> {
  const q = query(
    collection(db, CRAFT_ROOMS_COLLECTION),
    where('status', '==', 'active'),
    where('isPublic', '==', true),
    orderBy('createdAt', 'desc'),
    firestoreLimit(limit)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as CraftRoom[];
}

export async function getCraftRoom(roomId: string): Promise<CraftRoom | null> {
  const docRef = doc(db, CRAFT_ROOMS_COLLECTION, roomId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as CraftRoom;
  }
  
  return null;
}

export async function updateCraftRoom(
  roomId: string, 
  updates: Partial<Omit<CraftRoom, 'id' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, CRAFT_ROOMS_COLLECTION, roomId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function endCraftRoom(roomId: string): Promise<void> {
  const docRef = doc(db, CRAFT_ROOMS_COLLECTION, roomId);
  await updateDoc(docRef, {
    status: 'ended',
    endedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Mark all participants as left
  const participantsQuery = query(
    collection(db, CRAFT_ROOM_PARTICIPANTS_COLLECTION),
    where('roomId', '==', roomId),
    where('leftAt', '==', null)
  );
  
  const participants = await getDocs(participantsQuery);
  const updatePromises = participants.docs.map(participantDoc => 
    updateDoc(participantDoc.ref, {
      leftAt: serverTimestamp(),
    })
  );
  
  await Promise.all(updatePromises);
}

// Participant Management Functions
export async function joinCraftRoom(roomId: string, userId: string): Promise<CraftRoomParticipant> {
  // Check if user is already in the room
  const existingQuery = query(
    collection(db, CRAFT_ROOM_PARTICIPANTS_COLLECTION),
    where('roomId', '==', roomId),
    where('userId', '==', userId),
    where('leftAt', '==', null)
  );
  
  const existingParticipants = await getDocs(existingQuery);
  if (!existingParticipants.empty) {
    const existing = existingParticipants.docs[0];
    return {
      id: existing.id,
      ...existing.data(),
    } as CraftRoomParticipant;
  }

  // Add new participant
  const participant: Omit<CraftRoomParticipant, 'id'> = {
    roomId,
    userId,
    role: 'participant',
    joinedAt: serverTimestamp() as Timestamp,
    isVideoEnabled: true,
    isAudioEnabled: true,
    isBanned: false,
  };

  const docRef = await addDoc(collection(db, CRAFT_ROOM_PARTICIPANTS_COLLECTION), participant);
  
  return {
    id: docRef.id,
    ...participant,
  } as CraftRoomParticipant;
}

export async function leaveCraftRoom(roomId: string, userId: string): Promise<void> {
  const participantQuery = query(
    collection(db, CRAFT_ROOM_PARTICIPANTS_COLLECTION),
    where('roomId', '==', roomId),
    where('userId', '==', userId),
    where('leftAt', '==', null)
  );
  
  const participants = await getDocs(participantQuery);
  if (!participants.empty) {
    const participantDoc = participants.docs[0];
    await updateDoc(participantDoc.ref, {
      leftAt: serverTimestamp(),
    });
  }
}

export async function getRoomParticipants(roomId: string): Promise<CraftRoomParticipant[]> {
  const q = query(
    collection(db, CRAFT_ROOM_PARTICIPANTS_COLLECTION),
    where('roomId', '==', roomId)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as CraftRoomParticipant[];
}

// Message Functions
export async function sendCraftRoomMessage(
  roomId: string,
  senderId: string,
  content: string,
  messageType: 'text' | 'system' | 'media' = 'text',
  metadata?: any
): Promise<CraftRoomMessage> {
  const message: Omit<CraftRoomMessage, 'id'> = {
    roomId,
    senderId,
    content,
    messageType,
    metadata,
    isDeleted: false,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  const docRef = await addDoc(collection(db, CRAFT_ROOM_MESSAGES_COLLECTION), message);
  
  return {
    id: docRef.id,
    ...message,
  } as CraftRoomMessage;
}

export async function getRoomMessages(roomId: string, limit = 50): Promise<CraftRoomMessage[]> {
  const q = query(
    collection(db, CRAFT_ROOM_MESSAGES_COLLECTION),
    where('roomId', '==', roomId),
    where('isDeleted', '==', false),
    orderBy('createdAt', 'desc'),
    firestoreLimit(limit)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as CraftRoomMessage[];
}
