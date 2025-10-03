import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { craftRooms, craftRoomParticipants } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: {
    roomId: string;
  };
}

// GET /api/craft-rooms/[roomId] - Get room details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { roomId } = params;

    const room = await db
      .select()
      .from(craftRooms)
      .where(eq(craftRooms.id, roomId))
      .limit(1);

    if (!room.length) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    // Get participants
    const participants = await db
      .select({
        id: craftRoomParticipants.id,
        userId: craftRoomParticipants.userId,
        role: craftRoomParticipants.role,
        joinedAt: craftRoomParticipants.joinedAt,
        leftAt: craftRoomParticipants.leftAt,
        isVideoEnabled: craftRoomParticipants.isVideoEnabled,
        isAudioEnabled: craftRoomParticipants.isAudioEnabled,
      })
      .from(craftRoomParticipants)
      .where(eq(craftRoomParticipants.roomId, roomId));

    const activeParticipants = participants.filter(p => !p.leftAt);

    return NextResponse.json({
      success: true,
      data: {
        ...room[0],
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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { roomId } = params;
    const body = await request.json();

    // Check if user is the host
    const room = await db
      .select()
      .from(craftRooms)
      .where(and(eq(craftRooms.id, roomId), eq(craftRooms.hostId, user.id)))
      .limit(1);

    if (!room.length) {
      return NextResponse.json(
        { success: false, error: "Room not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update room
    const [updatedRoom] = await db
      .update(craftRooms)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(craftRooms.id, roomId))
      .returning();

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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { roomId } = params;

    // Check if user is the host
    const room = await db
      .select()
      .from(craftRooms)
      .where(and(eq(craftRooms.id, roomId), eq(craftRooms.hostId, user.id)))
      .limit(1);

    if (!room.length) {
      return NextResponse.json(
        { success: false, error: "Room not found or unauthorized" },
        { status: 404 }
      );
    }

    // End the room
    const [endedRoom] = await db
      .update(craftRooms)
      .set({
        status: "ended",
        endedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(craftRooms.id, roomId))
      .returning();

    // Mark all participants as left
    await db
      .update(craftRoomParticipants)
      .set({
        leftAt: new Date(),
      })
      .where(
        and(
          eq(craftRoomParticipants.roomId, roomId),
          eq(craftRoomParticipants.leftAt, null)
        )
      );

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
