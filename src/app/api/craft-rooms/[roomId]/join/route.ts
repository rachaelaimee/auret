import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { 
  getCraftRoom,
  joinCraftRoom,
  leaveCraftRoom,
  getRoomParticipants
} from "@/lib/firestore-craft-rooms-admin";

interface RouteParams {
  params: {
    roomId: string;
  };
}

// POST /api/craft-rooms/[roomId]/join - Join a craft room
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const { roomId } = params;

    // Check if room exists and is active
    const room = await getCraftRoom(roomId);
    if (!room || room.status !== 'active') {
      return NextResponse.json(
        { success: false, error: "Room not found or inactive" },
        { status: 404 }
      );
    }

    // Check room capacity
    const participants = await getRoomParticipants(roomId);
    const activeParticipants = participants.filter(p => !p.leftAt);
    
    if (activeParticipants.length >= room.maxParticipants) {
      return NextResponse.json(
        { success: false, error: "Room is full" },
        { status: 400 }
      );
    }

    // Join the room
    const participant = await joinCraftRoom(roomId, decodedToken.uid);

    return NextResponse.json({
      success: true,
      data: {
        message: "Successfully joined room",
        room,
        participant,
      },
    });
  } catch (error) {
    console.error("Error joining room:", error);
    return NextResponse.json(
      { success: false, error: "Failed to join room" },
      { status: 500 }
    );
  }
}

// DELETE /api/craft-rooms/[roomId]/join - Leave a craft room
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const { roomId } = params;

    // Leave the room
    await leaveCraftRoom(roomId, decodedToken.uid);

    return NextResponse.json({
      success: true,
      data: {
        message: "Successfully left room",
      },
    });
  } catch (error) {
    console.error("Error leaving room:", error);
    return NextResponse.json(
      { success: false, error: "Failed to leave room" },
      { status: 500 }
    );
  }
}
