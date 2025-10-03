import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { 
  getCraftRoom, 
  updateCraftRoom, 
  endCraftRoom,
  getRoomParticipants 
} from "@/lib/firestore-craft-rooms";

interface RouteParams {
  params: {
    roomId: string;
  };
}

// GET /api/craft-rooms/[roomId] - Get room details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { roomId } = params;

    const room = await getCraftRoom(roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    // Get participants
    const participants = await getRoomParticipants(roomId);
    const activeParticipants = participants.filter(p => !p.leftAt);

    return NextResponse.json({
      success: true,
      data: {
        ...room,
        participants: activeParticipants,
        participantCount: activeParticipants.length,
      },
    });
  } catch (error) {
    console.error("Error fetching room details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch room details" },
      { status: 500 }
    );
  }
}

// PATCH /api/craft-rooms/[roomId] - Update room (host only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const body = await request.json();

    // Check if user is the host
    const room = await getCraftRoom(roomId);
    if (!room || room.hostId !== decodedToken.uid) {
      return NextResponse.json(
        { success: false, error: "Room not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update room
    await updateCraftRoom(roomId, body);
    const updatedRoom = await getCraftRoom(roomId);

    return NextResponse.json({
      success: true,
      data: updatedRoom,
    });
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update room" },
      { status: 500 }
    );
  }
}

// DELETE /api/craft-rooms/[roomId] - End room (host only)
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

    // Check if user is the host
    const room = await getCraftRoom(roomId);
    if (!room || room.hostId !== decodedToken.uid) {
      return NextResponse.json(
        { success: false, error: "Room not found or unauthorized" },
        { status: 404 }
      );
    }

    // End the room
    await endCraftRoom(roomId);
    const endedRoom = await getCraftRoom(roomId);

    return NextResponse.json({
      success: true,
      data: endedRoom,
    });
  } catch (error) {
    console.error("Error ending room:", error);
    return NextResponse.json(
      { success: false, error: "Failed to end room" },
      { status: 500 }
    );
  }
}
