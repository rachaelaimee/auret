import { adminDb } from './firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

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

// Collections
const CRAFT_ROOMS_COLLECTION = 'craftRooms';
const CRAFT_ROOM_PARTICIPANTS_COLLECTION = 'craftRoomParticipants';
const CRAFT_ROOM_MESSAGES_COLLECTION = 'craftRoomMessages';

// Helper function to generate room ID
function generateRoomId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Daily.co API integration
async function createDailyRoom(roomName: string): Promise<{ url: string; name: string }> {
  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY environment variable is not set');
  }

  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'public',
        properties: {
          max_participants: 50,
          enable_chat: true,
          enable_screenshare: true,
          enable_recording: false,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // Expire in 24 hours
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Daily.co API error:', error);
      throw new Error(`Failed to create Daily.co room: ${response.status}`);
    }

    const room = await response.json();
    return {
      url: room.url,
      name: room.name,
    };
  } catch (error) {
    console.error('Error creating Daily.co room:', error);
    throw error;
  }
}

// Delete Daily.co room
async function deleteDailyRoom(roomName: string): Promise<void> {
  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  
  if (!DAILY_API_KEY) {
    console.warn('DAILY_API_KEY not set, skipping Daily.co room deletion');
    return;
  }

  try {
    const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      console.error(`Failed to delete Daily.co room ${roomName}: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting Daily.co room:', error);
  }
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
  
  // Create the Daily.co room first
  const dailyRoom = await createDailyRoom(dailyRoomName);

  const room = {
    hostId,
    title: roomData.title,
    description: roomData.description,
    tags: roomData.tags || [],
    maxParticipants: roomData.maxParticipants || 8,
    isPublic: roomData.isPublic ?? true,
    requiresApproval: roomData.requiresApproval ?? false,
    status: 'active' as const,
    dailyRoomName: dailyRoom.name,
    dailyRoomUrl: dailyRoom.url,
    scheduledStartAt: roomData.scheduledStartAt ? Timestamp.fromDate(roomData.scheduledStartAt) : null,
    actualStartedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Create room document
  const docRef = await adminDb.collection(CRAFT_ROOMS_COLLECTION).add(room);
  
  // Add host as first participant
  await adminDb.collection(CRAFT_ROOM_PARTICIPANTS_COLLECTION).add({
    roomId: docRef.id,
    userId: hostId,
    role: 'host',
    joinedAt: FieldValue.serverTimestamp(),
    isVideoEnabled: true,
    isAudioEnabled: true,
    isBanned: false,
  });

  // Get the created room with server timestamps resolved
  const createdRoom = await docRef.get();
  return {
    id: docRef.id,
    ...createdRoom.data(),
  } as CraftRoom;
}

export async function getCraftRooms(limit = 20): Promise<CraftRoom[]> {
  const snapshot = await adminDb
    .collection(CRAFT_ROOMS_COLLECTION)
    .where('status', '==', 'active')
    .where('isPublic', '==', true)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as CraftRoom[];
}

export async function getCraftRoom(roomId: string): Promise<CraftRoom | null> {
  const doc = await adminDb.collection(CRAFT_ROOMS_COLLECTION).doc(roomId).get();
  
  if (doc.exists) {
    return {
      id: doc.id,
      ...doc.data(),
    } as CraftRoom;
  }
  
  return null;
}

export async function updateCraftRoom(
  roomId: string, 
  updates: Partial<Omit<CraftRoom, 'id' | 'createdAt'>>
): Promise<void> {
  await adminDb.collection(CRAFT_ROOMS_COLLECTION).doc(roomId).update({
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function endCraftRoom(roomId: string): Promise<void> {
  // Get the room to find the Daily.co room name
  const room = await getCraftRoom(roomId);
  
  await adminDb.collection(CRAFT_ROOMS_COLLECTION).doc(roomId).update({
    status: 'ended',
    endedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Mark all participants as left
  const participantsSnapshot = await adminDb
    .collection(CRAFT_ROOM_PARTICIPANTS_COLLECTION)
    .where('roomId', '==', roomId)
    .where('leftAt', '==', null)
    .get();
  
  const batch = adminDb.batch();
  participantsSnapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      leftAt: FieldValue.serverTimestamp(),
    });
  });
  
  await batch.commit();

  // Delete the Daily.co room
  if (room?.dailyRoomName) {
    await deleteDailyRoom(room.dailyRoomName);
  }
}

// Participant Management Functions
export async function joinCraftRoom(roomId: string, userId: string): Promise<CraftRoomParticipant> {
  // Check if user is already in the room
  const existingSnapshot = await adminDb
    .collection(CRAFT_ROOM_PARTICIPANTS_COLLECTION)
    .where('roomId', '==', roomId)
    .where('userId', '==', userId)
    .where('leftAt', '==', null)
    .get();
  
  if (!existingSnapshot.empty) {
    const existing = existingSnapshot.docs[0];
    return {
      id: existing.id,
      ...existing.data(),
    } as CraftRoomParticipant;
  }

  // Add new participant
  const participant = {
    roomId,
    userId,
    role: 'participant' as const,
    joinedAt: FieldValue.serverTimestamp(),
    isVideoEnabled: true,
    isAudioEnabled: true,
    isBanned: false,
  };

  const docRef = await adminDb.collection(CRAFT_ROOM_PARTICIPANTS_COLLECTION).add(participant);
  
  // Get the created participant with server timestamps resolved
  const createdParticipant = await docRef.get();
  return {
    id: docRef.id,
    ...createdParticipant.data(),
  } as CraftRoomParticipant;
}

export async function leaveCraftRoom(roomId: string, userId: string): Promise<void> {
  const participantSnapshot = await adminDb
    .collection(CRAFT_ROOM_PARTICIPANTS_COLLECTION)
    .where('roomId', '==', roomId)
    .where('userId', '==', userId)
    .where('leftAt', '==', null)
    .get();
  
  if (!participantSnapshot.empty) {
    const participantDoc = participantSnapshot.docs[0];
    await participantDoc.ref.update({
      leftAt: FieldValue.serverTimestamp(),
    });
  }
}

export async function getRoomParticipants(roomId: string): Promise<CraftRoomParticipant[]> {
  const snapshot = await adminDb
    .collection(CRAFT_ROOM_PARTICIPANTS_COLLECTION)
    .where('roomId', '==', roomId)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as CraftRoomParticipant[];
}
