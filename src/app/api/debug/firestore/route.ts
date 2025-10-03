import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Firestore connection...');
    
    // Test 1: Try to read from craftRooms collection
    const roomsSnapshot = await adminDb.collection('craftRooms').limit(5).get();
    console.log('Rooms found:', roomsSnapshot.docs.length);
    
    const rooms = roomsSnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    // Test 2: Try to read all documents (no filters)
    const allRoomsSnapshot = await adminDb.collection('craftRooms').get();
    console.log('Total rooms in collection:', allRoomsSnapshot.docs.length);

    return NextResponse.json({
      success: true,
      message: 'Firestore connection working',
      stats: {
        filteredRooms: roomsSnapshot.docs.length,
        totalRooms: allRoomsSnapshot.docs.length,
      },
      sampleRooms: rooms,
    });

  } catch (error) {
    console.error('Firestore test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
